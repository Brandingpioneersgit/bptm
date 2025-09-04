import React, { useState, useEffect } from 'react';
import { ProgressIndicator } from './ui';

export function TaskProgressTracker({ 
  currentTasks = 0, 
  previousTasks = 0, 
  targetTasks = 50, 
  monthKey = '', 
  previousMonthKey = '', 
  department = '', 
  employeeName = '',
  onTargetUpdate = null 
}) {
  const [customTarget, setCustomTarget] = useState(targetTasks);
  const [showTargetEditor, setShowTargetEditor] = useState(false);
  
  // Calculate performance metrics
  const completionRate = targetTasks > 0 ? (currentTasks / targetTasks) * 100 : 0;
  const monthOverMonthGrowth = previousTasks > 0 ? ((currentTasks - previousTasks) / previousTasks) * 100 : 0;
  const isOnTrack = completionRate >= 80;
  const needsAttention = completionRate < 50;
  
  // Department-specific target suggestions
  const getDepartmentTargets = () => {
    const targets = {
      'HR': { min: 25, recommended: 35, high: 45 },
      'Sales': { min: 40, recommended: 55, high: 70 },
      'Accounts': { min: 30, recommended: 40, high: 50 },
      'Operations': { min: 35, recommended: 50, high: 65 },
      'Web': { min: 20, recommended: 30, high: 40 },
      'Marketing': { min: 25, recommended: 35, high: 45 }
    };
    return targets[department] || { min: 25, recommended: 40, high: 55 };
  };
  
  const deptTargets = getDepartmentTargets();
  
  // Performance insights
  const getPerformanceInsight = () => {
    if (completionRate >= 100) {
      return { type: 'excellent', message: '🎉 Outstanding performance! You\'ve exceeded your target.', color: 'text-green-600' };
    } else if (completionRate >= 80) {
      return { type: 'good', message: '✅ Great progress! You\'re on track to meet your target.', color: 'text-green-600' };
    } else if (completionRate >= 50) {
      return { type: 'moderate', message: '⚠️ Moderate progress. Consider reviewing your task management strategy.', color: 'text-yellow-600' };
    } else {
      return { type: 'needs_attention', message: '🚨 Below target. Let\'s focus on improving task completion.', color: 'text-red-600' };
    }
  };
  
  const insight = getPerformanceInsight();
  
  // Trend analysis
  const getTrendAnalysis = () => {
    if (!previousTasks) return null;
    
    if (monthOverMonthGrowth > 20) {
      return { icon: '🚀', message: 'Significant improvement', color: 'text-green-600' };
    } else if (monthOverMonthGrowth > 5) {
      return { icon: '📈', message: 'Steady growth', color: 'text-green-600' };
    } else if (monthOverMonthGrowth > -5) {
      return { icon: '➡️', message: 'Consistent performance', color: 'text-gray-600' };
    } else if (monthOverMonthGrowth > -20) {
      return { icon: '📉', message: 'Slight decline', color: 'text-yellow-600' };
    } else {
      return { icon: '⚠️', message: 'Needs attention', color: 'text-red-600' };
    }
  };
  
  const trend = getTrendAnalysis();
  
  const handleTargetUpdate = () => {
    if (onTargetUpdate && customTarget !== targetTasks) {
      onTargetUpdate(customTarget);
    }
    setShowTargetEditor(false);
  };
  
  return (
    <div className="bg-white border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          📊 Task Progress Analytics
        </h4>
        <button 
          onClick={() => setShowTargetEditor(!showTargetEditor)}
          className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:border-blue-300 transition-colors"
        >
          ⚙️ Adjust Target
        </button>
      </div>
      
      {/* Enhanced Progress Indicator */}
      <ProgressIndicator 
        current={currentTasks}
        target={targetTasks}
        label="Monthly Task Completion"
        unit=" tasks"
        color="blue"
        previousValue={previousTasks}
        showTrend={!!previousTasks}
        monthComparison={previousMonthKey}
      />
      
      {/* Target Editor */}
      {showTargetEditor && (
        <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
          <h5 className="text-sm font-medium text-gray-800">Set Monthly Target</h5>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button 
              onClick={() => setCustomTarget(deptTargets.min)}
              className={`p-2 rounded border ${
                customTarget === deptTargets.min ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200'
              }`}
            >
              Min: {deptTargets.min}
            </button>
            <button 
              onClick={() => setCustomTarget(deptTargets.recommended)}
              className={`p-2 rounded border ${
                customTarget === deptTargets.recommended ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200'
              }`}
            >
              Recommended: {deptTargets.recommended}
            </button>
            <button 
              onClick={() => setCustomTarget(deptTargets.high)}
              className={`p-2 rounded border ${
                customTarget === deptTargets.high ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200'
              }`}
            >
              High: {deptTargets.high}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              value={customTarget} 
              onChange={(e) => setCustomTarget(Number(e.target.value))}
              className="flex-1 border rounded px-2 py-1 text-sm"
              min="1"
              max="200"
            />
            <button 
              onClick={handleTargetUpdate}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      )}
      
      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{completionRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-600">Completion Rate</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            monthOverMonthGrowth > 0 ? 'text-green-600' : 
            monthOverMonthGrowth < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {monthOverMonthGrowth > 0 ? '+' : ''}{monthOverMonthGrowth.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600">Month Growth</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{targetTasks - currentTasks}</div>
          <div className="text-xs text-gray-600">Tasks Remaining</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${
            isOnTrack ? 'text-green-600' : needsAttention ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {isOnTrack ? '✅' : needsAttention ? '🚨' : '⚠️'}
          </div>
          <div className="text-xs text-gray-600">Status</div>
        </div>
      </div>
      
      {/* Performance Insight */}
      <div className={`p-3 rounded-lg border ${
        insight.type === 'excellent' ? 'bg-green-50 border-green-200' :
        insight.type === 'good' ? 'bg-green-50 border-green-200' :
        insight.type === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
        'bg-red-50 border-red-200'
      }`}>
        <p className={`text-sm ${insight.color}`}>{insight.message}</p>
      </div>
      
      {/* Trend Analysis */}
      {trend && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-lg">{trend.icon}</span>
            <span className={`text-sm font-medium ${trend.color}`}>{trend.message}</span>
          </div>
          {previousMonthKey && (
            <span className="text-xs text-gray-500">
              vs {previousMonthKey}: {previousTasks} tasks
            </span>
          )}
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <span className="text-xs text-gray-500">Quick tips:</span>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">📝 Break large tasks into smaller ones</span>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">⏰ Use time blocking</span>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">🎯 Set daily goals</span>
      </div>
    </div>
  );
}

export default TaskProgressTracker;