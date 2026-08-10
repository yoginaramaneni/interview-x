import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Development mode logging
if (import.meta.env.DEV) {
  api.interceptors.request.use(
    (config) => {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || config.params || '');
      return config;
    },
    (error) => {
      console.error('[API Request Error]', error);
      return Promise.reject(error);
    }
  );

  api.interceptors.response.use(
    (response) => {
      console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
      return response;
    },
    (error) => {
      console.error(`[API Response Error] ${error.response?.status || 'Network Error'} ${error.config?.url}`, error.response?.data || error.message);
      return Promise.reject(error);
    }
  );
}

// Inject Access Token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept Responses to handle expired Access Token and refresh it
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and request has not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        // Fetch new access token
        const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: new_refresh_token } = res.data;
        
        localStorage.setItem('accessToken', access_token);
        if (new_refresh_token) {
          localStorage.setItem('refreshToken', new_refresh_token);
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        processQueue(null, access_token);
        isRefreshing = false;
        
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        // Clean up tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
