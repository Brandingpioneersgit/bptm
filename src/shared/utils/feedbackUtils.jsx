/**
 * Standardized Feedback Utilities
 * 
 * Provides consistent success/error feedback patterns across all forms and actions
 * throughout the application. This ensures a unified user experience.
 */

import { useToast } from '@/shared/components/Toast';
import { useCallback } from 'react';

/**
 * Standard feedback messages for common operations
 */
export const FEEDBACK_MESSAGES = {
  // Form submissions
  FORM_SUBMIT_SUCCESS: 'Form submitted successfully!',
  FORM_SUBMIT_ERROR: 'Failed to submit form. Please try again.',
  FORM_SAVE_SUCCESS: 'Changes saved successfully!',
  FORM_SAVE_ERROR: 'Failed to save changes. Please try again.',
  FORM_VALIDATION_ERROR: 'Please fix the validation errors before submitting.',
  
  // Draft operations
  DRAFT_SAVE_SUCCESS: 'Draft saved automatically',
  DRAFT_SAVE_ERROR: 'Failed to save draft',
  DRAFT_LOAD_SUCCESS: 'Draft loaded successfully',
  DRAFT_LOAD_ERROR: 'Failed to load draft',
  DRAFT_DELETE_SUCCESS: 'Draft deleted successfully',
  
  // Data operations
  DATA_FETCH_ERROR: 'Failed to load data. Please refresh the page.',
  DATA_UPDATE_SUCCESS: 'Data updated successfully!',
  DATA_UPDATE_ERROR: 'Failed to update data. Please try again.',
  DATA_DELETE_SUCCESS: 'Item deleted successfully!',
  DATA_DELETE_ERROR: 'Failed to delete item. Please try again.',
  
  // Authentication
  LOGIN_SUCCESS: 'Welcome back!',
  LOGIN_ERROR: 'Login failed. Please check your credentials.',
  LOGOUT_SUCCESS: 'You have been logged out successfully.',
  
  // File operations
  FILE_UPLOAD_SUCCESS: 'File uploaded successfully!',
  FILE_UPLOAD_ERROR: 'Failed to upload file. Please try again.',
  FILE_DELETE_SUCCESS: 'File deleted successfully!',
  FILE_DELETE_ERROR: 'Failed to delete file. Please try again.',
  
  // Network
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  
  // Generic
  OPERATION_SUCCESS: 'Operation completed successfully!',
  OPERATION_ERROR: 'Operation failed. Please try again.',
  PERMISSION_ERROR: 'You do not have permission to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.'
};

/**
 * Standard feedback types
 */
export const FEEDBACK_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Standard feedback durations (in milliseconds)
 */
export const FEEDBACK_DURATIONS = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
  PERSISTENT: 0 // Requires manual dismissal
};

/**
 * Enhanced feedback hook that provides standardized feedback methods
 */
