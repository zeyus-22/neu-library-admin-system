/* ══════════════════════════════════════════════════
   NEU Library Visitor Log — App Logic (Supabase)
══════════════════════════════════════════════════ */

'use strict';

let collegeChart = null; // Chart.js instance

// ══════════════════════════════════════════════════
// ── CONFIG ───────────────────────────────────────
// ══════════════════════════════════════════════════

const CONFIG = {
  supabaseUrl: 'https://ydozugjlltfzcukykwec.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkb3p1Z2psbHRmemN1a3lrd2VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzE1MDcsImV4cCI6MjA4ODEwNzUwN30.-24nkr7dy8evVEdXnX6aWkNT7ozK1GdCALfCUXl5WYQ',
  adminCredentials: { email: 'jcesperanza@neu.edu.ph', password: 'admin123' },
  validDomains: ['neu.edu.ph', 'gmail.com'],
  colleges: ['CAS', 'CBA', 'CCJE', 'CEA', 'CED', 'CHST', 'CITE', 'CLA', 'CN', 'COT'],
  programs: [
    'BSCS', 'BSMATH', 'BSPSYCH', 'ABCOMM',
    'BSBA', 'BSACCT', 'BSHRM', 'BSTM',
    'BSCRIM',
    'BSARCH', 'BSCE', 'BSECE', 'BSEE', 'BSIE', 'BSME',
    'BEED', 'BSED', 'BSPECED',
    'BSMT', 'BSND', 'BSPH', 'BSRT',
    'BSIT', 'BSCS', 'BSIS', 'BSEMB',
    'ABELS', 'ABPOLSCI', 'ABSOC',
    'BSN',
    'BTVTED', 'BSFT',
  ],
  welcomeTimeout: 5000,
};

// ══════════════════════════════════════════════════
// ── SUPABASE CLIENT ──────────────────────────────
// ══════════════════════════════════════════════════

const _sb = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

// ══════════════════════════════════════════════════
// ── DB (Supabase) ────────────────────────────────
// ══════════════════════════════════════════════════

