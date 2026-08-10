import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { UserLoginData, UserRegisterData } from '../services/authService';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  bio?: string;
  skills: string[];
  experience: any[];
  education: any[];
  certifications: string[];
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (data: UserLoginData) => Promise<void>;
  register: (data: UserRegisterData) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfileState: (updatedProfile: Partial<Profile>) => void;
  updateUserProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      // Calling patch with empty object acts as a GET for profile
      const profData = await authService.updateProfile({});
      setProfile(profData);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  const loadCurrentUser = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await authService.getMe();
      setUser(userData);
      await fetchProfile();
    } catch (err) {
      console.error('Auth initialization failed:', err);
      // Clear invalid credentials
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();

    const handleLogoutEvent = () => {
      setUser(null);
      setProfile(null);
      setLoading(false);
    };

    window.addEventListener('auth_logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth_logout', handleLogoutEvent);
    };
  }, []);

  const login = async (data: UserLoginData) => {
    setError(null);
    setLoading(true);
    try {
      await authService.login(data);
      const userData = await authService.getMe();
      setUser(userData);
      await fetchProfile();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to login. Please check credentials.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: UserRegisterData) => {
    setError(null);
    setLoading(true);
    try {
      await authService.register(data);
      // Log in automatically after registration
      await login({ email: data.email, password: data.password });
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to register account.';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  const updateProfileState = (updatedProfile: Partial<Profile>) => {
    if (profile) {
      setProfile((prev) => (prev ? { ...prev, ...updatedProfile } as Profile : null));
    }
    if (user && updatedProfile.full_name) {
      setUser((prev) => (prev ? { ...prev, full_name: updatedProfile.full_name } as User : null));
    }
  };

  const updateUserProfile = async (data: Partial<Profile>) => {
    try {
      const updated = await authService.updateProfile(data);
      updateProfileState(updated);
    } catch (err: any) {
      console.error('Failed to update user profile:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        fetchProfile,
        updateProfileState,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