export const useStandardizedFeedback = () => {
  const { notify } = useToast();
  
  const showSuccess = useCallback((message, options = {}) => {
    const {
      title = 'Success',
      duration = FEEDBACK_DURATIONS.MEDIUM,
      ...otherOptions
    } = options;
    
    notify({
      type: FEEDBACK_TYPES.SUCCESS,
      title,
      message,
      timeout: duration,
      ...otherOptions
    });
  }, [notify]);
  
  const showError = useCallback((message, options = {}) => {
    const {
      title = 'Error',
      duration = FEEDBACK_DURATIONS.LONG,
      ...otherOptions
    } = options;
    
    notify({
      type: FEEDBACK_TYPES.ERROR,
      title,
      message,
      timeout: duration,
      ...otherOptions
    });
  }, [notify]);
  
  const showWarning = useCallback((message, options = {}) => {
    const {
      title = 'Warning',
      duration = FEEDBACK_DURATIONS.MEDIUM,
      ...otherOptions
    } = options;
    
    notify({
      type: FEEDBACK_TYPES.WARNING,
      title,
      message,
      timeout: duration,
      ...otherOptions
    });
  }, [notify]);
  
  const showInfo = useCallback((message, options = {}) => {
    const {
      title = 'Information',
      duration = FEEDBACK_DURATIONS.SHORT,
      ...otherOptions
    } = options;
    
    notify({
      type: FEEDBACK_TYPES.INFO,
      title,
      message,
      timeout: duration,
      ...otherOptions
    });
  }, [notify]);
  
  // Specialized feedback methods for common operations
  const showFormSuccess = useCallback((customMessage) => {
    showSuccess(customMessage || FEEDBACK_MESSAGES.FORM_SUBMIT_SUCCESS);
  }, [showSuccess]);
  
  const showFormError = useCallback((error, customMessage) => {
    const message = customMessage || FEEDBACK_MESSAGES.FORM_SUBMIT_ERROR;
    const errorDetails = error?.message || error || '';
    showError(errorDetails ? `${message} ${errorDetails}` : message);
  }, [showError]);
  
  const showValidationError = useCallback((errors) => {
    if (Array.isArray(errors)) {
      showError(`Validation failed: ${errors.join(', ')}`, {
        title: 'Validation Error'
      });
    } else {
      showError(FEEDBACK_MESSAGES.FORM_VALIDATION_ERROR, {
        title: 'Validation Error'
      });
    }
  }, [showError]);
  
  const showSaveSuccess = useCallback((customMessage) => {
    showSuccess(customMessage || FEEDBACK_MESSAGES.FORM_SAVE_SUCCESS);
  }, [showSuccess]);
  
  const showSaveError = useCallback((error, customMessage) => {
    const message = customMessage || FEEDBACK_MESSAGES.FORM_SAVE_ERROR;
    const errorDetails = error?.message || error || '';
    showError(errorDetails ? `${message} ${errorDetails}` : message);
  }, [showError]);
  
  const showNetworkError = useCallback(() => {
    showError(FEEDBACK_MESSAGES.NETWORK_ERROR, {
      title: 'Connection Error',
      duration: FEEDBACK_DURATIONS.LONG
    });
  }, [showError]);
  
  const showPermissionError = useCallback(() => {
    showError(FEEDBACK_MESSAGES.PERMISSION_ERROR, {
      title: 'Permission Denied',
      duration: FEEDBACK_DURATIONS.LONG
    });
  }, [showError]);
  
  return {
    // Basic feedback methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // Specialized methods
    showFormSuccess,
    showFormError,
    showValidationError,
    showSaveSuccess,
    showSaveError,
    showNetworkError,
    showPermissionError,
    
    // Direct notify access for custom cases
    notify
  };
};

/**
 * Higher-order component for form submission with standardized feedback
 */
export const withStandardizedFeedback = (WrappedComponent) => {
  return function WithStandardizedFeedbackComponent(props) {
    const feedback = useStandardizedFeedback();
    
    return (
      <WrappedComponent
        {...props}
        feedback={feedback}
      />
    );
  };
};

/**
 * Utility function to create standardized form submission handlers
 */
export const createFormSubmissionHandler = ({
  submitOperation,
  onSuccess,
  onError,
  feedback,
  validationRules = null,
  successMessage = null,
  errorMessage = null
}) => {
  return async (formData, options = {}) => {
    try {
      // Client-side validation if rules provided
      if (validationRules) {
        const validationErrors = [];
        
        for (const rule of validationRules) {
          if (typeof rule === 'function') {
            const error = rule(formData);
            if (error) validationErrors.push(error);
          } else if (rule.condition) {
            validationErrors.push(rule.message);
          }
        }
        
        if (validationErrors.length > 0) {
          feedback.showValidationError(validationErrors);
          return { success: false, errors: validationErrors };
        }
      }
      
      // Execute submission
      const result = await submitOperation(formData, options);
      
      // Handle success
      feedback.showFormSuccess(successMessage);
      if (onSuccess) {
        await onSuccess(result);
      }
      
      return { success: true, data: result };
      
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Handle different error types
      if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
        feedback.showNetworkError();
      } else if (error.message?.includes('permission') || error.status === 403) {
        feedback.showPermissionError();
      } else {
        feedback.showFormError(error, errorMessage);
      }
      
      if (onError) {
        await onError(error);
      }
      
      return { success: false, error };
    }
  };
};

/**
 * Utility function to create standardized data operation handlers
 */
export const createDataOperationHandler = ({
  operation,
  operationName = 'operation',
  feedback,
  onSuccess,
  onError
}) => {
  return async (...args) => {
    try {
      const result = await operation(...args);
      
      feedback.showSuccess(`${operationName} completed successfully!`);
      if (onSuccess) {
        await onSuccess(result);
      }
      
      return { success: true, data: result };
      
    } catch (error) {
      console.error(`${operationName} error:`, error);
      
      if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
        feedback.showNetworkError();
      } else {
        feedback.showError(`Failed to ${operationName.toLowerCase()}. Please try again.`);
      }
      
      if (onError) {
        await onError(error);
      }
      
      return { success: false, error };
    }
  };
};

export default {
  FEEDBACK_MESSAGES,
  FEEDBACK_TYPES,
  FEEDBACK_DURATIONS,
  useStandardizedFeedback,
  withStandardizedFeedback,
  createFormSubmissionHandler,
  createDataOperationHandler
};