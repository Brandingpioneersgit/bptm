import React, { useState, useEffect } from 'react';
import { User, Settings, Bell, Shield, Eye, Save, Camera, Mail, Phone, MapPin, Calendar, Briefcase, Globe, Lock, Clock, Smartphone, X, EyeOff, Edit3, Github, Linkedin } from 'lucide-react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useToast } from '@/shared/hooks/useToast';
import profileSettingsService from '@/services/profileSettingsService';
import NotificationCenter from '@/components/notifications/NotificationCenter';

const ProfileSettingsManager = ({ onClose }) => {
  const { user } = useUnifiedAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    department: '',
    role: '',
    hire_date: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    linkedin_url: '',
    portfolio_url: '',
    github_url: '',
    skills: [],
    certifications: [],
    experience_years: ''
  });
  
  // Account settings state
  const [accountSettings, setAccountSettings] = useState({
    password: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    sessionTimeout: 30
  });
  
  // Notification preferences state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    monthlyReminders: true,
    performanceAlerts: true,
    systemUpdates: true,
    marketingEmails: false,
    weeklyDigest: true,
    instantMessages: true
  });
  
  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'team',
    showEmail: true,
    showPhone: false,
    showAddress: false,
    allowDirectMessages: true,
    sharePerformanceData: false
  });

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Load profile data using profileSettingsService
      const profileResult = await profileSettingsService.getUserProfile(user.id);
      if (profileResult.success && profileResult.data) {
        const userData = profileResult.data;
        setProfileData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          bio: userData.bio || '',
          department: userData.department || '',
          role: userData.role || '',
          hire_date: userData.hire_date || '',
          emergency_contact_name: userData.emergency_contact_name || '',
          emergency_contact_phone: userData.emergency_contact_phone || '',
          linkedin_url: userData.linkedin_url || '',
          portfolio_url: userData.portfolio_url || '',
          github_url: userData.github_url || '',
          skills: userData.skills || [],
          certifications: userData.certifications || [],
          experience_years: userData.experience_years || ''
        });
      }

      // Load user preferences using profileSettingsService
      const preferencesResult = await profileSettingsService.getUserPreferences(user.id);
      if (preferencesResult.success && preferencesResult.data) {
        const prefsData = preferencesResult.data;
        setNotificationSettings(prefsData.notification_settings || notificationSettings);
        setPrivacySettings(prefsData.privacy_settings || privacySettings);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      showToast('Failed to load user data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const result = await profileSettingsService.updateUserProfile(user.id, {
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        emergency_contact_name: profileData.emergency_contact_name,
        emergency_contact_phone: profileData.emergency_contact_phone,
        linkedin_url: profileData.linkedin_url,
        portfolio_url: profileData.portfolio_url,
        github_url: profileData.github_url,
        skills: profileData.skills,
        certifications: profileData.certifications,
        experience_years: profileData.experience_years
      });

      if (result.success) {
        showToast('Profile updated successfully', 'success');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSave = async () => {
    setSaving(true);
    try {
      const result = await profileSettingsService.updateUserPreferences(user.id, {
        notification_settings: notificationSettings,
        privacy_settings: privacySettings
      });

      if (result.success) {
        showToast('Settings updated successfully', 'success');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      showToast('Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (accountSettings.password !== accountSettings.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (accountSettings.password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    setSaving(true);
    try {
      const result = await profileSettingsService.changePassword(
        '', // current password - would need to be collected from user
        accountSettings.password
      );
      
      if (result.success) {
        showToast('Password updated successfully', 'success');
        setAccountSettings({ ...accountSettings, password: '', confirmPassword: '' });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      showToast('Failed to update password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              type="text"
              value={profileData.department}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            value={profileData.address}
            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Phone className="w-5 h-5 mr-2" />
          Emergency Contact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name
            </label>
            <input
              type="text"
              value={profileData.emergency_contact_name}
              onChange={(e) => setProfileData({ ...profileData, emergency_contact_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              value={profileData.emergency_contact_phone}
              onChange={(e) => setProfileData({ ...profileData, emergency_contact_phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Professional Links */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          Professional Links
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Linkedin className="w-4 h-4 mr-1" />
              LinkedIn URL
            </label>
            <input
              type="url"
              value={profileData.linkedin_url}
              onChange={(e) => setProfileData({ ...profileData, linkedin_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Github className="w-4 h-4 mr-1" />
              GitHub URL
            </label>
            <input
              type="url"
              value={profileData.github_url}
              onChange={(e) => setProfileData({ ...profileData, github_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://github.com/yourusername"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Globe className="w-4 h-4 mr-1" />
              Portfolio URL
            </label>
            <input
              type="url"
              value={profileData.portfolio_url}
              onChange={(e) => setProfileData({ ...profileData, portfolio_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://yourportfolio.com"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleProfileSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );

  const renderAccountTab = () => (
    <div className="space-y-6">
      {/* Password Change */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Change Password
        </h3>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={accountSettings.password}
                onChange={(e) => setAccountSettings({ ...accountSettings, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={accountSettings.confirmPassword}
              onChange={(e) => setAccountSettings({ ...accountSettings, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handlePasswordChange}
            disabled={saving || !accountSettings.password || !accountSettings.confirmPassword}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Security Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Two-Factor Authentication
              </label>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={accountSettings.twoFactorEnabled}
                onChange={(e) => setAccountSettings({ ...accountSettings, twoFactorEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Timeout (minutes)
            </label>
            <select
              value={accountSettings.sessionTimeout}
              onChange={(e) => setAccountSettings({ ...accountSettings, sessionTimeout: parseInt(e.target.value) })}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={60}>60</option>
              <option value={120}>120</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Notification Preferences
        </h3>
        <div className="space-y-4">
          {Object.entries({
            emailNotifications: 'Email Notifications',
            pushNotifications: 'Push Notifications',
            monthlyReminders: 'Monthly Form Reminders',
            performanceAlerts: 'Performance Alerts',
            systemUpdates: 'System Updates',
            marketingEmails: 'Marketing Emails',
            weeklyDigest: 'Weekly Digest',
            instantMessages: 'Instant Messages'
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <p className="text-sm text-gray-500">
                  {key === 'emailNotifications' && 'Receive notifications via email'}
                  {key === 'pushNotifications' && 'Receive push notifications in browser'}
                  {key === 'monthlyReminders' && 'Get reminded about monthly form submissions'}
                  {key === 'performanceAlerts' && 'Notifications about performance reviews'}
                  {key === 'systemUpdates' && 'Important system updates and maintenance'}
                  {key === 'marketingEmails' && 'Company news and marketing updates'}
                  {key === 'weeklyDigest' && 'Weekly summary of your activities'}
                  {key === 'instantMessages' && 'Real-time message notifications'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings[key]}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, [key]: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleNotificationSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Privacy Settings
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Visibility
            </label>
            <select
              value={privacySettings.profileVisibility}
              onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">Public - Visible to everyone</option>
              <option value="team">Team - Visible to team members only</option>
              <option value="private">Private - Visible to managers only</option>
            </select>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Contact Information Visibility</h4>
            {Object.entries({
              showEmail: 'Show Email Address',
              showPhone: 'Show Phone Number',
              showAddress: 'Show Address',
              allowDirectMessages: 'Allow Direct Messages',
              sharePerformanceData: 'Share Performance Data with Team'
            }).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm text-gray-700">{label}</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacySettings[key]}
                    onChange={(e) => setPrivacySettings({ ...privacySettings, [key]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleNotificationSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Privacy Settings'}
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNotificationCenter(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 bg-white border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={profileData.location}
                          onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your location"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={profileData.department}
                          onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your department"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={profileData.role}
                          onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter your role"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience (Years)
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={profileData.experience_years}
                          onChange={(e) => setProfileData({ ...profileData, experience_years: parseInt(e.target.value) || 0 })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Years of experience"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={profileData.timezone}
                        onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Social Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        LinkedIn Profile
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          value={profileData.linkedin_profile}
                          onChange={(e) => setProfileData({ ...profileData, linkedin_profile: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GitHub Profile
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          value={profileData.github_profile}
                          onChange={(e) => setProfileData({ ...profileData, github_profile: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://github.com/username"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Portfolio URL
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="url"
                          value={profileData.portfolio_url}
                          onChange={(e) => setProfileData({ ...profileData, portfolio_url: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://yourportfolio.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleProfileSave}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Account Settings Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                {/* Password Change */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter new password"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handlePasswordChange}
                      disabled={saving}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{saving ? 'Updating...' : 'Update Password'}</span>
                    </button>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Enable 2FA</p>
                        <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={accountSettings.twoFactorEnabled}
                          onChange={(e) => setAccountSettings({ ...accountSettings, twoFactorEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Session Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Session Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Timeout (minutes)
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <select
                          value={accountSettings.sessionTimeout}
                          onChange={(e) => setAccountSettings({ ...accountSettings, sessionTimeout: parseInt(e.target.value) })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                          <option value={480}>8 hours</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Login Notifications</p>
                          <p className="text-sm text-gray-600">Get notified when someone logs into your account</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accountSettings.loginNotifications}
                            onChange={(e) => setAccountSettings({ ...accountSettings, loginNotifications: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">Password Change Notifications</p>
                          <p className="text-sm text-gray-600">Get notified when your password is changed</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={accountSettings.passwordChangeNotifications}
                            onChange={(e) => setAccountSettings({ ...accountSettings, passwordChangeNotifications: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveAccountSettings}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                  </button>
                </div>
              </div>
            )}
            {/* Notifications Tab */}
             {activeTab === 'notifications' && (
               <div className="space-y-6">
                 {/* Email Notifications */}
                 <div>
                   <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="font-medium text-gray-900">Form Submissions</p>
                         <p className="text-sm text-gray-600">Get notified when new forms are submitted</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={notificationSettings.emailNotifications.formSubmissions}
                           onChange={(e) => setNotificationSettings({
                             ...notificationSettings,
                             emailNotifications: {
                               ...notificationSettings.emailNotifications,
                               formSubmissions: e.target.checked
                             }
                           })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                       </label>
                     </div>

                     <div className="flex items-center justify-between">
                       <div>
                         <p className="font-medium text-gray-900">Task Updates</p>
                         <p className="text-sm text-gray-600">Get notified about task assignments and updates</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={notificationSettings.emailNotifications.taskUpdates}
                           onChange={(e) => setNotificationSettings({
                             ...notificationSettings,
                             emailNotifications: {
                               ...notificationSettings.emailNotifications,
                               taskUpdates: e.target.checked
                             }
                           })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                       </label>
                     </div>

                     <div className="flex items-center justify-between">
                       <div>
                         <p className="font-medium text-gray-900">System Updates</p>
                         <p className="text-sm text-gray-600">Get notified about system maintenance and updates</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={notificationSettings.emailNotifications.systemUpdates}
                           onChange={(e) => setNotificationSettings({
                             ...notificationSettings,
                             emailNotifications: {
                               ...notificationSettings.emailNotifications,
                               systemUpdates: e.target.checked
                             }
                           })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                       </label>
                     </div>

                     <div className="flex items-center justify-between">
                       <div>
                         <p className="font-medium text-gray-900">Weekly Reports</p>
                         <p className="text-sm text-gray-600">Receive weekly performance and activity reports</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={notificationSettings.emailNotifications.weeklyReports}
                           onChange={(e) => setNotificationSettings({
                             ...notificationSettings,
                             emailNotifications: {
                               ...notificationSettings.emailNotifications,
                               weeklyReports: e.target.checked
                             }
                           })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                       </label>
                     </div>
                   </div>
                 </div>

                 {/* Push Notifications */}
                 <div>
                   <h3 className="text-lg font-medium text-gray-900 mb-4">Push Notifications</h3>
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="font-medium text-gray-900">Instant Messages</p>
                         <p className="text-sm text-gray-600">Get push notifications for instant messages</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={notificationSettings.pushNotifications.instantMessages}
                           onChange={(e) => setNotificationSettings({
                             ...notificationSettings,
                             pushNotifications: {
                               ...notificationSettings.pushNotifications,
                               instantMessages: e.target.checked
                             }
                           })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                       </label>
                     </div>

                     <div className="flex items-center justify-between">
                       <div>
                         <p className="font-medium text-gray-900">Urgent Alerts</p>
                         <p className="text-sm text-gray-600">Get push notifications for urgent alerts</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={notificationSettings.pushNotifications.urgentAlerts}
                           onChange={(e) => setNotificationSettings({
                             ...notificationSettings,
                             pushNotifications: {
                               ...notificationSettings.pushNotifications,
                               urgentAlerts: e.target.checked
                             }
                           })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                       </label>
                     </div>

                     <div className="flex items-center justify-between">
                       <div>
                         <p className="font-medium text-gray-900">Reminders</p>
                         <p className="text-sm text-gray-600">Get push notifications for task reminders</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={notificationSettings.pushNotifications.reminders}
                           onChange={(e) => setNotificationSettings({
                             ...notificationSettings,
                             pushNotifications: {
                               ...notificationSettings.pushNotifications,
                               reminders: e.target.checked
                             }
                           })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                       </label>
                     </div>
                   </div>
                 </div>

                 {/* Notification Frequency */}
                 <div>
                   <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Frequency</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Email Digest Frequency
                       </label>
                       <select
                         value={notificationSettings.frequency.emailDigest}
                         onChange={(e) => setNotificationSettings({
                           ...notificationSettings,
                           frequency: {
                             ...notificationSettings.frequency,
                             emailDigest: e.target.value
                           }
                         })}
                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       >
                         <option value="immediate">Immediate</option>
                         <option value="hourly">Hourly</option>
                         <option value="daily">Daily</option>
                         <option value="weekly">Weekly</option>
                         <option value="never">Never</option>
                       </select>
                     </div>

                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Quiet Hours
                       </label>
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                           <input
                             type="time"
                             value={notificationSettings.quietHours.start}
                             onChange={(e) => setNotificationSettings({
                               ...notificationSettings,
                               quietHours: {
                                 ...notificationSettings.quietHours,
                                 start: e.target.value
                               }
                             })}
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           />
                         </div>
                         <div>
                           <label className="block text-xs text-gray-500 mb-1">End Time</label>
                           <input
                             type="time"
                             value={notificationSettings.quietHours.end}
                             onChange={(e) => setNotificationSettings({
                               ...notificationSettings,
                               quietHours: {
                                 ...notificationSettings.quietHours,
                                 end: e.target.value
                               }
                             })}
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           />
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Save Button */}
                 <div className="flex justify-end">
                   <button
                     onClick={handleSaveNotifications}
                     disabled={saving}
                     className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     <Save className="w-4 h-4" />
                     <span>{saving ? 'Saving...' : 'Save Notifications'}</span>
                   </button>
                 </div>
               </div>
             )}

             {/* Privacy Tab */}
             {activeTab === 'privacy' && (
               <div className="space-y-6">
                 {/* Profile Visibility */}
                 <div>
                   <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Visibility</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Who can see your profile?
                       </label>
                       <select
                         value={privacySettings.profileVisibility}
                         onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       >
                         <option value="public">Everyone</option>
                         <option value="team">Team Members Only</option>
                         <option value="department">Department Only</option>
                         <option value="private">Only Me</option>
                       </select>
                     </div>

                     <div className="flex items-center justify-between">
                       <div>
                         <p className="font-medium text-gray-900">Show Email Address</p>
                         <p className="text-sm text-gray-600">Allow others to see your email address</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={privacySettings.showEmail}
                           onChange={(e) => setPrivacySettings({ ...privacySettings, showEmail: e.target.checked })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                       </label>
                     </div>

                     <div className="flex items-center justify-between">
                       <div>
                         <p className="font-medium text-gray-900">Show Phone Number</p>
                         <p className="text-sm text-gray-600">Allow others to see your phone number</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={privacySettings.showPhone}
                           onChange={(e) => setPrivacySettings({ ...privacySettings, showPhone: e.target.checked })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                       </label>
                     </div>

                     <div className="flex items-center justify-between">
                       <div>
                         <p className="font-medium text-gray-900">Show Online Status</p>
                         <p className="text-sm text-gray-600">Let others know when you're online</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={privacySettings.showOnlineStatus}
                           onChange={(e) => setPrivacySettings({ ...privacySettings, showOnlineStatus: e.target.checked })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                       </label>
                     </div>
                   </div>
                 </div>

                 {/* Data & Analytics */}
                 <div>
                   <h3 className="text-lg font-medium text-gray-900 mb-4">Data & Analytics</h3>
                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <div>
                         <p className="font-medium text-gray-900">Activity Tracking</p>
                         <p className="text-sm text-gray-600">Allow system to track your activity for analytics</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={privacySettings.allowAnalytics}
                           onChange={(e) => setPrivacySettings({ ...privacySettings, allowAnalytics: e.target.checked })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                       </label>
                     </div>

                     <div className="flex items-center justify-between">
                       <div>
                         <p className="font-medium text-gray-900">Performance Metrics</p>
                         <p className="text-sm text-gray-600">Include your data in team performance metrics</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={privacySettings.allowPerformanceTracking}
                           onChange={(e) => setPrivacySettings({ ...privacySettings, allowPerformanceTracking: e.target.checked })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                       </label>
                     </div>

                     <div className="flex items-center justify-between">
                       <div>
                         <p className="font-medium text-gray-900">Data Export</p>
                         <p className="text-sm text-gray-600">Allow data export for backup purposes</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input
                           type="checkbox"
                           checked={privacySettings.allowDataExport}
                           onChange={(e) => setPrivacySettings({ ...privacySettings, allowDataExport: e.target.checked })}
                           className="sr-only peer"
                         />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                       </label>
                     </div>
                   </div>
                 </div>

                 {/* Data Retention */}
                 <div>
                   <h3 className="text-lg font-medium text-gray-900 mb-4">Data Retention</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">
                         Keep activity logs for
                       </label>
                       <select
                         value={privacySettings.dataRetentionPeriod}
                         onChange={(e) => setPrivacySettings({ ...privacySettings, dataRetentionPeriod: e.target.value })}
                         className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       >
                         <option value="30">30 days</option>
                         <option value="90">90 days</option>
                         <option value="180">6 months</option>
                         <option value="365">1 year</option>
                         <option value="forever">Forever</option>
                       </select>
                     </div>

                     <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                       <div className="flex items-start">
                         <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                         <div>
                           <h4 className="text-sm font-medium text-yellow-800">Data Deletion Request</h4>
                           <p className="text-sm text-yellow-700 mt-1">
                             You can request deletion of your personal data at any time. This action cannot be undone.
                           </p>
                           <button className="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900">
                             Request Data Deletion
                           </button>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Save Button */}
                 <div className="flex justify-end">
                   <button
                     onClick={handleSavePrivacy}
                     disabled={saving}
                     className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                   >
                     <Save className="w-4 h-4" />
                     <span>{saving ? 'Saving...' : 'Save Privacy Settings'}</span>
                   </button>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
      
      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />
    </div>
  );
};

export default ProfileSettingsManager;