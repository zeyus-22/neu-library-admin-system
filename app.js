/* ══════════════════════════════════════════════════
   NEU Library Visitor Log — App Logic (Supabase)
══════════════════════════════════════════════════ */

'use strict';

let collegeChart = null;

// ══════════════════════════════════════════════════
// ── CONFIG ───────────────────────────────────────
// ══════════════════════════════════════════════════

const CONFIG = {
  supabaseUrl: 'https://ydozugjlltfzcukykwec.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkb3p1Z2psbHRmemN1a3lrd2VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzE1MDcsImV4cCI6MjA4ODEwNzUwN30.-24nkr7dy8evVEdXnX6aWkNT7ozK1GdCALfCUXl5WYQ',
  adminEmails: ['jcesperanza@neu.edu.ph'], // seed — overwritten by loadAdminEmails()
  googleClientId: '988706213326-0r902t1jsp5e6noo890dkimajq2hg25q.apps.googleusercontent.com',
  validDomains: ['neu.edu.ph', 'gmail.com'],
  colleges: [
    'CAcc', 'CAgri', 'CAS', 'CBA', 'CCom', 'CCrim', 'CED',
    'CEA', 'CICS', 'CMedTech', 'CMid', 'CMus', 'CN', 'CPT',
    'CRT', 'SIR', 'CL', 'CMed', 'SGS'
  ],
  purposes: ['Reading', 'Researching', 'Studying', 'Use of Computer', 'Group Study', 'Other'],
  programs: [
    // College of Accountancy
    'BSA',
    // College of Agriculture
    'BSAgri',
    // College of Arts and Sciences
    'AB Economics', 'AB Political Science', 'BS Biology', 'BS Psychology', 'AB Public Administration',
    // College of Business Administration
    'BSBA-FM', 'BSBA-HRDM', 'BSBA-LM', 'BSBA-MM', 'BS Entrepreneurship', 'BS Real Estate Management',
    // College of Communication
    'AB Broadcasting', 'AB Communication', 'AB Journalism',
    // College of Criminology
    'BS Criminology',
    // College of Education
    'BEEd', 'BSEd-English', 'BSEd-Filipino', 'BSEd-Math', 'BSEd-MAPEH', 'BSEd-Science', 'BSEd-Social Studies', 'BSEd-TLE',
    // College of Engineering and Architecture
    'BS Architecture', 'BS Astronomy', 'BS Civil Eng', 'BS Electrical Eng', 'BS Electronics Eng', 'BS Industrial Eng', 'BS Mechanical Eng',
    // College of Informatics and Computing Studies
    'BLIS', 'BS Computer Science', 'BS EMC', 'BS Information Systems', 'BSIT',
    // College of Medical Technology
    'BS Medical Technology',
    // College of Midwifery
    'Diploma in Midwifery',
    // College of Music
    'BMus-Choral', 'BMus-Music Ed', 'BMus-Piano', 'BMus-Voice',
    // College of Nursing
    'BSN',
    // College of Physical Therapy
    'BS Physical Therapy',
    // College of Respiratory Therapy
    'BS Respiratory Therapy',
    // School of International Relations
    'AB Foreign Service',
    // College of Law
    'Juris Doctor',
    // College of Medicine
    'Doctor of Medicine',
    // School of Graduate Studies
    'MBA', 'MAEd', 'PhD Education', 'DBA',
  ],
  // Maps each program code to its college
  programCollegeMap: {
    'BSA':                    'CAcc',
    'BSAgri':                 'CAgri',
    'AB Economics':           'CAS',
    'AB Political Science':   'CAS',
    'BS Biology':             'CAS',
    'BS Psychology':          'CAS',
    'AB Public Administration':'CAS',
    'BSBA-FM':                'CBA',
    'BSBA-HRDM':              'CBA',
    'BSBA-LM':                'CBA',
    'BSBA-MM':                'CBA',
    'BS Entrepreneurship':    'CBA',
    'BS Real Estate Management':'CBA',
    'AB Broadcasting':        'CCom',
    'AB Communication':       'CCom',
    'AB Journalism':          'CCom',
    'BS Criminology':         'CCrim',
    'BEEd':                   'CED',
    'BSEd-English':           'CED',
    'BSEd-Filipino':          'CED',
    'BSEd-Math':              'CED',
    'BSEd-MAPEH':             'CED',
    'BSEd-Science':           'CED',
    'BSEd-Social Studies':    'CED',
    'BSEd-TLE':               'CED',
    'BS Architecture':        'CEA',
    'BS Astronomy':           'CEA',
    'BS Civil Eng':           'CEA',
    'BS Electrical Eng':      'CEA',
    'BS Electronics Eng':     'CEA',
    'BS Industrial Eng':      'CEA',
    'BS Mechanical Eng':      'CEA',
    'BLIS':                   'CICS',
    'BS Computer Science':    'CICS',
    'BS EMC':                 'CICS',
    'BS Information Systems': 'CICS',
    'BSIT':                   'CICS',
    'BS Medical Technology':  'CMedTech',
    'Diploma in Midwifery':   'CMid',
    'BMus-Choral':            'CMus',
    'BMus-Music Ed':          'CMus',
    'BMus-Piano':             'CMus',
    'BMus-Voice':             'CMus',
    'BSN':                    'CN',
    'BS Physical Therapy':    'CPT',
    'BS Respiratory Therapy': 'CRT',
    'AB Foreign Service':     'SIR',
    'Juris Doctor':           'CL',
    'Doctor of Medicine':     'CMed',
    'MBA':                    'SGS',
    'MAEd':                   'SGS',
    'PhD Education':          'SGS',
    'DBA':                    'SGS',
  },
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

  async searchUsers(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const { data, error } = await _sb
      .from('library_users')
      .select('id, name, email, rfid, college, blocked')
      .or(`name.ilike.%${q}%,email.ilike.%${q}%,rfid.ilike.%${q}%,college.ilike.%${q}%`)
      .limit(8);
    if (error) { console.error('searchUsers:', error); return []; }
    return data || [];
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
      .from('library_users').insert([payload]).select().single();
    if (error) { console.error('createUser:', error); return null; }
    return user;
  },

  async toggleBlock(userId) {
    const { data: current, error: fetchErr } = await _sb
      .from('library_users').select('blocked').eq('id', userId).single();
    if (fetchErr) { console.error('toggleBlock fetch:', fetchErr); return null; }
    const { data: updated, error: updateErr } = await _sb
      .from('library_users').update({ blocked: !current.blocked })
      .eq('id', userId).select().single();
    if (updateErr) { console.error('toggleBlock update:', updateErr); return null; }
    return updated;
  },

  async logVisit(userId, purpose, program, role) {
    const { data, error } = await _sb
      .from('library_visits')
      .insert([{ user_id: userId, purpose, program: program || null, role: role || null }])
      .select().single();
    if (error) { console.error('logVisit:', error); return null; }
    return data;
  },

  async getVisitsWithUsers() {
    // Fetch visits and users in parallel, then merge client-side
    // This avoids RLS join issues entirely
    const [visitsRes, usersRes] = await Promise.all([
      _sb.from('library_visits')
        .select('id, purpose, program, role, logged_at, user_id')
        .order('logged_at', { ascending: false }),
      _sb.from('library_users')
        .select('id, name, email, rfid, college, blocked')
    ]);

    if (visitsRes.error) { console.error('getVisits error:', visitsRes.error); return []; }
    if (usersRes.error)  { console.error('getUsers error:',  usersRes.error); }

    const userMap = Object.fromEntries(
      (usersRes.data || []).map(u => [u.id, u])
    );

    return (visitsRes.data || []).map(v => ({
      id:        v.id,
      purpose:   v.purpose,
      program:   v.program || null,
      role:      v.role    || null,
      timestamp: v.logged_at,
      userId:    v.user_id,
      user:      userMap[v.user_id] || null,
    }));
  },



  async loadAdminEmails() {
    const { data, error } = await _sb
      .from('library_users')
      .select('email')
      .eq('is_admin', true);
    if (error) { console.error('loadAdminEmails:', error); return; }
    const fromDb = (data || []).map(u => u.email).filter(Boolean);
    // Merge with hardcoded seeds, deduplicate
    const all = [...new Set([...CONFIG.adminEmails, ...fromDb])];
    CONFIG.adminEmails = all;
  },

  async setAdminStatus(userId, isAdmin) {
    const { data, error } = await _sb
      .from('library_users')
      .update({ is_admin: isAdmin })
      .eq('id', userId)
      .select('email')
      .single();
    if (error) { console.error('setAdminStatus:', error); return; }
    // Sync CONFIG.adminEmails
    const email = data?.email;
    if (!email) return;
    if (isAdmin && !CONFIG.adminEmails.map(e=>e.toLowerCase()).includes(email.toLowerCase())) {
      CONFIG.adminEmails.push(email);
    } else if (!isAdmin) {
      CONFIG.adminEmails = CONFIG.adminEmails.filter(e => e.toLowerCase() !== email.toLowerCase());
    }
  },

  async updateUser(userId, updates) {
    const { data, error } = await _sb
      .from('library_users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) { console.error('updateUser:', error); return null; }
    return data;
  },

  async getUsers(search = '') {
    const { data, error } = await _sb
      .from('library_users').select('*').order('created_at', { ascending: false });
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
      .from('library_users').select('*').eq('blocked', true)
      .order('created_at', { ascending: false });
    if (error) { console.error('getBlockedUsers:', error); return []; }
    return data || [];
  },

  async getVisitCountsPerUser() {
    const { data, error } = await _sb.from('library_visits').select('user_id, logged_at');
    if (error) { console.error('getVisitCountsPerUser:', error); return { counts: {}, lastVisit: {} }; }
    const counts = {}, lastVisit = {};
    (data || []).forEach(v => {
      counts[v.user_id] = (counts[v.user_id] || 0) + 1;
      if (!lastVisit[v.user_id] || v.logged_at > lastVisit[v.user_id]) lastVisit[v.user_id] = v.logged_at;
    });
    return { counts, lastVisit };
  },
};


// ══════════════════════════════════════════════════
// ── GOOGLE AUTH ──────────────────────────────────
// ══════════════════════════════════════════════════

async function signInWithGoogle(mode = 'visitor') {
  // mode: 'visitor' or 'admin'
  try {
    const { data, error } = await _sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account', // forces account picker — enables switch account
        },
        scopes: 'email profile',
      }
    });
    if (error) throw error;
    // Store intended mode so we know what to do after redirect
    sessionStorage.setItem('neu_auth_mode', mode);
  } catch (err) {
    console.error('Google sign-in error:', err);
    showToast('Google sign-in failed. Please try again.', 'error');
  }
}

