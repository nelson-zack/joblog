/**
 * JobList
 * -------
 * Renders job cards, analytics, filters, CSV export, and inline editing.
 * Key behaviors:
 *  - Sorting: newest days first; within a day, newest entries first (by id).
 *  - Dates: strict YYYY-MM-DD; use local (non-UTC) "today" defaults.
 *  - History: interview rounds are explicit entries; Offer/Rejected capture dated entries.
 *  - Tags: stored CSV; checkboxes drive pill UI and filters.
 *
 * Props
 *  - jobs: array of job records to display.
 *  - mode: current application mode (demo, local, admin).
 *  - onUpdateJob(id, payload, helpers): async handler to persist edits.
 *  - onDeleteJob(id): async handler to remove a job.
 */
import React, { useState } from 'react';
import { MODES } from '../storage/selectStore';
import {
  parseYMDToUTC,
  normalizeYMD,
  todayYMDLocal
} from '../utils/date';
import { parseTags, joinTags } from '../utils/tags';
import { exportJobsToCsv } from '../utils/csv';

const JobList = ({
  jobs,
  mode,
  onUpdateJob,
  onDeleteJob
}) => {
  const isAdmin = mode === MODES.ADMIN;
  const [editJobId, setEditJobId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    company: '',
    link: '',
    status: '',
    date_applied: '',
    notes: '',
    tags: '',
    status_history: []
  });

  const [statusFilter, setStatusFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');
  const tagOptions = [
    'Remote',
    'Hybrid',
    'On-Site',
    'Referral',
    'Urgent',
    'Startup'
  ];
  // Planned round delta (applied on Save)
  const [roundDelta, setRoundDelta] = useState(0);
  // Date for the round to add
  const [roundAddDate, setRoundAddDate] = useState(todayYMDLocal());
  // Optional dates for Offer/Rejected
  const [offerDate, setOfferDate] = useState(todayYMDLocal());
  const [rejectDate, setRejectDate] = useState(todayYMDLocal());

  const handleDelete = async (id) => {
    try {
      await onDeleteJob?.(id);
    } catch (error) {
      console.error('Error deleting job:', error);
      if (isAdmin) {
        alert('Failed to delete job on the server. Please try again.');
      }
    }
  };

  const handleEditClick = (job) => {
    setEditJobId(job.id);
    setEditFormData({ ...job });
    setRoundDelta(0);
    setRoundAddDate(todayYMDLocal());
    setOfferDate(todayYMDLocal());
    setRejectDate(todayYMDLocal());
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleTagToggle = (tag) => {
    const tags = parseTags(editFormData.tags);
    const updated = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];
    setEditFormData({ ...editFormData, tags: joinTags(updated) });
  };

  const handleSave = async () => {
    const original = jobs.find((job) => job.id === editJobId);
    // Start from the latest server-backed history to avoid stale copies
    const updatedHistory = Array.isArray(original?.status_history)
      ? [...original.status_history]
      : [...(editFormData.status_history || [])];

    // If status changed, append a dated entry only for non-special statuses (not Interviewing/Offer/Rejected).
    if (editFormData.status !== original.status) {
      if (
        !['Interviewing', 'Offer', 'Rejected'].includes(editFormData.status)
      ) {
        const entryDate = normalizeYMD(todayYMDLocal());
        updatedHistory.push({
          status: editFormData.status,
          date: entryDate || todayYMDLocal()
        });
      }
    }

    const ensureDate = (value, label) => {
      const normalized = normalizeYMD(value);
      if (normalized) return normalized;
      if (isAdmin) return value || '';
      alert(`${label} must be a valid date (YYYY-MM-DD).`);
      return null;
    };

    const dateAppliedNormalized = ensureDate(
      editFormData.date_applied || todayYMDLocal(),
      'Date applied'
    );
    if (!dateAppliedNormalized && !isAdmin) {
      return;
    }

    // Apply planned interview round changes
    if (roundDelta > 0) {
      const toAdd = Math.min(1, roundDelta); // at most one per save
      for (let i = 0; i < toAdd; i++) {
        const roundDate = ensureDate(roundAddDate, 'Interview round date');
        if (!roundDate && !isAdmin) return;
        const d = roundDate || todayYMDLocal();
        updatedHistory.push({ status: 'Interviewing', date: d });
      }
    } else if (roundDelta < 0) {
      // Remove most recent Interviewing entries, one per "−" press
      let toRemove = Math.min(Math.abs(roundDelta), updatedHistory.length);
      while (toRemove > 0) {
        // Find the last Interviewing entry from the end
        const idx = [...updatedHistory]
          .map((h, i) => ({ i, h }))
          .reverse()
          .find((x) => x.h.status === 'Interviewing')?.i;
        if (idx == null) break;
        updatedHistory.splice(idx, 1);
        toRemove--;
      }
    }

    // Ensure terminal statuses have a dated history entry (use chosen date, or today)
    if (editFormData.status === 'Offer') {
      const hadOfferBefore =
        Array.isArray(original?.status_history) &&
        original.status_history.some((s) => s.status === 'Offer');
      const hasOfferNow =
        Array.isArray(updatedHistory) &&
        updatedHistory.some((s) => s.status === 'Offer');
      if (!hadOfferBefore && !hasOfferNow) {
        const normalizedOfferDate = ensureDate(offerDate, 'Offer date');
        if (!normalizedOfferDate && !isAdmin) return;
        const d = normalizedOfferDate || todayYMDLocal();
        updatedHistory.push({ status: 'Offer', date: d });
      }
    } else if (editFormData.status === 'Rejected') {
      const hadRejectBefore =
        Array.isArray(original?.status_history) &&
        original.status_history.some((s) => s.status === 'Rejected');
      const hasRejectNow =
        Array.isArray(updatedHistory) &&
        updatedHistory.some((s) => s.status === 'Rejected');
      if (!hadRejectBefore && !hasRejectNow) {
        const normalizedRejectDate = ensureDate(rejectDate, 'Rejection date');
        if (!normalizedRejectDate && !isAdmin) return;
        const d = normalizedRejectDate || todayYMDLocal();
        updatedHistory.push({ status: 'Rejected', date: d });
      }
    }

    // Safeguard: ensure terminal status gets a dated entry.
    if (editFormData.status === 'Offer') {
      const hasOfferFinal =
        Array.isArray(updatedHistory) &&
        updatedHistory.some((s) => s.status === 'Offer');
      if (!hasOfferFinal) {
        const normalizedOfferDate = ensureDate(offerDate, 'Offer date');
        if (!normalizedOfferDate && !isAdmin) return;
        const d = normalizedOfferDate || todayYMDLocal();
        updatedHistory.push({ status: 'Offer', date: d });
      }
    } else if (editFormData.status === 'Rejected') {
      const hasRejectFinal =
        Array.isArray(updatedHistory) &&
        updatedHistory.some((s) => s.status === 'Rejected');
      if (!hasRejectFinal) {
        const normalizedRejectDate = ensureDate(rejectDate, 'Rejection date');
        if (!normalizedRejectDate && !isAdmin) return;
        const d = normalizedRejectDate || todayYMDLocal();
        updatedHistory.push({ status: 'Rejected', date: d });
      }
    }

    const payload = {
      ...editFormData,
      date_applied: dateAppliedNormalized || todayYMDLocal(),
      status_history: updatedHistory,
      tags: joinTags(parseTags(editFormData.tags))
    };

    const offerDateForPayload =
      ensureDate(offerDate, 'Offer date') || todayYMDLocal();
    const rejectDateForPayload =
      ensureDate(rejectDate, 'Rejection date') || todayYMDLocal();
    if (!isAdmin && (!offerDateForPayload || !rejectDateForPayload)) {
      return;
    }

    try {
      await onUpdateJob?.(editJobId, payload, {
        offerDate: offerDateForPayload,
        rejectDate: rejectDateForPayload
      });
      setEditJobId(null);
      setRoundDelta(0);
      setRoundAddDate(todayYMDLocal());
      setOfferDate(todayYMDLocal());
      setRejectDate(todayYMDLocal());
    } catch (error) {
      console.error('Error updating job:', error);
      if (isAdmin) {
        alert('Failed to update job on the server. Please try again.');
      }
    }
  };

  // ---- ANALYTICS (renamed + refined) ----
  // ---- ANALYTICS ----
  const totalSubmitted = jobs.length;

  // Pending = currently waiting (status is Applied). Equivalent to Submitted - (current Interviewing + Offer + Rejected)
  const pending = jobs.filter((job) => job.status === 'Applied').length;

  // Companies interviewed (distinct)
  const companiesInterviewing = (() => {
    const set = new Set();
    for (const job of jobs) {
      const everInterviewing =
        job.status === 'Interviewing' ||
        (Array.isArray(job.status_history) &&
          job.status_history.some((s) => s.status === 'Interviewing'));
      if (everInterviewing) set.add(job.company?.trim() || job.id);
    }
    return set.size;
  })();

  // Count interview rounds per job (history only)
  const countInterviewRoundsForJob = (job) => {
    return Array.isArray(job.status_history)
      ? job.status_history.filter((s) => s.status === 'Interviewing').length
      : 0;
  };

  // Total interview rounds (sum of Interviewing entries)
  const interviewRounds = jobs.reduce(
    (sum, job) => sum + countInterviewRoundsForJob(job),
    0
  );

  const offers = jobs.filter(
    (job) =>
      job.status === 'Offer' ||
      (Array.isArray(job.status_history) &&
        job.status_history.some((s) => s.status === 'Offer'))
  ).length;

  const rejections = jobs.filter(
    (job) =>
      job.status === 'Rejected' ||
      (Array.isArray(job.status_history) &&
        job.status_history.some((s) => s.status === 'Rejected'))
  ).length;

  const offerRate =
    totalSubmitted > 0
      ? `${((offers / totalSubmitted) * 100).toFixed(1)}%`
      : '0%';

  return (
    <div className='p-4 dark:bg-dark-background'>
      <h2 className='text-xl font-bold mb-4 dark:text-dark-text'>
        Job Applications
      </h2>

      {/* Analytics */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 text-center'>
        <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
          <div className='text-sm text-light-text dark:text-dark-text'>
            Submitted
          </div>
          <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
            {totalSubmitted}
          </div>
        </div>
        <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
          <div className='text-sm text-light-text dark:text-dark-text'>
            Pending
          </div>
          <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
            {pending}
          </div>
        </div>
        <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
          <div className='text-sm text-light-text dark:text-dark-text'>
            Interviewed Companies
          </div>
          <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
            {companiesInterviewing}
          </div>
        </div>
        <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
          <div className='text-sm text-light-text dark:text-dark-text'>
            Interview Rounds
          </div>
          <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
            {interviewRounds}
          </div>
        </div>
        <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
          <div className='text-sm text-light-text dark:text-dark-text'>
            Offers
          </div>
          <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
            {offers}
          </div>
        </div>
        <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
          <div className='text-sm text-light-text dark:text-dark-text'>
            Rejected
          </div>
          <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
            {rejections}
          </div>
        </div>
      </div>

      {/* Keep Offer Rate as a separate single card below (optional) */}
      <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded text-center mb-6'>
        <div className='text-sm text-light-text dark:text-dark-text'>
          Offer Rate
        </div>
        <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
          {offerRate}
        </div>
      </div>

      {/* Filters */}
      <div className='mb-4'>
        <label className='font-semibold mr-2 dark:text-dark-text'>
          Filter by status:
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className='p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white'
        >
          <option value='All'>All</option>
          <option value='Applied'>Applied</option>
          <option value='Interviewing'>Interview</option>
          <option value='Offer'>Offer</option>
          <option value='Rejected'>Rejected</option>
        </select>
      </div>

      <div className='mb-4'>
        <label className='font-semibold mr-2 dark:text-dark-text'>
          Filter by tag:
        </label>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className='p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white'
        >
          <option value='All'>All</option>
          {tagOptions.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {/* CSV Export */}
      <div className='mb-4'>
        <button
          onClick={() => exportJobsToCsv(jobs, 'job_applications.csv')}
          className='bg-light-accent text-white px-4 py-2 rounded hover:bg-light-accentHover transition dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:hover:shadow-[0_0_10px_#22d3ee]'
        >
          Export to CSV
        </button>
      </div>

      <ul className='space-y-2'>
        {jobs
          .filter((job) => {
            const matchesStatus =
              statusFilter === 'All'
                ? true
                : statusFilter === 'Interviewing'
                ? job.status === 'Interviewing' ||
                  (Array.isArray(job.status_history) &&
                    job.status_history.some((s) => s.status === 'Interviewing'))
                : job.status === statusFilter;
            const matchesTag =
              tagFilter === 'All' ||
              (job.tags && parseTags(job.tags).includes(tagFilter));
            return matchesStatus && matchesTag;
          })
          .sort((a, b) => {
            const da = parseYMDToUTC(a.date_applied);
            const db = parseYMDToUTC(b.date_applied);
            if (da !== db) {
              // Primary: date descending (most recent at top)
              return db - da;
            }
            // Secondary (same day): newest first within the day using id desc
            const aid = Number(a.id) || 0;
            const bid = Number(b.id) || 0;
            return bid - aid;
          })
          .map((job) => (
            <li
              key={job.id}
              className='p-4 border rounded shadow bg-light-background dark:bg-dark-card dark:border-dark-accent text-left'
            >
              <div className='flex justify-between items-start'>
                {editJobId === job.id ? (
                  <div className='w-full space-y-2'>
                    <select
                      name='status'
                      value={editFormData.status}
                      onChange={handleEditChange}
                      className='p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                    >
                      <option value='Applied'>Applied</option>
                      <option value='Interviewing'>Interview</option>
                      <option value='Offer'>Offer</option>
                      <option value='Rejected'>Rejected</option>
                    </select>
                    {editFormData.status === 'Offer' && (
                      <div className='flex items-center gap-2'>
                        <span className='text-xs text-gray-600 dark:text-gray-300'>
                          Offer date:
                        </span>
                        <input
                          type='date'
                          value={offerDate}
                          onChange={(e) => setOfferDate(e.target.value)}
                          className='text-xs p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                        />
                      </div>
                    )}
                    {editFormData.status === 'Rejected' && (
                      <div className='flex items-center gap-2'>
                        <span className='text-xs text-gray-600 dark:text-gray-300'>
                          Rejection date:
                        </span>
                        <input
                          type='date'
                          value={rejectDate}
                          onChange={(e) => setRejectDate(e.target.value)}
                          className='text-xs p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                        />
                      </div>
                    )}
                    {/* Interview round delta controls */}
                    <div className='flex items-center gap-2 flex-wrap'>
                      <span className='text-xs text-gray-600 dark:text-gray-300'>
                        Interview Round:
                      </span>
                      <button
                        type='button'
                        onClick={() => setRoundDelta(roundDelta - 1)}
                        className='text-xs px-2 py-1 rounded border dark:border-gray-600 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700'
                        title='Remove last interview entry'
                        aria-label='Remove last interview entry'
                      >
                        −
                      </button>
                      <button
                        type='button'
                        onClick={() =>
                          setRoundDelta(Math.min(1, roundDelta + 1))
                        }
                        className='text-xs px-2 py-1 rounded border dark:border-gray-600 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700'
                        title='Plan to add one interview entry'
                        aria-label='Plan to add one interview entry'
                      >
                        +
                      </button>
                      <span className='text-xs text-gray-600 dark:text-gray-300'>
                        :{' '}
                        {roundDelta > 0
                          ? `+${Math.min(1, roundDelta)}`
                          : roundDelta}
                      </span>
                      <span className='text-xs text-gray-600 dark:text-gray-300 ml-2'>
                        on
                      </span>
                      <input
                        type='date'
                        value={roundAddDate}
                        onChange={(e) => setRoundAddDate(e.target.value)}
                        className='text-xs p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                        title='Date for the interview round to add'
                      />
                      {(() => {
                        // Build a descending list of existing Interviewing dates from the edit form snapshot
                        const datesDesc = Array.isArray(
                          editFormData.status_history
                        )
                          ? editFormData.status_history
                              .filter(
                                (s) => s.status === 'Interviewing' && s.date
                              )
                              .map((s) => s.date)
                              .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
                          : [];
                        if (roundDelta < 0) {
                          const n = Math.min(
                            Math.abs(roundDelta),
                            datesDesc.length
                          );
                          if (n > 0) {
                            const first = datesDesc[0];
                            return (
                              <span className='text-[11px] text-gray-600 dark:text-gray-400 ml-2'>
                                Removing: {first}
                                {n > 1 ? ` (+${n - 1} more)` : ''}
                              </span>
                            );
                          }
                          return (
                            <span className='text-[11px] text-gray-600 dark:text-gray-400 ml-2'>
                              Nothing to remove
                            </span>
                          );
                        } else if (roundDelta > 0) {
                          return (
                            <span className='text-[11px] text-gray-600 dark:text-gray-400 ml-2'>
                              Adding on: {roundAddDate}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <textarea
                      name='notes'
                      value={editFormData.notes}
                      onChange={handleEditChange}
                      className='w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                      rows={3}
                    />
                    <div className='flex flex-wrap gap-4'>
                      {tagOptions.map((tag) => (
                        <label
                          key={tag}
                          className='flex items-center space-x-2 dark:text-dark-text'
                        >
                          <input
                            type='checkbox'
                            checked={editFormData.tags
                              ?.split(',')
                              .map((t) => t.trim())
                              .includes(tag)}
                            onChange={() => handleTagToggle(tag)}
                            className='dark:bg-gray-700'
                          />
                          <span>{tag}</span>
                        </label>
                      ))}
                    </div>
                    <div className='space-x-2'>
                      <button
                        onClick={handleSave}
                        className='bg-green-500 text-white px-2 py-1 rounded dark:bg-cyan-500 dark:hover:bg-cyan-400'
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditJobId(null);
                          setRoundDelta(0);
                          setRoundAddDate(localTodayYMD());
                          setOfferDate(localTodayYMD());
                          setRejectDate(localTodayYMD());
                        }}
                        className='bg-gray-400 text-white px-2 py-1 rounded dark:bg-cyan-800 dark:hover:bg-cyan-900'
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className='flex-1'>
                      <div className='font-semibold dark:text-dark-text'>
                        {job.title} @ {job.company}
                      </div>
                      <div className='text-sm text-light-accent hover:underline underline break-all dark:text-dark-accent dark:hover:text-dark-accentHover'>
                        <a
                          href={job.link}
                          target='_blank'
                          rel='noopener noreferrer'
                          title={job.link}
                        >
                          {job.link.length > 60
                            ? `${job.link.slice(0, 60)}...`
                            : job.link}
                        </a>
                      </div>
                      <div className='dark:text-dark-text'>
                        Status: {job.status}
                      </div>
                      {job.status_history?.length > 0 && (
                        <div className='text-xs text-gray-500 mt-1 dark:text-dark-text'>
                          {job.status_history.map((s, i) => (
                            <div key={i}>
                              {s.status === 'Interviewing'
                                ? 'Interviewed'
                                : s.status === 'Offer'
                                ? 'Offered'
                                : s.status}{' '}
                              on {s.date}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Interview round count (pluralized; hidden when 0) */}
                      {(() => {
                        const rounds = countInterviewRoundsForJob(job);
                        if (rounds < 1) return null;
                        const label = `Interview Round${
                          rounds === 1 ? '' : 's'
                        }: `;
                        return (
                          <div className='text-xs text-gray-500 mt-1 dark:text-dark-text'>
                            {label}
                            {rounds}
                          </div>
                        );
                      })()}
                      <div className='text-gray-700 dark:text-dark-text'>
                        Notes: {job.notes}
                      </div>
                      {job.tags && (
                        <div className='mt-2 flex flex-wrap gap-2'>
                          {job.tags.split(',').map((tag, index) => {
                            let bgClass = 'bg-gray-100';
                            let textClass = 'text-gray-800';
                            if (tag.trim() === 'Remote') {
                              bgClass =
                                'bg-light-tag-remoteBg text-light-tag-remoteText dark:bg-dark-tag-bg dark:text-dark-tag-text';
                              textClass = '';
                            } else if (tag.trim() === 'Hybrid') {
                              bgClass =
                                'bg-light-tag-remoteBg text-light-tag-remoteText dark:bg-dark-tag-bg dark:text-dark-tag-text';
                              textClass = '';
                            } else if (tag.trim() === 'On-Site') {
                              bgClass =
                                'bg-light-tag-remoteBg text-light-tag-remoteText dark:bg-dark-tag-bg dark:text-dark-tag-text';
                              textClass = '';
                            } else if (tag.trim() === 'Referral') {
                              bgClass =
                                'bg-light-tag-referralBg text-light-tag-referralText dark:bg-dark-tag-bg dark:text-dark-tag-text';
                              textClass = '';
                            } else if (tag.trim() === 'Urgent') {
                              bgClass =
                                'bg-light-tag-urgentBg text-light-tag-urgentText dark:bg-dark-tag-bg dark:text-dark-tag-text';
                              textClass = '';
                            } else if (tag.trim() === 'Startup') {
                              bgClass =
                                'bg-light-tag-startupBg text-light-tag-startupText dark:bg-dark-tag-bg dark:text-dark-tag-text';
                              textClass = '';
                            }
                            return (
                              <span
                                key={index}
                                className={`${bgClass} ${textClass} text-xs font-semibold px-2 py-1 rounded`}
                              >
                                {tag.trim()}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className='space-y-2 text-right'>
                      <button
                        onClick={() => handleEditClick(job)}
                        className='text-white px-2 py-1 rounded mr-2 
                          bg-light-accent hover:bg-light-accentHover 
                          dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:hover:shadow-[0_0_10px_#22d3ee]'
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        className='px-2 py-1 rounded 
                          text-white bg-red-400 hover:bg-red-500 
                          dark:bg-red-600 dark:hover:bg-red-500 dark:hover:shadow-[0_0_10px_#f87171]'
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
