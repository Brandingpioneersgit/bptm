/**
 * Shared Notification Utilities
 * Provides standardized notification patterns and toast management
 */

import { useState, useCallback, useRef } from 'react';

/**
 * Notification types and configurations
 */
export const NotificationTypes = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

export const NotificationDurations = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
  PERSISTENT: 0
};

/**
 * Notification handlers
 */
export const NotificationHandlers = {
  /**
   * Create a standardized notification system
   */
  createNotificationSystem: ({
    maxNotifications = 5,
    defaultDuration = NotificationDurations.MEDIUM,
    position = 'top-right'
  } = {}) => {
    return () => {
      const [notifications, setNotifications] = useState([]);
      const notificationId = useRef(0);
      const timeouts = useRef(new Map());
      
      const addNotification = useCallback(({
        type = NotificationTypes.INFO,
        title,
        message,
        duration = defaultDuration,
        action = null,
        persistent = false
      }) => {
        const id = ++notificationId.current;
        const notification = {
          id,
          type,
          title,
          message,
          duration: persistent ? 0 : duration,
          action,
          timestamp: Date.now()
        };
        
        setNotifications(prev => {
          const updated = [notification, ...prev];
          // Limit number of notifications
          return updated.slice(0, maxNotifications);
        });
        
        // Auto-remove if not persistent
        if (!persistent && duration > 0) {
          const timeoutId = setTimeout(() => {
            removeNotification(id);
          }, duration);
          timeouts.current.set(id, timeoutId);
        }
        
        return id;
      }, [defaultDuration, maxNotifications]);
      
      const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        
        // Clear timeout if exists
        const timeoutId = timeouts.current.get(id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeouts.current.delete(id);
        }
      }, []);
      
      const clearAllNotifications = useCallback(() => {
        setNotifications([]);
        
        // Clear all timeouts
        timeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
        timeouts.current.clear();
      }, []);
      
      // Convenience methods for different types
      const showSuccess = useCallback((title, message, options = {}) => {
        return addNotification({
          type: NotificationTypes.SUCCESS,
          title,
          message,
          ...options
        });
      }, [addNotification]);
      
      const showError = useCallback((title, message, options = {}) => {
        return addNotification({
          type: NotificationTypes.ERROR,
          title,
          message,
          duration: NotificationDurations.LONG,
          ...options
        });
      }, [addNotification]);
      
      const showWarning = useCallback((title, message, options = {}) => {
        return addNotification({
          type: NotificationTypes.WARNING,
          title,
          message,
          ...options
        });
      }, [addNotification]);
      
      const showInfo = useCallback((title, message, options = {}) => {
        return addNotification({
          type: NotificationTypes.INFO,
          title,
          message,
          ...options
        });
      }, [addNotification]);
      
      return {
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        position
      };
    };
  },

  /**
   * Create a simple toast system
   */
  createToastSystem: ({
    defaultDuration = NotificationDurations.SHORT
  } = {}) => {
    return () => {
      const [toasts, setToasts] = useState([]);
      const toastId = useRef(0);
      
      const showToast = useCallback((message, type = NotificationTypes.INFO, duration = defaultDuration) => {
        const id = ++toastId.current;
        const toast = {
          id,
          message,
          type,
          timestamp: Date.now()
        };
        
        setToasts(prev => [...prev, toast]);
        
        if (duration > 0) {
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
          }, duration);
        }
        
        return id;
      }, [defaultDuration]);
      
      const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, []);
      
      return {
        toasts,
        showToast,
        removeToast,
        showSuccess: (message, duration) => showToast(message, NotificationTypes.SUCCESS, duration),
        showError: (message, duration) => showToast(message, NotificationTypes.ERROR, duration),
        showWarning: (message, duration) => showToast(message, NotificationTypes.WARNING, duration),
        showInfo: (message, duration) => showToast(message, NotificationTypes.INFO, duration)
      };
    };
  }
};

/**
 * Feedback patterns
 */
