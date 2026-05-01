const router = require('express').Router();
const Question = require('../models/Question');
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science', 'Economics', 'Hindi'];
const PASS_SCORE = 60; // 60% to get verified badge

// Get available subjects
router.get('/subjects', (req, res) => {
  res.json(SUBJECTS);
});

// Get test questions (20 questions for selected subject)
router.get('/start/:subject', auth('teacher'), async (req, res) => {
  try {
    const subject = req.params.subject;
    const questions = await Question.aggregate([
      { $match: { subject } },
      { $sample: { size: 20 } },
      { $project: { correct: 0 } } // hide correct answers
    ]);
    if (questions.length < 5) return res.status(404).json({ error: 'Not enough questions for this subject yet' });
    res.json({ questions, subject, total: questions.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Submit assessment
router.post('/submit', auth('teacher'), async (req, res) => {
  try {
    const { subject, answers } = req.body; // answers: { questionId: selectedIndex }
    const teacher = await Teacher.findById(req.user.id);

    // Cooldown: 7 days between attempts
    if (teacher.assessmentDate) {
      const diff = Date.now() - new Date(teacher.assessmentDate).getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      if (days < 7) return res.status(400).json({ error: `Please wait ${Math.ceil(7 - days)} more days before retaking` });
    }

    const questionIds = Object.keys(answers);
    const questions = await Question.find({ _id: { $in: questionIds } });

    let correct = 0;
    questions.forEach(q => {
      if (answers[q._id.toString()] === q.correct) correct++;
    });

    const score = Math.round((correct / questions.length) * 100);
    let badge = 'none';
    if (score >= 80) badge = 'expert';
    else if (score >= PASS_SCORE) badge = 'verified';

    teacher.assessmentScore = score;
    teacher.assessmentBadge = badge;
    teacher.assessmentDate = new Date();
    teacher.assessmentSubject = subject;
    await teacher.save();

    res.json({ score, badge, correct, total: questions.length, passed: score >= PASS_SCORE });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: add questions
router.post('/questions', auth('admin'), async (req, res) => {
  try {
    const questions = Array.isArray(req.body) ? req.body : [req.body];
    const created = await Question.insertMany(questions);
    res.json({ created: created.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
