# 📚 NEU Library Visitor Log System

A web-based Library Monitoring System for New Era University, built with HTML, CSS, and JavaScript. Features a visitor kiosk for logging visits and an admin dashboard for monitoring.

---

## 🚀 Features

### Visitor Kiosk
- Login via **institutional email** (Google-based) or **RFID/ID number**
- Email validation — only accepts valid domain emails
- Select **purpose of visit** (Reading, Researching, Studying, Use of Computer, Group Study, Other)
- Warm **"Welcome to NEU Library!"** confirmation screen

### Admin Dashboard
- **Stats Cards** — Visitors today, this week, this month, all-time
- **College Breakdown** — Visits grouped by college
- **Purpose Breakdown** — Bar chart of visit purposes
- **Single search bar** — filter by name, email, college, purpose
- **Date filter** — filter log by specific date
- **Block/Unblock users** — admin control over visitor access
- **User Management** — view all registered users with visit history

---

## 🗄️ Database Setup (Supabase / PostgreSQL)

### Step 1 — Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up (free tier works)
2. Click **New Project** → fill in name, password, region
3. Wait ~2 minutes for provisioning

### Step 2 — Run the SQL Schema
1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Paste the entire contents of `supabase-schema.sql`
4. Click **Run** (green button)

This creates:
- `library_users` table — stores visitor accounts
- `library_visits` table — stores each visit log entry
- Views: `visit_log`, `daily_counts`, `college_counts`
- Row Level Security policies

### Step 3 — Get Your Credentials
1. Go to **Settings → API** in Supabase
2. Copy your **Project URL** (looks like `https://abcxyz.supabase.co`)
3. Copy the **anon (public) key**

### Step 4 — Connect the App
In `index.html`, **before** the `app.js` script, add:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-db.js"></script>
```

In `supabase-db.js`, replace:
```js
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

In `app.js`, replace all calls to `DB.xxx()` with `await SUPABASE_DB.xxx()` — see the integration guide below.

---

## 🌐 Hosting on GitHub Pages (Free)

### Step 1 — Create a GitHub Repository
1. Go to [github.com](https://github.com) → sign in
2. Click **New** (green button, top-left)
3. Name it: `neu-library-app` (or anything)
4. Set to **Public**, click **Create repository**

### Step 2 — Upload Your Files
**Option A — GitHub Web (easiest):**
1. Open your new repo
2. Click **Add file → Upload files**
3. Drag in: `index.html`, `style.css`, `app.js`, `supabase-db.js`
4. Click **Commit changes**

**Option B — Git CLI:**
```bash
# In your project folder:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/neu-library-app.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages
1. In your repo → **Settings** tab
2. Scroll to **Pages** (left sidebar)
3. Under **Source**: select `Deploy from a branch`
4. Branch: `main`, Folder: `/ (root)`
5. Click **Save**
6. Wait ~60 seconds — your URL will appear:
   ```
   https://YOUR_USERNAME.github.io/neu-library-app/
   ```

### Step 4 — Update Supabase CORS
1. In Supabase → **Settings → API → CORS Allowed Origins**
2. Add your GitHub Pages URL: `https://your-username.github.io`
3. Save

---

## 🔌 Other Database Options

If Supabase doesn't work for you, here are alternatives:

| Option | Type | Free Tier | Notes |
|--------|------|-----------|-------|
| **Supabase** | PostgreSQL (cloud) | ✅ 500MB | Best for this project |
| **Firebase Firestore** | NoSQL (cloud) | ✅ 1GB | Easy setup, JS SDK |
| **PocketBase** | SQLite (self-host) | ✅ Free | Run on your own server |
| **Turso** | SQLite (cloud) | ✅ 500MB | Edge SQLite, REST API |
| **Railway** | PostgreSQL (cloud) | ✅ 500MB | More control, needs backend |
| **XAMPP (local)** | MySQL (local) | ✅ Free | Needs PHP backend, local only |

### Firebase Alternative (Quick Setup)
```html
<!-- Add to index.html head -->
<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-app.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-firestore.js";
  const app = initializeApp({ /* your firebase config */ });
  window._db = getFirestore(app);
</script>
```
Then replace DB calls with Firestore `addDoc`, `getDocs`, `query`, etc.

---

## 🔐 Admin Login

Default credentials (change in `app.js` → `CONFIG.adminCredentials`):
- **Email:** `admin@neu.edu.ph`
- **Password:** `admin123`

For production, replace with proper Supabase Auth:
```js
const { data, error } = await _sb.auth.signInWithPassword({ email, password });
```

---

## 📁 File Structure

```
neu-library-app/
├── index.html          # Main HTML — all screens
├── style.css           # All styles
├── app.js              # App logic + localStorage DB
├── supabase-db.js      # Supabase integration layer
├── supabase-schema.sql # PostgreSQL schema to run in Supabase
└── README.md           # This file
```

---

## 🛠️ Customization

- **Valid email domains** — edit `CONFIG.validDomains` in `app.js`
- **Colleges** — edit `CONFIG.colleges` array
- **Visit purposes** — edit purpose buttons in `index.html` and the SQL `CHECK` constraint
- **Admin credentials** — edit `CONFIG.adminCredentials` (or use Supabase Auth)
- **Welcome screen timeout** — edit `CONFIG.welcomeTimeout` (ms)

---

## 📝 Notes

- The app currently uses **localStorage** as a mock database for demo purposes
- All data persists in the browser until cleared
- To switch to Supabase, follow Step 4 above
- The app works fully offline with localStorage — no backend required for the demo
