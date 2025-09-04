import React, { createContext, useContext, useState, useEffect } from 'react';

// Define user roles
export const USER_ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  HR: 'hr',
  ADMIN: 'admin'
};

// Create AuthContext
const AuthContext = createContext();

// Authentication Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      if (sessionToken) {
        const response = await fetch('/api/auth/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('sessionToken');
        }
      }
    } catch (error) {
      console.error('Session check failed:', error);
      localStorage.removeItem('sessionToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone, password })
      });

      if (response.ok) {
        const { user, sessionToken } = await response.json();
        localStorage.setItem('sessionToken', sessionToken);
        setUser(user);
        setIsAuthenticated(true);
        return { success: true, user };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const setupPassword = async (newPassword) => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ newPassword })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error('Password setup failed:', error);
      return { success: false, error: 'Password setup failed. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('sessionToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case USER_ROLES.EMPLOYEE:
        return '/employee-dashboard';
      case USER_ROLES.MANAGER:
        return '/manager-dashboard';
      case USER_ROLES.HR:
        return '/hr-dashboard';
      case USER_ROLES.ADMIN:
        return '/admin-dashboard';
      default:
        return '/employee-dashboard';
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    setupPassword,
    hasRole,
    hasAnyRole,
    getDashboardPath
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;