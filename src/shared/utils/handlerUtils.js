/**
 * Shared Handler Utilities
 * Consolidates common handler patterns used across components
 */

import { unifiedValidator } from './unifiedValidation.js';

/**
 * Navigation Handler Factory
 * Creates standardized navigation handlers
 */
export class NavigationHandlers {
  constructor(navigate = null) {
    this.navigate = navigate || ((path) => window.location.assign(path));
  }

  createNavigationHandler(path) {
    return () => {
      this.navigate(path);
    };
  }

  // Common navigation handlers
  navigateToForm = this.createNavigationHandler('/form');
  navigateToTools = this.createNavigationHandler('/master-tools');
  navigateToManager = this.createNavigationHandler('/manager');
  navigateToEmployee = this.createNavigationHandler('/employee');
  navigateToIntern = this.createNavigationHandler('/intern');
  navigateToAgency = this.createNavigationHandler('/');

  navigateToDashboard(authState) {
    if (!authState.isLoggedIn) {
      // Instead of defaulting to agency, show login modal
      window.dispatchEvent(new Event('show-login-modal'));
      return;
    }

    // Route users to their role-specific dashboards
    const role = authState.currentUser?.role || authState.role;
    const userCategory = authState.currentUser?.category || authState.userCategory;
    
    // Route based on role to appropriate dashboard
    switch (role) {
      case 'SEO':
      case 'Ads':
      case 'Freelancer':
      case 'Intern':
        this.navigate('/employee');
        break;
      case 'Operations Head':
      case 'Manager':
        this.navigate('/manager');
        break;
      case 'SuperAdmin':
      case 'HR':
        this.navigate('/profile');
        break;
      default:
        // Fallback to agency dashboard for unknown roles
        this.navigate('/');
        break;
    }
    
    // Log the routing for debugging
    console.log(`Routing user to dashboard:`, { role, userCategory, path: this.getPathForRole(role) });
  }

  getPathForRole(role) {
    switch (role) {
      case 'SEO':
      case 'Ads':
      case 'Freelancer':
      case 'Intern':
        return '/employee';
      case 'Operations Head':
      case 'Manager':
        return '/manager';
      case 'SuperAdmin':
      case 'HR':
        return '/profile';
      default:
        return '/';
    }
  }
}

/**
 * Form Handler Factory
 * Creates standardized form handlers with validation
 */
export class FormHandlers {
  constructor(options = {}) {
    this.validator = options.validator || unifiedValidator;
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || console.error;
    this.notify = options.notify || (() => {});
  }

  /**
   * Creates a standardized form change handler
   */
  createChangeHandler(setFormData, setErrors = null) {
    return (e) => {
      const { name, value, type, checked } = e.target;
      const fieldValue = type === 'checkbox' ? checked : value;

      setFormData(prev => ({
        ...prev,
        [name]: fieldValue
      }));

      // Clear field-specific errors when user starts typing
      if (setErrors) {
        setErrors(prev => ({
          ...prev,
          [name]: null
        }));
      }
    };
  }

  /**
   * Creates a standardized form submit handler
   */
  createSubmitHandler(formData, validationRules = {}, submitCallback) {
    return async (e) => {
      e.preventDefault();

      try {
        // Validate form data
        const validationResult = this.validator.validateMultipleFields(formData, validationRules);
        
        if (!validationResult.isValid) {
          this.onError(validationResult.errors);
          return;
        }

        // Execute submit callback
        await submitCallback(formData);
        this.onSuccess('Form submitted successfully');

      } catch (error) {
        this.onError(error);
      }
    };
  }

  /**
   * Creates a standardized save handler
   */
  createSaveHandler(data, saveCallback, successMessage = 'Data saved successfully') {
    return async () => {
      try {
        await saveCallback(data);
        this.onSuccess(successMessage);
      } catch (error) {
        this.onError(error);
      }
    };
  }
}

/**
 * CRUD Handler Factory
 * Creates standardized CRUD operation handlers
 */
export class CrudHandlers {
  constructor(options = {}) {
    this.notify = options.notify || (() => {});
    this.openModal = options.openModal || (() => {});
    this.closeModal = options.closeModal || (() => {});
  }

  /**
   * Creates a standardized add handler
   */
  createAddHandler(setItems, newItem, resetForm, validationRules = {}) {
    return () => {
      // Validate new item
      const validationResult = unifiedValidator.validateMultipleFields(newItem, validationRules);
      
      if (!validationResult.isValid) {
        this.notify('Please fill in all required fields', 'error');
        return;
      }

      const item = {
        id: Date.now(),
        ...newItem,
        createdAt: new Date().toISOString()
      };

      setItems(prev => [item, ...prev]);
      resetForm();
      this.notify('Item added successfully', 'success');
    };
  }

  /**
   * Creates a standardized delete handler with confirmation
   */
  createDeleteHandler(setItems, itemName = 'item') {
    return (itemId) => {
      this.openModal({
        title: `Delete ${itemName}`,
        content: `Are you sure you want to delete this ${itemName}? This action cannot be undone.`,
        onConfirm: () => {
          setItems(prev => prev.filter(item => item.id !== itemId));
          this.notify(`${itemName} deleted successfully`, 'success');
          this.closeModal();
        },
        onCancel: this.closeModal
      });
    };
  }

