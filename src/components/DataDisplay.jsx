import React from 'react';

/**
 * Enhanced data display component that distinguishes between missing and zero values
 * Provides clear visual indicators and helpful messaging
 */

// Utility function to determine data state
export const getDataState = (value, fieldName) => {
  // Check if value is explicitly zero
  if (value === 0 || value === '0') {
    return {
      state: 'zero',
      displayValue: '0',
      message: `No ${fieldName.toLowerCase()} recorded this period`,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      icon: '📊'
    };
  }
  
  // Check if value is missing/null/undefined/empty
  if (value === null || value === undefined || value === '' || 
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && Object.keys(value).length === 0)) {
    return {
      state: 'missing',
      displayValue: '—',
      message: `No ${fieldName.toLowerCase()} data submitted yet`,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      icon: '⚠️'
    };
  }
  
  // Has actual data
  return {
    state: 'hasData',
    displayValue: value,
    message: null,
    color: 'text-gray-900',
    bgColor: 'bg-white',
    icon: '✓'
  };
};

// Main data display component
export function SmartDataDisplay({ 
  value, 
  fieldName, 
  unit = '', 
  className = '',
  showIcon = true,
  showTooltip = true,
  size = 'normal' // normal, large, small
}) {
  const dataState = getDataState(value, fieldName);
  
  const sizeClasses = {
    small: 'text-sm',
    normal: 'text-base',
    large: 'text-lg font-semibold'
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showIcon && (
        <span className="text-sm" title={dataState.message}>
          {dataState.icon}
        </span>
      )}
      
      <span className={`${sizeClasses[size]} ${dataState.color}`}>
        {dataState.displayValue}{unit}
      </span>
      
      {showTooltip && dataState.message && (
        <div className="group relative">
          <span className="cursor-help text-gray-400 hover:text-gray-600">ⓘ</span>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            {dataState.message}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Card component for displaying data with clear missing/zero distinction
export function DataCard({ 
  title, 
  value, 
  unit = '', 
  previousValue = null,
  icon = '📊',
  className = '' 
}) {
  const dataState = getDataState(value, title);
  const prevDataState = previousValue !== null ? getDataState(previousValue, title) : null;
  
  // Calculate change if both current and previous values exist
  const change = (dataState.state === 'hasData' && prevDataState?.state === 'hasData') 
    ? Number(value) - Number(previousValue) 
    : null;

  return (
    <div className={`rounded-xl border p-4 ${dataState.bgColor} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
        
        {dataState.state !== 'hasData' && (
          <div className="text-xs px-2 py-1 rounded-full bg-white/50 border">
            {dataState.state === 'zero' ? 'Zero Value' : 'No Data'}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${dataState.color}`}>
            {dataState.displayValue}
          </span>
          {unit && dataState.state === 'hasData' && (
            <span className="text-sm text-gray-500">{unit}</span>
          )}
        </div>
        
        {dataState.message && (
          <p className="text-xs text-gray-600 italic">
            {dataState.message}
          </p>
        )}
        
        {change !== null && (
          <div className={`text-xs flex items-center gap-1 ${
            change > 0 ? 'text-green-600' : 
            change < 0 ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            <span>{change > 0 ? '↗️' : change < 0 ? '↘️' : '➡️'}</span>
            <span>
              {change >= 0 ? '+' : ''}{change} from last period
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Metric row component for tables/lists
export function MetricRow({ 
  label, 
  currentValue, 
  previousValue, 
  unit = '',
  target = null 
}) {
  const currentState = getDataState(currentValue, label);
  const previousState = previousValue !== null ? getDataState(previousValue, label) : null;

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        {target && (
          <p className="text-xs text-gray-500">Target: {target}{unit}</p>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {/* Previous Value */}
        {previousState && (
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Previous</p>
            <SmartDataDisplay 
              value={previousValue}
              fieldName={label}
              unit={unit}
              size="small"
              showTooltip={false}
            />
          </div>
        )}
        
        {/* Arrow */}
        {previousState && (
          <span className="text-gray-400">→</span>
        )}
        
        {/* Current Value */}
        <div className="text-right min-w-[80px]">
          <p className="text-xs text-gray-500 mb-1">Current</p>
          <SmartDataDisplay 
            value={currentValue}
            fieldName={label}
            unit={unit}
            size="normal"
            showTooltip={true}
          />
        </div>
      </div>
    </div>
  );
}

// Helper component for arrays/lists with proper empty state handling
export function ListDisplay({ 
  items, 
  fieldName, 
  renderItem, 
  emptyMessage = null,
  className = '' 
}) {
  const dataState = getDataState(items, fieldName);
  
  if (dataState.state === 'hasData' && Array.isArray(items) && items.length > 0) {
    return (
      <div className={className}>
        {items.map((item, index) => renderItem(item, index))}
      </div>
    );
  }
  
  return (
    <div className={`p-4 rounded-lg ${dataState.bgColor} border border-dashed ${className}`}>
      <div className="text-center">
        <span className="text-2xl mb-2 block">{dataState.icon}</span>
        <p className={`text-sm font-medium ${dataState.color}`}>
          {emptyMessage || dataState.message}
        </p>
        {dataState.state === 'zero' && (
          <p className="text-xs text-gray-500 mt-1">
            This indicates zero items, not missing data
          </p>
        )}
      </div>
    </div>
  );
}