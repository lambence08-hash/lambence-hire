const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  teacher:    { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  school:     { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  schoolName: { type: String },
  rating:     { type: Number, min: 1, max: 5, required: true },
  comment:    { type: String, default: '' },
  subject:    { type: String, default: '' },
  createdAt:  { type: Date, default: Date.now }
});

reviewSchema.index({ teacher: 1, school: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
