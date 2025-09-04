/**
 * Shared Error Handling Utilities
 * Provides standardized error handling patterns across components
 */

export const ErrorHandlers = {
  /**
   * Create a standardized error handler for async operations
   */
  createAsyncErrorHandler: ({ notify, setLoading, setError, operation = 'operation' }) => {
    return async (asyncFn, options = {}) => {
      const { 
        loadingMessage = null,
        successMessage = null,
        errorMessage = null,
        onSuccess = null,
        onError = null,
        retryCount = 0
      } = options;

      if (setLoading) setLoading(true);
      if (loadingMessage && notify) {
        notify({ type: 'info', title: 'Processing', message: loadingMessage });
      }

      let attempt = 0;
      while (attempt <= retryCount) {
        try {
          const result = await asyncFn();
          
          if (setError) setError(null);
          if (successMessage && notify) {
            notify({ type: 'success', title: 'Success', message: successMessage });
          }
          if (onSuccess) onSuccess(result);
          
          if (setLoading) setLoading(false);
          return result;
        } catch (error) {
          attempt++;
          console.error(`${operation} failed (attempt ${attempt}):`, error);
          
          if (attempt > retryCount) {
            const finalError = errorMessage || error.message || `${operation} failed`;
            
            if (setError) setError(finalError);
            if (notify) {
              notify({ 
                type: 'error', 
                title: 'Error', 
                message: finalError 
              });
            }
            if (onError) onError(error);
            
            if (setLoading) setLoading(false);
            throw error;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    };
  },

  /**
   * Create a data fetching error handler
   */
  createDataFetchHandler: ({ notify, setLoading, setError, setData }) => {
    return async (fetchFn, fallbackData = null) => {
      try {
        setLoading(true);
        const result = await fetchFn();
        setData(result);
        return result;
      } catch (error) {
        console.error('Data fetch failed:', error);
        setError('Failed to load data');
        notify('Failed to load data', 'error');
        if (fallbackData !== null) {
          setData(fallbackData);
        }
        throw error;
      } finally {
        setLoading(false);
      }
    };
  },

  /**
   * Create a form submission error handler
   */
  createSubmissionErrorHandler: ({ notify, setLoading, setError, onSuccess }) => {
    return async (submitFn, formData) => {
      try {
        setLoading(true);
        const result = await submitFn(formData);
        if (onSuccess) {
          onSuccess(result);
        }
        notify('Successfully submitted', 'success');
        return result;
      } catch (error) {
        console.error('Submission failed:', error);
        setError('Submission failed');
        notify('Submission failed', 'error');
        throw error;
      } finally {
        setLoading(false);
      }
    };
  },

  /**
   * Standardized error boundary handler
   */
  createErrorBoundaryHandler: ({ notify, fallbackComponent = null }) => {
    return (error, errorInfo) => {
      console.error('Error boundary caught an error:', error, errorInfo);
      
      if (notify) {
        notify({
          type: 'error',
          title: 'Application Error',
          message: 'An unexpected error occurred. Please refresh the page.'
        });
      }
      
      return fallbackComponent;
    };
  },

  /**
   * Network error handler with retry logic
   */
  createNetworkErrorHandler: (notify) => {
    return (error) => {
      if (error.code === 'NETWORK_TIMEOUT') {
        notify('Request timed out. Please try again.', 'error');
      } else if (error.code === 'NETWORK_ERROR') {
        notify('Network connection failed. Please check your internet connection.', 'error');
      } else if (error.status >= 500) {
        notify(`Server error (${error.status}): ${error.message}`, 'error');
      } else {
        notify(`An unexpected error occurred: ${error.message}`, 'error');
      }
    };
  },

  /**
   * Network retry handler
   */
  createNetworkRetryHandler: ({ notify, maxRetries = 3 }) => {
    return async (networkFn, retryDelay = 1000) => {
      let attempts = 0;
      
      while (attempts < maxRetries) {
        try {
          return await networkFn();
        } catch (error) {
          attempts++;
          
          if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
            if (attempts < maxRetries) {
              console.warn(`Network error, retrying in ${retryDelay}ms (attempt ${attempts}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              retryDelay *= 2; // Exponential backoff
              continue;
            }
          }
          
          // Final attempt failed or non-network error
          if (notify) {
            notify({
              type: 'error',
              title: 'Network Error',
              message: attempts >= maxRetries 
                ? 'Network connection failed after multiple attempts. Please check your connection.'
                : error.message
            });
          }
          
          throw error;
        }
      }
    };
  },

  /**
   * Validation error handler
   */
  createValidationErrorHandler: (setFieldErrors, notify) => {
    return (validationErrors) => {
      if (typeof validationErrors === 'string') {
        // Single error message
        notify(validationErrors, 'warning');
      } else if (typeof validationErrors === 'object') {
        // Multiple field errors
        setFieldErrors(validationErrors);
        notify('Please fix the validation errors', 'warning');
      }
    };
  }
};


/**
 * Loading state utilities
 */
export const LoadingHandlers = {
  /**
   * Create loading state manager
   */
  createLoadingManager: (setLoading) => {
    const activeOperations = new Set();
    
    return {
      start: (operationId = 'default') => {
        activeOperations.add(operationId);
        setLoading(true);
      },
      stop: (operationId = 'default') => {
        activeOperations.delete(operationId);
        if (activeOperations.size === 0) {
          setLoading(false);
        }
      },
      isLoading: () => activeOperations.size > 0
    };
  },

  /**
   * Create async operation wrapper with loading state
   */
  createAsyncWrapper: (setLoading) => {
    return async (asyncFn) => {
      setLoading(true);
      try {
        return await asyncFn();
      } finally {
        setLoading(false);
      }
    };
  }
};

/**
 * Modal management utilities
 */
export const ModalHandlers = {
  /**
   * Create standardized modal handlers
   */
  createModalHandlers: (setModal, notify) => {
    return {
      showConfirmation: async (title, message) => {
        return new Promise((resolve) => {
          // For testing, we'll use a simple confirm dialog
          const result = confirm(`${title}\n\n${message}`);
          resolve(result);
        });
      },
      
      showError: (title, message) => {
        setModal({
          isOpen: true,
          type: 'error',
          title,
          message,
          onClose: () => {
            setModal({
              isOpen: false,
              type: null,
              title: '',
              message: '',
              onClose: null
            });
          }
        });
      },
      
      showSuccess: (title, message) => {
        setModal({
          isOpen: true,
          type: 'success',
          title,
          message,
          onClose: () => {
            setModal({
              isOpen: false,
              type: null,
              title: '',
              message: '',
              onClose: null
            });
          }
        });
      },
      
      showInfo: (title, message) => {
        setModal({
          isOpen: true,
          type: 'info',
          title,
          message,
          onClose: () => {
            setModal({
              isOpen: false,
              type: null,
              title: '',
              message: '',
              onClose: null
            });
          }
        });
      },
      
      showLoading: (message) => {
        setModal({
          isOpen: true,
          type: 'loading',
          title: 'Loading',
          message,
          onClose: null
        });
      },
      
      closeModal: () => {
        setModal({
          isOpen: false,
          type: null,
          title: '',
          message: '',
          onClose: null
        });
      }
    };
  }
};


export default {
  ErrorHandlers,
  LoadingHandlers,
  ModalHandlers
};