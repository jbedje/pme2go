import React, { useState, useEffect } from 'react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import adminApi from '../../services/adminApi';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import AdminStats from './AdminStats';
import UserManagement from './UserManagement';
import SystemHealth from './SystemHealth';
import ActivityLogs from './ActivityLogs';
import SystemSettings from './SystemSettings';

function AdminDashboard() {
  const { user, addNotification } = useSecureApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // Check admin access
  const hasAdminAccess = adminApi.checkAdminAccess(user);
  const isSuperAdmin = adminApi.checkSuperAdminAccess(user);

  useEffect(() => {
    if (!hasAdminAccess) {
      addNotification('Access denied - Admin privileges required', 'error');
    }
  }, [hasAdminAccess, addNotification]);

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="bg-red-100 dark:bg-red-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚫</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Administrator privileges are required to access this area.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊', component: AdminStats },
    { id: 'users', name: 'User Management', icon: '👥', component: UserManagement },
    { id: 'system', name: 'System Health', icon: '🖥️', component: SystemHealth },
    { id: 'logs', name: 'Activity Logs', icon: '📋', component: ActivityLogs },
    ...(isSuperAdmin ? [
      { id: 'settings', name: 'Settings', icon: '⚙️', component: SystemSettings }
    ] : [])
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          System administration and user management
        </p>
      </div>

      {/* Admin Info */}
      <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="bg-blue-100 dark:bg-blue-800 rounded-full w-10 h-10 flex items-center justify-center mr-3">
            <span className="text-lg">👨‍💼</span>
          </div>
          <div>
            <p className="text-blue-900 dark:text-blue-100 font-medium">
              Logged in as: {user?.name}
            </p>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              Role: {adminApi.formatRole(user?.role)} | {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        ) : ActiveComponent ? (
          <ActiveComponent 
            user={user} 
            isSuperAdmin={isSuperAdmin}
            onLoading={setLoading}
          />
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">Tab content not found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;