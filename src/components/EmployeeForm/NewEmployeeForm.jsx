import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSupabase } from '../SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { useModal } from '@/shared/components/ModalContext';
import { useEmployeeSync } from '@/features/employees/context/EmployeeSyncContext';
import { DEPARTMENTS, ROLES_BY_DEPT, thisMonthKey, prevMonthKey, monthLabel, daysInMonth } from '@/shared/lib/constants';
import { Section, TextField, NumField, TextArea, MultiSelect, ProgressIndicator, StepValidationIndicator, ThreeWayComparativeField } from '@/shared/components/ui';
import EmployeeDropdown from '@/shared/components/EmployeeDropdown';
import ClientDropdown from '@/shared/components/ClientDropdown';
import { ensureClientsTableExists } from '../../utils/createClientsTable.js';
import { ensureEmployeesTableExists, getOrCreateEmployee } from '../../utils/createEmployeesTable.js';

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
  
  // Initialize database handler when supabase is available
  useEffect(() => {
    if (supabase && !dbHandlerRef.current) {
      dbHandlerRef.current = new DatabaseErrorHandler(supabase);
    }
  }, [supabase]);
  
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
  
  // Step navigation functions
  const nextStep = useCallback(() => {
    if (currentStep < FORM_STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, FORM_STEPS.length]);
  
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
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
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
        submitted_at: new Date().toISOString()
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
        
        // Submit to submissions table
         if (existingSubmission) {
           // Update existing submission
           const { error } = await supabase
             .from('submissions')
             .update(submissionData)
             .eq('id', existingSubmission.id);
           
           if (error) {
             throw new Error(`Database update error: ${error.message}`);
           }
         } else {
           // Insert new submission
           const { error } = await supabase
             .from('submissions')
             .insert([submissionData]);
           
           if (error) {
             throw new Error(`Database error: ${error.message}`);
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
      
      notify(existingSubmission ? 'Tactical meeting form updated successfully!' : 'Tactical meeting form submitted successfully!', 'success');
      
      // Reset form or navigate away
      if (onBack) {
        onBack();
      }
      
    } catch (error) {
      console.error('Submit error:', error);
      setErrors({ submit: 'Failed to submit form' });
      notify('Failed to submit form. Please try again.', 'error');
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
            } else {
              // Clear auto-populated data but keep manually entered data
              updateFormData('employee', {
                ...formData.employee,
                name: formData.employee.name
              });
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Role(s)</label>
          <MultiSelect
            options={ROLES_BY_DEPT[formData.employee.department] || []}
            value={formData.employee.role}
            onChange={(value) => updateFormData('employee', { ...formData.employee, role: value })}
            placeholder="Select your role(s)"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reporting Month</label>
          <select
            value={formData.monthKey}
            onChange={(e) => updateFormData('monthKey', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={prevMonthKey(thisMonthKey())}>{monthLabel(prevMonthKey(thisMonthKey()))}</option>
            <option value={thisMonthKey()}>{monthLabel(thisMonthKey())}</option>
          </select>
        </div>
      </div>
    </Section>
  );

  // Step 2: Attendance & Tasks
  const renderAttendanceStep = () => (
    <Section title="Attendance & Task Management" icon="📅">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NumField
          label="Work From Office Days"
          value={formData.meta.attendance.wfo}
          onChange={(value) => updateFormData('meta', { 
            ...formData.meta, 
            attendance: { ...formData.meta.attendance, wfo: value }
          })}
          min={0}
          max={daysInMonth(formData.monthKey)}
        />
        
        <NumField
          label="Work From Home Days"
          value={formData.meta.attendance.wfh}
          onChange={(value) => updateFormData('meta', { 
            ...formData.meta, 
            attendance: { ...formData.meta.attendance, wfh: value }
          })}
          min={0}
          max={daysInMonth(formData.monthKey)}
        />
        
        <NumField
          label="Total Tasks Completed"
          value={formData.meta.tasks.count}
          onChange={(value) => updateFormData('meta', { 
            ...formData.meta, 
            tasks: { ...formData.meta.tasks, count: value }
          })}
          min={0}
        />
        
        <TextField
          label="AI Table Link (Optional)"
          value={formData.meta.tasks.aiTableLink}
          onChange={(value) => updateFormData('meta', { 
            ...formData.meta, 
            tasks: { ...formData.meta.tasks, aiTableLink: value }
          })}
          placeholder="https://..."
        />
      </div>
    </Section>
  );

  // Step 3: KPI & Clients
  const renderKPIStep = () => (
    <Section title="KPI Metrics & Client Work" icon="📊">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Client Projects</h3>
          <div className="space-y-4">
            {formData.clients.map((client, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ClientDropdown
                    label="Client Name"
                    value={client.name || ''}
                    onChange={(name) => {
                      if (!client.selectedClient) {
                        const newClients = [...formData.clients];
                        newClients[index] = { ...client, name: name };
                        updateFormData('clients', newClients);
                      }
                    }}
                    onClientSelect={(selectedClient) => {
                      const newClients = [...formData.clients];
                      if (selectedClient) {
                        // Auto-populate client fields
                        newClients[index] = {
                          ...client,
                          name: selectedClient.name,
                          selectedClient: selectedClient,
                          team: selectedClient.team,
                          services: selectedClient.services || [],
                          scope_of_work: selectedClient.scope_of_work || '',
                          status: selectedClient.status
                        };
                      } else {
                        // Clear auto-populated data but keep manually entered data
                        newClients[index] = {
                          ...client,
                          selectedClient: null,
                          name: client.name
                        };
                      }
                      updateFormData('clients', newClients);
                    }}
                    team={formData.employee.department}
                    placeholder="Select or type client name..."
                    required
                  />
                  
                  <TextField
                    label="Project Type"
                    value={client.projectType || ''}
                    onChange={(value) => {
                      const newClients = [...formData.clients];
                      newClients[index] = { ...client, projectType: value };
                      updateFormData('clients', newClients);
                    }}
                    placeholder="e.g., Website, App, Marketing"
                  />
                </div>
                
                {/* Auto-populated client info display */}
                {client.selectedClient && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <h4 className="text-sm font-medium text-green-900 mb-2">Client Information (Auto-populated)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-medium text-green-800">Team:</span>
                        <span className="ml-1 text-green-700">{client.selectedClient.team}</span>
                      </div>
                      <div>
                        <span className="font-medium text-green-800">Status:</span>
                        <span className="ml-1 text-green-700">{client.selectedClient.status}</span>
                      </div>
                      {client.selectedClient.services && client.selectedClient.services.length > 0 && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-green-800">Services:</span>
                          <span className="ml-1 text-green-700">
                            {Array.isArray(client.selectedClient.services) 
                              ? client.selectedClient.services.join(', ') 
                              : client.selectedClient.services}
                          </span>
                        </div>
                      )}
                      {client.selectedClient.scope_of_work && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-green-800">Scope:</span>
                          <span className="ml-1 text-green-700">{client.selectedClient.scope_of_work}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                 
                <TextArea
                  label="Work Description"
                  value={client.description || ''}
                  onChange={(value) => {
                    const newClients = [...formData.clients];
                    newClients[index] = { ...client, description: value };
                    updateFormData('clients', newClients);
                  }}
                  placeholder="Describe the work done for this client..."
                  rows={3}
                />
                
                <button
                  type="button"
                  onClick={() => {
                    const newClients = formData.clients.filter((_, i) => i !== index);
                    updateFormData('clients', newClients);
                  }}
                  className="mt-2 text-red-600 hover:text-red-800 text-sm"
                >
                  Remove Client
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={() => {
                const newClients = [...formData.clients, { name: '', projectType: '', description: '' }];
                updateFormData('clients', newClients);
              }}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800"
            >
              + Add Client Project
            </button>
          </div>
        </div>
      </div>
    </Section>
  );

  // Step 4: Learning & AI
  const renderLearningStep = () => (
    <Section title="Learning & AI Usage" icon="🎓">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Learning Activities</h3>
          <div className="space-y-4">
            {formData.learning.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="Learning Topic"
                    value={item.topic || ''}
                    onChange={(value) => {
                      const newLearning = [...formData.learning];
                      newLearning[index] = { ...item, topic: value };
                      updateFormData('learning', newLearning);
                    }}
                    placeholder="e.g., React Hooks, SEO, Design"
                  />
                  
                  <TextField
                    label="Source/Platform"
                    value={item.source || ''}
                    onChange={(value) => {
                      const newLearning = [...formData.learning];
                      newLearning[index] = { ...item, source: value };
                      updateFormData('learning', newLearning);
                    }}
                    placeholder="e.g., YouTube, Udemy, Documentation"
                  />
                </div>
                
                <TextArea
                  label="What You Learned"
                  value={item.description || ''}
                  onChange={(value) => {
                    const newLearning = [...formData.learning];
                    newLearning[index] = { ...item, description: value };
                    updateFormData('learning', newLearning);
                  }}
                  placeholder="Describe what you learned and how you applied it..."
                  rows={3}
                />
                
                <button
                  type="button"
                  onClick={() => {
                    const newLearning = formData.learning.filter((_, i) => i !== index);
                    updateFormData('learning', newLearning);
                  }}
                  className="mt-2 text-red-600 hover:text-red-800 text-sm"
                >
                  Remove Learning Item
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={() => {
                const newLearning = [...formData.learning, { topic: '', source: '', description: '' }];
                updateFormData('learning', newLearning);
              }}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800"
            >
              + Add Learning Activity
            </button>
          </div>
        </div>
        
        <TextArea
          label="AI Usage Notes"
          value={formData.aiUsageNotes}
          onChange={(value) => updateFormData('aiUsageNotes', value)}
          placeholder="Describe how you used AI tools (ChatGPT, Claude, etc.) in your work this month..."
          rows={4}
        />
      </div>
    </Section>
  );

  // Step 5: Feedback & Review
  const renderFeedbackStep = () => (
    <Section title="Feedback & Final Review" icon="💬">
      <div className="space-y-6">
        <ThreeWayComparativeField
          label="Company Feedback"
          value={formData.feedback.company}
          onChange={(value) => updateFormData('feedback', { ...formData.feedback, company: value })}
          placeholder="Share your thoughts about the company, culture, processes..."
        />
        
        <ThreeWayComparativeField
          label="HR Feedback"
          value={formData.feedback.hr}
          onChange={(value) => updateFormData('feedback', { ...formData.feedback, hr: value })}
          placeholder="Feedback about HR policies, support, communication..."
        />
        
        <ThreeWayComparativeField
          label="Management Feedback"
          value={formData.feedback.management}
          onChange={(value) => updateFormData('feedback', { ...formData.feedback, management: value })}
          placeholder="Feedback about management, leadership, guidance..."
        />
        
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Employee Tactical Meeting Form</h1>
              {existingSubmission && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  Editing {monthLabel(existingSubmission.month_key || existingSubmission.monthKey)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {isSaving && (
                <span className="text-sm text-blue-600 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Saving...
                </span>
              )}
              {lastSaved && (
                <span className="text-sm text-gray-500">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {errors.save && (
                <span className="text-sm text-red-600">{errors.save}</span>
              )}
            </div>
          </div>
          
          {/* Step Progress */}
          <div className="flex items-center justify-between">
            {FORM_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => goToStep(step.id)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                    currentStep === step.id
                      ? 'bg-blue-600 text-white'
                      : currentStep > step.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {currentStep > step.id ? '✓' : step.id}
                </button>
                <div className="ml-3 text-left">
                  <div className={`text-sm font-medium ${
                    currentStep === step.id ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                {index < FORM_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {renderCurrentStep()}
        </div>

        {/* Navigation */}
        <div className="border-t border-gray-200 p-6 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex gap-3">
            {currentStep < FORM_STEPS.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isSaving ? 'Submitting...' : 'Submit Report'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewEmployeeForm;