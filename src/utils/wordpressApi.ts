import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Create axios instance for WordPress API
const createWordPressApi = (): AxiosInstance => {
  const api = axios.create({
    baseURL: import.meta.env.VITE_WORDPRESS_API_URL || 'https://your-wordpress-site.com/wp-json',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return api;
};

// Create authenticated API instance
const createAuthenticatedApi = (getToken: () => Promise<string | null>): AxiosInstance => {
  const api = createWordPressApi();

  // Add auth interceptor
  api.interceptors.request.use(async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  });

  // Add response interceptor for handling auth errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Handle unauthorized error - could redirect to login
        console.error('Authentication failed:', error.response.data);
      }
      return Promise.reject(error);
    }
  );

  return api;
};

// Export the base API for non-authenticated requests
export const wordpressApi = createWordPressApi();

// Export function to create authenticated API
export const createAuthApi = (getToken: () => Promise<string | null>) => {
  return createAuthenticatedApi(getToken);
};

// Example protected API functions
export const createProtectedApi = (getToken: () => Promise<string | null>) => {
  const api = createAuthApi(getToken);

  return {
    // Fetch user profile
    getUserProfile: async () => {
      const response = await api.get('/my-api/v1/user-profile');
      return response.data;
    },

    // Create WordPress user from Firebase
    createWordPressUser: async (userData: {
      firebase_uid: string;
      email: string;
      name: string;
    }) => {
      const response = await api.post('/firebase-auth/v1/create-user', userData);
      return response.data;
    },

    // Get protected data
    getProtectedData: async () => {
      const response = await api.get('/my-api/v1/protected-data');
      return response.data;
    },

    // Submit order (example)
    submitOrder: async (orderData: any) => {
      const response = await api.post('/my-api/v1/orders', orderData);
      return response.data;
    },

    // Get user orders
    getUserOrders: async () => {
      const response = await api.get('/my-api/v1/user-orders');
      return response.data;
    },
  };
};

// Utility function to verify Firebase token
export const verifyFirebaseToken = async (token: string) => {
  try {
    const response = await wordpressApi.post('/firebase-auth/v1/verify-token', {
      token,
    });
    return response.data;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
};

// Export types for better TypeScript support
export interface WordPressUser {
  id: number;
  email: string;
  name: string;
  firebase_uid: string;
}

export interface ProtectedData {
  message: string;
  user_id: number;
  user_email: string;
}

export interface OrderData {
  items: any[];
  total: number;
  shipping_address: any;
  billing_address: any;
} 