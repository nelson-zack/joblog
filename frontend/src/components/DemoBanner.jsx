import React from 'react';

const DemoBanner = () => (
  <div className='mb-6 rounded-lg border border-light-accent/40 bg-light-background p-4 text-sm text-light-text shadow-sm dark:border-dark-accent/60 dark:bg-dark-card dark:text-dark-text'>
    <p className='font-medium text-light-accent dark:text-dark-accent'>
      Demo data only — personal data hidden for privacy.
    </p>
    <p className='mt-1 text-xs text-gray-600 dark:text-gray-300'>
      This public demo uses sample data for privacy. In personal use, JobLog has
      tracked 250+ real applications.
    </p>
  </div>
);

export default DemoBanner;
