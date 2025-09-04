import { supabase } from '@/shared/lib/supabase';

/**
 * Profile Settings Service
 * Handles all profile and settings related operations
 */
class ProfileSettingsService {
  /**
   * Get user profile data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile data
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('unified_users')
        .select(`
          id,
          name,
          email,
          phone,
          role,
          user_category,
          department,
          employee_id,
          hire_date,
          address,
          city,
          state,
          zip_code,
          country,
          linkedin_profile,
          github_profile,
          portfolio_url,
          skills,
          experience_years,
          location,
          timezone,
          profile_picture_url,
          bio,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relationship,
          created_at,
          updated_at
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Update result
   */
  async updateUserProfile(userId, profileData) {
    try {
      const { data, error } = await supabase
        .from('unified_users')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      // If no preferences exist, return default preferences
      if (!data) {
        return {
          success: true,
          data: {
            notification_settings: {
              emailNotifications: true,
              pushNotifications: true,
              monthlyReminders: true,
              performanceAlerts: true,
              systemUpdates: true,
              marketingEmails: false,
              weeklyDigest: true,
              instantMessages: true
            },
            privacy_settings: {
              profileVisibility: 'team',
              showEmail: true,
              showPhone: false,
              showAddress: false,
              allowDirectMessages: true,
              sharePerformanceData: false
            },
            ui_preferences: {
              theme: 'light',
              language: 'en',
              timezone: 'UTC',
              dateFormat: 'MM/DD/YYYY',
              timeFormat: '12h',
              dashboardLayout: 'default'
            },
            security_preferences: {
              twoFactorEnabled: false,
              sessionTimeout: 30,
              loginNotifications: true,
              passwordChangeNotifications: true
            },
            communication_preferences: {
              preferredContactMethod: 'email',
              workingHours: {
                start: '09:00',
                end: '17:00',
                timezone: 'UTC'
              },
              availableForMessages: true,
              autoReplyEnabled: false,
              autoReplyMessage: ''
            }
          }
        };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - Preferences to update
   * @returns {Promise<Object>} Update result
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Update result
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enable/Disable Two-Factor Authentication
   * @param {string} userId - User ID
   * @param {boolean} enabled - Whether to enable 2FA
   * @returns {Promise<Object>} Update result
   */
  async updateTwoFactorAuth(userId, enabled) {
    try {
      // Update in user preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          security_preferences: {
            twoFactorEnabled: enabled,
            sessionTimeout: 30,
            loginNotifications: true,
            passwordChangeNotifications: true
          },
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // TODO: Implement actual 2FA setup with Supabase Auth
      // This would involve generating QR codes, backup codes, etc.
      
      return { success: true, data };
    } catch (error) {
      console.error('Error updating 2FA settings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user notifications
   * @param {string} userId - User ID
   * @param {number} limit - Number of notifications to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Object>} Notifications data
   */
  async getUserNotifications(userId, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('notification_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Update result
   */
  async markNotificationAsRead(notificationId) {
    try {
      const { data, error } = await supabase
        .from('notification_history')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new notification
   * @param {string} userId - User ID
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Creation result
   */
  async createNotification(userId, notificationData) {
    try {
      const { data, error } = await supabase
        .from('notification_history')
        .insert({
          user_id: userId,
          ...notificationData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get system settings
   * @param {boolean} publicOnly - Whether to fetch only public settings
   * @returns {Promise<Object>} System settings
   */
  async getSystemSettings(publicOnly = true) {
    try {
      let query = supabase.from('system_settings').select('*');
      
      if (publicOnly) {
        query = query.eq('is_public', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching system settings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update system setting (Admin only)
   * @param {string} settingKey - Setting key
   * @param {any} settingValue - Setting value
   * @param {string} updatedBy - User ID who updated the setting
   * @returns {Promise<Object>} Update result
   */
  async updateSystemSetting(settingKey, settingValue, updatedBy) {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .update({
          setting_value: settingValue,
          updated_by: updatedBy,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating system setting:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user sessions
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User sessions
   */
  async getUserSessions(userId) {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Revoke user session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Revoke result
   */
  async revokeSession(sessionId) {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error revoking session:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ProfileSettingsService();
export { ProfileSettingsService };