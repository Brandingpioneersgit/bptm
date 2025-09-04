import React, { useState, useEffect } from 'react';
import { TextField, Section, TextArea } from '@/shared/components/ui';
import { DEPARTMENTS } from '@/shared/lib/constants';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useAutoSave, useAutoSaveKey } from '@/shared/hooks/useAutoSave';
import { useStandardizedFeedback, FEEDBACK_MESSAGES } from '@/shared/utils/feedbackUtils';

const LEAVE_TYPES = [
  'Half-Day Leave',
  'Half-Day Work from Home',
  'Client Meeting',
  'Sick Leave',
  'Unpaid Leave',
  'Casual/ Privilege (Paid Leave)',
  'Missed Punch Biometric',
  'Period WFH( Females Only)'
];

const PERMISSION_OPTIONS = [
  'Direct Manager',
  'Department Head',
  'HR Manager',
  'Team Lead',
  'Project Manager'
];

export const LeaveApplicationForm = ({ onSubmit, onCancel }) => {
  const { user: currentUser } = useUnifiedAuth();
  const feedback = useStandardizedFeedback();
  const [formData, setFormData] = useState({
    employeeName: currentUser?.name || '',
    officialEmail: currentUser?.email || '',
    department: currentUser?.department || '',
    leaveType: '',
    startDate: { day: '', month: '', year: '' },
    endDate: { day: '', month: '', year: '' },
    willCompensate: '',
    hasPriorPermission: '',
    permissionFrom: '',
    clientInformed: '',
    reason: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-save functionality
  const autoSaveKey = useAutoSaveKey('leave-application', currentUser?.email || 'anonymous');
  const { saveData, loadSavedData, clearSavedData, autoSaveStatus, hasUnsavedChanges } = useAutoSave(
    autoSaveKey,
    formData,
    {
      onSave: () => feedback.showInfo(FEEDBACK_MESSAGES.DRAFT_SAVE_SUCCESS, { duration: 2000 }),
      onError: (error) => {
        console.error('Auto-save failed:', error);
        feedback.showError(FEEDBACK_MESSAGES.DRAFT_SAVE_ERROR);
      }
    }
  );

  // Auto-populate user data when available and load saved data
  useEffect(() => {
    // First try to load saved data
    const savedData = loadSavedData();
    if (savedData) {
      setFormData(savedData);
    } else if (currentUser) {
      // Only populate user data if no saved data exists
      setFormData(prev => ({
        ...prev,
        employeeName: currentUser.name || '',
        officialEmail: currentUser.email || '',
        department: currentUser.department || ''
      }));
    }
  }, [currentUser, loadSavedData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleDateChange = (dateType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [dateType]: {
        ...prev[dateType],
        [field]: value
      }
    }));
    // Clear date errors
    if (errors[dateType]) {
      setErrors(prev => ({ ...prev, [dateType]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.employeeName.trim()) {
      newErrors.employeeName = 'Employee name is required';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.leaveType) {
      newErrors.leaveType = 'Leave application type is required';
    }

    if (!formData.hasPriorPermission) {
      newErrors.hasPriorPermission = 'Prior permission status is required';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason for leave/WFH is required';
    }

    // Date validation
    const { startDate, endDate } = formData;
    if (!startDate.day || !startDate.month || !startDate.year) {
      newErrors.startDate = 'Start date is required';
    } else {
      const startDateObj = new Date(startDate.year, startDate.month - 1, startDate.day);
      if (isNaN(startDateObj.getTime())) {
        newErrors.startDate = 'Invalid start date';
      }
    }

    if (!endDate.day || !endDate.month || !endDate.year) {
      newErrors.endDate = 'End date is required';
    } else {
      const endDateObj = new Date(endDate.year, endDate.month - 1, endDate.day);
      if (isNaN(endDateObj.getTime())) {
        newErrors.endDate = 'Invalid end date';
      } else {
        const startDateObj = new Date(startDate.year, startDate.month - 1, startDate.day);
        if (endDateObj < startDateObj) {
          newErrors.endDate = 'End date cannot be before start date';
        }
      }
    }

    // Email validation
    if (formData.officialEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.officialEmail)) {
      newErrors.officialEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      feedback.showValidationError('Please fix the validation errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Format dates for submission
      const formattedData = {
        ...formData,
        startDate: `${formData.startDate.day}/${formData.startDate.month}/${formData.startDate.year}`,
        endDate: `${formData.endDate.day}/${formData.endDate.month}/${formData.endDate.year}`,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };

      await onSubmit(formattedData);
      
      // Clear saved data on successful submission
      clearSavedData();
      feedback.showFormSuccess('Leave application submitted successfully!');
      
    } catch (error) {
      console.error('Error submitting leave application:', error);
      feedback.showFormError(error, 'Failed to submit leave application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel with unsaved changes warning
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel? Your progress will be saved automatically.'
      );
      if (!confirmLeave) return;
    }
    onCancel();
  };

  const renderDateInput = (dateType, label, required = false) => {
    const dateData = formData[dateType];
    const error = errors[dateType];

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="DD"
              value={dateData.day}
              onChange={(e) => handleDateChange(dateType, 'day', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength="2"
            />
            <div className="text-xs text-gray-500 mt-1">Day</div>
          </div>
          <span className="text-gray-400">/</span>
          <div className="flex-1">
            <input
              type="text"
              placeholder="MM"
              value={dateData.month}
              onChange={(e) => handleDateChange(dateType, 'month', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength="2"
            />
            <div className="text-xs text-gray-500 mt-1">Month</div>
          </div>
          <span className="text-gray-400">/</span>
          <div className="flex-1">
            <input
              type="text"
              placeholder="YYYY"
              value={dateData.year}
              onChange={(e) => handleDateChange(dateType, 'year', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength="4"
            />
            <div className="text-xs text-gray-500 mt-1">Year</div>
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    );
  };

  const renderRadioGroup = (name, options, value, onChange, required = false, label) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="space-y-2">
          {options.map((option) => (
            <label key={option} className="flex items-center">
              <input
                type="radio"
                name={name}
                value={option}
                checked={value === option}
                onChange={(e) => onChange(e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
        {errors[name] && (
          <p className="text-sm text-red-600 mt-1">{errors[name]}</p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
        <h2 className="text-2xl font-bold">Leave / Work From Home Application</h2>
        <p className="text-blue-100 mt-2">Please fill out all required fields to submit your application</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Employee Information Section */}
        <Section title="Employee Information" number={1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              label="Employee Name"
              value={formData.employeeName}
              onChange={(value) => handleInputChange('employeeName', value)}
              placeholder="Type here"
              required
              error={errors.employeeName}
            />
            
            <TextField
              label="Official Email"
              value={formData.officialEmail}
              onChange={(value) => handleInputChange('officialEmail', value)}
              placeholder="Enter your e-mail"
              error={errors.officialEmail}
            />
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Enter your Information</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            {errors.department && (
              <p className="text-sm text-red-600 mt-1">{errors.department}</p>
            )}
          </div>
        </Section>

        {/* Leave Application Details */}
        <Section title="Leave Application Details" number={2}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Application Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.leaveType}
                onChange={(e) => handleInputChange('leaveType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select leave type</option>
                {LEAVE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.leaveType && (
                <p className="text-sm text-red-600 mt-1">{errors.leaveType}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderDateInput('startDate', 'Start Date (DD/MM/YYYY)', true)}
              {renderDateInput('endDate', 'End Date (DD/MM/YYYY)', true)}
            </div>
          </div>
        </Section>

        {/* Permission and Compensation */}
        <Section title="Permission and Compensation" number={3}>
          <div className="space-y-6">
            {renderRadioGroup(
              'willCompensate',
              ['Yes', 'No'],
              formData.willCompensate,
              (value) => handleInputChange('willCompensate', value),
              false,
              'Would you compensate this leave by working on a holiday?'
            )}

            {renderRadioGroup(
              'hasPriorPermission',
              ['Yes', 'No'],
              formData.hasPriorPermission,
              (value) => handleInputChange('hasPriorPermission', value),
              true,
              'Have you taken prior permission for this leave/WFH?'
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Whom have you taken permission for your leave/WFH
              </label>
              <select
                value={formData.permissionFrom}
                onChange={(e) => handleInputChange('permissionFrom', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select an option</option>
                {PERMISSION_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        {/* Client Information and Reason */}
        <Section title="Additional Information" number={4}>
          <div className="space-y-6">
            <TextField
              label="Have you informed your client that you wont be available (Only fill if you are taking a leave and you report your work to client directly)"
              value={formData.clientInformed}
              onChange={(value) => handleInputChange('clientInformed', value)}
              placeholder="Enter your Information"
            />

            <TextArea
              label="Reason for Leave/WFH"
              value={formData.reason}
              onChange={(value) => handleInputChange('reason', value)}
              placeholder="Please provide detailed reason for your leave/WFH request"
              rows={4}
              error={errors.reason}
              required
            />
          </div>
        </Section>

        {/* Auto-save Status */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            {autoSaveStatus === 'saving' && (
              <>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-600">Saving...</span>
              </>
            )}
            {autoSaveStatus === 'saved' && (
              <>
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-green-600">Saved</span>
              </>
            )}
            {autoSaveStatus === 'error' && (
              <>
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-red-600">Save failed</span>
              </>
            )}
            {hasUnsavedChanges && autoSaveStatus === 'idle' && (
              <>
                <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span className="text-yellow-600">Unsaved changes</span>
              </>
            )}
            {!hasUnsavedChanges && autoSaveStatus === 'idle' && (
              <>
                <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                <span className="text-gray-600">Ready</span>
              </>
            )}
          </div>
          
          {hasUnsavedChanges && autoSaveStatus !== 'saving' && (
            <button
              type="button"
              onClick={() => saveData()}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Save Now
            </button>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveApplicationForm;