import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for auto-save functionality in forms
 * @param {Object} formData - The form data to auto-save
 * @param {string} storageKey - Key for localStorage/sessionStorage
 * @param {number} delay - Debounce delay in milliseconds (default: 1000)
 * @param {boolean} useSessionStorage - Use sessionStorage instead of localStorage (default: false)
 * @returns {Object} Auto-save state and utilities
 */
export const useAutoSave = (formData, storageKey, delay = 1000, useSessionStorage = false) => {
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  
  const timeoutRef = useRef(null);
  const previousDataRef = useRef(null);
  const storage = useSessionStorage ? sessionStorage : localStorage;

  // Save to storage
  const saveToStorage = useCallback(async (data) => {
    try {
      setIsAutoSaving(true);
      setAutoSaveStatus('saving');
      
      // Simulate async save (can be replaced with API call)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      storage.setItem(storageKey, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }));
      
      setLastAutoSave(new Date());
      setAutoSaveStatus('saved');
      
      // Reset to idle after showing saved status
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
      
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    } finally {
      setIsAutoSaving(false);
    }
  }, [storageKey, storage]);

  // Load from storage
  const loadFromStorage = useCallback(() => {
    try {
      const saved = storage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          data: parsed.data,
          timestamp: parsed.timestamp,
          version: parsed.version
        };
      }
    } catch (error) {
      console.error('Failed to load auto-saved data:', error);
    }
    return null;
  }, [storageKey, storage]);

  // Clear auto-saved data
  const clearAutoSave = useCallback(() => {
    try {
      storage.removeItem(storageKey);
      setLastAutoSave(null);
      setAutoSaveStatus('idle');
    } catch (error) {
      console.error('Failed to clear auto-saved data:', error);
    }
  }, [storageKey, storage]);

  // Force save (bypass debounce)
  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveToStorage(formData);
  }, [formData, saveToStorage]);

  // Auto-save effect with debouncing
  useEffect(() => {
    // Skip if data hasn't changed
    if (previousDataRef.current && 
        JSON.stringify(previousDataRef.current) === JSON.stringify(formData)) {
      return;
    }

    previousDataRef.current = formData;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      if (formData && Object.keys(formData).length > 0) {
        saveToStorage(formData);
      }
    }, delay);

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, delay, saveToStorage]);

  // Check if auto-save data exists
  const hasAutoSavedData = useCallback(() => {
    try {
      return !!storage.getItem(storageKey);
    } catch {
      return false;
    }
  }, [storageKey, storage]);

  // Get auto-save age (how old the saved data is)
  const getAutoSaveAge = useCallback(() => {
    const saved = loadFromStorage();
    if (saved && saved.timestamp) {
      return new Date() - new Date(saved.timestamp);
    }
    return null;
  }, [loadFromStorage]);

  // Format auto-save status for display
  const getStatusMessage = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastAutoSave ? `Saved at ${lastAutoSave.toLocaleTimeString()}` : 'Saved';
      case 'error':
        return 'Failed to save';
      default:
        return '';
    }
  };

  return {
    // State
    isAutoSaving,
    lastAutoSave,
    autoSaveStatus,
    
    // Actions
    loadFromStorage,
    clearAutoSave,
    forceSave,
    
    // Utilities
    hasAutoSavedData,
    getAutoSaveAge,
    getStatusMessage
  };
};