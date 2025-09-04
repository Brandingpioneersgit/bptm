import React, { useState } from 'react';
import { useAutoSave } from '@/shared/hooks/forms/useAutoSave';
import StepIndicator from './components/StepIndicator';
import NavigationButtons from './components/NavigationButtons';
import BasicInformationStep from './steps/BasicInformationStep';

/**
 * Refactored Client Onboarding Form - Main Component
 * This is the new structured version of the large ClientOnboardingForm.jsx
 */
const ClientOnboardingForm = ({ onBack }) => {
  
  // Form state - keeping the original structure for compatibility
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    clientName: '',
    industry: '',
    businessType: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    currentWebsite: '',
    businessDescription: '',
    businessHours: {
      weekdays: '',
      weekends: ''
    },
    
    // Additional steps will be added as we continue refactoring
    // For now, including minimal structure to maintain compatibility
    // ... (other step fields will be added progressively)
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step configuration
  const totalSteps = 15;
  const stepTitles = [
    'Basic Info',
    'Contact',
    'Website',
    'Google',
    'SEO/Marketing',
    'Social Media',
    'Business',
    'Operations',
    'Psychology',
    'Budget',
    'Technical',
    'Team',
    'Audience',
    'Branding',
    'AI/Automation'
  ];

  // Auto-save functionality
  const autoSave = useAutoSave(formData, 'client_onboarding_form', 2000);

  // Form handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Step validation
  const validateCurrentStep = () => {
    const newErrors = {};
    
    switch (currentStep) {
      case 1:
        if (!formData.clientName) newErrors.clientName = 'Client name is required';
        if (!formData.industry) newErrors.industry = 'Industry selection is required';
        if (!formData.contactPerson) newErrors.contactPerson = 'Contact person is required';
        if (!formData.contactEmail) newErrors.contactEmail = 'Contact email is required';
        if (!formData.contactPhone) newErrors.contactPhone = 'Contact phone is required';
        
        // Healthcare specific validation
        if (formData.industry === 'healthcare' && !formData.businessType) {
          newErrors.businessType = 'Business type is required for healthcare';
        }
        break;
        
      // Additional step validations will be added as we continue refactoring
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation handlers
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    
    setIsSubmitting(true);
    try {
      // TODO: Implement actual submission logic
      console.log('Submitting client onboarding form:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear auto-saved data on successful submission
      autoSave.clearAutoSave();
      
      // Navigate back or show success message
      if (onBack) onBack();
      
    } catch (error) {
      console.error('Error submitting form:', error);
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step component
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInformationStep
            formData={formData}
            handleInputChange={handleInputChange}
            errors={errors}
          />
        );
      
      // Additional step components will be added as we continue refactoring
      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Step {currentStep} - Coming Soon
            </h3>
            <p className="text-gray-500">
              This step is being refactored and will be available soon.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setCurrentStep(1)}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Return to Step 1
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Client Onboarding</h1>
          {onBack && (
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
        </div>
        <p className="text-gray-600">
          Please complete all steps to set up your client profile and service requirements.
        </p>
      </div>

      {/* Auto-save Status */}
      {autoSave.getStatusMessage() && (
        <div className="mb-4 text-sm text-gray-500 text-center">
          {autoSave.getStatusMessage()}
        </div>
      )}

      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepTitles={stepTitles}
      />

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {renderCurrentStep()}
      </div>

      {/* Navigation */}
      <NavigationButtons
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        canProceed={true} // Will be enhanced with proper validation
      />

      {/* Progress Info */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Your progress is automatically saved. You can return to complete this form later.
        </p>
        {autoSave.hasAutoSavedData() && (
          <p className="mt-1">
            <button
              onClick={autoSave.clearAutoSave}
              className="text-red-600 hover:text-red-800 underline"
            >
              Clear saved progress
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default ClientOnboardingForm;