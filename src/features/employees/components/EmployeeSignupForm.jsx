import React, { useState, useCallback } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { useModal } from '@/shared/components/ModalContext';
import { useEmployeeSync } from '@/features/employees/context/EmployeeSyncContext';
import { DEPARTMENTS, ROLES_BY_DEPT } from '@/shared/lib/constants';
import { Section, TextField, TextArea, MultiSelect } from '@/shared/components/ui';

const SIGNUP_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export function EmployeeSignupForm({ onClose, onSuccess }) {
  const supabase = useSupabase();
  const { notify } = useToast();
  const { openModal, closeModal } = useModal();
  const { refreshEmployees } = useEmployeeSync();
  
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    
    // Address Information
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    
    // Emergency Contact
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    
    // Professional Information
    department: 'Web',
    role: [],
    expectedJoinDate: '',
    expectedSalary: '',
    
    // Education & Experience
    education: '',
    experience: '',
    skills: [],
    certifications: '',
    
    // Additional Information
    portfolioUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    coverLetter: '',
    
    // HR Workflow
    hrNotes: '',
    status: SIGNUP_STATUS.PENDING
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  
  const FORM_STEPS = [
    { id: 1, title: "Personal Info", icon: "👤", description: "Basic personal information" },
    { id: 2, title: "Contact & Address", icon: "📍", description: "Contact details and address" },
    { id: 3, title: "Professional", icon: "💼", description: "Department, role, and expectations" },
    { id: 4, title: "Background", icon: "🎓", description: "Education, experience, and skills" },
    { id: 5, title: "Additional", icon: "🔗", description: "Portfolio, social links, and cover letter" }
  ];
  
  const updateFormData = useCallback((field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);
  
  const validateStep = useCallback((step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        break;
        
      case 2:
        if (!formData.address.street.trim()) newErrors['address.street'] = 'Street address is required';
        if (!formData.address.city.trim()) newErrors['address.city'] = 'City is required';
        if (!formData.emergencyContact.name.trim()) newErrors['emergencyContact.name'] = 'Emergency contact name is required';
        if (!formData.emergencyContact.phone.trim()) newErrors['emergencyContact.phone'] = 'Emergency contact phone is required';
        break;
        
      case 3:
        if (!formData.department) newErrors.department = 'Department is required';
        if (!formData.role.length) newErrors.role = 'At least one role is required';
        if (!formData.expectedJoinDate) newErrors.expectedJoinDate = 'Expected join date is required';
        break;
        
      case 4:
        if (!formData.education.trim()) newErrors.education = 'Education information is required';
        if (!formData.experience.trim()) newErrors.experience = 'Experience information is required';
        break;
        
      case 5:
        // Optional step - no required fields
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);
  
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, FORM_STEPS.length));
    }
  }, [currentStep, validateStep]);
  
  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);
  
  const goToStep = useCallback((stepId) => {
    if (stepId >= 1 && stepId <= FORM_STEPS.length) {
      setCurrentStep(stepId);
    }
  }, [FORM_STEPS.length]);
  
  const handleSubmit = useCallback(async () => {
    // Validate all steps
    let allValid = true;
    for (let step = 1; step <= FORM_STEPS.length; step++) {
      if (!validateStep(step)) {
        allValid = false;
        setCurrentStep(step);
        break;
      }
    }
    
    if (!allValid) {
      notify('Please complete all required fields', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const signupData = {
        ...formData,
        submitted_at: new Date().toISOString(),
        status: SIGNUP_STATUS.PENDING
      };
      
      if (supabase) {
        // Submit to employee_signups table
        const { data, error } = await supabase
          .from('employee_signups')
          .insert([signupData])
          .select()
          .single();
          
        if (error) throw error;
        
        // Send notification to HR
        await supabase
          .from('notifications')
          .insert([{
            type: 'employee_signup',
            title: 'New Employee Signup',
            message: `${formData.name} has submitted an employee signup application for ${formData.department} department.`,
            data: { signupId: data.id, applicantName: formData.name },
            created_at: new Date().toISOString()
          }]);
          
        notify('Application submitted successfully! HR will review your application.', 'success');
      } else {
        // Local mode - save to localStorage
        const existingSignups = JSON.parse(localStorage.getItem('employee_signups') || '[]');
        const newSignup = {
          ...signupData,
          id: Date.now().toString()
        };
        existingSignups.push(newSignup);
        localStorage.setItem('employee_signups', JSON.stringify(existingSignups));
        
        notify('Application saved locally! (Running in local mode)', 'success');
      }
      
      // Show success modal
      openModal({
        title: '🎉 Application Submitted!',
        content: (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Thank you for your application!
              </h3>
              <p className="text-gray-600 mb-4">
                Your employee signup application has been submitted successfully.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• HR team will review your application</li>
                <li>• You'll receive an email update within 2-3 business days</li>
                <li>• If approved, you'll receive onboarding instructions</li>
                <li>• If additional information is needed, we'll contact you</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Application Summary</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                <p><strong>Department:</strong> {formData.department}</p>
                <p><strong>Role(s):</strong> {formData.role.join(', ')}</p>
                <p><strong>Expected Join Date:</strong> {formData.expectedJoinDate}</p>
              </div>
            </div>
          </div>
        ),
        actions: [
          {
            label: 'Close',
            onClick: () => {
              closeModal();
              if (onSuccess) onSuccess();
              if (onClose) onClose();
            },
            variant: 'primary'
          }
        ]
      });
      
    } catch (error) {
      console.error('Error submitting signup:', error);
      notify('Failed to submit application. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, supabase, notify, openModal, closeModal, onSuccess, onClose, validateStep]);
  
  const renderPersonalInfoStep = () => (
    <Section title="Personal Information" icon="👤">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            label="Full Name"
            value={formData.name}
            onChange={(value) => updateFormData('name', value)}
            placeholder="Enter your full name"
            required
            error={errors.name}
          />
          
          <TextField
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(value) => updateFormData('email', value)}
            placeholder="Enter your email address"
            required
            error={errors.email}
          />
          
          <TextField
            label="Phone Number"
            value={formData.phone}
            onChange={(value) => updateFormData('phone', value)}
            placeholder="Enter your phone number"
            required
            error={errors.phone}
          />
          
          <TextField
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(value) => updateFormData('dateOfBirth', value)}
            required
            error={errors.dateOfBirth}
          />
        </div>
      </div>
    </Section>
  );
  
  const renderContactAddressStep = () => (
    <Section title="Contact & Address Information" icon="📍">
      <div className="space-y-6">
        {/* Address */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <TextField
                label="Street Address"
                value={formData.address.street}
                onChange={(value) => updateFormData('address.street', value)}
                placeholder="Enter your street address"
                required
                error={errors['address.street']}
              />
            </div>
            
            <TextField
              label="City"
              value={formData.address.city}
              onChange={(value) => updateFormData('address.city', value)}
              placeholder="Enter your city"
              required
              error={errors['address.city']}
            />
            
            <TextField
              label="State"
              value={formData.address.state}
              onChange={(value) => updateFormData('address.state', value)}
              placeholder="Enter your state"
            />
            
            <TextField
              label="ZIP Code"
              value={formData.address.zipCode}
              onChange={(value) => updateFormData('address.zipCode', value)}
              placeholder="Enter your ZIP code"
            />
            
            <TextField
              label="Country"
              value={formData.address.country}
              onChange={(value) => updateFormData('address.country', value)}
              placeholder="Enter your country"
            />
          </div>
        </div>
        
        {/* Emergency Contact */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              label="Contact Name"
              value={formData.emergencyContact.name}
              onChange={(value) => updateFormData('emergencyContact.name', value)}
              placeholder="Enter emergency contact name"
              required
              error={errors['emergencyContact.name']}
            />
            
            <TextField
              label="Relationship"
              value={formData.emergencyContact.relationship}
              onChange={(value) => updateFormData('emergencyContact.relationship', value)}
              placeholder="e.g., Parent, Spouse, Sibling"
            />
            
            <TextField
              label="Contact Phone"
              value={formData.emergencyContact.phone}
              onChange={(value) => updateFormData('emergencyContact.phone', value)}
              placeholder="Enter emergency contact phone"
              required
              error={errors['emergencyContact.phone']}
            />
            
            <TextField
              label="Contact Email"
              type="email"
              value={formData.emergencyContact.email}
              onChange={(value) => updateFormData('emergencyContact.email', value)}
              placeholder="Enter emergency contact email"
            />
          </div>
        </div>
      </div>
    </Section>
  );
  
  const renderProfessionalStep = () => (
    <Section title="Professional Information" icon="💼">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.department}
              onChange={(e) => {
                updateFormData('department', e.target.value);
                updateFormData('role', []); // Reset roles when department changes
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            {errors.department && (
              <p className="mt-1 text-sm text-red-600">{errors.department}</p>
            )}
          </div>
          
          <MultiSelect
            label="Role(s)"
            value={formData.role}
            onChange={(value) => updateFormData('role', value)}
            options={ROLES_BY_DEPT[formData.department] || []}
            placeholder="Select your role(s)"
            required
            error={errors.role}
            allowCustom={true}
            customPlaceholder="Enter custom role..."
          />
          
          <TextField
            label="Expected Join Date"
            type="date"
            value={formData.expectedJoinDate}
            onChange={(value) => updateFormData('expectedJoinDate', value)}
            required
            error={errors.expectedJoinDate}
          />
          
          <TextField
            label="Expected Salary (Optional)"
            value={formData.expectedSalary}
            onChange={(value) => updateFormData('expectedSalary', value)}
            placeholder="Enter expected salary"
          />
        </div>
      </div>
    </Section>
  );
  
  const renderBackgroundStep = () => (
    <Section title="Education & Experience" icon="🎓">
      <div className="space-y-6">
        <TextArea
          label="Education"
          value={formData.education}
          onChange={(value) => updateFormData('education', value)}
          placeholder="Describe your educational background, degrees, institutions, etc."
          rows={4}
          required
          error={errors.education}
        />
        
        <TextArea
          label="Work Experience"
          value={formData.experience}
          onChange={(value) => updateFormData('experience', value)}
          placeholder="Describe your work experience, previous roles, achievements, etc."
          rows={4}
          required
          error={errors.experience}
        />
        
        <MultiSelect
          label="Skills & Technologies"
          value={formData.skills}
          onChange={(value) => updateFormData('skills', value)}
          options={[
            'JavaScript', 'React', 'Node.js', 'Python', 'PHP', 'HTML/CSS',
            'WordPress', 'Shopify', 'Figma', 'Adobe Creative Suite',
            'Google Analytics', 'SEO', 'Social Media Marketing', 'Content Writing',
            'Project Management', 'Team Leadership', 'Client Communication'
          ]}
          placeholder="Select your skills"
          allowCustom
        />
        
        <TextArea
          label="Certifications (Optional)"
          value={formData.certifications}
          onChange={(value) => updateFormData('certifications', value)}
          placeholder="List any relevant certifications, courses, or training programs"
          rows={3}
        />
      </div>
    </Section>
  );
  
  const renderAdditionalStep = () => (
    <Section title="Additional Information" icon="🔗">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            label="Portfolio URL (Optional)"
            value={formData.portfolioUrl}
            onChange={(value) => updateFormData('portfolioUrl', value)}
            placeholder="https://your-portfolio.com"
          />
          
          <TextField
            label="LinkedIn URL (Optional)"
            value={formData.linkedinUrl}
            onChange={(value) => updateFormData('linkedinUrl', value)}
            placeholder="https://linkedin.com/in/yourprofile"
          />
          
          <TextField
            label="GitHub URL (Optional)"
            value={formData.githubUrl}
            onChange={(value) => updateFormData('githubUrl', value)}
            placeholder="https://github.com/yourusername"
          />
        </div>
        
        <TextArea
          label="Cover Letter / Why do you want to join us?"
          value={formData.coverLetter}
          onChange={(value) => updateFormData('coverLetter', value)}
          placeholder="Tell us why you're interested in joining our team and what you can bring to the role..."
          rows={6}
        />
      </div>
    </Section>
  );
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderPersonalInfoStep();
      case 2: return renderContactAddressStep();
      case 3: return renderProfessionalStep();
      case 4: return renderBackgroundStep();
      case 5: return renderAdditionalStep();
      default: return renderPersonalInfoStep();
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Signup Application</h1>
        <p className="text-gray-600">Join our team! Fill out this comprehensive application form.</p>
      </div>
      
      {/* Enhanced Progress Steps with Navigation */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Application Progress</h3>
              <p className="text-sm text-gray-500">💡 Click any step to navigate freely</p>
            </div>
            <div className="text-sm text-gray-500">
              Step {currentStep} of {FORM_STEPS.length}
            </div>
          </div>
          
          <div className="relative">
            <div className="flex justify-between">
              {FORM_STEPS.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center relative z-10">
                  <button
                    onClick={() => goToStep(step.id)}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-semibold transition-all duration-200 cursor-pointer ${
                      currentStep === step.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                        : currentStep > step.id
                        ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                        : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </button>
                  <div className="mt-3 text-center">
                    <div className={`text-sm font-medium ${
                      currentStep === step.id ? 'text-blue-600' : currentStep > step.id ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 hidden sm:block">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Progress Line */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 -z-10">
              <div 
                className="h-full bg-green-600 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / (FORM_STEPS.length - 1)) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {renderStepContent()}
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <div className="text-sm text-gray-500">
          Step {currentStep} of {FORM_STEPS.length}
        </div>
        
        {currentStep < FORM_STEPS.length ? (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        )}
      </div>
      
      {/* Cancel Button */}
      {onClose && (
        <div className="text-center mt-4">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel Application
          </button>
        </div>
      )}
    </div>
  );
}

export default EmployeeSignupForm;