const DB = {

  async findUser(identifier) {
    const id = identifier.trim().toLowerCase();
    const { data, error } = await _sb
      .from('library_users')
      .select('*')
      .or(`email.eq.${id},rfid.eq.${id}`)
      .maybeSingle();
    if (error) { console.error('findUser:', error); return null; }
    return data;
  },

  async createUser(data) {
    const payload = {
      name: data.name || extractNameFromEmail(data.email),
      email: data.email || null,
      rfid: data.rfid || null,
      college: data.college || randomCollege(),
      blocked: false,
    };
    const { data: user, error } = await _sb
      .from('library_users')
      .insert([payload])
      .select()
      .single();
    if (error) { console.error('createUser:', error); return null; }
    return user;
  },

  async toggleBlock(userId) {
    const { data: current, error: fetchErr } = await _sb
      .from('library_users')
      .select('blocked')
      .eq('id', userId)
      .single();
    if (fetchErr) { console.error('toggleBlock fetch:', fetchErr); return null; }

    const { data: updated, error: updateErr } = await _sb
      .from('library_users')
      .update({ blocked: !current.blocked })
      .eq('id', userId)
      .select()
      .single();
    if (updateErr) { console.error('toggleBlock update:', updateErr); return null; }
    return updated;
  },

  async logVisit(userId, purpose, program, role) {
    const { data, error } = await _sb
      .from('library_visits')
.insert([{ user_id: userId, purpose, program: program || null, role: role || null }])
      .select()
      .single();
    if (error) { console.error('logVisit:', error); return null; }
    return data;
  },

  async getVisitsWithUsers(filters = {}) {
    let query = _sb
      .from('library_visits')
      .select(`
        id,
        purpose,
        program,
        role,
        logged_at,
        user_id,
        library_users (
          id, name, email, rfid, college, blocked
        )
      `)
      .order('logged_at', { ascending: false });

    // Date range filtering is handled client-side for flexibility

    const { data, error } = await query;
    if (error) { console.error('getVisitsWithUsers:', error); return []; }

    // Normalize shape to match what render functions expect
    let rows = (data || []).map(v => ({
      id: v.id,
      purpose: v.purpose,
      program: v.program || null,
      role: v.role || null,
      timestamp: v.logged_at,
      userId: v.user_id,
      user: v.library_users || null,
    }));

    // Client-side text search
    if (filters.search) {
      const s = filters.search.toLowerCase();
      rows = rows.filter(v =>
        v.user?.name?.toLowerCase().includes(s) ||
        v.user?.email?.toLowerCase().includes(s) ||
        v.user?.rfid?.toLowerCase().includes(s) ||
        v.user?.college?.toLowerCase().includes(s) ||
        v.purpose?.toLowerCase().includes(s)
      );
    }

    return rows;
  },

  async getUsers(search = '') {
    const { data, error } = await _sb
      .from('library_users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('getUsers:', error); return []; }
    if (!search) return data || [];
    const s = search.toLowerCase();
    return (data || []).filter(u =>
      u.name?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.rfid?.toLowerCase().includes(s) ||
      u.college?.toLowerCase().includes(s)
    );
  },

  async getBlockedUsers() {
    const { data, error } = await _sb
      .from('library_users')
      .select('*')
      .eq('blocked', true)
      .order('created_at', { ascending: false });
    if (error) { console.error('getBlockedUsers:', error); return []; }
    return data || [];
  },

  async getVisitCountsPerUser() {
    const { data, error } = await _sb
      .from('library_visits')
      .select('user_id, logged_at');
    if (error) { console.error('getVisitCountsPerUser:', error); return { counts: {}, lastVisit: {} }; }
    const counts = {};
    const lastVisit = {};
    (data || []).forEach(v => {
      counts[v.user_id] = (counts[v.user_id] || 0) + 1;
      if (!lastVisit[v.user_id] || v.logged_at > lastVisit[v.user_id]) lastVisit[v.user_id] = v.logged_at;
    });
    return { counts, lastVisit };
  },
};

// ══════════════════════════════════════════════════
// ── HELPERS ──────────────────────════════════════
// ══════════════════════════════════════════════════

function randomCollege() {
  return CONFIG.colleges[Math.floor(Math.random() * CONFIG.colleges.length)];
}

function extractNameFromEmail(email) {
  if (!email) return 'Visitor';
  const local = email.split('@')[0];
  return local.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 3000);
}

function showLoading(show) {
  const btn = document.getElementById('btn-login');
  if (btn) {
    btn.disabled = show;
    btn.querySelector('span').textContent = show ? 'Checking…' : 'Continue';
  }
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
function sameWeek(d, ref) {
  const s = new Date(ref);
  s.setDate(ref.getDate() - ref.getDay());
  s.setHours(0, 0, 0, 0);
  const e = new Date(s);
  e.setDate(s.getDate() + 7);
  return d >= s && d < e;
}
function sameMonth(d, ref) {
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}
function formatDate(d) {
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatTime(d) {
  return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}

// ══════════════════════════════════════════════════
// ── STATE ────────────────────────────────────────
// ══════════════════════════════════════════════════

let state = {
  currentScreen: 'login',
  activeTab: 'email',
  currentUser: null,
  selectedRole: null,
  selectedPurpose: null,
  selectedProgram: null,
  adminLoggedIn: false,
  pendingBlockId: null,
  pendingUnblockId: null,
  welcomeTimer: null,
  currentView: 'overview',
};

// ══════════════════════════════════════════════════
// ── NAVIGATION ───────────────────────────────────
// ══════════════════════════════════════════════════

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if (el) el.classList.add('active');
  state.currentScreen = id;
}

function showDashView(view) {
  document.querySelectorAll('.dash-view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.view === view)
  );
  document.getElementById('dash-view-title').textContent =
    { overview: 'Overview', visitors: 'Visitor Log', users: 'User Management', blocked: 'Blocked Users' }[view] || view;
  state.currentView = view;
  renderView(view);
}

// ══════════════════════════════════════════════════
// ── VALIDATION ───────────────────────────────────
// ══════════════════════════════════════════════════

function isValidInstitutionalEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return false;
  const domain = email.split('@')[1].toLowerCase();
  return CONFIG.validDomains.some(d => domain === d || domain.endsWith('.' + d));
}

// ══════════════════════════════════════════════════
// ── LOGIN FLOW ───────────────────────────────────
// ══════════════════════════════════════════════════

async function handleLogin() {
  const err = document.getElementById('login-error');
  err.classList.add('hidden');
  let identifier = '';

  if (state.activeTab === 'email') {
    identifier = document.getElementById('login-email').value.trim();
    if (!identifier) return showError(err, 'Please enter your institutional email.');
    if (!isValidInstitutionalEmail(identifier))
      return showError(err, 'Invalid email. Use your institutional (Google-based) email.');
  } else {
    identifier = document.getElementById('login-rfid').value.trim();
    if (!identifier) return showError(err, 'Please enter or scan your RFID / ID number.');
  }

  showLoading(true);

  let user = await DB.findUser(identifier);
  if (!user) {
    const data = state.activeTab === 'email'
      ? { email: identifier }
      : { rfid: identifier };
    user = await DB.createUser(data);
  }

  showLoading(false);

  if (!user) {
    return showError(err, 'Something went wrong connecting to the database. Please try again.');
  }

  if (user.blocked) {
    document.getElementById('modal-blocked').classList.remove('hidden');
    return;
  }

  state.currentUser = user;
  document.getElementById('role-greeting').textContent =
    `Hello, ${user.name.split(' ')[0]}! Please select your role.`;
  showScreen('role');
}

async function handlePurposeConfirm() {
  if (!state.selectedPurpose || !state.currentUser) return;

  const btn = document.getElementById('btn-confirm-purpose');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Logging…';

  await DB.logVisit(state.currentUser.id, state.selectedPurpose, state.selectedProgram, state.selectedRole);

  document.getElementById('welcome-name').textContent = state.currentUser.name;
  document.getElementById('welcome-purpose').textContent = `Purpose: ${state.selectedPurpose}`;
  const now = new Date();
  document.getElementById('welcome-time').textContent = `${formatDate(now)} at ${formatTime(now)}`;
  document.getElementById('welcome-meta').textContent =
    `${state.selectedRole || ''} ${state.selectedProgram ? '· ' + state.selectedProgram : ''} · ${state.currentUser.college} · ${state.currentUser.email || state.currentUser.rfid}`;  

  showScreen('welcome');

  clearTimeout(state.welcomeTimer);
  state.welcomeTimer = setTimeout(resetToLogin, CONFIG.welcomeTimeout);
}

// ══════════════════════════════════════════════════
// ── ROLE SCREEN ──────────────────────────────────
// ══════════════════════════════════════════════════

function handleRoleSelect(role) {
  state.selectedRole = role;
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector(`.role-btn[data-role="${role}"]`)?.classList.add('selected');

  // Small delay for visual feedback, then advance
  setTimeout(() => {
    if (role === 'Student') {
      // Students pick program next
      document.getElementById('program-greeting').textContent =
        `Select your current college program.`;
      buildProgramGrid();
      showScreen('program');
    } else {
      // Employees skip program and go straight to purpose
      document.getElementById('purpose-greeting').textContent =
        `What brings you to the library today?`;
      showScreen('purpose');
    }
  }, 200);
}

// ══════════════════════════════════════════════════
// ── PROGRAM SCREEN ───────────────────────────────
// ══════════════════════════════════════════════════

function buildProgramGrid() {
  const grid = document.getElementById('program-grid');
  grid.innerHTML = '';
  CONFIG.programs.forEach(prog => {
    const btn = document.createElement('button');
    btn.className = 'program-btn';
    btn.textContent = prog;
    btn.dataset.program = prog;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.program-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.selectedProgram = prog;
      document.getElementById('btn-confirm-program').disabled = false;
    });
    grid.appendChild(btn);
  });
}

function handleProgramConfirm() {
  if (!state.selectedProgram) return;
  // Pre-fill purpose greeting now that we know the user's first name
  document.getElementById('purpose-greeting').textContent =
    `${state.selectedProgram} — what brings you to the library today?`;
  showScreen('purpose');
}

function resetToLogin() {
  clearTimeout(state.welcomeTimer);
  state.currentUser = null;
  state.selectedRole = null;
  state.selectedPurpose = null;
  state.selectedProgram = null;
  document.getElementById('login-email').value = '';
  document.getElementById('login-rfid').value = '';
  document.getElementById('login-error').classList.add('hidden');
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.purpose-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.program-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('btn-confirm-program').disabled = true;
  const confirmBtn = document.getElementById('btn-confirm-purpose');
  confirmBtn.disabled = true;
  confirmBtn.querySelector('span').textContent = 'Log My Visit';
  showScreen('login');
}

// ══════════════════════════════════════════════════
// ── ADMIN FLOW ───────────────────────────────────
// ══════════════════════════════════════════════════

function handleAdminLogin() {
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value;
  const err = document.getElementById('admin-login-error');
  err.classList.add('hidden');

  if (email !== CONFIG.adminCredentials.email || password !== CONFIG.adminCredentials.password) {
    return showError(err, 'Invalid admin credentials.');
  }
  state.adminLoggedIn = true;
  document.getElementById('admin-name-badge').textContent = 'Admin';
  showScreen('dashboard');
  showDashView('overview');
}

function handleAdminLogout() {
  state.adminLoggedIn = false;
  document.getElementById('admin-email').value = '';
  document.getElementById('admin-password').value = '';
  showScreen('login');
}

// ══════════════════════════════════════════════════
// ── DASHBOARD RENDERING ──────────────────────────
// ══════════════════════════════════════════════════

function renderView(view) {
  const query    = document.getElementById('dash-search').value.trim().toLowerCase();
  const dateFrom = document.getElementById('date-from')?.value || '';
  const dateTo   = document.getElementById('date-to')?.value   || '';
  const roleFilter = document.getElementById('dash-role-filter')?.value || '';
  if (view === 'overview') renderOverview();
  if (view === 'visitors') renderVisitors(query, dateFrom, dateTo, roleFilter);
  if (view === 'users')    renderUsers(query);
  if (view === 'blocked')  renderBlocked(query);
}

