/**
 * Filter Utilities
 * Provides common filtering functions for dashboard data
 */

import { isWithinInterval, parseISO, format } from 'date-fns';

/**
 * Apply filters to a dataset
 * @param {Array} data - The data array to filter
 * @param {Object} filters - The filter object from AdvancedFilters component
 * @param {Object} options - Additional filtering options
 * @returns {Array} Filtered data
 */
export const applyFilters = (data, filters, options = {}) => {
  if (!Array.isArray(data)) return [];
  
  return data.filter(item => {
    // Date range filter
    if (filters.startDate && filters.endDate && options.dateField) {
      const itemDate = getItemDate(item, options.dateField);
      if (itemDate) {
        const startDate = parseISO(filters.startDate);
        const endDate = parseISO(filters.endDate);
        
        if (!isWithinInterval(itemDate, { start: startDate, end: endDate })) {
          return false;
        }
      }
    }
    
    // Department filter
    if (filters.department && filters.department !== 'all') {
      const itemDepartment = getNestedValue(item, options.departmentField || 'department');
      if (!itemDepartment || itemDepartment.toLowerCase() !== filters.department.toLowerCase()) {
        return false;
      }
    }
    
    // Role filter
    if (filters.role && filters.role !== 'all') {
      const itemRole = getNestedValue(item, options.roleField || 'role');
      if (!itemRole) return false;
      
      // Handle array roles
      if (Array.isArray(itemRole)) {
        if (!itemRole.some(role => role.toLowerCase().includes(filters.role.toLowerCase()))) {
          return false;
        }
      } else {
        if (!itemRole.toLowerCase().includes(filters.role.toLowerCase())) {
          return false;
        }
      }
    }
    
    // Status filter
    if (filters.status && filters.status !== 'all') {
      const itemStatus = getNestedValue(item, options.statusField || 'status');
      if (!itemStatus || itemStatus.toLowerCase() !== filters.status.toLowerCase()) {
        return false;
      }
    }
    
    // Search filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      const searchFields = options.searchFields || ['name', 'email', 'title', 'description'];
      
      const matchesSearch = searchFields.some(field => {
        const value = getNestedValue(item, field);
        if (!value) return false;
        
        if (Array.isArray(value)) {
          return value.some(v => String(v).toLowerCase().includes(searchTerm));
        }
        
        return String(value).toLowerCase().includes(searchTerm);
      });
      
      if (!matchesSearch) return false;
    }
    
    // Custom filters
    if (filters.customFilters && Object.keys(filters.customFilters).length > 0) {
      for (const [key, value] of Object.entries(filters.customFilters)) {
        if (!value || value === 'all' || value === '') continue;
        
        const itemValue = getNestedValue(item, key);
        if (!itemValue || String(itemValue).toLowerCase() !== String(value).toLowerCase()) {
          return false;
        }
      }
    }
    
    return true;
  });
};

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - The object to search
 * @param {string} path - The path to the value (e.g., 'user.profile.name')
 * @returns {any} The value at the path
 */
