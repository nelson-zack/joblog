import { z } from 'zod';

const DATA_VERSION = 1;

export const statusHistorySchema = z
  .array(
    z.object({
      status: z.string(),
      date: z
        .string()
        .regex(
          /^\d{4}-\d{2}-\d{2}$/,
          'Dates must be formatted as YYYY-MM-DD'
        )
    })
  )
  .default([]);

export const jobSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  company: z.string(),
  link: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  date_applied: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Dates must be formatted as YYYY-MM-DD'),
  status: z.string(),
  status_history: statusHistorySchema
});

export const exportBundleSchema = z.object({
  version: z.literal(DATA_VERSION),
  jobs: z.array(jobSchema)
});

const cloneStatusHistory = (history) =>
  Array.isArray(history)
    ? history.map((entry) => (entry ? { ...entry } : entry))
    : history;

const cloneJob = (job) =>
  job == null
    ? job
    : {
        ...job,
        status_history: cloneStatusHistory(job.status_history)
      };

const cloneJobs = (items) =>
  Array.isArray(items) ? items.map((job) => cloneJob(job)) : [];

export const createStore = (driver) => {
  let jobs = [];
  let initialized = false;
  const subscribers = new Set();

  const notify = () => {
    const snapshot = cloneJobs(jobs);
    subscribers.forEach((listener) => listener(snapshot));
  };

  const ensureInitialized = async () => {
    if (!initialized) {
      jobs = cloneJobs(await driver.loadJobs());
      initialized = true;
      notify();
    }
  };

  return {
    async load() {
      await ensureInitialized();
      return cloneJobs(jobs);
    },
    getSnapshot() {
      return cloneJobs(jobs);
    },
    subscribe(listener) {
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
    async reload() {
      jobs = cloneJobs(await driver.loadJobs());
      initialized = true;
      notify();
      return cloneJobs(jobs);
    },
    async createJob(draft) {
      await ensureInitialized();
      const created = await driver.createJob(cloneJob(draft));
      jobs = [...jobs, cloneJob(created)];
      notify();
      return cloneJob(created);
    },
    async updateJob(id, updates) {
      await ensureInitialized();
      const updated = await driver.updateJob(id, cloneJob(updates));
      jobs = jobs.map((job) =>
        String(job.id) === String(updated.id) ? cloneJob(updated) : job
      );
      notify();
      return cloneJob(updated);
    },
    async deleteJob(id) {
      await ensureInitialized();
      await driver.deleteJob(id);
      jobs = jobs.filter((job) => String(job.id) !== String(id));
      notify();
    },
    async reset() {
      await driver.reset?.();
      return this.reload();
    },
    async clear() {
      await driver.clear?.();
      jobs = [];
      notify();
    },
    async exportData() {
      if (!driver.exportData) {
        throw new Error('Export not supported for this mode');
      }
      const bundle = await driver.exportData();
      return exportBundleSchema.parse(bundle);
    },
    async importData(bundle) {
      if (!driver.importData) {
        throw new Error('Import not supported for this mode');
      }
      const parsed = exportBundleSchema.parse(bundle);
      await driver.importData(parsed);
      jobs = cloneJobs(parsed.jobs);
      notify();
      return cloneJobs(parsed.jobs);
    },
    async getMeta(key) {
      if (!driver.getMeta) return null;
      return driver.getMeta(key);
    },
    async setMeta(key, value) {
      if (!driver.setMeta) return;
      await driver.setMeta(key, value);
    }
  };
};

export const DATA_EXPORT_VERSION = DATA_VERSION;
