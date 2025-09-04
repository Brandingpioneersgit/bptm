/**
 * Unified Validation System
 * 
 * This module consolidates all validation logic across the application,
 * eliminating duplication and providing a consistent validation interface.
 */

import { daysInMonth, workingDaysInMonth, getWorkingDaysInfo, monthLabel, isDriveUrl, isGensparkUrl } from '@/shared/lib/constants';
import { InputSanitizer } from './securityUtils.js';

/**
 * Enhanced validation result structure
 */
export class ValidationResult {
  constructor(isValid = true, error = null, warning = null, severity = 'info') {
    this.isValid = isValid;
    this.error = error;
    this.warning = warning;
    this.severity = severity; // 'critical', 'error', 'warning', 'info'
    this.timestamp = Date.now();
  }
  
  static success(warning = null) {
    return new ValidationResult(true, null, warning, 'info');
  }
  
  static error(message, severity = 'error') {
    return new ValidationResult(false, message, null, severity);
  }
  
  static warning(message) {
    return new ValidationResult(true, null, message, 'warning');
  }
}

/**
 * Unified validation rules registry
 */
class ValidationRulesRegistry {
  constructor() {
    this.rules = new Map();
    this.setupDefaultRules();
  }

  setupDefaultRules() {
    // Employee validation rules
    this.addRule('employee.name', {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\-\.]+$/,
      sanitize: true,
      errorMessages: {
        required: 'Full name is required for identification and reporting',
        minLength: 'Name must be at least 2 characters long',
        maxLength: 'Employee name is too long (max 100 characters)',
        pattern: 'Name contains unusual characters. Please verify it\'s correct.'
      }
    });

    this.addRule('employee.phone', {
      required: true,
      pattern: /^[6-9]\d{9}$/,
      sanitize: true,
      transform: (value) => value.replace(/\D/g, ''),
      validate: (value) => {
        const cleaned = value.replace(/\D/g, '');
        return cleaned.length === 10 && /^[6-9]/.test(cleaned);
      },
      errorMessages: {
        required: 'Phone number is required for contact purposes',
        pattern: 'Phone number must be 10 digits starting with 6, 7, 8, or 9',
        validate: 'Please enter a valid Indian mobile number'
      }
    });

    this.addRule('employee.department', {
      required: true,
      allowedValues: [
        'Web', 'Social Media', 'Ads', 'SEO', 'HR', 'Accounts', 'Sales',
        'Blended (HR + Sales)', 'Operations Head', 'Web Head'
      ],
      sanitize: true,
      errorMessages: {
        required: 'Department selection is required for proper reporting structure',
        allowedValues: 'Please select a valid department'
      }
    });

    this.addRule('employee.role', {
      required: true,
      minLength: 2,
      maxLength: 100,
      sanitize: true,
      validate: (value) => {
        if (Array.isArray(value)) return value.length > 0;
        return value && value.trim().length > 0;
      },
      errorMessages: {
        required: 'At least one role must be selected for performance evaluation',
        validate: 'Role information is required'
      }
    });

    // Client validation rules
    this.addRule('client.name', {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s&.,'-]+$/,
      sanitize: true,
      errorMessages: {
        required: 'Client name is required',
        minLength: 'Client name must be at least 2 characters',
        maxLength: 'Client name cannot exceed 100 characters',
        pattern: 'Client name contains invalid characters'
      }
    });

    this.addRule('client.services', {
      required: false,
      validate: (value) => {
        if (!value || !Array.isArray(value)) return true;
        return value.length <= 10;
      },
      errorMessages: {
        validate: 'Maximum 10 services can be selected'
      }
    });

    // Contact validation rules
    this.addRule('contact.email', {
      required: false,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      maxLength: 254,
      sanitize: true,
      transform: (value) => value.toLowerCase().trim(),
      errorMessages: {
        pattern: 'Please enter a valid email address',
        maxLength: 'Email address is too long'
      }
    });

    this.addRule('contact.phone', {
      required: false,
      pattern: /^[\+]?[1-9][\d]{0,15}$/,
      sanitize: true,
      transform: (value) => value.replace(/[\s\-\(\)]/g, ''),
      errorMessages: {
        pattern: 'Please enter a valid phone number'
      }
    });

