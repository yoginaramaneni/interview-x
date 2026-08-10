import apiClient from './apiClient';

export interface InterviewStartRequest {
  resume_id: string;
  job_id: string;
}

export interface InterviewAnswerSubmitRequest {
  session_id: string;
  question_id: string;
  answer_text: string;
}

export const interviewService = {
  async startInterview(resumeId: string, jobId: string) {
    const response = await apiClient.post('/interview/start', {
      resume_id: resumeId,
      job_id: jobId,
    });
    return response.data;
  },

  // Alias for compatibility with pages
  async start(resumeId: string, jobId: string) {
    return this.startInterview(resumeId, jobId);
  },

  async getQuestion(sessionId: string) {
    const response = await apiClient.post(`/interview/question?session_id=${sessionId}`);
    return response.data;
  },

  // Alias for compatibility with pages
  async generateQuestion(sessionId: string) {
    return this.getQuestion(sessionId);
  },

  async submitAnswer(data: InterviewAnswerSubmitRequest) {
    const response = await apiClient.post('/interview/answer', data);
    return response.data;
  },

  async submitVoiceAnswer(sessionId: string, questionId: string, blob: Blob) {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('question_id', questionId);
    formData.append('file', blob, 'answer.webm');

    const response = await apiClient.post('/interview/voice-answer', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async endInterview(sessionId: string) {
    const response = await apiClient.post(`/interview/end?session_id=${sessionId}`);
    return response.data;
  },

  // Alias for compatibility with pages
  async end(sessionId: string) {
    return this.endInterview(sessionId);
  },
};
