import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useToast } from '@/shared/components/Toast';
import { supabase } from '@/shared/lib/supabase';
import InteractiveKPIForm from './InteractiveKPIForm';
import moment from 'moment';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Users,
  Award,
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit3,
  Eye,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

const KPIDashboard = ({ employeeId = null, showForm = true, viewMode = 'dashboard' }) => {
  const { user } = useUnifiedAuth();
  const { notify } = useToast();
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState([]);
  const [currentMonthData, setCurrentMonthData] = useState(null);
  const [showKPIForm, setShowKPIForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
  const [viewType, setViewType] = useState('overview'); // overview, trends, comparison
  const [filterPeriod, setFilterPeriod] = useState('6months'); // 3months, 6months, 1year

  // Load KPI data
  useEffect(() => {
    loadKPIData();
  }, [selectedMonth, employeeId, filterPeriod]);

  const loadKPIData = async () => {
    try {
      setLoading(true);
      const targetEmployeeId = employeeId || user?.id;
      
      if (!targetEmployeeId) return;

      // Calculate date range based on filter period
      const endDate = moment(selectedMonth);
      let startDate;
      switch (filterPeriod) {
        case '3months':
          startDate = endDate.clone().subtract(3, 'months');
          break;
        case '1year':
          startDate = endDate.clone().subtract(12, 'months');
          break;
        default: // 6months
          startDate = endDate.clone().subtract(6, 'months');
      }

      // Load historical data
      const { data: historicalData, error: historicalError } = await supabase
        .from('monthly_kpi_reports')
        .select('*')
        .eq('employee_id', targetEmployeeId)
        .gte('month_year', startDate.format('YYYY-MM'))
        .lte('month_year', endDate.format('YYYY-MM'))
        .order('month_year', { ascending: true });

      if (historicalError) throw historicalError;

      setKpiData(historicalData || []);

      // Load current month data
      const currentData = historicalData?.find(item => item.month_year === selectedMonth);
      setCurrentMonthData(currentData || null);

    } catch (error) {
      console.error('Error loading KPI data:', error);
      notify({
        title: 'Error',
        message: 'Failed to load KPI data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate KPI statistics
  const calculateKPIStats = () => {
    if (!kpiData.length) return null;

    const latest = kpiData[kpiData.length - 1];
    const previous = kpiData.length > 1 ? kpiData[kpiData.length - 2] : null;

    const calculateTrend = (current, prev) => {
      if (!prev || prev === 0) return 0;
      return ((current - prev) / prev * 100).toFixed(1);
    };

    return {
      overall_score: {
        current: latest?.overall_score || 0,
        trend: previous ? calculateTrend(latest?.overall_score, previous?.overall_score) : 0
      },
      client_satisfaction: {
        current: latest?.client_satisfaction_score || 0,
        trend: previous ? calculateTrend(latest?.client_satisfaction_score, previous?.client_satisfaction_score) : 0
      },
      productivity: {
        current: latest?.productivity_score || 0,
        trend: previous ? calculateTrend(latest?.productivity_score, previous?.productivity_score) : 0
      },
      learning_hours: {
        current: latest?.learning_hours || 0,
        trend: previous ? calculateTrend(latest?.learning_hours, previous?.learning_hours) : 0
      },
      tasks_completed: {
        current: latest?.tasks_completed || 0,
        trend: previous ? calculateTrend(latest?.tasks_completed, previous?.tasks_completed) : 0
      },
      attendance_rate: {
        current: latest?.attendance_rate || 0,
        trend: previous ? calculateTrend(latest?.attendance_rate, previous?.attendance_rate) : 0
      }
    };
  };

  // Get performance level based on score
  const getPerformanceLevel = (score) => {
    if (score >= 9) return { level: 'Excellent', color: 'green', bgColor: 'bg-green-100' };
    if (score >= 8) return { level: 'Good', color: 'blue', bgColor: 'bg-blue-100' };
    if (score >= 7) return { level: 'Satisfactory', color: 'yellow', bgColor: 'bg-yellow-100' };
    if (score >= 6) return { level: 'Needs Improvement', color: 'orange', bgColor: 'bg-orange-100' };
    return { level: 'Poor', color: 'red', bgColor: 'bg-red-100' };
  };

  // Render KPI card
  const renderKPICard = (title, value, trend, icon, unit = '', isPercentage = false) => {
    const trendValue = parseFloat(trend);
    const isPositive = trendValue > 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900">{title}</h3>
          </div>
          {trend !== 0 && (
            <div className={`flex items-center gap-1 text-sm ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendIcon className="w-4 h-4" />
              {Math.abs(trendValue)}%
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {value}{unit}{isPercentage ? '%' : ''}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {trend !== 0 ? (
            isPositive ? 'Improved from last month' : 'Decreased from last month'
          ) : (
            'No previous data'
          )}
        </p>
      </div>
    );
  };

  // Render trend chart (simplified)
  const renderTrendChart = () => {
    if (!kpiData.length) return null;

    const chartData = kpiData.slice(-6); // Last 6 months
    const maxScore = Math.max(...chartData.map(d => d.overall_score || 0));
    
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Performance Trend
          </h3>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
        
        <div className="space-y-4">
          {chartData.map((data, index) => {
            const score = data.overall_score || 0;
            const width = maxScore > 0 ? (score / maxScore) * 100 : 0;
            const performance = getPerformanceLevel(score);
            
            return (
              <div key={data.month_year} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {moment(data.month_year).format('MMM YYYY')}
                  </span>
                  <span className={`text-sm px-2 py-1 rounded-full ${performance.bgColor} text-${performance.color}-800`}>
                    {score.toFixed(1)}/10
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full bg-${performance.color}-500 transition-all duration-500`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render detailed metrics
  const renderDetailedMetrics = () => {
    if (!currentMonthData) return null;

    const metrics = [
      { label: 'Client Meetings', value: currentMonthData.meetings_with_clients, icon: Users },
      { label: 'WhatsApp Messages', value: currentMonthData.whatsapp_messages_sent, icon: Users },
      { label: 'Tasks Completed', value: currentMonthData.tasks_completed, icon: CheckCircle },
      { label: 'Tasks On Time', value: currentMonthData.tasks_on_time, icon: Clock },
      { label: 'Learning Hours', value: currentMonthData.learning_hours, icon: BookOpen },
      { label: 'Courses Completed', value: currentMonthData.courses_completed, icon: Award },
    ];

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Detailed Metrics - {moment(selectedMonth).format('MMMM YYYY')}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">{metric.label}</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{metric.value}</div>
              </div>
            );
          })}
        </div>
        
        {currentMonthData.achievements && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Key Achievements</h4>
            <p className="text-sm text-green-800">{currentMonthData.achievements}</p>
          </div>
        )}
        
        {currentMonthData.challenges && (
          <div className="mt-4 p-4 bg-orange-50 rounded-lg">
            <h4 className="font-medium text-orange-900 mb-2">Challenges Faced</h4>
            <p className="text-sm text-orange-800">{currentMonthData.challenges}</p>
          </div>
        )}
      </div>
    );
  };

  const stats = calculateKPIStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading KPI dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            KPI Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Track and manage your key performance indicators
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* View Type Selector */}
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="overview">Overview</option>
            <option value="trends">Trends</option>
            <option value="detailed">Detailed</option>
          </select>
          
          {showForm && (
            <button
              onClick={() => setShowKPIForm(!showKPIForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {showKPIForm ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {showKPIForm ? 'View Dashboard' : 'Update KPIs'}
            </button>
          )}
        </div>
      </div>

      {/* KPI Form */}
      {showKPIForm && showForm && (
        <InteractiveKPIForm
          employeeId={employeeId}
          monthYear={selectedMonth}
          onSubmit={() => {
            loadKPIData();
            setShowKPIForm(false);
          }}
        />
      )}

      {/* Dashboard Content */}
      {!showKPIForm && (
        <>
          {/* Overview Cards */}
          {(viewType === 'overview' || viewType === 'detailed') && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderKPICard(
                'Overall Score',
                stats.overall_score.current.toFixed(1),
                stats.overall_score.trend,
                Target,
                '/10'
              )}
              {renderKPICard(
                'Client Satisfaction',
                stats.client_satisfaction.current.toFixed(1),
                stats.client_satisfaction.trend,
                Users,
                '/10'
              )}
              {renderKPICard(
                'Productivity',
                stats.productivity.current.toFixed(1),
                stats.productivity.trend,
                TrendingUp,
                '/10'
              )}
              {renderKPICard(
                'Learning Hours',
                stats.learning_hours.current,
                stats.learning_hours.trend,
                BookOpen,
                'h'
              )}
              {renderKPICard(
                'Tasks Completed',
                stats.tasks_completed.current,
                stats.tasks_completed.trend,
                CheckCircle
              )}
              {renderKPICard(
                'Attendance',
                stats.attendance_rate.current.toFixed(1),
                stats.attendance_rate.trend,
                Clock,
                '',
                true
              )}
            </div>
          )}

          {/* Trend Chart */}
          {(viewType === 'trends' || viewType === 'overview') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderTrendChart()}
              
              {/* Performance Summary */}
              {stats && (
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-blue-600" />
                    Performance Summary
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Current Overall Score</span>
                      <span className="text-lg font-bold text-blue-600">
                        {stats.overall_score.current.toFixed(1)}/10
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Performance Level</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        getPerformanceLevel(stats.overall_score.current).bgColor
                      } text-${getPerformanceLevel(stats.overall_score.current).color}-800`}>
                        {getPerformanceLevel(stats.overall_score.current).level}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Monthly Trend</span>
                      <span className={`flex items-center gap-1 text-sm font-medium ${
                        parseFloat(stats.overall_score.trend) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {parseFloat(stats.overall_score.trend) >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {Math.abs(parseFloat(stats.overall_score.trend))}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Detailed Metrics */}
          {viewType === 'detailed' && renderDetailedMetrics()}

          {/* No Data Message */}
          {!stats && (
            <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No KPI Data Available</h3>
              <p className="text-gray-600 mb-4">
                No KPI data found for the selected period. Start by updating your KPIs.
              </p>
              {showForm && (
                <button
                  onClick={() => setShowKPIForm(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add KPI Data
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default KPIDashboard;