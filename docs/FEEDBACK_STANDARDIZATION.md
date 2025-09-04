# Standardized Feedback System

This document outlines the standardized feedback system implemented across the BPTM application to ensure consistent user experience and feedback patterns.

## Overview

The standardized feedback system provides:
- Consistent success/error messaging across all forms and operations
- Unified toast notification patterns
- Standardized feedback durations and styling
- Specialized handlers for common operations (form submission, data operations, etc.)
- Centralized message management

## Quick Start

### Basic Usage

```javascript
import { useStandardizedFeedback, FEEDBACK_MESSAGES } from '@/shared/utils/feedbackUtils';

function MyComponent() {
  const feedback = useStandardizedFeedback();
  
  const handleSubmit = async (formData) => {
    try {
      await submitForm(formData);
      feedback.showFormSuccess();
    } catch (error) {
      feedback.showFormError(error);
    }
  };
  
  return (
    // Your component JSX
  );
}
```

### Form Submission with Validation

```javascript
import { createFormSubmissionHandler } from '@/shared/utils/feedbackUtils';

function MyForm() {
  const feedback = useStandardizedFeedback();
  
  const submitHandler = createFormSubmissionHandler({
    submitOperation: async (data) => {
      // Your submission logic
      return await api.submitForm(data);
    },
    feedback,
    validationRules: [
      (data) => !data.name ? 'Name is required' : null,
      (data) => !data.email ? 'Email is required' : null
    ],
    onSuccess: (result) => {
      // Optional success callback
      console.log('Form submitted:', result);
    }
  });
  
  const handleSubmit = (formData) => {
    submitHandler(formData);
  };
}
```

## Available Methods

### Basic Feedback Methods

- `showSuccess(message, options)` - Show success notification
- `showError(message, options)` - Show error notification
- `showWarning(message, options)` - Show warning notification
- `showInfo(message, options)` - Show info notification

### Specialized Methods

- `showFormSuccess(customMessage)` - Form submission success
- `showFormError(error, customMessage)` - Form submission error
- `showValidationError(errors)` - Validation errors
- `showSaveSuccess(customMessage)` - Data save success
- `showSaveError(error, customMessage)` - Data save error
- `showNetworkError()` - Network/connection errors
- `showPermissionError()` - Permission denied errors

## Standard Messages

Pre-defined messages are available in `FEEDBACK_MESSAGES`:

```javascript
// Form operations
FEEDBACK_MESSAGES.FORM_SUBMIT_SUCCESS
FEEDBACK_MESSAGES.FORM_SUBMIT_ERROR
FEEDBACK_MESSAGES.FORM_SAVE_SUCCESS
FEEDBACK_MESSAGES.FORM_VALIDATION_ERROR

// Draft operations
FEEDBACK_MESSAGES.DRAFT_SAVE_SUCCESS
FEEDBACK_MESSAGES.DRAFT_LOAD_SUCCESS
FEEDBACK_MESSAGES.DRAFT_SAVE_ERROR

// Data operations
FEEDBACK_MESSAGES.DATA_UPDATE_SUCCESS
FEEDBACK_MESSAGES.DATA_FETCH_ERROR

// Network
FEEDBACK_MESSAGES.NETWORK_ERROR
FEEDBACK_MESSAGES.PERMISSION_ERROR
```

## Feedback Types and Durations

### Types
- `SUCCESS` - Green notifications for successful operations
- `ERROR` - Red notifications for errors
- `WARNING` - Yellow notifications for warnings
- `INFO` - Blue notifications for informational messages

### Durations
- `SHORT` (3000ms) - Quick info messages
- `MEDIUM` (5000ms) - Standard success messages
- `LONG` (8000ms) - Error messages that need attention
- `PERSISTENT` (0ms) - Requires manual dismissal

## Migration Guide

### Before (Inconsistent)

```javascript
// Different patterns across components
notify('Success!', 'success');
toast.success('Form saved');
showSuccess('Data updated successfully!');
console.log('Operation completed'); // No user feedback
```

### After (Standardized)

```javascript
import { useStandardizedFeedback, FEEDBACK_MESSAGES } from '@/shared/utils/feedbackUtils';

function MyComponent() {
  const feedback = useStandardizedFeedback();
  
  // Consistent patterns
  feedback.showFormSuccess(); // Uses standard message
  feedback.showSaveSuccess(); // Uses standard message
  feedback.showFormError(error); // Handles error details
  feedback.showInfo(FEEDBACK_MESSAGES.DRAFT_SAVE_SUCCESS, { duration: 2000 });
}
```

