import React, { useState } from "react";
import JobForm from "./components/JobForm";
import JobList from "./components/JobList";

function App() {
  const [jobs, setJobs] = useState([]);

  const handleJobAdded = (newJob) => {
    setJobs((prev) => [...prev, newJob]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6">Job Tracker</h1>
      <JobForm onJobAdded={handleJobAdded} />
      <JobList jobs={jobs} setJobs={setJobs} />
    </div>
  );
}

export default App;