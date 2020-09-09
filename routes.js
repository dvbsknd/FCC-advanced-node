const passport = require('passport');
const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);

module.exports = (app, db) => {

  app.route("/").get((req, res) => {
    const data = {
      title: 'Home Page',
      message: 'Please login',
      showLogin: true,
      showRegistration: true
    };
    res.render('index', data);
  });

  app.route('/register').post(
    (req, res, next) => {
      console.log('Registration attempt for user \x1b[33m%s\x1b[0m', req.body.username);
      db.collection('users').findOne(
        { username: req.body.username },
        (err, user) => {
          if (err) { next(err) }
          else if (user) {
            console.log('User \x1b[33m%s\x1b[0m already exists', req.body.username);
            res.redirect('/');
          }
          else {
            const password = bcrypt.hashSync(req.body.password, salt);
            db.collection('users').insertOne(
              { username: req.body.username, password },
              (err, doc) => {
                console.log('Adding user \x1b[33m%s\x1b[0m', req.body.username);
                if (err) { res.redirect('/'); }
                else { next(null, user); }
              }
            );
          };
        });
    },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res) => {
      console.log('Registration complete for \x1b[33m%s\x1b[0m', req.user.username);
      res.redirect('/profile');
    }
  );

  app.post('/login', passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  });

  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      console.log('\x1b[33m%s\x1b[0m logged in, serving request', req.user._id);
      next();
    } else {
      console.log('Not authorised for \x1b[33m%s\x1b[0m, redirecting.', req.path);
      res.redirect('/');
    }
  }

  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    const data = {
      username: req.user.username
    };
    res.render('profile', data);
  });

  app.route('/logout').get((req, res) => {
    req.logout();
    res.redirect('/');
  });

  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
  });


}
