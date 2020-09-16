"use strict";

const routes = require('./routes');
const auth = require('./auth');
const express = require("express");
const mongo = require('mongodb').MongoClient;
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require('express-session');
const passport = require('passport');
const { MongoClient } = require('mongodb');

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
  name: process.env.NODE_ENV,
  resave: true,
  saveUninitialized: true
}

app.use(session(sessOptions));
app.use(passport.initialize());
app.use(passport.session());

// Simple request logging
app.use((req, res, next) => {
  console.log(
    '%s: %s from %s with cookie: %s',
    req.method,
    req.path,
    req.headers['user-agent']
      .match(/Chrome|Firefox|Postman/g)[0],
    req.headers.cookie ? req.headers.cookie.slice(0, 30).concat('...') : 'Not set.');
  next();
});

// Establish a DB connection to wrap all else
const client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
client.connect(err => {
  if (err) return console.error('Database connection error:', err);
  else {
    // mongo.connect is deprecated
    const db = client.db();
    routes(app, db);
    auth(app, db);
    // Start listening
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port", process.env.PORT, 'with database', db.databaseName);
    });
  }
});
