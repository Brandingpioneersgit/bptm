import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useToast } from '@/shared/components/Toast';

// Data Card Component
export const DataCard = ({ title, value, subtitle, icon, color = 'blue', trend = null, onClick = null }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800'
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    neutral: '→'
  };

  return (
    <div 
      className={`p-6 rounded-lg border-2 transition-all duration-200 ${
        colorClasses[color] || colorClasses.blue
      } ${
        onClick ? 'cursor-pointer hover:shadow-lg transform hover:-translate-y-1' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {icon && <span className="text-2xl">{icon}</span>}
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          
          <div className="text-3xl font-bold mb-1">{value}</div>
          
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          
          {trend && (
            <div className={`flex items-center space-x-1 mt-2 text-sm ${
              trendColors[trend.direction] || trendColors.neutral
            }`}>
              <span>{trendIcons[trend.direction] || trendIcons.neutral}</span>
              <span>{trend.value}</span>
              <span className="text-gray-500">{trend.period}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Metric Row Component
export const MetricRow = ({ label, value, unit = '', progress = null, status = null, actions = null }) => {
  const statusColors = {
    success: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    error: 'text-red-600 bg-red-100',
    info: 'text-blue-600 bg-blue-100'
  };

  const getProgressColor = (progress) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          
          {status && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              statusColors[status.type] || statusColors.info
            }`}>
              {status.text}
            </span>
          )}
        </div>
        
        {progress !== null && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  getProgressColor(progress)
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-900">
            {value} {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
        </div>
        
        {actions && (
          <div className="flex space-x-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  action.variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                  action.variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
                  'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={action.disabled}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Smart Data Display Component
export const SmartDataDisplay = ({ 
  data = [], 
  title = 'Data Overview', 
  type = 'cards', // 'cards', 'table', 'metrics'
  columns = null,
  onItemClick = null,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  searchable = false,
  filterable = false,
  sortable = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const { notify } = useToast();

  // Filter and sort data
  const processedData = React.useMemo(() => {
    let filtered = [...data];

    // Apply search
    if (searchable && searchTerm) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filter
    if (filterable && filterField && filterValue) {
      filtered = filtered.filter(item => 
        String(item[filterField]).toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    // Apply sort
    if (sortable && sortField) {
      filtered.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return filtered;
  }, [data, searchTerm, sortField, sortDirection, filterField, filterValue, searchable, filterable, sortable]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (loading) {
    return (
      <div className="card-brand p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-brand p-6">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-brand p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-brand-text">{title}</h2>
        
        <div className="flex space-x-4">
          {searchable && (
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
          
          {filterable && (
            <div className="flex space-x-2">
              <select
                value={filterField}
                onChange={(e) => setFilterField(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Filter by...</option>
                {columns && columns.map(col => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>
              
              {filterField && (
                <input
                  type="text"
                  placeholder="Filter value..."
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {processedData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data</h3>
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div>
          {type === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedData.map((item, index) => (
                <DataCard
                  key={item.id || index}
                  title={item.title || item.name}
                  value={item.value || item.count}
                  subtitle={item.subtitle || item.description}
                  icon={item.icon}
                  color={item.color}
                  trend={item.trend}
                  onClick={onItemClick ? () => onItemClick(item) : null}
                />
              ))}
            </div>
          )}

          {type === 'metrics' && (
            <div className="space-y-1">
              {processedData.map((item, index) => (
                <MetricRow
                  key={item.id || index}
                  label={item.label || item.name}
                  value={item.value}
                  unit={item.unit}
                  progress={item.progress}
                  status={item.status}
                  actions={item.actions}
                />
              ))}
            </div>
          )}

          {type === 'table' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns && columns.map(col => (
                      <th
                        key={col.key}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                        }`}
                        onClick={sortable ? () => handleSort(col.key) : undefined}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{col.label}</span>
                          {sortable && sortField === col.key && (
                            <span className="text-blue-500">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {processedData.map((item, index) => (
                    <tr 
                      key={item.id || index}
                      className={onItemClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                      onClick={onItemClick ? () => onItemClick(item) : undefined}
                    >
                      {columns && columns.map(col => (
                        <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {col.render ? col.render(item[col.key], item) : item[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {processedData.length > 0 && (
        <div className="mt-6 flex justify-between items-center text-sm text-gray-500">
          <span>Showing {processedData.length} of {data.length} items</span>
          
          {(searchTerm || filterValue) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterValue('');
                setFilterField('');
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default { DataCard, MetricRow, SmartDataDisplay };