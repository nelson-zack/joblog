import React, { useState } from "react";
import axios from "axios";

const JobForm = ({ onJobAdded }) => {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    link: "",
    status: "Applied",
    date_applied: "",
    notes: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post("http://localhost:8000/jobs/", formData)
      .then((res) => {
        onJobAdded(res.data); // pass new job back to parent
        setFormData({
          title: "",
          company: "",
          link: "",
          status: "Applied",
          date_applied: "",
          notes: "",
        });
      })
      .catch((err) => console.error("Error adding job:", err));
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-4 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-2">Add New Job</h2>
      <div className="grid grid-cols-1 gap-2">
        <input name="title" value={formData.title} onChange={handleChange} placeholder="Job Title" required className="p-2 border rounded" />
        <input name="company" value={formData.company} onChange={handleChange} placeholder="Company" required className="p-2 border rounded" />
        <input name="link" value={formData.link} onChange={handleChange} placeholder="Job Link" className="p-2 border rounded" />
        <input name="date_applied" value={formData.date_applied} onChange={handleChange} placeholder="Date Applied (YYYY-MM-DD)" className="p-2 border rounded" />
        <select name="status" value={formData.status} onChange={handleChange} className="p-2 border rounded">
          <option value="Applied">Applied</option>
          <option value="Interviewing">Interviewing</option>
          <option value="Offer">Offer</option>
          <option value="Rejected">Rejected</option>
        </select>
        <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Notes" rows={3} className="p-2 border rounded" />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Job
        </button>
      </div>
    </form>
  );
};

export default JobForm;