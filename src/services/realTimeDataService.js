import { createClient } from '@supabase/supabase-js';

/**
 * Real-time Data Synchronization Service
 * Provides centralized real-time data management and synchronization
 */
class RealTimeDataService {
  constructor() {
    this.supabase = null;
    this.subscriptions = new Map();
    this.dataCache = new Map();
    this.listeners = new Map();
    this.isInitialized = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Initialize the service with Supabase client
   */
  initialize(supabaseClient) {
    this.supabase = supabaseClient;
    this.isInitialized = true;
    console.log('🚀 Real-time data service initialized');
  }

  /**
   * Subscribe to real-time updates for specific data types
   */
  async subscribe(dataType, userId, options = {}) {
    if (!this.isInitialized || !this.supabase) {
      throw new Error('Real-time service not initialized');
    }

    const subscriptionKey = `${dataType}_${userId}`;
    
    // If already subscribed, return existing subscription
    if (this.subscriptions.has(subscriptionKey)) {
      return this.subscriptions.get(subscriptionKey);
    }

    try {
      const config = this.getDataTypeConfig(dataType);
      const channel = this.supabase
        .channel(`realtime:${dataType}:${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: config.table,
          filter: config.filter ? config.filter.replace('{userId}', userId) : `user_id=eq.${userId}`
        }, (payload) => {
          this.handleRealtimeUpdate(dataType, payload, userId);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Subscribed to ${dataType} updates for user ${userId}`);
            this.reconnectAttempts = 0;
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`❌ Subscription error for ${dataType}`);
            this.handleSubscriptionError(subscriptionKey, dataType, userId, options);
          }
        });

      this.subscriptions.set(subscriptionKey, {
        channel,
        dataType,
        userId,
        options,
        createdAt: new Date()
      });

      // Initialize data cache for this subscription
      await this.initializeDataCache(dataType, userId, config);

      return channel;
    } catch (error) {
      console.error(`Error subscribing to ${dataType}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribe(dataType, userId) {
    const subscriptionKey = `${dataType}_${userId}`;
    const subscription = this.subscriptions.get(subscriptionKey);
    
    if (subscription) {
      this.supabase.removeChannel(subscription.channel);
      this.subscriptions.delete(subscriptionKey);
      this.dataCache.delete(subscriptionKey);
      console.log(`🔌 Unsubscribed from ${dataType} updates`);
    }
  }

  /**
   * Get cached data for a specific data type
   */
  getCachedData(dataType, userId) {
    const cacheKey = `${dataType}_${userId}`;
    return this.dataCache.get(cacheKey) || null;
  }

  /**
   * Add listener for data updates
   */
  addListener(dataType, userId, callback) {
    const listenerKey = `${dataType}_${userId}`;
    if (!this.listeners.has(listenerKey)) {
      this.listeners.set(listenerKey, new Set());
    }
    this.listeners.get(listenerKey).add(callback);
  }

  /**
   * Remove listener for data updates
   */
  removeListener(dataType, userId, callback) {
    const listenerKey = `${dataType}_${userId}`;
    const listeners = this.listeners.get(listenerKey);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(listenerKey);
      }
    }
  }

  /**
   * Manually refresh data for a specific type
   */
  async refreshData(dataType, userId) {
    const config = this.getDataTypeConfig(dataType);
    await this.initializeDataCache(dataType, userId, config);
    this.notifyListeners(dataType, userId, {
      type: 'REFRESH',
      data: this.getCachedData(dataType, userId)
    });
  }

  /**
   * Handle real-time updates
   */
  handleRealtimeUpdate(dataType, payload, userId) {
    const cacheKey = `${dataType}_${userId}`;
    const currentData = this.dataCache.get(cacheKey) || [];
    
    let updatedData = [...currentData];
    
    switch (payload.eventType) {
      case 'INSERT':
        updatedData.push(payload.new);
        break;
        
      case 'UPDATE':
        const updateIndex = updatedData.findIndex(item => item.id === payload.new.id);
        if (updateIndex !== -1) {
          updatedData[updateIndex] = payload.new;
        }
        break;
        
      case 'DELETE':
        updatedData = updatedData.filter(item => item.id !== payload.old.id);
        break;
    }
    
    // Update cache
    this.dataCache.set(cacheKey, updatedData);
    
    // Notify listeners
    this.notifyListeners(dataType, userId, {
      type: payload.eventType,
      data: updatedData,
      payload
    });
    
    console.log(`📡 ${dataType} data updated:`, payload.eventType);
  }

  /**
   * Notify all listeners of data changes
   */
  notifyListeners(dataType, userId, updateInfo) {
    const listenerKey = `${dataType}_${userId}`;
    const listeners = this.listeners.get(listenerKey);
    
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(updateInfo);
        } catch (error) {
          console.error('Error in listener callback:', error);
        }
      });
    }
  }

  /**
   * Handle subscription errors and attempt reconnection
   */
  async handleSubscriptionError(subscriptionKey, dataType, userId, options) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect ${dataType} (attempt ${this.reconnectAttempts})`);
      
      // Remove failed subscription
      this.unsubscribe(dataType, userId);
      
      // Wait before reconnecting
      await new Promise(resolve => setTimeout(resolve, 2000 * this.reconnectAttempts));
      
      // Attempt to resubscribe
      try {
        await this.subscribe(dataType, userId, options);
      } catch (error) {
        console.error(`Failed to reconnect ${dataType}:`, error);
      }
    } else {
      console.error(`❌ Max reconnection attempts reached for ${dataType}`);
    }
  }

  /**
   * Initialize data cache by fetching current data
   */
  async initializeDataCache(dataType, userId, config) {
    try {
      const { data, error } = await this.supabase
        .from(config.table)
        .select(config.select || '*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const cacheKey = `${dataType}_${userId}`;
      this.dataCache.set(cacheKey, data || []);
      
      console.log(`💾 Cached ${data?.length || 0} ${dataType} records`);
    } catch (error) {
      console.error(`Error initializing cache for ${dataType}:`, error);
    }
  }

  /**
   * Get configuration for different data types
   */
  getDataTypeConfig(dataType) {
    const configs = {
      'kpis': {
        table: 'employee_kpis',
        select: '*',
        filter: 'user_id=eq.{userId}'
      },
      'submissions': {
        table: 'employee_submissions',
        select: '*',
        filter: 'user_id=eq.{userId}'
      },
      'projects': {
        table: 'user_projects',
        select: '*',
        filter: 'user_id=eq.{userId}'
      },
      'tasks': {
        table: 'user_tasks',
        select: '*',
        filter: 'user_id=eq.{userId}'
      },
      'reviews': {
        table: 'performance_reviews',
        select: '*',
        filter: 'employee_id=eq.{userId}'
      },
      'feedback': {
        table: 'employee_feedback',
        select: '*',
        filter: 'employee_id=eq.{userId}'
      },
      'dashboard_usage': {
        table: 'dashboard_usage',
        select: '*',
        filter: 'user_id=eq.{userId}'
      },
      'workspace_access': {
        table: 'workspace_access_logs',
        select: '*',
        filter: 'user_id=eq.{userId}'
      }
    };
    
    return configs[dataType] || {
      table: dataType,
      select: '*',
      filter: 'user_id=eq.{userId}'
    };
  }

  /**
   * Get statistics about active subscriptions
   */
  getSubscriptionStats() {
    return {
      activeSubscriptions: this.subscriptions.size,
      cachedDataTypes: this.dataCache.size,
      activeListeners: Array.from(this.listeners.values()).reduce((total, listeners) => total + listeners.size, 0),
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Clean up all subscriptions and cache
   */
  cleanup() {
    // Unsubscribe from all channels
    this.subscriptions.forEach((subscription, key) => {
      this.supabase.removeChannel(subscription.channel);
    });
    
    // Clear all data
    this.subscriptions.clear();
    this.dataCache.clear();
    this.listeners.clear();
    
    console.log('🧹 Real-time service cleaned up');
  }

  /**
   * Batch subscribe to multiple data types
   */
  async batchSubscribe(dataTypes, userId, options = {}) {
    const results = [];
    
    for (const dataType of dataTypes) {
      try {
        const subscription = await this.subscribe(dataType, userId, options);
        results.push({ dataType, success: true, subscription });
      } catch (error) {
        results.push({ dataType, success: false, error });
      }
    }
    
    return results;
  }

  /**
   * Get real-time connection status
   */
  getConnectionStatus() {
    const subscriptions = Array.from(this.subscriptions.values());
    const connectedCount = subscriptions.length;
    
    return {
      isConnected: connectedCount > 0,
      totalSubscriptions: connectedCount,
      subscriptionDetails: subscriptions.map(sub => ({
        dataType: sub.dataType,
        userId: sub.userId,
        createdAt: sub.createdAt
      })),
      cacheSize: this.dataCache.size,
      lastUpdate: new Date().toISOString()
    };
  }
}

// Create singleton instance
const realTimeDataService = new RealTimeDataService();

// Export service and helper functions
export default realTimeDataService;

/**
 * Initialize real-time service with Supabase client
 */
export const initializeRealTimeService = (supabaseClient) => {
  realTimeDataService.initialize(supabaseClient);
};

/**
 * Subscribe to dashboard data updates
 */
export const subscribeToDashboardUpdates = async (userId) => {
  return await realTimeDataService.batchSubscribe([
    'kpis',
    'submissions',
    'reviews',
    'dashboard_usage'
  ], userId);
};

/**
 * Subscribe to project workspace updates
 */
export const subscribeToWorkspaceUpdates = async (userId) => {
  return await realTimeDataService.batchSubscribe([
    'projects',
    'tasks',
    'workspace_access'
  ], userId);
};

/**
 * Subscribe to performance updates
 */
export const subscribeToPerformanceUpdates = async (userId) => {
  return await realTimeDataService.batchSubscribe([
    'reviews',
    'feedback',
    'kpis'
  ], userId);
};

/**
 * Get cached dashboard data
 */
export const getCachedDashboardData = (userId) => {
  return {
    kpis: realTimeDataService.getCachedData('kpis', userId),
    submissions: realTimeDataService.getCachedData('submissions', userId),
    reviews: realTimeDataService.getCachedData('reviews', userId),
    dashboardUsage: realTimeDataService.getCachedData('dashboard_usage', userId)
  };
};

/**
 * Get cached workspace data
 */
export const getCachedWorkspaceData = (userId) => {
  return {
    projects: realTimeDataService.getCachedData('projects', userId),
    tasks: realTimeDataService.getCachedData('tasks', userId),
    workspaceAccess: realTimeDataService.getCachedData('workspace_access', userId)
  };
};

/**
 * Refresh all data for a user
 */
export const refreshAllUserData = async (userId) => {
  const dataTypes = ['kpis', 'submissions', 'projects', 'tasks', 'reviews', 'feedback'];
  
  for (const dataType of dataTypes) {
    try {
      await realTimeDataService.refreshData(dataType, userId);
    } catch (error) {
      console.error(`Error refreshing ${dataType}:`, error);
    }
  }
};

export { realTimeDataService };