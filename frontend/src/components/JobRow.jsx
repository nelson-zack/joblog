import React, { useMemo } from 'react';
import { countInterviewRounds, parseTags } from '../utils/derive';
import { todayYMDLocal } from '../utils/date';

const JobRow = React.memo(
  ({
    job,
    isEditing,
    editFormData,
    onStartEdit,
    onChangeEdit,
    onSave,
    onCancel,
    onDelete,
    onRoundDelta,
    onRoundDateChange,
    onOfferDateChange,
    onRejectDateChange,
    onTagToggle,
    roundDelta,
    roundAddDate,
    offerDate,
    rejectDate,
    tagOptions,
    isAdmin,
    ensureDate,
    handleDelete,
    editTags
  }) => {
    const interviewRounds = useMemo(
      () => countInterviewRounds(job.status_history),
      [job.status_history]
    );

    const jobTags = useMemo(() => parseTags(job.tags).map((tag) => tag.trim()), [job.tags]);

    return (
      <li
        key={job.id}
        className='p-4 border rounded shadow bg-light-background dark:bg-dark-card dark:border-dark-accent text-left'
      >
        <div className='flex justify-between items-start'>
          {isEditing ? (
            <div className='w-full space-y-2'>
              <select
                name='status'
                value={editFormData.status}
                onChange={onChangeEdit}
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
                    onChange={onOfferDateChange}
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
                    onChange={onRejectDateChange}
                    className='text-xs p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                  />
                </div>
              )}
              <div className='flex items-center gap-2 flex-wrap'>
                <span className='text-xs text-gray-600 dark:text-gray-300'>
                  Interview Round:
                </span>
                <button
                  type='button'
                  onClick={() => onRoundDelta(roundDelta - 1)}
                  className='text-xs px-2 py-1 rounded border dark:border-gray-600 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700'
                  title='Remove last interview entry'
                  aria-label='Remove last interview entry'
                >
                  −
                </button>
                <button
                  type='button'
                  onClick={() => onRoundDelta(Math.min(1, roundDelta + 1))}
                  className='text-xs px-2 py-1 rounded border dark:border-gray-600 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700'
                  title='Plan to add one interview entry'
                  aria-label='Plan to add one interview entry'
                >
                  +
                </button>
                <span className='text-xs text-gray-600 dark:text-gray-300'>
                  : {roundDelta > 0 ? `+${Math.min(1, roundDelta)}` : roundDelta}
                </span>
                <span className='text-xs text-gray-600 dark:text-gray-300 ml-2'>
                  on
                </span>
                <input
                  type='date'
                  value={roundAddDate}
                  onChange={onRoundDateChange}
                  className='text-xs p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                  title='Date for the interview round to add'
                />
                {(() => {
                  const datesDesc = Array.isArray(editFormData.status_history)
                    ? editFormData.status_history
                        .filter((s) => s.status === 'Interviewing' && s.date)
                        .map((s) => s.date)
                        .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
                    : [];
                  if (roundDelta < 0) {
                    const n = Math.min(Math.abs(roundDelta), datesDesc.length);
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
                onChange={onChangeEdit}
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
                      checked={editTags.includes(tag)}
                      onChange={() => onTagToggle(tag)}
                      className='dark:bg-gray-700'
                    />
                    <span>{tag}</span>
                  </label>
                ))}
              </div>
              <div className='space-x-2'>
                <button
                  onClick={onSave}
                  className='bg-green-500 text-white px-2 py-1 rounded dark:bg-cyan-500 dark:hover:bg-cyan-400'
                >
                  Save
                </button>
                <button
                  onClick={onCancel}
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
                    {job.link.length > 60 ? `${job.link.slice(0, 60)}...` : job.link}
                  </a>
                </div>
                <div className='dark:text-dark-text'>Status: {job.status}</div>
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
                {interviewRounds > 0 && (
                  <div className='text-xs text-gray-500 mt-1 dark:text-dark-text'>
                    {`Interview Round${interviewRounds === 1 ? '' : 's'}: ${interviewRounds}`}
                  </div>
                )}
                <div className='text-gray-700 dark:text-dark-text'>Notes: {job.notes}</div>
                {jobTags.length > 0 && (
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {jobTags.map((tag, index) => {
                      let bgClass = 'bg-gray-100';
                      let textClass = 'text-gray-800';
                      if (tag === 'Remote') {
                        bgClass =
                          'bg-light-tag-remoteBg text-light-tag-remoteText dark:bg-dark-tag-bg dark:text-dark-tag-text';
                        textClass = '';
                      } else if (tag === 'Hybrid') {
                        bgClass =
                          'bg-light-tag-remoteBg text-light-tag-remoteText dark:bg-dark-tag-bg dark:text-dark-tag-text';
                        textClass = '';
                      } else if (tag === 'On-Site') {
                        bgClass =
                          'bg-light-tag-remoteBg text-light-tag-remoteText dark:bg-dark-tag-bg dark:text-dark-tag-text';
                        textClass = '';
                      } else if (tag === 'Referral') {
                        bgClass =
                          'bg-light-tag-referralBg text-light-tag-referralText dark:bg-dark-tag-bg dark:text-dark-tag-text';
                        textClass = '';
                      } else if (tag === 'Urgent') {
                        bgClass =
                          'bg-light-tag-urgentBg text-light-tag-urgentText dark:bg-dark-tag-bg dark:text-dark-tag-text';
                        textClass = '';
                      } else if (tag === 'Startup') {
                        bgClass =
                          'bg-light-tag-startupBg text-light-tag-startupText dark:bg-dark-tag-bg dark:text-dark-tag-text';
                        textClass = '';
                      }
                      return (
                        <span
                          key={index}
                          className={`${bgClass} ${textClass} text-xs font-semibold px-2 py-1 rounded`}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className='space-y-2 text-right'>
                <button
                  onClick={() => onStartEdit(job)}
                  className='text-white px-2 py-1 rounded mr-2 
                    bg-light-accent hover:bg-light-accentHover 
                    dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:hover:shadow-[0_0_10px_#22d3ee]'
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(job.id)}
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
    );
  }
);

export default JobRow;
