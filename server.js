"use strict";

const express = require("express");
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const app = express();

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('views', './views/pug'); // Will actually default here anyway
app.set('view engine', 'pug'); // Import/require not required

app.route("/").get((req, res) => {
  res.render('index');
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});
