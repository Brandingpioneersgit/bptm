import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import moment from 'moment';

const ManagerProfile = ({ 
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
  const [projectMetrics, setProjectMetrics] = useState({});
  // Edit modal state removed - using navigation instead
  const [editFormData, setEditFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [teamKPIs, setTeamKPIs] = useState([]);
  const [managerKPIs, setManagerKPIs] = useState({
    team_performance: 0,
    team_productivity: 0,
    team_collaboration: 0,
    leadership_effectiveness: 0,
    goal_achievement: 0,
    team_retention: 0,
    development_initiatives: 0,
    communication_score: 0
  });
  const [showKPIModal, setShowKPIModal] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [teamMemberKPIs, setTeamMemberKPIs] = useState({});

  // Fetch team and project data
  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        setLoading(true);
        
        // Fetch team members under this manager
        const { data: teamMembers, error: teamError } = await supabase
          .from('employees')
          .select('*')
          .eq('manager_id', profileData?.user_id);
          
        if (teamError) {
          console.error('Error fetching team data:', teamError);
        }
        
        // Fetch project metrics
        const { data: projects, error: projectsError } = await supabase
          .from('submissions')
          .select('*')
          .in('user_id', teamMembers?.map(member => member.user_id) || [])
          .gte('created_at', moment().subtract(30, 'days').toISOString());
          
        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
        }
        
        // Fetch team KPI data
        const { data: kpiData, error: kpiError } = await supabase
          .from('monthly_kpi_reports')
          .select('*')
          .in('user_id', teamMembers?.map(member => member.user_id) || [])
          .eq('month', selectedMonth);
          
        if (kpiError) {
          console.error('Error fetching KPI data:', kpiError);
        }
        
        // Fetch manager's own KPI data
        const { data: managerKPIData, error: managerKPIError } = await supabase
          .from('monthly_kpi_reports')
          .select('*')
          .eq('user_id', profileData?.user_id)
          .eq('month', selectedMonth)
          .single();
          
        if (managerKPIError && managerKPIError.code !== 'PGRST116') {
          console.error('Error fetching manager KPI data:', managerKPIError);
        }
        
        setTeamData(teamMembers || []);
        setTeamKPIs(kpiData || []);
        
        if (managerKPIData) {
          setManagerKPIs({
            team_performance: managerKPIData.team_performance || 0,
            team_productivity: managerKPIData.team_productivity || 0,
            team_collaboration: managerKPIData.team_collaboration || 0,
            leadership_effectiveness: managerKPIData.leadership_effectiveness || 0,
            goal_achievement: managerKPIData.goal_achievement || 0,
            team_retention: managerKPIData.team_retention || 0,
            development_initiatives: managerKPIData.development_initiatives || 0,
            communication_score: managerKPIData.communication_score || 0
          });
        }
        
        setProjectMetrics({
          totalProjects: projects?.length || 0,
          avgPerformance: projects?.length > 0 
            ? Math.round(projects.reduce((sum, item) => sum + (item.performance_score || 0), 0) / projects.length)
            : 0,
          activeMembers: teamMembers?.filter(member => member.status === 'active').length || 0,
          completedTasks: projects?.filter(project => project.status === 'completed').length || 0,
          avgTeamKPI: kpiData?.length > 0 
            ? Math.round(kpiData.reduce((sum, kpi) => sum + (kpi.overall_score || 0), 0) / kpiData.length)
            : 0
        });
        
      } catch (error) {
        console.error('Error fetching manager data:', error);
        showToast('Failed to load team data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchManagerData();
  }, [supabase, showToast, profileData?.user_id, selectedMonth]);

  const handleEditProfile = () => {
    setEditFormData({
      name: profileData?.name || '',
      email: profileData?.email || '',
      phone: profileData?.phone || '',
      work_location: profileData?.work_location || '',
      bio: profileData?.bio || '',
      management_style: profileData?.management_style || '',
      team_goals: profileData?.team_goals || ''
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

  const handleSaveManagerKPIs = async () => {
    try {
      const { error } = await supabase
        .from('monthly_kpi_reports')
        .upsert({
          user_id: profileData?.user_id,
          month: selectedMonth,
          ...managerKPIs,
          overall_score: Math.round(
            Object.values(managerKPIs).reduce((sum, value) => sum + value, 0) / Object.keys(managerKPIs).length
          ),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setShowKPIModal(false);
      showToast('Manager KPIs saved successfully', 'success');
    } catch (error) {
      console.error('Error saving manager KPIs:', error);
      showToast('Failed to save KPIs', 'error');
    }
  };

  const handleViewTeamMemberKPIs = async (member) => {
    try {
      const { data, error } = await supabase
        .from('monthly_kpi_reports')
        .select('*')
        .eq('user_id', member.user_id)
        .eq('month', selectedMonth)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching team member KPIs:', error);
      }

      setSelectedTeamMember(member);
      setTeamMemberKPIs(data || {});
    } catch (error) {
      console.error('Error viewing team member KPIs:', error);
      showToast('Failed to load team member KPIs', 'error');
    }
  };

  const calculateOverallScore = (kpis) => {
    const values = Object.values(kpis).filter(val => typeof val === 'number' && val > 0);
    return values.length > 0 ? Math.round(values.reduce((sum, val) => sum + val, 0) / values.length) : 0;
  };

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
                Complete your profile to better manage your team and projects.
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

      {/* Management Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Team Size</h3>
              <div className="text-3xl font-bold">{teamData.length}</div>
              <p className="text-blue-100 text-sm">Direct reports</p>
            </div>
            <div className="text-4xl opacity-80">👥</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Team KPI Score</h3>
              <div className="text-3xl font-bold">{projectMetrics.avgTeamKPI}%</div>
              <p className="text-green-100 text-sm">Average KPI score</p>
            </div>
            <div className="text-4xl opacity-80">📈</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Active Projects</h3>
              <div className="text-3xl font-bold">{projectMetrics.totalProjects}</div>
              <p className="text-purple-100 text-sm">This month</p>
            </div>
            <div className="text-4xl opacity-80">🚀</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Completed Tasks</h3>
              <div className="text-3xl font-bold">{projectMetrics.completedTasks}</div>
              <p className="text-orange-100 text-sm">This month</p>
            </div>
            <div className="text-4xl opacity-80">✅</div>
          </div>
        </div>
      </div>

      {/* Manager KPI Dashboard */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Manager KPI Dashboard</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Overall Score: <span className="font-semibold text-blue-600">{calculateOverallScore(managerKPIs)}/10</span>
            </div>
            <button
              onClick={() => setShowKPIModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Update KPIs
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-600 mb-1">Team Performance</h3>
            <div className="text-2xl font-bold text-blue-900">{managerKPIs.team_performance}/10</div>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${managerKPIs.team_performance * 10}%` }}></div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-600 mb-1">Team Productivity</h3>
            <div className="text-2xl font-bold text-green-900">{managerKPIs.team_productivity}/10</div>
            <div className="w-full bg-green-200 rounded-full h-2 mt-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${managerKPIs.team_productivity * 10}%` }}></div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-600 mb-1">Leadership Effectiveness</h3>
            <div className="text-2xl font-bold text-purple-900">{managerKPIs.leadership_effectiveness}/10</div>
            <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${managerKPIs.leadership_effectiveness * 10}%` }}></div>
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-orange-600 mb-1">Goal Achievement</h3>
            <div className="text-2xl font-bold text-orange-900">{managerKPIs.goal_achievement}/10</div>
            <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
              <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${managerKPIs.goal_achievement * 10}%` }}></div>
            </div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-indigo-600 mb-1">Team Collaboration</h3>
            <div className="text-2xl font-bold text-indigo-900">{managerKPIs.team_collaboration}/10</div>
            <div className="w-full bg-indigo-200 rounded-full h-2 mt-2">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${managerKPIs.team_collaboration * 10}%` }}></div>
            </div>
          </div>
          <div className="bg-pink-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-pink-600 mb-1">Team Retention</h3>
            <div className="text-2xl font-bold text-pink-900">{managerKPIs.team_retention}/10</div>
            <div className="w-full bg-pink-200 rounded-full h-2 mt-2">
              <div className="bg-pink-600 h-2 rounded-full" style={{ width: `${managerKPIs.team_retention * 10}%` }}></div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-600 mb-1">Development Initiatives</h3>
            <div className="text-2xl font-bold text-yellow-900">{managerKPIs.development_initiatives}/10</div>
            <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${managerKPIs.development_initiatives * 10}%` }}></div>
            </div>
          </div>
          <div className="bg-teal-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-teal-600 mb-1">Communication Score</h3>
            <div className="text-2xl font-bold text-teal-900">{managerKPIs.communication_score}/10</div>
            <div className="w-full bg-teal-200 rounded-full h-2 mt-2">
              <div className="bg-teal-600 h-2 rounded-full" style={{ width: `${managerKPIs.communication_score * 10}%` }}></div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Overall Manager Score</h3>
              <p className="text-sm text-gray-600">Based on all KPI metrics</p>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {calculateOverallScore(managerKPIs)}/10
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Manager Profile</h2>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Management Style</label>
            <div className="text-gray-900">{profileData?.management_style || 'Not specified'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Goals</label>
            <div className="text-gray-900">{profileData?.team_goals || 'Not specified'}</div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <div className="text-gray-900">{profileData?.bio || 'No bio provided'}</div>
          </div>
        </div>
      </div>

      {/* Team Management */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Team Management</h2>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading team data...</p>
          </div>
        ) : teamData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Members</h3>
            <p className="text-gray-600">You don't have any direct reports assigned yet.</p>
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
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(teamKPIs.find(kpi => kpi.user_id === member.user_id)?.overall_score || member.performance_score || 0) * 10}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {teamKPIs.find(kpi => kpi.user_id === member.user_id)?.overall_score || member.performance_score || 0}/10
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleViewTeamMemberKPIs(member)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View KPIs
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Performance Tracking */}
      <div className="bg-white rounded-xl border p-6">
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
            <h3 className="text-sm font-medium text-blue-600 mb-1">My Submissions</h3>
            <div className="text-2xl font-bold text-blue-900">
              {monthlyData.filter(item => 
                moment(item.created_at).format('YYYY-MM') === selectedMonth
              ).length}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-600 mb-1">Team Submissions</h3>
            <div className="text-2xl font-bold text-green-900">{projectMetrics.totalProjects}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-600 mb-1">Team Performance</h3>
            <div className="text-2xl font-bold text-purple-900">{projectMetrics.avgPerformance}%</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-orange-600 mb-1">Completed Tasks</h3>
            <div className="text-2xl font-bold text-orange-900">{projectMetrics.completedTasks}</div>
          </div>
        </div>
      </div>

      {/* Manager KPI Modal */}
      {showKPIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Update Manager KPIs - {moment(selectedMonth).format('MMMM YYYY')}</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Performance (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={managerKPIs.team_performance}
                  onChange={(e) => setManagerKPIs(prev => ({ ...prev, team_performance: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Productivity (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={managerKPIs.team_productivity}
                  onChange={(e) => setManagerKPIs(prev => ({ ...prev, team_productivity: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Collaboration (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={managerKPIs.team_collaboration}
                  onChange={(e) => setManagerKPIs(prev => ({ ...prev, team_collaboration: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Leadership Effectiveness (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={managerKPIs.leadership_effectiveness}
                  onChange={(e) => setManagerKPIs(prev => ({ ...prev, leadership_effectiveness: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Goal Achievement (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={managerKPIs.goal_achievement}
                  onChange={(e) => setManagerKPIs(prev => ({ ...prev, goal_achievement: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Retention (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={managerKPIs.team_retention}
                  onChange={(e) => setManagerKPIs(prev => ({ ...prev, team_retention: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Development Initiatives (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={managerKPIs.development_initiatives}
                  onChange={(e) => setManagerKPIs(prev => ({ ...prev, development_initiatives: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Communication Score (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={managerKPIs.communication_score}
                  onChange={(e) => setManagerKPIs(prev => ({ ...prev, communication_score: parseInt(e.target.value) || 0 }))}
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
                onClick={handleSaveManagerKPIs}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Save KPIs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Member KPI View Modal */}
      {selectedTeamMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedTeamMember.name} - KPIs for {moment(selectedMonth).format('MMMM YYYY')}
              </h3>
              <button
                onClick={() => setSelectedTeamMember(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {Object.keys(teamMemberKPIs).length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No KPI Data</h3>
                <p className="text-gray-600">This team member hasn't submitted KPI data for this month yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(teamMemberKPIs).map(([key, value]) => {
                  if (key === 'user_id' || key === 'month' || key === 'created_at' || key === 'updated_at' || key === 'id') return null;
                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1 capitalize">
                        {key.replace(/_/g, ' ')}
                      </h4>
                      <div className="text-2xl font-bold text-gray-900">
                        {typeof value === 'number' ? `${value}/10` : value || 'N/A'}
                      </div>
                      {typeof value === 'number' && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${value * 10}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedTeamMember(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
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
              <h3 className="text-xl font-semibold text-gray-900">Edit Manager Profile</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Management Style</label>
                <select
                  value={editFormData.management_style || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, management_style: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select management style</option>
                  <option value="collaborative">Collaborative</option>
                  <option value="directive">Directive</option>
                  <option value="supportive">Supportive</option>
                  <option value="coaching">Coaching</option>
                  <option value="delegating">Delegating</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Goals</label>
                <textarea
                  value={editFormData.team_goals || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, team_goals: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What are your team's main goals?"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={editFormData.bio || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about your management experience..."
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

export default ManagerProfile;