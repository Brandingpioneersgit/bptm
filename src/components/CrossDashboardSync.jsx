import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from '@/shared/hooks/useToast';

// Cross Dashboard Sync Context
const CrossDashboardSyncContext = createContext();

// Provider Component
export const CrossDashboardSyncProvider = ({ children }) => {
  const [syncData, setSyncData] = useState({
    notifications: [],
    updates: [],
    lastSync: null
  });
  const { toast } = useToast();

  const notify = useCallback((message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString()
    };
    
    setSyncData(prev => ({
      ...prev,
      notifications: [...prev.notifications, notification],
      lastSync: new Date().toISOString()
    }));
    
    // Show toast notification
    toast({
      title: message,
      variant: type === 'error' ? 'destructive' : 'default'
    });
  }, [toast]);

  const syncUpdate = useCallback((updateData) => {
    setSyncData(prev => ({
      ...prev,
      updates: [...prev.updates, {
        id: Date.now(),
        data: updateData,
        timestamp: new Date().toISOString()
      }],
      lastSync: new Date().toISOString()
    }));
  }, []);

  const clearNotifications = useCallback(() => {
    setSyncData(prev => ({
      ...prev,
      notifications: []
    }));
  }, []);

  const getLatestUpdates = useCallback((limit = 10) => {
    return syncData.updates
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }, [syncData.updates]);

  const value = {
    syncData,
    notify,
    syncUpdate,
    clearNotifications,
    getLatestUpdates
  };

  return (
    <CrossDashboardSyncContext.Provider value={value}>
      {children}
    </CrossDashboardSyncContext.Provider>
  );
};

// Hook to use the context
export const useCrossDashboardSync = () => {
  const context = useContext(CrossDashboardSyncContext);
  if (!context) {
    throw new Error('useCrossDashboardSync must be used within a CrossDashboardSyncProvider');
  }
  return context;
};

export default CrossDashboardSyncProvider;