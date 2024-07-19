const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/user");
const bcrypt = require("bcryptjs");

module.exports = (passport) => {
  // Local Strategy for authentication
  passport.use(
    new LocalStrategy(
      { usernameField: "username" },
      (username, password, done) => {
        // Match user by username
        User.findOne({ username: username })
          .then((user) => {
            if (!user) {
              return done(null, false, { message: "Incorrect username or password." });
            }

            // Match password
            bcrypt.compare(password, user.password, (err, isMatch) => {
              if (err) throw err;
              if (isMatch) {
                return done(null, user); // Passwords match, return user
              } else {
                return done(null, false, { message: "Incorrect password." }); // Passwords do not match
              }
            });
          })
          .catch((err) => done(err)); // Catch any errors and pass them to the callback
      }
    )
  );

  // Serialize user ID into session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser((id, done) => {
    User.findById(id)
      .then((user) => {
        done(null, user);
      })
      .catch((err) => {
        done(err, null);
      });
  });
};
