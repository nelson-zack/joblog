import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Virtuoso } from 'react-virtuoso';
import ApplicationTrends from './ApplicationTrends';
import JobRow from './JobRow';
import { MODES } from '../storage/selectStore';
import {
  normalizeYMD,
  parseYMDToUTC,
  todayYMDLocal
} from '../utils/date';
import { exportJobsToCsv } from '../utils/csv';
import { joinTags, parseTags } from '../utils/tags';

const SEARCH_DEBOUNCE_MS = 200;
const SIMPLE_LIST_THRESHOLD = 30;
const HIDE_INSIGHTS_KEY = 'joblog_hide_insights';

const safeReadLocalStorage = (key) => {
  try {
    return typeof window !== 'undefined'
      ? window.localStorage.getItem(key)
      : null;
  } catch (error) {
    console.warn(`localStorage read failed for ${key}:`, error);
    return null;
  }
};

const safeWriteLocalStorage = (key, value) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  } catch (error) {
    console.warn(`localStorage write failed for ${key}:`, error);
  }
};

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
  const [roundDelta, setRoundDelta] = useState(0);
  const [roundAddDate, setRoundAddDate] = useState(todayYMDLocal());
  const [offerDate, setOfferDate] = useState(todayYMDLocal());
  const [rejectDate, setRejectDate] = useState(todayYMDLocal());

  const [statusFilter, setStatusFilter] = useState('All');
  const [tagFilter, setTagFilter] = useState('All');
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [insightsHidden, setInsightsHidden] = useState(() => {
    const stored = safeReadLocalStorage(HIDE_INSIGHTS_KEY);
    return stored === 'true';
  });
  const [showScrollTop, setShowScrollTop] = useState(false);

  const searchInputRef = useRef(null);
  const virtuosoRef = useRef(null);

  const tagOptions = useMemo(
    () => [
      'Remote',
      'Hybrid',
      'On-Site',
      'Referral',
      'Urgent',
      'Startup'
    ],
    []
  );

  const editTags = useMemo(
    () => parseTags(editFormData.tags),
    [editFormData.tags]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchValue.trim().toLowerCase());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    safeWriteLocalStorage(HIDE_INSIGHTS_KEY, insightsHidden ? 'true' : 'false');
  }, [insightsHidden]);

  useEffect(() => {
    const handleHotkey = (event) => {
      if (
        event.key !== '/' ||
        event.altKey ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey
      ) {
        return;
      }
      const target = event.target;
      const isEditable =
        target?.isContentEditable ||
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA';
      if (isEditable) return;
      event.preventDefault();
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };

    window.addEventListener('keydown', handleHotkey);
    return () => window.removeEventListener('keydown', handleHotkey);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 320);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const countInterviewRoundsForJob = useCallback((job) => {
    return Array.isArray(job?.status_history)
      ? job.status_history.filter((s) => s.status === 'Interviewing').length
      : 0;
  }, []);

  const analytics = useMemo(() => {
    const totalSubmitted = jobs.length;
    const pending = jobs.filter((job) => job.status === 'Applied').length;

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

    return {
      totalSubmitted,
      pending,
      companiesInterviewing,
      interviewRounds,
      offers,
      rejections,
      offerRate
    };
  }, [jobs, countInterviewRoundsForJob]);

  const filteredSortedJobs = useMemo(() => {
    const list = Array.isArray(jobs) ? jobs : [];
    const searchTerm = debouncedSearch;

    const filtered = list.filter((job) => {
      const matchesStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Interviewing'
          ? job.status === 'Interviewing' ||
            (Array.isArray(job.status_history) &&
              job.status_history.some((s) => s.status === 'Interviewing'))
          : job.status === statusFilter;
      if (!matchesStatus) return false;

      if (tagFilter !== 'All') {
        if (!job.tags) return false;
        const tags = parseTags(job.tags);
        if (!tags.includes(tagFilter)) return false;
      }

      if (!searchTerm) return true;
      const haystack = [
        job.title,
        job.company,
        job.notes,
        job.tags
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(searchTerm);
    });

    return filtered
      .slice()
      .sort((a, b) => {
        const da = parseYMDToUTC(a.date_applied);
        const db = parseYMDToUTC(b.date_applied);
        if (da !== db) {
          return db - da;
        }
        const aid = Number(a.id) || 0;
        const bid = Number(b.id) || 0;
        return bid - aid;
      });
  }, [jobs, statusFilter, tagFilter, debouncedSearch]);

  const shouldVirtualize = filteredSortedJobs.length >= SIMPLE_LIST_THRESHOLD;

  const handleToggleInsights = useCallback(() => {
    setInsightsHidden((current) => !current);
  }, []);

  const handleDelete = useCallback(async (id) => {
    try {
      await onDeleteJob?.(id);
    } catch (error) {
      console.error('Error deleting job:', error);
      if (isAdmin) {
        alert('Failed to delete job on the server. Please try again.');
      }
    }
  }, [onDeleteJob, isAdmin]);

  const refreshVirtuosoLayout = useCallback(() => {
    virtuosoRef.current?.refresh();
  }, []);

  const handleEditClick = useCallback((job) => {
    const today = todayYMDLocal();
    setEditJobId(job.id);
    setEditFormData({ ...job });
    setRoundDelta(0);
    setRoundAddDate(today);
    setOfferDate(today);
    setRejectDate(today);
    window.requestAnimationFrame(refreshVirtuosoLayout);
  }, [refreshVirtuosoLayout]);

  const handleEditChange = useCallback((event) => {
    const { name, value } = event.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleTagToggle = useCallback((tag) => {
    setEditFormData((prev) => {
      const tags = parseTags(prev.tags);
      const next = tags.includes(tag)
        ? tags.filter((value) => value !== tag)
        : [...tags, tag];
      return { ...prev, tags: joinTags(next) };
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditJobId(null);
    setRoundDelta(0);
    setRoundAddDate(todayYMDLocal());
    setOfferDate(todayYMDLocal());
    setRejectDate(todayYMDLocal());
    window.requestAnimationFrame(refreshVirtuosoLayout);
  }, [refreshVirtuosoLayout]);

  const handleSave = useCallback(async () => {
    const original = jobs.find((job) => job.id === editJobId);
    if (!original) return;

    const updatedHistory = Array.isArray(original.status_history)
      ? [...original.status_history]
      : [...(editFormData.status_history || [])];

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

    if (roundDelta > 0) {
      const toAdd = Math.min(1, roundDelta);
      for (let i = 0; i < toAdd; i += 1) {
        const roundDate = ensureDate(roundAddDate, 'Interview round date');
        if (!roundDate && !isAdmin) return;
        updatedHistory.push({
          status: 'Interviewing',
          date: roundDate || todayYMDLocal()
        });
      }
    } else if (roundDelta < 0) {
      let toRemove = Math.min(Math.abs(roundDelta), updatedHistory.length);
      while (toRemove > 0) {
        const idx = [...updatedHistory]
          .map((h, index) => ({ index, h }))
          .reverse()
          .find((entry) => entry.h.status === 'Interviewing')?.index;
        if (idx == null) break;
        updatedHistory.splice(idx, 1);
        toRemove -= 1;
      }
    }

    if (editFormData.status === 'Offer') {
      const hadOfferBefore =
        Array.isArray(original.status_history) &&
        original.status_history.some((s) => s.status === 'Offer');
      const hasOfferNow =
        Array.isArray(updatedHistory) &&
        updatedHistory.some((s) => s.status === 'Offer');
      if (!hadOfferBefore && !hasOfferNow) {
        const normalizedOfferDate = ensureDate(offerDate, 'Offer date');
        if (!normalizedOfferDate && !isAdmin) return;
        updatedHistory.push({
          status: 'Offer',
          date: normalizedOfferDate || todayYMDLocal()
        });
      }
    } else if (editFormData.status === 'Rejected') {
      const hadRejectBefore =
        Array.isArray(original.status_history) &&
        original.status_history.some((s) => s.status === 'Rejected');
      const hasRejectNow =
        Array.isArray(updatedHistory) &&
        updatedHistory.some((s) => s.status === 'Rejected');
      if (!hadRejectBefore && !hasRejectNow) {
        const normalizedRejectDate = ensureDate(rejectDate, 'Rejection date');
        if (!normalizedRejectDate && !isAdmin) return;
        updatedHistory.push({
          status: 'Rejected',
          date: normalizedRejectDate || todayYMDLocal()
        });
      }
    }

    if (editFormData.status === 'Offer') {
      const hasOfferFinal =
        Array.isArray(updatedHistory) &&
        updatedHistory.some((s) => s.status === 'Offer');
      if (!hasOfferFinal) {
        const normalizedOfferDate = ensureDate(offerDate, 'Offer date');
        if (!normalizedOfferDate && !isAdmin) return;
        updatedHistory.push({
          status: 'Offer',
          date: normalizedOfferDate || todayYMDLocal()
        });
      }
    } else if (editFormData.status === 'Rejected') {
      const hasRejectFinal =
        Array.isArray(updatedHistory) &&
        updatedHistory.some((s) => s.status === 'Rejected');
      if (!hasRejectFinal) {
        const normalizedRejectDate = ensureDate(rejectDate, 'Rejection date');
        if (!normalizedRejectDate && !isAdmin) return;
        updatedHistory.push({
          status: 'Rejected',
          date: normalizedRejectDate || todayYMDLocal()
        });
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
      window.requestAnimationFrame(refreshVirtuosoLayout);
    } catch (error) {
      console.error('Error updating job:', error);
      if (isAdmin) {
        alert('Failed to update job on the server. Please try again.');
      }
    }
  }, [
    jobs,
    editJobId,
    editFormData,
    roundDelta,
    roundAddDate,
    offerDate,
    rejectDate,
    isAdmin,
    onUpdateJob,
    refreshVirtuosoLayout
  ]);

  const handleExportCsv = useCallback(() => {
    exportJobsToCsv(filteredSortedJobs, 'job_applications.csv');
  }, [filteredSortedJobs]);

  const handleScrollTop = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.requestAnimationFrame(() => {
      const input = searchInputRef.current;
      if (!input) return;
      try {
        input.focus({ preventScroll: true });
      } catch {
        input.focus();
      }
    });
  }, []);

  const renderVirtualRow = useCallback((index, job) => {
    if (!job) return null;
    const isLast = index === filteredSortedJobs.length - 1;
    return (
      <div className={isLast ? '' : 'pb-3 md:pb-4'}>
        <JobRow
          job={job}
          isVirtualized
          isEditing={job.id === editJobId}
          editFormData={editFormData}
          editTags={editTags}
          roundDelta={roundDelta}
          roundAddDate={roundAddDate}
          offerDate={offerDate}
          rejectDate={rejectDate}
          tagOptions={tagOptions}
          onEditChange={handleEditChange}
          onTagToggle={handleTagToggle}
          onSave={handleSave}
          onCancel={handleCancelEdit}
          onEditClick={handleEditClick}
          onDelete={handleDelete}
          setRoundDelta={setRoundDelta}
          setRoundAddDate={setRoundAddDate}
          setOfferDate={setOfferDate}
          setRejectDate={setRejectDate}
          countInterviewRoundsForJob={countInterviewRoundsForJob}
        />
      </div>
    );
  }, [
    editJobId,
    editFormData,
    editTags,
    roundDelta,
    roundAddDate,
    offerDate,
    rejectDate,
    tagOptions,
    handleEditChange,
    handleTagToggle,
    handleSave,
    handleCancelEdit,
    handleEditClick,
    handleDelete,
    countInterviewRoundsForJob,
    filteredSortedJobs.length
  ]);

  return (
    <section className='px-4 pb-12'>
      <div className='max-w-6xl mx-auto'>
        <h2 className='text-xl font-bold mb-4 dark:text-dark-text'>
          Job Applications
        </h2>

        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4'>
          <div className='text-lg font-semibold dark:text-dark-text'>
            Insights
          </div>
          <button
            onClick={handleToggleInsights}
            className='text-sm border px-3 py-1 rounded transition bg-light-background dark:bg-dark-card dark:text-dark-text border-light-accent dark:border-dark-accent hover:bg-light-accent hover:text-white dark:hover:bg-dark-accent dark:hover:text-dark-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-accent dark:focus-visible:ring-dark-accent'
            aria-pressed={!insightsHidden}
          >
            {insightsHidden ? 'Show insights' : 'Hide insights'}
          </button>
        </div>

        {!insightsHidden && (
          <div className='space-y-6 mb-6'>
            <ApplicationTrends jobs={jobs} />

            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center'>
              <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
                <div className='text-sm text-light-text dark:text-dark-text'>
                  Submitted
                </div>
                <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
                  {analytics.totalSubmitted}
                </div>
              </div>
              <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
                <div className='text-sm text-light-text dark:text-dark-text'>
                  Pending
                </div>
                <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
                  {analytics.pending}
                </div>
              </div>
              <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
                <div className='text-sm text-light-text dark:text-dark-text'>
                  Interviewed Companies
                </div>
                <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
                  {analytics.companiesInterviewing}
                </div>
              </div>
              <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
                <div className='text-sm text-light-text dark:text-dark-text'>
                  Interview Rounds
                </div>
                <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
                  {analytics.interviewRounds}
                </div>
              </div>
              <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
                <div className='text-sm text-light-text dark:text-dark-text'>
                  Offers
                </div>
                <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
                  {analytics.offers}
                </div>
              </div>
              <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded'>
                <div className='text-sm text-light-text dark:text-dark-text'>
                  Rejected
                </div>
                <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
                  {analytics.rejections}
                </div>
              </div>
            </div>

            <div className='bg-light-background dark:bg-dark-card dark:border dark:border-dark-accent p-3 rounded text-center'>
              <div className='text-sm text-light-text dark:text-dark-text'>
                Offer Rate
              </div>
              <div className='text-xl font-semibold text-light-text dark:text-dark-text'>
                {analytics.offerRate}
              </div>
            </div>
          </div>
        )}

        <div className='sticky top-0 z-30 mt-6 bg-light-background/95 dark:bg-dark-card/95 backdrop-blur border border-light-muted dark:border-dark-accent rounded-lg shadow-sm px-3 py-3 md:px-4 md:py-4 flex flex-col gap-3 md:gap-4'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-end md:items-center md:justify-between'>
            <label className='flex-1 flex flex-col gap-1 md:max-w-sm'>
              <span className='text-xs font-medium text-gray-500 dark:text-gray-300 md:text-sm md:text-inherit md:text-gray-900 dark:md:text-dark-text'>
                Search (press /)
              </span>
              <input
                ref={searchInputRef}
                type='search'
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder='Title, company, notes, tags'
                className='w-full p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-accent dark:focus-visible:ring-dark-accent md:text-base'
              />
            </label>
            <button
              onClick={handleExportCsv}
              className='w-full sm:w-auto px-3 py-2 bg-light-accent text-white rounded text-sm hover:bg-light-accentHover transition dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:hover:shadow-[0_0_10px_#22d3ee] sm:self-end md:self-auto md:text-base'
            >
              Export filtered CSV
            </button>
          </div>

          <div className='grid grid-cols-2 gap-2 sm:gap-3 md:flex md:items-center md:justify-between md:gap-4'>
            <label className='flex flex-col gap-1 text-xs font-semibold dark:text-dark-text col-span-1 md:text-sm md:flex-row md:items-center md:gap-2 md:col-auto'>
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className='w-full p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-accent dark:focus-visible:ring-dark-accent md:text-base'
              >
                <option value='All'>All</option>
                <option value='Applied'>Applied</option>
                <option value='Interviewing'>Interview</option>
                <option value='Offer'>Offer</option>
                <option value='Rejected'>Rejected</option>
              </select>
            </label>

            <label className='flex flex-col gap-1 text-xs font-semibold dark:text-dark-text col-span-1 md:text-sm md:flex-row md:items-center md:gap-2 md:col-auto'>
              <span>Tag</span>
              <select
                value={tagFilter}
                onChange={(event) => setTagFilter(event.target.value)}
                className='w-full p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light-accent dark:focus-visible:ring-dark-accent md:text-base'
              >
                <option value='All'>All</option>
                {tagOptions.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </label>

            <div className='col-span-2 text-xs text-gray-600 dark:text-gray-300 md:col-auto md:ml-auto md:text-sm'>
              Showing {filteredSortedJobs.length} result
              {filteredSortedJobs.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        <div className='mt-6 space-y-4'>
          {shouldVirtualize ? (
            <Virtuoso
              ref={virtuosoRef}
              useWindowScroll
              data={filteredSortedJobs}
              itemContent={renderVirtualRow}
              increaseViewportBy={{ top: 400, bottom: 400 }}
            />
          ) : (
            <ul className='space-y-3 md:space-y-4'>
              {filteredSortedJobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  isVirtualized={false}
                  isEditing={job.id === editJobId}
                  editFormData={editFormData}
                  editTags={editTags}
                  roundDelta={roundDelta}
                  roundAddDate={roundAddDate}
                  offerDate={offerDate}
                  rejectDate={rejectDate}
                  tagOptions={tagOptions}
                  onEditChange={handleEditChange}
                  onTagToggle={handleTagToggle}
                  onSave={handleSave}
                  onCancel={handleCancelEdit}
                  onEditClick={handleEditClick}
                  onDelete={handleDelete}
                  setRoundDelta={setRoundDelta}
                  setRoundAddDate={setRoundAddDate}
                  setOfferDate={setOfferDate}
                  setRejectDate={setRejectDate}
                  countInterviewRoundsForJob={countInterviewRoundsForJob}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {showScrollTop && (
        <button
          type='button'
          onClick={handleScrollTop}
          className='fixed bottom-5 right-4 h-10 w-10 md:h-11 md:w-11 rounded-full bg-light-accent text-white text-xl md:text-2xl leading-none shadow-lg transition hover:bg-light-accentHover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-light-accent/60 dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:focus-visible:ring-cyan-400/60'
          style={{ zIndex: 1000 }}
          aria-label='Jump to top'
        >
          ^
        </button>
      )}
    </section>
  );
};

export default JobList;
