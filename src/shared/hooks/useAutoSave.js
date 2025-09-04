import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Custom hook for auto-saving form data to localStorage
 * @param {Object} data - The data to auto-save
 * @param {string} key - Unique key for localStorage
 * @param {boolean} enabled - Whether auto-save is enabled
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 2000)
 * @param {Function} onSave - Optional callback when save occurs
 * @param {Function} onError - Optional callback when save fails
 * @returns {Object} Auto-save utilities
 */
export function useAutoSave(data, key, enabled = true, debounceMs = 2000, onSave, onError) {
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const timeoutRef = useRef(null);
  const dataRef = useRef(data);
  const enabledRef = useRef(enabled);

  // Update refs to avoid stale closures
  useEffect(() => {
    dataRef.current = data;
    enabledRef.current = enabled;
  }, [data, enabled]);

  const saveToStorage = useCallback(async () => {
    if (!enabledRef.current || !key) {
      return false;
    }

    try {
      setIsSaving(true);
      
      const saveData = {
        ...dataRef.current,
        lastSaved: new Date().toISOString(),
        sessionInfo: {
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          url: window.location.href
        }
      };

      localStorage.setItem(key, JSON.stringify(saveData));
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      if (onSave) {
        onSave(saveData);
      }
      
      console.log('💾 Auto-save successful:', key);
      return true;
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      if (onError) {
        onError(error);
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [key, onSave, onError]);

  const debouncedSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveToStorage();
    }, debounceMs);
  }, [saveToStorage, debounceMs]);

  // Auto-save when data changes
  useEffect(() => {
    if (enabled && key && data) {
      setHasUnsavedChanges(true);
      debouncedSave();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, key, debouncedSave]);

  // Load saved data
  const loadSavedData = useCallback(() => {
    if (!key) return null;

    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsedData = JSON.parse(saved);
        console.log('📄 Loaded saved data:', key);
        return parsedData;
      }
    } catch (error) {
      console.error('❌ Failed to load saved data:', error);
    }
    return null;
  }, [key]);

  // Clear saved data
  const clearSavedData = useCallback(() => {
    if (!key) return;

    try {
      localStorage.removeItem(key);
      setLastSaved(null);
      setHasUnsavedChanges(false);
      console.log('🗑️ Cleared saved data:', key);
    } catch (error) {
      console.error('❌ Failed to clear saved data:', error);
    }
  }, [key]);

  // Manual save
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return await saveToStorage();
  }, [saveToStorage]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && enabled && key) {
        try {
          const emergencyData = {
            ...dataRef.current,
            lastSaved: new Date().toISOString(),
            emergencySave: true
          };
          localStorage.setItem(key, JSON.stringify(emergencyData));
          console.log('💾 Emergency save on page unload');
        } catch (error) {
          console.error('❌ Emergency save failed:', error);
        }

        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, enabled, key]);

  return {
    lastSaved,
    isSaving,
    hasUnsavedChanges,
    saveNow,
    loadSavedData,
    clearSavedData,
    isEnabled: enabled && !!key
  };
}

/**
 * Hook for creating auto-save keys based on form data
 * @param {string} prefix - Key prefix
 * @param {Object} identifiers - Object with identifying data
 * @returns {string|null} Generated key or null if identifiers are incomplete
 */
export function useAutoSaveKey(prefix, identifiers) {
  return useCallback(() => {
    if (!prefix || !identifiers) return null;
    
    const keyParts = [prefix];
    
    Object.entries(identifiers).forEach(([key, value]) => {
      if (value) {
        keyParts.push(`${key}-${value}`);
      }
    });
    
    // Only return key if we have meaningful identifiers
    if (keyParts.length > 1) {
      return keyParts.join('_');
    }
    
    return null;
  }, [prefix, identifiers])();
}