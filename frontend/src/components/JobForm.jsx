/**
 * JobForm
 * --------
 * Lightweight controlled form for creating a Job.
 * - Normalizes dates to strict YYYY-MM-DD (local time for "today" defaults).
 * - Emits the created job via onJobAdded after a successful POST.
 * - Stores tags as a comma-separated string (kept for backward compat).
 *
 * Props
 *  - onJobAdded(job): function called with the created job response.
 *  - apiKey: optional string; appended as ?key=... to support admin/demo mode.
 *  - disabled: when true, renders a read-only demo version of the form.
 *
 * Note: some helpers here are duplicated in JobList. Consider extracting to
 * /frontend/src/utils/date.ts(x) in a follow-up so the app uses one source.
 */
import React, { useState } from 'react';
import axios from 'axios';

/**
 * Normalize a date string into strict YYYY-MM-DD.
 * Accepts "YYYY-M-D" and pads month/day. Returns "" for invalid input.
 */
const normalizeYMD = (s) => {
  if (!s || typeof s !== 'string') return '';
  // Accept "YYYY-MM-DD" and also pad variants like "YYYY-M-D"
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return '';
  const [_, y, mo, d] = m.map(Number);
  if (!y || !mo || !d) return '';
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

/**
 * Local (non-UTC) today in YYYY-MM-DD.
 * Avoids evening rollover issues that occur with toISOString().
 */
const todayYMD = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const JobForm = ({ onJobAdded, apiKey, disabled = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    link: '',
    status: 'Applied',
    date_applied: '',
    notes: '',
    status_history: []
  });

  // Tag options shown in the form and mirrored in JobList for editing/filtering.
  // Stored as a comma-separated string on the job for now.
  const tagOptions = [
    'Remote',
    'Hybrid',
    'On-Site',
    'Referral',
    'Urgent',
    'Startup'
  ];
  const [selectedTags, setSelectedTags] = useState([]);

  // Shared input styles (dark/light + focus accents)
  const inputBase =
    'p-2 border rounded bg-light-background dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-light-accent focus:border-light-accent dark:focus:ring-dark-accent dark:focus:border-dark-accent';
  const selectBase = inputBase;
  const textAreaBase = inputBase;

  const handleChange = (e) => {
    if (disabled) return;
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;
    const query = apiKey ? `?key=${apiKey}` : '';
    const dateNorm = normalizeYMD(formData.date_applied || todayYMD());
    const tagsNorm = selectedTags
      .map((t) => t.trim())
      .filter(Boolean)
      .join(',');

    // Build normalized payload: strict date + comma-joined tags + initial status entry
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
          className={inputBase}
          disabled={disabled}
        />
        <input
          name='company'
          value={formData.company}
          onChange={handleChange}
          placeholder='Company'
          required
          className={inputBase}
          disabled={disabled}
        />
        <input
          name='link'
          value={formData.link}
          onChange={handleChange}
          placeholder='Job Link'
          className={inputBase}
          disabled={disabled}
        />
        <input
          type='date'
          name='date_applied'
          value={formData.date_applied}
          onChange={handleChange}
          placeholder='mm/dd/yyyy'
          className={[
            inputBase,
            !formData.date_applied ? 'text-gray-400 dark:text-gray-400' : '',
            '[&::-webkit-calendar-picker-indicator]:opacity-60',
            'dark:[&::-webkit-calendar-picker-indicator]:opacity-90',
            'dark:[&::-webkit-calendar-picker-indicator]:invert',
            '[&::-webkit-calendar-picker-indicator]:cursor-pointer'
          ].join(' ')}
          disabled={disabled}
        />
        <select
          name='status'
          value={formData.status}
          onChange={handleChange}
          className={selectBase}
          disabled={disabled}
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
          className={textAreaBase}
          disabled={disabled}
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
                  disabled={disabled}
                  onChange={(e) => {
                    if (disabled) return;
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
          className='bg-light-accent text-white dark:bg-dark-accent px-4 py-2 rounded transition hover:bg-light-accentHover dark:hover:bg-dark-accentHover dark:hover:shadow-[0_0_10px_var(--tw-shadow-color)] shadow-dark-accentHover disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-light-accent'
          disabled={disabled}
        >
          {disabled ? 'Add Job (demo disabled)' : 'Add Job'}
        </button>
        {disabled && (
          <p className='text-xs text-gray-500 mt-1 dark:text-gray-400'>
            Demo mode: adding jobs is disabled.
          </p>
        )}
      </div>
    </form>
  );
};

export default JobForm;
