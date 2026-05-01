const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  email:          { type: String, required: true, unique: true },
  password:       { type: String, required: true },
  phone:          { type: String, default: '' },
  city:           { type: String, default: '' },
  state:          { type: String, default: '' },
  photo:          { type: String, default: '' },

  // Professional
  role:           { type: String, enum: ['teacher', 'professor', 'instructor', 'tutor'], default: 'teacher' },
  subjects:       { type: [String], default: [] },
  experience:     { type: Number, default: 0 }, // years
  currentSchool:  { type: String, default: '' },
  expectedSalary: { type: Number, default: 0 },
  qualification:  { type: String, default: '' }, // B.Ed, M.Ed, PhD etc
  bio:            { type: String, default: '' },
  resume:         { type: String, default: '' }, // file path

  // Assessment
  assessmentScore:   { type: Number, default: 0 },
  assessmentBadge:   { type: String, enum: ['none', 'verified', 'expert'], default: 'none' },
  assessmentDate:    { type: Date },
  assessmentSubject: { type: String, default: '' },

  // Stats & Virality
  profileViews:     { type: Number, default: 0 },
  weeklyViews:      { type: Number, default: 0 },
  avgRating:        { type: Number, default: 0 },
  totalReviews:     { type: Number, default: 0 },
  profileSlug:      { type: String, unique: true, sparse: true },

  // Status
  isAvailable:  { type: Boolean, default: true },
  isActive:     { type: Boolean, default: true },
  createdAt:    { type: Date, default: Date.now }
});

teacherSchema.pre('save', async function() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  if (!this.profileSlug && this.name) {
    const base = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    this.profileSlug = base + '-' + Math.random().toString(36).substring(2, 7);
  }
});

teacherSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Teacher', teacherSchema);
