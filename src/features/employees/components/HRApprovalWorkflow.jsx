import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { useModal } from '@/shared/components/ModalContext';
import { useEmployeeSync } from '@/features/employees/context/EmployeeSyncContext';
import { Section, TextField, TextArea } from '@/shared/components/ui';

const SIGNUP_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

const STATUS_COLORS = {
  [SIGNUP_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [SIGNUP_STATUS.APPROVED]: 'bg-green-100 text-green-800 border-green-200',
  [SIGNUP_STATUS.REJECTED]: 'bg-red-100 text-red-800 border-red-200'
};

const STATUS_ICONS = {
  [SIGNUP_STATUS.PENDING]: '⏳',
  [SIGNUP_STATUS.APPROVED]: '✅',
  [SIGNUP_STATUS.REJECTED]: '❌'
};

export function HRApprovalWorkflow() {
  const supabase = useSupabase();
  const { notify } = useToast();
  const { openModal, closeModal } = useModal();
  const { refreshEmployees } = useEmployeeSync();
  
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const loadSignups = useCallback(async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('employee_signups')
          .select('*')
          .order('submitted_at', { ascending: false });
          
        if (error) throw error;
        setSignups(data || []);
      } else {
        // Local mode
        const localSignups = JSON.parse(localStorage.getItem('employee_signups') || '[]');
        setSignups(localSignups.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)));
      }
    } catch (error) {
      console.error('Error loading signups:', error);
      notify('Failed to load signup applications', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, notify]);
  
  useEffect(() => {
    loadSignups();
  }, [loadSignups]);
  
  const filteredSignups = signups.filter(signup => {
    const matchesFilter = filter === 'all' || signup.status === filter;
    const matchesSearch = !searchTerm || 
      signup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signup.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signup.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  
  const handleApprove = useCallback(async (signup) => {
    openModal({
      title: '✅ Approve Application',
      content: (
        <ApprovalForm
          signup={signup}
          action="approve"
          onSubmit={async (data) => {
            try {
              if (supabase) {
                // Update signup status
                await supabase
                  .from('employee_signups')
                  .update({
                    status: SIGNUP_STATUS.APPROVED,
                    hr_notes: data.hrNotes,
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: 'HR Team' // In real app, use actual user
                  })
                  .eq('id', signup.id);
                
                // Create employee record
                const employeeData = {
                  name: signup.name,
                  email: signup.email,
                  phone: signup.phone,
                  department: signup.department,
                  role: signup.role.join(', '),
                  status: 'active',
                  hire_date: data.startDate || signup.expectedJoinDate,
                  address: `${signup.address.street}, ${signup.address.city}, ${signup.address.state} ${signup.address.zipCode}`,
                  emergency_contact: `${signup.emergencyContact.name} (${signup.emergencyContact.relationship}) - ${signup.emergencyContact.phone}`,
                  notes: `Approved from signup. Education: ${signup.education}. Experience: ${signup.experience}.`
                };
                
                await supabase
                  .from('employees')
                  .insert([employeeData]);
                
                // Send approval notification
                await supabase
                  .from('notifications')
                  .insert([{
                    type: 'employee_approved',
                    title: 'Application Approved',
                    message: `${signup.name}'s employee application has been approved. Welcome to the team!`,
                    data: { applicantEmail: signup.email, startDate: data.startDate },
                    created_at: new Date().toISOString()
                  }]);
              } else {
                // Local mode
                const localSignups = JSON.parse(localStorage.getItem('employee_signups') || '[]');
                const updatedSignups = localSignups.map(s => 
                  s.id === signup.id 
                    ? { ...s, status: SIGNUP_STATUS.APPROVED, hr_notes: data.hrNotes, reviewed_at: new Date().toISOString() }
                    : s
                );
                localStorage.setItem('employee_signups', JSON.stringify(updatedSignups));
                
                // Add to employees
                const employees = JSON.parse(localStorage.getItem('employees') || '[]');
                employees.push({
                  id: Date.now().toString(),
                  name: signup.name,
                  email: signup.email,
                  phone: signup.phone,
                  department: signup.department,
                  role: signup.role.join(', '),
                  status: 'active',
                  hire_date: data.startDate || signup.expectedJoinDate
                });
                localStorage.setItem('employees', JSON.stringify(employees));
              }
              
              await loadSignups();
              await refreshEmployees();
              closeModal();
              notify(`${signup.name}'s application has been approved!`, 'success');
            } catch (error) {
              console.error('Error approving application:', error);
              notify('Failed to approve application', 'error');
            }
          }}
        />
      )
    });
  }, [supabase, openModal, closeModal, notify, loadSignups, refreshEmployees]);
  
  const handleReject = useCallback(async (signup) => {
    openModal({
      title: '❌ Reject Application',
      content: (
        <ApprovalForm
          signup={signup}
          action="reject"
          onSubmit={async (data) => {
            try {
              if (supabase) {
                await supabase
                  .from('employee_signups')
                  .update({
                    status: SIGNUP_STATUS.REJECTED,
                    hr_notes: data.hrNotes,
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: 'HR Team'
                  })
                  .eq('id', signup.id);
                
                // Send rejection notification
                await supabase
                  .from('notifications')
                  .insert([{
                    type: 'employee_rejected',
                    title: 'Application Status Update',
                    message: `${signup.name}'s employee application has been reviewed.`,
                    data: { applicantEmail: signup.email, reason: data.hrNotes },
                    created_at: new Date().toISOString()
                  }]);
              } else {
                // Local mode
                const localSignups = JSON.parse(localStorage.getItem('employee_signups') || '[]');
                const updatedSignups = localSignups.map(s => 
                  s.id === signup.id 
                    ? { ...s, status: SIGNUP_STATUS.REJECTED, hr_notes: data.hrNotes, reviewed_at: new Date().toISOString() }
                    : s
                );
                localStorage.setItem('employee_signups', JSON.stringify(updatedSignups));
              }
              
              await loadSignups();
              closeModal();
              notify(`${signup.name}'s application has been rejected`, 'info');
            } catch (error) {
              console.error('Error rejecting application:', error);
              notify('Failed to reject application', 'error');
            }
          }}
        />
      )
    });
  }, [supabase, openModal, closeModal, notify, loadSignups]);
  
  const handleViewDetails = useCallback((signup) => {
    openModal({
      title: `📋 Application Details - ${signup.name}`,
      content: <ApplicationDetails signup={signup} />,
      size: 'large'
    });
  }, [openModal]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading applications...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Approval Workflow</h1>
          <p className="text-gray-600">Review and manage employee signup applications</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={loadSignups}
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
          
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Applications</option>
              <option value={SIGNUP_STATUS.PENDING}>Pending Review</option>
              <option value={SIGNUP_STATUS.APPROVED}>Approved</option>
              <option value={SIGNUP_STATUS.REJECTED}>Rejected</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Applications', value: signups.length, color: 'bg-blue-500' },
          { label: 'Pending Review', value: signups.filter(s => s.status === SIGNUP_STATUS.PENDING).length, color: 'bg-yellow-500' },
          { label: 'Approved', value: signups.filter(s => s.status === SIGNUP_STATUS.APPROVED).length, color: 'bg-green-500' },
          { label: 'Rejected', value: signups.filter(s => s.status === SIGNUP_STATUS.REJECTED).length, color: 'bg-red-500' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${stat.color} mr-3`}></div>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Applications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredSignups.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No employee signup applications have been submitted yet'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSignups.map((signup) => (
              <div key={signup.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{signup.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[signup.status]}`}>
                        {STATUS_ICONS[signup.status]} {signup.status.charAt(0).toUpperCase() + signup.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Email:</span> {signup.email}
                      </div>
                      <div>
                        <span className="font-medium">Department:</span> {signup.department}
                      </div>
                      <div>
                        <span className="font-medium">Role(s):</span> {Array.isArray(signup.role) ? signup.role.join(', ') : signup.role}
                      </div>
                      <div>
                        <span className="font-medium">Expected Join:</span> {new Date(signup.expectedJoinDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Submitted:</span> {new Date(signup.submitted_at).toLocaleDateString()}
                      </div>
                      {signup.reviewed_at && (
                        <div>
                          <span className="font-medium">Reviewed:</span> {new Date(signup.reviewed_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    {signup.hr_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">HR Notes:</span> {signup.hr_notes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(signup)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      View Details
                    </button>
                    
                    {signup.status === SIGNUP_STATUS.PENDING && (
                      <>
                        <button
                          onClick={() => handleApprove(signup)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleReject(signup)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Approval Form Component
function ApprovalForm({ signup, action, onSubmit }) {
  const { notify } = useToast();
  const [formData, setFormData] = useState({
    hrNotes: '',
    startDate: action === 'approve' ? signup.expectedJoinDate : ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.hrNotes.trim()) {
      notify({ type: 'error', title: 'Validation Error', message: 'Please provide HR notes' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Application Summary</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Name:</strong> {signup.name}</p>
          <p><strong>Email:</strong> {signup.email}</p>
          <p><strong>Department:</strong> {signup.department}</p>
          <p><strong>Role(s):</strong> {Array.isArray(signup.role) ? signup.role.join(', ') : signup.role}</p>
          <p><strong>Expected Join Date:</strong> {new Date(signup.expectedJoinDate).toLocaleDateString()}</p>
        </div>
      </div>
      
      {action === 'approve' && (
        <TextField
          label="Start Date"
          type="date"
          value={formData.startDate}
          onChange={(value) => setFormData(prev => ({ ...prev, startDate: value }))}
          required
        />
      )}
      
      <TextArea
        label={action === 'approve' ? 'Approval Notes' : 'Rejection Reason'}
        value={formData.hrNotes}
        onChange={(value) => setFormData(prev => ({ ...prev, hrNotes: value }))}
        placeholder={action === 'approve' 
          ? 'Add any notes for the new employee, onboarding instructions, etc.'
          : 'Please provide a reason for rejection that will be communicated to the applicant'
        }
        rows={4}
        required
      />
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => window.closeModal && window.closeModal()}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 rounded-md text-white disabled:opacity-50 ${
            action === 'approve' 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isSubmitting ? 'Processing...' : (action === 'approve' ? 'Approve Application' : 'Reject Application')}
        </button>
      </div>
    </form>
  );
}

// Application Details Component
function ApplicationDetails({ signup }) {
  return (
    <div className="space-y-6 max-h-96 overflow-y-auto">
      {/* Personal Information */}
      <Section title="Personal Information" icon="👤">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><strong>Name:</strong> {signup.name}</div>
          <div><strong>Email:</strong> {signup.email}</div>
          <div><strong>Phone:</strong> {signup.phone}</div>
          <div><strong>Date of Birth:</strong> {signup.dateOfBirth ? new Date(signup.dateOfBirth).toLocaleDateString() : 'Not provided'}</div>
        </div>
      </Section>
      
      {/* Address */}
      <Section title="Address" icon="📍">
        <div className="text-sm">
          <p>{signup.address?.street}</p>
          <p>{signup.address?.city}, {signup.address?.state} {signup.address?.zipCode}</p>
          <p>{signup.address?.country}</p>
        </div>
      </Section>
      
      {/* Emergency Contact */}
      <Section title="Emergency Contact" icon="🚨">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><strong>Name:</strong> {signup.emergencyContact?.name}</div>
          <div><strong>Relationship:</strong> {signup.emergencyContact?.relationship}</div>
          <div><strong>Phone:</strong> {signup.emergencyContact?.phone}</div>
          <div><strong>Email:</strong> {signup.emergencyContact?.email}</div>
        </div>
      </Section>
      
      {/* Professional Information */}
      <Section title="Professional Information" icon="💼">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><strong>Department:</strong> {signup.department}</div>
          <div><strong>Role(s):</strong> {Array.isArray(signup.role) ? signup.role.join(', ') : signup.role}</div>
          <div><strong>Expected Join Date:</strong> {new Date(signup.expectedJoinDate).toLocaleDateString()}</div>
          <div><strong>Expected Salary:</strong> {signup.expectedSalary || 'Not specified'}</div>
        </div>
      </Section>
      
      {/* Education & Experience */}
      <Section title="Education & Experience" icon="🎓">
        <div className="space-y-4 text-sm">
          <div>
            <strong>Education:</strong>
            <p className="mt-1 text-gray-600">{signup.education}</p>
          </div>
          <div>
            <strong>Experience:</strong>
            <p className="mt-1 text-gray-600">{signup.experience}</p>
          </div>
          {signup.skills && signup.skills.length > 0 && (
            <div>
              <strong>Skills:</strong>
              <div className="mt-1 flex flex-wrap gap-1">
                {signup.skills.map((skill, index) => (
                  <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          {signup.certifications && (
            <div>
              <strong>Certifications:</strong>
              <p className="mt-1 text-gray-600">{signup.certifications}</p>
            </div>
          )}
        </div>
      </Section>
      
      {/* Additional Information */}
      <Section title="Additional Information" icon="🔗">
        <div className="space-y-4 text-sm">
          {signup.portfolioUrl && (
            <div>
              <strong>Portfolio:</strong>
              <a href={signup.portfolioUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                {signup.portfolioUrl}
              </a>
            </div>
          )}
          {signup.linkedinUrl && (
            <div>
              <strong>LinkedIn:</strong>
              <a href={signup.linkedinUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                {signup.linkedinUrl}
              </a>
            </div>
          )}
          {signup.githubUrl && (
            <div>
              <strong>GitHub:</strong>
              <a href={signup.githubUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                {signup.githubUrl}
              </a>
            </div>
          )}
          {signup.coverLetter && (
            <div>
              <strong>Cover Letter:</strong>
              <p className="mt-1 text-gray-600">{signup.coverLetter}</p>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

export default HRApprovalWorkflow;