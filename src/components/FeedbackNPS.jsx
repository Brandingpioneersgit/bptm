import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { Section } from '@/shared/components/ui';
import { 
  StarIcon, 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  PlusIcon,
  InformationCircleIcon,
  HeartIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

// NPS Score Component
const NPSScore = ({ score, label, size = 'md' }) => {
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getScoreBackground = (score) => {
    if (score >= 70) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };
  
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };
  
  return (
    <div className={`${getScoreBackground(score)} rounded-lg p-4 text-center`}>
      <div className={`${sizeClasses[size]} font-bold ${getScoreColor(score)}`}>
        {score}/100
      </div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
};

// NPS Dial Component
const NPSDial = ({ score, size = 120 }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  const getColor = (score) => {
    if (score >= 70) return '#10B981'; // green
    if (score >= 50) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth="8"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth="8"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-2xl font-bold ${score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
            {score}
          </div>
          <div className="text-xs text-gray-500">NPS</div>
        </div>
      </div>
    </div>
  );
};

// Star Rating Component
const StarRating = ({ rating, onRatingChange, readonly = false, size = 'md' }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };
  
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || rating);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            onClick={() => !readonly && onRatingChange && onRatingChange(star)}
          >
            {isFilled ? (
              <StarIconSolid className={`${sizeClasses[size]} text-yellow-400`} />
            ) : (
              <StarIcon className={`${sizeClasses[size]} text-gray-300`} />
            )}
          </button>
        );
      })}
    </div>
  );
};

