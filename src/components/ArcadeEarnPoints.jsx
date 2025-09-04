import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { 
  checkArcadeEligibility, 
  validateActivitySubmission, 
  validateBusinessHours, 
  checkRateLimit 
} from '../utils/arcadeValidation';

// Helper functions for history display
const getStatusBadge = (status) => {
  const statusConfig = {
    pending: { 
      color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', 
      text: 'Pending',
      icon: '⏳'
    },
    approved: { 
      color: 'bg-green-100 text-green-800 border border-green-200', 
      text: 'Approved',
      icon: '✅'
    },
    rejected: { 
      color: 'bg-red-100 text-red-800 border border-red-200', 
      text: 'Rejected',
      icon: '❌'
    }
  };
  
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:shadow-md hover:scale-105 cursor-default ${config.color}`}>
      <span className="text-xs">{config.icon}</span>
      {config.text}
    </span>
  );
};

const formatActivityName = (activityType, activitySubtype, categories) => {
  const category = categories[activityType];
  if (!category) return activitySubtype;
  
  const activity = category.activities.find(a => a.value === activitySubtype);
  return activity ? activity.label : activitySubtype;
};

const getActivityIcon = (activityType) => {
  const icons = {
    client_engagement: '🤝',
    content_creation: '🎬',
    attendance: '📅',
    performance: '🎯',
    polls: '🏆'
  };
  return icons[activityType] || '📝';
};

const ArcadeEarnPoints = ({ currentUser, onNavigate }) => {
  const supabase = useSupabase();
  
  // State for form data
  const [formData, setFormData] = useState({
    activity_type: '',
    activity_subtype: '',
    description: '',
    proof_url: ''
  });
  
  // State for UI
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [recentActivities, setRecentActivities] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  
  // Activity categories and point values
  const categories = {
    client_engagement: {
      name: 'Client Engagement',
      icon: '🤝',
      activities: [
        { value: 'client_call', label: 'Client Call', points: 10 },
        { value: 'client_meeting', label: 'Client Meeting', points: 15 },
        { value: 'client_presentation', label: 'Client Presentation', points: 20 },
        { value: 'client_feedback', label: 'Client Feedback Collection', points: 8 },
        { value: 'client_onboarding', label: 'Client Onboarding', points: 25 }
      ]
    },
    content_creation: {
      name: 'Content Creation',
      icon: '🎬',
      activities: [
        { value: 'blog_post', label: 'Blog Post', points: 15 },
        { value: 'social_media_post', label: 'Social Media Post', points: 5 },
        { value: 'video_content', label: 'Video Content', points: 20 },
        { value: 'graphic_design', label: 'Graphic Design', points: 12 },
        { value: 'copywriting', label: 'Copywriting', points: 10 }
      ]
    },
    attendance: {
      name: 'Attendance & Participation',
      icon: '📅',
      activities: [
        { value: 'daily_standup', label: 'Daily Standup', points: 3 },
        { value: 'team_meeting', label: 'Team Meeting', points: 5 },
        { value: 'training_session', label: 'Training Session', points: 8 },
        { value: 'workshop_attendance', label: 'Workshop Attendance', points: 10 },
        { value: 'conference_call', label: 'Conference Call', points: 6 }
      ]
    },
    performance: {
      name: 'Performance & Goals',
      icon: '🎯',
      activities: [
        { value: 'goal_completion', label: 'Goal Completion', points: 25 },
        { value: 'deadline_met', label: 'Deadline Met', points: 15 },
        { value: 'quality_work', label: 'Quality Work Delivery', points: 20 },
        { value: 'process_improvement', label: 'Process Improvement', points: 30 },
        { value: 'mentoring', label: 'Mentoring Others', points: 18 }
      ]
    },
    polls: {
      name: 'Polls & Surveys',
      icon: '🏆',
      activities: [
        { value: 'poll_participation', label: 'Poll Participation', points: 2 },
        { value: 'survey_completion', label: 'Survey Completion', points: 5 },
        { value: 'feedback_submission', label: 'Feedback Submission', points: 8 },
        { value: 'idea_submission', label: 'Idea Submission', points: 12 },
        { value: 'vote_casting', label: 'Vote Casting', points: 3 }
      ]
    }
  };

  // Fetch user data including recent activities and current points
  const fetchUserData = async () => {
    if (!currentUser?.id) return;
    
    setHistoryLoading(true);
    try {
      // Fetch recent activities
      const { data: activities, error: activitiesError } = await supabase
        .from('arcade_activities')
        .select('*')
        .eq('employee_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (activitiesError) throw activitiesError;
      setRecentActivities(activities || []);
      
      // Fetch current points
      const { data: pointsData, error: pointsError } = await supabase
        .from('arcade_points')
        .select('total_points')
        .eq('employee_id', currentUser.id)
        .single();
      
      if (pointsError && pointsError.code !== 'PGRST116') {
        throw pointsError;
      }
      
      setCurrentPoints(pointsData?.total_points || 0);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMessage({ type: 'error', text: 'Failed to load user data' });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load user data on component mount
  useEffect(() => {
    fetchUserData();
  }, [currentUser]);
  
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setFormData(prev => ({
      ...prev,
      activity_type: category,
      activity_subtype: '',
      description: '',
      proof_url: ''
    }));
  };
  
  const handleActivityChange = (activityValue) => {
    setFormData(prev => ({
      ...prev,
      activity_subtype: activityValue
    }));
  };
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setMessage({ type: 'error', text: 'You must be logged in to submit activities.' });
      return;
    }
    
    // Validation
    if (!formData.activity_type || !formData.activity_subtype) {
      setMessage({ type: 'error', text: 'Please select an activity category and type.' });
      return;
    }
    
    if (!formData.description.trim()) {
      setMessage({ type: 'error', text: 'Please provide a description of your activity.' });
      return;
    }
    
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Check eligibility
      const eligibilityCheck = await checkArcadeEligibility(currentUser.id, supabase);
      if (!eligibilityCheck.eligible) {
        setMessage({ type: 'error', text: eligibilityCheck.reason });
        return;
      }
      
      // Validate business hours
      const businessHoursCheck = validateBusinessHours();
      if (!businessHoursCheck.valid) {
        setMessage({ type: 'warning', text: businessHoursCheck.message });
      }
      
      // Check rate limiting
      const rateLimitCheck = await checkRateLimit(currentUser.id, formData.activity_type, supabase);
      if (!rateLimitCheck.allowed) {
        setMessage({ type: 'error', text: rateLimitCheck.message });
        return;
      }
      
      // Validate activity submission
      const validationResult = validateActivitySubmission(formData);
      if (!validationResult.valid) {
        setMessage({ type: 'error', text: validationResult.message });
        return;
      }
      
      // Get points for this activity
      const selectedActivity = categories[formData.activity_type]?.activities.find(
        activity => activity.value === formData.activity_subtype
      );
      
      if (!selectedActivity) {
        setMessage({ type: 'error', text: 'Invalid activity selected.' });
        return;
      }
      
      // Submit to database
      const { error } = await supabase
        .from('arcade_activities')
        .insert({
          employee_id: currentUser.id,
          activity_type: formData.activity_type,
          activity_subtype: formData.activity_subtype,
          points_earned: selectedActivity.points,
          description: formData.description,
          proof_url: formData.proof_url || null,
          status: 'pending'
        });
      
      if (error) throw error;
      
      setMessage({ 
        type: 'success', 
        text: `Activity submitted successfully! You'll earn ${selectedActivity.points} points once approved.` 
      });
      
      // Reset form
      setFormData({
        activity_type: '',
        activity_subtype: '',
        description: '',
        proof_url: ''
      });
      setSelectedCategory('');
      
      // Refresh user data and show history
      await fetchUserData();
      setShowHistory(true);
      
    } catch (error) {
      console.error('Error submitting activity:', error);
      setMessage({ type: 'error', text: 'Failed to submit activity. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectedActivityData = categories[selectedCategory]?.activities.find(
    activity => activity.value === formData.activity_subtype
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h2>
          <p className="text-gray-600">Please log in to access the Arcade Earn Points system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">💰 Earn Points</h1>
              <p className="text-gray-600">Log your activities and earn Arcade points!</p>
              <p className="text-sm text-gray-600 mt-1">
                Current Points: <span className="font-semibold text-blue-600">{currentPoints}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showHistory ? 'Hide History' : 'Show History'}
              </button>
              <button
                onClick={() => onNavigate?.('arcade')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Arcade
              </button>
            </div>
          </div>
        </div>

        {/* Activity History */}
        {showHistory && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
              <button
                onClick={fetchUserData}
                disabled={historyLoading}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {historyLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            {historyLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading activities...</p>
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No activities submitted yet.</p>
                <p className="text-sm text-gray-500 mt-1">Submit your first activity below!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">
                            {formatActivityName(activity.activity_type, activity.activity_subtype, categories)}
                          </h3>
                          {getStatusBadge(activity.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Points: {activity.points_earned}</span>
                          <span>Submitted: {new Date(activity.created_at).toLocaleDateString()}</span>
                          {activity.proof_url && (
                            <a 
                              href={activity.proof_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View Proof
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className="text-2xl">{getActivityIcon(activity.activity_type)}</span>
                      </div>
                    </div>
                    
                    {/* Status indicators */}
                    {activity.status === 'pending' && (
                      <div className="text-xs text-yellow-600 mt-1">
                        ⏳ Awaiting approval
                      </div>
                    )}
                    {activity.status === 'approved' && (
                      <div className="text-xs text-green-600 mt-1">
                        ✅ Approved
                      </div>
                    )}
                    {activity.status === 'rejected' && (
                      <div className="text-xs text-red-600 mt-1">
                        ❌ Rejected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Message Display */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-yellow-50 text-yellow-800 border border-yellow-200'
            }`}>
              {message.text}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Activity Category
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(categories).map(([key, category]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCategoryChange(key)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedCategory === key
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm text-gray-500">
                          {category.activities.length} activities
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Activity Selection */}
            {selectedCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Specific Activity
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categories[selectedCategory].activities.map((activity) => (
                    <button
                      key={activity.value}
                      type="button"
                      onClick={() => handleActivityChange(activity.value)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        formData.activity_subtype === activity.value
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="font-medium">{activity.label}</div>
                      <div className="text-sm text-green-600 font-medium">
                        +{activity.points} points
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Points Preview */}
            {selectedActivityData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-medium">Points to earn:</span>
                  <span className="text-2xl font-bold text-green-700">
                    +{selectedActivityData.points}
                  </span>
                </div>
              </div>
            )}
            
            {/* Description */}
            {formData.activity_subtype && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what you did, when you did it, and any relevant details..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  required
                />
              </div>
            )}
            
            {/* Proof URL */}
            {formData.activity_subtype && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proof URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.proof_url}
                  onChange={(e) => handleInputChange('proof_url', e.target.value)}
                  placeholder="https://example.com/proof-of-activity"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Link to screenshots, documents, or other proof of your activity
                </p>
              </div>
            )}
            
            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !formData.activity_subtype || !formData.description.trim()}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Activity'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ArcadeEarnPoints;