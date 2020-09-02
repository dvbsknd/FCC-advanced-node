"use strict";

const express = require("express");
const mongo = require('mongodb').MongoClient;
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const authentication = require("./auth.js");

const app = express();

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', './views/pug'); // Will actually default here anyway
app.set('view engine', 'pug'); // Import/require not required
app.use(authentication.middleware);

app.route("/").get((req, res) => {
  const data = {
    title: 'Hello',
    message: 'Please login',
    showLogin: true
  };
  res.render('index', data);
});

app.post('/login', authentication.authenticate, (req, res) => {
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
