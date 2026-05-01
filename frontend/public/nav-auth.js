// Runs on every public page — shows logged-in teacher in navbar
(function () {
  const token = localStorage.getItem('teacherToken');
  const tData = JSON.parse(localStorage.getItem('teacherData') || '{}');
  if (!token || !tData.name) return;

  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;

  const initials = tData.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  navLinks.innerHTML = `
    <a href="jobs.html">Browse Jobs</a>
    <a href="salary-insights.html">Salary Insights</a>
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:36px;height:36px;border-radius:50%;background:var(--blue);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0">${initials}</div>
      <div style="line-height:1.3">
        <div style="font-weight:700;font-size:0.88rem;color:var(--text)">${tData.name}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">Teacher</div>
      </div>
      <a href="teacher-dashboard.html" class="btn-outline" style="padding:7px 14px;font-size:0.85rem">Dashboard</a>
      <button id="navLogoutBtn" style="background:#fee2e2;color:#dc2626;border:none;padding:7px 14px;border-radius:8px;font-weight:600;cursor:pointer;font-size:0.85rem">Logout</button>
    </div>
  `;

  document.getElementById('navLogoutBtn').addEventListener('click', () => {
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherData');
    localStorage.removeItem('savedJobIds');
    window.location.reload();
  });

  // Also update mobile nav drawer if present
  const drawer = document.getElementById('mobileNavDrawer');
  if (drawer) {
    // Replace login/register links at bottom of drawer with user info + logout
    const existing = drawer.querySelectorAll('a.btn-primary, a.btn-outline');
    existing.forEach(el => el.remove());

    const userBlock = document.createElement('div');
    userBlock.style.cssText = 'padding:16px 20px;border-top:2px solid var(--blue-light);margin-top:8px';
    userBlock.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <div style="width:40px;height:40px;border-radius:50%;background:var(--blue);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.95rem">${initials}</div>
        <div>
          <div style="font-weight:700;font-size:0.95rem">${tData.name}</div>
          <div style="font-size:0.78rem;color:var(--text-muted)">${tData.email || 'Teacher Account'}</div>
        </div>
      </div>
      <a href="teacher-dashboard.html" class="btn-primary" style="display:block;text-align:center;margin-bottom:8px">My Dashboard</a>
      <button id="mobileLogoutBtn" style="width:100%;background:#fee2e2;color:#dc2626;border:none;padding:10px;border-radius:8px;font-weight:600;cursor:pointer">Logout</button>
    `;
    drawer.appendChild(userBlock);

    document.getElementById('mobileLogoutBtn').addEventListener('click', () => {
      localStorage.removeItem('teacherToken');
      localStorage.removeItem('teacherData');
      localStorage.removeItem('savedJobIds');
      window.location.reload();
    });
  }
})();
