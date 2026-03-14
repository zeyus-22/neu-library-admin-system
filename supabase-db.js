/* ══════════════════════════════════════════════════
   NEU Library — Supabase Integration Layer
   Replaces localStorage DB in app.js when connected
   
   HOW TO USE:
   1. Run supabase-schema.sql in your Supabase project
   2. Copy your Project URL and anon key below
   3. Add this script BEFORE app.js in index.html:
      <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
      <script src="supabase-db.js"></script>
   4. In app.js, replace the DB object with SUPABASE_DB
══════════════════════════════════════════════════ */

const SUPABASE_URL = 'https://ydozugjlltfzcukykwec.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlkb3p1Z2psbHRmemN1a3lrd2VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzE1MDcsImV4cCI6MjA4ODEwNzUwN30.-24nkr7dy8evVEdXnX6aWkNT7ozK1GdCALfCUXl5WYQ';
const { createClient } = supabase;
const _sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SUPABASE_DB = {

  // ── Find user by email or RFID ──────────────────
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

  // ── Create a new user ───────────────────────────
  async createUser(userData) {
    const { data, error } = await _sb
      .from('library_users')
      .insert([userData])
      .select()
      .single();
    if (error) { console.error('createUser:', error); return null; }
    return data;
  },

  // ── Log a visit ─────────────────────────────────
  async logVisit(userId, purpose) {
    const { data, error } = await _sb
      .from('library_visits')
      .insert([{ user_id: userId, purpose }])
      .select()
      .single();
    if (error) { console.error('logVisit:', error); return null; }
    return data;
  },

  // ── Get all visits with user details (for admin) ─
  async getVisitsWithUsers(filters = {}) {
    let query = _sb
      .from('visit_log')
      .select('*')
      .order('logged_at', { ascending: false });

    // Text search across multiple columns
    if (filters.search) {
      const s = filters.search.toLowerCase();
      query = query.or(`name.ilike.%${s}%,email.ilike.%${s}%,college.ilike.%${s}%,purpose.ilike.%${s}%`);
    }
    // Date filter
    if (filters.date) {
      query = query
        .gte('logged_at', `${filters.date}T00:00:00`)
        .lte('logged_at', `${filters.date}T23:59:59`);
    }
    const { data, error } = await query;
    if (error) { console.error('getVisitsWithUsers:', error); return []; }
    return data;
  },

  // ── Get all users ───────────────────────────────
  async getUsers(search = '') {
    let query = _sb.from('library_users').select('*');
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,college.ilike.%${search}%`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) { console.error('getUsers:', error); return []; }
    return data;
  },

  // ── Toggle block ────────────────────────────────
  async toggleBlock(userId) {
    // First get current state
    const { data: user } = await _sb
      .from('library_users')
      .select('blocked')
      .eq('id', userId)
      .single();
    if (!user) return null;

    const { data, error } = await _sb
      .from('library_users')
      .update({ blocked: !user.blocked })
      .eq('id', userId)
      .select()
      .single();
    if (error) { console.error('toggleBlock:', error); return null; }
    return data;
  },

  // ── Stats ────────────────────────────────────────
  async getStats() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Start of week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);

    // Start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayRes, weekRes, monthRes, totalRes] = await Promise.all([
      _sb.from('library_visits').select('id', { count: 'exact', head: true })
        .gte('logged_at', `${todayStr}T00:00:00`)
        .lte('logged_at', `${todayStr}T23:59:59`),
      _sb.from('library_visits').select('id', { count: 'exact', head: true })
        .gte('logged_at', startOfWeek.toISOString()),
      _sb.from('library_visits').select('id', { count: 'exact', head: true })
        .gte('logged_at', startOfMonth.toISOString()),
      _sb.from('library_visits').select('id', { count: 'exact', head: true }),
    ]);

    return {
      today: todayRes.count || 0,
      week:  weekRes.count  || 0,
      month: monthRes.count || 0,
      total: totalRes.count || 0,
    };
  },

  // ── College breakdown ─────────────────────────── 
  async getCollegeCounts() {
    const { data, error } = await _sb.from('college_counts').select('*');
    if (error) { console.error('getCollegeCounts:', error); return []; }
    return data;
  },
};

// Export for use in app.js
window.SUPABASE_DB = SUPABASE_DB;
