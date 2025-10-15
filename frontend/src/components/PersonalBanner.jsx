import React from 'react';

const PersonalBanner = ({ onDismiss }) => (
  <div className='mb-6 rounded-lg border border-indigo-500/30 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 shadow-sm dark:border-indigo-400/40 dark:bg-indigo-900/20 dark:text-indigo-200'>
    <div className='flex items-start justify-between gap-3'>
      <div>
        <p className='font-semibold text-indigo-600 dark:text-indigo-200'>
          Personal mode keeps data on this device only.
        </p>
        <p className='mt-1 text-xs text-indigo-600/80 dark:text-indigo-100/80'>
          Export a JSON backup regularly—clearing browser data, using private
          windows, or switching devices will remove local entries.
        </p>
      </div>
      <button
        type='button'
        onClick={onDismiss}
        className='rounded border border-transparent px-2 py-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800 dark:text-indigo-200 dark:hover:text-white'
      >
        Dismiss
      </button>
    </div>
  </div>
);

export default PersonalBanner;
