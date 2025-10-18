import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import JobList from '../components/JobList.jsx';
import { MODES } from '../storage/selectStore.js';

const baseJob = (overrides = {}) => ({
  id: overrides.id ?? Math.random(),
  title: 'Role',
  company: 'Acme',
  link: 'https://example.com',
  status: 'Applied',
  date_applied: '2025-05-10',
  notes: '',
  tags: '',
  status_history: [{ status: 'Applied', date: '2025-05-10' }],
  ...overrides
});

describe('JobList sorting', () => {
  it('orders jobs by date desc then id desc', () => {
    const jobs = [
      baseJob({ id: 1, title: 'Older', date_applied: '2025-05-01' }),
      baseJob({ id: 2, title: 'Newest', date_applied: '2025-05-12' }),
      baseJob({ id: 3, title: 'SameDay HighId', date_applied: '2025-05-12' }),
      baseJob({ id: 0, title: 'SameDay LowId', date_applied: '2025-05-12' })
    ];

    render(
      <JobList
        jobs={jobs}
        mode={MODES.LOCAL}
        onUpdateJob={vi.fn()}
        onDeleteJob={vi.fn()}
      />
    );

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('SameDay HighId');
    expect(items[1]).toHaveTextContent('Newest');
    expect(items[2]).toHaveTextContent('SameDay LowId');
    expect(items[3]).toHaveTextContent('Older');
  });
});
