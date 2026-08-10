import apiClient from './apiClient';

export interface UserPreferences {
  weeklyDigests: boolean;
  interviewReminders: boolean;
  announcements: boolean;
}

export const userService = {
  async updateProfile(data: { full_name?: string; email?: string; role?: string }) {
    // For email/role, we update using general user details or local simulation
    // Let's call /auth/profile PATCH
    const response = await apiClient.patch('/auth/profile', {
      full_name: data.full_name,
    });
    return response.data;
  },

  async updatePassword(data: { currentPass: string; newPass: string }) {
    // Mock password update
    return new Promise((resolve) => setTimeout(resolve, 800));
  },

  async savePreferences(prefs: UserPreferences) {
    // Mock preference storage in local storage
    localStorage.setItem('user_preferences', JSON.stringify(prefs));
    return new Promise((resolve) => setTimeout(resolve, 500));
  },

  async getPreferences(): Promise<UserPreferences> {
    const saved = localStorage.getItem('user_preferences');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      weeklyDigests: true,
      interviewReminders: true,
      announcements: false,
    };
  },

  async deleteAccount() {
    // Mock delete account API
    return new Promise((resolve) => setTimeout(resolve, 1000));
  },
};
