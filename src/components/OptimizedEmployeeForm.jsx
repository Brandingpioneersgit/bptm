import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSupabase } from "./SupabaseProvider";
import { useToast } from "@/shared/components/Toast";
import { useModal } from "@/shared/components/ModalContext";
import { useFetchSubmissions } from "./useFetchSubmissions";
import { useDataSync } from "./DataSyncContext";
import { EMPTY_SUBMISSION, thisMonthKey, prevMonthKey, monthLabel, DEPARTMENTS, ROLES_BY_DEPT, daysInMonth } from "@/shared/lib/constants";
import { scoreKPIs, scoreLearning, scoreRelationshipFromClients, overallOutOf10, generateSummary, computeDisciplinePenalty } from "@/shared/lib/scoring";
import { CelebrationEffect } from "./CelebrationEffect";
import { Section, ProgressIndicator, StepValidationIndicator, ThreeWayComparativeField } from "@/shared/components/ui";
import { DeptClientsBlock } from "./kpi";
import { LearningBlock } from "./LearningBlock";
import { getClientRepository } from "@/shared/services/ClientRepository";
import { validateSubmission } from "@/shared/lib/validation";
import { DraftResumePrompt, CrashRecoveryPrompt } from "./DraftResumePrompt";
import { ensureClientsTableExists } from "../utils/createClientsTable";

