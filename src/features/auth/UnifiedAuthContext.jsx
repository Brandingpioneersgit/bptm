import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useToast } from '@/shared/components/Toast';
import { DatabaseAuthService } from './DatabaseAuthService';

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
    name: '',
    phone: ''
  });

  const { notify } = useToast();

  // Local fallback authentication when database is not available
  const localFallbackLogin = useCallback(async (name, phone, selectedRole) => {
    console.log('🔧 Using local fallback authentication');
    
    // Hardcoded test users from database migration
    const testUsers = {
      'John SEO': { phone: '+91-9876543210', email: 'john.seo@agency.com', role: 'SEO', user_category: 'employee', department: 'Marketing' },
      'Sarah Ads': { phone: '+91-9876543211', email: 'sarah.ads@agency.com', role: 'Ads', user_category: 'employee', department: 'Marketing' },
      'Mike Social': { phone: '+91-9876543212', email: 'mike.social@agency.com', role: 'Social Media', user_category: 'employee', department: 'Marketing' },
      'Lisa YouTube': { phone: '+91-9876543213', email: 'lisa.youtube@agency.com', role: 'YouTube SEO', user_category: 'employee', department: 'Marketing' },
      'David Dev': { phone: '+91-9876543214', email: 'david.dev@agency.com', role: 'Web Developer', user_category: 'employee', department: 'Technology' },
      'Emma Design': { phone: '+91-9876543215', email: 'emma.design@agency.com', role: 'Graphic Designer', user_category: 'employee', department: 'Creative' },
      'Alex Freelancer': { phone: '+91-9876543216', email: 'alex.freelancer@agency.com', role: 'Freelancer', user_category: 'freelancer', department: null },
      'Priya Intern': { phone: '+91-9876543218', email: 'priya.intern@agency.com', role: 'Intern', user_category: 'intern', department: 'Marketing' },
      'Jennifer Operations': { phone: '+91-9876543221', email: 'jennifer.ops@agency.com', role: 'Operations Head', user_category: 'management', department: 'Operations' },
      'Michael Accountant': { phone: '+91-9876543222', email: 'michael.accounts@agency.com', role: 'Accountant', user_category: 'admin', department: 'Finance' },
      'Amanda Sales': { phone: '+91-9876543223', email: 'amanda.sales@agency.com', role: 'Sales', user_category: 'admin', department: 'Sales' },
      'Rachel HR': { phone: '+91-9876543224', email: 'rachel.hr@agency.com', role: 'HR', user_category: 'admin', department: 'Human Resources' },
      'Admin Super': { phone: '+91-9876543225', email: 'admin@agency.com', role: 'Super Admin', user_category: 'super_admin', department: 'Administration' }
    };

    const user = testUsers[name.trim()];
    
    // Normalize phone numbers for comparison (remove +91- prefix if present)
    const normalizedInputPhone = phone.trim().replace(/^\+91-?/, '');
    const normalizedUserPhone = user?.phone?.replace(/^\+91-?/, '') || '';
    
    if (!user || normalizedUserPhone !== normalizedInputPhone || user.role !== selectedRole) {
      console.log('Login validation failed:', {
        userFound: !!user,
        phoneMatch: normalizedUserPhone === normalizedInputPhone,
        roleMatch: user?.role === selectedRole,
        inputPhone: normalizedInputPhone,
        userPhone: normalizedUserPhone,
        inputRole: selectedRole,
        userRole: user?.role
      });
      throw new Error('Invalid credentials or role mismatch');
    }

    // Create mock user data
    const userData = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: user.email,
      phone: user.phone,
      role: user.role,
      user_category: user.user_category,
      department: user.department,
      permissions: {},
      dashboard_access: PREDEFINED_ROLES[user.role]?.dashboards || [],
      status: 'active'
    };

    // Generate session data
    const sessionData = {
      userId: userData.id,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    // Save session to localStorage
    localStorage.setItem('unified_auth_session', JSON.stringify(sessionData));
    localStorage.setItem('unified_auth_local_user', JSON.stringify(userData));

    // Get role configuration
    const roleConfig = PREDEFINED_ROLES[userData.role];
    
    // Update authentication state
    setAuthState({
      isLoggedIn: true,
      user: userData,
      role: userData.role,
      userCategory: userData.user_category,
      permissions: userData.permissions || {},
      dashboardAccess: userData.dashboard_access || roleConfig?.dashboards || [],
      sessionId: sessionData.sessionId,
      isLoading: false,
      loginError: null
    });

    notify({
      type: 'success',
      title: 'Login Successful',
      message: `Welcome back, ${userData.name}! (Local Mode)`
    });

    console.log('✅ Local fallback login successful for:', userData.name);
    return { success: true, user: userData };
  }, [notify]);

  // Simplified database authentication - name and phone only
  const databaseLogin = useCallback(async (name, phone) => {
    console.log('🔐 Using simplified database authentication');
    
    try {
      // Normalize phone number for comparison
      const normalizedPhone = phone.trim().replace(/^\+91[-\s]?/, '');
      
      // First try employees table
      const { data: employeeData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('name', name.trim())
        .eq('phone', normalizedPhone)
        .single();

      if (employeeData && !empError) {
        // Found in employees table
        const userData = {
          id: employeeData.id,
          name: employeeData.name,
          phone: employeeData.phone,
          email: employeeData.email || `${employeeData.name.toLowerCase().replace(/\s+/g, '.')}@agency.com`,
          role: Array.isArray(employeeData.role) ? employeeData.role[0] : employeeData.role || 'Employee',
          user_category: 'employee',
          department: employeeData.department || 'General',
          status: 'active'
        };
        
        console.log('✅ Found user in employees table:', userData.name);
         
         // Generate session data
         const sessionData = {
           userId: userData.id,
           sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
           expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
         };

         // Save session to localStorage
         localStorage.setItem('unified_auth_session', JSON.stringify(sessionData));
         localStorage.setItem('unified_auth_user', JSON.stringify(userData));

         // Get role configuration
         const roleConfig = PREDEFINED_ROLES[userData.role];
         
         // Update authentication state
         setAuthState({
           isLoggedIn: true,
           user: userData,
           role: userData.role,
           userCategory: userData.user_category,
           permissions: userData.permissions || {},
           dashboardAccess: userData.dashboard_access || roleConfig?.dashboards || ['employee_dashboard'],
           sessionId: sessionData.sessionId,
           isLoading: false,
           loginError: null
         });

         notify({
           type: 'success',
           title: 'Login Successful',
           message: `Welcome back, ${userData.name}! (Database)`
         });

         return { success: true, user: userData, isDatabase: true };
       }
       
       // Try users table if not found in employees
       const { data: userData, error: userError } = await supabase
         .from('users')
         .select('*')
         .eq('name', name.trim())
         .eq('phone', normalizedPhone)
         .single();

       if (userData && !userError) {
         // Found in users table
         const userInfo = {
           id: userData.id,
           name: userData.name,
           phone: userData.phone,
           email: userData.email || `${userData.name.toLowerCase().replace(/\s+/g, '.')}@agency.com`,
           role: userData.role || 'User',
           user_category: userData.user_category || 'employee',
           department: userData.department || 'General',
           status: 'active'
         };
         
         console.log('✅ Found user in users table:', userInfo.name);
         
         // Generate session data
         const sessionData = {
           userId: userInfo.id,
           sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
           expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
         };

         // Save session to localStorage
         localStorage.setItem('unified_auth_session', JSON.stringify(sessionData));
         localStorage.setItem('unified_auth_user', JSON.stringify(userInfo));

         // Get role configuration
         const roleConfig = PREDEFINED_ROLES[userInfo.role];
         
         // Update authentication state
         setAuthState({
           isLoggedIn: true,
           user: userInfo,
           role: userInfo.role,
           userCategory: userInfo.user_category,
           permissions: userInfo.permissions || {},
           dashboardAccess: userInfo.dashboard_access || roleConfig?.dashboards || ['employee_dashboard'],
           sessionId: sessionData.sessionId,
           isLoading: false,
           loginError: null
         });

         notify({
           type: 'success',
           title: 'Login Successful',
           message: `Welcome back, ${userInfo.name}! (Database)`
         });

         return { success: true, user: userInfo, isDatabase: true };
       }
       
       // If not found in either table
       throw new Error('User not found in database. Please contact HR to complete your onboarding.');

      // Generate session data
      const sessionData = {
        userId: userData.id,
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      // Save session to localStorage
      localStorage.setItem('unified_auth_session', JSON.stringify(sessionData));
      localStorage.setItem('unified_auth_user', JSON.stringify(userData));

      // Get role configuration
      const roleConfig = PREDEFINED_ROLES[userData.role];
      
      // Update authentication state
      console.log('✅ Setting auth state for database user:', userData.name);
      setAuthState({
        isLoggedIn: true,
        user: {
          id: userData.id,
          name: userData.name,
          phone: userData.phone,
          email: userData.email,
          role: userData.role,
          user_category: userData.user_category,
          department: userData.department,
          permissions: userData.permissions || {},
          dashboard_access: userData.dashboard_access || roleConfig?.dashboards || []
        },
        role: userData.role,
        userCategory: userData.user_category,
        permissions: userData.permissions || {},
        dashboardAccess: userData.dashboard_access || roleConfig?.dashboards || [],
        sessionId: sessionData.sessionId,
        isLoading: false,
        loginError: null
      });
      console.log('✅ Database auth state updated successfully');

      // Clear login form
      setLoginForm({ name: '', phone: '' });
      
      notify({ title: `Welcome back, ${userData.name}!`, type: 'success' });
      return { success: true, user: userData, isDatabase: true };
    } catch (error) {
      console.error('Simplified database authentication failed:', error);
      throw error;
    }
    
  }, [notify]);

  // Session restoration
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedSession = localStorage.getItem('unified_auth_session');
        const savedUser = localStorage.getItem('unified_auth_user');
        
        if (savedSession && savedUser) {
          const session = JSON.parse(savedSession);
          const user = JSON.parse(savedUser);
          
          // Check if session is still valid (not expired)
          if (session.expiresAt && new Date(session.expiresAt) > new Date()) {
            console.log('🔄 Restoring session for:', user.name);
            
            const roleConfig = PREDEFINED_ROLES[user.role];
            
            setAuthState({
              isLoggedIn: true,
              user,
              role: user.role,
              userCategory: roleConfig?.category || 'unknown',
              permissions: roleConfig?.permissions || {},
              dashboardAccess: roleConfig?.dashboards || [],
              sessionId: session.sessionId,
              isLoading: false,
              loginError: null
            });
          } else {
            console.log('🕐 Session expired, clearing stored data');
            localStorage.removeItem('unified_auth_session');
            localStorage.removeItem('unified_auth_user');
            localStorage.removeItem('unified_auth_local_user');
          }
        }
      } catch (error) {
        console.error('❌ Error restoring session:', error);
        localStorage.removeItem('unified_auth_session');
        localStorage.removeItem('unified_auth_user');
        localStorage.removeItem('unified_auth_local_user');
      }
    };
    
    restoreSession();
  }, []);

  // Main login function - supports both database and local fallback
  const login = useCallback(async (credentials) => {
    const { name, phone, role } = credentials;
    
    if (!name || !phone) {
      const error = 'Name and phone number are required';
      setAuthState(prev => ({ ...prev, loginError: error, isLoading: false }));
      throw new Error(error);
    }

    setAuthState(prev => ({ ...prev, isLoading: true, loginError: null }));

    try {
      // Try database authentication first
      console.log('🔐 Attempting database authentication for:', name);
      const result = await databaseLogin(name, phone);
      return result;
    } catch (dbError) {
      console.log('📱 Database auth failed, trying local fallback:', dbError.message);
      
      try {
        // Fallback to local authentication if database fails
        const result = await localFallbackLogin(name, phone, role);
        return result;
      } catch (localError) {
        console.error('❌ Both database and local authentication failed');
        const error = 'Invalid credentials. Please check your name and phone number.';
        setAuthState(prev => ({ ...prev, loginError: error, isLoading: false }));
        throw new Error(error);
      }
    }
  }, [databaseLogin, localFallbackLogin]);

  // Logout function
  const logout = useCallback(async () => {
    console.log('🚪 Logging out user');
    
    // Clear localStorage
    localStorage.removeItem('unified_auth_session');
    localStorage.removeItem('unified_auth_user');
    localStorage.removeItem('unified_auth_local_user');
    
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
    
    notify({ title: 'Logged out successfully', type: 'success' });
  }, [notify]);

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