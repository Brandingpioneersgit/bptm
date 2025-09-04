// Secure configuration management for sensitive data
import { AuthSecurity } from '../utils/securityUtils.js';

/**
 * Secure configuration manager
 */
class SecureConfig {
  constructor() {
    this.config = new Map();
    this.initialized = false;
    this.initializeConfig();
  }

  /**
   * Initialize secure configuration
   */
  initializeConfig() {
    try {
      // Validate required environment variables
      this.validateEnvironment();
      
      // Set up secure configuration
      this.setupSecureConfig();
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize secure configuration:', error);
      this.initialized = false;
    }
  }

  /**
   * Validate required environment variables
   */
  validateEnvironment() {
    const required = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];

    const missing = required.filter(key => !import.meta.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate URL format
    try {
      new URL(import.meta.env.VITE_SUPABASE_URL);
    } catch {
      throw new Error('Invalid VITE_SUPABASE_URL format');
    }

    // Validate key format (basic check)
    if (import.meta.env.VITE_SUPABASE_ANON_KEY.length < 32) {
      throw new Error('Invalid VITE_SUPABASE_ANON_KEY format');
    }
  }

  /**
   * Set up secure configuration
   */
  setupSecureConfig() {
    // Supabase configuration
    this.config.set('supabase', {
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
    });

    // Security settings
    this.config.set('security', {
      maxLoginAttempts: 5,
      loginCooldownMs: 15 * 60 * 1000, // 15 minutes
      sessionTimeoutMs: 24 * 60 * 60 * 1000, // 24 hours
      tokenExpiryMs: 60 * 60 * 1000, // 1 hour
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      }
    });

    // Admin configuration (more secure approach)
    this.config.set('admin', {
      // Generate a secure admin token if not provided
      token: this.getSecureAdminToken(),
      permissions: ['read', 'write', 'delete', 'manage_users'],
      sessionDuration: 8 * 60 * 60 * 1000 // 8 hours
    });

    // API configuration
    this.config.set('api', {
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      rateLimitWindow: 60 * 1000, // 1 minute
      rateLimitMax: 100 // requests per window
    });

    // Content Security Policy
    this.config.set('csp', {
      allowedDomains: [
        'supabase.co',
        'supabase.com',
        'googleapis.com',
        'gstatic.com',
        'google.com',
        'genspark.ai'
      ],
      allowedProtocols: ['https:', 'http:'],
      blockInlineScripts: true,
      blockInlineStyles: false // Allow for styled-components
    });
  }

  /**
   * Get secure admin token
   */
  getSecureAdminToken() {
    // First try environment variable
    const envToken = import.meta.env.VITE_ADMIN_ACCESS_TOKEN;
    
    if (envToken && envToken !== 'admin' && envToken.length >= 16) {
      return envToken;
    }

    // If no secure token in env, generate one and warn
    console.warn('No secure admin token found in environment. Using generated token.');
    console.warn('Please set VITE_ADMIN_ACCESS_TOKEN to a secure value in production.');
    
    // Generate a secure token for this session
    return AuthSecurity.generateSecureToken(32);
  }

  /**
   * Get configuration value
   */
  get(key, subKey = null) {
    if (!this.initialized) {
      throw new Error('Configuration not initialized');
    }

    const config = this.config.get(key);
    
    if (!config) {
      throw new Error(`Configuration key '${key}' not found`);
    }

    if (subKey) {
      if (!(subKey in config)) {
        throw new Error(`Configuration subkey '${key}.${subKey}' not found`);
      }
      return config[subKey];
    }

    return config;
  }

  /**
   * Check if configuration is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Get sanitized configuration for logging
   */
  getSanitizedConfig() {
    const sanitized = {};
    
    for (const [key, value] of this.config.entries()) {
      if (key === 'supabase') {
        sanitized[key] = {
          url: value.url,
          anonKey: '***REDACTED***'
        };
      } else if (key === 'admin') {
        sanitized[key] = {
          token: '***REDACTED***',
          permissions: value.permissions,
          sessionDuration: value.sessionDuration
        };
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Validate admin token
   */
  validateAdminToken(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const adminConfig = this.get('admin');
    return token === adminConfig.token;
  }

  /**
   * Get security headers for API requests
   */
  getSecurityHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }
}

// Export singleton instance
export const secureConfig = new SecureConfig();

// Export specific getters for common use cases
export const getSupabaseConfig = () => secureConfig.get('supabase');
export const getSecurityConfig = () => secureConfig.get('security');
export const getAdminConfig = () => secureConfig.get('admin');
export const getApiConfig = () => secureConfig.get('api');
export const getCSPConfig = () => secureConfig.get('csp');

// Backward compatibility (deprecated - use secureConfig instead)
export const ADMIN_TOKEN = secureConfig.get('admin', 'token');

// Security validation helpers
export const validateAdminAccess = (token) => secureConfig.validateAdminToken(token);
export const getSecurityHeaders = () => secureConfig.getSecurityHeaders();