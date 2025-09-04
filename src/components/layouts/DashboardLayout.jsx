import React from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, User, Home, Settings } from 'lucide-react';
import { HeaderBrand } from '@/shared/components/HeaderBrand';
import { toast } from 'react-hot-toast';

/**
 * Dashboard Layout Component
 * Provides consistent navigation and logout functionality for all role-specific dashboards
 */
const DashboardLayout = ({ children, title }) => {
  const { user, role, logout } = useUnifiedAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleNavigateHome = () => {
    navigate('/');
  };

  const handleNavigateProfile = () => {
    navigate('/profile');
  };

  const handleNavigateSettings = () => {
    navigate('/profile-settings');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Brand and Title */}
            <div className="flex items-center space-x-4">
              <HeaderBrand />
              {title && (
                <>
                  <div className="h-6 w-px bg-gray-300" />
                  <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                </>
              )}
            </div>

            {/* Right side - User info and actions */}
            <div className="flex items-center space-x-4">
              {/* User info */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span className="font-medium">{user?.name || 'User'}</span>
                <span className="text-gray-400">•</span>
                <span className="text-blue-600">{role}</span>
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNavigateHome}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Home className="h-4 w-4 mr-1" />
                  Home
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNavigateProfile}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <User className="h-4 w-4 mr-1" />
                  Profile
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNavigateSettings}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;