    // Date and time validation rules
    this.addRule('date.monthKey', {
      required: true,
      pattern: /^\d{4}-\d{2}$/,
      validate: (value) => {
        if (!value) return false;
        const [year, month] = value.split('-').map(Number);
        return month >= 1 && month <= 12 && year >= 2020 && year <= new Date().getFullYear() + 1;
      },
      errorMessages: {
        required: 'Report month is required to track performance timeline',
        pattern: 'Month format should be YYYY-MM (e.g., 2024-01)',
        validate: 'Invalid month or year'
      }
    });

    // Attendance validation rules
    this.addRule('attendance.days', {
      required: false,
      min: 0,
      validate: (value, context = {}) => {
        const days = Number(value || 0);
        if (isNaN(days)) return false;
        const maxWorkingDays = context.monthKey ? workingDaysInMonth(context.monthKey) : 22;
        const totalDays = context.monthKey ? daysInMonth(context.monthKey) : 31;
        return days <= maxWorkingDays;
      },
      errorMessages: {
        min: 'Days cannot be negative',
        validate: 'Days cannot exceed the maximum working days for the selected month'
      }
    });

    // URL validation rules
    this.addRule('url.general', {
      required: false,
      pattern: /^https?:\/\/.+/,
      maxLength: 2048,
      sanitize: true,
      errorMessages: {
        pattern: 'Please enter a valid URL starting with http:// or https://',
        maxLength: 'URL is too long'
      }
    });

    this.addRule('url.drive', {
      required: false,
      validate: (value) => !value || isDriveUrl(value),
      errorMessages: {
        validate: 'Please enter a valid Google Drive URL'
      }
    });

    // Text validation rules
    this.addRule('text.short', {
      required: false,
      maxLength: 500,
      sanitize: true,
      errorMessages: {
        maxLength: 'Text must not exceed 500 characters'
      }
    });

    this.addRule('text.long', {
      required: false,
      maxLength: 2000,
      sanitize: true,
      errorMessages: {
        maxLength: 'Text must not exceed 2000 characters'
      }
    });

    // Number validation rules
    this.addRule('number.positive', {
      required: false,
      min: 0,
      validate: (value) => {
        const num = Number(value);
        return !isNaN(num) && num >= 0;
      },
      errorMessages: {
        validate: 'Must be a positive number'
      }
    });
  }

  addRule(name, rule) {
    this.rules.set(name, rule);
  }

  getRule(name) {
    return this.rules.get(name);
  }

  hasRule(name) {
    return this.rules.has(name);
  }
}

/**
 * Unified validator class
 */
export class UnifiedValidator {
  constructor() {
    this.registry = new ValidationRulesRegistry();
  }

