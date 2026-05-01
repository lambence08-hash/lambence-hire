const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const schoolSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  type:         { type: String, enum: ['school', 'college', 'coaching'], required: true },
  board:        { type: String, default: '' }, // CBSE, ICSE, State, University
  city:         { type: String, default: '' },
  state:        { type: String, default: '' },
  phone:        { type: String, default: '' },
  website:      { type: String, default: '' },
  logo:         { type: String, default: '' },
  contactPerson: { type: String, default: '' },
  description:  { type: String, default: '' },
  plan:         { type: String, enum: ['free', 'basic', 'pro', 'enterprise'], default: 'free' },
  planExpiry:   { type: Date },
  isVerified:   { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
  createdAt:    { type: Date, default: Date.now }
});

schoolSchema.pre('save', async function() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

schoolSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('School', schoolSchema);
