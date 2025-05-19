import React, { useEffect, useState } from "react";
import axios from "axios";

const JobList = ({ jobs, setJobs }) => {
  const [editJobId, setEditJobId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    company: "",
    link: "",
    status: "",
    date_applied: "",
    notes: "",
  });

  const [statusFilter, setStatusFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");

  useEffect(() => {
    axios
      .get("https://joblog-api.onrender.com/jobs/")
      .then((response) => setJobs(response.data))
      .catch((error) => console.error("Error fetching jobs:", error));
  }, []);

  const handleDelete = (id) => {
    axios
      .delete(`https://joblog-api.onrender.com/jobs/${id}`)
      .then(() => {
        setJobs((prevJobs) => prevJobs.filter((job) => job.id !== id));
      })
      .catch((err) => console.error("Error deleting job:", err));
  };

  const handleEditClick = (job) => {
    setEditJobId(job.id);
    setEditFormData({ ...job });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    axios
      .put(`https://joblog-api.onrender.com/jobs/${editJobId}`, editFormData)
      .then((res) => {
        setJobs((prevJobs) =>
          prevJobs.map((job) => (job.id === editJobId ? res.data : job))
        );
        setEditJobId(null);
      })
      .catch((err) => console.error("Error updating job:", err));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Job Applications</h2>

      <div className="mb-4">
        <label className="font-semibold mr-2">Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="All">All</option>
          <option value="Applied">Applied</option>
          <option value="Interviewing">Interviewing</option>
          <option value="Offer">Offer</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="font-semibold mr-2">Filter by tag:</label>
        <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="p-2 border rounded"
        >
            <option value="All">All</option>
            <option value="Remote">Remote</option>
            <option value="Referral">Referral</option>
            <option value="Urgent">Urgent</option>
            <option value="Startup">Startup</option>
        </select>
      </div>

      <ul className="space-y-2">
        {jobs
          .filter((job) => {
            const matchesStatus =
                statusFilter === "All" || job.status === statusFilter;
            const matchesTag =
                tagFilter === "All" ||
                (job.tags && job.tags.split(",").includes(tagFilter));
            return matchesStatus && matchesTag;
            })
          .map((job) => (
            <li
              key={`${job.id}-${job.tags}`}
              className="p-4 border rounded shadow bg-white text-left"
            >
              <div className="flex justify-between items-start">
                {editJobId === job.id ? (
                  <div className="w-full space-y-2">
                    <select
                      name="status"
                      value={editFormData.status}
                      onChange={handleEditChange}
                      className="p-2 border rounded w-full"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <textarea
                      name="notes"
                      value={editFormData.notes}
                      onChange={handleEditChange}
                      className="w-full p-2 border rounded"
                      rows={3}
                    />
                    <div className="space-x-2">
                      <button
                        onClick={handleSave}
                        className="bg-green-500 text-white px-2 py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditJobId(null)}
                        className="bg-gray-400 text-white px-2 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="font-semibold">
                        {job.title} @ {job.company}
                      </div>
                      <div className="text-sm text-blue-600 underline">
                        <a
                          href={job.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {job.link}
                        </a>
                      </div>
                      <div>Status: {job.status}</div>
                      <div>Date Applied: {job.date_applied}</div>
                      <div className="text-gray-700">Notes: {job.notes}</div>

                      {job.tags && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {job.tags.split(",").map((tag, index) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-right">
                      <button
                        onClick={() => handleEditClick(job)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default JobList;