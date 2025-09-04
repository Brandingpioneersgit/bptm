import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { 
  checkArcadeEligibility, 
  checkPointsExpiration, 
  calculatePerformanceImpact 
} from '../utils/arcadeValidation';

const ArcadeDashboard = ({ currentUser, onNavigate }) => {
  const supabase = useSupabase();
  const [arcadeData, setArcadeData] = useState({
    currentPoints: 0,
    totalEarned: 0,
    totalRedeemed: 0,
    pendingActivities: 0,
    pendingRedemptions: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentRedemptions, setRecentRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser?.id) {
      // Check eligibility first
      const eligibility = checkArcadeEligibility(currentUser);
      if (!eligibility.isEligible) {
        setError(eligibility.reason);
        setLoading(false);
        return;
      }
      
      loadArcadeData();
    } else if (currentUser !== undefined) {
      // If currentUser is explicitly null/false, stop loading
      setLoading(false);
      setError('User information not available');
    }
  }, [currentUser]);

  const loadArcadeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if Supabase is available
      if (!supabase) {
        throw new Error('Database connection not available');
      }
      
      await Promise.all([
        fetchArcadeData(),
        fetchRecentActivities(),
        fetchRecentRedemptions()
      ]);
    } catch (err) {
      console.error('Error loading arcade data:', err);
      setError('Failed to load arcade dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchArcadeData = async () => {
    try {
      const { data, error } = await supabase
        .from('arcade_employee_summary')
        .select('*')
        .eq('employee_id', currentUser.id)
        .single();

      if (error) {
        console.error('Error fetching arcade data:', error);
        // If table doesn't exist, use default values
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          setArcadeData({
            currentPoints: 0,
            totalEarned: 0,
            totalRedeemed: 0,
            pendingActivities: 0,
            pendingRedemptions: 0
          });
          return;
        }
        throw error;
      }

      if (data) {
        setArcadeData({
          currentPoints: data.current_points || 0,
          totalEarned: data.total_earned || 0,
          totalRedeemed: data.total_redeemed || 0,
          pendingActivities: data.pending_activities || 0,
          pendingRedemptions: data.pending_redemptions || 0
        });
      }
    } catch (err) {
      console.error('Error fetching arcade data:', err);
      throw err;
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('arcade_activities')
        .select('*')
        .eq('employee_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching activities:', error);
        // If table doesn't exist, use empty array
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          setRecentActivities([]);
          return;
        }
        throw error;
      }

      setRecentActivities(data || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
      throw err;
    }
  };

  const fetchRecentRedemptions = async () => {
    try {
      const { data, error } = await supabase
        .from('arcade_redemptions')
        .select('*')
        .eq('employee_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching redemptions:', error);
        // If table doesn't exist, use empty array
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          setRecentRedemptions([]);
          return;
        }
        throw error;
      }

      setRecentRedemptions(data || []);
    } catch (err) {
      console.error('Error fetching redemptions:', err);
      throw err;
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      fulfilled: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatActivityType = (type, subtype) => {
    const typeMap = {
      client_engagement: 'Client Engagement',
      content_creation: 'Content Creation',
      attendance: 'Attendance',
      performance: 'Performance',
      polls: 'Poll Performance'
    };
    
    const subtypeMap = {
      whatsapp_appreciation: 'WhatsApp Appreciation',
      google_review: 'Google Review',
      video_testimonial: 'Video Testimonial',
      client_referral: 'Client Referral',
      bp_reel: 'BP Reel',
      full_video: 'Full Video',
      monthly_attendance: '100% Monthly Attendance',
      employee_referral: 'Employee Referral',
      tactical_goals: 'Tactical Goals',
      strategic_goals: 'Strategic Goals',
      poll_first: 'Poll - 1st Place',
      poll_second: 'Poll - 2nd Place',
      poll_third: 'Poll - 3rd Place'
    };
    
    return subtypeMap[subtype] || `${typeMap[type] || type} - ${subtype}`;
  };

  // Show error state if there's an error (including eligibility issues)
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={() => loadArcadeData()} 
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Retry
            </button>
            <button
              onClick={() => onNavigate('agency')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your Arcade dashboard...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">🎮 Arcade Dashboard</h1>
              <p className="text-gray-600">Welcome back, {currentUser?.name}! Ready to earn some points?</p>
            </div>
            <button
              onClick={() => onNavigate('agency')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Points Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Points</p>
                <p className="text-3xl font-bold text-purple-600">{arcadeData.currentPoints}</p>
              </div>
              <div className="text-purple-500 text-3xl">💎</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earned</p>
                <p className="text-3xl font-bold text-green-600">{arcadeData.totalEarned}</p>
              </div>
              <div className="text-green-500 text-3xl">🏆</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Redeemed</p>
                <p className="text-3xl font-bold text-blue-600">{arcadeData.totalRedeemed}</p>
              </div>
              <div className="text-blue-500 text-3xl">🎁</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Items</p>
                <p className="text-3xl font-bold text-orange-600">{arcadeData.pendingActivities + arcadeData.pendingRedemptions}</p>
              </div>
              <div className="text-orange-500 text-3xl">⏳</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => onNavigate('arcade-earn')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-4xl mb-2">💰</div>
              <h3 className="text-xl font-bold mb-2">Earn Points</h3>
              <p className="text-green-100">Log activities and earn rewards</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('arcade-redeem')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-4xl mb-2">🛍️</div>
              <h3 className="text-xl font-bold mb-2">Redeem Rewards</h3>
              <p className="text-purple-100">Spend your points on amazing rewards</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('arcade-history')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <h3 className="text-xl font-bold mb-2">View History</h3>
              <p className="text-blue-100">Track your activities and redemptions</p>
            </div>
          </button>
        </div>

        {/* Recent Activities and Redemptions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Recent Activities</h3>
              <span className="text-sm text-gray-500">{recentActivities.length} activities</span>
            </div>
            
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="border-l-4 border-green-400 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">
                        {formatActivityType(activity.activity_type, activity.activity_subtype)}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600 font-bold">+{activity.points_earned}</span>
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📝</div>
                <p className="text-gray-500">No activities yet</p>
                <p className="text-sm text-gray-400">Start earning points by logging your activities!</p>
              </div>
            )}
          </div>

          {/* Recent Redemptions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Recent Redemptions</h3>
              <span className="text-sm text-gray-500">{recentRedemptions.length} redemptions</span>
            </div>
            
            {recentRedemptions.length > 0 ? (
              <div className="space-y-4">
                {recentRedemptions.map((redemption) => (
                  <div key={redemption.id} className="border-l-4 border-purple-400 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">{redemption.reward_name}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-purple-600 font-bold">-{redemption.points_required}</span>
                        {getStatusBadge(redemption.status)}
                      </div>
                    </div>
                    {redemption.request_details && (
                      <p className="text-sm text-gray-600 mb-1">{redemption.request_details}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(redemption.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">🎁</div>
                <p className="text-gray-500">No redemptions yet</p>
                <p className="text-sm text-gray-400">Start redeeming your points for amazing rewards!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{arcadeData.totalEarned}</p>
              <p className="text-sm text-gray-600">Lifetime Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{arcadeData.totalRedeemed}</p>
              <p className="text-sm text-gray-600">Points Spent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{recentActivities.filter(a => a.status === 'approved').length}</p>
              <p className="text-sm text-gray-600">Approved Activities</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{recentRedemptions.filter(r => r.status === 'fulfilled').length}</p>
              <p className="text-sm text-gray-600">Fulfilled Rewards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArcadeDashboard;