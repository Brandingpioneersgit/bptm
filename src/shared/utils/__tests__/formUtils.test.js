import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FormHandlers, ValidationRules, FormStateManager } from '../formUtils';

describe('FormHandlers', () => {
  let mockUpdateField, mockValidateField, formHandlers;

  beforeEach(() => {
    mockUpdateField = vi.fn();
    mockValidateField = vi.fn();
    formHandlers = FormHandlers.createFormHandlers(mockUpdateField, mockValidateField);
  });

  describe('handleFieldChange', () => {
    it('calls updateField with correct parameters', () => {
      const mockEvent = {
        target: {
          name: 'email',
          value: 'test@example.com',
          type: 'email'
        }
      };

      formHandlers.handleFieldChange(mockEvent);

      expect(mockUpdateField).toHaveBeenCalledWith('email', 'test@example.com');
    });

    it('handles checkbox inputs correctly', () => {
      const mockEvent = {
        target: {
          name: 'isActive',
          checked: true,
          type: 'checkbox'
        }
      };

      formHandlers.handleFieldChange(mockEvent);

      expect(mockUpdateField).toHaveBeenCalledWith('isActive', true);
    });

    it('handles number inputs correctly', () => {
      const mockEvent = {
        target: {
          name: 'age',
          value: '25',
          type: 'number'
        }
      };

      formHandlers.handleFieldChange(mockEvent);

      expect(mockUpdateField).toHaveBeenCalledWith('age', 25);
    });

    it('calls validateField when validation is provided', () => {
      const mockEvent = {
        target: {
          name: 'email',
          value: 'test@example.com',
          type: 'email'
        }
      };

      formHandlers.handleFieldChange(mockEvent);

      expect(mockValidateField).toHaveBeenCalledWith('email', 'test@example.com');
    });
  });

  describe('handleNestedFieldChange', () => {
    it('calls updateField with nested path', () => {
      formHandlers.handleNestedFieldChange('address.street', 'Main St');

      expect(mockUpdateField).toHaveBeenCalledWith('address.street', 'Main St');
    });

    it('calls validateField for nested fields', () => {
      formHandlers.handleNestedFieldChange('address.zipCode', '12345');

      expect(mockValidateField).toHaveBeenCalledWith('address.zipCode', '12345');
    });
  });

  describe('handleArrayFieldChange', () => {
    it('calls updateField with array index path', () => {
      formHandlers.handleArrayFieldChange('skills', 0, 'JavaScript');

      expect(mockUpdateField).toHaveBeenCalledWith('skills[0]', 'JavaScript');
    });
  });
});

