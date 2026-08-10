import apiClient from './apiClient';

export interface CodingQuestionRequest {
  topic: string;
  difficulty: number;
  language: string;
}

export interface CodingSubmitRequest {
  problem_description: string;
  code_submission: string;
  language: string;
}

export const codingService = {
  async getQuestion(data: CodingQuestionRequest) {
    const response = await apiClient.post('/coding/question', data);
    return response.data;
  },

  async submitCode(data: CodingSubmitRequest) {
    const response = await apiClient.post('/coding/submit', data);
    return response.data;
  },

  async run(code: string, language: string, problemDescription: string) {
    const response = await apiClient.post('/coding/run', {
      code_submission: code,
      language,
      problem_description: problemDescription,
    });
    return response.data;
  },

  // Compatibility with CodingInterviewPage
  async submit(code: string, problemDescription: string, language: string) {
    return this.submitCode({
      problem_description: problemDescription,
      code_submission: code,
      language,
    });
  },

  async getReview(submissionId: string) {
    const response = await apiClient.post(`/coding/review?submission_id=${submissionId}`);
    return response.data;
  },
};
