// Security audit logging and monitoring system
import { SessionSecurity } from './securityUtils.js';

/**
 * Security audit logger for tracking security events
 */
export class SecurityAuditLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
    this.sessionId = SessionSecurity.generateSessionId();
    this.initializeLogger();
  }

  /**
   * Initialize the audit logger
   */
  initializeLogger() {
    // Load existing logs from session storage
    this.loadLogs();
    
    // Set up periodic log cleanup
    setInterval(() => {
      this.cleanupOldLogs();
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }

  /**
   * Load logs from session storage
   */
  loadLogs() {
    try {
      const storedLogs = sessionStorage.getItem('security_audit_logs');
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs).slice(-this.maxLogs);
      }
    } catch (error) {
      console.warn('Failed to load security audit logs:', error);
      this.logs = [];
    }
  }

  /**
   * Save logs to session storage
   */
  saveLogs() {
    try {
      sessionStorage.setItem('security_audit_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.warn('Failed to save security audit logs:', error);
    }
  }

  /**
   * Clean up old logs
   */
  cleanupOldLogs() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.logs = this.logs.filter(log => log.timestamp > oneDayAgo);
    
    // Keep only the most recent logs if we exceed the limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    this.saveLogs();
  }

  /**
   * Create a security log entry
   */
  createLogEntry(event, level, details = {}) {
    const logEntry = {
      id: this.generateLogId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      event,
      level,
      details: this.sanitizeLogDetails(details),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ip: this.getClientIP() // This would need server-side implementation
    };

    return logEntry;
  }

  /**
   * Generate unique log ID
   */
  generateLogId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize log details to prevent sensitive data exposure
   */
  sanitizeLogDetails(details) {
    const sanitized = { ...details };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'credential'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }
    
    // Truncate long strings
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string' && value.length > 500) {
        sanitized[key] = value.substring(0, 500) + '...[TRUNCATED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Get client IP (placeholder - would need server-side implementation)
   */
  getClientIP() {
    // This is a placeholder. In a real implementation, you would get this from the server
    return 'client-side-unknown';
  }

  /**
   * Log a security event
   */
  log(event, level, details = {}) {
    const logEntry = this.createLogEntry(event, level, details);
    this.logs.push(logEntry);
    
    // Console logging based on level
    switch (level) {
      case 'critical':
        console.error('🚨 SECURITY CRITICAL:', logEntry);
        break;
      case 'warning':
        console.warn('⚠️ SECURITY WARNING:', logEntry);
        break;
      case 'info':
        console.info('ℹ️ SECURITY INFO:', logEntry);
        break;
      default:
        console.log('📝 SECURITY LOG:', logEntry);
    }
    
    // Save to storage
    this.saveLogs();
    
    // Send to server if critical
    if (level === 'critical') {
      this.sendCriticalAlert(logEntry);
    }
  }

  /**
   * Send critical security alerts to server
   */
  async sendCriticalAlert(logEntry) {
    try {
      // This would send the alert to your security monitoring endpoint
      // For now, we'll just log it locally
      console.error('CRITICAL SECURITY ALERT - Would send to server:', logEntry);
      
      // In a real implementation:
      // await fetch('/api/security/alert', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // });
    } catch (error) {
      console.error('Failed to send critical security alert:', error);
    }
  }

  /**
   * Get logs by criteria
   */
  getLogs(criteria = {}) {
    let filteredLogs = [...this.logs];
    
    if (criteria.level) {
      filteredLogs = filteredLogs.filter(log => log.level === criteria.level);
    }
    
    if (criteria.event) {
      filteredLogs = filteredLogs.filter(log => log.event === criteria.event);
    }
    
    if (criteria.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= criteria.since);
    }
    
    if (criteria.sessionId) {
      filteredLogs = filteredLogs.filter(log => log.sessionId === criteria.sessionId);
    }
    
    return filteredLogs.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get security statistics
   */
  getSecurityStats(timeframe = 24 * 60 * 60 * 1000) { // Default: last 24 hours
    const since = Date.now() - timeframe;
    const recentLogs = this.getLogs({ since });
    
    const stats = {
      total: recentLogs.length,
      critical: recentLogs.filter(log => log.level === 'critical').length,
      warnings: recentLogs.filter(log => log.level === 'warning').length,
      info: recentLogs.filter(log => log.level === 'info').length,
      events: {},
      timeframe: timeframe
    };
    
    // Count events
    recentLogs.forEach(log => {
      stats.events[log.event] = (stats.events[log.event] || 0) + 1;
    });
    
    return stats;
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    this.saveLogs();
    this.log('audit_logs_cleared', 'info', { action: 'manual_clear' });
  }

  /**
   * Export logs for analysis
   */
  exportLogs(format = 'json') {
    const exportData = {
      exportTime: new Date().toISOString(),
      sessionId: this.sessionId,
      totalLogs: this.logs.length,
      logs: this.logs
    };
    
    if (format === 'csv') {
      return this.convertToCSV(exportData.logs);
    }
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Convert logs to CSV format
   */
  convertToCSV(logs) {
    if (logs.length === 0) return 'No logs available';
    
    const headers = ['timestamp', 'event', 'level', 'sessionId', 'url', 'userAgent'];
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
      const row = headers.map(header => {
        const value = log[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`; // Escape quotes
      });
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }
}

/**
 * Security event types and logging helpers
 */
export const SecurityEvents = {
  // Authentication events
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGIN_RATE_LIMITED: 'login_rate_limited',
  LOGOUT: 'logout',
  SESSION_EXPIRED: 'session_expired',
  SESSION_HIJACK_ATTEMPT: 'session_hijack_attempt',
  
  // Authorization events
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  PERMISSION_DENIED: 'permission_denied',
  ADMIN_ACCESS: 'admin_access',
  
  // Input validation events
  INVALID_INPUT: 'invalid_input',
  XSS_ATTEMPT: 'xss_attempt',
  SQL_INJECTION_ATTEMPT: 'sql_injection_attempt',
  
  // API security events
  API_RATE_LIMITED: 'api_rate_limited',
  INVALID_API_REQUEST: 'invalid_api_request',
  API_ERROR: 'api_error',
  
  // Data security events
  DATA_EXPORT: 'data_export',
  DATA_MODIFICATION: 'data_modification',
  SENSITIVE_DATA_ACCESS: 'sensitive_data_access',
  
  // System security events
  SECURITY_CONFIG_CHANGE: 'security_config_change',
  AUDIT_LOG_ACCESS: 'audit_log_access',
  SECURITY_SCAN: 'security_scan'
};

/**
 * Security logging helpers
 */
export class SecurityLogger {
  static logLoginSuccess(userType, userId, details = {}) {
    auditLogger.log(SecurityEvents.LOGIN_SUCCESS, 'info', {
      userType,
      userId,
      ...details
    });
  }

  static logLoginFailure(userType, reason, details = {}) {
    auditLogger.log(SecurityEvents.LOGIN_FAILURE, 'warning', {
      userType,
      reason,
      ...details
    });
  }

  static logRateLimitExceeded(type, identifier, details = {}) {
    auditLogger.log(SecurityEvents.LOGIN_RATE_LIMITED, 'warning', {
      type,
      identifier,
      ...details
    });
  }

  static logUnauthorizedAccess(resource, userType, details = {}) {
    auditLogger.log(SecurityEvents.UNAUTHORIZED_ACCESS, 'critical', {
      resource,
      userType,
      ...details
    });
  }

  static logInvalidInput(field, value, reason, details = {}) {
    auditLogger.log(SecurityEvents.INVALID_INPUT, 'warning', {
      field,
      value: typeof value === 'string' ? value.substring(0, 100) : value,
      reason,
      ...details
    });
  }

  static logXSSAttempt(input, location, details = {}) {
    auditLogger.log(SecurityEvents.XSS_ATTEMPT, 'critical', {
      input: input.substring(0, 200),
      location,
      ...details
    });
  }

  static logDataAccess(dataType, action, userType, details = {}) {
    auditLogger.log(SecurityEvents.SENSITIVE_DATA_ACCESS, 'info', {
      dataType,
      action,
      userType,
      ...details
    });
  }

  static logAPIError(endpoint, error, details = {}) {
    auditLogger.log(SecurityEvents.API_ERROR, 'warning', {
      endpoint,
      error: error.message || error,
      ...details
    });
  }

  static logSessionExpiry(sessionId, reason, details = {}) {
    auditLogger.log(SecurityEvents.SESSION_EXPIRED, 'info', {
      sessionId,
      reason,
      ...details
    });
  }

  static logAdminAccess(action, adminId, details = {}) {
    auditLogger.log(SecurityEvents.ADMIN_ACCESS, 'info', {
      action,
      adminId,
      ...details
    });
  }
}

// Export singleton instance
export const auditLogger = new SecurityAuditLogger();

// Export convenience functions
export const logSecurityEvent = (event, level, details) => auditLogger.log(event, level, details);
export const getSecurityLogs = (criteria) => auditLogger.getLogs(criteria);
export const getSecurityStats = (timeframe) => auditLogger.getSecurityStats(timeframe);
export const exportSecurityLogs = (format) => auditLogger.exportLogs(format);