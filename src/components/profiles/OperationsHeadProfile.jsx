import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import moment from 'moment';

const OperationsHeadProfile = ({ 
  profileData, 
  monthlyData, 
  onProfileUpdate, 
  profileCompletion,
  calendarEvents,
  selectedMonth,
  onMonthChange 
}) => {
  const { supabase } = useSupabase();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [teamData, setTeamData] = useState([]);
  const [operationsMetrics, setOperationsMetrics] = useState({});
  // Edit modal state removed - using navigation instead
  const [editFormData, setEditFormData] = useState({});
  const [loading, setLoading] = useState(true);
  
  // New KPI-related state variables
  const [operationsKPIs, setOperationsKPIs] = useState({
    processEfficiency: 85,
    teamProductivity: 78,
    qualityScore: 92,
    deliveryTimeliness: 88,
    resourceUtilization: 75,
    clientSatisfaction: 90,
    costEfficiency: 82,
    innovationIndex: 70
  });
  const [teamKPIs, setTeamKPIs] = useState({});
  const [showKPIModal, setShowKPIModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [teamMemberKPIs, setTeamMemberKPIs] = useState({});

  // Fetch team and operations data
  useEffect(() => {
    const fetchOperationsData = async () => {
      try {
        setLoading(true);
        
        // Fetch team members under operations
        const { data: teamMembers, error: teamError } = await supabase
          .from('employees')
          .select('*')
          .eq('department', 'Operations')
          .neq('role', 'Operations Head');
          
        if (teamError) {
          console.error('Error fetching team data:', teamError);
        }
        
        // Fetch operations metrics
        const { data: metrics, error: metricsError } = await supabase
          .from('submissions')
          .select('*')
          .in('user_id', teamMembers?.map(member => member.user_id) || [])
          .gte('created_at', moment().subtract(30, 'days').toISOString());
          
        if (metricsError) {
          console.error('Error fetching metrics:', metricsError);
        }
        
        // Fetch operations KPIs
        const { data: kpiData, error: kpiError } = await supabase
          .from('operations_kpis')
          .select('*')
          .eq('operations_head_id', profileData?.user_id)
          .eq('month', selectedMonth)
          .single();
          
        if (kpiData && !kpiError) {
          setOperationsKPIs(kpiData);
        }
        
        setTeamData(teamMembers || []);
        setOperationsMetrics({
          totalSubmissions: metrics?.length || 0,
          avgPerformance: metrics?.length > 0 
            ? Math.round(metrics.reduce((sum, item) => sum + (item.performance_score || 0), 0) / metrics.length)
            : 0,
          activeProjects: teamMembers?.filter(member => member.status === 'active').length || 0
        });
        
      } catch (error) {
        console.error('Error fetching operations data:', error);
        showToast('Failed to load operations data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOperationsData();
  }, [supabase, showToast, selectedMonth, profileData?.user_id]);

  const handleEditProfile = () => {
    setEditFormData({
      name: profileData?.name || '',
      email: profileData?.email || '',
      phone: profileData?.phone || '',
      work_location: profileData?.work_location || '',
      bio: profileData?.bio || '',
      skills: profileData?.skills || [],
      certifications: profileData?.certifications || []
    });
    navigate('/profile-edit');
  };

  const handleSaveProfile = async () => {
    try {
      await onProfileUpdate(editFormData);
      setShowEditModal(false);
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update profile', 'error');
    }
  };
  
  // New KPI-related functions
  const handleSaveOperationsKPIs = async () => {
    try {
      const { error } = await supabase
        .from('operations_kpis')
        .upsert({
          operations_head_id: profileData?.user_id,
          month: selectedMonth,
          ...operationsKPIs,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      setShowKPIModal(false);
      showToast('Operations KPIs updated successfully', 'success');
    } catch (error) {
      console.error('Error saving operations KPIs:', error);
      showToast('Failed to update operations KPIs', 'error');
    }
  };
  
  const calculateOperationsScore = () => {
    const scores = Object.values(operationsKPIs);
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  const tabs = [
    { id: 'overview', label: 'Operations Overview', icon: '📊' },
    { id: 'team-kpis', label: 'Team KPIs', icon: '👥' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading operations profile data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Completion Alert */}
      {profileCompletion < 80 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-yellow-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Complete Your Profile ({profileCompletion}%)
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Add missing information to improve team visibility and collaboration.
              </p>
            </div>
            <button
              onClick={handleEditProfile}
              className="ml-auto bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
            >
              Complete Now
            </button>
          </div>
        </div>
      )}

      {/* Operations KPI Dashboard */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Operations KPI Dashboard</h2>
            <p className="text-sm text-gray-600 mt-1">Track and manage operations performance metrics</p>
          </div>
          <button
            onClick={() => setShowKPIModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Update KPIs
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium mb-2">Process Efficiency</h3>
            <div className="text-2xl font-bold">{operationsKPIs.processEfficiency}%</div>
            <div className="w-full bg-blue-400 rounded-full h-2 mt-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300" 
                style={{ width: `${operationsKPIs.processEfficiency}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium mb-2">Team Productivity</h3>
            <div className="text-2xl font-bold">{operationsKPIs.teamProductivity}%</div>
            <div className="w-full bg-green-400 rounded-full h-2 mt-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300" 
                style={{ width: `${operationsKPIs.teamProductivity}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium mb-2">Quality Score</h3>
            <div className="text-2xl font-bold">{operationsKPIs.qualityScore}%</div>
            <div className="w-full bg-purple-400 rounded-full h-2 mt-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300" 
                style={{ width: `${operationsKPIs.qualityScore}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium mb-2">Delivery Timeliness</h3>
            <div className="text-2xl font-bold">{operationsKPIs.deliveryTimeliness}%</div>
            <div className="w-full bg-orange-400 rounded-full h-2 mt-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300" 
                style={{ width: `${operationsKPIs.deliveryTimeliness}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium mb-2">Resource Utilization</h3>
            <div className="text-2xl font-bold">{operationsKPIs.resourceUtilization}%</div>
            <div className="w-full bg-teal-400 rounded-full h-2 mt-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300" 
                style={{ width: `${operationsKPIs.resourceUtilization}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium mb-2">Client Satisfaction</h3>
            <div className="text-2xl font-bold">{operationsKPIs.clientSatisfaction}%</div>
            <div className="w-full bg-pink-400 rounded-full h-2 mt-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300" 
                style={{ width: `${operationsKPIs.clientSatisfaction}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium mb-2">Cost Efficiency</h3>
            <div className="text-2xl font-bold">{operationsKPIs.costEfficiency}%</div>
            <div className="w-full bg-indigo-400 rounded-full h-2 mt-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300" 
                style={{ width: `${operationsKPIs.costEfficiency}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
            <h3 className="text-sm font-medium mb-2">Innovation Index</h3>
            <div className="text-2xl font-bold">{operationsKPIs.innovationIndex}%</div>
            <div className="w-full bg-yellow-400 rounded-full h-2 mt-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300" 
                style={{ width: `${operationsKPIs.innovationIndex}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Overall Operations Score</h3>
              <p className="text-sm text-gray-600">Based on all KPI metrics</p>
            </div>
            <div className="text-3xl font-bold text-blue-600">{calculateOperationsScore()}%</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          {/* Operations Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Operations Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Team Members</h3>
                      <div className="text-3xl font-bold">{teamData.length}</div>
                      <p className="text-blue-100 text-sm">Active operations staff</p>
                    </div>
                    <div className="text-4xl opacity-80">👥</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Team Performance</h3>
                      <div className="text-3xl font-bold">{operationsMetrics.avgPerformance}%</div>
                      <p className="text-green-100 text-sm">Average this month</p>
                    </div>
                    <div className="text-4xl opacity-80">📈</div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Active Projects</h3>
                      <div className="text-3xl font-bold">{operationsMetrics.activeProjects}</div>
                      <p className="text-purple-100 text-sm">Currently running</p>
                    </div>
                    <div className="text-4xl opacity-80">🚀</div>
                  </div>
                </div>
              </div>
              
              {/* Monthly Performance */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Monthly Performance</h2>
                  <select
                    value={selectedMonth}
                    onChange={(e) => onMonthChange(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = moment().subtract(i, 'months').format('YYYY-MM');
                      return (
                        <option key={month} value={month}>
                          {moment(month).format('MMMM YYYY')}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-600 mb-1">Personal Submissions</h3>
                    <div className="text-2xl font-bold text-blue-900">
                      {monthlyData.filter(item => 
                        moment(item.created_at).format('YYYY-MM') === selectedMonth
                      ).length}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-green-600 mb-1">Team Submissions</h3>
                    <div className="text-2xl font-bold text-green-900">{operationsMetrics.totalSubmissions}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-purple-600 mb-1">Avg Performance</h3>
                    <div className="text-2xl font-bold text-purple-900">{operationsMetrics.avgPerformance}%</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-orange-600 mb-1">Active Members</h3>
                    <div className="text-2xl font-bold text-orange-900">{operationsMetrics.activeProjects}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Team KPIs Tab */}
          {activeTab === 'team-kpis' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Team KPI Management</h2>
              
              {/* Team Management */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading team data...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {teamData.map((member, index) => (
                          <tr key={member.id || index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                  {member.name?.charAt(0) || 'U'}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                  <div className="text-sm text-gray-500">{member.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.role}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {member.status || 'active'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-gray-900 mr-2">
                                  {Math.floor(Math.random() * 30) + 70}%
                                </div>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${Math.floor(Math.random() * 30) + 70}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900 mr-3">View KPIs</button>
                              <button className="text-gray-600 hover:text-gray-900">Edit</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Operations Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Process Efficiency</span>
                      <span className="text-sm font-medium text-green-600">↗ +5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Team Productivity</span>
                      <span className="text-sm font-medium text-green-600">↗ +3%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Quality Score</span>
                      <span className="text-sm font-medium text-red-600">↘ -2%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      • Process efficiency has improved significantly this month
                    </div>
                    <div className="text-sm text-gray-600">
                      • Team productivity is above target by 8%
                    </div>
                    <div className="text-sm text-gray-600">
                      • Quality metrics need attention in next review
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                  <button
                    onClick={handleEditProfile}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="text-gray-900">{profileData?.name || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="text-gray-900">{profileData?.email || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <div className="text-gray-900">{profileData?.phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
                    <div className="text-gray-900">{profileData?.work_location || 'Not provided'}</div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <div className="text-gray-900">{profileData?.bio || 'No bio provided'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Operations KPI Modal */}
      {showKPIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Update Operations KPIs</h3>
              <button
                onClick={() => setShowKPIModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Process Efficiency (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={operationsKPIs.processEfficiency}
                  onChange={(e) => setOperationsKPIs(prev => ({ ...prev, processEfficiency: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Productivity (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={operationsKPIs.teamProductivity}
                  onChange={(e) => setOperationsKPIs(prev => ({ ...prev, teamProductivity: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quality Score (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={operationsKPIs.qualityScore}
                  onChange={(e) => setOperationsKPIs(prev => ({ ...prev, qualityScore: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Timeliness (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={operationsKPIs.deliveryTimeliness}
                  onChange={(e) => setOperationsKPIs(prev => ({ ...prev, deliveryTimeliness: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resource Utilization (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={operationsKPIs.resourceUtilization}
                  onChange={(e) => setOperationsKPIs(prev => ({ ...prev, resourceUtilization: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Satisfaction (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={operationsKPIs.clientSatisfaction}
                  onChange={(e) => setOperationsKPIs(prev => ({ ...prev, clientSatisfaction: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cost Efficiency (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={operationsKPIs.costEfficiency}
                  onChange={(e) => setOperationsKPIs(prev => ({ ...prev, costEfficiency: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Innovation Index (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={operationsKPIs.innovationIndex}
                  onChange={(e) => setOperationsKPIs(prev => ({ ...prev, innovationIndex: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowKPIModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOperationsKPIs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save KPIs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Edit Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
                <input
                  type="text"
                  value={editFormData.work_location || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, work_location: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={editFormData.bio || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsHeadProfile;