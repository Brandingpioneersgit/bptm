import { useState, useEffect, useRef } from 'react';
import { useSupabase } from '../components/SupabaseProvider';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useToast } from '@/shared/components/Toast';

/**
 * Custom hook for real-time data updates
 * Provides live synchronization for dashboard data, KPIs, and user actions
 */
export const useRealTimeUpdates = ({
  tables = [],
  userId = null,
  onUpdate = null,
  enableNotifications = true
} = {}) => {
  const supabase = useSupabase();
  const { authState } = useUnifiedAuth();
  const { notify } = useToast();
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);
  const subscriptionsRef = useRef([]);
  const reconnectTimeoutRef = useRef(null);
  
  const currentUserId = userId || authState.currentUser?.id || authState.userId;

  // Initialize real-time subscriptions
  useEffect(() => {
    if (!supabase || !currentUserId || tables.length === 0) return;

    const setupSubscriptions = async () => {
      try {
        // Clear existing subscriptions
        subscriptionsRef.current.forEach(subscription => {
          supabase.removeChannel(subscription);
        });
        subscriptionsRef.current = [];

        // Set up subscriptions for each table
        for (const tableConfig of tables) {
          const tableName = typeof tableConfig === 'string' ? tableConfig : tableConfig.table;
          const filter = typeof tableConfig === 'object' ? tableConfig.filter : null;
          const events = typeof tableConfig === 'object' ? tableConfig.events : ['*'];

          let channelBuilder = supabase
            .channel(`realtime:${tableName}:${currentUserId}`)
            .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: tableName,
              filter: filter || `user_id=eq.${currentUserId}`
            }, handleRealtimeUpdate);

          // Subscribe to specific events if specified
          if (events.includes('INSERT') || events.includes('*')) {
            channelBuilder = channelBuilder.on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: tableName,
              filter: filter || `user_id=eq.${currentUserId}`
            }, (payload) => handleRealtimeUpdate(payload, 'INSERT'));
          }

          if (events.includes('UPDATE') || events.includes('*')) {
            channelBuilder = channelBuilder.on('postgres_changes', {
              event: 'UPDATE',
              schema: 'public',
              table: tableName,
              filter: filter || `user_id=eq.${currentUserId}`
            }, (payload) => handleRealtimeUpdate(payload, 'UPDATE'));
          }

          if (events.includes('DELETE') || events.includes('*')) {
            channelBuilder = channelBuilder.on('postgres_changes', {
              event: 'DELETE',
              schema: 'public',
              table: tableName,
              filter: filter || `user_id=eq.${currentUserId}`
            }, (payload) => handleRealtimeUpdate(payload, 'DELETE'));
          }

          const subscription = channelBuilder.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              console.log(`✅ Real-time subscription active for ${tableName}`);
            } else if (status === 'CHANNEL_ERROR') {
              setIsConnected(false);
              console.error(`❌ Real-time subscription error for ${tableName}`);
              scheduleReconnect();
            }
          });

          subscriptionsRef.current.push(subscription);
        }

      } catch (error) {
        console.error('Error setting up real-time subscriptions:', error);
        setIsConnected(false);
        scheduleReconnect();
      }
    };

    setupSubscriptions();

    // Cleanup on unmount
    return () => {
      subscriptionsRef.current.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
      subscriptionsRef.current = [];
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [supabase, currentUserId, tables]);

  // Handle real-time updates
  const handleRealtimeUpdate = (payload, eventType = null) => {
    const updateInfo = {
      table: payload.table,
      eventType: eventType || payload.eventType,
      new: payload.new,
      old: payload.old,
      timestamp: new Date().toISOString()
    };

    setLastUpdate(updateInfo);
    setUpdateCount(prev => prev + 1);

    // Call custom update handler if provided
    if (onUpdate && typeof onUpdate === 'function') {
      onUpdate(updateInfo);
    }

    // Show notification for important updates
    if (enableNotifications) {
      showUpdateNotification(updateInfo);
    }

    console.log('📡 Real-time update received:', updateInfo);
  };

  // Show user-friendly notifications for updates
  const showUpdateNotification = (updateInfo) => {
    const { table, eventType, new: newData } = updateInfo;
    
    let message = '';
    let title = 'Data Updated';
    
    switch (table) {
      case 'employee_submissions':
        if (eventType === 'INSERT') {
          message = 'New submission recorded';
          title = 'Submission Added';
        } else if (eventType === 'UPDATE') {
          message = 'Submission updated';
          title = 'Submission Modified';
        }
        break;
        
      case 'employee_kpis':
        if (eventType === 'INSERT') {
          message = 'New KPI added';
          title = 'KPI Created';
        } else if (eventType === 'UPDATE') {
          message = 'KPI updated';
          title = 'KPI Modified';
        }
        break;
        
      case 'user_projects':
        if (eventType === 'INSERT') {
          message = `Project "${newData?.title || 'New project'}" created`;
          title = 'Project Created';
        } else if (eventType === 'UPDATE') {
          message = `Project "${newData?.title || 'Project'}" updated`;
          title = 'Project Updated';
        }
        break;
        
      case 'user_tasks':
        if (eventType === 'INSERT') {
          message = `Task "${newData?.title || 'New task'}" created`;
          title = 'Task Created';
        } else if (eventType === 'UPDATE') {
          message = `Task "${newData?.title || 'Task'}" updated`;
          title = 'Task Updated';
        }
        break;
        
      case 'performance_reviews':
        if (eventType === 'INSERT') {
          message = 'New performance review available';
          title = 'Review Added';
        } else if (eventType === 'UPDATE') {
          message = 'Performance review updated';
          title = 'Review Updated';
        }
        break;
        
      default:
        message = `${table} data updated`;
        title = 'Data Updated';
    }

    if (message) {
      notify({
        type: 'info',
        title,
        message,
        duration: 3000
      });
    }
  };

  // Schedule reconnection attempt
  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Attempting to reconnect real-time subscriptions...');
      setIsConnected(false);
      // The useEffect will trigger a new setup when isConnected changes
    }, 5000); // Retry after 5 seconds
  };

  // Manual refresh function
  const refresh = () => {
    setUpdateCount(prev => prev + 1);
    setLastUpdate({
      table: 'manual_refresh',
      eventType: 'REFRESH',
      timestamp: new Date().toISOString()
    });
  };

  // Get connection status
  const getConnectionStatus = () => {
    return {
      isConnected,
      lastUpdate,
      updateCount,
      subscribedTables: tables.map(t => typeof t === 'string' ? t : t.table)
    };
  };

  return {
    isConnected,
    lastUpdate,
    updateCount,
    refresh,
    getConnectionStatus
  };
};

/**
 * Hook for real-time KPI updates
 */
export const useRealTimeKPIs = (userId = null) => {
  return useRealTimeUpdates({
    tables: [
      'employee_kpis',
      'employee_submissions',
      'performance_reviews'
    ],
    userId,
    enableNotifications: true
  });
};

/**
 * Hook for real-time project updates
 */
export const useRealTimeProjects = (userId = null) => {
  return useRealTimeUpdates({
    tables: [
      'user_projects',
      'user_tasks',
      'project_collaborators'
    ],
    userId,
    enableNotifications: true
  });
};

/**
 * Hook for real-time dashboard updates
 */
export const useRealTimeDashboard = (userId = null) => {
  return useRealTimeUpdates({
    tables: [
      'employee_submissions',
      'employee_kpis',
      'performance_reviews',
      'user_projects',
      'user_tasks',
      'dashboard_usage'
    ],
    userId,
    enableNotifications: false // Reduce notification noise for dashboard
  });
};

/**
 * Hook for real-time notifications
 */
export const useRealTimeNotifications = (userId = null) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { lastUpdate } = useRealTimeUpdates({
    tables: [
      'performance_reviews',
      'employee_feedback',
      'user_tasks',
      'project_collaborators'
    ],
    userId,
    enableNotifications: false,
    onUpdate: (updateInfo) => {
      // Create notification object
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: getNotificationTitle(updateInfo),
        message: getNotificationMessage(updateInfo),
        type: getNotificationType(updateInfo),
        timestamp: updateInfo.timestamp,
        read: false,
        data: updateInfo
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
      setUnreadCount(prev => prev + 1);
    }
  });
  
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };
  
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };
  
  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
};

// Helper functions for notifications
const getNotificationTitle = (updateInfo) => {
  const { table, eventType } = updateInfo;
  
  switch (table) {
    case 'performance_reviews':
      return eventType === 'INSERT' ? 'New Performance Review' : 'Review Updated';
    case 'employee_feedback':
      return eventType === 'INSERT' ? 'New Feedback' : 'Feedback Updated';
    case 'user_tasks':
      return eventType === 'INSERT' ? 'New Task Assigned' : 'Task Updated';
    case 'project_collaborators':
      return 'Project Collaboration';
    default:
      return 'Update Available';
  }
};

const getNotificationMessage = (updateInfo) => {
  const { table, eventType, new: newData } = updateInfo;
  
  switch (table) {
    case 'performance_reviews':
      return eventType === 'INSERT' 
        ? 'A new performance review has been submitted'
        : 'Your performance review has been updated';
    case 'employee_feedback':
      return eventType === 'INSERT'
        ? 'New feedback has been received'
        : 'Feedback has been updated';
    case 'user_tasks':
      return eventType === 'INSERT'
        ? `New task: ${newData?.title || 'Untitled'}`
        : `Task updated: ${newData?.title || 'Untitled'}`;
    case 'project_collaborators':
      return eventType === 'INSERT'
        ? 'You have been added to a project'
        : 'Project collaboration updated';
    default:
      return 'Data has been updated';
  }
};

const getNotificationType = (updateInfo) => {
  const { table, eventType } = updateInfo;
  
  if (table === 'performance_reviews' || table === 'employee_feedback') {
    return 'info';
  }
  
  if (table === 'user_tasks' && eventType === 'INSERT') {
    return 'warning';
  }
  
  return 'info';
};

export default useRealTimeUpdates;