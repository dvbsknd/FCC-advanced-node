"use strict";

const express = require("express");
const mongo = require('mongodb').MongoClient;
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const auth = require("./auth.js");
const LocalStrategy = require('passport-local');

const app = express();

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', './views/pug'); // Will actually default here anyway
app.set('view engine', 'pug'); // Import/require not required

app.route("/").get((req, res) => {
  const data = {title: 'Hello', message: 'Please login'};
  res.render('index', data);
});

mongo.connect(process.env.MONGO_URI, { useUnifiedTopology: true }, (err, db) => {
  if (err) console.error('Database error:', err);
  else {

    // Set auth strategy
    const passport = require('passport');
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
    // Implement authentication
    auth(app);

    // Start listening
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port", process.env.PORT, 'with database', db.s.options.dbName);
    });

  }
});
