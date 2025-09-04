import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { useAuth } from '@/features/auth/useAuth';
import { Section, TextField, TextArea, SelectField } from '@/shared/components/ui';

const INCENTIVE_TYPES = {
  hiring_recommendation: {
    name: 'Full-time Hire Recommendation',
    amount: 3000,
    currency: 'INR',
    description: 'Recommend a candidate who gets hired full-time (eligible after 3 months)',
    eligibilityMonths: 3,
    proofFields: ['recommended_candidate_name', 'appointment_letter_url']
  },
  client_testimonial: {
    name: 'Client Video Testimonial',
    amount: 1000,
    currency: 'INR (Amazon Coupon)',
    description: 'Get a video testimonial from client posted on YouTube',
    eligibilityMonths: 0,
    proofFields: ['client_name', 'testimonial_youtube_url']
  },
  promotional_video: {
    name: 'Department Promotional Video',
    amount: 500,
    currency: 'INR',
    description: 'Create an advertisement/promotional video for your department',
    eligibilityMonths: 0,
    proofFields: ['video_title', 'video_description', 'promotional_video_url']
  }
};

const EmployeeIncentiveForm = () => {
  const { supabase } = useSupabase();
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    incentive_type: '',
    
    // Hiring recommendation fields
    recommended_candidate_name: '',
    appointment_letter_url: '',
    
    // Client testimonial fields
    client_name: '',
    testimonial_youtube_url: '',
    
    // Promotional video fields
    video_title: '',
    video_description: '',
    promotional_video_url: ''
  });
  
  const [employeeData, setEmployeeData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  
  useEffect(() => {
    if (user?.email) {
      fetchEmployeeData();
      fetchMyApplications();
    }
  }, [user]);
  
  const fetchEmployeeData = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, email, department, role')
        .eq('email', user.email)
        .single();
      
      if (error) throw error;
      setEmployeeData(data);
    } catch (error) {
      console.error('Error fetching employee data:', error);
      showToast('Error loading employee information', 'error');
    }
  };
  
  const fetchMyApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('incentive_applications')
        .select(`
          *,
          incentive_types!inner(type_name)
        `)
        .eq('employee_email', user.email)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMyApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const validateForm = () => {
    if (!formData.incentive_type) {
      showToast('Please select an incentive type', 'error');
      return false;
    }
    
    const selectedType = INCENTIVE_TYPES[formData.incentive_type];
    const requiredFields = selectedType.proofFields;
    
    for (const field of requiredFields) {
      if (!formData[field]?.trim()) {
        showToast(`Please fill in all required fields for ${selectedType.name}`, 'error');
        return false;
      }
    }
    
    // Validate YouTube URL format for client testimonial
    if (formData.incentive_type === 'client_testimonial') {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
      if (!youtubeRegex.test(formData.testimonial_youtube_url)) {
        showToast('Please enter a valid YouTube URL', 'error');
        return false;
      }
    }
    
    // Validate Google Drive URL format for file uploads
    if (formData.incentive_type === 'hiring_recommendation' && formData.appointment_letter_url) {
      if (!formData.appointment_letter_url.includes('drive.google.com')) {
        showToast('Please provide a Google Drive link for the appointment letter', 'error');
        return false;
      }
    }
    
    if (formData.incentive_type === 'promotional_video' && formData.promotional_video_url) {
      if (!formData.promotional_video_url.includes('drive.google.com')) {
        showToast('Please provide a Google Drive link for the promotional video', 'error');
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || !employeeData) return;
    
    setIsSubmitting(true);
    
    try {
      const applicationData = {
        employee_id: employeeData.id,
        employee_name: employeeData.name,
        employee_email: employeeData.email,
        department: employeeData.department,
        incentive_type: formData.incentive_type,
        
        // Type-specific fields
        ...(formData.incentive_type === 'hiring_recommendation' && {
          recommended_candidate_name: formData.recommended_candidate_name,
          appointment_letter_url: formData.appointment_letter_url
        }),
        
        ...(formData.incentive_type === 'client_testimonial' && {
          client_name: formData.client_name,
          testimonial_youtube_url: formData.testimonial_youtube_url
        }),
        
        ...(formData.incentive_type === 'promotional_video' && {
          video_title: formData.video_title,
          video_description: formData.video_description,
          promotional_video_url: formData.promotional_video_url
        })
      };
      
      const { data, error } = await supabase
        .from('incentive_applications')
        .insert([applicationData])
        .select();
      
      if (error) throw error;
      
      showToast('Incentive application submitted successfully!', 'success');
      
      // Reset form
      setFormData({
        incentive_type: '',
        recommended_candidate_name: '',
        appointment_letter_url: '',
        client_name: '',
        testimonial_youtube_url: '',
        video_title: '',
        video_description: '',
        promotional_video_url: ''
      });
      
      // Refresh applications list
      fetchMyApplications();
      
    } catch (error) {
      console.error('Error submitting application:', error);
      showToast('Error submitting application. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'disbursed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const renderProofFields = () => {
    if (!formData.incentive_type) return null;
    
    const selectedType = INCENTIVE_TYPES[formData.incentive_type];
    
    switch (formData.incentive_type) {
      case 'hiring_recommendation':
        return (
          <div className="space-y-4">
            <TextField
              label="Recommended Candidate Name *"
              value={formData.recommended_candidate_name}
              onChange={(e) => handleInputChange('recommended_candidate_name', e.target.value)}
              placeholder="Enter the full name of the recommended candidate"
            />
            
            <div>
              <TextField
                label="Appointment Letter Screenshot (Google Drive Link) *"
                value={formData.appointment_letter_url}
                onChange={(e) => handleInputChange('appointment_letter_url', e.target.value)}
                placeholder="Paste Google Drive link to appointment letter screenshot"
              />
              <p className="text-sm text-blue-600 mt-2">
                📋 Please upload the appointment letter screenshot to Google Drive and share access with: <strong>brandingpioneers@gmail.com</strong>
              </p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="font-medium text-amber-800 mb-2">⏰ Eligibility Notice</h4>
              <p className="text-sm text-amber-700">
                This incentive becomes eligible for approval 3 months after the candidate's joining date.
                Please ensure the candidate has completed 3 months of employment before applying.
              </p>
            </div>
          </div>
        );
        
      case 'client_testimonial':
        return (
          <div className="space-y-4">
            <TextField
              label="Client Name *"
              value={formData.client_name}
              onChange={(e) => handleInputChange('client_name', e.target.value)}
              placeholder="Enter the client's name or company name"
            />
            
            <div>
              <TextField
                label="YouTube URL of Client Testimonial *"
                value={formData.testimonial_youtube_url}
                onChange={(e) => handleInputChange('testimonial_youtube_url', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-sm text-blue-600 mt-2">
                🎥 Please ensure the video testimonial is publicly accessible on YouTube and mentions our services.
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">🎁 Reward</h4>
              <p className="text-sm text-green-700">
                Upon approval, you will receive a ₹1,000 Amazon coupon via email.
              </p>
            </div>
          </div>
        );
        
      case 'promotional_video':
        return (
          <div className="space-y-4">
            <TextField
              label="Video Title *"
              value={formData.video_title}
              onChange={(e) => handleInputChange('video_title', e.target.value)}
              placeholder="Enter a descriptive title for your promotional video"
            />
            
            <TextArea
              label="Video Description *"
              value={formData.video_description}
              onChange={(e) => handleInputChange('video_description', e.target.value)}
              placeholder="Describe the content and purpose of your promotional video"
              rows={3}
            />
            
            <div>
              <TextField
                label="Promotional Video (Google Drive Link) *"
                value={formData.promotional_video_url}
                onChange={(e) => handleInputChange('promotional_video_url', e.target.value)}
                placeholder="Paste Google Drive link to your promotional video"
              />
              <p className="text-sm text-blue-600 mt-2">
                📹 Please upload your promotional video to Google Drive and share access with: <strong>brandingpioneers@gmail.com</strong>
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  if (!employeeData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⏳</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Employee Information</h3>
          <p className="text-gray-600">Please wait while we fetch your employee details...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Incentive Application</h1>
        <p className="text-gray-600">Apply for performance-based incentives with proof of achievement</p>
      </div>
      
      {/* Employee Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">👤 Employee Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div><strong>Name:</strong> {employeeData.name}</div>
          <div><strong>Department:</strong> {employeeData.department}</div>
          <div><strong>Email:</strong> {employeeData.email}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Application Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Submit New Application</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Incentive Type Selection */}
            <Section title="Select Incentive Type">
              <div className="space-y-4">
                {Object.entries(INCENTIVE_TYPES).map(([key, type]) => (
                  <label key={key} className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="incentive_type"
                      value={key}
                      checked={formData.incentive_type === key}
                      onChange={(e) => handleInputChange('incentive_type', e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{type.name}</div>
                      <div className="text-sm text-green-600 font-medium">₹{type.amount} {type.currency}</div>
                      <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                      {type.eligibilityMonths > 0 && (
                        <div className="text-xs text-amber-600 mt-1">
                          ⏰ Eligible after {type.eligibilityMonths} months
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </Section>
            
            {/* Proof Requirements */}
            {formData.incentive_type && (
              <Section title="Proof Requirements">
                {renderProofFields()}
              </Section>
            )}
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !formData.incentive_type}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? 'Submitting Application...' : 'Submit Incentive Application'}
            </button>
          </form>
        </div>
        
        {/* My Applications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">My Applications</h2>
          
          {myApplications.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-gray-600">No applications submitted yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myApplications.map((app) => (
                <div key={app.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {INCENTIVE_TYPES[app.incentive_type]?.name || app.incentive_type}
                      </h4>
                      <p className="text-sm text-green-600 font-medium">₹{app.incentive_amount}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(app.status)}`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Applied:</strong> {new Date(app.application_date).toLocaleDateString()}</div>
                    {app.eligible_date && (
                      <div><strong>Eligible:</strong> {new Date(app.eligible_date).toLocaleDateString()}</div>
                    )}
                    {app.reviewed_date && (
                      <div><strong>Reviewed:</strong> {new Date(app.reviewed_date).toLocaleDateString()}</div>
                    )}
                    {app.hr_comments && (
                      <div><strong>HR Comments:</strong> {app.hr_comments}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeIncentiveForm;