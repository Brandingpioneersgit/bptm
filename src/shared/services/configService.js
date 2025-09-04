/**
 * Configuration Service
 * Unified interface for accessing UI configurations and data
 * This service abstracts the data source, making it easy to switch from mock data to database calls
 */

import {
  DASHBOARD_CARDS,
  NAVIGATION_PATHS,
  THEMES,
  SIDEBAR_CONFIG,
  STATUS_CONFIG,
  PROGRESS_COLORS,
  CALENDAR_EVENT_TYPES,
  PROFILE_FIELD_LABELS,
  DEFAULT_VALUES,
  TABLE_HEADERS,
  PLACEHOLDER_MESSAGES,
  FILTER_OPTIONS,
  TAB_CONFIGS,
  MONTH_NAMES,
  MONTH_NAMES_SHORT,
  INSTRUCTIONAL_TEXT
} from '../config/uiConfig.js';

// Note: UIConfigAPI will be available when backend is implemented
// import UIConfigAPI from '../../api/uiConfigAPI.js';

import {
  MOCK_DATA,
  MOCK_SYSTEM_ACTIVITIES,
  MOCK_USER_METRICS,
  MOCK_PERFORMANCE_METRICS,
  MOCK_ACTIVE_USERS,
  MOCK_DYNAMIC_STATS,
  MOCK_INTERN_DATA,
  MOCK_ADS_EMPLOYEE_DATA,
  MOCK_ADS_CLIENTS,
  MOCK_MONTHLY_PERFORMANCE,
  MOCK_CALENDAR_EVENTS,
  MOCK_EMPLOYEE_PERFORMANCE,
  MOCK_DAILY_REPORTS,
  MOCK_PROFILE_TEMPLATES,
  MOCK_FORM_DATA,
  MOCK_DASHBOARD_STATS
} from '../config/mockData.js';
import liveDataService from './liveDataService.js';

/**
 * Configuration Service Class
 * Provides centralized access to all configuration data
 */
