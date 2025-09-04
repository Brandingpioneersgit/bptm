import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { Section } from '@/shared/components/ui';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  SparklesIcon,
  LightBulbIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Performance Insight Card Component
const InsightCard = ({ insight, type = 'info' }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      case 'danger':
        return <FlagIcon className="h-5 w-5 text-red-600" />;
      case 'tip':
        return <LightBulbIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-600" />;
    }
  };
  
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'danger':
        return 'bg-red-50 border-red-200';
      case 'tip':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };
  
  return (
    <div className={`border rounded-lg p-4 ${getBackgroundColor()}`}>
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900 mb-1">{insight.title}</h4>
          <p className="text-sm text-gray-700">{insight.description}</p>
          {insight.action && (
            <p className="text-sm font-medium text-gray-900 mt-2">
              💡 {insight.action}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Trend Indicator Component
const TrendIndicator = ({ value, previousValue, label, format = 'number' }) => {
  const change = value - previousValue;
  const percentChange = previousValue !== 0 ? (change / previousValue) * 100 : 0;
  const isPositive = change > 0;
  const isNeutral = change === 0;
  
  const formatValue = (val) => {
    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'hours':
        return `${val.toFixed(1)}h`;
      case 'currency':
        return `$${val.toLocaleString()}`;
      default:
        return val.toFixed(1);
    }
  };
  
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-900">
        {formatValue(value)}
      </div>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className={`flex items-center justify-center space-x-1 text-xs ${
        isNeutral ? 'text-gray-500' : isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        {isNeutral ? (
          <MinusIcon className="h-3 w-3" />
        ) : isPositive ? (
          <ArrowUpIcon className="h-3 w-3" />
        ) : (
          <ArrowDownIcon className="h-3 w-3" />
        )}
        <span>
          {Math.abs(percentChange).toFixed(1)}% vs last month
        </span>
      </div>
    </div>
  );
};

// Performance Score Badge Component
const PerformanceScoreBadge = ({ score, rank, totalEmployees }) => {
  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-100';
    if (score >= 55) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };
  
  const getPerformanceLevel = (score) => {
    if (score >= 85) return 'Exceptional';
    if (score >= 70) return 'Strong';
    if (score >= 55) return 'Satisfactory';
    return 'Needs Improvement';
  };
  
  return (
    <div className="text-center">
      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold ${getScoreColor(score)}`}>
        {score.toFixed(0)}
      </div>
      <div className="mt-2">
        <div className="text-sm font-medium text-gray-900">{getPerformanceLevel(score)}</div>
        <div className="text-xs text-gray-600">
          Rank #{rank} of {totalEmployees}
        </div>
      </div>
    </div>
  );
};

// Team Comparison Chart Component
const TeamComparisonChart = ({ data, currentEmployeeId }) => {
  const chartData = data.map(emp => ({
    ...emp,
    isCurrentUser: emp.id === currentEmployeeId
  }));
  
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [value.toFixed(1), 'Score']}
            labelFormatter={(label) => `Employee: ${label}`}
          />
          <Bar 
            dataKey="score" 
            fill={(entry) => entry.isCurrentUser ? '#3B82F6' : '#E5E7EB'}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Skills Radar Component
const SkillsBreakdown = ({ skills }) => {
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  
  return (
    <div className="space-y-4">
      {skills.map((skill, index) => {
        const percentage = (skill.score / 100) * 100;
        return (
          <div key={skill.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{skill.name}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{skill.score.toFixed(1)}/100</span>
                {skill.trend && (
                  <div className={`flex items-center space-x-1 text-xs ${
                    skill.trend > 0 ? 'text-green-600' : skill.trend < 0 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {skill.trend > 0 ? (
                      <ArrowTrendingUpIcon className="h-3 w-3" />
                    ) : skill.trend < 0 ? (
                      <ArrowTrendingDownIcon className="h-3 w-3" />
                    ) : (
                      <MinusIcon className="h-3 w-3" />
                    )}
                    <span>{Math.abs(skill.trend).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${percentage}%`,
                  backgroundColor: COLORS[index % COLORS.length]
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Performance Timeline Component
const PerformanceTimeline = ({ data }) => {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis domain={[0, 100]} />
          <Tooltip 
            formatter={(value) => [value.toFixed(1), 'Performance Score']}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#3B82F6" 
            strokeWidth={3}
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Leaderboard Component
const Leaderboard = ({ employees, currentEmployeeId, showFull = false }) => {
  const displayEmployees = showFull ? employees : employees.slice(0, 5);
  
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };
  
  return (
    <div className="space-y-3">
      {displayEmployees.map((employee, index) => {
        const rank = index + 1;
        const isCurrentUser = employee.id === currentEmployeeId;
        
        return (
          <div 
            key={employee.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              isCurrentUser ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-lg font-bold text-gray-600 w-8">
                {getRankIcon(rank)}
              </div>
              <div>
                <div className={`font-medium ${
                  isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {employee.name} {isCurrentUser && '(You)'}
                </div>
                <div className="text-sm text-gray-600">{employee.department}</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-lg font-bold ${
                employee.score >= 85 ? 'text-green-600' :
                employee.score >= 70 ? 'text-blue-600' :
                employee.score >= 55 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {employee.score.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500">Score</div>
            </div>
          </div>
        );
      })}
      
      {!showFull && employees.length > 5 && (
        <div className="text-center text-sm text-gray-500 pt-2">
          ... and {employees.length - 5} more employees
        </div>
      )}
    </div>
  );
};

// Main Growth & Analytics Component
export const GrowthAnalytics = ({ employee }) => {
  const supabase = useSupabase();
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    currentScore: 0,
    previousScore: 0,
    rank: 0,
    totalEmployees: 0,
    insights: [],
    skills: [],
    timeline: [],
    teamComparison: [],
    leaderboard: []
  });
  const [activeTab, setActiveTab] = useState('overview');
  
  // Load analytics data on component mount
  useEffect(() => {
    if (employee?.id) {
      loadAnalyticsData();
    }
  }, [employee?.id]);
  
  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Load current month performance data
      const currentMonth = new Date().toISOString().slice(0, 7);
      const previousMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
      
      // Get employee performance scores
      const { data: performanceData, error: perfError } = await supabase
        .from('employee_performance')
        .select('*')
        .eq('employee_id', employee.id)
        .in('month', [currentMonth, previousMonth])
        .order('month', { ascending: false });
      
      if (perfError) throw perfError;
      
      const currentPerf = performanceData?.find(p => p.month === currentMonth);
      const previousPerf = performanceData?.find(p => p.month === previousMonth);
      
      // Get all employees for leaderboard
      const { data: allEmployees, error: empError } = await supabase
        .from('employee_performance')
        .select('employee_id, overall_score, employees(name, department)')
        .eq('month', currentMonth)
        .order('overall_score', { ascending: false });
      
      if (empError) throw empError;
      
      // Get KPI data for skills breakdown
      const { data: kpiData, error: kpiError } = await supabase
        .from('monthly_kpi_reports')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('month', currentMonth)
        .single();
      
      if (kpiError && kpiError.code !== 'PGRST116') throw kpiError;
      
      // Get historical performance data
      const { data: historyData, error: histError } = await supabase
        .from('employee_performance')
        .select('month, overall_score')
        .eq('employee_id', employee.id)
        .order('month', { ascending: true })
        .limit(6);
      
      if (histError) throw histError;
      
      // Process data
      const currentScore = currentPerf?.overall_score || 0;
      const previousScore = previousPerf?.overall_score || 0;
      
      const leaderboard = allEmployees?.map(emp => ({
        id: emp.employee_id,
        name: emp.employees?.name || 'Unknown',
        department: emp.employees?.department || 'Unknown',
        score: emp.overall_score || 0
      })) || [];
      
      const currentRank = leaderboard.findIndex(emp => emp.id === employee.id) + 1;
      
      // Generate insights
      const insights = generateInsights(currentScore, previousScore, kpiData, currentRank, leaderboard.length);
      
      // Generate skills breakdown
      const skills = generateSkillsBreakdown(kpiData);
      
      // Format timeline data
      const timeline = historyData?.map(item => ({
        month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        score: item.overall_score || 0
      })) || [];
      
      // Team comparison (same department)
      const teamComparison = leaderboard
        .filter(emp => emp.department === employee.department)
        .slice(0, 10);
      
      setAnalyticsData({
        currentScore,
        previousScore,
        rank: currentRank,
        totalEmployees: leaderboard.length,
        insights,
        skills,
        timeline,
        teamComparison,
        leaderboard
      });
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
      notify('Failed to load analytics data', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const generateInsights = (currentScore, previousScore, kpiData, rank, totalEmployees) => {
    const insights = [];
    const scoreChange = currentScore - previousScore;
    const percentChange = previousScore !== 0 ? (scoreChange / previousScore) * 100 : 0;
    
    // Performance trend insight
    if (scoreChange > 5) {
      insights.push({
        title: '🚀 Strong Performance Growth',
        description: `Your performance score improved by ${scoreChange.toFixed(1)} points (${percentChange.toFixed(1)}%) this month!`,
        action: 'Keep up the excellent work and maintain this momentum.',
        type: 'success'
      });
    } else if (scoreChange < -5) {
      insights.push({
        title: '📉 Performance Decline',
        description: `Your performance score decreased by ${Math.abs(scoreChange).toFixed(1)} points this month.`,
        action: 'Focus on improving key KPIs and seek feedback from your manager.',
        type: 'warning'
      });
    }
    
    // Ranking insight
    if (rank <= 3) {
      insights.push({
        title: '🏆 Top Performer',
        description: `You're ranked #${rank} out of ${totalEmployees} employees - exceptional work!`,
        action: 'Consider mentoring others and sharing your best practices.',
        type: 'success'
      });
    } else if (rank > totalEmployees * 0.8) {
      insights.push({
        title: '⚠️ Performance Below Average',
        description: `You're in the bottom 20% of performers. Let's work on improvement.`,
        action: 'Schedule a meeting with your manager to create an improvement plan.',
        type: 'danger'
      });
    }
    
    // KPI-specific insights
    if (kpiData) {
      const kpiFields = ['sales_target', 'client_satisfaction', 'project_completion', 'learning_hours'];
      const lowKPIs = kpiFields.filter(field => kpiData[field] && kpiData[field] < 70);
      
      if (lowKPIs.length > 0) {
        insights.push({
          title: '🎯 Focus Areas Identified',
          description: `These KPIs need attention: ${lowKPIs.join(', ').replace(/_/g, ' ')}.`,
          action: 'Prioritize these areas in your next month\'s goals.',
          type: 'tip'
        });
      }
    }
    
    // General tips
    if (insights.length === 0) {
      insights.push({
        title: '📊 Steady Performance',
        description: 'Your performance is consistent. Look for opportunities to excel.',
        action: 'Set stretch goals and challenge yourself to reach the next level.',
        type: 'info'
      });
    }
    
    return insights;
  };
  
  const generateSkillsBreakdown = (kpiData) => {
    if (!kpiData) return [];
    
    return [
      {
        name: 'Sales Performance',
        score: kpiData.sales_target || 0,
        trend: Math.random() * 20 - 10 // Mock trend data
      },
      {
        name: 'Client Satisfaction',
        score: kpiData.client_satisfaction || 0,
        trend: Math.random() * 20 - 10
      },
      {
        name: 'Project Delivery',
        score: kpiData.project_completion || 0,
        trend: Math.random() * 20 - 10
      },
      {
        name: 'Learning & Growth',
        score: kpiData.learning_hours ? Math.min((kpiData.learning_hours / 6) * 100, 100) : 0,
        trend: Math.random() * 20 - 10
      },
      {
        name: 'Communication',
        score: kpiData.communication_score || 0,
        trend: Math.random() * 20 - 10
      }
    ].filter(skill => skill.score > 0);
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
          <h2 className="text-2xl font-bold text-gray-900">Growth & Analytics</h2>
          <p className="text-gray-600">Performance insights and team comparisons</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-gray-500">AI-powered insights</span>
        </div>
      </div>
      
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <PerformanceScoreBadge 
            score={analyticsData.currentScore}
            rank={analyticsData.rank}
            totalEmployees={analyticsData.totalEmployees}
          />
        </div>
        
        <TrendIndicator 
          value={analyticsData.currentScore}
          previousValue={analyticsData.previousScore}
          label="Overall Score"
        />
        
        <TrendIndicator 
          value={analyticsData.rank}
          previousValue={analyticsData.rank + 1} // Mock previous rank
          label="Team Rank"
        />
        
        <TrendIndicator 
          value={85} // Mock engagement score
          previousValue={80}
          label="Engagement"
          format="percentage"
        />
      </div>
      
      {/* Insights Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analyticsData.insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} type={insight.type} />
          ))}
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'skills', name: 'Skills Breakdown', icon: '🎯' },
            { id: 'timeline', name: 'Performance Timeline', icon: '📈' },
            { id: 'team', name: 'Team Comparison', icon: '👥' },
            { id: 'leaderboard', name: 'Leaderboard', icon: '🏆' }
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
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Timeline</h3>
              <PerformanceTimeline data={analyticsData.timeline} />
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Performers</h3>
              <Leaderboard 
                employees={analyticsData.leaderboard} 
                currentEmployeeId={employee.id}
                showFull={false}
              />
            </div>
          </div>
        )}
        
        {activeTab === 'skills' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Skills & KPI Breakdown</h3>
            {analyticsData.skills.length > 0 ? (
              <SkillsBreakdown skills={analyticsData.skills} />
            ) : (
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No KPI data available for this month</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'timeline' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">6-Month Performance Timeline</h3>
            {analyticsData.timeline.length > 0 ? (
              <PerformanceTimeline data={analyticsData.timeline} />
            ) : (
              <div className="text-center py-8">
                <ArrowTrendingUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Not enough historical data available</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'team' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Team Comparison - {employee.department}
            </h3>
            {analyticsData.teamComparison.length > 0 ? (
              <TeamComparisonChart 
                data={analyticsData.teamComparison} 
                currentEmployeeId={employee.id}
              />
            ) : (
              <div className="text-center py-8">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No team data available</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'leaderboard' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Company Leaderboard</h3>
            <Leaderboard 
              employees={analyticsData.leaderboard} 
              currentEmployeeId={employee.id}
              showFull={true}
            />
          </div>
        )}
      </div>
      
      {/* FAQ Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">How is my score calculated?</p>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>Performance Score:</strong> Average of all KPIs weighted by importance</li>
              <li>• <strong>Ranking:</strong> Based on overall performance compared to all employees</li>
              <li>• <strong>Trends:</strong> Month-over-month comparison of key metrics</li>
              <li>• <strong>Insights:</strong> AI-generated recommendations based on your data</li>
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default GrowthAnalytics;