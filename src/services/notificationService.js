import websocketService from './websocketService';

class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = new Set();
  }

  // Initialize notification listeners
  initialize() {
    if (websocketService.socket) {
      // Listen for new notifications
      websocketService.socket.on('new_notification', (notification) => {
        this.addNotification(notification);
        this.notifyListeners('new_notification', notification);
      });

      // Listen for notification read confirmations
      websocketService.socket.on('notification_read', (data) => {
        this.markNotificationAsRead(data.notificationId);
        this.notifyListeners('notification_read', data);
      });

      // Listen for notifications list
      websocketService.socket.on('notifications', (data) => {
        this.notifications = data.notifications || [];
        this.notifyListeners('notifications_loaded', data);
      });
    }
  }

  // Add notification to local state
  addNotification(notification) {
    this.notifications.unshift(notification);
    // Keep only last 100 notifications
    this.notifications = this.notifications.slice(0, 100);
  }

  // Mark notification as read locally
  markNotificationAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  // Send custom notification
  sendNotification(targetUserId, title, message, type = 'info', data = {}) {
    if (websocketService.socket && websocketService.isConnected) {
      websocketService.socket.emit('send_notification', {
        targetUserId,
        title,
        message,
        type,
        notificationData: data
      });
    }
  }

  // Send connection request notification
  sendConnectionRequest(targetUserId) {
    if (websocketService.socket && websocketService.isConnected) {
      websocketService.socket.emit('send_connection_request', {
        targetUserId
      });
    }
  }

  // Send opportunity-related notification
  sendOpportunityNotification(opportunityId, targetUserId, action) {
    if (websocketService.socket && websocketService.isConnected) {
      websocketService.socket.emit('send_opportunity_notification', {
        opportunityId,
        targetUserId,
        action // 'apply', 'accept', 'reject'
      });
    }
  }

  // Send system notification (admin only)
  sendSystemNotification(title, message, type = 'system', targets = 'all') {
    if (websocketService.socket && websocketService.isConnected) {
      websocketService.socket.emit('send_system_notification', {
        title,
        message,
        type,
        targets
      });
    }
  }

  // Mark notification as read
  markAsRead(notificationId) {
    if (websocketService.socket && websocketService.isConnected) {
      websocketService.socket.emit('mark_notification_read', {
        notificationId
      });
    }
  }

  // Get notifications from server
  getNotifications(options = {}) {
    if (websocketService.socket && websocketService.isConnected) {
      const { limit = 50, offset = 0, unreadOnly = false } = options;
      websocketService.socket.emit('get_notifications', {
        limit,
        offset,
        unreadOnly
      });
    }
  }

  // Get unread notifications count
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Get all notifications
  getAllNotifications() {
    return [...this.notifications];
  }

  // Get notifications by type
  getNotificationsByType(type) {
    return this.notifications.filter(n => n.type === type);
  }

  // Clear all notifications
  clearNotifications() {
    this.notifications = [];
    this.notifyListeners('notifications_cleared');
  }

  // Subscribe to notification events
  subscribe(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Notification listener error:', error);
      }
    });
  }

  // Browser notification (if permission granted)
  showBrowserNotification(title, message, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
      return new Notification(title, {
        body: message,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        ...options
      });
    }
  }

  // Request browser notification permission
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Create formatted notification for display
  formatNotification(notification) {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      timestamp: new Date(notification.timestamp),
      fromUser: notification.fromUser,
      data: notification.data || {},
      // Helper methods
      timeAgo: this.getTimeAgo(new Date(notification.timestamp)),
      typeIcon: this.getTypeIcon(notification.type),
      typeColor: this.getTypeColor(notification.type)
    };
  }

  // Get time ago string
  getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 30) return `Il y a ${days} jours`;
    return date.toLocaleDateString('fr-FR');
  }

  // Get icon for notification type
  getTypeIcon(type) {
    const icons = {
      message: '💬',
      connection_request: '🤝',
      opportunity: '🎯',
      system: '⚙️',
      welcome: '👋',
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type] || 'ℹ️';
  }

  // Get color for notification type
  getTypeColor(type) {
    const colors = {
      message: 'blue',
      connection_request: 'green',
      opportunity: 'purple',
      system: 'gray',
      welcome: 'indigo',
      info: 'blue',
      success: 'green',
      warning: 'yellow',
      error: 'red'
    };
    return colors[type] || 'gray';
  }
}

export default new NotificationService();