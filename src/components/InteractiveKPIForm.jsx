import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useToast } from '@/shared/components/Toast';
import { supabase } from '@/shared/lib/supabase';
import moment from 'moment';
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Users, 
  Award, 
  BookOpen, 
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Save,
  RefreshCw
} from 'lucide-react';

const InteractiveKPIForm = ({ 
  employeeId = null, 
  monthYear = null, 
  onSubmit = null,
  showHeader = true,
  compact = false 
}) => {
  const { user } = useUnifiedAuth();
  const { notify } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(monthYear || moment().format('YYYY-MM'));
  const [kpiData, setKpiData] = useState({
    // Client Management KPIs
    meetings_with_clients: 0,
    whatsapp_messages_sent: 0,
    client_satisfaction_score: 8.0,
    client_retention_rate: 95.0,
    new_clients_acquired: 0,
    
    // Work Performance KPIs
    tasks_completed: 0,
    tasks_on_time: 0,
    quality_score: 8.0,
    productivity_score: 8.0,
    
    // Learning & Growth KPIs
    learning_hours: 0,
    courses_completed: 0,
    certifications_earned: 0,
    
    // Team & Collaboration KPIs
    attendance_rate: 95.0,
    punctuality_score: 9.0,
    team_collaboration_score: 8.0,
    initiative_score: 8.0,
    
    // Additional fields
    achievements: '',
    challenges: '',
    feedback: ''
  });
  const [previousData, setPreviousData] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [activeTab, setActiveTab] = useState('client');

  // KPI Categories for tabbed interface
  const kpiTabs = [
    { id: 'client', label: 'Client Management', icon: Users, color: 'blue' },
    { id: 'performance', label: 'Work Performance', icon: Target, color: 'green' },
    { id: 'learning', label: 'Learning & Growth', icon: BookOpen, color: 'purple' },
    { id: 'collaboration', label: 'Team & Culture', icon: Award, color: 'orange' }
  ];

  // Load existing KPI data
  useEffect(() => {
    loadKPIData();
  }, [currentMonth, employeeId]);

  const loadKPIData = async () => {
    try {
      setLoading(true);
      const targetEmployeeId = employeeId || user?.id;
      
      if (!targetEmployeeId) return;

      // Load current month data
      const { data: currentData, error: currentError } = await supabase
        .from('monthly_kpi_reports')
        .select('*')
        .eq('employee_id', targetEmployeeId)
        .eq('month_year', currentMonth)
        .single();

      if (currentData && !currentError) {
        setKpiData({
          meetings_with_clients: currentData.meetings_with_clients || 0,
          whatsapp_messages_sent: currentData.whatsapp_messages_sent || 0,
          client_satisfaction_score: currentData.client_satisfaction_score || 8.0,
          client_retention_rate: currentData.client_retention_rate || 95.0,
          new_clients_acquired: currentData.new_clients_acquired || 0,
          tasks_completed: currentData.tasks_completed || 0,
          tasks_on_time: currentData.tasks_on_time || 0,
          quality_score: currentData.quality_score || 8.0,
          productivity_score: currentData.productivity_score || 8.0,
          learning_hours: currentData.learning_hours || 0,
          courses_completed: currentData.courses_completed || 0,
          certifications_earned: currentData.certifications_earned || 0,
          attendance_rate: currentData.attendance_rate || 95.0,
          punctuality_score: currentData.punctuality_score || 9.0,
          team_collaboration_score: currentData.team_collaboration_score || 8.0,
          initiative_score: currentData.initiative_score || 8.0,
          achievements: currentData.achievements || '',
          challenges: currentData.challenges || '',
          feedback: currentData.feedback || ''
        });
      }

      // Load previous month data for comparison
      const prevMonth = moment(currentMonth).subtract(1, 'month').format('YYYY-MM');
      const { data: prevData } = await supabase
        .from('monthly_kpi_reports')
        .select('*')
        .eq('employee_id', targetEmployeeId)
        .eq('month_year', prevMonth)
        .single();

      setPreviousData(prevData);
    } catch (error) {
      console.error('Error loading KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setKpiData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    // Validate numeric ranges
    if (kpiData.client_satisfaction_score < 1 || kpiData.client_satisfaction_score > 10) {
      errors.client_satisfaction_score = 'Must be between 1 and 10';
    }
    if (kpiData.quality_score < 1 || kpiData.quality_score > 10) {
      errors.quality_score = 'Must be between 1 and 10';
    }
    if (kpiData.productivity_score < 1 || kpiData.productivity_score > 10) {
      errors.productivity_score = 'Must be between 1 and 10';
    }
    if (kpiData.attendance_rate < 0 || kpiData.attendance_rate > 100) {
      errors.attendance_rate = 'Must be between 0 and 100';
    }
    if (kpiData.punctuality_score < 1 || kpiData.punctuality_score > 10) {
      errors.punctuality_score = 'Must be between 1 and 10';
    }
    
    // Validate task completion logic
    if (kpiData.tasks_on_time > kpiData.tasks_completed) {
      errors.tasks_on_time = 'Cannot exceed total tasks completed';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Calculate overall score
  const calculateOverallScore = () => {
    const weights = {
      client_satisfaction_score: 0.2,
      quality_score: 0.2,
      productivity_score: 0.15,
      attendance_rate: 0.1,
      punctuality_score: 0.1,
      team_collaboration_score: 0.15,
      initiative_score: 0.1
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(weights).forEach(([field, weight]) => {
      if (kpiData[field] !== undefined && kpiData[field] !== null) {
        let normalizedValue = kpiData[field];
        if (field === 'attendance_rate') {
          normalizedValue = kpiData[field] / 10; // Convert percentage to 1-10 scale
        }
        totalScore += normalizedValue * weight;
        totalWeight += weight;
      }
    });
    
    return totalWeight > 0 ? (totalScore / totalWeight).toFixed(1) : 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      notify({
        title: 'Validation Error',
        message: 'Please fix the errors before submitting',
        type: 'error'
      });
      return;
    }

    try {
      setSaving(true);
      const targetEmployeeId = employeeId || user?.id;
      
      if (!targetEmployeeId) {
        throw new Error('No employee ID available');
      }

      const overallScore = calculateOverallScore();
      
      const submitData = {
        employee_id: targetEmployeeId,
        month_year: currentMonth,
        ...kpiData,
        overall_score: parseFloat(overallScore),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('monthly_kpi_reports')
        .upsert(submitData, { 
          onConflict: 'employee_id,month_year',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      notify({
        title: 'Success!',
        message: 'KPI data saved successfully',
        type: 'success'
      });

      if (onSubmit) {
        onSubmit(submitData);
      }
    } catch (error) {
      console.error('Error saving KPI data:', error);
      notify({
        title: 'Error',
        message: 'Failed to save KPI data: ' + error.message,
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Get comparison indicator
  const getComparisonIndicator = (current, previous, isPercentage = false) => {
    if (!previous || previous === 0) return null;
    
    const diff = current - previous;
    const isPositive = diff > 0;
    const percentage = Math.abs((diff / previous) * 100).toFixed(1);
    
    return (
      <span className={`text-xs ml-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '↗' : '↘'} {percentage}%
      </span>
    );
  };

  // Render input field with validation
  const renderInputField = (field, label, type = 'number', min = 0, max = null, step = null) => {
    const hasError = validationErrors[field];
    const previousValue = previousData?.[field];
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {previousValue !== undefined && (
            getComparisonIndicator(kpiData[field], previousValue)
          )}
        </label>
        <input
          type={type}
          value={kpiData[field]}
          onChange={(e) => handleFieldChange(field, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          min={min}
          max={max}
          step={step}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
        />
        {hasError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {hasError}
          </p>
        )}
        {previousValue !== undefined && (
          <p className="text-xs text-gray-500">
            Previous month: {previousValue}
          </p>
        )}
      </div>
    );
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'client':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderInputField('meetings_with_clients', 'Client Meetings', 'number', 0)}
            {renderInputField('whatsapp_messages_sent', 'WhatsApp Messages Sent', 'number', 0)}
            {renderInputField('client_satisfaction_score', 'Client Satisfaction Score (1-10)', 'number', 1, 10, 0.1)}
            {renderInputField('client_retention_rate', 'Client Retention Rate (%)', 'number', 0, 100, 0.1)}
            {renderInputField('new_clients_acquired', 'New Clients Acquired', 'number', 0)}
          </div>
        );
      
      case 'performance':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderInputField('tasks_completed', 'Tasks Completed', 'number', 0)}
            {renderInputField('tasks_on_time', 'Tasks Completed On Time', 'number', 0)}
            {renderInputField('quality_score', 'Quality Score (1-10)', 'number', 1, 10, 0.1)}
            {renderInputField('productivity_score', 'Productivity Score (1-10)', 'number', 1, 10, 0.1)}
          </div>
        );
      
      case 'learning':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderInputField('learning_hours', 'Learning Hours', 'number', 0, null, 0.5)}
            {renderInputField('courses_completed', 'Courses Completed', 'number', 0)}
            {renderInputField('certifications_earned', 'Certifications Earned', 'number', 0)}
          </div>
        );
      
      case 'collaboration':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderInputField('attendance_rate', 'Attendance Rate (%)', 'number', 0, 100, 0.1)}
            {renderInputField('punctuality_score', 'Punctuality Score (1-10)', 'number', 1, 10, 0.1)}
            {renderInputField('team_collaboration_score', 'Team Collaboration (1-10)', 'number', 1, 10, 0.1)}
            {renderInputField('initiative_score', 'Initiative Score (1-10)', 'number', 1, 10, 0.1)}
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading KPI data...</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${compact ? 'p-4' : 'p-6'}`}>
      {showHeader && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Interactive KPI Form
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Update your key performance indicators for {moment(currentMonth).format('MMMM YYYY')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm text-gray-600">Overall Score</div>
                <div className="text-2xl font-bold text-blue-600">
                  {calculateOverallScore()}/10
                </div>
              </div>
            </div>
          </div>
          
          {/* Month Selector */}
          <div className="flex items-center gap-4 mb-4">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={loadKPIData}
              className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {kpiTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? `border-${tab.color}-500 text-${tab.color}-600`
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mb-6">
        {renderTabContent()}
      </div>

      {/* Additional Information */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Key Achievements This Month
          </label>
          <textarea
            value={kpiData.achievements}
            onChange={(e) => handleFieldChange('achievements', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe your key achievements and successes this month..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Challenges Faced
          </label>
          <textarea
            value={kpiData.challenges}
            onChange={(e) => handleFieldChange('challenges', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe any challenges or obstacles you encountered..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Feedback
          </label>
          <textarea
            value={kpiData.feedback}
            onChange={(e) => handleFieldChange('feedback', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Any additional feedback or comments..."
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={loadKPIData}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save KPI Data'}
        </button>
      </div>
    </div>
  );
};

export default InteractiveKPIForm;