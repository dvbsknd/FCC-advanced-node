"use strict";

const express = require("express");
const mongo = require('mongodb').MongoClient;
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const { MongoClient, ObjectID } = require('mongodb');

const app = express();

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', './views/pug'); // Will actually default here anyway
app.set('view engine', 'pug'); // Import/require not required

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
  } else {
    sessOptions.cookie.secure = false;
  };
  next();
}

app.use(secureCookie);
app.use(session(sessOptions));

// User de/serialisation
passport.serializeUser((user, done) => {
  console.log('Serialised', user._id);
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  console.log('Deserialised', id);
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

// Define auth strategy
passport.use(new LocalStrategy((username, password, done) => {
  console.log(`User ${username} attempted to log in.`);
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
          console.log('Log-in failure for \x1b[33m%s\x1b[0m', username);
          return done(null, false);
        };
        return done(null, user);
      }
    );
  });
}));

const registerUser = (req, res, next) => {
  const client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
  client.connect(err => {
    if (err) return console.error(err);
    const db = client.db();
    db.collection('users').findOne(
      { username: req.body.username },
      (err, user) => {
        if (err) { next(err) }
        else if (user) { res.redirect('/'); }
        else {
          db.collection('users').insertOne(
            { username: req.body.username, password: req.body.password },
            (err, doc) => {
              console.log('Adding user \x1b[33m%s\x1b[0m', req.body.username);
              if (err) { res.redirect('/'); }
              else { next(null, user); }
            }
          );
        };
      });
  });
}

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    console.log('\x1b[33m%s\x1b[0m logged in, serving request', req.user._id);
    next();
  } else {
    console.log('Not authorised for \x1b[33m%s\x1b[0m, redirecting', req.path);
    res.redirect('/');
  }
}

app.use(passport.initialize());
app.use(passport.session());

app.route("/").get((req, res) => {
  const data = {
    title: 'Home Page',
    message: 'Please login',
    showLogin: true,
    showRegistration: true
  };
  res.render('index', data);
});

app.route('/profile').get(ensureAuthenticated, (req, res) => {
  const data = {
    username: req.user.username
  };
  res.render('profile', data);
});

app.post('/register',
  registerUser,
  passport.authenticate('local', { failureRedirect: '/' }),
  (req, res) => {
    console.log('Registration successful for \x1b[33m%s\x1b[0m', req.user.username);
    res.redirect('/profile');
  }
);

app.post('/login', passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
  console.log('Auth successful for \x1b[33m%s\x1b[0m', req.user.username);
  res.redirect('/profile');
});

app.route('/logout').get((req, res) => {
  req.logout();
  res.redirect('/');
});

app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
});

mongo.connect(process.env.MONGO_URI, { useUnifiedTopology: true }, (err, client) => {
  const db = client.db();
  if (err) console.error('Database error:', err);
  else {
    // Start listening
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port", process.env.PORT, 'with database', db.databaseName);
    });
  }
});
