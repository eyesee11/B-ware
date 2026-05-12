/**
 * API Client — injects Firebase ID token automatically on every request
 */
import { auth } from '@/lib/firebase';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/** Generic fetch wrapper — auto-injects Firebase ID token */
async function apiCall<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // Inject Firebase ID token (auto-refreshed by Firebase SDK)
  if (!skipAuth && auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${idToken}`;
    } catch {
      // If token retrieval fails, proceed without auth header
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, { ...fetchOptions, headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    if (response.status !== 204) return await response.json();
    return {} as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`API Error (${endpoint}):`, message);
    throw error;
  }
}

/** Auth endpoints */
export const authApi = {
  /** Sync Firebase user → MySQL after login */
  sync: async () => apiCall('/auth/sync', { method: 'POST' }),

  /** Get current user profile from MySQL */
  getMe: async () => apiCall('/auth/me', { method: 'GET' }),

  /** Logout: revoke Firebase tokens + Redis session */
  logout: async () => apiCall('/auth/logout', { method: 'POST' }),

  /** Forgot password — triggers Nodemailer branded email */
  forgotPassword: async (email: string) =>
    apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    }),

  /** Resend email verification link */
  resendVerification: async () =>
    apiCall('/auth/verify-email', { method: 'POST' }),

  /** Get live email verified status from Firebase */
  getVerifiedStatus: async () =>
    apiCall('/auth/verify-email/status', { method: 'GET' }),
};

/** Claims verification */
export const claimsApi = {
  verify: async (text: string) =>
    apiCall('/claims/verify', { method: 'POST', body: JSON.stringify({ text }) }),

  quick: async (text: string) =>
    apiCall('/claims/quick', { method: 'POST', body: JSON.stringify({ text }) }),

  deep: async (text: string) =>
    apiCall('/claims/deep', { method: 'POST', body: JSON.stringify({ text }) }),

  batch: async (claims: string[]) =>
    apiCall('/claims/batch', { method: 'POST', body: JSON.stringify({ claims }) }),

  getHistory: async (page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiCall(`/claims?${params}`, { method: 'GET' });
  },

  getById: async (id: string | number) => apiCall(`/claims/${id}`, { method: 'GET' }),

  getStats: async () => apiCall('/claims/stats', { method: 'GET' }),
};

/** Trending topics */
export const trendingApi = {
  getTrending: async (filter = 'all', limit = 20, sources?: string[]) => {
    const params = new URLSearchParams({ filter, limit: String(limit) });
    if (sources?.length) params.append('sources', sources.join(','));
    return apiCall(`/trending?${params}`, { method: 'GET' });
  },
  getById: async (id: string | number) => apiCall(`/trending/${id}`, { method: 'GET' }),
  getSourceStats: async () => apiCall('/trending/sources', { method: 'GET' }),
  getLive: async () => apiCall('/trending/live', { method: 'GET', skipAuth: true }),
  refresh: async () => apiCall('/trending/refresh', { method: 'POST' }),
};

/** Outlet preferences */
export const outletsApi = {
  getAvailable: async () => apiCall('/outlets/available', { method: 'GET' }),
  getUserOutlets: async () => apiCall('/outlets', { method: 'GET' }),
  updateUserOutlets: async (outlets: string[]) =>
    apiCall('/outlets', { method: 'POST', body: JSON.stringify({ outlets }) }),
};

export { apiCall };
