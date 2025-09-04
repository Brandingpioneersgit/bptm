import React, { useState, useEffect } from 'react';
import { X, User, Phone, UserCheck } from 'lucide-react';
import { useUnifiedAuth } from './UnifiedAuthContext';

const UnifiedLoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const {
    loginForm,
    updateLoginForm,
    login,
    loginError,
    clearLoginError,
    isLoading,
    getAvailableRoles
  } = useUnifiedAuth();

  // Removed showPassword state as we're using phone authentication
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear form and errors when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      updateLoginForm({ name: '', phone: '', selectedRole: '' });
      clearLoginError();
    }
  }, [isOpen, updateLoginForm, clearLoginError]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        console.log('Escape key pressed, closing modal');
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape, true); // Use capture phase
      // Also add a global click handler to allow closing via clicking outside
      const handleGlobalClick = (e) => {
        if (e.target === document.querySelector('.login-modal-backdrop')) {
          console.log('Backdrop clicked via global handler');
          onClose();
        }
      };
      document.addEventListener('click', handleGlobalClick);
      
      return () => {
        document.removeEventListener('keydown', handleEscape, true);
        document.removeEventListener('click', handleGlobalClick);
      };
    }
  }, [isOpen, isSubmitting, onClose]);

  // Auto-fill credentials for testing (matches database records)
  // All test users have password 'test123' in the database
  const getTestCredentials = (role) => {
    const testCredentials = {
      // Employee Category (from database migration)
      'SEO': { name: 'John SEO', phone: '+91-9876543210' },
      'Ads': { name: 'Sarah Ads', phone: '+91-9876543211' },
      'Social Media': { name: 'Mike Social', phone: '+91-9876543212' },
      'YouTube SEO': { name: 'Lisa YouTube', phone: '+91-9876543213' },
      'Web Developer': { name: 'David Dev', phone: '+91-9876543214' },
      'Graphic Designer': { name: 'Emma Design', phone: '+91-9876543215' },
      
      // Freelancer Category
      'Freelancer': { name: 'Alex Freelancer', phone: '+91-9876543216' },
      
      // Intern Category
      'Intern': { name: 'Priya Intern', phone: '+91-9876543218' },
      
      // Management Category
      'Operations Head': { name: 'Jennifer Operations', phone: '+91-9876543221' },
      
      // Admin Category
      'Accountant': { name: 'Michael Accountant', phone: '+91-9876543222' },
      'Sales': { name: 'Amanda Sales', phone: '+91-9876543223' },
      'HR': { name: 'Rachel HR', phone: '+91-9876543224' },
      
      // Super Admin Category
      'Super Admin': { name: 'Admin Super', phone: '+91-9876543225' }
    };
    return testCredentials[role] || { name: '', phone: '' };
  };

  // Auto-fill when role is selected (for testing)
  useEffect(() => {
    if (loginForm.selectedRole) {
      const credentials = getTestCredentials(loginForm.selectedRole);
      updateLoginForm({
        ...loginForm,
        name: credentials.name,
        phone: credentials.phone
      });
    }
  }, [loginForm.selectedRole, updateLoginForm]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await login({
        name: loginForm.name,
        phone: loginForm.phone,
        selectedRole: loginForm.selectedRole
      });
      
      if (result.success) {
        onClose();
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }
      }
    } catch (error) {
      console.error('Login submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    updateLoginForm({ [field]: value });
    if (loginError) {
      clearLoginError();
    }
  };

  // Get role-based styling
  const getRoleTheme = (role) => {
    const themes = {
      'SEO': 'from-blue-500 to-blue-600',
      'Ads': 'from-green-500 to-green-600',
      'Social Media': 'from-pink-500 to-pink-600',
      'YouTube SEO': 'from-red-500 to-red-600',
      'Web Developer': 'from-purple-500 to-purple-600',
      'Graphic Designer': 'from-orange-500 to-orange-600',
      'Freelancer': 'from-teal-500 to-teal-600',
      'Intern': 'from-indigo-500 to-indigo-600',

      'Operations Head': 'from-gray-500 to-gray-600',
      'Accountant': 'from-emerald-500 to-emerald-600',
      'Sales': 'from-cyan-500 to-cyan-600',
      'HR': 'from-rose-500 to-rose-600',
      'Super Admin': 'from-black to-gray-800'
    };
    return themes[role] || 'from-blue-500 to-blue-600';
  };

  console.log('🔍 Modal render check: isOpen =', isOpen);
  if (!isOpen) return null;

  console.log('🔍 Modal is rendering!');
  const availableRoles = getAvailableRoles();
  console.log('🔍 Available roles in login modal:', availableRoles);
  
  // Temporary debug - show roles count in UI
  const rolesDebugInfo = `Found ${availableRoles.length} roles: ${availableRoles.slice(0, 3).join(', ')}${availableRoles.length > 3 ? '...' : ''}`;
  
  const selectedRoleTheme = loginForm.selectedRole ? getRoleTheme(loginForm.selectedRole) : 'from-blue-500 to-blue-600';

  return (
    <div 
      className="login-modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => {
        // Close modal when clicking on backdrop
        if (e.target === e.currentTarget) {
          console.log('Backdrop clicked, calling onClose');
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${selectedRoleTheme} p-6 rounded-t-2xl relative`}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('X button clicked, calling onClose');
              onClose();
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors z-10"
            disabled={isSubmitting}
            type="button"
          >
            <X size={24} />
          </button>
          
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
            <p className="text-white text-opacity-90">
              {loginForm.selectedRole ? `Login as ${loginForm.selectedRole}` : 'Select your role to continue'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Role Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Your Role *
            </label>
            <div className="relative">
              <select
                value={loginForm.selectedRole}
                onChange={(e) => handleInputChange('selectedRole', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                required
                disabled={isSubmitting}
              >
                <option value="">Choose your role...</option>
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <UserCheck className="absolute right-3 top-3 text-gray-400" size={20} />
            </div>
            {/* Temporary debug info */}
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              🔍 Debug: {rolesDebugInfo}
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Full Name *
            </label>
            <div className="relative">
              <input
                type="text"
                value={loginForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
                required
                disabled={isSubmitting}
              />
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
            </div>
          </div>

          {/* Phone Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Phone Number *
            </label>
            <div className="relative">
              <input
                type="tel"
                value={loginForm.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your phone number"
                required
                disabled={isSubmitting}
              />
              <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
            </div>
          </div>

          {/* Error Message */}
          {loginError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{loginError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !loginForm.name || !loginForm.phone || !loginForm.selectedRole}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 ${
              isSubmitting || !loginForm.name || !loginForm.phone || !loginForm.selectedRole
                ? 'bg-gray-400 cursor-not-allowed'
                : `bg-gradient-to-r ${selectedRoleTheme} hover:shadow-lg transform hover:scale-105`
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Signing In...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Auto-fill Notice (Testing Only) */}
          {loginForm.selectedRole && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600 text-sm">🧪</span>
                <p className="text-yellow-700 text-sm font-medium">
                  Testing Mode: Credentials auto-filled for {loginForm.selectedRole}
                </p>
              </div>
              <p className="text-yellow-600 text-xs mt-1">
                This feature will be removed in production
              </p>
              <button 
                type="button"
                onClick={() => {
                  const credentials = getTestCredentials(loginForm.selectedRole);
                  if (process.env.NODE_ENV === 'development') {
          console.log('🧪 Test login attempt:', { role: loginForm.selectedRole, ...credentials });
        }
                  handleSubmit({ preventDefault: () => {} });
                }}
                className="mt-2 px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
              >
                🚀 Quick Test Login
              </button>
            </div>
          )}

          {/* Help Text */}
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              Need help? Contact your system administrator
            </p>
            <button
              type="button"
              onClick={() => {
                console.log('Skip login button clicked');
                onClose();
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Skip login and browse as guest
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Secure login powered by BP Agency Dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLoginModal;