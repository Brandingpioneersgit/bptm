import React, { useState } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useToast } from '@/shared/components/Toast';
import { supabase } from '@/shared/lib/supabase';
import moment from 'moment';
import {
  Send,
  MessageSquare,
  Star,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  Calendar,
  RefreshCw
} from 'lucide-react';

const QuickSubmissionForm = ({ type = 'feedback', onSubmit = null, compact = false }) => {
  const { user } = useUnifiedAuth();
  const { notify } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: type,
    title: '',
    content: '',
    rating: 5,
    category: '',
    priority: 'medium',
    target_date: moment().add(7, 'days').format('YYYY-MM-DD'),
    tags: '',
    is_anonymous: false
  });
  const [errors, setErrors] = useState({});

  // Form configurations for different types
  const formConfigs = {
    feedback: {
      title: 'Submit Feedback',
      icon: MessageSquare,
      color: 'blue',
      categories: ['General', 'Process Improvement', 'Team Collaboration', 'Management', 'Training', 'Tools & Technology'],
      placeholder: 'Share your feedback, suggestions, or concerns...'
    },
    review: {
      title: 'Performance Review',
      icon: Star,
      color: 'purple',
      categories: ['Self Review', 'Peer Review', 'Manager Review', 'Goal Setting', 'Development Plan'],
      placeholder: 'Provide your performance review comments...'
    },
    goal: {
      title: 'Set Goal',
      icon: Target,
      color: 'green',
      categories: ['Personal Development', 'Skill Building', 'Project Goals', 'Team Goals', 'Career Growth'],
      placeholder: 'Describe your goal and how you plan to achieve it...'
    },
    task: {
      title: 'Quick Task',
      icon: CheckCircle,
      color: 'orange',
      categories: ['Daily Task', 'Project Work', 'Learning', 'Meeting', 'Administrative'],
      placeholder: 'Describe the task and any relevant details...'
    },
    concern: {
      title: 'Report Concern',
      icon: AlertCircle,
      color: 'red',
      categories: ['Performance Issue', 'Workplace Concern', 'Process Problem', 'Resource Need', 'Other'],
      placeholder: 'Describe the concern and any relevant context...'
    }
  };

  const config = formConfigs[type] || formConfigs.feedback;
  const Icon = config.icon;

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (formData.rating < 1 || formData.rating > 10) {
      newErrors.rating = 'Rating must be between 1 and 10';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      notify({
        title: 'Validation Error',
        message: 'Please fix the errors before submitting',
        type: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Prepare submission data
      const submissionData = {
        employee_id: user.id,
        type: formData.type,
        title: formData.title.trim(),
        content: formData.content.trim(),
        rating: formData.rating,
        category: formData.category,
        priority: formData.priority,
        target_date: formData.target_date,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        is_anonymous: formData.is_anonymous,
        status: 'submitted',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Choose the appropriate table based on type
      let tableName;
      switch (formData.type) {
        case 'review':
          tableName = 'performance_reviews';
          break;
        case 'goal':
          tableName = 'employee_goals';
          break;
        case 'task':
          tableName = 'quick_tasks';
          break;
        case 'concern':
          tableName = 'performance_concerns';
          break;
        default:
          tableName = 'feedback_submissions';
      }

      // Submit to database
      const { error } = await supabase
        .from(tableName)
        .insert(submissionData);

      if (error) {
        // If table doesn't exist, create a generic submission
        console.warn(`Table ${tableName} not found, using generic submissions`);
        
        const genericSubmissionData = {
          ...submissionData,
          table_name: tableName
        };
        
        // Validate payment proof URLs before fallback submission
        if (genericSubmissionData.paymentStatus && genericSubmissionData.paymentProofUrl) {
          const paymentValidationErrors = [];
          Object.keys(genericSubmissionData.paymentStatus).forEach(clientId => {
            const status = genericSubmissionData.paymentStatus[clientId];
            const proofUrl = genericSubmissionData.paymentProofUrl[clientId] || '';
            
            if ((status === 'completed' || status === 'partial')) {
              if (!proofUrl.trim()) {
                paymentValidationErrors.push(`Client ${clientId}: Payment proof URL is required for ${status} status`);
              } else if (!/https?:\/\/(drive|docs)\.google\.com\//i.test(proofUrl)) {
                paymentValidationErrors.push(`Client ${clientId}: Payment proof must be a valid Google Drive URL`);
              }
            }
          });
          
          if (paymentValidationErrors.length > 0) {
            throw new Error(`Payment validation failed: ${paymentValidationErrors.join(', ')}`);
          }
        }
        
        const { error: genericError } = await supabase
          .from('submissions')
          .insert(genericSubmissionData);
          
        if (genericError) throw genericError;
      }

      notify({
        title: 'Success!',
        message: `${config.title} submitted successfully`,
        type: 'success'
      });

      // Reset form
      setFormData({
        type: type,
        title: '',
        content: '',
        rating: 5,
        category: '',
        priority: 'medium',
        target_date: moment().add(7, 'days').format('YYYY-MM-DD'),
        tags: '',
        is_anonymous: false
      });

      if (onSubmit) {
        onSubmit(submissionData);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      notify({
        title: 'Error',
        message: 'Failed to submit: ' + error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Render input field with validation
  const renderInputField = (field, label, type = 'text', required = false, options = null) => {
    const hasError = errors[field];
    
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {type === 'select' && options ? (
          <select
            value={formData[field]}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-${config.color}-500 focus:border-${config.color}-500 transition-colors ${
              hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="">Select {label}</option>
            {options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            value={formData[field]}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            rows={compact ? 3 : 4}
            placeholder={config.placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-${config.color}-500 focus:border-${config.color}-500 transition-colors resize-none ${
              hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
          />
        ) : type === 'range' ? (
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="10"
              value={formData[field]}
              onChange={(e) => handleFieldChange(field, parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 (Poor)</span>
              <span className="font-medium text-gray-700">{formData[field]}/10</span>
              <span>10 (Excellent)</span>
            </div>
          </div>
        ) : (
          <input
            type={type}
            value={formData[field]}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-${config.color}-500 focus:border-${config.color}-500 transition-colors ${
              hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
          />
        )}
        
        {hasError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {hasError}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 bg-${config.color}-100 rounded-lg`}>
            <Icon className={`w-5 h-5 text-${config.color}-600`} />
          </div>
          <h2 className={`text-xl font-bold text-gray-900`}>
            {config.title}
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          Submit your {type} quickly and efficiently
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        {renderInputField('title', 'Title', 'text', true)}
        
        {/* Category */}
        {renderInputField('category', 'Category', 'select', true, config.categories)}
        
        {/* Content */}
        {renderInputField('content', 'Description', 'textarea', true)}
        
        {/* Rating (for feedback and reviews) */}
        {(type === 'feedback' || type === 'review') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInputField('rating', 'Rating', 'range')}
            {renderInputField('priority', 'Priority', 'select', false, ['low', 'medium', 'high'])}
          </div>
        )}
        
        {/* Target Date (for goals and tasks) */}
        {(type === 'goal' || type === 'task') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInputField('target_date', 'Target Date', 'date')}
            {renderInputField('priority', 'Priority', 'select', false, ['low', 'medium', 'high'])}
          </div>
        )}
        
        {/* Tags */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => handleFieldChange('tags', e.target.value)}
            placeholder="e.g., urgent, team-related, process-improvement"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        
        {/* Anonymous Option */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="anonymous"
            checked={formData.is_anonymous}
            onChange={(e) => handleFieldChange('is_anonymous', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="anonymous" className="text-sm text-gray-700">
            Submit anonymously
          </label>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                type: type,
                title: '',
                content: '',
                rating: 5,
                category: '',
                priority: 'medium',
                target_date: moment().add(7, 'days').format('YYYY-MM-DD'),
                tags: '',
                is_anonymous: false
              });
              setErrors({});
            }}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 bg-${config.color}-600 text-white rounded-lg hover:bg-${config.color}-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2`}
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuickSubmissionForm;