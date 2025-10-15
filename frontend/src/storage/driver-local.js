import localforage from 'localforage';

const JOBS_KEY = 'joblog_local_jobs_v1';
const META_KEY = 'joblog_local_meta_v1';

localforage.config({
  name: 'joblog',
  storeName: 'joblog_store',
  description: 'JobLog local-first storage'
});

const jobsStore = localforage.createInstance({
  name: 'joblog',
  storeName: 'jobs'
});

const metaStore = localforage.createInstance({
  name: 'joblog',
  storeName: 'meta'
});

const generateId = () => Date.now() + Math.floor(Math.random() * 1000);

const readJobs = async () => {
  const stored = await jobsStore.getItem(JOBS_KEY);
  return Array.isArray(stored) ? stored : [];
};

const writeJobs = async (jobs) => {
  await jobsStore.setItem(JOBS_KEY, jobs);
};

const readMeta = async () => {
  const stored = await metaStore.getItem(META_KEY);
  return stored && typeof stored === 'object' ? stored : {};
};

const writeMeta = async (meta) => {
  await metaStore.setItem(META_KEY, meta);
};

export const createLocalDriver = () => ({
  async loadJobs() {
    return readJobs();
  },
  async createJob(payload) {
    const jobs = await readJobs();
    const newJob = {
      ...payload,
      id: payload.id ?? generateId()
    };
    jobs.push(newJob);
    await writeJobs(jobs);
    return newJob;
  },
  async updateJob(id, payload) {
    const jobs = await readJobs();
    const index = jobs.findIndex((job) => String(job.id) === String(id));
    if (index === -1) {
      throw new Error('Job not found');
    }
    const updated = {
      ...jobs[index],
      ...payload,
      id: jobs[index].id
    };
    jobs[index] = updated;
    await writeJobs(jobs);
    return updated;
  },
  async deleteJob(id) {
    const jobs = await readJobs();
    const filtered = jobs.filter((job) => String(job.id) !== String(id));
    await writeJobs(filtered);
  },
  async reset() {
    // Reset in local mode equates to clearing user data.
    await writeJobs([]);
  },
  async clear() {
    await writeJobs([]);
    await writeMeta({});
  },
  async exportData() {
    const jobs = await readJobs();
    return {
      version: 1,
      jobs
    };
  },
  async importData(bundle) {
    await writeJobs(bundle.jobs);
  },
  async getMeta(key) {
    const meta = await readMeta();
    return meta[key];
  },
  async setMeta(key, value) {
    const meta = await readMeta();
    meta[key] = value;
    await writeMeta(meta);
  }
});