async function renderOverview() {
  const all = await DB.getVisitsWithUsers();
  const now = new Date();

  const today = all.filter(v => sameDay(new Date(v.timestamp), now));
  const thisWeek = all.filter(v => sameWeek(new Date(v.timestamp), now));
  const thisMonth = all.filter(v => sameMonth(new Date(v.timestamp), now));

  // Update blocked count badge in nav
  const blockedUsers = await DB.getBlockedUsers();
  const blockedBadgeEl = document.getElementById('blocked-nav-count');
  if (blockedBadgeEl) {
    blockedBadgeEl.textContent = blockedUsers.length;
    blockedBadgeEl.style.display = blockedUsers.length > 0 ? 'inline-flex' : 'none';
  }

  document.getElementById('stat-today').textContent = today.length;
  document.getElementById('stat-week').textContent = thisWeek.length;
  document.getElementById('stat-month').textContent = thisMonth.length;
  document.getElementById('stat-total').textContent = all.length;

  // College breakdown — column chart
  const collegeCounts = {};
  CONFIG.colleges.forEach(c => collegeCounts[c] = 0);
  all.forEach(v => {
    if (v.user?.college) collegeCounts[v.user.college] = (collegeCounts[v.user.college] || 0) + 1;
  });
  const sorted = Object.entries(collegeCounts).sort((a, b) => b[1] - a[1]);
  const chartLabels = sorted.map(([k]) => k);
  const chartData   = sorted.map(([, v]) => v);

  const canvas = document.getElementById('college-chart');
  if (canvas) {
    if (collegeChart) collegeChart.destroy();
    const ctx = canvas.getContext('2d');
    collegeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Visits',
          data: chartData,
          backgroundColor: chartData.map((_, i) =>
            i % 2 === 0 ? 'rgba(192,0,26,0.75)' : 'rgba(0,100,0,0.75)'
          ),
          borderColor: chartData.map((_, i) =>
            i % 2 === 0 ? 'rgba(232,0,31,1)' : 'rgba(0,160,0,1)'
          ),
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 52,
          minBarLength: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1414',
            borderColor: 'rgba(192,0,26,0.4)',
            borderWidth: 1,
            titleColor: '#f0eded',
            bodyColor: '#8a7e7e',
            callbacks: {
              label: ctx => ` ${ctx.parsed.y} visit${ctx.parsed.y !== 1 ? 's' : ''}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#8a7e7e', font: { family: 'DM Sans', size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: '#8a7e7e',
              font: { family: 'DM Sans', size: 11 },
              stepSize: 1,
              precision: 0,
            }
          }
        }
      }
    });
  }

  // Purpose bars
  const purposeCounts = {};
  all.forEach(v => { purposeCounts[v.purpose] = (purposeCounts[v.purpose] || 0) + 1; });
  const max = Math.max(...Object.values(purposeCounts), 1);
  const pbEl = document.getElementById('purpose-bars');
  pbEl.innerHTML = '';
  Object.entries(purposeCounts).sort((a, b) => b[1] - a[1]).forEach(([p, c]) => {
    pbEl.insertAdjacentHTML('beforeend', `
      <div class="purpose-bar-row">
        <span class="purpose-bar-label">${p}</span>
        <div class="purpose-bar-track">
          <div class="purpose-bar-fill" style="width:${(c / max) * 100}%"></div>
        </div>
        <span class="purpose-bar-count">${c}</span>
      </div>`);
  });
  if (!Object.keys(purposeCounts).length)
    pbEl.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No data yet.</p>';

  // Recent visits table
  const tbody = document.getElementById('recent-tbody');
  tbody.innerHTML = '';
  if (!all.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px">No visits recorded yet</td></tr>';
    return;
  }
  all.slice(0, 10).forEach(v => tbody.insertAdjacentHTML('beforeend', visitRow(v)));
}

async function renderVisitors(query, dateFrom = '', dateTo = '', roleFilter = '') {
  let all = await DB.getVisitsWithUsers({ search: query });
  // Date range filter
  if (dateFrom) {
    all = all.filter(v => v.timestamp >= dateFrom + 'T00:00:00');
  }
  if (dateTo) {
    all = all.filter(v => v.timestamp <= dateTo + 'T23:59:59');
  }
  if (roleFilter) {
    all = all.filter(v => v.role?.toLowerCase() === roleFilter.toLowerCase());
  }
  const tbody = document.getElementById('visitors-tbody');
  const empty = document.getElementById('visitors-empty');
  tbody.innerHTML = '';
  if (!all.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  all.forEach(v => tbody.insertAdjacentHTML('beforeend', visitRow(v)));
}

async function renderUsers(query) {
  const users = await DB.getUsers(query);
  const { counts: visitCount, lastVisit } = await DB.getVisitCountsPerUser();

  const tbody = document.getElementById('users-tbody');
  const empty = document.getElementById('users-empty');
  tbody.innerHTML = '';
  if (!users.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  users.forEach(u => {
    const count = visitCount[u.id] || 0;
    const last = lastVisit[u.id] ? formatDate(new Date(lastVisit[u.id])) : '—';
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${esc(u.name)}</td>
        <td style="color:var(--text-muted);font-size:12px">${esc(u.email || u.rfid || '—')}</td>
        <td>${esc(u.college)}</td>
        <td style="font-family:var(--font-head);font-weight:700">${count}</td>
        <td style="color:var(--text-muted);font-size:12px">${last}</td>
        <td><span class="status-pill ${u.blocked ? 'blocked' : 'active'}">${u.blocked ? 'Blocked' : 'Active'}</span></td>
        <td>
          ${u.blocked
            ? `<button class="action-btn unblock" data-id="${u.id}">Unblock</button>`
            : `<button class="action-btn block" data-id="${u.id}">Block</button>`}
        </td>
      </tr>`);
  });
}

