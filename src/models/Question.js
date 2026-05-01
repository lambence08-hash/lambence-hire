const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  subject:    { type: String, required: true },
  level:      { type: String, enum: ['basic', 'intermediate', 'advanced'], default: 'basic' },
  question:   { type: String, required: true },
  options:    { type: [String], required: true }, // 4 options
  correct:    { type: Number, required: true },   // index 0-3
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);
