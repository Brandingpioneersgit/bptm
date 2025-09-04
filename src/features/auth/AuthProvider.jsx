import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { DatabaseAuthService } from './DatabaseAuthService';

// Auth State Interface
const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  session: null,
  role: null,
  userCategory: null,
  permissions: [],
  error: null
};

// Action Types
const AuthActionTypes = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SESSION_RESTORED: 'SESSION_RESTORED',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Role-based permissions mapping
const ROLE_PERMISSIONS = {
  'Super Admin': [
    'view:all_dashboards',
    'manage:employees',
    'manage:clients',
    'manage:finances',
    'manage:hr',
    'manage:operations',
    'view:analytics',
    'manage:settings',
    'manage:arcade',
    'audit:logs'
  ],
  'Operations Head': [
    'view:operations_dashboard',
    'view:employee_dashboard',
    'view:agency_dashboard',
    'view:intern_dashboard',
    'view:freelancer_dashboard',
    'manage:operations',
    'view:analytics',
    'manage:arcade'
  ],
  'HR': [
    'view:hr_dashboard',
    'manage:employees',
    'view:employee_profiles',
    'manage:onboarding',
    'manage:performance',
    'view:compliance'
  ],
  'Manager': [
    'view:manager_dashboard',
    'view:employee_submissions',
    'review:performance',
    'manage:team'
  ],
  'Employee': [
    'view:personal_dashboard',
    'submit:reports',
    'edit:profile',
    'view:own_performance'
  ],
  'Intern': [
    'view:intern_dashboard',
    'submit:weekly_reports',
    'view:projects',
    'view:learning_progress'
  ],
  'Freelancer': [
    'view:freelancer_dashboard',
    'submit:project_reports',
    'view:project_assignments'
  ]
};

// User categories mapping
const USER_CATEGORIES = {
  'Super Admin': 'admin',
  'Operations Head': 'management',
  'HR': 'hr',
  'Manager': 'management',
  'Employee': 'employee',
  'Intern': 'intern',
  'Freelancer': 'freelancer'
};

// Auth Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AuthActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
      
    case AuthActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        session: action.payload.session,
        role: action.payload.role,
        userCategory: action.payload.userCategory,
        permissions: action.payload.permissions,
        error: null,
        loginAttempts: 0,
        lockoutUntil: null
      };
      
    case AuthActionTypes.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        session: null,
        role: null,
        userCategory: null,
        permissions: [],
        error: action.payload.error,
        loginAttempts: state.loginAttempts + 1
      };
      
    case AuthActionTypes.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      };
      
    case AuthActionTypes.SESSION_RESTORED:
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        session: action.payload.session,
        role: action.payload.role,
        userCategory: action.payload.userCategory,
        permissions: action.payload.permissions,
        error: null
      };
      
    case AuthActionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
      
    case AuthActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
      
    default:
      return state;
  }
}

// Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const supabase = useSupabase();
  const { notify } = useToast();

  // Session restoration on app load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        dispatch({ type: AuthActionTypes.SET_LOADING, payload: true });
        
        if (!supabase) {
          // Fallback to localStorage for offline mode
          const savedSession = localStorage.getItem('bptm_auth_session');
          if (savedSession) {
            const sessionData = JSON.parse(savedSession);
            const sessionAge = Date.now() - sessionData.timestamp;
            
            // Session expires after 24 hours
            if (sessionAge < 24 * 60 * 60 * 1000) {
              const userData = await getUserProfileData(sessionData.user);
              dispatch({
                type: AuthActionTypes.SESSION_RESTORED,
                payload: {
                  user: userData,
                  session: sessionData,
                  role: userData.role,
                  userCategory: USER_CATEGORIES[userData.role],
                  permissions: ROLE_PERMISSIONS[userData.role] || []
                }
              });
              return;
            } else {
              localStorage.removeItem('bptm_auth_session');
            }
          }
          dispatch({ type: AuthActionTypes.SET_LOADING, payload: false });
          return;
        }

        // Supabase session restoration
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session restoration error:', error);
          dispatch({ type: AuthActionTypes.SET_LOADING, payload: false });
          return;
        }

        if (session?.user) {
          const userData = await getUserProfileData(session.user);
          dispatch({
            type: AuthActionTypes.SESSION_RESTORED,
            payload: {
              user: userData,
              session,
              role: userData.role,
              userCategory: USER_CATEGORIES[userData.role],
              permissions: ROLE_PERMISSIONS[userData.role] || []
            }
          });
        } else {
          dispatch({ type: AuthActionTypes.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
        dispatch({ type: AuthActionTypes.SET_LOADING, payload: false });
      }
    };

    restoreSession();
  }, [supabase]);

  // Listen for auth changes
  useEffect(() => {
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        switch (event) {
          case 'SIGNED_IN':
            if (session?.user) {
              const userData = await getUserProfileData(session.user);
              dispatch({
                type: AuthActionTypes.LOGIN_SUCCESS,
                payload: {
                  user: userData,
                  session,
                  role: userData.role,
                  userCategory: USER_CATEGORIES[userData.role],
                  permissions: ROLE_PERMISSIONS[userData.role] || []
                }
              });
            }
            break;
            
          case 'SIGNED_OUT':
            dispatch({ type: AuthActionTypes.LOGOUT });
            localStorage.removeItem('bptm_auth_session');
            break;
            
          case 'TOKEN_REFRESHED':
            // Session refreshed, update if needed
            break;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Get user profile data from database or create default
  const getUserProfileData = async (authUser) => {
    try {
      if (supabase) {
        // Try to get user profile from database
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', authUser.email)
          .single();

        if (data) {
          return {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role,
            department: data.department,
            phone: data.phone,
            avatar_url: data.avatar_url,
            created_at: data.created_at,
            updated_at: data.updated_at
          };
        }
        
        if (error && error.code !== 'PGRST116') { // Not "not found" error
          throw error;
        }
      }

      // Create default profile if not found
      return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        role: determineUserRole(authUser.email),
        department: 'General',
        phone: authUser.phone || '',
        avatar_url: authUser.user_metadata?.avatar_url || '',
        created_at: authUser.created_at,
        updated_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error getting user profile:', error);
      // Return minimal profile on error
      return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.email.split('@')[0],
        role: 'Employee',
        department: 'General',
        phone: '',
        avatar_url: '',
        created_at: authUser.created_at,
        updated_at: new Date().toISOString()
      };
    }
  };

  // Determine user role based on email or other criteria
  const determineUserRole = (email) => {
    const adminEmails = ['admin@company.com', 'superadmin@company.com'];
    const hrEmails = ['hr@company.com'];
    const operationsEmails = ['operations@company.com'];
    
    if (adminEmails.includes(email)) return 'Super Admin';
    if (hrEmails.includes(email)) return 'HR';
    if (operationsEmails.includes(email)) return 'Operations Head';
    if (email.includes('manager')) return 'Manager';
    if (email.includes('intern')) return 'Intern';
    if (email.includes('freelancer')) return 'Freelancer';
    
    return 'Employee'; // Default role
  };

  // Check if user is locked out
  const isLockedOut = () => {
    if (!state.lockoutUntil) return false;
    return Date.now() < state.lockoutUntil;
  };

  // Login function
  const login = async (credentials) => {
    try {
      // Check for lockout
      if (isLockedOut()) {
        const remainingTime = Math.ceil((state.lockoutUntil - Date.now()) / 1000 / 60);
        throw new Error(`Account locked. Try again in ${remainingTime} minutes.`);
      }

      dispatch({ type: AuthActionTypes.SET_LOADING, payload: true });
      dispatch({ type: AuthActionTypes.CLEAR_ERROR });

      // Try database authentication first
      try {
        const ipAddress = 'client-ip-placeholder'; // In production, get from request headers
        const userAgent = navigator.userAgent || 'unknown';
        
        const authResult = await DatabaseAuthService.authenticateUser(
          credentials.email,
          credentials.password,
          ipAddress,
          userAgent
        );

        if (authResult.success) {
          // Save session to localStorage
          localStorage.setItem('bptm_auth_session', JSON.stringify({
            user: authResult.user,
            session: authResult.session,
            timestamp: Date.now()
          }));

          dispatch({
            type: AuthActionTypes.LOGIN_SUCCESS,
            payload: {
              user: authResult.user,
              session: authResult.session,
              role: authResult.user.role,
              userCategory: USER_CATEGORIES[authResult.user.role],
              permissions: ROLE_PERMISSIONS[authResult.user.role] || []
            }
          });

          notify({ 
            type: 'success', 
            title: 'Login Successful', 
            message: `Welcome back, ${authResult.user.name}!` 
          });

          return { success: true, user: authResult.user };
        }
      } catch (dbError) {
        console.warn('Database authentication failed:', dbError.message);
        
        // If database auth fails and Supabase is not available, throw error
        if (!supabase) {
          throw new Error(dbError.message);
        }
        
        // Continue to Supabase auth as fallback
      }

      // Real Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        throw error;
      }

      const userData = await getUserProfileData(data.user);

      dispatch({
        type: AuthActionTypes.LOGIN_SUCCESS,
        payload: {
          user: userData,
          session: data.session,
          role: userData.role,
          userCategory: USER_CATEGORIES[userData.role],
          permissions: ROLE_PERMISSIONS[userData.role] || []
        }
      });

      notify({ 
        type: 'success', 
        title: 'Login Successful', 
        message: `Welcome back, ${userData.name}!` 
      });

      return { success: true, user: userData };

    } catch (error) {
      dispatch({
        type: AuthActionTypes.LOGIN_FAILURE,
        payload: { error: error.message }
      });

      notify({ 
        type: 'error', 
        title: 'Login Failed', 
        message: error.message 
      });

      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Get current session token for database logout
      const sessionData = localStorage.getItem('bptm_auth_session');
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          if (session.session?.session_token) {
            // Invalidate session in database
            await DatabaseAuthService.logoutUser(session.session.session_token);
          }
        } catch (parseError) {
          console.warn('Could not parse session data for logout:', parseError);
        }
      }
      
      // Sign out from Supabase if available
      if (supabase) {
        await supabase.auth.signOut();
      }
      
      // Clear local storage
      localStorage.removeItem('bptm_auth_session');
      
      dispatch({ type: AuthActionTypes.LOGOUT });
      
      notify({ 
        type: 'info', 
        title: 'Logged Out', 
        message: 'You have been logged out successfully.' 
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      dispatch({ type: AuthActionTypes.LOGOUT });
      localStorage.removeItem('bptm_auth_session');
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      if (supabase && state.user?.id) {
        const { error } = await supabase
          .from('user_profiles')
          .update(updates)
          .eq('id', state.user.id);

        if (error) throw error;
      }

      dispatch({
        type: AuthActionTypes.UPDATE_USER,
        payload: updates
      });

      notify({ 
        type: 'success', 
        title: 'Profile Updated', 
        message: 'Your profile has been updated successfully.' 
      });

      return { success: true };
    } catch (error) {
      notify({ 
        type: 'error', 
        title: 'Update Failed', 
        message: error.message 
      });
      
      return { success: false, error: error.message };
    }
  };

  // Check permissions
  const hasPermission = (permission) => {
    return state.permissions.includes(permission);
  };

  // Check if user can access a specific dashboard
  const canAccessDashboard = (dashboardType) => {
    const dashboardPermissions = {
      'superAdmin': 'view:all_dashboards',
      'operations': 'view:operations_dashboard',
      'hr': 'view:hr_dashboard',
      'manager': 'view:manager_dashboard',
      'employee': 'view:personal_dashboard',
      'intern': 'view:intern_dashboard',
      'freelancer': 'view:freelancer_dashboard',
      'agency': 'view:agency_dashboard'
    };

    const requiredPermission = dashboardPermissions[dashboardType];
    return requiredPermission ? hasPermission(requiredPermission) : false;
  };

  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    login,
    logout,
    updateProfile,
    
    // Utilities
    hasPermission,
    canAccessDashboard,
    isLockedOut: isLockedOut(),
    clearError: () => dispatch({ type: AuthActionTypes.CLEAR_ERROR })
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export for convenience
export { AuthActionTypes, ROLE_PERMISSIONS, USER_CATEGORIES };