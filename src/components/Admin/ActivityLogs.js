import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContextWithAPI';
import adminApi from '../../services/adminApi';
import { LoadingSpinner } from '../UI/LoadingSpinner';

function ActivityLogs({ onLoading }) {
  const { addNotification } = useApp();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    action: '',
    admin_id: '',
    days: 7,
    page: 1,
    limit: 20
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      onLoading?.(true);
      
      const data = await adminApi.getActivityLogs(filters);
      setLogs(data.logs.map(log => adminApi.formatActivityLog(log)));
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setError(error.message);
      addNotification('Failed to load activity logs', 'error');
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when changing filters
    }));
  };

  const getActionBadgeColor = (action) => {
    const actionColors = {
      'VIEW_DASHBOARD_STATS': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'VIEW_USERS_LIST': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'VIEW_USER_DETAILS': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'UPDATE_USER': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'BAN_USER': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'UNBAN_USER': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'DELETE_USER': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'CHECK_SYSTEM_HEALTH': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'VIEW_SYSTEM_SETTINGS': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      'UPDATE_SYSTEM_SETTINGS': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };
    return actionColors[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  if (loading && logs.length === 0) {
    return (
      <div className="p-8 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading activity logs...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Activity Logs
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Complete audit trail of administrative actions
        </p>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Action Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Action Type
            </label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              placeholder="Search actions..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Days Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time Period
            </label>
            <select
              value={filters.days}
              onChange={(e) => handleFilterChange('days', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>

          {/* Limit Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Items per page
            </label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-end">
            <button
              onClick={fetchLogs}
              className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Activity Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Activity Logs
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No admin activity found for the selected time period.
            </p>
          </div>
        ) : (
          <>
            {/* Logs List */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map((log) => (
                <div key={log.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                          {log.actionDisplay}
                        </span>
                        <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                          {log.timeDisplay}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.adminDisplay}
                        </span>
                        {log.ip_address && (
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            from {log.ip_address}
                          </span>
                        )}
                      </div>

                      {log.target_type && log.target_id && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Target: {log.target_type} (ID: {log.target_id})
                        </div>
                      )}

                      {log.details && (
                        <div className="mt-2">
                          <details className="text-sm">
                            <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                              View Details
                            </summary>
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex justify-between sm:hidden">
                    <button
                      onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                      disabled={!pagination.hasPreviousPage}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                        <span className="font-medium">{pagination.totalPages}</span>{' '}
                        ({pagination.totalLogs} total logs)
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                          disabled={!pagination.hasPreviousPage}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                          disabled={!pagination.hasNextPage}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {loading && logs.length > 0 && (
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

export default ActivityLogs;