async function renderBlocked(query) {
  let users = await DB.getBlockedUsers();
  if (query) {
    const s = query.toLowerCase();
    users = users.filter(u =>
      u.name?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.rfid?.toLowerCase().includes(s) ||
      u.college?.toLowerCase().includes(s)
    );
  }
  const { counts: visitCount } = await DB.getVisitCountsPerUser();
  const tbody = document.getElementById('blocked-tbody');
  const empty = document.getElementById('blocked-empty');
  tbody.innerHTML = '';
  if (!users.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  users.forEach(u => {
    const count = visitCount[u.id] || 0;
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${esc(u.name)}</td>
        <td style="color:var(--text-muted);font-size:12px">${esc(u.email || u.rfid || '—')}</td>
        <td>${esc(u.college)}</td>
        <td style="font-family:var(--font-head);font-weight:700">${count}</td>
        <td><span class="status-pill blocked">Blocked</span></td>
        <td><button class="action-btn unblock" data-id="${u.id}">Unblock</button></td>
      </tr>`);
  });
}

function visitRow(v) {
  const u = v.user;
  const d = new Date(v.timestamp);
  return `
    <tr>
      <td>${esc(u?.name || '—')}</td>
      <td style="color:var(--text-muted);font-size:12px">${esc(u?.email || u?.rfid || '—')}</td>
      <td>${esc(u?.college || '—')}</td>
      <td>${v.role ? `<span class="role-pill ${v.role.toLowerCase()}">${esc(v.role)}</span>` : '—'}</td>
      <td>${esc(v.purpose)}</td>
      <td style="color:var(--text-muted);font-size:12px">${esc(v.program || '—')}</td>
      <td style="color:var(--text-muted);font-size:12px">${formatDate(d)} ${formatTime(d)}</td>
      <td><span class="status-pill ${u?.blocked ? 'blocked' : 'active'}">${u?.blocked ? 'Blocked' : 'Active'}</span></td>
    </tr>`;
}

// ══════════════════════════════════════════════════
// ── BLOCK / UNBLOCK ──────────────────────────────
// ══════════════════════════════════════════════════

document.addEventListener('click', e => {
  const blockBtn = e.target.closest('.action-btn.block');
  const unblockBtn = e.target.closest('.action-btn.unblock');
  if (blockBtn) {
    state.pendingBlockId = blockBtn.dataset.id;
    document.getElementById('modal-block').classList.remove('hidden');
  }
  if (unblockBtn) {
    state.pendingUnblockId = unblockBtn.dataset.id;
    document.getElementById('modal-unblock').classList.remove('hidden');
  }
});

document.getElementById('modal-confirm-block').addEventListener('click', async () => {
  if (state.pendingBlockId) {
    await DB.toggleBlock(state.pendingBlockId);
    state.pendingBlockId = null;
    document.getElementById('modal-block').classList.add('hidden');
    renderView(state.currentView);
    showToast('User has been blocked.', 'error');
  }
});

document.getElementById('modal-cancel').addEventListener('click', () => {
  state.pendingBlockId = null;
  document.getElementById('modal-block').classList.add('hidden');
});

document.getElementById('modal-confirm-unblock').addEventListener('click', async () => {
  if (state.pendingUnblockId) {
    await DB.toggleBlock(state.pendingUnblockId);
    state.pendingUnblockId = null;
    document.getElementById('modal-unblock').classList.add('hidden');
    renderView(state.currentView);
    showToast('User has been unblocked.', 'success');
  }
});

document.getElementById('modal-unblock-cancel').addEventListener('click', () => {
  state.pendingUnblockId = null;
  document.getElementById('modal-unblock').classList.add('hidden');
});

document.getElementById('modal-blocked-ok').addEventListener('click', () => {
  document.getElementById('modal-blocked').classList.add('hidden');
  resetToLogin();
});

// ══════════════════════════════════════════════════
// ── EVENT BINDINGS ───────────────────────────────
// ══════════════════════════════════════════════════

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.activeTab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab-panel').forEach(p =>
      p.classList.toggle('active', p.id === 'tab-' + btn.dataset.tab)
    );
    document.getElementById('login-error').classList.add('hidden');
  });
});

// Login
document.getElementById('btn-login').addEventListener('click', handleLogin);
document.getElementById('login-email').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
document.getElementById('login-rfid').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });

// Role
document.querySelectorAll('.role-btn').forEach(btn => {
  btn.addEventListener('click', () => handleRoleSelect(btn.dataset.role));
});
document.getElementById('btn-back-role').addEventListener('click', () => {
  state.selectedRole = null;
  state.currentUser = null;
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
  showScreen('login');
});

// Purpose
document.querySelectorAll('.purpose-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.purpose-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.program-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('btn-confirm-program').disabled = true;
    btn.classList.add('selected');
    state.selectedPurpose = btn.dataset.purpose;
    document.getElementById('btn-confirm-purpose').disabled = false;
  });
});
document.getElementById('btn-confirm-purpose').addEventListener('click', handlePurposeConfirm);
document.getElementById('btn-back-purpose').addEventListener('click', () => {
  state.selectedPurpose = null;
  document.querySelectorAll('.purpose-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('btn-confirm-purpose').disabled = true;
  // Employees go back to role, Students go back to program
  if (state.selectedRole === 'Employee') {
    showScreen('role');
  } else {
    showScreen('program');
  }
});

// Program screen
document.getElementById('btn-confirm-program').addEventListener('click', handleProgramConfirm);
document.getElementById('btn-back-program').addEventListener('click', () => {
  state.selectedProgram = null;
  document.querySelectorAll('.program-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('btn-confirm-program').disabled = true;
  showScreen('role');
});

// Welcome
document.getElementById('btn-welcome-done').addEventListener('click', () => {
  clearTimeout(state.welcomeTimer);
  resetToLogin();
});

// Admin nav
document.getElementById('btn-admin-login').addEventListener('click', () => showScreen('admin-login'));
document.getElementById('btn-back-to-visitor').addEventListener('click', () => showScreen('login'));
document.getElementById('btn-admin-submit').addEventListener('click', handleAdminLogin);
document.getElementById('admin-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleAdminLogin();
});
document.getElementById('btn-admin-logout').addEventListener('click', handleAdminLogout);

// Password toggle
document.getElementById('toggle-pw').addEventListener('click', () => {
  const pw = document.getElementById('admin-password');
  const icon = document.querySelector('#toggle-pw i');
  if (pw.type === 'password') { pw.type = 'text'; icon.className = 'fas fa-eye-slash'; }
  else { pw.type = 'password'; icon.className = 'fas fa-eye'; }
});

// Sidebar nav
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    showDashView(item.dataset.view);
  });
});

// Search + date filter (live)
let searchTimer;
document.getElementById('dash-search').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => renderView(state.currentView), 300);
});

document.getElementById('btn-clear-filter').addEventListener('click', () => {
  document.getElementById('dash-search').value = '';
  renderView(state.currentView);
});

// Visitors date range + role filters
document.getElementById('btn-apply-filter')?.addEventListener('click', () => renderView('visitors'));
document.getElementById('btn-reset-filter')?.addEventListener('click', () => {
  document.getElementById('date-from').value = '';
  document.getElementById('date-to').value   = '';
  document.getElementById('dash-role-filter').value = '';
  document.getElementById('dash-search').value = '';
  renderView('visitors');
});
document.getElementById('dash-role-filter')?.addEventListener('change', () => renderView('visitors'));

// ══════════════════════════════════════════════════
// ── INIT ─────────────────────────────────────────
// ══════════════════════════════════════════════════

showScreen('login');