describe('ValidationRules', () => {
  describe('required', () => {
    it('returns error for empty values', () => {
      expect(ValidationRules.required('')).toBe('This field is required');
      expect(ValidationRules.required(null)).toBe('This field is required');
      expect(ValidationRules.required(undefined)).toBe('This field is required');
    });

    it('returns null for valid values', () => {
      expect(ValidationRules.required('test')).toBeNull();
      expect(ValidationRules.required(0)).toBeNull();
      expect(ValidationRules.required(false)).toBeNull();
    });

    it('accepts custom error message', () => {
      const customMessage = 'Name is required';
      expect(ValidationRules.required('', customMessage)).toBe(customMessage);
    });
  });

  describe('email', () => {
    it('validates correct email formats', () => {
      expect(ValidationRules.email('test@example.com')).toBeNull();
      expect(ValidationRules.email('user.name+tag@domain.co.uk')).toBeNull();
    });

    it('rejects invalid email formats', () => {
      expect(ValidationRules.email('invalid-email')).toBe('Invalid email format');
      expect(ValidationRules.email('test@')).toBe('Invalid email format');
      expect(ValidationRules.email('@domain.com')).toBe('Invalid email format');
    });

    it('allows empty values (use with required for mandatory emails)', () => {
      expect(ValidationRules.email('')).toBeNull();
    });
  });

  describe('phone', () => {
    it('validates correct phone formats', () => {
      expect(ValidationRules.phone('+1234567890')).toBeNull();
      expect(ValidationRules.phone('(123) 456-7890')).toBeNull();
      expect(ValidationRules.phone('123-456-7890')).toBeNull();
    });

    it('rejects invalid phone formats', () => {
      expect(ValidationRules.phone('123')).toBe('Invalid phone number');
      expect(ValidationRules.phone('abc-def-ghij')).toBe('Invalid phone number');
    });
  });

  describe('minLength', () => {
    it('validates minimum length', () => {
      const validator = ValidationRules.minLength(5);
      expect(validator('hello')).toBeNull();
      expect(validator('hello world')).toBeNull();
      expect(validator('hi')).toBe('Minimum length is 5 characters');
    });
  });

  describe('maxLength', () => {
    it('validates maximum length', () => {
      const validator = ValidationRules.maxLength(10);
      expect(validator('hello')).toBeNull();
      expect(validator('hello world')).toBe('Maximum length is 10 characters');
    });
  });

  describe('pattern', () => {
    it('validates against regex pattern', () => {
      const validator = ValidationRules.pattern(/^[A-Z]+$/, 'Must be uppercase letters only');
      expect(validator('HELLO')).toBeNull();
      expect(validator('hello')).toBe('Must be uppercase letters only');
    });
  });

  describe('compose', () => {
    it('combines multiple validators', () => {
      const validator = ValidationRules.compose([
        ValidationRules.required,
        ValidationRules.email
      ]);

      expect(validator('')).toBe('This field is required');
      expect(validator('invalid-email')).toBe('Invalid email format');
      expect(validator('test@example.com')).toBeNull();
    });

    it('returns first error encountered', () => {
      const validator = ValidationRules.compose([
        ValidationRules.required,
        ValidationRules.minLength(10)
      ]);

      expect(validator('')).toBe('This field is required');
    });
  });
});

describe('FormStateManager', () => {
  let formManager;
  const initialState = {
    name: '',
    email: '',
    address: {
      street: '',
      city: ''
    },
    skills: []
  };

  beforeEach(() => {
    formManager = FormStateManager.createFormState(initialState);
  });

  describe('updateField', () => {
    it('updates simple fields', () => {
      const newState = formManager.updateField('name', 'John Doe');
      expect(newState.name).toBe('John Doe');
      expect(newState.email).toBe(''); // Other fields unchanged
    });

    it('updates nested fields', () => {
      const newState = formManager.updateField('address.street', 'Main St');
      expect(newState.address.street).toBe('Main St');
      expect(newState.address.city).toBe(''); // Other nested fields unchanged
    });

    it('updates array fields', () => {
      const newState = formManager.updateField('skills[0]', 'JavaScript');
      expect(newState.skills[0]).toBe('JavaScript');
    });
  });

  describe('validateForm', () => {
    it('validates all fields with provided rules', () => {
      const validationRules = {
        name: ValidationRules.required,
        email: ValidationRules.compose([ValidationRules.required, ValidationRules.email])
      };

      const errors = formManager.validateForm(validationRules);
      
      expect(errors.name).toBe('This field is required');
      expect(errors.email).toBe('This field is required');
    });

    it('returns empty object for valid form', () => {
      const state = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      
      const manager = FormStateManager.createFormState(state);
      const validationRules = {
        name: ValidationRules.required,
        email: ValidationRules.compose([ValidationRules.required, ValidationRules.email])
      };

      const errors = manager.validateForm(validationRules);
      
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });

  describe('resetForm', () => {
    it('resets form to initial state', () => {
      let state = formManager.updateField('name', 'John Doe');
      state = formManager.updateField('email', 'john@example.com');
      
      const resetState = formManager.resetForm();
      
      expect(resetState).toEqual(initialState);
    });
  });

  describe('isDirty', () => {
    it('returns false for unchanged form', () => {
      expect(formManager.isDirty()).toBe(false);
    });

    it('returns true for changed form', () => {
      formManager.updateField('name', 'John Doe');
      expect(formManager.isDirty()).toBe(true);
    });
  });

  describe('getChangedFields', () => {
    it('returns only changed fields', () => {
      formManager.updateField('name', 'John Doe');
      formManager.updateField('address.street', 'Main St');
      
      const changes = formManager.getChangedFields();
      
      expect(changes).toEqual({
        name: 'John Doe',
        'address.street': 'Main St'
      });
    });
  });
});