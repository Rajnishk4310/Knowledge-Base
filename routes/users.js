const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const passport = require("passport");

const User = require("../models/user");

// Route to render the registration form
router.get("/register", (req, res) => {
  res.render("register", {
    title: "Register",
  });
});

// Route to handle registration form submission
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Email is invalid"),
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
    body("password2").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("register", {
        title: "Register",
        errors: errors.array(),
      });
    }

    const { name, email, username, password } = req.body;
    try {
      // Check if user already exists
      let existingUser = await User.findOne({ username: username });
      if (existingUser) {
        req.flash("danger", "Username already exists");
        return res.redirect("/users/register");
      }

      // Hash the password before saving to database
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user instance
      let newUser = new User({
        name,
        email,
        username,
        password: hashedPassword,
      });

      // Save the user to the database
      await newUser.save();

      // Flash message for success and redirect to login page
      req.flash("success", "You are now registered and can log in");
      res.redirect("/users/login");
    } catch (err) {
      console.error(err);
      res.status(500).send("Failed to register user");
    }
  }
);

// Route to render the login form
router.get("/login", (req, res) => {
  res.render("login", {
    title: "Login",
  });
});

// Route to handle login form submission
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/", // Redirect to home page on successful login
    failureRedirect: "/users/login", // Redirect back to login page on failure
    failureFlash: true, // Enable flash messages for error handling
  })
);

// Route to handle user logout
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err); // Pass the error to the next middleware
    }
    req.flash("success", "You are logged out");
    res.redirect("/users/login"); // Redirect to login page after logout
  });
});

module.exports = router;
