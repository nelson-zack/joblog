import React, { useState, useEffect } from "react";
import axios from "axios";
import JobForm from "./components/JobForm";
import JobList from "./components/JobList";
import ApplicationTrends from "./components/ApplicationTrends";

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Extract API key from URL query string
  const apiKey = new URLSearchParams(window.location.search).get("key");

  const handleJobAdded = (newJob) => {
    setJobs((prev) => [...prev, newJob]);
  };

  useEffect(() => {
    axios
      .get("https://joblog-api.onrender.com/jobs/")
      .then((response) => setJobs(response.data))
      .catch((error) => console.error("Error fetching jobs:", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 text-sm">Loading job data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6">Job Tracker</h1>
      <JobForm onJobAdded={handleJobAdded} apiKey={apiKey} />
      <ApplicationTrends jobs={jobs} />
      <JobList jobs={jobs} setJobs={setJobs} apiKey={apiKey} />
    </div>
  );
}

export default App;