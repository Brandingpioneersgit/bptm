/**
 * useButtonState Hook
 * 
 * A custom hook for managing button states including loading, disabled,
 * and preventing duplicate clicks across complex operations.
 */

import { useState, useCallback, useRef } from 'react';

export const useButtonState = (initialStates = {}) => {
  const [buttonStates, setButtonStates] = useState({
    loading: false,
    disabled: false,
    error: null,
    success: false,
    ...initialStates
  });

  const timeoutRefs = useRef({});

  // Set loading state for a button
  const setLoading = useCallback((isLoading, buttonId = 'default') => {
    setButtonStates(prev => ({
      ...prev,
      [`${buttonId}_loading`]: isLoading
    }));
  }, []);

  // Set disabled state for a button
  const setDisabled = useCallback((isDisabled, buttonId = 'default') => {
    setButtonStates(prev => ({
      ...prev,
      [`${buttonId}_disabled`]: isDisabled
    }));
  }, []);

  // Set error state for a button
  const setError = useCallback((error, buttonId = 'default', duration = 3000) => {
    setButtonStates(prev => ({
      ...prev,
      [`${buttonId}_error`]: error
    }));

    // Clear error after duration
    if (duration > 0) {
      if (timeoutRefs.current[`${buttonId}_error`]) {
        clearTimeout(timeoutRefs.current[`${buttonId}_error`]);
      }
      
      timeoutRefs.current[`${buttonId}_error`] = setTimeout(() => {
        setButtonStates(prev => ({
          ...prev,
          [`${buttonId}_error`]: null
        }));
      }, duration);
    }
  }, []);

  // Set success state for a button
  const setSuccess = useCallback((isSuccess, buttonId = 'default', duration = 2000) => {
    setButtonStates(prev => ({
      ...prev,
      [`${buttonId}_success`]: isSuccess
    }));

    // Clear success after duration
    if (duration > 0 && isSuccess) {
      if (timeoutRefs.current[`${buttonId}_success`]) {
        clearTimeout(timeoutRefs.current[`${buttonId}_success`]);
      }
      
      timeoutRefs.current[`${buttonId}_success`] = setTimeout(() => {
        setButtonStates(prev => ({
          ...prev,
          [`${buttonId}_success`]: false
        }));
      }, duration);
    }
  }, []);

  // Get state for a specific button
  const getButtonState = useCallback((buttonId = 'default') => {
    return {
      loading: buttonStates[`${buttonId}_loading`] || false,
      disabled: buttonStates[`${buttonId}_disabled`] || false,
      error: buttonStates[`${buttonId}_error`] || null,
      success: buttonStates[`${buttonId}_success`] || false
    };
  }, [buttonStates]);

  // Reset all states for a button
  const resetButtonState = useCallback((buttonId = 'default') => {
    // Clear any timeouts
    Object.keys(timeoutRefs.current).forEach(key => {
      if (key.startsWith(buttonId)) {
        clearTimeout(timeoutRefs.current[key]);
        delete timeoutRefs.current[key];
      }
    });

    setButtonStates(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        if (key.startsWith(buttonId)) {
          delete newState[key];
        }
      });
      return newState;
    });
  }, []);

  // Execute an async operation with automatic state management
  const executeWithState = useCallback(async (
    operation,
    buttonId = 'default',
    options = {}
  ) => {
    const {
      loadingText = null,
      successText = null,
      errorText = null,
      successDuration = 2000,
      errorDuration = 3000,
      onSuccess = null,
      onError = null
    } = options;

    try {
      setLoading(true, buttonId);
      setError(null, buttonId);
      setSuccess(false, buttonId);

      const result = await operation();

      setSuccess(true, buttonId, successDuration);
      
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      console.error(`Button operation failed (${buttonId}):`, error);
      
      setError(error.message || errorText || 'Operation failed', buttonId, errorDuration);
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    } finally {
      setLoading(false, buttonId);
    }
  }, [setLoading, setError, setSuccess]);

  // Create a button handler with state management
  const createButtonHandler = useCallback((
    operation,
    buttonId = 'default',
    options = {}
  ) => {
    return async (e) => {
      e.preventDefault();
      
      const currentState = getButtonState(buttonId);
      if (currentState.loading || currentState.disabled) {
        return;
      }

      return executeWithState(operation, buttonId, options);
    };
  }, [executeWithState, getButtonState]);

  // Cleanup function
  const cleanup = useCallback(() => {
    Object.values(timeoutRefs.current).forEach(timeout => {
      clearTimeout(timeout);
    });
    timeoutRefs.current = {};
  }, []);

  return {
    buttonStates,
    setLoading,
    setDisabled,
    setError,
    setSuccess,
    getButtonState,
    resetButtonState,
    executeWithState,
    createButtonHandler,
    cleanup
  };
};