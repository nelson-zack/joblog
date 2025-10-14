import React, { useState, useEffect } from "react";
import axios from "axios";
import JobForm from "./components/JobForm";
import JobList from "./components/JobList";
import ApplicationTrends from "./components/ApplicationTrends";
import DemoBanner from "./components/DemoBanner";
import mockJobs from "./mock/jobs.sample.json";

const DEMO_STORAGE_KEY = "joblog_demo_state_v1";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const cloneSeedJobs = () => JSON.parse(JSON.stringify(mockJobs));

const parseYMDToDate = (value) => {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateToYMD = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const shiftDateString = (value, offsetDays) => {
  const parsed = parseYMDToDate(value);
  if (!parsed) return value;
  parsed.setUTCDate(parsed.getUTCDate() + offsetDays);
  return formatDateToYMD(parsed);
};

const findLatestJobDate = (jobs) => {
  let latest = null;

  jobs.forEach((job) => {
    const jobDate = parseYMDToDate(job.date_applied);
    if (jobDate && (!latest || jobDate > latest)) {
      latest = jobDate;
    }

    if (Array.isArray(job.status_history)) {
      job.status_history.forEach((entry) => {
        const entryDate = parseYMDToDate(entry.date);
        if (entryDate && (!latest || entryDate > latest)) {
          latest = entryDate;
        }
      });
    }
  });

  return latest;
};

const alignJobsNearToday = (jobs) => {
  const latestDate = findLatestJobDate(jobs);
  if (!latestDate) return jobs;

  const now = new Date();
  const todayUTC = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );
  const diffDays = Math.floor((todayUTC - latestDate) / MS_PER_DAY);
  if (diffDays <= 0) return jobs;

  return jobs.map((job) => {
    const shiftedHistory = Array.isArray(job.status_history)
      ? job.status_history.map((entry) => ({
          ...entry,
          date: shiftDateString(entry.date, diffDays),
        }))
      : job.status_history;

    return {
      ...job,
      date_applied: shiftDateString(job.date_applied, diffDays),
      status_history: shiftedHistory,
    };
  });
};

const ensureRecentActivity = (jobs, daysWindow = 7) => {
  const today = new Date();
  const todayUTC = new Date(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  );

  const sortedByRecency = [...jobs].sort((a, b) => {
    const dateA = parseYMDToDate(a.date_applied) ?? 0;
    const dateB = parseYMDToDate(b.date_applied) ?? 0;
    return dateB - dateA;
  });

  sortedByRecency.slice(0, Math.min(daysWindow, sortedByRecency.length)).forEach((job, index) => {
    const targetDate = new Date(todayUTC);
    targetDate.setUTCDate(todayUTC.getUTCDate() - index);

    const currentDate = parseYMDToDate(job.date_applied);
    if (!currentDate) return;

    const diffDays = Math.floor((targetDate - currentDate) / MS_PER_DAY);
    if (diffDays === 0) return;

    job.date_applied = shiftDateString(job.date_applied, diffDays);
    if (Array.isArray(job.status_history)) {
      job.status_history = job.status_history.map((entry) => ({
        ...entry,
        date: shiftDateString(entry.date, diffDays),
      }));
    }
  });

  return jobs;
};

const createAlignedDemoSeed = () =>
  ensureRecentActivity(alignJobsNearToday(cloneSeedJobs()));

const loadDemoJobs = () => {
  if (typeof window === "undefined") {
    return createAlignedDemoSeed();
  }

  try {
    const raw = window.sessionStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return createAlignedDemoSeed();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : createAlignedDemoSeed();
  } catch (error) {
    console.warn("Failed to load demo jobs from sessionStorage:", error);
    return createAlignedDemoSeed();
  }
};

const saveDemoJobs = (jobs) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(jobs));
  } catch (error) {
    console.warn("Failed to save demo jobs to sessionStorage:", error);
  }
};

const resetDemoJobs = () => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DEMO_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to reset demo jobs in sessionStorage:", error);
  }
};

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  }); // New state for dark mode

  // Extract API key from URL query string
  const params = new URLSearchParams(window.location.search);
  const apiKey = params.get("key");
  const hasAdminKey = Boolean(apiKey);
  const isDemo = !hasAdminKey;

  const handleJobAdded = (newJob) => {
    setJobs((prev) => [...prev, newJob]);
  };

  const handleDemoAdd = (job) => {
    setJobs((prev) => {
      const next = [...prev, job];
      saveDemoJobs(next);
      return next;
    });
  };

  const handleDemoUpdate = (id, patch) => {
    setJobs((prev) => {
      const next = prev.map((job) =>
        job.id === id
          ? {
              ...job,
              ...patch,
            }
          : job
      );
      saveDemoJobs(next);
      return next;
    });
  };

  const handleDemoDelete = (id) => {
    setJobs((prev) => {
      const next = prev.filter((job) => job.id !== id);
      saveDemoJobs(next);
      return next;
    });
  };

  const handleResetDemo = () => {
    const seedJobs = createAlignedDemoSeed();
    resetDemoJobs();
    saveDemoJobs(seedJobs);
    setJobs(seedJobs);
  };

  useEffect(() => {
    if (hasAdminKey) {
      setLoading(true);
      axios
        .get(
          `${import.meta.env.VITE_API_BASE_URL}/jobs?key=${encodeURIComponent(
            apiKey
          )}`
        )
        .then((response) => setJobs(response.data))
        .catch((error) => console.error("Error fetching jobs:", error))
        .finally(() => setLoading(false));
      return;
    }

    const demoJobs = loadDemoJobs();
    setJobs(demoJobs);
    setLoading(false);
  }, [hasAdminKey, apiKey]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 text-sm">Loading job data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-background text-light-text dark:bg-dark-background dark:text-dark-text dark:font-mono p-8 transition-colors duration-500 ease-in-out">
      <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-sm p-6 mb-6 transition-colors duration-500">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Job Log</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="text-sm border px-3 py-1 rounded border-light-accent dark:border-dark-accent hover:bg-light-accent hover:text-white dark:hover:bg-dark-card dark:hover:shadow-[0_0_10px_#22d3ee] transition focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent"
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>

      {isDemo && <DemoBanner onReset={handleResetDemo} />}

      <JobForm
        onJobAdded={handleJobAdded}
        apiKey={apiKey}
        demoMode={isDemo}
        onDemoAdd={handleDemoAdd}
      />
      <ApplicationTrends jobs={jobs} />
      <JobList
        jobs={jobs}
        setJobs={setJobs}
        apiKey={apiKey}
        demoMode={isDemo}
        onDemoUpdate={handleDemoUpdate}
        onDemoDelete={handleDemoDelete}
      />

    </div>
  );
}

export default App;
