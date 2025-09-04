import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';

const ArcadeHistory = ({ currentUser, onNavigate }) => {
  const supabase = useSupabase();
  const [activities, setActivities] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activities');
  const [filter, setFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (currentUser?.id) {
      fetchActivities();
      fetchRedemptions();
      fetchAuditLog();
    }
  }, [currentUser]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('arcade_activities')
        .select('*')
        .eq('employee_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activities:', error);
        return;
      }

      setActivities(data || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchRedemptions = async () => {
    try {
      const { data, error } = await supabase
        .from('arcade_redemptions')
        .select('*')
        .eq('employee_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching redemptions:', error);
        return;
      }

      setRedemptions(data || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchAuditLog = async () => {
    try {
      const { data, error } = await supabase
        .from('arcade_audit_log')
        .select('*')
        .eq('employee_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching audit log:', error);
        return;
      }

      setAuditLog(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
     pending: 'bg-gray-100 text-gray-800',
     approved: 'bg-gray-100 text-gray-800',
     rejected: 'bg-gray-100 text-gray-800',
     fulfilled: 'bg-gray-100 text-gray-800'
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

  const getFilteredActivities = () => {
    let filtered = activities;
    
    if (filter !== 'all') {
      filtered = activities.filter(activity => activity.status === filter);
    }
    
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  };

  const getFilteredRedemptions = () => {
    let filtered = redemptions;
    
    if (filter !== 'all') {
      filtered = redemptions.filter(redemption => redemption.status === filter);
    }
    
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  };

  const getFilteredAuditLog = () => {
    return auditLog.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  };

  const getActionTypeIcon = (actionType) => {
    const iconMap = {
      points_earned: '💰',
      points_deducted: '⚠️',
      points_redeemed: '🛍️'
    };
    return iconMap[actionType] || '📝';
  };

  const getActionTypeColor = (actionType) => {
    const colorMap = {
      points_earned: 'text-green-600',
      points_deducted: 'text-red-600',
      points_redeemed: 'text-purple-600'
    };
    return colorMap[actionType] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your history...</p>
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Arcade History</h1>
              <p className="text-gray-600">Track your activities, redemptions, and point changes</p>
            </div>
            <button
              onClick={() => onNavigate('arcade')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Arcade
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'activities', label: 'Activities', icon: '💰', count: activities.length },
                { key: 'redemptions', label: 'Redemptions', icon: '🛍️', count: redemptions.length },
                { key: 'audit', label: 'Audit Log', icon: '📋', count: auditLog.length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">{tab.count}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Filters */}
        {(activeTab === 'activities' || activeTab === 'redemptions') && (
          <div className="mb-6 flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                {activeTab === 'redemptions' && <option value="fulfilled">Fulfilled</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg">
          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Activity History</h2>
              {getFilteredActivities().length > 0 ? (
                <div className="space-y-4">
                  {getFilteredActivities().map((activity) => (
                    <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-gray-900">
                              {formatActivityType(activity.activity_type, activity.activity_subtype)}
                            </h3>
                            <span className={`font-bold ${
                              activity.status === 'approved' ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              +{activity.points_earned} pts
                            </span>
                            {getStatusBadge(activity.status)}
                          </div>
                          <p className="text-gray-600 mb-2">{activity.description}</p>
                          {activity.proof_url && (
                            <a
                              href={activity.proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              📎 View Proof
                            </a>
                          )}
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>{new Date(activity.created_at).toLocaleDateString()}</p>
                          <p>{new Date(activity.created_at).toLocaleTimeString()}</p>
                          {activity.approved_at && (
                            <p className="text-green-600 mt-1">
                              Approved: {new Date(activity.approved_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">📝</div>
                  <p className="text-gray-500 mb-2">No activities found</p>
                  <p className="text-sm text-gray-400">
                    {filter === 'all' ? 'Start earning points by logging activities!' : `No ${filter} activities found.`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Redemptions Tab */}
          {activeTab === 'redemptions' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Redemption History</h2>
              {getFilteredRedemptions().length > 0 ? (
                <div className="space-y-4">
                  {getFilteredRedemptions().map((redemption) => (
                    <div key={redemption.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-gray-900">{redemption.reward_name}</h3>
                            <span className="font-bold text-purple-600">-{redemption.points_required} pts</span>
                            {getStatusBadge(redemption.status)}
                          </div>
                          <p className="text-gray-600 mb-2">{redemption.request_details}</p>
                          <p className="text-sm text-gray-500 capitalize">
                            Type: {redemption.reward_type.replace('_', ' ')}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>{new Date(redemption.created_at).toLocaleDateString()}</p>
                          <p>{new Date(redemption.created_at).toLocaleTimeString()}</p>
                          {redemption.approved_at && (
                            <p className="text-green-600 mt-1">
                              Approved: {new Date(redemption.approved_at).toLocaleDateString()}
                            </p>
                          )}
                          {redemption.fulfilled_at && (
                            <p className="text-blue-600 mt-1">
                              Fulfilled: {new Date(redemption.fulfilled_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">🛍️</div>
                  <p className="text-gray-500 mb-2">No redemptions found</p>
                  <p className="text-sm text-gray-400">
                    {filter === 'all' ? 'Start redeeming your points for rewards!' : `No ${filter} redemptions found.`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Audit Log Tab */}
          {activeTab === 'audit' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Complete Audit Log</h2>
              {getFilteredAuditLog().length > 0 ? (
                <div className="space-y-3">
                  {getFilteredAuditLog().map((log) => (
                    <div key={log.id} className="border-l-4 border-gray-300 pl-4 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{getActionTypeIcon(log.action_type)}</span>
                          <div>
                            <p className="font-medium text-gray-900">
                              {log.action_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-sm text-gray-600">{log.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${getActionTypeColor(log.action_type)}`}>
                            {log.points_change > 0 ? '+' : ''}{log.points_change} pts
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">📋</div>
                  <p className="text-gray-500 mb-2">No audit log entries found</p>
                  <p className="text-sm text-gray-400">Point changes will appear here as they happen.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {activities.filter(a => a.status === 'approved').length}
            </div>
            <p className="text-gray-600">Approved Activities</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {redemptions.filter(r => r.status === 'fulfilled').length}
            </div>
            <p className="text-gray-600">Fulfilled Redemptions</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {activities.filter(a => a.status === 'pending').length + redemptions.filter(r => r.status === 'pending').length}
            </div>
            <p className="text-gray-600">Pending Items</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArcadeHistory;