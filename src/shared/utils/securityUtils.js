// Security utilities for input validation, sanitization, and protection

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(input) {
    if (typeof input !== 'string') return input;
    
    // Remove script tags and event handlers
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .trim();
  }

  /**
   * Sanitize user input for database operations
   */
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potential SQL injection patterns
    return input
      .replace(/[';"\\]/g, '') // Remove quotes and backslashes
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove block comment start
      .replace(/\*\//g, '') // Remove block comment end
      .trim();
  }

  /**
   * Validate and sanitize phone numbers
   */
  static sanitizePhone(phone) {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Validate length (10 digits for US numbers)
    if (cleaned.length === 10) {
      return cleaned;
    }
    
    throw new Error('Invalid phone number format');
  }

  /**
   * Validate and sanitize email addresses
   */
  static sanitizeEmail(email) {
    if (!email) return '';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleaned = email.toLowerCase().trim();
    
    if (!emailRegex.test(cleaned)) {
      throw new Error('Invalid email format');
    }
    
    return cleaned;
  }

  /**
   * Sanitize URLs to prevent malicious redirects
   */
  static sanitizeUrl(url) {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid URL protocol');
      }
      
      return urlObj.toString();
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }
}

/**
 * Authentication security utilities
 */
export class AuthSecurity {
  /**
   * Generate secure random token
   */
  static generateSecureToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash sensitive data (for client-side hashing before transmission)
   */
  static async hashData(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculatePasswordStrength(password)
    };
  }

  /**
   * Calculate password strength score
   */
  static calculatePasswordStrength(password) {
    let score = 0;
    
    // Length bonus
    score += Math.min(password.length * 2, 20);
    
    // Character variety bonus
    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/\d/.test(password)) score += 5;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
    
    // Penalty for common patterns
    if (/123|abc|qwe/i.test(password)) score -= 10;
    if (/password|admin|user/i.test(password)) score -= 20;
    
    return Math.max(0, Math.min(100, score));
  }
}

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  constructor() {
    this.attempts = new Map();
  }

  /**
   * Check if action is rate limited
   */
  isRateLimited(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return {
        isLimited: true,
        retryAfter: Math.ceil((recentAttempts[0] + windowMs - now) / 1000)
      };
    }
    
    return { isLimited: false };
  }

  /**
   * Record an attempt
   */
  recordAttempt(key) {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    attempts.push(now);
    this.attempts.set(key, attempts);
  }

  /**
   * Clear attempts for a key
   */
  clearAttempts(key) {
    this.attempts.delete(key);
  }
}

/**
 * Content Security Policy utilities
 */
export class CSPUtils {
  /**
   * Generate nonce for inline scripts
   */
  static generateNonce() {
    return AuthSecurity.generateSecureToken(16);
  }

  /**
   * Validate if URL is allowed by CSP
   */
  static isAllowedUrl(url, allowedDomains = []) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Allow localhost for development
      if (domain === 'localhost' || domain === '127.0.0.1') {
        return true;
      }
      
      // Check against allowed domains
      return allowedDomains.some(allowed => 
        domain === allowed || domain.endsWith('.' + allowed)
      );
    } catch {
      return false;
    }
  }
}

/**
 * Session security utilities
 */
export class SessionSecurity {
  /**
   * Generate secure session ID
   */
  static generateSessionId() {
    return AuthSecurity.generateSecureToken(32);
  }

  /**
   * Validate session expiry
   */
  static isSessionExpired(sessionStart, maxAgeMs = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    return (now - sessionStart) > maxAgeMs;
  }

  /**
   * Secure session storage - using localStorage for persistence across page reloads
   */
  static setSecureSession(key, value, expiryMs = 24 * 60 * 60 * 1000) {
    const sessionData = {
      value,
      timestamp: Date.now(),
      expiry: Date.now() + expiryMs
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(sessionData));
    } catch (error) {
      console.warn('Failed to set secure session:', error);
    }
  }

  /**
   * Get secure session data
   */
  static getSecureSession(key) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const sessionData = JSON.parse(stored);
      
      // Check if session is expired
      if (Date.now() > sessionData.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      return sessionData.value;
    } catch (error) {
      console.warn('Failed to get secure session:', error);
      return null;
    }
  }

  /**
   * Clear secure session
   */
  static clearSecureSession(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear secure session:', error);
    }
  }
}

// Export singleton instances
export const rateLimiter = new RateLimiter();