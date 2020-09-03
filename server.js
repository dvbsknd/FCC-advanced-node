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
  // name: 'advanced-node',
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
          console.log('Log-in failure for \x1b[32m%s\x1b[0m', username);
          return done(null, false);
        };
        return done(null, user);
      }
    );
  });
}));

const ensureAuthenticated = (req, res, next) => {
  console.log('Authenticating with session for \x1b[32m%s\x1b[0m', req.session.passport.user);
  if (req.isAuthenticated()) {
    console.log(`${req.user._id} logged in`);
    next();
  } else {
    console.log(`Not authorised`);
    res.redirect('/');
  }
}

app.use(passport.initialize());
app.use(passport.session());

app.route("/").get((req, res) => {
  const data = {
    title: 'Hello',
    message: 'Please login',
    showLogin: true
  };
  res.render('index', data);
});

app.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('profile');
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/' }), (req, res) => { 
  console.log('Auth successful for \x1b[32m%s\x1b[0m', req.user.username);
  res.redirect('/profile');
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
