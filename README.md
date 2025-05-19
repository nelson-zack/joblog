# Job Application Tracker

A full-stack web app to track, organize, and analyze job applications — and the job tracker I personally use.

## ✨ Features (Completed)
- ✅ Add new job applications via form
- ✅ View all job applications in a clean UI
- ✅ Delete applications from the list
- ✅ Display job tags as styled pill badges
- ✅ Filter jobs by status and tag
- ✅ React frontend communicates with FastAPI backend using Axios
- ✅ Backend stores jobs in a PostgreSQL database using SQLAlchemy ORM
- ✅ Tailwind CSS used for modern, responsive styling
- ✅ Fully deployed frontend and backend

## 🚧 Features In Progress / Planned
- ✏️ Edit job tags (status and notes editing is already live)
- 📊 Analytics dashboard (total applied, interviews, offer rate)
- 🤖 AI tools for summarizing job descriptions and generating cover letters
- ☁️ Admin UI and export to CSV

## 🔗 Live Demo

- **Frontend**: https://joblog-app.vercel.app  
- **Backend API**: https://joblog-api.onrender.com

## 🛠 Tech Stack
- **Frontend:** React + Tailwind CSS (Vite)
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (Render), SQLite (local dev)
- **Dev Tools:** Axios, GitHub, VS Code
- **Deployment:** Vercel (frontend) + Render (backend + DB)

---

## ✅ Getting Started (Local Dev)

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
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── components/
│       │   ├── JobForm.jsx
│       │   └── JobList.jsx
│       ├── App.jsx
│       └── index.css
└── README.md
```

## 📅 Milestone Plan

### ✅ Week 1 – MVP
- Basic CRUD (add/delete jobs)
- React + FastAPI + SQLite local setup

### ✅ Week 2 – UI Polish & Filtering
- Tailwind styling + layout cleanup
- Tag pill display
- Status + tag filtering

### ✅ Week 3 – “Wow” Features
- Deployed frontend (Vercel) + backend (Render)
- Switched backend to PostgreSQL with persistent storage
- Improved README for portfolio visibility

## 💼 Portfolio Write-up

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

I use this tool personally and will continue building on it (analytics, CSV export, OpenAI integration) as part of my ongoing growth.