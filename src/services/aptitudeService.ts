import apiClient from './apiClient';

export interface AptitudeAnswerSubmission {
  question_text: string;
  selected_option: string;
}

export interface AptitudeSubmitRequest {
  topic: string;
  difficulty: string;
  submissions: AptitudeAnswerSubmission[];
}

export const aptitudeService = {
  async getQuestions(topic: string, difficulty: string = 'Medium', numQuestions: number = 5) {
    const response = await apiClient.get('/aptitude/questions', {
      params: {
        topic,
        difficulty,
        num_questions: numQuestions,
      },
    });
    return response.data;
  },

  async submitAnswers(data: AptitudeSubmitRequest) {
    const response = await apiClient.post('/aptitude/submit', data);
    return response.data;
  },

  // Alias for compatibility with pages
  async submit(topic: string, difficulty: string, submissions: AptitudeAnswerSubmission[]) {
    return this.submitAnswers({
      topic,
      difficulty,
      submissions,
    });
  },
};
