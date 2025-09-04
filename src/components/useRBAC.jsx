import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';

const RBACContext = createContext();

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

export const useRoleBasedAccess = useRBAC;

export const RBACProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [roles, setRoles] = useState({
    admin: {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access and management capabilities',
      permissions: {
        manager: ['read', 'write', 'delete', 'configure'],
        employee: ['read', 'write', 'delete', 'configure'],
        agency: ['read', 'write', 'delete', 'configure'],
        intern: ['read', 'write', 'delete', 'configure'],
        system: ['read', 'write', 'delete', 'configure', 'audit']
      },
      dashboardAccess: ['manager', 'employee', 'agency', 'intern'],
      features: {
        controlPanel: true,
        analytics: true,
        configuration: true,
        reporting: true,
        userManagement: true,
        auditLogs: true
      }
    },
    manager: {
      id: 'manager',
      name: 'Manager',
      description: 'Management oversight and control capabilities',
      permissions: {
        manager: ['read', 'write', 'configure'],
        employee: ['read', 'write'],
        agency: ['read', 'write'],
        intern: ['read', 'write'],
        system: ['read']
      },
      dashboardAccess: ['manager', 'employee', 'agency', 'intern'],
      features: {
        controlPanel: true,
        analytics: true,
        configuration: true,
        reporting: true,
        userManagement: false,
        auditLogs: false
      }
    },
    supervisor: {
      id: 'supervisor',
      name: 'Supervisor',
      description: 'Team supervision and limited management access',
      permissions: {
        manager: ['read'],
        employee: ['read', 'write'],
        agency: ['read'],
        intern: ['read', 'write'],
        system: ['read']
      },
      dashboardAccess: ['employee', 'intern'],
      features: {
        controlPanel: false,
        analytics: true,
        configuration: false,
        reporting: true,
        userManagement: false,
        auditLogs: false
      }
    },
    employee: {
      id: 'employee',
      name: 'Employee',
      description: 'Standard employee access to personal dashboard',
      permissions: {
        manager: [],
        employee: ['read', 'write'],
        agency: [],
        intern: [],
        system: []
      },
      dashboardAccess: ['employee'],
      features: {
        controlPanel: false,
        analytics: false,
        configuration: false,
        reporting: false,
        userManagement: false,
        auditLogs: false
      }
    },
    intern: {
      id: 'intern',
      name: 'Intern',
      description: 'Intern access to learning and task management',
      permissions: {
        manager: [],
        employee: [],
        agency: [],
        intern: ['read', 'write'],
        system: []
      },
      dashboardAccess: ['intern'],
      features: {
        controlPanel: false,
        analytics: false,
        configuration: false,
        reporting: false,
        userManagement: false,
        auditLogs: false
      }
    },
    agency: {
      id: 'agency',
      name: 'Agency User',
      description: 'Agency dashboard access for client management',
      permissions: {
        manager: [],
        employee: ['read'],
        agency: ['read', 'write'],
        intern: [],
        system: []
      },
      dashboardAccess: ['agency'],
      features: {
        controlPanel: false,
        analytics: false,
        configuration: false,
        reporting: false,
        userManagement: false,
        auditLogs: false
      }
    }
  });
  
  const [users, setUsers] = useState([
    { id: 1, name: 'John Manager', email: 'john@company.com', role: 'manager', active: true },
    { id: 2, name: 'Jane Supervisor', email: 'jane@company.com', role: 'supervisor', active: true },
    { id: 3, name: 'Bob Employee', email: 'bob@company.com', role: 'employee', active: true },
    { id: 4, name: 'Alice Intern', email: 'alice@company.com', role: 'intern', active: true },
    { id: 5, name: 'Carol Agency', email: 'carol@agency.com', role: 'agency', active: true }
  ]);

  const { authState } = useUnifiedAuth();
  const { user, isLoading: loading } = authState;

  // Sync currentUser with AuthContext authentication state
  useEffect(() => {
    // Add a small delay to allow session restoration to complete
    const timer = setTimeout(() => {
      if (!loading && user) {
        // Map AuthContext user to RBAC user format
        const rbacUser = {
          id: user.id || Date.now(),
          name: user.full_name || 'Unknown User',
          email: user.email || `${user.full_name}@company.com`,
          role: user.role || 'employee',
          active: user.is_active !== false
        };
        setCurrentUser(rbacUser);
        localStorage.setItem('currentUser', JSON.stringify(rbacUser));
        setIsInitializing(false);
      } else if (!loading && !user) {
        // Only clear user after initialization period
        if (!isInitializing) {
          setCurrentUser(null);
          localStorage.removeItem('currentUser');
        }
        setIsInitializing(false);
      }
    }, isInitializing ? 1000 : 0); // 1 second delay on initial load

    return () => clearTimeout(timer);
  }, [loading, user, isInitializing]);

  // Fallback: Initialize from localStorage if no auth state yet
  useEffect(() => {
    if (!user && !currentUser && isInitializing) {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
          setIsInitializing(false);
        } catch (error) {
          console.warn('Failed to parse saved user from localStorage:', error);
          localStorage.removeItem('currentUser');
          setIsInitializing(false);
        }
      } else {
        // No saved user, finish initialization after a delay
        setTimeout(() => setIsInitializing(false), 1000);
      }
    }
  }, [user, currentUser, isInitializing]);

  const hasPermission = (dashboard, action) => {
    if (!currentUser || !roles[currentUser.role]) return false;
    const userRole = roles[currentUser.role];
    return userRole.permissions[dashboard]?.includes(action) || false;
  };

  const hasDashboardAccess = (dashboard) => {
    if (!currentUser || !roles[currentUser.role]) return false;
    return roles[currentUser.role].dashboardAccess.includes(dashboard);
  };

  const hasFeatureAccess = (feature) => {
    if (!currentUser || !roles[currentUser.role]) return false;
    return roles[currentUser.role].features[feature] || false;
  };

  const updateUserRole = (userId, newRole) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));
  };

  const toggleUserStatus = (userId) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, active: !user.active } : user
    ));
  };

  const addUser = (userData) => {
    const newUser = {
      id: Date.now(),
      ...userData,
      active: true
    };
    setUsers(prev => [...prev, newUser]);
  };

  const removeUser = (userId) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  const updateRole = (roleId, updates) => {
    setRoles(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        ...updates
      }
    }));
  };

  const value = {
    currentUser,
    setCurrentUser,
    isInitializing,
    roles,
    users,
    hasPermission,
    hasDashboardAccess,
    hasFeatureAccess,
    updateUserRole,
    toggleUserStatus,
    addUser,
    removeUser,
    updateRole
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
};