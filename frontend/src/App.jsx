import React, { useState, useEffect } from "react";
import axios from "axios";
import JobForm from "./components/JobForm";
import JobList from "./components/JobList";
import ApplicationTrends from "./components/ApplicationTrends";
import DemoBanner from "./components/DemoBanner";
import OnboardingModal from "./components/OnboardingModal";
import ModeBadge from "./components/ModeBadge";
import { useMode } from "./context/ModeContext";
import { MODES } from "./storage/selectStore";
import SettingsDrawer from "./components/SettingsDrawer";
import { DATA_EXPORT_VERSION, exportBundleSchema } from "./storage/store";
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

  const distribution = [3, 2, 2, 1, 1, 1, 1];
  const maxEntries = distribution
    .slice(0, daysWindow)
    .reduce((sum, count) => sum + count, 0);
  const targetCount = Math.min(sortedByRecency.length, maxEntries);

  let assigned = 0;
  for (let dayOffset = 0; dayOffset < daysWindow && assigned < targetCount; dayOffset++) {
    const countForDay = distribution[dayOffset] ?? 1;
    for (let i = 0; i < countForDay && assigned < targetCount; i++) {
      const job = sortedByRecency[assigned++];
      const currentDate = parseYMDToDate(job.date_applied);
      if (!currentDate) continue;

      const targetDate = new Date(todayUTC);
      targetDate.setUTCDate(todayUTC.getUTCDate() - dayOffset);

      const diffDays = Math.floor((targetDate - currentDate) / MS_PER_DAY);
      if (diffDays === 0) continue;

      job.date_applied = shiftDateString(job.date_applied, diffDays);
      if (Array.isArray(job.status_history)) {
        job.status_history = job.status_history.map((entry) => ({
          ...entry,
          date: shiftDateString(entry.date, diffDays),
        }));
      }
    }
  }

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
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { mode, apiKey, hasAdmin, needsOnboarding, setMode } = useMode();
  const isDemo = mode !== MODES.ADMIN;

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

  const downloadFile = (filename, content, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    if (mode === MODES.ADMIN) {
      console.warn("Export JSON is disabled in admin mode.");
      return;
    }
    const bundle = {
      version: DATA_EXPORT_VERSION,
      jobs,
    };
    downloadFile(
      `joblog-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(bundle, null, 2),
      "application/json"
    );
  };

  const handleExportCsv = () => {
    const headers = [
      "Title",
      "Company",
      "Status",
      "Date Applied",
      "Tags",
      "Notes",
      "Link",
    ];
    const rows = jobs.map((job) => [
      job.title,
      job.company,
      job.status,
      job.date_applied,
      job.tags,
      job.notes?.replace(/\n/g, " "),
      job.link,
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell || ""}"`).join(","))
      .join("\n");

    downloadFile(
      `joblog-export-${new Date().toISOString().slice(0, 10)}.csv`,
      csvContent,
      "text/csv;charset=utf-8;"
    );
  };

  const handleImportJson = async (text) => {
    if (mode === MODES.ADMIN) {
      throw new Error("Import is not available in admin mode.");
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      throw new Error("Invalid JSON: unable to parse file.");
    }
    const bundle = exportBundleSchema.parse(parsed);
    setJobs(bundle.jobs);
    saveDemoJobs(bundle.jobs);
  };

  const handleClearData = () => {
    if (mode === MODES.ADMIN) return;
    if (
      !window.confirm(
        "This will remove all entries in the current mode. Continue?"
      )
    ) {
      return;
    }
    if (mode === MODES.DEMO) {
      handleResetDemo();
    } else {
      setJobs([]);
      saveDemoJobs([]);
    }
  };

  useEffect(() => {
    if (hasAdmin) {
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
  }, [hasAdmin, apiKey]);

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
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Job Log</h1>
            <ModeBadge />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="text-sm border px-3 py-1 rounded border-light-accent text-light-accent transition hover:bg-light-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-light-accent dark:border-dark-accent dark:text-dark-accent dark:hover:bg-dark-card dark:hover:text-white"
            >
              Settings
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="text-sm border px-3 py-1 rounded border-light-accent dark:border-dark-accent hover:bg-light-accent hover:text-white dark:hover:bg-dark-card dark:hover:shadow-[0_0_10px_#22d3ee] transition focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent"
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
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

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        mode={mode}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onExportCsv={handleExportCsv}
        onClearData={handleClearData}
      />
      <OnboardingModal open={needsOnboarding} onSelect={setMode} />
    </div>
  );
}

export default App;
