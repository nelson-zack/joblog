import React, { useState } from "react";
import axios from "axios";

const JobForm = ({ onJobAdded, apiKey }) => {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    link: "",
    status: "Applied",
    date_applied: "",
    notes: "",
    status_history: [],
  });

  const tagOptions = ["Remote", "Referral", "Urgent", "Startup"];
  const [selectedTags, setSelectedTags] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const query = apiKey ? `?key=${apiKey}` : "";

    axios
      .post(`${import.meta.env.VITE_API_BASE_URL}/jobs/${query}`, {
        ...formData,
        tags: selectedTags.join(","),
        status_history: [
          {
            status: formData.status,
            date: formData.date_applied || new Date().toISOString().split("T")[0],
          },
        ],
      })
      .then((res) => {
        onJobAdded(res.data);
        setFormData({
          title: "",
          company: "",
          link: "",
          status: "Applied",
          date_applied: "",
          notes: "",
          status_history: [],
        });
        setSelectedTags([]);
      })
      .catch((err) => console.error("Error adding job:", err));
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-4 bg-light-background text-light-text dark:bg-dark-background dark:text-dark-text rounded shadow">
      <h2 className="text-lg font-bold mb-2">Add New Job</h2>
      <div className="grid grid-cols-1 gap-2">
        <input name="title" value={formData.title} onChange={handleChange} placeholder="Job Title" required className="p-2 border rounded bg-light-background text-light-text dark:bg-dark-card dark:text-dark-text" />
        <input name="company" value={formData.company} onChange={handleChange} placeholder="Company" required className="p-2 border rounded bg-light-background text-light-text dark:bg-dark-card dark:text-dark-text" />
        <input name="link" value={formData.link} onChange={handleChange} placeholder="Job Link" className="p-2 border rounded bg-light-background text-light-text dark:bg-dark-card dark:text-dark-text" />
        <input name="date_applied" value={formData.date_applied} onChange={handleChange} placeholder="Date Applied (YYYY-MM-DD)" className="p-2 border rounded bg-light-background text-light-text dark:bg-dark-card dark:text-dark-text" />
        <select name="status" value={formData.status} onChange={handleChange} className="p-2 border rounded bg-light-background text-light-text dark:bg-dark-card dark:text-dark-text">
          <option value="Applied">Applied</option>
          <option value="Interviewing">Interviewing</option>
          <option value="Offer">Offer</option>
          <option value="Rejected">Rejected</option>
        </select>
        <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Notes" rows={3} className="p-2 border rounded bg-light-background text-light-text dark:bg-dark-card dark:text-dark-text" />
        <div>
          <label className="font-semibold">Tags:</label>
          <div className="flex flex-wrap gap-4 mt-2">
            {tagOptions.map((tag) => (
              <label key={tag} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-light-accent dark:accent-dark-accent bg-light-background dark:bg-dark-card border border-gray-300 dark:border-gray-600 focus:ring-light-accent dark:focus:ring-dark-accent focus:ring-offset-1"
                  value={tag}
                  checked={selectedTags.includes(tag)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTags([...selectedTags, tag]);
                    } else {
                      setSelectedTags(selectedTags.filter((t) => t !== tag));
                    }
                  }}
                />
                <span>{tag}</span>
              </label>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="bg-light-accent text-white dark:bg-dark-accent px-4 py-2 rounded transition hover:bg-light-accentHover dark:hover:bg-dark-accentHover dark:hover:shadow-[0_0_10px_var(--tw-shadow-color)] shadow-dark-accentHover"
        >
          Add Job
        </button>
      </div>
    </form>
  );
};

export default JobForm;