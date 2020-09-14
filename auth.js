const passport = require('passport');
const LocalStrategy = require('passport-local');
const GitHubStrategy = require('passport-github').Strategy;
const bcrypt = require('bcrypt');
const { ObjectID } = require('mongodb');

module.exports = (app, db) => {

  // User de/serialisation
  passport.serializeUser((user, done) => {
    console.log('Serialised \x1b[33m%s\x1b[0m', user._id);
    done(null, user._id);
  });

  passport.deserializeUser((id, done) => {
    console.log('Deserialised \x1b[33m%s\x1b[0m', id);
    db.collection('users').findOne(
      {_id: new ObjectID(id)},
      (err, doc) => {
        done(null, doc);
      }
    );
  });

  // Define local auth strategy
  passport.use(new LocalStrategy((username, password, done) => {
    console.log('User \x1b[33m%s\x1b[0m attempted to log in', username);
    db.collection('users').findOne(
      { username: username },
      (err, user) => {
        if (err) return done(err);
        if (!user) {
          console.log('User \x1b[33m%s\x1b[0m not registered', username);
          return done(null, false);
        }
        if (!bcrypt.compareSync(password, user.password)) {
          console.log('Log-in failure for \x1b[33m%s\x1b[0m (password error)', username);
          return done(null, false);
        };
        console.log('Log-in succeeded for \x1b[33m%s\x1b[0m', username);
        return done(null, user);
      });
  }));

  // Define GitHub auth strategy
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_REDIRECT_URI
    },
    (accessToken, refreshToken, profile, callback) => {
      console.log('User \x1b[33m%s\x1b[0m authenticated by Github', profile.username);
      // We need to load the user's database object if it exists,
      // or create one if it doesn't, and populate the fields from
      // the profile, then return the user's object.
      db.collection('users').findOneAndUpdate(
        { id: profile.id },
        {
          $setOnInsert: {
            id: profile.id,
            name: profile.displayName || null,
            photo: profile.photos[0].value || '',
            email: Array.isArray(profile.emails) ? profile.emails[0].value : 'No public email',
            created_on: new Date(),
            provider: profile.provider || ''
          },
          $set: { last_login: new Date() },
          $inc: { login_count: 1 }
        },
        { upsert: true, returnOriginal: false },
        (err, user) => {
          return callback(null, user.value);
        }
      );
    }));

}
