import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSupabase } from "./SupabaseProvider";
import { useToast } from "@/shared/components/Toast";
import { useModal } from "@/shared/components/ModalContext";
import { useFetchSubmissions } from "./useFetchSubmissions";
import { useDataSync } from "./DataSyncContext";
import { useEnhancedErrorHandling } from "@/shared/hooks/useEnhancedErrorHandling";
import { useAppNavigation } from '@/utils/navigation';
import { useStandardizedFeedback, FEEDBACK_MESSAGES } from '@/shared/utils/feedbackUtils';
import { EMPTY_SUBMISSION, thisMonthKey, prevMonthKey, monthLabel, DEPARTMENTS, ROLES_BY_DEPT, daysInMonth, workingDaysInMonth, getWorkingDaysInfo } from "@/shared/lib/constants";
import { scoreKPIs, scoreLearning, scoreRelationshipFromClients, overallOutOf10, generateSummary, computeDisciplinePenalty } from "@/shared/lib/scoring";

import { Section, TextField, NumField, TextArea, MultiSelect, ProgressIndicator, StepValidationIndicator, ThreeWayComparativeField } from "@/shared/components/ui";
import DeptClientsBlock from "./DeptClientsBlock";
import { LearningBlock } from "./LearningBlock";
import { getClientRepository } from "@/features/clients/services/ClientRepository";
import { validateSubmission, validateField, validateStep } from "@/shared/lib/validation";
import { unifiedValidator } from "@/shared/utils/unifiedValidation.js";
import { dataPersistence, useDraftPersistence } from "@/shared/services/DataPersistence";
import { DraftResumePrompt, CrashRecoveryPrompt } from "./DraftResumePrompt";

