const router = require('express').Router();
const SavedJob = require('../models/SavedJob');
const auth = require('../middleware/auth');

// Save a job
router.post('/:jobId', auth('teacher'), async (req, res) => {
  try {
    const saved = await SavedJob.create({ teacher: req.user.id, job: req.params.jobId });
    res.json(saved);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'Already saved' });
    res.status(500).json({ error: e.message });
  }
});

// Unsave
router.delete('/:jobId', auth('teacher'), async (req, res) => {
  try {
    await SavedJob.findOneAndDelete({ teacher: req.user.id, job: req.params.jobId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get saved jobs
router.get('/', auth('teacher'), async (req, res) => {
  try {
    const saved = await SavedJob.find({ teacher: req.user.id })
      .populate('job', 'title subject schoolName city type salaryMin salaryMax isActive createdAt')
      .sort({ createdAt: -1 });
    res.json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
