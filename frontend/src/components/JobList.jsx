import React, { useEffect } from "react";
import axios from "axios";

const JobList = ({ jobs, setJobs }) => {
  useEffect(() => {
    axios.get("http://localhost:8000/jobs/")
      .then((response) => setJobs(response.data))
      .catch((error) => console.error("Error fetching jobs:", error));
  }, []);

  const handleDelete = (id) => {
    axios
      .delete(`http://localhost:8000/jobs/${id}`)
      .then(() => {
        setJobs((prevJobs) => prevJobs.filter((job) => job.id !== id));
      })
      .catch((err) => console.error("Error deleting job:", err));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Job Applications</h2>
      <ul className="space-y-2">
        {jobs.map((job) => (
          <li key={job.id} className="p-4 border rounded shadow bg-white text-left">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{job.title} @ {job.company}</div>
                <div className="text-sm text-blue-600 underline">
                  <a href={job.link} target="_blank" rel="noopener noreferrer">
                    {job.link}
                  </a>
                </div>
                <div>Status: {job.status}</div>
                <div>Date Applied: {job.date_applied}</div>
                <div className="text-gray-700">Notes: {job.notes}</div>
              </div>
              <button
                onClick={() => handleDelete(job.id)}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default JobList;