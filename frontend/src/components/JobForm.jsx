/**
 * JobForm
 * --------
 * Lightweight controlled form for creating a Job.
 * - Normalizes dates to strict YYYY-MM-DD (local time for "today" defaults).
 * - Emits the created job via onCreateJob for persistence.
 * - Stores tags as a comma-separated string (kept for backward compat).
 *
 * Props
 *  - onCreateJob(job): async function that persists the job using the active store.
 *  - mode: the current app mode (demo, local, or admin).
 *
 * Note: some helpers here are duplicated in JobList. Consider extracting to
 * /frontend/src/utils/date.ts(x) in a follow-up so the app uses one source.
 */
import React, { useState } from 'react';
import { MODES } from '../storage/selectStore';
import { normalizeYMD, todayYMDLocal } from '../utils/date';
import { joinTags } from '../utils/tags';

const JobForm = ({ onCreateJob, mode }) => {
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
  const [formError, setFormError] = useState(null);

  // Shared input styles (dark/light + focus accents)
  const inputBase =
    'p-2 border rounded bg-light-background dark:bg-dark-card text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-light-accent focus:border-light-accent dark:focus:ring-dark-accent dark:focus:border-dark-accent';
  const selectBase = inputBase;
  const textAreaBase = inputBase;

  const handleChange = (e) => {
    if (e.target.name === 'date_applied') {
      setFormError(null);
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedDate =
      normalizeYMD(formData.date_applied || todayYMDLocal()) || '';
    if (!normalizedDate && mode !== MODES.ADMIN) {
      setFormError('Please enter a valid date (YYYY-MM-DD).');
      return;
    }
    const resolvedDate = normalizedDate || todayYMDLocal();
    const tagsNorm = joinTags(selectedTags);

    const payload = {
      ...formData,
      tags: tagsNorm,
      date_applied: resolvedDate,
      status_history: [
        {
          status: formData.status,
          date: resolvedDate
        }
      ]
    };

    try {
      await onCreateJob?.(payload);
      setFormError(null);
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
    } catch (error) {
      console.error('Error creating job:', error);
      if (mode === MODES.ADMIN) {
        alert(
          'Something went wrong while saving to the server. Please retry or check the console for details.'
        );
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='mb-8 p-4 bg-light-background text-light-text dark:bg-dark-background dark:text-dark-text rounded shadow'
    >
      {formError ? (
        <div className='mb-2 text-sm text-red-500 dark:text-red-400'>
          {formError}
        </div>
      ) : null}
      <h2 className='text-lg font-bold mb-2'>Add New Job</h2>
      <div className='grid grid-cols-1 gap-2'>
        <input
          name='title'
          value={formData.title}
          onChange={handleChange}
          placeholder='Job Title'
          required
          className={inputBase}
        />
        <input
          name='company'
          value={formData.company}
          onChange={handleChange}
          placeholder='Company'
          required
          className={inputBase}
        />
        <input
          name='link'
          value={formData.link}
          onChange={handleChange}
          placeholder='Job Link'
          className={inputBase}
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
        />
        <select
          name='status'
          value={formData.status}
          onChange={handleChange}
          className={selectBase}
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
