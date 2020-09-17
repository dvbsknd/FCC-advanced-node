"use strict";

const express = require("express");
const routes = require('./routes');
const auth = require('./auth');
const mongo = require('mongodb').MongoClient;
const { MongoClient } = require('mongodb');
const session = require('express-session');
const passport = require('passport');
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

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
    let currentUsers = 0;
    io.on('connection', socket => {
      ++currentUsers;
      console.log('%s users have connected', currentUsers);
      io.emit('user count', currentUsers);
      socket.on('disconnect', () => {
        --currentUsers;
        console.log('A user disconnected, %s remain', currentUsers);
      });
    });
    http.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port", process.env.PORT, 'with database', db.databaseName);
    });
  }
});