async function handleAuthCallback() {
  // Only process if this is a FRESH OAuth redirect from Google
  // Detected by Supabase's access_token hash or PKCE code in URL
  const url = window.location.href;
  const isFreshRedirect = url.includes('access_token=') ||
                          url.includes('#access_token') ||
                          url.includes('code=') ||
                          url.includes('error_description=');

  if (!isFreshRedirect) {
    // No fresh redirect — clear any stale session and go to landing
    await _sb.auth.signOut().catch(() => {});
    return false;
  }

  const { data: { session }, error } = await _sb.auth.getSession();
  if (!session || error) return false;

  // Clean the URL so refreshing doesn't re-trigger this
  window.history.replaceState({}, document.title, window.location.pathname);

  const email = session.user?.email;
  const name  = session.user?.user_metadata?.full_name || extractNameFromEmail(email);
  sessionStorage.removeItem('neu_auth_mode');

  // ── Admin check first — regardless of which button was clicked ──
  // If the signed-in Google email is a registered admin, go straight to dashboard
  if (email && CONFIG.adminEmails.map(e => e.toLowerCase()).includes(email.toLowerCase())) {
    state.adminLoggedIn = true;
    document.getElementById('admin-name-badge').textContent = name.split(' ')[0];
    showScreen('dashboard');
    showDashView('overview');
    return true;
  }

  // ── Visitor path ──
  if (!email) return false;

  // Validate domain
  if (!isValidInstitutionalEmail(email)) {
    await _sb.auth.signOut();
    showScreen('login');
    const err = document.getElementById('login-error');
    showError(err, 'Please use your institutional email (@neu.edu.ph or @gmail.com).');
    return true;
  }

  showScreen('login');
  showLoading(true);

  let user = await DB.findUser(email);
  if (!user) {
    user = await DB.createUser({ email, name });
  }
  showLoading(false);

  if (!user) {
    showError(document.getElementById('login-error'), 'Something went wrong. Please try again.');
    return true;
  }
  if (user.blocked) {
    document.getElementById('modal-blocked').classList.remove('hidden');
    return true;
  }

  state.currentUser = user;

  // If user already has saved role & program, skip straight to purpose
  if (user.saved_role) {
    state.selectedRole    = user.saved_role;
    state.selectedProgram = user.saved_program || null;
    document.getElementById('purpose-greeting').textContent =
      `Welcome back, ${user.name.split(' ')[0]}! What brings you to the library today?`;
    showScreen('purpose');
  } else {
    document.getElementById('role-greeting').textContent =
      `Hello, ${user.name.split(' ')[0]}! Please select your role.`;
    showScreen('role');
  }
  return true;
}


