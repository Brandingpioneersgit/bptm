import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useUnifiedAuth } from "@/features/auth/UnifiedAuthContext";
import { EnhancedLoadingSpinner } from "@/shared/components/LoadingStates";
import { FadeTransition } from "@/shared/components/Transitions";

// Dashboard Components
import AgencyDashboard from "@/components/AgencyDashboard";
import LoginPage from "@/features/auth/LoginPage";
import EmployeeDashboard from "@/components/EmployeeDashboard";
import { ClientDashboardView } from "@/features/clients/components/ClientDashboardView";
import ManagerDashboard from "@/components/ManagerDashboard";
import SuperAdminDashboard from "@/components/SuperAdminDashboard";

export default function AppRouter() {
  const { user, loading, userRole } = useUnifiedAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <EnhancedLoadingSpinner size="lg" />
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <FadeTransition>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          {user ? (
            <>
              {/* Role-based routing */}
              {userRole === 'agency_owner' && (
                <Route path="/" element={<AgencyDashboard />} />
              )}
              {userRole === 'employee' && (
                <Route path="/" element={<EmployeeDashboard />} />
              )}
              {userRole === 'client' && (
                <Route path="/" element={<ClientDashboardView />} />
              )}
              {userRole === 'admin' && (
                <Route path="/" element={<ManagerDashboard />} />
              )}
              {userRole === 'super_admin' && (
                <Route path="/" element={<SuperAdminDashboard />} />
              )}
              
              {/* Fallback for authenticated users */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            /* Redirect unauthenticated users to login */
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </FadeTransition>
    </BrowserRouter>
  );
}