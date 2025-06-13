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
    <form onSubmit={handleSubmit} className="mb-8 p-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded shadow">
      <h2 className="text-lg font-bold mb-2">Add New Job</h2>
      <div className="grid grid-cols-1 gap-2">
        <input name="title" value={formData.title} onChange={handleChange} placeholder="Job Title" required className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
        <input name="company" value={formData.company} onChange={handleChange} placeholder="Company" required className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
        <input name="link" value={formData.link} onChange={handleChange} placeholder="Job Link" className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
        <input name="date_applied" value={formData.date_applied} onChange={handleChange} placeholder="Date Applied (YYYY-MM-DD)" className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
        <select name="status" value={formData.status} onChange={handleChange} className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">
          <option value="Applied">Applied</option>
          <option value="Interviewing">Interviewing</option>
          <option value="Offer">Offer</option>
          <option value="Rejected">Rejected</option>
        </select>
        <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Notes" rows={3} className="p-2 border rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
        <div>
          <label className="font-semibold">Tags:</label>
          <div className="flex flex-wrap gap-4 mt-2">
            {tagOptions.map((tag) => (
              <label key={tag} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
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
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Add Job
        </button>
      </div>
    </form>
  );
};

export default JobForm;