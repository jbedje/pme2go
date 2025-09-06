// Secure API service layer for PME2GO with JWT authentication
const API_BASE_URL = process.env.REACT_APP_SECURE_API_URL || 'http://localhost:3002/api';

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
      console.log('🔍 SecureApi - Login response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      console.log('🔍 SecureApi - Checking tokens in response:', {
        hasTokens: !!data.tokens,
        tokens: data.tokens,
        success: data.success
      });

      if (data.success && data.tokens) {
        console.log('✅ SecureApi - Saving tokens:', data.tokens);
        this.saveTokens(data.tokens.accessToken, data.tokens.refreshToken);
        // Save user data to localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('✅ SecureApi - Token saved, isAuthenticated:', this.isAuthenticated());
      } else {
        console.log('❌ SecureApi - No tokens in response or success=false');
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

  // Get stored token for WebSocket
  getStoredToken() {
    return this.accessToken;
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
    try {
      console.log('🔍 SecureApi - getUsers called with filters:', filters);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const query = params.toString() ? `?${params.toString()}` : '';
      console.log('📡 SecureApi - Making request to:', `/users${query}`);
      const result = await this.request(`/users${query}`);
      console.log('✅ SecureApi - getUsers response:', result);
      return result;
    } catch (error) {
      console.error('❌ SecureApi - getUsers error:', error);
      throw error;
    }
  }

  async getUser(id) {
    return await this.request(`/users/${id}`);
  }

  async updateProfile(userData) {
    // Add current user's ID to the request
    const currentUser = this.getCurrentUser();
    const updatedData = { ...userData, userId: currentUser?.id };
    
    return await this.request('/users/profile', {
      method: 'PUT',
      body: updatedData,
    });
  }

  // Opportunities Methods
  async getOpportunities(filters = {}) {
    try {
      console.log('🔍 SecureApi - getOpportunities called with filters:', filters);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const query = params.toString() ? `?${params.toString()}` : '';
      console.log('📡 SecureApi - Making request to:', `/opportunities${query}`);
      const result = await this.request(`/opportunities${query}`);
      console.log('✅ SecureApi - getOpportunities response:', result);
      return result;
    } catch (error) {
      console.error('❌ SecureApi - getOpportunities error:', error);
      throw error;
    }
  }

  async getOpportunity(id) {
    try {
      console.log('🔍 SecureApi - getOpportunity called with id:', id);
      const result = await this.request(`/opportunities/${id}`);
      console.log('✅ SecureApi - getOpportunity response:', result);
      return result;
    } catch (error) {
      console.error('❌ SecureApi - getOpportunity error:', error);
      throw error;
    }
  }

  async updateOpportunity(id, opportunityData) {
    try {
      console.log('🔄 SecureApi - updateOpportunity called:', { id, opportunityData });
      const result = await this.request(`/opportunities/${id}`, {
        method: 'PUT',
        body: opportunityData,
      });
      console.log('✅ SecureApi - updateOpportunity response:', result);
      return result;
    } catch (error) {
      console.error('❌ SecureApi - updateOpportunity error:', error);
      throw error;
    }
  }

  async deleteOpportunity(id) {
    try {
      console.log('🗑️ SecureApi - deleteOpportunity called with id:', id);
      const result = await this.request(`/opportunities/${id}`, {
        method: 'DELETE',
      });
      console.log('✅ SecureApi - deleteOpportunity response:', result);
      return result;
    } catch (error) {
      console.error('❌ SecureApi - deleteOpportunity error:', error);
      throw error;
    }
  }

  async getUserOpportunities(userId) {
    try {
      console.log('🔍 SecureApi - getUserOpportunities called with userId:', userId);
      const result = await this.request(`/opportunities/author/${userId}`);
      console.log('✅ SecureApi - getUserOpportunities response:', result);
      return result;
    } catch (error) {
      console.error('❌ SecureApi - getUserOpportunities error:', error);
      throw error;
    }
  }

  async applyToOpportunity(opportunityId, userId, message = '') {
    try {
      console.log('📝 SecureApi - applyToOpportunity called:', { opportunityId, userId, message });
      const result = await this.request(`/opportunities/${opportunityId}/apply`, {
        method: 'POST',
        body: { userId, message },
      });
      console.log('✅ SecureApi - applyToOpportunity response:', result);
      return result;
    } catch (error) {
      console.error('❌ SecureApi - applyToOpportunity error:', error);
      throw error;
    }
  }

  async getOpportunityApplications(opportunityId) {
    try {
      console.log('🔍 SecureApi - getOpportunityApplications called with opportunityId:', opportunityId);
      const result = await this.request(`/opportunities/${opportunityId}/applications`);
      console.log('✅ SecureApi - getOpportunityApplications response:', result);
      return result;
    } catch (error) {
      console.error('❌ SecureApi - getOpportunityApplications error:', error);
      throw error;
    }
  }


  async getMessages(contactId) {
    try {
      console.log('📨 SecureApi - getMessages called with contactId:', contactId);
      const result = await this.request(`/messages/${contactId}`);
      console.log('✅ SecureApi - getMessages response:', result);
      
      // Transform the response to match frontend expectations
      const transformedMessages = result.map(msg => ({
        id: msg.id,
        content: msg.content,
        read: msg.read,
        timestamp: msg.timestamp,
        senderId: msg.senderid || msg.senderId,
        receiverId: msg.receiverid || msg.receiverId,
        senderName: msg.sendername || msg.senderName,
        receiverName: msg.receivername || msg.receiverName
      }));
      
      console.log('🔄 SecureApi - Transformed messages:', transformedMessages);
      return transformedMessages;
    } catch (error) {
      console.error('❌ SecureApi - getMessages error:', error);
      return [];
    }
  }

  async getConversations() {
    try {
      console.log('💬 SecureApi - getConversations called');
      const result = await this.request('/conversations');
      console.log('✅ SecureApi - getConversations response:', result);
      
      // Transform conversations to have consistent field names
      const transformedConversations = result.map(conv => ({
        contact_id: conv.contact_id,
        contact_name: conv.contact_name,
        contact_avatar: conv.contact_avatar,
        contact_type: conv.contact_type,
        last_message: conv.last_message,
        last_message_time: conv.last_message_time,
        unread_count: conv.unread_count
      }));
      
      return transformedConversations;
    } catch (error) {
      console.error('❌ SecureApi - getConversations error:', error);
      return [];
    }
  }

  async sendMessage(receiverId, content) {
    try {
      console.log('📤 SecureApi - sendMessage called:', { receiverId, content });
      const currentUser = this.getCurrentUser();
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }
      
      const result = await this.request('/messages', {
        method: 'POST',
        body: { 
          senderId: currentUser.id, 
          receiverId, 
          content 
        },
      });
      console.log('✅ SecureApi - sendMessage response:', result);
      return { ...result, success: true };
    } catch (error) {
      console.error('❌ SecureApi - sendMessage error:', error);
      throw error;
    }
  }

  async markMessagesAsRead(contactId) {
    try {
      console.log('👁️ SecureApi - markMessagesAsRead called with contactId:', contactId);
      // This would be handled via WebSocket in real implementation
      // For now, just return success
      return { success: true };
    } catch (error) {
      console.error('❌ SecureApi - markMessagesAsRead error:', error);
      return { success: false };
    }
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
    try {
      console.log('🔍 SecureApi - Fetching favorites for user:', userId);
      const response = await this.request(`/favorites/${userId}`, {
        method: 'GET'
      });
      console.log('📋 SecureApi - Favorites response:', response);
      return response.favorites || [];
    } catch (error) {
      console.error('❌ SecureApi - Get favorites error:', error);
      return [];
    }
  }

  async getOpportunityFavorites(userId) {
    try {
      console.log('🔍 SecureApi - Fetching opportunity favorites for user:', userId);
      const response = await this.request(`/opportunity-favorites/${userId}`, {
        method: 'GET'
      });
      console.log('📋 SecureApi - Opportunity favorites response:', response);
      return response.favorites || [];
    } catch (error) {
      console.error('❌ SecureApi - Get opportunity favorites error:', error);
      return [];
    }
  }

  async addOpportunityFavorite(userId, opportunityId) {
    try {
      console.log('➕ SecureApi - Adding opportunity favorite:', { userId, opportunityId });
      const response = await this.request('/opportunity-favorites', {
        method: 'POST',
        body: { user_id: userId, opportunity_id: opportunityId }
      });
      console.log('✅ SecureApi - Add opportunity favorite response:', response);
      return { success: true, ...response };
    } catch (error) {
      console.error('❌ SecureApi - Add opportunity favorite error:', error);
      return { success: false, error: error.message };
    }
  }

  async removeOpportunityFavorite(userId, opportunityId) {
    try {
      console.log('🗑️ SecureApi - Removing opportunity favorite:', { userId, opportunityId });
      const response = await this.request(`/opportunity-favorites/${userId}/${opportunityId}`, {
        method: 'DELETE'
      });
      console.log('✅ SecureApi - Remove opportunity favorite response:', response);
      return { success: true, ...response };
    } catch (error) {
      console.error('❌ SecureApi - Remove opportunity favorite error:', error);
      return { success: false, error: error.message };
    }
  }

  async addFavorite(userId, profileId) {
    try {
      console.log('➕ SecureApi - Adding favorite:', { userId, profileId });
      const response = await this.request('/favorites', {
        method: 'POST',
        body: { user_id: userId, profile_id: profileId }
      });
      console.log('✅ SecureApi - Add favorite response:', response);
      return { success: true, ...response };
    } catch (error) {
      console.error('❌ SecureApi - Add favorite error:', error);
      return { success: false, error: error.message };
    }
  }

  async removeFavorite(userId, profileId) {
    try {
      const response = await this.request(`/favorites/${userId}/${profileId}`, {
        method: 'DELETE'
      });
      return { success: true, ...response };
    } catch (error) {
      console.error('SecureApi - Remove favorite error:', error);
      return { success: false, error: error.message };
    }
  }

  async createOpportunity(opportunityData) {
    try {
      console.log('➕ SecureApi - createOpportunity called:', opportunityData);
      
      // Add current user's ID as authorId
      const currentUser = this.getCurrentUser();
      const dataWithAuthor = { 
        ...opportunityData, 
        authorId: currentUser?.id 
      };
      
      const result = await this.request('/opportunities', {
        method: 'POST',
        body: dataWithAuthor,
      });
      
      console.log('✅ SecureApi - createOpportunity response:', result);
      return result;
    } catch (error) {
      console.error('❌ SecureApi - createOpportunity error:', error);
      throw error;
    }
  }

  // Events Methods
  async getEvents(filters = {}) {
    try {
      console.log('🔍 SecureApi - getEvents called with filters:', filters);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const query = params.toString() ? `?${params.toString()}` : '';
      console.log('📡 SecureApi - Making request to:', `/events${query}`);
      const result = await this.request(`/events${query}`);
      console.log('✅ SecureApi - getEvents response:', result);
      return result;
    } catch (error) {
      console.error('❌ SecureApi - getEvents error:', error);
      throw error;
    }
  }

  async getEvent(id) {
    try {
      console.log('🔍 SecureApi - getEvent called with id:', id);
      const result = await this.request(`/events/${id}`);
      console.log('✅ SecureApi - getEvent response:', result);
      return result;
    } catch (error) {
      console.error('❌ SecureApi - getEvent error:', error);
      throw error;
    }
  }

  async createEvent(eventData) {
    try {
      console.log('➕ SecureApi - createEvent called:', eventData);
      const result = await this.request('/events', {
        method: 'POST',
        body: eventData,
      });
      console.log('✅ SecureApi - createEvent response:', result);
      return result;
    } catch (error) {
      console.error('❌ SecureApi - createEvent error:', error);
      throw error;
    }
  }

  async updateEvent(id, eventData) {
    try {
      console.log('🔄 SecureApi - updateEvent called:', { id, eventData });
      const result = await this.request(`/events/${id}`, {
        method: 'PUT',
        body: eventData,
      });
      console.log('✅ SecureApi - updateEvent response:', result);
      return result;
    } catch (error) {
      console.error('❌ SecureApi - updateEvent error:', error);
      throw error;
    }
  }

  async deleteEvent(id) {
    try {
      console.log('🗑️ SecureApi - deleteEvent called with id:', id);
      const result = await this.request(`/events/${id}`, {
        method: 'DELETE',
      });
      console.log('✅ SecureApi - deleteEvent response:', result);
      return result;
    } catch (error) {
      console.error('❌ SecureApi - deleteEvent error:', error);
      throw error;
    }
  }

  // Event Registration Methods
  async registerForEvent(eventId, userId) {
    try {
      console.log('📝 SecureApi - registerForEvent called:', { eventId, userId });
      const result = await this.request(`/events/${eventId}/register`, {
        method: 'POST',
        body: { userId },
      });
      console.log('✅ SecureApi - registerForEvent response:', result);
      return result;
    } catch (error) {
      console.error('❌ SecureApi - registerForEvent error:', error);
      throw error;
    }
  }

  async unregisterFromEvent(eventId, userId) {
    try {
      console.log('🚫 SecureApi - unregisterFromEvent called:', { eventId, userId });
      const result = await this.request(`/events/${eventId}/register/${userId}`, {
        method: 'DELETE',
      });
      console.log('✅ SecureApi - unregisterFromEvent response:', result);
      return result;
    } catch (error) {
      console.error('❌ SecureApi - unregisterFromEvent error:', error);
      throw error;
    }
  }

  async getUserEventRegistrations(userId) {
    try {
      console.log('📋 SecureApi - getUserEventRegistrations called with userId:', userId);
      const result = await this.request(`/events/registrations/${userId}`);
      console.log('✅ SecureApi - getUserEventRegistrations response:', result);
      return result;
    } catch (error) {
      console.error('❌ SecureApi - getUserEventRegistrations error:', error);
      return { registrations: [] };
    }
  }
}

export default new SecureApiService();