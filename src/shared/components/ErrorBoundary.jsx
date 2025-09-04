import React from 'react';
import { logger } from '../utils/logger';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      copySuccess: false,
      retryCount: 0,
      isProduction: process.env.NODE_ENV === 'production'
    };
  }

  static getDerivedStateFromError(error) {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error, errorInfo) {
    // Enhanced error logging with context
    const errorDetails = {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    // Log to console with structured data
    console.group('🚨 UI Error Boundary Triggered');
    logger.error('Error:', error);
    logger.error('Error Info:', errorInfo);
    logger.error('Error Details:', errorDetails);
    console.groupEnd();

    // Store error info for display
    this.setState({ errorInfo });

    // Report to error tracking service if available
    if (window.reportError) {
      window.reportError(errorDetails);
    }

    // Save error to localStorage for debugging
    try {
      const savedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      savedErrors.push(errorDetails);
      // Keep only last 10 errors
      if (savedErrors.length > 10) {
        savedErrors.splice(0, savedErrors.length - 10);
      }
      localStorage.setItem('app_errors', JSON.stringify(savedErrors));
    } catch (e) {
      logger.warn('Failed to save error to localStorage:', e);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    // Use window.location.assign for better navigation handling
    window.location.assign('/');
    this.handleRetry();
  };

  copyErrorDetails = () => {
    const errorText = `Error ID: ${this.state.errorId}\nError: ${this.state.error?.toString()}\nTimestamp: ${new Date().toISOString()}\nURL: ${window.location.href}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(errorText).then(() => {
        logger.debug('SUCCESS: Error details copied to clipboard');
        this.setState({ copySuccess: true });
        setTimeout(() => this.setState({ copySuccess: false }), 3000);
      }).catch(() => {
        // Fallback for older browsers
        this.fallbackCopyTextToClipboard(errorText);
      });
    } else {
      this.fallbackCopyTextToClipboard(errorText);
    }
  };

  fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      logger.debug('SUCCESS: Error details copied to clipboard');
      this.setState({ copySuccess: true });
      setTimeout(() => this.setState({ copySuccess: false }), 3000);
    } catch (err) {
      logger.error('Fallback: Could not copy text: ', err);
      logger.error('ERROR: Failed to copy error details');
    }
    
    document.body.removeChild(textArea);
  };

  render() {
    if (this.state.hasError) {
      const isRepeatedError = this.state.retryCount > 2;
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-2xl w-full bg-white border border-red-200 rounded-xl shadow-lg p-6">
            {/* Error Icon and Title */}
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-red-800">
                  {isRepeatedError ? 'Persistent Error Detected' : 'Something went wrong'}
                </h1>
                <p className="text-sm text-red-600 mt-1">
                  Error ID: <code className="bg-red-50 px-1 rounded text-xs">{this.state.errorId}</code>
                </p>
              </div>
            </div>

            {/* Error Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium mb-2">
                {isRepeatedError 
                  ? 'This error has occurred multiple times. Please try reloading the page or contact support.'
                  : 'An unexpected error occurred while rendering this component.'}
              </p>
              
              {/* Only show technical details in development mode */}
              {!this.state.isProduction && this.state.error && (
                <details className="mt-3">
                  <summary className="text-sm text-red-700 cursor-pointer hover:text-red-800">
                    Technical Details (Development Mode)
                  </summary>
                  <div className="mt-2 p-3 bg-red-100 rounded border text-xs font-mono text-red-800 overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo && (
                      <div className="mt-2 pt-2 border-t border-red-200">
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              {/* Production mode - show user-friendly message */}
              {this.state.isProduction && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    We apologize for the inconvenience. Our team has been notified and is working to resolve this issue.
                    Please try refreshing the page or contact support if the problem persists.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {!isRepeatedError && (
                <button
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  onClick={this.handleRetry}
                >
                  Try Again
                </button>
              )}
              
              <button
                className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors"
                onClick={this.handleReload}
              >
                Reload Page
              </button>
              
              <button
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                onClick={this.handleGoHome}
              >
                Go to Home
              </button>
              
              {/* Only show copy error details button in development mode */}
              {!this.state.isProduction && (
                <button
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    this.state.copySuccess 
                      ? 'border-green-300 bg-green-50 text-green-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={this.copyErrorDetails}
                >
                  {this.state.copySuccess ? '✓ Copied!' : 'Copy Error Details'}
                </button>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {this.state.isProduction 
                  ? 'If this problem persists, please contact support with the Error ID shown above.'
                  : 'If this problem persists, please copy the error details and contact support.'}
                {this.state.retryCount > 0 && (
                  <span className="block mt-1 text-orange-600">
                    Retry attempts: {this.state.retryCount}
                  </span>
                )}
              </p>
              
              {/* Development mode notice */}
              {!this.state.isProduction && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800">
                    <strong>Development Mode:</strong> Technical details are visible for debugging. 
                    In production, users will only see user-friendly error messages.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

