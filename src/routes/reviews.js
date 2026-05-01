const router = require('express').Router();
const Review = require('../models/Review');
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');

// School: post review for a teacher they hired
router.post('/', auth('school'), async (req, res) => {
  try {
    const { teacherId, rating, comment, subject } = req.body;
    const existing = await Review.findOne({ teacher: teacherId, school: req.user.id });
    if (existing) return res.status(400).json({ error: 'Already reviewed this teacher' });

    const review = await Review.create({
      teacher: teacherId,
      school: req.user.id,
      schoolName: req.user.name,
      rating, comment, subject
    });

    // Update teacher avg rating
    const all = await Review.find({ teacher: teacherId });
    const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
    await Teacher.findByIdAndUpdate(teacherId, { avgRating: Math.round(avg * 10) / 10, totalReviews: all.length });

    res.json(review);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get teacher reviews (public)
router.get('/:teacherId', async (req, res) => {
  try {
    const reviews = await Review.find({ teacher: req.params.teacherId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
