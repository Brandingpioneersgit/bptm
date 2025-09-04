/**
 * SEO Role-Based Access Control
 * Manages permissions for SEO module based on user roles
 */

import React from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// SEO Role definitions - must be SEO department members
const SEO_ROLES = {
  ADMIN: 'admin',
  TEAM_LEAD: 'tl', 
  EMPLOYEE: 'employee',
  MENTOR: 'mentor'
};

// Department definitions
const DEPARTMENTS = {
  SEO: 'seo',
  MANAGER: 'manager',
  HR: 'hr'
};

// Permission definitions for SEO module
const SEO_PERMISSIONS = {
  // Entry permissions
  CREATE_ENTRY: 'create_entry',
  EDIT_OWN_DRAFT: 'edit_own_draft',
  SUBMIT_ENTRY: 'submit_entry',
  VIEW_OWN_ENTRIES: 'view_own_entries',
  
  // Review permissions
  ADD_MENTOR_SCORE: 'add_mentor_score',
  APPROVE_ENTRY: 'approve_entry',
  RETURN_ENTRY: 'return_entry',
  VIEW_TEAM_ENTRIES: 'view_team_entries',
  
  // Admin permissions
  OVERRIDE_ENTRY: 'override_entry',
  BACKFILL_PAST_MONTHS: 'backfill_past_months',
  CHANGE_WEIGHTS_TARGETS: 'change_weights_targets',
  VIEW_ALL_ENTRIES: 'view_all_entries',
  
  // Dashboard permissions
  VIEW_EMPLOYEE_DASHBOARD: 'view_employee_dashboard',
  VIEW_TEAM_DASHBOARD: 'view_team_dashboard',
  VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard',
  
  // Appraisal permissions
  CREATE_APPRAISAL: 'create_appraisal',
  VIEW_APPRAISALS: 'view_appraisals',
  EDIT_APPRAISAL: 'edit_appraisal',
  
  // Export permissions
  EXPORT_TEAM_DATA: 'export_team_data',
  EXPORT_ALL_DATA: 'export_all_data'
};

// Role-permission mapping
const ROLE_PERMISSIONS = {
  [SEO_ROLES.EMPLOYEE]: [
    SEO_PERMISSIONS.CREATE_ENTRY,
    SEO_PERMISSIONS.EDIT_OWN_DRAFT,
    SEO_PERMISSIONS.SUBMIT_ENTRY,
    SEO_PERMISSIONS.VIEW_OWN_ENTRIES,
    SEO_PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD
  ],
  
  [SEO_ROLES.MENTOR]: [
    SEO_PERMISSIONS.CREATE_ENTRY,
    SEO_PERMISSIONS.EDIT_OWN_DRAFT,
    SEO_PERMISSIONS.SUBMIT_ENTRY,
    SEO_PERMISSIONS.VIEW_OWN_ENTRIES,
    SEO_PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD,
    SEO_PERMISSIONS.ADD_MENTOR_SCORE,
    SEO_PERMISSIONS.VIEW_TEAM_ENTRIES
  ],
  
  [SEO_ROLES.TEAM_LEAD]: [
    SEO_PERMISSIONS.CREATE_ENTRY,
    SEO_PERMISSIONS.EDIT_OWN_DRAFT,
    SEO_PERMISSIONS.SUBMIT_ENTRY,
    SEO_PERMISSIONS.VIEW_OWN_ENTRIES,
    SEO_PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD,
    SEO_PERMISSIONS.ADD_MENTOR_SCORE,
    SEO_PERMISSIONS.APPROVE_ENTRY,
    SEO_PERMISSIONS.RETURN_ENTRY,
    SEO_PERMISSIONS.VIEW_TEAM_ENTRIES,
    SEO_PERMISSIONS.VIEW_TEAM_DASHBOARD,
    SEO_PERMISSIONS.VIEW_APPRAISALS,
    SEO_PERMISSIONS.EXPORT_TEAM_DATA
  ],
  
  [SEO_ROLES.ADMIN]: [
    // Admin has all permissions
    ...Object.values(SEO_PERMISSIONS)
  ]
};

// Hook to check SEO permissions
export const useSEOPermissions = () => {
  const { user, role } = useUnifiedAuth();
  const userRole = role;
  const userDepartment = user?.department;
  
  // Check if user is in SEO department
  const isSEOUser = userDepartment === 'SEO' || userRole === 'admin';
  
  // Get user permissions
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  
  const hasPermission = (permission) => {
    if (!isSEOUser) return false;
    return userPermissions.includes(permission);
  };
  
  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => hasPermission(permission));
  };
  
  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => hasPermission(permission));
  };
  
  // Check if user can edit entry based on status and ownership
  const canEditEntry = (entry) => {
    if (!hasPermission(SEO_PERMISSIONS.EDIT_OWN_DRAFT)) return false;
    
    // Admin can edit any entry
    if (userRole === SEO_ROLES.ADMIN) return true;
    
    // Users can only edit their own draft entries
    return entry.employee_id === user?.id && entry.status === 'draft';
  };
  
  // Check if user can approve/return entry
  const canReviewEntry = (entry) => {
    if (!hasAnyPermission([SEO_PERMISSIONS.APPROVE_ENTRY, SEO_PERMISSIONS.RETURN_ENTRY])) {
      return false;
    }
    
    // Admin can review any entry
    if (userRole === SEO_ROLES.ADMIN) return true;
    
    // TL/Mentor can review submitted entries (not their own)
    return entry.status === 'submitted' && entry.employee_id !== user?.id;
  };
  
  // Check if user can add mentor score
  const canAddMentorScore = (entry) => {
    if (!hasPermission(SEO_PERMISSIONS.ADD_MENTOR_SCORE)) return false;
    
    // Admin can add mentor score to any entry
    if (userRole === SEO_ROLES.ADMIN) return true;
    
    // TL/Mentor can add score to submitted/approved entries (not their own)
    return ['submitted', 'approved'].includes(entry.status) && 
           entry.employee_id !== user?.id &&
           !entry.mentor_score; // Only if not already scored
  };
  
  return {
    userRole,
    isSEOUser,
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canEditEntry,
    canReviewEntry,
    canAddMentorScore,
    SEO_PERMISSIONS,
    SEO_ROLES
  };
};

// Component to wrap content with permission checks
export const SEOPermissionGuard = ({ 
  permission, 
  permissions, 
  requireAll = false, 
  fallback = null,
  children 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useSEOPermissions();
  
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  }
  
  if (!hasAccess) {
    return fallback;
  }
  
  return children;
};

// Component to show access denied message
export const SEOAccessDenied = ({ message = "You don't have permission to access this feature." }) => {
  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
};

// Component to check SEO department access
export const SEODepartmentGuard = ({ children, fallback = <SEOAccessDenied message="This feature is only available for SEO department members." /> }) => {
  const { authState } = useMonthlyOSAuth();
  const user = authState.user;
  
  // Only allow access to SEO department members
  if (!user || user.department !== DEPARTMENTS.SEO) {
    return fallback;
  }
  
  return children;
};

// Manager-only guard for appraisal access
export const SEOManagerGuard = ({ children, fallback = <SEOAccessDenied message="Appraisal data is only accessible to managers." /> }) => {
  const { authState } = useMonthlyOSAuth();
  const user = authState.user;
  
  // Only allow access to managers or admins
  if (!user || (user.department !== DEPARTMENTS.MANAGER && user.userRole !== 'admin')) {
    return fallback;
  }
  
  return children;
};

// Combined guard for SEO module with manager appraisal access
export const SEOModuleGuard = ({ children, requireManagerAccess = false }) => {
  const { authState } = useMonthlyOSAuth();
  const user = authState.user;
  
  if (!user) {
    return <SEOAccessDenied message="Please log in to access this feature." />;
  }
  
  // For appraisal features, require manager access
  if (requireManagerAccess) {
    if (user.department !== DEPARTMENTS.MANAGER && user.userRole !== 'admin') {
      return <SEOAccessDenied message="Appraisal data is only accessible to managers." />;
    }
    return children;
  }
  
  // For regular SEO features, require SEO department
  if (user.department !== DEPARTMENTS.SEO) {
    return <SEOAccessDenied message="This feature is only available for SEO department members." />;
  }
  
  return children;
};

// Higher-order component for route protection
export const withSEOPermission = (Component, permission, permissions, requireAll = false) => {
  return function ProtectedComponent(props) {
    return (
      <SEODepartmentGuard>
        <SEOPermissionGuard 
          permission={permission}
          permissions={permissions}
          requireAll={requireAll}
          fallback={<SEOAccessDenied />}
        >
          <Component {...props} />
        </SEOPermissionGuard>
      </SEODepartmentGuard>
    );
  };
};

// Utility function to get role display name
export const getSEORoleDisplayName = (role) => {
  const roleNames = {
    [SEO_ROLES.ADMIN]: 'Administrator',
    [SEO_ROLES.TEAM_LEAD]: 'Team Lead',
    [SEO_ROLES.EMPLOYEE]: 'SEO Executive',
    [SEO_ROLES.MENTOR]: 'Mentor'
  };
  
  return roleNames[role] || 'Unknown Role';
};

// Utility function to get permission display name
export const getSEOPermissionDisplayName = (permission) => {
  const permissionNames = {
    [SEO_PERMISSIONS.CREATE_ENTRY]: 'Create Entry',
    [SEO_PERMISSIONS.EDIT_OWN_DRAFT]: 'Edit Own Draft',
    [SEO_PERMISSIONS.SUBMIT_ENTRY]: 'Submit Entry',
    [SEO_PERMISSIONS.VIEW_OWN_ENTRIES]: 'View Own Entries',
    [SEO_PERMISSIONS.ADD_MENTOR_SCORE]: 'Add Mentor Score',
    [SEO_PERMISSIONS.APPROVE_ENTRY]: 'Approve Entry',
    [SEO_PERMISSIONS.RETURN_ENTRY]: 'Return Entry',
    [SEO_PERMISSIONS.VIEW_TEAM_ENTRIES]: 'View Team Entries',
    [SEO_PERMISSIONS.OVERRIDE_ENTRY]: 'Override Entry',
    [SEO_PERMISSIONS.BACKFILL_PAST_MONTHS]: 'Backfill Past Months',
    [SEO_PERMISSIONS.CHANGE_WEIGHTS_TARGETS]: 'Change Weights & Targets',
    [SEO_PERMISSIONS.VIEW_ALL_ENTRIES]: 'View All Entries',
    [SEO_PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD]: 'View Employee Dashboard',
    [SEO_PERMISSIONS.VIEW_TEAM_DASHBOARD]: 'View Team Dashboard',
    [SEO_PERMISSIONS.VIEW_ADMIN_DASHBOARD]: 'View Admin Dashboard',
    [SEO_PERMISSIONS.CREATE_APPRAISAL]: 'Create Appraisal',
    [SEO_PERMISSIONS.VIEW_APPRAISALS]: 'View Appraisals',
    [SEO_PERMISSIONS.EDIT_APPRAISAL]: 'Edit Appraisal',
    [SEO_PERMISSIONS.EXPORT_TEAM_DATA]: 'Export Team Data',
    [SEO_PERMISSIONS.EXPORT_ALL_DATA]: 'Export All Data'
  };
  
  return permissionNames[permission] || permission;
};

export default {
  useSEOPermissions,
  SEOPermissionGuard,
  SEOAccessDenied,
  SEODepartmentGuard,
  SEOManagerGuard,
  SEOModuleGuard,
  withSEOPermission,
  getSEORoleDisplayName,
  getSEOPermissionDisplayName,
  SEO_ROLES,
  SEO_PERMISSIONS,
  DEPARTMENTS
};