// ══════════════════════════════════════════════════
// ── ROTATING QUOTES ──────────────────────────────
// ══════════════════════════════════════════════════

const QUOTES = [
  { text: 'A reader lives a thousand lives before he dies. The man who never reads lives only one.', author: 'George R.R. Martin' },
  { text: 'There are many little ways to enlarge your child\'s world. Love of books is the best of all.', author: 'Jacqueline Kennedy' },
  { text: 'Not all readers are leaders, but all leaders are readers.', author: 'Harry S. Truman' },
  { text: 'A library is not a luxury but one of the necessities of life.', author: 'Henry Ward Beecher' },
  { text: 'The more that you read, the more things you will know. The more that you learn, the more places you\'ll go.', author: 'Dr. Seuss' },
  { text: 'I have always imagined that Paradise will be a kind of library.', author: 'Jorge Luis Borges' },
  { text: 'Books are a uniquely portable magic.', author: 'Stephen King' },
  { text: 'A book is a dream that you hold in your hands.', author: 'Neil Gaiman' },
  { text: 'Reading is to the mind what exercise is to the body.', author: 'Joseph Addison' },
  { text: 'The library is inhabited by spirits that come out of the pages at night.', author: 'Isabel Allende' },
  { text: 'Knowledge is power. Information is liberating. Education is the premise of progress.', author: 'Kofi Annan' },
  { text: 'In the library I felt better, words you could trust and look at till you understood them.', author: 'Jeanette Winterson' },
];

let quoteIndex = 0;
let quoteTimer = null;

function initQuotes() {
  const dotsEl = document.getElementById('quote-dots');
  if (!dotsEl) return;
  dotsEl.innerHTML = QUOTES.map((_, i) =>
    `<span class="quote-dot ${i === 0 ? 'active' : ''}" data-i="${i}"></span>`
  ).join('');
  dotsEl.querySelectorAll('.quote-dot').forEach(dot => {
    dot.addEventListener('click', () => goToQuote(parseInt(dot.dataset.i)));
  });
  showQuote(0, false);
  startQuoteRotation();
}

function showQuote(index, animate = true) {
  const textEl   = document.getElementById('quote-text');
  const authorEl = document.getElementById('quote-author');
  const banner   = document.getElementById('quote-banner');
  if (!textEl || !authorEl) return;
  if (animate) {
    banner.classList.add('quote-fade-out');
    setTimeout(() => {
      textEl.textContent   = '\u201c' + QUOTES[index].text + '\u201d';
      authorEl.textContent = '\u2014 ' + QUOTES[index].author;
      banner.classList.remove('quote-fade-out');
      banner.classList.add('quote-fade-in');
      setTimeout(() => banner.classList.remove('quote-fade-in'), 600);
    }, 400);
  } else {
    textEl.textContent   = '\u201c' + QUOTES[index].text + '\u201d';
    authorEl.textContent = '\u2014 ' + QUOTES[index].author;
  }
  document.querySelectorAll('.quote-dot').forEach((d, i) =>
    d.classList.toggle('active', i === index)
  );
  quoteIndex = index;
}

function goToQuote(index) {
  clearInterval(quoteTimer);
  showQuote(index);
  startQuoteRotation();
}

function startQuoteRotation() {
  quoteTimer = setInterval(() => {
    showQuote((quoteIndex + 1) % QUOTES.length);
  }, 20000);
}


// ══════════════════════════════════════════════════
// ── STATE ────────────────────────────────────────
// ══════════════════════════════════════════════════

let state = {
  currentScreen: 'landing',
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
  activeQuickFilter: 'all',
  allVisits: [], // cached for client-side filtering
};

// ══════════════════════════════════════════════════
// ── HELPERS ──────────────────────────────────────
// ══════════════════════════════════════════════════

