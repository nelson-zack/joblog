import React from 'react';

const DemoBanner = ({ onReset = () => {} }) => (
  <div className='mb-6 rounded-lg border border-amber-400/60 border-dashed bg-amber-50/70 p-4 text-sm text-amber-700 shadow-sm dark:border-amber-300/60 dark:bg-amber-500/10 dark:text-amber-200'>
    <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
      <div>
        <p className='font-medium text-amber-600 dark:text-amber-200'>
          Demo data only — personal data hidden for privacy.
        </p>
        <p className='mt-1 text-xs text-amber-600/80 dark:text-amber-100/80'>
          Changes persist locally for this tab using sessionStorage. Reset anytime to restore the bundled sample data.
        </p>
      </div>
      <button
        type='button'
        onClick={onReset}
        className='self-start rounded border border-amber-500 px-3 py-1 text-xs font-semibold text-amber-600 transition hover:bg-amber-500 hover:text-white dark:border-amber-300 dark:text-amber-200 dark:hover:bg-amber-300 dark:hover:text-amber-900'
      >
        Reset Demo
      </button>
    </div>
  </div>
);

export default DemoBanner;
