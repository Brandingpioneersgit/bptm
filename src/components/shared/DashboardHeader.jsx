import React, { useState } from 'react';
import { Bell, User, Settings, LogOut } from 'lucide-react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useAppNavigation } from '@/utils/navigation';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import ProfileSettingsManager from '@/components/settings/ProfileSettingsManager';

/**
 * Unified Dashboard Header Component
 * Provides consistent header with profile and notification functionality across all dashboards
 */
const DashboardHeader = ({ 
  title, 
  subtitle, 
  icon, 
  showNotifications = true, 
  showProfile = true,
  customActions = [],
  className = ""
}) => {
  const { authState, logout } = useUnifiedAuth();
  const { user } = authState;
  const navigation = useAppNavigation();
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigation.navigateToLogin();
  };

  const handleProfileClick = () => {
    setShowProfileSettings(true);
    setShowUserMenu(false);
  };

  const handleNotificationClick = () => {
    setShowNotificationCenter(true);
  };

  return (
    <>
      <div className={`bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left Section - Title and Icon */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                {icon && (
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{icon}</span>
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                  )}
                </div>
              </div>
              {user && (
                <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full shadow-md">
                  <span className="text-sm">👋</span>
                  <span className="text-sm font-medium">
                    Welcome, {user.name || user.email}
                  </span>
                </div>
              )}
            </div>

            {/* Right Section - Date, Actions, Profile, Notifications */}
            <div className="flex items-center space-x-4">
              {/* Date Display */}
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {/* Custom Actions */}
              {customActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    action.variant === 'primary' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                  title={action.tooltip}
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
                >
                  {action.icon && <span className="text-sm">{action.icon}</span>}
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}

              {/* Notification Bell */}
              {showNotifications && user && (
                <button
                  onClick={handleNotificationClick}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-6 h-6" />
                  {/* Notification Badge - You can add logic here to show unread count */}
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>
              )}

              {/* User Profile Menu */}
              {showProfile && user && (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">{user.role}</span>
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                      <button
                        onClick={handleProfileClick}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Profile Settings</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Login Button for Non-authenticated Users */}
              {!user && (
                <button
                  onClick={() => navigation.navigateToLogin()}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Center Modal */}
      {showNotificationCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <NotificationCenter onClose={() => setShowNotificationCenter(false)} />
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <ProfileSettingsManager onClose={() => setShowProfileSettings(false)} />
          </div>
        </div>
      )}

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
};

export default DashboardHeader;