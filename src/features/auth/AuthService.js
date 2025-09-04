// Authentication Service for API calls
class AuthService {
  constructor() {
    this.baseURL = '/api/auth';
  }

  // Helper method for making API requests
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Login user with phone and password
  async login(phone, password) {
    return this.makeRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password })
    });
  }

  // Setup new password for first-time users
  async setupPassword(newPassword, sessionToken) {
    return this.makeRequest('/setup-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ newPassword })
    });
  }

  // Verify existing session
  async verifySession(sessionToken) {
    return this.makeRequest('/verify-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
  }

  // Logout user (invalidate session)
  async logout(sessionToken) {
    return this.makeRequest('/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
  }

  // Create user from employee onboarding
  async createUserFromEmployee(employeeData) {
    return this.makeRequest('/create-from-employee', {
      method: 'POST',
      body: JSON.stringify(employeeData)
    });
  }

  // Update user profile
  async updateProfile(profileData, sessionToken) {
    return this.makeRequest('/update-profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify(profileData)
    });
  }

  // Change password for existing users
  async changePassword(currentPassword, newPassword, sessionToken) {
    return this.makeRequest('/change-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  // Get user profile
  async getProfile(sessionToken) {
    return this.makeRequest('/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
  }

  // Refresh session token
  async refreshSession(sessionToken) {
    return this.makeRequest('/refresh-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;

// Also export the class for testing purposes
export { AuthService };