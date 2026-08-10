import apiClient from './apiClient';

export const jobService = {
  async analyzeJobDescription(jdText: string) {
    const response = await apiClient.post('/job/analyze', {
      jd_text: jdText,
    });
    return response.data;
  },

  // Alias for compatibility with pages
  async analyze(jdText: string) {
    return this.analyzeJobDescription(jdText);
  },
};
