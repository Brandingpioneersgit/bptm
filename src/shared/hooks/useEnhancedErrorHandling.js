import { useState, useCallback } from 'react';
import { notify } from '../utils/notificationUtils';

/**
 * Enhanced Error Handling Hook
 * Provides easy-to-use error handling functions for components
 * Can be used independently without requiring provider setup
 */
export const useEnhancedErrorHandling = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Enhanced notification function with better defaults
  const showNotification = useCallback((message, type = 'info', options = {}) => {
    const notificationConfig = {
      type,
      title: options.title || type.charAt(0).toUpperCase() + type.slice(1),
      message,
      duration: options.duration || (type === 'error' ? 8000 : 5000),
      ...options
    };

    if (typeof notify === 'function') {
      notify(notificationConfig);
    } else {
      // Fallback to console if notify is not available
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }, []);

  // Handle async operations with comprehensive error handling
  const handleAsyncOperation = useCallback(async (operation, options = {}) => {
    const {
      loadingMessage = null,
      successMessage = null,
      errorMessage = 'Operation failed',
      onSuccess = null,
      onError = null,
      showLoading = true,
      retryCount = 0,
      retryDelay = 1000
    } = options;

    let attempt = 0;
    const maxAttempts = retryCount + 1;

    while (attempt < maxAttempts) {
      try {
        if (showLoading) {
          setLoading(true);
          if (loadingMessage) {
            showNotification(loadingMessage, 'info', { duration: 2000 });
          }
        }

        setError(null);
        const result = await operation();

        if (successMessage) {
          showNotification(successMessage, 'success');
        }

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        console.error(`Operation failed (attempt ${attempt + 1}/${maxAttempts}):`, err);
        
        if (attempt < maxAttempts - 1) {
          // Retry logic
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          attempt++;
          continue;
        }

        // Final failure
        const finalError = {
          message: err.message || errorMessage,
          code: err.code,
          details: err.details || err.hint,
          timestamp: new Date().toISOString()
        };

        setError(finalError);
        
        // Show user-friendly error message
        const userMessage = getUserFriendlyErrorMessage(err, errorMessage);
        showNotification(userMessage, 'error');

        if (onError) {
          onError(finalError);
        }

        throw finalError;
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    }
  }, [showNotification]);

  // Handle data fetching with fallback support
  const handleDataFetch = useCallback(async (fetchOperation, options = {}) => {
    const {
      fallbackData = null,
      errorMessage = 'Failed to load data',
      showErrorNotification = true,
      retryCount = 1
    } = options;

    try {
      return await handleAsyncOperation(fetchOperation, {
        errorMessage,
        retryCount,
        showLoading: true
      });
    } catch (err) {
      if (fallbackData !== null) {
        if (showErrorNotification) {
          showNotification(
            'Using offline data due to connection issues',
            'warning'
          );
        }
        return fallbackData;
      }
      throw err;
    }
  }, [handleAsyncOperation, showNotification]);

  // Handle form submissions with validation support
  const handleFormSubmission = useCallback(async (submitOperation, formData, options = {}) => {
    const {
      validationRules = null,
      successMessage = 'Form submitted successfully',
      errorMessage = 'Form submission failed',
      onSuccess = null,
      onValidationError = null,
      resetForm = null
    } = options;

    try {
      // Client-side validation
      if (validationRules) {
        const validationErrors = validateFormData(formData, validationRules);
        if (validationErrors.length > 0) {
          const errorMsg = `Validation failed: ${validationErrors.join(', ')}`;
          showNotification(errorMsg, 'warning');
          if (onValidationError) {
            onValidationError(validationErrors);
          }
          return { success: false, errors: validationErrors };
        }
      }

      const result = await handleAsyncOperation(submitOperation, {
        successMessage,
        errorMessage,
        onSuccess: (data) => {
          if (resetForm) {
            resetForm();
          }
          if (onSuccess) {
            onSuccess(data);
          }
        }
      });

      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err };
    }
  }, [handleAsyncOperation, showNotification]);

  // Handle database operations with specific error handling
  const handleDatabaseOperation = useCallback(async (operation, options = {}) => {
    const {
      operationName = 'database operation',
      context = {},
      retryCount = 1
    } = options;

    try {
      return await handleAsyncOperation(operation, {
        errorMessage: `${operationName} failed`,
        retryCount
      });
    } catch (err) {
      // Enhanced database error handling
      const dbError = handleDatabaseError(err, operationName, context);
      throw dbError;
    }
  }, [handleAsyncOperation]);

  // Convenience methods for notifications
  const showSuccess = useCallback((message, options = {}) => {
    showNotification(message, 'success', options);
  }, [showNotification]);

  const showError = useCallback((message, options = {}) => {
    showNotification(message, 'error', options);
  }, [showNotification]);

  const showWarning = useCallback((message, options = {}) => {
    showNotification(message, 'warning', options);
  }, [showNotification]);

  const showInfo = useCallback((message, options = {}) => {
    showNotification(message, 'info', options);
  }, [showNotification]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    setLoading,
    
    // Main handlers
    handleAsyncOperation,
    handleDataFetch,
    handleFormSubmission,
    handleDatabaseOperation,
    
    // Notification methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
    
    // Utility methods
    clearError
  };
};

/**
 * Convert technical errors to user-friendly messages
 */
function getUserFriendlyErrorMessage(error, defaultMessage) {
  if (!error) return defaultMessage;

  const message = error.message || error.toString();
  
  // Database connection errors
  if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
    return 'Connection issue detected. Please check your internet connection and try again.';
  }
  
  // Authentication errors
  if (message.includes('auth') || message.includes('unauthorized') || message.includes('permission')) {
    return 'Authentication required. Please log in and try again.';
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('required') || message.includes('invalid')) {
    return 'Please check your input and ensure all required fields are filled correctly.';
  }
  
  // Timeout errors
  if (message.includes('timeout') || message.includes('slow')) {
    return 'The operation is taking longer than expected. Please try again.';
  }
  
  // Server errors
  if (message.includes('500') || message.includes('server error')) {
    return 'Server error occurred. Please try again later or contact support.';
  }
  
  // Rate limiting
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  // Default to provided message or generic fallback
  return defaultMessage || 'An unexpected error occurred. Please try again.';
}

/**
 * Handle database-specific errors
 */
function handleDatabaseError(error, operationName, context) {
  const enhancedError = {
    ...error,
    operationName,
    context,
    timestamp: new Date().toISOString(),
    userMessage: getUserFriendlyErrorMessage(error, `${operationName} failed`)
  };

  // Log detailed error for debugging
  console.error(`Database Error in ${operationName}:`, {
    error: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    context
  });

  return enhancedError;
}

/**
 * Simple form validation helper
 */
function validateFormData(formData, rules) {
  const errors = [];
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = formData[field];
    
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors.push(`${field} is required`);
    }
    
    if (value && rule.minLength && value.toString().length < rule.minLength) {
      errors.push(`${field} must be at least ${rule.minLength} characters`);
    }
    
    if (value && rule.maxLength && value.toString().length > rule.maxLength) {
      errors.push(`${field} must be no more than ${rule.maxLength} characters`);
    }
    
    if (value && rule.pattern && !rule.pattern.test(value.toString())) {
      errors.push(`${field} format is invalid`);
    }
    
    if (value && rule.custom && !rule.custom(value)) {
      errors.push(rule.customMessage || `${field} is invalid`);
    }
  }
  
  return errors;
}

export default useEnhancedErrorHandling;