function randomCollege() {
  return CONFIG.colleges[Math.floor(Math.random() * CONFIG.colleges.length)];
}
function extractNameFromEmail(email) {
  if (!email) return 'Visitor';
  const local = email.split('@')[0];
  return local.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
}
function showError(el, msg) { el.textContent = msg; el.classList.remove('hidden'); }
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 3000);
}
function showLoading(show) {
  const btn = document.getElementById('btn-login');
  if (btn) { btn.disabled = show; btn.querySelector('span').textContent = show ? 'Checking…' : 'Continue'; }
}
function esc(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function sameDay(a, b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}
function sameWeek(d, ref) {
  const s = new Date(ref); s.setDate(ref.getDate()-ref.getDay()); s.setHours(0,0,0,0);
  const e = new Date(s); e.setDate(s.getDate()+7);
  return d >= s && d < e;
}
function sameMonth(d, ref) {
  return d.getFullYear()===ref.getFullYear() && d.getMonth()===ref.getMonth();
}
function formatDate(d) { return d.toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}); }
function formatTime(d) { return d.toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'}); }

// ══════════════════════════════════════════════════
// ── PH TIME CLOCK ────────────────────────────────
// ══════════════════════════════════════════════════

function startClock() {
  function update() {
    const now = new Date();
    const ph = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    if (!timeEl || !dateEl) return;

    let h = ph.getHours(), m = ph.getMinutes(), s = ph.getSeconds();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    timeEl.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} ${ampm}`;
    dateEl.textContent = ph.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  update();
  setInterval(update, 1000);
}

// ══════════════════════════════════════════════════
// ── LANDING PAGE ─────────────────────────────────
// ══════════════════════════════════════════════════

async function loadLandingStats() {
  try {
    const visits = await DB.getVisitsWithUsers();
    const now = new Date();
    const today = visits.filter(v => sameDay(new Date(v.timestamp), now)).length;
    const month = visits.filter(v => sameMonth(new Date(v.timestamp), now)).length;
    document.getElementById('landing-stat-today').textContent = today;
    document.getElementById('landing-stat-month').textContent = month;
    document.getElementById('landing-stat-total').textContent = visits.length;
  } catch(e) {
    // silently fail on landing page
  }
}

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
// ── SUGGESTIONS (SEARCH AUTOCOMPLETE) ────────────
// ══════════════════════════════════════════════════

let suggestionTimer = null;

async function showLoginSuggestions(query) {
  const dropdown = document.getElementById('login-suggestions');
  if (!dropdown || !query || query.length < 2) {
    dropdown?.classList.add('hidden');
    return;
  }
  const results = await DB.searchUsers(query);
  if (!results.length) { dropdown.classList.add('hidden'); return; }

  dropdown.innerHTML = results.map(u => `
    <div class="suggestion-item" data-email="${esc(u.email || '')}" data-rfid="${esc(u.rfid || '')}">
      <div class="suggestion-name">${esc(u.name)}</div>
      <div class="suggestion-meta">${esc(u.email || u.rfid || '')} · ${esc(u.college || '')}</div>
    </div>
  `).join('');
  dropdown.classList.remove('hidden');

  dropdown.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      const email = item.dataset.email;
      const rfid  = item.dataset.rfid;
      if (email && state.activeTab === 'email') {
        document.getElementById('login-email').value = email;
      } else if (rfid) {
        document.getElementById('login-rfid').value = rfid;
      }
      dropdown.classList.add('hidden');
      handleLogin();
    });
  });
}

async function showDashSearchSuggestions(query) {
  const dropdown = document.getElementById('dash-search-suggestions');
  if (!dropdown || !query || query.length < 2) {
    dropdown?.classList.add('hidden');
    return;
  }

  // Search across cached visits for suggestion labels
  const q = query.toLowerCase();
  const matched = new Set();
  const suggestions = [];

  state.allVisits.forEach(v => {
    const u = v.user;
    if (!u) return;
    if (u.name?.toLowerCase().includes(q) && !matched.has('name:'+u.name)) {
      matched.add('name:'+u.name);
      suggestions.push({ label: u.name, sub: u.email || u.rfid || '', type: 'name' });
    }
    if (u.email?.toLowerCase().includes(q) && !matched.has('email:'+u.email)) {
      matched.add('email:'+u.email);
      suggestions.push({ label: u.email, sub: u.name, type: 'email' });
    }
    if (u.college?.toLowerCase().includes(q) && !matched.has('college:'+u.college)) {
      matched.add('college:'+u.college);
      suggestions.push({ label: u.college, sub: 'College', type: 'college' });
    }
    if (v.purpose?.toLowerCase().includes(q) && !matched.has('purpose:'+v.purpose)) {
      matched.add('purpose:'+v.purpose);
      suggestions.push({ label: v.purpose, sub: 'Purpose', type: 'purpose' });
    }
    if (v.role?.toLowerCase().includes(q) && !matched.has('role:'+v.role)) {
      matched.add('role:'+v.role);
      suggestions.push({ label: v.role, sub: 'Role', type: 'role' });
    }
  });

  const top = suggestions.slice(0, 8);
  if (!top.length) { dropdown.classList.add('hidden'); return; }

  const iconMap = { name: 'fa-user', email: 'fa-envelope', college: 'fa-building', purpose: 'fa-book-open', role: 'fa-id-badge' };
  dropdown.innerHTML = top.map(s => `
    <div class="suggestion-item" data-value="${esc(s.label)}">
      <i class="fas ${iconMap[s.type] || 'fa-magnifying-glass'} suggestion-icon"></i>
      <div>
        <div class="suggestion-name">${esc(s.label)}</div>
        <div class="suggestion-meta">${esc(s.sub)}</div>
      </div>
    </div>
  `).join('');
  dropdown.classList.remove('hidden');

  dropdown.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      document.getElementById('dash-search').value = item.dataset.value;
      dropdown.classList.add('hidden');
      renderView(state.currentView);
    });
  });
}

// Close suggestions when clicking outside
document.addEventListener('click', e => {
  if (!e.target.closest('.dash-search-container')) {
    document.getElementById('dash-search-suggestions')?.classList.add('hidden');
  }
  if (!e.target.closest('.login-card')) {
    document.getElementById('login-suggestions')?.classList.add('hidden');
  }
});

// ══════════════════════════════════════════════════
// ── LOGIN FLOW ───────────────────────────────────
// ══════════════════════════════════════════════════

async function handleLogin() {
  const err = document.getElementById('login-error');
  err.classList.add('hidden');
  document.getElementById('login-suggestions')?.classList.add('hidden');
  let identifier = '';
  let enteredName = '';

  if (state.activeTab === 'email') {
    identifier   = document.getElementById('login-email').value.trim();
    enteredName  = document.getElementById('login-name-email')?.value.trim() || '';
    if (!identifier) return showError(err, 'Please enter your institutional email.');
    if (!isValidInstitutionalEmail(identifier))
      return showError(err, 'Invalid email. Use your institutional (Google-based) email.');
    if (!enteredName) return showError(err, 'Please enter your full name.');
  } else {
    identifier   = document.getElementById('login-rfid').value.trim();
    enteredName  = document.getElementById('login-name-rfid')?.value.trim() || '';
    if (!identifier) return showError(err, 'Please enter or scan your RFID / ID number.');
    if (!enteredName) return showError(err, 'Please enter your full name.');
  }

  showLoading(true);
  let user = await DB.findUser(identifier);

  if (!user) {
    // New user — create with entered name
    const data = state.activeTab === 'email'
      ? { email: identifier, name: enteredName }
      : { rfid: identifier,  name: enteredName };
    user = await DB.createUser(data);
  } else if (enteredName && enteredName.toLowerCase() !== user.name.toLowerCase()) {
    // Returning user updated their name — save it
    user.name = enteredName;
    _sb.from('library_users')
      .update({ name: enteredName })
      .eq('id', user.id)
      .then(({ error }) => { if (error) console.error('Name update error:', error); });
  }

  showLoading(false);

  if (!user) return showError(err, 'Something went wrong. Please try again.');
  if (user.blocked) { document.getElementById('modal-blocked').classList.remove('hidden'); return; }

  state.currentUser = user;

  // If user already has saved role & program, skip straight to purpose
  if (user.saved_role) {
    state.selectedRole    = user.saved_role;
    state.selectedProgram = user.saved_program || null;
    document.getElementById('purpose-greeting').textContent =
      `Welcome back, ${user.name.split(' ')[0]}! What brings you to the library today?`;
    showScreen('purpose');
  } else {
    document.getElementById('role-greeting').textContent =
      `Hello, ${user.name.split(' ')[0]}! Please select your role.`;
    showScreen('role');
  }
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

function resetToLogin() {
  clearTimeout(state.welcomeTimer);
  state.currentUser = null;
  state.selectedRole = null;
  state.selectedPurpose = null;
  state.selectedProgram = null;
  document.getElementById('login-email').value = '';
  document.getElementById('login-rfid').value = '';
  const nameEmailEl = document.getElementById('login-name-email'); if (nameEmailEl) nameEmailEl.value = '';
  const nameRfidEl  = document.getElementById('login-name-rfid');  if (nameRfidEl)  nameRfidEl.value  = '';
  document.getElementById('login-error').classList.add('hidden');
  document.querySelectorAll('.role-btn, .purpose-btn').forEach(b => b.classList.remove('selected'));
  const progSel = document.getElementById('program-select'); if (progSel) progSel.value = '';
  const confirmPurpose = document.getElementById('btn-confirm-purpose');
  confirmPurpose.disabled = true;
  confirmPurpose.querySelector('span').textContent = 'Log My Visit';
  const confirmProgram = document.getElementById('btn-confirm-program');
  confirmProgram.disabled = true;
  showScreen('login');
}

// ══════════════════════════════════════════════════
// ── ROLE SCREEN ──────────────────────────────────
// ══════════════════════════════════════════════════

function handleRoleSelect(role) {
  state.selectedRole = role;
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector(`.role-btn[data-role="${role}"]`)?.classList.add('selected');
  setTimeout(() => {
    if (role === 'Student') {
      buildProgramGrid();
      showScreen('program');
    } else {
      // Employee — save role immediately (no program)
      if (state.currentUser) {
        DB.updateUser(state.currentUser.id, { saved_role: role, saved_program: null })
          .then(updated => { if (updated) state.currentUser = updated; });
      }
      document.getElementById('purpose-greeting').textContent = `What brings you to the library today?`;
      showScreen('purpose');
    }
  }, 200);
}

// ══════════════════════════════════════════════════
// ── PROGRAM SCREEN ───────────────────────────────
// ══════════════════════════════════════════════════

function buildProgramGrid() {
  // Now using a <select> dropdown instead of a grid
  const sel = document.getElementById('program-select');
  if (!sel) return;
  sel.value = '';
  document.getElementById('btn-confirm-program').disabled = true;
  sel.addEventListener('change', () => {
    state.selectedProgram = sel.value || null;
    document.getElementById('btn-confirm-program').disabled = !sel.value;
  });
}

function handleProgramConfirm() {
  if (!state.selectedProgram) return;

  // Derive college from program
  const derivedCollege = CONFIG.programCollegeMap[state.selectedProgram] || state.currentUser?.college;

  // Save role, program, and college to user record
  if (state.currentUser) {
    const updates = {
      saved_role:    state.selectedRole,
      saved_program: state.selectedProgram,
    };
    if (derivedCollege && derivedCollege !== state.currentUser.college) {
      updates.college = derivedCollege;
      state.currentUser.college = derivedCollege;
    }
    DB.updateUser(state.currentUser.id, updates)
      .then(updated => { if (updated) state.currentUser = updated; });
  }

  document.getElementById('purpose-greeting').textContent =
    `${state.selectedProgram} — what brings you to the library today?`;
  showScreen('purpose');
}

// ══════════════════════════════════════════════════
// ── ADMIN FLOW ───────────────────────────────────
// ══════════════════════════════════════════════════

function handleAdminLogin() {
  const email = document.getElementById('admin-email').value.trim();
  const err = document.getElementById('admin-login-error');
  err.classList.add('hidden');
  if (!CONFIG.adminEmails.map(e => e.toLowerCase()).includes(email.toLowerCase())) {
    return showError(err, 'Unrecognized admin email. Contact the system administrator.');
  }
  state.adminLoggedIn = true;
  document.getElementById('admin-name-badge').textContent = email.split('@')[0];
  showScreen('dashboard');
  showDashView('overview');
}

function handleAdminLogout() {
  state.adminLoggedIn = false;
  document.getElementById('admin-email').value = '';
  showScreen('landing');
}

// ══════════════════════════════════════════════════
// ── DASHBOARD RENDERING ──────────────────────────
// ══════════════════════════════════════════════════

function getVisitorFilters() {
  return {
    query:    document.getElementById('dash-search')?.value.trim().toLowerCase() || '',
    dateFrom: document.getElementById('date-from')?.value || '',
    dateTo:   document.getElementById('date-to')?.value   || '',
    role:     document.getElementById('dash-role-filter')?.value || '',
    purpose:  document.getElementById('dash-purpose-filter')?.value || '',
    college:  document.getElementById('dash-college-filter')?.value || '',
    quick:    state.activeQuickFilter,
  };
}

function applyVisitorFilters(visits, filters) {
  let rows = [...visits];
  const now = new Date();

  // Quick filter
  if (filters.quick === 'today')
    rows = rows.filter(v => sameDay(new Date(v.timestamp), now));
  else if (filters.quick === 'week')
    rows = rows.filter(v => sameWeek(new Date(v.timestamp), now));
  else if (filters.quick === 'month')
    rows = rows.filter(v => sameMonth(new Date(v.timestamp), now));

  // Date range
  if (filters.dateFrom)
    rows = rows.filter(v => v.timestamp >= filters.dateFrom + 'T00:00:00');
  if (filters.dateTo)
    rows = rows.filter(v => v.timestamp <= filters.dateTo + 'T23:59:59');

  // Dropdowns
  if (filters.role)    rows = rows.filter(v => v.role?.toLowerCase() === filters.role.toLowerCase());
  if (filters.purpose) rows = rows.filter(v => v.purpose === filters.purpose);
  if (filters.college) rows = rows.filter(v => v.user?.college === filters.college);

  // Text search
  if (filters.query) {
    const q = filters.query;
    rows = rows.filter(v =>
      v.user?.name?.toLowerCase().includes(q) ||
      v.user?.email?.toLowerCase().includes(q) ||
      v.user?.rfid?.toLowerCase().includes(q) ||
      v.user?.college?.toLowerCase().includes(q) ||
      v.purpose?.toLowerCase().includes(q) ||
      v.role?.toLowerCase().includes(q) ||
      v.program?.toLowerCase().includes(q)
    );
  }

  return rows;
}

async function renderView(view) {
  if (view === 'overview')  renderOverview();
  if (view === 'visitors')  renderVisitors();
  if (view === 'users')     renderUsers(getVisitorFilters().query);
  if (view === 'blocked')   renderBlocked(getVisitorFilters().query);
}

async function renderOverview() {
  // Fetch and cache
  state.allVisits = await DB.getVisitsWithUsers();
  const all = state.allVisits;
  const now = new Date();

  const today     = all.filter(v => sameDay(new Date(v.timestamp), now));
  const thisWeek  = all.filter(v => sameWeek(new Date(v.timestamp), now));
  const thisMonth = all.filter(v => sameMonth(new Date(v.timestamp), now));

  document.getElementById('stat-today').textContent  = today.length;
  document.getElementById('stat-week').textContent   = thisWeek.length;
  document.getElementById('stat-month').textContent  = thisMonth.length;
  document.getElementById('stat-total').textContent  = all.length;

  // Blocked badge
  const blockedUsers = await DB.getBlockedUsers();
  const badgeEl = document.getElementById('blocked-nav-count');
  if (badgeEl) {
    badgeEl.textContent = blockedUsers.length;
    badgeEl.style.display = blockedUsers.length > 0 ? 'inline-flex' : 'none';
  }

  // College chart
  const collegeCounts = {};
  CONFIG.colleges.forEach(c => collegeCounts[c] = 0);
  all.forEach(v => {
    const col = getVisitCollege(v);
    if (col && col !== '—') collegeCounts[col] = (collegeCounts[col] || 0) + 1;
  });
  const sorted = Object.entries(collegeCounts).sort((a, b) => b[1] - a[1]);

  const canvas = document.getElementById('college-chart');
  if (canvas) {
    if (collegeChart) collegeChart.destroy();
    collegeChart = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: sorted.map(([k]) => k),
        datasets: [{
          label: 'Visits',
          data: sorted.map(([,v]) => v),
          backgroundColor: sorted.map((_,i) => i%2===0 ? 'rgba(192,0,26,0.75)' : 'rgba(0,100,0,0.75)'),
          borderColor:      sorted.map((_,i) => i%2===0 ? 'rgba(232,0,31,1)'   : 'rgba(0,160,0,1)'),
          borderWidth: 1, borderRadius: 6, borderSkipped: false,
          maxBarThickness: 52, minBarLength: 4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1a1414', borderColor: 'rgba(192,0,26,0.4)', borderWidth: 1,
            titleColor: '#f0eded', bodyColor: '#8a7e7e',
            callbacks: { label: ctx => ` ${ctx.parsed.y} visit${ctx.parsed.y!==1?'s':''}` }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8a7e7e', font: { family: 'DM Sans', size: 11 } } },
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8a7e7e', font: { family: 'DM Sans', size: 11 }, stepSize: 1, precision: 0 } }
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
  Object.entries(purposeCounts).sort((a,b)=>b[1]-a[1]).forEach(([p,c]) => {
    pbEl.insertAdjacentHTML('beforeend', `
      <div class="purpose-bar-row">
        <span class="purpose-bar-label">${p}</span>
        <div class="purpose-bar-track"><div class="purpose-bar-fill" style="width:${(c/max)*100}%"></div></div>
        <span class="purpose-bar-count">${c}</span>
      </div>`);
  });
  if (!Object.keys(purposeCounts).length) pbEl.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No data yet.</p>';

  // Recent table
  const tbody = document.getElementById('recent-tbody');
  tbody.innerHTML = '';
  if (!all.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:32px">No visits recorded yet</td></tr>';
    return;
  }
  all.slice(0, 10).forEach(v => tbody.insertAdjacentHTML('beforeend', visitRow(v)));
}

async function renderVisitors() {
  // Load fresh data if cache is empty
  if (!state.allVisits.length) state.allVisits = await DB.getVisitsWithUsers();

  const filters = getVisitorFilters();
  const filtered = applyVisitorFilters(state.allVisits, filters);

  const tbody = document.getElementById('visitors-tbody');
  const empty = document.getElementById('visitors-empty');
  tbody.innerHTML = '';
  if (!filtered.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  filtered.forEach(v => tbody.insertAdjacentHTML('beforeend', visitRow(v)));
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
    const count    = visitCount[u.id] || 0;
    const last     = lastVisit[u.id] ? formatDate(new Date(lastVisit[u.id])) : '—';
    const isAdmin  = CONFIG.adminEmails.map(e => e.toLowerCase()).includes(u.email?.toLowerCase());
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>
          ${esc(u.name)}
          ${isAdmin ? '<span class="admin-tag"><i class="fas fa-shield-halved"></i> Admin</span>' : ''}
        </td>
        <td style="color:var(--text-muted);font-size:12px">${esc(u.email||u.rfid||'—')}</td>
        <td>${esc(u.college||'—')}</td>
        <td>
          ${u.saved_role
            ? `<span class="role-pill ${u.saved_role.toLowerCase()}">${esc(u.saved_role)}</span>`
            : '<span style="color:var(--text-dim)">—</span>'}
        </td>
        <td style="font-family:var(--font-head);font-weight:700">${count}</td>
        <td style="color:var(--text-muted);font-size:12px">${last}</td>
        <td><span class="status-pill ${u.blocked?'blocked':'active'}">${u.blocked?'Blocked':'Active'}</span></td>
        <td class="actions-cell">
          <button class="action-btn edit" data-id="${u.id}"><i class="fas fa-pen"></i></button>
          ${u.blocked
            ? `<button class="action-btn unblock" data-id="${u.id}">Unblock</button>`
            : `<button class="action-btn block"   data-id="${u.id}">Block</button>`}
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
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${esc(u.name)}</td>
        <td style="color:var(--text-muted);font-size:12px">${esc(u.email||u.rfid||'—')}</td>
        <td>${esc(u.college)}</td>
        <td style="font-family:var(--font-head);font-weight:700">${visitCount[u.id]||0}</td>
        <td><span class="status-pill blocked">Blocked</span></td>
        <td><button class="action-btn unblock" data-id="${u.id}">Unblock</button></td>
      </tr>`);
  });
}


// Returns the correct college — derived from program if available, else user's stored college
function getVisitCollege(v) {
  if (v.program && CONFIG.programCollegeMap[v.program]) {
    return CONFIG.programCollegeMap[v.program];
  }
  return v.user?.college || '—';
}

function visitRow(v) {
  const u = v.user;
  const d = new Date(v.timestamp);
  return `
    <tr>
      <td>${esc(u?.name||'—')}</td>
      <td style="color:var(--text-muted);font-size:12px">${esc(u?.email||u?.rfid||'—')}</td>
      <td>${esc(getVisitCollege(v))}</td>
      <td>${v.role ? `<span class="role-pill ${v.role.toLowerCase()}">${esc(v.role)}</span>` : '—'}</td>
      <td>${esc(v.purpose)}</td>
      <td style="color:var(--text-muted);font-size:12px">${esc(v.program||'—')}</td>
      <td style="color:var(--text-muted);font-size:12px">${formatDate(d)} ${formatTime(d)}</td>
      <td><span class="status-pill ${u?.blocked?'blocked':'active'}">${u?.blocked?'Blocked':'Active'}</span></td>
    </tr>`;
}

// ══════════════════════════════════════════════════
// ── BLOCK / UNBLOCK ──────────────────────────────
// ══════════════════════════════════════════════════

