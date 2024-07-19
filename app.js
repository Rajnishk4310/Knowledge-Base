const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const { body, validationResult } = require("express-validator");
const config = require("./config/database");
const passport = require("passport");

let Article = require("./models/article");

const app = express();

// Connect to MongoDB
mongoose.connect(config.database);
const db = mongoose.connection;

// MongoDB connection event handling
db.once("open", () => {
  console.log("Connected to MongoDB");
});

db.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

// Middleware to parse JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Express session middleware
app.use(
  session({
    secret: "keyboard cat", // Secret key for signing the session ID cookie
    resave: false, // Do not save the session if it was not modified
    saveUninitialized: true, // Save a new session if it is uninitialized
  })
);

// Connect-flash middleware for flash messages
app.use(flash());

// Global variables for flash messages
app.use((req, res, next) => {
  res.locals.messages = req.flash() || {}; // Set flash messages to local variables
  next();
});

// Set views directory and view engine (Pug in this case)
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Passport Config
require("./config/passport")(passport); // Configure Passport
// Passport Middleware
app.use(passport.initialize()); // Initialize Passport
app.use(passport.session()); // Restore session data

// Middleware to set the user variable globally for all routes
app.get("*", (req, res, next) => {
  res.locals.user = req.user || null; // Set user variable to local variables for views
  next();
});

// Route for the home page to display all articles
app.get("/", async (req, res) => {
  try {
    const articles = await Article.find({}).populate('author', 'name'); // Fetch all articles with author populated
    res.render("index", {
      title: "Articles",
      articles: articles
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// Routes Files
let articles = require("./routes/articles");
app.use("/articles", articles); // Mount articles routes

// Users Files
let users = require("./routes/users");
app.use("/users", users); // Mount user routes

// Middleware for handling errors
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack
  res.status(500).send("Something broke!"); // Send a 500 error response
});

// Start the server
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
