import { beforeEach, describe, expect, it } from 'vitest';
import { createStore } from '../storage/store.js';
import { createDemoDriver } from '../storage/driver-demo.js';
import { createLocalDriver } from '../storage/driver-local.js';

const baseJob = {
  id: 'job-1',
  title: 'Seeded',
  company: 'Acme',
  link: 'https://example.com',
  status: 'Applied',
  date_applied: '2025-05-10',
  notes: 'note',
  tags: 'Remote',
  status_history: [{ status: 'Applied', date: '2025-05-10' }]
};

beforeEach(() => {
  sessionStorage.clear();
});

describe('createStore drivers', () => {
  it('performs CRUD with the demo driver', async () => {
    const store = createStore(createDemoDriver({ seed: [] }));
    const initial = await store.load();
    expect(initial).toEqual([]);

    const created = await store.createJob(baseJob);
    expect(created.title).toBe('Seeded');

    const updated = await store.updateJob(created.id, {
      ...created,
      notes: 'updated'
    });
    expect(updated.notes).toBe('updated');

    await store.deleteJob(created.id);
    const afterDelete = await store.load();
    expect(afterDelete).toEqual([]);
  });

  it('persists data in the local driver', async () => {
    const store = createStore(createLocalDriver());
    await store.clear();

    const created = await store.createJob({ ...baseJob, id: 'local-1' });
    expect(created.id).toBeTruthy();

    const snapshot = store.getSnapshot();
    expect(snapshot).toHaveLength(1);

    const reloaded = await store.reload();
    expect(reloaded).toHaveLength(1);

    await store.deleteJob(created.id);
    const final = await store.load();
    expect(final).toEqual([]);
  });
});
