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

// Set auth strategy
passport.use(new LocalStrategy((username, password, done) => {
  db.collection('users').findOne(
    { username },
    (err, user) => {
      console.log('Log-in attempt for', username);
      if (err) done(err);
      if (!user) done(null, false);
      if (password !== user.password) done(null, false);
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

module.exports.configure = (app) => {

  // If prod serve secure cookies
  if (app.get('env') === 'production') {
    sessOptions.cookie.secure = true; 
  }
  app.use(session(sessOptions));

  // Initialise Passport
  app.use(passport.initialize());
  app.use(passport.session());

};

module.exports.authenticate = passport.authenticate('local', { failureRedirect: '/' });
