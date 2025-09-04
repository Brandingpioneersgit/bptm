import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useEnhancedErrorHandling } from '@/shared/hooks/useEnhancedErrorHandling';
import { useAppNavigation } from '@/utils/navigation';

const PerformanceConcernsForm = () => {
  const supabase = useSupabase();
  const navigation = useAppNavigation();
  const {
    handleAsyncOperation,
    handleFormSubmission,
    showSuccessNotification,
    showErrorModal,
    showWarningModal,
    showInfoModal
  } = useEnhancedErrorHandling();
  
  const [user, setUser] = useState(null);
  const [isLowPerformer, setIsLowPerformer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Overview of Performance Concerns
    understanding_concerns: '',
    feedback_feelings: '',
    
    // Self-Assessment
    challenges_faced: '',
    less_confident_areas: '',
    
    // Work Environment and Support
    team_manager_support: '',
    lacking_resources: '',
    work_environment_perception: '',
    
    // Specific Instances
    challenging_situations: '',
    unmet_expectations_examples: '',
    
    // Professional Skills and Training
    training_needs: '',
    skills_update_methods: '',
    
    // Feedback and Communication
    supervisor_communication_effectiveness: '',
    communication_examples: '',
    helpful_feedback_types: '',
    
    // Personal Circumstances
    personal_circumstances: '',
    work_life_balance: '',
    
    // Future Focus
    suggested_role_changes: '',
    short_term_commitments: '',
    long_term_commitments: '',
    
    // Support Expectations
    beneficial_support_types: '',
    barriers_to_address: '',
    
    // Closing and Open Comments
    additional_comments: '',
    pip_questions_concerns: ''
  });

  useEffect(() => {
    checkUserAndPerformance();
  }, []);

  const checkUserAndPerformance = async () => {
    await handleAsyncOperation(
      async () => {
        // Check if user is logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          showErrorModal('Authentication Required', 'Please log in to access this form.');
          setTimeout(() => {
            navigation.navigateToLogin();
          }, 2000);
          return;
        }

        setUser(user);

        // Check if user is a low performer
        const { data: performanceData, error: perfError } = await supabase
          .from('employee_performance')
          .select('is_low_performer')
          .eq('employee_id', user.id)
          .eq('is_low_performer', true)
          .gte('evaluation_date', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 6 months
          .order('evaluation_date', { ascending: false })
          .limit(1);

        if (perfError) {
          throw new Error(`Error checking performance status: ${perfError.message}`);
        }

        if (!performanceData || performanceData.length === 0) {
          showWarningModal('Access Restricted', 'This form is only available to employees with performance concerns. Please contact your manager or HR if you believe this is an error.');
          setTimeout(() => {
            navigation.navigateToDashboard();
          }, 3000);
          return;
        }

        setIsLowPerformer(true);
      },
      {
        onError: (error) => {
          showErrorModal('Authentication Error', error.message || 'Please try again.');
        },
        onFinally: () => {
          setLoading(false);
        }
      }
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    await handleFormSubmission(
      async () => {
        const { data, error } = await supabase.rpc('submit_performance_concerns', {
          p_understanding_concerns: formData.understanding_concerns,
          p_feedback_feelings: formData.feedback_feelings,
          p_challenges_faced: formData.challenges_faced,
          p_less_confident_areas: formData.less_confident_areas,
          p_team_manager_support: formData.team_manager_support,
          p_lacking_resources: formData.lacking_resources,
          p_work_environment_perception: formData.work_environment_perception,
          p_challenging_situations: formData.challenging_situations,
          p_unmet_expectations_examples: formData.unmet_expectations_examples,
          p_training_needs: formData.training_needs,
          p_skills_update_methods: formData.skills_update_methods,
          p_supervisor_communication_effectiveness: formData.supervisor_communication_effectiveness,
          p_communication_examples: formData.communication_examples,
          p_helpful_feedback_types: formData.helpful_feedback_types,
          p_personal_circumstances: formData.personal_circumstances,
          p_work_life_balance: formData.work_life_balance,
          p_suggested_role_changes: formData.suggested_role_changes,
          p_short_term_commitments: formData.short_term_commitments,
          p_long_term_commitments: formData.long_term_commitments,
          p_beneficial_support_types: formData.beneficial_support_types,
          p_barriers_to_address: formData.barriers_to_address,
          p_additional_comments: formData.additional_comments,
          p_pip_questions_concerns: formData.pip_questions_concerns
        });

        if (error) {
          throw error;
        }

        return data;
      },
      {
        onSuccess: () => {
          showSuccessNotification('Performance concerns form submitted successfully. HR will review your submission and follow up with you soon.');
          
          // Reset form
          setFormData({
            understanding_concerns: '',
            feedback_feelings: '',
            challenges_faced: '',
            less_confident_areas: '',
            team_manager_support: '',
            lacking_resources: '',
            work_environment_perception: '',
            challenging_situations: '',
            unmet_expectations_examples: '',
            training_needs: '',
            skills_update_methods: '',
            supervisor_communication_effectiveness: '',
            communication_examples: '',
            helpful_feedback_types: '',
            personal_circumstances: '',
            work_life_balance: '',
            suggested_role_changes: '',
            short_term_commitments: '',
            long_term_commitments: '',
            beneficial_support_types: '',
            barriers_to_address: '',
            additional_comments: '',
            pip_questions_concerns: ''
          });
        },
        onError: (error) => {
          showErrorModal('Submission Failed', error.message || 'Error submitting form. Please try again later.');
        },
        validationRules: [
          {
            condition: !formData.understanding_concerns.trim(),
            message: 'Please describe your understanding of the performance concerns.'
          },
          {
            condition: !formData.feedback_feelings.trim(),
            message: 'Please share your feelings about the feedback received.'
          },
          {
            condition: !formData.challenges_faced.trim(),
            message: 'Please describe the challenges you have faced.'
          }
        ],
        onFinally: () => {
          setSubmitting(false);
        },
        setLoading: setSubmitting
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  if (!user || !isLowPerformer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
          <p className="text-gray-600">This form is only available to employees with performance concerns.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Performance Concerns Discussion Form</h1>
              <p className="mt-2 text-gray-600">
                This confidential form helps us understand your perspective on performance concerns and identify ways to support your success.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Overview of Performance Concerns */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">Overview of Performance Concerns</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Can you walk me through your understanding of the current concerns regarding your performance?
                    </label>
                    <textarea
                      name="understanding_concerns"
                      value={formData.understanding_concerns}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How do you feel about the feedback you've received so far?
                    </label>
                    <textarea
                      name="feedback_feelings"
                      value={formData.feedback_feelings}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Self-Assessment */}
              <div className="bg-green-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-green-900 mb-4">Self-Assessment</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      In your own words, what challenges have you faced that might have impacted your performance?
                    </label>
                    <textarea
                      name="challenges_faced"
                      value={formData.challenges_faced}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Are there specific areas of your role where you feel less confident or less effective?
                    </label>
                    <textarea
                      name="less_confident_areas"
                      value={formData.less_confident_areas}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Work Environment and Support */}
              <div className="bg-purple-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-purple-900 mb-4">Work Environment and Support</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How do you perceive the support from your team and managers?
                    </label>
                    <textarea
                      name="team_manager_support"
                      value={formData.team_manager_support}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Are there any resources or tools you feel you're lacking that could help you perform better?
                    </label>
                    <textarea
                      name="lacking_resources"
                      value={formData.lacking_resources}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How do you find the work environment in terms of fostering your productivity and engagement?
                    </label>
                    <textarea
                      name="work_environment_perception"
                      value={formData.work_environment_perception}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Specific Instances */}
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-yellow-900 mb-4">Specific Instances</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Could you provide examples of situations where you felt particularly challenged or overwhelmed?
                    </label>
                    <textarea
                      name="challenging_situations"
                      value={formData.challenging_situations}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Have there been any specific projects or tasks where you felt you did not meet expectations? What do you think went wrong?
                    </label>
                    <textarea
                      name="unmet_expectations_examples"
                      value={formData.unmet_expectations_examples}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Professional Skills and Training */}
              <div className="bg-indigo-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-indigo-900 mb-4">Professional Skills and Training</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Do you feel you need additional training or skills development in certain areas? If yes, which areas?
                    </label>
                    <textarea
                      name="training_needs"
                      value={formData.training_needs}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How do you keep your professional skills up to date?
                    </label>
                    <textarea
                      name="skills_update_methods"
                      value={formData.skills_update_methods}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Feedback and Communication */}
              <div className="bg-pink-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-pink-900 mb-4">Feedback and Communication</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How effective is the communication between you and your supervisor?
                    </label>
                    <textarea
                      name="supervisor_communication_effectiveness"
                      value={formData.supervisor_communication_effectiveness}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Can you give an example of good and bad communication you've experienced?
                    </label>
                    <textarea
                      name="communication_examples"
                      value={formData.communication_examples}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What kind of feedback do you find most helpful for your professional growth?
                    </label>
                    <textarea
                      name="helpful_feedback_types"
                      value={formData.helpful_feedback_types}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Personal Circumstances */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Circumstances</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Are there any personal circumstances affecting your work performance that you'd like to discuss? (Optional)
                    </label>
                    <textarea
                      name="personal_circumstances"
                      value={formData.personal_circumstances}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="This information is confidential and optional"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How do you manage work-life balance, and has this impacted your performance in any way?
                    </label>
                    <textarea
                      name="work_life_balance"
                      value={formData.work_life_balance}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Future Focus */}
              <div className="bg-teal-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-teal-900 mb-4">Future Focus</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What changes do you think could be made to your current role or responsibilities that would help you improve your performance?
                    </label>
                    <textarea
                      name="suggested_role_changes"
                      value={formData.suggested_role_changes}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Looking forward, what can you commit to improving in the short-term?
                    </label>
                    <textarea
                      name="short_term_commitments"
                      value={formData.short_term_commitments}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What are your long-term improvement commitments?
                    </label>
                    <textarea
                      name="long_term_commitments"
                      value={formData.long_term_commitments}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Support Expectations */}
              <div className="bg-orange-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-orange-900 mb-4">Support Expectations</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What kind of support from HR or your department would be most beneficial for you at this stage?
                    </label>
                    <textarea
                      name="beneficial_support_types"
                      value={formData.beneficial_support_types}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Are there specific barriers you'd like to address that we might not be aware of?
                    </label>
                    <textarea
                      name="barriers_to_address"
                      value={formData.barriers_to_address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Closing and Open Comments */}
              <div className="bg-red-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-red-900 mb-4">Closing and Open Comments</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Is there anything else you think we should know or discuss concerning your performance or work conditions?
                    </label>
                    <textarea
                      name="additional_comments"
                      value={formData.additional_comments}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Any additional thoughts or concerns"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Do you have any questions or concerns about the potential of being placed on a Performance Improvement Plan?
                    </label>
                    <textarea
                      name="pip_questions_concerns"
                      value={formData.pip_questions_concerns}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Questions or concerns about PIP process"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
                >
                  {submitting ? 'Submitting...' : 'Submit Performance Concerns Form'}
                </button>
                
                <p className="mt-4 text-sm text-gray-600">
                  This form is confidential and will be reviewed by HR. You will be contacted within 3-5 business days to discuss next steps.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceConcernsForm;