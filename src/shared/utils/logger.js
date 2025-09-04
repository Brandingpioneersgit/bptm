/**
 * Production-safe logging utility
 * Conditionally logs messages based on environment
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

/**
 * Logger that respects production environment
 */
export const logger = {
  /**
   * Log general information (hidden in production)
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (shown in all environments)
   */
  warn: (...args) => {
    console.warn(...args);
  },

  /**
   * Log errors (shown in all environments)
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Log debug information (hidden in production)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Log information (hidden in production)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Force log in all environments (use sparingly)
   */
  force: (...args) => {
    console.log(...args);
  },

  /**
   * Development-only logging group
   */
  group: (label, callback) => {
    if (isDevelopment && callback) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  },

  /**
   * Development-only table logging
   */
  table: (data) => {
    if (isDevelopment) {
      console.table(data);
    }
  }
};

/**
 * Environment information
 */
export const env = {
  isDevelopment,
  isProduction,
  mode: import.meta.env.MODE
};

export default logger;