export function EmployeeForm({ currentUser = null, isManagerEdit = false, onBack = null }) {
  const DEBUG = false;
  const dlog = (...args) => { if (DEBUG) console.log(...args); };
  const supabase = useSupabase();
  const navigation = useAppNavigation();
  const { openModal, closeModal } = useModal();
  const { notify } = useToast();
  const feedback = useStandardizedFeedback();
  const { allSubmissions } = useFetchSubmissions();
  
  // Enhanced error handling
  const {
    loading: errorHandlingLoading,
    handleAsyncOperation,
    handleDataFetch,
    handleFormSubmission,
    handleDatabaseOperation,
    showSuccess,
    showError,
    showWarning,
    showInfo
  } = useEnhancedErrorHandling();
  
  const { addSubmission, updateSubmission, addClient, refreshAllData } = useDataSync();

  const [currentSubmission, setCurrentSubmission] = useState({ ...EMPTY_SUBMISSION, isDraft: true });
  const [previousSubmission, setPreviousSubmission] = useState(null);
  const [comparisonSubmission, setComparisonSubmission] = useState(null); // Month before the previous month
  const [selectedEmployee, setSelectedEmployee] = useState(currentUser);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Enhanced persistence state
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [showCrashRecovery, setShowCrashRecovery] = useState(false);
  const [pendingDrafts, setPendingDrafts] = useState([]);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const draftPersistence = useDraftPersistence({
    name: selectedEmployee?.name,
    phone: selectedEmployee?.phone,
    monthKey: currentSubmission?.monthKey,
    model: currentSubmission,
    onRestore: (data) => {
      if (data) {
        setCurrentSubmission(data);
        feedback.showInfo(FEEDBACK_MESSAGES.DRAFT_LOAD_SUCCESS);
      }
    }
  });
  
  const FORM_STEPS = [
    { id: 1, title: "Profile & Month", icon: "👤", description: "Basic information and reporting period" },
    { id: 2, title: "Attendance & Tasks", icon: "📅", description: "Work attendance and task completion" },
    { id: 3, title: "KPI & Clients", icon: "📊", description: "Department metrics, client work and achievements" },
    { id: 4, title: "Learning & AI", icon: "🎓", description: "Learning activities and AI usage" },
    { id: 5, title: "Feedback & Review", icon: "💬", description: "Company feedback and final review" },
  ];

  const getAutoSaveKey = useCallback(() => {
    // Stabilize key during typing: only switch once inputs are complete
    const rawName = currentSubmission.employee?.name?.trim() || '';
    const rawPhone = currentSubmission.employee?.phone?.trim() || '';

    const stableName = selectedEmployee?.name || (rawName.length >= 2 ? rawName : 'anonymous');
    // FIXED: Use consistent phone key to prevent reset issues
    // Keep using 'new' until we have a complete 10-digit phone, but maintain consistency
    const stablePhone = selectedEmployee?.phone || (/^\d{10}$/.test(rawPhone) ? rawPhone : 'new');
    const monthKey = currentSubmission.monthKey || thisMonthKey();

    const employeeId = `${stableName}-${stablePhone}`;
    const key = `autosave-${employeeId}-${monthKey}`;

    return key;
  }, [selectedEmployee, currentSubmission.employee?.name, currentSubmission.employee?.phone, currentSubmission.monthKey]);

  // Helper function to get all possible auto-save keys for migration
  const getAllPossibleKeys = useCallback(() => {
    const rawName = currentSubmission.employee?.name?.trim() || '';
    const rawPhone = currentSubmission.employee?.phone?.trim() || '';
    const monthKey = currentSubmission.monthKey || thisMonthKey();
    
    const keys = [];
    
    // Current key
    keys.push(getAutoSaveKey());
    
    // Key with 'new' phone (for migration from incomplete phone)
    if (rawPhone && rawPhone !== 'new') {
      const nameForKey = selectedEmployee?.name || (rawName.length >= 2 ? rawName : 'anonymous');
      keys.push(`autosave-${nameForKey}-new-${monthKey}`);
    }
    
    // Key with partial phone numbers (for migration)
    if (rawPhone && rawPhone.length > 0 && rawPhone.length < 10) {
      const nameForKey = selectedEmployee?.name || (rawName.length >= 2 ? rawName : 'anonymous');
      keys.push(`autosave-${nameForKey}-new-${monthKey}`);
    }
    
    return [...new Set(keys)]; // Remove duplicates
  }, [getAutoSaveKey, currentSubmission.employee?.name, currentSubmission.employee?.phone, currentSubmission.monthKey, selectedEmployee]);

  const uniqueEmployees = useMemo(() => {
    const employees = {};
    allSubmissions.forEach(s => {
      const key = `${s.employee.name}-${s.employee.phone}`;
      employees[key] = { name: s.employee.name, phone: s.employee.phone };
    });
    return Object.values(employees).sort((a, b) => a.name.localeCompare(b.name));
  }, [allSubmissions]);

  const isSubmissionFinalized = useMemo(() => {
    if (!selectedEmployee || !currentSubmission.monthKey) return false;
    
    const existingSubmission = allSubmissions.find(s => 
      s.employee?.name === selectedEmployee.name && 
      s.employee?.phone === selectedEmployee.phone && 
      s.monthKey === currentSubmission.monthKey &&
      s.isDraft === false
    );
    
    return !!existingSubmission;
  }, [selectedEmployee, currentSubmission.monthKey, allSubmissions]);

  const isPreviousMonth = useMemo(() => {
    const currentMonth = thisMonthKey();
    const selectedMonth = currentSubmission.monthKey;
    
    // Check if the selected month is a valid month format
    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) {
      return false; // Invalid format, not a previous month issue
    }
    
    // Parse the month to check if it's valid
    const [year, month] = selectedMonth.split('-').map(Number);
    if (month < 1 || month > 12 || year < 2020 || year > 2030) {
      return false; // Invalid month values, not a previous month issue
    }
    
    // For comparative reporting, allow current month and immediate previous month
    // Only block if it's more than 2 months old
    const monthsAgo = (new Date(currentMonth) - new Date(selectedMonth)) / (1000 * 60 * 60 * 24 * 30);
    return monthsAgo > 2;
  }, [currentSubmission.monthKey]);

  if (currentUser && isSubmissionFinalized && currentSubmission.monthKey === thisMonthKey() && !isManagerEdit) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
            ✓
          </div>
          <h2 className="text-xl font-bold text-green-800 mb-2">Monthly Report Already Submitted!</h2>
          <p className="text-green-700 mb-4">
            You have already submitted your report for {monthLabel(currentSubmission.monthKey)}. 
            Your submission is complete and locked.
          </p>
          <p className="text-green-600 text-sm mb-6">
            Only managers can edit submitted reports. Check your dashboard to view your performance and manager feedback.
          </p>
          <button
            onClick={() => {
              navigation.navigateToDashboard();
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View My Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Initialize form with currentUser data when component mounts
  useEffect(() => {
    if (currentUser && !currentSubmission.employee?.name) {
      setCurrentSubmission(prev => ({
        ...prev,
        employee: {
          name: currentUser.name || '',
          phone: currentUser.phone || '',
          department: currentUser.department || 'Web',
          role: currentUser.role || []
        },
        monthKey: prev.monthKey || prevMonthKey(thisMonthKey()),
        // Ensure meta structure is properly initialized
        meta: {
          attendance: { wfo: 0, wfh: 0 },
          tasks: { count: 0, aiTableLink: "", aiTableScreenshot: "" }
        }
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (!selectedEmployee) {
      setPreviousSubmission(null);
      setComparisonSubmission(null);
      // Don't reset the entire submission - preserve any entered data
      setCurrentSubmission(prev => ({
        ...prev,
        employee: { ...prev.employee, name: "", phone: "" }
      }));
      return;
    }

    // Get submissions for this employee, sorted by month (newest first)
    const employeeSubmissions = allSubmissions
      .filter(s => s.employee.phone === selectedEmployee.phone)
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    
    // Set previous submission (most recent)
    const prevSub = employeeSubmissions[0] || null;
    setPreviousSubmission(prevSub);
    
    // Set comparison submission (second most recent, for month-over-month comparison)
    const comparisonSub = employeeSubmissions[1] || null;
    setComparisonSubmission(comparisonSub);
    
    console.log('📊 Comparative data loaded:', {
      current: currentSubmission.monthKey,
      previous: prevSub?.monthKey || 'None',
      comparison: comparisonSub?.monthKey || 'None',
      totalSubmissions: employeeSubmissions.length
    });

    // CRITICAL FIX: Only update employee info, preserve all other form data
    setCurrentSubmission(prev => {
      // If this is the first time selecting an employee and form is empty, populate defaults
      const isFormEmpty = !prev.employee?.name && !prev.employee?.phone;
      
      if (isFormEmpty) {
        return {
          ...EMPTY_SUBMISSION,
          employee: { 
            name: selectedEmployee.name, 
            phone: selectedEmployee.phone, 
            department: prevSub?.employee?.department || "Web", 
            role: prevSub?.employee?.role || [] 
          },
          monthKey: prevMonthKey(thisMonthKey()),
        };
      } else {
        // Preserve existing form data, just update employee info if needed
        return {
          ...prev,
          employee: {
            ...prev.employee,
            name: prev.employee.name || selectedEmployee.name,
            phone: prev.employee.phone || selectedEmployee.phone,
            department: prev.employee.department || prevSub?.employee?.department || "Web",
            role: prev.employee.role?.length ? prev.employee.role : (prevSub?.employee?.role || [])
          }
        };
      }
    });
  }, [selectedEmployee, allSubmissions]);


  const autoSave = useCallback(async () => {
    if (!autoSaveEnabled) {
      console.log('💾 Auto-save disabled');
      return;
    }

    // Check if there's meaningful data to save
    const hasEmployeeData = currentSubmission.employee?.name || currentSubmission.employee?.phone;
    const hasFormData = currentSubmission.monthKey || hasEmployeeData;
    
    if (!hasFormData) {
      console.log('💾 Skipping auto-save: no meaningful data to save');
      return;
    }
    
    try {
      const employeeName = currentSubmission.employee?.name || selectedEmployee?.name;
      const employeePhone = currentSubmission.employee?.phone || selectedEmployee?.phone;
      const monthKey = currentSubmission.monthKey || thisMonthKey();
      
      if (!employeeName || !employeePhone || !monthKey) {
        console.log('💾 Skipping auto-save: missing required identifiers');
        return;
      }
      
      const draftData = {
        ...currentSubmission,
        name: employeeName,
        phone: employeePhone,
        monthKey: monthKey,
        currentStep: currentStep,
        sessionInfo: {
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          url: window.location.href
        }
      };
      
      dlog('💾 Auto-saving with enhanced persistence:', {
        name: employeeName,
        phone: employeePhone,
        monthKey: monthKey,
        step: currentStep,
        fieldCount: dataPersistence.countFormFields ? dataPersistence.countFormFields(draftData) : 0
      });
      
      // Use the new persistence service
      const success = draftPersistence.saveDraft(draftData, {
        forceImmediate: hasUnsavedChanges && currentStep > 1
      });
      
      if (success) {
        setLastAutoSave(new Date());
        setHasUnsavedChanges(false);
        dlog('✅ Enhanced auto-save successful');
        feedback.showInfo(FEEDBACK_MESSAGES.DRAFT_SAVE_SUCCESS, { duration: 2000 });
      } else {
        throw new Error('Enhanced auto-save returned false');
      }
      
    } catch (error) {
      console.error('❌ Enhanced auto-save failed:', error);
      feedback.showError(FEEDBACK_MESSAGES.DRAFT_SAVE_ERROR);
      // Fallback to legacy localStorage save
      try {
        const legacyKey = getAutoSaveKey();
        const legacyData = {
          ...currentSubmission,
          lastSaved: new Date().toISOString(),
          currentStep: currentStep
        };
        localStorage.setItem(legacyKey, JSON.stringify(legacyData));
        console.log('💾 Fallback save successful');
      } catch (fallbackError) {
        console.error('❌ Fallback save also failed:', fallbackError);
      }
    }
  }, [currentSubmission, currentStep, selectedEmployee, autoSaveEnabled, hasUnsavedChanges, getAutoSaveKey, draftPersistence]);

  // Keep a ref to the latest autoSave function for stable callbacks
  const autoSaveRef = useRef(autoSave);
  useEffect(() => {
    autoSaveRef.current = autoSave;
  }, [autoSave]);

  const loadDraft = useCallback(() => {
    try {
      // Try all possible keys for migration
      const possibleKeys = getAllPossibleKeys();
      let foundDraft = null;
      let usedKey = null;
      
      for (const key of possibleKeys) {
        const savedData = localStorage.getItem(key);
        if (savedData) {
          try {
            const draft = JSON.parse(savedData);
            
            // Validate the draft data
            if (!draft.employee && !draft.monthKey) {
              console.log('📄 Draft found but appears empty, skipping:', key);
              continue;
            }
            
            // Only use draft if it has meaningful data
            const hasEmployeeData = draft.employee?.name || draft.employee?.phone;
            if (hasEmployeeData || draft.monthKey) {
              foundDraft = draft;
              usedKey = key;
              break;
            }
          } catch (parseError) {
            console.warn('📄 Failed to parse draft from key:', key, parseError);
            continue;
          }
        }
      }
      
      if (foundDraft && usedKey) {
        console.log('📄 Loading draft:', {
          key: usedKey,
          employee: foundDraft.employee,
          step: foundDraft.currentStep,
          hasName: !!foundDraft.employee?.name,
          hasPhone: !!foundDraft.employee?.phone,
          monthKey: foundDraft.monthKey,
          lastSaved: foundDraft.lastSaved
        });
        
        setCurrentSubmission(foundDraft);
        setCurrentStep(foundDraft.currentStep || 1);
        if (foundDraft.lastSaved) {
          setLastAutoSave(new Date(foundDraft.lastSaved));
        }
        setHasUnsavedChanges(false); // Draft is considered saved
        
        // Migrate draft to current key if different
        const currentKey = getAutoSaveKey();
        if (usedKey !== currentKey) {
          console.log('📄 Migrating draft from', usedKey, 'to', currentKey);
          try {
            localStorage.setItem(currentKey, JSON.stringify({
              ...foundDraft,
              lastSaved: new Date().toISOString(),
              migrated: true
            }));
            // Clean up old key
            localStorage.removeItem(usedKey);
          } catch (migrationError) {
            console.warn('📄 Draft migration failed:', migrationError);
          }
        }
        
        return true;
      }
      
      console.log('📄 No valid draft found in any of the keys:', possibleKeys);
    } catch (error) {
      console.error('❌ Failed to load draft:', error);
    }
    return false;
  }, [getAllPossibleKeys, getAutoSaveKey]);

  const clearDraft = useCallback(() => {
    try {
      const key = getAutoSaveKey();
      localStorage.removeItem(key);
      dlog('🗑️ Cleared draft for key:', key);
      setLastAutoSave(null);
      setHasUnsavedChanges(false);
    } catch (error) {
      if (DEBUG) console.error('Failed to clear draft:', error);
    }
  }, [getAutoSaveKey]);
  
  // Debug function to check localStorage status
  const debugAutoSave = useCallback(() => {
    const key = getAutoSaveKey();
    const savedData = localStorage.getItem(key);
    dlog('🔍 Auto-save debug:', {
      key,
      hasSavedData: !!savedData,
      savedDataSize: savedData ? savedData.length : 0,
      lastAutoSave,
      hasUnsavedChanges,
      currentSubmissionEmployee: currentSubmission.employee
    });
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        dlog('📋 Saved data preview:', {
          employee: parsed.employee,
          monthKey: parsed.monthKey,
          lastSaved: parsed.lastSaved,
          currentStep: parsed.currentStep
        });
      } catch (e) {
        if (DEBUG) console.error('❌ Failed to parse saved data:', e);
      }
    }
  }, [getAutoSaveKey, lastAutoSave, hasUnsavedChanges, currentSubmission.employee]);

  const updateCurrentSubmission = useCallback((key, value) => {
    dlog(`📝 Updating form field: ${key} =`, value);
    if (process.env.NODE_ENV === 'development') {
      console.log('💾 updateCurrentSubmission:', { key, value, type: typeof value });
    }
    
    // 🚨 CRITICAL DEBUG: Check for multiplication issue in updateCurrentSubmission
    if (key === 'meta.attendance.wfo' && value === 30 && typeof value === 'number') {
      console.error('🚨🚨🚨 MULTIPLICATION BUG in updateCurrentSubmission! Received value 30 for WFO!');
      console.error('This should probably be 3 instead of 30');
      console.trace('Stack trace for multiplication bug in updateCurrentSubmission');
      debugger; // This will pause execution in browser DevTools
    }
    
    setCurrentSubmission(prev => {
      const updated = { ...prev };
      let current = updated;
      const keyParts = key.split('.');
      for (let i = 0; i < keyParts.length - 1; i++) {
        const part = keyParts[i];
        if (!current[part]) current[part] = {};
        current = current[part];
      }
      current[keyParts[keyParts.length - 1]] = value;
      
      console.log('💾 Updated state:', { 
        key, 
        finalValue: current[keyParts[keyParts.length - 1]], 
        finalType: typeof current[keyParts[keyParts.length - 1]],
        attendanceState: updated.meta?.attendance 
      });
      
      dlog(`📋 Form state after ${key} update:`, updated.employee);
      return updated;
    });

    setHasUnsavedChanges(true);
    
    // Simplified auto-save logic - let the main auto-save effect handle timing
    // This reduces the number of timeouts and improves performance
    dlog(`📝 Field ${key} updated - will auto-save via main effect`);
  }, []);

  // Wrapper for setModel that tracks unsaved changes
  const setModelWithTracking = useCallback((updaterOrValue) => {
    if (typeof updaterOrValue === 'function') {
      setCurrentSubmission(prev => {
        const updated = updaterOrValue(prev);
        setHasUnsavedChanges(true);
        return updated;
      });
    } else {
      setCurrentSubmission(updaterOrValue);
      setHasUnsavedChanges(true);
    }

    // Ensure complex updates are also saved immediately
    // Use requestAnimationFrame to prevent cursor ejection during typing
    requestAnimationFrame(() => {
      setTimeout(() => {
        autoSaveRef.current();
      }, 100);
    });
  }, []);

  // Real-time field validation (moved up to fix hoisting issue)
  const validateFieldRealTime = useCallback((fieldPath, value) => {
    const validation = validateField(fieldPath, value, currentSubmission);
    setFieldValidation(prev => ({
      ...prev,
      [fieldPath]: validation
    }));
    return validation;
  }, [currentSubmission]);

  // Create stable onChange handlers to prevent re-renders
  const handleNameChange = useCallback((value) => {
    updateCurrentSubmission('employee.name', value);
    validateFieldRealTime('employee.name', value);
  }, [updateCurrentSubmission, validateFieldRealTime]);
  
  const handlePhoneChange = useCallback((value) => {
    // Clean phone number input - remove non-digits and limit to 10 digits
    const cleanPhone = value.replace(/\D/g, '').slice(0, 10);
    dlog(`📱 Phone input: "${value}" -> cleaned: "${cleanPhone}"`);
    
    // Force immediate state update to prevent input lag
    updateCurrentSubmission('employee.phone', cleanPhone);
    validateFieldRealTime('employee.phone', cleanPhone);
    
    // Additional validation for registration issues
    if (cleanPhone.length === 10) {
      dlog('✅ Phone number complete (10 digits):', cleanPhone);
    } else if (cleanPhone.length > 0) {
      dlog(`📱 Phone number in progress (${cleanPhone.length}/10):`, cleanPhone);
    }
  }, [updateCurrentSubmission, validateFieldRealTime]);
  
  const handleWFOChange = useCallback((value) => {
    console.log('🏢 WFO Change:', { value, type: typeof value });
    
    // 🚨 CRITICAL DEBUG: Check for multiplication issue in handleWFOChange
    if (value === 30 && typeof value === 'number') {
      console.error('🚨🚨🚨 MULTIPLICATION BUG in handleWFOChange! Received value 30!');
      console.error('Check if this should be 3 instead of 30');
      console.trace('Stack trace for multiplication bug');
      debugger; // This will pause execution in browser DevTools
    }
    
    updateCurrentSubmission('meta.attendance.wfo', value);
    validateFieldRealTime('meta.attendance.wfo', value);
  }, [updateCurrentSubmission, validateFieldRealTime]);
  
  const handleWFHChange = useCallback((value) => {
    console.log('🏠 WFH Change:', { value, type: typeof value });
    updateCurrentSubmission('meta.attendance.wfh', value);
    validateFieldRealTime('meta.attendance.wfh', value);
  }, [updateCurrentSubmission, validateFieldRealTime]);
  
  const handleTasksChange = useCallback((value) => {
    updateCurrentSubmission('meta.tasks.count', value);
    validateFieldRealTime('meta.tasks.count', value);
  }, [updateCurrentSubmission, validateFieldRealTime]);
  const handleAITableLinkChange = useCallback((value) => updateCurrentSubmission('meta.tasks.aiTableLink', value), [updateCurrentSubmission]);
  const handleAITableScreenshotChange = useCallback((value) => updateCurrentSubmission('meta.tasks.aiTableScreenshot', value), [updateCurrentSubmission]);
  const handleCompanyFeedbackChange = useCallback((value) => updateCurrentSubmission('feedback.company', value), [updateCurrentSubmission]);
  const handleHRFeedbackChange = useCallback((value) => updateCurrentSubmission('feedback.hr', value), [updateCurrentSubmission]);
  const handleChallengesChange = useCallback((value) => updateCurrentSubmission('feedback.challenges', value), [updateCurrentSubmission]);
  const handleAIUsageChange = useCallback((value) => updateCurrentSubmission('aiUsageNotes', value), [updateCurrentSubmission]);

  // Use refs to avoid dependency issues in autosave
  const currentSubmissionRef = useRef(currentSubmission);
  const selectedEmployeeRef = useRef(selectedEmployee);
  const currentStepRef = useRef(currentStep);
  
  useEffect(() => {
    currentSubmissionRef.current = currentSubmission;
    selectedEmployeeRef.current = selectedEmployee;
    currentStepRef.current = currentStep;
  });

  // Manual save function for section-based saving
  const saveCurrentSection = useCallback(async () => {
    try {
      // Use the current state instead of refs for more reliability
      const hasData = currentSubmission.employee?.name || currentSubmission.employee?.phone || currentSubmission.monthKey;
      
      if (!hasData) {
        openModal('Nothing to Save', 'Please enter some information before saving.', closeModal);
        return;
      }
      
      console.log('💾 Manual save triggered for section:', FORM_STEPS.find(s => s.id === currentStep)?.title);
      
      await autoSave(); // Use the robust autoSave function
      
      // Show save confirmation
      const sectionTitle = FORM_STEPS.find(s => s.id === currentStep)?.title || `Step ${currentStep}`;
      openModal('Section Saved', `${sectionTitle} data has been saved successfully.`, closeModal);
      
    } catch (error) {
      console.error('❌ Section save failed:', error);
      openModal('Save Error', 'Failed to save section data. Please try again.', closeModal);
    }
  }, [currentSubmission, currentStep, autoSave, openModal, closeModal]);

  // Enhanced validation with field highlighting and progressive validation
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationWarnings, setValidationWarnings] = useState({});
  const [fieldValidation, setFieldValidation] = useState({});
  
  // Real-time field validation (moved above to fix hoisting issue)
  
  // Get step-specific validation results without blocking navigation
  const getStepValidation = useCallback((stepNumber) => {
    // Use new validateStep function for consistent validation
    const stepValidation = validateStep(stepNumber - 1, currentSubmission); // Convert to 0-based index
    
    // Convert to the expected format
    const errors = {};
    const warnings = {};
    
    stepValidation.errors.forEach(error => {
      // Map error messages to field paths for UI display
      if (error.includes('name')) errors['employee.name'] = error;
      else if (error.includes('phone')) errors['employee.phone'] = error;
      else if (error.includes('department')) errors['employee.department'] = error;
      else if (error.includes('role')) errors['employee.role'] = error;
      else if (error.includes('month')) errors['monthKey'] = error;
      else if (error.includes('WFO')) errors['meta.attendance.wfo'] = error;
      else if (error.includes('WFH')) errors['meta.attendance.wfh'] = error;
      else if (error.includes('task')) errors['meta.tasks.count'] = error;
    });
    
    stepValidation.warnings.forEach(warning => {
      // Map warning messages to field paths for UI display
      if (warning.includes('name')) warnings['employee.name'] = warning;
      else if (warning.includes('phone')) warnings['employee.phone'] = warning;
      else if (warning.includes('month')) warnings['monthKey'] = warning;
      else if (warning.includes('attendance')) warnings['meta.attendance'] = warning;
      else if (warning.includes('task')) warnings['meta.tasks.proof'] = warning;
      else if (warning.includes('learning')) warnings['learning.hours'] = warning;
      else if (warning.includes('client')) warnings['clients'] = warning;
    });
    
    return { errors, warnings };
  }, [currentSubmission]);
  
  // Note: Removed canProgressToStep function as navigation is now always allowed

  // Optimized validation with debouncing
  const prevStepRef = useRef(currentStep);
  const validationTimeoutRef = useRef(null);
  
  const debouncedValidation = useCallback(() => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    validationTimeoutRef.current = setTimeout(() => {
      if (selectedEmployee) {
        const validation = getStepValidation(currentStep);
        setFieldErrors(validation.errors);
        setValidationWarnings(validation.warnings);
      }
    }, 500); // Debounce validation updates
  }, [selectedEmployee, currentStep, getStepValidation]);
  
  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      debouncedValidation();
      prevStepRef.current = currentStep;
    }
  }, [currentStep, debouncedValidation]);
  
  // Cleanup validation timeout
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  // Enhanced draft detection and crash recovery
  useEffect(() => {
    // Check for crashed sessions first
    const checkForCrashes = () => {
      try {
        const crashedDrafts = dataPersistence.checkCrashedSessions ? dataPersistence.checkCrashedSessions() : [];
        if (crashedDrafts.length > 0) {
          console.log('🚨 Found crashed drafts:', crashedDrafts);
          setShowCrashRecovery(true);
          setPendingDrafts(crashedDrafts);
        }
      } catch (error) {
        console.error('Error checking for crashes:', error);
      }
    };

    // Check for existing drafts when employee changes
    const checkForExistingDrafts = () => {
      if (!selectedEmployee?.name || !selectedEmployee?.phone) return;

      try {
        const userDrafts = draftPersistence.getUserDrafts(selectedEmployee.name, selectedEmployee.phone);
        if (userDrafts.length > 0) {
          console.log('📄 Found existing drafts for user:', userDrafts);
          setPendingDrafts(userDrafts);
          setShowDraftPrompt(true);
          return true; // Don't load default draft
        }
      } catch (error) {
        console.error('Error checking for existing drafts:', error);
      }
      return false;
    };

    // Run checks on mount and employee change
    if (selectedEmployee) {
      setTimeout(() => {
        checkForCrashes();
        if (!checkForExistingDrafts()) {
          // No drafts found, proceed with normal loading
          console.log('No existing drafts found, proceeding normally');
        }
      }, 500); // Small delay to allow UI to settle
    }
  }, [selectedEmployee, draftPersistence]);

  // Enhanced draft loading - only on initial mount or when meaningful employee change occurs
  const loadedDraftRef = useRef(new Set());
  
  useEffect(() => {
    const autoSaveKey = getAutoSaveKey();

    // Prevent loading the same draft multiple times
    if (loadedDraftRef.current.has(autoSaveKey)) return;

    // Load draft only when we have a stable identity (selected employee
    // or both name and a complete 10-digit phone number)
    const hasStableIdentity = !!selectedEmployee || (
      (currentSubmission.employee?.name?.trim()?.length || 0) >= 2 &&
      /^\d{10}$/.test(currentSubmission.employee?.phone || '')
    );

    if (hasStableIdentity) {
      const hasDraft = loadDraft();
      if (hasDraft) {
        loadedDraftRef.current.add(autoSaveKey);
        setHasUnsavedChanges(false);
      }
    }
  }, [getAutoSaveKey, loadDraft, selectedEmployee, currentSubmission.employee?.name, currentSubmission.employee?.phone]);
  
  // Optimized auto-save with better debouncing
  const autoSaveTimeoutRef = useRef(null);
  
  useEffect(() => {
    if (hasUnsavedChanges) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Set new timeout with longer debounce for better performance
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveRef.current();
        console.log('💾 Auto-saved form data');
      }, 3000); // Increased to 3 seconds to reduce frequency
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges]);
  
  // Save on page unload to prevent data loss
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (selectedEmployee && hasUnsavedChanges) {
        // Synchronous save attempt for page unload
        try {
          const autoSaveKey = getAutoSaveKey();
          const autoSaveData = {
            ...currentSubmission,
            lastSaved: new Date().toISOString(),
            currentStep: currentStep,
            emergencySave: true
          };
          localStorage.setItem(autoSaveKey, JSON.stringify(autoSaveData));
          console.log('💾 Emergency save on page unload');
        } catch (error) {
          console.error('❌ Emergency save failed:', error);
        }
        
        // Show warning if user tries to leave with unsaved changes
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden && selectedEmployee && hasUnsavedChanges) {
        autoSave();
        console.log('💾 Saved on tab switch');
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedEmployee, hasUnsavedChanges, autoSave, getAutoSaveKey, currentSubmission, currentStep]);

  // Debounce score calculations to prevent constant re-renders
  const [debouncedSubmission, setDebouncedSubmission] = useState(currentSubmission);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSubmission(currentSubmission);
    }, 500); // Debounce score calculations by 500ms
    
    return () => clearTimeout(timer);
  }, [currentSubmission]);

  const kpiScore = useMemo(() => scoreKPIs(
    debouncedSubmission.employee,
    debouncedSubmission.clients,
    { monthKey: debouncedSubmission.monthKey }
  ), [debouncedSubmission.employee, debouncedSubmission.clients, debouncedSubmission.monthKey]);
  const learningScore = useMemo(() => scoreLearning(debouncedSubmission.learning), [debouncedSubmission.learning]);
  const relationshipScore = useMemo(() => scoreRelationshipFromClients(debouncedSubmission.clients), [debouncedSubmission.employee, debouncedSubmission.clients]);
  const overall = useMemo(() => overallOutOf10(kpiScore, learningScore, relationshipScore, debouncedSubmission.manager?.score), [kpiScore, learningScore, relationshipScore, debouncedSubmission.manager?.score]);

  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (overall >= 8) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [overall]);

  const flags = useMemo(() => {
    const learningMins = (debouncedSubmission.learning || []).reduce((s, e) => s + (e.durationMins || 0), 0);
    const missingLearningHours = learningMins < 360;
    const hasEscalations = (debouncedSubmission.clients || []).some(c => (c.relationship?.escalations || []).length > 0);
    const missingReports = (debouncedSubmission.clients || []).some(c => (c.reports || []).length === 0);
    return { missingLearningHours, hasEscalations, missingReports };
  }, [debouncedSubmission]);

  useEffect(() => {
    setCurrentSubmission(m => {
      const nextScores = { kpiScore, learningScore, relationshipScore, overall };
      const sameScores = JSON.stringify(nextScores) === JSON.stringify(m.scores || {});
      const sameFlags = JSON.stringify(flags) === JSON.stringify(m.flags || {});
      if (sameScores && sameFlags) return m;
      return { ...m, flags, scores: nextScores };
    });
  }, [kpiScore, learningScore, relationshipScore, overall, flags]);

  const showSubmissionSummaryModal = (summary, submission) => {
    const modalContent = `
📊 PERFORMANCE SUMMARY - ${submission.monthKey.replace('-', ' ').toUpperCase()}

${summary.overview}

✅ STRENGTHS:
${summary.strengths.map(s => `• ${s}`).join('\n') || '• None'}

⚠️ WEAKNESSES:
${summary.weaknesses.map(i => `• ${i}`).join('\n') || '• None'}

📌 MISSED TASKS:
${summary.missed.map(i => `• ${i}`).join('\n') || '• None'}

📝 NEXT MONTH TIPS:
${summary.tips.map(g => `• ${g}`).join('\n') || '• Keep up the great work'}
    `;

    openModal(
      'Performance Summary',
      modalContent,
      closeModal,
      null,
      '',
      ''
    );
  };

  async function submitFinal() {
    console.log('🔍 Submit Final called with:', {
      supabase: !!supabase,
      isSubmissionFinalized,
      isPreviousMonth,
      currentSubmission: currentSubmission
    });

    if (!supabase) {
      console.error('❌ No Supabase connection');
      showErrorModal("Database connection not ready. Please wait a moment and try again.");
      return;
    }

    if (isSubmissionFinalized) {
      console.log('❌ Submission already finalized');
      showInfoModal("This month's submission has already been finalized and cannot be edited.", "Submission Already Completed");
      return;
    }

    if (isPreviousMonth && !isManagerEdit) {
      console.log('❌ Historical month submission blocked');
      showWarningModal("For data accuracy and audit purposes, submissions are limited to the current month and up to 2 months prior. Please select a more recent month for reporting.", "Historical Data Not Allowed");
      return;
    }

    console.log('🔍 Validating submission...');
    const check = validateSubmission(currentSubmission);
    console.log('📋 Validation result:', check);
    
    // Separate critical errors from warnings
    const criticalErrors = [];
    const warnings = [];
    
    check.errors.forEach(error => {
      // Only block for truly critical errors
      if (error.includes('Name') || 
          error.includes('Phone') || 
          error.includes('Department') || 
          error.includes('Role') ||
          error.includes('Report Month')) {
        criticalErrors.push(error);
      } else {
        warnings.push(error);
      }
    });
    
    if (criticalErrors.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Critical validation failed:', criticalErrors);
        console.log('📋 Current form data for debugging:', {
          employee: currentSubmission.employee,
          monthKey: currentSubmission.monthKey
        });
      }
      
      // Provide more helpful error message with navigation guidance
      const helpText = criticalErrors.length === 1 && criticalErrors[0].includes('Name') 
        ? '\n\nTip: Go back to Step 1 (Profile & Month) to enter your name.'
        : criticalErrors.length <= 2 
        ? '\n\nTip: These can be completed in Step 1 (Profile & Month).'
        : '\n\nTip: Most required fields are in Step 1 (Profile & Month). You can click on any step in the progress bar to navigate there.';
      
      openModal(
        "Required Information Missing",
        `Please complete these required fields before submitting:

${criticalErrors.map((e, i) => `${i + 1}. ${e}`).join('\n')}${helpText}

Your progress has been automatically saved, so you won't lose any other information you've entered.`,
        closeModal
      );
      return;
    }
    
    // Show warnings but allow submission
    if (warnings.length > 0) {
      console.log('⚠️ Validation warnings:', warnings);
      const shouldContinue = await new Promise(resolve => {
        openModal(
          "Review Before Submitting",
          `Please review these suggestions (submission will proceed):\n\n${warnings.map((w, i) => `${i + 1}. ${w}`).join('\n')}\n\nWould you like to submit anyway?`,
          () => resolve(false), // Cancel
          () => resolve(true),  // Continue
          'Review & Fix',
          'Submit Anyway'
        );
      });
      
      if (!shouldContinue) return;
    }
    // Create backup before submission
    const backupKey = `backup-${getAutoSaveKey()}-${Date.now()}`;
    try {
      localStorage.setItem(backupKey, JSON.stringify(currentSubmission));
    } catch (e) {
      console.error('Failed to create backup:', e);
    }

    const final = { 
      ...currentSubmission, 
      isDraft: false, 
      submittedAt: new Date().toISOString(), 
      employee: { 
        ...currentSubmission.employee, 
        name: (currentSubmission.employee?.name || "").trim(), 
        phone: currentSubmission.employee.phone 
      }
    };

    // Apply discipline penalty to overall before saving
    try {
      const penaltyInfo = computeDisciplinePenalty(final.monthKey, final.submittedAt);
      const baseOverall = final.scores?.overall ?? overall;
      const adjustedOverall = Math.max(0, baseOverall - (penaltyInfo.penalty || 0));
      final.scores = { ...final.scores, overall: adjustedOverall };
      final.discipline = penaltyInfo;
    } catch (e) {
      console.warn('Discipline penalty calculation failed:', e);
    }

    delete final.id;

    // Use enhanced error handling for the submission process
    await handleFormSubmission(async () => {
      // Store clients in repository before submitting
      if (supabase && currentSubmission.clients && currentSubmission.clients.length > 0) {
        console.log('🏢 Auto-storing clients to repository...');
        const clientRepository = getClientRepository(supabase, { updateClient: addClient, addClient });
        await clientRepository.storeClientsFromSubmission(currentSubmission);
      }

      // Use improved upsert with explicit error handling
      const { data, error } = await supabase
        .from('submissions')
        .upsert(final, { 
          onConflict: 'employee_phone,monthKey',
          ignoreDuplicates: false 
        })
        .select(); // Return inserted data for verification

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error("Submission processed but no data returned. Please verify your submission was saved.");
      }

      // Success - remove backup and continue
      try {
        localStorage.removeItem(backupKey);
      } catch (e) {
        console.error('Failed to remove backup:', e);
      }
      
      // Notify DataSync of new submission to trigger global refresh
      console.log('🔄 Notifying DataSync of new submission...');
      try {
        if (data && data.length > 0) {
          // Determine if this is an update or new submission
          const savedSubmission = data[0];
          const existingSubmission = allSubmissions.find(sub => 
            sub.employee?.phone === savedSubmission.employee?.phone && 
            sub.monthKey === savedSubmission.monthKey
          );
          
          if (existingSubmission) {
            await updateSubmission(savedSubmission);
          } else {
            await addSubmission(savedSubmission);
          }
        }
        
        // Force refresh all data to ensure consistency
        setTimeout(() => {
          refreshAllData();
        }, 500);
      } catch (syncError) {
        console.error('DataSync notification failed:', syncError);
        // Don't fail the submission for sync errors
      }
      
      return { final, data: data[0] };
    }, {
      successCallback: ({ final, data }) => {
        const summary = generateSummary(final);
        showSuccessNotification('Report submitted', `${monthLabel(final.monthKey)} report saved.`);
        showSubmissionSummaryModal(summary, final);
        
        clearDraft(); // Clear draft only on success
        setCurrentSubmission({ ...EMPTY_SUBMISSION, monthKey: prevMonthKey(thisMonthKey()) });
        setSelectedEmployee(null);
      },
      errorCallback: (error) => {
        // Keep backup for recovery
        showErrorModal(
          `Failed to save your report: ${error.message}\n\nYour data has been backed up locally. Please try again or contact support if the problem persists.`,
          "Submission Failed"
        );
      },
      validationRules: {
        required: ['employee.name', 'employee.phone', 'monthKey'],
        custom: [
          (data) => data.employee?.name?.trim() ? null : 'Employee name is required',
          (data) => data.employee?.phone ? null : 'Employee phone is required',
          (data) => data.monthKey ? null : 'Report month is required'
        ]
      }
    });
  }

  const mPrev = previousSubmission ? previousSubmission.monthKey : prevMonthKey(currentSubmission.monthKey);
  const mThis = currentSubmission.monthKey;
  const mComparison = comparisonSubmission ? comparisonSubmission.monthKey : prevMonthKey(mPrev);
  const rolesForDept = ROLES_BY_DEPT[currentSubmission.employee.department] || [];
  const isNewEmployee = !selectedEmployee;

  // Enhanced navigation with auto-save and validation feedback
  const goToStep = useCallback(async (stepId) => {
    console.log(`🎯 goToStep called: ${currentStep} -> ${stepId}`);
    
    // If already on the target step, just return
    if (currentStep === stepId) {
      console.log(`👍 Already on step ${stepId}, no navigation needed`);
      return;
    }
    
    // Validate step ID
    if (stepId < 1 || stepId > FORM_STEPS.length) {
      console.error(`❌ Invalid step ID: ${stepId}`);
      return;
    }
    
    console.log(`🔄 Starting navigation from step ${currentStep} to step ${stepId}...`);
    
    // If there are unsaved changes, confirm and force-save before navigation
    if (hasUnsavedChanges) {
      const proceed = await new Promise(resolve => {
        openModal(
          'Unsaved changes',
          'We will auto-save your progress before switching steps. Continue?',
          () => resolve(false), // Cancel
          () => resolve(true),  // Continue
          'Stay',
          'Continue'
        );
      });
      if (!proceed) return;
      try {
        await autoSave();
        notify({ type: 'success', title: 'Saved', message: 'Progress saved.' });
      } catch (e) {
        console.warn('Auto-save before navigation failed:', e);
      }
    }

    // Navigate after optional save
    setCurrentStep(stepId);
    
    // Update validation state for new step
    const validation = getStepValidation(stepId);
    setFieldErrors(validation.errors);
    setValidationWarnings(validation.warnings);
    
    // No-op: already saved above if needed
    
    console.log(`✅ Navigation completed: ${currentStep} -> ${stepId}`);
  }, [currentStep, hasUnsavedChanges, autoSave, getStepValidation, openModal, notify]);

  const nextStep = () => {
    const nextStepNumber = currentStep + 1;
    if (nextStepNumber <= FORM_STEPS.length) {
      // Get current step validation for display purposes only
      const validation = getStepValidation(currentStep);
      const hasErrors = Object.keys(validation.errors).length > 0;
      const hasWarnings = Object.keys(validation.warnings).length > 0;
      
      // Always allow navigation but show helpful guidance
      if (hasErrors || hasWarnings) {
        setFieldErrors(validation.errors);
        setValidationWarnings(validation.warnings);
        
        // Show a gentle reminder for step 1 critical fields, but don't block
        if (hasErrors && currentStep === 1) {
          console.log('⚠️ Step 1 has validation errors, but allowing navigation:', validation.errors);
          // Optional: Show a non-blocking notification
          // Can be uncommented if user wants gentle reminders
          /*
          openModal(
            'Reminder: Required Fields',
            `You can continue, but please remember to complete these fields before final submission:\n\n${Object.values(validation.errors).join('\n')}\n\nYou can return to this step anytime to complete them.`,
            closeModal,
            null,
            'OK, Continue',
            ''
          );
          */
        }
      }
      
      // Always allow progression
      goToStep(nextStepNumber);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  // Enhanced draft handling functions
  const handleResumeDraft = useCallback((draft) => {
    try {
      console.log('📄 Resuming draft:', draft.draftId);
      
      // Set the draft data
      setCurrentSubmission(draft);
      setCurrentStep(draft.currentStep || 1);
      
      // Set employee if available
      if (draft.name && draft.phone) {
        setSelectedEmployee({ name: draft.name, phone: draft.phone });
      } else if (draft.employee?.name && draft.employee?.phone) {
        setSelectedEmployee({ name: draft.employee.name, phone: draft.employee.phone });
      }
      
      // Update timestamps
      if (draft.lastSaved) {
        setLastAutoSave(new Date(draft.lastSaved));
      }
      
      // Mark as no unsaved changes since we just loaded
      setHasUnsavedChanges(false);
      
      // Hide prompts
      setShowDraftPrompt(false);
      setShowCrashRecovery(false);
      
      console.log('✅ Draft resumed successfully');
    } catch (error) {
      console.error('❌ Error resuming draft:', error);
      openModal('Error', 'Failed to resume draft. Starting fresh.', closeModal);
    }
  }, [setCurrentSubmission, setCurrentStep, setSelectedEmployee, setLastAutoSave, setHasUnsavedChanges, openModal, closeModal]);

  const handleStartFresh = useCallback(() => {
    try {
      console.log('🆕 Starting fresh form');
      
      // Reset to empty submission
      setCurrentSubmission({ ...EMPTY_SUBMISSION, isDraft: true });
      setCurrentStep(1);
      setHasUnsavedChanges(false);
      setLastAutoSave(null);
      
      // Keep current employee selection but clear form data
      // selectedEmployee remains as is
      
      // Hide prompts
      setShowDraftPrompt(false);
      setShowCrashRecovery(false);
      
      console.log('✅ Fresh form started');
    } catch (error) {
      console.error('❌ Error starting fresh:', error);
    }
  }, [setCurrentSubmission, setCurrentStep, setHasUnsavedChanges, setLastAutoSave]);

  const handleDismissDraftPrompt = useCallback(() => {
    setShowDraftPrompt(false);
    setShowCrashRecovery(false);
  }, []);

  const handleRecoverCrash = useCallback((crashedDraft) => {
    console.log('🚨 Recovering from crash:', crashedDraft);
    handleResumeDraft(crashedDraft.data || crashedDraft);
  }, [handleResumeDraft]);

  const getCurrentStepData = () => {
    const validStep = Math.max(1, Math.min(currentStep || 1, FORM_STEPS.length));
    return FORM_STEPS.find(step => step.id === validStep) || FORM_STEPS[0];
  };

  const ProgressIndicator = () => (
    <div className="bg-white rounded-xl shadow-sm border p-4 mb-6" role="navigation" aria-label="Form progress navigation">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold" id="progress-heading">Monthly Report Progress</h2>
          <p className="text-xs text-gray-500 mt-1" aria-describedby="progress-heading">💡 Click any step to navigate freely - no blocking!</p>
        </div>
        {lastAutoSave && (
          <div className="flex items-center gap-2 text-sm text-gray-500" role="status" aria-live="polite">
            <div className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true"></div>
            <span>Auto-saved {lastAutoSave.toLocaleTimeString()}</span>
          </div>
        )}
      </div>
      
      <div className="relative">
        <div className="flex justify-between" role="tablist" aria-labelledby="progress-heading">
          {FORM_STEPS.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log(`🖱️ Step button clicked: step ${step.id}, currentStep: ${currentStep}`);
                  goToStep(step.id);
                }}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${ currentStep === step.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : currentStep > step.id
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-gray-100 text-gray-400 border-gray-300 hover:border-gray-400 hover:bg-gray-200'
                }`}
                role="tab"
                aria-selected={currentStep === step.id}
                aria-controls={`step-${step.id}-content`}
                aria-label={`${step.title}: ${step.description}. ${currentStep === step.id ? 'Current step' : currentStep > step.id ? 'Completed step' : 'Pending step'}`}
                tabIndex={currentStep === step.id ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goToStep(step.id);
                  } else if (e.key === 'ArrowLeft' && index > 0) {
                    e.preventDefault();
                    document.querySelector(`[aria-controls="step-${FORM_STEPS[index - 1].id}-content"]`)?.focus();
                  } else if (e.key === 'ArrowRight' && index < FORM_STEPS.length - 1) {
                    e.preventDefault();
                    document.querySelector(`[aria-controls="step-${FORM_STEPS[index + 1].id}-content"]`)?.focus();
                  }
                }}
              >
                {currentStep > step.id ? '✓' : step.icon}
              </button>
              <div className="mt-2 text-center">
                <div className={`text-xs font-medium ${currentStep === step.id ? 'text-blue-600' : currentStep > step.id ? 'text-green-600' : 'text-gray-500'}`}>
                  {step.title}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 -z-10" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={FORM_STEPS.length} aria-label={`Progress: Step ${currentStep} of ${FORM_STEPS.length}`}>
          <div 
            className="h-full bg-green-600 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (FORM_STEPS.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderProfileStep();
      case 2:
        return renderAttendanceStep();
      case 3:
        return renderKPIStep();
      case 4:
        return renderLearningStep();
      case 5:
        return renderFeedbackStep();
      default:
        return null;
    }
  };

  const StepContent = () => {
    const stepData = getCurrentStepData();
    const isFormDisabled = (isSubmissionFinalized) && !isManagerEdit;
    
    return (
      <div 
        className={`bg-white rounded-xl shadow-sm border p-6 ${ isFormDisabled ? 'opacity-75' : ''}`}
        role="tabpanel"
        id={`step-${currentStep}-content`}
        aria-labelledby={`step-${currentStep}-tab`}
        tabIndex={0}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${ isFormDisabled ? 'bg-gray-200 text-gray-500' : 'bg-blue-100'}`} aria-hidden="true">
              {stepData.icon}
            </div>
            <div>
              <h3 className="text-xl font-semibold" id={`step-${currentStep}-title`}>{stepData.title}</h3>
              <p className="text-gray-600 text-sm" aria-describedby={`step-${currentStep}-title`}>{stepData.description}</p>
              {isSubmissionFinalized && !isManagerEdit && (
                <p className="text-sm text-red-600 mt-1" role="status" aria-live="polite">
                  ✓ Submission completed - form locked
                </p>
              )}
              {isManagerEdit && isSubmissionFinalized && (
                <p className="text-sm text-blue-600 mt-1" role="status" aria-live="polite">
                  ✏️ Manager editing mode - submission can be modified
                </p>
              )}
            </div>
          </div>
          
          {/* Auto-save Status Indicator */}
          <div className="text-right">
            {hasUnsavedChanges ? (
              <div className="flex items-center gap-2 text-yellow-600 text-sm">
                <div className="animate-spin w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
                <span>Saving...</span>
              </div>
            ) : lastAutoSave ? (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span>Saved {new Date().getTime() - lastAutoSave.getTime() < 10000 ? 'just now' : 'automatically'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>Ready</span>
              </div>
            )}
            
            {autoSaveEnabled && selectedEmployee?.name && selectedEmployee?.phone && (
              <div className="text-xs text-gray-500 mt-1">
                Auto-save: ON
              </div>
            )}
          </div>
        </div>

        {renderStepContent()}
      </div>
    );
  };

  const renderProfileStep = () => {
    const isFormDisabled = isSubmissionFinalized && !isManagerEdit;
    const validation = getStepValidation(1);
    
    return (
      <div className="space-y-6">
        <StepValidationIndicator 
          errors={validation.errors}
          warnings={validation.warnings}
          stepTitle="Profile & Month Selection"
        />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {currentUser ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-800 mb-3">Logged in as:</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="font-medium">{currentUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="font-medium">{currentUser.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Department:</span>
                    <span className="font-medium">{currentUser.department}</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Select Employee</label>
                  <select
                    className={`w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${ isFormDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                    value={selectedEmployee ? `${selectedEmployee.name}-${selectedEmployee.phone}` : ""}
                    onChange={(e) => {
                      if (isFormDisabled) return;
                      if (e.target.value === "") {
                        setSelectedEmployee(null);
                        // Don't reset form data - preserve what user entered
                        console.log('🔄 Employee deselected, preserving form data');
                      } else {
                        const [name, phone] = e.target.value.split('-');
                        setSelectedEmployee({ name, phone });
                      }
                    }}
                    disabled={isFormDisabled}
                  >
                    <option value="">-- New Employee --</option>
                    {uniqueEmployees.map((emp) => (
                      <option key={`${emp.name}-${emp.phone}`} value={`${emp.name}-${emp.phone}`}>
                        {emp.name} ({emp.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {isNewEmployee && (
                  <div className="space-y-4">
                    <TextField 
                      label="Name" 
                      placeholder="Your full name" 
                      value={currentSubmission.employee.name || ""} 
                      onChange={handleNameChange}
                      disabled={isFormDisabled}
                      error={fieldValidation['employee.name']?.error}
                      warning={fieldValidation['employee.name']?.warning}
                      validateOnChange={true}
                    />
                    <TextField 
                      label="Email" 
                      placeholder="Your email address" 
                      value={currentSubmission.employee.email || ""} 
                      onChange={(value) => updateCurrentSubmission('employee.email', value)}
                      disabled={isFormDisabled}
                      error={fieldValidation['employee.email']?.error}
                      warning={fieldValidation['employee.email']?.warning}
                      validateOnChange={true}
                      type="email"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        Phone Number
                        {fieldErrors['employee.phone'] && <span className="ml-2 text-red-500 text-xs">⚠️ Required</span>}
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="e.g., 9876543210"
                        value={currentSubmission.employee.phone || ""}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        onInput={(e) => handlePhoneChange(e.target.value)} // Handles programmatic/autofill input
                        onKeyDown={(e) => {
                          // Prevent alphabetic characters from being entered
                          if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          // Handle paste events for better UX
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData('text');
                          handlePhoneChange(pastedData);
                        }}
                        disabled={isFormDisabled}
                        className={`w-full border rounded-xl p-3 text-base focus:ring-2 transition-colors duration-200 ${
                          fieldErrors['employee.phone']
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                            : isFormDisabled
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        autoComplete="tel"
                        maxLength="10"
                      />
                      {fieldErrors['employee.phone'] && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors['employee.phone']}</p>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        Enter 10-digit number only (no spaces or dashes)
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {!currentUser && (
              <>
                <div>
                  <label htmlFor="department" className="block text-sm font-medium mb-2">Department</label>
<select 
id="department"
className={`w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${ isFormDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
value={currentSubmission.employee.department} 
onChange={e => {
                      if (isFormDisabled) return;
                      const newDepartment = e.target.value;
                      const oldDepartment = currentSubmission.employee.department;
                      
                      // Clear roles when department changes to prevent invalid combinations
                      if (newDepartment !== oldDepartment) {
                        console.log(`🏢 Department changed from ${oldDepartment} to ${newDepartment} - clearing roles`);
                        updateCurrentSubmission('employee.role', []);
                      }
                      
                      updateCurrentSubmission('employee.department', newDepartment);
                    }}
                    disabled={isFormDisabled}
                  >
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center">
                    Role(s)
                    {fieldErrors['employee.role'] && <span className="ml-2 text-red-500 text-xs">⚠️ Required</span>}
                  </label>
                  <div className={`${fieldErrors['employee.role'] ? 'ring-2 ring-red-300 rounded-xl' : ''}`}>
                    <MultiSelect
                      options={rolesForDept}
                      selected={currentSubmission.employee.role}
                      onChange={(newRoles) => {
                        console.log('🎯 Role selection onChange triggered:', newRoles);
                        if (isFormDisabled) {
                          console.log('❌ Form is disabled, skipping role update');
                          return;
                        }
                        updateCurrentSubmission('employee.role', newRoles);
                      }}
                      placeholder="Select your roles"
                      disabled={isFormDisabled}
                      error={fieldErrors['employee.role']}
                      allowCustom={true}
                      customPlaceholder="Enter custom role..."
                    />
                  </div>
                  {fieldErrors['employee.role'] && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors['employee.role']}</p>
                  )}
                  {/* Development-only debug info and test buttons */}
                  {process.env.NODE_ENV === 'development' && (
                    <>
                      <div className="text-xs text-gray-500 mt-1">
                        Debug: Department={currentSubmission.employee.department}, 
                        Options={rolesForDept.length}, 
                        Selected={currentSubmission.employee.role?.length || 0}
                        <br/>
                        Available roles: {rolesForDept.join(', ') || 'None'}
                        <br/>
                        Selected roles: {currentSubmission.employee.role?.join(', ') || 'None'}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            console.log('🧪 Test: Adding first role');
                            if (rolesForDept.length > 0) {
                              updateCurrentSubmission('employee.role', [rolesForDept[0]]);
                            }
                          }}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                        >
                          Test: Select First Role
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🧪 Test: Clear Roles button clicked');
                            console.log('🧪 Current roles before clearing:', currentSubmission.employee.role);
                            updateCurrentSubmission('employee.role', []);
                            console.log('🧪 updateCurrentSubmission called with empty array');
                          }}
                          className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 cursor-pointer"
                        >
                          Test: Clear Roles
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                Report Month
                {fieldErrors['monthKey'] && <span className="ml-2 text-red-500 text-xs">⚠️ Required</span>}
              </label>
              <input 
                type="month" 
                className={`w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  fieldErrors['monthKey'] 
                    ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                    : isFormDisabled 
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                    : ''
                }`}
                value={currentSubmission.monthKey}
                disabled={isFormDisabled} 
                onChange={e => {
                  const selectedMonth = e.target.value;
                  const currentMonth = thisMonthKey();
                  
                  // Show helpful guidance about month selection
                  if (selectedMonth === currentMonth) {
                    console.log('⚠️ User selected current month for reporting');
                  } else if (selectedMonth > currentMonth) {
                    console.log('⚠️ User selected future month for reporting');
                  }
                  
                  updateCurrentSubmission('monthKey', selectedMonth);
                }} 
                max={thisMonthKey()} // Prevent future month selection
              />
              {fieldErrors['monthKey'] && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors['monthKey']}</p>
              )}
              <div className="text-xs text-gray-500 mt-1">
                💡 Tip: Select the month you're reporting data for (typically the previous month for retrospective analysis)
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3 mt-3">
                <h5 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
                  📊 Three-Month Comparative Analysis
                </h5>
                <div className="text-xs text-blue-700 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-white/60 rounded">
                      <div className="font-medium">{monthLabel(mComparison)}</div>
                      <div className="text-gray-600">Baseline</div>
                    </div>
                    <div className="text-center p-2 bg-white/60 rounded">
                      <div className="font-medium">{monthLabel(mPrev)}</div>
                      <div className="text-gray-600">Previous</div>
                    </div>
                    <div className="text-center p-2 bg-white/80 rounded border border-blue-300">
                      <div className="font-medium text-blue-800">{monthLabel(mThis)}</div>
                      <div className="text-blue-600">Reporting</div>
                    </div>
                  </div>
                  <div className="text-blue-600 text-center mt-2 font-medium">
                    🎯 Your performance trends will be analyzed across these three months
                  </div>
                </div>
              </div>
            </div>

            {previousSubmission && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                  Previous Report Available for Comparison
                </h4>
                <div className="text-sm text-green-700 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium">📅 Report Month</div>
                      <div>{monthLabel(previousSubmission.monthKey)}</div>
                    </div>
                    <div>
                      <div className="font-medium">⭐ Overall Score</div>
                      <div>{previousSubmission.scores?.overall || 'N/A'}/10</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium">🏢 Department</div>
                      <div>{previousSubmission.employee?.department}</div>
                    </div>
                    <div>
                      <div className="font-medium">👥 Clients</div>
                      <div>{previousSubmission.clients?.length || 0} clients</div>
                    </div>
                  </div>
                  <div className="text-green-600 bg-green-100 p-2 rounded text-xs mt-3">
                    💡 This previous data will be used as a baseline for comparative analysis in your KPI and performance sections.
                  </div>
                </div>
              </div>
            )}
            
            {!previousSubmission && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">🎯</span>
                  Welcome! This is Your First Performance Report
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-blue-800 font-medium mb-2">🚀 What to Expect:</p>
                    <ul className="text-blue-700 space-y-1 text-xs">
                      <li>• This report establishes your performance baseline</li>
                      <li>• Complete all sections to showcase your work and achievements</li>
                      <li>• Your data will be used for future month-over-month comparisons</li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border border-green-200">
                    <p className="text-green-800 font-medium mb-2">📈 Future Benefits:</p>
                    <ul className="text-green-700 space-y-1 text-xs">
                      <li>• Next month: See your growth trends and improvements</li>
                      <li>• Track KPI improvements with visual comparisons</li>
                      <li>• Get detailed performance insights and recommendations</li>
                      <li>• Build a comprehensive performance history</li>
                    </ul>
                  </div>
                  <div className="text-center bg-blue-100 rounded-lg p-3 mt-3">
                    <p className="text-blue-800 font-semibold text-sm">💡 Pro Tip</p>
                    <p className="text-blue-700 text-xs mt-1">
                      Be thorough with this first report - it sets the foundation for all future comparisons and growth tracking!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderAttendanceStep = () => {
    const validation = getStepValidation(2);
    const prevAttendance = previousSubmission?.meta?.attendance || { wfo: 0, wfh: 0 };
    const comparisonAttendance = comparisonSubmission?.meta?.attendance || { wfo: 0, wfh: 0 };
    const currentTotal = (currentSubmission.meta.attendance.wfo || 0) + (currentSubmission.meta.attendance.wfh || 0);
    const prevTotal = (prevAttendance.wfo || 0) + (prevAttendance.wfh || 0);
    const comparisonTotal = (comparisonAttendance.wfo || 0) + (comparisonAttendance.wfh || 0);
    
    return (
      <div className="space-y-6">
        <StepValidationIndicator 
          errors={validation.errors}
          warnings={validation.warnings}
          stepTitle="Attendance & Tasks"
        />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              📅 Work Attendance
            </h4>
            <div className="space-y-4">
              <ThreeWayComparativeField 
                label="Work from Office (WFO) Days" 
                placeholder="0-31" 
                unit=" days"
                currentValue={currentSubmission.meta.attendance.wfo} 
                previousValue={prevAttendance.wfo}
                comparisonValue={comparisonAttendance.wfo}
                onChange={handleWFOChange}
                monthComparison={monthLabel(mComparison)}
                monthPrev={monthLabel(mPrev)}
                monthThis={monthLabel(mThis)}
                error={fieldValidation['meta.attendance.wfo']?.error}
                warning={fieldValidation['meta.attendance.wfo']?.warning}
                validateOnChange={true}
                />
              <ThreeWayComparativeField 
                label="Work from Home (WFH) Days" 
                placeholder="0-31"
                unit=" days"
                currentValue={currentSubmission.meta.attendance.wfh} 
                previousValue={prevAttendance.wfh}
                comparisonValue={comparisonAttendance.wfh}
                onChange={handleWFHChange}
                monthComparison={monthLabel(mComparison)}
                monthPrev={monthLabel(mPrev)}
                monthThis={monthLabel(mThis)}
                error={fieldValidation['meta.attendance.wfh']?.error}
                warning={fieldValidation['meta.attendance.wfh']?.warning}
                validateOnChange={true}
                />
            </div>
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              📍 Working days in {monthLabel(currentSubmission.monthKey)}: {workingDaysInMonth(currentSubmission.monthKey)} (of {daysInMonth(currentSubmission.monthKey)} total days)
              <br />
              Current total: {currentTotal} days
            </div>
            
            {/* Comparative attendance analysis */}
            {previousSubmission && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h5 className="text-sm font-medium text-blue-800 mb-2">📊 Attendance Comparison</h5>
                <div className="text-xs text-blue-700 space-y-1">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="font-medium">WFO</div>
                      <div>{prevAttendance.wfo || 0} → {currentSubmission.meta.attendance.wfo || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">WFH</div>
                      <div>{prevAttendance.wfh || 0} → {currentSubmission.meta.attendance.wfh || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Total</div>
                      <div className={currentTotal > prevTotal ? 'text-green-600' : currentTotal < prevTotal ? 'text-red-600' : 'text-gray-600'}>
                        {prevTotal} → {currentTotal}
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-blue-600 mt-2">
                    Comparing {monthLabel(mPrev)} vs {monthLabel(mThis)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              ✅ Task Management
            </h4>
            <ThreeWayComparativeField 
              label="Tasks Completed" 
              placeholder="Number of tasks" 
              unit=" tasks"
              currentValue={currentSubmission.meta.tasks.count} 
              previousValue={previousSubmission?.meta?.tasks?.count}
              comparisonValue={comparisonSubmission?.meta?.tasks?.count}
              onChange={handleTasksChange}
              monthComparison={monthLabel(mComparison)}
              monthPrev={monthLabel(mPrev)}
              monthThis={monthLabel(mThis)}
              error={fieldValidation['meta.tasks.count']?.error}
              warning={fieldValidation['meta.tasks.count']?.warning}
              validateOnChange={true}
            />
            <TextField 
              label="AI Table / PM link" 
              placeholder="Google Drive or project management URL" 
              value={currentSubmission.meta.tasks.aiTableLink} 
              onChange={handleAITableLinkChange} 
            />
            <TextField 
              label="Screenshot proof" 
              placeholder="Google Drive URL for screenshot" 
              value={currentSubmission.meta.tasks.aiTableScreenshot} 
              onChange={handleAITableScreenshotChange} 
            />
            
            {/* Comparative task analysis */}
            {previousSubmission && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h5 className="text-sm font-medium text-green-800 mb-2">📊 Task Completion Comparison</h5>
                <div className="text-xs text-green-700">
                  <div className="flex justify-between items-center">
                    <span>{monthLabel(mPrev)}: {previousSubmission.meta?.tasks?.count || 0} tasks</span>
                    <span className="text-green-600">→</span>
                    <span className="font-semibold">{monthLabel(mThis)}: {currentSubmission.meta.tasks.count || 0} tasks</span>
                  </div>
                  {(currentSubmission.meta.tasks.count || 0) > (previousSubmission.meta?.tasks?.count || 0) && (
                    <div className="text-green-600 mt-1 text-center">📈 Improved productivity!</div>
                  )}
                  {(currentSubmission.meta.tasks.count || 0) < (previousSubmission.meta?.tasks?.count || 0) && (
                    <div className="text-yellow-600 mt-1 text-center">📋 Consider reviewing task management strategies</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderKPIStep = () => {
    return (
      <div className="space-y-6">
        {/* KPI Section Guidance */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              🎯
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 mb-2">Key Performance Indicators (KPIs)</h4>
              <p className="text-green-700 text-sm mb-3">
                Evaluate your performance across key metrics that matter most to your role and department. Be honest and specific in your assessments.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Rate yourself objectively on each metric</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Provide specific examples and evidence</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Compare with previous month's performance</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Focus on measurable outcomes and results</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <DeptClientsBlock 
          currentSubmission={currentSubmission} 
          previousSubmission={previousSubmission} 
          comparisonSubmission={comparisonSubmission}
          setModel={setModelWithTracking} 
          monthPrev={mPrev} 
          monthThis={mThis}
          monthComparison={mComparison}
          openModal={openModal} 
          closeModal={closeModal} 
        />
      </div>
    );
  }


  const renderLearningStep = () => {
    const validation = getStepValidation(4);
    const learningHours = (currentSubmission.learning || []).reduce((sum, l) => sum + (l.durationMins || 0), 0) / 60;
    
    return (
      <div className="space-y-6">
        <StepValidationIndicator 
          errors={validation.errors}
          warnings={validation.warnings}
          stepTitle="Learning & Development"
        />
        
        {/* Learning Section Guidance */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              📚
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-purple-900 mb-2">Learning & Development Activities</h4>
              <p className="text-purple-700 text-sm mb-3">
                Document all learning activities including courses, training sessions, workshops, certifications, and self-study. Target: 6+ hours monthly.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-purple-600">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Include online courses and certifications</span>
                </div>
                <div className="flex items-center gap-2 text-purple-600">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Add workshops and training sessions</span>
                </div>
                <div className="flex items-center gap-2 text-purple-600">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Document self-study and research time</span>
                </div>
                <div className="flex items-center gap-2 text-purple-600">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>Describe how learning applies to your role</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <ProgressIndicator 
          current={learningHours}
          target={6}
          label="Learning Hours Progress"
          unit="h"
          color="green"
        />
        
        <LearningBlock model={currentSubmission} setModel={setModelWithTracking} openModal={openModal} />
        
        <div className="bg-white border rounded-xl p-6">
          <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
            🤖 AI Usage (Optional)
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Describe how you used AI tools to improve your work efficiency this month.
          </p>
          <textarea 
            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            rows={4}
            placeholder="List ways you used AI to work faster/better this month. Include links or examples."
            value={currentSubmission.aiUsageNotes}
            onChange={e => handleAIUsageChange(e.target.value)}
          />
        </div>
      </div>
    );
  }

  const renderFeedbackStep = () => {
    return (
      <div className="space-y-6">
        {/* Feedback Section Guidance */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              💬
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-orange-900 mb-2">Employee Feedback & Challenges</h4>
              <p className="text-orange-700 text-sm mb-3">
                Your honest feedback helps improve our workplace. Share constructive thoughts about company processes, policies, and any challenges you're facing.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-orange-600">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Be specific and constructive in your feedback</span>
                </div>
                <div className="flex items-center gap-2 text-orange-600">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Suggest improvements where possible</span>
                </div>
                <div className="flex items-center gap-2 text-orange-600">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Highlight both positive aspects and areas for growth</span>
                </div>
                <div className="flex items-center gap-2 text-orange-600">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <span>Your feedback is confidential and valued</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-xl p-6">
          <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
            💬 Employee Feedback & Self-Assessment
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Provide comprehensive feedback covering all aspects of your work experience and self-assessment.
          </p>
          
          {/* Scoring Guidance */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
              📋 Feedback Guidelines & Self-Assessment Scoring
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h6 className="font-medium text-blue-800 mb-2">📝 What to Include:</h6>
                <ul className="space-y-1 text-blue-700">
                  <li>• Company culture and work environment</li>
                  <li>• HR policies and communication</li>
                  <li>• Management support and guidance</li>
                  <li>• Challenges and obstacles faced</li>
                  <li>• Suggestions for improvement</li>
                  <li>• Personal achievements and growth</li>
                </ul>
              </div>
              <div>
                <h6 className="font-medium text-blue-800 mb-2">⭐ Self-Assessment Scale (1-10):</h6>
                <ul className="space-y-1 text-blue-700">
                  <li>• <strong>9-10:</strong> Exceptional performance, exceeded expectations</li>
                  <li>• <strong>7-8:</strong> Strong performance, met most goals</li>
                  <li>• <strong>5-6:</strong> Satisfactory performance, room for improvement</li>
                  <li>• <strong>3-4:</strong> Below expectations, needs significant improvement</li>
                  <li>• <strong>1-2:</strong> Poor performance, requires immediate attention</li>
                </ul>
              </div>
            </div>
          </div>
          
          <TextArea 
            label="Comprehensive Feedback & Self-Assessment" 
            placeholder="Please provide detailed feedback covering:\n\n1. COMPANY FEEDBACK: What's working well? What could be improved in company culture, processes, or policies?\n\n2. HR & MANAGEMENT: Thoughts on HR support, management guidance, and communication?\n\n3. CHALLENGES: Any obstacles or challenges hindering your work or growth?\n\n4. SELF-ASSESSMENT: Rate your overall performance this month (1-10) and explain your reasoning. Include specific achievements, areas where you excelled, and areas for improvement.\n\n5. SUGGESTIONS: Any recommendations for improving the work environment or processes?"
            rows={12}
            value={currentSubmission.feedback.comprehensive || currentSubmission.feedback.company || ''}
            onChange={(value) => {
              setCurrentSubmission(prev => ({
                ...prev,
                feedback: {
                  ...prev.feedback,
                  comprehensive: value,
                  // Keep legacy fields for backward compatibility
                  company: value,
                  hr: value,
                  challenges: value
                }
              }));
            }}
          />
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border rounded-xl p-6">
          <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
            📊 Performance Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{kpiScore}/10</div>
              <div className="text-sm text-gray-600">KPI Score</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{learningScore}/10</div>
              <div className="text-sm text-gray-600">Learning</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{relationshipScore}/10</div>
              <div className="text-sm text-gray-600">Client Relations</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{overall}/10</div>
              <div className="text-sm text-gray-600">Overall</div>
            </div>
          </div>
          
          {overall >= 8 && (
            <div className="mt-4 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-green-600 font-semibold">Excellent performance!</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Form Introduction and Guidance */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            📝
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Monthly Performance Report</h3>
            <p className="text-blue-700 text-sm mb-3">
              Complete your monthly performance evaluation by filling out each section. Your progress is automatically saved as you navigate between steps.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-blue-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Auto-saves when moving between sections</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Complete all {FORM_STEPS.length} steps to submit</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Review your performance summary before submitting</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Submit by month-end for timely evaluation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      
      
      {/* Enhanced Draft Resume Prompt */}
      {showDraftPrompt && (
        <DraftResumePrompt
          currentUser={selectedEmployee}
          onResumeDraft={handleResumeDraft}
          onStartFresh={handleStartFresh}
          onDismiss={handleDismissDraftPrompt}
          isVisible={showDraftPrompt}
        />
      )}
      
      {/* Crash Recovery Prompt */}
      {showCrashRecovery && (
        <CrashRecoveryPrompt
          onRecover={handleRecoverCrash}
          onDismiss={handleDismissDraftPrompt}
        />
      )}
      
      {isManagerEdit && onBack && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              ✏️
            </div>
            <div>
              <h4 className="font-semibold text-blue-800">Manager Edit Mode</h4>
              <p className="text-sm text-blue-700">
                Editing {selectedEmployee?.name}'s submission for {monthLabel(currentSubmission.monthKey)}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              if (hasUnsavedChanges) {
                const proceed = await new Promise(resolve => {
                  openModal(
                    'Unsaved changes',
                    'We will auto-save your progress before leaving. Continue?',
                    () => resolve(false),
                    () => resolve(true),
                    'Stay',
                    'Continue'
                  );
                });
                if (!proceed) return;
                try { await autoSave(); } catch {}
              }
              onBack();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      )}
      
      {isSubmissionFinalized && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            ✓
          </div>
          <div>
            <h4 className="font-semibold text-green-800">
              {isManagerEdit ? "Editing Submitted Report" : "Submission Complete"}
            </h4>
            <p className="text-sm text-green-700">
              {isManagerEdit 
                ? "This report has been submitted. As a manager, you can edit and re-submit it."
                : "This month's report has been successfully submitted and locked. No further edits are allowed."
              }
            </p>
          </div>
        </div>
      )}
      
      {isPreviousMonth && !isSubmissionFinalized && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            📅
          </div>
          <div>
            <h4 className="font-semibold text-orange-800">Previous Month Selected</h4>
            <p className="text-sm text-orange-700">
              You can only edit the current month's submission. Please select the current month to make changes.
            </p>
          </div>
        </div>
      )}
      
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-yellow-800">You have unsaved changes in this section.</span>
            <span className="text-xs text-yellow-600 ml-2">Auto-saves when you move to next section</span>
          </div>
          <button
            onClick={saveCurrentSection}
            disabled={!selectedEmployee}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            💾 Save Now
          </button>
        </div>
      )}
      
      {!hasUnsavedChanges && lastAutoSave && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-800">
              ✓ Section saved at {lastAutoSave.toLocaleTimeString()}
            </span>
          </div>
          <button
            onClick={debugAutoSave}
            className="text-xs text-green-600 hover:text-green-800 underline"
            title="Click to see auto-save debug info in browser console"
          >
            Debug Info
          </button>
        </div>
      )}

      <ProgressIndicator />
      <StepContent />

      <div className="flex justify-between items-center mt-4 sm:mt-6 gap-3">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
        >
          <span className="hidden sm:inline">← Previous</span>
          <span className="sm:hidden">← Back</span>
        </button>
        
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <button
              onClick={saveCurrentSection}
              disabled={!selectedEmployee}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              💾 <span className="hidden sm:inline">Save Section</span>
            </button>
          )}
          <span className="text-xs sm:text-sm text-gray-500">
            <span className="hidden sm:inline">Step </span>{currentStep} of {FORM_STEPS.length}
          </span>
        </div>

        {currentStep === FORM_STEPS.length ? (
          <button
            onClick={submitFinal}
            disabled={!supabase || isSubmissionFinalized || isPreviousMonth}
            className={`rounded-xl px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-colors touch-manipulation ${ isSubmissionFinalized || isPreviousMonth
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white disabled:opacity-50'
            }`}
            title={isSubmissionFinalized ? 'Submission already completed' : isPreviousMonth ? 'Can only edit current month' : ''}
          >
            <span className="hidden sm:inline">
              {isSubmissionFinalized ? 'Already Submitted' : isPreviousMonth ? 'Previous Month' : 'Submit Report'}
            </span>
            <span className="sm:hidden">
              {isSubmissionFinalized ? 'Submitted' : isPreviousMonth ? 'Locked' : 'Submit'}
            </span>
          </button>
        ) : (
          <button
            onClick={nextStep}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base transition-colors touch-manipulation"
          >
            <span className="hidden sm:inline">Next →</span>
            <span className="sm:hidden">Next</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default EmployeeForm;
