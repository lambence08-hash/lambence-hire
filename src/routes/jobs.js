const router = require('express').Router();
const Job = require('../models/Job');
const School = require('../models/School');
const Teacher = require('../models/Teacher');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const { sendMail, newJobAlertTeacher } = require('../utils/mailer');

// Browse all jobs — advanced filters (public)
router.get('/', async (req, res) => {
  try {
    const {
      q,           // keyword search
      subject,
      city,
      state,
      type,        // full-time, part-time, contract, visiting
      level,       // primary, secondary, senior-secondary, undergraduate, postgraduate
      board,       // CBSE, ICSE, State Board, University
      schoolType,  // school, college, coaching
      salaryMin,
      salaryMax,
      experience,
      badge,       // verified, expert (filter by required badge)
      sort = 'newest',
      page = 1
    } = req.query;

    const filter = { isActive: true };

    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { subject: new RegExp(q, 'i') },
        { schoolName: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') }
      ];
    }
    if (subject) filter.subject = new RegExp(subject, 'i');
    if (city) filter.city = new RegExp(city, 'i');
    if (state) filter.state = new RegExp(state, 'i');
    if (type) filter.type = type;
    if (level && level !== 'all') filter.level = level;
    if (board) filter.board = new RegExp(board, 'i');
    if (schoolType) filter.schoolType = schoolType;
    if (salaryMin) filter.salaryMax = { $gte: Number(salaryMin) };
    if (salaryMax) filter.salaryMin = { ...(filter.salaryMin || {}), $lte: Number(salaryMax) };
    if (experience) filter.experience = { $lte: Number(experience) };

    const sortMap = {
      newest:    { isFeatured: -1, createdAt: -1 },
      oldest:    { createdAt: 1 },
      salary:    { salaryMax: -1 },
      popular:   { applicants: -1 }
    };

    const limit = 15;
    const skip = (Number(page) - 1) * limit;
    const total = await Job.countDocuments(filter);
    const jobs  = await Job.find(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(limit);

    // Aggregations for sidebar counts
    const subjectCounts = await Job.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 }
    ]);
    const cityCounts = await Job.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    const typeCounts = await Job.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    res.json({
      jobs, total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      subjectCounts, cityCounts, typeCounts
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get single job (with view tracking)
router.get('/school/mine', auth('school'), async (req, res) => {
  try {
    const jobs = await Job.find({ school: req.user.id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Get school info
    const school = await School.findById(job.school).select('name type city state board phone website isVerified');
    res.json({ job, school });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// School: post a job
router.post('/', auth('school'), async (req, res) => {
  try {
    const school = await School.findById(req.user.id);
    if (!school) return res.status(404).json({ error: 'School not found' });

    if (school.plan === 'free') {
      const count = await Job.countDocuments({ school: school._id, isActive: true });
      if (count >= 3) return res.status(403).json({ error: 'Free plan: max 3 active jobs. Upgrade to post more.' });
    }

    const job = await Job.create({
      ...req.body,
      school:     school._id,
      schoolName: school.name,
      schoolType: school.type,
      board:      req.body.board || school.board,
      city:       req.body.city  || school.city,
      state:      req.body.state || school.state
    });
    res.json(job);

    // Send job alert emails to matching teachers (async, don't await)
    Teacher.find({
      subjects: new RegExp(job.subject, 'i'),
      isAvailable: true,
      isActive: true
    }).select('name email').limit(50).then(teachers => {
      teachers.forEach(t => {
        const tpl = newJobAlertTeacher({ teacherName: t.name, jobs: [job] });
        sendMail({ to: t.email, ...tpl });
      });
    }).catch(() => {});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// School: update job
router.put('/:id', auth('school'), async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, school: req.user.id },
      req.body,
      { new: true }
    );
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// School: close job
router.delete('/:id', auth('school'), async (req, res) => {
  try {
    await Job.findOneAndUpdate({ _id: req.params.id, school: req.user.id }, { isActive: false });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// School: get applicants for a job
router.get('/:id/applicants', auth('school'), async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, school: req.user.id });
    if (!job) return res.status(404).json({ error: 'Not found' });
    const applications = await Application.find({ job: req.params.id })
      .populate('teacher', 'name email phone city subjects experience qualification assessmentBadge assessmentScore role profileSlug avgRating totalReviews resume');
    res.json(applications);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
