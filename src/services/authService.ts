import apiClient from './apiClient';

export interface UserRegisterData {
  email: string;
  password?: string;
  full_name: string;
  role?: string;
}

export interface UserLoginData {
  email: string;
  password?: string;
}

export interface ProfileUpdateData {
  full_name?: string;
  bio?: string;
  skills?: string[];
  experience?: any[];
  education?: any[];
  certifications?: string[];
}

export const authService = {
  async register(data: UserRegisterData) {
    const response = await apiClient.post('/auth/register', {
      email: data.email,
      password: data.password || 'password123',
      full_name: data.full_name,
      role: data.role || 'candidate',
    });
    return response.data;
  },

  async login(data: UserLoginData) {
    const response = await apiClient.post('/auth/login', {
      email: data.email,
      password: data.password || 'password123',
    });
    const { access_token, refresh_token } = response.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    return response.data;
  },

  async logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      } catch (err) {
        console.error('Logout request failed on server:', err);
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async updateProfile(data: ProfileUpdateData) {
    const response = await apiClient.patch('/auth/profile', data);
    return response.data;
  },
};
