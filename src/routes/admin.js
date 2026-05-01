const router = require('express').Router();
const School = require('../models/School');
const Teacher = require('../models/Teacher');
const Job = require('../models/Job');
const Application = require('../models/Application');
const auth = require('../middleware/auth');

// Dashboard stats
router.get('/stats', auth('admin'), async (req, res) => {
  try {
    const [schools, teachers, jobs, applications] = await Promise.all([
      School.countDocuments(),
      Teacher.countDocuments(),
      Job.countDocuments({ isActive: true }),
      Application.countDocuments()
    ]);
    const verifiedTeachers = await Teacher.countDocuments({ assessmentBadge: { $ne: 'none' } });
    res.json({ schools, teachers, jobs, applications, verifiedTeachers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get all schools
router.get('/schools', auth('admin'), async (req, res) => {
  try {
    const schools = await School.find().sort({ createdAt: -1 }).select('-password');
    res.json(schools);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get all teachers
router.get('/teachers', auth('admin'), async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ createdAt: -1 }).select('-password');
    res.json(teachers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update school plan
router.put('/schools/:id/plan', auth('admin'), async (req, res) => {
  try {
    const { plan, planExpiry } = req.body;
    const school = await School.findByIdAndUpdate(req.params.id, { plan, planExpiry }, { new: true }).select('-password');
    res.json(school);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Verify school
router.put('/schools/:id/verify', auth('admin'), async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true }).select('-password');
    res.json(school);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Feature a job
router.put('/jobs/:id/feature', auth('admin'), async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { isFeatured: req.body.isFeatured }, { new: true });
    res.json(job);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Export teachers data (for selling to EdTech)
router.get('/export/teachers', auth('admin'), async (req, res) => {
  try {
    const { city, subject } = req.query;
    const filter = {};
    if (city) filter.city = new RegExp(city, 'i');
    if (subject) filter.subjects = new RegExp(subject, 'i');
    const teachers = await Teacher.find(filter).select('-password -__v');
    res.json(teachers);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Export schools data (for selling to EdTech/publishers)
router.get('/export/schools', auth('admin'), async (req, res) => {
  try {
    const { city, state, type } = req.query;
    const filter = {};
    if (city) filter.city = new RegExp(city, 'i');
    if (state) filter.state = new RegExp(state, 'i');
    if (type) filter.type = type;
    const schools = await School.find(filter).select('-password -__v');
    res.json(schools);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
