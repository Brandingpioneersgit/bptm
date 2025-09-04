import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/shared/hooks/useUnifiedAuth';
import { useToast } from '@/shared/hooks/useToast';
import { useDataSync } from './DataSyncContext';
import { useFetchSubmissions } from './useFetchSubmissions';

// New Report Dashboard Component
export const NewReportDashboard = ({ onNavigateToDashboard }) => {
  const { user, role } = useUnifiedAuth();
  const { toast } = useToast();
  const { clients, employees } = useDataSync();
  const { submissions, fetchSubmissions, addSubmission, updateSubmission } = useFetchSubmissions();
  const [reportData, setReportData] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
    status: 'pending',
    attachments: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);

  // Report categories based on role
  const getReportCategories = () => {
    const baseCategories = [
      { value: 'general', label: 'General Report' },
      { value: 'progress', label: 'Progress Update' },
      { value: 'issue', label: 'Issue Report' },
      { value: 'feedback', label: 'Feedback' }
    ];

    if (role?.includes('SEO')) {
      return [...baseCategories, 
        { value: 'seo_audit', label: 'SEO Audit' },
        { value: 'keyword_research', label: 'Keyword Research' },
        { value: 'content_optimization', label: 'Content Optimization' }
      ];
    }

    if (role?.includes('Ads')) {
      return [...baseCategories,
        { value: 'campaign_performance', label: 'Campaign Performance' },
        { value: 'ad_optimization', label: 'Ad Optimization' },
        { value: 'budget_report', label: 'Budget Report' }
      ];
    }

    if (role?.includes('Social Media')) {
      return [...baseCategories,
        { value: 'social_analytics', label: 'Social Media Analytics' },
        { value: 'content_calendar', label: 'Content Calendar' },
        { value: 'engagement_report', label: 'Engagement Report' }
      ];
    }

    if (role?.includes('Designer')) {
      return [...baseCategories,
        { value: 'design_review', label: 'Design Review' },
        { value: 'brand_guidelines', label: 'Brand Guidelines' },
        { value: 'creative_assets', label: 'Creative Assets' }
      ];
    }

    return baseCategories;
  };

  useEffect(() => {
    fetchSubmissions();
    loadReportHistory();
  }, []);

  const loadReportHistory = () => {
    // Filter submissions to show only reports created by current user
    const userReports = submissions.filter(submission => 
      submission.created_by === user?.id && 
      submission.type === 'report'
    );
    setReportHistory(userReports);
  };

  const handleInputChange = (field, value) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitReport = async () => {
    if (!reportData.title.trim() || !reportData.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newReport = {
        ...reportData,
        type: 'report',
        created_by: user?.id,
        created_by_role: role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await addSubmission(newReport);
      
      toast({
        title: 'Report Submitted',
        description: 'Your report has been successfully submitted',
        variant: 'default'
      });

      // Reset form
      setReportData({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
        assignedTo: '',
        dueDate: '',
        status: 'pending',
        attachments: []
      });

      // Refresh history
      loadReportHistory();
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const reportCategories = getReportCategories();
  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-brand p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-brand-text">New Report Dashboard</h2>
            <p className="text-brand-text-secondary mt-1">
              Create and submit reports for your projects and tasks
            </p>
          </div>
          <button
            onClick={() => onNavigateToDashboard?.('agency')}
            className="btn-brand-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Form */}
        <div className="card-brand p-6">
          <h3 className="text-xl font-semibold text-brand-text mb-6">Create New Report</h3>
          
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">
                Report Title *
              </label>
              <input
                type="text"
                value={reportData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter report title"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">
                Category
              </label>
              <select
                value={reportData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {reportCategories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">
                Priority
              </label>
              <select
                value={reportData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {priorityOptions.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">
                Assign To
              </label>
              <select
                value={reportData.assignedTo}
                onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select assignee (optional)</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={reportData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">
                Description *
              </label>
              <textarea
                value={reportData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your report in detail..."
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitReport}
              disabled={isSubmitting}
              className="w-full btn-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </div>

        {/* Report History */}
        <div className="card-brand p-6">
          <h3 className="text-xl font-semibold text-brand-text mb-6">Recent Reports</h3>
          
          {reportHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-brand-text-secondary">No reports submitted yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportHistory.slice(0, 5).map((report, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-brand-text">{report.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      report.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {report.priority}
                    </span>
                  </div>
                  <p className="text-sm text-brand-text-secondary mb-2">
                    {report.description.substring(0, 100)}...
                  </p>
                  <div className="flex justify-between items-center text-xs text-brand-text-secondary">
                    <span>Category: {report.category}</span>
                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-brand p-6 text-center">
          <div className="text-2xl font-bold text-brand-primary mb-1">
            {reportHistory.length}
          </div>
          <div className="text-sm text-brand-text-secondary">Total Reports</div>
        </div>
        <div className="card-brand p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {reportHistory.filter(r => r.status === 'completed').length}
          </div>
          <div className="text-sm text-brand-text-secondary">Completed</div>
        </div>
        <div className="card-brand p-6 text-center">
          <div className="text-2xl font-bold text-yellow-600 mb-1">
            {reportHistory.filter(r => r.status === 'pending').length}
          </div>
          <div className="text-sm text-brand-text-secondary">Pending</div>
        </div>
        <div className="card-brand p-6 text-center">
          <div className="text-2xl font-bold text-red-600 mb-1">
            {reportHistory.filter(r => r.priority === 'urgent').length}
          </div>
          <div className="text-sm text-brand-text-secondary">Urgent</div>
        </div>
      </div>
    </div>
  );
};

export default NewReportDashboard;