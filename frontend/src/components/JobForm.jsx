import React, { useState } from 'react';
import axios from 'axios';

// Helpers: produce a strict YYYY-MM-DD and a "today" value
const normalizeYMD = (s) => {
  if (!s || typeof s !== 'string') return '';
  // Accept "YYYY-MM-DD" and also pad variants like "YYYY-M-D"
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return '';
  const [_, y, mo, d] = m.map(Number);
  if (!y || !mo || !d) return '';
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

const todayYMD = () => new Date().toISOString().slice(0, 10);

const JobForm = ({ onJobAdded, apiKey }) => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    link: '',
    status: 'Applied',
    date_applied: '',
    notes: '',
    status_history: []
  });

  const tagOptions = ['Remote', 'Referral', 'Urgent', 'Startup'];
  const [selectedTags, setSelectedTags] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const query = apiKey ? `?key=${apiKey}` : '';
    const dateNorm = normalizeYMD(formData.date_applied || todayYMD());
    const tagsNorm = selectedTags
      .map((t) => t.trim())
      .filter(Boolean)
      .join(',');

    axios
      .post(`${import.meta.env.VITE_API_BASE_URL}/jobs/${query}`, {
        ...formData,
        tags: tagsNorm,
        date_applied: dateNorm,
        status_history: [
          {
            status: formData.status,
            date: dateNorm
          }
        ]
      })
      .then((res) => {
        onJobAdded(res.data);
        setFormData({
          title: '',
          company: '',
          link: '',
          status: 'Applied',
          date_applied: '',
          notes: '',
          status_history: []
        });
        setSelectedTags([]);
      })
      .catch((err) => console.error('Error adding job:', err));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='mb-8 p-4 bg-light-background text-light-text dark:bg-dark-background dark:text-dark-text rounded shadow'
    >
      <h2 className='text-lg font-bold mb-2'>Add New Job</h2>
      <div className='grid grid-cols-1 gap-2'>
        <input
          name='title'
          value={formData.title}
          onChange={handleChange}
          placeholder='Job Title'
          required
          className='p-2 border rounded bg-light-background text-light-text dark:bg-dark-card dark:text-dark-text'
        />
        <input
          name='company'
          value={formData.company}
          onChange={handleChange}
          placeholder='Company'
          required
          className='p-2 border rounded bg-light-background text-light-text dark:bg-dark-card dark:text-dark-text'
        />
        <input
          name='link'
          value={formData.link}
          onChange={handleChange}
          placeholder='Job Link'
          className='p-2 border rounded bg-light-background text-light-text dark:bg-dark-card dark:text-dark-text'
        />
        <input
          type='date'
          name='date_applied'
          value={formData.date_applied}
          onChange={handleChange}
          className='p-2 border rounded bg-light-background text-light-text dark:bg-dark-card dark:text-dark-text'
        />
        <select
          name='status'
          value={formData.status}
          onChange={handleChange}
          className='p-2 border rounded bg-light-background text-light-text dark:bg-dark-card dark:text-dark-text'
        >
          <option value='Applied'>Applied</option>
          <option value='Interviewing'>Interviewing</option>
          <option value='Offer'>Offer</option>
          <option value='Rejected'>Rejected</option>
        </select>
        <textarea
          name='notes'
          value={formData.notes}
          onChange={handleChange}
          placeholder='Notes'
          rows={3}
          className='p-2 border rounded bg-light-background text-light-text dark:bg-dark-card dark:text-dark-text'
        />
        <div>
          <label className='font-semibold'>Tags:</label>
          <div className='flex flex-wrap gap-4 mt-2'>
            {tagOptions.map((tag) => (
              <label key={tag} className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  className='h-4 w-4 accent-light-accent dark:accent-dark-accent bg-light-background dark:bg-dark-card border border-gray-300 dark:border-gray-600 focus:ring-light-accent dark:focus:ring-dark-accent focus:ring-offset-1'
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
          type='submit'
          className='bg-light-accent text-white dark:bg-dark-accent px-4 py-2 rounded transition hover:bg-light-accentHover dark:hover:bg-dark-accentHover dark:hover:shadow-[0_0_10px_var(--tw-shadow-color)] shadow-dark-accentHover'
        >
          Add Job
        </button>
      </div>
    </form>
  );
};

export default JobForm;