export const getNestedValue = (obj, path) => {
  if (!obj || !path) return null;
  
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

/**
 * Get date from item using various date field formats
 * @param {Object} item - The data item
 * @param {string} dateField - The date field name
 * @returns {Date|null} Parsed date or null
 */
export const getItemDate = (item, dateField) => {
  const dateValue = getNestedValue(item, dateField);
  if (!dateValue) return null;
  
  try {
    // Handle different date formats
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    if (typeof dateValue === 'string') {
      // Try parsing ISO string
      if (dateValue.includes('T') || dateValue.includes('-')) {
        return parseISO(dateValue);
      }
      
      // Try parsing as regular date
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    
    if (typeof dateValue === 'number') {
      // Assume timestamp
      return new Date(dateValue);
    }
    
    return null;
  } catch (error) {
    console.warn('Error parsing date:', dateValue, error);
    return null;
  }
};

/**
 * Sort data by multiple criteria
 * @param {Array} data - The data to sort
 * @param {Array} sortCriteria - Array of sort objects { field, direction }
 * @returns {Array} Sorted data
 */
export const sortData = (data, sortCriteria = []) => {
  if (!Array.isArray(data) || sortCriteria.length === 0) return data;
  
  return [...data].sort((a, b) => {
    for (const { field, direction = 'asc' } of sortCriteria) {
      const aValue = getNestedValue(a, field);
      const bValue = getNestedValue(b, field);
      
      // Handle null/undefined values
      if (aValue == null && bValue == null) continue;
      if (aValue == null) return direction === 'asc' ? 1 : -1;
      if (bValue == null) return direction === 'asc' ? -1 : 1;
      
      // Compare values
      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        // Fallback to string comparison
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      if (comparison !== 0) {
        return direction === 'asc' ? comparison : -comparison;
      }
    }
    
    return 0;
  });
};

/**
 * Group data by a field
 * @param {Array} data - The data to group
 * @param {string} groupField - The field to group by
 * @returns {Object} Grouped data
 */
export const groupData = (data, groupField) => {
  if (!Array.isArray(data)) return {};
  
  return data.reduce((groups, item) => {
    const groupValue = getNestedValue(item, groupField) || 'Other';
    const key = String(groupValue);
    
    if (!groups[key]) {
      groups[key] = [];
    }
    
    groups[key].push(item);
    return groups;
  }, {});
};

/**
 * Calculate statistics for filtered data
 * @param {Array} data - The filtered data
 * @param {Object} options - Calculation options
 * @returns {Object} Statistics object
 */
export const calculateFilteredStats = (data, options = {}) => {
  if (!Array.isArray(data)) return {};
  
  const stats = {
    total: data.length,
    departments: {},
    roles: {},
    statuses: {},
    dateRange: null
  };
  
  // Calculate department distribution
  if (options.departmentField) {
    stats.departments = groupData(data, options.departmentField);
    Object.keys(stats.departments).forEach(key => {
      stats.departments[key] = stats.departments[key].length;
    });
  }
  
  // Calculate role distribution
  if (options.roleField) {
    const roleGroups = {};
    data.forEach(item => {
      const roles = getNestedValue(item, options.roleField);
      if (Array.isArray(roles)) {
        roles.forEach(role => {
          roleGroups[role] = (roleGroups[role] || 0) + 1;
        });
      } else if (roles) {
        roleGroups[roles] = (roleGroups[roles] || 0) + 1;
      }
    });
    stats.roles = roleGroups;
  }
  
  // Calculate status distribution
  if (options.statusField) {
    stats.statuses = groupData(data, options.statusField);
    Object.keys(stats.statuses).forEach(key => {
      stats.statuses[key] = stats.statuses[key].length;
    });
  }
  
  // Calculate date range
  if (options.dateField) {
    const dates = data
      .map(item => getItemDate(item, options.dateField))
      .filter(date => date !== null)
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (dates.length > 0) {
      stats.dateRange = {
        start: format(dates[0], 'yyyy-MM-dd'),
        end: format(dates[dates.length - 1], 'yyyy-MM-dd'),
        count: dates.length
      };
    }
  }
  
  return stats;
};

/**
 * Export filtered data to CSV format
 * @param {Array} data - The filtered data
 * @param {Array} columns - Column definitions
 * @param {string} filename - The filename for download
 */
export const exportToCSV = (data, columns, filename = 'export.csv') => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No data to export');
  }
  
  // Create CSV headers
  const headers = columns.map(col => col.label || col.field).join(',');
  
  // Create CSV rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = getNestedValue(item, col.field);
      
      // Handle different value types
      if (value == null) return '';
      if (Array.isArray(value)) return `"${value.join(', ')}"`;
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return String(value);
    }).join(',');
  });
  
  // Combine headers and rows
  const csvContent = [headers, ...rows].join('\n');
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Get unique values for a field across dataset
 * @param {Array} data - The dataset
 * @param {string} field - The field to get unique values for
 * @returns {Array} Array of unique values
 */
export const getUniqueValues = (data, field) => {
  if (!Array.isArray(data)) return [];
  
  const values = new Set();
  
  data.forEach(item => {
    const value = getNestedValue(item, field);
    if (value != null) {
      if (Array.isArray(value)) {
        value.forEach(v => values.add(String(v)));
      } else {
        values.add(String(value));
      }
    }
  });
  
  return Array.from(values).sort();
};

/**
 * Create filter options from data
 * @param {Array} data - The dataset
 * @param {Object} fieldMappings - Field mappings for extracting options
 * @returns {Object} Filter options object
 */
export const createFilterOptions = (data, fieldMappings = {}) => {
  const options = {
    departments: [],
    roles: [],
    statuses: [],
    customOptions: {}
  };
  
  if (fieldMappings.departmentField) {
    options.departments = getUniqueValues(data, fieldMappings.departmentField);
  }
  
  if (fieldMappings.roleField) {
    options.roles = getUniqueValues(data, fieldMappings.roleField);
  }
  
  if (fieldMappings.statusField) {
    options.statuses = getUniqueValues(data, fieldMappings.statusField);
  }
  
  // Extract custom field options
  if (fieldMappings.customFields) {
    Object.entries(fieldMappings.customFields).forEach(([key, field]) => {
      options.customOptions[key] = getUniqueValues(data, field);
    });
  }
  
  return options;
};

export default {
  applyFilters,
  getNestedValue,
  getItemDate,
  sortData,
  groupData,
  calculateFilteredStats,
  exportToCSV,
  getUniqueValues,
  createFilterOptions
};