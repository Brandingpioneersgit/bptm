import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import moment from 'moment';

const EmployeeProfile = ({ 
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
  
  const [performanceData, setPerformanceData] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState([]);
  
  // Monthly KPI reporting state
  const [currentMonthData, setCurrentMonthData] = useState(null);
  const [showKPIForm, setShowKPIForm] = useState(false);
  const [kpiFormData, setKpiFormData] = useState({
    // Client Management KPIs
    client_satisfaction_score: '',
    meetings_with_clients: '',
    whatsapp_messages_sent: '',
    client_issues_resolved: '',
    
    // Work Performance KPIs
    tasks_completed: '',
    projects_delivered: '',
    quality_score: '',
    deadline_adherence: '',
    
    // Learning & Growth KPIs
    learning_hours: '',
    courses_completed: '',
    skills_acquired: '',
    certifications_earned: '',
    
    // Attendance & Engagement KPIs
    attendance_wfo: '',
    attendance_wfh: '',
    meeting_attendance: '',
    punctuality_score: '',
    
    // Additional Notes
    achievements: '',
    challenges_faced: '',
    improvement_areas: '',
    next_month_goals: ''
  });
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [showGrowthReport, setShowGrowthReport] = useState(false);
  const [growthReportData, setGrowthReportData] = useState(null);

  // Helper function to calculate overall score from KPI data
  const calculateOverallScore = (report) => {
    if (!report) return 0;
    
    const scores = [
      report.client_satisfaction_score,
      report.quality_score,
      report.deadline_adherence,
      report.punctuality_score
    ].filter(score => score && !isNaN(score));
    
    return scores.length > 0 ? scores.reduce((sum, score) => sum + parseFloat(score), 0) / scores.length : 0;
  };

  // Fetch performance and goal data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!profileData?.user_id) return;
      
      try {
        setLoading(true);
        
        // Fetch monthly KPI reports
        const { data: kpiReports, error: kpiError } = await supabase
          .from('monthly_kpi_reports')
          .select('*')
          .eq('employee_id', profileData.user_id)
          .order('month_year', { ascending: false });
          
        if (kpiError && kpiError.code !== 'PGRST116') {
          console.error('Error fetching KPI reports:', kpiError);
        }
        
        setMonthlyReports(kpiReports || []);
        
        // Get current month data
        const currentMonth = moment().format('YYYY-MM');
        const currentMonthReport = kpiReports?.find(report => report.month_year === currentMonth);
        setCurrentMonthData(currentMonthReport);
        
        if (currentMonthReport) {
          setKpiFormData({
            client_satisfaction_score: currentMonthReport.client_satisfaction_score || '',
            meetings_with_clients: currentMonthReport.meetings_with_clients || '',
            whatsapp_messages_sent: currentMonthReport.whatsapp_messages_sent || '',
            client_issues_resolved: currentMonthReport.client_issues_resolved || '',
            tasks_completed: currentMonthReport.tasks_completed || '',
            projects_delivered: currentMonthReport.projects_delivered || '',
            quality_score: currentMonthReport.quality_score || '',
            deadline_adherence: currentMonthReport.deadline_adherence || '',
            learning_hours: currentMonthReport.learning_hours || '',
            courses_completed: currentMonthReport.courses_completed || '',
            skills_acquired: currentMonthReport.skills_acquired || '',
            certifications_earned: currentMonthReport.certifications_earned || '',
            attendance_wfo: currentMonthReport.attendance_wfo || '',
            attendance_wfh: currentMonthReport.attendance_wfh || '',
            meeting_attendance: currentMonthReport.meeting_attendance || '',
            punctuality_score: currentMonthReport.punctuality_score || '',
            achievements: currentMonthReport.achievements || '',
            challenges_faced: currentMonthReport.challenges_faced || '',
            improvement_areas: currentMonthReport.improvement_areas || '',
            next_month_goals: currentMonthReport.next_month_goals || ''
          });
        }
        
        // Calculate performance trends from KPI data
        if (kpiReports && kpiReports.length > 0) {
          const currentReport = kpiReports[0];
          const previousReport = kpiReports[1];
          
          const currentScore = calculateOverallScore(currentReport);
          const previousScore = previousReport ? calculateOverallScore(previousReport) : currentScore;
          const trend = currentScore - previousScore;
          
          setPerformanceData({
            currentMonth: Math.round(currentScore),
            trend: Math.round(trend * 10) / 10,
            currentMonthSubmissions: kpiReports.length,
            bestScore: Math.round(Math.max(...kpiReports.map(report => calculateOverallScore(report))))
          });
        } else {
          // Fallback to monthly data if no KPI reports
          const currentMonthData = monthlyData.filter(item => 
            moment(item.created_at).format('YYYY-MM') === moment().format('YYYY-MM')
          );
          
          const lastMonthData = monthlyData.filter(item => 
            moment(item.created_at).format('YYYY-MM') === moment().subtract(1, 'month').format('YYYY-MM')
          );
          
          const avgCurrentMonth = currentMonthData.length > 0 
            ? Math.round(currentMonthData.reduce((sum, item) => sum + (item.performance_score || 0), 0) / currentMonthData.length)
            : 0;
            
          const avgLastMonth = lastMonthData.length > 0 
            ? Math.round(lastMonthData.reduce((sum, item) => sum + (item.performance_score || 0), 0) / lastMonthData.length)
            : 0;
          
          setPerformanceData({
            currentMonth: avgCurrentMonth,
            lastMonth: avgLastMonth,
            trend: avgCurrentMonth - avgLastMonth,
            totalSubmissions: monthlyData.length,
            currentMonthSubmissions: currentMonthData.length,
            bestScore: Math.max(...monthlyData.map(item => item.performance_score || 0), 0)
          });
        }
        
        // Fetch employee goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('employee_goals')
          .select('*')
          .eq('user_id', profileData?.user_id)
          .order('created_at', { ascending: false });
          
        if (goalsError && goalsError.code !== 'PGRST116') {
          console.error('Error fetching goals:', goalsError);
        }
        
        setGoals(goalsData || []);
        
      } catch (error) {
        console.error('Error fetching employee data:', error);
        showToast('Failed to load performance data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployeeData();
  }, [supabase, showToast, monthlyData, profileData?.user_id, selectedMonth]);

  // Handle KPI form submission
  const handleKPISubmit = async () => {
    try {
      setLoading(true);
      
      const monthYear = moment().format('YYYY-MM');
      const overallScore = calculateOverallScore(kpiFormData);
      
      const kpiData = {
        employee_id: profileData.user_id,
        employee_name: profileData.name,
        employee_phone: profileData.phone,
        department: profileData.department,
        role: profileData.role,
        month_year: monthYear,
        ...kpiFormData,
        overall_score: overallScore,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('monthly_kpi_reports')
        .upsert(kpiData, { 
          onConflict: 'employee_id,month_year',
          ignoreDuplicates: false 
        });
        
      if (error) throw error;
      
      showToast('Monthly KPI report saved successfully!', 'success');
      setShowKPIForm(false);
      
      // Refresh data
      const { data: updatedReports } = await supabase
        .from('monthly_kpi_reports')
        .select('*')
        .eq('employee_id', profileData.user_id)
        .order('month_year', { ascending: false });
        
      setMonthlyReports(updatedReports || []);
      setCurrentMonthData(updatedReports?.find(report => report.month_year === monthYear));
      
    } catch (error) {
      console.error('Error saving KPI data:', error);
      showToast('Failed to save KPI report', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Generate growth report
  const generateGrowthReport = () => {
    if (monthlyReports.length < 2) {
      showToast('Need at least 2 months of data to generate growth report', 'warning');
      return;
    }
    
    const last6Months = monthlyReports.slice(0, 6);
    const averageScore = last6Months.reduce((sum, report) => sum + calculateOverallScore(report), 0) / last6Months.length;
    
    const growthData = {
      averageScore: Math.round(averageScore * 10) / 10,
      totalReports: monthlyReports.length,
      improvementTrend: calculateImprovementTrend(last6Months),
      strongAreas: identifyStrongAreas(last6Months),
      improvementAreas: identifyImprovementAreas(last6Months)
    };
    
    return growthData;
  };
  
  const calculateImprovementTrend = (reports) => {
    if (reports.length < 2) return 'stable';
    
    const recent = reports.slice(0, 3);
    const older = reports.slice(3, 6);
    
    const recentAvg = recent.reduce((sum, report) => sum + calculateOverallScore(report), 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, report) => sum + calculateOverallScore(report), 0) / older.length : recentAvg;
    
    const improvement = recentAvg - olderAvg;
    
    if (improvement > 5) return 'improving';
    if (improvement < -5) return 'declining';
    return 'stable';
  };
  
  const identifyStrongAreas = (reports) => {
    const areas = ['client_satisfaction_score', 'quality_score', 'deadline_adherence', 'punctuality_score'];
    const averages = areas.map(area => ({
      area,
      average: reports.reduce((sum, report) => sum + (parseFloat(report[area]) || 0), 0) / reports.length
    }));
    
    return averages.filter(item => item.average >= 8).map(item => item.area);
  };
  
  const identifyImprovementAreas = (reports) => {
    const areas = ['client_satisfaction_score', 'quality_score', 'deadline_adherence', 'punctuality_score'];
    const averages = areas.map(area => ({
      area,
      average: reports.reduce((sum, report) => sum + (parseFloat(report[area]) || 0), 0) / reports.length
    }));
    
    return averages.filter(item => item.average < 7).map(item => item.area);
  };

  const handleEditProfile = () => {
    // Navigate to profile edit page instead of showing modal
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

  const getPerformanceTrendIcon = () => {
    if (performanceData.trend > 0) return '📈';
    if (performanceData.trend < 0) return '📉';
    return '➡️';
  };

  const getPerformanceTrendColor = () => {
    if (performanceData.trend > 0) return 'text-green-600';
    if (performanceData.trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Month Selection and Actions */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monthly KPI Dashboard</h1>
            <p className="text-gray-600">Track your performance and growth month by month</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <button
              onClick={() => setShowKPIForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {currentMonthData ? 'Update KPIs' : 'Add KPIs'}
            </button>
            <button
              onClick={() => setShowGrowthReport(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              disabled={monthlyReports.length < 2}
            >
              Growth Report
            </button>
          </div>
        </div>
      </div>

      {/* Current Month Status */}
      {!currentMonthData && moment().format('YYYY-MM') === selectedMonth && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-orange-600 mr-3">📊</div>
            <div>
              <h3 className="text-sm font-medium text-orange-800">
                No KPI Data for {moment(selectedMonth).format('MMMM YYYY')}
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                Start tracking your monthly performance by adding your KPI data.
              </p>
            </div>
            <button
              onClick={() => setShowKPIForm(true)}
              className="ml-auto bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors"
            >
              Add KPIs Now
            </button>
          </div>
        </div>
      )}

      {/* KPI Performance Overview */}
      {currentMonthData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Score</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(calculateOverallScore(currentMonthData))}%</p>
              </div>
              <div className="text-blue-600">
                📊
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Client Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">{currentMonthData.client_satisfaction_score || 0}/10</p>
              </div>
              <div className="text-green-600">
                😊
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Quality Score</p>
                <p className="text-2xl font-bold text-gray-900">{currentMonthData.quality_score || 0}%</p>
              </div>
              <div className="text-purple-600">
                ⭐
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Punctuality</p>
                <p className="text-2xl font-bold text-gray-900">{currentMonthData.punctuality_score || 0}%</p>
              </div>
              <div className="text-yellow-600">
                ⏰
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed KPI Breakdown */}
      {currentMonthData && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">KPI Breakdown - {moment(selectedMonth).format('MMMM YYYY')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Client Management</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Meetings with Clients:</span>
                  <span className="font-medium">{currentMonthData.meetings_with_clients || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">WhatsApp Messages:</span>
                  <span className="font-medium">{currentMonthData.whatsapp_messages_sent || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Issues Resolved:</span>
                  <span className="font-medium">{currentMonthData.client_issues_resolved || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Work Performance</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tasks Completed:</span>
                  <span className="font-medium">{currentMonthData.tasks_completed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Projects Delivered:</span>
                  <span className="font-medium">{currentMonthData.projects_delivered || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deadline Adherence:</span>
                  <span className="font-medium">{currentMonthData.deadline_adherence || 0}%</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Learning & Growth</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Learning Hours:</span>
                  <span className="font-medium">{currentMonthData.learning_hours || 0}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Courses Completed:</span>
                  <span className="font-medium">{currentMonthData.courses_completed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Certifications:</span>
                  <span className="font-medium">{currentMonthData.certifications_earned || 0}</span>
                </div>
              </div>
            </div>
          </div>
          
          {(currentMonthData.achievements || currentMonthData.challenges_faced) && (
            <div className="mt-6 pt-4 border-t">
              {currentMonthData.achievements && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Achievements</h4>
                  <p className="text-sm text-gray-600">{currentMonthData.achievements}</p>
                </div>
              )}
              {currentMonthData.challenges_faced && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Challenges Faced</h4>
                  <p className="text-sm text-gray-600">{currentMonthData.challenges_faced}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Growth Report Modal */}
      {showGrowthReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Growth Report</h2>
                <button
                  onClick={() => setShowGrowthReport(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {(() => {
                const growthData = generateGrowthReport();
                if (!growthData) {
                  return (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-4">📊</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Insufficient Data</h3>
                      <p className="text-gray-600">Need at least 2 months of KPI data to generate a growth report.</p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-6">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-600 mb-1">Average Score</h3>
                        <div className="text-2xl font-bold text-blue-900">{growthData.averageScore}%</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-green-600 mb-1">Total Reports</h3>
                        <div className="text-2xl font-bold text-green-900">{growthData.totalReports}</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-purple-600 mb-1">Trend</h3>
                        <div className="text-2xl font-bold text-purple-900 capitalize">{growthData.improvementTrend}</div>
                      </div>
                    </div>
                    
                    {/* Strong Areas */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 mb-3">Strong Areas (8+ Average)</h3>
                      {growthData.strongAreas.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {growthData.strongAreas.map((area, index) => (
                            <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                              {area.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-green-700">Keep working to achieve strong performance in key areas!</p>
                      )}
                    </div>
                    
                    {/* Improvement Areas */}
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h3 className="font-semibold text-orange-800 mb-3">Areas for Improvement (Below 7)</h3>
                      {growthData.improvementAreas.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {growthData.improvementAreas.map((area, index) => (
                            <span key={index} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                              {area.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-orange-700">Great job! All areas are performing well.</p>
                      )}
                    </div>
                    
                    {/* Performance Timeline */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Recent Performance Timeline</h3>
                      <div className="space-y-2">
                        {monthlyReports.slice(0, 6).map((report, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                            <span className="text-sm text-gray-600">{moment(report.month_year).format('MMMM YYYY')}</span>
                            <span className="text-sm font-medium text-gray-900">{Math.round(calculateOverallScore(report))}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowGrowthReport(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Data Entry Form Modal */}
      {showKPIForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {currentMonthData ? 'Update' : 'Add'} KPI Data - {moment(selectedMonth).format('MMMM YYYY')}
                </h2>
                <button
                  onClick={() => setShowKPIForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleKPISubmit} className="space-y-6">
                {/* Client Management Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Client Management KPIs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meetings with Clients
                      </label>
                      <input
                        type="number"
                        value={kpiFormData.meetings_with_clients}
                        onChange={(e) => setKpiFormData({...kpiFormData, meetings_with_clients: parseInt(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        WhatsApp Messages Sent
                      </label>
                      <input
                        type="number"
                        value={kpiFormData.whatsapp_messages_sent}
                        onChange={(e) => setKpiFormData({...kpiFormData, whatsapp_messages_sent: parseInt(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client Issues Resolved
                      </label>
                      <input
                        type="number"
                        value={kpiFormData.client_issues_resolved}
                        onChange={(e) => setKpiFormData({...kpiFormData, client_issues_resolved: parseInt(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client Satisfaction Score (1-10)
                      </label>
                      <input
                        type="number"
                        value={kpiFormData.client_satisfaction_score}
                        onChange={(e) => setKpiFormData({...kpiFormData, client_satisfaction_score: parseInt(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>
                </div>

                {/* Work Performance Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Work Performance KPIs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tasks Completed
                      </label>
                      <input
                        type="number"
                        value={kpiFormData.tasks_completed}
                        onChange={(e) => setKpiFormData({...kpiFormData, tasks_completed: parseInt(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Projects Delivered
                      </label>
                      <input
                        type="number"
                        value={kpiFormData.projects_delivered}
                        onChange={(e) => setKpiFormData({...kpiFormData, projects_delivered: parseInt(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quality Score (%)
                      </label>
                      <input
                        type="number"
                        value={kpiFormData.quality_score}
                        onChange={(e) => setKpiFormData({...kpiFormData, quality_score: parseInt(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Deadline Adherence (%)
                      </label>
                      <input
                        type="number"
                        value={kpiFormData.deadline_adherence}
                        onChange={(e) => setKpiFormData({...kpiFormData, deadline_adherence: parseInt(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>

                {/* Learning & Growth Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Learning & Growth KPIs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Learning Hours
                      </label>
                      <input
                        type="number"
                        value={kpiFormData.learning_hours}
                        onChange={(e) => setKpiFormData({...kpiFormData, learning_hours: parseInt(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Courses Completed
                      </label>
                      <input
                        type="number"
                        value={kpiFormData.courses_completed}
                        onChange={(e) => setKpiFormData({...kpiFormData, courses_completed: parseInt(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Certifications Earned
                      </label>
                      <input
                        type="number"
                        value={kpiFormData.certifications_earned}
                        onChange={(e) => setKpiFormData({...kpiFormData, certifications_earned: parseInt(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Punctuality Score (%)
                      </label>
                      <input
                        type="number"
                        value={kpiFormData.punctuality_score}
                        onChange={(e) => setKpiFormData({...kpiFormData, punctuality_score: parseInt(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Additional Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Key Achievements This Month
                      </label>
                      <textarea
                        value={kpiFormData.achievements}
                        onChange={(e) => setKpiFormData({...kpiFormData, achievements: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                        placeholder="Describe your key achievements and successes this month..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Challenges Faced
                      </label>
                      <textarea
                        value={kpiFormData.challenges_faced}
                        onChange={(e) => setKpiFormData({...kpiFormData, challenges_faced: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                        placeholder="Describe any challenges or obstacles you faced this month..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowKPIForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {currentMonthData ? 'Update' : 'Save'} KPI Data
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-white rounded-xl border p-6">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="text-gray-900">{profileData?.role || 'Not provided'}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <div className="text-gray-900">{profileData?.department || 'Not provided'}</div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <div className="text-gray-900">{profileData?.bio || 'No bio provided'}</div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Career Goals</label>
            <div className="text-gray-900">{profileData?.career_goals || 'No career goals specified'}</div>
          </div>
        </div>
      </div>

      {/* Skills & Expertise */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Skills & Expertise</h2>
        
        {profileData?.skills && profileData.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profileData.skills.map((skill, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">🎯</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Skills Listed</h3>
            <p className="text-gray-600 mb-4">Add your skills to showcase your expertise.</p>
            <button
              onClick={handleEditProfile}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Skills
            </button>
          </div>
        )}
      </div>

      {/* Monthly KPI Reports */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Monthly KPI Reports</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {monthlyReports.slice(0, 4).map((report, index) => {
            const overallScore = calculateOverallScore(report);
            return (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                <h3 className="text-sm font-medium text-blue-600 mb-1">
                  {moment(report.month_year).format('MMM YYYY')}
                </h3>
                <div className="text-2xl font-bold text-blue-900 mb-2">
                  {Math.round(overallScore)}%
                </div>
                <div className="text-xs text-blue-600">
                  <div>Client Sat: {report.client_satisfaction_score || 0}/10</div>
                  <div>Quality: {report.quality_score || 0}%</div>
                  <div>Tasks: {report.tasks_completed || 0}</div>
                </div>
              </div>
            );
          })}
        </div>
        
        {monthlyReports.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No KPI Reports Yet</h3>
            <p className="text-gray-600">Start adding your monthly KPI data to track your performance over time.</p>
          </div>
        )}
      </div>

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
                <label className="block text-sm font-medium text-gray-700 mb-1">Interests</label>
                <input
                  type="text"
                  value={editFormData.interests || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, interests: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Photography, Travel, Technology"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Career Goals</label>
                <textarea
                  value={editFormData.career_goals || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, career_goals: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What are your career aspirations?"
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

export default EmployeeProfile;