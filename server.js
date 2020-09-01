"use strict";

const express = require("express");
const passport = require('passport');
const session = require('express-session');
const mongo = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const app = express();

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', './views/pug'); // Will actually default here anyway
app.set('view engine', 'pug'); // Import/require not required

// Auth
const sessOptions = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {},
}
if (app.get('env') === 'production') {
  sessOptions.cookie.secure = true; // serve secure cookies
}
app.use(session(sessOptions));
app.use(passport.initialize());
app.use(passport.session());


app.route("/").get((req, res) => {
  const data = {title: 'Hello', message: 'Please login'};
  res.render('index', data);
});

mongo.connect(process.env.MONGO_URI, { useUnifiedTopology: true }, (err, db) => {
  if (err) console.error(`Database error: ${err}`);
  else {

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

    // Start listening
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port", process.env.PORT, 'with database', db.s.options.dbName);
    });

  }
});
