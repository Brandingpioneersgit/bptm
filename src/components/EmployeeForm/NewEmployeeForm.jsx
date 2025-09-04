import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSupabase } from '../SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { useModal } from '@/shared/components/ModalContext';
import { useEmployeeSync } from '@/features/employees/context/EmployeeSyncContext';
import { DEPARTMENTS, ROLES_BY_DEPT, thisMonthKey, prevMonthKey, monthLabel, daysInMonth, workingDaysInMonth, getWorkingDaysInfo } from '@/shared/lib/constants';
import { Section, TextField, NumField, TextArea, MultiSelect, ProgressIndicator, StepValidationIndicator, ThreeWayComparativeField } from '@/shared/components/ui';
import TaskProgressTracker from '@/shared/components/TaskProgressTracker';
import EmployeeDropdown from '@/shared/components/EmployeeDropdown';
import ClientDropdown from '@/shared/components/ClientDropdown';
import DeptClientsBlock from '../DeptClientsBlock';
import { LearningBlock } from '../LearningBlock';
import { ensureClientsTableExists } from '../../utils/createClientsTable.js';
import { ensureEmployeesTableExists, getOrCreateEmployee } from '../../utils/createEmployeesTable.js';
import { scoreKPIs, scoreLearning, scoreRelationshipFromClients, overallOutOf10, generateSummary, computeDisciplinePenalty } from '@/shared/lib/scoring';
import { createErrorHandler } from '../../shared/utils/errorHandler';
import { globalSyncManager, createSubmissionHandler } from '../../utils/dataSyncFix.js';
import { clientDataPriorityService } from '../../services/clientDataPriorityService.js';

// Utility function for URL validation
const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

// Advanced input component with ref-based cursor preservation
function CursorPreservedInput({ 
  type = 'text', 
  value, 
  onChange, 
  onBlur,
  className,
  placeholder,
  disabled,
  ...props 
}) {
  const inputRef = useRef(null);
  const lastValueRef = useRef(value);
  const cursorPositionRef = useRef(0);
  const isUpdatingRef = useRef(false);
  
  // Store cursor position before any updates
  const storeCursorPosition = useCallback(() => {
    if (inputRef.current && document.activeElement === inputRef.current) {
      cursorPositionRef.current = inputRef.current.selectionStart || 0;
    }
  }, []);
  
  // Restore cursor position after updates
  const restoreCursorPosition = useCallback(() => {
    if (inputRef.current && document.activeElement === inputRef.current && !isUpdatingRef.current) {
      const position = cursorPositionRef.current;
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(position, position);
        }
      });
    }
  }, []);
  
  // Handle input changes
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    storeCursorPosition();
    
    if (onChange) {
      onChange(e);
    }
    
    lastValueRef.current = newValue;
  }, [onChange, storeCursorPosition]);
  
  // Handle blur events
  const handleBlur = useCallback((e) => {
    if (onBlur) {
      onBlur(e);
    }
  }, [onBlur]);
  
  // Update input value when prop changes (but preserve cursor)
  useEffect(() => {
    if (inputRef.current && value !== lastValueRef.current && !isUpdatingRef.current) {
      storeCursorPosition();
      inputRef.current.value = value || '';
      lastValueRef.current = value;
      restoreCursorPosition();
    }
  }, [value, storeCursorPosition, restoreCursorPosition]);
  
  if (type === 'textarea') {
    return (
      <textarea
        ref={inputRef}
        defaultValue={value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        className={className}
        placeholder={placeholder}
        disabled={disabled}
        {...props}
      />
    );
  }
  
  return (
    <input
      ref={inputRef}
      type={type}
      defaultValue={value || ''}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      {...props}
    />
  );
}

// Advanced debouncing system with queue management
class FormUpdateManager {
  constructor() {
    this.updateQueue = new Map();
    this.saveTimeouts = new Map();
    this.isProcessing = false;
    this.batchSize = 5;
    
    this.debounceDelays = {
      immediate: 100,   // Critical fields like employee ID
      fast: 300,        // Important fields
      normal: 800,      // Regular text fields
      slow: 1500        // Large text areas
    };
  }
  
  scheduleUpdate(key, value, priority = 'normal', callback) {
    // Clear existing timeout
    if (this.saveTimeouts.has(key)) {
      clearTimeout(this.saveTimeouts.get(key));
    }
    
    // Add to queue
    this.updateQueue.set(key, {
      value,
      priority,
      callback,
      timestamp: Date.now()
    });
    
    // Schedule execution
    const delay = this.debounceDelays[priority] || this.debounceDelays.normal;
    const timeoutId = setTimeout(() => {
      this.processUpdate(key);
    }, delay);
    
    this.saveTimeouts.set(key, timeoutId);
  }
  
  processUpdate(key) {
    const update = this.updateQueue.get(key);
    if (!update) return;
    
    try {
      if (update.callback) {
        update.callback(update.value);
      }
      
      this.updateQueue.delete(key);
      this.saveTimeouts.delete(key);
      
    } catch (error) {
      console.error(`Failed to process update for ${key}:`, error);
      
      // Retry with lower priority
      setTimeout(() => {
        this.scheduleUpdate(key, update.value, 'slow', update.callback);
      }, 2000);
    }
  }
  
  flushAll() {
    for (const [key] of this.updateQueue) {
      if (this.saveTimeouts.has(key)) {
        clearTimeout(this.saveTimeouts.get(key));
      }
      this.processUpdate(key);
    }
  }
  
  clear() {
    for (const timeoutId of this.saveTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.updateQueue.clear();
    this.saveTimeouts.clear();
  }
}

// Enhanced data persistence with error recovery
class RobustDataPersistence {
  constructor() {
    this.storage = this.initStorage();
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }
  
  initStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Test localStorage
        const testKey = '__test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return localStorage;
      }
    } catch (e) {
      console.warn('localStorage not available, using memory storage');
    }
    
    // Fallback to memory storage
    const memoryStorage = new Map();
    return {
      getItem: (key) => memoryStorage.get(key) || null,
      setItem: (key, value) => memoryStorage.set(key, value),
      removeItem: (key) => memoryStorage.delete(key)
    };
  }
  
  async save(key, data, attempt = 1) {
    try {
      const saveData = {
        ...data,
        timestamp: Date.now(),
        version: '3.0'
      };
      
      this.storage.setItem(key, JSON.stringify(saveData));
      return true;
      
    } catch (error) {
      console.error(`Save attempt ${attempt} failed for ${key}:`, error);
      
      if (attempt < this.retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.save(key, data, attempt + 1);
      }
      
      return false;
    }
  }
  
  load(key) {
    try {
      const saved = this.storage.getItem(key);
      if (!saved) return null;
      
      const data = JSON.parse(saved);
      
      // Check age (24 hours max)
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - data.timestamp > maxAge) {
        this.storage.removeItem(key);
        return null;
      }
      
      return data;
      
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
      return null;
    }
  }
  
  clear(key) {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error(`Failed to clear ${key}:`, error);
    }
  }
}

// Database error handler with automatic recovery
class DatabaseErrorHandler {
  constructor(supabaseInstance) {
    this.supabase = supabaseInstance;
    this.clientsTableChecked = false;
    this.isCreatingTable = false;
  }
  
  async handleClientsError(error) {
    if (error?.code === 'PGRST205' && !this.clientsTableChecked && !this.isCreatingTable) {
      this.isCreatingTable = true;
      
      try {
        console.log('🔧 Checking clients table...');
        const result = await ensureClientsTableExists();
        this.clientsTableChecked = true;
        
        if (Array.isArray(result)) {
          console.log('📋 Clients table not found, returning empty array');
          return result; // Return empty array
        } else {
          console.log('✅ Clients table is available');
          return true;
        }
        
      } catch (createError) {
        console.error('❌ Failed to check clients table:', createError);
        return [];
        
      } finally {
        this.isCreatingTable = false;
      }
    }
    
    return false;
  }
  
  async fetchClientsWithRetry(maxRetries = 2) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await this.supabase
          .from('clients')
          .select('*')
          .order('name');
        
        if (error) {
          if (error.code === 'PGRST205' && attempt === 1) {
            // Table doesn't exist, show helpful message
            const result = await this.handleClientsError(error);
            if (Array.isArray(result)) {
              return result; // Return empty array from ensureClientsTableExists
            }
            continue; // Retry if table was created
          }
          throw error;
        }
        
