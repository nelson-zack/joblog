import axios from 'axios';

const buildQuery = (apiKey) =>
  apiKey ? `?key=${encodeURIComponent(apiKey)}` : '';

export const createApiDriver = ({ apiKey }) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!baseUrl) {
    console.warn(
      'VITE_API_BASE_URL is not defined; admin mode calls may fail.'
    );
  }

  const client = axios.create({
    baseURL: baseUrl
  });

  const fetchJobs = async () => {
    const suffix = buildQuery(apiKey);
    const response = await client.get(`/jobs${suffix}`);
    return response.data || [];
  };

  return {
    async loadJobs() {
      return fetchJobs();
    },
    async createJob(payload) {
      const query = buildQuery(apiKey);
      const response = await client.post(`/jobs/${query}`, payload);
      return response.data;
    },
    async updateJob(id, payload) {
      const query = buildQuery(apiKey);
      const response = await client.put(`/jobs/${id}${query}`, payload);
      return response.data;
    },
    async deleteJob(id) {
      const query = buildQuery(apiKey);
      await client.delete(`/jobs/${id}${query}`);
    },
    async reset() {
      // No reset concept for the API driver.
    },
    async clear() {
      // No-op for API driver.
    },
    async exportData() {
      // Pull fresh data to ensure exported view matches server.
      return {
        version: 1,
        jobs: await fetchJobs()
      };
    },
    async importData() {
      throw new Error('Import is not supported in admin mode.');
    },
    async getMeta() {
      return null;
    },
    async setMeta() {
      // Metas are not tracked server-side currently.
    }
  };
};
