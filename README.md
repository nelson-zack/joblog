# Job Log

A full-stack web app to track, organize, and analyze job applications — and the job tracker I personally use.

## Features (Completed)

- Add new job applications via form
- View all job applications in a clean UI
- Delete applications from the list
- Display job tags as styled pill badges
- Edit job status, notes, and tags
- Filter jobs by status and tag
- Export applications to CSV
- 7-day application trend chart (Bar graph)
- Status history tracking (every status change is logged)
- Enhanced analytics (based on full status history, not just current state)
- Multi-mode support: Admin (API), Personal (IndexedDB), and Demo (sessionStorage) with onboarding chooser
- Mode badge, inline banners, and backup reminders so visitors always know which mode they are using, how data is stored, and how to stay safe
- Loading spinner during backend startup (Render cold start)
- React frontend communicates with FastAPI backend using Axios
- Backend stores jobs in a PostgreSQL database using SQLAlchemy ORM
- Tailwind CSS used for modern, responsive styling
- Light and dark themes use distinct font, color, and tag styles for cohesive design
- Custom dark mode theme styled to match personal portfolio design
- User theme toggle with localStorage persistence and system sync
- Auto-sync with system theme preference
- Fully deployed frontend and backend (Vercel + Render)
  - Automatic normalization of job dates, tags, and status history entries to ensure consistent formatting in both frontend and backend.
  - Tag deduplication logic prevents repeated tags on the same job.
  - Unified input field styling across all form elements, including a styled date picker with calendar icon and consistent focus states matching the light/dark theme accents.
  - Improved job status tracking:
    - Distinguishes between companies interviewed and interview rounds
    - Added UI controls (+/−) to adjust interview rounds with preview
    - Prevents auto-increment of interview rounds when switching to Interview status
  - Cleaner wording and consistency in job statuses and history entries (e.g., "Interview Round(s):" pluralized automatically, "Offered on"/"Rejected on" with explicit dates)
  - Entries sorted newest to oldest at the day level, and newest first within each day
  - Location tags expanded to include Remote, Hybrid, and On-Site with unified pill styling

## Features In Progress / Planned

- Monthly trend analytics
- Interview/offer timeline graphs
- AI tools for summarizing job descriptions and generating cover letters
- CSV import for bulk uploads
- Additional analytics (e.g., per-company interview round counts, timeline visualizations)

## Live Demo

- **Frontend**: https://joblog.zacknelson.dev
- **Backend API**: https://joblog-api.onrender.com

## Modes

- **Personal (Local)** — When no `?key=` is present and you choose *Personal* on first launch, JobLog stores everything privately in IndexedDB. Changes persist across browser sessions, you can export/import JSON backups, and nothing is synced or uploaded. Dismissible reminders keep users aware of backup best practices.
- **Public Demo** — Also available without a key. Choose *Demo* to load a curated dataset (dates dynamically align with “last 7 days” for believable analytics). Data lives in `sessionStorage`, so it disappears when the tab closes or when you hit Reset Demo. A dashed amber banner reinforces that the data is ephemeral.
- **Admin (Private)** — Visiting with a valid `?key=...` keeps the original server-backed behavior: FastAPI, PostgreSQL, and all real data. This is how the private production instance continues to track 250+ applications.

An onboarding modal guides first-time visitors without keys. You can revisit the choice from the Settings drawer.

### Privacy & Backups

- Local/Demo modes never fire axios/fetch calls; they only interact with browser storage.
- Personal mode offers a backup reminder if you haven’t exported in 30+ days. Use **Settings → Export JSON** to capture versioned backups or **Import JSON** to restore, and you can re-show the reminder anytime from Settings.
- CSV export is available in Settings for quick sharing, but remember that personal mode has no cross-device sync yet—you’ll need to import your JSON backup on another device manually.

## Anonymous Analytics

