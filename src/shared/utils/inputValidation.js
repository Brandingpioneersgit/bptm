// Comprehensive input validation utilities for forms and user inputs
// @deprecated Use unifiedValidation.js instead for new code
import { InputSanitizer } from './securityUtils.js';
import { unifiedValidator } from './unifiedValidation.js';

/**
 * Form validation rules and utilities
 * @deprecated Use UnifiedValidator from unifiedValidation.js instead
 */
export class FormValidator {
  constructor() {
    this.rules = new Map();
    this.setupDefaultRules();
  }

  /**
   * Set up default validation rules
   */
  setupDefaultRules() {
    // Name validation
    this.addRule('name', {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s'-]+$/,
      sanitize: true,
      errorMessage: 'Name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes'
    });

    // Phone validation
    this.addRule('phone', {
      required: true,
      pattern: /^\d{10}$/,
      sanitize: true,
      transform: (value) => value.replace(/\D/g, ''),
      errorMessage: 'Phone number must be exactly 10 digits'
    });

    // Email validation
    this.addRule('email', {
      required: false,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      maxLength: 254,
      sanitize: true,
      transform: (value) => value.toLowerCase().trim(),
      errorMessage: 'Please enter a valid email address'
    });

    // URL validation
    this.addRule('url', {
      required: false,
      pattern: /^https?:\/\/.+/,
      maxLength: 2048,
      sanitize: true,
      errorMessage: 'Please enter a valid URL starting with http:// or https://'
    });

    // Date validation
    this.addRule('date', {
      required: false,
      pattern: /^\d{4}-\d{2}-\d{2}$/,
      sanitize: true,
      validate: (value) => {
        if (!value) return true;
        const date = new Date(value);
        return !isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100;
      },
      errorMessage: 'Please enter a valid date in YYYY-MM-DD format'
    });

    // Department validation
    this.addRule('department', {
      required: true,
      allowedValues: [
        'Web', 'Social Media', 'Ads', 'SEO', 'HR', 'Accounts', 'Sales',
        'Blended (HR + Sales)', 'Operations Head', 'Web Head'
      ],
      sanitize: true,
      errorMessage: 'Please select a valid department'
    });

    // Role validation
    this.addRule('role', {
      required: true,
      minLength: 2,
      maxLength: 100,
      sanitize: true,
      errorMessage: 'Role must be 2-100 characters'
    });

    // Text area validation
    this.addRule('textarea', {
      required: false,
      maxLength: 2000,
      sanitize: true,
      errorMessage: 'Text must not exceed 2000 characters'
    });

    // Number validation
    this.addRule('number', {
      required: false,
      pattern: /^\d*\.?\d+$/,
      min: 0,
      max: 999999,
      sanitize: true,
      transform: (value) => parseFloat(value) || 0,
      errorMessage: 'Please enter a valid number'
    });

    // Score validation (0-100)
    this.addRule('score', {
      required: false,
      pattern: /^\d{1,3}$/,
      min: 0,
      max: 100,
      sanitize: true,
      transform: (value) => parseInt(value) || 0,
      errorMessage: 'Score must be between 0 and 100'
    });

    // Admin token validation
    this.addRule('adminToken', {
      required: true,
      minLength: 8,
      maxLength: 128,
      sanitize: true,
      errorMessage: 'Admin token must be 8-128 characters'
    });

    // Student ID validation
    this.addRule('studentId', {
      required: true,
      minLength: 3,
      maxLength: 20,
      pattern: /^[a-zA-Z0-9-_]+$/,
      sanitize: true,
      errorMessage: 'Student ID must be 3-20 characters and contain only letters, numbers, hyphens, and underscores'
    });
  }

  /**
   * Add or update a validation rule
   */
  addRule(name, rule) {
    this.rules.set(name, rule);
  }

  /**
   * Get a validation rule
   */
  getRule(name) {
    return this.rules.get(name);
  }

  /**
   * Validate a single field
   */
  validateField(fieldName, value, ruleName = fieldName) {
    const rule = this.getRule(ruleName);
    if (!rule) {
      throw new Error(`Validation rule '${ruleName}' not found`);
    }

    const result = {
      isValid: true,
      errors: [],
      sanitizedValue: value,
      transformedValue: value
    };

    // Handle null/undefined values
    if (value === null || value === undefined) {
      value = '';
    }

    // Convert to string for validation
    const stringValue = String(value).trim();

    // Required field validation
    if (rule.required && !stringValue) {
      result.isValid = false;
      result.errors.push(`${fieldName} is required`);
      return result;
    }

    // Skip further validation if field is empty and not required
    if (!stringValue && !rule.required) {
      return result;
    }

    // Sanitize input
    if (rule.sanitize) {
      result.sanitizedValue = InputSanitizer.sanitizeInput(stringValue);
    } else {
      result.sanitizedValue = stringValue;
    }

    // Transform value if transformer provided
    if (rule.transform && typeof rule.transform === 'function') {
      try {
        result.transformedValue = rule.transform(result.sanitizedValue);
      } catch (error) {
        result.isValid = false;
        result.errors.push(`Invalid ${fieldName} format`);
        return result;
      }
    } else {
      result.transformedValue = result.sanitizedValue;
    }

    // Length validation
    if (rule.minLength && result.sanitizedValue.length < rule.minLength) {
      result.isValid = false;
      result.errors.push(`${fieldName} must be at least ${rule.minLength} characters`);
    }

    if (rule.maxLength && result.sanitizedValue.length > rule.maxLength) {
      result.isValid = false;
      result.errors.push(`${fieldName} must not exceed ${rule.maxLength} characters`);
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(result.sanitizedValue)) {
      result.isValid = false;
      result.errors.push(rule.errorMessage || `${fieldName} format is invalid`);
    }

    // Allowed values validation
    if (rule.allowedValues && !rule.allowedValues.includes(result.sanitizedValue)) {
      result.isValid = false;
      result.errors.push(`${fieldName} must be one of: ${rule.allowedValues.join(', ')}`);
    }

    // Numeric range validation
    if (typeof result.transformedValue === 'number') {
      if (rule.min !== undefined && result.transformedValue < rule.min) {
        result.isValid = false;
        result.errors.push(`${fieldName} must be at least ${rule.min}`);
      }

      if (rule.max !== undefined && result.transformedValue > rule.max) {
        result.isValid = false;
        result.errors.push(`${fieldName} must not exceed ${rule.max}`);
      }
    }

    // Custom validation function
    if (rule.validate && typeof rule.validate === 'function') {
      try {
        const customResult = rule.validate(result.transformedValue);
        if (!customResult) {
          result.isValid = false;
          result.errors.push(rule.errorMessage || `${fieldName} validation failed`);
        }
      } catch (error) {
        result.isValid = false;
        result.errors.push(`${fieldName} validation error: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Validate multiple fields
   */
  validateFields(fields, rules = {}) {
    const results = {};
    let isFormValid = true;
    const allErrors = [];

    for (const [fieldName, value] of Object.entries(fields)) {
      const ruleName = rules[fieldName] || fieldName;
      
      try {
        const result = this.validateField(fieldName, value, ruleName);
        results[fieldName] = result;
        
        if (!result.isValid) {
          isFormValid = false;
          allErrors.push(...result.errors);
        }
      } catch (error) {
        results[fieldName] = {
          isValid: false,
          errors: [error.message],
          sanitizedValue: value,
          transformedValue: value
        };
        isFormValid = false;
        allErrors.push(error.message);
      }
    }

    return {
      isValid: isFormValid,
      fields: results,
      errors: allErrors,
      sanitizedData: this.getSanitizedData(results),
      transformedData: this.getTransformedData(results)
    };
  }

  /**
   * Get sanitized data from validation results
   */
  getSanitizedData(results) {
    const sanitized = {};
    for (const [fieldName, result] of Object.entries(results)) {
      sanitized[fieldName] = result.sanitizedValue;
    }
    return sanitized;
  }

  /**
   * Get transformed data from validation results
   */
  getTransformedData(results) {
    const transformed = {};
    for (const [fieldName, result] of Object.entries(results)) {
      transformed[fieldName] = result.transformedValue;
    }
    return transformed;
  }

  /**
   * Validate employee submission data
   */
  validateEmployeeSubmission(submissionData) {
    const fields = {
      name: submissionData.employee?.name,
      phone: submissionData.employee?.phone,
      department: submissionData.employee?.department,
      role: submissionData.employee?.role,
      joiningDate: submissionData.employee?.joiningDate,
      dob: submissionData.employee?.dob,
      education: submissionData.employee?.education,
      certifications: submissionData.employee?.certifications,
      skills: submissionData.employee?.skills,
      aiUsageNotes: submissionData.aiUsageNotes,
      companyFeedback: submissionData.feedback?.company,
      hrFeedback: submissionData.feedback?.hr,
      challenges: submissionData.feedback?.challenges
    };

    const rules = {
      role: 'role',
      joiningDate: 'date',
      dob: 'date',
      education: 'textarea',
      certifications: 'textarea',
      skills: 'textarea',
      aiUsageNotes: 'textarea',
      companyFeedback: 'textarea',
      hrFeedback: 'textarea',
      challenges: 'textarea'
    };

    return this.validateFields(fields, rules);
  }

  /**
   * Validate login credentials
   */
  validateLoginCredentials(credentials) {
    const { userType, name, phone } = credentials;

    if (userType === 'manager') {
      return this.validateFields({ adminToken: phone }, { adminToken: 'adminToken' });
    }

    if (userType === 'intern') {
      return this.validateFields(
        { name, studentId: phone },
        { name: 'name', studentId: 'studentId' }
      );
    }

    // Employee validation
    return this.validateFields({ name, phone });
  }
}

/**
 * File upload validation utilities
 */
export class FileValidator {
  constructor() {
    this.allowedTypes = {
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
    };
    
    this.maxSizes = {
      image: 5 * 1024 * 1024, // 5MB
      document: 10 * 1024 * 1024, // 10MB
      spreadsheet: 10 * 1024 * 1024 // 10MB
    };
  }

  /**
   * Validate file upload
   */
  validateFile(file, category = 'image') {
    const result = {
      isValid: true,
      errors: [],
      file: file
    };

    if (!file) {
      result.isValid = false;
      result.errors.push('No file selected');
      return result;
    }

    // Check file type
    const allowedTypes = this.allowedTypes[category];
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      result.isValid = false;
      result.errors.push(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file size
    const maxSize = this.maxSizes[category];
    if (maxSize && file.size > maxSize) {
      result.isValid = false;
      result.errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
    }

    // Check file name
    if (file.name.length > 255) {
      result.isValid = false;
      result.errors.push('File name is too long (maximum 255 characters)');
    }

    // Check for potentially dangerous file names
    const dangerousPatterns = [/\.\./, /[<>:"|?*]/, /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i];
    if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
      result.isValid = false;
      result.errors.push('File name contains invalid characters');
    }

    return result;
  }

  /**
   * Validate multiple files
   */
  validateFiles(files, category = 'image', maxFiles = 10) {
    const results = [];
    let isValid = true;
    const allErrors = [];

    if (files.length > maxFiles) {
      return {
        isValid: false,
        files: [],
        errors: [`Too many files selected. Maximum allowed: ${maxFiles}`]
      };
    }

    for (const file of files) {
      const result = this.validateFile(file, category);
      results.push(result);
      
      if (!result.isValid) {
        isValid = false;
        allErrors.push(...result.errors);
      }
    }

    return {
      isValid,
      files: results,
      errors: allErrors
    };
  }
}

// Export singleton instances
export const formValidator = new FormValidator();
export const fileValidator = new FileValidator();

// Export utility functions
export const validateField = (fieldName, value, ruleName) => 
  formValidator.validateField(fieldName, value, ruleName);

export const validateForm = (fields, rules) => 
  formValidator.validateFields(fields, rules);

export const validateFile = (file, category) => 
  fileValidator.validateFile(file, category);

export const validateEmployeeSubmission = (submissionData) => 
  formValidator.validateEmployeeSubmission(submissionData);

export const validateLoginCredentials = (credentials) => 
  formValidator.validateLoginCredentials(credentials);