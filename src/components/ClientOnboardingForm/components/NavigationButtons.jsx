import React from 'react';
import { LoadingButton } from '@/shared/components/LoadingButton';

/**
 * Navigation Buttons Component - Handles step navigation in the onboarding form
 */
const NavigationButtons = ({ 
  currentStep, 
  totalSteps, 
  onNext, 
  onPrevious, 
  onSubmit,
  isSubmitting = false,
  canProceed = true,
  nextButtonText = 'Next',
  submitButtonText = 'Submit Form',
  showSkip = false,
  onSkip = null,
  skipButtonText = 'Skip This Step'
}) => {
  
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex justify-between items-center pt-6 mt-8 border-t border-gray-200">
      {/* Previous Button */}
      <div>
        {!isFirstStep && (
          <button
            type="button"
            onClick={onPrevious}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            disabled={isSubmitting}
          >
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </span>
          </button>
        )}
      </div>

      {/* Center - Auto-save status or step info */}
      <div className="flex-1 text-center">
        <p className="text-sm text-gray-500">
          Step {currentStep} of {totalSteps}
        </p>
      </div>

      {/* Next/Skip/Submit Buttons */}
      <div className="flex space-x-3">
        {/* Skip Button (if enabled) */}
        {showSkip && onSkip && !isLastStep && (
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 text-gray-500 hover:text-gray-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            disabled={isSubmitting}
          >
            {skipButtonText}
          </button>
        )}

        {/* Next/Submit Button */}
        {isLastStep ? (
          <LoadingButton
            type="button"
            onClick={onSubmit}
            loading={isSubmitting}
            variant="success"
            className="px-8 py-2"
            loadingText="Submitting..."
            disabled={!canProceed}
          >
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {submitButtonText}
            </span>
          </LoadingButton>
        ) : (
          <LoadingButton
            type="button"
            onClick={onNext}
            variant="primary"
            className="px-6 py-2"
            disabled={!canProceed || isSubmitting}
          >
            <span className="flex items-center">
              {nextButtonText}
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </LoadingButton>
        )}
      </div>

      {/* Mobile-friendly button layout for small screens */}
      <style jsx>{`
        @media (max-width: 640px) {
          .flex.justify-between.items-center {
            flex-direction: column;
            gap: 1rem;
          }
          .flex-1.text-center {
            order: -1;
          }
          .flex.space-x-3 {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default NavigationButtons;