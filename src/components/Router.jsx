import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useUnifiedAuth } from "../features/auth/UnifiedAuthContext";
import { LoadingSpinner } from "@/shared/components/LoadingStates";
import AgencyDashboard from "@/components/AgencyDashboard";
import Homepage from "@/components/Homepage";
import { LoginPage } from "../features/auth/LoginPage";
import PasswordSetup from "../features/auth/PasswordSetup";
import ProtectedRoute from "../features/auth/ProtectedRoute";
import EmployeeDashboard from "@/components/EmployeeDashboard";
import { ClientDashboardView } from "@/features/clients/components/ClientDashboardView";
import ManagerDashboard from "@/components/ManagerDashboard";
import SuperAdminDashboard from "@/components/SuperAdminDashboard";
import EmployeeOnboardingForm from "@/components/EmployeeOnboardingForm";
import EmployeeForm from "@/components/EmployeeForm";
import LeaveApplicationForm from "@/components/LeaveApplicationForm";
import { ClientAdditionForm } from "@/features/clients/components/ClientAdditionForm";
import FormTrackingDashboard from "@/components/FormTrackingDashboard";
import MonthlyReportDashboard from "@/components/MonthlyReportDashboard";

// Note: Using PlaceholderPage for components that don't exist yet

// Placeholder component for missing pages
const PlaceholderPage = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600">This page is under development.</p>
    </div>
  </div>
);

