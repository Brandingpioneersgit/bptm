import React, { useState } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useToast } from '@/shared/components/Toast';
import { supabase } from '@/shared/lib/supabase';
import { useStandardizedFeedback } from '@/shared/utils/feedbackUtils';
import {
  X,
  AlertCircle,
  Bug,
  HelpCircle,
  Settings,
  User,
  Send,
  Paperclip
} from 'lucide-react';

const ISSUE_TYPES = [
  { value: 'bug', label: 'Bug Report', icon: Bug, description: 'Something is not working correctly' },
  { value: 'feature', label: 'Feature Request', icon: Settings, description: 'Suggest a new feature or improvement' },
  { value: 'help', label: 'Help & Support', icon: HelpCircle, description: 'Need help using the system' },
  { value: 'account', label: 'Account Issue', icon: User, description: 'Problems with login or permissions' },
  { value: 'other', label: 'Other', icon: AlertCircle, description: 'Something else' }
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

const SupportTicketForm = ({ isOpen, onClose, initialData = {} }) => {
  const { user } = useUnifiedAuth();
  const { notify } = useToast();
  const feedback = useStandardizedFeedback();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: initialData.type || 'help',
    priority: initialData.priority || 'medium',
    subject: initialData.subject || '',
    description: initialData.description || '',
    steps_to_reproduce: '',
    expected_behavior: '',
    actual_behavior: '',
    browser_info: navigator.userAgent,
    url: window.location.href,
    attachments: [],
    contact_method: 'email'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      type
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      feedback.showValidationError(['Subject is required']);
      return;
    }
    
    if (!formData.description.trim()) {
      feedback.showValidationError(['Description is required']);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create support ticket
      const ticketData = {
        user_id: user?.id,
        user_email: user?.email,
        user_name: user?.user_metadata?.full_name || user?.email,
        type: formData.type,
        priority: formData.priority,
        subject: formData.subject,
        description: formData.description,
        steps_to_reproduce: formData.steps_to_reproduce,
        expected_behavior: formData.expected_behavior,
        actual_behavior: formData.actual_behavior,
        browser_info: formData.browser_info,
        url: formData.url,
        contact_method: formData.contact_method,
        status: 'open',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('support_tickets')
        .insert([ticketData]);

      if (error) {
        throw error;
      }

      feedback.showFormSuccess('Support ticket submitted successfully! We\'ll get back to you soon.');
      
      // Reset form
      setFormData({
        type: 'help',
        priority: 'medium',
        subject: '',
        description: '',
        steps_to_reproduce: '',
        expected_behavior: '',
        actual_behavior: '',
        browser_info: navigator.userAgent,
        url: window.location.href,
        attachments: [],
        contact_method: 'email'
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      feedback.showFormError(error, 'Failed to submit support ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedType = ISSUE_TYPES.find(type => type.value === formData.type);
  const IconComponent = selectedType?.icon || HelpCircle;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-600">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
              <IconComponent className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Submit Support Ticket
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                We're here to help! Describe your issue and we'll get back to you.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg theme-transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Issue Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              What type of issue are you experiencing?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ISSUE_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeChange(type.value)}
                    className={`p-4 border-2 rounded-lg text-left theme-transition ${
                      formData.type === type.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${
                        formData.type === type.value
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-400'
                      }`} />
                      <div>
                        <div className={`font-medium ${
                          formData.type === type.value
                            ? 'text-primary-900 dark:text-primary-100'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {type.label}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority Level
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
            >
              {PRIORITY_LEVELS.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder="Brief description of the issue"
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Please provide a detailed description of the issue..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          {/* Bug-specific fields */}
          {formData.type === 'bug' && (
            <div className="space-y-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-medium text-red-900 dark:text-red-100">Bug Report Details</h4>
              
              <div>
                <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                  Steps to Reproduce
                </label>
                <textarea
                  name="steps_to_reproduce"
                  value={formData.steps_to_reproduce}
                  onChange={handleInputChange}
                  placeholder="1. Go to...\n2. Click on...\n3. See error"
                  rows={3}
                  className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                  Expected Behavior
                </label>
                <textarea
                  name="expected_behavior"
                  value={formData.expected_behavior}
                  onChange={handleInputChange}
                  placeholder="What should have happened?"
                  rows={2}
                  className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                  Actual Behavior
                </label>
                <textarea
                  name="actual_behavior"
                  value={formData.actual_behavior}
                  onChange={handleInputChange}
                  placeholder="What actually happened?"
                  rows={2}
                  className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          )}

          {/* Contact Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preferred Contact Method
            </label>
            <select
              name="contact_method"
              value={formData.contact_method}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="system">In-system notification</option>
            </select>
          </div>

          {/* System Information */}
          <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">System Information</h4>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div><strong>Current URL:</strong> {formData.url}</div>
              <div><strong>Browser:</strong> {formData.browser_info}</div>
              <div><strong>User:</strong> {user?.email}</div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-dark-600">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg theme-transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed theme-transition"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Submitting...' : 'Submit Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupportTicketForm;