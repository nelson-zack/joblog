import React, { memo, useCallback, useMemo, useRef } from 'react';

const sanitizeUrl = (value) => {
  if (typeof value !== 'string' || value.trim().length < 1) return null;
  const base =
    (typeof window !== 'undefined' && window.location?.origin) || 'https://localhost';
  try {
    const url = new URL(value, base);
    const protocol = url.protocol?.toLowerCase();
    if (protocol === 'http:' || protocol === 'https:') {
      return url.toString();
    }
  } catch {
    // Ignore invalid URLs; fall through to returning null below.
  }
  return null;
};

const JobRow = memo(({
  job,
  isVirtualized,
  isEditing,
  editFormData,
  editTags,
  roundDelta,
  roundAddDate,
  offerDate,
  rejectDate,
  tagOptions,
  onEditChange,
  onTagToggle,
  onSave,
  onCancel,
  onEditClick,
  onDelete,
  setRoundDelta,
  setRoundAddDate,
  setOfferDate,
  setRejectDate,
  countInterviewRoundsForJob,
}) => {
  const containerRef = useRef(null);
  const safeTags = Array.isArray(editTags) ? editTags : [];
  const safeTagOptions = Array.isArray(tagOptions) ? tagOptions : [];
  const showOfferDate = editFormData?.status === 'Offer';
  const showRejectDate = editFormData?.status === 'Rejected';
  const safeLink = useMemo(() => sanitizeUrl(job?.link), [job?.link]);
  const clampRoundDelta = useCallback((value) => {
    const normalized = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return Math.max(-99, Math.min(1, normalized));
  }, []);
  const adjustRoundDelta = useCallback((delta) => {
    if (!setRoundDelta) return;
    setRoundDelta((current) => {
      const base = typeof current === 'number' && Number.isFinite(current) ? current : 0;
      return clampRoundDelta(base + delta);
    });
  }, [clampRoundDelta, setRoundDelta]);

  const OuterTag = isVirtualized ? 'div' : 'li';
  const outerProps = isVirtualized
    ? {
        ref: containerRef,
        role: 'listitem'
      }
    : {
        ref: containerRef,
        className: 'list-none mb-3 last:mb-0'
      };

  return (
    <OuterTag {...outerProps}>
      <div
        className='p-4 border rounded shadow bg-light-background dark:bg-dark-card dark:border-dark-accent text-left'
      >
        <div className='flex justify-between items-start'>
          {isEditing ? (
            <div className='w-full space-y-2'>
              <select
                name='status'
                value={editFormData?.status || ''}
                onChange={onEditChange}
                className='p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white'
              >
                <option value='Applied'>Applied</option>
                <option value='Interviewing'>Interview</option>
                <option value='Offer'>Offer</option>
                <option value='Rejected'>Rejected</option>
              </select>
              {showOfferDate && (
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-gray-600 dark:text-gray-300'>
                    Offer date:
                  </span>
                  <input
                    type='date'
                    value={offerDate || ''}
                    onChange={(e) => setOfferDate?.(e.target.value)}
                    className='text-xs p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                  />
                </div>
              )}
              {showRejectDate && (
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-gray-600 dark:text-gray-300'>
                    Rejection date:
                  </span>
                  <input
                    type='date'
                    value={rejectDate || ''}
                    onChange={(e) => setRejectDate?.(e.target.value)}
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
                  onClick={() => adjustRoundDelta(-1)}
                  className='text-xs px-2 py-1 rounded border dark:border-gray-600 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700'
                  title='Remove last interview entry'
                  aria-label='Remove last interview entry'
                >
                  −
                </button>
                <button
                  type='button'
                  onClick={() => adjustRoundDelta(1)}
                  className='text-xs px-2 py-1 rounded border dark:border-gray-600 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700'
                  title='Plan to add one interview entry'
                  aria-label='Plan to add one interview entry'
                >
                  +
                </button>
                <span className='text-xs text-gray-600 dark:text-gray-300'>
                  : {roundDelta && roundDelta > 0 ? `+${Math.min(1, roundDelta)}` : roundDelta ?? 0}
                </span>
                <span className='text-xs text-gray-600 dark:text-gray-300 ml-2'>
                  on
                </span>
                <input
                  type='date'
                  value={roundAddDate || ''}
                  onChange={(e) => setRoundAddDate?.(e.target.value)}
                  className='text-xs p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                  title='Date for the interview round to add'
                />
                {(() => {
                  const datesDesc = Array.isArray(editFormData?.status_history)
                    ? editFormData.status_history
                        .filter((s) => s.status === 'Interviewing' && s.date)
                        .map((s) => s.date)
                        .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
                    : [];
                  if ((roundDelta ?? 0) < 0) {
                    const n = Math.min(Math.abs(roundDelta ?? 0), datesDesc.length);
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
                  }
                  if ((roundDelta ?? 0) > 0) {
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
                value={editFormData?.notes || ''}
                onChange={onEditChange}
                className='w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white'
                rows={3}
              />
              <div className='flex flex-wrap gap-4'>
                {safeTagOptions.map((tag) => (
                  <label
                    key={tag}
                    className='flex items-center space-x-2 dark:text-dark-text'
                  >
                    <input
                      type='checkbox'
                      checked={safeTags.includes(tag)}
                      onChange={() => onTagToggle?.(tag)}
                      className='dark:bg-gray-700'
                    />
                    <span>{tag}</span>
                  </label>
                ))}
              </div>
              <div className='space-x-2'>
                <button
                  type='button'
                  onClick={onSave}
                  className='bg-green-500 text-white px-2 py-1 rounded dark:bg-cyan-500 dark:hover:bg-cyan-400'
                >
                  Save
                </button>
                <button
                  type='button'
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
                {safeLink && (
                  <div className='mt-1'>
                    <a
                      href={safeLink}
                      target='_blank'
                      rel='noopener noreferrer'
                      title={job.link}
                      className='inline-flex items-center gap-1 text-sm font-medium text-light-accent hover:underline dark:text-dark-accent dark:hover:text-dark-accentHover'
                    >
                      View
                    </a>
                  </div>
                )}
                <div className='dark:text-dark-text'>
                  Status: {job.status}
                </div>
                {job.status_history?.length > 0 && (
                  <div className='text-xs text-gray-500 mt-1 dark:text-dark-text'>
                    {job.status_history.map((s, index) => (
                      <div key={index}>
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
                {(() => {
                  const rounds = countInterviewRoundsForJob(job);
                  if (rounds < 1) return null;
                  const label = `Interview Round${rounds === 1 ? '' : 's'}: `;
                  return (
                    <div className='text-xs text-gray-500 mt-1 dark:text-dark-text'>
                      {label}
                      {rounds}
                    </div>
                  );
                })()}
                <div className='text-gray-700 dark:text-dark-text'>
                  Notes: {job.notes || ''}
                </div>
                {job.tags && (
                  <div className='mt-2 flex flex-wrap gap-2'>
                    {job.tags.split(',').map((tag, index) => {
                      const trimmed = tag.trim();
                      let bgClass = 'bg-gray-100';
                      let textClass = 'text-gray-800';
                      if (trimmed === 'Remote' || trimmed === 'Hybrid' || trimmed === 'On-Site') {
                        bgClass =
                          'bg-light-tag-remoteBg text-light-tag-remoteText dark:bg-dark-tag-bg dark:text-dark-tag-text';
                        textClass = '';
                      } else if (trimmed === 'Referral') {
                        bgClass =
                          'bg-light-tag-referralBg text-light-tag-referralText dark:bg-dark-tag-bg dark:text-dark-tag-text';
                        textClass = '';
                      } else if (trimmed === 'Urgent') {
                        bgClass =
                          'bg-light-tag-urgentBg text-light-tag-urgentText dark:bg-dark-tag-bg dark:text-dark-tag-text';
                        textClass = '';
                      } else if (trimmed === 'Startup') {
                        bgClass =
                          'bg-light-tag-startupBg text-light-tag-startupText dark:bg-dark-tag-bg dark:text-dark-tag-text';
                        textClass = '';
                      }
                      return (
                        <span
                          key={index}
                          className={`${bgClass} ${textClass} text-xs font-semibold px-2 py-1 rounded`}
                        >
                          {trimmed}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className='flex flex-col sm:flex-row sm:items-center sm:gap-2 text-right gap-1'>
                <button
                  onClick={() => onEditClick?.(job)}
                  className='text-white px-2 py-1 rounded bg-light-accent hover:bg-light-accentHover dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:hover:shadow-[0_0_10px_#22d3ee] text-sm sm:text-base'
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete?.(job.id)}
                  className='px-2 py-1 rounded text-white bg-red-400 hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-500 dark:hover:shadow-[0_0_10px_#f87171] text-sm sm:text-base'
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </OuterTag>
  );
});

export default JobRow;