document.addEventListener('click', e => {
  const blockBtn   = e.target.closest('.action-btn.block');
  const unblockBtn = e.target.closest('.action-btn.unblock');
  if (blockBtn)   { state.pendingBlockId   = blockBtn.dataset.id;   document.getElementById('modal-block').classList.remove('hidden'); }
  if (unblockBtn) { state.pendingUnblockId = unblockBtn.dataset.id; document.getElementById('modal-unblock').classList.remove('hidden'); }
});

document.getElementById('modal-confirm-block').addEventListener('click', async () => {
  if (state.pendingBlockId) {
    await DB.toggleBlock(state.pendingBlockId);
    state.pendingBlockId = null;
    document.getElementById('modal-block').classList.add('hidden');
    state.allVisits = []; // invalidate cache
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
    state.allVisits = [];
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
// ── EDIT USER MODAL ──────────────────────────────
// ══════════════════════════════════════════════════

document.addEventListener('click', e => {
  const editBtn = e.target.closest('.action-btn.edit');
  if (!editBtn) return;
  openEditModal(editBtn.dataset.id);
});

async function openEditModal(userId) {
  const users = await DB.getUsers();
  const u = users.find(u => u.id === userId);
  if (!u) return;

  document.getElementById('edit-user-id').value  = u.id;
  document.getElementById('edit-name').value      = u.name || '';
  document.getElementById('edit-email').value     = u.email || '';
  document.getElementById('edit-college').value   = u.college || '';
  document.getElementById('edit-role').value      = u.saved_role || '';
  document.getElementById('edit-program').value   = u.saved_program || '';
  document.getElementById('edit-is-admin').checked = u.is_admin === true;

  document.getElementById('modal-edit-user').classList.remove('hidden');
}

document.getElementById('modal-edit-cancel')?.addEventListener('click', () => {
  document.getElementById('modal-edit-user').classList.add('hidden');
});

document.getElementById('modal-edit-save')?.addEventListener('click', async () => {
  const userId     = document.getElementById('edit-user-id').value;
  const name       = document.getElementById('edit-name').value.trim();
  const email      = document.getElementById('edit-email').value.trim();
  const college    = document.getElementById('edit-college').value;
  const savedRole  = document.getElementById('edit-role').value;
  const savedProg  = document.getElementById('edit-program').value.trim();
  const makeAdmin  = document.getElementById('edit-is-admin').checked;

  if (!name) { showToast('Name is required.', 'error'); return; }

  const btn = document.getElementById('modal-edit-save');
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Saving…';

  const updates = {
    name,
    email:         email || null,
    college:       college || null,
    saved_role:    savedRole || null,
    saved_program: savedProg || null,
  };

  const updated = await DB.updateUser(userId, updates);

  // Handle admin toggle — save to Supabase so it persists
  await DB.setAdminStatus(userId, makeAdmin);
  // Also include is_admin in the user update
  updates.is_admin = makeAdmin;

  btn.disabled = false;
  btn.querySelector('span').textContent = 'Save Changes';
  document.getElementById('modal-edit-user').classList.add('hidden');

  if (updated) {
    state.allVisits = []; // invalidate cache
    renderView(state.currentView);
    showToast(`${name}'s profile updated.`, 'success');
  } else {
    showToast('Failed to save changes.', 'error');
  }
});

// ══════════════════════════════════════════════════
// ── EVENT BINDINGS ───────────────────────────────
// ══════════════════════════════════════════════════

// Landing
document.getElementById('btn-landing-enter').addEventListener('click', () => showScreen('login'));
document.getElementById('btn-landing-admin').addEventListener('click', () => showScreen('admin-login'));
document.getElementById('btn-back-to-landing').addEventListener('click', () => showScreen('landing'));
document.getElementById('btn-back-admin-to-landing').addEventListener('click', () => showScreen('landing'));

// Login tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.activeTab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b===btn));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id==='tab-'+btn.dataset.tab));
    document.getElementById('login-error').classList.add('hidden');
    document.getElementById('login-suggestions')?.classList.add('hidden');
  });
});

