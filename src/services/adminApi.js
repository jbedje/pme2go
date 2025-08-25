// Admin API service layer for PME2GO admin dashboard
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3004/api';

class AdminApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get stored token
  getStoredToken() {
    try {
      const tokenData = localStorage.getItem('pme2go_token');
      return tokenData ? JSON.parse(tokenData).accessToken : null;
    } catch {
      return null;
    }
  }

  // Get auth headers
  getAuthHeaders() {
    const token = this.getStoredToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        ...this.getAuthHeaders(),
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
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Admin API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // === DASHBOARD ===
  async getDashboardStats() {
    return await this.request('/admin/dashboard/stats');
  }

  // === USER MANAGEMENT ===
  async getUsers(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, value);
        }
      }
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return await this.request(`/admin/users${query}`);
  }

  async getUser(id) {
    return await this.request(`/admin/users/${id}`);
  }

  async updateUser(id, userData) {
    return await this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: userData,
    });
  }

  async banUser(id, is_banned, ban_reason = '') {
    return await this.request(`/admin/users/${id}/ban`, {
      method: 'PUT',
      body: { is_banned, ban_reason },
    });
  }

  async deleteUser(id) {
    return await this.request(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  // === SYSTEM MONITORING ===
  async getSystemHealth() {
    return await this.request('/admin/system/health');
  }

  async getActivityLogs(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return await this.request(`/admin/system/logs${query}`);
  }

  async getSystemSettings() {
    return await this.request('/admin/system/settings');
  }

  async updateSystemSettings(settings) {
    return await this.request('/admin/system/settings', {
      method: 'PUT',
      body: { settings },
    });
  }

  // === UTILITY METHODS ===
  
  // Format user data for display
  formatUserForDisplay(user) {
    return {
      ...user,
      displayName: user.name || 'Unnamed User',
      displayEmail: user.email,
      roleDisplay: this.formatRole(user.role),
      statusDisplay: this.formatUserStatus(user),
      lastLoginDisplay: user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never',
      createdAtDisplay: new Date(user.created_at).toLocaleDateString(),
      isBanned: user.is_banned || false
    };
  }

  formatRole(role) {
    const roleMap = {
      'user': 'User',
      'admin': 'Admin',
      'super_admin': 'Super Admin'
    };
    return roleMap[role] || 'User';
  }

  formatUserStatus(user) {
    if (user.is_banned) return 'Banned';
    if (user.account_status === 'suspended') return 'Suspended';
    if (user.account_status === 'pending') return 'Pending';
    return 'Active';
  }

  formatSystemHealth(health) {
    return {
      ...health,
      statusColor: health.status === 'healthy' ? 'green' : 'red',
      uptimeDisplay: this.formatUptime(health.checks.uptime),
      memoryDisplay: health.checks.memory_usage
    };
  }

  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  formatActivityLog(log) {
    return {
      ...log,
      timeDisplay: new Date(log.created_at).toLocaleString(),
      actionDisplay: this.formatAction(log.action),
      adminDisplay: `${log.admin_name} (${log.admin_email})`
    };
  }

  formatAction(action) {
    const actionMap = {
      'VIEW_DASHBOARD_STATS': 'Viewed Dashboard',
      'VIEW_USERS_LIST': 'Viewed Users List',
      'VIEW_USER_DETAILS': 'Viewed User Details',
      'UPDATE_USER': 'Updated User',
      'BAN_USER': 'Banned User',
      'UNBAN_USER': 'Unbanned User',
      'DELETE_USER': 'Deleted User',
      'CHECK_SYSTEM_HEALTH': 'Checked System Health',
      'VIEW_SYSTEM_SETTINGS': 'Viewed Settings',
      'UPDATE_SYSTEM_SETTINGS': 'Updated Settings'
    };
    return actionMap[action] || action;
  }

  // Check if user has admin access
  checkAdminAccess(user) {
    return user && user.role && ['admin', 'super_admin'].includes(user.role);
  }

  // Check if user is super admin
  checkSuperAdminAccess(user) {
    return user && user.role === 'super_admin';
  }
}

export default new AdminApiService();