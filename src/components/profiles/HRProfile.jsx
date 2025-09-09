import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import moment from 'moment';

const HRProfile = ({ 
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
  
  const [hrData, setHrData] = useState({});
  // Edit modal state removed - using navigation instead
  const [editFormData, setEditFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [recruitmentData, setRecruitmentData] = useState([]);
  const [employeeData, setEmployeeData] = useState([]);
  const [hrKPIs, setHrKPIs] = useState({
    recruitment_efficiency: 0,
    employee_satisfaction: 0,
    retention_rate: 0,
    training_completion: 0,
    policy_compliance: 0,
    onboarding_success: 0,
    performance_reviews: 0,
    hr_response_time: 0
  });
  const [showKPIModal, setShowKPIModal] = useState(false);

  // Fetch HR-specific data
  useEffect(() => {
    const fetchHRData = async () => {
      try {
        setLoading(true);
        
        // Calculate HR metrics
        const currentMonthData = monthlyData.filter(item => 
          moment(item.created_at).format('YYYY-MM') === moment().format('YYYY-MM')
        );
        
        // Fetch recruitment data
        const { data: recruitmentInfo, error: recruitmentError } = await supabase
          .from('recruitment_activities')
          .select('*')
          .eq('hr_id', profileData?.user_id)
          .gte('created_at', moment().startOf('month').toISOString())
          .order('created_at', { ascending: false });
          
        if (recruitmentError && recruitmentError.code !== 'PGRST116') {
          console.error('Error fetching recruitment data:', recruitmentError);
        }
        
        // Fetch employee management data
        const { data: employeeInfo, error: employeeError } = await supabase
          .from('employees')
          .select('*')
          .eq('hr_manager_id', profileData?.user_id)
          .order('created_at', { ascending: false });
          
        if (employeeError && employeeError.code !== 'PGRST116') {
          console.error('Error fetching employee data:', employeeError);
        }
        
        const totalHires = (recruitmentInfo || []).filter(r => r.status === 'hired').length;
        const totalInterviews = (recruitmentInfo || []).filter(r => r.status === 'interviewed').length;
        const activeEmployees = (employeeInfo || []).filter(e => e.status === 'active').length;
        
        setHrData({
          totalHires: totalHires,
          totalInterviews: totalInterviews,
          activeEmployees: activeEmployees,
          recruitmentActivities: (recruitmentInfo || []).length,
          avgPerformance: currentMonthData.length > 0 
            ? Math.round(currentMonthData.reduce((sum, item) => sum + (item.performance_score || 0), 0) / currentMonthData.length)
            : 0,
          completedTasks: currentMonthData.filter(item => item.status === 'completed').length,
          totalTasks: currentMonthData.length
        });
        
        setRecruitmentData(recruitmentInfo || []);
        setEmployeeData(employeeInfo || []);
        
        // Fetch HR KPI data
        const { data: kpiData, error: kpiError } = await supabase
          .from('monthly_kpi_reports')
          .select('*')
          .eq('user_id', profileData?.user_id)
          .eq('month', moment(selectedMonth).format('YYYY-MM-01'))
          .single();
          
        if (kpiData && !kpiError) {
          setHrKPIs({
            recruitment_efficiency: kpiData.recruitment_efficiency || 0,
            employee_satisfaction: kpiData.employee_satisfaction || 0,
            retention_rate: kpiData.retention_rate || 0,
            training_completion: kpiData.training_completion || 0,
            policy_compliance: kpiData.policy_compliance || 0,
            onboarding_success: kpiData.onboarding_success || 0,
            performance_reviews: kpiData.performance_reviews || 0,
            hr_response_time: kpiData.hr_response_time || 0
          });
        }
        
      } catch (error) {
        console.error('Error fetching HR data:', error);
        showToast('Failed to load HR data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHRData();
  }, [supabase, showToast, monthlyData, profileData?.user_id, selectedMonth]);

  const handleEditProfile = () => {
    setEditFormData({
      name: profileData?.name || '',
      email: profileData?.email || '',
      phone: profileData?.phone || '',
      work_location: profileData?.work_location || '',
      bio: profileData?.bio || '',
      specializations: profileData?.specializations || [],
      certifications: profileData?.certifications || [],
      years_experience: profileData?.years_experience || '',
      education: profileData?.education || '',
      hr_focus_areas: profileData?.hr_focus_areas || []
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

  const getTaskCompletionRate = () => {
    if (hrData.totalTasks === 0) return 0;
    return Math.round((hrData.completedTasks / hrData.totalTasks) * 100);
  };

  const handleSaveHRKPIs = async () => {
    try {
      const { error } = await supabase
        .from('monthly_kpi_reports')
        .upsert({
          user_id: profileData?.user_id,
          month: moment(selectedMonth).format('YYYY-MM-01'),
          recruitment_efficiency: hrKPIs.recruitment_efficiency,
          employee_satisfaction: hrKPIs.employee_satisfaction,
          retention_rate: hrKPIs.retention_rate,
          training_completion: hrKPIs.training_completion,
          policy_compliance: hrKPIs.policy_compliance,
          onboarding_success: hrKPIs.onboarding_success,
          performance_reviews: hrKPIs.performance_reviews,
          hr_response_time: hrKPIs.hr_response_time,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      setShowKPIModal(false);
      showToast('HR KPIs updated successfully', 'success');
    } catch (error) {
      console.error('Error saving HR KPIs:', error);
      showToast('Failed to save HR KPIs', 'error');
    }
  };

  const calculateOverallHRScore = (kpis) => {
    const values = Object.values(kpis).filter(val => typeof val === 'number' && val > 0);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  };

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner size="large" showText={true} text="Loading HR profile data..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Completion Alert */}
      {profileCompletion < 85 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-yellow-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Complete Your HR Profile ({profileCompletion}%)
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                A complete profile helps showcase your HR expertise and experience.
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

      {/* HR KPI Dashboard */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">HR KPI Dashboard</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Overall Score: <span className="font-semibold text-blue-600">{calculateOverallHRScore(hrKPIs)}/10</span>
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
            <h3 className="text-sm font-medium text-blue-600 mb-1">Recruitment Efficiency</h3>
            <div className="text-2xl font-bold text-blue-900">{hrKPIs.recruitment_efficiency}/10</div>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${hrKPIs.recruitment_efficiency * 10}%` }}></div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-600 mb-1">Employee Satisfaction</h3>
            <div className="text-2xl font-bold text-green-900">{hrKPIs.employee_satisfaction}/10</div>
            <div className="w-full bg-green-200 rounded-full h-2 mt-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${hrKPIs.employee_satisfaction * 10}%` }}></div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-600 mb-1">Retention Rate</h3>
            <div className="text-2xl font-bold text-purple-900">{hrKPIs.retention_rate}/10</div>
            <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${hrKPIs.retention_rate * 10}%` }}></div>
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-orange-600 mb-1">Training Completion</h3>
            <div className="text-2xl font-bold text-orange-900">{hrKPIs.training_completion}/10</div>
            <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
              <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${hrKPIs.training_completion * 10}%` }}></div>
            </div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-indigo-600 mb-1">Policy Compliance</h3>
            <div className="text-2xl font-bold text-indigo-900">{hrKPIs.policy_compliance}/10</div>
            <div className="w-full bg-indigo-200 rounded-full h-2 mt-2">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${hrKPIs.policy_compliance * 10}%` }}></div>
            </div>
          </div>
          <div className="bg-pink-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-pink-600 mb-1">Onboarding Success</h3>
            <div className="text-2xl font-bold text-pink-900">{hrKPIs.onboarding_success}/10</div>
            <div className="w-full bg-pink-200 rounded-full h-2 mt-2">
              <div className="bg-pink-600 h-2 rounded-full" style={{ width: `${hrKPIs.onboarding_success * 10}%` }}></div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-600 mb-1">Performance Reviews</h3>
            <div className="text-2xl font-bold text-yellow-900">{hrKPIs.performance_reviews}/10</div>
            <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: `${hrKPIs.performance_reviews * 10}%` }}></div>
            </div>
          </div>
          <div className="bg-teal-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-teal-600 mb-1">HR Response Time</h3>
            <div className="text-2xl font-bold text-teal-900">{hrKPIs.hr_response_time}/10</div>
            <div className="w-full bg-teal-200 rounded-full h-2 mt-2">
              <div className="bg-teal-600 h-2 rounded-full" style={{ width: `${hrKPIs.hr_response_time * 10}%` }}></div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Overall HR Score</h3>
              <p className="text-sm text-gray-600">Based on all HR KPI metrics</p>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {calculateOverallHRScore(hrKPIs)}/10
            </div>
          </div>
        </div>
      </div>

      {/* HR Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Employees</h3>
              <div className="text-3xl font-bold">{hrData.activeEmployees || 0}</div>
              <p className="text-blue-100 text-sm">Active employees</p>
            </div>
            <div className="text-4xl opacity-80">👥</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Hires</h3>
              <div className="text-3xl font-bold">{hrData.totalHires || 0}</div>
              <p className="text-green-100 text-sm">This month</p>
            </div>
            <div className="text-4xl opacity-80">🎯</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Interviews</h3>
              <div className="text-3xl font-bold">{hrData.totalInterviews || 0}</div>
              <p className="text-purple-100 text-sm">This month</p>
            </div>
            <div className="text-4xl opacity-80">💬</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Tasks</h3>
              <div className="text-3xl font-bold">{getTaskCompletionRate()}%</div>
              <p className="text-orange-100 text-sm">Completion rate</p>
            </div>
            <div className="text-4xl opacity-80">✅</div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Professional Profile</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
            <div className="text-gray-900">{profileData?.years_experience || 'Not provided'} years</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
            <div className="text-gray-900">{profileData?.education || 'Not provided'}</div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <div className="text-gray-900">{profileData?.bio || 'No bio provided'}</div>
          </div>
        </div>
      </div>

      {/* HR Specializations */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">HR Expertise</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Focus Areas</h3>
            {profileData?.hr_focus_areas && profileData.hr_focus_areas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profileData.hr_focus_areas.map((area, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {area}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No focus areas specified</p>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Specializations</h3>
            {profileData?.specializations && profileData.specializations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profileData.specializations.map((spec, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No specializations listed</p>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Certifications</h3>
            {profileData?.certifications && profileData.certifications.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profileData.certifications.map((cert, index) => (
                  <span
                    key={index}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No certifications listed</p>
            )}
          </div>
        </div>
        
        {(!profileData?.hr_focus_areas || profileData.hr_focus_areas.length === 0) && 
         (!profileData?.specializations || profileData.specializations.length === 0) && 
         (!profileData?.certifications || profileData.certifications.length === 0) && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Expertise Listed</h3>
            <p className="text-gray-600 mb-4">Add your HR specializations and certifications.</p>
            <button
              onClick={handleEditProfile}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Expertise
            </button>
          </div>
        )}
      </div>

      {/* Recent Recruitment Activities */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Recruitment Activities</h2>
        
        {recruitmentData.length > 0 ? (
          <div className="space-y-4">
            {recruitmentData.slice(0, 5).map((activity, index) => (
              <div key={activity.id || index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{activity.position_title}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    activity.status === 'hired' ? 'bg-green-100 text-green-800' :
                    activity.status === 'interviewed' ? 'bg-blue-100 text-blue-800' :
                    activity.status === 'screening' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{activity.candidate_name}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Department: {activity.department}</span>
                  <span>{moment(activity.created_at).format('MMM DD, YYYY')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activities</h3>
            <p className="text-gray-600">Your recruitment activities will appear here.</p>
          </div>
        )}
      </div>

      {/* Employee Management */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Employee Management</h2>
        
        {employeeData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employeeData.slice(0, 10).map((employee, index) => (
                  <tr key={employee.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {(employee.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.role || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.department || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        employee.status === 'active' ? 'bg-green-100 text-green-800' :
                        employee.status === 'inactive' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {moment(employee.created_at).format('MMM DD, YYYY')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Employees Assigned</h3>
            <p className="text-gray-600">Employees under your management will appear here.</p>
          </div>
        )}
      </div>

      {/* Monthly HR Metrics */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Monthly HR Metrics</h2>
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
            <h3 className="text-sm font-medium text-blue-600 mb-1">Tasks</h3>
            <div className="text-2xl font-bold text-blue-900">
              {monthlyData.filter(item => 
                moment(item.created_at).format('YYYY-MM') === selectedMonth
              ).length}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-600 mb-1">Completed</h3>
            <div className="text-2xl font-bold text-green-900">
              {monthlyData.filter(item => 
                moment(item.created_at).format('YYYY-MM') === selectedMonth && 
                item.status === 'completed'
              ).length}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-600 mb-1">Hires</h3>
            <div className="text-2xl font-bold text-purple-900">
              {recruitmentData.filter(item => 
                moment(item.created_at).format('YYYY-MM') === selectedMonth && 
                item.status === 'hired'
              ).length}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-orange-600 mb-1">Interviews</h3>
            <div className="text-2xl font-bold text-orange-900">
              {recruitmentData.filter(item => 
                moment(item.created_at).format('YYYY-MM') === selectedMonth && 
                item.status === 'interviewed'
              ).length}
            </div>
          </div>
        </div>
      </div>

      {/* HR KPI Modal */}
      {showKPIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Update HR KPIs - {moment(selectedMonth).format('MMMM YYYY')}</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Recruitment Efficiency (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={hrKPIs.recruitment_efficiency}
                  onChange={(e) => setHrKPIs(prev => ({ ...prev, recruitment_efficiency: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee Satisfaction (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={hrKPIs.employee_satisfaction}
                  onChange={(e) => setHrKPIs(prev => ({ ...prev, employee_satisfaction: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Retention Rate (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={hrKPIs.retention_rate}
                  onChange={(e) => setHrKPIs(prev => ({ ...prev, retention_rate: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Training Completion (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={hrKPIs.training_completion}
                  onChange={(e) => setHrKPIs(prev => ({ ...prev, training_completion: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Policy Compliance (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={hrKPIs.policy_compliance}
                  onChange={(e) => setHrKPIs(prev => ({ ...prev, policy_compliance: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Onboarding Success (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={hrKPIs.onboarding_success}
                  onChange={(e) => setHrKPIs(prev => ({ ...prev, onboarding_success: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Performance Reviews (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={hrKPIs.performance_reviews}
                  onChange={(e) => setHrKPIs(prev => ({ ...prev, performance_reviews: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">HR Response Time (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={hrKPIs.hr_response_time}
                  onChange={(e) => setHrKPIs(prev => ({ ...prev, hr_response_time: parseInt(e.target.value) || 0 }))}
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
                onClick={handleSaveHRKPIs}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
              <h3 className="text-xl font-semibold text-gray-900">Edit HR Profile</h3>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    value={editFormData.years_experience || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, years_experience: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                <input
                  type="text"
                  value={editFormData.education || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, education: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., MBA in Human Resources, Bachelor's in Psychology"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={editFormData.bio || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about your HR experience and approach..."
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

export default HRProfile;