// Secure API client with built-in security measures
import { getSecurityHeaders, getApiConfig } from '../config/secureConfig.js';
import { InputSanitizer, rateLimiter } from './securityUtils.js';

/**
 * Secure API client with built-in security measures
 */
export class SecureApiClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.defaultHeaders = getSecurityHeaders();
    this.config = getApiConfig();
    this.requestQueue = new Map();
  }

  /**
   * Generate request signature for integrity verification
   */
  async generateRequestSignature(method, url, data = null) {
    const timestamp = Date.now();
    const nonce = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    const payload = JSON.stringify({ method, url, data, timestamp, nonce });
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return { signature, timestamp, nonce };
  }

  /**
   * Validate and sanitize request data
   */
  sanitizeRequestData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Sanitize string inputs
        sanitized[key] = InputSanitizer.sanitizeInput(value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeRequestData(value);
      } else {
        // Keep other types as-is (numbers, booleans, etc.)
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Check rate limiting for API requests
   */
  checkRateLimit(endpoint) {
    const rateLimitResult = rateLimiter.isRateLimited(
      `api_${endpoint}`,
      this.config.rateLimitMax,
      this.config.rateLimitWindow
    );
    
    if (rateLimitResult.isLimited) {
      throw new Error(`Rate limit exceeded for ${endpoint}. Try again in ${rateLimitResult.retryAfter} seconds.`);
    }
    
    rateLimiter.recordAttempt(`api_${endpoint}`);
  }

  /**
   * Create secure request configuration
   */
  async createRequestConfig(method, url, data = null, options = {}) {
    // Rate limiting check
    this.checkRateLimit(url);
    
    // Sanitize request data
    const sanitizedData = data ? this.sanitizeRequestData(data) : null;
    
    // Generate request signature
    const { signature, timestamp, nonce } = await this.generateRequestSignature(method, url, sanitizedData);
    
    // Prepare headers
    const headers = {
      ...this.defaultHeaders,
      'X-Request-Signature': signature,
      'X-Request-Timestamp': timestamp.toString(),
      'X-Request-Nonce': nonce,
      'X-Requested-With': 'XMLHttpRequest', // CSRF protection
      ...options.headers
    };

    // Add CSRF token if available
    const csrfToken = this.getCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const config = {
      method,
      headers,
      signal: options.signal,
      ...options
    };

    if (sanitizedData && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      config.body = JSON.stringify(sanitizedData);
    }

    return config;
  }

  /**
   * Get CSRF token from meta tag or cookie
   */
  getCSRFToken() {
    // Try to get from meta tag first
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }

    // Try to get from cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf_token') {
        return decodeURIComponent(value);
      }
    }

    return null;
  }

  /**
   * Handle API response with security validation
   */
  async handleResponse(response, url) {
    // Check for security headers in response
    this.validateResponseHeaders(response);
    
    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw new APIError(errorData.message || 'Request failed', response.status, errorData);
    }

    // Validate content type
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      console.warn(`Unexpected content type from ${url}: ${contentType}`);
    }

    try {
      const data = await response.json();
      return this.validateResponseData(data);
    } catch (error) {
      throw new APIError('Invalid JSON response', response.status, { originalError: error.message });
    }
  }

  /**
   * Validate response headers for security
   */
  validateResponseHeaders(response) {
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];

    const missingHeaders = securityHeaders.filter(header => !response.headers.get(header));
    
    if (missingHeaders.length > 0) {
      console.warn('Missing security headers in response:', missingHeaders);
    }
  }

  /**
   * Parse error response safely
   */
  async parseErrorResponse(response) {
    try {
      const errorData = await response.json();
      return {
        message: InputSanitizer.sanitizeHtml(errorData.message || 'Unknown error'),
        code: errorData.code,
        details: errorData.details
      };
    } catch {
      return {
        message: `HTTP ${response.status}: ${response.statusText}`,
        code: response.status
      };
    }
  }

  /**
   * Validate and sanitize response data
   */
  validateResponseData(data) {
    if (typeof data === 'string') {
      return InputSanitizer.sanitizeHtml(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.validateResponseData(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.validateResponseData(value);
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * Prevent duplicate requests
   */
  getRequestKey(method, url, data) {
    return `${method}:${url}:${JSON.stringify(data || {})}`;
  }

  /**
   * Generic request method with security measures
   */
  async request(method, url, data = null, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    // Prevent duplicate requests
    const requestKey = this.getRequestKey(method, fullUrl, data);
    if (this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey);
    }

    const requestPromise = this.executeRequest(method, fullUrl, data, options);
    this.requestQueue.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up request queue
      setTimeout(() => {
        this.requestQueue.delete(requestKey);
      }, 1000);
    }
  }

  /**
   * Execute the actual request
   */
  async executeRequest(method, url, data, options) {
    const config = await this.createRequestConfig(method, url, data, options);
    
    // Set timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    config.signal = controller.signal;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      return await this.handleResponse(response, url);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new APIError('Request timeout', 408, { timeout: this.config.timeout });
      }
      
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError('Network error', 0, { originalError: error.message });
    }
  }

  // Convenience methods
  async get(url, options = {}) {
    return this.request('GET', url, null, options);
  }

  async post(url, data, options = {}) {
    return this.request('POST', url, data, options);
  }

  async put(url, data, options = {}) {
    return this.request('PUT', url, data, options);
  }

  async patch(url, data, options = {}) {
    return this.request('PATCH', url, data, options);
  }

  async delete(url, options = {}) {
    return this.request('DELETE', url, null, options);
  }
}

/**
 * Custom API Error class
 */
export class APIError extends Error {
  constructor(message, status = 0, details = {}) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      details: this.details
    };
  }
}

// Export singleton instance
export const secureApiClient = new SecureApiClient();

// Export utility functions
export const createSecureApiClient = (baseURL) => new SecureApiClient(baseURL);