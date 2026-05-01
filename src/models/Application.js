const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job:         { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  teacher:     { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  school:      { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },

  coverLetter: { type: String, default: '' },
  status:      { type: String, enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'], default: 'pending' },
  schoolNote:  { type: String, default: '' },

  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', applicationSchema);
