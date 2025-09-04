import React, { useState, useEffect, useCallback } from 'react';
import { useEmployeeSync } from '@/features/employees/context/EmployeeSyncContext';
import SearchableDropdown from './SearchableDropdown';

const EmployeeDropdown = ({ 
  value = '', 
  onChange, 
  onEmployeeSelect,
  placeholder = 'Select or type employee name...',
  allowCreate = true,
  disabled = false,
  className = '',
  label = 'Employee',
  required = false
}) => {
  const { 
    employees, 
    loading, 
    getEmployeeOptions, 
    findEmployeeByIdentity, 
    addEmployee 
  } = useEmployeeSync();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Get employee options for dropdown
  const employeeOptions = getEmployeeOptions();

  // Filter options based on search term
  const filteredOptions = employeeOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle employee selection from dropdown
  const handleEmployeeSelect = useCallback((selectedValue) => {
    if (!selectedValue) {
      setSelectedEmployee(null);
      if (onEmployeeSelect) {
        onEmployeeSelect(null);
      }
      if (onChange) {
        onChange('');
      }
      return;
    }

    // Parse the value (format: "name|phone")
    const [name, phone] = selectedValue.split('|');
    const employee = findEmployeeByIdentity(name, phone);
    
    if (employee) {
      setSelectedEmployee(employee);
      setSearchTerm(employee.name);
      
      // Notify parent components
      if (onEmployeeSelect) {
        onEmployeeSelect(employee);
      }
      if (onChange) {
        onChange(employee.name);
      }
    }
  }, [findEmployeeByIdentity, onEmployeeSelect, onChange]);

  // Handle manual input (for new employees)
  const handleInputChange = useCallback((inputValue) => {
    setSearchTerm(inputValue);
    if (onChange) {
      onChange(inputValue);
    }

    // Check if this matches an existing employee
    const existingEmployee = employees.find(emp => 
      emp.name.toLowerCase() === inputValue.toLowerCase()
    );
    
    if (existingEmployee) {
      setSelectedEmployee(existingEmployee);
      if (onEmployeeSelect) {
        onEmployeeSelect(existingEmployee);
      }
    } else {
      setSelectedEmployee(null);
      if (onEmployeeSelect) {
        onEmployeeSelect(null);
      }
    }
  }, [employees, onChange, onEmployeeSelect]);

  // Create new employee when needed
  const handleCreateEmployee = useCallback(async (name) => {
    if (!allowCreate || !name.trim()) return null;
    
    setIsCreatingNew(true);
    try {
      const newEmployee = await addEmployee({
        name: name.trim(),
        department: 'Unassigned',
        role: 'Employee',
        status: 'Active'
      });
      if (newEmployee) {
        setSelectedEmployee(newEmployee);
        setSearchTerm(newEmployee.name);
        
        if (onEmployeeSelect) {
          onEmployeeSelect(newEmployee);
        }
        if (onChange) {
          onChange(newEmployee.name);
        }
      }
      return newEmployee;
    } catch (error) {
      console.error('Error creating employee:', error);
      return null;
    } finally {
      setIsCreatingNew(false);
    }
  }, [allowCreate, addEmployee, onEmployeeSelect, onChange]);

  // Update search term when value prop changes
  useEffect(() => {
    if (value !== searchTerm) {
      setSearchTerm(value || '');
    }
  }, [value]);

  // Auto-populate employee data when name is typed
  useEffect(() => {
    if (searchTerm && !selectedEmployee) {
      const matchingEmployee = employees.find(emp => 
        emp.name.toLowerCase() === searchTerm.toLowerCase()
      );
      
      if (matchingEmployee) {
        setSelectedEmployee(matchingEmployee);
        if (onEmployeeSelect) {
          onEmployeeSelect(matchingEmployee);
        }
      }
    }
  }, [searchTerm, selectedEmployee, employees, onEmployeeSelect]);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <SearchableDropdown
          options={filteredOptions}
          value={selectedEmployee ? selectedEmployee.name : ''}
          onChange={(selectedValue) => {
            // If it's a new employee name (string), create it
            if (typeof selectedValue === 'string' && !employeeOptions.find(opt => opt.value === selectedValue)) {
              if (allowCreate) {
                handleCreateEmployee(selectedValue);
              }
            } else {
              // Find the employee from the selected option
              const selectedOption = employeeOptions.find(opt => opt.value === selectedValue || opt.label === selectedValue);
              if (selectedOption) {
                handleEmployeeSelect(selectedOption.value);
              }
            }
          }}
          onInputChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || loading}
          searchable
          creatable={allowCreate}
          isLoading={loading || isCreatingNew}
          className="w-full"
          onCreateNew={allowCreate ? handleCreateEmployee : undefined}
        />
        
        {/* Employee info display */}
        {selectedEmployee && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {selectedEmployee.name}
                </p>
                <p className="text-xs text-blue-700">
                  {selectedEmployee.department} • {selectedEmployee.phone}
                </p>
                {selectedEmployee.role && selectedEmployee.role.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Roles: {Array.isArray(selectedEmployee.role) 
                      ? selectedEmployee.role.join(', ') 
                      : selectedEmployee.role}
                  </p>
                )}
              </div>
              <div className="text-xs text-blue-500">
                Auto-populated
              </div>
            </div>
          </div>
        )}
        
        {/* New employee indicator */}
        {searchTerm && !selectedEmployee && allowCreate && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-700">
              💡 New employee "{searchTerm}" will be created when form is submitted
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDropdown;