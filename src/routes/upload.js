const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/resumes')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, req.user.id + '_resume' + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, DOC, DOCX allowed'));
  }
});

// Upload resume
router.post('/resume', auth('teacher'), upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const resumeUrl = '/resumes/' + req.file.filename;
    await Teacher.findByIdAndUpdate(req.user.id, { resume: resumeUrl });
    res.json({ url: resumeUrl, filename: req.file.filename });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete resume
router.delete('/resume', auth('teacher'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id);
    if (teacher.resume) {
      const filePath = path.join(__dirname, '../../uploads', teacher.resume.replace('/resumes', 'resumes'));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await Teacher.findByIdAndUpdate(req.user.id, { resume: '' });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
