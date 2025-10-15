import React from 'react';
import { MODES } from '../storage/selectStore';

const optionStyles =
  'flex flex-col gap-2 rounded-lg border border-light-accent/40 bg-light-background p-4 text-left shadow-sm transition hover:border-light-accent hover:shadow-md focus:outline-none focus:ring-2 focus:ring-light-accent dark:border-dark-accent/40 dark:bg-dark-card dark:text-dark-text dark:hover:border-dark-accent';

const titleStyles = 'text-lg font-semibold';
const bodyStyles = 'text-sm text-gray-600 dark:text-gray-300';
const buttonStyles =
  'mt-2 inline-flex items-center gap-2 self-start rounded bg-light-accent px-3 py-1 text-sm font-semibold text-white transition hover:bg-light-accentHover dark:bg-dark-accent dark:hover:bg-dark-accentHover';

const ModeOption = ({ label, description, actionLabel, onClick }) => (
  <button className={optionStyles} type='button' onClick={onClick}>
    <span className={titleStyles}>{label}</span>
    <span className={bodyStyles}>{description}</span>
    <span className={buttonStyles}>{actionLabel}</span>
  </button>
);

const OnboardingModal = ({ open, onSelect }) => {
  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4'>
      <div className='w-full max-w-2xl rounded-xl bg-light-card p-6 text-light-text shadow-lg dark:bg-dark-card dark:text-dark-text'>
        <h2 className='text-2xl font-bold'>Choose how you want to use JobLog</h2>
        <p className='mt-2 text-sm text-gray-600 dark:text-gray-300'>
          Pick the mode that fits your workflow. You can change this later in
          settings.
        </p>
        <div className='mt-6 grid gap-4 md:grid-cols-2'>
          <ModeOption
            label='Personal (Local)'
            description='Store applications privately on this device with IndexedDB. Full tracking, exports, and backups without sending data anywhere.'
            actionLabel='Use personal mode'
            onClick={() => onSelect(MODES.LOCAL)}
          />
          <ModeOption
            label='Public Demo'
            description='Explore JobLog with sample data. Try analytics and workflows with no installs. Data resets when you end the session.'
            actionLabel='Try the demo'
            onClick={() => onSelect(MODES.DEMO)}
          />
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