## Implementation Examples

### Form Component

```javascript
import React, { useState } from 'react';
import { useStandardizedFeedback } from '@/shared/utils/feedbackUtils';

export const MyForm = ({ onSubmit }) => {
  const feedback = useStandardizedFeedback();
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name) {
      feedback.showValidationError(['Name is required']);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      feedback.showFormSuccess('Form submitted successfully!');
    } catch (error) {
      feedback.showFormError(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};
```

### Auto-save Implementation

```javascript
import { useStandardizedFeedback, FEEDBACK_MESSAGES } from '@/shared/utils/feedbackUtils';

function useAutoSave(data, saveFunction) {
  const feedback = useStandardizedFeedback();
  
  const autoSave = useCallback(async () => {
    try {
      await saveFunction(data);
      feedback.showInfo(FEEDBACK_MESSAGES.DRAFT_SAVE_SUCCESS, { duration: 2000 });
    } catch (error) {
      feedback.showError(FEEDBACK_MESSAGES.DRAFT_SAVE_ERROR);
    }
  }, [data, saveFunction, feedback]);
  
  return { autoSave };
}
```

### Data Operation Handler

```javascript
import { createDataOperationHandler } from '@/shared/utils/feedbackUtils';

function useDataOperations() {
  const feedback = useStandardizedFeedback();
  
  const deleteItem = createDataOperationHandler({
    operation: async (id) => {
      return await api.deleteItem(id);
    },
    operationName: 'Delete item',
    feedback,
    onSuccess: () => {
      // Refresh data or update UI
    }
  });
  
  return { deleteItem };
}
```

## Best Practices

### 1. Use Appropriate Feedback Types
- **Success**: Completed operations, successful submissions
- **Error**: Failed operations, validation errors, network issues
- **Warning**: Non-critical issues, confirmations needed
- **Info**: Status updates, auto-save notifications, informational messages

### 2. Choose Appropriate Durations
- **Short (3s)**: Quick status updates, auto-save notifications
- **Medium (5s)**: Success messages, completed operations
- **Long (8s)**: Error messages that require user attention
- **Persistent**: Critical errors requiring user action

### 3. Provide Meaningful Messages
```javascript
// Good: Specific and actionable
feedback.showFormError(error, 'Failed to save employee data. Please check your connection and try again.');

// Avoid: Generic and unhelpful
feedback.showError('Something went wrong');
```

### 4. Handle Different Error Types
```javascript
try {
  await operation();
  feedback.showSuccess('Operation completed successfully!');
} catch (error) {
  if (error.name === 'NetworkError') {
    feedback.showNetworkError();
  } else if (error.status === 403) {
    feedback.showPermissionError();
  } else {
    feedback.showFormError(error);
  }
}
```

### 5. Consistent Auto-save Feedback
```javascript
// Auto-save should be subtle
feedback.showInfo(FEEDBACK_MESSAGES.DRAFT_SAVE_SUCCESS, { duration: 2000 });

// Auto-save errors should be more prominent
feedback.showError(FEEDBACK_MESSAGES.DRAFT_SAVE_ERROR);
```

## Updated Components

The following components have been updated to use the standardized feedback system:

1. **LeaveApplicationForm.jsx**
   - Form submission feedback
   - Validation error feedback
   - Auto-save notifications

2. **MonthlyFormWorkflow.jsx**
   - Form save success/error feedback
   - Draft restore notifications
   - Auto-save status updates

3. **EmployeeForm.jsx**
   - Draft persistence feedback
   - Auto-save notifications
   - Form submission handling

## Future Enhancements

1. **Analytics Integration**: Track feedback patterns to improve UX
2. **Accessibility**: Enhanced screen reader support for notifications
3. **Customization**: Theme-based feedback styling
4. **Batch Operations**: Feedback for bulk operations
5. **Progress Indicators**: Integration with long-running operations

## Troubleshooting

### Common Issues

1. **Feedback not showing**: Ensure `ToastProvider` is properly configured
2. **Multiple notifications**: Use debouncing for rapid operations
3. **Inconsistent styling**: Check if custom CSS is overriding toast styles

### Debug Mode

```javascript
// Enable debug logging
const feedback = useStandardizedFeedback({ debug: true });
```

## Contributing

When adding new feedback patterns:

1. Add new messages to `FEEDBACK_MESSAGES` if needed
2. Create specialized methods for common patterns
3. Update this documentation
4. Test across different components
5. Ensure accessibility compliance

For questions or suggestions, please refer to the development team or create an issue in the project repository.