To understand how JobLog is used (and only when analytics aren’t disabled or blocked by your browser), the app sends a single anonymous “heartbeat” on launch and optional aggregate events. Each browser install gets a random UUID that never leaves the device except as that anonymous identifier.

We collect:

- Install UUID, first/last seen timestamps, current mode (`demo|local|admin`), app version, and a launch counter.
- Optional aggregate events: `job_create`, `job_update`, `job_delete`, `export_json`, `import_json`.

We **do not** collect job content, company names, personal data, IP addresses, or user-agent strings. Data is never shared outside the JobLog project, and only admin sessions (`?key=...`) can view the aggregate dashboard.

### Opting out

- Analytics are disabled automatically if your browser’s **Do Not Track** / Global Privacy Control setting is enabled.
- You can toggle telemetry off at any time under **Settings → Disable anonymous analytics**. The toggle persists locally and stops all future heartbeats/events.
- Want to see the disclosure again? Use the same settings panel to re-show the personal-mode reminder banner.

## Tech Stack

- **Frontend:** React + Tailwind CSS (Vite)
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (Render), SQLite (local dev)
- **Dev Tools:** Axios, GitHub, VS Code, Chart.js
- **Deployment:** Vercel (frontend) + Render (backend + DB)
- UptimeRobot pings the backend every 30 seconds to prevent cold starts and ensure fast response times

---

## Getting Started (Local Dev)

### Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Create a .env file inside /backend with:

```bash
API_KEY=your_secret_key_here
```

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

App runs at: http://localhost:5173
Backend API at: http://localhost:8000/docs

### Debugging Timezones Locally

You can simulate different "current times" in the frontend using the `debugNow` query parameter.  
Example:

```
http://localhost:5173/?debugNow=2025-08-28T19:30:00
```

This is useful for testing how the 7-day trend chart buckets applications across days and verifying that date rollovers align with your local timezone. In production, this parameter is ignored.

### Folder Structure

```bash
joblog/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── components/
│       │   ├── JobForm.jsx
│       │   ├── JobList.jsx
│       │   └── ApplicationTrends.jsx
│       ├── App.jsx
│       └── index.css
└── README.md
```

## Milestone Plan

### Week 1 – MVP

- Basic CRUD (add/delete jobs)
- React + FastAPI + SQLite local setup

### Week 2 – UI Polish & Filtering

- Tailwind styling + layout cleanup
- Tag pill display
- Status + tag filtering

### Week 3 – “Wow” Features

- Deployed frontend (Vercel) + backend (Render)
- Switched backend to PostgreSQL with persistent storage
- Added analytics dashboard (stats + bar chart)
- Export to CSV
- API key-based write protection
- Improved README for portfolio visibility

## Portfolio Write-up

I built this project to manage my real job applications and track my career outreach in a clean, centralized tool. I wanted something lightweight, easy to use, and built with tools I’m learning professionally.

**What I used:**  
React (Vite) for the frontend, FastAPI for the backend, and PostgreSQL for persistent storage. I used Tailwind CSS to keep the styling efficient and modern.

**What I learned:**

- End-to-end full-stack deployment using Vercel + Render
- Working with Axios, `useEffect`, form state, and controlled inputs in React
- Creating and consuming REST APIs with FastAPI
- Connecting FastAPI to PostgreSQL using SQLAlchemy ORM
- Handling CORS and async fetch logic
- Styling with Tailwind for clean, responsive UIs
- Creating basic data visualizations using Chart.js
- Exporting frontend state as downloadable CSV
- Using environment variables and API keys to protect write access
- Schema migrations and production-safe database updates
- Persistent status history implementation and frontend integration
- Implementing dark mode with Tailwind and persisting user preference with localStorage
- Designing custom light and dark mode themes with consistent color palettes and typography

I use this tool personally and will continue building on it as part of my ongoing growth. To improve performance and avoid cold starts, I set up a UptimeRobot ping monitor that keeps the backend service responsive.
