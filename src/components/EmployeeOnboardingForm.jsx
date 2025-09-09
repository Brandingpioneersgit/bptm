import React, { useState, useEffect, useRef } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { useModal } from '@/shared/components/ModalContext';
import { DEPARTMENTS, ROLES_BY_DEPT } from '@/shared/lib/constants';
import { Section, TextField, NumField, TextArea, MultiSelect } from '@/shared/components/ui';
import AuthService from '../features/auth/AuthService';

const EMPLOYEE_TYPES = [
  'Full-time',
  'Part-time', 
  'Remote',
  'Intern',
  'Consultant',
  'Freelancer'
];

const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

const AI_TOOLS = [
  'ChatGPT',
  'Claude',
  'Gemini',
  'Midjourney',
  'DALL-E',
  'Canva AI',
  'Notion AI',
  'GitHub Copilot',
  'Jasper',
  'Copy.ai',
  'Grammarly',
  'Other'
];

const LANGUAGES = [
  'English',
  'Hindi',
  'Marathi',
  'Gujarati',
  'Tamil',
  'Telugu',
  'Bengali',
  'Kannada',
  'Malayalam',
  'Punjabi',
  'Other'
];

const LIVING_SITUATIONS = [
  'With Parents',
  'With Spouse/Family',
  'Alone',
  'With Roommates',
  'PG/Hostel',
  'Other'
];

