import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { useModal } from '@/shared/components/ModalContext';
import { Section, TextField, TextArea } from '@/shared/components/ui';
import RazorpayReimbursementForm from './RazorpayReimbursementForm';

const INCENTIVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DISBURSED: 'disbursed'
};

const STATUS_COLORS = {
  [INCENTIVE_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [INCENTIVE_STATUS.APPROVED]: 'bg-green-100 text-green-800 border-green-200',
  [INCENTIVE_STATUS.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
  [INCENTIVE_STATUS.DISBURSED]: 'bg-blue-100 text-blue-800 border-blue-200'
};

const STATUS_ICONS = {
  [INCENTIVE_STATUS.PENDING]: '⏳',
  [INCENTIVE_STATUS.APPROVED]: '✅',
  [INCENTIVE_STATUS.REJECTED]: '❌',
  [INCENTIVE_STATUS.DISBURSED]: '💰'
};

const INCENTIVE_TYPES = {
  hiring_recommendation: {
    name: 'Hiring Recommendation',
    amount: 3000,
    icon: '👥',
    color: 'bg-blue-50 border-blue-200'
  },
  client_testimonial: {
    name: 'Client Testimonial',
    amount: 1000,
    icon: '🎥',
    color: 'bg-green-50 border-green-200'
  },
  promotional_video: {
    name: 'Promotional Video',
    amount: 500,
    icon: '📹',
    color: 'bg-purple-50 border-purple-200'
  }
};

export default function HRIncentiveApproval() {
  const { supabase } = useSupabase();
  const { notify } = useToast();
  const { openModal, closeModal } = useModal();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      
      if (supabase) {
        const { data, error } = await supabase
          .from('incentive_applications')
          .select('*')
          .order('application_date', { ascending: false });
        
        if (error) throw error;
        setApplications(data || []);
      } else {
        // Local mode fallback
        const localApplications = JSON.parse(localStorage.getItem('incentive_applications') || '[]');
        setApplications(localApplications.filter(app => app.status === 'pending'));
      }
    } catch (error) {
      console.error('Error loading incentive applications:', error);
      notify('Failed to load incentive applications', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, notify]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const filteredApplications = applications.filter(app => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesType = typeFilter === 'all' || app.incentive_type_name.toLowerCase().includes(typeFilter.toLowerCase());
    const matchesSearch = !searchTerm || 
      app.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.employee_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const handleApprove = useCallback(async (application) => {
    openModal({
      title: '✅ Approve Incentive Application',
      content: (
        <ApprovalForm
          application={application}
          action="approve"
          onSubmit={async (data) => {
            try {
              if (supabase) {
                const { error } = await supabase.rpc('approve_incentive_application', {
                  application_id: application.id,
                  reviewer_id: 'hr-user', // In real app, use actual user ID
                  approval_status: 'approved',
                  review_notes: data.reviewNotes
                });
                
                if (error) throw error;
              } else {
                // Local mode
                const localApplications = JSON.parse(localStorage.getItem('incentive_applications') || '[]');
                const updatedApplications = localApplications.map(app => 
                  app.id === application.id 
                    ? { ...app, status: 'approved', review_notes: data.reviewNotes, reviewed_at: new Date().toISOString() }
                    : app
                );
                localStorage.setItem('incentive_applications', JSON.stringify(updatedApplications));
              }
              
              await loadApplications();
              closeModal();
              notify(`${application.employee_name}'s incentive application has been approved`, 'success');
            } catch (error) {
              console.error('Error approving application:', error);
              notify('Failed to approve application', 'error');
            }
          }}
        />
      )
    });
  }, [supabase, openModal, closeModal, notify, loadApplications]);

  const handleReject = useCallback(async (application) => {
    openModal({
      title: '❌ Reject Incentive Application',
      content: (
        <ApprovalForm
          application={application}
          action="reject"
          onSubmit={async (data) => {
            try {
              if (supabase) {
                const { error } = await supabase.rpc('approve_incentive_application', {
                  application_id: application.id,
                  reviewer_id: 'hr-user', // In real app, use actual user ID
                  approval_status: 'rejected',
                  review_notes: data.reviewNotes
                });
                
                if (error) throw error;
              } else {
                // Local mode
                const localApplications = JSON.parse(localStorage.getItem('incentive_applications') || '[]');
                const updatedApplications = localApplications.map(app => 
                  app.id === application.id 
                    ? { ...app, status: 'rejected', review_notes: data.reviewNotes, reviewed_at: new Date().toISOString() }
                    : app
                );
                localStorage.setItem('incentive_applications', JSON.stringify(updatedApplications));
              }
              
              await loadApplications();
              closeModal();
              notify(`${application.employee_name}'s incentive application has been rejected`, 'info');
            } catch (error) {
              console.error('Error rejecting application:', error);
              notify('Failed to reject application', 'error');
            }
          }}
        />
      )
    });
  }, [supabase, openModal, closeModal, notify, loadApplications]);

  const handleViewDetails = useCallback((application) => {
    openModal({
      title: `📋 Incentive Application Details - ${application.employee_name}`,
      content: <ApplicationDetails application={application} />,
      size: 'large'
    });
  }, [openModal]);

  const handleOpenRazorpayForm = useCallback((application) => {
    openModal({
      title: '💰 Razorpay Reimbursement Form',
      content: (
        <RazorpayReimbursementForm
          applicationId={application.id}
          onSuccess={() => {
            closeModal();
            loadApplications();
            notify('Reimbursement form submitted successfully', 'success');
          }}
          onCancel={closeModal}
        />
      ),
      size: 'large'
    });
  }, [openModal, closeModal, loadApplications, notify]);

  const handleMarkDisbursed = useCallback(async (application) => {
    openModal({
      title: '💰 Mark as Disbursed',
      content: (
        <DisbursementForm
          application={application}
          onSubmit={async (data) => {
            try {
              if (supabase) {
                const { error } = await supabase.rpc('mark_incentive_disbursed', {
                  application_id: application.id,
                  disbursement_reference: data.reference,
                  disbursement_notes: data.notes
                });
                
                if (error) throw error;
              } else {
                // Local mode
                const localApplications = JSON.parse(localStorage.getItem('incentive_applications') || '[]');
                const updatedApplications = localApplications.map(app => 
                  app.id === application.id 
                    ? { 
                        ...app, 
                        status: 'disbursed', 
                        disbursement_reference: data.reference,
                        disbursement_notes: data.notes,
                        disbursement_date: new Date().toISOString() 
                      }
                    : app
                );
                localStorage.setItem('incentive_applications', JSON.stringify(updatedApplications));
              }
              
              await loadApplications();
              closeModal();
              notify(`Incentive marked as disbursed for ${application.employee_name}`, 'success');
            } catch (error) {
              console.error('Error marking as disbursed:', error);
              notify('Failed to mark as disbursed', 'error');
            }
          }}
        />
      )
    });
  }, [supabase, openModal, closeModal, notify, loadApplications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading incentive applications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Incentive Approval</h1>
          <p className="text-gray-600">Review and manage employee incentive applications</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={loadApplications}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <TextField
              label="Search Applications"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by name, email, or department..."
            />
          </div>
          
          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="disbursed">Disbursed</option>
            </select>
          </div>
          
          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="hiring">Hiring Recommendation</option>
              <option value="testimonial">Client Testimonial</option>
              <option value="promotional">Promotional Video</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(INCENTIVE_STATUS).map(([key, status]) => {
          const count = applications.filter(app => app.status === status).length;
          return (
            <div key={status} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <span className="text-2xl mr-2">{STATUS_ICONS[status]}</span>
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">{status.replace('_', ' ')}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Incentive Applications ({filteredApplications.length})
          </h3>
        </div>
        
        {filteredApplications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600">No incentive applications match your current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredApplications.map((application) => {
              const incentiveType = INCENTIVE_TYPES[application.incentive_type_name?.toLowerCase().replace(' ', '_')] || 
                                   INCENTIVE_TYPES.hiring_recommendation;
              
              return (
                <div key={application.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{incentiveType.icon}</span>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {application.employee_name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {application.employee_email} • {application.department}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Incentive Type</p>
                          <p className="text-sm text-gray-600">{application.incentive_type_name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Amount</p>
                          <p className="text-sm text-gray-600">₹{application.incentive_amount}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Application Date</p>
                          <p className="text-sm text-gray-600">
                            {new Date(application.application_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Eligible Date</p>
                          <p className="text-sm text-gray-600">
                            {new Date(application.eligible_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700">Proof Details</p>
                        <p className="text-sm text-gray-600">{application.proof_details}</p>
                      </div>
                      
                      {!application.is_eligible_now && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-sm text-yellow-800">
                            ⚠️ Not eligible yet. Eligible from {new Date(application.eligible_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[application.status]}`}>
                        {STATUS_ICONS[application.status]} {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(application)}
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          View Details
                        </button>
                        
                        {application.status === 'pending' && application.is_eligible_now && (
                          <>
                            <button
                              onClick={() => handleApprove(application)}
                              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => handleReject(application)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                        
                        {application.status === 'approved' && (
                          <>
                            <button
                              onClick={() => handleOpenRazorpayForm(application)}
                              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                            >
                              💳 Razorpay Form
                            </button>
                            <button
                              onClick={() => handleMarkDisbursed(application)}
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              💰 Mark Disbursed
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Approval Form Component
function ApprovalForm({ application, action, onSubmit }) {
  const { notify } = useToast();
  const [formData, setFormData] = useState({
    reviewNotes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reviewNotes.trim()) {
      notify('Please provide review notes', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      notify('Failed to submit form', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Application Summary</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Employee:</strong> {application.employee_name}</p>
          <p><strong>Type:</strong> {application.incentive_type_name}</p>
          <p><strong>Amount:</strong> ₹{application.incentive_amount}</p>
          <p><strong>Proof:</strong> {application.proof_details}</p>
        </div>
      </div>
      
      <TextArea
        label={`${action === 'approve' ? 'Approval' : 'Rejection'} Notes`}
        value={formData.reviewNotes}
        onChange={(value) => setFormData({ ...formData, reviewNotes: value })}
        placeholder={`Enter ${action === 'approve' ? 'approval' : 'rejection'} notes and feedback...`}
        rows={4}
        required
      />
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 text-white rounded-md ${
            action === 'approve' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
          } disabled:opacity-50`}
        >
          {isSubmitting ? 'Processing...' : `${action === 'approve' ? 'Approve' : 'Reject'} Application`}
        </button>
      </div>
    </form>
  );
}

// Application Details Component
function ApplicationDetails({ application }) {
  return (
    <div className="space-y-6">
      <Section title="Employee Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="text-sm text-gray-900">{application.employee_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="text-sm text-gray-900">{application.employee_email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <p className="text-sm text-gray-900">{application.department}</p>
          </div>
        </div>
      </Section>
      
      <Section title="Incentive Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <p className="text-sm text-gray-900">{application.incentive_type_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <p className="text-sm text-gray-900">₹{application.incentive_amount}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Application Date</label>
            <p className="text-sm text-gray-900">{new Date(application.application_date).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Eligible Date</label>
            <p className="text-sm text-gray-900">{new Date(application.eligible_date).toLocaleDateString()}</p>
          </div>
        </div>
      </Section>
      
      <Section title="Proof Details">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-900">{application.proof_details}</p>
        </div>
      </Section>
      
      <Section title="Eligibility Status">
        <div className={`p-4 rounded-lg ${
          application.is_eligible_now 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <p className={`text-sm ${
            application.is_eligible_now ? 'text-green-800' : 'text-yellow-800'
          }`}>
            {application.is_eligible_now 
              ? '✅ Eligible for approval' 
              : `⚠️ Not eligible until ${new Date(application.eligible_date).toLocaleDateString()}`
            }
          </p>
        </div>
      </Section>
    </div>
  );
}

// Disbursement Form Component
function DisbursementForm({ application, onSubmit }) {
  const { notify } = useToast();
  const [formData, setFormData] = useState({
    reference: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reference.trim()) {
      notify('Please provide disbursement reference', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      notify('Failed to submit form', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Disbursement Details</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Employee:</strong> {application.employee_name}</p>
          <p><strong>Amount:</strong> ₹{application.incentive_amount}</p>
          <p><strong>Type:</strong> {application.incentive_type_name}</p>
        </div>
      </div>
      
      <TextField
        label="Disbursement Reference"
        value={formData.reference}
        onChange={(value) => setFormData({ ...formData, reference: value })}
        placeholder="Enter Razorpay transaction ID or reference number"
        required
      />
      
      <TextArea
        label="Disbursement Notes"
        value={formData.notes}
        onChange={(value) => setFormData({ ...formData, notes: value })}
        placeholder="Enter any additional notes about the disbursement..."
        rows={3}
      />
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Processing...' : 'Mark as Disbursed'}
        </button>
      </div>
    </form>
  );
}