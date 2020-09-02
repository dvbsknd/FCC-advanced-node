const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const ObjectID = require('mongodb').ObjectID;

// Sessions
const sessOptions = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {},
}

module.exports.configure = (app, db) => {

  // If prod serve secure cookies
  if (app.get('env') === 'production') {
    sessOptions.cookie.secure = true; 
  }
  app.use(session(sessOptions));

  // Initialise Passport
  app.use(passport.initialize());

  // Set auth strategy
  passport.use(new LocalStrategy((username, password, done) => {
    console.log('Log-in attempt for', username);
    db.collection('users').findOne(
      { username: username },
      (err, user) => {
        if (err) {
          return done(err);
        }
        if (!user) return done(null, false);
        if (password !== user.password) {
          return done(null, false);
        };
        return done(null, user);
      }
    );
  }));

  // User de/serialisation
  passport.serializeUser((user, done) => {
    console.log('Serialising', user);
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    console.log('Deserialising', id);
    db.collection('users').findOne(
      {_id: new ObjectID(id)},
      (err, doc) => {
        done(null, doc);
      }
    );
  });

  app.post('/login', passport.authenticate('local', { failureRedirect: '/?authorised=false' }), (req, res) => {
    console.log(req.user ? `${req.user._id} logged in` : `Login failed: ${req.body}`);
    res.json({ authenticated: true });
  });

};
