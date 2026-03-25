/**
 * API Client Service - Handles all HTTP communication with the backend
 * Automatically injects JWT token from localStorage
 */

// Hardcoded to deployed backend for all environments
const API_BASE_URL = 'https://b-ware-sand.vercel.app/api';

// DEBUG: Log all environment variables
if (typeof window !== 'undefined') {
  console.log('All process.env:', process.env);
}

// Debug: Log the API base URL to verify it's correct
if (typeof window !== 'undefined') {
  console.log('API_BASE_URL set to:', API_BASE_URL);
}

interface FetchOptions extends RequestInit {
  token?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Generic fetch wrapper with automatic token injection
 */
async function apiCall<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers: customHeaders, ...fetchOptions } = options;

  // Get token from localStorage if not provided
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Merge custom headers if provided
  if (customHeaders && typeof customHeaders === 'object' && !Array.isArray(customHeaders)) {
    Object.assign(headers, customHeaders);
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    // Return parsed JSON if response has content
    if (response.status !== 204) {
      return await response.json();
    }
    return {} as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`API Error (${endpoint}):`, message);
    throw error;
  }
}

/**
 * Authentication API endpoints
 */
export const authApi = {
  register: async (name: string, email: string, password: string) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  login: async (email: string, password: string) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async (token: string) => {
    return apiCall('/auth/logout', {
      method: 'POST',
      token,
    });
  },

  getMe: async (token?: string) => {
    return apiCall('/auth/me', {
      method: 'GET',
      token,
    });
  },
};

/**
 * Claims verification API endpoints
 */
export const claimsApi = {
  verify: async (text: string) => {
    return apiCall('/claims/verify', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  quick: async (text: string) => {
    return apiCall('/claims/quick', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  deep: async (text: string) => {
    return apiCall('/claims/deep', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  getHistory: async (page: number = 1, limit: number = 20) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiCall(`/claims?${params}`, {
      method: 'GET',
    });
  },

  getById: async (id: string | number) => {
    return apiCall(`/claims/${id}`, {
      method: 'GET',
    });
  },

  getStats: async () => {
    return apiCall('/claims/stats', {
      method: 'GET',
    });
  },
};



/**
 * Trending topics API endpoints
 */
export const trendingApi = {
  getTrending: async (filter: string = 'all', limit: number = 20) => {
    const params = new URLSearchParams({ filter, limit: String(limit) });
    return apiCall(`/trending?${params}`, {
      method: 'GET',
    });
  },

  getById: async (id: string | number) => {
    return apiCall(`/trending/${id}`, {
      method: 'GET',
    });
  },

  getSourceStats: async () => {
    return apiCall('/trending/sources', {
      method: 'GET',
    });
  },

  refresh: async (token: string) => {
    return apiCall('/trending/refresh', {
      method: 'POST',
      token,
    });
  },

  getTrendingById: async (id: string) => {
    return apiCall(`/trending/${id}`, {
      method: 'GET',
    });
  },

  refreshTrending: async (token: string) => {
    return apiCall('/trending/refresh', {
      method: 'POST',
      token,
    });
  },
};

export { apiCall, API_BASE_URL };
