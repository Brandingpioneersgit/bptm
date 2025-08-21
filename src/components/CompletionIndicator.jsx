import React from 'react';

/**
 * Visual completion indicators for tasks, KPIs, and requirements
 * Provides clear status feedback with actionable messaging
 */

export function TaskCompletionBadge({ 
  isCompleted, 
  isOverdue = false, 
  label = 'Task',
  size = 'normal' // small, normal, large
}) {
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    normal: 'px-3 py-1 text-sm',
    large: 'px-4 py-2 text-base'
  };

  if (isCompleted) {
    return (
      <span className={`${sizeClasses[size]} bg-green-100 text-green-800 rounded-full font-medium flex items-center gap-1`}>
        <span>✅</span>
        <span>Completed</span>
      </span>
    );
  }

  if (isOverdue) {
    return (
      <span className={`${sizeClasses[size]} bg-red-100 text-red-800 rounded-full font-medium flex items-center gap-1`}>
        <span>🚨</span>
        <span>Overdue</span>
      </span>
    );
  }

  return (
    <span className={`${sizeClasses[size]} bg-yellow-100 text-yellow-800 rounded-full font-medium flex items-center gap-1`}>
      <span>⏳</span>
      <span>Pending</span>
    </span>
  );
}

export function ProgressRing({ 
  percentage, 
  size = 60, 
  strokeWidth = 6, 
  showLabel = true,
  className = ''
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 90) return '#10B981'; // green
    if (percentage >= 70) return '#3B82F6'; // blue
    if (percentage >= 40) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-gray-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}

export function ChecklistItem({ 
  label, 
  isCompleted, 
  isRequired = false,
  description = null,
  actionLabel = null,
  onAction = null 
}) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${
      isCompleted 
        ? 'bg-green-50 border-green-200' 
        : isRequired 
        ? 'bg-red-50 border-red-200' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs mt-0.5 ${
        isCompleted 
          ? 'bg-green-500 text-white' 
          : isRequired 
          ? 'bg-red-500 text-white' 
          : 'bg-gray-300 text-gray-600'
      }`}>
        {isCompleted ? '✓' : isRequired ? '!' : '○'}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={`text-sm font-medium ${
            isCompleted ? 'text-green-800 line-through' : 
            isRequired ? 'text-red-800' : 
            'text-gray-800'
          }`}>
            {label}
            {isRequired && !isCompleted && <span className="text-red-500 ml-1">*</span>}
          </h4>
          
          {!isCompleted && actionLabel && onAction && (
            <button
              onClick={onAction}
              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {actionLabel}
            </button>
          )}
        </div>
        
        {description && (
          <p className={`text-xs mt-1 ${
            isCompleted ? 'text-green-600' : 
            isRequired ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export function CompletionSummary({ 
  title,
  items = [], // Array of { label, isCompleted, isRequired }
  onCompleteAll = null,
  className = ''
}) {
  const totalItems = items.length;
  const completedItems = items.filter(item => item.isCompleted).length;
  const requiredItems = items.filter(item => item.isRequired).length;
  const completedRequired = items.filter(item => item.isRequired && item.isCompleted).length;
  
  const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  const isAllRequiredComplete = requiredItems === completedRequired;
  const isFullyComplete = completedItems === totalItems;

  return (
    <div className={`bg-white rounded-xl border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <ProgressRing percentage={completionPercentage} size={50} />
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Progress</span>
          <span className="font-medium">{completedItems}/{totalItems} completed</span>
        </div>
        
        {requiredItems > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-red-600">Required Items</span>
            <span className={`font-medium ${isAllRequiredComplete ? 'text-green-600' : 'text-red-600'}`}>
              {completedRequired}/{requiredItems} completed
            </span>
          </div>
        )}
      </div>
      
      <div className="space-y-2 mb-4">
        {items.slice(0, 5).map((item, index) => (
          <ChecklistItem
            key={index}
            label={item.label}
            isCompleted={item.isCompleted}
            isRequired={item.isRequired}
            description={item.description}
            actionLabel={item.actionLabel}
            onAction={item.onAction}
          />
        ))}
        
        {items.length > 5 && (
          <div className="text-xs text-gray-500 text-center py-2">
            +{items.length - 5} more items...
          </div>
        )}
      </div>
      
      {!isFullyComplete && onCompleteAll && (
        <button
          onClick={onCompleteAll}
          disabled={!isAllRequiredComplete}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            isAllRequiredComplete
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isAllRequiredComplete ? 'Complete Remaining Items' : 'Complete Required Items First'}
        </button>
      )}
      
      {isFullyComplete && (
        <div className="text-center py-2">
          <span className="text-green-600 font-medium text-sm">
            🎉 All items completed!
          </span>
        </div>
      )}
    </div>
  );
}

// Specialized component for KPI completion status
export function KPICompletionIndicator({ 
  kpiData, 
  targetValue,
  currentValue, 
  label,
  unit = '',
  showTrend = false,
  previousValue = null 
}) {
  const isComplete = currentValue >= targetValue;
  const completionPercentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;
  const isAhead = completionPercentage > 110;
  const isBehind = completionPercentage < 75;
  
  const trend = showTrend && previousValue !== null ? currentValue - previousValue : null;

  return (
    <div className={`rounded-lg p-4 border ${
      isComplete ? 'bg-green-50 border-green-200' :
      isBehind ? 'bg-red-50 border-red-200' :
      'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className={`font-medium ${
          isComplete ? 'text-green-800' :
          isBehind ? 'text-red-800' :
          'text-yellow-800'
        }`}>
          {label}
        </h4>
        
        <TaskCompletionBadge 
          isCompleted={isComplete}
          isOverdue={isBehind}
          size="small"
        />
      </div>
      
      <div className="flex items-center gap-4 mb-2">
        <ProgressRing 
          percentage={completionPercentage} 
          size={40} 
          strokeWidth={4}
          showLabel={true}
        />
        
        <div className="flex-1">
          <div className="text-lg font-bold">
            {currentValue}{unit}
          </div>
          <div className="text-sm text-gray-600">
            Target: {targetValue}{unit}
          </div>
          {trend !== null && (
            <div className={`text-xs ${
              trend > 0 ? 'text-green-600' : 
              trend < 0 ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {trend > 0 ? '+' : ''}{trend}{unit} vs last month
            </div>
          )}
        </div>
      </div>
      
      {isAhead && (
        <div className="text-xs bg-green-100 text-green-700 p-2 rounded">
          🚀 Exceeding target! Great performance!
        </div>
      )}
      
      {isBehind && (
        <div className="text-xs bg-red-100 text-red-700 p-2 rounded">
          ⚠️ Below target. Consider focusing more effort here.
        </div>
      )}
    </div>
  );
}