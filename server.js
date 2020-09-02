"use strict";

const express = require("express");
const mongo = require('mongodb').MongoClient;
const fccTesting = require("./freeCodeCamp/fcctesting.js");
// const authentication = require("./auth.js");

const app = express();

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', './views/pug'); // Will actually default here anyway
app.set('view engine', 'pug'); // Import/require not required
// app.use(authentication.middleware);

// Temporarily pulling auth into Server.js to pass FCC tests:
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
app.use(secureCookie);
app.use(session(sessOptions));
app.use(passport.initialize());
// End temp.

app.route("/").get((req, res) => {
  const data = {
    title: 'Hello',
    message: 'Please login',
    showLogin: true
  };
  res.render('index', data);
});

app.route("/profile").get((req, res) => {
  res.render('profile');
});

// app.post('/login', authentication.authenticate, (req, res) => {
app.post('/login', passport.authenticate('local', { successRedirect: '/profile', failureRedirect: '/?authorised=false' }), (req, res) => {
  console.log(req.user ? `${req.user._id} logged in` : `Login failed: ${req.body}`);
  res.json({ authenticated: true });
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