        return data || [];
        
      } catch (error) {
        console.error(`Clients fetch attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          // Return empty array as fallback
          return [];
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    return [];
  }
}

// Main tactical meeting form component with comprehensive sections
export function NewEmployeeForm({ currentUser = null, isManagerEdit = false, onBack = null, existingSubmission = null }) {
  // Get supabase instance (can be null in local mode)
  const supabase = useSupabase();
  
  // Employee sync hook
  const { getOrCreateEmployee: syncGetOrCreateEmployee } = useEmployeeSync();
  
  // Core state
  const [formData, setFormData] = useState({
    employee: { name: '', phone: '', department: 'Web', role: [] },
    monthKey: '',
    meta: {
      attendance: { wfo: 0, wfh: 0 },
      tasks: { count: 0, aiTableLink: '', aiTableScreenshot: '' }
    },
    clients: [],
    learning: [],
    aiUsageNotes: '',
    feedback: { company: '', hr: '', management: '' },
    isDraft: true
  });
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [lastSaved, setLastSaved] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepValidation, setStepValidation] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [previousSubmission, setPreviousSubmission] = useState(null);
  const [scores, setScores] = useState({ kpiScore: 0, learningScore: 0, relationshipScore: 0, overall: 0 });
  const [showScores, setShowScores] = useState(false);
  
  // Form steps configuration
  const FORM_STEPS = [
    { id: 1, title: "Profile & Month", icon: "👤", description: "Basic information and reporting period" },
    { id: 2, title: "Attendance & Tasks", icon: "📅", description: "Work attendance and task completion" },
    { id: 3, title: "KPI & Clients", icon: "📊", description: "Department metrics, client work and achievements" },
    { id: 4, title: "Learning & AI", icon: "🎓", description: "Learning activities and AI usage" },
    { id: 5, title: "Feedback & Review", icon: "💬", description: "Company feedback and final review" },
  ];
  
  // Hooks
  const { notify } = useToast();
  const { openModal, closeModal } = useModal();
  
  // Refs and managers
  const updateManagerRef = useRef(new FormUpdateManager());
  const persistenceRef = useRef(new RobustDataPersistence());
  const dbHandlerRef = useRef(null);
  const mountedRef = useRef(true);
  const errorHandlerRef = useRef(null);
  
  // Initialize error handler
  useEffect(() => {
    if (supabase && notify && openModal) {
      errorHandlerRef.current = createErrorHandler(supabase, notify, openModal);
    }
  }, [supabase, notify, openModal]);
  
  // Initialize database handler when supabase is available
  useEffect(() => {
    if (supabase && !dbHandlerRef.current) {
      dbHandlerRef.current = new DatabaseErrorHandler(supabase);
    }
  }, [supabase]);

  // Function to fetch previous month's submission data for task comparison
  const fetchPreviousSubmission = useCallback(async (employeeName, currentMonthKey) => {
    if (!supabase || !employeeName || !currentMonthKey) {
      setPreviousSubmission(null);
      return;
    }

    try {
      // Calculate previous month key
      const prevMonth = prevMonthKey(currentMonthKey);
      
      // Fetch previous submission
      const { data, error } = await supabase
        .from('submissions')
        .select('tasks_completed, meta')
        .eq('employee_name', employeeName)
        .eq('month_key', prevMonth)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.warn('Error fetching previous submission:', error);
        setPreviousSubmission(null);
        return;
      }

      if (data) {
        setPreviousSubmission({
          tasks_completed: data.tasks_completed || 0,
          meta: data.meta || { tasks: { count: 0 } }
        });
      } else {
        setPreviousSubmission(null);
      }
    } catch (error) {
      console.warn('Failed to fetch previous submission:', error);
      setPreviousSubmission(null);
    }
  }, [supabase]);

  // Fetch previous submission when employee name or month changes
  useEffect(() => {
    if (formData.employee.name && formData.monthKey) {
      fetchPreviousSubmission(formData.employee.name, formData.monthKey);
    } else {
      setPreviousSubmission(null);
    }
  }, [formData.employee.name, formData.monthKey, fetchPreviousSubmission]);

  // Calculate scores whenever form data changes
  useEffect(() => {
    const calculateScores = () => {
      const kpiScore = scoreKPIs(formData.employee, formData.clients, { monthKey: formData.monthKey });
      const learningScore = scoreLearning(formData.learning);
      const relationshipScore = scoreRelationshipFromClients(formData.clients);
      const overall = overallOutOf10({ kpiScore, learningScore, relationshipScore });
      
      setScores({ kpiScore, learningScore, relationshipScore, overall });
    };
    
    // Debounce score calculation to avoid excessive updates
    const timer = setTimeout(calculateScores, 500);
    return () => clearTimeout(timer);
  }, [formData.employee, formData.clients, formData.learning, formData.monthKey]);
  
  // Memoized values
  const userPhone = useMemo(() => {
    return currentUser?.phone || 'unknown';
  }, [currentUser]);
  
  const currentMonth = useMemo(() => {
    return prevMonthKey(thisMonthKey()); // Default to previous month for reporting
  }, []);
  
  const draftKey = useMemo(() => {
    return `employee_form_${userPhone}_${currentMonth}`;
  }, [userPhone, currentMonth]);
  
  // Step navigation functions with validation
  const nextStep = useCallback(() => {
    if (currentStep < FORM_STEPS.length) {
      // Validate current step before allowing progression
      const errors = [];
      
      if (currentStep === 1) {
        // Step 1: Profile & Month validation
        if (!formData.employee.name?.trim()) {
          errors.push('Employee name is required');
        }
        if (!formData.employee.phone?.trim()) {
          errors.push('Phone number is required');
        }
        if (!formData.employee.department) {
          errors.push('Department is required');
        }
        if (!formData.employee.role || formData.employee.role.length === 0) {
          errors.push('At least one role is required');
        }
        if (!formData.monthKey) {
          errors.push('Month selection is required');
        }
      } else if (currentStep === 2) {
        // Step 2: Attendance & Tasks validation
        const wfo = formData.meta?.attendance?.wfo || 0;
        const wfh = formData.meta?.attendance?.wfh || 0;
        const tasks = formData.meta?.tasks?.count || 0;
        const maxWorkingDays = workingDaysInMonth(formData.monthKey);
        const totalDays = daysInMonth(formData.monthKey);
        
        if (wfo < 0 || wfo > maxWorkingDays) {
          errors.push(`Work from office days must be between 0 and ${maxWorkingDays} working days (${totalDays} total days)`);
        }
        if (wfh < 0 || wfh > maxWorkingDays) {
          errors.push(`Work from home days must be between 0 and ${maxWorkingDays} working days (${totalDays} total days)`);
        }
        if (wfo + wfh > maxWorkingDays) {
          errors.push(`Total attendance days cannot exceed ${maxWorkingDays} working days (${totalDays} total days)`);
        }
        if (tasks < 0) {
          errors.push('Task count cannot be negative');
        }
        
        // Check for AI Table Link URL validation if provided
        const aiLink = formData.meta?.tasks?.proof;
        if (aiLink && aiLink.trim()) {
          try {
            new URL(aiLink);
          } catch {
            errors.push('AI Table Link must be a valid URL');
          }
        }
      }
      
      // If there are validation errors, show them and block navigation
      if (errors.length > 0) {
        openModal(
          'Please Fix Required Fields',
          `Please correct the following issues before proceeding:\n\n${errors.join('\n')}`,
          closeModal,
          null,
          'OK',
          ''
        );
        return; // Block navigation
      }
      
      // Allow progression if validation passes
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, FORM_STEPS.length, formData, openModal, closeModal]);
  
  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);
  
  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= FORM_STEPS.length) {
      setCurrentStep(step);
    }
  }, [FORM_STEPS.length]);
  
  // Initialize form
  useEffect(() => {
    let isCancelled = false;
    
    const initializeForm = async () => {
      try {
        setIsLoading(true);
        
        // Initialize form with existing submission data if provided
        if (existingSubmission && !isCancelled) {
          setFormData(prev => ({
            ...prev,
            employee: {
              name: existingSubmission.employee_name || existingSubmission.employee?.name || '',
              phone: existingSubmission.employee_phone || existingSubmission.employee?.phone || '',
              department: existingSubmission.department || existingSubmission.employee?.department || 'Web',
              role: existingSubmission.roles || existingSubmission.employee?.role || []
            },
            monthKey: existingSubmission.month_key || existingSubmission.monthKey || currentMonth,
            meta: {
              attendance: {
                wfo: existingSubmission.attendance_wfo || 0,
                wfh: existingSubmission.attendance_wfh || 0
              },
              tasks: {
                count: existingSubmission.tasks_completed || 0,
                aiTableLink: existingSubmission.ai_table_link || '',
                aiTableScreenshot: existingSubmission.ai_table_screenshot || ''
              }
            },
            clients: existingSubmission.clients || [],
            learning: existingSubmission.learning_activities || [],
            aiUsageNotes: existingSubmission.ai_usage_notes || '',
            feedback: {
              company: existingSubmission.feedback_company || '',
              hr: existingSubmission.feedback_hr || '',
              management: existingSubmission.feedback_management || ''
            },
            isDraft: false // Existing submissions are not drafts
          }));
          setSelectedEmployee({
            name: existingSubmission.employee_name || existingSubmission.employee?.name || '',
            phone: existingSubmission.employee_phone || existingSubmission.employee?.phone || '',
            department: existingSubmission.department || existingSubmission.employee?.department || 'Web',
            role: existingSubmission.roles || existingSubmission.employee?.role || []
          });
        }
        // Initialize form with current user data if available
        else if (currentUser && !isCancelled) {
          setFormData(prev => ({
            ...prev,
            employee: {
              name: currentUser.name || '',
              phone: currentUser.phone || '',
              department: currentUser.department || 'Web',
              role: currentUser.role || []
            },
            monthKey: currentMonth
          }));
        } else if (!isCancelled) {
          // Set default month for new forms
          setFormData(prev => ({
            ...prev,
            monthKey: currentMonth
          }));
        }
        
        // Load clients with error handling
        if (dbHandlerRef.current) {
          const clientsData = await dbHandlerRef.current.fetchClientsWithRetry();
          if (!isCancelled) {
            setClients(clientsData);
            
            // Process existing submission clients with priority system
            if (existingSubmission && existingSubmission.clients) {
              const processedClients = await clientDataPriorityService.processClientListWithPriority(
                existingSubmission.clients,
                clientsData
              );
              
              setFormData(prev => ({
                ...prev,
                clients: processedClients
              }));
            }
          }
        } else {
          // Local mode: no database connection
          setClients([]);
        }
        
        // Load draft data
        const draftData = persistenceRef.current.load(draftKey);
        if (!isCancelled && draftData) {
          setFormData(draftData);
          setLastSaved(new Date(draftData.timestamp));
        }
        
      } catch (error) {
        console.error('Form initialization error:', error);
        if (!isCancelled) {
          setErrors({ init: 'Failed to initialize form' });
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };
    
    // Initialize form - handle both Supabase and local mode
    if (supabase && dbHandlerRef.current) {
      // Supabase mode with database handler ready
      initializeForm();
    } else if (supabase && !dbHandlerRef.current) {
      // Supabase mode but handler not ready, wait a bit
      const timer = setTimeout(() => {
        if (dbHandlerRef.current && !isCancelled) {
          initializeForm();
        }
      }, 100);
      return () => {
        clearTimeout(timer);
        isCancelled = true;
      };
    } else if (supabase === null) {
      // Local mode - no database connection
      initializeForm();
    }
    // If supabase is undefined, we're still waiting for provider to initialize
    
    return () => {
      isCancelled = true;
    };
  }, [draftKey, supabase]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      updateManagerRef.current.flushAll();
      updateManagerRef.current.clear();
    };
  }, []);
  
  // Auto-save function
  const autoSave = useCallback(async (data) => {
    if (!mountedRef.current) return;
    
    try {
      setIsSaving(true);
      const success = await persistenceRef.current.save(draftKey, data);
      
      if (success && mountedRef.current) {
        setLastSaved(new Date());
        setErrors(prev => ({ ...prev, save: null }));
      } else if (mountedRef.current) {
        setErrors(prev => ({ ...prev, save: 'Auto-save failed' }));
      }
      
    } catch (error) {
      console.error('Auto-save error:', error);
      if (mountedRef.current) {
        setErrors(prev => ({ ...prev, save: 'Auto-save error' }));
      }
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [draftKey]);
  
  // Update form data with debouncing
  const updateFormData = useCallback((field, value, priority = 'normal') => {
    // 🚨 CRITICAL DEBUG: updateFormData function
    if (field === 'meta' && value?.attendance?.wfo !== undefined) {
      console.log('🚨 updateFormData called for WFO:', {
        field,
        value,
        wfoValue: value.attendance.wfo,
        wfoType: typeof value.attendance.wfo,
        wfoNumeric: Number(value.attendance.wfo)
      });
      
      // Check for multiplication bug
      if (value.attendance.wfo === '3' && Number(value.attendance.wfo) === 30) {
        console.error('🚨🚨🚨 MULTIPLICATION BUG in updateFormData!');
        console.error('WFO value "3" converts to 30!');
        console.trace('Stack trace for multiplication bug');
        debugger;
      }
    }
    
    setFormData(prev => {
      // Ensure meta structure is preserved
      const newData = { ...prev };
      
      if (field === 'meta') {
        // Deep merge meta object to preserve nested structure
        newData.meta = {
          attendance: { wfo: 0, wfh: 0, ...prev.meta?.attendance },
          tasks: { count: 0, aiTableLink: '', aiTableScreenshot: '', ...prev.meta?.tasks },
          ...value
        };
        
        // 🚨 CRITICAL DEBUG: Check final WFO value in state
        if (value?.attendance?.wfo !== undefined) {
          console.log('🚨 updateFormData final state WFO:', {
            originalWfo: value.attendance.wfo,
            finalWfo: newData.meta.attendance.wfo,
            finalType: typeof newData.meta.attendance.wfo,
            finalNumeric: Number(newData.meta.attendance.wfo)
          });
        }
      } else {
        newData[field] = value;
      }
      
      // Schedule auto-save
      updateManagerRef.current.scheduleUpdate(
        `autosave_${field}`,
        newData,
        priority,
        autoSave
      );
      
      return newData;
    });
  }, [autoSave]);
  
  // Input change handlers
  const handleInputChange = useCallback((field, priority = 'normal') => {
    return (e) => {
      const value = e.target.value;
      updateFormData(field, value, priority);
    };
  }, [updateFormData]);
  
  // Submit handler
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    try {
      setIsSaving(true);
      updateManagerRef.current.flushAll();
      
      // Validate required fields
      const newErrors = {};
      
      // Validate employee info
      if (!formData.employee.name?.trim()) {
        newErrors.employeeName = 'Employee name is required';
      }
      if (!formData.employee.phone?.trim()) {
        newErrors.employeePhone = 'Phone number is required';
      }
      if (!formData.employee.department) {
        newErrors.department = 'Department is required';
      }
      if (!formData.employee.role || formData.employee.role.length === 0) {
        newErrors.role = 'At least one role is required';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        notify('Please fill in all required fields', 'error');
        return;
      }
      
      // Calculate final scores with discipline penalty
      const submittedAt = new Date().toISOString();
      let finalScores = { ...scores };
      let disciplineInfo = null;
      
      try {
        disciplineInfo = computeDisciplinePenalty(formData.monthKey, submittedAt);
        const adjustedOverall = Math.max(0, scores.overall - (disciplineInfo.penalty || 0));
        finalScores = { ...scores, overall: adjustedOverall };
      } catch (e) {
        console.warn('Discipline penalty calculation failed:', e);
      }
      
      // Prepare submission data
      const submissionData = {
        employee_name: formData.employee.name,
        employee_phone: formData.employee.phone,
        department: formData.employee.department,
        role: formData.employee.role,
        month_key: formData.monthKey,
        attendance_wfo: formData.meta.attendance.wfo,
        attendance_wfh: formData.meta.attendance.wfh,
        tasks_completed: formData.meta.tasks.count,
        ai_table_link: formData.meta.tasks.aiTableLink,
        clients: formData.clients,
        learning_activities: formData.learning,
        ai_usage_notes: formData.aiUsageNotes,
        feedback_company: formData.feedback.company,
        feedback_hr: formData.feedback.hr,
        feedback_management: formData.feedback.management,
        user_phone: userPhone,
        submitted_at: submittedAt,
        scores: finalScores,
        discipline: disciplineInfo,
        kpi_score: finalScores.kpiScore,
        learning_score: finalScores.learningScore,
        relationship_score: finalScores.relationshipScore,
        overall_score: finalScores.overall
      };
      
      // Submit to database if available
      if (supabase) {
        // Ensure employees table exists
        await ensureEmployeesTableExists(supabase);
        
        // Create or update employee record
        const employeeData = {
          name: formData.employee.name,
          phone: formData.employee.phone,
          department: formData.employee.department,
          role: formData.employee.role
        };
        
        try {
          await getOrCreateEmployee(supabase, employeeData);
        } catch (employeeError) {
          console.warn('Failed to save employee data:', employeeError);
          // Continue with submission even if employee save fails
        }
        
        // Submit to submissions table using enhanced error handler
        if (errorHandlerRef.current) {
          const validationRules = {
            required: ['employee_name', 'employee_phone', 'department', 'role', 'month_key'],
            custom: [
              (data) => {
                if (data.employee_phone && !/^[\d\s\-\+\(\)]+$/.test(data.employee_phone)) {
                  return 'Please enter a valid phone number';
                }
                return true;
              }
            ]
          };
          
          const result = await errorHandlerRef.current.form.submitForm(submissionData, {
            tableName: 'submissions',
            operation: existingSubmission ? 'update' : 'insert',
            validationRules,
            showSuccessModal: false, // We'll show our custom modal
            onError: (error) => {
              console.error('Enhanced error handler caught:', error);
              setErrors({ submit: 'Failed to submit form' });
            }
          });
          
          if (!result.success) {
            throw new Error('Form submission failed');
          }
        } else {
          // Fallback to original logic if error handler not available
          if (existingSubmission) {
            const { error } = await supabase
              .from('submissions')
              .update(submissionData)
              .eq('id', existingSubmission.id);
            
            if (error) {
              throw new Error(`Database update error: ${error.message}`);
            }
          } else {
            const { error } = await supabase
              .from('submissions')
              .insert([submissionData]);
            
            if (error) {
              throw new Error(`Database error: ${error.message}`);
            }
          }
        }
      } else {
        // In local mode, use employee sync context
        try {
          await syncGetOrCreateEmployee({
            name: formData.employee.name,
            phone: formData.employee.phone,
            department: formData.employee.department,
            role: formData.employee.role
          });
        } catch (employeeError) {
          console.warn('Failed to save employee data locally:', employeeError);
        }
      }
      
      // Clear draft on successful submission
      persistenceRef.current.clear(draftKey);
      setLastSaved(null);
      
      // Trigger data sync to update dashboards
      try {
        const submissionHandler = createSubmissionHandler(globalSyncManager);
        await submissionHandler.handleSubmission(submissionData, {
          operation: existingSubmission ? 'update' : 'create',
          employeeData: {
            name: formData.employee.name,
            phone: formData.employee.phone,
            department: formData.employee.department
          }
        });
      } catch (syncError) {
        console.warn('Data sync failed:', syncError);
        // Don't fail the submission for sync errors
      }
      
      // Show success notification with scores
      const successMessage = existingSubmission ? 'Tactical meeting form updated successfully!' : 'Tactical meeting form submitted successfully!';
      notify(successMessage, 'success');
      
      // Show scores modal
      openModal({
        title: '🎯 Performance Scores',
        content: (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Your {monthLabel(formData.monthKey)} Performance Report
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{finalScores.kpiScore.toFixed(1)}/10</div>
                <div className="text-sm text-gray-600">KPI Performance</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{finalScores.learningScore.toFixed(1)}/10</div>
                <div className="text-sm text-gray-600">Learning & Development</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{finalScores.relationshipScore.toFixed(1)}/10</div>
                <div className="text-sm text-gray-600">Client Relationships</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-orange-600">{finalScores.overall.toFixed(1)}/10</div>
                <div className="text-sm text-gray-600 font-medium">Overall Score</div>
              </div>
            </div>
            
            {disciplineInfo && disciplineInfo.penalty > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-sm text-yellow-800">
                  <strong>Late Submission Penalty:</strong> -{disciplineInfo.penalty} points
                  <br />
                  <span className="text-xs">Submitted {disciplineInfo.daysLate} day(s) after deadline</span>
                </div>
              </div>
            )}
            
            {finalScores.overall >= 8 && (
              <div className="text-center">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-green-600 font-semibold">Outstanding Performance!</div>
                <div className="text-sm text-gray-600">Keep up the excellent work!</div>
              </div>
            )}
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">What's Next?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Your scores will be reviewed by management</li>
                <li>• Feedback will be provided during your tactical meeting</li>
                <li>• These scores contribute to your performance appraisal</li>
                <li>• You can view detailed analytics in your employee dashboard</li>
              </ul>
            </div>
          </div>
        ),
        actions: [
          {
            label: 'View Dashboard',
            onClick: () => {
              closeModal();
              if (onBack) onBack();
            },
            variant: 'primary'
          },
          {
            label: 'Close',
            onClick: closeModal,
            variant: 'secondary'
          }
        ]
      });
      
      // Don't navigate away immediately, let user see the scores first
      
    } catch (error) {
      console.error('Submit error:', error);
      
      // Use enhanced error handler if available
      if (errorHandlerRef.current) {
        await errorHandlerRef.current.database.handleError(error, 'form submission', { formData: submissionData });
      } else {
        // Fallback error handling
        setErrors({ submit: 'Failed to submit form' });
        notify('Failed to submit form. Please try again.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  }, [formData, userPhone, draftKey, supabase, notify, onBack]);
  
  // Render current step content
  const renderCurrentStep = () => {
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
        return renderProfileStep();
    }
  };

  // Step 1: Profile & Month
  const renderProfileStep = () => (
    <Section title="Profile & Month Selection" icon="👤">
      <div className="space-y-6">
        <StepValidationIndicator 
          errors={[]}
          warnings={[]}
          stepTitle="Profile & Month Selection"
        />
        
        {/* Form Instructions */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 border border-blue-200 rounded-xl">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">📋 Employee Performance Data Collection Form</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>Purpose:</strong> Collect monthly performance data for employee evaluation and development tracking.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div>
              <p><strong>🔹 Required Steps:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Select employee and reporting period</li>
                <li>Record attendance and task completion</li>
                <li>Document KPI achievements and client work</li>
                <li>Log learning activities with evidence</li>
                <li>Provide comparative feedback ratings</li>
              </ul>
            </div>
            <div>
              <p><strong>🔹 Important Notes:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>All fields marked with * are mandatory</li>
                <li>Data should reflect the selected month period</li>
                <li>Save drafts frequently to prevent data loss</li>
                <li>Review all sections before final submission</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EmployeeDropdown
          value={formData.employee.name}
          onChange={(name) => {
            if (!selectedEmployee) {
              updateFormData('employee', { ...formData.employee, name: name });
            }
          }}
          onEmployeeSelect={(employee) => {
            setSelectedEmployee(employee);
            if (employee) {
              // Auto-populate all employee fields
              updateFormData('employee', {
                name: employee.name,
                phone: employee.phone || formData.employee.phone,
                department: employee.department || formData.employee.department,
                role: employee.role || formData.employee.role
              });
              // Fetch previous submission data for task comparison
              fetchPreviousSubmission(employee.name, formData.monthKey);
            } else {
              // Clear auto-populated data but keep manually entered data
              updateFormData('employee', {
                ...formData.employee,
                name: formData.employee.name
              });
              setPreviousSubmission(null);
            }
          }}
          placeholder="Select or type employee name..."
          required
        />
        
        <TextField
          label="Phone Number"
          value={formData.employee.phone}
          onChange={(value) => updateFormData('employee', { ...formData.employee, phone: value })}
          placeholder="Enter your phone number"
          required
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
          <select
            value={formData.employee.department}
            onChange={(e) => updateFormData('employee', { ...formData.employee, department: e.target.value, role: [] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employee Roles *
            <span className="text-sm font-normal text-gray-500 block mt-1">
              Select all applicable roles for this employee (multiple selections allowed)
            </span>
          </label>
          <MultiSelect
            options={ROLES_BY_DEPT[formData.employee.department] || []}
            value={formData.employee.role}
            onChange={(value) => updateFormData('employee', { ...formData.employee, role: value })}
            placeholder="Select one or more roles..."
            required
            allowCustom={true}
            customPlaceholder="Enter custom role..."
          />
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-700">
              <strong>📋 Role Selection Tips:</strong><br/>
              • Select primary role first, then additional responsibilities<br/>
              • Multiple roles help track cross-functional contributions<br/>
              • Contact HR if your role is not listed
            </p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Collection Period *
            <span className="text-sm font-normal text-gray-500 block mt-1">
              Select the month you are reporting data FOR (typically previous month)
            </span>
          </label>
          <select
            value={formData.monthKey}
            onChange={(e) => updateFormData('monthKey', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value={prevMonthKey(thisMonthKey())}>
              {monthLabel(prevMonthKey(thisMonthKey()))} (Recommended - Previous Month)
            </option>
            <option value={thisMonthKey()}>
              {monthLabel(thisMonthKey())} (Current Month - In Progress)
            </option>
          </select>
          <div className="mt-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-700">
              <strong>💡 Data Collection Guide:</strong><br/>
              • <strong>Previous Month:</strong> Complete retrospective analysis with full data<br/>
              • <strong>Current Month:</strong> Ongoing tracking (data may be incomplete)
            </p>
          </div>
        </div>
      </div>
      </div>
    </Section>
  );

  // Step 2: Attendance & Tasks
  const renderAttendanceStep = () => (
    <Section title="Attendance & Task Management" icon="📅">
      <div className="space-y-6">
        <StepValidationIndicator 
          errors={[]}
          warnings={[]}
          stepTitle="Attendance & Tasks"
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProgressIndicator 
            current={Number(formData.meta.attendance.wfo || 0) + Number(formData.meta.attendance.wfh || 0)}
            target={workingDaysInMonth(formData.monthKey)}
            label="Monthly Attendance Progress (Working Days)"
            unit=" days"
            color="blue"
            previousValue={previousSubmission ? (Number(previousSubmission.meta?.attendance?.wfo || 0) + Number(previousSubmission.meta?.attendance?.wfh || 0)) : null}
            showTrend={!!previousSubmission}
            monthComparison={previousSubmission ? prevMonthKey : null}
          />
          
          <ProgressIndicator 
            current={formData.meta.tasks.count || 0}
            target={Math.max(previousSubmission?.tasks_completed || previousSubmission?.meta?.tasks?.count || 50, 30)}
            label="Task Completion Progress"
            unit=" tasks"
            color="green"
            previousValue={previousSubmission?.tasks_completed || previousSubmission?.meta?.tasks?.count || null}
            showTrend={!!previousSubmission}
            monthComparison={previousSubmission ? prevMonthKey : null}
          />
        </div>
        
        {/* Enhanced Task Progress Analytics */}
        <TaskProgressTracker 
          currentTasks={formData.meta.tasks.count || 0}
          previousTasks={previousSubmission?.tasks_completed || previousSubmission?.meta?.tasks?.count || 0}
          targetTasks={Math.max(previousSubmission?.tasks_completed || previousSubmission?.meta?.tasks?.count || 50, 30)}
          monthKey={thisMonthKey}
          previousMonthKey={prevMonthKey}
          department={formData.department}
          employeeName={formData.employeeName}
          onTargetUpdate={(newTarget) => {
            // Update the target in the form data or local state
            console.log('Target updated to:', newTarget);
          }}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NumField
          label="Work From Office Days"
          value={formData.meta.attendance.wfo}
          onChange={(value) => {
            // 🚨 CRITICAL DEBUG: NewEmployeeForm WFO onChange
            console.log('🚨 NewEmployeeForm WFO onChange received:', { 
              value, 
              type: typeof value, 
              numericValue: Number(value) 
            });
            
            // Check for multiplication bug
            if (value === '3' && Number(value) === 30) {
              console.error('🚨🚨🚨 MULTIPLICATION BUG in NewEmployeeForm onChange!');
              console.error('Received value "3" but Number(value) is 30!');
              console.trace('Stack trace for multiplication bug');
              debugger;
            }
            
            const numValue = Number(value);
            const maxWorkingDays = workingDaysInMonth(formData.monthKey);
            const totalDays = daysInMonth(formData.monthKey);
            
            console.log('🚨 NewEmployeeForm WFO processing:', {
              originalValue: value,
              numValue,
              maxWorkingDays,
              totalDays,
              willUpdate: value === '' || (numValue >= 0 && numValue <= maxWorkingDays)
            });
            
            if (value === '' || (numValue >= 0 && numValue <= maxWorkingDays)) {
              console.log('🚨 NewEmployeeForm calling updateFormData with:', { wfo: value });
              updateFormData('meta', { 
                ...formData.meta, 
                attendance: { ...formData.meta.attendance, wfo: value }
              });
            }
          }}
          min={0}
          max={workingDaysInMonth(formData.monthKey)}
          validateOnChange={true}
          error={formData.meta.attendance.wfo && (Number(formData.meta.attendance.wfo) < 0 || Number(formData.meta.attendance.wfo) > workingDaysInMonth(formData.monthKey)) ? `Must be between 0 and ${workingDaysInMonth(formData.monthKey)} working days (${daysInMonth(formData.monthKey)} total days)` : null}
        />
        
        <NumField
          label="Work From Home Days"
          value={formData.meta.attendance.wfh}
          onChange={(value) => {
            const numValue = Number(value);
            const maxWorkingDays = workingDaysInMonth(formData.monthKey);
            if (value === '' || (numValue >= 0 && numValue <= maxWorkingDays)) {
              updateFormData('meta', { 
                ...formData.meta, 
                attendance: { ...formData.meta.attendance, wfh: value }
              });
            }
          }}
          min={0}
          max={workingDaysInMonth(formData.monthKey)}
          validateOnChange={true}
          error={formData.meta.attendance.wfh && (Number(formData.meta.attendance.wfh) < 0 || Number(formData.meta.attendance.wfh) > workingDaysInMonth(formData.monthKey)) ? `Must be between 0 and ${workingDaysInMonth(formData.monthKey)} working days (${daysInMonth(formData.monthKey)} total days)` : null}
          warning={(Number(formData.meta.attendance.wfo || 0) + Number(formData.meta.attendance.wfh || 0)) > workingDaysInMonth(formData.monthKey) ? 'Total WFO + WFH days exceed working days' : null}
        />
        
        <NumField
          label="Total Tasks Completed"
          value={formData.meta.tasks.count}
          onChange={(value) => {
            const numValue = Number(value);
            if (value === '' || numValue >= 0) {
              updateFormData('meta', { 
                ...formData.meta, 
                tasks: { ...formData.meta.tasks, count: value }
              });
            }
          }}
          min={0}
          validateOnChange={true}
          error={formData.meta.tasks.count && Number(formData.meta.tasks.count) < 0 ? 'Must be 0 or greater' : null}
          warning={formData.meta.tasks.count && Number(formData.meta.tasks.count) === 0 ? 'Consider entering completed tasks for better tracking' : null}
        />
        
        <TextField
          label="AI Table Link (Optional)"
          value={formData.meta.tasks.aiTableLink}
          onChange={(value) => updateFormData('meta', { 
            ...formData.meta, 
            tasks: { ...formData.meta.tasks, aiTableLink: value }
          })}
          placeholder="https://..."
          validateOnChange={true}
          error={formData.meta.tasks.aiTableLink && formData.meta.tasks.aiTableLink.trim() && !isValidUrl(formData.meta.tasks.aiTableLink) ? 'Please enter a valid URL (e.g., https://example.com)' : null}
        />
        </div>
      </div>
    </Section>
  );

  // Step 3: KPI & Clients
  const renderKPIStep = () => {
    return (
      <div className="space-y-6">
        <StepValidationIndicator 
          errors={[]}
          warnings={[]}
          stepTitle="KPI & Clients"
        />
        
        <DeptClientsBlock 
          currentSubmission={formData} 
          previousSubmission={previousSubmission}
          comparisonSubmission={previousSubmission}
          setModel={setFormData} 
          monthPrev={prevMonthKey} 
          monthThis={thisMonthKey}
          monthComparison={prevMonthKey}
          openModal={openModal} 
          closeModal={closeModal} 
        />
      </div>
    );
  };

  // Step 4: Learning & AI
  const renderLearningStep = () => {
    const learningHours = (formData.learning || []).reduce((sum, l) => sum + (l.durationMins || 0), 0) / 60;
    
    return (
      <div className="space-y-6">
        <StepValidationIndicator 
          errors={[]}
          warnings={[]}
          stepTitle="Learning & Development"
        />
        
        <ProgressIndicator 
          current={learningHours}
          target={6}
          label="Learning Hours Progress"
          unit="h"
          color="green"
          previousValue={previousSubmission ? (previousSubmission.learning || []).reduce((sum, l) => sum + (l.durationMins || 0), 0) / 60 : null}
          showTrend={!!previousSubmission}
          monthComparison={previousSubmission ? prevMonthKey : null}
        />
        
        <LearningBlock model={formData} setModel={setFormData} openModal={openModal} />
        
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
            value={formData.aiUsageNotes}
            onChange={e => updateFormData('aiUsageNotes', e.target.value)}
          />
        </div>
      </div>
    );
  };

  // Step 5: Feedback & Review
  const renderFeedbackStep = () => (
    <Section title="Feedback & Self-Assessment" icon="💬">
      <div className="space-y-6">
        <StepValidationIndicator 
          errors={[]}
          warnings={[]}
          stepTitle="Feedback & Self-Assessment"
        />
        
        <div className="bg-white border rounded-xl p-6">
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
            value={formData.feedback.comprehensive || formData.feedback.company || ''}
            onChange={(value) => updateFormData('feedback', {
              ...formData.feedback,
              comprehensive: value,
              // Keep legacy fields for backward compatibility
              company: value,
              hr: value,
              management: value
            })}
            placeholder="Please provide detailed feedback covering:\n\n1. COMPANY FEEDBACK: What's working well? What could be improved in company culture, processes, or policies?\n\n2. HR & MANAGEMENT: Thoughts on HR support, management guidance, and communication?\n\n3. CHALLENGES: Any obstacles or challenges hindering your work or growth?\n\n4. SELF-ASSESSMENT: Rate your overall performance this month (1-10) and explain your reasoning. Include specific achievements, areas where you excelled, and areas for improvement.\n\n5. SUGGESTIONS: Any recommendations for improving the work environment or processes?"
            rows={12}
          />
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Form Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Employee:</span>
              <p className="text-gray-600">{formData.employee.name || 'Not set'}</p>
            </div>
            <div>
              <span className="font-medium">Department:</span>
              <p className="text-gray-600">{formData.employee.department}</p>
            </div>
            <div>
              <span className="font-medium">Month:</span>
              <p className="text-gray-600">{monthLabel(formData.monthKey)}</p>
            </div>
            <div>
              <span className="font-medium">Clients:</span>
              <p className="text-gray-600">{formData.clients.length} projects</p>
            </div>
          </div>
        </div>
        
        {/* Performance Preview */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              📊 Performance Preview
            </h4>
            <button
              type="button"
              onClick={() => setShowScores(!showScores)}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
            >
              {showScores ? 'Hide Scores' : 'Show Scores'}
            </button>
          </div>
          
          {showScores && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{scores.kpiScore.toFixed(1)}/10</div>
                <div className="text-sm text-gray-600 font-medium">KPI Score</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-100 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{scores.learningScore.toFixed(1)}/10</div>
                <div className="text-sm text-gray-600 font-medium">Learning</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{scores.relationshipScore.toFixed(1)}/10</div>
                <div className="text-sm text-gray-600 font-medium">Client Relations</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-100 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{scores.overall.toFixed(1)}/10</div>
                <div className="text-sm text-gray-600 font-medium">Overall</div>
              </div>
            </div>
          )}
          
          {!showScores && (
            <div className="text-center text-gray-600">
              <p className="text-sm">Your performance scores will be calculated and displayed after submission.</p>
              <p className="text-xs mt-1">Click "Show Scores" above for a preview based on current data.</p>
            </div>
          )}
          
          {showScores && scores.overall >= 8 && (
            <div className="mt-4 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-green-600 font-semibold">Excellent performance preview!</div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tactical meeting form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Enhanced Header - Mobile Optimized */}
          <div className="bg-blue-600 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm self-start">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">Employee Tactical Meeting Form</h1>
                  <p className="text-blue-100 text-xs sm:text-sm mt-1 leading-relaxed">Complete your monthly performance review and goal tracking</p>
                </div>
                {existingSubmission && (
                  <div className="px-3 py-2 bg-amber-400/20 text-amber-100 text-xs sm:text-sm font-medium rounded-full border border-amber-300/30 backdrop-blur-sm self-start sm:self-center">
                    <span className="flex items-center gap-2">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.828-2.828z" />
                      </svg>
                      <span className="hidden sm:inline">Editing </span>{monthLabel(existingSubmission.month_key || existingSubmission.monthKey)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                {isSaving && (
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white/30 border-t-white"></div>
                    <span className="text-white font-medium text-xs sm:text-sm">Saving...</span>
                  </div>
                )}
                {lastSaved && (
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-white text-xs sm:text-sm font-medium">
                      <span className="hidden sm:inline">Saved </span>{lastSaved.toLocaleTimeString()}
                    </span>
                  </div>
                )}
                {errors.save && (
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-white text-xs sm:text-sm font-medium">{errors.save}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Enhanced Step Progress - Mobile Optimized */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-white/50 backdrop-blur-sm border-b border-gray-200/50">
            <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 gap-3 sm:gap-6">
              {FORM_STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1 min-w-0">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => goToStep(step.id)}
                      className={`relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 transform active:scale-95 sm:hover:scale-105 touch-manipulation ${
                        currentStep === step.id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : currentStep > step.id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md border border-gray-200'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        step.id
                      )}
                      {currentStep === step.id && (
                        <div className="absolute -inset-1 bg-blue-600 rounded-lg sm:rounded-xl blur opacity-30 animate-pulse"></div>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs sm:text-sm font-semibold transition-colors truncate ${
                        currentStep === step.id ? 'text-blue-700' : currentStep > step.id ? 'text-emerald-700' : 'text-gray-700'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 hidden sm:block leading-relaxed">{step.description}</div>
                      {currentStep === step.id && (
                        <div className="mt-1 sm:mt-2 h-0.5 sm:h-1 bg-blue-600 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>
                  {index < FORM_STEPS.length - 1 && (
                    <div className="hidden lg:flex items-center mx-4">
                      <div className={`h-0.5 w-16 transition-all duration-500 ${
                        currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                      }`}>
                        {currentStep > step.id && (
                          <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <svg className={`w-4 h-4 ml-2 transition-colors ${
                        currentStep > step.id ? 'text-emerald-600' : 'text-gray-300'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        {/* Enhanced Form Content - Mobile Optimized */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-6 lg:p-8">
                {renderCurrentStep()}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation - Mobile Optimized */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200/50 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-4xl mx-auto flex flex-col space-y-3 sm:space-y-0 sm:flex-row justify-between items-center gap-4">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="w-full sm:w-auto group flex items-center justify-center gap-3 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md touch-manipulation"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Previous Step</span>
              <span className="sm:hidden">Previous</span>
            </button>
            
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 order-first sm:order-none">
              <span>Step {currentStep} of {FORM_STEPS.length}</span>
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / FORM_STEPS.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="w-full sm:w-auto flex gap-3">
              {currentStep < FORM_STEPS.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 sm:flex-none group flex items-center justify-center gap-3 px-6 sm:px-8 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 border border-transparent rounded-lg sm:rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 touch-manipulation"
                >
                  <span className="hidden sm:inline">Continue</span>
                  <span className="sm:hidden">Next</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none group flex items-center justify-center gap-3 px-6 sm:px-8 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg sm:rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none touch-manipulation"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                      <span className="hidden sm:inline">Submitting...</span>
                      <span className="sm:hidden">Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="hidden sm:inline">Submit Report</span>
                      <span className="sm:hidden">Submit</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default NewEmployeeForm;