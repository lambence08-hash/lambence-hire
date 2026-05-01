const router = require('express').Router();
const Job = require('../models/Job');
const Teacher = require('../models/Teacher');
const Application = require('../models/Application');

// Salary insights by subject + city
router.get('/salary', async (req, res) => {
  try {
    const { subject, city } = req.query;
    const filter = { isActive: true, salaryMin: { $gt: 0 } };
    if (subject) filter.subject = new RegExp(subject, 'i');
    if (city) filter.city = new RegExp(city, 'i');

    const jobs = await Job.find(filter).select('subject city salaryMin salaryMax');
    if (!jobs.length) return res.json({ avg: 0, min: 0, max: 0, count: 0 });

    const salaries = jobs.map(j => (j.salaryMin + j.salaryMax) / 2);
    const avg = Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length);
    const min = Math.min(...jobs.map(j => j.salaryMin));
    const max = Math.max(...jobs.map(j => j.salaryMax));

    res.json({ avg, min, max, count: jobs.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Trending subjects (most jobs)
router.get('/trending', async (req, res) => {
  try {
    const data = await Job.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$subject', count: { $sum: 1 }, avgSalary: { $avg: { $divide: [{ $add: ['$salaryMin', '$salaryMax'] }, 2] } } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Top cities by job count
router.get('/cities', async (req, res) => {
  try {
    const data = await Job.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$city', jobs: { $sum: 1 } } },
      { $sort: { jobs: -1 } },
      { $limit: 10 }
    ]);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// School analytics — job performance
router.get('/school/:schoolId', async (req, res) => {
  try {
    const jobs = await Job.find({ school: req.params.schoolId });
    const totalViews = jobs.reduce((s, j) => s + (j.views || 0), 0);
    const totalApps = jobs.reduce((s, j) => s + (j.applicants || 0), 0);
    const topJob = jobs.sort((a, b) => (b.applicants || 0) - (a.applicants || 0))[0];
    res.json({ totalViews, totalApps, totalJobs: jobs.length, topJob });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
