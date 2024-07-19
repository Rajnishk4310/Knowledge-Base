const mongoose = require("mongoose");

// Article Schema
const articleSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to User model
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
});

const Article = mongoose.model("Article", articleSchema);

module.exports = Article;
