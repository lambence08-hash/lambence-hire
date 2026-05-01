require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',         require('./src/routes/auth'));
app.use('/api/jobs',         require('./src/routes/jobs'));
app.use('/api/applications', require('./src/routes/applications'));
app.use('/api/teachers',     require('./src/routes/teachers'));
app.use('/api/assessment',   require('./src/routes/assessment'));
app.use('/api/admin',        require('./src/routes/admin'));
app.use('/api/reviews',      require('./src/routes/reviews'));
app.use('/api/saved',        require('./src/routes/saved'));
app.use('/api/insights',     require('./src/routes/insights'));
app.use('/api/upload',       require('./src/routes/upload'));
app.use('/resumes',          require('express').static(require('path').join(__dirname, 'uploads/resumes')));

app.use(express.static(path.join(__dirname, 'frontend/public')));
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/public/index.html'));
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 3002;
    app.listen(PORT, () => console.log(`Lambence Hire running on http://localhost:${PORT}`));
  })
  .catch(e => console.error('DB error:', e.message));
