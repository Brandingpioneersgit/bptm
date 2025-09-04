import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import moment from 'moment';
import { exportReport, reportUtils } from '../utils/reportGenerator';

/**
 * GrowthReportGenerator - Automated growth report generation and monthly scoring system
 * Features:
 * - Automated growth report generation based on KPI data
 * - Monthly scoring system with trend analysis
 * - Role-specific performance insights
 * - Comparative analysis across time periods
 * - Export functionality for reports
 */
const GrowthReportGenerator = () => {
  const { authState } = useUnifiedAuth();
  const { supabase } = useSupabase();
  const { notify } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [reportType, setReportType] = useState('individual'); // 'individual', 'team', 'department'
  const [selectedUser, setSelectedUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  
  useEffect(() => {
    if (authState.user?.id) {
      setSelectedUser(authState.user);
      fetchTeamMembers();
    }
  }, [authState.user]);
  
  // Fetch team members for team reports
  const fetchTeamMembers = async () => {
    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .eq('department', authState.user?.department)
        .neq('user_id', authState.user?.id);
        
      if (error) throw error;
      setTeamMembers(employees || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };
  
  // Generate comprehensive growth report
  const generateGrowthReport = async () => {
    if (!selectedUser) {
      notify({ type: 'error', title: 'Error', message: 'Please select a user for the report' });
      return;
    }
    
    setLoading(true);
    
    try {
      const periodMonths = getPeriodMonths(selectedPeriod);
      const kpiData = await fetchKPIData(selectedUser.user_id, periodMonths);
      const monthlyData = await fetchMonthlyData(selectedUser.user_id, periodMonths);
      
      const report = {
        user: selectedUser,
        period: selectedPeriod,
        generatedAt: new Date().toISOString(),
        summary: calculateSummaryMetrics(kpiData, monthlyData),
        trends: calculateTrends(kpiData),
        insights: generateInsights(kpiData, selectedUser.role),
        recommendations: generateRecommendations(kpiData, selectedUser.role),
        monthlyBreakdown: generateMonthlyBreakdown(kpiData, monthlyData),
        comparativeAnalysis: generateComparativeAnalysis(kpiData),
        goalTracking: calculateGoalProgress(kpiData, selectedUser.role)
      };
      
      setReportData(report);
      
      // Save report to database
      await saveReportToDatabase(report);
      
      notify({ type: 'success', title: 'Success', message: 'Growth report generated successfully' });
      
    } catch (error) {
      console.error('Error generating growth report:', error);
      notify({ type: 'error', title: 'Error', message: 'Failed to generate growth report' });
    } finally {
      setLoading(false);
    }
  };
  
  // Get period months based on selection
  const getPeriodMonths = (period) => {
    const months = [];
    let count = 0;
    
    switch (period) {
      case '3months':
        count = 3;
        break;
      case '6months':
        count = 6;
        break;
      case '12months':
        count = 12;
        break;
      default:
        count = 6;
    }
    
    for (let i = 0; i < count; i++) {
      months.push(moment().subtract(i, 'months').format('YYYY-MM'));
    }
    
    return months;
  };
  
  // Fetch KPI data for the specified period
  const fetchKPIData = async (userId, months) => {
    const role = selectedUser.role;
    let kpiTable = '';
    
    switch (role) {
      case 'Super Admin':
        kpiTable = 'superadmin_kpis';
        break;
      case 'HR':
        kpiTable = 'hr_kpis';
        break;
      case 'Operations Head':
        kpiTable = 'operations_head_kpis';
        break;

      case 'Intern':
        kpiTable = 'intern_kpis';
        break;
      case 'Freelancer':
        kpiTable = 'freelancer_kpis';
        break;
      default:
        kpiTable = 'employee_kpis';
    }
    
    const { data, error } = await supabase
      .from(kpiTable)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  };
  
  // Fetch monthly submission data
  const fetchMonthlyData = async (userId, months) => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  };
  
  // Calculate summary metrics
  const calculateSummaryMetrics = (kpiData, monthlyData) => {
    if (!kpiData.length) return null;
    
    const latestKPI = kpiData[0];
    const previousKPI = kpiData[1];
    
    // Calculate overall score based on role
    const currentScore = calculateOverallScore(latestKPI, selectedUser.role);
    const previousScore = previousKPI ? calculateOverallScore(previousKPI, selectedUser.role) : currentScore;
    
    return {
      currentScore: Math.round(currentScore),
      previousScore: Math.round(previousScore),
      improvement: Math.round((currentScore - previousScore) * 10) / 10,
      improvementPercentage: previousScore > 0 ? Math.round(((currentScore - previousScore) / previousScore) * 100) : 0,
      totalDataPoints: kpiData.length,
      averageScore: Math.round(kpiData.reduce((sum, kpi) => sum + calculateOverallScore(kpi, selectedUser.role), 0) / kpiData.length),
      bestScore: Math.round(Math.max(...kpiData.map(kpi => calculateOverallScore(kpi, selectedUser.role)))),
      consistency: calculateConsistency(kpiData)
    };
  };
  
  // Calculate overall score based on role
  const calculateOverallScore = (kpiData, role) => {
    if (!kpiData) return 0;
    
    switch (role) {
      case 'Intern':
        return (
          (kpiData.skill_development || 0) +
          (kpiData.learning_hours || 0) +
          (kpiData.goal_completion || 0) +
          (kpiData.mentor_rating || 0) +
          (kpiData.project_quality || 0) +
          (kpiData.technical_growth || 0) +
          (kpiData.soft_skills || 0) +
          (kpiData.initiative_score || 0)
        ) / 8;
      case 'Freelancer':
        return (
          (kpiData.client_satisfaction || 0) +
          (kpiData.project_delivery || 0) +
          (kpiData.quality_score || 0) +
          (kpiData.communication_rating || 0) +
          (kpiData.deadline_adherence || 0) +
          (kpiData.technical_skills || 0) +
          (kpiData.creativity_score || 0) +
          (kpiData.earnings_growth || 0)
        ) / 8;
      default:
        return (
          (kpiData.client_satisfaction || 0) +
          (kpiData.attendance || 0) +
          (kpiData.punctuality_score || 0) +
          (kpiData.team_collaboration || 0) +
          (kpiData.initiative_score || 0) +
          (kpiData.productivity_score || 0)
        ) / 6;
    }
  };
  
  // Calculate trends
  const calculateTrends = (kpiData) => {
    if (kpiData.length < 2) return null;
    
    const trends = {};
    const metrics = Object.keys(kpiData[0]).filter(key => 
      !['id', 'user_id', 'created_at', 'updated_at'].includes(key) && 
      typeof kpiData[0][key] === 'number'
    );
    
    metrics.forEach(metric => {
      const values = kpiData.map(kpi => kpi[metric] || 0).reverse();
      const trend = calculateLinearTrend(values);
      
      trends[metric] = {
        direction: trend > 0 ? 'upward' : trend < 0 ? 'downward' : 'stable',
        slope: Math.round(trend * 100) / 100,
        current: values[values.length - 1],
        previous: values[values.length - 2] || 0,
        change: values[values.length - 1] - (values[values.length - 2] || 0)
      };
    });
    
    return trends;
  };
  
  // Calculate linear trend
  const calculateLinearTrend = (values) => {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  };
  
  // Generate insights based on role and data
  const generateInsights = (kpiData, role) => {
    const insights = [];
    
    if (!kpiData.length) return insights;
    
    const latestKPI = kpiData[0];
    const trends = calculateTrends(kpiData);
    
    // Role-specific insights
    switch (role) {
      case 'Intern':
        if (latestKPI.learning_hours > 80) {
          insights.push({ type: 'positive', message: 'Excellent learning commitment with high learning hours' });
        }
        if (trends?.skill_development?.direction === 'upward') {
          insights.push({ type: 'positive', message: 'Consistent skill development growth trend' });
        }
        if (latestKPI.mentor_rating < 60) {
          insights.push({ type: 'warning', message: 'Mentor rating needs improvement - consider more engagement' });
        }
        break;
      case 'Freelancer':
        if (latestKPI.client_satisfaction > 85) {
          insights.push({ type: 'positive', message: 'Outstanding client satisfaction scores' });
        }
        if (trends?.earnings_growth?.direction === 'upward') {
          insights.push({ type: 'positive', message: 'Strong earnings growth trajectory' });
        }
        if (latestKPI.deadline_adherence < 70) {
          insights.push({ type: 'warning', message: 'Deadline adherence needs attention for better client relationships' });
        }
        break;
      default:
        if (latestKPI.team_collaboration > 80) {
          insights.push({ type: 'positive', message: 'Strong team collaboration skills' });
        }
        if (trends?.productivity_score?.direction === 'downward') {
          insights.push({ type: 'warning', message: 'Productivity showing declining trend - may need support' });
        }
    }
    
    return insights;
  };
  
  // Generate recommendations
  const generateRecommendations = (kpiData, role) => {
    const recommendations = [];
    
    if (!kpiData.length) return recommendations;
    
    const latestKPI = kpiData[0];
    const trends = calculateTrends(kpiData);
    
    // Role-specific recommendations
    switch (role) {
      case 'Intern':
        if (latestKPI.technical_growth < 70) {
          recommendations.push('Focus on technical skill development through additional courses or projects');
        }
        if (latestKPI.soft_skills < 75) {
          recommendations.push('Participate in team activities to improve soft skills and communication');
        }
        break;
      case 'Freelancer':
        if (latestKPI.project_delivery < 80) {
          recommendations.push('Implement better project management practices to improve delivery scores');
        }
        if (latestKPI.creativity_score < 75) {
          recommendations.push('Explore creative workshops or design thinking sessions');
        }
        break;
      default:
        if (latestKPI.client_satisfaction < 75) {
          recommendations.push('Schedule regular client check-ins to improve satisfaction scores');
        }
        if (latestKPI.initiative_score < 70) {
          recommendations.push('Take on more proactive tasks and suggest process improvements');
        }
    }
    
    return recommendations;
  };
  
  // Generate monthly breakdown
  const generateMonthlyBreakdown = (kpiData, monthlyData) => {
    const breakdown = [];
    
    kpiData.forEach(kpi => {
      const month = moment(kpi.created_at).format('YYYY-MM');
      const monthlySubmission = monthlyData.find(data => 
        moment(data.created_at).format('YYYY-MM') === month
      );
      
      breakdown.push({
        month: month,
        monthName: moment(month).format('MMMM YYYY'),
        overallScore: Math.round(calculateOverallScore(kpi, selectedUser.role)),
        kpiData: kpi,
        submissionData: monthlySubmission,
        hasSubmission: !!monthlySubmission
      });
    });
    
    return breakdown.sort((a, b) => moment(b.month).diff(moment(a.month)));
  };
  
  // Generate comparative analysis
  const generateComparativeAnalysis = (kpiData) => {
    if (kpiData.length < 2) return null;
    
    const latest = kpiData[0];
    const previous = kpiData[1];
    const comparison = {};
    
    Object.keys(latest).forEach(key => {
      if (!['id', 'user_id', 'created_at', 'updated_at'].includes(key) && typeof latest[key] === 'number') {
        comparison[key] = {
          current: latest[key] || 0,
          previous: previous[key] || 0,
          change: (latest[key] || 0) - (previous[key] || 0),
          changePercentage: previous[key] > 0 ? Math.round(((latest[key] - previous[key]) / previous[key]) * 100) : 0
        };
      }
    });
    
    return comparison;
  };
  
  // Calculate goal progress
  const calculateGoalProgress = (kpiData, role) => {
    if (!kpiData.length) return null;
    
    const latestKPI = kpiData[0];
    const goals = getRoleSpecificGoals(role);
    const progress = {};
    
    Object.keys(goals).forEach(metric => {
      const currentValue = latestKPI[metric] || 0;
      const targetValue = goals[metric];
      
      progress[metric] = {
        current: currentValue,
        target: targetValue,
        progress: Math.min(Math.round((currentValue / targetValue) * 100), 100),
        achieved: currentValue >= targetValue
      };
    });
    
    return progress;
  };
  
  // Get role-specific goals
  const getRoleSpecificGoals = (role) => {
    switch (role) {
      case 'Intern':
        return {
          skill_development: 80,
          learning_hours: 75,
          goal_completion: 85,
          mentor_rating: 80,
          technical_growth: 75
        };
      case 'Freelancer':
        return {
          client_satisfaction: 85,
          project_delivery: 80,
          quality_score: 85,
          deadline_adherence: 90,
          earnings_growth: 70
        };
      default:
        return {
          client_satisfaction: 80,
          attendance: 90,
          punctuality_score: 85,
          team_collaboration: 80,
          productivity_score: 75
        };
    }
  };
  
  // Calculate consistency score
  const calculateConsistency = (kpiData) => {
    if (kpiData.length < 3) return 100;
    
    const scores = kpiData.map(kpi => calculateOverallScore(kpi, selectedUser.role));
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to consistency score (lower deviation = higher consistency)
    return Math.max(0, Math.round(100 - (standardDeviation * 2)));
  };
  
  // Save report to database
  const saveReportToDatabase = async (report) => {
    try {
      const { error } = await supabase
        .from('growth_reports')
        .insert({
          user_id: report.user.user_id,
          report_type: reportType,
          period: selectedPeriod,
          report_data: report,
          generated_by: authState.user.id,
          created_at: new Date().toISOString()
        });
        
      if (error) throw error;
    } catch (error) {
      console.error('Error saving report to database:', error);
    }
  };
  
  // Export report
  const handleExportReport = async (format) => {
    if (!reportData) return;
    
    try {
      const filename = reportUtils.generateFilename(`growth-report-${reportData.user.name}`);
      const result = await exportReport(reportData, format, 'monthlyReport', filename);
      
      if (result.success) {
        notify(result.message, 'success');
      } else {
        notify(result.message, 'error');
      }
    } catch (error) {
      console.error('Export error:', error);
      notify('Failed to export report', 'error');
    }
    
    setShowExportModal(false);
  };
  
  // Legacy functions removed - now using reportGenerator utility
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Growth Report Generator</h1>
        <p className="text-gray-600">Generate comprehensive growth reports and performance analytics</p>
      </div>
      
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="individual">Individual Report</option>
              <option value="team">Team Report</option>
              <option value="department">Department Report</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
            <select
              value={selectedUser?.user_id || ''}
              onChange={(e) => {
                const user = e.target.value === authState.user.id 
                  ? authState.user 
                  : teamMembers.find(member => member.user_id === e.target.value);
                setSelectedUser(user);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={authState.user?.id}>{authState.user?.name} (Me)</option>
              {teamMembers.map(member => (
                <option key={member.user_id} value={member.user_id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generateGrowthReport}
              disabled={loading || !selectedUser}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Report Display */}
      {reportData && (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">{reportData.user.name} - Growth Report</h2>
                <p className="text-blue-100">Role: {reportData.user.role} | Period: {selectedPeriod} | Generated: {moment(reportData.generatedAt).format('MMMM DD, YYYY')}</p>
              </div>
              <button
                onClick={() => setShowExportModal(true)}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Export Report
              </button>
            </div>
          </div>
          
          {/* Summary Cards */}
          {reportData.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Current Score</p>
                    <p className="text-3xl font-bold text-blue-600">{reportData.summary.currentScore}%</p>
                  </div>
                  <div className="text-blue-500 text-3xl">🎯</div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Improvement</p>
                    <p className={`text-3xl font-bold ${
                      reportData.summary.improvement >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {reportData.summary.improvement >= 0 ? '+' : ''}{reportData.summary.improvement}%
                    </p>
                  </div>
                  <div className="text-green-500 text-3xl">
                    {reportData.summary.improvement >= 0 ? '📈' : '📉'}
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Average Score</p>
                    <p className="text-3xl font-bold text-purple-600">{reportData.summary.averageScore}%</p>
                  </div>
                  <div className="text-purple-500 text-3xl">📊</div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Consistency</p>
                    <p className="text-3xl font-bold text-orange-600">{reportData.summary.consistency}%</p>
                  </div>
                  <div className="text-orange-500 text-3xl">🎪</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Insights and Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Key Insights</h3>
              <div className="space-y-3">
                {reportData.insights.map((insight, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    insight.type === 'positive' ? 'bg-green-50 border border-green-200' :
                    insight.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <p className={`text-sm ${
                      insight.type === 'positive' ? 'text-green-800' :
                      insight.type === 'warning' ? 'text-yellow-800' :
                      'text-blue-800'
                    }`}>
                      {insight.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Recommendations</h3>
              <div className="space-y-3">
                {reportData.recommendations.map((recommendation, index) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Monthly Breakdown */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Monthly Performance Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Month</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Overall Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Submission</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.monthlyBreakdown.map((month, index) => {
                    const previousMonth = reportData.monthlyBreakdown[index + 1];
                    const trend = previousMonth ? month.overallScore - previousMonth.overallScore : 0;
                    
                    return (
                      <tr key={month.month} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-900">{month.monthName}</td>
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${
                            month.overallScore >= 80 ? 'text-green-600' :
                            month.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {month.overallScore}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            month.hasSubmission 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {month.hasSubmission ? 'Submitted' : 'Missing'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {trend !== 0 && (
                            <span className={`text-sm ${
                              trend > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {trend > 0 ? '↗' : '↘'} {Math.abs(trend).toFixed(1)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Goal Progress */}
          {reportData.goalTracking && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Goal Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(reportData.goalTracking).map(([metric, progress]) => {
                  const displayName = metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  
                  return (
                    <div key={metric} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{displayName}</span>
                        <span className={`text-sm font-bold ${
                          progress.achieved ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {progress.current}/{progress.target}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            progress.achieved ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600">{progress.progress}% Complete</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Report</h3>
            <p className="text-gray-600 mb-6">Choose your preferred export format:</p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleExportReport('json')}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">JSON Format</div>
                <div className="text-sm text-gray-600">Complete data structure for analysis</div>
              </button>
              
              <button
                onClick={() => handleExportReport('csv')}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">CSV Format</div>
                <div className="text-sm text-gray-600">Spreadsheet-compatible format</div>
              </button>
              
              <button
                onClick={() => handleExportReport('pdf')}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">PDF Format</div>
                <div className="text-sm text-gray-600">Printable report format</div>
              </button>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowthReportGenerator;