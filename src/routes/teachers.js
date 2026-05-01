const router = require('express').Router();
const Teacher = require('../models/Teacher');
const Review = require('../models/Review');
const auth = require('../middleware/auth');

// Teacher: get own profile
router.get('/me/profile', auth('teacher'), async (req, res) => {
  try {
    let teacher = await Teacher.findById(req.user.id).select('-password');
    // Auto-generate slug for older accounts
    if (!teacher.profileSlug) {
      const base = teacher.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      teacher.profileSlug = base + '-' + Math.random().toString(36).substring(2, 7);
      await teacher.save();
    }
    res.json(teacher);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Teacher: update profile
router.put('/me/profile', auth('teacher'), async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'city', 'state', 'subjects', 'experience', 'currentSchool', 'expectedSalary', 'qualification', 'bio', 'isAvailable', 'role'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const teacher = await Teacher.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json(teacher);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Public profile by slug (shareable link)
router.get('/slug/:slug', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ profileSlug: req.params.slug }).select('-password -email -phone');
    if (!teacher) return res.status(404).json({ error: 'Profile not found' });
    await Teacher.findByIdAndUpdate(teacher._id, { $inc: { profileViews: 1, weeklyViews: 1 } });
    const reviews = await Review.find({ teacher: teacher._id }).sort({ createdAt: -1 }).limit(5);
    res.json({ teacher, reviews });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Browse teachers (for schools — tracks profile views)
router.get('/', auth('school'), async (req, res) => {
  try {
    const { subject, city, experience, badge, page = 1 } = req.query;
    const filter = { isActive: true };
    if (subject) filter.subjects = new RegExp(subject, 'i');
    if (city) filter.city = new RegExp(city, 'i');
    if (experience) filter.experience = { $gte: Number(experience) };
    if (badge && badge !== 'none') filter.assessmentBadge = badge;

    const limit = 12;
    const skip = (page - 1) * limit;
    const total = await Teacher.countDocuments(filter);
    const teachers = await Teacher.find(filter)
      .select('-password')
      .sort({ assessmentBadge: -1, assessmentScore: -1, avgRating: -1, createdAt: -1 })
      .skip(skip).limit(limit);

    // Increment weekly views for returned teachers
    const ids = teachers.map(t => t._id);
    await Teacher.updateMany({ _id: { $in: ids } }, { $inc: { weeklyViews: 1 } });

    res.json({ teachers, total, pages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get teacher by ID (public, with view tracking)
router.get('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).select('-password');
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    await Teacher.findByIdAndUpdate(req.params.id, { $inc: { profileViews: 1 } });
    const reviews = await Review.find({ teacher: req.params.id }).sort({ createdAt: -1 });
    res.json({ teacher, reviews });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
