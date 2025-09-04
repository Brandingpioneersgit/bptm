import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { Section } from '@/shared/components/ui';
import { thisMonthKey, monthLabel, prevMonthKey } from '@/shared/lib/constants';
import { useDraftPersistence } from '@/shared/services/DataPersistence';
import { useStandardizedFeedback, FEEDBACK_MESSAGES } from '@/shared/utils/feedbackUtils';

// Month Status Indicator Component
const MonthStatusIndicator = ({ month, status, isSelected, onClick }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'partial': return 'bg-yellow-500';
      case 'empty': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return '✓';
      case 'partial': return '◐';
      case 'empty': return '○';
      default: return '○';
    }
  };

  return (
    <button
      onClick={() => onClick(month)}
      className={`relative p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-lg' 
          : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="text-center">
        <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${getStatusColor()} flex items-center justify-center text-white text-xs font-bold`}>
          {getStatusIcon()}
        </div>
        <div className="text-sm font-medium text-gray-900">
          {monthLabel(month).split(' ')[0]}
        </div>
        <div className="text-xs text-gray-500">
          {monthLabel(month).split(' ')[1]}
        </div>
      </div>
      
      {/* Status Badge */}
      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor()}`} />
    </button>
  );
};

// Role-specific Accountability Components
const MASHAccountability = ({ role, formData, onChange, clients = [] }) => {
  const renderOperationManager = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Operation Manager - Client Updates & Management</h4>
      
      {clients.map((client, index) => (
        <div key={client.id || index} className="border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-800 mb-3">{client.name}</h5>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Updates</label>
              <textarea
                value={formData.clientUpdates?.[client.id] || ''}
                onChange={(e) => onChange('clientUpdates', { ...formData.clientUpdates, [client.id]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Weekly updates, progress, issues..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Escalations</label>
              <input
                type="number"
                value={formData.escalations?.[client.id] || 0}
                onChange={(e) => onChange('escalations', { ...formData.escalations, [client.id]: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appreciation Count</label>
              <input
                type="number"
                value={formData.appreciations?.[client.id] || 0}
                onChange={(e) => onChange('appreciations', { ...formData.appreciations, [client.id]: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
          
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Happiness Score (1-10)</label>
            <input
              type="number"
              value={formData.happinessScore?.[client.id] || 5}
              onChange={(e) => onChange('happinessScore', { ...formData.happinessScore, [client.id]: parseInt(e.target.value) || 5 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="10"
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderAccountant = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Accountant - Payment & Compliance Tracking</h4>
      
      {clients.map((client, index) => (
        <div key={client.id || index} className="border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-800 mb-3">{client.name}</h5>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                value={formData.paymentStatus?.[client.id] || 'pending'}
                onChange={(e) => onChange('paymentStatus', { ...formData.paymentStatus, [client.id]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={formData.paymentDate?.[client.id] || ''}
                onChange={(e) => onChange('paymentDate', { ...formData.paymentDate, [client.id]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compliance Status</label>
              <select
                value={formData.complianceStatus?.[client.id] || 'compliant'}
                onChange={(e) => onChange('complianceStatus', { ...formData.complianceStatus, [client.id]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="compliant">Compliant</option>
                <option value="pending">Pending</option>
                <option value="non-compliant">Non-Compliant</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Expense (₹)</label>
              <input
                type="number"
                value={formData.monthlyExpense?.[client.id] || 0}
                onChange={(e) => onChange('monthlyExpense', { ...formData.monthlyExpense, [client.id]: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSales = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">Sales - CRM Pipeline Management</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h5 className="font-medium text-gray-800 mb-3">Lead Generation</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Leads</label>
              <input
                type="number"
                value={formData.newLeads || 0}
                onChange={(e) => onChange('newLeads', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
              <select
                value={formData.leadSource || ''}
                onChange={(e) => onChange('leadSource', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Source</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social-media">Social Media</option>
                <option value="cold-calling">Cold Calling</option>
                <option value="email-campaign">Email Campaign</option>
                <option value="networking">Networking</option>
              </select>
            </div>
          </div>
        </div>
        
        <div>
          <h5 className="font-medium text-gray-800 mb-3">Conversion Tracking</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conversions</label>
              <input
                type="number"
                value={formData.conversions || 0}
                onChange={(e) => onChange('conversions', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Action</label>
              <textarea
                value={formData.nextAction || ''}
                onChange={(e) => onChange('nextAction', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Follow-up actions, meetings scheduled..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHR = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">HR - Employee Management & Hiring</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h5 className="font-medium text-gray-800 mb-3">Employee Management</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Onboarding Completed</label>
              <input
                type="number"
                value={formData.onboardingCompleted || 0}
                onChange={(e) => onChange('onboardingCompleted', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compliance Issues</label>
              <input
                type="number"
                value={formData.complianceIssues || 0}
                onChange={(e) => onChange('complianceIssues', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
        </div>
        
        <div>
          <h5 className="font-medium text-gray-800 mb-3">Hiring Pipeline</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Candidates</label>
              <input
                type="number"
                value={formData.newCandidates || 0}
                onChange={(e) => onChange('newCandidates', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interviews Conducted</label>
              <input
                type="number"
                value={formData.interviewsConducted || 0}
                onChange={(e) => onChange('interviewsConducted', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  switch (role) {
    case 'Operations Head':
    case 'Operation Manager':
      return renderOperationManager();
    case 'Accountant':
      return renderAccountant();
    case 'Sales':
      return renderSales();
    case 'HR':
      return renderHR();
    default:
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No specific accountability form for this role.</p>
          <p className="text-sm">Please contact your manager for role-specific requirements.</p>
        </div>
      );
  }
};

// Marketing/Web Accountability Component
const ProjectAccountability = ({ role, formData, onChange, projects = [] }) => {
  const renderProjectWork = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">{role} - Project-based Accountability</h4>
      
      {projects.map((project, index) => (
        <div key={project.id || index} className="border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-800 mb-3">{project.name}</h5>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
              <input
                type="number"
                value={formData.projectTargets?.[project.id] || 0}
                onChange={(e) => onChange('projectTargets', { ...formData.projectTargets, [project.id]: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Completed</label>
              <input
                type="number"
                value={formData.projectCompleted?.[project.id] || 0}
                onChange={(e) => onChange('projectCompleted', { ...formData.projectCompleted, [project.id]: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
              <div className="px-3 py-2 bg-gray-100 rounded-lg text-center font-medium">
                {formData.projectTargets?.[project.id] > 0 
                  ? Math.round((formData.projectCompleted?.[project.id] || 0) / formData.projectTargets[project.id] * 10)
                  : 0
                }/10
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Progress Notes</label>
            <textarea
              value={formData.projectNotes?.[project.id] || ''}
              onChange={(e) => onChange('projectNotes', { ...formData.projectNotes, [project.id]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Progress updates, challenges, achievements..."
            />
          </div>
        </div>
      ))}
      
      {/* Overall Accountability Score */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-800 mb-2">Overall Accountability Score</h5>
        <div className="text-2xl font-bold text-blue-900">
          {projects.length > 0 
            ? Math.round(projects.reduce((acc, project) => {
                const target = formData.projectTargets?.[project.id] || 0;
                const completed = formData.projectCompleted?.[project.id] || 0;
                return acc + (target > 0 ? (completed / target * 10) : 0);
              }, 0) / projects.length)
            : 0
          }/10
        </div>
        <p className="text-sm text-blue-700 mt-1">
          Average score across all assigned projects
        </p>
      </div>
    </div>
  );

  return renderProjectWork();
};

export const MonthlyFormWorkflow = ({ employee, onSubmit }) => {
  const supabase = useSupabase();
  const { notify } = useToast();
  const feedback = useStandardizedFeedback();
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(prevMonthKey(thisMonthKey()));
  const [monthStatuses, setMonthStatuses] = useState({});
  const [formData, setFormData] = useState({});
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [targets, setTargets] = useState({});
  
  // Draft persistence state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Draft persistence hook
  const draftPersistence = useDraftPersistence({
    name: employee?.name,
    phone: employee?.phone,
    monthKey: selectedMonth,
    model: formData,
    onRestore: (data) => {
      if (data && Object.keys(data).length > 0) {
        setFormData(data);
        setHasUnsavedChanges(false);
        setLastAutoSave(new Date());
        feedback.showInfo(FEEDBACK_MESSAGES.DRAFT_LOAD_SUCCESS);
      }
    }
  });
  
  // Refs for stable callbacks
  const autoSaveTimeoutRef = useRef(null);
  const formDataRef = useRef(formData);
  
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Generate months for current year
  const months = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      return `${currentYear}-${month.toString().padStart(2, '0')}`;
    });
  }, []);

  // Fetch month statuses
  useEffect(() => {
    const fetchMonthStatuses = async () => {
      if (!employee?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('month_key, id')
          .eq('employee_name', employee.name)
          .in('month_key', months);
        
        if (error) throw error;
        
        const statuses = {};
        months.forEach(month => {
          const submission = data?.find(s => s.month_key === month);
          statuses[month] = submission ? 'completed' : 'empty';
        });
        
        setMonthStatuses(statuses);
      } catch (error) {
        console.error('Error fetching month statuses:', error);
      }
    };

    fetchMonthStatuses();
  }, [employee, months, supabase]);

  // Fetch clients and projects
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .eq('status', 'active');
        
        if (clientsError) throw clientsError;
        setClients(clientsData || []);

        // Fetch projects (you might need to create this table)
        // For now, we'll use a mock structure
        setProjects([
          { id: 'web-dev', name: 'Web Development' },
          { id: 'seo', name: 'SEO Optimization' },
          { id: 'content', name: 'Content Creation' },
          { id: 'ads', name: 'Ad Campaigns' },
          { id: 'social', name: 'Social Media' }
        ]);

        // Fetch targets (from a targets table or employee settings)
        const { data: targetsData, error: targetsError } = await supabase
          .from('employee_targets')
          .select('*')
          .eq('employee_id', employee?.id);
        
        if (!targetsError && targetsData) {
          const targetMap = {};
          targetsData.forEach(target => {
            targetMap[target.metric] = target.value;
          });
          setTargets(targetMap);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (employee?.id) {
      fetchData();
    }
  }, [employee, supabase]);

  // Load form data for selected month
  useEffect(() => {
    const loadFormData = async () => {
      if (!employee?.name || !selectedMonth) return;
      
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('employee_name', employee.name)
          .eq('month_key', selectedMonth)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        setFormData(data || {});
      } catch (error) {
        console.error('Error loading form data:', error);
        setFormData({});
      }
    };

    loadFormData();
  }, [employee, selectedMonth, supabase]);

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (!autoSaveEnabled || !employee?.name || !employee?.phone || !selectedMonth) {
      return;
    }
    
    // Check if there's meaningful data to save
    const hasFormData = Object.keys(formDataRef.current).some(key => {
      const value = formDataRef.current[key];
      return value && (typeof value === 'string' ? value.trim() : true);
    });
    
    if (!hasFormData) {
      return;
    }
    
    try {
      setIsSaving(true);
      
      const draftData = {
        ...formDataRef.current,
        employee_name: employee.name,
        employee_phone: employee.phone,
        department: employee.department,
        role: employee.role,
        month_key: selectedMonth,
        lastSaved: new Date().toISOString(),
        isDraft: true
      };
      
      const success = draftPersistence.saveDraft(draftData, {
        forceImmediate: hasUnsavedChanges
      });
      
      if (success) {
        setLastAutoSave(new Date());
        setHasUnsavedChanges(false);
        feedback.showInfo(FEEDBACK_MESSAGES.DRAFT_SAVE_SUCCESS, { duration: 2000 });
      }
      
    } catch (error) {
      console.error('Auto-save failed:', error);
      feedback.showError(FEEDBACK_MESSAGES.DRAFT_SAVE_ERROR);
    } finally {
      setIsSaving(false);
    }
  }, [autoSaveEnabled, employee, selectedMonth, hasUnsavedChanges, draftPersistence]);
  
  // Auto-save effect with debouncing
  useEffect(() => {
    if (hasUnsavedChanges) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, autoSave]);
  
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const submissionData = {
        ...formData,
        employee_name: employee.name,
        employee_phone: employee.phone,
        department: employee.department,
        role: employee.role,
        month_key: selectedMonth,
        updated_at: new Date().toISOString(),
        isDraft: false // Mark as final submission
      };

      const { error } = await supabase
        .from('submissions')
        .upsert(submissionData);
      
      if (error) throw error;
      
      // Clear draft after successful save
      try {
        draftPersistence.deleteDraft({
          name: employee.name,
          phone: employee.phone,
          monthKey: selectedMonth
        });
      } catch (draftError) {
        console.warn('Failed to clear draft:', draftError);
      }
      
      feedback.showFormSuccess('Monthly form saved successfully!');
      
      // Update month status
      setMonthStatuses(prev => ({
        ...prev,
        [selectedMonth]: 'completed'
      }));
      
      // Reset unsaved changes state
      setHasUnsavedChanges(false);
      setLastAutoSave(new Date());
      
      if (onSubmit) onSubmit(submissionData);
    } catch (error) {
      console.error('Error saving form:', error);
      feedback.showFormError(error, 'Failed to save monthly form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isMASHRole = ['Operations Head', 'Operation Manager', 'Accountant', 'Sales', 'HR'].includes(employee?.role?.[0]);
  const isProjectRole = ['Web Developer', 'SEO', 'Marketing', 'Ads', 'Social Media', 'Graphic Designer'].includes(employee?.role?.[0]);

  return (
    <Section title="📅 Monthly Form & Accountability Workflow" className="bg-white">
      <div className="space-y-6">
        {/* Month Selector */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Month</h3>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
            {months.map(month => (
              <MonthStatusIndicator
                key={month}
                month={month}
                status={monthStatuses[month] || 'empty'}
                isSelected={selectedMonth === month}
                onClick={setSelectedMonth}
              />
            ))}
          </div>
          
          <div className="mt-4 flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Partial</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <span>Empty</span>
            </div>
          </div>
        </div>
        
        {/* Selected Month Info with Progress Tracking */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-800">
              📋 {monthLabel(selectedMonth)} Accountability Form
            </h4>
            
            {/* Progress Indicators */}
            <div className="flex items-center space-x-3 text-xs">
              {/* Auto-save Status */}
              {isSaving && (
                <div className="flex items-center space-x-1 text-blue-600">
                  <LoadingSpinner size="xs" />
                  <span>Saving...</span>
                </div>
              )}
              
              {/* Unsaved Changes Indicator */}
              {hasUnsavedChanges && !isSaving && (
                <div className="flex items-center space-x-1 text-orange-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span>Unsaved changes</span>
                </div>
              )}
              
              {/* Last Auto-save Time */}
              {lastAutoSave && !hasUnsavedChanges && !isSaving && (
                <div className="flex items-center space-x-1 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Saved {lastAutoSave.toLocaleTimeString()}</span>
                </div>
              )}
              
              {/* Auto-save Toggle */}
              <button
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  autoSaveEnabled 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={autoSaveEnabled ? 'Auto-save enabled' : 'Auto-save disabled'}
              >
                {autoSaveEnabled ? '🔄 Auto-save ON' : '⏸️ Auto-save OFF'}
              </button>
            </div>
          </div>
          
          <p className="text-sm text-blue-700">
            Complete your monthly accountability data for {monthLabel(selectedMonth)}.
            {monthStatuses[selectedMonth] === 'completed' && ' (Previously submitted - you can update)'}
            {hasUnsavedChanges && ' Your changes are being auto-saved.'}
          </p>
        </div>
        
        {/* Role-specific Accountability Sections */}
        {isMASHRole && (
          <MASHAccountability
            role={employee?.role?.[0]}
            formData={formData}
            onChange={updateFormData}
            clients={clients}
          />
        )}
        
        {isProjectRole && (
          <ProjectAccountability
            role={employee?.role?.[0]}
            formData={formData}
            onChange={updateFormData}
            projects={projects}
          />
        )}
        
        {!isMASHRole && !isProjectRole && (
          <div className="text-center py-8 text-gray-500">
            <p>No specific accountability form configured for your role.</p>
            <p className="text-sm">Please contact your manager for role-specific requirements.</p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {/* Manual Save Draft Button */}
            <button
              type="button"
              onClick={autoSave}
              disabled={isSaving || !hasUnsavedChanges}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
            >
              {isSaving && <LoadingSpinner size="xs" />}
              <span>{isSaving ? 'Saving Draft...' : 'Save Draft'}</span>
            </button>
            
            {/* Draft Status Info */}
            {Object.keys(formData).length > 0 && (
              <span className="text-xs text-gray-500">
                {hasUnsavedChanges ? 'Draft has unsaved changes' : 'Draft saved'}
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            {/* Final Submit Button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              <span>{loading ? 'Submitting...' : 'Submit Monthly Form'}</span>
            </button>
          </div>
        </div>
        
        {/* Info Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-800 mb-2">ℹ️ How it works</h5>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• <strong>Month Selection:</strong> Choose any month to view/edit your accountability data</p>
            <p>• <strong>Visual Status:</strong> Green = completed, Yellow = partial, Gray = empty</p>
            <p>• <strong>Role-based Forms:</strong> Different accountability metrics based on your role</p>
            <p>• <strong>Auto-save & Drafts:</strong> Your changes are automatically saved as drafts every 2 seconds</p>
            <p>• <strong>Progress Tracking:</strong> See real-time indicators for unsaved changes and save status</p>
            <p>• <strong>Draft Recovery:</strong> Resume your work from where you left off, even after browser refresh</p>
            <p>• <strong>Final Submission:</strong> Use 'Submit Monthly Form' to finalize and clear drafts</p>
            <p>• <strong>DB-driven Scoring:</strong> Scores are calculated automatically based on targets vs achievements</p>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default MonthlyFormWorkflow;