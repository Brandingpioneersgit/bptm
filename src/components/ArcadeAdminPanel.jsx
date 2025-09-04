import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useEnhancedErrorHandling } from '@/shared/hooks/useEnhancedErrorHandling';
import { 
  validateEscalationEntry, 
  checkArcadeEligibility, 
  calculatePerformanceImpact 
} from '../utils/arcadeValidation';

const ArcadeAdminPanel = ({ currentUser, onNavigate }) => {
  const supabase = useSupabase();
  const {
    handleDataFetching,
    handleDatabaseOperation,
    showSuccessNotification,
    showErrorModal,
    showWarningModal
  } = useEnhancedErrorHandling();
  
  const [pendingActivities, setPendingActivities] = useState([]);
  const [pendingRedemptions, setPendingRedemptions] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activities');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState([]);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [escalationForm, setEscalationForm] = useState({
    employee_id: '',
    escalation_type: '',
    escalation_subtype: '',
    description: '',
    points_deducted: 0
  });

  useEffect(() => {
    if (currentUser?.id) {
      fetchPendingActivities();
      fetchPendingRedemptions();
      fetchEscalations();
      fetchAnalytics();
      fetchEmployees();
    }
  }, [currentUser]);

  const fetchEmployees = async () => {
    await handleDataFetching(
      async () => {
        const { data, error } = await supabase
          .from('employees')
          .select('id, name, email, department')
          .neq('department', 'HR')
          .order('name');

        if (error) throw error;
        return data || [];
      },
      {
        onSuccess: (data) => {
          setEmployees(data);
        },
        onError: (error) => {
          showWarningModal('Failed to load employees. Some features may be limited.');
          setEmployees([]);
        }
      }
    );
  };

  const fetchPendingActivities = async () => {
    await handleDataFetching(
      async () => {
        const { data, error } = await supabase
          .from('arcade_activities')
          .select(`
            *,
            employees!inner(name, email, department)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      },
      {
        onSuccess: (data) => {
          setPendingActivities(data);
        },
        onError: (error) => {
          showWarningModal('Failed to load pending activities.');
          setPendingActivities([]);
        }
      }
    );
  };

  const fetchPendingRedemptions = async () => {
    await handleDataFetching(
      async () => {
        const { data, error } = await supabase
          .from('arcade_redemptions')
          .select(`
            *,
            employees!inner(name, email, department)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      },
      {
        onSuccess: (data) => {
          setPendingRedemptions(data);
        },
        onError: (error) => {
          showWarningModal('Failed to load pending redemptions.');
          setPendingRedemptions([]);
        }
      }
    );
  };

  const fetchEscalations = async () => {
    await handleDataFetching(
      async () => {
        const { data, error } = await supabase
          .from('arcade_escalations')
          .select(`
            *,
            employees!inner(name, email, department)
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        return data || [];
      },
      {
        onSuccess: (data) => {
          setEscalations(data);
        },
        onError: (error) => {
          showWarningModal('Failed to load escalations.');
          setEscalations([]);
        }
      }
    );
  };

  const fetchAnalytics = async () => {
    await handleDataFetching(
      async () => {
        const { data: summaryData, error: summaryError } = await supabase
          .from('arcade_employee_summary')
          .select('*');

        if (summaryError) throw summaryError;
        return summaryData || [];
      },
      {
        onSuccess: (summaryData) => {
          // Calculate analytics
          const totalEmployees = summaryData.length;
          const totalPointsEarned = summaryData.reduce((sum, emp) => sum + (emp.total_points_earned || 0), 0);
          const totalPointsRedeemed = summaryData.reduce((sum, emp) => sum + (emp.total_points_redeemed || 0), 0);
          const averagePoints = totalEmployees > 0 ? Math.round(totalPointsEarned / totalEmployees) : 0;
          const topPerformers = summaryData.sort((a, b) => (b.current_points || 0) - (a.current_points || 0)).slice(0, 5);

          setAnalytics({
            totalEmployees,
            totalPointsEarned,
            totalPointsRedeemed,
            averagePoints,
            topPerformers
          });
        },
        onError: (error) => {
          showWarningModal('Failed to load analytics data.');
          setAnalytics({});
        },
        onFinally: () => {
          setLoading(false);
        }
      }
    );
  };

  const handleApproveActivity = async (activityId) => {
    await handleDatabaseOperation(
      async () => {
        const { error } = await supabase
          .from('arcade_activities')
          .update({
            status: 'approved',
            approved_by: currentUser.id,
            approved_at: new Date().toISOString()
          })
          .eq('id', activityId);

        if (error) throw error;
      },
      {
        onSuccess: () => {
          showSuccessNotification('Activity approved successfully!');
          fetchPendingActivities();
          fetchAnalytics();
        },
        onError: (error) => {
          showErrorModal('Failed to approve activity', error.message);
        }
      }
    );
  };

  const handleRejectActivity = async (activityId) => {
    await handleDatabaseOperation(
      async () => {
        const { error } = await supabase
          .from('arcade_activities')
          .update({
            status: 'rejected',
            approved_by: currentUser.id,
            approved_at: new Date().toISOString()
          })
          .eq('id', activityId);

        if (error) throw error;
      },
      {
        onSuccess: () => {
          showSuccessNotification('Activity rejected successfully!');
          fetchPendingActivities();
        },
        onError: (error) => {
          showErrorModal('Failed to reject activity', error.message);
        }
      }
    );
  };

  const handleApproveRedemption = async (redemptionId) => {
    try {
      const { error } = await supabase
        .from('arcade_redemptions')
        .update({
          status: 'approved',
          approved_by: currentUser.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', redemptionId);

      if (error) {
        console.error('Error approving redemption:', error);
        alert('Error approving redemption');
        return;
      }

      alert('Redemption approved successfully!');
      fetchPendingRedemptions();
      fetchAnalytics();
    } catch (err) {
      console.error('Error:', err);
      alert('Error approving redemption');
    }
  };

  const handleRejectRedemption = async (redemptionId) => {
    try {
      const { error } = await supabase
        .from('arcade_redemptions')
        .update({
          status: 'rejected',
          approved_by: currentUser.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', redemptionId);

      if (error) {
        console.error('Error rejecting redemption:', error);
        alert('Error rejecting redemption');
        return;
      }

      alert('Redemption rejected successfully!');
      fetchPendingRedemptions();
    } catch (err) {
      console.error('Error:', err);
      alert('Error rejecting redemption');
    }
  };

  const handleFulfillRedemption = async (redemptionId) => {
    try {
      const { error } = await supabase
        .from('arcade_redemptions')
        .update({
          status: 'fulfilled',
          fulfilled_at: new Date().toISOString()
        })
        .eq('id', redemptionId);

      if (error) {
        console.error('Error fulfilling redemption:', error);
        alert('Error fulfilling redemption');
        return;
      }

      alert('Redemption marked as fulfilled!');
      fetchPendingRedemptions();
    } catch (err) {
      console.error('Error:', err);
      alert('Error fulfilling redemption');
    }
  };

  const handleCreateEscalation = async (e) => {
    e.preventDefault();
    
    try {
      // Validate escalation entry
      const validation = validateEscalationEntry(escalationForm, currentUser);
      if (!validation.isValid) {
        alert(validation.errors.join('. '));
        return;
      }

      // Check if target employee is eligible for Arcade
      const { data: targetEmployee } = await supabase
        .from('employees')
        .select('*')
        .eq('id', escalationForm.employee_id)
        .single();

      if (targetEmployee) {
        const eligibility = checkArcadeEligibility(targetEmployee);
        if (!eligibility.isEligible) {
          alert(`Target employee is not eligible for Arcade Program: ${eligibility.reason}`);
          return;
        }
      }

      const { error } = await supabase
        .from('arcade_escalations')
        .insert([{
          employee_id: escalationForm.employee_id,
          escalation_type: escalationForm.escalation_type,
          escalation_subtype: escalationForm.escalation_subtype,
          description: escalationForm.description,
          points_deducted: escalationForm.points_deducted,
          reported_by: currentUser.id
        }]);

      if (error) {
        console.error('Error creating escalation:', error);
        alert('Error creating escalation');
        return;
      }

      alert('Escalation created successfully!');
      setShowEscalationModal(false);
      setEscalationForm({
        employee_id: '',
        escalation_type: '',
        escalation_subtype: '',
        description: '',
        points_deducted: 0
      });
      fetchEscalations();
      fetchAnalytics();
    } catch (err) {
      console.error('Error:', err);
      alert('Error creating escalation');
    }
  };

  const getEscalationSubtypes = (type) => {
    const subtypes = {
      client_issues: [
        { value: 'whatsapp_complaint', label: 'WhatsApp Complaint (-2 pts)', points: 2 },
        { value: 'call_escalation', label: 'Call Escalation (-5 pts)', points: 5 },
        { value: 'non_response', label: 'Non-response to Client (-2 pts/day)', points: 2 },
        { value: 'client_loss', label: 'Client Loss (-30 pts)', points: 30 }
      ],
      meeting_attendance: [
        { value: 'daily_operations', label: 'Daily Operations (-1 pt)', points: 1 },
        { value: 'tactical', label: 'Tactical (-3 pts)', points: 3 },
        { value: 'strategic', label: 'Strategic (-5 pts)', points: 5 }
      ],
      performance_issues: [
        { value: 'missed_deadline', label: 'Missed Deadline (-3 pts)', points: 3 },
        { value: 'missed_tactical_target', label: 'Missed Tactical Target (-1 pt)', points: 1 },
        { value: 'missed_strategic_target', label: 'Missed Strategic Target (-2 pts)', points: 2 },
        { value: 'late_payments', label: 'Late Payments (-2 pts/month)', points: 2 }
      ],
      behavioral_issues: [
        { value: 'colleague_misbehavior', label: 'Colleague Misbehavior (-10 pts)', points: 10 },
        { value: 'unannounced_leaves', label: 'Unannounced Leaves (-5 pts)', points: 5 }
      ]
    };
    return subtypes[type] || [];
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">🎮 Arcade Admin Panel</h1>
              <p className="text-gray-600">Manage the Arcade program and employee activities</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowEscalationModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                ⚠️ Create Escalation
              </button>
              <button
                onClick={() => onNavigate('dashboard')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">👥</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalEmployees}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">💰</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Points Earned</p>
                <p className="text-2xl font-bold text-green-600">{analytics.totalPointsEarned}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🛍️</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Points Redeemed</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.totalPointsRedeemed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <p className="text-sm font-medium text-gray-600">Average Points</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.averagePoints}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'activities', label: 'Pending Activities', icon: '💰', count: pendingActivities.length },
                { key: 'redemptions', label: 'Pending Redemptions', icon: '🛍️', count: pendingRedemptions.length },
                { key: 'escalations', label: 'Recent Escalations', icon: '⚠️', count: escalations.length },
                { key: 'analytics', label: 'Top Performers', icon: '🏆', count: analytics.topPerformers?.length || 0 }
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

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg">
          {/* Pending Activities */}
          {activeTab === 'activities' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Activities</h2>
              {pendingActivities.length > 0 ? (
                <div className="space-y-4">
                  {pendingActivities.map((activity) => (
                    <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-gray-900">
                              {formatActivityType(activity.activity_type, activity.activity_subtype)}
                            </h3>
                            <span className="font-bold text-green-600">+{activity.points_earned} pts</span>
                          </div>
                          <p className="text-gray-600 mb-2">{activity.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>👤 {activity.employees.name}</span>
                            <span>📧 {activity.employees.email}</span>
                            <span>🏢 {activity.employees.department}</span>
                            <span>📅 {new Date(activity.created_at).toLocaleDateString()}</span>
                          </div>
                          {activity.proof_url && (
                            <a
                              href={activity.proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                            >
                              📎 View Proof
                            </a>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveActivity(activity.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleRejectActivity(activity.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">✅</div>
                  <p className="text-gray-500">No pending activities</p>
                </div>
              )}
            </div>
          )}

          {/* Pending Redemptions */}
          {activeTab === 'redemptions' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Redemptions</h2>
              {pendingRedemptions.length > 0 ? (
                <div className="space-y-4">
                  {pendingRedemptions.map((redemption) => (
                    <div key={redemption.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-gray-900">{redemption.reward_name}</h3>
                            <span className="font-bold text-purple-600">-{redemption.points_required} pts</span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs capitalize">
                              {redemption.reward_type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2">{redemption.request_details}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>👤 {redemption.employees.name}</span>
                            <span>📧 {redemption.employees.email}</span>
                            <span>🏢 {redemption.employees.department}</span>
                            <span>📅 {new Date(redemption.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveRedemption(redemption.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleRejectRedemption(redemption.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            ❌ Reject
                          </button>
                          {redemption.status === 'approved' && (
                            <button
                              onClick={() => handleFulfillRedemption(redemption.id)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              📦 Fulfill
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">✅</div>
                  <p className="text-gray-500">No pending redemptions</p>
                </div>
              )}
            </div>
          )}

          {/* Recent Escalations */}
          {activeTab === 'escalations' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Escalations</h2>
              {escalations.length > 0 ? (
                <div className="space-y-4">
                  {escalations.map((escalation) => (
                    <div key={escalation.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-gray-900 capitalize">
                              {escalation.escalation_type.replace('_', ' ')} - {escalation.escalation_subtype.replace('_', ' ')}
                            </h3>
                            <span className="font-bold text-red-600">-{escalation.points_deducted} pts</span>
                          </div>
                          <p className="text-gray-600 mb-2">{escalation.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>👤 {escalation.employees.name}</span>
                            <span>📧 {escalation.employees.email}</span>
                            <span>🏢 {escalation.employees.department}</span>
                            <span>📅 {new Date(escalation.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">📋</div>
                  <p className="text-gray-500">No escalations found</p>
                </div>
              )}
            </div>
          )}

          {/* Top Performers */}
          {activeTab === 'analytics' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Top Performers</h2>
              {analytics.topPerformers?.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topPerformers.map((performer, index) => (
                    <div key={performer.employee_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{performer.employee_name}</h3>
                            <p className="text-sm text-gray-600">{performer.department}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">{performer.current_points} pts</p>
                          <p className="text-sm text-gray-500">Earned: {performer.total_points_earned}</p>
                          <p className="text-sm text-gray-500">Redeemed: {performer.total_points_redeemed}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">🏆</div>
                  <p className="text-gray-500">No performance data available</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Escalation Modal */}
        {showEscalationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Create Escalation</h3>
              <form onSubmit={handleCreateEscalation}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                    <select
                      value={escalationForm.employee_id}
                      onChange={(e) => setEscalationForm({...escalationForm, employee_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.name} - {emp.department}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Escalation Type</label>
                    <select
                      value={escalationForm.escalation_type}
                      onChange={(e) => {
                        setEscalationForm({
                          ...escalationForm, 
                          escalation_type: e.target.value,
                          escalation_subtype: '',
                          points_deducted: 0
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="client_issues">Client Issues</option>
                      <option value="meeting_attendance">Meeting Attendance</option>
                      <option value="performance_issues">Performance Issues</option>
                      <option value="behavioral_issues">Behavioral Issues</option>
                    </select>
                  </div>
                  
                  {escalationForm.escalation_type && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specific Issue</label>
                      <select
                        value={escalationForm.escalation_subtype}
                        onChange={(e) => {
                          const subtype = getEscalationSubtypes(escalationForm.escalation_type).find(s => s.value === e.target.value);
                          setEscalationForm({
                            ...escalationForm, 
                            escalation_subtype: e.target.value,
                            points_deducted: subtype?.points || 0
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select Issue</option>
                        {getEscalationSubtypes(escalationForm.escalation_type).map((subtype) => (
                          <option key={subtype.value} value={subtype.value}>{subtype.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Points to Deduct</label>
                    <input
                      type="number"
                      value={escalationForm.points_deducted}
                      onChange={(e) => setEscalationForm({...escalationForm, points_deducted: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={escalationForm.description}
                      onChange={(e) => setEscalationForm({...escalationForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      placeholder="Provide details about the escalation..."
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEscalationModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Create Escalation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArcadeAdminPanel;