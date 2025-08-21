/**
 * ButtonFeedback Component
 * 
 * Provides visual feedback for button interactions including loading states,
 * success confirmations, error messages, and progress indicators.
 */

import React from 'react';

export const ButtonFeedback = ({ 
  state, 
  loadingText = 'Processing...', 
  successText = 'Success!', 
  errorText = null,
  showSpinner = true,
  className = ''
}) => {
  if (!state.loading && !state.success && !state.error) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {state.loading && (
        <>
          {showSpinner && (
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
          )}
          <span className="text-blue-600">{loadingText}</span>
        </>
      )}
      
      {state.success && (
        <>
          <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-green-600">{successText}</span>
        </>
      )}
      
      {state.error && (
        <>
          <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-red-600">{errorText || state.error}</span>
        </>
      )}
    </div>
  );
};

export const InlineButtonFeedback = ({ 
  state, 
  loadingText = '...', 
  successText = '✓', 
  errorText = '✗'
}) => {
  if (state.loading) {
    return <span className="text-blue-600 ml-1">{loadingText}</span>;
  }
  
  if (state.success) {
    return <span className="text-green-600 ml-1">{successText}</span>;
  }
  
  if (state.error) {
    return <span className="text-red-600 ml-1" title={state.error}>{errorText}</span>;
  }
  
  return null;
};

export const ProgressButton = ({ 
  children, 
  onClick, 
  progress = 0, 
  isComplete = false, 
  className = '', 
  variant = 'primary',
  ...props 
}) => {
  const baseClasses = 'relative overflow-hidden inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
  };

  const variantClasses = variants[variant] || variants.primary;

  return (
    <button
      {...props}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} px-4 py-2 rounded-lg ${className}`}
    >
      {/* Progress bar background */}
      <div 
        className="absolute inset-0 bg-white bg-opacity-20 transition-all duration-300 ease-out"
        style={{ 
          width: `${Math.min(progress, 100)}%`,
          left: 0
        }}
      />
      
      {/* Button content */}
      <span className="relative z-10 flex items-center gap-2">
        {isComplete && (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
        {children}
      </span>
    </button>
  );
};

export default ButtonFeedback;