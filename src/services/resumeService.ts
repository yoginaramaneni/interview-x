import apiClient from './apiClient';

export interface AtsScoreRequest {
  resume_id: string;
  job_id: string;
}

export const resumeService = {
  async uploadResume(file: File, onUploadProgress?: (progressEvent: any) => void) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  // Alias for compatibility with pages
  async upload(file: File, onUploadProgress?: (progressEvent: any) => void) {
    return this.uploadResume(file, onUploadProgress);
  },

  async getLatest() {
    const cachedId = localStorage.getItem('resumeId');
    const cachedDetails = localStorage.getItem('resumeDetails');
    if (cachedId && cachedDetails) {
      const details = JSON.parse(cachedDetails);
      return {
        id: cachedId,
        filename: details.fileName || 'resume.pdf',
        created_at: new Date().toISOString(),
        parsed_details: {
          name: details.candidateName,
          email: details.email,
          phone: details.phone,
          skills: details.skills,
          experience: (details.experience || []).map((e: any) => ({
            role: e.role,
            company: e.company,
            start_date: e.period ? e.period.split(' - ')[0] : '',
            end_date: e.period ? e.period.split(' - ')[1] : '',
            responsibilities: e.bullets || []
          })),
          projects: (details.projects || []).map((p: any) => ({
            title: p.name,
            description: p.desc,
            technologies: p.tech || []
          })),
          education: (details.education || []).map((edu: any) => ({
            degree: edu.degree,
            institution: edu.school,
            end_year: edu.period ? edu.period.split(' - ')[1] || edu.period : ''
          })),
          certifications: details.certifications || []
        }
      };
    }
    throw new Error('No resume uploaded yet');
  },

  async getAtsScore(resumeId: string, jobId: string) {
    const response = await apiClient.post('/resume/ats-score', {
      resume_id: resumeId,
      job_id: jobId,
    });
    return response.data;
  },

  // Alias for compatibility with pages
  async calculateATS(resumeId: string, jobId: string) {
    return this.getAtsScore(resumeId, jobId);
  }
};
