import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const JobList = ({ jobs, setJobs }) => {
  const [editJobId, setEditJobId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    company: "",
    link: "",
    status: "",
    date_applied: "",
    notes: "",
    tags: "",
    status_history: [],
  });

  const [statusFilter, setStatusFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const tagOptions = ["Remote", "Referral", "Urgent", "Startup"];

  const apiKey = new URLSearchParams(window.location.search).get("key");

  const handleDelete = (id) => {
    const query = apiKey ? `?key=${apiKey}` : "";
    axios
      .delete(`${BASE_URL}/jobs/${id}${query}`)
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

  const handleTagToggle = (tag) => {
    const tags = editFormData.tags ? editFormData.tags.split(",").map(t => t.trim()) : [];
    const updated = tags.includes(tag)
      ? tags.filter(t => t !== tag)
      : [...tags, tag];
    setEditFormData({ ...editFormData, tags: updated.join(",") });
  };

  const handleSave = () => {
    const query = apiKey ? `?key=${apiKey}` : "";
    const original = jobs.find(job => job.id === editJobId);
    const updatedHistory = [...(editFormData.status_history || [])];

    if (editFormData.status !== original.status) {
      updatedHistory.push({ status: editFormData.status, date: new Date().toISOString().split("T")[0] });
    }
    axios
      .put(`${BASE_URL}/jobs/${editJobId}${query}`, { ...editFormData, status_history: updatedHistory })
      .then((res) => {
        setJobs((prevJobs) =>
          prevJobs.map((job) => (job.id === editJobId ? res.data : job))
        );
        setEditJobId(null);
      })
      .catch((err) => console.error("Error updating job:", err));
  };

  const downloadCSV = (data) => {
    const headers = ["Title", "Company", "Status", "Date Applied", "Tags", "Notes", "Link"];
    const rows = data.map((job) => [
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
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "job_applications.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const total = jobs.length;
  const interviewing = jobs.filter((job) =>
    job.status === "Interviewing" ||
    (Array.isArray(job.status_history) && job.status_history.some(s => s.status === "Interviewing"))
  ).length;
  const offers = jobs.filter((job) =>
    job.status === "Offer" ||
    (Array.isArray(job.status_history) && job.status_history.some(s => s.status === "Offer"))
  ).length;
  const rejections = jobs.filter((job) =>
    job.status === "Rejected" ||
    (Array.isArray(job.status_history) && job.status_history.some(s => s.status === "Rejected"))
  ).length;
  const applied = jobs.filter((job) => job.status === "Applied").length;
  const offerRate = total > 0 ? `${((offers / total) * 100).toFixed(1)}%` : "0%";

  return (
    <div className="p-4 dark:bg-dark-background">
      <h2 className="text-xl font-bold mb-4 dark:text-dark-text">Job Applications</h2>

      {/* Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 text-center">
        <div className="bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded"><div className="text-sm text-light-text dark:text-dark-text">Total</div><div className="text-xl font-semibold text-light-text dark:text-dark-text">{total}</div></div>
        <div className="bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded"><div className="text-sm text-light-text dark:text-dark-text">Applied</div><div className="text-xl font-semibold text-light-text dark:text-dark-text">{applied}</div></div>
        <div className="bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded"><div className="text-sm text-light-text dark:text-dark-text">Interviewing</div><div className="text-xl font-semibold text-light-text dark:text-dark-text">{interviewing}</div></div>
        <div className="bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded"><div className="text-sm text-light-text dark:text-dark-text">Offers</div><div className="text-xl font-semibold text-light-text dark:text-dark-text">{offers}</div></div>
        <div className="bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded"><div className="text-sm text-light-text dark:text-dark-text">Rejected</div><div className="text-xl font-semibold text-light-text dark:text-dark-text">{rejections}</div></div>
        <div className="bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded"><div className="text-sm text-light-text dark:text-dark-text">Offer Rate</div><div className="text-xl font-semibold text-light-text dark:text-dark-text">{offerRate}</div></div>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <label className="font-semibold mr-2 dark:text-dark-text">Filter by status:</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          <option value="All">All</option>
          <option value="Applied">Applied</option>
          <option value="Interviewing">Interviewing</option>
          <option value="Offer">Offer</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="font-semibold mr-2 dark:text-dark-text">Filter by tag:</label>
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          <option value="All">All</option>
          {tagOptions.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      {/* CSV Export */}
      <div className="mb-4">
        <button
          onClick={() => downloadCSV(jobs)}
          className="bg-light-accent text-white px-4 py-2 rounded hover:bg-light-accentHover transition dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:hover:shadow-[0_0_10px_#22d3ee]"
        >
          Export to CSV
        </button>
      </div>

      <ul className="space-y-2">
        {jobs
          .filter((job) => {
            const matchesStatus = statusFilter === "All" || job.status === statusFilter;
            const matchesTag = tagFilter === "All" || (job.tags && job.tags.split(",").includes(tagFilter));
            return matchesStatus && matchesTag;
          })
          .sort((a, b) => new Date(b.date_applied) - new Date(a.date_applied))
          .map((job) => (
            <li key={`${job.id}-${job.tags}`} className="p-4 border rounded shadow bg-light-background dark:bg-dark-card dark:border-dark-accent text-left">
              <div className="flex justify-between items-start">
                {editJobId === job.id ? (
                  <div className="w-full space-y-2">
                    <select name="status" value={editFormData.status} onChange={handleEditChange} className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <option value="Applied">Applied</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                    <textarea name="notes" value={editFormData.notes} onChange={handleEditChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={3} />
                    <div className="flex flex-wrap gap-4">
                      {tagOptions.map((tag) => (
                        <label key={tag} className="flex items-center space-x-2 dark:text-dark-text">
                          <input
                            type="checkbox"
                            checked={editFormData.tags?.split(",").includes(tag)}
                            onChange={() => handleTagToggle(tag)}
                            className="dark:bg-gray-700"
                          />
                          <span>{tag}</span>
                        </label>
                      ))}
                    </div>
                    <div className="space-x-2">
                      <button onClick={handleSave} className="bg-green-500 text-white px-2 py-1 rounded dark:bg-cyan-500 dark:hover:bg-cyan-400">Save</button>
                      <button onClick={() => setEditJobId(null)} className="bg-gray-400 text-white px-2 py-1 rounded dark:bg-cyan-800 dark:hover:bg-cyan-900">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="font-semibold dark:text-dark-text">{job.title} @ {job.company}</div>
                      <div className="text-sm text-light-accent hover:underline underline break-all dark:text-dark-accent dark:hover:text-dark-accentHover">
                        <a href={job.link} target="_blank" rel="noopener noreferrer" title={job.link}>
                          {job.link.length > 60 ? `${job.link.slice(0, 60)}...` : job.link}
                        </a>
                      </div>
                      <div className="dark:text-dark-text">Status: {job.status}</div>
                      {job.status_history?.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1 dark:text-dark-text">
                          {job.status_history.map((s, i) => (
                            <div key={i}>{s.status} on {s.date}</div>
                          ))}
                        </div>
                      )}
                      <div className="dark:text-dark-text">Date Applied: {job.date_applied}</div>
                      <div className="text-gray-700 dark:text-dark-text">Notes: {job.notes}</div>
                      {job.tags && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {job.tags.split(",").map((tag, index) => {
                            let bgClass = "bg-gray-100";
                            let textClass = "text-gray-800";
                            if (tag.trim() === "Remote") {
                              bgClass = "bg-light-tag-remoteBg text-light-tag-remoteText dark:bg-dark-tag-bg dark:text-dark-tag-text";
                              textClass = "";
                            } else if (tag.trim() === "Referral") {
                              bgClass = "bg-light-tag-referralBg text-light-tag-referralText dark:bg-dark-tag-bg dark:text-dark-tag-text";
                              textClass = "";
                            } else if (tag.trim() === "Urgent") {
                              bgClass = "bg-light-tag-urgentBg text-light-tag-urgentText dark:bg-dark-tag-bg dark:text-dark-tag-text";
                              textClass = "";
                            } else if (tag.trim() === "Startup") {
                              bgClass = "bg-light-tag-startupBg text-light-tag-startupText dark:bg-dark-tag-bg dark:text-dark-tag-text";
                              textClass = "";
                            }
                            return (
                              <span key={index} className={`${bgClass} ${textClass} text-xs font-semibold px-2 py-1 rounded`}>
                                {tag.trim()}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-right">
                      <button
                        onClick={() => handleEditClick(job)}
                        className="text-white px-2 py-1 rounded mr-2 
                          bg-light-accent hover:bg-light-accentHover 
                          dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:hover:shadow-[0_0_10px_#22d3ee]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="px-2 py-1 rounded 
                          text-white bg-red-400 hover:bg-red-500 
                          dark:bg-red-600 dark:hover:bg-red-500 dark:hover:shadow-[0_0_10px_#f87171]"
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