import React, { useState, useEffect } from 'react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import adminApi from '../../services/adminApi';
import { LoadingSpinner } from '../UI/LoadingSpinner';

function AdminStats({ onLoading }) {
  const { addNotification } = useSecureApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      onLoading?.(true);
      
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setError(error.message);
      addNotification('Failed to load dashboard statistics', 'error');
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 dark:bg-red-900 rounded-lg p-6">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
            Failed to Load Statistics
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-900 dark:text-red-100 px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Platform Overview
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time statistics and system metrics
        </p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={fetchStats}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <span className="mr-2">🔄</span>
            Refresh
          </button>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-800 rounded-full w-12 h-12 flex items-center justify-center">
              <span className="text-xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {(stats.users?.total || 0).toLocaleString()}
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-sm">Total Users</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900 rounded-lg p-6">
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-800 rounded-full w-12 h-12 flex items-center justify-center">
              <span className="text-xl">🟢</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {(stats.users?.active || 0).toLocaleString()}
              </p>
              <p className="text-green-700 dark:text-green-300 text-sm">Active Users</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 dark:bg-yellow-800 rounded-full w-12 h-12 flex items-center justify-center">
              <span className="text-xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {(stats.users?.recent || 0).toLocaleString()}
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">New Users (7d)</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900 rounded-lg p-6">
          <div className="flex items-center">
            <div className="bg-red-100 dark:bg-red-800 rounded-full w-12 h-12 flex items-center justify-center">
              <span className="text-xl">🚫</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {(stats.users?.banned || 0).toLocaleString()}
              </p>
              <p className="text-red-700 dark:text-red-300 text-sm">Banned Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 dark:bg-purple-800 rounded-full w-12 h-12 flex items-center justify-center">
              <span className="text-xl">💬</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {(stats.activity?.messages_24h || 0).toLocaleString()}
              </p>
              <p className="text-purple-700 dark:text-purple-300 text-sm">Messages (24h)</p>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900 rounded-lg p-6">
          <div className="flex items-center">
            <div className="bg-indigo-100 dark:bg-indigo-800 rounded-full w-12 h-12 flex items-center justify-center">
              <span className="text-xl">🔔</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                {(stats.activity?.notifications_24h || 0).toLocaleString()}
              </p>
              <p className="text-indigo-700 dark:text-indigo-300 text-sm">Notifications (24h)</p>
            </div>
          </div>
        </div>

        <div className="bg-teal-50 dark:bg-teal-900 rounded-lg p-6">
          <div className="flex items-center">
            <div className="bg-teal-100 dark:bg-teal-800 rounded-full w-12 h-12 flex items-center justify-center">
              <span className="text-xl">🤝</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                {(stats.activity?.connections || 0).toLocaleString()}
              </p>
              <p className="text-teal-700 dark:text-teal-300 text-sm">Total Connections</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Distribution */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          User Type Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(stats.distribution || []).map((item, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">{item.type}</span>
              <div className="flex items-center">
                <span className="font-semibold text-gray-900 dark:text-white mr-2">
                  {parseInt(item.count).toLocaleString()}
                </span>
                <div 
                  className="bg-blue-500 rounded-full h-2"
                  style={{ 
                    width: `${Math.max(10, (parseInt(item.count) / (stats.users?.total || 1)) * 100)}px` 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminStats;