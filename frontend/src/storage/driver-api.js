import axios from 'axios';

const applyAdminHeaders = (client, apiKey) => {
  if (!apiKey) {
    delete client.defaults.headers.common['X-Admin-Key'];
    delete client.defaults.headers.common.Authorization;
    return;
  }

  client.defaults.headers.common['X-Admin-Key'] = apiKey;
  client.defaults.headers.common.Authorization = `Bearer ${apiKey}`;
};

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

  applyAdminHeaders(client, apiKey);

  const fetchJobs = async () => {
    const response = await client.get('/jobs/');
    return response.data || [];
  };

  return {
    async loadJobs() {
      return fetchJobs();
    },
    async createJob(payload) {
      const response = await client.post('/jobs/', payload);
      return response.data;
    },
    async updateJob(id, payload) {
      const response = await client.put(`/jobs/${id}`, payload);
      return response.data;
    },
    async deleteJob(id) {
      await client.delete(`/jobs/${id}`);
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
