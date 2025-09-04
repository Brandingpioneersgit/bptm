import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useToast } from '@/shared/components/Toast';
import { useDataSync } from './DataSyncContext';

// Fixed Leaderboard View Component
export const FixedLeaderboardView = ({ 
  title = 'Team Leaderboard',
  period = 'monthly',
  metric = 'performance',
  showFilters = true,
  maxItems = 10,
  showAwards = true
}) => {
  const { user, role } = useUnifiedAuth();
  const { notify } = useToast();
  const { employees } = useDataSync();
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [selectedMetric, setSelectedMetric] = useState(metric);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Available periods
  const periods = [
    { value: 'daily', label: 'Today', icon: '📅' },
    { value: 'weekly', label: 'This Week', icon: '📊' },
    { value: 'monthly', label: 'This Month', icon: '📈' },
    { value: 'quarterly', label: 'This Quarter', icon: '📋' },
    { value: 'yearly', label: 'This Year', icon: '🏆' }
  ];

  // Available metrics
  const metrics = [
    { value: 'performance', label: 'Overall Performance', icon: '⭐', color: 'blue' },
    { value: 'sales', label: 'Sales Revenue', icon: '💰', color: 'green' },
    { value: 'productivity', label: 'Productivity Score', icon: '⚡', color: 'yellow' },
    { value: 'quality', label: 'Quality Rating', icon: '✨', color: 'purple' },
    { value: 'collaboration', label: 'Team Collaboration', icon: '🤝', color: 'indigo' },
    { value: 'innovation', label: 'Innovation Points', icon: '💡', color: 'orange' }
  ];

  // Award types
  const awards = {
    1: { icon: '🥇', title: 'Gold Medal', color: 'text-yellow-500' },
    2: { icon: '🥈', title: 'Silver Medal', color: 'text-gray-400' },
    3: { icon: '🥉', title: 'Bronze Medal', color: 'text-orange-600' },
    'top10': { icon: '🌟', title: 'Top Performer', color: 'text-blue-500' },
    'improved': { icon: '📈', title: 'Most Improved', color: 'text-green-500' },
    'consistent': { icon: '🎯', title: 'Consistency Award', color: 'text-purple-500' }
  };

  // Generate sample leaderboard data
  useEffect(() => {
    generateLeaderboardData();
  }, [selectedPeriod, selectedMetric, employees]);

  const generateLeaderboardData = () => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const sampleData = employees.map((employee, index) => {
        const baseScore = Math.random() * 100;
        const periodMultiplier = {
          daily: 0.8 + Math.random() * 0.4,
          weekly: 0.7 + Math.random() * 0.6,
          monthly: 0.6 + Math.random() * 0.8,
          quarterly: 0.5 + Math.random() * 1.0,
          yearly: 0.4 + Math.random() * 1.2
        }[selectedPeriod] || 1;
        
        const metricMultiplier = {
          performance: 1.0,
          sales: 0.8 + Math.random() * 0.4,
          productivity: 0.9 + Math.random() * 0.2,
          quality: 0.85 + Math.random() * 0.3,
          collaboration: 0.7 + Math.random() * 0.6,
          innovation: 0.6 + Math.random() * 0.8
        }[selectedMetric] || 1;
        
        const score = Math.round(baseScore * periodMultiplier * metricMultiplier);
        const previousScore = Math.round(score * (0.8 + Math.random() * 0.4));
        const change = score - previousScore;
        const changePercent = previousScore > 0 ? Math.round((change / previousScore) * 100) : 0;
        
        return {
          id: employee.id,
          name: employee.name,
          role: employee.role,
          department: employee.department,
          avatar: employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random`,
          score: score,
          previousScore: previousScore,
          change: change,
          changePercent: changePercent,
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
          achievements: generateAchievements(score, change, index),
          details: generateMetricDetails(selectedMetric, score)
        };
      });
      
      // Sort by score descending
      const sortedData = sampleData.sort((a, b) => b.score - a.score);
      
      // Add rankings and special awards
      const rankedData = sortedData.map((item, index) => ({
        ...item,
        rank: index + 1,
        isTopPerformer: index < 3,
        award: getAward(index + 1, item.changePercent)
      }));
      
      setLeaderboardData(rankedData.slice(0, maxItems));
      setLoading(false);
    }, 500);
  };

  const generateAchievements = (score, change, index) => {
    const achievements = [];
    
    if (score > 90) achievements.push('High Performer');
    if (change > 20) achievements.push('Rising Star');
    if (index % 3 === 0) achievements.push('Team Player');
    if (score > 95) achievements.push('Excellence Award');
    
    return achievements;
  };

  const generateMetricDetails = (metric, score) => {
    const details = {
      performance: {
        tasks: Math.round(score * 0.8),
        quality: Math.round(score * 0.9),
        efficiency: Math.round(score * 0.85)
      },
      sales: {
        revenue: `$${(score * 1000).toLocaleString()}`,
        deals: Math.round(score * 0.1),
        conversion: `${Math.round(score * 0.8)}%`
      },
      productivity: {
        hoursWorked: Math.round(score * 0.4),
        tasksCompleted: Math.round(score * 0.6),
        efficiency: `${Math.round(score * 0.9)}%`
      },
      quality: {
        rating: (score / 20).toFixed(1),
        reviews: Math.round(score * 0.2),
        satisfaction: `${Math.round(score * 0.95)}%`
      },
      collaboration: {
        teamProjects: Math.round(score * 0.1),
        helpRequests: Math.round(score * 0.3),
        mentoring: Math.round(score * 0.05)
      },
      innovation: {
        ideas: Math.round(score * 0.1),
        implementations: Math.round(score * 0.05),
        impact: `${Math.round(score * 0.8)}%`
      }
    };
    
    return details[metric] || {};
  };

  const getAward = (rank, changePercent) => {
    if (rank === 1) return awards[1];
    if (rank === 2) return awards[2];
    if (rank === 3) return awards[3];
    if (rank <= 10) return awards.top10;
    if (changePercent > 50) return awards.improved;
    if (changePercent >= -5 && changePercent <= 5) return awards.consistent;
    return null;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
    if (rank <= 10) return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
    return 'bg-gray-100 text-gray-700';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const currentMetric = metrics.find(m => m.value === selectedMetric);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-brand p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-brand-text flex items-center space-x-2">
              <span>🏆</span>
              <span>{title}</span>
            </h2>
            <p className="text-brand-text-secondary mt-1">
              Track team performance and celebrate achievements
            </p>
          </div>
          
          {showFilters && (
            <div className="flex space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {periods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.icon} {period.label}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {metrics.map(metric => (
                  <option key={metric.value} value={metric.value}>
                    {metric.icon} {metric.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card-brand p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboardData.map((employee, index) => (
              <div 
                key={employee.id}
                className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-200 hover:shadow-md ${
                  employee.rank <= 3 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200' : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                {/* Rank */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  getRankColor(employee.rank)
                }`}>
                  {employee.rank <= 3 ? awards[employee.rank].icon : employee.rank}
                </div>
                
                {/* Avatar */}
                <div className="relative">
                  <img 
                    src={employee.avatar} 
                    alt={employee.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  {employee.award && showAwards && (
                    <div className={`absolute -top-1 -right-1 text-lg ${employee.award.color}`}>
                      {employee.award.icon}
                    </div>
                  )}
                </div>
                
                {/* Employee Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-brand-text">{employee.name}</h3>
                    {employee.achievements.length > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {employee.achievements[0]}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-brand-text-secondary">
                    {employee.role} • {employee.department}
                  </p>
                </div>
                
                {/* Score and Trend */}
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-brand-text">
                      {employee.score}
                    </span>
                    <span className="text-sm text-brand-text-secondary">
                      {currentMetric?.icon}
                    </span>
                  </div>
                  
                  <div className={`flex items-center space-x-1 text-sm ${
                    getTrendColor(employee.trend)
                  }`}>
                    <span>{getTrendIcon(employee.trend)}</span>
                    <span>
                      {employee.change > 0 ? '+' : ''}{employee.change}
                      ({employee.changePercent > 0 ? '+' : ''}{employee.changePercent}%)
                    </span>
                  </div>
                </div>
                
                {/* Details */}
                <div className="text-right text-sm text-brand-text-secondary">
                  {Object.entries(employee.details).slice(0, 2).map(([key, value]) => (
                    <div key={key}>
                      <span className="capitalize">{key}:</span> {value}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Footer */}
        {!loading && leaderboardData.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex justify-between items-center text-sm text-brand-text-secondary">
              <span>
                Showing top {leaderboardData.length} performers for {currentMetric?.label.toLowerCase()}
              </span>
              
              <button
                onClick={generateLeaderboardData}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                🔄 Refresh Data
              </button>
            </div>
          </div>
        )}
        
        {!loading && leaderboardData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-brand-text mb-2">No Data Available</h3>
            <p className="text-brand-text-secondary">
              No performance data found for the selected period and metric.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FixedLeaderboardView;