export const FeedbackHandlers = {
  /**
   * Create standardized feedback collection system
   */
  createFeedbackSystem: ({
    onSubmit,
    notify,
    categories = ['General', 'Bug Report', 'Feature Request', 'Performance']
  }) => {
    return () => {
      const [feedback, setFeedback] = useState({
        category: categories[0],
        message: '',
        rating: null,
        email: ''
      });
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [submitted, setSubmitted] = useState(false);
      
      const updateFeedback = useCallback((field, value) => {
        setFeedback(prev => ({ ...prev, [field]: value }));
      }, []);
      
      const submitFeedback = useCallback(async () => {
        if (!feedback.message.trim()) {
          notify?.('Please provide feedback message', 'error');
          return;
        }
        
        setIsSubmitting(true);
        
        try {
          await onSubmit(feedback);
          setSubmitted(true);
          setFeedback({
            category: categories[0],
            message: '',
            rating: null,
            email: ''
          });
          notify?.('Thank you for your feedback!', 'success');
        } catch (error) {
          console.error('Failed to submit feedback:', error);
          notify?.('Failed to submit feedback. Please try again.', 'error');
        } finally {
          setIsSubmitting(false);
        }
      }, [feedback, onSubmit, notify, categories]);
      
      const resetFeedback = useCallback(() => {
        setFeedback({
          category: categories[0],
          message: '',
          rating: null,
          email: ''
        });
        setSubmitted(false);
      }, [categories]);
      
      return {
        feedback,
        updateFeedback,
        submitFeedback,
        resetFeedback,
        isSubmitting,
        submitted,
        categories
      };
    };
  },

  /**
   * Create rating system
   */
  createRatingSystem: ({
    maxRating = 5,
    allowHalfRatings = false,
    onChange = null
  } = {}) => {
    return () => {
      const [rating, setRating] = useState(0);
      const [hoverRating, setHoverRating] = useState(0);
      
      const updateRating = useCallback((newRating) => {
        const finalRating = allowHalfRatings ? newRating : Math.ceil(newRating);
        setRating(finalRating);
        onChange?.(finalRating);
      }, [allowHalfRatings, onChange]);
      
      const handleMouseEnter = useCallback((value) => {
        setHoverRating(value);
      }, []);
      
      const handleMouseLeave = useCallback(() => {
        setHoverRating(0);
      }, []);
      
      return {
        rating,
        hoverRating,
        maxRating,
        allowHalfRatings,
        updateRating,
        handleMouseEnter,
        handleMouseLeave,
        displayRating: hoverRating || rating
      };
    };
  }
};

/**
 * Progress indicators
 */
export const ProgressHandlers = {
  /**
   * Create progress tracking system
   */
  createProgressTracker: ({
    steps = [],
    onStepChange = null
  } = {}) => {
    return () => {
      const [currentStep, setCurrentStep] = useState(0);
      const [completedSteps, setCompletedSteps] = useState(new Set());
      const [stepData, setStepData] = useState({});
      
      const goToStep = useCallback((stepIndex) => {
        if (stepIndex >= 0 && stepIndex < steps.length) {
          setCurrentStep(stepIndex);
          onStepChange?.(stepIndex, steps[stepIndex]);
        }
      }, [steps, onStepChange]);
      
      const nextStep = useCallback(() => {
        if (currentStep < steps.length - 1) {
          setCompletedSteps(prev => new Set([...prev, currentStep]));
          goToStep(currentStep + 1);
        }
      }, [currentStep, steps.length, goToStep]);
      
      const prevStep = useCallback(() => {
        if (currentStep > 0) {
          goToStep(currentStep - 1);
        }
      }, [currentStep, goToStep]);
      
      const completeStep = useCallback((stepIndex = currentStep) => {
        setCompletedSteps(prev => new Set([...prev, stepIndex]));
      }, [currentStep]);
      
      const updateStepData = useCallback((stepIndex, data) => {
        setStepData(prev => ({
          ...prev,
          [stepIndex]: { ...prev[stepIndex], ...data }
        }));
      }, []);
      
      const resetProgress = useCallback(() => {
        setCurrentStep(0);
        setCompletedSteps(new Set());
        setStepData({});
      }, []);
      
      return {
        currentStep,
        completedSteps,
        stepData,
        steps,
        goToStep,
        nextStep,
        prevStep,
        completeStep,
        updateStepData,
        resetProgress,
        isFirstStep: currentStep === 0,
        isLastStep: currentStep === steps.length - 1,
        progress: steps.length > 0 ? (currentStep / (steps.length - 1)) * 100 : 0,
        isStepCompleted: (stepIndex) => completedSteps.has(stepIndex)
      };
    };
  }
};

/**
 * Simple notify function for basic notifications
 * Can be used with react-hot-toast or any toast library
 */
export const notify = {
  success: (message) => {
    console.log('✅ Success:', message);
    // TODO: Integrate with actual toast library
  },
  error: (message) => {
    console.error('❌ Error:', message);
    // TODO: Integrate with actual toast library
  },
  warning: (message) => {
    console.warn('⚠️ Warning:', message);
    // TODO: Integrate with actual toast library
  },
  info: (message) => {
    console.info('ℹ️ Info:', message);
    // TODO: Integrate with actual toast library
  }
};

export default {
  NotificationTypes,
  NotificationDurations,
  NotificationHandlers,
  FeedbackHandlers,
  ProgressHandlers,
  notify
};