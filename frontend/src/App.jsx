import React, { useState, useEffect } from "react";
import axios from "axios";
import JobForm from "./components/JobForm";
import JobList from "./components/JobList";
import ApplicationTrends from "./components/ApplicationTrends";

function App() {
  const [jobs, setJobs] = useState([]);

  const handleJobAdded = (newJob) => {
    setJobs((prev) => [...prev, newJob]);
  };

  useEffect(() => {
    axios
      .get("https://joblog-api.onrender.com/jobs/")
      .then((response) => setJobs(response.data))
      .catch((error) => console.error("Error fetching jobs:", error));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6">Job Tracker</h1>
      <JobForm onJobAdded={handleJobAdded} />
      <ApplicationTrends jobs={jobs} />
      <JobList jobs={jobs} setJobs={setJobs} />
    </div>
  );
}

export default App;