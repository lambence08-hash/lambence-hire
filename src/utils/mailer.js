const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendMail({ to, subject, html }) {
  if (!process.env.SMTP_PASS || process.env.SMTP_PASS === 'your_gmail_app_password_here') {
    console.log(`[EMAIL SKIPPED] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
    console.log(`[EMAIL SENT] To: ${to}`);
  } catch (e) {
    console.error('[EMAIL ERROR]', e.message);
  }
}

// Templates
function applicationReceivedSchool({ schoolName, teacherName, jobTitle, subject, experience, badge, appId }) {
  return {
    subject: `New Application — ${jobTitle} | Lambence Hire`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1a56db;padding:24px;border-radius:10px 10px 0 0">
        <h2 style="color:white;margin:0">LambenceHire</h2>
      </div>
      <div style="padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px">
        <p style="color:#374151">Hi <strong>${schoolName}</strong>,</p>
        <p style="color:#374151">A new application has been received for <strong>${jobTitle}</strong>.</p>
        <div style="background:#eff6ff;border-radius:10px;padding:20px;margin:20px 0">
          <p style="margin:0 0 8px"><strong>Teacher:</strong> ${teacherName}</p>
          <p style="margin:0 0 8px"><strong>Subject:</strong> ${subject}</p>
          <p style="margin:0 0 8px"><strong>Experience:</strong> ${experience} years</p>
          <p style="margin:0"><strong>Badge:</strong> ${badge === 'none' ? 'Not assessed' : badge.toUpperCase()}</p>
        </div>
        <a href="${process.env.CLIENT_URL}/school-dashboard.html" style="background:#1a56db;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">View Application →</a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">Lambence Hire — India's Teacher Hiring Platform</p>
      </div>
    </div>`
  };
}

function applicationStatusTeacher({ teacherName, jobTitle, schoolName, status }) {
  const colors = { shortlisted: '#16a34a', rejected: '#dc2626', hired: '#7c3aed', reviewed: '#2563eb' };
  const color = colors[status] || '#374151';
  const messages = {
    shortlisted: 'Congratulations! You have been shortlisted.',
    hired: '🎉 You have been hired! Please contact the school.',
    rejected: 'Thank you for applying. The school has moved forward with other candidates.',
    reviewed: 'Your application has been reviewed by the school.'
  };
  return {
    subject: `Application Update — ${jobTitle} | Lambence Hire`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1a56db;padding:24px;border-radius:10px 10px 0 0">
        <h2 style="color:white;margin:0">LambenceHire</h2>
      </div>
      <div style="padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px">
        <p>Hi <strong>${teacherName}</strong>,</p>
        <div style="border-left:4px solid ${color};padding:16px 20px;background:#f9fafb;border-radius:0 10px 10px 0;margin:20px 0">
          <p style="margin:0 0 6px;font-weight:bold;color:${color};text-transform:uppercase;font-size:14px">${status}</p>
          <p style="margin:0;color:#374151">${messages[status] || 'Your application status has been updated.'}</p>
        </div>
        <p><strong>Job:</strong> ${jobTitle}<br><strong>School:</strong> ${schoolName}</p>
        <a href="${process.env.CLIENT_URL}/teacher-dashboard.html" style="background:#1a56db;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">View My Applications →</a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">Lambence Hire — India's Teacher Hiring Platform</p>
      </div>
    </div>`
  };
}

function newJobAlertTeacher({ teacherName, jobs }) {
  return {
    subject: `New Teaching Jobs Matching Your Profile | Lambence Hire`,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1a56db;padding:24px;border-radius:10px 10px 0 0">
        <h2 style="color:white;margin:0">LambenceHire</h2>
      </div>
      <div style="padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px">
        <p>Hi <strong>${teacherName}</strong>,</p>
        <p>New jobs matching your profile are available:</p>
        ${jobs.map(j => `
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:16px;margin-bottom:12px">
          <p style="font-weight:bold;margin:0 0 4px">${j.title}</p>
          <p style="color:#1a56db;margin:0 0 4px">${j.schoolName} • ${j.city}</p>
          <p style="color:#16a34a;font-weight:bold;margin:0">${j.salaryMin ? '₹' + j.salaryMin.toLocaleString() + ' – ₹' + j.salaryMax.toLocaleString() + '/mo' : 'Salary not disclosed'}</p>
        </div>`).join('')}
        <a href="${process.env.CLIENT_URL}/jobs.html" style="background:#1a56db;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Browse All Jobs →</a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">Lambence Hire | <a href="${process.env.CLIENT_URL}/unsubscribe" style="color:#9ca3af">Unsubscribe</a></p>
      </div>
    </div>`
  };
}

module.exports = { sendMail, applicationReceivedSchool, applicationStatusTeacher, newJobAlertTeacher };
