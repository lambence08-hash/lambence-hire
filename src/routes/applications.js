const router = require('express').Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const School = require('../models/School');
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');
const { sendMail, applicationReceivedSchool, applicationStatusTeacher } = require('../utils/mailer');

// Teacher: apply to job
router.post('/', auth('teacher'), async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;
    const job = await Job.findById(jobId);
    if (!job || !job.isActive) return res.status(404).json({ error: 'Job not found or closed' });

    const existing = await Application.findOne({ job: jobId, teacher: req.user.id });
    if (existing) return res.status(400).json({ error: 'Already applied to this job' });

    const app = await Application.create({ job: jobId, teacher: req.user.id, school: job.school, coverLetter });
    await Job.findByIdAndUpdate(jobId, { $inc: { applicants: 1 } });

    // Email to school
    const [school, teacher] = await Promise.all([
      School.findById(job.school),
      Teacher.findById(req.user.id)
    ]);
    if (school?.email) {
      const tpl = applicationReceivedSchool({
        schoolName: school.name,
        teacherName: teacher.name,
        jobTitle: job.title,
        subject: (teacher.subjects || []).join(', '),
        experience: teacher.experience,
        badge: teacher.assessmentBadge,
        appId: app._id
      });
      sendMail({ to: school.email, ...tpl });
    }

    res.json(app);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Teacher: my applications
router.get('/mine', auth('teacher'), async (req, res) => {
  try {
    const apps = await Application.find({ teacher: req.user.id })
      .populate('job', 'title subject schoolName city type salaryMin salaryMax isActive')
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// School: update application status
router.put('/:id/status', auth('school'), async (req, res) => {
  try {
    const { status, schoolNote } = req.body;
    const app = await Application.findOneAndUpdate(
      { _id: req.params.id, school: req.user.id },
      { status, schoolNote },
      { new: true }
    ).populate('teacher', 'name email').populate('job', 'title schoolName');

    if (!app) return res.status(404).json({ error: 'Application not found' });

    // Email to teacher
    if (app.teacher?.email) {
      const tpl = applicationStatusTeacher({
        teacherName: app.teacher.name,
        jobTitle: app.job?.title,
        schoolName: app.job?.schoolName,
        status
      });
      sendMail({ to: app.teacher.email, ...tpl });
    }

    res.json(app);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
