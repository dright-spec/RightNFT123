// Unified API client for cohesive frontend-backend integration

import { apiRequest } from "./queryClient";

// Standard API response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

// Helper to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  
  if (!data.success && data.error) {
    throw new Error(data.error);
  }
  
  return data.data || data;
}

// Authentication API
export const authApi = {
  // Wallet authentication
  async connectWallet(walletAddress: string, walletType: string = 'ethereum') {
    const response = await apiRequest('POST', '/api/auth/wallet', {
      walletAddress,
      walletType
    });
    return handleApiResponse(response);
  },

  // Login with email/password
  async login(identifier: string, password: string) {
    const response = await apiRequest('POST', '/api/auth/login', {
      identifier,
      password
    });
    return handleApiResponse(response);
  },

  // Register new user
  async register(userData: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
  }) {
    const response = await apiRequest('POST', '/api/auth/register', userData);
    return handleApiResponse(response);
  },

  // Logout
  async logout() {
    const response = await apiRequest('POST', '/api/auth/logout', {});
    return handleApiResponse(response);
  },

  // Get current user
  async getCurrentUser() {
    const response = await apiRequest('GET', '/api/auth/user', {});
    return handleApiResponse(response);
  }
};

// Rights API
export const rightsApi = {
  // Get all rights with filters
  async getRights(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    categoryId?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    const response = await apiRequest('GET', `/api/rights${queryString}`, {});
    return handleApiResponse(response);
  },

  // Get single right
  async getRight(id: number) {
    const response = await apiRequest('GET', `/api/rights/${id}`, {});
    return handleApiResponse(response);
  },

  // Create new right
  async createRight(rightData: {
    title: string;
    type: string;
    categoryId: number;
    description: string;
    tags?: string[];
    price: string;
    currency?: string;
    paysDividends?: boolean;
    royaltyPercentage?: string;
  }) {
    const response = await apiRequest('POST', '/api/rights', rightData);
    return handleApiResponse(response);
  },

  // Update right
  async updateRight(id: number, updates: Partial<any>) {
    const response = await apiRequest('PUT', `/api/rights/${id}`, updates);
    return handleApiResponse(response);
  },

  // Delete right
  async deleteRight(id: number) {
    const response = await apiRequest('DELETE', `/api/rights/${id}`, {});
    return handleApiResponse(response);
  }
};

// Staking API
export const stakingApi = {
  // Get available rights for staking (user's own verified rights)
  async getAvailableRights() {
    const response = await apiRequest('GET', '/api/stakes/available-rights', {});
    return handleApiResponse(response);
  },

  // Create new stake
  async createStake(stakeData: {
    rightId: number;
    terms?: string;
    duration?: string;
  }) {
    const response = await apiRequest('POST', '/api/stakes', stakeData);
    return handleApiResponse(response);
  },

  // Get user's stakes
  async getUserStakes() {
    const response = await apiRequest('GET', '/api/stakes/user', {});
    return handleApiResponse(response);
  },

  // Get single stake details
  async getStake(id: number) {
    const response = await apiRequest('GET', `/api/stakes/${id}`, {});
    return handleApiResponse(response);
  },

  // Update stake
  async updateStake(id: number, updates: { terms?: string }) {
    const response = await apiRequest('PUT', `/api/stakes/${id}`, updates);
    return handleApiResponse(response);
  },

  // End stake
  async endStake(id: number) {
    const response = await apiRequest('DELETE', `/api/stakes/${id}`, {});
    return handleApiResponse(response);
  },

  // Get staking statistics
  async getStakingStats() {
    const response = await apiRequest('GET', '/api/stakes/stats', {});
    return handleApiResponse(response);
  }
};

// Admin API
export const adminApi = {
  // Get admin dashboard statistics
  async getStats() {
    const response = await apiRequest('GET', '/api/admin/stats', {});
    return handleApiResponse(response);
  },

  // Get rights for admin review
  async getRights(params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    const response = await apiRequest('GET', `/api/admin/rights${queryString}`, {});
    return handleApiResponse(response);
  },

  // Verify or reject a right
  async verifyRight(rightId: number, status: 'verified' | 'rejected', notes?: string) {
    const response = await apiRequest('PUT', `/api/admin/rights/${rightId}/verify`, {
      status,
      notes
    });
    return handleApiResponse(response);
  },

  // Get pending rights
  async getPendingRights() {
    const response = await apiRequest('GET', '/api/admin/rights/pending', {});
    return handleApiResponse(response);
  },

  // Get users
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    const response = await apiRequest('GET', `/api/admin/users${queryString}`, {});
    return handleApiResponse(response);
  },

  // Toggle user ban status
  async toggleUserBan(userId: number, ban: boolean, reason?: string) {
    const response = await apiRequest('PUT', `/api/admin/users/${userId}/ban`, {
      ban,
      reason
    });
    return handleApiResponse(response);
  },

  // Get all stakes (admin view)
  async getAllStakes(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    const response = await apiRequest('GET', `/api/stakes${queryString}`, {});
    return handleApiResponse(response);
  }
};

// Categories API
export const categoriesApi = {
  // Get all categories
  async getCategories() {
    const response = await apiRequest('GET', '/api/categories', {});
    return handleApiResponse(response);
  }
};

// YouTube verification API
export const youtubeApi = {
  // Verify YouTube URL
  async verifyUrl(url: string) {
    const response = await apiRequest('POST', '/api/youtube/verify', { url });
    return handleApiResponse(response);
  },

  // Authenticate ownership
  async authenticate(videoId: string, originalUrl: string, authCode: string) {
    const response = await apiRequest('POST', '/api/youtube/authenticate', {
      videoId,
      originalUrl,
      authCode
    });
    return handleApiResponse(response);
  }
};

// Utility function to handle API errors consistently
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// Export default object with all APIs
export default {
  auth: authApi,
  rights: rightsApi,
  staking: stakingApi,
  admin: adminApi,
  categories: categoriesApi,
  youtube: youtubeApi,
  handleError: handleApiError
};