// Optimized input components with cursor position preservation
const OptimizedTextField = React.memo(function OptimizedTextField({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  className, 
  disabled = false, 
  error, 
  warning 
}) {
  const inputRef = useRef(null);
  const [localValue, setLocalValue] = useState(value || '');
  const [cursorPosition, setCursorPosition] = useState(null);
  const debounceRef = useRef(null);
  
  // Sync external value changes
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value || '');
    }
  }, [value]);
  
  // Restore cursor position after re-render
  useEffect(() => {
    if (cursorPosition !== null && inputRef.current) {
      inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      setCursorPosition(null);
    }
  });
  
  const handleChange = useCallback((e) => {
    if (disabled) return;
    
    const newValue = e.target.value;
    const cursor = e.target.selectionStart;
    
    // Update local state immediately for responsive UI
    setLocalValue(newValue);
    setCursorPosition(cursor);
    
    // Debounce external onChange to prevent excessive re-renders
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, 150); // 150ms debounce for smooth typing
  }, [onChange, disabled]);
  
  const hasError = !!error;
  const hasWarning = !!warning && !hasError;
  
  return (
    <div className={className || ''}>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
        {label}
        {hasError && <span className="ml-2 text-red-500 text-xs">⚠️ Required</span>}
        {hasWarning && <span className="ml-2 text-yellow-500 text-xs">⚠️ Warning</span>}
      </label>
      <input
        ref={inputRef}
        className={`w-full border rounded-xl p-3 text-base focus:ring-2 transition-colors duration-200 touch-manipulation ${
          hasError ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50' : 
          hasWarning ? 'border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500 bg-yellow-50' : 
          'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
        } ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
        placeholder={placeholder || ""}
        value={localValue}
        onChange={handleChange}
        disabled={disabled}
        autoComplete="off"
      />
      {hasError && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {hasWarning && <p className="mt-1 text-sm text-yellow-600">{warning}</p>}
    </div>
  );
});

const OptimizedTextArea = React.memo(function OptimizedTextArea({ 
  label, 
  value, 
  onChange, 
  rows = 4, 
  className, 
  placeholder, 
  disabled = false 
}) {
  const textareaRef = useRef(null);
  const [localValue, setLocalValue] = useState(value || '');
  const [cursorPosition, setCursorPosition] = useState(null);
  const debounceRef = useRef(null);
  
  // Sync external value changes
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value || '');
    }
  }, [value]);
  
  // Restore cursor position after re-render
  useEffect(() => {
    if (cursorPosition !== null && textareaRef.current) {
      textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      setCursorPosition(null);
    }
  });
  
  const handleChange = useCallback((e) => {
    if (disabled) return;
    
    const newValue = e.target.value;
    const cursor = e.target.selectionStart;
    
    // Update local state immediately for responsive UI
    setLocalValue(newValue);
    setCursorPosition(cursor);
    
    // Debounce external onChange to prevent excessive re-renders
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, 200); // Slightly longer debounce for text areas
  }, [onChange, disabled]);
  
  return (
    <div className={className || ''}>
      <label className="text-sm block mb-2">{label}</label>
      <textarea
        ref={textareaRef}
        className={`w-full border rounded-xl p-3 text-base resize-y touch-manipulation ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
        }`}
        rows={rows}
        placeholder={placeholder || ""}
        value={localValue}
        onChange={handleChange}
        disabled={disabled}
        autoComplete="off"
      />
    </div>
  );
});

// Optimized auto-save hook with better debouncing
function useOptimizedAutoSave(data, key, enabled = true) {
  const saveTimeoutRef = useRef(null);
  const lastSavedRef = useRef(null);
  
  const saveToStorage = useCallback((dataToSave) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        ...dataToSave,
        lastSaved: Date.now()
      }));
      lastSavedRef.current = JSON.stringify(dataToSave);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [key]);
  
  useEffect(() => {
    if (!enabled || !data) return;
    
    const currentDataString = JSON.stringify(data);
    if (currentDataString === lastSavedRef.current) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout with longer debounce for better performance
    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(data);
    }, 1000); // 1 second debounce
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, enabled, saveToStorage]);
  
  // Save immediately on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        if (data) {
          saveToStorage(data);
        }
      }
    };
  }, [data, saveToStorage]);
}

export function OptimizedEmployeeForm({ currentUser = null, isManagerEdit = false, onBack = null }) {
  const supabase = useSupabase();
  const { notify } = useToast();
  const { openModal, closeModal } = useModal();
  const { allSubmissions, refreshSubmissions } = useFetchSubmissions();
  const { clients, fetchClients } = useDataSync();
  
  // Form state
  const [currentSubmission, setCurrentSubmission] = useState(EMPTY_SUBMISSION);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Auto-save configuration
  const autoSaveKey = useMemo(() => {
    if (!currentSubmission.employee?.phone || !currentSubmission.monthKey) return null;
    return `employee_form_${currentSubmission.employee.phone}_${currentSubmission.monthKey}`;
  }, [currentSubmission.employee?.phone, currentSubmission.monthKey]);
  
  // Enable auto-save with optimized debouncing
  useOptimizedAutoSave(currentSubmission, autoSaveKey, !!autoSaveKey && hasUnsavedChanges);
  
  // Optimized form update function
  const updateFormField = useCallback((path, value) => {
    setCurrentSubmission(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current = updated;
      
      // Navigate to the parent object
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      // Set the final value
      current[keys[keys.length - 1]] = value;
      
      return updated;
    });
    
    setHasUnsavedChanges(true);
  }, []);
  
  // Stable handlers for form fields
  const handleNameChange = useCallback((value) => updateFormField('employee.name', value), [updateFormField]);
  const handlePhoneChange = useCallback((value) => {
    const cleanPhone = value.replace(/\D/g, '').slice(0, 10);
    updateFormField('employee.phone', cleanPhone);
  }, [updateFormField]);
  const handleDepartmentChange = useCallback((value) => updateFormField('employee.department', value), [updateFormField]);
  const handleRoleChange = useCallback((value) => updateFormField('employee.role', value), [updateFormField]);
  
  // Initialize form data
  useEffect(() => {
    if (currentUser) {
      setCurrentSubmission(prev => ({
        ...prev,
        employee: {
          ...prev.employee,
          name: currentUser.name || '',
          phone: currentUser.phone || '',
          department: currentUser.department || '',
          role: currentUser.role || ''
        },
        monthKey: thisMonthKey()
      }));
    }
  }, [currentUser]);
  
  // Load saved draft
  useEffect(() => {
    if (autoSaveKey) {
      try {
        const saved = localStorage.getItem(autoSaveKey);
        if (saved) {
          const parsedData = JSON.parse(saved);
          setCurrentSubmission(parsedData);
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('Failed to load saved draft:', error);
      }
    }
  }, [autoSaveKey]);
  
  // Fix clients table issue by ensuring it exists
  useEffect(() => {
    const initializeClients = async () => {
      if (!supabase) return;
      
      try {
        const tableExists = await ensureClientsTableExists(supabase);
        if (tableExists) {
          fetchClients(true); // Refresh clients after ensuring table exists
        }
      } catch (error) {
        console.error('Error initializing clients table:', error);
      }
    };
    
    initializeClients();
  }, [supabase, fetchClients]);
  
  // Form validation
  const validation = useMemo(() => {
    return validateSubmission(currentSubmission);
  }, [currentSubmission]);
  
  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validation.isValid) {
      notify({ type: 'error', title: 'Validation Failed', message: 'Please fix all errors before submitting.' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (supabase) {
        const { error } = await supabase
          .from('submissions')
          .insert([{
            month_key: currentSubmission.monthKey,
            employee_email: currentSubmission.employee.email || `${currentSubmission.employee.phone}@company.com`,
            employee_name: currentSubmission.employee.name,
            department: currentSubmission.employee.department,
            role: currentSubmission.employee.role,
            payload: currentSubmission,
            scores: validation.scores,
            flags: validation.flags
          }]);
          
        if (error) throw error;
      }
      
      // Clear auto-save data
      if (autoSaveKey) {
        localStorage.removeItem(autoSaveKey);
      }
      
      setHasUnsavedChanges(false);
      setShowCelebration(true);
      
      notify({ type: 'success', title: 'Submitted!', message: 'Your form has been submitted successfully.' });
      
      // Refresh submissions
      refreshSubmissions();
      
    } catch (error) {
      console.error('Submission error:', error);
      notify({ type: 'error', title: 'Submission Failed', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }, [currentSubmission, validation, supabase, autoSaveKey, notify, refreshSubmissions]);
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {showCelebration && <CelebrationEffect onComplete={() => setShowCelebration(false)} />}
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Employee Performance Form</h1>
        
        {/* Step 1: Employee Information */}
        <Section title="Employee Information" number={1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <OptimizedTextField
              label="Full Name"
              value={currentSubmission.employee.name}
              onChange={handleNameChange}
              placeholder="Enter your full name"
              error={validation.errors.find(e => e.field === 'employee.name')?.message}
            />
            
            <OptimizedTextField
              label="Phone Number"
              value={currentSubmission.employee.phone}
              onChange={handlePhoneChange}
              placeholder="10-digit phone number"
              error={validation.errors.find(e => e.field === 'employee.phone')?.message}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                className="w-full border rounded-xl p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={currentSubmission.employee.department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                className="w-full border rounded-xl p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={currentSubmission.employee.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                disabled={!currentSubmission.employee.department}
              >
                <option value="">Select Role</option>
                {(ROLES_BY_DEPT[currentSubmission.employee.department] || []).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
        </Section>
        
        {/* Step 2: KPIs and Clients */}
        <Section title="KPIs and Client Work" number={2}>
          <DeptClientsBlock
            currentSubmission={currentSubmission}
            setModel={setCurrentSubmission}
            monthPrev={prevMonthKey()}
            monthThis={thisMonthKey()}
            openModal={openModal}
            closeModal={closeModal}
          />
        </Section>
        
        {/* Step 3: Learning */}
        <Section title="Learning and Development" number={3}>
          <LearningBlock
            currentSubmission={currentSubmission}
            setModel={setCurrentSubmission}
          />
        </Section>
        
        {/* Validation Summary */}
        {validation.errors.length > 0 && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-medium mb-2">Please fix the following errors:</h3>
            <ul className="text-red-700 text-sm space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index}>• {error.message}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Submit Button */}
        <div className="mt-8 flex justify-between items-center">
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          )}
          
          <div className="flex items-center space-x-4">
            {hasUnsavedChanges && (
              <span className="text-sm text-yellow-600">Unsaved changes</span>
            )}
            
            <button
              onClick={handleSubmit}
              disabled={!validation.isValid || isSubmitting}
              className={`px-8 py-3 rounded-lg font-medium ${
                validation.isValid && !isSubmitting
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}