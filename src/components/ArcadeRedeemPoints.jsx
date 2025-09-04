import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { 
  checkArcadeEligibility, 
  validateRedemptionRequest, 
  checkPointsExpiration 
} from '../utils/arcadeValidation';

const ArcadeRedeemPoints = ({ currentUser, onNavigate }) => {
  const supabase = useSupabase();
  const [rewards, setRewards] = useState([]);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [selectedReward, setSelectedReward] = useState(null);
  const [requestDetails, setRequestDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('individual');

  useEffect(() => {
    if (currentUser?.id) {
      fetchRewards();
      fetchCurrentPoints();
    }
  }, [currentUser]);

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('arcade_rewards')
        .select('*')
        .eq('availability_status', 'available')
        .order('points_required', { ascending: true });

      if (error) {
        console.error('Error fetching rewards:', error);
        setError('Failed to load rewards');
        setLoading(false);
        return;
      }

      setRewards(data || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load rewards');
      setLoading(false);
    }
  };

  const fetchCurrentPoints = async () => {
    try {
      const { data, error } = await supabase
        .from('arcade_points')
        .select('current_points')
        .eq('employee_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching points:', error);
        return;
      }

      setCurrentPoints(data?.current_points || 0);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedemptionRequest = async () => {
    if (!selectedReward) return;

    setSubmitting(true);
    setError('');

    try {
      // Check user eligibility
      const eligibility = checkArcadeEligibility(currentUser);
      if (!eligibility.isEligible) {
        setError(eligibility.reason);
        setSubmitting(false);
        return;
      }

      // Prepare redemption data for validation
      const redemptionData = {
        reward_id: selectedReward.id,
        points_required: selectedReward.points_required,
        reward_type: selectedReward.reward_type,
        manager_approval_requested: selectedReward.reward_name === 'Work From Home (WFH)'
      };

      // Validate redemption request
      const validation = validateRedemptionRequest(redemptionData, currentPoints, currentUser);
      if (!validation.isValid) {
        setError(validation.errors.join('. '));
        setSubmitting(false);
        return;
      }

      if (!requestDetails.trim()) {
        setError('Please provide request details');
        setSubmitting(false);
        return;
      }

      // Check for expiring points warning
      const { data: pointsHistory } = await supabase
        .from('arcade_activities')
        .select('points_earned, created_at')
        .eq('employee_id', currentUser.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

      const expirationCheck = checkPointsExpiration(pointsHistory || []);
      if (expirationCheck.hasExpiring) {
        console.warn(`Warning: ${expirationCheck.expiringPoints} points will expire on ${expirationCheck.expirationDate}`);
      }

      const { data, error } = await supabase
        .from('arcade_redemptions')
        .insert({
          employee_id: currentUser.id,
          reward_type: selectedReward.reward_type,
          reward_name: selectedReward.reward_name,
          points_required: selectedReward.points_required,
          request_details: requestDetails.trim(),
          status: selectedReward.reward_name === 'Work From Home (WFH)' ? 'pending_manager_approval' : 'pending'
        });

      if (error) {
        console.error('Error submitting redemption:', error);
        setError('Failed to submit redemption request. Please try again.');
        return;
      }

      setSuccess(true);
      setSelectedReward(null);
      setRequestDetails('');
      
      // Refresh current points
      fetchCurrentPoints();
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRewardsByType = (type) => {
    return rewards.filter(reward => reward.reward_type === type);
  };

  const canAfford = (pointsRequired) => {
    return currentPoints >= pointsRequired;
  };

  const getRewardIcon = (rewardName) => {
    const iconMap = {
      'Work From Home (WFH)': '🏠',
      'Leave with Pay': '🌴',
      'Movie Tickets (Pair)': '🎬',
      'Lunch with Leader': '🍽️',
      'Lunch for Two': '🥗',
      'Software Purchase': '💻',
      'Course Purchase': '📚',
      'Netflix (3 Months)': '📺',
      'Mystery Box': '🎁',
      'Office Party': '🎉',
      'One-day Trip': '🚌',
      'Two-day Trip': '✈️',
      'Board Game': '🎲',
      'Gourmet Coffee/Tea Set': '☕',
      'Bluetooth Accessories': '🎧',
      'Gift Cards': '💳',
      'Professional Development Tools': '🛠️',
      'Wellness Products': '🧘',
      'Entertainment Subscriptions': '🎮'
    };
    return iconMap[rewardName] || '🎁';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">🛍️ Redeem Points</h1>
              <p className="text-gray-600">Spend your points on amazing rewards!</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white px-4 py-2 rounded-lg shadow">
                <span className="text-sm text-gray-600">Your Points: </span>
                <span className="text-xl font-bold text-purple-600">{currentPoints}</span>
              </div>
              <button
                onClick={() => onNavigate('arcade')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back to Arcade
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-gray-100 border border-gray-400 text-gray-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span>Redemption request submitted successfully! HR will review and approve it.</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-gray-100 border border-gray-400 text-gray-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">❌</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'individual', label: 'Individual Rewards', icon: '👤' },
                { key: 'group', label: 'Group Rewards', icon: '👥' },
                { key: 'mystery_box', label: 'Mystery Box Items', icon: '🎁' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {getRewardsByType(activeTab).map((reward) => {
            const affordable = canAfford(reward.points_required);
            const isWFH = reward.reward_name === 'Work From Home (WFH)';
            const wfhEligible = !isWFH || currentPoints >= 50;
            
            return (
              <div
                key={reward.id}
                className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all ${
                  affordable && wfhEligible
                    ? 'border-gray-200 hover:border-purple-300 hover:shadow-xl'
                    : 'border-gray-200 opacity-60'
                }`}
              >
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{getRewardIcon(reward.reward_name)}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{reward.reward_name}</h3>
                  <div className="flex items-center justify-center space-x-2">
                    <span className={`text-2xl font-bold ${
                      affordable && wfhEligible ? 'text-purple-600' : 'text-gray-400'
                    }`}>
                      {reward.points_required} pts
                    </span>
                    {!affordable && (
                      <span className="text-red-500 text-sm">(Need {reward.points_required - currentPoints} more)</span>
                    )}
                  </div>
                </div>
                
                {reward.description && (
                  <p className="text-sm text-gray-600 mb-4 text-center">{reward.description}</p>
                )}
                
                {reward.special_requirements && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-yellow-800">
                      <span className="font-medium">Note:</span> {reward.special_requirements}
                    </p>
                  </div>
                )}
                
                <button
                  onClick={() => setSelectedReward(reward)}
                  disabled={!affordable || !wfhEligible}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    affordable && wfhEligible
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {affordable && wfhEligible ? 'Redeem' : 'Insufficient Points'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Redemption Modal */}
        {selectedReward && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{getRewardIcon(selectedReward.reward_name)}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedReward.reward_name}</h3>
                <p className="text-purple-600 font-bold text-lg">{selectedReward.points_required} points</p>
              </div>
              
              <div className="mb-6">
                <label htmlFor="request_details" className="block text-sm font-medium text-gray-700 mb-2">
                  Request Details *
                </label>
                <textarea
                  id="request_details"
                  rows={4}
                  value={requestDetails}
                  onChange={(e) => setRequestDetails(e.target.value)}
                  placeholder="Please provide any specific details for your redemption request (e.g., preferred dates for WFH, movie preferences, etc.)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              
              {selectedReward.special_requirements && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Requirements:</span> {selectedReward.special_requirements}
                  </p>
                </div>
              )}
              
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setSelectedReward(null);
                    setRequestDetails('');
                    setError('');
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRedemptionRequest}
                  disabled={submitting || !requestDetails.trim()}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Redemption Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-3">📋 Redemption Guidelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <ul className="space-y-2">
              <li>• Points are non-transferable between employees</li>
              <li>• All redemptions require HR approval</li>
              <li>• Points are valid for one year from earning date</li>
              <li>• WFH redemption requires manager approval</li>
            </ul>
            <ul className="space-y-2">
              <li>• Group rewards require collective point contribution</li>
              <li>• Redemptions subject to business conditions</li>
              <li>• Mystery box items are randomly assigned</li>
              <li>• Allow 2-5 business days for processing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArcadeRedeemPoints;