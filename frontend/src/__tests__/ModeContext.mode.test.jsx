import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { ModeProvider, useMode } from '../context/ModeContext.jsx';
import { MODES } from '../storage/selectStore.js';

const ModeReader = () => {
  const { mode, hasAdmin } = useMode();
  return <span data-testid="mode-state">{`${mode}:${hasAdmin}`}</span>;
};

describe('ModeContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to demo mode without admin key', () => {
    window.history.replaceState({}, '', '/');
    render(
      <ModeProvider>
        <ModeReader />
      </ModeProvider>
    );
    expect(screen.getByTestId('mode-state').textContent).toBe(`${MODES.DEMO}:false`);
  });

  it('enters admin mode when key is present in query string', () => {
    window.history.replaceState({}, '', '/?key=test-secret');
    render(
      <ModeProvider>
        <ModeReader />
      </ModeProvider>
    );
    expect(screen.getByTestId('mode-state').textContent).toBe(`${MODES.ADMIN}:true`);
  });
});
