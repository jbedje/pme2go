// Secure API service layer for PME2GO with JWT authentication
const API_BASE_URL = process.env.REACT_APP_SECURE_API_URL || 'http://localhost:3004/api';

class SecureApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.accessToken = null;
    this.refreshToken = null;
    this.isRefreshing = false;
    this.failedQueue = [];

    // Load tokens from localStorage on init
    this.loadTokens();
  }

  // Token Management
  loadTokens() {
    try {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    } catch (error) {
      console.warn('Failed to load tokens from localStorage:', error);
    }
  }

  saveTokens(accessToken, refreshToken) {
    try {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    } catch (error) {
      console.warn('Failed to save tokens to localStorage:', error);
    }
  }

  clearTokens() {
    try {
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } catch (error) {
      console.warn('Failed to clear tokens from localStorage:', error);
    }
  }

  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  // Token refresh queue management
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  // HTTP Request Handler with automatic token refresh
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Handle token expiration
      if (response.status === 401) {
        const data = await response.json().catch(() => ({}));
        
        if (data.code === 'TOKEN_EXPIRED' && this.refreshToken) {
          // Try to refresh the token
          return await this.handleTokenRefresh(endpoint, options);
        } else {
          // Clear tokens and redirect to login
          this.clearTokens();
          throw new Error('Authentication required');
        }
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Handle token refresh with queue management
  async handleTokenRefresh(originalEndpoint, originalOptions) {
    if (this.isRefreshing) {
      // If already refreshing, add to queue
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      }).then(token => {
        return this.request(originalEndpoint, originalOptions);
      });
    }

    this.isRefreshing = true;

    try {
      const refreshResponse = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Token refresh failed');
      }

      const refreshData = await refreshResponse.json();
      this.saveTokens(refreshData.tokens.accessToken, refreshData.tokens.refreshToken);

      this.processQueue(null, refreshData.tokens.accessToken);
      this.isRefreshing = false;

      // Retry original request with new token
      return this.request(originalEndpoint, originalOptions);
    } catch (error) {
      this.processQueue(error, null);
      this.isRefreshing = false;
      this.clearTokens();
      throw new Error('Authentication session expired');
    }
  }

  // Authentication Methods
  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      if (data.success && data.tokens) {
        this.saveTokens(data.tokens.accessToken, data.tokens.refreshToken);
        // Save user data to localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.success && data.tokens) {
        this.saveTokens(data.tokens.accessToken, data.tokens.refreshToken);
        // Save user data to localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      if (this.accessToken) {
        await this.request('/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.accessToken;
  }

  // Get stored user data
  getCurrentUser() {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.warn('Failed to get current user:', error);
      return null;
    }
  }

  // Health Check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return await response.json();
    } catch (error) {
      return { status: 'ERROR', message: 'API unavailable' };
    }
  }

  // Protected API Methods
  async getUsers(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return await this.request(`/users${query}`);
  }

  async getUser(id) {
    return await this.request(`/users/${id}`);
  }

  async updateProfile(userData) {
    return await this.request('/users/profile', {
      method: 'PUT',
      body: userData,
    });
  }

  // Placeholder methods for future implementation
  async getOpportunities(filters = {}) {
    // For now, return empty array - will implement when opportunities endpoint is added to secure server
    return [];
  }

  async getEvents(filters = {}) {
    // For now, return empty array - will implement when events endpoint is added to secure server
    return [];
  }

  async getMessages(userId, contactId = null) {
    // For now, return empty array - will implement when messages endpoint is added to secure server
    return [];
  }

  async sendMessage(senderId, receiverId, content) {
    // For now, return success - will implement when messages endpoint is added to secure server
    return { success: true };
  }

  async markMessagesAsRead(userId, senderId) {
    // For now, return success - will implement when messages endpoint is added to secure server
    return { success: true };
  }

  async getNotifications(userId) {
    // For now, return empty array - will implement when notifications endpoint is added to secure server
    return [];
  }

  async markNotificationAsRead(notificationId) {
    // For now, return success - will implement when notifications endpoint is added to secure server
    return { success: true };
  }

  async getFavorites(userId) {
    // For now, return empty array - will implement when favorites endpoint is added to secure server
    return [];
  }

  async addFavorite(userId, profileId) {
    // For now, return success - will implement when favorites endpoint is added to secure server
    return { success: true };
  }

  async removeFavorite(userId, profileId) {
    // For now, return success - will implement when favorites endpoint is added to secure server
    return { success: true };
  }

  async createOpportunity(opportunityData) {
    // For now, return success - will implement when opportunities endpoint is added to secure server
    return { success: true };
  }

  async applyToOpportunity(opportunityId, userId, applicationData = {}) {
    // For now, return success - will implement when applications endpoint is added to secure server
    return { success: true };
  }

  async registerForEvent(eventId, userId) {
    // For now, return success - will implement when event registrations endpoint is added to secure server
    return { success: true };
  }
}

export default new SecureApiService();