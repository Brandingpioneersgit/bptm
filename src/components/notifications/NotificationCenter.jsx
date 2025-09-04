import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, Info, CheckCircle, Clock } from 'lucide-react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import profileSettingsService from '@/services/profileSettingsService';
import { useToast } from '@/shared/components/Toast';

const NotificationCenter = ({ isOpen, onClose }) => {
  const { user } = useUnifiedAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchNotifications();
    }
  }, [isOpen, user?.id, filter]);

  const fetchNotifications = async (pageNum = 0) => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const result = await profileSettingsService.getUserNotifications(
        user.id,
        20,
        pageNum * 20
      );
      
      if (result.success) {
        let filteredNotifications = result.data;
        
        if (filter === 'unread') {
          filteredNotifications = result.data.filter(n => n.status !== 'read');
        } else if (filter === 'read') {
          filteredNotifications = result.data.filter(n => n.status === 'read');
        }
        
        if (pageNum === 0) {
          setNotifications(filteredNotifications);
        } else {
          setNotifications(prev => [...prev, ...filteredNotifications]);
        }
        
        setHasMore(result.data.length === 20);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const result = await profileSettingsService.markNotificationAsRead(notificationId);
      
      if (result.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, status: 'read', read_at: new Date().toISOString() }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      showToast('Failed to mark notification as read', 'error');
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => n.status !== 'read');
    
    try {
      await Promise.all(
        unreadNotifications.map(notification => 
          profileSettingsService.markNotificationAsRead(notification.id)
        )
      );
      
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          status: 'read', 
          read_at: new Date().toISOString() 
        }))
      );
      
      showToast('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      showToast('Failed to mark all notifications as read', 'error');
    }
  };

  const getNotificationIcon = (type, priority) => {
    const iconClass = `w-5 h-5 ${priority === 'urgent' ? 'text-red-500' : 
                                priority === 'high' ? 'text-orange-500' : 
                                'text-blue-500'}`;
    
    switch (type) {
      case 'email':
        return <Info className={iconClass} />;
      case 'system':
        return <AlertCircle className={iconClass} />;
      case 'in_app':
        return <Bell className={iconClass} />;
      default:
        return <Info className={iconClass} />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const unreadCount = notifications.filter(n => n.status !== 'read').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Notification Center</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </span>
              <Bell className="w-5 h-5 text-gray-400" />
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-200 mb-4">
          {['all', 'unread', 'read'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => {
                setFilter(filterType);
                setPage(0);
              }}
              className={`flex-1 py-2 px-4 text-sm font-medium capitalize transition-colors ${
                filter === filterType
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {filterType}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <div className="mb-4">
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all as read
            </button>
          </div>
        )}

        <div className="max-h-96 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <Bell className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No notifications</p>
              <p className="text-sm text-center">
                {filter === 'unread' ? 'No unread notifications' : 
                 filter === 'read' ? 'No read notifications' : 
                 'You\'re all caught up!'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    notification.status !== 'read' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (notification.status !== 'read') {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.notification_type, notification.priority)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          notification.status !== 'read' ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-2">
                          {notification.status !== 'read' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`text-sm mt-1 ${
                        notification.status !== 'read' ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {notification.message}
                      </p>
                      
                      {notification.priority === 'urgent' && (
                        <div className="flex items-center mt-2">
                          <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                          <span className="text-xs text-red-600 font-medium">Urgent</span>
                        </div>
                      )}
                      
                      {notification.status === 'read' && notification.read_at && (
                        <div className="flex items-center mt-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                          <span className="text-xs text-green-600">
                            Read {formatTimeAgo(notification.read_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Load More */}
              {hasMore && (
                <div className="p-4">
                  <button
                    onClick={() => fetchNotifications(page + 1)}
                    disabled={loading}
                    className="w-full py-2 px-4 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;