// Login input suggestions
document.getElementById('login-email').addEventListener('input', e => {
  clearTimeout(suggestionTimer);
  suggestionTimer = setTimeout(() => showLoginSuggestions(e.target.value), 300);
});
document.getElementById('login-rfid').addEventListener('input', e => {
  clearTimeout(suggestionTimer);
  suggestionTimer = setTimeout(() => showLoginSuggestions(e.target.value), 300);
});

document.getElementById('btn-login').addEventListener('click', handleLogin);
document.getElementById('login-email').addEventListener('keydown', e => { if (e.key==='Enter') handleLogin(); });
document.getElementById('login-rfid').addEventListener('keydown',  e => { if (e.key==='Enter') handleLogin(); });

// Role
document.querySelectorAll('.role-btn').forEach(btn => {
  btn.addEventListener('click', () => handleRoleSelect(btn.dataset.role));
});
document.getElementById('btn-back-role').addEventListener('click', () => {
  state.selectedRole = null; state.currentUser = null;
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
  showScreen('login');
});

// Program
document.getElementById('btn-confirm-program').addEventListener('click', handleProgramConfirm);
document.getElementById('btn-back-program').addEventListener('click', () => {
  state.selectedProgram = null;
  document.querySelectorAll('.program-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('btn-confirm-program').disabled = true;
  showScreen('role');
});

// Purpose
document.querySelectorAll('.purpose-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.purpose-btn').forEach(b => b.classList.remove('selected'));
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
  showScreen(state.selectedRole === 'Employee' ? 'role' : 'program');
});