// Component to handle login page with redirect for authenticated users
function LoginPageWithRedirect() {
  const navigate = useNavigate();
  const { authState } = useUnifiedAuth();
  const { user, isLoading: loading } = authState;

  useEffect(() => {
    if (!loading && user) {
      // User is already authenticated, redirect to homepage
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show login page for unauthenticated users
  return <LoginPage />;
}

// Helper function to get dashboard path based on role
function getDashboardPath(role) {
  switch (role) {
    case 'Super Admin':
      return '/super-admin';
    case 'Operations Head':
    case 'Manager':
    case 'HR':
    case 'Accountant':
    case 'Sales':
      return '/admin';
    case 'SEO':
    case 'Ads':
    case 'Social Media':
    case 'YouTube SEO':
    case 'Web Developer':
    case 'Graphic Designer':
    case 'Freelancer':
    case 'Intern':
      return '/employee';
    case 'Client':
      return '/client';
    default:
      return '/dashboard'; // Default to main dashboard for authenticated users
  }
}

export default function AppRouter() {
  const { authState } = useUnifiedAuth();
  const { isLoading: loading } = authState;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<LoginPageWithRedirect />} />
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['SEO', 'Ads', 'Social Media', 'YouTube SEO', 'Web Developer', 'Graphic Designer', 'Freelancer', 'Intern', 'Operations Head', 'Manager', 'HR', 'Accountant', 'Sales', 'Super Admin']}>
            <AgencyDashboard />
          </ProtectedRoute>
        } />
        
        {/* Default redirect for authenticated users */}
        <Route path="/auth-redirect" element={
          <ProtectedRoute>
            {({ user }) => {
              const navigate = useNavigate();
              useEffect(() => {
                const dashboardPath = getDashboardPath(user.role);
                navigate(dashboardPath, { replace: true });
              }, [navigate, user]);
              return <LoadingSpinner size="lg" />;
            }}
          </ProtectedRoute>
        } />
        <Route path="/password-setup" element={<PasswordSetup />} />
        <Route path="/employee-onboarding" element={<EmployeeOnboardingForm />} />
        <Route path="/client-onboarding" element={<EmployeeOnboardingForm />} />
        <Route path="/policies" element={<PlaceholderPage title="Company Policies" />} />
        
        {/* Form Routes */}
        <Route path="/form" element={<EmployeeForm />} />
        <Route path="/monthly-form" element={<EmployeeForm />} />
        <Route path="/leave-form" element={<LeaveApplicationForm />} />
        <Route path="/add-client" element={<ClientAdditionForm />} />
        
        {/* Tools and Reports */}
        <Route path="/master-tools" element={<PlaceholderPage title="Master Tools" />} />
        <Route path="/monthly-reports" element={<MonthlyReportDashboard />} />
        
        {/* Directory Routes */}
        <Route path="/employee-directory" element={<PlaceholderPage title="Employee Directory" />} />
        <Route path="/client-directory" element={<PlaceholderPage title="Client Directory" />} />
        <Route path="/organization-chart" element={<PlaceholderPage title="Organization Chart" />} />
        
        {/* Performance Routes */}
        <Route path="/performance-scoring" element={<PlaceholderPage title="Performance Scoring" />} />
        <Route path="/performance-concerns" element={<PlaceholderPage title="Performance Concerns" />} />
        
        {/* Arcade Routes */}
        <Route path="/arcade" element={<PlaceholderPage title="Arcade" />} />
        <Route path="/arcade-earn" element={<PlaceholderPage title="Arcade - Earn Points" />} />
        <Route path="/arcade-redeem" element={<PlaceholderPage title="Arcade - Redeem Points" />} />
        <Route path="/arcade-history" element={<PlaceholderPage title="Arcade - History" />} />
        <Route path="/arcade-admin" element={<PlaceholderPage title="Arcade - Admin" />} />
        
        {/* Profile Routes */}
        <Route path="/profile" element={<PlaceholderPage title="Profile" />} />
        <Route path="/profile-settings" element={<PlaceholderPage title="Profile Settings" />} />
        
        {/* Incentive Routes */}
        <Route path="/employee-incentives" element={<PlaceholderPage title="Employee Incentives" />} />
        <Route path="/hr-incentive-approval" element={<PlaceholderPage title="HR Incentive Approval" />} />
        <Route path="/manager-incentive-reporting" element={<PlaceholderPage title="Manager Incentive Reporting" />} />
        
        {/* Forms Routes */}
        <Route path="/interactive-forms" element={<PlaceholderPage title="Interactive Forms" />} />
        <Route path="/form-tracking" element={<FormTrackingDashboard />} />
        
        {/* Protected Routes with Role-based Access Control */}
        <Route path="/employee" element={
          <ProtectedRoute allowedRoles={['SEO', 'Ads', 'Social Media', 'YouTube SEO', 'Web Developer', 'Graphic Designer', 'Freelancer', 'Intern']}>
            <EmployeeDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/client" element={
          <ProtectedRoute allowedRoles={['Client']}>
            <ClientDashboardView />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['Operations Head', 'Manager', 'HR', 'Accountant', 'Sales']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/super-admin" element={
          <ProtectedRoute allowedRoles={['Super Admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* Role-specific dashboard routes */}
        <Route path="/seo-dashboard" element={
          <ProtectedRoute requiredRole="SEO">
            <EmployeeDashboard dashboardType="seo" />
          </ProtectedRoute>
        } />
        
        <Route path="/ads-dashboard" element={
          <ProtectedRoute requiredRole="Ads">
            <EmployeeDashboard dashboardType="ads" />
          </ProtectedRoute>
        } />
        
        <Route path="/social-media-dashboard" element={
          <ProtectedRoute requiredRole="Social Media">
            <EmployeeDashboard dashboardType="social" />
          </ProtectedRoute>
        } />
        
        <Route path="/youtube-seo-dashboard" element={
          <ProtectedRoute requiredRole="YouTube SEO">
            <EmployeeDashboard dashboardType="youtube" />
          </ProtectedRoute>
        } />
        
        <Route path="/web-developer-dashboard" element={
          <ProtectedRoute requiredRole="Web Developer">
            <EmployeeDashboard dashboardType="dev" />
          </ProtectedRoute>
        } />
        
        <Route path="/graphic-designer-dashboard" element={
          <ProtectedRoute requiredRole="Graphic Designer">
            <EmployeeDashboard dashboardType="design" />
          </ProtectedRoute>
        } />
        
        <Route path="/operations-dashboard" element={
          <ProtectedRoute requiredRole="Operations Head">
            <ManagerDashboard dashboardType="operations" />
          </ProtectedRoute>
        } />
        
        <Route path="/hr-dashboard" element={
          <ProtectedRoute requiredRole="HR">
            <ManagerDashboard dashboardType="hr" />
          </ProtectedRoute>
        } />
        
        <Route path="/accountant-dashboard" element={
          <ProtectedRoute requiredRole="Accountant">
            <ManagerDashboard dashboardType="accounting" />
          </ProtectedRoute>
        } />
        
        <Route path="/sales-dashboard" element={
          <ProtectedRoute requiredRole="Sales">
            <ManagerDashboard dashboardType="sales" />
          </ProtectedRoute>
        } />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}