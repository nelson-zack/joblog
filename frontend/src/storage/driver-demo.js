const JOBS_KEY = 'joblog_demo_jobs_v2';
const META_KEY = 'joblog_demo_meta_v1';

const hasWindow = () => typeof window !== 'undefined';

const generateId = () => Date.now() + Math.floor(Math.random() * 1000);

const clone = (value) => JSON.parse(JSON.stringify(value));

const readJobs = (seed) => {
  if (!hasWindow()) return clone(seed);
  try {
    const raw = window.sessionStorage.getItem(JOBS_KEY);
    if (!raw) return clone(seed);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : clone(seed);
  } catch (error) {
    console.warn('Failed to read demo jobs from sessionStorage:', error);
    return clone(seed);
  }
};

const writeJobs = (jobs) => {
  if (!hasWindow()) return;
  try {
    window.sessionStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  } catch (error) {
    console.warn('Failed to persist demo jobs to sessionStorage:', error);
  }
};

const readMeta = () => {
  if (!hasWindow()) return {};
  try {
    const raw = window.sessionStorage.getItem(META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.warn('Failed to read demo meta from sessionStorage:', error);
    return {};
  }
};

const writeMeta = (meta) => {
  if (!hasWindow()) return;
  try {
    window.sessionStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (error) {
    console.warn('Failed to write demo meta to sessionStorage:', error);
  }
};

export const createDemoDriver = ({ seed }) => ({
  async loadJobs() {
    return readJobs(seed);
  },
  async createJob(payload) {
    const jobs = readJobs(seed);
    const newJob = {
      ...payload,
      id: payload.id ?? generateId()
    };
    jobs.push(newJob);
    writeJobs(jobs);
    return newJob;
  },
  async updateJob(id, payload) {
    const jobs = readJobs(seed);
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
    writeJobs(jobs);
    return updated;
  },
  async deleteJob(id) {
    const jobs = readJobs(seed);
    const filtered = jobs.filter((job) => String(job.id) !== String(id));
    writeJobs(filtered);
  },
  async reset() {
    writeJobs(clone(seed));
    writeMeta({});
  },
  async clear() {
    if (!hasWindow()) return;
    try {
      window.sessionStorage.removeItem(JOBS_KEY);
      window.sessionStorage.removeItem(META_KEY);
    } catch (error) {
      console.warn('Failed to clear demo store from sessionStorage:', error);
    }
  },
  async exportData() {
    const jobs = readJobs(seed);
    return {
      version: 1,
      jobs
    };
  },
  async importData(bundle) {
    writeJobs(bundle.jobs);
  },
  async getMeta(key) {
    const meta = readMeta();
    return meta[key];
  },
  async setMeta(key, value) {
    const meta = readMeta();
    meta[key] = value;
    writeMeta(meta);
  }
});
