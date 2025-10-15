import React, { useState, useEffect, useMemo, useCallback } from "react";
import JobForm from "./components/JobForm";
import JobList from "./components/JobList";
import ApplicationTrends from "./components/ApplicationTrends";
import DemoBanner from "./components/DemoBanner";
import PersonalBanner from "./components/PersonalBanner";
import OnboardingModal from "./components/OnboardingModal";
import ModeBadge from "./components/ModeBadge";
import { useMode } from "./context/ModeContext";
import { MODES, createStoreForMode } from "./storage/selectStore";
import SettingsDrawer from "./components/SettingsDrawer";
import { DATA_EXPORT_VERSION, exportBundleSchema } from "./storage/store";
import mockJobs from "./mock/jobs.sample.json";

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

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    if (stored === "true") return true;
    if (stored === "false") return false;
    return true;
  }); // New state for dark mode
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [store, setStore] = useState(null);
  const [lastBackupAt, setLastBackupAt] = useState(null);
  const [showPersonalBanner, setShowPersonalBanner] = useState(() => {
    const stored = localStorage.getItem("joblog_personal_banner_hidden_v1");
    return stored !== "true";
  });

  const { mode, apiKey, needsOnboarding, setMode } = useMode();
  const isDemoMode = mode === MODES.DEMO;

  const handleCreateJob = useCallback(
    async (jobPayload) => {
      if (!store) return null;
      try {
        return await store.createJob(jobPayload);
      } catch (error) {
        console.error("Failed to create job:", error);
        throw error;
      }
    },
    [store]
  );

  const handleUpdateJob = useCallback(
    async (id, patch) => {
      if (!store) return null;
      try {
        return await store.updateJob(id, patch);
      } catch (error) {
        console.error("Failed to update job:", error);
        throw error;
      }
    },
    [store]
  );

  const handleDeleteJob = useCallback(
    async (id) => {
      if (!store) return;
      try {
        await store.deleteJob(id);
      } catch (error) {
        console.error("Failed to delete job:", error);
        throw error;
      }
    },
    [store]
  );

  const handleResetDemo = async () => {
    if (!store) return;
    try {
      await store.reset();
    } catch (error) {
      console.error("Failed to reset demo data:", error);
    }
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

  const handleExportJson = useCallback(async () => {
    if (!store) return;
    if (mode === MODES.ADMIN) {
      console.warn("Export JSON is disabled in admin mode.");
      return;
    }
    try {
      const bundle = await store.exportData();
      downloadFile(
        `joblog-backup-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(bundle, null, 2),
        "application/json"
      );
      if (mode === MODES.LOCAL) {
        const timestamp = new Date().toISOString();
        await store.setMeta?.("lastBackupAt", timestamp);
        setLastBackupAt(timestamp);
      }
    } catch (error) {
      console.error("Failed to export JSON:", error);
    }
  }, [mode, store]);

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
    if (!store) {
      throw new Error("Storage is not ready yet. Try again in a moment.");
    }
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
    await store.importData(bundle);
  };

  const handleClearData = async () => {
    if (!store || mode === MODES.ADMIN) return;
    if (
      !window.confirm(
        "This will remove all entries in the current mode. Continue?"
      )
    ) {
      return;
    }
    try {
      if (mode === MODES.DEMO) {
        await store.reset();
      } else {
        await store.clear();
        await store.setMeta?.("lastBackupAt", null);
        setLastBackupAt(null);
      }
    } catch (error) {
      console.error("Failed to clear data:", error);
    }
  };

  const backupReminder = useMemo(() => {
    if (mode !== MODES.LOCAL) return null;
    if (!lastBackupAt) {
      return {
        title: "Create your first backup",
        message:
          "Export a JSON backup to keep a copy of your job history outside this browser.",
        actionLabel: "Export JSON now",
        onAction: handleExportJson,
      };
    }
    const lastBackupDate = new Date(lastBackupAt);
    if (Number.isNaN(lastBackupDate.getTime())) return null;
    const diffDays = Math.floor(
      (Date.now() - lastBackupDate.getTime()) / MS_PER_DAY
    );
    if (diffDays <= 30) return null;
    return {
      title: "Backup reminder",
      message: `Last backup was ${diffDays} days ago. Export a fresh copy to stay protected.`,
      actionLabel: "Export JSON",
      onAction: handleExportJson,
    };
  }, [handleExportJson, lastBackupAt, mode]);

  useEffect(() => {
    const seedJobs = mode === MODES.DEMO ? createAlignedDemoSeed() : undefined;
    const newStore = createStoreForMode({
      mode,
      apiKey,
      seedJobs,
    });
    setStore(newStore);
  }, [mode, apiKey]);

  useEffect(() => {
    if (!store) return;
    let cancelled = false;
    setLoading(true);
    store
      .load()
      .then((initialJobs) => {
        if (!cancelled) {
          setJobs(initialJobs);
        }
      })
      .catch((error) =>
        console.error("Error loading jobs for current mode:", error)
      )
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    const unsubscribe = store.subscribe((nextJobs) => {
      if (!cancelled) {
        setJobs(nextJobs);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [store]);

  useEffect(() => {
    if (!store || mode !== MODES.LOCAL) {
      setLastBackupAt(null);
      return;
    }
    let cancelled = false;
    store
      .getMeta?.("lastBackupAt")
      ?.then((value) => {
        if (!cancelled) {
          setLastBackupAt(value || null);
        }
      })
      .catch((error) =>
        console.error("Failed to read backup metadata:", error)
      );
    return () => {
      cancelled = true;
    };
  }, [store, mode]);

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
              className={`text-sm border px-3 py-1 rounded transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-accent dark:focus-visible:ring-dark-accent ${
                darkMode
                  ? "border-dark-accent text-dark-accent hover:bg-dark-card hover:text-white dark:hover:border-dark-accent dark:hover:shadow-[0_0_14px_#22d3ee]"
                  : "border-light-accent text-light-accent hover:bg-light-accent hover:text-white"
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`text-sm border px-3 py-1 rounded transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-accent dark:focus-visible:ring-dark-accent ${
                darkMode
                  ? "border-dark-accent text-dark-accent hover:text-white hover:bg-dark-card dark:hover:border-dark-accent dark:hover:shadow-[0_0_14px_#22d3ee]"
                  : "border-light-accent text-light-accent hover:bg-light-accent hover:text-white"
              }`}
            >
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>
      </div>

      {isDemoMode && <DemoBanner onReset={handleResetDemo} />}
      {mode === MODES.LOCAL && showPersonalBanner && (
        <PersonalBanner
          onDismiss={() => {
            setShowPersonalBanner(false);
            localStorage.setItem("joblog_personal_banner_hidden_v1", "true");
          }}
        />
      )}

      <JobForm onCreateJob={handleCreateJob} mode={mode} />
      <ApplicationTrends jobs={jobs} />
      <JobList
        jobs={jobs}
        mode={mode}
        onUpdateJob={handleUpdateJob}
        onDeleteJob={handleDeleteJob}
      />

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        mode={mode}
        onSelectMode={(nextMode) => {
          if (nextMode && nextMode !== mode) {
            setMode(nextMode);
          }
        }}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onExportCsv={handleExportCsv}
        onClearData={handleClearData}
        reminder={backupReminder}
      />
      <OnboardingModal open={needsOnboarding} onSelect={setMode} />
    </div>
  );
}

export default App;
