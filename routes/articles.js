const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");

let Article = require("../models/article");
let User = require("../models/user");

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  // Check if the user is authenticated
  if (req.isAuthenticated()) {
    return next(); // User is authenticated, proceed to the next middleware/route
  } else {
    // User is not authenticated, redirect to login page
    req.flash('danger', 'Please login');
    res.redirect('/users/login');
  }
}

// Route to display the form for adding a new article
router.get("/add", ensureAuthenticated, (req, res) => {
  res.render("add_article", {
    title: "Add Article",
  });
});

// Route to handle the form submission for adding a new article
router.post(
  "/add",
  ensureAuthenticated,
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("body").notEmpty().withMessage("Body is required"),
  ],
  async (req, res) => {
    // Validate input fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If validation fails, render the form with errors
      return res.status(400).render("add_article", {
        title: "Add Article",
        errors: errors.array(),
      });
    }

    // Create a new article object
    let article = new Article({
      title: req.body.title,
      author: req.user._id,
      body: req.body.body,
    });

    try {
      // Save the article to the database
      await article.save();
      req.flash("success", "Article added successfully");
      res.redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).send("Failed to save article");
    }
  }
);

// Route to display a specific article by its ID
router.get("/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).send("Article not found");
    }

    // Check if the author ID is valid
    if (!mongoose.Types.ObjectId.isValid(article.author)) {
      return res.status(400).send("Invalid author ID");
    }

    const authorId = new mongoose.Types.ObjectId(article.author);
    const user = await User.findById(authorId);
    if (!user) {
      return res.status(404).send("Author not found");
    }

    res.render("article", {
      article: article,
      author: user.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// Route to display the form for editing an existing article
router.get('/edit/:id', ensureAuthenticated, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      req.flash('danger', 'Article not found');
      return res.redirect('/');
    }

    // Check if the current user is the author of the article
    if (article.author.toString() !== req.user._id.toString()) {
      req.flash('danger', 'Not Authorized');
      return res.redirect('/');
    }

    res.render('edit_article', {
      title: 'Edit Article',
      article: article
    });
  } catch (err) {
    console.error(err);
    req.flash('danger', 'Error loading article');
    res.redirect('/');
  }
});

// Route to handle form submission for updating an existing article
router.post('/edit/:id', ensureAuthenticated, async (req, res) => {
  let article = {
    title: req.body.title,
    author: req.user._id,
    body: req.body.body
  };

  let query = { _id: req.params.id };

  try {
    const existingArticle = await Article.findById(req.params.id);
    if (!existingArticle) {
      req.flash('danger', 'Article not found');
      return res.redirect('/');
    }

    // Check if the current user is the author of the article
    if (existingArticle.author.toString() !== req.user._id.toString()) {
      req.flash('danger', 'Not Authorized');
      return res.redirect('/');
    }

    // Update the article in the database
    await Article.updateOne(query, article);
    req.flash('success', 'Article Updated');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('danger', 'Error updating article');
    res.redirect('/');
  }
});

// Route to handle deletion of an article
router.delete("/:id", ensureAuthenticated, async (req, res) => {
  if (!req.user._id) {
    return res.status(500).send();
  }

  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).send("Article not found");
    }

    // Check if the current user is the author of the article
    if (article.author.toString() !== req.user._id.toString()) {
      return res.status(403).send("Unauthorized");
    }

    // Delete the article from the database
    await Article.findByIdAndDelete(req.params.id);
    res.send("Success");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete article");
  }
});

module.exports = router;
