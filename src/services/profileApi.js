class ProfileApiService {
  constructor() {
    this.baseURL = 'http://localhost:3006/api';
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

  // Get auth headers for file upload
  getFileUploadHeaders() {
    const token = this.getStoredToken();
    return {
      ...(token && { 'Authorization': `Bearer ${token}` })
      // Don't set Content-Type for multipart/form-data, let browser set it
    };
  }

  // Handle API response
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // Get user profile
  async getProfile() {
    try {
      const response = await fetch(`${this.baseURL}/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Profile API - Get profile error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await fetch(`${this.baseURL}/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Profile API - Update profile error:', error);
      throw error;
    }
  }

  // Upload avatar
  async uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${this.baseURL}/profile/avatar`, {
        method: 'POST',
        headers: this.getFileUploadHeaders(),
        body: formData
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Profile API - Upload avatar error:', error);
      throw error;
    }
  }

  // Upload documents
  async uploadDocuments(files) {
    try {
      const formData = new FormData();
      
      // Append multiple files
      for (let i = 0; i < files.length; i++) {
        formData.append('documents', files[i]);
      }

      const response = await fetch(`${this.baseURL}/profile/documents`, {
        method: 'POST',
        headers: this.getFileUploadHeaders(),
        body: formData
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Profile API - Upload documents error:', error);
      throw error;
    }
  }

  // Get profile documents
  async getDocuments() {
    try {
      const response = await fetch(`${this.baseURL}/profile/documents`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Profile API - Get documents error:', error);
      throw error;
    }
  }

  // Delete document
  async deleteDocument(documentId) {
    try {
      const response = await fetch(`${this.baseURL}/profile/documents/${documentId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Profile API - Delete document error:', error);
      throw error;
    }
  }

  // Health check
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Profile API - Health check error:', error);
      throw error;
    }
  }

  // Validate file before upload
  validateFile(file, options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    } = options;

    if (file.size > maxSize) {
      throw new Error(`Fichier trop volumineux. Taille maximale: ${Math.round(maxSize / (1024 * 1024))}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Type de fichier non autorisé. Seuls les images (JPG, PNG, GIF, WebP) et documents (PDF, DOC, DOCX, TXT) sont acceptés.');
    }

    return true;
  }

  // Validate avatar file
  validateAvatar(file) {
    return this.validateFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    });
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file type icon
  getFileTypeIcon(mimetype) {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype === 'application/pdf') return '📄';
    if (mimetype.includes('word')) return '📝';
    if (mimetype === 'text/plain') return '📋';
    return '📁';
  }

  // Check if service is available
  async isServiceAvailable() {
    try {
      await this.checkHealth();
      return true;
    } catch {
      return false;
    }
  }
}

export default new ProfileApiService();