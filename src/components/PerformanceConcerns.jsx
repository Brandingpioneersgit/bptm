import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '../features/auth/UnifiedAuthContext';
import { useSupabase } from './SupabaseProvider';
import { useAppNavigation } from '@/utils/navigation';

const PerformanceConcerns = () => {
  const supabase = useSupabase();
  const { user, userCategory } = useUnifiedAuth();
  const navigation = useAppNavigation();
  const [isEligible, setIsEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    // Overview of Performance Concerns
    performanceUnderstanding: '',
    feedbackFeelings: '',
    
    // Self-Assessment
    challengesFaced: '',
    lessConfidentAreas: '',
    
    // Work Environment and Support
    teamManagerSupport: '',
    lackingResources: '',
    workEnvironmentProductivity: '',
    
    // Specific Instances
    challengingOverwhelmingSituations: '',
    unmetExpectationsExamples: '',
    
    // Professional Skills and Training
    additionalTrainingNeeds: '',
    skillsUpdateMethods: '',
    
    // Feedback and Communication
    supervisorCommunicationEffectiveness: '',
    helpfulFeedbackTypes: '',
    
    // Personal Circumstances
    personalCircumstancesImpact: '',
    workLifeBalanceManagement: '',
    
    // Future Focus
    roleResponsibilityChanges: '',
    shortLongTermImprovements: '',
    
    // Support Expectations
    beneficialHRSupport: '',
    barriersToAddress: '',
    
    // Closing and Open Comments
    additionalComments: '',
    pipQuestionsConcerns: ''
  });

  useEffect(() => {
    checkEligibility();
  }, [user]);

  const checkEligibility = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      if (!supabase) {
        throw new Error('Database connection not available');
      }
      
      // Check if user is a low performer
      const { data, error } = await supabase
        .from('employee_performance')
        .select('is_low_performer')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase error:', error);
        // If table doesn't exist, set as not eligible
        if (error.message.includes('does not exist')) {
          setIsEligible(false);
          setLoading(false);
          return;
        }
        throw new Error(`Database error: ${error.message}`);
      } else if (data) {
        setIsEligible(data.is_low_performer === true);
      } else {
        setIsEligible(false);
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setError(`Failed to check eligibility: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!supabase) {
        throw new Error('Database connection not available');
      }
      
      const { error } = await supabase
        .from('performance_concerns')
        .insert({
          employee_id: user.id,
          ...formData,
          submitted_at: new Date().toISOString()
        });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      setSubmitted(true);
      alert('Performance concerns submitted successfully. HR will review your submission.');
    } catch (error) {
      console.error('Error submitting performance concerns:', error);
      setError(`Failed to submit form: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-red-600 text-2xl">⚠️</div>
            <h2 className="text-xl font-semibold text-red-800">Performance Concerns Error</h2>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex gap-3">
            <button 
              onClick={() => setError(null)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigation.navigateToDashboard()}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking eligibility...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access the Performance Concerns form.</p>
          <button 
            onClick={() => navigation.navigateToDashboard()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!isEligible) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-6">
            This form is only available to employees who have been identified as needing performance support. 
            If you believe this is an error, please contact HR.
          </p>
          <button 
            onClick={() => navigation.navigateToDashboard()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Submission Successful</h2>
          <p className="text-gray-600 mb-6">
            Your performance concerns have been submitted successfully. HR will review your responses and follow up with you soon.
          </p>
          <button 
            onClick={() => navigation.navigateToDashboard()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Performance Concerns Discussion</h1>
            <p className="text-gray-600">
              This form is designed to help us understand your perspective on your current performance 
              and identify ways we can better support your success. Please be honest and thorough in your responses.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Overview of Performance Concerns */}
            <section className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Overview of Performance Concerns</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Can you walk me through your understanding of the current concerns regarding your performance?
                  </label>
                  <textarea
                    value={formData.performanceUnderstanding}
                    onChange={(e) => handleInputChange('performanceUnderstanding', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How do you feel about the feedback you've received so far?
                  </label>
                  <textarea
                    value={formData.feedbackFeelings}
                    onChange={(e) => handleInputChange('feedbackFeelings', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Self-Assessment */}
            <section className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Self-Assessment</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    In your own words, what challenges have you faced that might have impacted your performance?
                  </label>
                  <textarea
                    value={formData.challengesFaced}
                    onChange={(e) => handleInputChange('challengesFaced', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Are there specific areas of your role where you feel less confident or less effective?
                  </label>
                  <textarea
                    value={formData.lessConfidentAreas}
                    onChange={(e) => handleInputChange('lessConfidentAreas', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Work Environment and Support */}
            <section className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Work Environment and Support</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How do you perceive the support from your team and managers?
                  </label>
                  <textarea
                    value={formData.teamManagerSupport}
                    onChange={(e) => handleInputChange('teamManagerSupport', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Are there any resources or tools you feel you're lacking that could help you perform better?
                  </label>
                  <textarea
                    value={formData.lackingResources}
                    onChange={(e) => handleInputChange('lackingResources', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How do you find the work environment in terms of fostering your productivity and engagement?
                  </label>
                  <textarea
                    value={formData.workEnvironmentProductivity}
                    onChange={(e) => handleInputChange('workEnvironmentProductivity', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Specific Instances */}
            <section className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Specific Instances</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Could you provide examples of situations where you felt particularly challenged or overwhelmed?
                  </label>
                  <textarea
                    value={formData.challengingOverwhelmingSituations}
                    onChange={(e) => handleInputChange('challengingOverwhelmingSituations', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Have there been any specific projects or tasks where you felt you did not meet expectations? What do you think went wrong?
                  </label>
                  <textarea
                    value={formData.unmetExpectationsExamples}
                    onChange={(e) => handleInputChange('unmetExpectationsExamples', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Professional Skills and Training */}
            <section className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Professional Skills and Training</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you feel you need additional training or skills development in certain areas? If yes, which areas?
                  </label>
                  <textarea
                    value={formData.additionalTrainingNeeds}
                    onChange={(e) => handleInputChange('additionalTrainingNeeds', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How do you keep your professional skills up to date?
                  </label>
                  <textarea
                    value={formData.skillsUpdateMethods}
                    onChange={(e) => handleInputChange('skillsUpdateMethods', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Feedback and Communication */}
            <section className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Feedback and Communication</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How effective is the communication between you and your supervisor? Can you give an example of good and bad communication you've experienced?
                  </label>
                  <textarea
                    value={formData.supervisorCommunicationEffectiveness}
                    onChange={(e) => handleInputChange('supervisorCommunicationEffectiveness', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What kind of feedback do you find most helpful for your professional growth?
                  </label>
                  <textarea
                    value={formData.helpfulFeedbackTypes}
                    onChange={(e) => handleInputChange('helpfulFeedbackTypes', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Personal Circumstances */}
            <section className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Circumstances</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Are there any personal circumstances affecting your work performance that you'd like to discuss?
                  </label>
                  <textarea
                    value={formData.personalCircumstancesImpact}
                    onChange={(e) => handleInputChange('personalCircumstancesImpact', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="This information will be kept confidential and used only to provide appropriate support."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How do you manage work-life balance, and has this impacted your performance in any way?
                  </label>
                  <textarea
                    value={formData.workLifeBalanceManagement}
                    onChange={(e) => handleInputChange('workLifeBalanceManagement', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Future Focus */}
            <section className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Future Focus</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What changes do you think could be made to your current role or responsibilities that would help you improve your performance?
                  </label>
                  <textarea
                    value={formData.roleResponsibilityChanges}
                    onChange={(e) => handleInputChange('roleResponsibilityChanges', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Looking forward, what can you commit to improving in the short-term and long-term?
                  </label>
                  <textarea
                    value={formData.shortLongTermImprovements}
                    onChange={(e) => handleInputChange('shortLongTermImprovements', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Support Expectations */}
            <section className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Support Expectations</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What kind of support from the HR or your department would be most beneficial for you at this stage?
                  </label>
                  <textarea
                    value={formData.beneficialHRSupport}
                    onChange={(e) => handleInputChange('beneficialHRSupport', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Are there specific barriers you'd like to address that we might not be aware of?
                  </label>
                  <textarea
                    value={formData.barriersToAddress}
                    onChange={(e) => handleInputChange('barriersToAddress', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Closing and Open Comments */}
            <section className="pb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Closing and Open Comments</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Is there anything else you think we should know or discuss concerning your performance or work conditions?
                  </label>
                  <textarea
                    value={formData.additionalComments}
                    onChange={(e) => handleInputChange('additionalComments', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you have any questions or concerns about the potential of being placed on a Performance Improvement Plan?
                  </label>
                  <textarea
                    value={formData.pipQuestionsConcerns}
                    onChange={(e) => handleInputChange('pipQuestionsConcerns', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>
              </div>
            </section>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigation.navigateToDashboard()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Performance Concerns'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PerformanceConcerns;