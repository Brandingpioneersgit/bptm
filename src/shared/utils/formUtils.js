/**
 * Form Utilities
 * Provides standardized form handling, validation, and state management patterns
 */

/**
 * Form Handlers
 */
export const FormHandlers = {
  /**
   * Create form handlers for field changes and validation
   */
  createFormHandlers: (updateField, validateField) => {
    return {
      handleFieldChange: (event) => {
        const { name, value, type, checked } = event.target;
        
        let fieldValue;
        if (type === 'checkbox') {
          fieldValue = checked;
        } else if (type === 'number') {
          fieldValue = value === '' ? '' : Number(value);
        } else {
          fieldValue = value;
        }
        
        updateField(name, fieldValue);
        
        if (validateField) {
          validateField(name, fieldValue);
        }
      },
      
      handleNestedFieldChange: (path, value) => {
        updateField(path, value);
        
        if (validateField) {
          validateField(path, value);
        }
      },
      
      handleArrayFieldChange: (arrayPath, index, fieldOrValue, value) => {
        // Handle both 3-param and 4-param calls
        let fullPath, finalValue;
        if (value !== undefined) {
          // 4 parameters: arrayPath, index, field, value
          fullPath = `${arrayPath}[${index}].${fieldOrValue}`;
          finalValue = value;
        } else {
          // 3 parameters: arrayPath, index, value
          fullPath = `${arrayPath}[${index}]`;
          finalValue = fieldOrValue;
        }
        
        updateField(fullPath, finalValue);
        
        if (validateField) {
          validateField(fullPath, finalValue);
        }
      }
    };
  }
};

/**
 * Validation Rules
 */
export const ValidationRules = {
  /**
   * Required field validation
   */
  required: (value, message = 'This field is required') => {
    if (value === null || value === undefined || value === '') {
      return message;
    }
    return null;
  },
  
  /**
   * Email format validation
   */
  email: (value, message = 'Invalid email format') => {
    if (!value) return null; // Allow empty values, use with required for mandatory
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : message;
  },
  
  /**
   * Phone number validation
   */
  phone: (value, message = 'Invalid phone number') => {
    if (!value) return null;
    
    // Allow various phone formats
    const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{8,}$/;
    const cleanValue = value.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanValue) ? null : message;
  },
  
  /**
   * Minimum length validation
   */
  minLength: (min) => {
    return (value, message = `Minimum length is ${min} characters`) => {
      if (!value) return null;
      return value.length >= min ? null : message;
    };
  },
  
  /**
   * Maximum length validation
   */
  maxLength: (max) => {
    return (value, message = `Maximum length is ${max} characters`) => {
      if (!value) return null;
      return value.length <= max ? null : message;
    };
  },
  
  /**
   * Pattern validation
   */
  pattern: (regex, message) => {
    return (value) => {
      if (!value) return null;
      return regex.test(value) ? null : message;
    };
  },
  
  /**
   * Compose multiple validators
   */
  compose: (validators) => {
    return (value) => {
      for (const validator of validators) {
        const error = validator(value);
        if (error) {
          return error;
        }
      }
      return null;
    };
  }
};

/**
 * Form State Manager
 */
export const FormStateManager = {
  /**
   * Create form state manager
   */
  createFormState: (initialState) => {
    let currentState = { ...initialState };
    const originalState = { ...initialState };
    
    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((current, key) => {
        if (key.includes('[') && key.includes(']')) {
          const [arrayKey, indexStr] = key.split('[');
          const index = parseInt(indexStr.replace(']', ''));
          return current?.[arrayKey]?.[index];
        }
        return current?.[key];
      }, obj);
    };
    
    const setNestedValue = (obj, path, value) => {
      const keys = path.split('.');
      const lastKey = keys.pop();
      
      let target = obj;
      
      // Navigate to the parent of the target field
      for (const key of keys) {
        if (key.includes('[') && key.includes(']')) {
          const [arrayKey, indexStr] = key.split('[');
          const index = parseInt(indexStr.replace(']', ''));
          if (!target[arrayKey]) target[arrayKey] = [];
          if (!target[arrayKey][index]) target[arrayKey][index] = {};
          target = target[arrayKey][index];
        } else {
          if (!target[key]) target[key] = {};
          target = target[key];
        }
      }
      
      // Set the final value
      if (lastKey.includes('[') && lastKey.includes(']')) {
        const [arrayKey, indexStr] = lastKey.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        if (!target[arrayKey]) target[arrayKey] = [];
        target[arrayKey][index] = value;
      } else {
        target[lastKey] = value;
      }
    };
    
    return {
      updateField: (path, value) => {
        const newState = JSON.parse(JSON.stringify(currentState)); // Deep clone
        
        if (path.includes('.') || path.includes('[')) {
          setNestedValue(newState, path, value);
        } else {
          newState[path] = value;
        }
        
        currentState = newState;
        return newState;
      },
      
      validateForm: (validationRules) => {
        const errors = {};
        
        Object.keys(validationRules).forEach(field => {
          const value = field.includes('.') 
            ? getNestedValue(currentState, field)
            : currentState[field];
          
          const error = validationRules[field](value);
          if (error) {
            errors[field] = error;
          }
        });
        
        return errors;
      },
      
      resetForm: () => {
        currentState = { ...originalState };
        return currentState;
      },
      
      isDirty: () => {
        return JSON.stringify(currentState) !== JSON.stringify(originalState);
      },
      
      getChangedFields: () => {
        const changes = {};
        
        const compareObjects = (current, original, prefix = '') => {
          const allKeys = new Set([...Object.keys(current || {}), ...Object.keys(original || {})]);
          
          allKeys.forEach(key => {
            const currentValue = current?.[key];
            const originalValue = original?.[key];
            const fullKey = prefix ? `${prefix}.${key}` : key;
            
            if (Array.isArray(currentValue) || Array.isArray(originalValue)) {
              // Handle arrays
              const currentArray = currentValue || [];
              const originalArray = originalValue || [];
              const maxLength = Math.max(currentArray.length, originalArray.length);
              
              for (let i = 0; i < maxLength; i++) {
                if (currentArray[i] !== originalArray[i]) {
                  changes[`${fullKey}[${i}]`] = currentArray[i];
                }
              }
            } else if (typeof currentValue === 'object' && currentValue !== null && 
                      typeof originalValue === 'object' && originalValue !== null) {
              // Handle nested objects
              compareObjects(currentValue, originalValue, fullKey);
            } else if (currentValue !== originalValue) {
              // Handle primitive values
              changes[fullKey] = currentValue;
            }
          });
        };
        
        compareObjects(currentState, originalState);
        return changes;
      },
      
      getCurrentState: () => currentState,
      getOriginalState: () => originalState
    };
  }
};

export default {
  FormHandlers,
  ValidationRules,
  FormStateManager
};