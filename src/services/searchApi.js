class SearchApiService {
  constructor() {
    this.baseURL = 'http://localhost:3008/api';
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

  // Handle API response
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // Build query string from parameters
  buildQueryString(params) {
    const filtered = Object.fromEntries(
      Object.entries(params).filter(([key, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        return value !== null && value !== undefined && value !== '';
      })
    );

    const searchParams = new URLSearchParams();
    
    Object.entries(filtered).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, item));
      } else {
        searchParams.append(key, value);
      }
    });

    return searchParams.toString();
  }

  // Search users with advanced filtering
  async searchUsers(filters = {}) {
    try {
      const {
        q = '',
        skills = [],
        company = '',
        position = '',
        availability = '',
        languages = [],
        location = '',
        page = 1,
        limit = 20,
        sortBy = 'relevance',
        sortOrder = 'desc'
      } = filters;

      const queryParams = this.buildQueryString({
        q,
        skills,
        company,
        position,
        availability,
        languages,
        location,
        page,
        limit,
        sortBy,
        sortOrder
      });

      const response = await fetch(`${this.baseURL}/search/users?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Search API - Search users error:', error);
      throw error;
    }
  }

  // Get available filter options
  async getFilters() {
    try {
      // Return empty filters for now with simple search server
      return {
        companies: [],
        positions: [],
        availability: ['available', 'busy', 'unavailable'],
        skills: [],
        languages: []
      };
    } catch (error) {
      console.error('Search API - Get filters error:', error);
      throw error;
    }
  }

  // Get search suggestions
  async getSuggestions(query, type = 'users') {
    try {
      if (!query || query.length < 1) return { suggestions: [] };

      const queryParams = this.buildQueryString({ q: query, type });

      const response = await fetch(`${this.baseURL}/search/suggestions?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Search API - Get suggestions error:', error);
      return { suggestions: [] }; // Return empty suggestions on error
    }
  }

  // Quick search (simplified search for search bars)
  async quickSearch(query, limit = 5) {
    try {
      return await this.searchUsers({ 
        q: query, 
        limit,
        sortBy: 'relevance'
      });
    } catch (error) {
      console.error('Search API - Quick search error:', error);
      throw error;
    }
  }

  // Search by skills
  async searchBySkills(skills, filters = {}) {
    try {
      return await this.searchUsers({
        ...filters,
        skills: Array.isArray(skills) ? skills : [skills],
        sortBy: 'relevance'
      });
    } catch (error) {
      console.error('Search API - Search by skills error:', error);
      throw error;
    }
  }

  // Search by company
  async searchByCompany(company, filters = {}) {
    try {
      return await this.searchUsers({
        ...filters,
        company,
        sortBy: 'company'
      });
    } catch (error) {
      console.error('Search API - Search by company error:', error);
      throw error;
    }
  }

  // Search by availability
  async searchByAvailability(availability, filters = {}) {
    try {
      return await this.searchUsers({
        ...filters,
        availability,
        sortBy: 'updated_at'
      });
    } catch (error) {
      console.error('Search API - Search by availability error:', error);
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
      console.error('Search API - Health check error:', error);
      throw error;
    }
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

  // Format search results for display
  formatSearchResults(results) {
    if (!results || !results.users) return [];

    return results.users.map(user => ({
      ...user,
      fullName: `${user.first_name} ${user.last_name}`.trim(),
      displayEmail: user.email,
      hasCompany: !!(user.company && user.company.trim()),
      hasPosition: !!(user.position && user.position.trim()),
      hasBio: !!(user.bio && user.bio.trim()),
      skillsCount: Array.isArray(user.skills) ? user.skills.length : 0,
      languagesCount: Array.isArray(user.languages) ? user.languages.length : 0,
      isAvailable: user.availability === 'available'
    }));
  }

  // Get popular skills
  async getPopularSkills(limit = 10) {
    try {
      const filters = await this.getFilters();
      return filters.skills.slice(0, limit);
    } catch (error) {
      console.error('Search API - Get popular skills error:', error);
      return [];
    }
  }

  // Get popular companies
  async getPopularCompanies(limit = 10) {
    try {
      const filters = await this.getFilters();
      return filters.companies.slice(0, limit);
    } catch (error) {
      console.error('Search API - Get popular companies error:', error);
      return [];
    }
  }

  // Advanced search with multiple criteria
  async advancedSearch({
    query = '',
    selectedSkills = [],
    selectedLanguages = [],
    selectedCompany = '',
    selectedPosition = '',
    selectedAvailability = '',
    selectedLocation = '',
    page = 1,
    pageSize = 20,
    sortBy = 'relevance',
    sortOrder = 'desc'
  } = {}) {
    try {
      const filters = {
        q: query,
        skills: selectedSkills,
        languages: selectedLanguages,
        company: selectedCompany,
        position: selectedPosition,
        availability: selectedAvailability,
        location: selectedLocation,
        page,
        limit: pageSize,
        sortBy,
        sortOrder
      };

      const results = await this.searchUsers(filters);
      return {
        ...results,
        users: this.formatSearchResults(results)
      };
    } catch (error) {
      console.error('Search API - Advanced search error:', error);
      throw error;
    }
  }
}

export default new SearchApiService();