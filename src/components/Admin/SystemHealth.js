import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import { LoadingSpinner } from '../UI/LoadingSpinner';

function SystemHealth({ onLoading }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await adminApi.getSystemHealth();
      setHealth(adminApi.formatSystemHealth(data));
    } catch (error) {
      console.error('Error fetching system health:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  if (loading && !health) {
    return (
      <div className="p-8 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Checking system health...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 dark:bg-red-900 rounded-lg p-6">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
            Health Check Failed
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchHealth}
            className="bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-900 dark:text-red-100 px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">No health data available</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            System Health
          </h2>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:ring-primary-500 dark:bg-gray-700"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Auto-refresh (30s)
              </span>
            </label>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              <span className="mr-2">🔄</span>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time system status and performance metrics
        </p>
      </div>

      {/* Overall Status */}
      <div className="mb-8">
        <div className={`rounded-lg p-6 ${
          health?.status === 'healthy' 
            ? 'bg-green-50 dark:bg-green-900' 
            : 'bg-red-50 dark:bg-red-900'
        }`}>
          <div className="flex items-center">
            <div className={`rounded-full w-12 h-12 flex items-center justify-center ${
              health?.status === 'healthy'
                ? 'bg-green-100 dark:bg-green-800'
                : 'bg-red-100 dark:bg-red-800'
            }`}>
              <span className="text-2xl">
                {health?.status === 'healthy' ? '✅' : '❌'}
              </span>
            </div>
            <div className="ml-4">
              <h3 className={`text-2xl font-bold ${
                health?.status === 'healthy'
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-red-900 dark:text-red-100'
              }`}>
                System {health?.status === 'healthy' ? 'Healthy' : 'Unhealthy'}
              </h3>
              <p className={`${
                health?.status === 'healthy'
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                Last checked: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Health Checks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Database Check */}
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Database</h3>
            <span className="text-2xl">
              {health?.checks?.database ? '✅' : '❌'}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`font-medium ${
                health?.checks?.database 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {health?.checks?.database ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Memory</h3>
            <span className="text-2xl">🧠</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">RSS:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {health?.memoryDisplay?.rss || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Heap Total:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {health?.memoryDisplay?.heapTotal || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Heap Used:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {health?.memoryDisplay?.heapUsed || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* System Uptime */}
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Uptime</h3>
            <span className="text-2xl">⏱️</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Duration:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {health?.uptimeDisplay || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Started:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {health?.checks?.uptime ? new Date(Date.now() - (health.checks.uptime * 1000)).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Disk Space (placeholder) */}
        <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Disk Space</h3>
            <span className="text-2xl">💾</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className="font-medium text-yellow-600 dark:text-yellow-400">
                {health?.checks?.disk_space || 'Not monitored'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Disk monitoring not implemented yet
            </p>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          System Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Node.js Platform:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {typeof window !== 'undefined' ? 'Browser' : 'Server'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Environment:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {process.env.NODE_ENV || 'development'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">API Server:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              Running on port 3004
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Auto Refresh:</span>
            <span className={`ml-2 font-medium ${
              autoRefresh 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {autoRefresh ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {loading && health && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <LoadingSpinner size="sm" />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Refreshing...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SystemHealth;