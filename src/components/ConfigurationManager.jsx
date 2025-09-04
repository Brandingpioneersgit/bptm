import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/shared/hooks/useUnifiedAuth';
import { useToast } from '@/shared/hooks/useToast';
import { useDataSync } from './DataSyncContext';

export const ConfigurationManager = () => {
  const { user } = useUnifiedAuth();
  const { showToast } = useToast();
  const { syncData } = useDataSync();
  const [configurations, setConfigurations] = useState({
    general: {
      companyName: 'BP Agency',
      timezone: 'UTC',
      currency: 'USD',
      language: 'en'
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      weeklyReports: true,
      monthlyReports: true
    },
    security: {
      sessionTimeout: 30,
      passwordExpiry: 90,
      twoFactorAuth: false,
      loginAttempts: 5
    },
    performance: {
      kpiUpdateFrequency: 'daily',
      reportGeneration: 'weekly',
      dataRetention: 365,
      backupFrequency: 'daily'
    }
  });
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real implementation, fetch from API
    } catch (error) {
      showToast('Failed to load configurations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigUpdate = async (section, key, value) => {
    try {
      setConfigurations(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      }));
      
      // Simulate API call
      await syncData();
      showToast('Configuration updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update configuration', 'error');
    }
  };

  const handleSaveAll = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      showToast('All configurations saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save configurations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Name
        </label>
        <input
          type="text"
          value={configurations.general.companyName}
          onChange={(e) => handleConfigUpdate('general', 'companyName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Timezone
        </label>
        <select
          value={configurations.general.timezone}
          onChange={(e) => handleConfigUpdate('general', 'timezone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="UTC">UTC</option>
          <option value="EST">Eastern Time</option>
          <option value="PST">Pacific Time</option>
          <option value="GMT">Greenwich Mean Time</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Currency
        </label>
        <select
          value={configurations.general.currency}
          onChange={(e) => handleConfigUpdate('general', 'currency', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="CAD">CAD</option>
        </select>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      {Object.entries(configurations.notifications).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </label>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleConfigUpdate('notifications', key, e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      ))}
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Session Timeout (minutes)
        </label>
        <input
          type="number"
          value={configurations.security.sessionTimeout}
          onChange={(e) => handleConfigUpdate('security', 'sessionTimeout', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password Expiry (days)
        </label>
        <input
          type="number"
          value={configurations.security.passwordExpiry}
          onChange={(e) => handleConfigUpdate('security', 'passwordExpiry', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Two Factor Authentication
        </label>
        <input
          type="checkbox"
          checked={configurations.security.twoFactorAuth}
          onChange={(e) => handleConfigUpdate('security', 'twoFactorAuth', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>
    </div>
  );

  const renderPerformanceSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          KPI Update Frequency
        </label>
        <select
          value={configurations.performance.kpiUpdateFrequency}
          onChange={(e) => handleConfigUpdate('performance', 'kpiUpdateFrequency', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Data Retention (days)
        </label>
        <input
          type="number"
          value={configurations.performance.dataRetention}
          onChange={(e) => handleConfigUpdate('performance', 'dataRetention', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'performance', label: 'Performance', icon: '📊' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Configuration Manager</h2>
        <button
          onClick={handleSaveAll}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Save All Changes
        </button>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-96">
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'notifications' && renderNotificationSettings()}
        {activeTab === 'security' && renderSecuritySettings()}
        {activeTab === 'performance' && renderPerformanceSettings()}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> Changes are automatically saved when modified. Use "Save All Changes" to persist all configurations.
        </p>
      </div>
    </div>
  );
};

export default ConfigurationManager;