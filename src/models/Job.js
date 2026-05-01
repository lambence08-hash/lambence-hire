const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  school:       { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  schoolName:   { type: String, required: true },
  schoolType:   { type: String },
  city:         { type: String, default: '' },
  state:        { type: String, default: '' },

  board:        { type: String, default: '' }, // CBSE, ICSE, State Board, University
  title:        { type: String, required: true },
  subject:      { type: String, required: true },
  type:         { type: String, enum: ['full-time', 'part-time', 'contract', 'visiting'], default: 'full-time' },
  level:        { type: String, enum: ['primary', 'secondary', 'senior-secondary', 'undergraduate', 'postgraduate', 'all'], default: 'all' },
  description:  { type: String, default: '' },
  requirements: { type: String, default: '' },

  salaryMin:    { type: Number, default: 0 },
  salaryMax:    { type: Number, default: 0 },
  experience:   { type: Number, default: 0 }, // min years required

  deadline:     { type: Date },
  isActive:     { type: Boolean, default: true },
  isFeatured:   { type: Boolean, default: false },

  applicants:   { type: Number, default: 0 },
  views:        { type: Number, default: 0 },
  createdAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);
