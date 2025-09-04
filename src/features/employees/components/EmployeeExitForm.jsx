import React, { useState, useCallback } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { useModal } from '@/shared/components/ModalContext';
import { useEmployeeSync } from '@/features/employees/context/EmployeeSyncContext';
import { Section, TextField, TextArea, MultiSelect } from '@/shared/components/ui';
import EmployeeDropdown from '@/shared/components/EmployeeDropdown';

const EXIT_REASONS = [
  'Resignation - Better Opportunity',
  'Resignation - Personal Reasons',
  'Resignation - Career Change',
  'Resignation - Relocation',
  'Resignation - Health Issues',
  'Resignation - Family Reasons',
  'Termination - Performance',
  'Termination - Misconduct',
  'Termination - Redundancy',
  'Retirement',
  'End of Contract',
  'Other'
];

const EXIT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  COMPLETED: 'completed'
};

export function EmployeeExitForm({ selectedEmployee = null, onClose, onSuccess }) {
  const supabase = useSupabase();
  const { notify } = useToast();
  const { openModal, closeModal } = useModal();
  const { refreshEmployees } = useEmployeeSync();
  
  const [formData, setFormData] = useState({
    // Employee Information
    employeeId: selectedEmployee?.id || '',
    employeeName: selectedEmployee?.name || '',
    employeePhone: selectedEmployee?.phone || '',
    department: selectedEmployee?.department || '',
    role: selectedEmployee?.role || [],
    
    // Exit Details
    exitReason: '',
    customReason: '',
    lastWorkingDay: '',
    noticePeriod: '30', // days
    immediateExit: false,
    
    // Exit Interview
    overallExperience: '',
    reasonForLeaving: '',
    workEnvironmentFeedback: '',
    managementFeedback: '',
    improvementSuggestions: '',
    wouldRecommendCompany: '',
    
    // Asset Return
    assetsToReturn: [],
    laptopReturned: false,
    accessCardsReturned: false,
    documentsReturned: false,
    otherAssets: '',
    
    // Handover
    handoverNotes: '',
    handoverTo: '',
    pendingTasks: '',
    clientHandover: '',
    
    // HR Processing
    finalSettlement: '',
    hrNotes: '',
    managerApproval: false,
    hrApproval: false,
    status: EXIT_STATUS.PENDING
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  
  const FORM_STEPS = [
    { id: 1, title: "Employee & Exit Details", icon: "👤", description: "Basic exit information" },
    { id: 2, title: "Exit Interview", icon: "💬", description: "Feedback and experience" },
    { id: 3, title: "Asset Return", icon: "💼", description: "Company assets and equipment" },
    { id: 4, title: "Handover", icon: "🔄", description: "Knowledge and task transfer" },
    { id: 5, title: "HR Processing", icon: "✅", description: "Final approvals and settlement" }
  ];
  
  const updateFormData = useCallback((field, value) => {
    setFormData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });
    
    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);
  
  const validateStep = useCallback((stepNumber) => {
    const stepErrors = {};
    
    if (stepNumber === 1) {
      if (!formData.employeeName) stepErrors.employeeName = 'Employee name is required';
      if (!formData.exitReason) stepErrors.exitReason = 'Exit reason is required';
      if (formData.exitReason === 'Other' && !formData.customReason) {
        stepErrors.customReason = 'Please specify the reason';
      }
      if (!formData.lastWorkingDay) stepErrors.lastWorkingDay = 'Last working day is required';
    }
    
    if (stepNumber === 2) {
      if (!formData.overallExperience) stepErrors.overallExperience = 'Overall experience is required';
      if (!formData.reasonForLeaving) stepErrors.reasonForLeaving = 'Reason for leaving is required';
    }
    
    return stepErrors;
  }, [formData]);
  
  const handleNext = useCallback(() => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    
    setErrors({});
    setCurrentStep(prev => Math.min(prev + 1, FORM_STEPS.length));
  }, [currentStep, validateStep]);
  
  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);
  
  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      
      // Validate all steps
      let allErrors = {};
      for (let i = 1; i <= FORM_STEPS.length; i++) {
        const stepErrors = validateStep(i);
        allErrors = { ...allErrors, ...stepErrors };
      }
      
      if (Object.keys(allErrors).length > 0) {
        setErrors(allErrors);
        notify('Please fix all errors before submitting', 'error');
        return;
      }
      
      const exitData = {
        employee_id: formData.employeeId,
        employee_name: formData.employeeName,
        employee_phone: formData.employeePhone,
        department: formData.department,
        role: formData.role,
        exit_reason: formData.exitReason,
        custom_reason: formData.customReason,
        last_working_day: formData.lastWorkingDay,
        notice_period: parseInt(formData.noticePeriod),
        immediate_exit: formData.immediateExit,
        overall_experience: formData.overallExperience,
        reason_for_leaving: formData.reasonForLeaving,
        work_environment_feedback: formData.workEnvironmentFeedback,
        management_feedback: formData.managementFeedback,
        improvement_suggestions: formData.improvementSuggestions,
        would_recommend_company: formData.wouldRecommendCompany,
        assets_to_return: formData.assetsToReturn,
        laptop_returned: formData.laptopReturned,
        access_cards_returned: formData.accessCardsReturned,
        documents_returned: formData.documentsReturned,
        other_assets: formData.otherAssets,
        handover_notes: formData.handoverNotes,
        handover_to: formData.handoverTo,
        pending_tasks: formData.pendingTasks,
        client_handover: formData.clientHandover,
        final_settlement: formData.finalSettlement,
        hr_notes: formData.hrNotes,
        manager_approval: formData.managerApproval,
        hr_approval: formData.hrApproval,
        status: formData.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      if (supabase) {
        // Create exit record in database
        const { error: exitError } = await supabase
          .from('employee_exits')
          .insert([exitData]);
        
        if (exitError) throw exitError;
        
        // Update employee status to 'Exiting' or 'Inactive'
        const newStatus = formData.immediateExit ? 'Inactive' : 'Exiting';
        const updateData = {
          status: newStatus,
          updated_at: new Date().toISOString()
        };
        
        if (formData.immediateExit || new Date(formData.lastWorkingDay) <= new Date()) {
          updateData.departure_date = formData.lastWorkingDay;
        }
        
        const { error: updateError } = await supabase
          .from('employees')
          .update(updateData)
          .eq('id', formData.employeeId);
        
        if (updateError) throw updateError;
      } else {
        // Local storage fallback
        const exitRecords = JSON.parse(localStorage.getItem('employee_exits') || '[]');
        exitRecords.push({ ...exitData, id: Date.now().toString() });
        localStorage.setItem('employee_exits', JSON.stringify(exitRecords));
        
        // Update local employee data
        const employees = JSON.parse(localStorage.getItem('employees') || '[]');
        const updatedEmployees = employees.map(emp => {
          if (emp.id === formData.employeeId) {
            return {
              ...emp,
              status: formData.immediateExit ? 'Inactive' : 'Exiting',
              departure_date: formData.immediateExit || new Date(formData.lastWorkingDay) <= new Date() 
                ? formData.lastWorkingDay : null
            };
          }
          return emp;
        });
        localStorage.setItem('employees', JSON.stringify(updatedEmployees));
      }
      
      // Refresh employee data
      if (refreshEmployees) {
        await refreshEmployees();
      }
      
      notify('Employee exit form submitted successfully', 'success');
      
      // Show success modal
      openModal({
        title: 'Exit Form Submitted',
        content: (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Exit form submitted successfully!
            </h3>
            <p className="text-gray-600 mb-4">
              The employee exit process has been initiated for {formData.employeeName}.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• HR will review the exit form</li>
                <li>• Asset return will be coordinated</li>
                <li>• Handover process will be initiated</li>
                <li>• Final settlement will be processed</li>
                <li>• Employee status updated to: {formData.immediateExit ? 'Inactive' : 'Exiting'}</li>
              </ul>
            </div>
          </div>
        ),
        actions: [
          {
            label: 'Close',
            onClick: () => {
              closeModal();
              if (onSuccess) onSuccess();
              if (onClose) onClose();
            },
            variant: 'primary'
          }
        ]
      });
      
    } catch (error) {
      console.error('Exit form submission error:', error);
      notify('Failed to submit exit form. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateStep, supabase, notify, openModal, closeModal, refreshEmployees, onSuccess, onClose]);
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <Section title="Employee Information" icon="👤">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EmployeeDropdown
                  value={formData.employeeName}
                  onChange={(employee) => {
                    if (employee) {
                      updateFormData('employeeId', employee.id);
                      updateFormData('employeeName', employee.name);
                      updateFormData('employeePhone', employee.phone);
                      updateFormData('department', employee.department);
                      updateFormData('role', employee.role);
                    }
                  }}
                  placeholder="Select employee"
                  error={errors.employeeName}
                  required
                />
                
                <TextField
                  label="Department"
                  value={formData.department}
                  onChange={(value) => updateFormData('department', value)}
                  disabled
                />
              </div>
            </Section>
            
            <Section title="Exit Details" icon="📋">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exit Reason *
                  </label>
                  <select
                    value={formData.exitReason}
                    onChange={(e) => updateFormData('exitReason', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.exitReason ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select reason</option>
                    {EXIT_REASONS.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                  {errors.exitReason && (
                    <p className="mt-1 text-sm text-red-600">{errors.exitReason}</p>
                  )}
                </div>
                
                {formData.exitReason === 'Other' && (
                  <TextField
                    label="Custom Reason"
                    value={formData.customReason}
                    onChange={(value) => updateFormData('customReason', value)}
                    placeholder="Please specify"
                    error={errors.customReason}
                    required
                  />
                )}
                
                <TextField
                  label="Last Working Day"
                  type="date"
                  value={formData.lastWorkingDay}
                  onChange={(value) => updateFormData('lastWorkingDay', value)}
                  error={errors.lastWorkingDay}
                  required
                />
                
                <TextField
                  label="Notice Period (days)"
                  type="number"
                  value={formData.noticePeriod}
                  onChange={(value) => updateFormData('noticePeriod', value)}
                  min="0"
                  max="90"
                />
              </div>
              
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.immediateExit}
                    onChange={(e) => updateFormData('immediateExit', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Immediate exit (no notice period)
                  </span>
                </label>
              </div>
            </Section>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <Section title="Exit Interview" icon="💬">
              <div className="space-y-4">
                <TextArea
                  label="Overall Experience"
                  value={formData.overallExperience}
                  onChange={(value) => updateFormData('overallExperience', value)}
                  placeholder="How would you describe your overall experience working here?"
                  rows={3}
                  error={errors.overallExperience}
                  required
                />
                
                <TextArea
                  label="Primary Reason for Leaving"
                  value={formData.reasonForLeaving}
                  onChange={(value) => updateFormData('reasonForLeaving', value)}
                  placeholder="What is the main reason you are leaving?"
                  rows={3}
                  error={errors.reasonForLeaving}
                  required
                />
                
                <TextArea
                  label="Work Environment Feedback"
                  value={formData.workEnvironmentFeedback}
                  onChange={(value) => updateFormData('workEnvironmentFeedback', value)}
                  placeholder="How would you rate the work environment and culture?"
                  rows={3}
                />
                
                <TextArea
                  label="Management Feedback"
                  value={formData.managementFeedback}
                  onChange={(value) => updateFormData('managementFeedback', value)}
                  placeholder="How would you rate the management and leadership?"
                  rows={3}
                />
                
                <TextArea
                  label="Improvement Suggestions"
                  value={formData.improvementSuggestions}
                  onChange={(value) => updateFormData('improvementSuggestions', value)}
                  placeholder="What suggestions do you have for improvement?"
                  rows={3}
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Would you recommend this company to others?
                  </label>
                  <select
                    value={formData.wouldRecommendCompany}
                    onChange={(e) => updateFormData('wouldRecommendCompany', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select option</option>
                    <option value="Definitely Yes">Definitely Yes</option>
                    <option value="Probably Yes">Probably Yes</option>
                    <option value="Maybe">Maybe</option>
                    <option value="Probably No">Probably No</option>
                    <option value="Definitely No">Definitely No</option>
                  </select>
                </div>
              </div>
            </Section>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <Section title="Asset Return" icon="💼">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.laptopReturned}
                      onChange={(e) => updateFormData('laptopReturned', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Laptop/Computer returned</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.accessCardsReturned}
                      onChange={(e) => updateFormData('accessCardsReturned', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Access cards returned</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.documentsReturned}
                      onChange={(e) => updateFormData('documentsReturned', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Company documents returned</span>
                  </label>
                </div>
                
                <TextArea
                  label="Other Assets to Return"
                  value={formData.otherAssets}
                  onChange={(value) => updateFormData('otherAssets', value)}
                  placeholder="List any other company assets that need to be returned"
                  rows={3}
                />
              </div>
            </Section>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <Section title="Knowledge Handover" icon="🔄">
              <div className="space-y-4">
                <TextField
                  label="Handover To"
                  value={formData.handoverTo}
                  onChange={(value) => updateFormData('handoverTo', value)}
                  placeholder="Name of person taking over responsibilities"
                />
                
                <TextArea
                  label="Handover Notes"
                  value={formData.handoverNotes}
                  onChange={(value) => updateFormData('handoverNotes', value)}
                  placeholder="Key information, processes, and knowledge to transfer"
                  rows={4}
                />
                
                <TextArea
                  label="Pending Tasks"
                  value={formData.pendingTasks}
                  onChange={(value) => updateFormData('pendingTasks', value)}
                  placeholder="List of pending tasks and their status"
                  rows={3}
                />
                
                <TextArea
                  label="Client Handover"
                  value={formData.clientHandover}
                  onChange={(value) => updateFormData('clientHandover', value)}
                  placeholder="Client relationships and ongoing projects to transfer"
                  rows={3}
                />
              </div>
            </Section>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <Section title="HR Processing" icon="✅">
              <div className="space-y-4">
                <TextArea
                  label="Final Settlement Notes"
                  value={formData.finalSettlement}
                  onChange={(value) => updateFormData('finalSettlement', value)}
                  placeholder="Salary, benefits, and other settlement details"
                  rows={3}
                />
                
                <TextArea
                  label="HR Notes"
                  value={formData.hrNotes}
                  onChange={(value) => updateFormData('hrNotes', value)}
                  placeholder="Additional HR notes and comments"
                  rows={3}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.managerApproval}
                      onChange={(e) => updateFormData('managerApproval', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Manager approval</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hrApproval}
                      onChange={(e) => updateFormData('hrApproval', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">HR approval</span>
                  </label>
                </div>
              </div>
            </Section>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Employee Exit Form</h2>
          <p className="text-sm text-gray-600 mt-1">
            Complete the exit process for departing employees
          </p>
        </div>
        
        {/* Enhanced Progress Steps with Navigation */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Exit Process Progress</h3>
              <p className="text-xs text-gray-500 mt-1">💡 Click any step to navigate freely</p>
            </div>
          </div>
          
          <div className="relative">
            <div className="flex justify-between">
              {FORM_STEPS.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center relative z-10">
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-semibold transition-all duration-200 cursor-pointer hover:scale-105 ${
                      currentStep === step.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                        : currentStep > step.id
                        ? 'bg-green-600 text-white border-green-600 shadow-md'
                        : 'bg-gray-100 text-gray-400 border-gray-300 hover:border-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {currentStep > step.id ? '✓' : step.icon}
                  </button>
                  <div className="mt-2 text-center">
                    <div className={`text-xs font-medium ${
                      currentStep === step.id ? 'text-blue-600' : currentStep > step.id ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Progress Line */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 -z-10">
              <div 
                className="h-full bg-green-600 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / (FORM_STEPS.length - 1)) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Form Content */}
        <div className="px-6 py-6">
          {renderStepContent()}
        </div>
        
        {/* Navigation */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            
            {currentStep < FORM_STEPS.length ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Exit Form'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}