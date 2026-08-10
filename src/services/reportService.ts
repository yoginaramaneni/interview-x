import apiClient from './apiClient';

export const reportService = {
  async getReport(id: string) {
    const response = await apiClient.get(`/report/${id}`);
    return response.data;
  },

  // Alias for compatibility with pages
  async get(id: string) {
    return this.getReport(id);
  },
};
