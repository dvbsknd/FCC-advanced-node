const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const { MongoClient, ObjectID } = require('mongodb');

// Sessions
const sessOptions = {
  secret: process.env.SESSION_SECRET,
  name: 'advanced-node',
  resave: true,
  saveUninitialized: true,
  cookie: {},
}
// If prod serve secure cookies
const secureCookie = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    sessOptions.cookie.secure = true; 
  }
  next();
}

// Define auth strategy
passport.use(new LocalStrategy((username, password, done) => {
  console.log('Log-in attempt for', username);
  const client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
  client.connect(err => {
    if (err) return console.error(err);
    const db = client.db();
    db.collection('users').findOne(
      { username: username },
      (err, user) => {
        if (err) {
          return done(err);
        }
        if (!user) return done(null, false);
        if (password !== user.password) {
          console.log('Log-in failure for', username, '(incorrect password)');
          return done(null, false);
        };
        return done(null, user);
      }
    );
  });
}));

// User de/serialisation
passport.serializeUser((user, done) => {
  console.log('Serialising', user);
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  console.log('Deserialising', id);
  const client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
  client.connect(err => {
    if (err) return console.error(err);
    const db = client.db();
    db.collection('users').findOne(
      {_id: new ObjectID(id)},
      (err, doc) => {
        done(null, doc);
      }
    );
  });
});

module.exports.middleware = [
  secureCookie,
  session(sessOptions),
  passport.initialize()
];

module.exports.authenticate = passport.authenticate('local', { successRedirect: '/profile', failureRedirect: '/?authorised=false' });
