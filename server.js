"use strict";

const express = require("express");
const routes = require('./routes');
const auth = require('./auth');
const mongo = require('mongodb').MongoClient;
const { MongoClient } = require('mongodb');
const session = require('express-session');
const SessionStore = require('connect-mongo')(session);
const sessionStore = new SessionStore({ url: process.env.MONGO_URI });
const passport = require('passport');
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');
const fccTesting = require("./freeCodeCamp/fcctesting.js");

// Set up socket.io
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
  store: sessionStore,
  secret: process.env.SESSION_SECRET,
  name: 'FCC-advanced-node-' + process.env.NODE_ENV,
  resave: true,
  saveUninitialized: true
}

app.use(session(sessOptions));
app.use(passport.initialize());
app.use(passport.session());

// Handle success/failure for socket auth
const onAuthorizeSuccess = (data, accept) => {
  console.log('Socket connection succeeded');
  accept(null, true);
}
const onAuthorizeFail = (data, message, error, accept) => {
  if (error) throw new Error(message);
  console.log('Socket connection failed');
  accept(null, false);
}

// Get the user from the cookie for socket connection
io.use(
  passportSocketIo.authorize({
    cookieParser,
    key: sessOptions.name,
    secret: sessOptions.secret,
    store: sessionStore,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
);

// Simple request logging
app.use((req, res, next) => {
  console.log(
    '%s: %s from %s with cookie: %s',
    req.method,
    req.path,
    req.headers['user-agent']
      .match(/Chrome|Firefox|Postman/g)[0],
    req.headers.cookie
      ? req.headers.cookie.match(/FCC-advanced-node.+\s?/)
        ? req.headers.cookie.match(/FCC-advanced-node.+\s?/)[0].slice(0, 40).concat('...')
        : 'Not set.'
      : 'Not set.' );
  next();
});

// Establish a DB connection to wrap all else
const client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });
client.connect(err => {
  if (err) return console.error('Database connection error:', err);
  else {

    // Get the database and apply routes and auth to the app
    // For FCC: mongo.connect is deprecated
    const db = client.db();
    routes(app, db);
    auth(app, db);

    // Start listening for socket connections
    let currentUsers = 0;
    io.on('connection', socket => {
      console.log('\x1b[33m%s\x1b[0m connected via socket', socket.request.user.name);
      ++currentUsers;
      console.log('%s users have connected', currentUsers);
      io.emit('user', {
        name: socket.request.user.name,
        currentUsers,
        connected: true
      });

      // Handle disconnections
      socket.on('disconnect', () => {
        --currentUsers;
        console.log('A user disconnected, %s remain', currentUsers);
        io.emit('user', {
          name: socket.request.user.name,
          currentUsers,
          connected: false
        });
      });

      // Handle incoming chats
      socket.on('chat message', message => io.emit('chat message', { name: socket.request.user.name, content: message }));

    });

    // Start listening for HTTP connections
    http.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port", process.env.PORT, 'with database', db.databaseName);
    });

  }
});
