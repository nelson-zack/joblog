import React, { useMemo, useRef, useState } from 'react';
import ModeBadge from './ModeBadge';
import { MODES } from '../storage/selectStore';

const actionButton =
  'w-full rounded-lg border border-light-accent/40 bg-light-background px-4 py-3 text-left text-sm font-medium text-light-text shadow-sm transition hover:border-light-accent hover:shadow-md focus:outline-none focus:ring-2 focus:ring-light-accent dark:border-dark-accent/40 dark:bg-dark-card dark:text-dark-text dark:hover:border-dark-accent dark:focus:ring-dark-accent';

const disabledButton =
  'opacity-50 cursor-not-allowed hover:shadow-none hover:border-light-accent/40 dark:hover:border-dark-accent/40';

const SettingsDrawer = ({
  open,
  onClose,
  mode,
  onSelectMode,
  onExportJson,
  onImportJson,
  onExportCsv,
  onClearData,
  reminder
}) => {
  const fileInputRef = useRef(null);
  const [importState, setImportState] = useState({ status: 'idle', message: '' });

  const isAdmin = mode === MODES.ADMIN;
  const isDemo = mode === MODES.DEMO;
  const isLocal = mode === MODES.LOCAL;

  const modeDescription = useMemo(() => {
    if (isAdmin) {
      return 'Connected to the live backend with full read/write access.';
    }
    if (isLocal) {
      return 'Personal data lives privately in IndexedDB on this device.';
    }
    return 'Demo data is stored in sessionStorage and resets when you end the session.';
  }, [isAdmin, isLocal]);

  const ModeSwitchButton = ({ target, title, description }) => {
    const active = mode === target;
    return (
      <button
        type='button'
        disabled={active}
        onClick={() => onSelectMode?.(target)}
        className={`${actionButton} ${
          active
            ? 'border-light-accent bg-light-accent/10 dark:border-dark-accent dark:bg-dark-accent/20'
            : ''
        } ${isAdmin ? disabledButton : ''}`}
      >
        <div className='flex items-center justify-between'>
          <span className='font-semibold'>{title}</span>
          {active && (
            <span className='text-xs uppercase text-light-accent dark:text-dark-accent'>
              Active
            </span>
          )}
        </div>
        <p className='mt-1 text-xs font-normal text-gray-500 dark:text-gray-300'>
          {description}
        </p>
      </button>
    );
  };

  const triggerImport = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await onImportJson?.(text);
      setImportState({
        status: 'success',
        message: `Imported ${file.name} successfully.`
      });
    } catch (error) {
      setImportState({
        status: 'error',
        message: error?.message || 'Import failed. Please verify the file.'
      });
    } finally {
      event.target.value = '';
    }
  };

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-40 flex justify-end bg-black/40'>
      <div className='h-full w-full max-w-md overflow-y-auto bg-light-card p-6 text-light-text shadow-xl dark:bg-dark-card dark:text-dark-text'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h2 className='text-xl font-bold'>Settings &amp; Backups</h2>
            <p className='mt-1 text-xs text-gray-600 dark:text-gray-300'>
              Manage how JobLog stores your data.
            </p>
          </div>
          <button
            onClick={onClose}
            className='rounded border border-transparent px-3 py-1 text-sm text-gray-500 transition hover:text-gray-700 dark:text-gray-300 dark:hover:text-white'
          >
            Close
          </button>
        </div>

        <div className='mt-4 flex items-center justify-between rounded-lg bg-light-background px-4 py-3 text-sm shadow-inner dark:bg-dark-background'>
          <ModeBadge />
          <span className='text-xs text-gray-600 dark:text-gray-300'>
            {modeDescription}
          </span>
        </div>

        {!isAdmin && (
          <div className='mt-6 space-y-3'>
            <p className='text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300'>
              Choose mode
            </p>
            <ModeSwitchButton
              target={MODES.LOCAL}
              title='Personal (Local)'
              description='Store data privately in IndexedDB with full read/write access and backups.'
            />
            <ModeSwitchButton
              target={MODES.DEMO}
              title='Public Demo'
              description='Use curated sample data backed by sessionStorage. Resets on close.'
            />
          </div>
        )}

        {reminder ? (
          <div className='mt-4 rounded-lg border border-amber-400/60 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-300/60 dark:bg-amber-900/20 dark:text-amber-200'>
            <p className='font-semibold'>{reminder.title}</p>
            <p className='mt-1 text-xs'>{reminder.message}</p>
            {reminder.actionLabel && reminder.onAction && (
              <button
                type='button'
                onClick={reminder.onAction}
                className='mt-3 inline-flex items-center rounded bg-amber-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-amber-400 dark:bg-amber-400 dark:text-amber-900 dark:hover:bg-amber-300'
              >
                {reminder.actionLabel}
              </button>
            )}
          </div>
        ) : null}

        <div className='mt-6 space-y-3'>
          <button
            type='button'
            onClick={onExportJson}
            className={`${actionButton} ${isAdmin ? disabledButton : ''}`}
            disabled={isAdmin}
          >
            Export JSON snapshot
            <p className='mt-1 text-xs font-normal text-gray-500 dark:text-gray-300'>
              Save a versioned backup of your applications.
            </p>
          </button>

          <button
            type='button'
            onClick={triggerImport}
            className={`${actionButton} ${
              isAdmin ? disabledButton : ''
            }`}
            disabled={isAdmin}
          >
            Import JSON backup
            <p className='mt-1 text-xs font-normal text-gray-500 dark:text-gray-300'>
              Replace the current dataset with a previously exported backup.
            </p>
          </button>
          <input
            ref={fileInputRef}
            type='file'
            accept='application/json'
            onChange={handleFileChange}
            className='hidden'
          />
          {importState.status !== 'idle' && (
            <p
              className={`text-xs ${
                importState.status === 'error'
                  ? 'text-red-500'
                  : 'text-emerald-500'
              }`}
            >
              {importState.message}
            </p>
          )}

          <button
            type='button'
            onClick={onExportCsv}
            className={actionButton}
          >
            Export CSV
            <p className='mt-1 text-xs font-normal text-gray-500 dark:text-gray-300'>
              Download the current view as a spreadsheet for sharing or
              analysis.
            </p>
          </button>

          <button
            type='button'
            onClick={onClearData}
            className={`${actionButton} ${
              isAdmin
                ? disabledButton
                : 'border-red-400/50 hover:border-red-400 dark:border-red-300/50 dark:hover:border-red-300'
            }`}
            disabled={isAdmin}
          >
            Clear current data
            <p className='mt-1 text-xs font-normal text-gray-500 dark:text-gray-300'>
              Remove all records from this mode. This cannot be undone.
            </p>
          </button>
        </div>

        {isDemo && (
          <p className='mt-4 text-xs text-gray-500 dark:text-gray-300'>
            Demo mode resets automatically when you close the tab. Use “Clear
            current data” to restore the bundled sample dataset sooner.
          </p>
        )}
        {isLocal && (
          <p className='mt-4 text-xs text-gray-500 dark:text-gray-300'>
            Personal mode never sends data to a server. Keep regular exports so
            you can restore from backups if you change devices.
          </p>
        )}
      </div>
    </div>
  );
};

export default SettingsDrawer;
