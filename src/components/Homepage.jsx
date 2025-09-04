import React from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import AgencyDashboard from './AgencyDashboard';
import { Navigate } from 'react-router-dom';

/**
 * Homepage Component
 * Integrates the agency dashboard as the main homepage for authenticated users
 * Redirects unauthenticated users to login
 */
const Homepage = () => {
  const { authState } = useUnifiedAuth();
  const { user, isLoading } = authState;

  // Show loading spinner while authentication state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render the agency dashboard for authenticated users
  return (
    <div className="min-h-screen bg-gray-50">
      <AgencyDashboard 
        userType={user.role} 
        currentUser={user} 
        onNavigateToProfile={() => {
          // Handle profile navigation if needed
          console.log('Navigate to profile');
        }}
      />
    </div>
  );
};

export default Homepage;