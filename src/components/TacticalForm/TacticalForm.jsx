import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { thisMonthKey, monthLabel, DEPARTMENTS } from '@/shared/lib/constants';
import { Section, TextField, NumField, TextArea } from '@/shared/components/ui';
import EmployeeDropdown from '@/shared/components/EmployeeDropdown';
import ClientDropdown from '@/shared/components/ClientDropdown';

// Simplified tactical form with clean logic
export function TacticalForm({ onBack = null, existingSubmission = null }) {
  const supabase = useSupabase();
  const { notify } = useToast();
  const { user } = useUnifiedAuth();
  
  // Core form state
  const [formData, setFormData] = useState({
    employee: { name: '', phone: '', department: 'Web', role: [] },
    monthKey: thisMonthKey(),
    attendance: { wfo: 0, wfh: 0 },
    tasks: { count: 0, aiTableLink: '', aiTableScreenshot: '' },
    clients: [],
    learning: [],
    aiUsageNotes: '',
    feedback: { company: '', hr: '', management: '' },
    isDraft: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form steps
  const STEPS = [
    { id: 1, title: "Employee & Month", icon: "👤" },
    { id: 2, title: "Attendance & Tasks", icon: "📅" },
    { id: 3, title: "Clients & KPIs", icon: "📊" },
    { id: 4, title: "Learning & AI", icon: "🎓" },
    { id: 5, title: "Feedback & Submit", icon: "💬" }
  ];
  
  // Load existing submission if editing
  useEffect(() => {
    if (existingSubmission) {
      setFormData({
        employee: existingSubmission.employee || { name: '', phone: '', department: 'Web', role: [] },
        monthKey: existingSubmission.month_key || thisMonthKey(),
        attendance: existingSubmission.attendance || { wfo: 0, wfh: 0 },
        tasks: existingSubmission.tasks || { count: 0, aiTableLink: '', aiTableScreenshot: '' },
        clients: existingSubmission.clients || [],
        learning: existingSubmission.learning || [],
        aiUsageNotes: existingSubmission.ai_usage_notes || '',
        feedback: existingSubmission.feedback || { company: '', hr: '', management: '' },
        isDraft: existingSubmission.is_draft || false
      });
    }
  }, [existingSubmission]);
  
  // Auto-populate employee if logged in
  useEffect(() => {
    if (user && !formData.employee.name) {
      setFormData(prev => ({
        ...prev,
        employee: {
          name: user.name || '',
          phone: user.phone || '',
          department: user.department || 'Web',
          role: user.role || []
        }
      }));
    }
  }, [user, formData.employee.name]);
  
  // Form validation
  const validateStep = useCallback((step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.employee.name) newErrors.employeeName = 'Employee name is required';
        if (!formData.employee.phone) newErrors.employeePhone = 'Phone number is required';
        if (!formData.monthKey) newErrors.monthKey = 'Month is required';
        break;
      case 2:
        if (formData.attendance.wfo < 0) newErrors.wfo = 'WFO days cannot be negative';
        if (formData.attendance.wfh < 0) newErrors.wfh = 'WFH days cannot be negative';
        if (formData.tasks.count < 0) newErrors.taskCount = 'Task count cannot be negative';
        break;
      case 3:
        if (formData.clients.length === 0) newErrors.clients = 'At least one client is required';
        break;
      case 4:
        if (formData.learning.length === 0) newErrors.learning = 'At least one learning activity is required';
        break;
      case 5:
        if (!formData.feedback.company.trim()) newErrors.companyFeedback = 'Company feedback is required';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (isDraft = false) => {
    if (!isDraft && !validateStep(5)) {
      notify('Please fix validation errors before submitting', 'error');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const submissionData = {
        employee_name: formData.employee.name,
        employee_phone: formData.employee.phone,
        month_key: formData.monthKey,
        department: formData.employee.department,
        role: formData.employee.role,
        attendance: formData.attendance,
        tasks_completed: formData.tasks.count,
        ai_table_link: formData.tasks.aiTableLink,
        ai_table_screenshot: formData.tasks.aiTableScreenshot,
        clients: formData.clients,
        learning: formData.learning,
        ai_usage_notes: formData.aiUsageNotes,
        feedback: formData.feedback,
        is_draft: isDraft,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      let result;
      if (existingSubmission) {
        // Update existing submission
        result = await supabase
          .from('submissions')
          .update(submissionData)
          .eq('id', existingSubmission.id)
          .select()
          .single();
      } else {
        // Create new submission
        result = await supabase
          .from('submissions')
          .insert([submissionData])
          .select()
          .single();
      }
      
      if (result.error) {
        throw result.error;
      }
      
      const message = isDraft 
        ? 'Draft saved successfully!' 
        : existingSubmission 
          ? 'Tactical form updated successfully!' 
          : 'Tactical form submitted successfully!';
      
      notify(message, 'success');
      
      if (!isDraft && onBack) {
        setTimeout(() => onBack(), 1500);
      }
      
    } catch (error) {
      console.error('Submission error:', error);
      notify('Failed to save form. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [formData, existingSubmission, supabase, notify, onBack, validateStep]);
  
  // Handle field changes
  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);
  
  // Handle nested field changes
  const handleNestedFieldChange = useCallback((parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  }, []);
  
  // Navigation handlers
  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  }, [currentStep, validateStep]);
  
  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);
  
  const goToStep = useCallback((step) => {
    setCurrentStep(step);
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tactical form...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Monthly Tactical Form</h1>
              <p className="text-blue-100 mt-1">
                {monthLabel(formData.monthKey)} - Step {currentStep} of {STEPS.length}
              </p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg transition-colors"
              >
                ← Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(step.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    currentStep === step.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : currentStep > step.id
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-lg">{step.icon}</span>
                  <span className="text-sm font-medium hidden sm:block">{step.title}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-green-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Step 1: Employee & Month */}
          {currentStep === 1 && (
            <Section title="Employee Information & Reporting Period">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EmployeeDropdown
                  value={formData.employee}
                  onChange={(employee) => handleFieldChange('employee', employee)}
                  error={errors.employeeName || errors.employeePhone}
                  required
                />
                <TextField
                  label="Reporting Month"
                  value={monthLabel(formData.monthKey)}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </Section>
          )}
          
          {/* Step 2: Attendance & Tasks */}
          {currentStep === 2 && (
            <Section title="Attendance & Task Completion">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Work Attendance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <NumField
                      label="Work From Office (Days)"
                      value={formData.attendance.wfo}
                      onChange={(value) => handleNestedFieldChange('attendance', 'wfo', value)}
                      min={0}
                      max={31}
                      error={errors.wfo}
                    />
                    <NumField
                      label="Work From Home (Days)"
                      value={formData.attendance.wfh}
                      onChange={(value) => handleNestedFieldChange('attendance', 'wfh', value)}
                      min={0}
                      max={31}
                      error={errors.wfh}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Total: {formData.attendance.wfo + formData.attendance.wfh} days
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Task Management</h3>
                  <NumField
                    label="Tasks Completed"
                    value={formData.tasks.count}
                    onChange={(value) => handleNestedFieldChange('tasks', 'count', value)}
                    min={0}
                    error={errors.taskCount}
                  />
                  <TextField
                    label="AI Table Link (Optional)"
                    value={formData.tasks.aiTableLink}
                    onChange={(value) => handleNestedFieldChange('tasks', 'aiTableLink', value)}
                    placeholder="https://..."
                    className="mt-4"
                  />
                </div>
              </div>
            </Section>
          )}
          
          {/* Step 3: Clients & KPIs */}
          {currentStep === 3 && (
            <Section title="Client Work & KPIs">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Client Projects</h3>
                  <ClientDropdown
                    value={formData.clients}
                    onChange={(clients) => handleFieldChange('clients', clients)}
                    error={errors.clients}
                    multiple
                    required
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Select all clients you worked with this month
                  </p>
                </div>
              </div>
            </Section>
          )}
          
          {/* Step 4: Learning & AI */}
          {currentStep === 4 && (
            <Section title="Learning & AI Usage">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Learning Activities</h3>
                  <TextArea
                    label="Learning Activities (Minimum 6 hours)"
                    value={formData.learning.map(l => l.activity || l).join('\n')}
                    onChange={(value) => {
                      const activities = value.split('\n').filter(a => a.trim()).map(activity => ({ activity: activity.trim() }));
                      handleFieldChange('learning', activities);
                    }}
                    placeholder="Enter each learning activity on a new line...\ne.g., React Advanced Patterns - 3 hours\nNode.js Performance Optimization - 4 hours"
                    rows={6}
                    error={errors.learning}
                    required
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">AI Tool Usage</h3>
                  <TextArea
                    label="AI Usage Notes"
                    value={formData.aiUsageNotes}
                    onChange={(value) => handleFieldChange('aiUsageNotes', value)}
                    placeholder="Describe how you used AI tools this month (ChatGPT, Claude, GitHub Copilot, etc.)..."
                    rows={4}
                  />
                </div>
              </div>
            </Section>
          )}
          
          {/* Step 5: Feedback & Submit */}
          {currentStep === 5 && (
            <Section title="Feedback & Final Review">
              <div className="space-y-6">
                <TextArea
                  label="Company Feedback"
                  value={formData.feedback.company}
                  onChange={(value) => handleNestedFieldChange('feedback', 'company', value)}
                  placeholder="Share your feedback about the company, processes, or suggestions for improvement..."
                  rows={4}
                  error={errors.companyFeedback}
                  required
                />
                
                <TextArea
                  label="HR Feedback (Optional)"
                  value={formData.feedback.hr}
                  onChange={(value) => handleNestedFieldChange('feedback', 'hr', value)}
                  placeholder="Any feedback specifically for HR department..."
                  rows={3}
                />
                
                <TextArea
                  label="Management Feedback (Optional)"
                  value={formData.feedback.management}
                  onChange={(value) => handleNestedFieldChange('feedback', 'management', value)}
                  placeholder="Any feedback for management or leadership..."
                  rows={3}
                />
                
                {/* Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Submission Summary</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Employee: {formData.employee.name}</p>
                    <p>Month: {monthLabel(formData.monthKey)}</p>
                    <p>Total Attendance: {formData.attendance.wfo + formData.attendance.wfh} days</p>
                    <p>Tasks Completed: {formData.tasks.count}</p>
                    <p>Clients: {formData.clients.length}</p>
                    <p>Learning Activities: {formData.learning.length}</p>
                  </div>
                </div>
              </div>
            </Section>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            
            <div className="flex gap-3">
              {currentStep === STEPS.length ? (
                <>
                  <button
                    onClick={() => handleSubmit(true)}
                    disabled={isSaving}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? 'Submitting...' : 'Submit Form'}
                  </button>
                </>
              ) : (
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TacticalForm;