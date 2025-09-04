import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const supabase = useSupabase();
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [userNotifications, setUserNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add system notification
  const addSystemNotification = async (notification) => {
    try {
      const notificationData = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false
      };
      
      setSystemNotifications(prev => [notificationData, ...prev]);
      
      // Optionally save to database
      if (supabase) {
        await supabase
          .from('system_notifications')
          .insert([notificationData]);
      }
    } catch (error) {
      console.error('Error adding system notification:', error);
    }
  };

  // Add user notification
  const addUserNotification = async (notification) => {
    try {
      const notificationData = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false
      };
      
      setUserNotifications(prev => [notificationData, ...prev]);
      
      // Optionally save to database
      if (supabase) {
        await supabase
          .from('user_notifications')
          .insert([notificationData]);
      }
    } catch (error) {
      console.error('Error adding user notification:', error);
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId, isSystem = false) => {
    if (isSystem) {
      setSystemNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } else {
      setUserNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    }
  };

  // Clear all notifications
  const clearNotifications = (isSystem = false) => {
    if (isSystem) {
      setSystemNotifications([]);
    } else {
      setUserNotifications([]);
    }
  };

  // Get unread count
  const getUnreadCount = (isSystem = false) => {
    const notifications = isSystem ? systemNotifications : userNotifications;
    return notifications.filter(notif => !notif.read).length;
  };

  const value = {
    systemNotifications,
    userNotifications,
    loading,
    addSystemNotification,
    addUserNotification,
    markAsRead,
    clearNotifications,
    getUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationSystem = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationSystem must be used within a NotificationProvider');
  }
  return context;
};

// Simple notification center component
const NotificationCenter = ({ className = '' }) => {
  const { systemNotifications, markAsRead, clearNotifications } = useNotificationSystem();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = systemNotifications.filter(notif => !notif.read).length;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <button
              onClick={() => clearNotifications(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {systemNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              systemNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notif.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notif.id, true)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{notif.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notif.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;