  /**
   * Validate a single field
   */
  validateField(fieldName, value, context = {}) {
    const rule = this.registry.getRule(fieldName);
    if (!rule) {
      // Fallback to generic validation
      return this.validateGeneric(fieldName, value, context);
    }

    try {
      const result = {
        isValid: true,
        errors: [],
        warnings: [],
        sanitizedValue: value,
        transformedValue: value
      };

      // Handle null/undefined values
      if (value === null || value === undefined) {
        value = '';
      }

      const stringValue = String(value).trim();

      // Required field validation
      if (rule.required && !stringValue) {
        return {
          ...result,
          isValid: false,
          errors: [rule.errorMessages?.required || `${fieldName} is required`]
        };
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

      // Transform value
      if (rule.transform && typeof rule.transform === 'function') {
        try {
          result.transformedValue = rule.transform(result.sanitizedValue);
        } catch (error) {
          return {
            ...result,
            isValid: false,
            errors: [`Invalid ${fieldName} format`]
          };
        }
      } else {
        result.transformedValue = result.sanitizedValue;
      }

      // Length validation
      if (rule.minLength && result.sanitizedValue.length < rule.minLength) {
        result.isValid = false;
        result.errors.push(rule.errorMessages?.minLength || `${fieldName} must be at least ${rule.minLength} characters`);
      }

      if (rule.maxLength && result.sanitizedValue.length > rule.maxLength) {
        result.isValid = false;
        result.errors.push(rule.errorMessages?.maxLength || `${fieldName} must not exceed ${rule.maxLength} characters`);
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(result.sanitizedValue)) {
        result.isValid = false;
        result.errors.push(rule.errorMessages?.pattern || `${fieldName} format is invalid`);
      }

      // Allowed values validation
      if (rule.allowedValues && !rule.allowedValues.includes(result.sanitizedValue)) {
        result.isValid = false;
        result.errors.push(rule.errorMessages?.allowedValues || `${fieldName} must be one of: ${rule.allowedValues.join(', ')}`);
      }

      // Numeric range validation
      const numericValue = Number(result.transformedValue);
      if (!isNaN(numericValue)) {
        if (rule.min !== undefined && numericValue < rule.min) {
          result.isValid = false;
          result.errors.push(rule.errorMessages?.min || `${fieldName} must be at least ${rule.min}`);
        }

        if (rule.max !== undefined && numericValue > rule.max) {
          result.isValid = false;
          result.errors.push(rule.errorMessages?.max || `${fieldName} must not exceed ${rule.max}`);
        }
      }

      // Custom validation
      if (rule.validate && typeof rule.validate === 'function') {
        try {
          const customResult = rule.validate(result.transformedValue, context);
          if (!customResult) {
            result.isValid = false;
            result.errors.push(rule.errorMessages?.validate || `${fieldName} validation failed`);
          }
        } catch (error) {
          result.isValid = false;
          result.errors.push(`${fieldName} validation error`);
        }
      }

      return result;
    } catch (error) {
      console.error(`Validation error for field ${fieldName}:`, error);
      return {
        isValid: false,
        errors: ['Validation failed due to an internal error'],
        warnings: [],
        sanitizedValue: value,
        transformedValue: value
      };
    }
  }

  /**
   * Generic validation for fields without specific rules
   */
  validateGeneric(fieldName, value, context = {}) {
    // Basic validation for unknown fields
    if (typeof value === 'string' && value.length > 5000) {
      return ValidationResult.error('Input is too long (max 5000 characters)');
    }
    return ValidationResult.success();
  }

  /**
   * Validate multiple fields
   */
  validateFields(fields, context = {}) {
    const results = {};
    const errors = {};
    const warnings = {};
    let isValid = true;

    for (const [fieldName, value] of Object.entries(fields)) {
      const result = this.validateField(fieldName, value, context);
      results[fieldName] = result;

      if (!result.isValid) {
        isValid = false;
        errors[fieldName] = result.errors;
      }

      if (result.warnings && result.warnings.length > 0) {
        warnings[fieldName] = result.warnings;
      }
    }

    return {
      isValid,
      errors,
      warnings,
      results
    };
  }

  /**
   * Validate employee submission data
   */
  validateEmployeeSubmission(submissionData) {
    const fields = {
      'employee.name': submissionData.employee?.name,
      'employee.phone': submissionData.employee?.phone,
      'employee.department': submissionData.employee?.department,
      'employee.role': submissionData.employee?.role,
      'date.monthKey': submissionData.monthKey
    };

    // Add attendance validation if present
    if (submissionData.meta?.attendance) {
      fields['attendance.days'] = submissionData.meta.attendance.wfo;
      fields['attendance.days'] = submissionData.meta.attendance.wfh;
    }

    return this.validateFields(fields, submissionData);
  }

  /**
   * Validate client data
   */
  validateClientData(clientData, existingClients = []) {
    const fields = {
      'client.name': clientData.name,
      'client.services': clientData.services,
      'contact.email': clientData.contact_email,
      'contact.phone': clientData.contact_phone
    };

    const result = this.validateFields(fields, { existingClients });

    // Check for duplicate names
    if (clientData.name && existingClients.some(c => 
      c.name.toLowerCase().trim() === clientData.name.toLowerCase().trim()
    )) {
      result.isValid = false;
      result.errors['client.name'] = ['A client with this name already exists'];
    }

    return result;
  }

  /**
   * Add custom validation rule
   */
  addRule(name, rule) {
    this.registry.addRule(name, rule);
  }
}

// Create singleton instance
export const unifiedValidator = new UnifiedValidator();

// Export convenience functions for backward compatibility
export const validateField = (fieldName, value, context) => 
  unifiedValidator.validateField(fieldName, value, context);

export const validateFields = (fields, context) => 
  unifiedValidator.validateFields(fields, context);

export const validateEmployeeSubmission = (submissionData) => 
  unifiedValidator.validateEmployeeSubmission(submissionData);

export const validateClientData = (clientData, existingClients) => 
  unifiedValidator.validateClientData(clientData, existingClients);

// Legacy support - map old validation functions
export default unifiedValidator;