  /**
   * Creates a standardized update handler
   */
  createUpdateHandler(setItems, successMessage = 'Item updated successfully') {
    return (itemId, updates) => {
      setItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      ));
      this.notify(successMessage, 'success');
    };
  }

  /**
   * Creates a standardized view handler
   */
  createViewHandler(setSelectedItem, setView) {
    return (item) => {
      setSelectedItem(item);
      if (setView) {
        setView('details');
      }
    };
  }

  /**
   * Creates a standardized edit handler
   */
  createEditHandler(setSelectedItem, setView, setEditMode = null) {
    return (item) => {
      setSelectedItem(item);
      if (setView) {
        setView('edit');
      }
      if (setEditMode) {
        setEditMode(true);
      }
    };
  }
}

/**
 * Export Handler Factory
 * Creates standardized export handlers
 */
export class ExportHandlers {
  constructor(options = {}) {
    this.notify = options.notify || (() => {});
  }

  /**
   * Creates a JSON export handler
   */
  createJsonExportHandler(getData, filename) {
    return () => {
      try {
        const data = getData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        this.notify('Data exported successfully', 'success');
      } catch (error) {
        this.notify('Export failed', 'error');
        console.error('Export error:', error);
      }
    };
  }

  /**
   * Creates a CSV export handler
   */
  createCsvExportHandler(getData, filename, headers) {
    return () => {
      try {
        const data = getData();
        const csvContent = this.convertToCSV(data, headers);
        const dataBlob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        this.notify('Data exported successfully', 'success');
      } catch (error) {
        this.notify('Export failed', 'error');
        console.error('Export error:', error);
      }
    };
  }

  convertToCSV(data, headers) {
    if (!data || data.length === 0) return '';
    
    const csvHeaders = headers || Object.keys(data[0]);
    const csvRows = data.map(row => 
      csvHeaders.map(header => {
        const value = row[header] || '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );
    
    return [csvHeaders.join(','), ...csvRows].join('\n');
  }
}

/**
 * Bulk Operations Handler Factory
 * Creates standardized bulk operation handlers
 */
export class BulkOperationHandlers {
  constructor(options = {}) {
    this.notify = options.notify || (() => {});
    this.openModal = options.openModal || (() => {});
    this.closeModal = options.closeModal || (() => {});
  }

  /**
   * Creates a bulk action handler
   */
  createBulkActionHandler(selectedItems, setSelectedItems) {
    return (action, actionCallback) => {
      if (selectedItems.length === 0) {
        this.notify('No items selected', 'warning');
        return;
      }

      this.openModal({
        title: `Bulk ${action}`,
        content: `Are you sure you want to ${action.toLowerCase()} ${selectedItems.length} selected items?`,
        onConfirm: async () => {
          try {
            await actionCallback(selectedItems);
            setSelectedItems([]);
            this.notify(`Bulk ${action.toLowerCase()} completed successfully`, 'success');
            this.closeModal();
          } catch (error) {
            this.notify(`Bulk ${action.toLowerCase()} failed`, 'error');
            console.error(`Bulk ${action} error:`, error);
          }
        },
        onCancel: this.closeModal
      });
    };
  }

  /**
   * Creates a select all handler
   */
  createSelectAllHandler(items, selectedItems, setSelectedItems) {
    return () => {
      if (selectedItems.length === items.length) {
        setSelectedItems([]);
      } else {
        setSelectedItems(items.map(item => item.id));
      }
    };
  }

  /**
   * Creates a select item handler
   */
  createSelectItemHandler(selectedItems, setSelectedItems) {
    return (itemId) => {
      setSelectedItems(prev => 
        prev.includes(itemId) 
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );
    };
  }
}

/**
 * Button Handler Factory
 * Creates standardized button handlers with loading states and feedback
 */
export class ButtonHandlers {
  constructor(options = {}) {
    this.setLoading = options.setLoading || (() => {});
    this.notify = options.notify || (() => {});
  }

  /**
   * Creates a button handler with loading state and visual feedback
   */
  createButtonHandler(callback, loadingKey = null) {
    return async (e) => {
      // Prevent double clicks
      if (e.target.disabled) return;
      
      // Visual feedback
      const button = e.target;
      const originalTransform = button.style.transform;
      
      try {
        // Set loading state
        if (loadingKey && this.setLoading) {
          this.setLoading(prev => ({ ...prev, [loadingKey]: true }));
        }
        
        // Add clicked state
        button.style.transform = 'scale(0.95)';
        
        // Execute callback
        if (typeof callback === 'function') {
          await callback(e);
        }
        
      } catch (error) {
        console.error('Button action failed:', error);
        this.notify('Action failed', 'error');
      } finally {
        // Reset visual state
        setTimeout(() => {
          button.style.transform = originalTransform;
        }, 150);
        
        // Clear loading state
        if (loadingKey && this.setLoading) {
          this.setLoading(prev => ({ ...prev, [loadingKey]: false }));
        }
      }
    };
  }
}

/**
 * Utility function to create handler instances with common dependencies
 */
export function createHandlerFactories(dependencies = {}) {
  const {
    setView,
    notify,
    openModal,
    closeModal,
    setLoading,
    validator
  } = dependencies;

  return {
    navigation: new NavigationHandlers(setView),
    form: new FormHandlers({ validator, notify }),
    crud: new CrudHandlers({ notify, openModal, closeModal }),
    export: new ExportHandlers({ notify }),
    bulk: new BulkOperationHandlers({ notify, openModal, closeModal }),
    button: new ButtonHandlers({ setLoading, notify })
  };
}

// All classes are exported when declared above