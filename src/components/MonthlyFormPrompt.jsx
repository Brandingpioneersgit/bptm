import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { thisMonthKey, monthLabel } from '@/shared/lib/constants';
import { useAppNavigation } from '@/utils/navigation';

const MonthlyFormPrompt = ({ showInDashboard = false }) => {
  const { authState } = useUnifiedAuth();
  const { user } = authState;
  const { supabase } = useSupabase();
  const { showToast } = useToast();
  const navigation = useAppNavigation();
  const [needsSubmission, setNeedsSubmission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const currentMonth = thisMonthKey();

  useEffect(() => {
    if (!user || !supabase) {
      setIsLoading(false);
      return;
    }

    checkMonthlySubmissionStatus();
  }, [user, supabase]);

  const checkMonthlySubmissionStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if user has submitted form for current month
      const { data: submissions, error } = await supabase
        .from('monthly_form_submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_key', currentMonth)
        .eq('is_submitted', true);

      if (error) {
        console.error('Error checking monthly submission:', error);
        return;
      }

      // User needs to submit if no submission found for current month
      const hasSubmitted = submissions && submissions.length > 0;
      setNeedsSubmission(!hasSubmitted);
      
      // Check if user dismissed the prompt today
      const dismissedKey = `monthly_prompt_dismissed_${user.id}_${currentMonth}`;
      const dismissed = localStorage.getItem(dismissedKey);
      const today = new Date().toDateString();
      
      if (dismissed === today) {
        setIsDismissed(true);
      }
      
    } catch (error) {
      console.error('Error in checkMonthlySubmissionStatus:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    const dismissedKey = `monthly_prompt_dismissed_${user.id}_${currentMonth}`;
    const today = new Date().toDateString();
    localStorage.setItem(dismissedKey, today);
    setIsDismissed(true);
  };

  const handleFillForm = () => {
    // Navigate to employee form
    navigation.navigateToEmployeeForm();
  };

  const handleViewSubmissions = () => {
    // Navigate to submissions view
    navigation.navigateToDashboard();
  };

  // Don't show if loading, user doesn't need submission, or prompt is dismissed
  if (isLoading || !needsSubmission || isDismissed || !user) {
    return null;
  }

  // Different styles for dashboard vs modal prompt
  if (showInDashboard) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl flex-shrink-0">
            📋
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-orange-900 mb-2">
              Monthly Report Required
            </h3>
            <p className="text-orange-800 mb-4">
              You haven't submitted your monthly performance report for {monthLabel(currentMonth)}. 
              Please complete your submission to maintain your performance tracking.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleFillForm}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Fill Monthly Report
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Remind Me Tomorrow
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modal-style prompt for login
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
            📋
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Monthly Report Required
          </h2>
          <p className="text-gray-600 mb-6">
            Welcome back, {user.name}! You haven't submitted your monthly performance report for {monthLabel(currentMonth)}. 
            Please complete your submission to stay on track.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleFillForm}
              className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Fill Monthly Report Now
            </button>
            <button
              onClick={handleViewSubmissions}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              View My Dashboard
            </button>
            <button
              onClick={handleDismiss}
              className="w-full px-4 py-3 text-gray-500 hover:text-gray-700 transition-colors text-sm"
            >
              Remind Me Tomorrow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyFormPrompt;