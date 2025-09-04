import React, { useState, useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { ClientOnboardingService } from '@/services/clientOnboardingService';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { useToast } from '@/shared/components/Toast';

const ClientOnboardingForm = ({ onBack }) => {
  const [formData, setFormData] = useState({
    // Form metadata
    formId: Date.now().toString(),
    lastSaved: null,
    completionPercentage: 0,
    // Basic Information (Required fields marked with *)
    clientName: '', // *
    businessType: '',
    industry: 'healthcare', // Default to healthcare
    // Note: businessSize and yearEstablished removed as pre-payment qualification fields
    
    // Contact Information
    primaryEmail: '', // *
    phoneNumber: '', // *
    businessAddress: '',
    websiteUrl: '',
    
    // Indian Business Details
    indianBusinessDetails: {
      gstin: '', // GST Identification Number
      panNumber: '', // PAN Number
      state: '', // Indian state
      city: '', // City
      pincode: '', // PIN code
      businessRegistrationType: '', // Private Limited, Partnership, etc.
      udyamRegistration: '', // MSME Udyam Registration
      fssaiLicense: '', // For food/healthcare businesses
      drugLicense: '', // For pharmaceutical/healthcare
      medicalCouncilRegistration: '', // For healthcare practitioners
      hospitalRegistration: '', // For hospitals/clinics
      nabh_jci_accreditation: '', // Healthcare quality accreditation
      ayushLicense: '', // For Ayurveda/traditional medicine
      clinicalEstablishmentLicense: '', // State health department license
      biomedicalWasteAuthorization: '', // For healthcare waste management
      radiationSafetyLicense: '', // For diagnostic centers with X-ray/CT
      pharmacyLicense: '', // For pharmacy operations
      bloodBankLicense: '', // For blood banks
      ambulancePermit: '', // For ambulance services
      telemedicineLicense: '' // For telemedicine services
    },
    
    // Service Selection (Already paid for)
    serviceScope: [], // ['web', 'marketing', 'branding', 'ai_automation']
    specificServices: [],
    
    // Business Goals & Objectives
    primaryGoals: [], // *
    successMetrics: [], // *
    timelineExpectations: '', // *
    
    // Current Marketing Situation
    currentMarketingEfforts: '',
    marketingChallenges: '',
    previousAgencyExperience: '',
    
    // Website & Technical Access
    websiteCredentials: {
      adminUrl: '',
      username: '',
      password: ''
    },
    websiteHostingProvider: '',
    domainProvider: '',
    
    // Digital Assets (URLs only - files to be emailed to hello@brandingpioneers.com)
    logoUrl: '',
    brandGuidelinesUrl: '',
    existingMarketingMaterialsUrl: '',
    competitorAnalysisUrl: '',
    
    // Google Services Access
    googleAccess: {
      seoEmail: '',
      gmbAccess: false,
      analyticsAccess: false,
      searchConsoleAccess: false
    },
    
    // SEO Specific
    previousSeoReport: null,
    seoInvolvement: '',
    seoRemarks: '',
    
    // Advertising
    adsPlatforms: [], // ['google', 'meta', 'both']
    adsCredentials: {
      googleAds: { username: '', password: '' },
      metaAds: { username: '', password: '' }
    },
    adsInvolvement: '',
    dailyAdBudget: '',
    targetLocations: '',
    adsRemarks: '',
    
    // Social Media
    socialMediaAccess: {
      facebook: { username: '', password: '' },
      linkedin: { username: '', password: '' },
      youtube: { username: '', password: '' }
    },
    socialMediaInvolvement: '',
    youtubeInvolvement: '',
    
    // Business Understanding
    logoFiles: null,
    biggestStrength: '',
    identity: '',
    valueProposition: '',
    
    // Target Audience (Healthcare-focused)
    targetAudience: {
      primaryAudience: '', // * (patients, healthcare providers, administrators, etc.)
      ageRange: '',
      gender: '',
      location: '', // *
      incomeLevel: '',
      healthConditions: [], // For healthcare clients
      insuranceTypes: [], // For healthcare clients
      decisionMakingProcess: '', // *
    },
    
    // Ideal Customer Profile (ICP) for Marketing
    idealCustomerProfile: {
      demographics: '',
      psychographics: '',
      painPoints: [], // *
      motivations: [], // *
      preferredCommunicationChannels: [], // *
      buyingBehavior: '',
      customerJourneyStage: '',
    },
    
    // Services & Content
    topServices: ['', '', '', '', ''],
    customerLearningPoints: ['', '', '', '', ''],
    customerQuestions: '',
    educationTopics: ['', '', '', '', ''],
    keywords: '',
    
    // Customer Psychology
    customerFears: ['', '', '', '', '', '', '', '', '', ''],
    customerPainPoints: ['', '', '', '', '', '', '', '', '', ''],
    customerProblems: ['', '', '', '', '', '', '', '', '', ''],
    customerDesires: ['', '', '', '', '', '', '', '', '', ''],
    
    // Branding & Creative Design
    brandingNeeds: {
      logoDesign: false,
      brandGuidelines: false,
      marketingMaterials: false,
      websiteDesign: false,
      socialMediaGraphics: false,
      printMaterials: false,
      brandStrategy: false,
    },
    brandingRequirements: {
      brandPersonality: '', // *
      brandValues: [], // *
      targetBrandPerception: '',
      competitorBranding: '',
      brandingTimeline: '',
      brandingBudgetRange: '',
    },
    
    // AI Automation & Services
    aiAutomationNeeds: {
      chatbots: false,
      emailAutomation: false,
      leadScoring: false,
      contentGeneration: false,
      socialMediaAutomation: false,
      appointmentScheduling: false,
      customerSegmentation: false,
      predictiveAnalytics: false,
    },
    aiAutomationRequirements: {
      currentAutomationLevel: '',
      currentTools: '',
      automationGoals: [], // *
      dataIntegrationNeeds: '',
      complianceRequirements: '', // Important for healthcare
      automationTimeline: '',
      automationBudgetRange: '',
      implementationTimeline: '',
      technicalComplexity: '',
      additionalRequirements: '',
    },
    
    // Follow-up & Next Steps
    reviewMeetingDate: '',
    urgentRequirements: '',
    additionalNotes: '',
    
    // Business Operations & Compliance (Healthcare-focused)
    businessHours: '',
    timeZone: '',
    seasonalVariations: '',
    peakBusinessPeriods: '',
    
    // Competitive Analysis
    mainCompetitors: ['', '', ''],
    competitiveAdvantages: '',
    marketPosition: '',
    
    // Budget & Investment
    additionalMarketingBudget: '',
    expectedROI: '',
    budgetPriorities: [],
    investmentComfortLevel: '',
    
    // Communication Preferences
    preferredCommunicationMethod: '',
    reportingFrequency: '',
    meetingPreferences: '',
    
    // Technical Requirements
    currentTechStack: '',
    integrationNeeds: '',
    analyticsRequirements: '',
    
    // Content & Brand Guidelines
    brandGuidelines: null,
    contentTone: '',
    brandColors: '',
    brandFonts: '',
    
    // Legal & Compliance
    industryRegulations: '',
    complianceRequirements: '',
    dataPrivacyNeeds: '',
    
    // Success Metrics
    primaryKPIs: ['', '', '', '', ''],
    successDefinition: '',
    currentPerformanceMetrics: '',
    
    // Team & Resources
    internalTeamSize: '',
    keyStakeholders: ['', '', ''],
    decisionMakers: '',
    
    // Project Timeline
    projectUrgency: '',
    launchDeadlines: '',
    milestonePreferences: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const { notify } = useToast();

  // Industry options with specific terminology
  const industryOptions = [
    { value: 'healthcare', label: 'Healthcare', customerTerm: 'Patient' },
    { value: 'retail', label: 'Retail', customerTerm: 'Customer' },
    { value: 'restaurant', label: 'Restaurant', customerTerm: 'Customer' },
    { value: 'education', label: 'Education', customerTerm: 'Student' },
    { value: 'real-estate', label: 'Real Estate', customerTerm: 'Client' },
    { value: 'legal', label: 'Legal Services', customerTerm: 'Client' },
    { value: 'fitness', label: 'Fitness & Wellness', customerTerm: 'Member' },
    { value: 'automotive', label: 'Automotive', customerTerm: 'Customer' },
    { value: 'technology', label: 'Technology', customerTerm: 'User' },
    { value: 'other', label: 'Other', customerTerm: 'Customer' }
  ];

  // Business type options for healthcare
  const healthcareTypes = [
    'Doctor/Physician',
    'Clinic',
    'Hospital',
    'Dental Practice',
    'Veterinary Clinic',
    'Pharmacy',
    'Medical Laboratory',
    'Physiotherapy Center',
    'Mental Health Practice',
    'Chiropractic Practice',
    'Optometry/Eye Care',
    'Dermatology Practice',
    'Pediatric Practice',
    'Urgent Care Center',
    'Rehabilitation Center'
  ];

  // Healthcare-specific options
  const healthConditionsOptions = [
    'Diabetes',
    'Hypertension',
    'Heart Disease',
    'Arthritis',
    'Asthma',
    'Depression/Anxiety',
    'Chronic Pain',
    'Obesity',
    'Cancer',
    'Allergies',
    'Sleep Disorders',
    'Digestive Issues',
    'Skin Conditions',
    'Vision Problems',
    'Hearing Issues',
    'Pregnancy/Maternity',
    'Pediatric Conditions',
    'Mental Health',
    'Preventive Care',
    'General Wellness'
  ];

  const insuranceTypesOptions = [
    'Medicare',
    'Medicaid',
    'Private Insurance',
    'Blue Cross Blue Shield',
    'Aetna',
    'Cigna',
    'UnitedHealthcare',
    'Humana',
    'Kaiser Permanente',
    'Self-Pay/Cash',
    'HSA/FSA',
    'Workers Compensation',
    'Auto Insurance',
    'No Insurance',
    'Multiple Insurance Types'
  ];

  // Healthcare audience types
  const healthcareAudienceOptions = [
    'Patients (General)',
    'Elderly Patients (65+)',
    'Pediatric Patients',
    'Chronic Care Patients',
    'Emergency Care Patients',
    'Preventive Care Patients',
    'Healthcare Providers',
    'Medical Staff',
    'Insurance Companies',
    'Healthcare Administrators',
    'Caregivers/Family Members',
    'Healthcare Students',
    'Medical Researchers'
  ];

  // Occupation options for target audience
  const occupationOptions = [
    'Professionals (Doctors, Lawyers, Engineers)',
    'Business Owners/Entrepreneurs',
    'Corporate Employees',
    'Students',
    'Homemakers',
    'Retirees/Senior Citizens',
    'Government Employees',
    'Teachers/Educators',
    'Healthcare Workers',
    'IT Professionals',
    'Sales Professionals',
    'Freelancers/Consultants',
    'Blue Collar Workers',
    'Artists/Creatives',
    'Mixed/All Occupations',
    'Other'
  ];

  // Business size options
  const businessSizeOptions = [
    'Solo Practice/Individual',
    'Small Business (2-10 employees)',
    'Medium Business (11-50 employees)',
    'Large Business (51-200 employees)',
    'Enterprise (200+ employees)',
    'Startup',
    'Non-profit Organization'
  ];

  // Budget range options
  const budgetRangeOptions = [
    'Under $1,000/month',
    '$1,000 - $2,500/month',
    '$2,500 - $5,000/month',
    '$5,000 - $10,000/month',
    '$10,000 - $25,000/month',
    '$25,000+ /month',
    'Project-based pricing',
    'To be discussed'
  ];

  // Service options
  const webServices = [
    'Website Development',
    'Website Maintenance',
    'E-commerce Development',
    'Web Application',
    'Landing Pages',
    'Website Redesign'
  ];

  const marketingServices = [
    'SEO (Search Engine Optimization)',
    'Local SEO',
    'Google Ads',
    'Meta Ads (Facebook/Instagram)',
    'Social Media Management',
    'Content Marketing',
    'Email Marketing',
    'YouTube Marketing'
  ];

  // Indian States
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  // Business Registration Types
  const businessRegistrationTypes = [
    'Sole Proprietorship',
    'Partnership Firm',
    'Limited Liability Partnership (LLP)',
    'Private Limited Company',
    'Public Limited Company',
    'One Person Company (OPC)',
    'Section 8 Company (Non-Profit)',
    'Trust',
    'Society',
    'Cooperative Society',
    'Hindu Undivided Family (HUF)',
    'Unregistered Business'
  ];

  // Major Indian Cities (can be expanded based on state selection)
  const majorIndianCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai',
    'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur',
    'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad',
    'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivli', 'Vasai-Virar',
    'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar',
    'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore',
    'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur',
    'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubli-Dharwad',
    'Bareilly', 'Moradabad', 'Mysore', 'Gurgaon', 'Aligarh', 'Jalandhar',
    'Tiruchirappalli', 'Bhubaneswar', 'Salem', 'Mira-Bhayandar',
    'Warangal', 'Thiruvananthapuram', 'Guntur', 'Bhiwandi', 'Saharanpur',
    'Gorakhpur', 'Bikaner', 'Amravati', 'Noida', 'Jamshedpur', 'Bhilai',
    'Cuttack', 'Firozabad', 'Kochi', 'Nellore', 'Bhavnagar', 'Dehradun',
    'Durgapur', 'Asansol', 'Rourkela', 'Nanded', 'Kolhapur', 'Ajmer',
    'Akola', 'Gulbarga', 'Jamnagar', 'Ujjain', 'Loni', 'Siliguri',
    'Jhansi', 'Ulhasnagar', 'Jammu', 'Sangli-Miraj & Kupwad', 'Mangalore',
    'Erode', 'Belgaum', 'Ambattur', 'Tirunelveli', 'Malegaon', 'Gaya',
    'Jalgaon', 'Udaipur', 'Maheshtala'
   ];

  // Get customer term based on industry
  const getCustomerTerm = () => {
    const industry = industryOptions.find(ind => ind.value === formData.industry);
    return industry ? industry.customerTerm : 'Customer';
  };

  // Auto-save functionality
  const autoSaveForm = async () => {
    if (isAutoSaving) return;
    
    setIsAutoSaving(true);
    try {
      const autoSaveData = {
        ...formData,
        lastSaved: new Date().toISOString(),
        completionPercentage: calculateCompletionPercentage()
      };
      
      localStorage.setItem(`onboarding_form_${formData.formId}`, JSON.stringify(autoSaveData));
      setLastAutoSave(new Date());
      
      // Optional: Save to database as draft
      // await ClientOnboardingService.saveDraft(autoSaveData);
      
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Calculate form completion percentage
  const calculateCompletionPercentage = () => {
    const requiredFields = [
      'clientName', 'primaryEmail', 'phoneNumber', 'industry', 'businessType',
      'targetAudience.primaryAudience', 'targetAudience.location', 'targetAudience.decisionMakingProcess',
      'idealCustomerProfile.painPoints', 'idealCustomerProfile.motivations', 'idealCustomerProfile.preferredCommunicationChannels',
      'brandingDesign.brandPersonality', 'brandingDesign.brandValues', 'brandingDesign.designPreferences'
    ];
    
    let completedFields = 0;
    requiredFields.forEach(field => {
      const value = field.includes('.') ? 
        field.split('.').reduce((obj, key) => obj?.[key], formData) : 
        formData[field];
      
      if (Array.isArray(value) ? value.length > 0 : value) {
        completedFields++;
      }
    });
    
    return Math.round((completedFields / requiredFields.length) * 100);
  };

  // Enhanced validation with mandatory field checking
  const validateMandatoryFields = () => {
    const errors = {};
    
    // Basic Information (Required)
    if (!formData.clientName?.trim()) errors.clientName = 'Client name is required';
    if (!formData.primaryEmail?.trim()) errors.primaryEmail = 'Primary email is required';
    if (!formData.phoneNumber?.trim()) errors.phoneNumber = 'Phone number is required';
    if (!formData.industry) errors.industry = 'Industry selection is required';
    if (!formData.businessType?.trim()) errors.businessType = 'Business type is required';
    
    // Target Audience (Required)
    if (!formData.targetAudience?.primaryAudience?.trim()) {
      errors['targetAudience.primaryAudience'] = 'Primary audience is required';
    }
    if (!formData.targetAudience?.location?.trim()) {
      errors['targetAudience.location'] = 'Target location is required';
    }
    if (!formData.targetAudience?.decisionMakingProcess?.trim()) {
      errors['targetAudience.decisionMakingProcess'] = 'Decision making process is required';
    }
    
    // ICP (Required)
    if (!formData.idealCustomerProfile?.painPoints?.trim()) {
      errors['idealCustomerProfile.painPoints'] = 'Pain points and challenges are required';
    }
    if (!formData.idealCustomerProfile?.motivations?.trim()) {
      errors['idealCustomerProfile.motivations'] = 'Motivations and goals are required';
    }
    if (!formData.idealCustomerProfile?.preferredCommunicationChannels?.length) {
      errors['idealCustomerProfile.preferredCommunicationChannels'] = 'At least one communication channel is required';
    }
    
    // Branding (Required)
    if (!formData.brandingDesign?.brandPersonality?.trim()) {
      errors['brandingDesign.brandPersonality'] = 'Brand personality is required';
    }
    if (!formData.brandingDesign?.brandValues?.length) {
      errors['brandingDesign.brandValues'] = 'At least one brand value is required';
    }
    if (!formData.brandingDesign?.designPreferences?.length) {
      errors['brandingDesign.designPreferences'] = 'At least one design preference is required';
    }
    
    // AI Automation (Required if AI services selected)
    const aiSelected = Object.values(formData.aiAutomationNeeds || {}).some(Boolean);
    if (aiSelected) {
      if (!formData.aiAutomationRequirements?.automationGoals?.length) {
        errors['aiAutomationRequirements.automationGoals'] = 'Automation goals are required for AI services';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
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
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle nested object changes
  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  // Handle array changes
  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  // Validate current step
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.clientName) newErrors.clientName = 'Client name is required';
        if (!formData.industry) newErrors.industry = 'Industry is required';
        // Note: serviceScope validation removed as services are pre-determined for post-payment clients
        break;
      case 2:
        if (!formData.primaryEmail) newErrors.primaryEmail = 'Primary email is required';
        if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
        break;
      case 13:
        if (!formData.targetAudience.primaryAudience) newErrors.primaryAudience = 'Primary target audience is required';
        if (!formData.idealCustomerProfile.painPoints) newErrors.painPoints = 'Pain points and challenges are required';
        break;
      case 14:
        if (!formData.brandingDesign.brandPersonality) newErrors.brandPersonality = 'Brand personality is required';
        break;
      case 15:
        // AI Automation validation - optional fields, no mandatory validation needed
        break;
      // Add more validation as needed
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Auto-save effect
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (formData.clientName || formData.primaryEmail) { // Only auto-save if form has some data
        autoSaveForm();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [formData]);

  // Form restoration effect
  useEffect(() => {
    const savedFormData = localStorage.getItem(`onboarding_form_${formData.formId}`);
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);
        setLastAutoSave(new Date(parsedData.lastSaved));
        notify('Form data restored from previous session', 'info');
      } catch (error) {
        console.error('Failed to restore form data:', error);
      }
    }
  }, []);

  // Auto-save on form data change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.clientName || formData.primaryEmail) {
        autoSaveForm();
      }
    }, 2000); // Auto-save 2 seconds after user stops typing

    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Validate required fields before submission
      const validationErrors = validateMandatoryFields();
      if (Object.keys(validationErrors).length > 0) {
        setValidationErrors(validationErrors);
        setSubmitError('Please fill in all required fields before submitting.');
        notify({
          title: 'Validation Error',
          message: 'Please fill in all required fields before submitting.',
          type: 'error'
        });
        return;
      }

      // Show loading notification
      notify({
        title: 'Submitting Form',
        message: 'Please wait while we save your information...',
        type: 'info'
      });

      // Save the main onboarding data
      const savedRecord = await ClientOnboardingService.saveOnboardingData(formData);
      
      if (!savedRecord || !savedRecord.id) {
        throw new Error('Failed to save client onboarding data - no record returned');
      }
      
      // Handle file uploads if any
      if (formData.logoFiles && formData.logoFiles.length > 0) {
        await ClientOnboardingService.saveOnboardingFiles(
          savedRecord.id,
          formData.logoFiles,
          'logo'
        );
      }
      
      if (formData.previousSeoReport) {
        await ClientOnboardingService.saveOnboardingFiles(
          savedRecord.id,
          [formData.previousSeoReport],
          'seo_report'
        );
      }
      
      setSubmitSuccess(true);
      
      // Show success notification
      notify({
        title: 'Form Submitted Successfully!',
        message: `Client onboarding for ${formData.clientName} has been saved. You can view it in the client directory.`,
        type: 'success'
      });
      
      // Clear auto-saved data
      localStorage.removeItem(`onboarding_form_${formData.formId}`);
      
      // Redirect to client directory after 2 seconds
      setTimeout(() => {
        if (onBack) {
          onBack();
        } else {
          window.location.href = '/client-directory';
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting onboarding form:', error);
      const errorMessage = error.message || 'Failed to submit form. Please try again.';
      setSubmitError(errorMessage);
      
      notify({
        title: 'Submission Failed',
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Step 6: Social Media & Content
  const renderStep6 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Social Media & Content Management</h2>
      
      {/* Social Media Section */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Social Media Access</h3>
          
          {/* Facebook Access */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Facebook Access</h4>
            <p className="text-sm text-gray-600 mb-2">
              Please provide admin access to: <strong>https://www.facebook.com/arush.thapar</strong> (Arush.thapar@yahoo.com)
            </p>
            <p className="text-sm text-blue-600">
              Tutorials: 
              <a href="https://youtu.be/d0qfd15Pdlc?t=126" target="_blank" rel="noopener noreferrer" className="underline ml-1">Desktop</a> | 
              <a href="https://youtu.be/d0qfd15Pdlc?t=243" target="_blank" rel="noopener noreferrer" className="underline ml-1">Mobile</a>
            </p>
          </div>
          
          {/* LinkedIn Access */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">LinkedIn Access</h4>
            <p className="text-sm text-gray-600 mb-2">
              {formData.industry === 'healthcare' ? 'For doctors: LinkedIn profile login / For hospitals: We will send connection request' : 'LinkedIn profile access required'}
            </p>
            <p className="text-sm text-blue-600">
              Tutorial: <a href="https://youtu.be/yjvdwyjg25w?t=8" target="_blank" rel="noopener noreferrer" className="underline">How to give LinkedIn access</a>
            </p>
          </div>
          
          {/* Social Media Involvement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Social Media Involvement</label>
            <select
              value={formData.socialMediaInvolvement}
              onChange={(e) => handleInputChange('socialMediaInvolvement', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select your preferred involvement level</option>
              <option value="full-management">Full Management - Create and post everything</option>
              <option value="content-approval">Content Approval - Review before posting</option>
              <option value="collaborative">Collaborative - Work together on content</option>
              <option value="content-provider">Content Provider - I provide, you optimize and post</option>
            </select>
          </div>
        </div>
      
      {/* YouTube Section */}
      <div className="bg-red-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">YouTube Management</h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Please provide access to our video team emails:
          </p>
          <ul className="text-sm text-gray-600 mb-2">
            <li>• ytbpworks@gmail.com</li>
            <li>• brandingpioneers@gmail.com</li>
          </ul>
          <p className="text-sm text-blue-600">
            Tutorial: <a href="https://youtu.be/iw1m3FaY-g4?t=46" target="_blank" rel="noopener noreferrer" className="underline">How to give YouTube access</a>
          </p>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">YouTube Involvement</label>
          <select
            value={formData.youtubeInvolvement}
            onChange={(e) => handleInputChange('youtubeInvolvement', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select your preferred involvement level</option>
            <option value="full-production">Full Production - Complete video creation and channel management</option>
            <option value="editing-only">Editing Only - You provide footage, we edit and upload</option>
            <option value="guidance">Guidance & Strategy - Consulting on content strategy and optimization</option>
            <option value="channel-setup">Channel Setup - Initial setup and branding only</option>
          </select>
        </div>
      </div>
      
      {/* Current Logo Upload */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Logo & Branding</h3>
        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Current Logo Files</label>
        <p className="text-xs text-gray-500 mb-2">Upload your current logo in any format (PNG, JPG, SVG, AI, EPS, PDF)</p>
        <input
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.svg,.ai,.eps,.pdf"
          onChange={(e) => handleInputChange('logoFiles', e.target.files)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  // Render Step 7: Business Understanding & Target Audience
  const renderStep7 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Business Understanding & Target Audience</h2>
      
      {/* Business Identity */}
      <div className="bg-indigo-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Identity</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">What is your biggest strength?</label>
            <textarea
              value={formData.biggestStrength}
              onChange={(e) => handleInputChange('biggestStrength', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Highlight the specialty or skill you have the most experience/skill in that stands out from your other services"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">IDENTITY: Who are you?</label>
            <textarea
              value={formData.identity}
              onChange={(e) => handleInputChange('identity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Describe your business identity and what you represent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              VALUE PROPOSITION: What's the UVP for your {getCustomerTerm()}?
            </label>
            <textarea
              value={formData.valueProposition}
              onChange={(e) => handleInputChange('valueProposition', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder={`Why will the ${getCustomerTerm().toLowerCase()} choose you and not the next 10 competitors in your city?`}
            />
          </div>
        </div>
      </div>
      
      {/* Target Audience */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Target Audience</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age of your {getCustomerTerm().toLowerCase()}s
            </label>
            <select
              value={formData.targetAge}
              onChange={(e) => handleInputChange('targetAge', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select age range</option>
              <option value="18-25">18-25 years</option>
              <option value="26-35">26-35 years</option>
              <option value="36-45">36-45 years</option>
              <option value="46-55">46-55 years</option>
              <option value="56-65">56-65 years</option>
              <option value="65+">65+ years</option>
              <option value="all-ages">All ages</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender of your {getCustomerTerm().toLowerCase()}s
            </label>
            <select
              value={formData.targetGender}
              onChange={(e) => handleInputChange('targetGender', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="both">Both</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Occupation of your {getCustomerTerm().toLowerCase()}s
            </label>
            <select
              value={formData.targetOccupation}
              onChange={(e) => handleInputChange('targetOccupation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select occupation</option>
              {occupationOptions.map(occupation => (
                <option key={occupation} value={occupation}>{occupation}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Income Level of your {getCustomerTerm().toLowerCase()}s
            </label>
            <select
              value={formData.targetIncome}
              onChange={(e) => handleInputChange('targetIncome', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select income level</option>
              <option value="Under $25,000">Under $25,000</option>
              <option value="$25,000 - $50,000">$25,000 - $50,000</option>
              <option value="$50,000 - $75,000">$50,000 - $75,000</option>
              <option value="$75,000 - $100,000">$75,000 - $100,000</option>
              <option value="$100,000 - $150,000">$100,000 - $150,000</option>
              <option value="Over $150,000">Over $150,000</option>
              <option value="Varies significantly">Varies significantly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Location of your {getCustomerTerm().toLowerCase()}s
            </label>
            <input
              type="text"
              value={formData.targetLocation}
              onChange={(e) => handleInputChange('targetLocation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Local, National, International, Specific cities/states"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Customer Acquisition Cost (if known)
            </label>
            <input
              type="text"
              value={formData.customerAcquisitionCost}
              onChange={(e) => handleInputChange('customerAcquisitionCost', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., $50, Unknown, Varies by channel"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Average Order Value
            </label>
            <input
              type="text"
              value={formData.averageOrderValue}
              onChange={(e) => handleInputChange('averageOrderValue', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., $100, $500-$1000, Varies by service"
            />
          </div>
        </div>
      </div>
      
      {/* Services & Content */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Services & Content Strategy</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Top 5 {formData.industry === 'healthcare' ? 'Medical Services/Treatments' : 'Services'}
            </label>
            {formData.topServices.map((service, index) => (
              <input
                key={index}
                type="text"
                value={service}
                onChange={(e) => handleArrayChange('topServices', index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                placeholder={formData.industry === 'healthcare' ? 
                  `Medical service/treatment ${index + 1} (e.g., General Checkups, Dental Cleanings, Physical Therapy)` : 
                  `Service ${index + 1}`
                }
              />
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What would your target {getCustomerTerm().toLowerCase()} love to learn about your product/service?
            </label>
            {formData.customerLearningPoints.map((point, index) => (
              <input
                key={index}
                type="text"
                value={point}
                onChange={(e) => handleArrayChange('customerLearningPoints', index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                placeholder={`Learning point ${index + 1}`}
              />
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What questions about your service do your {getCustomerTerm().toLowerCase()}s have before they want to buy?
            </label>
            <textarea
              value={formData.customerQuestions}
              onChange={(e) => handleInputChange('customerQuestions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="List common questions your customers ask"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Top 5 {formData.industry === 'healthcare' ? 'Health Education Topics' : 'topics about your domain'} you would love to educate your {getCustomerTerm().toLowerCase()}s on
            </label>
            {formData.educationTopics.map((topic, index) => (
              <input
                key={index}
                type="text"
                value={topic}
                onChange={(e) => handleArrayChange('educationTopics', index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                placeholder={formData.industry === 'healthcare' ? 
                  `Health topic ${index + 1} (e.g., Preventive Care, Nutrition, Exercise, Mental Health)` : 
                  `Education topic ${index + 1}`
                }
              />
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Top 15 keywords that come to your mind when you think of your {formData.industry === 'healthcare' ? 'medical practice/services' : 'product'}
            </label>
            <textarea
              value={formData.keywords}
              onChange={(e) => handleInputChange('keywords', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder={formData.industry === 'healthcare' ? 
                "Enter healthcare keywords separated by commas (e.g., family medicine, preventive care, patient wellness, health screening)" : 
                "Enter keywords separated by commas"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render Step 8: Business Operations & Competitive Analysis
  const renderStep8 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Business Operations & Market Analysis
      </h2>
      
      {/* Business Operations */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Operations</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Hours
            </label>
            <input
              type="text"
              value={formData.businessHours}
              onChange={(e) => handleInputChange('businessHours', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Mon-Fri 9AM-6PM"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Zone
            </label>
            <select
              value={formData.timeZone}
              onChange={(e) => handleInputChange('timeZone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select time zone</option>
              <option value="EST">Eastern (EST)</option>
              <option value="CST">Central (CST)</option>
              <option value="MST">Mountain (MST)</option>
              <option value="PST">Pacific (PST)</option>
              <option value="GMT">GMT</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seasonal Variations
            </label>
            <textarea
              value={formData.seasonalVariations}
              onChange={(e) => handleInputChange('seasonalVariations', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="How does your business vary by season?"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Peak Business Periods
            </label>
            <textarea
              value={formData.peakBusinessPeriods}
              onChange={(e) => handleInputChange('peakBusinessPeriods', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="When is your business busiest?"
            />
          </div>
        </div>
      </div>
      
      {/* Competitive Analysis */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Competitive Analysis</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Competitors (Top 3)
            </label>
            {formData.mainCompetitors.map((competitor, index) => (
              <input
                key={index}
                type="text"
                value={competitor}
                onChange={(e) => handleArrayChange('mainCompetitors', index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                placeholder={`Competitor ${index + 1}`}
              />
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Competitive Advantages
            </label>
            <textarea
              value={formData.competitiveAdvantages}
              onChange={(e) => handleInputChange('competitiveAdvantages', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="What makes you different from competitors?"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Market Position
            </label>
            <select
              value={formData.marketPosition}
              onChange={(e) => handleInputChange('marketPosition', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select market position</option>
              <option value="premium">Premium/Luxury</option>
              <option value="mid-market">Mid-Market</option>
              <option value="budget">Budget/Value</option>
              <option value="niche">Niche Specialist</option>
              <option value="market-leader">Market Leader</option>
              <option value="challenger">Challenger</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Step 9: Customer Psychology & Follow-up
  const renderStep9 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {getCustomerTerm()} Psychology & Follow-up
      </h2>
      
      {/* Customer Psychology */}
      <div className="bg-red-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {getCustomerTerm()} Psychology
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fears of {getCustomerTerm().toLowerCase()}s before they take your service
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Mention 5-10 points highlighting the fears your {getCustomerTerm().toLowerCase()} will experience before taking your service
            </p>
            {formData.customerFears.map((fear, index) => (
              <input
                key={index}
                type="text"
                value={fear}
                onChange={(e) => handleArrayChange('customerFears', index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                placeholder={`Fear ${index + 1}`}
              />
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pain points of {getCustomerTerm().toLowerCase()}s
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Mention 5-10 points highlighting the pain points your {getCustomerTerm().toLowerCase()} experiences before taking your service
            </p>
            {formData.customerPainPoints.map((pain, index) => (
              <input
                key={index}
                type="text"
                value={pain}
                onChange={(e) => handleArrayChange('customerPainPoints', index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                placeholder={`Pain point ${index + 1}`}
              />
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Problems of {getCustomerTerm().toLowerCase()}s before they take your service
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Mention 5-10 points highlighting the problems your {getCustomerTerm().toLowerCase()} experiences before taking your service
            </p>
            {formData.customerProblems.map((problem, index) => (
              <input
                key={index}
                type="text"
                value={problem}
                onChange={(e) => handleArrayChange('customerProblems', index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                placeholder={`Problem ${index + 1}`}
              />
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Needs and desires of your {getCustomerTerm().toLowerCase()}s after your service
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Mention 5-10 points highlighting the emotions your {getCustomerTerm().toLowerCase()} will experience after taking your service
            </p>
            {formData.customerDesires.map((desire, index) => (
              <input
                key={index}
                type="text"
                value={desire}
                onChange={(e) => handleArrayChange('customerDesires', index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                placeholder={`Desire/Need ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Follow-up */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Follow-up & Next Steps</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Review Meeting Date</label>
          <input
            type="date"
            value={formData.reviewMeetingDate}
            onChange={(e) => handleInputChange('reviewMeetingDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={new Date().toISOString().split('T')[0]}
          />
          <p className="text-sm text-gray-600 mt-1">
            Please select your preferred date for the review meeting
          </p>
        </div>
      </div>
    </div>
  );

  // Render Step 10: Budget & Communication Preferences
  const renderStep10 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Budget & Communication Preferences
      </h2>
      
      {/* Budget Allocation & Investment Priorities */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Budget Allocation & Investment Priorities</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Marketing Budget Allocation (beyond our services)
            </label>
            <textarea
              value={formData.additionalMarketingBudget}
              onChange={(e) => handleInputChange('additionalMarketingBudget', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Do you have additional budget for paid advertising, tools, or other marketing expenses? Please specify amounts and priorities."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investment Priorities
            </label>
            <div className="space-y-2">
              {[
                'Paid Advertising (Google Ads, Meta Ads)',
                'Content Creation & Photography',
                'Marketing Tools & Software',
                'Website Enhancements',
                'SEO & Content Marketing',
                'Social Media Management',
                'Email Marketing Automation',
                'Analytics & Tracking Tools'
              ].map(priority => (
                <label key={priority} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.budgetPriorities.includes(priority)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleInputChange('budgetPriorities', [...formData.budgetPriorities, priority]);
                      } else {
                        handleInputChange('budgetPriorities', formData.budgetPriorities.filter(p => p !== priority));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{priority}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected ROI Timeline
            </label>
            <select
              value={formData.expectedROI}
              onChange={(e) => handleInputChange('expectedROI', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select realistic timeline for seeing results</option>
              <option value="1-3-months">1-3 months (Quick wins & initial improvements)</option>
              <option value="3-6-months">3-6 months (Significant growth & optimization)</option>
              <option value="6-12-months">6-12 months (Long-term strategy & market positioning)</option>
              <option value="12-plus-months">12+ months (Brand building & market dominance)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Communication Preferences */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Communication Preferences</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Communication Method
            </label>
            <select
              value={formData.preferredCommunicationMethod}
              onChange={(e) => handleInputChange('preferredCommunicationMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select method</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="video-call">Video Call</option>
              <option value="slack">Slack</option>
              <option value="teams">Microsoft Teams</option>
              <option value="in-person">In-Person</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reporting Frequency
            </label>
            <select
              value={formData.reportingFrequency}
              onChange={(e) => handleInputChange('reportingFrequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select frequency</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meeting Preferences
            </label>
            <textarea
              value={formData.meetingPreferences}
              onChange={(e) => handleInputChange('meetingPreferences', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Best times, frequency, format preferences"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render Step 11: Technical Requirements & Success Metrics
  const renderStep11 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Technical Requirements & Success Metrics
      </h2>
      
      {/* Technical Requirements */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Technical Requirements</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Tech Stack
            </label>
            <textarea
              value={formData.currentTechStack}
              onChange={(e) => handleInputChange('currentTechStack', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="CMS, CRM, email platforms, analytics tools, etc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Integration Needs
            </label>
            <textarea
              value={formData.integrationNeeds}
              onChange={(e) => handleInputChange('integrationNeeds', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Systems that need to connect or integrate"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Analytics Requirements
            </label>
            <textarea
              value={formData.analyticsRequirements}
              onChange={(e) => handleInputChange('analyticsRequirements', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Tracking, reporting, and analytics needs"
            />
          </div>
        </div>
      </div>
      
      {/* Success Metrics */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Success Metrics & KPIs</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary KPIs (Top 5)
            </label>
            {formData.primaryKPIs.map((kpi, index) => (
              <input
                key={index}
                type="text"
                value={kpi}
                onChange={(e) => handleArrayChange('primaryKPIs', index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                placeholder={`KPI ${index + 1} (e.g., Lead generation, Revenue growth)`}
              />
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How do you define success?
            </label>
            <textarea
              value={formData.successDefinition}
              onChange={(e) => handleInputChange('successDefinition', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="What would make this project a success?"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Performance Metrics
            </label>
            <textarea
              value={formData.currentPerformanceMetrics}
              onChange={(e) => handleInputChange('currentPerformanceMetrics', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Current website traffic, conversion rates, leads, etc."
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render Step 12: Team & Project Timeline
  const renderStep12 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Team Structure & Project Timeline
      </h2>
      
      {/* Team & Resources */}
      <div className="bg-indigo-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Team & Resources</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Internal Team Size
            </label>
            <select
              value={formData.internalTeamSize}
              onChange={(e) => handleInputChange('internalTeamSize', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select team size</option>
              <option value="1-5">1-5 people</option>
              <option value="6-10">6-10 people</option>
              <option value="11-25">11-25 people</option>
              <option value="26-50">26-50 people</option>
              <option value="50-plus">50+ people</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Stakeholders
            </label>
            {formData.keyStakeholders.map((stakeholder, index) => (
              <input
                key={index}
                type="text"
                value={stakeholder}
                onChange={(e) => handleArrayChange('keyStakeholders', index, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                placeholder={`Stakeholder ${index + 1} (Name & Role)`}
              />
            ))}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Decision Makers
            </label>
            <textarea
              value={formData.decisionMakers}
              onChange={(e) => handleInputChange('decisionMakers', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Who makes final decisions on this project?"
            />
          </div>
        </div>
      </div>
      
      {/* Project Timeline */}
      <div className="bg-red-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Timeline</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Urgency
            </label>
            <select
              value={formData.projectUrgency}
              onChange={(e) => handleInputChange('projectUrgency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select urgency</option>
              <option value="asap">ASAP (Rush)</option>
              <option value="1-month">Within 1 month</option>
              <option value="2-3-months">2-3 months</option>
              <option value="3-6-months">3-6 months</option>
              <option value="flexible">Flexible timeline</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Launch Deadlines
            </label>
            <textarea
              value={formData.launchDeadlines}
              onChange={(e) => handleInputChange('launchDeadlines', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Any specific launch dates or deadlines?"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Milestone Preferences
            </label>
            <textarea
              value={formData.milestonePreferences}
              onChange={(e) => handleInputChange('milestonePreferences', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="How would you like to track progress?"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render Step 13: Target Audience & Ideal Customer Profile
  const renderStep13 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Target Audience & Ideal Customer Profile
      </h2>
      
      {/* Target Audience Analysis */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Target Audience Analysis</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Target Audience{renderMandatoryIndicator()}
            </label>
            <textarea
              value={formData.targetAudience.primaryAudience}
              onChange={(e) => handleNestedChange('targetAudience', 'primaryAudience', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.primaryAudience ? 'border-red-500' : 'border-gray-300'
              }`}
              rows="3"
              placeholder="Describe your primary target audience (demographics, psychographics, behaviors)"
            />
            {renderFieldError('primaryAudience')}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Geographic Focus
            </label>
            <input
              type="text"
              value={formData.targetAudience.geographicFocus}
              onChange={(e) => handleNestedChange('targetAudience', 'geographicFocus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Local, regional, national, or international focus"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Range
            </label>
            <input
              type="text"
              value={formData.targetAudience.ageRange}
              onChange={(e) => handleNestedChange('targetAudience', 'ageRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 25-45, 35-65"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Income Level
            </label>
            <select
              value={formData.targetAudience.incomeLevel}
              onChange={(e) => handleNestedChange('targetAudience', 'incomeLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select income level</option>
              <option value="low">Low Income ($0-$35k)</option>
              <option value="middle-low">Lower Middle ($35k-$50k)</option>
              <option value="middle">Middle Income ($50k-$100k)</option>
              <option value="upper-middle">Upper Middle ($100k-$200k)</option>
              <option value="high">High Income ($200k+)</option>
              <option value="mixed">Mixed Income Levels</option>
            </select>
          </div>

          {/* Healthcare-specific fields */}
          {formData.industry === 'healthcare' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary {getCustomerTerm()} Type
                </label>
                <select
                  value={formData.targetAudience.primaryAudience}
                  onChange={(e) => handleNestedChange('targetAudience', 'primaryAudience', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select primary {getCustomerTerm().toLowerCase()} type</option>
                  {healthcareAudienceOptions.map(audience => (
                    <option key={audience} value={audience}>{audience}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Common Health Conditions/Specialties
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {healthConditionsOptions.map(condition => (
                    <label key={condition} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.targetAudience.healthConditions.includes(condition)}
                        onChange={(e) => {
                          const conditions = formData.targetAudience.healthConditions;
                          if (e.target.checked) {
                            handleNestedChange('targetAudience', 'healthConditions', [...conditions, condition]);
                          } else {
                            handleNestedChange('targetAudience', 'healthConditions', conditions.filter(c => c !== condition));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{condition}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Types Accepted
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                  {insuranceTypesOptions.map(insurance => (
                    <label key={insurance} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.targetAudience.insuranceTypes.includes(insurance)}
                        onChange={(e) => {
                          const insurances = formData.targetAudience.insuranceTypes;
                          if (e.target.checked) {
                            handleNestedChange('targetAudience', 'insuranceTypes', [...insurances, insurance]);
                          } else {
                            handleNestedChange('targetAudience', 'insuranceTypes', insurances.filter(i => i !== insurance));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{insurance}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Ideal Customer Profile */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ideal Customer Profile (ICP)</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getCustomerTerm()} Pain Points & Challenges{renderMandatoryIndicator()}
            </label>
            <textarea
              value={formData.idealCustomerProfile.painPoints}
              onChange={(e) => handleNestedChange('idealCustomerProfile', 'painPoints', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.painPoints ? 'border-red-500' : 'border-gray-300'
              }`}
              rows="3"
              placeholder={formData.industry === 'healthcare' ? 
                "What health concerns, access issues, or care challenges do your patients face?" : 
                "What specific problems does your ideal customer face that you solve?"
              }
            />
            {renderFieldError('painPoints')}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getCustomerTerm()} Goals & Motivations
            </label>
            <textarea
              value={formData.idealCustomerProfile.motivations}
              onChange={(e) => handleNestedChange('idealCustomerProfile', 'motivations', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder={formData.industry === 'healthcare' ? 
                "What health outcomes, wellness goals, or care improvements do your patients seek?" : 
                "What are their goals and what motivates them to seek your services?"
              }
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {getCustomerTerm()} Decision-Making Process
            </label>
            <textarea
              value={formData.idealCustomerProfile.decisionMaking}
              onChange={(e) => handleNestedChange('idealCustomerProfile', 'decisionMaking', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder={formData.industry === 'healthcare' ? 
                "How do patients choose healthcare providers? Who influences their decisions (family, doctors, insurance)?" : 
                "How do they typically make purchasing decisions? Who influences them?"
              }
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Communication Channels
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(formData.industry === 'healthcare' ? 
                ['Email', 'Phone', 'Patient Portal', 'Text/SMS', 'Telehealth', 'In-Person', 'Referrals', 'Health Apps', 'Educational Materials', 'Support Groups'] :
                ['Email', 'Phone', 'Social Media', 'Website', 'Referrals', 'In-Person', 'Online Reviews', 'Content Marketing']
              ).map(channel => (
                <label key={channel} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.idealCustomerProfile.communicationChannels.includes(channel)}
                    onChange={(e) => {
                      const channels = formData.idealCustomerProfile.communicationChannels;
                      if (e.target.checked) {
                        handleNestedChange('idealCustomerProfile', 'communicationChannels', [...channels, channel]);
                      } else {
                        handleNestedChange('idealCustomerProfile', 'communicationChannels', channels.filter(c => c !== channel));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{channel}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Step 14: Branding & Creative Design
  const renderStep14 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Branding & Creative Design
      </h2>
      
      {/* Current Brand Status */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Brand Status</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Do you have an existing logo?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasLogo"
                  value="yes"
                  checked={formData.brandingDesign.hasLogo === 'yes'}
                  onChange={(e) => handleNestedChange('brandingDesign', 'hasLogo', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasLogo"
                  value="no"
                  checked={formData.brandingDesign.hasLogo === 'no'}
                  onChange={(e) => handleNestedChange('brandingDesign', 'hasLogo', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">No</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasLogo"
                  value="needs-redesign"
                  checked={formData.brandingDesign.hasLogo === 'needs-redesign'}
                  onChange={(e) => handleNestedChange('brandingDesign', 'hasLogo', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Yes, but needs redesign</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo URL (if available)
            </label>
            <input
              type="url"
              value={formData.logoUrl}
              onChange={(e) => handleInputChange('logoUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/logo.png"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Guidelines URL
            </label>
            <input
              type="url"
              value={formData.brandGuidelinesUrl}
              onChange={(e) => handleInputChange('brandGuidelinesUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/brand-guidelines.pdf"
            />
          </div>
        </div>
      </div>
      
      {/* Brand Preferences */}
      <div className="bg-indigo-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Brand Preferences & Style</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Personality{renderMandatoryIndicator()}
            </label>
            <textarea
              value={formData.brandingDesign.brandPersonality}
              onChange={(e) => handleNestedChange('brandingDesign', 'brandPersonality', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.brandPersonality ? 'border-red-500' : 'border-gray-300'
              }`}
              rows="3"
              placeholder="How would you describe your brand's personality? (e.g., professional, friendly, innovative, trustworthy)"
            />
            {renderFieldError('brandPersonality')}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Colors
            </label>
            <input
              type="text"
              value={formData.brandingDesign.preferredColors}
              onChange={(e) => handleNestedChange('brandingDesign', 'preferredColors', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Blue and white, Earth tones, Modern pastels"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Design Style Preference
            </label>
            <select
              value={formData.brandingDesign.designStyle}
              onChange={(e) => handleNestedChange('brandingDesign', 'designStyle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select design style</option>
              <option value="modern-minimalist">Modern & Minimalist</option>
              <option value="professional-corporate">Professional & Corporate</option>
              <option value="creative-artistic">Creative & Artistic</option>
              <option value="warm-approachable">Warm & Approachable</option>
              <option value="bold-dynamic">Bold & Dynamic</option>
              <option value="classic-traditional">Classic & Traditional</option>
              <option value="healthcare-medical">Healthcare & Medical</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brands You Admire
            </label>
            <textarea
              value={formData.brandingDesign.inspirationalBrands}
              onChange={(e) => handleNestedChange('brandingDesign', 'inspirationalBrands', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="List 3-5 brands whose visual identity you admire and why"
            />
          </div>
        </div>
      </div>
      
      {/* Design Needs */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Design Needs & Requirements</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What design materials do you need?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Logo Design/Redesign',
                'Business Cards',
                'Letterhead',
                'Brochures/Flyers',
                'Website Graphics',
                'Social Media Templates',
                'Email Signatures',
                'Presentation Templates',
                'Signage Design',
                'Marketing Materials'
              ].map(material => (
                <label key={material} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.brandingDesign.designNeeds.includes(material)}
                    onChange={(e) => {
                      const needs = formData.brandingDesign.designNeeds;
                      if (e.target.checked) {
                        handleNestedChange('brandingDesign', 'designNeeds', [...needs, material]);
                      } else {
                        handleNestedChange('brandingDesign', 'designNeeds', needs.filter(n => n !== material));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{material}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeline for Design Work
            </label>
            <select
              value={formData.brandingDesign.timeline}
              onChange={(e) => handleNestedChange('brandingDesign', 'timeline', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select timeline</option>
              <option value="asap">ASAP (Rush)</option>
              <option value="1-2-weeks">1-2 weeks</option>
              <option value="3-4-weeks">3-4 weeks</option>
              <option value="1-2-months">1-2 months</option>
              <option value="flexible">Flexible timeline</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Design Requirements
            </label>
            <textarea
              value={formData.brandingDesign.additionalRequirements}
              onChange={(e) => handleNestedChange('brandingDesign', 'additionalRequirements', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Any specific requirements, file formats needed, or special considerations?"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render Step 15: AI Automation & Services
  const renderStep15 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        AI Automation & Services
      </h2>
      
      {/* Current Automation Level */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Automation Status</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's your current level of automation?
            </label>
            <select
              value={formData.aiAutomationRequirements.currentAutomationLevel}
              onChange={(e) => handleNestedChange('aiAutomationRequirements', 'currentAutomationLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select current level</option>
              <option value="none">No automation currently</option>
              <option value="basic">Basic automation (email autoresponders, simple workflows)</option>
              <option value="intermediate">Intermediate (CRM automation, lead scoring)</option>
              <option value="advanced">Advanced (AI chatbots, predictive analytics)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Tools & Platforms
            </label>
            <textarea
              value={formData.aiAutomationRequirements.currentTools}
              onChange={(e) => handleNestedChange('aiAutomationRequirements', 'currentTools', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="List any automation tools you currently use (e.g., Zapier, HubSpot, Mailchimp)"
            />
          </div>
        </div>
      </div>
      
      {/* AI Automation Needs */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Automation Services Needed</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Which AI automation services interest you?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                'AI Chatbots for Customer Service',
                'Email Marketing Automation',
                'Lead Qualification & Scoring',
                'Appointment Scheduling',
                'Social Media Automation',
                'Content Generation (AI Writing)',
                'Customer Segmentation',
                'Predictive Analytics',
                'Voice Assistants',
                'Workflow Automation',
                'Data Analysis & Reporting',
                'Personalized Recommendations'
              ].map(service => (
                <label key={service} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={Object.keys(formData.aiAutomationNeeds).includes(service.toLowerCase().replace(/[^a-z0-9]/g, '')) && formData.aiAutomationNeeds[service.toLowerCase().replace(/[^a-z0-9]/g, '')]}
                    onChange={(e) => {
                      const key = service.toLowerCase().replace(/[^a-z0-9]/g, '');
                      handleNestedChange('aiAutomationNeeds', key, e.target.checked);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{service}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Automation Goals
            </label>
            <textarea
              value={formData.aiAutomationRequirements.automationGoals}
              onChange={(e) => handleNestedChange('aiAutomationRequirements', 'automationGoals', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="What are your main goals with AI automation? (e.g., save time, improve customer experience, increase conversions)"
            />
          </div>
        </div>
      </div>
      
      {/* Implementation Preferences */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Implementation Preferences</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Automation Budget Range
            </label>
            <select
              value={formData.aiAutomationRequirements.automationBudgetRange}
              onChange={(e) => handleNestedChange('aiAutomationRequirements', 'automationBudgetRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select budget range</option>
              <option value="under-1k">Under $1,000/month</option>
              <option value="1k-3k">$1,000 - $3,000/month</option>
              <option value="3k-5k">$3,000 - $5,000/month</option>
              <option value="5k-10k">$5,000 - $10,000/month</option>
              <option value="over-10k">Over $10,000/month</option>
              <option value="project-based">Prefer project-based pricing</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Implementation Timeline
            </label>
            <select
              value={formData.aiAutomationRequirements.implementationTimeline}
              onChange={(e) => handleNestedChange('aiAutomationRequirements', 'implementationTimeline', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select timeline</option>
              <option value="immediate">Start immediately</option>
              <option value="1-month">Within 1 month</option>
              <option value="2-3-months">2-3 months</option>
              <option value="6-months">Within 6 months</option>
              <option value="planning-phase">Still in planning phase</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Technical Complexity Preference
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="technicalComplexity"
                  value="simple"
                  checked={formData.aiAutomationRequirements.technicalComplexity === 'simple'}
                  onChange={(e) => handleNestedChange('aiAutomationRequirements', 'technicalComplexity', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Simple & User-friendly</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="technicalComplexity"
                  value="moderate"
                  checked={formData.aiAutomationRequirements.technicalComplexity === 'moderate'}
                  onChange={(e) => handleNestedChange('aiAutomationRequirements', 'technicalComplexity', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Moderate complexity</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="technicalComplexity"
                  value="advanced"
                  checked={formData.aiAutomationRequirements.technicalComplexity === 'advanced'}
                  onChange={(e) => handleNestedChange('aiAutomationRequirements', 'technicalComplexity', e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Advanced & Customizable</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional AI Automation Requirements
            </label>
            <textarea
              value={formData.aiAutomationRequirements.additionalRequirements}
              onChange={(e) => handleNestedChange('aiAutomationRequirements', 'additionalRequirements', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Any specific requirements, integrations needed, or concerns about AI automation?"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render step indicator
  const renderStepIndicator = () => {
    const totalSteps = 15;
    return (
      <div className="flex justify-center mb-8">
        <div className="flex space-x-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i + 1 === currentStep
                  ? 'bg-blue-600 text-white'
                  : i + 1 < currentStep
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper function to render mandatory field indicator
  const renderMandatoryIndicator = () => (
    <span className="text-red-500 ml-1">*</span>
  );

  // Helper function to render field error
  const renderFieldError = (fieldName) => {
    const error = validationErrors[fieldName] || errors[fieldName];
    return error ? (
      <p className="text-red-500 text-sm mt-1">{error}</p>
    ) : null;
  };

  // Render Step 1: Basic Information & Business Details
  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Basic Information & Business Details</h2>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-700 mb-4">
          📧 <strong>For file uploads:</strong> Please email all files (logos, brand guidelines, marketing materials, etc.) to <strong>files@yourdomain.com</strong> with your client name in the subject line.
        </p>
      </div>
      
      {/* Client Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Client Name{renderMandatoryIndicator()}
        </label>
        <input
          type="text"
          value={formData.clientName}
          onChange={(e) => handleInputChange('clientName', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            validationErrors.clientName || errors.clientName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter your business/client name"
        />
        {renderFieldError('clientName')}
      </div>
      
      {/* Primary Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primary Email{renderMandatoryIndicator()}
        </label>
        <input
          type="email"
          value={formData.primaryEmail}
          onChange={(e) => handleInputChange('primaryEmail', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            validationErrors.primaryEmail || errors.primaryEmail ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="your@email.com"
        />
        {renderFieldError('primaryEmail')}
      </div>
      
      {/* Phone Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number{renderMandatoryIndicator()}
        </label>
        <input
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            validationErrors.phoneNumber || errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="+1 (555) 123-4567"
        />
        {renderFieldError('phoneNumber')}
      </div>
      
      {/* Business Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Address
        </label>
        <textarea
          value={formData.businessAddress}
          onChange={(e) => handleInputChange('businessAddress', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="Full business address including city, state, and zip code"
        />
      </div>
      
      {/* Website URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Website URL
        </label>
        <input
          type="url"
          value={formData.websiteUrl}
          onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://www.yourwebsite.com"
        />
      </div>

      {/* Indian Business Details Section */}
      <div className="bg-orange-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🇮🇳 Indian Business Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GSTIN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GSTIN (GST Identification Number)
            </label>
            <input
              type="text"
              value={formData.indianBusinessDetails.gstin}
              onChange={(e) => handleInputChange('indianBusinessDetails.gstin', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="22AAAAA0000A1Z5"
              maxLength="15"
            />
          </div>

          {/* PAN Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PAN Number
            </label>
            <input
              type="text"
              value={formData.indianBusinessDetails.panNumber}
              onChange={(e) => handleInputChange('indianBusinessDetails.panNumber', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ABCDE1234F"
              maxLength="10"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <select
              value={formData.indianBusinessDetails.state}
              onChange={(e) => handleInputChange('indianBusinessDetails.state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select State</option>
              {indianStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <select
              value={formData.indianBusinessDetails.city}
              onChange={(e) => handleInputChange('indianBusinessDetails.city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select City</option>
              {majorIndianCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* PIN Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN Code
            </label>
            <input
              type="text"
              value={formData.indianBusinessDetails.pincode}
              onChange={(e) => handleInputChange('indianBusinessDetails.pincode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="400001"
              maxLength="6"
              pattern="[0-9]{6}"
            />
          </div>

          {/* Business Registration Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Registration Type
            </label>
            <select
              value={formData.indianBusinessDetails.businessRegistrationType}
              onChange={(e) => handleInputChange('indianBusinessDetails.businessRegistrationType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Registration Type</option>
              {businessRegistrationTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* MSME Registration */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Udyam Registration Number (MSME)
          </label>
          <input
            type="text"
            value={formData.indianBusinessDetails.udyamRegistration}
            onChange={(e) => handleInputChange('indianBusinessDetails.udyamRegistration', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="UDYAM-XX-00-0000000"
          />
        </div>

        {/* Healthcare-specific licenses (shown only for healthcare industry) */}
        {formData.industry === 'healthcare' && (
          <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-800 mb-4">🏥 Healthcare Licenses & Registrations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Council Registration
                </label>
                <input
                  type="text"
                  value={formData.indianBusinessDetails.medicalCouncilRegistration}
                  onChange={(e) => handleInputChange('indianBusinessDetails.medicalCouncilRegistration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="MCI/State Medical Council Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clinical Establishment License
                </label>
                <input
                  type="text"
                  value={formData.indianBusinessDetails.clinicalEstablishmentLicense}
                  onChange={(e) => handleInputChange('indianBusinessDetails.clinicalEstablishmentLicense', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="State Health Department License"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drug License (if applicable)
                </label>
                <input
                  type="text"
                  value={formData.indianBusinessDetails.drugLicense}
                  onChange={(e) => handleInputChange('indianBusinessDetails.drugLicense', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Drug License Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NABH/JCI Accreditation
                </label>
                <input
                  type="text"
                  value={formData.indianBusinessDetails.nabh_jci_accreditation}
                  onChange={(e) => handleInputChange('indianBusinessDetails.nabh_jci_accreditation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="NABH/JCI Accreditation Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  FSSAI License (if applicable)
                </label>
                <input
                  type="text"
                  value={formData.indianBusinessDetails.fssaiLicense}
                  onChange={(e) => handleInputChange('indianBusinessDetails.fssaiLicense', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="FSSAI License Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biomedical Waste Authorization
                </label>
                <input
                  type="text"
                  value={formData.indianBusinessDetails.biomedicalWasteAuthorization}
                  onChange={(e) => handleInputChange('indianBusinessDetails.biomedicalWasteAuthorization', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Biomedical Waste Authorization Number"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Industry Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Industry{renderMandatoryIndicator()}
        </label>
        <select
          value={formData.industry}
          onChange={(e) => handleInputChange('industry', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            validationErrors.industry || errors.industry ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select Industry</option>
          {industryOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {renderFieldError('industry')}
      </div>

      {/* Business Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {formData.industry === 'healthcare' ? 'Healthcare Business Type' : 'Business Type'}{renderMandatoryIndicator()}
        </label>
        {formData.industry === 'healthcare' ? (
          <select
            value={formData.businessType}
            onChange={(e) => handleInputChange('businessType', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.businessType || errors.businessType ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select Healthcare Business Type</option>
            {healthcareTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={formData.businessType}
            onChange={(e) => handleInputChange('businessType', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.businessType || errors.businessType ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Restaurant, Retail Store, Law Firm, etc."
          />
        )}
        {renderFieldError('businessType')}
      </div>

      {/* Note: Business size and year established removed as these are pre-payment qualification questions */}

      {/* Monthly Budget */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Marketing Budget</label>
        <select
          value={formData.monthlyBudget}
          onChange={(e) => handleInputChange('monthlyBudget', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select budget range</option>
          {budgetRangeOptions.map(budget => (
            <option key={budget} value={budget}>{budget}</option>
          ))}
        </select>
      </div>

      {/* Note: Service selection removed - clients have already purchased specific services */}
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-700">
          ✅ <strong>Services Confirmed:</strong> Your purchased services have been confirmed. This onboarding will help us gather the information needed to deliver your specific services effectively.
        </p>
      </div>
    </div>
  );

  // Render Step 2: Contact Information
  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Contact Information</h2>
      
      {/* Primary Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Email *</label>
        <input
          type="email"
          value={formData.primaryEmail}
          onChange={(e) => handleInputChange('primaryEmail', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="your@email.com"
        />
        {errors.primaryEmail && <p className="text-red-500 text-sm mt-1">{errors.primaryEmail}</p>}
      </div>

      {/* Leads Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email for Leads & Communication
        </label>
        <input
          type="email"
          value={formData.leadsEmail}
          onChange={(e) => handleInputChange('leadsEmail', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="leads@yourbusiness.com"
        />
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number for Promotion *</label>
        <input
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="+1 (555) 123-4567"
        />
        {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
      </div>

      {/* Locations */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Locations (City/State/Country)
        </label>
        <textarea
          value={formData.locations}
          onChange={(e) => handleInputChange('locations', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="List each city/state/country where you expect customers from"
        />
      </div>

      {/* Website URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
        <input
          type="url"
          value={formData.websiteUrl}
          onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://yourwebsite.com"
        />      </div>
    </div>
  );

  // Render Step 3: Website & Technical Access
  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Website & Technical Access</h2>
      
      {/* Website Credentials */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Website Credentials</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Panel URL</label>
            <input
              type="url"
              value={formData.websiteCredentials.adminUrl}
              onChange={(e) => handleNestedChange('websiteCredentials', 'adminUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://yoursite.com/admin or cPanel URL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={formData.websiteCredentials.username}
              onChange={(e) => handleNestedChange('websiteCredentials', 'username', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Admin username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={formData.websiteCredentials.password}
              onChange={(e) => handleNestedChange('websiteCredentials', 'password', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Admin password"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Render Step 4: Google Services Access
  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Google Services Access</h2>
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Google Access Requirements</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please provide access to the following Google services by sharing with our SEO team emails:
        </p>
        <div className="bg-white p-3 rounded border">
          <p className="font-medium text-gray-700">SEO Team Emails:</p>
          <ul className="text-sm text-gray-600 mt-1">
            <li>• Seowithbp@gmail.com</li>
            <li>• Seobrandingpioneers@gmail.com</li>
            <li>• brandingpioneers@gmail.com</li>
          </ul>
        </div>
      </div>

      {/* Google Services Checkboxes */}
      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.googleAccess.gmbAccess}
            onChange={(e) => handleNestedChange('googleAccess', 'gmbAccess', e.target.checked)}
            className="mr-3"
          />
          <div>
            <span className="font-medium text-gray-700">Google My Business (GMB) Access</span>
            <p className="text-sm text-gray-500">
              Tutorial: <a href="https://youtu.be/LwgbdTrCI3A?t=19" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">How to give GMB access</a>
            </p>
          </div>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.googleAccess.analyticsAccess}
            onChange={(e) => handleNestedChange('googleAccess', 'analyticsAccess', e.target.checked)}
            className="mr-3"
          />
          <div>
            <span className="font-medium text-gray-700">Google Analytics Access</span>
            <p className="text-sm text-gray-500">
              Tutorial: <a href="https://youtu.be/QAUB1LLljg8?t=35" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">How to give Analytics access</a>
            </p>
          </div>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.googleAccess.searchConsoleAccess}
            onChange={(e) => handleNestedChange('googleAccess', 'searchConsoleAccess', e.target.checked)}
            className="mr-3"
          />
          <div>
            <span className="font-medium text-gray-700">Google Search Console Access</span>
            <p className="text-sm text-gray-500">
              Tutorial: <a href="https://youtu.be/LqabOT-PF-U?t=9" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">How to give Search Console access</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Step 5: SEO & Marketing Services
  const renderStep5 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">SEO & Marketing Services</h2>
      
      {/* SEO Information - Always shown for post-payment onboarding */}
      <div className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Please complete the SEO section if you've purchased SEO services, or skip if not applicable.
        </p>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">SEO Information</h3>
          
          {/* Previous SEO Report */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Previous SEO Report</label>
            <p className="text-sm text-gray-600 mb-2">Share any previous SEO reports if you've had SEO done in the past</p>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => handleInputChange('previousSeoReport', e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* SEO Involvement */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Involvement in SEO Process</label>
            <select
              value={formData.seoInvolvement}
              onChange={(e) => handleInputChange('seoInvolvement', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select your preferred involvement level</option>
              <option value="minimal">Minimal - Just provide final approval</option>
              <option value="moderate">Moderate - Weekly updates and reviews</option>
              <option value="collaborative">Collaborative - Active participation in strategy</option>
              <option value="hands-on">Hands-on - Daily involvement and content creation</option>
            </select>
          </div>
          
          {/* SEO Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SEO Remarks</label>
            <textarea
              value={formData.seoRemarks}
              onChange={(e) => handleInputChange('seoRemarks', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Share any remarks related to SEO that you want your SEO executive to be aware of"
            />
          </div>
        </div>
      </div>
      
      {/* Advertising Section */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Advertising Information</h3>
          
          {/* Ad Platforms */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Advertising Platforms</label>
            <div className="space-y-2">
              {[
                { value: 'google', label: 'Google Ads' },
                { value: 'meta', label: 'Meta Ads (Facebook/Instagram)' },
                { value: 'both', label: 'Both Platforms' }
              ].map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.adsPlatforms.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleInputChange('adsPlatforms', [...formData.adsPlatforms, option.value]);
                      } else {
                        handleInputChange('adsPlatforms', formData.adsPlatforms.filter(p => p !== option.value));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Ad Budget Investment */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Paid Advertising Investment Comfort Level</label>
            <select
              value={formData.dailyAdBudget}
              onChange={(e) => handleInputChange('dailyAdBudget', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select your comfort level for paid advertising investment</option>
              <option value="conservative">Conservative: $10 - $50 per day (Testing & Learning)</option>
              <option value="moderate">Moderate: $50 - $150 per day (Steady Growth)</option>
              <option value="aggressive">Aggressive: $150 - $300 per day (Rapid Scaling)</option>
              <option value="premium">Premium: $300+ per day (Market Domination)</option>
              <option value="variable">Variable: Adjust based on performance and seasonality</option>
              <option value="discuss">Let's discuss based on ROI projections</option>
            </select>
            <p className="text-sm text-gray-600 mt-1">
              We'll start conservatively and scale based on performance data and your comfort level.
            </p>
          </div>
          
          {/* Ads Involvement */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Involvement in Ads Management</label>
            <select
              value={formData.adsInvolvement}
              onChange={(e) => handleInputChange('adsInvolvement', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select your preferred involvement level</option>
              <option value="full-management">Full Management - Handle everything for me</option>
              <option value="approval-required">Approval Required - Review before launching</option>
              <option value="collaborative">Collaborative - Work together on strategy</option>
              <option value="consultation">Consultation Only - I'll manage, you advise</option>
            </select>
          </div>
          
          {/* Target Locations for Ads */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Locations for Ads</label>
            <textarea
              value={formData.targetLocations}
              onChange={(e) => handleInputChange('targetLocations', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="List all locations where you expect customers from"
            />
          </div>
          
          {/* Ads Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ads Remarks</label>
            <textarea
              value={formData.adsRemarks}
              onChange={(e) => handleInputChange('adsRemarks', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Any instructions for your Ad executive"
            />
          </div>
        </div>
    </div>
  );

  // Main component return statement
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Success Message */}
      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h3 className="font-bold">Form Submitted Successfully!</h3>
          <p>Thank you for providing your information. We'll review it and get back to you soon.</p>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>{submitError}</p>
        </div>
      )}

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Form Steps */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}
      {currentStep === 5 && renderStep5()}
      {currentStep === 6 && renderStep6()}
      {currentStep === 7 && renderStep7()}
      {currentStep === 8 && renderStep8()}
      {currentStep === 9 && renderStep9()}
      {currentStep === 10 && renderStep10()}
      {currentStep === 11 && renderStep11()}
      {currentStep === 12 && renderStep12()}
      {currentStep === 13 && renderStep13()}
      {currentStep === 14 && renderStep14()}
      {currentStep === 15 && renderStep15()}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Previous
          </button>
        )}
        
        <div className="flex-1"></div>
        
        {currentStep < 15 ? (
          <button
            type="button"
            onClick={() => setCurrentStep(prev => prev + 1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting && <LoadingSpinner size="sm" />}
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ClientOnboardingForm;
