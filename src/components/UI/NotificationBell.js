import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Clock, MessageSquare, Users, Target } from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';

export default function NotificationBell() {
  const {
    notificationsCount,
    realtimeNotifications,
    markNotificationAsRead,
    clearAllNotifications,
    requestNotificationPermission
  } = useSecureApp();

  const [isOpen, setIsOpen] = useState(false);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  useEffect(() => {
    // Request notification permission on first load
    if (!hasRequestedPermission) {
      requestNotificationPermission().then(() => {
        setHasRequestedPermission(true);
      });
    }
  }, [hasRequestedPermission, requestNotificationPermission]);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }

    // Handle notification actions based on type
    switch (notification.type) {
      case 'message':
        // Navigate to messages
        if (notification.data?.fromUserId) {
          // Could set active chat contact here
        }
        break;
      case 'connection_request':
        // Navigate to profile or connections
        break;
      case 'opportunity':
        // Navigate to opportunity
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'connection_request':
        return <Users className="w-4 h-4" />;
      case 'opportunity':
        return <Target className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'message':
        return 'text-blue-600';
      case 'connection_request':
        return 'text-green-600';
      case 'opportunity':
        return 'text-purple-600';
      case 'system':
        return 'text-gray-600';
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `${minutes} min`;
    if (hours < 24) return `${hours}h`;
    if (days < 30) return `${days}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
        aria-label={`Notifications ${notificationsCount > 0 ? `(${notificationsCount})` : ''}`}
      >
        <Bell className="w-6 h-6" />
        {notificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notificationsCount > 9 ? '9+' : notificationsCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                {realtimeNotifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Tout effacer
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {realtimeNotifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucune notification
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Vous serez notifié des nouvelles activités
                  </p>
                </div>
              ) : (
                realtimeNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 p-2 rounded-full ${
                        !notification.read 
                          ? 'bg-blue-100 dark:bg-blue-900/50' 
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <div className={getNotificationColor(notification.type)}>
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          !notification.read
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </p>
                        <p className={`text-sm mt-1 ${
                          !notification.read
                            ? 'text-gray-700 dark:text-gray-200'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{formatNotificationTime(notification.timestamp)}</span>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {realtimeNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    // Mark all as read
                    realtimeNotifications
                      .filter(n => !n.read)
                      .forEach(n => markNotificationAsRead(n.id));
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center justify-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Marquer tout comme lu</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}