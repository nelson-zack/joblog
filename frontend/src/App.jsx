import React, { useState, useEffect } from "react";
import axios from "axios";
import JobForm from "./components/JobForm";
import JobList from "./components/JobList";
import ApplicationTrends from "./components/ApplicationTrends";

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  }); // New state for dark mode

  // Extract API key from URL query string
  const apiKey = new URLSearchParams(window.location.search).get("key");

  const handleJobAdded = (newJob) => {
    setJobs((prev) => [...prev, newJob]);
  };

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/jobs/`)
      .then((response) => setJobs(response.data))
      .catch((error) => console.error("Error fetching jobs:", error))
      .finally(() => setLoading(false));
  }, []);

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

      <JobForm onJobAdded={handleJobAdded} apiKey={apiKey} />
      <ApplicationTrends jobs={jobs} />
      <JobList jobs={jobs} setJobs={setJobs} apiKey={apiKey} />

      {!apiKey && (
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <span className="inline-block bg-light-tag-remoteBg text-light-accent dark:bg-dark-card dark:text-dark-tag-text px-3 py-1 rounded border border-light-accent">
            Demo mode: editing requires admin access
          </span>
        </div>
      )}
    </div>
  );
}

export default App;