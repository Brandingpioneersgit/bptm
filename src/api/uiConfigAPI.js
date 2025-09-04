/**
 * UI Configuration API Service
 * Provides API endpoints for fetching UI configuration data from the database
 */

import { supabase } from '../lib/supabase.js';

/**
 * UI Configuration API Class
 * Handles all database operations for UI configuration
 */
class UIConfigAPI {
  /**
   * Get dashboard configurations
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} Dashboard configurations
   */
  static async getDashboardConfigurations(filters = {}) {
    try {
      let query = supabase
        .from('dashboard_configurations')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters.dashboard_type) {
        query = query.eq('dashboard_type', filters.dashboard_type);
      }
      if (filters.component_name) {
        query = query.eq('component_name', filters.component_name);
      }
      if (filters.config_key) {
        query = query.eq('config_key', filters.config_key);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching dashboard configurations:', error);
      throw error;
    }
  }

  /**
   * Get theme configurations
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} Theme configurations
   */
  static async getThemeConfigurations(filters = {}) {
    try {
      let query = supabase
        .from('theme_configurations')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters.theme_name) {
        query = query.eq('theme_name', filters.theme_name);
      }
      if (filters.theme_type) {
        query = query.eq('theme_type', filters.theme_type);
      }
      if (filters.is_default !== undefined) {
        query = query.eq('is_default', filters.is_default);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching theme configurations:', error);
      throw error;
    }
  }

  /**
   * Get navigation configurations
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} Navigation configurations
   */
  static async getNavigationConfigurations(filters = {}) {
    try {
      let query = supabase
        .from('navigation_configurations')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters.nav_type) {
        query = query.eq('nav_type', filters.nav_type);
      }
      if (filters.role) {
        query = query.eq('role', filters.role);
      }

      const { data, error } = await query.order('display_order', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching navigation configurations:', error);
      throw error;
    }
  }

  /**
   * Get dynamic content
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} Dynamic content
   */
  static async getDynamicContent(filters = {}) {
    try {
      let query = supabase
        .from('dynamic_content')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters.content_type) {
        query = query.eq('content_type', filters.content_type);
      }
      if (filters.content_category) {
        query = query.eq('content_category', filters.content_category);
      }
      if (filters.target_roles && filters.target_roles.length > 0) {
        query = query.overlaps('target_roles', filters.target_roles);
      }

      // Filter by date range if applicable
      const currentDate = new Date().toISOString().split('T')[0];
      query = query.or(`start_date.is.null,start_date.lte.${currentDate}`);
      query = query.or(`end_date.is.null,end_date.gte.${currentDate}`);

      const { data, error } = await query.order('display_order', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching dynamic content:', error);
      throw error;
    }
  }

  /**
   * Get UI component settings
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} UI component settings
   */
  static async getUIComponentSettings(filters = {}) {
    try {
      let query = supabase
        .from('ui_component_settings')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters.component_type) {
        query = query.eq('component_type', filters.component_type);
      }
      if (filters.component_name) {
        query = query.eq('component_name', filters.component_name);
      }
      if (filters.applies_to_roles && filters.applies_to_roles.length > 0) {
        query = query.overlaps('applies_to_roles', filters.applies_to_roles);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching UI component settings:', error);
      throw error;
    }
  }

  /**
   * Get application settings
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>} Application settings
   */
  static async getApplicationSettings(filters = {}) {
    try {
      let query = supabase
        .from('application_settings')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters.setting_key) {
        query = query.eq('setting_key', filters.setting_key);
      }
      if (filters.setting_type) {
        query = query.eq('setting_type', filters.setting_type);
      }
      if (filters.is_system !== undefined) {
        query = query.eq('is_system', filters.is_system);
      }

      const { data, error } = await query.order('setting_key', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching application settings:', error);
      throw error;
    }
  }

  /**
   * Create or update dashboard configuration
   * @param {Object} config - Configuration data
   * @returns {Promise<Object>} Created/updated configuration
   */
  static async upsertDashboardConfiguration(config) {
    try {
      const { data, error } = await supabase
        .from('dashboard_configurations')
        .upsert({
          dashboard_type: config.dashboard_type,
          component_name: config.component_name,
          config_key: config.config_key,
          config_value: config.config_value,
          description: config.description,
          is_active: config.is_active !== undefined ? config.is_active : true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'dashboard_type,component_name,config_key'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error upserting dashboard configuration:', error);
      throw error;
    }
  }

  /**
   * Create or update theme configuration
   * @param {Object} theme - Theme data
   * @returns {Promise<Object>} Created/updated theme
   */
  static async upsertThemeConfiguration(theme) {
    try {
      const { data, error } = await supabase
        .from('theme_configurations')
        .upsert({
          theme_name: theme.theme_name,
          theme_type: theme.theme_type,
          primary_color: theme.primary_color,
          secondary_color: theme.secondary_color,
          accent_color: theme.accent_color,
          background_color: theme.background_color,
          text_color: theme.text_color,
          border_color: theme.border_color,
          success_color: theme.success_color,
          warning_color: theme.warning_color,
          error_color: theme.error_color,
          info_color: theme.info_color,
          css_variables: theme.css_variables,
          is_default: theme.is_default || false,
          is_active: theme.is_active !== undefined ? theme.is_active : true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'theme_name'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error upserting theme configuration:', error);
      throw error;
    }
  }

  /**
   * Create or update dynamic content
   * @param {Object} content - Content data
   * @returns {Promise<Object>} Created/updated content
   */
  static async upsertDynamicContent(content) {
    try {
      const { data, error } = await supabase
        .from('dynamic_content')
        .upsert({
          content_type: content.content_type,
          content_category: content.content_category,
          title: content.title,
          content: content.content,
          metadata: content.metadata,
          target_roles: content.target_roles,
          start_date: content.start_date,
          end_date: content.end_date,
          is_active: content.is_active !== undefined ? content.is_active : true,
          display_order: content.display_order || 0,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error upserting dynamic content:', error);
      throw error;
    }
  }

  /**
   * Delete configuration by ID
   * @param {string} table - Table name
   * @param {string} id - Configuration ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteConfiguration(table, id) {
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error(`Error deleting configuration from ${table}:`, error);
      throw error;
    }
  }

  /**
   * Bulk update configurations
   * @param {string} table - Table name
   * @param {Array} configurations - Array of configurations to update
   * @returns {Promise<Array>} Updated configurations
   */
  static async bulkUpdateConfigurations(table, configurations) {
    try {
      const updates = configurations.map(config => ({
        ...config,
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from(table)
        .upsert(updates)
        .select();

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error(`Error bulk updating configurations in ${table}:`, error);
      throw error;
    }
  }
}

export default UIConfigAPI;

// Export individual methods for convenience
export {
  UIConfigAPI
};