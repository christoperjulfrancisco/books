const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  available: { type: Boolean, default: true },
  borrower: { type: String, trim: true },
  borrowedAt: Date
}, { timestamps: true, strict: true });

module.exports = mongoose.model('Book', bookSchema);
