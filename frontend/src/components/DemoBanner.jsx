import React from 'react';

const DemoBanner = ({ onReset = () => {} }) => (
  <div className='mb-6 rounded-lg border border-light-accent/40 bg-light-background p-4 text-sm text-light-text shadow-sm dark:border-dark-accent/60 dark:bg-dark-card dark:text-dark-text'>
    <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
      <div>
        <p className='font-medium text-light-accent dark:text-dark-accent'>
          Demo data only — personal data hidden for privacy.
        </p>
        <p className='mt-1 text-xs text-gray-600 dark:text-gray-300'>
          Changes persist locally for this tab using sessionStorage. Reset anytime to restore the bundled sample data.
        </p>
      </div>
      <button
        type='button'
        onClick={onReset}
        className='self-start rounded border border-light-accent px-3 py-1 text-xs font-semibold text-light-accent transition hover:bg-light-accent hover:text-white dark:border-dark-accent dark:text-dark-accent dark:hover:bg-dark-accent dark:hover:text-dark-card'
      >
        Reset Demo
      </button>
    </div>
  </div>
);

export default DemoBanner;