// Feedback Form Component
const FeedbackForm = ({ type, targetEmployee, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    rating: 0,
    feedback: '',
    category: '',
    anonymous: false
  });
  
  const categories = {
    peer: ['Communication', 'Collaboration', 'Technical Skills', 'Leadership', 'Reliability'],
    company: ['Work Environment', 'Management', 'Tools & Resources', 'Growth Opportunities', 'Work-Life Balance'],
    client: ['Service Quality', 'Communication', 'Timeliness', 'Problem Solving', 'Overall Satisfaction']
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.rating === 0 || !formData.feedback.trim()) {
      return;
    }
    onSubmit(formData);
  };
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {type === 'peer' ? `Feedback for ${targetEmployee?.name}` : 
           type === 'company' ? 'Company Feedback' : 'Client Satisfaction'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select a category</option>
            {categories[type]?.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <StarRating 
            rating={formData.rating} 
            onRatingChange={(rating) => setFormData({ ...formData, rating })}
          />
        </div>
        
        {/* Feedback Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedback
          </label>
          <textarea
            value={formData.feedback}
            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Share your thoughts..."
            required
          />
        </div>
        
        {/* Anonymous Option */}
        {type === 'peer' && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.anonymous}
              onChange={(e) => setFormData({ ...formData, anonymous: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
              Submit anonymously
            </label>
          </div>
        )}
        
        {/* Submit Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={formData.rating === 0 || !formData.feedback.trim()}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Submit Feedback
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// Feedback Card Component
const FeedbackCard = ({ feedback, showActions = false, onAppreciate, onFlag }) => {
  const [showFullText, setShowFullText] = useState(false);
  const maxLength = 150;
  const needsTruncation = feedback.feedback.length > maxLength;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {feedback.anonymous ? '?' : feedback.from_name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {feedback.anonymous ? 'Anonymous' : feedback.from_name || 'Unknown'}
            </div>
            <div className="text-xs text-gray-500">
              {feedback.category} • {new Date(feedback.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <StarRating rating={feedback.rating} readonly size="sm" />
          {showActions && (
            <div className="flex space-x-1">
              <button
                onClick={() => onAppreciate && onAppreciate(feedback.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Appreciate"
              >
                <HeartIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onFlag && onFlag(feedback.id)}
                className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                title="Flag for review"
              >
                <ExclamationTriangleIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-700">
        {needsTruncation && !showFullText ? (
          <>
            {feedback.feedback.substring(0, maxLength)}...
            <button
              onClick={() => setShowFullText(true)}
              className="text-blue-600 hover:text-blue-700 ml-1"
            >
              Read more
            </button>
          </>
        ) : (
          <>
            {feedback.feedback}
            {needsTruncation && showFullText && (
              <button
                onClick={() => setShowFullText(false)}
                className="text-blue-600 hover:text-blue-700 ml-1"
              >
                Show less
              </button>
            )}
          </>
        )}
      </div>
      
      {feedback.appreciations > 0 && (
        <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500">
          <HeartIcon className="h-3 w-3 text-red-500" />
          <span>{feedback.appreciations} appreciation{feedback.appreciations !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
};

// Main Feedback & NPS Component
export const FeedbackNPS = ({ employee }) => {
  const supabase = useSupabase();
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showFeedbackForm, setShowFeedbackForm] = useState(null);
  const [npsData, setNpsData] = useState({
    client_satisfaction: 0,
    peer_rating: 0,
    company_satisfaction: 0
  });
  const [feedbackData, setFeedbackData] = useState({
    received: [],
    given: [],
    company: []
  });
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Load data on component mount
  useEffect(() => {
    if (employee?.id) {
      loadFeedbackData();
    }
  }, [employee?.id]);
  
  const loadFeedbackData = async () => {
    setLoading(true);
    try {
      // Load NPS scores
      const { data: npsScores, error: npsError } = await supabase
        .from('employee_nps')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('month', new Date().toISOString().slice(0, 7))
        .single();
      
      if (npsScores && !npsError) {
        setNpsData(npsScores);
      }
      
      // Load feedback received
      const { data: receivedFeedback, error: receivedError } = await supabase
        .from('employee_feedback')
        .select('*, from_employee:from_employee_id(name)')
        .eq('to_employee_id', employee.id)
        .order('created_at', { ascending: false });
      
      if (receivedError) throw receivedError;
      
      // Load feedback given
      const { data: givenFeedback, error: givenError } = await supabase
        .from('employee_feedback')
        .select('*, to_employee:to_employee_id(name)')
        .eq('from_employee_id', employee.id)
        .order('created_at', { ascending: false });
      
      if (givenError) throw givenError;
      
      // Load company feedback
      const { data: companyFeedback, error: companyError } = await supabase
        .from('company_feedback')
        .select('*')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });
      
      if (companyError) throw companyError;
      
      setFeedbackData({
        received: receivedFeedback || [],
        given: givenFeedback || [],
        company: companyFeedback || []
      });
      
      // Load employees for peer feedback
      const { data: employeeList, error: employeeError } = await supabase
        .from('employees')
        .select('id, name, department')
        .neq('id', employee.id)
        .eq('is_active', true);
      
      if (employeeError) throw employeeError;
      setEmployees(employeeList || []);
      
    } catch (error) {
      console.error('Error loading feedback data:', error);
      notify('Failed to load feedback data', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitFeedback = async (formData) => {
    try {
      if (showFeedbackForm === 'peer' && selectedEmployee) {
        // Submit peer feedback
        const { error } = await supabase
          .from('employee_feedback')
          .insert({
            from_employee_id: employee.id,
            to_employee_id: selectedEmployee.id,
            rating: formData.rating,
            feedback: formData.feedback,
            category: formData.category,
            anonymous: formData.anonymous,
            month: new Date().toISOString().slice(0, 7)
          });
        
        if (error) throw error;
        notify('Peer feedback submitted successfully!', 'success');
        
      } else if (showFeedbackForm === 'company') {
        // Submit company feedback
        const { error } = await supabase
          .from('company_feedback')
          .insert({
            employee_id: employee.id,
            rating: formData.rating,
            feedback: formData.feedback,
            category: formData.category,
            month: new Date().toISOString().slice(0, 7)
          });
        
        if (error) throw error;
        notify('Company feedback submitted successfully!', 'success');
      }
      
      setShowFeedbackForm(null);
      setSelectedEmployee(null);
      loadFeedbackData();
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      notify('Failed to submit feedback', 'error');
    }
  };
  
  const handleAppreciateFeedback = async (feedbackId) => {
    try {
      const { error } = await supabase
        .from('employee_feedback')
        .update({ 
          appreciations: supabase.raw('appreciations + 1')
        })
        .eq('id', feedbackId);
      
      if (error) throw error;
      notify('Appreciation added!', 'success');
      loadFeedbackData();
      
    } catch (error) {
      console.error('Error adding appreciation:', error);
      notify('Failed to add appreciation', 'error');
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <Section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feedback & NPS</h2>
          <p className="text-gray-600">Client satisfaction, peer feedback, and company insights</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <InformationCircleIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">Updated monthly</span>
        </div>
      </div>
      
      {/* NPS Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <NPSDial score={npsData.client_satisfaction} />
          <h3 className="text-lg font-semibold text-gray-900 mt-4">Client Satisfaction</h3>
          <p className="text-sm text-gray-600">Based on client feedback</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <NPSDial score={npsData.peer_rating} />
          <h3 className="text-lg font-semibold text-gray-900 mt-4">Peer Rating</h3>
          <p className="text-sm text-gray-600">Team collaboration score</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <NPSDial score={npsData.company_satisfaction} />
          <h3 className="text-lg font-semibold text-gray-900 mt-4">Company Satisfaction</h3>
          <p className="text-sm text-gray-600">Your workplace happiness</p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'received', name: 'Received Feedback', icon: '📥' },
            { id: 'given', name: 'Given Feedback', icon: '📤' },
            { id: 'company', name: 'Company Feedback', icon: '🏢' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowFeedbackForm('peer')}
                  className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <UserGroupIcon className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Give Peer Feedback</span>
                </button>
                
                <button
                  onClick={() => setShowFeedbackForm('company')}
                  className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Company Feedback</span>
                </button>
              </div>
            </div>
            
            {/* Recent Feedback Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Feedback Received</span>
                  <span className="font-medium">{feedbackData.received.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Feedback Given</span>
                  <span className="font-medium">{feedbackData.given.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Rating</span>
                  <div className="flex items-center space-x-1">
                    <StarRating 
                      rating={feedbackData.received.length > 0 ? 
                        feedbackData.received.reduce((sum, f) => sum + f.rating, 0) / feedbackData.received.length : 0
                      } 
                      readonly 
                      size="sm" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'received' && (
          <div className="space-y-4">
            {feedbackData.received.length > 0 ? (
              feedbackData.received.map((feedback) => (
                <FeedbackCard 
                  key={feedback.id} 
                  feedback={{
                    ...feedback,
                    from_name: feedback.from_employee?.name
                  }}
                  showActions
                  onAppreciate={handleAppreciateFeedback}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No feedback received yet</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'given' && (
          <div className="space-y-4">
            {feedbackData.given.length > 0 ? (
              feedbackData.given.map((feedback) => (
                <FeedbackCard 
                  key={feedback.id} 
                  feedback={{
                    ...feedback,
                    from_name: `To: ${feedback.to_employee?.name}`
                  }}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No feedback given yet</p>
                <button
                  onClick={() => setShowFeedbackForm('peer')}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Give Feedback
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'company' && (
          <div className="space-y-4">
            {feedbackData.company.length > 0 ? (
              feedbackData.company.map((feedback) => (
                <FeedbackCard 
                  key={feedback.id} 
                  feedback={{
                    ...feedback,
                    from_name: 'You',
                    anonymous: false
                  }}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No company feedback submitted yet</p>
                <button
                  onClick={() => setShowFeedbackForm('company')}
                  className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Share Feedback
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {showFeedbackForm === 'peer' && !selectedEmployee ? (
              <div className="bg-white rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Employee</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {employees.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-sm text-gray-600">{emp.department}</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowFeedbackForm(null)}
                  className="mt-4 w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <FeedbackForm
                type={showFeedbackForm}
                targetEmployee={selectedEmployee}
                onSubmit={handleSubmitFeedback}
                onCancel={() => {
                  setShowFeedbackForm(null);
                  setSelectedEmployee(null);
                }}
              />
            )}
          </div>
        </div>
      )}
      
      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How NPS Scores Work:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>70-100:</strong> Excellent performance, exceeding expectations</li>
              <li>• <strong>50-69:</strong> Good performance, meeting most expectations</li>
              <li>• <strong>0-49:</strong> Needs improvement, below expectations</li>
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default FeedbackNPS;