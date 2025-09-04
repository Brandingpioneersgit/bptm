import React, { Component } from 'react';
import { logger } from '../utils/logger';

/**
 * Global Error Handler Component
 * Provides production-ready error handling that masks technical errors from end users
 */
class GlobalErrorHandler extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: null,
      isProduction: process.env.NODE_ENV === 'production'
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    const errorDetails = {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    // Always log to console for debugging
    console.group('🚨 Global Error Handler');
    logger.error('Error:', error);
    logger.error('Error Info:', errorInfo);
    logger.error('Error Details:', errorDetails);
    console.groupEnd();

    // Store error for debugging (even in production)
    try {
      const savedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      savedErrors.push(errorDetails);
      // Keep only last 5 errors to avoid storage bloat
      if (savedErrors.length > 5) {
        savedErrors.splice(0, savedErrors.length - 5);
      }
      localStorage.setItem('app_errors', JSON.stringify(savedErrors));
    } catch (e) {
      logger.warn('Failed to save error to localStorage:', e);
    }

    // Report to error tracking service if available
    if (window.reportError) {
      window.reportError(errorDetails);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorId: null });
    // Reload the page to reset the application state
    window.location.reload();
  };

  handleReportIssue = () => {
    const errorId = this.state.errorId;
    const subject = encodeURIComponent(`Application Error Report - ID: ${errorId}`);
    const body = encodeURIComponent(
      `An error occurred in the application.\n\n` +
      `Error ID: ${errorId}\n` +
      `Time: ${new Date().toISOString()}\n` +
      `Page: ${window.location.href}\n\n` +
      `Please describe what you were doing when this error occurred:\n\n`
    );
    
    // Open email client with pre-filled error report
    window.location.href = `mailto:support@brandingpioneers.com?subject=${subject}&body=${body}`;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                {/* Error Icon */}
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                {/* Error Message */}
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  Something went wrong
                </h2>
                
                <p className="text-sm text-gray-600 mb-6">
                  {this.state.isProduction 
                    ? "We're sorry, but something unexpected happened. Our team has been notified and is working to fix this issue."
                    : "An error occurred while loading the application. Please try refreshing the page."
                  }
                </p>
                
                {/* Error ID (for support) */}
                {this.state.errorId && (
                  <p className="text-xs text-gray-400 mb-6">
                    Error ID: {this.state.errorId}
                  </p>
                )}
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Refresh Page
                  </button>
                  
                  <button
                    onClick={this.handleReportIssue}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Report Issue
                  </button>
                  
                  <button
                    onClick={() => window.location.assign('/')}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go to Home
                  </button>
                </div>
                
                {/* Development Mode Info */}
                {!this.state.isProduction && (
                  <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-xs text-yellow-800">
                      <strong>Development Mode:</strong> Check the browser console for detailed error information.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Production Error Wrapper
 * Wraps components with production-ready error handling
 */
export const withGlobalErrorHandler = (WrappedComponent) => {
  return function WithGlobalErrorHandlerComponent(props) {
    return (
      <GlobalErrorHandler>
        <WrappedComponent {...props} />
      </GlobalErrorHandler>
    );
  };
};

/**
 * Global Error Provider
 * Provides global error handling context
 */
export const GlobalErrorProvider = ({ children }) => {
  // Set up global error handlers
  React.useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      logger.error('Unhandled promise rejection:', event.reason);
      
      // In production, show user-friendly message
      if (process.env.NODE_ENV === 'production') {
        // You could show a toast notification here
        logger.warn('An operation failed. Please try again.');
      }
    };

    // Handle global JavaScript errors
    const handleGlobalError = (event) => {
      logger.error('Global JavaScript error:', event.error);
      
      // In production, prevent the error from showing in console for end users
      if (process.env.NODE_ENV === 'production') {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  return (
    <GlobalErrorHandler>
      {children}
    </GlobalErrorHandler>
  );
};

export default GlobalErrorHandler;