class ConfigService {
  constructor() {
    this.useDatabase = true; // Toggle this to switch between mock data and database
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get dashboard cards configuration
   * @param {string} userType - Type of user (superAdmin, hr, manager, etc.)
   * @returns {Array} Dashboard cards configuration
   */
  getDashboardCards(userType) {
    return DASHBOARD_CARDS[userType] || [];
  }

  /**
   * Get navigation paths
   * @param {string} category - Category of paths (dashboards, profiles, forms)
   * @returns {Object} Navigation paths object
   */
  getNavigationPaths(category = null) {
    if (category) {
      return NAVIGATION_PATHS[category] || {};
    }
    return NAVIGATION_PATHS;
  }

  /**
   * Get theme configuration
   * @param {string} themeName - Name of the theme (light, dark, blue)
   * @returns {Object} Theme configuration
   */
  getTheme(themeName = 'light') {
    return THEMES[themeName] || THEMES.light;
  }

  /**
   * Get all available themes
   * @returns {Object} All themes
   */
  getAllThemes() {
    return THEMES;
  }

  /**
   * Get sidebar configuration
   * @param {string} userType - Type of user (superAdmin, hr, manager)
   * @returns {Object} Sidebar configuration
   */
  getSidebarConfig(userType) {
    return SIDEBAR_CONFIG[userType] || {};
  }

  /**
   * Get status configuration
   * @param {string} type - Type of status (project, employee, intern)
   * @param {string} status - Specific status
   * @returns {Object} Status configuration
   */
  getStatusConfig(type, status = null) {
    const config = STATUS_CONFIG[type] || {};
    if (status) {
      return config[status] || {};
    }
    return config;
  }

  /**
   * Get progress bar colors
   * @param {string} color - Color name
   * @returns {string} CSS class for progress bar color
   */
  getProgressColor(color) {
    return PROGRESS_COLORS[color] || PROGRESS_COLORS.blue;
  }

  /**
   * Get calendar event type configuration
   * @param {string} eventType - Type of event
   * @returns {Object} Event type configuration
   */
  getCalendarEventType(eventType) {
    return CALENDAR_EVENT_TYPES[eventType] || {};
  }

  /**
   * Get profile field labels
   * @param {string} category - Category of fields (personal, professional, skills, performance)
   * @returns {Object} Field labels
   */
  getProfileFieldLabels(category = null) {
    if (category) {
      return PROFILE_FIELD_LABELS[category] || {};
    }
    return PROFILE_FIELD_LABELS;
  }

  /**
   * Get default values
   * @param {string} category - Category of defaults (profile, metrics)
   * @returns {Object} Default values
   */
  getDefaultValues(category = null) {
    if (category) {
      return DEFAULT_VALUES[category] || {};
    }
    return DEFAULT_VALUES;
  }

  /**
   * Get table headers
   * @param {string} tableType - Type of table
   * @returns {Array} Table headers
   */
  getTableHeaders(tableType) {
    return TABLE_HEADERS[tableType] || [];
  }

  /**
   * Get placeholder messages
   * @param {string} messageType - Type of message
   * @returns {string} Placeholder message
   */
  getPlaceholderMessage(messageType) {
    return PLACEHOLDER_MESSAGES[messageType] || PLACEHOLDER_MESSAGES.noData;
  }

  /**
   * Get filter options
   * @param {string} filterType - Type of filter
   * @returns {Array} Filter options
   */
  getFilterOptions(filterType) {
    return FILTER_OPTIONS[filterType] || [];
  }

  /**
   * Get tab configurations
   * @param {string} tabType - Type of tabs
   * @returns {Array} Tab configuration
   */
  getTabConfig(tabType) {
    return TAB_CONFIGS[tabType] || [];
  }

  /**
   * Get month names
   * @param {boolean} short - Whether to return short names
   * @returns {Array} Month names
   */
  getMonthNames(short = false) {
    return short ? MONTH_NAMES_SHORT : MONTH_NAMES;
  }

  /**
   * Get instructional text
   * @param {string} section - Section name
   * @param {string} subsection - Subsection name
   * @returns {string} Instructional text
   */
  getInstructionalText(section, subsection = null) {
    const sectionText = INSTRUCTIONAL_TEXT[section] || {};
    if (subsection) {
      return sectionText[subsection] || '';
    }
    return sectionText;
  }

  // Data Methods (these will eventually call database APIs)

  /**
   * Get system activities
   * @returns {Promise<Array>} System activities data
   */
  async getSystemActivities() {
    if (this.useDatabase) {
      try {
        return await liveDataService.getSystemActivities();
      } catch (error) {
        console.error('Failed to fetch system activities from database:', error);
        return MOCK_SYSTEM_ACTIVITIES;
      }
    }
    return MOCK_SYSTEM_ACTIVITIES;
  }

  /**
   * Get user metrics
   * @returns {Promise<Object>} User metrics data
   */
  async getUserMetrics() {
    if (this.useDatabase) {
      try {
        return await liveDataService.getUserMetrics();
      } catch (error) {
        console.error('Failed to fetch user metrics from database:', error);
        return MOCK_USER_METRICS;
      }
    }
    return MOCK_USER_METRICS;
  }

  /**
   * Get performance metrics
   * @returns {Promise<Object>} Performance metrics data
   */
  async getPerformanceMetrics() {
    if (this.useDatabase) {
      try {
        return await liveDataService.getPerformanceMetrics();
      } catch (error) {
        console.error('Failed to fetch performance metrics from database:', error);
        return MOCK_PERFORMANCE_METRICS;
      }
    }
    return MOCK_PERFORMANCE_METRICS;
  }

  /**
   * Get active users data
   * @returns {Promise<Object>} Active users data
   */
  async getActiveUsers() {
    if (this.useDatabase) {
      try {
        return await liveDataService.getActiveUsers();
      } catch (error) {
        console.error('Failed to fetch active users from database:', error);
        return MOCK_ACTIVE_USERS;
      }
    }
    return MOCK_ACTIVE_USERS;
  }

  /**
   * Get dynamic stats
   * @returns {Promise<Object>} Dynamic stats data
   */
  async getDynamicStats() {
    if (this.useDatabase) {
      try {
        return await liveDataService.getDynamicStats();
      } catch (error) {
        console.error('Failed to fetch dynamic stats from database:', error);
        return MOCK_DYNAMIC_STATS;
      }
    }
    return MOCK_DYNAMIC_STATS;
  }

  /**
   * Get intern data
   * @param {string} internId - Intern ID
   * @returns {Promise<Object>} Intern data
   */
  async getInternData(internId = null) {
    if (this.useDatabase) {
      // TODO: Replace with actual database call
      // return await this.apiCall(`/api/interns/${internId}`);
    }
    return MOCK_INTERN_DATA;
  }

  /**
   * Get ads executive employee data
   * @param {string} employeeId - Employee ID
   * @returns {Promise<Object>} Employee data
   */
  async getAdsEmployeeData(employeeId = null) {
    if (this.useDatabase) {
      // TODO: Replace with actual database call
      // return await this.apiCall(`/api/ads-employees/${employeeId}`);
    }
    return MOCK_ADS_EMPLOYEE_DATA;
  }

  /**
   * Get ads clients data
   * @returns {Promise<Array>} Clients data
   */
  async getAdsClients() {
    if (this.useDatabase) {
      // TODO: Replace with actual database call
      // return await this.apiCall('/api/ads-clients');
    }
    return MOCK_ADS_CLIENTS;
  }

  /**
   * Get monthly performance data
   * @param {string} employeeId - Employee ID
   * @returns {Promise<Array>} Monthly performance data
   */
  async getMonthlyPerformance(employeeId = null) {
    if (this.useDatabase) {
      // TODO: Replace with actual database call
      // return await this.apiCall(`/api/monthly-performance/${employeeId}`);
    }
    return MOCK_MONTHLY_PERFORMANCE;
  }

  /**
   * Get calendar events
   * @param {string} month - Month in YYYY-MM format
   * @returns {Promise<Array>} Calendar events
   */
  async getCalendarEvents(month = null) {
    if (this.useDatabase) {
      // TODO: Replace with actual database call
      // return await this.apiCall(`/api/calendar-events?month=${month}`);
    }
    return MOCK_CALENDAR_EVENTS;
  }

  /**
   * Get employee performance data
   * @returns {Promise<Array>} Employee performance data
   */
  async getEmployeePerformance() {
    if (this.useDatabase) {
      try {
        return await liveDataService.getEmployeePerformance();
      } catch (error) {
        console.error('Failed to fetch employee performance from database:', error);
        return MOCK_EMPLOYEE_PERFORMANCE;
      }
    }
    return MOCK_EMPLOYEE_PERFORMANCE;
  }

  /**
   * Get daily reports
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Array>} Daily reports data
   */
  async getDailyReports(date = null) {
    if (this.useDatabase) {
      // TODO: Replace with actual database call
      // return await this.apiCall(`/api/daily-reports?date=${date}`);
    }
    return MOCK_DAILY_REPORTS;
  }

  /**
   * Get profile template
   * @param {string} userType - Type of user
   * @returns {Promise<Object>} Profile template
   */
  async getProfileTemplate(userType) {
    if (this.useDatabase) {
      // TODO: Replace with actual database call
      // return await this.apiCall(`/api/profile-templates/${userType}`);
    }
    return MOCK_PROFILE_TEMPLATES[userType] || {};
  }

  /**
   * Get form data
   * @param {string} formType - Type of form
   * @returns {Promise<Object>} Form data
   */
  async getFormData(formType) {
    if (this.useDatabase) {
      // TODO: Replace with actual database call
      // return await this.apiCall(`/api/form-data/${formType}`);
    }
    return MOCK_FORM_DATA[formType] || {};
  }

  /**
   * Get dashboard statistics
   * @param {string} dashboardType - Type of dashboard
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats(dashboardType) {
    if (this.useDatabase) {
      try {
        if (dashboardType) {
          return await liveDataService.getDashboardStats(dashboardType);
        }
        return await liveDataService.getDynamicStats();
      } catch (error) {
        console.error('Failed to fetch dashboard stats from database:', error);
        return MOCK_DASHBOARD_STATS[dashboardType] || {};
      }
    }
    return MOCK_DASHBOARD_STATS[dashboardType] || {};
  }

  /**
   * Enable database mode
   */
  enableDatabase() {
    this.useDatabase = true;
  }

  /**
   * Disable database mode (use mock data)
   */
  disableDatabase() {
    this.useDatabase = false;
  }

  /**
   * Check if database mode is enabled
   * @returns {boolean} Database mode status
   */
  isDatabaseEnabled() {
    return this.useDatabase;
  }

  /**
   * Get UI configuration
   * @returns {Object} Complete UI configuration object
   */
  async getUIConfig() {
    try {
      const { UI_CONFIG } = await import('../config/uiConfig.js');
      return UI_CONFIG;
    } catch (error) {
      console.error('Error loading UI config:', error);
      return {};
    }
  }

  async getDashboardConfig(dashboardType) {
    try {
      const { getDashboardConfig } = await import('../../config/dashboardConfig.js');
      return getDashboardConfig(dashboardType);
    } catch (error) {
      console.error('Error loading dashboard config:', error);
      return {};
    }
  }

  async generateDefaultData(dashboardType, user) {
    try {
      const dashboardConfig = await import('../../config/dashboardConfig.js');
      
      switch (dashboardType) {
        case 'intern':
          return dashboardConfig.generateDefaultInternData(user);
        case 'adsExecutive':
          return dashboardConfig.generateDefaultAdsExecutiveData(user);
        default:
          return {};
      }
    } catch (error) {
      console.error('Error generating default data:', error);
      return {};
    }
  }

  async getScoreColor(score, type = 'common') {
    try {
      const { getScoreColor } = await import('../../config/dashboardConfig.js');
      return getScoreColor(score, type);
    } catch (error) {
      console.error('Error getting score color:', error);
      return 'text-gray-600';
    }
  }

  async getPerformanceLevel(score, dashboardType = 'manager') {
    try {
      const { getPerformanceLevel } = await import('../../config/dashboardConfig.js');
      return getPerformanceLevel(score, dashboardType);
    } catch (error) {
      console.error('Error getting performance level:', error);
      return 'Medium';
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Generic API call method (for future database integration)
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} API response
   */
  async apiCall(endpoint, options = {}) {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }

  // =============================================
  // DATABASE INTEGRATION METHODS
  // =============================================

  /**
   * Get dashboard configuration from database
   * @param {string} dashboardType - Type of dashboard
   * @param {string} componentName - Component name
   * @param {string} configKey - Configuration key
   * @returns {Promise<any>} Configuration value
   */
  async getDashboardConfigFromDB(dashboardType, componentName, configKey = null) {
    if (!this.useDatabase) {
      return null;
    }

    try {
      const filters = {
        dashboard_type: dashboardType,
        component_name: componentName
      };
      
      if (configKey) {
        filters.config_key = configKey;
      }
      
      let endpoint = `/api/dashboard-configurations?dashboard_type=${dashboardType}&component_name=${componentName}`;
      if (configKey) {
        endpoint += `&config_key=${configKey}`;
      }
      
      const response = await this.apiCall(endpoint);
      
      if (configKey && response.length > 0) {
        return response[0].config_value;
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching dashboard config from database:', error);
      return null;
    }
  }

  /**
   * Get theme configuration from database
   * @param {string} themeName - Name of the theme
   * @returns {Promise<Object>} Theme configuration
   */
  async getThemeFromDB(themeName) {
    if (!this.useDatabase) {
      return null;
    }

    try {
      const response = await this.apiCall(`/api/theme-configurations?theme_name=${themeName}`);
      return response.length > 0 ? response[0] : null;
    } catch (error) {
      console.error('Error fetching theme from database:', error);
      return null;
    }
  }

  /**
   * Get navigation configuration from database
   * @param {string} navType - Type of navigation
   * @param {string} role - User role
   * @returns {Promise<Object>} Navigation configuration
   */
  async getNavigationFromDB(navType, role) {
    if (!this.useDatabase) {
      return null;
    }

    try {
      const response = await this.apiCall(`/api/navigation-configurations?nav_type=${navType}&role=${role}`);
      return response.length > 0 ? response[0] : null;
    } catch (error) {
      console.error('Error fetching navigation from database:', error);
      return null;
    }
  }

  /**
   * Get dynamic content from database
   * @param {string} contentType - Type of content
   * @param {Array} targetRoles - Target roles for content
   * @returns {Promise<Array>} Dynamic content
   */
  async getDynamicContentFromDB(contentType, targetRoles = []) {
    if (!this.useDatabase) {
      return [];
    }

    try {
      const filters = { content_type: contentType };
      if (targetRoles.length > 0) {
        filters.target_roles = targetRoles;
      }
      
      let endpoint = `/api/dynamic-content?content_type=${contentType}&is_active=true`;
      if (targetRoles.length > 0) {
        endpoint += `&target_roles=${targetRoles.join(',')}`;
      }
      
      const response = await this.apiCall(endpoint);
      return response || [];
    } catch (error) {
      console.error('Error fetching dynamic content from database:', error);
      return [];
    }
  }

  /**
   * Get UI component settings from database
   * @param {string} componentType - Type of component
   * @param {string} componentName - Component name
   * @param {Array} roles - User roles
   * @returns {Promise<Object>} Component settings
   */
  async getUIComponentSettingsFromDB(componentType, componentName, roles = []) {
    if (!this.useDatabase) {
      return null;
    }

    try {
      const filters = {
        component_type: componentType,
        component_name: componentName
      };
      
      if (roles.length > 0) {
        filters.applies_to_roles = roles;
      }
      
      let endpoint = `/api/ui-component-settings?component_type=${componentType}&component_name=${componentName}&is_active=true`;
      if (roles.length > 0) {
        endpoint += `&applies_to_roles=${roles.join(',')}`;
      }
      
      const response = await this.apiCall(endpoint);
      return response.length > 0 ? response[0].settings : null;
    } catch (error) {
      console.error('Error fetching UI component settings from database:', error);
      return null;
    }
  }

  /**
   * Get application setting from database
   * @param {string} settingKey - Setting key
   * @returns {Promise<any>} Setting value
   */
  async getApplicationSettingFromDB(settingKey) {
    if (!this.useDatabase) {
      return null;
    }

    try {
      const response = await this.apiCall(`/api/application-settings?setting_key=${settingKey}&is_active=true`);
      return response.length > 0 ? response[0].setting_value : null;
    } catch (error) {
      console.error('Error fetching application setting from database:', error);
      return null;
    }
  }

  // =============================================
  // ENHANCED CONFIGURATION METHODS WITH DATABASE FALLBACK
  // =============================================

  /**
   * Get dashboard configuration with database fallback
   * @param {string} dashboardType - Type of dashboard
   * @param {string} componentName - Component name
   * @param {string} configKey - Configuration key
   * @returns {Promise<any>} Configuration value
   */
  async getDashboardConfigEnhanced(dashboardType, componentName, configKey) {
    try {
      // Try database first if enabled
      if (this.useDatabase) {
        const dbConfig = await this.getDashboardConfigFromDB(dashboardType, componentName, configKey);
        if (dbConfig !== null) {
          return dbConfig;
        }
      }
      
      // Fallback to static configuration
      // This would need to be implemented based on your existing config structure
      return null;
    } catch (error) {
      console.error('Error getting enhanced dashboard config:', error);
      return null;
    }
  }

  /**
   * Get theme with database fallback
   * @param {string} themeName - Name of the theme
   * @returns {Promise<Object>} Theme configuration
   */
  async getThemeEnhanced(themeName = 'light') {
    try {
      // Try database first if enabled
      if (this.useDatabase) {
        const dbTheme = await this.getThemeFromDB(themeName);
        if (dbTheme) {
          return {
            name: dbTheme.theme_name,
            type: dbTheme.theme_type,
            colors: {
              primary: dbTheme.primary_color,
              secondary: dbTheme.secondary_color,
              accent: dbTheme.accent_color,
              background: dbTheme.background_color,
              text: dbTheme.text_color,
              border: dbTheme.border_color,
              success: dbTheme.success_color,
              warning: dbTheme.warning_color,
              error: dbTheme.error_color,
              info: dbTheme.info_color
            },
            cssVariables: dbTheme.css_variables || {}
          };
        }
      }
      
      // Fallback to static configuration
      return this.getTheme(themeName);
    } catch (error) {
      console.error('Error getting enhanced theme:', error);
      return this.getTheme(themeName);
    }
  }

  /**
   * Get navigation with database fallback
   * @param {string} navType - Type of navigation
   * @param {string} role - User role
   * @returns {Promise<Object>} Navigation configuration
   */
  async getNavigationEnhanced(navType, role) {
    try {
      // Try database first if enabled
      if (this.useDatabase) {
        const dbNav = await this.getNavigationFromDB(navType, role);
        if (dbNav) {
          return {
            type: dbNav.nav_type,
            role: dbNav.role,
            items: dbNav.nav_items,
            displayOrder: dbNav.display_order
          };
        }
      }
      
      // Fallback to static configuration
      return this.getSidebarConfig(role);
    } catch (error) {
      console.error('Error getting enhanced navigation:', error);
      return this.getSidebarConfig(role);
    }
  }

  /**
   * Get quote of the day with database fallback
   * @param {Array} userRoles - User roles
   * @returns {Promise<string>} Quote of the day
   */
  async getQuoteOfTheDay(userRoles = []) {
    try {
      // Try database first if enabled
      if (this.useDatabase) {
        const quotes = await this.getDynamicContentFromDB('quote_of_day', userRoles);
        if (quotes.length > 0) {
          // Return a random quote
          const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
          return randomQuote.content;
        }
      }
      
      // Fallback to static quotes
      const staticQuotes = [
        "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        "The way to get started is to quit talking and begin doing.",
        "Innovation distinguishes between a leader and a follower.",
        "Your limitation—it's only your imagination.",
        "Great things never come from comfort zones."
      ];
      
      return staticQuotes[Math.floor(Math.random() * staticQuotes.length)];
    } catch (error) {
      console.error('Error getting quote of the day:', error);
      return "Success is not final, failure is not fatal: it is the courage to continue that counts.";
    }
  }

  /**
   * Get announcements with database fallback
   * @param {Array} userRoles - User roles
   * @returns {Promise<Array>} Announcements
   */
  async getAnnouncements(userRoles = []) {
    try {
      // Try database first if enabled
      if (this.useDatabase) {
        const announcements = await this.getDynamicContentFromDB('announcement', userRoles);
        if (announcements.length > 0) {
          return announcements.map(announcement => ({
            id: announcement.id,
            title: announcement.title,
            content: announcement.content,
            startDate: announcement.start_date,
            endDate: announcement.end_date
          }));
        }
      }
      
      // Fallback to empty array or static announcements
      return [];
    } catch (error) {
      console.error('Error getting announcements:', error);
      return [];
    }
  }
}

// Create and export a singleton instance
const configService = new ConfigService();
export default configService;

// Also export the class for testing purposes
export { ConfigService, configService };