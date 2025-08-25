// API service layer for PME2GO
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3004/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      return await this.request('/health');
    } catch (error) {
      return { status: 'ERROR', message: 'API unavailable' };
    }
  }

  // Authentication
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    
    // Store tokens if login successful
    if (response.success && response.tokens) {
      localStorage.setItem('pme2go_token', JSON.stringify(response.tokens));
      localStorage.setItem('pme2go_user', JSON.stringify(response.user));
    }
    
    return response;
  }

  async register(userData) {
    return await this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
  }

  // Users
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

  async updateUser(id, userData) {
    return await this.request(`/users/${id}`, {
      method: 'PUT',
      body: userData,
    });
  }

  // Opportunities
  async getOpportunities(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return await this.request(`/opportunities${query}`);
  }

  async createOpportunity(opportunityData) {
    return await this.request('/opportunities', {
      method: 'POST',
      body: opportunityData,
    });
  }

  async applyToOpportunity(opportunityId, userId, applicationData = {}) {
    return await this.request('/applications', {
      method: 'POST',
      body: { opportunityId, userId, ...applicationData },
    });
  }

  // Messages
  async getMessages(userId, contactId = null) {
    const query = contactId ? `?contactId=${contactId}` : '';
    return await this.request(`/messages/${userId}${query}`);
  }

  async sendMessage(senderId, receiverId, content) {
    return await this.request('/messages', {
      method: 'POST',
      body: { senderId, receiverId, content },
    });
  }

  async markMessagesAsRead(userId, senderId) {
    return await this.request(`/messages/${userId}/read`, {
      method: 'PUT',
      body: { senderId },
    });
  }

  // Events
  async getEvents(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return await this.request(`/events${query}`);
  }

  async registerForEvent(eventId, userId) {
    return await this.request('/event-registrations', {
      method: 'POST',
      body: { eventId, userId },
    });
  }

  // Favorites
  async getFavorites(userId) {
    return await this.request(`/favorites/${userId}`);
  }

  async addFavorite(userId, profileId) {
    return await this.request('/favorites', {
      method: 'POST',
      body: { userId, profileId },
    });
  }

  async removeFavorite(userId, profileId) {
    return await this.request(`/favorites/${userId}/${profileId}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications(userId) {
    return await this.request(`/notifications/${userId}`);
  }

  async markNotificationAsRead(notificationId) {
    return await this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }
}

export default new ApiService();