// Welcome
document.getElementById('btn-welcome-done').addEventListener('click', () => {
  clearTimeout(state.welcomeTimer); resetToLogin();
});

// Admin login (no password)
document.getElementById('btn-admin-submit').addEventListener('click', handleAdminLogin);
document.getElementById('admin-email').addEventListener('keydown', e => { if (e.key==='Enter') handleAdminLogin(); });
document.getElementById('btn-back-to-visitor').addEventListener('click', () => showScreen('login'));
document.getElementById('btn-admin-logout').addEventListener('click', handleAdminLogout);

// Sidebar nav
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => { e.preventDefault(); showDashView(item.dataset.view); });
});

// Dashboard search with suggestions
let dashSearchTimer;
document.getElementById('dash-search').addEventListener('input', e => {
  clearTimeout(dashSearchTimer);
  const q = e.target.value;
  dashSearchTimer = setTimeout(() => {
    showDashSearchSuggestions(q);
    renderView(state.currentView);
  }, 250);
});

// Clear button
document.getElementById('btn-clear-filter').addEventListener('click', () => {
  document.getElementById('dash-search').value = '';
  document.getElementById('dash-search-suggestions')?.classList.add('hidden');
  renderView(state.currentView);
});

// Quick filter buttons
document.querySelectorAll('.quick-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.quick-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeQuickFilter = btn.dataset.quick;
    // Clear date range when using quick filter
    const df = document.getElementById('date-from');
    const dt = document.getElementById('date-to');
    if (df) df.value = '';
    if (dt) dt.value = '';
    renderVisitors();
  });
});

// Advanced filter apply/reset
document.getElementById('btn-apply-filter')?.addEventListener('click', () => {
  // Reset quick filter to 'all' when using advanced
  state.activeQuickFilter = 'all';
  document.querySelectorAll('.quick-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.quick==='all'));
  renderVisitors();
});
document.getElementById('btn-reset-filter')?.addEventListener('click', () => {
  document.getElementById('date-from').value = '';
  document.getElementById('date-to').value   = '';
  document.getElementById('dash-role-filter').value    = '';
  document.getElementById('dash-purpose-filter').value = '';
  document.getElementById('dash-college-filter').value = '';
  document.getElementById('dash-search').value = '';
  state.activeQuickFilter = 'all';
  document.querySelectorAll('.quick-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.quick==='all'));
  renderVisitors();
});

// Dropdown filters live update
['dash-role-filter','dash-purpose-filter','dash-college-filter'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', () => renderVisitors());
});

// Google Auth buttons
document.getElementById('btn-google-visitor')?.addEventListener('click', () => signInWithGoogle('visitor'));
document.getElementById('btn-google-admin')?.addEventListener('click',   () => signInWithGoogle('admin'));

// ══════════════════════════════════════════════════
// ── INIT ─────────────────────────────────────────
// ══════════════════════════════════════════════════

startClock();
initQuotes();
// Load admin emails from DB then show landing
DB.loadAdminEmails().then(() => {
  loadLandingStats();
});

// Check if returning from Google OAuth redirect
handleAuthCallback().then(wasCallback => {
  if (!wasCallback) {
    showScreen('landing');
  }
});
