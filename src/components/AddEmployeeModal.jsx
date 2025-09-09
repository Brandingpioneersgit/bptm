import React, { useState } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { useDataSync } from './DataSyncContext';
import { DEPARTMENTS, ROLES_BY_DEPT } from '@/shared/lib/constants';
import { Section, TextField, MultiSelect } from '@/shared/components/ui';
import { getOrCreateEmployee } from '../utils/createEmployeesTable.js';

const AddEmployeeModal = ({ onClose, onSuccess }) => {
  const { supabase } = useSupabase();
  const { showToast } = useToast();
  const { addEmployee } = useDataSync();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    department: 'Web',
    role: [],
    employeeType: 'Full-time',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'active'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const validateForm = () => {
    const required = ['name', 'phone', 'email', 'department'];
    
    for (const field of required) {
      if (!formData[field]) {
        showToast(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
        return false;
      }
    }
    
    if (!formData.role || formData.role.length === 0) {
      showToast('Please select at least one role', 'error');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast('Please enter a valid email address', 'error');
      return false;
    }
    
    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      showToast('Please enter a valid phone number', 'error');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const employeeData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        department: formData.department,
        role: formData.role,
        employee_type: formData.employeeType,
        joining_date: formData.joiningDate,
        status: formData.status,
        created_at: new Date().toISOString()
      };
      
      // Try to save to Supabase if available
      if (supabase) {
        try {
          const result = await getOrCreateEmployee(supabase, employeeData);
          if (result) {
            employeeData.id = result.id;
          }
        } catch (error) {
          console.warn('Failed to save to Supabase, using local storage:', error);
        }
      }
      
      // Add to local state
      if (!employeeData.id) {
        employeeData.id = Date.now().toString();
      }
      
      addEmployee(employeeData);
      
      // Save to localStorage as backup
      const existingEmployees = JSON.parse(localStorage.getItem('employees') || '[]');
      const updatedEmployees = [employeeData, ...existingEmployees];
      localStorage.setItem('employees', JSON.stringify(updatedEmployees));
      
      showToast('Employee added successfully!', 'success');
      
      if (onSuccess) {
        onSuccess(employeeData);
      }
      
      onClose();
      
    } catch (error) {
      console.error('Error adding employee:', error);
      showToast('Failed to add employee. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const availableRoles = ROLES_BY_DEPT[formData.department] || [];
  
  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Full Name"
              value={formData.name}
              onChange={(value) => handleInputChange('name', value)}
              placeholder="Enter employee's full name"
              required
            />
            
            <TextField
              label="Phone Number"
              value={formData.phone}
              onChange={(value) => handleInputChange('phone', value)}
              placeholder="Enter phone number"
              required
            />
            
            <TextField
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(value) => handleInputChange('email', value)}
              placeholder="Enter email address"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MultiSelect
              label="Role(s)"
              value={formData.role}
              onChange={(value) => handleInputChange('role', value)}
              options={availableRoles}
              placeholder="Select role(s)"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Type
              </label>
              <select
                value={formData.employeeType}
                onChange={(e) => handleInputChange('employeeType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Remote">Remote</option>
                <option value="Intern">Intern</option>
                <option value="Consultant">Consultant</option>
                <option value="Freelancer">Freelancer</option>
              </select>
            </div>
            
            <TextField
              label="Joining Date"
              type="date"
              value={formData.joiningDate}
              onChange={(value) => handleInputChange('joiningDate', value)}
              required
            />
          </div>
        </Section>
        
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Adding...' : 'Add Employee'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEmployeeModal;