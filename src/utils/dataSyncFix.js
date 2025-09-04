/**
 * Data Sync Fix Utility
 * 
 * This utility addresses data synchronization issues between form submissions
 * and dashboard displays by providing enhanced sync mechanisms and ensuring
 * proper data flow throughout the application.
 */

import { useCallback, useEffect, useRef } from 'react';

/**
 * Enhanced data sync manager that ensures dashboards update when new data is submitted
 */
export class DataSyncManager {
  constructor() {
    this.subscribers = new Map();
    this.pendingUpdates = new Set();
    this.lastSyncTime = Date.now();
    this.syncQueue = [];
    this.isProcessing = false;
  }

  /**
   * Subscribe to data changes
   */
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  /**
   * Notify all subscribers of data changes
   */
  notify(key, data, metadata = {}) {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data, metadata);
        } catch (error) {
          console.error(`Data sync callback error for ${key}:`, error);
        }
      });
    }
  }

  /**
   * Queue a sync operation
   */
  queueSync(operation) {
    this.syncQueue.push({
      ...operation,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    });
    
    this.processSyncQueue();
  }

  /**
   * Process queued sync operations
   */
  async processSyncQueue() {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.syncQueue.length > 0) {
        const operation = this.syncQueue.shift();
        await this.executeOperation(operation);
      }
    } catch (error) {
      console.error('Sync queue processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a sync operation
   */
  async executeOperation(operation) {
    const { type, data, callback, retries = 3 } = operation;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (callback) {
          await callback(data);
        }
        
        // Notify subscribers
        this.notify(type, data, { 
          operation: type, 
          timestamp: Date.now(),
          attempt 
        });
        
        return; // Success, exit retry loop
      } catch (error) {
        console.error(`Sync operation ${type} failed (attempt ${attempt}/${retries}):`, error);
        
        if (attempt === retries) {
          // Final attempt failed, notify error
          this.notify(`${type}_error`, error, { 
            operation: type, 
            data, 
            finalAttempt: true 
          });
          throw error;
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Force refresh all data
   */
  forceRefresh() {
    this.notify('force_refresh', { timestamp: Date.now() });
  }

  /**
   * Clear all pending operations
   */
  clearPending() {
    this.syncQueue.length = 0;
    this.pendingUpdates.clear();
  }
}

// Global sync manager instance
export const globalSyncManager = new DataSyncManager();

/**
 * Hook for enhanced data synchronization
 */
export function useEnhancedDataSync({
  dataType,
  fetchFunction,
  dependencies = [],
  autoRefresh = true,
  refreshInterval = 30000
}) {
  const dataRef = useRef([]);
  const lastFetchRef = useRef(0);
  const mountedRef = useRef(true);

  // Subscribe to global sync events
  useEffect(() => {
    const unsubscribeRefresh = globalSyncManager.subscribe('force_refresh', () => {
      if (mountedRef.current && fetchFunction) {
        fetchFunction(true); // Force refresh
      }
    });

    const unsubscribeDataType = globalSyncManager.subscribe(dataType, (newData) => {
      if (mountedRef.current) {
        dataRef.current = newData;
      }
    });

    return () => {
      unsubscribeRefresh();
      unsubscribeDataType();
    };
  }, [dataType, fetchFunction]);

  // Auto-refresh mechanism
  useEffect(() => {
    if (!autoRefresh || !fetchFunction) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastFetchRef.current > refreshInterval) {
        fetchFunction(false); // Regular refresh
        lastFetchRef.current = now;
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchFunction, refreshInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data: dataRef.current,
    forceRefresh: () => globalSyncManager.forceRefresh(),
    queueSync: (operation) => globalSyncManager.queueSync(operation)
  };
}

/**
 * Enhanced submission handler that ensures proper data sync
 */
export function createSubmissionHandler({
  supabase,
  dataSync,
  onSuccess,
  onError
}) {
  return async (submissionData, options = {}) => {
    const { 
      tableName = 'submissions',
      operation = 'insert',
      skipSync = false 
    } = options;

    try {
      let result;
      
      if (operation === 'update' && submissionData.id) {
        const { data, error } = await supabase
          .from(tableName)
          .update(submissionData)
          .eq('id', submissionData.id)
          .select();
        
        if (error) throw error;
        result = data?.[0];
      } else {
        const { data, error } = await supabase
          .from(tableName)
          .insert([submissionData])
          .select();
        
        if (error) throw error;
        result = data?.[0];
      }

      if (!skipSync && result) {
        // Queue sync operations
        globalSyncManager.queueSync({
          type: 'submission_added',
          data: result,
          callback: async (data) => {
            if (dataSync?.addSubmission) {
              await dataSync.addSubmission(data);
            }
          }
        });

        // Force refresh after a short delay
        setTimeout(() => {
          globalSyncManager.forceRefresh();
        }, 500);
      }

      if (onSuccess) {
        onSuccess(result);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Submission handler error:', error);
      
      if (onError) {
        onError(error);
      }

      return { success: false, error };
    }
  };
}

/**
 * Dashboard refresh utility
 */
export function createDashboardRefresher(dependencies = []) {
  const refreshCallbacks = useRef(new Set());

  const registerRefreshCallback = useCallback((callback) => {
    refreshCallbacks.current.add(callback);
    return () => refreshCallbacks.current.delete(callback);
  }, []);

  const triggerRefresh = useCallback((force = false) => {
    refreshCallbacks.current.forEach(callback => {
      try {
        callback(force);
      } catch (error) {
        console.error('Dashboard refresh callback error:', error);
      }
    });
  }, []);

  // Subscribe to global refresh events
  useEffect(() => {
    return globalSyncManager.subscribe('force_refresh', () => {
      triggerRefresh(true);
    });
  }, [triggerRefresh]);

  return {
    registerRefreshCallback,
    triggerRefresh
  };
}

/**
 * Utility to fix common sync issues
 */
export const syncFixUtils = {
  /**
   * Ensure data consistency between different data sources
   */
  reconcileData(primaryData, secondaryData, keyField = 'id') {
    const primaryMap = new Map(primaryData.map(item => [item[keyField], item]));
    const reconciled = [...primaryData];
    
    secondaryData.forEach(item => {
      if (!primaryMap.has(item[keyField])) {
        reconciled.push(item);
      }
    });
    
    return reconciled.sort((a, b) => {
      const aTime = new Date(a.created_at || a.createdAt || 0).getTime();
      const bTime = new Date(b.created_at || b.createdAt || 0).getTime();
      return bTime - aTime; // Most recent first
    });
  },

  /**
   * Debounce function for reducing excessive sync calls
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Create a sync-aware data fetcher
   */
  createSyncAwareFetcher(fetchFunction, dataType) {
    const debouncedFetch = this.debounce(fetchFunction, 1000);
    
    return {
      fetch: debouncedFetch,
      subscribe: (callback) => globalSyncManager.subscribe(dataType, callback),
      notify: (data) => globalSyncManager.notify(dataType, data)
    };
  }
};