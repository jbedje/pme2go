import React from 'react';
import { Bell, MessageSquare, Users, Target, Settings } from 'lucide-react';
import { useSecureApp } from '../../contexts/SecureAppContext';

export default function NotificationTester() {
  const { 
    user, 
    users, 
    sendNotification, 
    sendConnectionRequest,
    sendOpportunityNotification
  } = useSecureApp();

  if (!user || users.length < 2) {
    return null; // Need at least 2 users to test notifications
  }

  const otherUser = users.find(u => u.id !== user.id);

  const testNotifications = [
    {
      title: 'Test Simple',
      message: 'Ceci est une notification de test simple',
      type: 'info',
      action: () => sendNotification(user.id, 'Test Simple', 'Ceci est une notification de test simple', 'info')
    },
    {
      title: 'Test Message',
      message: 'Simulation d\'un nouveau message',
      type: 'message',
      action: () => sendNotification(user.id, 'Nouveau message', 'Vous avez reçu un message de test', 'message', {
        fromUserId: otherUser?.id,
        fromUserName: otherUser?.name
      })
    },
    {
      title: 'Test Connexion',
      message: 'Simulation d\'une demande de connexion',
      type: 'connection_request',
      action: () => otherUser && sendConnectionRequest(user.id)
    },
    {
      title: 'Test Opportunité',
      message: 'Simulation d\'une notification d\'opportunité',
      type: 'opportunity',
      action: () => otherUser && sendOpportunityNotification('test-opportunity-1', user.id, 'apply')
    },
    {
      title: 'Test Succès',
      message: 'Notification de succès',
      type: 'success',
      action: () => sendNotification(user.id, 'Succès!', 'Opération réalisée avec succès', 'success')
    },
    {
      title: 'Test Avertissement',
      message: 'Notification d\'avertissement',
      type: 'warning',
      action: () => sendNotification(user.id, 'Attention', 'Ceci est un avertissement', 'warning')
    }
  ];

  const getIcon = (type) => {
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

  const getColor = (type) => {
    switch (type) {
      case 'message':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'connection_request':
        return 'bg-green-500 hover:bg-green-600';
      case 'opportunity':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'success':
        return 'bg-emerald-500 hover:bg-emerald-600';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Test des Notifications
        </h3>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Testez le système de notifications en temps réel. Ces notifications seront visibles dans le menu cloche.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {testNotifications.map((test, index) => (
          <button
            key={index}
            onClick={test.action}
            className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-white text-sm font-medium transition-colors ${getColor(test.type)}`}
          >
            {getIcon(test.type)}
            <span>{test.title}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 <strong>Astuce:</strong> Les notifications de test seront envoyées à votre propre compte. 
          Dans une application réelle, elles seraient envoyées à d'autres utilisateurs.
        </p>
      </div>
    </div>
  );
}