// Enhanced error handling utility for form submissions and database operations

/**
 * Enhanced error handler for database operations
 */
export class DatabaseErrorHandler {
  constructor(supabaseInstance, notifyFunction) {
    this.supabase = supabaseInstance;
    this.notify = notifyFunction;
    this.tableChecks = new Map();
    this.retryAttempts = new Map();
  }

  /**
   * Handle database errors with user-friendly messages
   */
  async handleError(error, operation = 'database operation', context = {}) {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    // Enhanced error logging
    console.group(`🚨 Database Error [${errorId}]`);
    console.error(`Operation: ${operation}`);
    console.error(`Timestamp: ${timestamp}`);
    console.error(`Error:`, error);
    console.error(`Context:`, context);
    console.groupEnd();

    // Parse error types with enhanced detection
    const errorInfo = this.parseError(error);
    errorInfo.errorId = errorId;
    errorInfo.timestamp = timestamp;
    errorInfo.operation = operation;
    errorInfo.context = context;
    
    // Check if retry is appropriate
    const retryAttempt = context.retryAttempt || 0;
    const maxRetries = context.maxRetries || 3;
    const shouldRetry = this.shouldRetry(error, operation, retryAttempt);
    
    // Log error for analytics/debugging
    this.logError(errorInfo);
    
    // Handle specific error types
    let result;
    switch (errorInfo.type) {
      case 'TABLE_NOT_FOUND':
        result = await this.handleTableNotFound(errorInfo, operation, context);
        break;
      
      case 'COLUMN_NOT_FOUND':
        result = await this.handleColumnNotFound(errorInfo, operation, context);
        break;
      
      case 'CONNECTION_ERROR':
        result = await this.handleConnectionError(errorInfo, operation, context);
        break;
      
      case 'VALIDATION_ERROR':
        result = await this.handleValidationError(errorInfo, operation, context);
        break;
      
      case 'PERMISSION_ERROR':
        result = await this.handlePermissionError(errorInfo, operation, context);
        break;
      
      case 'TIMEOUT_ERROR':
        result = await this.handleTimeoutError(errorInfo, operation, context);
        break;
        
      case 'RATE_LIMIT_ERROR':
        result = await this.handleRateLimitError(errorInfo, operation, context);
        break;
      
      default:
        result = await this.handleGenericError(errorInfo, operation, context);
    }
    
    // Handle retry logic
    if (shouldRetry && retryAttempt < maxRetries && result.retry) {
      console.log(`🔄 Retrying operation '${operation}' (attempt ${retryAttempt + 1}/${maxRetries})`);
      
      // Exponential backoff delay
      const delay = Math.min(1000 * Math.pow(2, retryAttempt), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Return retry indicator
      return {
        ...result,
        retry: true,
        retryDelay: delay,
        retryAttempt: retryAttempt + 1
      };
    }
    
    return result;
  }

  /**
   * Parse error to determine type and extract useful information
   */
  parseError(error) {
    const errorCode = error?.code;
    const errorMessage = error?.message || error?.toString() || 'Unknown error';

    // Table not found errors
    if (errorCode === 'PGRST205' || errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      const tableName = this.extractTableName(errorMessage);
      return {
        type: 'TABLE_NOT_FOUND',
        code: errorCode,
        message: errorMessage,
        tableName,
        userMessage: `Database table '${tableName}' is not set up yet.`
      };
    }

    // Column not found errors
    if (errorCode === '42703' || errorMessage.includes('column') && errorMessage.includes('does not exist')) {
      const columnName = this.extractColumnName(errorMessage);
      return {
        type: 'COLUMN_NOT_FOUND',
        code: errorCode,
        message: errorMessage,
        columnName,
        userMessage: `Database structure needs to be updated (missing column: ${columnName}).`
      };
    }

    // Connection errors
    if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
      return {
        type: 'CONNECTION_ERROR',
        code: errorCode,
        message: errorMessage,
        userMessage: 'Unable to connect to the database. Please check your internet connection.'
      };
    }

    // Validation errors
    if (errorCode === '23505' || errorMessage.includes('duplicate') || errorMessage.includes('unique constraint')) {
      return {
        type: 'VALIDATION_ERROR',
        code: errorCode,
        message: errorMessage,
        userMessage: 'This record already exists or conflicts with existing data.'
      };
    }

    // Permission errors
    if (errorCode === '42501' || errorMessage.includes('permission') || errorMessage.includes('access')) {
      return {
        type: 'PERMISSION_ERROR',
        code: errorCode,
        message: errorMessage,
        userMessage: 'You do not have permission to perform this action.'
      };
    }

    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out') || error.name === 'AbortError') {
      return {
        type: 'TIMEOUT_ERROR',
        code: errorCode,
        message: errorMessage,
        userMessage: 'The operation timed out. Please check your connection and try again.'
      };
    }

    // Rate limit errors
    if (errorCode === '429' || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return {
        type: 'RATE_LIMIT_ERROR',
        code: errorCode,
        message: errorMessage,
        userMessage: 'Too many requests. Please wait a moment and try again.'
      };
    }

    // Server errors
    if (errorCode >= '500' && errorCode < '600') {
      return {
        type: 'SERVER_ERROR',
        code: errorCode,
        message: errorMessage,
        userMessage: 'Server error occurred. Please try again in a few moments.'
      };
    }

    return {
      type: 'GENERIC_ERROR',
      code: errorCode,
      message: errorMessage,
      userMessage: 'An unexpected error occurred. Please try again.'
    };
  }

  /**
   * Handle table not found errors
   */
  async handleTableNotFound(errorInfo, operation, context) {
    const { tableName } = errorInfo;
    
    this.notify({
      type: 'error',
      title: 'Database Setup Required',
      message: `The ${tableName} table needs to be set up. Please contact your administrator or check the database setup guide.`,
      duration: 8000
    });

    // Return appropriate fallback based on operation
    if (operation.includes('fetch') || operation.includes('load')) {
      return { data: [], error: null, fallback: true };
    }
    
    return { data: null, error: errorInfo, fallback: true };
  }

  /**
   * Handle column not found errors
   */
  async handleColumnNotFound(errorInfo, operation, context) {
    const { columnName } = errorInfo;
    
    this.notify({
      type: 'warning',
      title: 'Database Update Needed',
      message: `The database structure is outdated (missing: ${columnName}). Some features may not work properly.`,
      duration: 6000
    });

    return { data: null, error: errorInfo, fallback: true };
  }

  /**
   * Handle connection errors with retry logic
   */
  async handleConnectionError(errorInfo, operation, context) {
    const retryKey = `${operation}_${Date.now()}`;
    const currentAttempts = this.retryAttempts.get(retryKey) || 0;
    
    if (currentAttempts < 2) {
      this.retryAttempts.set(retryKey, currentAttempts + 1);
      
      this.notify({
        type: 'warning',
        title: 'Connection Issue',
        message: `Retrying ${operation}... (Attempt ${currentAttempts + 1}/3)`,
        duration: 3000
      });
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (currentAttempts + 1)));
      
      return { retry: true, attempt: currentAttempts + 1 };
    }
    
    this.notify({
      type: 'error',
      title: 'Connection Failed',
      message: 'Unable to connect to the database after multiple attempts. Please check your internet connection and try again.',
      duration: 8000
    });
    
    return { data: null, error: errorInfo, fallback: true };
  }

  /**
   * Handle validation errors
   */
  async handleValidationError(errorInfo, operation, context) {
    this.notify({
      type: 'error',
      title: 'Validation Error',
      message: errorInfo.userMessage,
      duration: 5000
    });
    
    return { data: null, error: errorInfo, fallback: false };
  }

  /**
   * Handle permission errors
   */
  async handlePermissionError(errorInfo, operation, context) {
    this.notify({
      type: 'error',
      title: 'Access Denied',
      message: errorInfo.userMessage,
      duration: 6000
    });
    
    return { data: null, error: errorInfo, fallback: false };
  }

  /**
   * Handle timeout errors
   */
  async handleTimeoutError(errorInfo, operation, context) {
    this.notify({
      type: 'warning',
      title: 'Operation Timed Out',
      message: errorInfo.userMessage,
      duration: 6000
    });
    
    return { data: null, error: errorInfo, fallback: true, retry: true };
  }

  /**
   * Handle rate limit errors
   */
  async handleRateLimitError(errorInfo, operation, context) {
    this.notify({
      type: 'warning',
      title: 'Rate Limit Exceeded',
      message: errorInfo.userMessage,
      duration: 8000
    });
    
    // Wait longer for rate limit errors
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return { data: null, error: errorInfo, fallback: true, retry: true };
  }

  /**
   * Handle generic errors
   */
  async handleGenericError(errorInfo, operation, context) {
    this.notify({
      type: 'error',
      title: 'Operation Failed',
      message: `${operation} failed: ${errorInfo.userMessage}`,
      duration: 5000
    });
    
    return { data: null, error: errorInfo, fallback: false };
  }

  /**
   * Extract table name from error message
   */
  extractTableName(message) {
    const match = message.match(/relation "([^"]+)" does not exist/) || 
                 message.match(/table "([^"]+)" does not exist/) ||
                 message.match(/from "([^"]+)"/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Extract column name from error message
   */
  extractColumnName(message) {
    const match = message.match(/column "([^"]+)" does not exist/) ||
                 message.match(/column ([^\s]+) does not exist/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Check if operation should be retried
   */
  shouldRetry(error, operation, attempt = 0) {
    const errorInfo = this.parseError(error);
    
    // Don't retry table/column not found errors
    if (errorInfo.type === 'TABLE_NOT_FOUND' || errorInfo.type === 'COLUMN_NOT_FOUND') {
      return false;
    }
    
    // Don't retry validation or permission errors
    if (errorInfo.type === 'VALIDATION_ERROR' || errorInfo.type === 'PERMISSION_ERROR') {
      return false;
    }
    
    // Retry connection errors up to 3 times
    if (errorInfo.type === 'CONNECTION_ERROR' && attempt < 3) {
      return true;
    }
    
    // Retry timeout errors up to 2 times
    if (errorInfo.type === 'TIMEOUT_ERROR' && attempt < 2) {
      return true;
    }
    
    // Retry rate limit errors up to 2 times
    if (errorInfo.type === 'RATE_LIMIT_ERROR' && attempt < 2) {
      return true;
    }
    
    return false;
  }

  /**
   * Log error for analytics/debugging
   */
  logError(errorInfo) {
    // In a real application, you might send this to an analytics service
    // For now, we'll just store it in localStorage for debugging
    try {
      const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]');
      errorLog.push({
        ...errorInfo,
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      // Keep only the last 50 errors
      if (errorLog.length > 50) {
        errorLog.splice(0, errorLog.length - 50);
      }
      
      localStorage.setItem('errorLog', JSON.stringify(errorLog));
    } catch (e) {
      console.warn('Failed to log error:', e);
    }
  }
}

/**
 * Enhanced form submission handler with error recovery
 */
export class FormSubmissionHandler {
  constructor(supabaseInstance, notifyFunction, openModalFunction) {
    this.supabase = supabaseInstance;
    this.notify = notifyFunction;
    this.openModal = openModalFunction;
    this.errorHandler = new DatabaseErrorHandler(supabaseInstance, notifyFunction);
  }

  /**
   * Submit form with comprehensive error handling
   */
  async submitForm(formData, options = {}) {
    const {
      tableName = 'submissions',
      operation = 'insert',
      validationRules = {},
      onSuccess = null,
      onError = null,
      showSuccessModal = true
    } = options;

    try {
      // Pre-submission validation
      const validationResult = this.validateFormData(formData, validationRules);
      if (!validationResult.isValid) {
        this.handleValidationFailure(validationResult.errors);
        return { success: false, errors: validationResult.errors };
      }

      // Attempt submission
      let result;
      if (operation === 'update' && formData.id) {
        result = await this.supabase
          .from(tableName)
          .update(formData)
          .eq('id', formData.id)
          .select()
          .single();
      } else {
        result = await this.supabase
          .from(tableName)
          .insert([formData])
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      // Success handling
      if (showSuccessModal) {
        this.showSuccessModal(operation, result.data);
      }
      
      if (onSuccess) {
        await onSuccess(result.data);
      }

      return { success: true, data: result.data };

    } catch (error) {
      const handledError = await this.errorHandler.handleError(error, `form submission to ${tableName}`, { formData });
      
      if (handledError.retry) {
        // Retry the submission
        return this.submitForm(formData, { ...options, _retryAttempt: (options._retryAttempt || 0) + 1 });
      }
      
      if (onError) {
        await onError(handledError);
      }
      
      return { success: false, error: handledError };
    }
  }

  /**
   * Validate form data against rules
   */
  validateFormData(formData, rules) {
    const errors = [];
    
    // Required field validation
    if (rules.required) {
      rules.required.forEach(field => {
        const value = this.getNestedValue(formData, field);
        if (!value || (typeof value === 'string' && !value.trim())) {
          errors.push(`${field} is required`);
        }
      });
    }
    
    // Custom validation functions
    if (rules.custom) {
      rules.custom.forEach(validator => {
        const result = validator(formData);
        if (result !== true) {
          errors.push(result);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Handle validation failure
   */
  handleValidationFailure(errors) {
    this.notify({
      type: 'error',
      title: 'Validation Failed',
      message: `Please fix the following issues:\n${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`,
      duration: 8000
    });
  }

  /**
   * Show success modal
   */
  showSuccessModal(operation, data) {
    const title = operation === 'update' ? 'Updated Successfully' : 'Submitted Successfully';
    const message = operation === 'update' ? 'Your changes have been saved.' : 'Your form has been submitted successfully.';
    
    if (this.openModal) {
      this.openModal({
        title,
        content: message,
        actions: [{
          label: 'OK',
          onClick: () => {},
          variant: 'primary'
        }]
      });
    } else {
      this.notify({
        type: 'success',
        title,
        message,
        duration: 5000
      });
    }
  }
}

/**
 * Utility function to create error handler instance
 */
export function createErrorHandler(supabase, notify, openModal = null) {
  return {
    database: new DatabaseErrorHandler(supabase, notify),
    form: new FormSubmissionHandler(supabase, notify, openModal)
  };
}

/**
 * Utility function for safe database operations
 */
export async function safeDbOperation(operation, errorHandler, fallbackValue = null) {
  try {
    return await operation();
  } catch (error) {
    const result = await errorHandler.handleError(error, 'database operation');
    return result.fallback ? fallbackValue : null;
  }
}

/**
 * Utility function to get error logs for debugging
 */
export function getErrorLogs() {
  try {
    return JSON.parse(localStorage.getItem('errorLog') || '[]');
  } catch (e) {
    console.warn('Failed to retrieve error logs:', e);
    return [];
  }
}

/**
 * Utility function to clear error logs
 */
export function clearErrorLogs() {
  try {
    localStorage.removeItem('errorLog');
    return true;
  } catch (e) {
    console.warn('Failed to clear error logs:', e);
    return false;
  }
}