const EmployeeOnboardingForm = () => {
  const { supabase } = useSupabase();
  const { showToast } = useToast();
  const { showModal } = useModal();
  
  const [formData, setFormData] = useState({
    // Basic Information
    employeeName: '',
    department: '',
    role: [],
    employeeType: '',
    languages: [],
    aiTools: [],
    
    // Profile & Documents
    profilePictureUrl: '',
    documentsUrl: '', // PAN, AADHAR
    
    // Personal Details
    dateOfBirth: '',
    joiningDate: '',
    currentAddress: '',
    personalPhone: '',
    parentsAddress: '',
    parentsPhone: {
      father: '',
      mother: ''
    },
    emailId: '',
    bloodGroup: '',
    
    // Education & Professional
    educationCertificatesUrl: '',
    distanceFromOffice: '',
    livingSituation: '',
    linkedinProfile: '',
    favoriteFood: '',
    healthConditions: '',
    
    // Day 0 Induction Checklist
    induction: {
      hrInductionDone: false,
      companypoliciesRead: false,
      offerLetterResponded: false,
      deptTeamLeadInduction: false,
      placeAllocated: false,
      biometricSetup: false,
      deviceDetails: {
        allocated: false,
        simCard: '',
        macAddress: '',
        phoneIMEI: ''
      },
      officialWhatsappAccess: {
        granted: false,
        number: ''
      },
      myzenInstalled: false,
      razorpayOnboarding: {
        completed: false,
        bankAccount: '',
        upiDetails: ''
      },
      vehicleForMeetings: false,
      roleClarity: false,
      toolsAwareness: false,
      monthlyGoals: '',
      quarterlyGoals: '',
      workAllocated: ''
    },
    
    // Freelancer specific
    freelancerDetails: {
      paymentDetails: '',
      reportingSheetUrl: ''
    },
    
    // Terms and Conditions
    termsAndConditions: {
      ndaAccepted: false,
      employmentBondAccepted: false,
      companyGuidelineAccepted: false,
      allTermsAccepted: false
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExistingEmployee, setIsExistingEmployee] = useState(false);
  const [existingEmployeeData, setExistingEmployeeData] = useState({
    searchPhone: '',
    searchEmail: ''
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  const handleInputChange = (field, value) => {
    try {
      if (field.includes('.')) {
        const [parent, child, grandchild] = field.split('.');
        setFormData(prev => {
          // Ensure parent object exists
          const parentObj = prev[parent] || {};
          
          if (grandchild) {
            // Ensure child object exists for grandchild access
            const childObj = parentObj[child] || {};
            return {
              ...prev,
              [parent]: {
                ...parentObj,
                [child]: {
                  ...childObj,
                  [grandchild]: value
                }
              }
            };
          } else {
            return {
              ...prev,
              [parent]: {
                ...parentObj,
                [child]: value
              }
            };
          }
        });
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: value
        }));
      }
    } catch (error) {
      console.error('Error updating form field:', field, error);
      showToast('Error updating form field. Please try again.', 'error');
    }
  };
  
  const validateForm = () => {
    try {
      const required = [
        'employeeName',
        'department', 
        'employeeType',
        'dateOfBirth',
        'joiningDate',
        'currentAddress',
        'personalPhone',
        'emailId'
      ];
      
      // Check if formData exists and is an object
      if (!formData || typeof formData !== 'object') {
        showToast('Form data is corrupted. Please refresh the page.', 'error');
        return false;
      }
      
      for (const field of required) {
        const value = formData[field];
        if (!value || (typeof value === 'string' && !value.trim())) {
          const fieldName = field.replace(/([A-Z])/g, ' $1').toLowerCase();
          showToast(`Please fill in ${fieldName}`, 'error');
          return false;
        }
      }
      
      // Role validation - ensure at least one role is selected
      if (!formData.role || !Array.isArray(formData.role) || formData.role.length === 0) {
        showToast('Please select at least one role', 'error');
        return false;
      }
      
      // Email validation with null/undefined checks
      const emailValue = formData.emailId;
      if (!emailValue || typeof emailValue !== 'string') {
        showToast('Please enter a valid email address', 'error');
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue.trim())) {
        showToast('Please enter a valid email address', 'error');
        return false;
      }
      
      // Phone validation with null/undefined checks
      const phoneValue = formData.personalPhone;
      if (!phoneValue || typeof phoneValue !== 'string') {
        showToast('Please enter a valid phone number', 'error');
        return false;
      }
      
      const phoneRegex = /^[6-9]\d{9}$/;
      const cleanPhone = phoneValue.replace(/\D/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        showToast('Please enter a valid 10-digit Indian phone number', 'error');
        return false;
      }
      
      // Terms and Conditions validation with null checks
       const termsData = formData.termsAndConditions;
       if (!termsData || typeof termsData !== 'object' || !termsData.allTermsAccepted) {
         showToast('Please accept all terms and conditions to proceed', 'error');
         return false;
       }
       
       return true;
       
    } catch (error) {
      console.error('Form validation error:', error);
      showToast('Validation error occurred. Please check your input and try again.', 'error');
      return false;
    }
  };
  
  // Validate individual terms based on employee type
  const validateIndividualTerms = () => {
    const isFullTime = formData.employeeType === 'Full-time';
    if (isFullTime) {
      if (!formData.termsAndConditions.ndaAccepted) {
        showToast('Please accept the Non-Disclosure Agreement', 'error');
        return false;
      }
      if (!formData.termsAndConditions.employmentBondAccepted) {
        showToast('Please accept the Employment Bond', 'error');
        return false;
      }
    }
    
    if (!formData.termsAndConditions.companyGuidelineAccepted) {
      showToast('Please accept the Company Guidebook compliance', 'error');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    try {
      // Check for existing employee with same phone or email
      const { data: existingEmployee, error: checkError } = await supabase
        .from('employees')
        .select('id, name, phone, email')
        .or(`phone.eq.${formData.personalPhone},email.eq.${formData.emailId}`)
        .single();
        
      if (existingEmployee && !checkError) {
        const errorMsg = `Employee already exists with ${existingEmployee.phone === formData.personalPhone ? 'phone number' : 'email address'}: ${existingEmployee.name}`;
        setSubmitError(errorMsg);
        showToast(errorMsg, 'error');
        setIsSubmitting(false);
        return;
      }
      
      // Prepare employee data for database
      const employeeData = {
        name: formData.employeeName,
        phone: formData.personalPhone,
        email: formData.emailId,
        department: formData.department,
        role: formData.role,
        employee_type: formData.employeeType,
        date_of_birth: formData.dateOfBirth,
        hire_date: formData.joiningDate,
        status: 'Active',
        profile_image_url: formData.profilePictureUrl,
        address: {
          current: formData.currentAddress,
          parents: formData.parentsAddress
        },
        emergency_contact: {
          father_phone: formData.parentsPhone.father,
          mother_phone: formData.parentsPhone.mother
        },
        onboarding_data: {
          languages: formData.languages,
          ai_tools: formData.aiTools,
          blood_group: formData.bloodGroup,
          distance_from_office: formData.distanceFromOffice,
          living_situation: formData.livingSituation,
          linkedin_profile: formData.linkedinProfile,
          favorite_food: formData.favoriteFood,
          health_conditions: formData.healthConditions,
          documents_url: formData.documentsUrl,
          education_certificates_url: formData.educationCertificatesUrl,
          induction_checklist: formData.induction,
          freelancer_details: formData.freelancerDetails,
          terms_and_conditions: formData.termsAndConditions
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert into employees table
      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select();
        
      if (error) {
        console.error('Error creating employee:', error);
        setSubmitError('Failed to create employee record. Please try again.');
        showToast('Failed to create employee record', 'error');
        return;
      }
      
      // Create user account with new authentication system
      try {
        await AuthService.createUserFromOnboarding({
          employee_id: data[0].id,
          name: formData.employeeName,
          email: formData.emailId,
          phone: formData.personalPhone,
          department: formData.department,
          role: formData.role,
          employee_type: formData.employeeType
        });
      } catch (loginError) {
        console.warn('User account creation failed:', loginError);
        // Continue even if user creation fails - employee record is still created
      }
      
      showToast('Employee onboarding completed successfully! Redirecting to employee directory...', 'success');
      setSubmitSuccess(true);
      
      // Redirect to employee directory after a short delay
      setTimeout(() => {
        window.location.href = '/employee-directory';
      }, 2000);
      
      // Reset form
      setFormData({
        employeeName: '',
        department: '',
        role: [],
        employeeType: '',
        languages: [],
        aiTools: [],
        profilePictureUrl: '',
        documentsUrl: '',
        dateOfBirth: '',
        joiningDate: '',
        currentAddress: '',
        personalPhone: '',
        parentsAddress: '',
        parentsPhone: { father: '', mother: '' },
        emailId: '',
        bloodGroup: '',
        educationCertificatesUrl: '',
        distanceFromOffice: '',
        livingSituation: '',
        linkedinProfile: '',
        favoriteFood: '',
        healthConditions: '',
        induction: {
          hrInductionDone: false,
          companypoliciesRead: false,
          offerLetterResponded: false,
          deptTeamLeadInduction: false,
          placeAllocated: false,
          biometricSetup: false,
          deviceDetails: { allocated: false, simCard: '', macAddress: '', phoneIMEI: '' },
          officialWhatsappAccess: { granted: false, number: '' },
          myzenInstalled: false,
          razorpayOnboarding: { completed: false, bankAccount: '', upiDetails: '' },
          vehicleForMeetings: false,
          roleClarity: false,
          toolsAwareness: false,
          monthlyGoals: '',
          quarterlyGoals: '',
          workAllocated: ''
        },
        freelancerDetails: {
          paymentDetails: '',
          reportingSheetUrl: ''
        },
        termsAndConditions: {
          ndaAccepted: false,
          employmentBondAccepted: false,
          companyGuidelineAccepted: false,
          allTermsAccepted: false
        }
      });
      
    } catch (error) {
      console.error('Submission error:', error);
      
      // Enhanced error handling with specific error messages
      let errorMessage = 'An unexpected error occurred during submission. Please try again.';
      let errorId = `ERR_${Date.now()}`;
      
      if (error?.message) {
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
          errorMessage = 'An employee with this phone number or email already exists.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('validation') || error.message.includes('invalid')) {
          errorMessage = 'Please check your input data and try again.';
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          errorMessage = 'You do not have permission to perform this action.';
        } else {
          errorMessage = `Submission failed: ${error.message}`;
        }
      }
      
      // Log detailed error for debugging
      console.error('Detailed error info:', {
        errorId,
        message: error?.message,
        stack: error?.stack,
        formData: {
          employeeName: formData?.employeeName,
          department: formData?.department,
          personalPhone: formData?.personalPhone,
          emailId: formData?.emailId
        }
      });
      
      setSubmitError(`${errorMessage} (Error ID: ${errorId})`);
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const searchExistingEmployee = async () => {
    if (!existingEmployeeData.searchPhone && !existingEmployeeData.searchEmail) {
      showToast('Please enter phone number or email to search', 'error');
      return;
    }
    
    try {
      let query = supabase.from('employees').select('*');
      
      if (existingEmployeeData.searchPhone) {
        query = query.eq('phone', existingEmployeeData.searchPhone);
      } else if (existingEmployeeData.searchEmail) {
        query = query.eq('email', existingEmployeeData.searchEmail);
      }
      
      const { data, error } = await query.single();
      
      if (error || !data) {
        showToast('Employee not found', 'error');
        return;
      }
      
      // Pre-fill form with existing data
      setFormData({
        employeeName: data.name || '',
        department: data.department || '',
        role: data.role || [],
        employeeType: data.employee_type || '',
        languages: data.onboarding_data?.languages || [],
        aiTools: data.onboarding_data?.ai_tools || [],
        profilePictureUrl: data.profile_image_url || '',
        documentsUrl: data.onboarding_data?.documents_url || '',
        dateOfBirth: data.date_of_birth || '',
        joiningDate: data.hire_date || '',
        currentAddress: data.address?.current || '',
        personalPhone: data.phone || '',
        parentsAddress: data.address?.parents || '',
        parentsPhone: {
          father: data.emergency_contact?.father_phone || '',
          mother: data.emergency_contact?.mother_phone || ''
        },
        emailId: data.email || '',
        bloodGroup: data.onboarding_data?.blood_group || '',
        educationCertificatesUrl: data.onboarding_data?.education_certificates_url || '',
        distanceFromOffice: data.onboarding_data?.distance_from_office || '',
        livingSituation: data.onboarding_data?.living_situation || '',
        linkedinProfile: data.onboarding_data?.linkedin_profile || '',
        favoriteFood: data.onboarding_data?.favorite_food || '',
        healthConditions: data.onboarding_data?.health_conditions || '',
        induction: data.onboarding_data?.induction_checklist || {
          hrInductionDone: false,
          companypoliciesRead: false,
          offerLetterResponded: false,
          deptTeamLeadInduction: false,
          placeAllocated: false,
          biometricSetup: false,
          deviceDetails: { allocated: false, simCard: '', macAddress: '', phoneIMEI: '' },
          officialWhatsappAccess: { granted: false, number: '' },
          myzenInstalled: false,
          razorpayOnboarding: { completed: false, bankAccount: '', upiDetails: '' },
          vehicleForMeetings: false,
          roleClarity: false,
          toolsAwareness: false,
          monthlyGoals: '',
          quarterlyGoals: '',
          workAllocated: ''
        },
        freelancerDetails: data.onboarding_data?.freelancer_details || {
          paymentDetails: '',
          reportingSheetUrl: ''
        },
        termsAndConditions: data.onboarding_data?.terms_and_conditions || {
          ndaAccepted: false,
          employmentBondAccepted: false,
          companyGuidelineAccepted: false,
          allTermsAccepted: false
        }
      });
      
      showToast('Employee data loaded successfully', 'success');
      
    } catch (error) {
      console.error('Search error:', error);
      showToast('Error searching for employee', 'error');
    }
  };
  
  const renderInductionChecklist = () => {
    const isFullTime = formData.employeeType === 'Full-time';
    const isFreelancer = formData.employeeType === 'Freelancer';
    
    if (isFreelancer) {
      return (
        <Section title="Freelancer Setup">
          <TextField
            label="Payment Details (Bank Account/UPI)"
            value={formData.freelancerDetails.paymentDetails}
            onChange={(e) => handleInputChange('freelancerDetails.paymentDetails', e.target.value)}
            placeholder="Enter payment details"
          />
          <TextField
            label="Reporting Google Sheet URL"
            value={formData.freelancerDetails.reportingSheetUrl}
            onChange={(e) => handleInputChange('freelancerDetails.reportingSheetUrl', e.target.value)}
            placeholder="Enter Google Sheet URL for work reporting"
          />
        </Section>
      );
    }
    
    return (
      <Section title="Day 0 Induction Checklist">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.induction.hrInductionDone}
                onChange={(e) => handleInputChange('induction.hrInductionDone', e.target.checked)}
                className="rounded"
              />
              <span>HR Induction Done</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.induction.companypoliciesRead}
                onChange={(e) => handleInputChange('induction.companypoliciesRead', e.target.checked)}
                className="rounded"
              />
              <span>Company Policies Read</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.induction.offerLetterResponded}
                onChange={(e) => handleInputChange('induction.offerLetterResponded', e.target.checked)}
                className="rounded"
              />
              <span>Offer Letter Responded</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.induction.deptTeamLeadInduction}
                onChange={(e) => handleInputChange('induction.deptTeamLeadInduction', e.target.checked)}
                className="rounded"
              />
              <span>Department Team Lead Induction</span>
            </label>
            
            {(isFullTime) && (
              <>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.induction.placeAllocated}
                    onChange={(e) => handleInputChange('induction.placeAllocated', e.target.checked)}
                    className="rounded"
                  />
                  <span>Place Allocated</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.induction.biometricSetup}
                    onChange={(e) => handleInputChange('induction.biometricSetup', e.target.checked)}
                    className="rounded"
                  />
                  <span>Biometric Login Setup</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.induction.vehicleForMeetings}
                    onChange={(e) => handleInputChange('induction.vehicleForMeetings', e.target.checked)}
                    className="rounded"
                  />
                  <span>Vehicle for Client Meetings</span>
                </label>
              </>
            )}
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.induction.myzenInstalled}
                onChange={(e) => handleInputChange('induction.myzenInstalled', e.target.checked)}
                className="rounded"
              />
              <span>Myzen Installed</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.induction.roleClarity}
                onChange={(e) => handleInputChange('induction.roleClarity', e.target.checked)}
                className="rounded"
              />
              <span>Role Clarity</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.induction.toolsAwareness}
                onChange={(e) => handleInputChange('induction.toolsAwareness', e.target.checked)}
                className="rounded"
              />
              <span>Tools Awareness</span>
            </label>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={formData.induction.deviceDetails.allocated}
                  onChange={(e) => handleInputChange('induction.deviceDetails.allocated', e.target.checked)}
                  className="rounded"
                />
                <span>Device Allocated</span>
              </label>
              
              {formData.induction.deviceDetails.allocated && (
                <div className="ml-6 space-y-2">
                  <TextField
                    label="SIM Card Number"
                    value={formData.induction.deviceDetails.simCard}
                    onChange={(e) => handleInputChange('induction.deviceDetails.simCard', e.target.value)}
                    placeholder="Enter SIM card number"
                  />
                  <TextField
                    label="MAC Address"
                    value={formData.induction.deviceDetails.macAddress}
                    onChange={(e) => handleInputChange('induction.deviceDetails.macAddress', e.target.value)}
                    placeholder="Enter MAC address"
                  />
                  <TextField
                    label="Phone IMEI"
                    value={formData.induction.deviceDetails.phoneIMEI}
                    onChange={(e) => handleInputChange('induction.deviceDetails.phoneIMEI', e.target.value)}
                    placeholder="Enter phone IMEI"
                  />
                </div>
              )}
            </div>
            
            <div>
              <label className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={formData.induction.officialWhatsappAccess.granted}
                  onChange={(e) => handleInputChange('induction.officialWhatsappAccess.granted', e.target.checked)}
                  className="rounded"
                />
                <span>Official WhatsApp Access</span>
              </label>
              
              {formData.induction.officialWhatsappAccess.granted && (
                <div className="ml-6">
                  <TextField
                    label="WhatsApp Number"
                    value={formData.induction.officialWhatsappAccess.number}
                    onChange={(e) => handleInputChange('induction.officialWhatsappAccess.number', e.target.value)}
                    placeholder="Enter WhatsApp number"
                  />
                </div>
              )}
            </div>
            
            <div>
              <label className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={formData.induction.razorpayOnboarding.completed}
                  onChange={(e) => handleInputChange('induction.razorpayOnboarding.completed', e.target.checked)}
                  className="rounded"
                />
                <span>Razorpay Onboarding</span>
              </label>
              
              {formData.induction.razorpayOnboarding.completed && (
                <div className="ml-6 space-y-2">
                  <TextField
                    label="Bank Account Details"
                    value={formData.induction.razorpayOnboarding.bankAccount}
                    onChange={(e) => handleInputChange('induction.razorpayOnboarding.bankAccount', e.target.value)}
                    placeholder="Enter bank account details"
                  />
                  <TextField
                    label="UPI Details"
                    value={formData.induction.razorpayOnboarding.upiDetails}
                    onChange={(e) => handleInputChange('induction.razorpayOnboarding.upiDetails', e.target.value)}
                    placeholder="Enter UPI details"
                  />
                </div>
              )}
            </div>
            
            <TextArea
              label="Monthly Goals"
              value={formData.induction.monthlyGoals}
              onChange={(e) => handleInputChange('induction.monthlyGoals', e.target.value)}
              placeholder="Enter monthly goals"
              rows={3}
            />
            
            <TextArea
              label="Quarterly Goals"
              value={formData.induction.quarterlyGoals}
              onChange={(e) => handleInputChange('induction.quarterlyGoals', e.target.value)}
              placeholder="Enter quarterly goals"
              rows={3}
            />
            
            <TextArea
              label="Work Allocated"
              value={formData.induction.workAllocated}
              onChange={(e) => handleInputChange('induction.workAllocated', e.target.value)}
              placeholder="Enter work allocated"
              rows={3}
            />
          </div>
        </div>
      </Section>
    );
  };

  // Render Terms and Conditions based on employee type
  const renderTermsAndConditions = () => {
    const isFullTime = formData.employeeType === 'Full-time';
    
    return (
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center mb-6">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <h2 className="text-2xl font-bold text-gray-900">Terms and Conditions</h2>
            <p className="text-gray-600">Please review and accept the following terms</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-amber-800">Important Legal Agreement</h3>
            </div>
            <p className="text-amber-700 text-sm leading-relaxed">
              Please read and accept all terms and conditions below. These are legally binding agreements that govern your employment with Branding Pioneers.
            </p>
          </div>

          {/* Full-time Employee Terms */}
          {isFullTime && (
            <>
              {/* Non-Disclosure Agreement */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">🔒</span>
                    1. Non-Disclosure Agreement (NDA)
                  </h4>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.termsAndConditions.ndaAccepted}
                      onChange={(e) => handleInputChange('termsAndConditions.ndaAccepted', e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">I Accept</span>
                  </label>
                </div>
                <div className="space-y-4 text-sm text-gray-700">
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">Non-Competition:</h5>
                    <p>You agree not to engage in or start any business activities that compete directly with the core services and products of Branding Pioneers during your employment and for a period of one year after your employment ends. This restriction aims to protect the company's strategic interests and proprietary information.</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">Confidentiality:</h5>
                    <p>You are obligated to protect and not disclose any confidential information acquired during your tenure at the company. This includes, but is not limited to, operational methodologies, client lists, pricing strategies, marketing plans, and any other sensitive information that is not publicly known.</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">No Personal Use:</h5>
                    <p>Use of company resources, whether physical, digital, or intellectual, is restricted strictly to business-related activities. Personal use of these resources is prohibited to prevent any potential misuse that could harm the company's operational integrity.</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">Respectful Conduct:</h5>
                    <p>You are expected to uphold and enhance the company's reputation both internally and externally. This includes abstaining from making derogatory comments or actions that could damage the company's standing with clients, partners, or the public.</p>
                  </div>
                </div>
              </div>

              {/* Employment Bond */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">📋</span>
                    2. Employment Bond
                  </h4>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.termsAndConditions.employmentBondAccepted}
                      onChange={(e) => handleInputChange('termsAndConditions.employmentBondAccepted', e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">I Accept</span>
                  </label>
                </div>
                <div className="space-y-4 text-sm text-gray-700">
                  <p className="font-medium text-gray-800">Upon successful completion of your probationary period, or receipt of your official appointment letter, you enter into a one-year employment bond with Branding Pioneers:</p>
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">Duration and Commitment:</h5>
                    <p>This bond signifies your agreement to remain employed with Branding Pioneers for at least twelve months, ensuring your commitment to the company's long-term projects and team stability.</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">Consequences of Breaching the Bond:</h5>
                    <p>If you decide to terminate your employment before fulfilling the bond period, you will face several penalties. These include the forfeiture of accumulated Retention Bonus Components (RBC), withholding of final salary payments, and retention of employment-related documents. Additionally, details of the breach may be communicated to external job platforms as part of a formal blacklist procedure.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Company Guidebook - For All Employee Types */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                <span className="mr-2">📖</span>
                {isFullTime ? '3. ' : ''}Compliance with Company Guidebook
              </h4>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.termsAndConditions.companyGuidelineAccepted}
                  onChange={(e) => handleInputChange('termsAndConditions.companyGuidelineAccepted', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">I Accept</span>
              </label>
            </div>
            <div className="space-y-4 text-sm text-gray-700">
              <p>All employees are required to adhere strictly to the guidelines outlined in the Branding Pioneers Company Guidebook:</p>
              <div>
                <h5 className="font-semibold text-gray-800 mb-2">Access to Policies:</h5>
                <p>The guidebook, which details all operational, conduct, and employment policies, is available online at <a href="https://bit.ly/BP-BOOK" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">https://bit.ly/BP-BOOK</a>. You are encouraged to access this link regularly to stay updated on policy changes.</p>
              </div>
              <div>
                <h5 className="font-semibold text-gray-800 mb-2">Adaptation to Changes:</h5>
                <p>The company reserves the right to amend the guidebook. Changes may involve modifications to existing policies or the introduction of new policies. As an employee, you are expected to comply with these changes as they are officially communicated through company channels.</p>
              </div>
            </div>
          </div>

          {/* Final Acceptance */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-blue-800 flex items-center">
                <span className="mr-2">✅</span>
                Acknowledgment and Acceptance
              </h4>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.termsAndConditions.allTermsAccepted}
                  onChange={(e) => {
                    const accepted = e.target.checked;
                    if (accepted) {
                      // Check if all individual terms are accepted
                      const allIndividualTermsAccepted = isFullTime 
                        ? (formData.termsAndConditions.ndaAccepted && 
                           formData.termsAndConditions.employmentBondAccepted && 
                           formData.termsAndConditions.companyGuidelineAccepted)
                        : formData.termsAndConditions.companyGuidelineAccepted;
                      
                      if (!allIndividualTermsAccepted) {
                        showToast('Please accept all individual terms and conditions first', 'error');
                        return;
                      }
                    }
                    handleInputChange('termsAndConditions.allTermsAccepted', accepted);
                  }}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  required
                />
                <span className="ml-2 text-sm font-medium text-blue-700">I Accept All Terms and Conditions *</span>
              </label>
            </div>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-2">By checking this box, you acknowledge that you have:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Thoroughly reviewed and understood all terms outlined above</li>
                <li>Agreed to comply with all terms as a condition of your employment</li>
                <li>Understood that failure to comply may result in disciplinary actions, up to and including termination</li>
                <li>Accessed and reviewed the Company Guidebook at the provided link</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Employee Onboarding
          </h1>
          <p className="text-gray-600 text-lg">Welcome to Branding Pioneers! Let's get you set up.</p>
        </div>
        
        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-8">
             {/* Success/Error Messages */}
             {submitSuccess && (
               <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
                 <div className="flex items-center">
                   <div className="flex-shrink-0">
                     <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   </div>
                   <div className="ml-3">
                     <h3 className="text-lg font-semibold text-green-800">Welcome to the team! 🎉</h3>
                     <p className="text-green-700">Your onboarding has been completed successfully. You'll receive further instructions via email.</p>
                   </div>
                 </div>
               </div>
             )}
             
             {submitError && (
               <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl shadow-sm">
                 <div className="flex items-center">
                   <div className="flex-shrink-0">
                     <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   </div>
                   <div className="ml-3">
                     <h3 className="text-lg font-semibold text-red-800">Submission Error</h3>
                     <p className="text-red-700">{submitError}</p>
                   </div>
                 </div>
               </div>
             )}
             
             {/* Existing Employee Section */}
             <Section title="Existing Employee Account Creation">
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">Search Existing Employee</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Phone Number"
              value={existingEmployeeData.searchPhone}
              onChange={(e) => setExistingEmployeeData(prev => ({ ...prev, searchPhone: e.target.value }))}
              placeholder="Enter phone number"
            />
            <TextField
              label="Email Address"
              value={existingEmployeeData.searchEmail}
              onChange={(e) => setExistingEmployeeData(prev => ({ ...prev, searchEmail: e.target.value }))}
              placeholder="Enter email address"
            />
          </div>
          <button
            type="button"
            onClick={searchExistingEmployee}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Search & Load Data
          </button>
        </div>
      </Section>
            
            <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Section title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              label="Employee Name *"
              value={formData.employeeName}
              onChange={(e) => handleInputChange('employeeName', e.target.value)}
              placeholder="Enter full name"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <MultiSelect
              label="Role"
              value={formData.role}
              onChange={(value) => handleInputChange('role', value)}
              options={formData.department ? ROLES_BY_DEPT[formData.department] || [] : []}
              placeholder="Select roles"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Type *
              </label>
              <select
                value={formData.employeeType}
                onChange={(e) => handleInputChange('employeeType', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Type</option>
                {EMPLOYEE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <MultiSelect
              label="Languages"
              value={formData.languages}
              onChange={(value) => handleInputChange('languages', value)}
              options={LANGUAGES}
              placeholder="Select languages"
            />
            
            <MultiSelect
              label="AI Tools Known"
              value={formData.aiTools}
              onChange={(value) => handleInputChange('aiTools', value)}
              options={AI_TOOLS}
              placeholder="Select AI tools"
            />
          </div>
        </Section>
        
        {/* Profile & Documents */}
        <Section title="Profile & Documents">
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">File Upload Instructions</h4>
              <p className="text-yellow-700 text-sm">
                Please upload all files to Google Drive and share access with <strong>brandingpioneers@gmail.com</strong>. 
                Then paste the shareable Google Drive links below.
              </p>
            </div>
            
            <TextField
              label="Profile Picture (Google Drive Link)"
              value={formData.profilePictureUrl}
              onChange={(e) => handleInputChange('profilePictureUrl', e.target.value)}
              placeholder="Paste Google Drive link for profile picture"
            />
            
            <TextField
              label="Documents - PAN, AADHAR (Google Drive Link)"
              value={formData.documentsUrl}
              onChange={(e) => handleInputChange('documentsUrl', e.target.value)}
              placeholder="Paste Google Drive link for PAN, AADHAR documents"
            />
          </div>
        </Section>
        
        {/* Personal Details */}
        <Section title="Personal Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              label="Date of Birth *"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              required
            />
            
            <TextField
              label="Joining Date *"
              type="date"
              value={formData.joiningDate}
              onChange={(e) => handleInputChange('joiningDate', e.target.value)}
              required
            />
            
            <TextField
              label="Personal Phone Number *"
              value={formData.personalPhone}
              onChange={(e) => handleInputChange('personalPhone', e.target.value)}
              placeholder="Enter phone number"
              required
            />
            
            <TextField
              label="Email ID *"
              type="email"
              value={formData.emailId}
              onChange={(e) => handleInputChange('emailId', e.target.value)}
              placeholder="Enter email address"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Blood Group
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Blood Group</option>
                {BLOOD_GROUPS.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Living Situation
              </label>
              <select
                value={formData.livingSituation}
                onChange={(e) => handleInputChange('livingSituation', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Living Situation</option>
                {LIVING_SITUATIONS.map(situation => (
                  <option key={situation} value={situation}>{situation}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            <TextArea
              label="Current Address *"
              value={formData.currentAddress}
              onChange={(e) => handleInputChange('currentAddress', e.target.value)}
              placeholder="Enter current address"
              rows={3}
              required
            />
            
            <TextArea
              label="Parents/Guardians Address (Name and Full Address)"
              value={formData.parentsAddress}
              onChange={(e) => handleInputChange('parentsAddress', e.target.value)}
              placeholder="Enter parents/guardians name and full address"
              rows={3}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextField
                label="Father's Phone Number"
                value={formData.parentsPhone.father}
                onChange={(e) => handleInputChange('parentsPhone.father', e.target.value)}
                placeholder="Enter father's phone number"
              />
              
              <TextField
                label="Mother's Phone Number"
                value={formData.parentsPhone.mother}
                onChange={(e) => handleInputChange('parentsPhone.mother', e.target.value)}
                placeholder="Enter mother's phone number"
              />
            </div>
          </div>
        </Section>
        
        {/* Education & Professional */}
        <Section title="Education & Professional">
          <div className="space-y-4">
            <TextField
              label="Education Certificates (Google Drive Link)"
              value={formData.educationCertificatesUrl}
              onChange={(e) => handleInputChange('educationCertificatesUrl', e.target.value)}
              placeholder="Paste Google Drive link for education certificates"
            />
            
            <TextField
              label="Distance from Office & Living Situation Details"
              value={formData.distanceFromOffice}
              onChange={(e) => handleInputChange('distanceFromOffice', e.target.value)}
              placeholder="e.g., 15 km from office, living with parents"
            />
            
            <TextField
              label="LinkedIn Profile"
              value={formData.linkedinProfile}
              onChange={(e) => handleInputChange('linkedinProfile', e.target.value)}
              placeholder="Enter LinkedIn profile URL"
            />
            
            <TextField
              label="Favorite Food"
              value={formData.favoriteFood}
              onChange={(e) => handleInputChange('favoriteFood', e.target.value)}
              placeholder="Enter favorite food"
            />
            
            <TextArea
              label="Any Existing Health Conditions"
              value={formData.healthConditions}
              onChange={(e) => handleInputChange('healthConditions', e.target.value)}
              placeholder="Enter any existing health conditions or 'None'"
              rows={3}
            />
          </div>
        </Section>
        
        {/* Conditional Induction Checklist */}
        {formData.employeeType && renderInductionChecklist()}
        
        {/* Terms and Conditions */}
        {formData.employeeType && renderTermsAndConditions()}
        
            {/* Submit Button */}
            <div className="flex justify-center pt-8 pb-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>Complete Onboarding</span>
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeOnboardingForm;