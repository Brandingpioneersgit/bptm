import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useToast } from '@/shared/components/Toast';
import { authenticateUser, validateSession, logout as apiLogout, getDashboardRoute } from '@/api/authApi';

const UnifiedAuthContext = createContext(null);

export const useUnifiedAuth = () => {
  const context = useContext(UnifiedAuthContext);
  if (!context) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};

// Predefined roles as specified by the user
const PREDEFINED_ROLES = {
  // Employee Category
  SEO: { category: 'employee', department: 'Marketing', dashboards: ['seo_dashboard', 'employee_dashboard', 'profile'] },
  'Ads': { category: 'employee', department: 'Marketing', dashboards: ['ads_dashboard', 'employee_dashboard', 'profile'] },
  'Social Media': { category: 'employee', department: 'Marketing', dashboards: ['social_dashboard', 'employee_dashboard', 'profile'] },
  'YouTube SEO': { category: 'employee', department: 'Marketing', dashboards: ['youtube_dashboard', 'employee_dashboard', 'profile'] },
  'Web Developer': { category: 'employee', department: 'Technology', dashboards: ['dev_dashboard', 'employee_dashboard', 'profile'] },
  'Graphic Designer': { category: 'employee', department: 'Creative', dashboards: ['design_dashboard', 'employee_dashboard', 'profile'] },
  
  // Freelancer Category
  'Freelancer': { category: 'freelancer', department: null, dashboards: ['freelancer_dashboard', 'profile'] },
  
  // Intern Category
  'Intern': { category: 'intern', department: null, dashboards: ['intern_dashboard', 'profile'] },
  
  // Management Category
  'Operations Head': { category: 'management', department: 'Operations', dashboards: ['operations_dashboard', 'management_dashboard', 'profile'] },
  
  // Admin Category
  'Accountant': { category: 'admin', department: 'Finance', dashboards: ['accounting_dashboard', 'admin_dashboard', 'profile'] },
  'Sales': { category: 'admin', department: 'Sales', dashboards: ['sales_dashboard', 'admin_dashboard', 'profile'] },
  'HR': { category: 'admin', department: 'Human Resources', dashboards: ['hr_dashboard', 'admin_dashboard', 'profile'] },
  
  // Super Admin Category
  'Super Admin': { category: 'super_admin', department: 'Administration', dashboards: ['super_admin_dashboard', 'all_dashboards', 'profile'] }
};

// Local fallback authentication for testing when Supabase is not available

export const UnifiedAuthProvider = ({ children }) => {
  // Normal authentication mode - users need to login
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    user: null,
    role: null,
    userCategory: null,
    permissions: {},
    dashboardAccess: [],
    sessionId: null,
    isLoading: false,
    loginError: null
  });

  const [loginForm, setLoginForm] = useState({
    firstName: '',
    phone: ''
  });

  const { notify } = useToast();

  // Authentication is now handled by AuthenticationService

  // Database authentication is now handled by AuthenticationService

  // Session restoration
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Check if we have a session in localStorage
        const sessionData = localStorage.getItem('unified_auth_session');
        const userData = localStorage.getItem('unified_auth_user');
        
        if (!sessionData || !userData) {
          console.log('🔍 No saved session found');
          return;
        }
        
        const parsedSession = JSON.parse(sessionData);
        const parsedUser = JSON.parse(userData);
        const sessionToken = parsedSession.sessionId;
        
        console.log('🔄 Attempting to restore session:', { 
          userId: parsedUser.id,
          sessionId: sessionToken?.substring(0, 10) + '...' 
        });
        
        // Validate the session with the server
        const { valid, error } = await validateSession(sessionToken);
        
        if (!valid) {
          console.log('❌ Session invalid or expired:', error);
          localStorage.removeItem('unified_auth_session');
          localStorage.removeItem('unified_auth_user');
          return;
        }
        
        console.log('✅ Session restored successfully');
        
        // Get role configuration
        const roleConfig = PREDEFINED_ROLES[parsedUser.role];
        
        // Update authentication state
        setAuthState({
          isLoggedIn: true,
          user: parsedUser,
          role: parsedUser.role,
          userCategory: parsedUser.user_category,
          permissions: parsedUser.permissions || {},
          dashboardAccess: parsedUser.dashboard_access || roleConfig?.dashboards || [],
          sessionId: sessionToken,
          isLoading: false,
          loginError: null
        });
      } catch (error) {
        console.error('Error restoring session:', error);
        // Clear any invalid session data
        localStorage.removeItem('unified_auth_session');
        localStorage.removeItem('unified_auth_user');
      }
    };
    
    restoreSession();
  }, []);

  // Main login function - first name + phone authentication
  const login = useCallback(async (credentials) => {
    const { firstName, phone } = credentials;
    
    if (!firstName || !phone) {
      const error = 'First name and phone number are required';
      setAuthState(prev => ({ ...prev, loginError: error, isLoading: false }));
      throw new Error(error);
    }

    setAuthState(prev => ({ ...prev, isLoading: true, loginError: null }));

    try {
      console.log('🔐 Authenticating user with first name and phone');
      
      // Use the new authApi
      const authResult = await authenticateUser(firstName, phone);

      if (!authResult.success) {
        throw new Error(authResult.error);
      }

      console.log('✅ Authentication successful for:', authResult.user.name);
      
      // Store session data
      const sessionData = authResult.sessionData || {
        sessionId: authResult.token,
        userId: authResult.user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

      localStorage.setItem('unified_auth_session', JSON.stringify(sessionData));
      localStorage.setItem('unified_auth_user', JSON.stringify(authResult.user));

      // Get role configuration
      const roleConfig = PREDEFINED_ROLES[authResult.user.role];
      
      // Update authentication state
      setAuthState({
        isLoggedIn: true,
        user: authResult.user,
        role: authResult.user.role,
        userCategory: authResult.user.user_category,
        permissions: authResult.user.permissions || {},
        dashboardAccess: authResult.user.dashboard_access || roleConfig?.dashboards || [],
        sessionId: authResult.token,
        isLoading: false,
        loginError: null
      });

      notify({
        type: 'success',
        title: 'Login Successful',
        message: `Welcome back, ${authResult.user.firstName}!`
      });

      return {
        success: true,
        user: authResult.user,
        dashboardRoute: getDashboardRoute(authResult.user.role)
      };

    } catch (error) {
      console.error('❌ Login failed:', error);
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      
      setAuthState(prev => ({ 
        ...prev, 
        loginError: errorMessage, 
        isLoading: false 
      }));
      
      notify({
        type: 'error',
        title: 'Login Failed',
        message: errorMessage
      });
      
      throw error;
    }
  }, [notify]);

  // Logout function
  const logout = useCallback(async () => {
    console.log('🚪 Logging out user');
    
    try {
      // Use authApi to handle logout
      await apiLogout(authState.sessionId);
      
      // Reset auth state
      setAuthState({
        isLoggedIn: false,
        user: null,
        role: null,
        userCategory: null,
        permissions: {},
        dashboardAccess: [],
        sessionId: null,
        isLoading: false,
        loginError: null
      });
      
      notify({ 
        type: 'success',
        title: 'Logged out successfully',
        message: 'You have been logged out safely'
      });
    } catch (error) {
      console.error('Logout error:', error);
      notify({ 
        type: 'error',
        title: 'Logout Error',
        message: 'There was an issue logging out'
      });
    }
  }, [authState.sessionId, notify]);

  // Update login form
  const updateLoginForm = useCallback((updates) => {
    setLoginForm(prev => ({ ...prev, ...updates }));
  }, []);

  // Clear login error
  const clearLoginError = useCallback(() => {
    setAuthState(prev => ({ ...prev, loginError: null }));
  }, []);

  // Check if user has specific permission
  const hasPermission = useCallback((resource, action) => {
    if (!authState.isLoggedIn || !authState.role) return false;
    
    // Super Admin has all permissions
    if (authState.role === 'Super Admin') return true;
    
    // Check role-based permissions from database
    // This would typically involve a database call, but for now we'll use basic role checks
    const userCategory = authState.userCategory;
    
    switch (userCategory) {
      case 'super_admin':
        return true;
      case 'management':
      case 'admin':
        return ['read', 'write', 'approve'].includes(action);
      case 'employee':
      case 'freelancer':
      case 'intern':
        return ['read', 'write'].includes(action) && !resource.includes('admin');
      default:
        return false;
    }
  }, [authState.isLoggedIn, authState.role, authState.userCategory]);

  // Check if user has dashboard access
  const hasDashboardAccess = useCallback((dashboardName) => {
    if (!authState.isLoggedIn) return false;
    if (authState.role === 'Super Admin') return true;
    return authState.dashboardAccess.includes(dashboardName);
  }, [authState.isLoggedIn, authState.role, authState.dashboardAccess]);

  // Check if user needs to submit monthly form
  const needsMonthlyFormSubmission = useCallback(async () => {
    if (!authState.isLoggedIn || !authState.user) return false;
    
    try {
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'; // First day of current month
      
      const { data, error } = await supabase
        .from('monthly_form_submissions')
        .select('id')
        .eq('user_id', authState.user.id)
        .eq('submission_month', currentMonth)
        .limit(1);
      
      if (error) {
        console.error('Error checking monthly form submission:', error);
        return false;
      }
      
      return data.length === 0; // True if no submission found for current month
    } catch (error) {
      console.error('Error checking monthly form submission:', error);
      return false;
    }
  }, [authState.isLoggedIn, authState.user]);

  // Get available roles for dropdown
  const getAvailableRoles = useCallback(() => {
    return Object.keys(PREDEFINED_ROLES).sort();
  }, []);

  // Get role configuration
  const getRoleConfig = useCallback((roleName) => {
    return PREDEFINED_ROLES[roleName] || null;
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates) => {
    try {
      if (!authState.isLoggedIn || !authState.user?.id) {
        throw new Error('User not authenticated');
      }

      if (supabase) {
        const { data, error } = await supabase
          .from('unified_users')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', authState.user.id)
          .select()
          .single();

        if (error) throw error;

        // Update local auth state with new data
        setAuthState(prev => ({
          ...prev,
          user: {
            ...prev.user,
            ...updates
          }
        }));

        notify({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile has been updated successfully.'
        });

        return { success: true, data };
      } else {
        // Fallback for testing mode
        setAuthState(prev => ({
          ...prev,
          user: {
            ...prev.user,
            ...updates
          }
        }));

        notify({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile has been updated successfully. (Testing Mode)'
        });

        return { success: true };
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      notify({
        type: 'error',
        title: 'Update Failed',
        message: error.message || 'Failed to update profile.'
      });
      return { success: false, error: error.message };
    }
  }, [authState.isLoggedIn, authState.user, supabase, notify]);

  const value = {
    // Auth State
    authState,
    isLoggedIn: authState.isLoggedIn,
    user: authState.user,
    role: authState.role,
    userCategory: authState.userCategory,
    permissions: authState.permissions,
    dashboardAccess: authState.dashboardAccess,
    isLoading: authState.isLoading,
    loginError: authState.loginError,
    
    // Login Form
    loginForm,
    updateLoginForm,
    
    // Auth Actions
    login,
    logout,
    updateProfile,
    clearLoginError,
    
    // Permission Checks
    hasPermission,
    hasDashboardAccess,
    needsMonthlyFormSubmission,
    
    // Role Management
    getAvailableRoles,
    getRoleConfig,
    PREDEFINED_ROLES
  };

  return (
    <UnifiedAuthContext.Provider value={value}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};

export default UnifiedAuthProvider;