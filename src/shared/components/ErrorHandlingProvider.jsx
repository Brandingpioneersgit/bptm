import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ErrorHandlers, LoadingHandlers, ModalHandlers } from '../utils/errorUtils';
import { NotificationHandlers } from '../utils/notificationUtils';
import { DatabaseErrorHandler, FormSubmissionHandler } from '../utils/errorHandler';
import { useSupabase } from '../../components/SupabaseProvider';

/**
 * Enhanced Error Handling Context
 * Provides centralized error handling with user-friendly feedback
 */
const ErrorHandlingContext = createContext(null);

/**
 * Error Handling Provider Component
 * Wraps the application with comprehensive error handling capabilities
 */
export const ErrorHandlingProvider = ({ children }) => {
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({
    isOpen: false,
    type: null,
    title: '',
    message: '',
    onClose: null
  });

  // Create notification system
  const useNotificationSystem = NotificationHandlers.createNotificationSystem({
    maxNotifications: 5,
    defaultDuration: 5000,
    position: 'top-right'
  });
  const notificationSystem = useNotificationSystem();

  // Create standardized notify function
  const notify = useCallback((messageOrOptions, type = 'info', duration = 5000) => {
    if (typeof messageOrOptions === 'string') {
      notificationSystem.addNotification({
        type,
        title: type.charAt(0).toUpperCase() + type.slice(1),
        message: messageOrOptions,
        duration
      });
    } else {
      notificationSystem.addNotification(messageOrOptions);
    }
  }, [notificationSystem]);

  // Create error handlers
  const asyncErrorHandler = ErrorHandlers.createAsyncErrorHandler({
    notify,
    setLoading,
    setError
  });

  const dataFetchHandler = ErrorHandlers.createDataFetchHandler({
    notify,
    setLoading,
    setError,
    setData: () => {} // Will be overridden per use
  });

  const submissionErrorHandler = ErrorHandlers.createSubmissionErrorHandler({
    notify,
    setLoading,
    setError,
    onSuccess: () => {}
  });

  const networkErrorHandler = ErrorHandlers.createNetworkErrorHandler(notify);

  // Create loading manager
  const loadingManager = LoadingHandlers.createLoadingManager(setLoading);

  // Create modal handlers
  const modalHandlers = ModalHandlers.createModalHandlers(setModal, notify);

  // Create database error handler
  const databaseErrorHandler = new DatabaseErrorHandler(supabase, notify);
  const formSubmissionHandler = new FormSubmissionHandler(supabase, notify, modalHandlers.showError);

  // Enhanced error handling functions
  const handleAsyncOperation = useCallback(async (operation, options = {}) => {
    const {
      operationName = 'operation',
      loadingMessage = null,
      successMessage = null,
      errorMessage = null,
      onSuccess = null,
      onError = null,
      retryCount = 0,
      fallbackData = null
    } = options;

    return asyncErrorHandler(operation, {
      loadingMessage,
      successMessage,
      errorMessage,
      onSuccess,
      onError,
      retryCount
    });
  }, [asyncErrorHandler]);

  const handleDataFetch = useCallback(async (fetchOperation, options = {}) => {
    const {
      fallbackData = null,
      setData = () => {},
      errorMessage = 'Failed to load data'
    } = options;

    const customDataFetchHandler = ErrorHandlers.createDataFetchHandler({
      notify,
      setLoading,
      setError,
      setData
    });

    return customDataFetchHandler(fetchOperation, fallbackData);
  }, [notify, setLoading, setError]);

  const handleFormSubmission = useCallback(async (submitOperation, formData, options = {}) => {
    const {
      successMessage = 'Form submitted successfully',
      errorMessage = 'Form submission failed',
      onSuccess = () => {},
      onError = () => {}
    } = options;

    const customSubmissionHandler = ErrorHandlers.createSubmissionErrorHandler({
      notify,
      setLoading,
      setError,
      onSuccess
    });

    return customSubmissionHandler(submitOperation, formData);
  }, [notify, setLoading, setError]);

  const handleDatabaseOperation = useCallback(async (operation, operationName = 'database operation', context = {}) => {
    try {
      return await operation();
    } catch (error) {
      return await databaseErrorHandler.handleError(error, operationName, context);
    }
  }, [databaseErrorHandler]);

  // Enhanced user feedback functions
  const showSuccess = useCallback((title, message, options = {}) => {
    notify({
      type: 'success',
      title,
      message,
      duration: options.duration || 5000,
      ...options
    });
  }, [notify]);

  const showError = useCallback((title, message, options = {}) => {
    notify({
      type: 'error',
      title,
      message,
      duration: options.duration || 8000,
      ...options
    });
  }, [notify]);

  const showWarning = useCallback((title, message, options = {}) => {
    notify({
      type: 'warning',
      title,
      message,
      duration: options.duration || 6000,
      ...options
    });
  }, [notify]);

  const showInfo = useCallback((title, message, options = {}) => {
    notify({
      type: 'info',
      title,
      message,
      duration: options.duration || 4000,
      ...options
    });
  }, [notify]);

  // Global error handler for unhandled errors
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      showError(
        'Unexpected Error',
        'An unexpected error occurred. Please try again or contact support if the problem persists.'
      );
    };

    const handleGlobalError = (event) => {
      console.error('Global JavaScript error:', event.error);
      showError(
        'Application Error',
        'A technical error occurred. Please refresh the page and try again.'
      );
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [showError]);

  // Context value
  const contextValue = {
    // State
    loading,
    error,
    modal,
    
    // Notification system
    notifications: notificationSystem.notifications,
    notify,
    
    // Enhanced error handlers
    handleAsyncOperation,
    handleDataFetch,
    handleFormSubmission,
    handleDatabaseOperation,
    
    // User feedback functions
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // Loading management
    loadingManager,
    setLoading,
    
    // Modal management
    ...modalHandlers,
    
    // Network error handling
    handleNetworkError: networkErrorHandler,
    
    // Specialized handlers
    databaseErrorHandler,
    formSubmissionHandler,
    
    // Clear functions
    clearError: () => setError(null),
    clearNotifications: notificationSystem.clearAllNotifications
  };

  return (
    <ErrorHandlingContext.Provider value={contextValue}>
      {children}
      <NotificationDisplay notifications={notificationSystem.notifications} />
      <ErrorModal modal={modal} onClose={modalHandlers.closeModal} />
    </ErrorHandlingContext.Provider>
  );
};

/**
 * Notification Display Component
 */
const NotificationDisplay = ({ notifications }) => {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

/**
 * Individual Notification Item
 */
const NotificationItem = ({ notification }) => {
  const getNotificationStyles = (type) => {
    const baseStyles = "p-4 rounded-lg shadow-lg border-l-4 max-w-sm animate-slide-in";
    const typeStyles = {
      success: "bg-green-50 border-green-400 text-green-800",
      error: "bg-red-50 border-red-400 text-red-800",
      warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
      info: "bg-blue-50 border-blue-400 text-blue-800"
    };
    return `${baseStyles} ${typeStyles[type] || typeStyles.info}`;
  };

  const getIcon = (type) => {
    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️"
    };
    return icons[type] || icons.info;
  };

  return (
    <div className={getNotificationStyles(notification.type)}>
      <div className="flex items-start">
        <span className="text-lg mr-3 flex-shrink-0">{getIcon(notification.type)}</span>
        <div className="flex-1">
          {notification.title && (
            <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
          )}
          <p className="text-sm">{notification.message}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Error Modal Component
 */
const ErrorModal = ({ modal, onClose }) => {
  if (!modal.isOpen) return null;

  const getModalStyles = (type) => {
    const typeStyles = {
      error: "border-red-500 bg-red-50",
      success: "border-green-500 bg-green-50",
      warning: "border-yellow-500 bg-yellow-50",
      info: "border-blue-500 bg-blue-50",
      loading: "border-gray-500 bg-gray-50"
    };
    return typeStyles[type] || typeStyles.info;
  };

  const getIcon = (type) => {
    const icons = {
      error: "❌",
      success: "✅",
      warning: "⚠️",
      info: "ℹ️",
      loading: "⏳"
    };
    return icons[type] || icons.info;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 border-l-4 ${getModalStyles(modal.type)}`}>
        <div className="p-6">
          <div className="flex items-start">
            <span className="text-2xl mr-4 flex-shrink-0">{getIcon(modal.type)}</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{modal.title}</h3>
              <p className="text-gray-700 whitespace-pre-line">{modal.message}</p>
            </div>
          </div>
          {modal.type !== 'loading' && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                OK
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to use error handling context
 */
export const useErrorHandling = () => {
  const context = useContext(ErrorHandlingContext);
  if (!context) {
    throw new Error('useErrorHandling must be used within an ErrorHandlingProvider');
  }
  return context;
};

/**
 * Higher-order component to wrap components with error handling
 */
export const withErrorHandling = (WrappedComponent) => {
  return function WithErrorHandlingComponent(props) {
    return (
      <ErrorHandlingProvider>
        <WrappedComponent {...props} />
      </ErrorHandlingProvider>
    );
  };
};

export default ErrorHandlingProvider;