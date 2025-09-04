import React from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useToast } from '@/shared/components/Toast';

// Permission levels for different roles
const ROLE_PERMISSIONS = {
  'Super Admin': ['all'],
  'Operations Head': ['marketing', 'operations', 'employees', 'reports'],
  'HR': ['hr_employees', 'hr_reports', 'hr_onboarding', 'hr_performance', 'reports'],
  'Sales': ['sales', 'clients', 'reports'],
  'Accountant': ['finance', 'reports'],
  'SEO': ['seo', 'reports'],
  'Ads': ['ads', 'reports'],
  'Social Media': ['social', 'reports'],
  'YouTube SEO': ['youtube', 'seo', 'reports'],
  'Web Developer': ['development', 'reports'],
  'Graphic Designer': ['design', 'reports'],
  'Freelancer': ['freelance', 'reports'],
  'Intern': ['intern', 'reports']
};

// Dashboard access permissions
const DASHBOARD_PERMISSIONS = {
  'Super Admin': ['all'],
  'Operations Head': ['agency', 'manager', 'employee', 'operationsHeadDashboard', 'profile'],
  'HR': ['hr', 'employee', 'hrDashboard', 'profile'],
  'Sales': ['sales', 'employee', 'profile'],
  'Accountant': ['finance', 'employee', 'profile'],
  'SEO': ['seo', 'employee', 'profile'],
  'Ads': ['ads', 'employee', 'profile'],
  'Social Media': ['social', 'employee', 'profile'],
  'YouTube SEO': ['youtube', 'employee', 'profile'],
  'Web Developer': ['development', 'employee', 'profile'],
  'Graphic Designer': ['design', 'employee', 'profile'],
  'Freelancer': ['freelance', 'employee', 'freelancerDashboard', 'profile'],
  'Intern': ['intern', 'employee', 'profile']
};

// Base Permission Guard Component
export const PermissionGuard = ({ 
  children, 
  requiredPermissions = [], 
  requiredRole = null,
  fallback = null,
  showError = true 
}) => {
  const { authState } = useUnifiedAuth();
  const { user } = authState;
  const { notify } = useToast();

  // Check if user is authenticated
  if (!user || !user.role) {
    if (showError) {
      return (
        <div className="card-brand p-6 text-center">
          <p className="text-brand-text-secondary">Please log in to access this content.</p>
        </div>
      );
    }
    return fallback;
  }

  // Check specific role requirement
  if (requiredRole && user.role !== requiredRole) {
    if (showError) {
      return (
        <div className="card-brand p-6 text-center">
          <p className="text-brand-text-secondary">
            Access denied. Required role: {requiredRole}
          </p>
        </div>
      );
    }
    return fallback;
  }

  // Check permissions
  if (requiredPermissions.length > 0) {
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission) || userPermissions.includes('all')
    );

    if (!hasPermission) {
      if (showError) {
        return (
          <div className="card-brand p-6 text-center">
            <p className="text-brand-text-secondary">
              Access denied. Insufficient permissions.
            </p>
          </div>
        );
      }
      return fallback;
    }
  }

  return children;
};

// Dashboard Guard Component
export const DashboardGuard = ({ 
  children, 
  requiredDashboard,
  fallback = null 
}) => {
  const { authState } = useUnifiedAuth();
  const { user } = authState;

  if (!user || !user.role) {
    return (
      <div className="card-brand p-6 text-center">
        <p className="text-brand-text-secondary">Please log in to access the dashboard.</p>
      </div>
    );
  }

  // Special handling for admin dashboard - only Super Admin can access
  if (requiredDashboard === 'admin' && user.role !== 'Super Admin') {
    return (
      <div className="card-brand p-6 text-center">
        <p className="text-brand-text-secondary">
          Access denied. Only Super Admin can access this dashboard.
        </p>
        <p className="text-sm text-brand-text-secondary mt-2">
          Your role: {user.role}
        </p>
      </div>
    );
  }

  const userDashboards = DASHBOARD_PERMISSIONS[user.role] || [];
  const hasAccess = userDashboards.includes(requiredDashboard) || userDashboards.includes('all');

  if (!hasAccess) {
    return (
      <div className="card-brand p-6 text-center">
        <p className="text-brand-text-secondary">
          Access denied. You don't have permission to access this dashboard.
        </p>
        <p className="text-sm text-brand-text-secondary mt-2">
          Your role: {user.role}
        </p>
      </div>
    );
  }

  return children;
};

// Role-based Component Guard
export const RoleGuard = ({ 
  children, 
  allowedRoles = [], 
  fallback = null,
  showError = true 
}) => {
  const { authState } = useUnifiedAuth();
  const { user } = authState;

  if (!user || !user.role) {
    if (showError) {
      return (
        <div className="card-brand p-6 text-center">
          <p className="text-brand-text-secondary">Please log in to access this content.</p>
        </div>
      );
    }
    return fallback;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (showError) {
      return (
        <div className="card-brand p-6 text-center">
          <p className="text-brand-text-secondary">
            Access denied. This content is restricted to: {allowedRoles.join(', ')}
          </p>
        </div>
      );
    }
    return fallback;
  }

  return children;
};

// Admin Guard Component
export const AdminGuard = ({ children, fallback = null }) => {
  return (
    <RoleGuard 
      allowedRoles={['Super Admin', 'Operations Head']} 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
};

// Manager Guard Component
export const ManagerGuard = ({ children, fallback = null }) => {
  return (
    <RoleGuard 
      allowedRoles={['Super Admin', 'Operations Head']} 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
};

// HR Guard Component - for HR-specific functions only
export const HRGuard = ({ children, fallback = null }) => {
  return (
    <RoleGuard 
      allowedRoles={['Super Admin', 'Operations Head', 'HR']} 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
};

// Employee Management Guard - for employee CRUD operations
export const EmployeeManagementGuard = ({ children, fallback = null }) => {
  return (
    <RoleGuard 
      allowedRoles={['Super Admin', 'Operations Head']} 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
};

export default PermissionGuard;