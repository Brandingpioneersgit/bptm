import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, X, RotateCcw, Download } from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Advanced Filters Component
 * Provides comprehensive filtering options for reporting dashboards
 * Supports date ranges, departments, roles, status, and custom filters
 */
const AdvancedFilters = ({
  onFiltersChange,
  availableDepartments = [],
  availableRoles = [],
  availableStatuses = [],
  customFilters = [],
  showDateRange = true,
  showDepartment = true,
  showRole = true,
  showStatus = true,
  showSearch = true,
  showExport = false,
  onExport = null,
  isExporting = false,
  className = ''
}) => {
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    startDate: '',
    endDate: '',
    department: 'all',
    role: 'all',
    status: 'all',
    search: '',
    customFilters: {}
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Predefined date ranges
  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 Days' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisQuarter', label: 'This Quarter' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Default departments if none provided
  const defaultDepartments = [
    'Web Development',
    'SEO',
    'Ads',
    'Social Media',
    'Design',
    'HR',
    'Finance',
    'Operations',
    'Sales',
    'Client Servicing'
  ];

  // Default roles if none provided
  const defaultRoles = [
    'Employee',
    'Team Lead',
    'Manager',
    'Head',
    'Admin',
    'Super Admin',
    'Intern',
    'Freelancer'
  ];

  // Default statuses if none provided
  const defaultStatuses = [
    'Active',
    'Inactive',
    'Pending',
    'Completed',
    'In Progress',
    'On Hold',
    'Cancelled'
  ];

  // Calculate date range based on selection
  const calculateDateRange = (range) => {
    const today = new Date();
    let start, end;

    switch (range) {
      case 'today':
        start = end = today;
        break;
      case 'yesterday':
        start = end = subDays(today, 1);
        break;
      case 'last7days':
        start = subDays(today, 7);
        end = today;
        break;
      case 'last30days':
        start = subDays(today, 30);
        end = today;
        break;
      case 'last90days':
        start = subDays(today, 90);
        end = today;
        break;
      case 'thisMonth':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case 'thisQuarter':
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        start = quarterStart;
        end = today;
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        end = today;
        break;
      default:
        return { start: null, end: null };
    }

    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    };
  };

  // Update filters when date range changes
  useEffect(() => {
    if (filters.dateRange !== 'custom') {
      const { start, end } = calculateDateRange(filters.dateRange);
      setFilters(prev => ({
        ...prev,
        startDate: start || '',
        endDate: end || ''
      }));
    }
  }, [filters.dateRange]);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (filters.department !== 'all') count++;
    if (filters.role !== 'all') count++;
    if (filters.status !== 'all') count++;
    if (filters.search.trim()) count++;
    if (filters.dateRange !== 'last30days') count++;
    
    // Count custom filters
    Object.values(filters.customFilters).forEach(value => {
      if (value && value !== 'all' && value !== '') count++;
    });
    
    setActiveFiltersCount(count);
  }, [filters]);

  // Notify parent component of filter changes
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle custom filter changes
  const handleCustomFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      customFilters: {
        ...prev.customFilters,
        [key]: value
      }
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      dateRange: 'last30days',
      startDate: '',
      endDate: '',
      department: 'all',
      role: 'all',
      status: 'all',
      search: '',
      customFilters: {}
    });
  };

  // Remove specific filter
  const removeFilter = (filterKey) => {
    if (filterKey.startsWith('custom_')) {
      const customKey = filterKey.replace('custom_', '');
      handleCustomFilterChange(customKey, '');
    } else {
      handleFilterChange(filterKey, filterKey === 'search' ? '' : 'all');
    }
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Advanced Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
            {showExport && onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                disabled={isExporting}
                className="flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>{isExporting ? 'Exporting...' : 'Export'}</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            {filters.department !== 'all' && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <span>Department: {filters.department}</span>
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeFilter('department')}
                />
              </Badge>
            )}
            {filters.role !== 'all' && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <span>Role: {filters.role}</span>
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeFilter('role')}
                />
              </Badge>
            )}
            {filters.status !== 'all' && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <span>Status: {filters.status}</span>
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeFilter('status')}
                />
              </Badge>
            )}
            {filters.search.trim() && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <span>Search: "{filters.search}"</span>
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeFilter('search')}
                />
              </Badge>
            )}
            {filters.dateRange !== 'last30days' && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <span>Date: {dateRanges.find(r => r.value === filters.dateRange)?.label}</span>
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('dateRange', 'last30days')}
                />
              </Badge>
            )}
            {Object.entries(filters.customFilters).map(([key, value]) => {
              if (!value || value === 'all' || value === '') return null;
              return (
                <Badge key={key} variant="outline" className="flex items-center space-x-1">
                  <span>{key}: {value}</span>
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFilter(`custom_${key}`)}
                  />
                </Badge>
              );
            })}
          </div>
        )}

        {/* Main Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          {showSearch && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <Input
                placeholder="Search by name, email, etc..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {/* Department Filter */}
          {showDepartment && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <Select 
                value={filters.department} 
                onValueChange={(value) => handleFilterChange('department', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {(availableDepartments.length > 0 ? availableDepartments : defaultDepartments).map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Role Filter */}
          {showRole && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <Select 
                value={filters.role} 
                onValueChange={(value) => handleFilterChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {(availableRoles.length > 0 ? availableRoles : defaultRoles).map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status Filter */}
          {showStatus && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {(availableStatuses.length > 0 ? availableStatuses : defaultStatuses).map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Date Range Filters */}
            {showDateRange && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Date Range</span>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quick Select
                    </label>
                    <Select 
                      value={filters.dateRange} 
                      onValueChange={(value) => handleFilterChange('dateRange', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dateRanges.map(range => (
                          <SelectItem key={range.value} value={range.value}>
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {filters.dateRange === 'custom' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <Input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <Input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Custom Filters */}
            {customFilters.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Additional Filters
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customFilters.map(filter => (
                    <div key={filter.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {filter.label}
                      </label>
                      {filter.type === 'select' ? (
                        <Select 
                          value={filters.customFilters[filter.key] || 'all'} 
                          onValueChange={(value) => handleCustomFilterChange(filter.key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`All ${filter.label}`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All {filter.label}</SelectItem>
                            {filter.options.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}`}
                          value={filters.customFilters[filter.key] || ''}
                          onChange={(e) => handleCustomFilterChange(filter.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedFilters;