const router = require('express').Router();
const jwt = require('jsonwebtoken');
const School = require('../models/School');
const Teacher = require('../models/Teacher');

function sign(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// School register
router.post('/school/register', async (req, res) => {
  try {
    const { name, email, password, type, city, state, phone, board, contactPerson } = req.body;
    if (await School.findOne({ email })) return res.status(400).json({ error: 'Email already registered' });
    const school = await School.create({ name, email, password, type, city, state, phone, board, contactPerson });
    const token = sign({ id: school._id, role: 'school', name: school.name });
    res.json({ token, school: { id: school._id, name: school.name, email: school.email, type: school.type, plan: school.plan } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// School login
router.post('/school/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const school = await School.findOne({ email });
    if (!school || !(await school.comparePassword(password))) return res.status(401).json({ error: 'Invalid credentials' });
    const token = sign({ id: school._id, role: 'school', name: school.name });
    res.json({ token, school: { id: school._id, name: school.name, email: school.email, type: school.type, plan: school.plan } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Teacher register
router.post('/teacher/register', async (req, res) => {
  try {
    const { name, email, password, phone, city, state, subjects, experience, qualification, role } = req.body;
    if (await Teacher.findOne({ email })) return res.status(400).json({ error: 'Email already registered' });
    const teacher = await Teacher.create({ name, email, password, phone, city, state, subjects, experience, qualification, role });
    const token = sign({ id: teacher._id, role: 'teacher', name: teacher.name });
    res.json({ token, teacher: { id: teacher._id, name: teacher.name, email: teacher.email, assessmentBadge: teacher.assessmentBadge } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Teacher login
router.post('/teacher/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const teacher = await Teacher.findOne({ email });
    if (!teacher || !(await teacher.comparePassword(password))) return res.status(401).json({ error: 'Invalid credentials' });
    const token = sign({ id: teacher._id, role: 'teacher', name: teacher.name });
    res.json({ token, teacher: { id: teacher._id, name: teacher.name, email: teacher.email, assessmentBadge: teacher.assessmentBadge } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin login
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    const token = sign({ id: 'admin', role: 'admin', name: 'Admin' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid admin credentials' });
});

module.exports = router;
