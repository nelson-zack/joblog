import React from 'react';

const PersonalBanner = ({ onDismiss }) => (
  <div className='mb-6 rounded-lg border border-light-accent/35 bg-light-accent/10 px-4 py-3 text-sm text-light-accent shadow-sm dark:border-dark-accent/50 dark:bg-dark-card dark:text-dark-accent'>
    <div className='flex items-start justify-between gap-3'>
      <div>
        <p className='font-semibold text-light-accent dark:text-dark-accent'>
          Personal mode keeps data on this device only.
        </p>
        <p className='mt-1 text-xs text-light-accent/80 dark:text-dark-accent/80'>
          Export a JSON backup regularly—clearing browser data, using private
          windows, or switching devices will remove local entries.
        </p>
      </div>
      <button
        type='button'
        onClick={onDismiss}
        className='rounded border border-transparent px-2 py-1 text-xs font-semibold text-light-accent transition hover:bg-light-accent hover:text-white dark:text-dark-accent dark:hover:bg-dark-accent dark:hover:text-white'
      >
        Dismiss
      </button>
    </div>
  </div>
);

export default PersonalBanner;
