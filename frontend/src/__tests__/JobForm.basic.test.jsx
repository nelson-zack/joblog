import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import JobForm from '../components/JobForm.jsx';
import { MODES } from '../storage/selectStore.js';

describe('JobForm', () => {
  it('normalizes submission payload', async () => {
    const onCreateJob = vi.fn(() => Promise.resolve());

    render(<JobForm onCreateJob={onCreateJob} mode={MODES.LOCAL} />);

    await userEvent.type(screen.getByPlaceholderText('Job Title'), 'QA Engineer');
    await userEvent.type(screen.getByPlaceholderText('Company'), 'Acme Inc');
    await userEvent.type(screen.getByPlaceholderText('Job Link'), 'https://example.com');
    const dateInput = screen.getByPlaceholderText('mm/dd/yyyy');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, '2025-05-20');
    await userEvent.selectOptions(screen.getByDisplayValue('Applied'), 'Interviewing');
    await userEvent.type(screen.getByPlaceholderText('Notes'), 'Exciting role');
    await userEvent.click(screen.getByLabelText('Remote'));

    await userEvent.click(screen.getByRole('button', { name: /add job/i }));

    await waitFor(() => expect(onCreateJob).toHaveBeenCalledTimes(1));
    const payload = onCreateJob.mock.calls[0][0];
    expect(payload.date_applied).toBe('2025-05-20');
    expect(payload.status_history[0]).toEqual({ status: 'Interviewing', date: '2025-05-20' });
    expect(payload.tags).toContain('Remote');
  });
});
