import React, { useState, useEffect } from 'react';
import { useSecureApp } from '../../contexts/SecureAppContext';
import adminApi from '../../services/adminApi';
import { LoadingSpinner } from '../UI/LoadingSpinner';

function SystemSettings({ isSuperAdmin, onLoading }) {
  const { addNotification } = useSecureApp();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editedSettings, setEditedSettings] = useState({});

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      onLoading?.(true);
      
      const data = await adminApi.getSystemSettings();
      setSettings(data.settings);
      // Initialize edited settings with current values
      const initialEdited = {};
      data.settings.forEach(setting => {
        initialEdited[setting.key] = setting.value;
      });
      setEditedSettings(initialEdited);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      setError(error.message);
      addNotification('Failed to load system settings', 'error');
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSettingChange = (key, value) => {
    setEditedSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // Prepare settings array for API
      const settingsToUpdate = Object.entries(editedSettings).map(([key, value]) => ({
        key,
        value
      }));
      
      await adminApi.updateSystemSettings(settingsToUpdate);
      addNotification('System settings updated successfully', 'success');
      fetchSettings(); // Refresh to get updated timestamps
    } catch (error) {
      console.error('Error saving system settings:', error);
      addNotification('Failed to save system settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    return settings.some(setting => 
      JSON.stringify(setting.value) !== JSON.stringify(editedSettings[setting.key])
    );
  };

  const resetChanges = () => {
    const initialEdited = {};
    settings.forEach(setting => {
      initialEdited[setting.key] = setting.value;
    });
    setEditedSettings(initialEdited);
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center">
        <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-6">
          <div className="text-yellow-400 text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-medium text-yellow-900 dark:text-yellow-100 mb-2">
            Super Admin Access Required
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300">
            Only super administrators can access system settings.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading system settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 dark:bg-red-900 rounded-lg p-6">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
            Failed to Load Settings
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchSettings}
            className="bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-900 dark:text-red-100 px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderSettingEditor = (setting) => {
    const value = editedSettings[setting.key] || {};
    
    switch (setting.key) {
      case 'maintenance_mode':
        return (
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`${setting.key}_enabled`}
                checked={value.enabled || false}
                onChange={(e) => handleSettingChange(setting.key, {
                  ...value,
                  enabled: e.target.checked
                })}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:ring-primary-500 dark:bg-gray-700"
              />
              <label htmlFor={`${setting.key}_enabled`} className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                Enable Maintenance Mode
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maintenance Message
              </label>
              <textarea
                value={value.message || ''}
                onChange={(e) => handleSettingChange(setting.key, {
                  ...value,
                  message: e.target.value
                })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter maintenance message for users..."
              />
            </div>
          </div>
        );

      case 'user_registration':
        return (
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`${setting.key}_enabled`}
                checked={value.enabled || false}
                onChange={(e) => handleSettingChange(setting.key, {
                  ...value,
                  enabled: e.target.checked
                })}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:ring-primary-500 dark:bg-gray-700"
              />
              <label htmlFor={`${setting.key}_enabled`} className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                Allow User Registration
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`${setting.key}_verification`}
                checked={value.require_verification || false}
                onChange={(e) => handleSettingChange(setting.key, {
                  ...value,
                  require_verification: e.target.checked
                })}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:ring-primary-500 dark:bg-gray-700"
              />
              <label htmlFor={`${setting.key}_verification`} className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                Require Email Verification
              </label>
            </div>
          </div>
        );

      case 'rate_limits':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Auth Attempts
              </label>
              <input
                type="number"
                value={value.auth_attempts || 5}
                onChange={(e) => handleSettingChange(setting.key, {
                  ...value,
                  auth_attempts: parseInt(e.target.value)
                })}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                General Requests
              </label>
              <input
                type="number"
                value={value.general_requests || 100}
                onChange={(e) => handleSettingChange(setting.key, {
                  ...value,
                  general_requests: parseInt(e.target.value)
                })}
                min="1"
                max="1000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Window (minutes)
              </label>
              <input
                type="number"
                value={value.window_minutes || 15}
                onChange={(e) => handleSettingChange(setting.key, {
                  ...value,
                  window_minutes: parseInt(e.target.value)
                })}
                min="1"
                max="60"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`${setting.key}_email`}
                checked={value.email_enabled || false}
                onChange={(e) => handleSettingChange(setting.key, {
                  ...value,
                  email_enabled: e.target.checked
                })}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:ring-primary-500 dark:bg-gray-700"
              />
              <label htmlFor={`${setting.key}_email`} className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                Enable Email Notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`${setting.key}_push`}
                checked={value.push_enabled || false}
                onChange={(e) => handleSettingChange(setting.key, {
                  ...value,
                  push_enabled: e.target.checked
                })}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 shadow-sm focus:ring-primary-500 dark:bg-gray-700"
              />
              <label htmlFor={`${setting.key}_push`} className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                Enable Push Notifications
              </label>
            </div>
          </div>
        );

      default:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Raw JSON Value
            </label>
            <textarea
              value={JSON.stringify(value, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleSettingChange(setting.key, parsed);
                } catch (error) {
                  // Invalid JSON, don't update
                }
              }}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white font-mono text-sm"
            />
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            System Settings
          </h2>
          <div className="flex space-x-3">
            {hasChanges() && (
              <>
                <button
                  onClick={resetChanges}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Reset
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Configure system-wide settings and behavior
        </p>
      </div>

      {/* Settings List */}
      <div className="space-y-6">
        {settings.map((setting) => (
          <div key={setting.key} className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {setting.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {new Date(setting.updated_at).toLocaleString()}
              </p>
            </div>

            {renderSettingEditor(setting)}
          </div>
        ))}
      </div>

      {/* Warning Message */}
      <div className="mt-8 bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-yellow-400 text-xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Configuration Warning
            </h3>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              Changes to system settings will affect all users immediately. Please review carefully before saving.
              Some settings like rate limiting may require a server restart to take full effect.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemSettings;