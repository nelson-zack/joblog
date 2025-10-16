import React, { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STAT_CARDS = [
  { key: 'unique_installs', label: 'Unique installs' },
  { key: 'active_7d', label: 'Active last 7 days' },
  { key: 'active_30d', label: 'Active last 30 days' },
  { key: 'total_launches', label: 'Total launches' },
  { key: 'total_events', label: 'Total events' },
  { key: 'jobs_created', label: 'Jobs created' },
  { key: 'users_exported', label: 'Users exported' }
];

const AdminStats = ({ apiKey }) => {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!apiKey || !API_BASE_URL) return;
    let cancelled = false;
    setStatus('loading');
    fetch(`${API_BASE_URL}/admin/stats?key=${encodeURIComponent(apiKey)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load stats: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setStats(data);
          setStatus('ready');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Unable to fetch analytics stats:', error);
          setStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  if (!apiKey || !API_BASE_URL) return null;

  const modeBuckets = stats?.by_mode;
  const modeOrder = [
    { key: 'local', label: 'Personal (Local)' },
    { key: 'demo', label: 'Public Demo' },
    { key: 'admin', label: 'Admin' }
  ];

  return (
    <div className='mb-6 rounded-lg border border-light-accent/30 bg-light-background p-4 text-sm text-light-text shadow-sm dark:border-dark-accent/40 dark:bg-dark-card dark:text-dark-text'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>Anonymous usage analytics</h2>
        <span className='rounded-full border border-light-accent px-2 py-1 text-xs font-semibold text-light-accent dark:border-dark-accent dark:text-dark-accent'>
          Admin only
        </span>
      </div>
      {status === 'error' && (
        <p className='text-xs text-red-500 dark:text-red-300'>
          Unable to load analytics right now. Please try again later.
        </p>
      )}
      <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
        {STAT_CARDS.map(({ key, label }) => (
          <div
            key={key}
            className='rounded-lg border border-light-accent/25 bg-white/60 p-3 text-center shadow-sm dark:border-dark-accent/30 dark:bg-dark-background'
          >
            <div className='text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400'>
              {label}
            </div>
            <div className='mt-2 text-2xl font-semibold text-light-accent dark:text-dark-accent'>
              {stats ? stats[key]?.toLocaleString?.() ?? stats[key] : status === 'loading' ? '…' : '0'}
            </div>
          </div>
        ))}
      </div>

      {modeBuckets && (
        <div className='mt-8'>
          <h3 className='mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
            By Mode
          </h3>
          <div className='grid gap-4 md:grid-cols-3'>
            {modeOrder.map(({ key, label }) => {
              const bucket = modeBuckets?.[key] || {};
              const cells = [
                { label: 'Installs', value: bucket.installs },
                { label: 'Active 7d', value: bucket.active_7d },
                { label: 'Active 30d', value: bucket.active_30d },
                { label: 'Launches', value: bucket.launches },
                { label: 'Events', value: bucket.events_total },
                { label: 'Jobs created', value: bucket.jobs_created },
                { label: 'Users exported', value: bucket.users_exported }
              ];

              return (
                <div
                  key={key}
                  className='flex flex-col gap-2 rounded-lg border border-light-accent/20 bg-white/80 p-3 text-left shadow-sm dark:border-dark-accent/25 dark:bg-dark-background'
                >
                  <div className='text-sm font-semibold text-light-accent dark:text-dark-accent'>
                    {label}
                  </div>
                  <div className='grid gap-1 text-xs text-gray-600 dark:text-gray-300'>
                    {cells.map(({ label: cellLabel, value }) => (
                      <div key={cellLabel} className='flex items-center justify-between'>
                        <span>{cellLabel}</span>
                        <span className='font-semibold text-light-text dark:text-dark-text'>
                          {value?.toLocaleString?.() ?? value ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStats;
