import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import departmentTargetService from '@/shared/services/departmentTargetService';

const DEPARTMENT_TARGETS = {
  agency: {
    name: 'Full Agency',
    target: 60,
    unit: 'clients',
    icon: '🏢',
    color: 'from-blue-500 to-blue-600'
  },
  seo: {
    name: 'SEO',
    targets: {
      leads: { value: 20, unit: 'leads per website', icon: '📈' },
      calls: { value: 100, unit: 'calls per GMB', icon: '📞' }
    },
    color: 'from-green-500 to-green-600'
  },
  ads: {
    name: 'Ads',
    target: 'converted business',
    unit: 'conversions',
    icon: '🎯',
    color: 'from-purple-500 to-purple-600'
  },
  webpages: {
    name: 'Web Development',
    target: 200,
    unit: 'pages per month',
    icon: '💻',
    color: 'from-orange-500 to-orange-600'
  }
};

const DepartmentTargetBar = ({ department = 'all', compact = false }) => {
  const supabase = useSupabase();
  const { authState } = useUnifiedAuth();
  const { user } = authState;
  const [targetData, setTargetData] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format

  useEffect(() => {
    fetchTargetData();
  }, [department, currentMonth]);

  const fetchTargetData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from department target service
      const targets = await departmentTargetService.getDepartmentTargets();
      setTargetData(targets);
    } catch (error) {
      console.error('Error fetching target data:', error);
      // Use fallback data on error
      const fallbackData = departmentTargetService.getFallbackTargets();
      setTargetData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = (current, target, color) => {
    const percentage = Math.min((current / target) * 100, 100);
    const isOverTarget = current > target;
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${color} transition-all duration-500 ease-out ${
            isOverTarget ? 'animate-pulse' : ''
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
        {isOverTarget && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 opacity-30 animate-pulse"></div>
        )}
      </div>
    );
  };

  const renderTargetCard = (key, config, data) => {
    if (!data) return null;
    
    const isMultiTarget = config.targets;
    
    if (compact) {
      return (
        <div key={key} className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{config.icon}</span>
              <span className="font-medium text-sm text-gray-900">{config.name}</span>
            </div>
            {!isMultiTarget && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                data.percentage >= 100 ? 'bg-green-100 text-green-700' :
                data.percentage >= 75 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {data.percentage.toFixed(0)}%
              </span>
            )}
          </div>
          
          {isMultiTarget ? (
            <div className="space-y-2">
              {Object.entries(config.targets).map(([targetKey, targetConfig]) => {
                const targetData = data[targetKey];
                if (!targetData) return null;
                
                return (
                  <div key={targetKey} className="text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-600">{targetConfig.icon} {targetConfig.unit}</span>
                      <span className="font-medium">{targetData.current}/{targetData.target}</span>
                    </div>
                    {renderProgressBar(targetData.current, targetData.target, config.color)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600">{config.unit}</span>
                <span className="text-sm font-medium">{data.current}/{data.target}</span>
              </div>
              <div className="relative">
                {renderProgressBar(data.current, data.target, config.color)}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-gradient-to-r ${config.color} rounded-lg flex items-center justify-center text-white text-xl`}>
              {config.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{config.name}</h3>
              <p className="text-sm text-gray-600">Monthly Targets</p>
            </div>
          </div>
          {!isMultiTarget && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              data.percentage >= 100 ? 'bg-green-100 text-green-700' :
              data.percentage >= 75 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {data.percentage.toFixed(1)}%
            </div>
          )}
        </div>
        
        {isMultiTarget ? (
          <div className="space-y-4">
            {Object.entries(config.targets).map(([targetKey, targetConfig]) => {
              const targetData = data[targetKey];
              if (!targetData) return null;
              
              return (
                <div key={targetKey}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {targetConfig.icon} {targetConfig.unit}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">{targetData.current}</span>
                      <span className="text-gray-500">/</span>
                      <span className="text-sm text-gray-600">{targetData.target}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        targetData.percentage >= 100 ? 'bg-green-100 text-green-700' :
                        targetData.percentage >= 75 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {targetData.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    {renderProgressBar(targetData.current, targetData.target, config.color)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">{config.unit}</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">{data.current}</span>
                <span className="text-gray-500">/</span>
                <span className="text-lg text-gray-600">{data.target}</span>
              </div>
            </div>
            <div className="relative">
              {renderProgressBar(data.current, data.target, config.color)}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {data.current > data.target ? 
                `🎉 Exceeded target by ${data.current - data.target} ${config.unit}!` :
                `${data.target - data.current} ${config.unit} remaining`
              }
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`${compact ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`bg-gray-100 rounded-lg ${compact ? 'h-20' : 'h-32'} animate-pulse`}></div>
        ))}
      </div>
    );
  }

  const departmentsToShow = department === 'all' 
    ? Object.keys(DEPARTMENT_TARGETS)
    : [department].filter(d => DEPARTMENT_TARGETS[d]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${compact ? 'text-lg' : 'text-xl'} font-semibold text-gray-900`}>
            🎯 Department Targets
          </h2>
          <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600`}>
            {currentMonth} Progress Tracking
          </p>
        </div>
        <button
          onClick={fetchTargetData}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>
      
      <div className={`${compact ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
        {departmentsToShow.map(key => {
          const config = DEPARTMENT_TARGETS[key];
          const data = targetData[key];
          return renderTargetCard(key, config, data);
        })}
      </div>
      
      {!compact && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💡</span>
            <span className="font-medium text-gray-900">Target Achievement Tips</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <strong>SEO Team:</strong> Focus on quality lead generation and GMB optimization
            </div>
            <div>
              <strong>Ads Team:</strong> Prioritize conversion tracking and client retention
            </div>
            <div>
              <strong>Web Team:</strong> Streamline development processes for faster delivery
            </div>
            <div>
              <strong>Agency:</strong> Maintain client satisfaction while scaling operations
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentTargetBar;