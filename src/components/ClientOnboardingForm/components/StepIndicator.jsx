import React from 'react';

/**
 * Step Indicator Component - Shows progress through the onboarding form
 */
const StepIndicator = ({ currentStep, totalSteps, stepTitles = [] }) => {
  const steps = Array.from({ length: totalSteps }, (_, index) => index + 1);

  const getStepStatus = (stepNumber) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepClasses = (status) => {
    const baseClasses = 'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors duration-200';
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-500 text-white`;
      case 'current':
        return `${baseClasses} bg-blue-600 text-white ring-2 ring-blue-200`;
      case 'upcoming':
        return `${baseClasses} bg-gray-200 text-gray-600`;
      default:
        return baseClasses;
    }
  };

  const getConnectorClasses = (stepNumber) => {
    const baseClasses = 'flex-1 h-0.5 transition-colors duration-200';
    const isCompleted = stepNumber < currentStep;
    return `${baseClasses} ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`;
  };

  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center">
        {steps.map((stepNumber, index) => (
          <React.Fragment key={stepNumber}>
            <div className="flex flex-col items-center">
              <div className={getStepClasses(getStepStatus(stepNumber))}>
                {getStepStatus(stepNumber) === 'completed' ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>
              {stepTitles[index] && (
                <span className={`mt-2 text-xs text-center max-w-20 ${
                  getStepStatus(stepNumber) === 'current' 
                    ? 'text-blue-600 font-medium' 
                    : 'text-gray-500'
                }`}>
                  {stepTitles[index]}
                </span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={getConnectorClasses(stepNumber)} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;