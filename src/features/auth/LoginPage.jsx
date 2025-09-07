import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from './UnifiedAuthContext';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { FadeTransition } from '@/shared/components/Transitions';

export function LoginPage({ onLoginSuccess, onCancel }) {
  const { login, authState } = useUnifiedAuth();
  const { isLoading, loginError: error } = authState;
  const [formData, setFormData] = useState({
    firstName: '',
    phone: '',
    rememberMe: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Department options for simplified login
  const departmentOptions = [
    'SEO', 'Ads', 'Social Media', 'YouTube SEO', 'Web Development', 'Graphic Design',
    'Freelance', 'Intern', 'Operations', 'Accounting', 'Sales', 'HR', 'Administration'
  ];

  // Clear error when component mounts or form data changes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        // Error will be cleared automatically by the auth context
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    // Error will be cleared automatically by the auth context
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.phone) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🔐 Submitting login form:', { 
        firstName: formData.firstName,
        phone: formData.phone 
      });
      
      // Save credentials to localStorage for auto-fill
      localStorage.setItem('bptm_remember_firstName', formData.firstName);
      localStorage.setItem('bptm_remember_phone', formData.phone);
      
      const result = await login({
        firstName: formData.firstName,
        phone: formData.phone
      });

      console.log('🔐 Login result:', { success: result?.success });
      
      if (result && result.success) {
        console.log('✅ Login successful, redirecting to dashboard');
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }
        
        // If no onLoginSuccess handler, redirect to dashboard
        if (!onLoginSuccess && result.dashboardRoute) {
          window.location.href = result.dashboardRoute;
        }
      }
    } catch (error) {
      console.error('❌ Login submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo login function removed - users must enter credentials manually

  // Load remembered credentials - always load them for easier testing
  useEffect(() => {
    const rememberedFirstName = localStorage.getItem('bptm_remember_firstName');
    const rememberedPhone = localStorage.getItem('bptm_remember_phone');
    if (rememberedFirstName && rememberedPhone) {
      setFormData(prev => ({
        ...prev,
        firstName: rememberedFirstName,
        phone: rememberedPhone,
        rememberMe: true
      }));
    }
  }, []);

  if (isLoading) {
    return (
      <FadeTransition show={true}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <LoadingSpinner size="lg" showText text="Authenticating..." />
          </div>
        </div>
      </FadeTransition>
    );
  }

  return (
    <FadeTransition show={true}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 mb-4">
              <span className="text-2xl font-bold text-blue-600">🏢</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to your BPTM account
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-red-500 text-xl mr-3">⚠️</span>
                  <div className="flex-1">
                    <h4 className="text-red-800 font-medium">Authentication Error</h4>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your first name (e.g., John, Sarah, David)"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter phone number (with or without +91 prefix)"
                  disabled={isSubmitting}
                  inputMode="numeric"
                  autoComplete="tel"
                  pattern="^(\+91[-\s]?)?[6-9][0-9]{9}$"
                  title="Enter 10 digits starting with 6-9, optionally prefixed with +91-, +91 , or +91 (e.g., 9876543210, +91-9876543210, or +91 9876543210)"
                  onInput={(e) => e.target.setCustomValidity('')}
                  onInvalid={(e) => e.target.setCustomValidity('Please enter 10 digits starting with 6-9, optionally prefixed with +91-, +91 , or +91 (e.g., 9876543210, +91-9876543210, or +91 9876543210)')}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    name="rememberMe"
                    type="checkbox"
                    checked={true}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={true}
                  />
                  <span className="ml-2 text-sm text-gray-600">Credentials autosaved for easier testing</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !formData.firstName || !formData.phone}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-gray-600">
            <p>Need help? Contact your system administrator</p>
            <p className="mt-1 text-xs text-gray-500">
              BPTM Employee Performance Management System
            </p>
          </div>
        </div>
      </div>
    </FadeTransition>
  );
}

export default LoginPage;