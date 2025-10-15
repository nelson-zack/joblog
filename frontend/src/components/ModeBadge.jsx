import React from 'react';
import { useMode } from '../context/ModeContext';
import { MODES } from '../storage/selectStore';

const MODE_LABELS = {
  [MODES.ADMIN]: 'Admin Mode',
  [MODES.LOCAL]: 'Personal Mode',
  [MODES.DEMO]: 'Demo Mode'
};

const getStyles = (mode) => {
  switch (mode) {
    case MODES.ADMIN:
      return 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/40 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-300/30';
    case MODES.LOCAL:
      return 'bg-light-accent/10 text-light-accent border border-light-accent/40 dark:bg-dark-accent/10 dark:text-dark-accent dark:border-dark-accent/40';
    case MODES.DEMO:
    default:
      return 'bg-light-tag-remoteBg text-light-accent border border-light-accent/40 dark:bg-dark-card dark:text-dark-accent dark:border-dark-accent/40';
  }
};

const ModeBadge = ({ className = '' }) => {
  const { mode } = useMode();
  const label = MODE_LABELS[mode] ?? MODE_LABELS[MODES.DEMO];
  const styles = getStyles(mode);

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles} ${className}`}
    >
      {label}
    </span>
  );
};

export default ModeBadge;
