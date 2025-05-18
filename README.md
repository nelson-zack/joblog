# Job Application Tracker

A full-stack web app to track, organize, and analyze job applications.

## ✨ Features (Completed)
- ✅ Add new job applications via form
- ✅ View all job applications in a clean UI
- ✅ Delete applications from the list
- ✅ React frontend communicates with FastAPI backend using Axios
- ✅ Backend stores jobs in SQLite using SQLAlchemy ORM

## 🚧 Features In Progress / Planned
- Edit existing job entries (status, notes)
- Filter by status or date
- Analytics dashboard (total applied, offer rate, etc.)
- AI tools for job description summaries and cover letter drafts
- Deployment to Vercel (frontend) and Render (backend)

## 🛠 Tech Stack
- **Frontend:** React + Tailwind CSS (Vite)
- **Backend:** FastAPI (Python)
- **Database:** SQLite (local), PostgreSQL (future production)
- **Dev Tools:** Axios, GitHub, VS Code
- **Deployment (Planned):** Vercel + Render

---

## ✅ Getting Started

### Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
App runs at: http://localhost:5173
Backend API at: http://localhost:8000/docs

### 📁 Folder Structure
```bash
job-app-tracker/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── JobList.jsx
│       │   └── JobForm.jsx
│       └── App.jsx
└── README.md
```

## 📅 Milestone Plan

### Week 1 – MVP
- ✅ Basic CRUD (add/delete)
- ✅ React + FastAPI + SQLite local setup

### Week 2 – UI Polish & Filtering
- Edit, filter, tag support
- Deployment setup

### Week 3 – “Wow” Features
- Analytics
- AI Assistant tools (OpenAI)