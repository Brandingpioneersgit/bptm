import React, { useState, useEffect, useMemo } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { LoadingSpinner } from '@/shared/components/LoadingStates';
import { Section } from '@/shared/components/ui';
import { thisMonthKey, monthLabel, prevMonthKey } from '@/shared/lib/constants';
import { PlusIcon, PencilIcon, TrashIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, InformationCircleIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

// Sparkline Component
const Sparkline = ({ data, color = '#3B82F6' }) => {
  if (!data || data.length < 2) return null;
  
  return (
    <div className="h-8 w-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Enhanced Trend Indicator Component
const TrendIndicator = ({ current, previous, label, format = 'number', sparklineData }) => {
  const change = current - previous;
  const percentChange = previous > 0 ? ((change / previous) * 100) : 0;
  const isPositive = change > 0;
  const isNeutral = change === 0;
  
  const formatValue = (value) => {
    switch (format) {
      case 'percentage': return `${value}%`;
      case 'currency': return `₹${value.toLocaleString()}`;
      case 'decimal': return value.toFixed(2);
      default: return value.toString();
    }
  };
  
  return (
    <div className="flex items-center space-x-2">
      <div className="text-2xl font-bold text-gray-900">
        {formatValue(current)}
      </div>
      
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
        isNeutral 
          ? 'bg-gray-100 text-gray-600'
          : isPositive 
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
      }`}>
        {isPositive ? (
          <ArrowTrendingUpIcon className="h-3 w-3" />
        ) : (
          <ArrowTrendingDownIcon className="h-3 w-3" />
        )}
        <span>
          {isNeutral ? '0%' : `${Math.abs(percentChange).toFixed(1)}%`}
        </span>
      </div>
      
      <div className="text-xs text-gray-500">
        vs last month
      </div>
      
      <Sparkline 
        data={sparklineData} 
        color={isPositive ? '#10B981' : '#EF4444'} 
      />
    </div>
  );
};

// Mini Chart Component (Simple Line Chart)
const MiniChart = ({ data, color = 'blue' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
        No data available
      </div>
    );
  }
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="h-16 w-full">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polyline
          fill="none"
          stroke={color === 'blue' ? '#3B82F6' : color === 'green' ? '#10B981' : '#EF4444'}
          strokeWidth="2"
          points={points}
        />
        {data.map((value, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((value - min) / range) * 100;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={color === 'blue' ? '#3B82F6' : color === 'green' ? '#10B981' : '#EF4444'}
            />
          );
        })}
      </svg>
    </div>
  );
};

// KPI Detail Modal Component
const KPIDetailModal = ({ kpi, isOpen, onClose, historicalData }) => {
  if (!isOpen || !kpi) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">{kpi.title} Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Formula & Calculation</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">{kpi.description}</p>
              <p className="text-sm font-mono mt-2">Current Value: {kpi.current}</p>
              <p className="text-sm font-mono">Target: {kpi.target}</p>
              <p className="text-sm font-mono">Achievement: {((kpi.current / kpi.target) * 100).toFixed(1)}%</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">6-Month Trend</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced KPI Card Component
const KPICard = ({ title, current, previous, target, data, format, color, description, onEdit, onDelete, onViewDetails, canOverride, onOverride }) => {
  const achievementRate = target > 0 ? (current / target) * 100 : 0;
  const isTargetMet = current >= target;
  const sparklineData = data?.slice(-6).map((value, index) => ({ value, index })) || [];
  
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={() => onViewDetails && onViewDetails({ title, current, previous, target, data, format, color, description })}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium text-gray-600 mb-1 group-hover:text-blue-600 transition-colors">{title}</h4>
            <InformationCircleIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
          </div>
          <TrendIndicator 
            current={current} 
            previous={previous} 
            format={format}
            sparklineData={sparklineData}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${
            isTargetMet ? 'bg-green-100' : achievementRate > 75 ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            <div className={`text-xs font-medium ${
              isTargetMet ? 'text-green-700' : achievementRate > 75 ? 'text-yellow-700' : 'text-red-700'
            }`}>
              {achievementRate.toFixed(0)}%
            </div>
          </div>
          
          <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
            {canOverride && (
              <button
                onClick={() => onOverride && onOverride({ title, current, previous, target, data, format, color, description })}
                className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                title="Manager Override"
              >
                <LockClosedIcon className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onEdit && onEdit({ title, current, previous, target, data, format, color, description })}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete && onDelete()}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Target vs Achievement */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Target: {format === 'currency' ? `₹${target.toLocaleString()}` : target}</span>
          <span>{achievementRate.toFixed(1)}% achieved</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              isTargetMet ? 'bg-green-500' : achievementRate > 75 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(achievementRate, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Mini Chart */}
      <div className="mb-3">
        <MiniChart data={data} color={color} />
      </div>
      
      {/* Description */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{description}</p>
        {isTargetMet && (
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
        )}
      </div>
    </div>
  );
};

// Performance Score Component
const PerformanceScore = ({ kpis, employee }) => {
  const totalScore = useMemo(() => {
    if (!kpis || kpis.length === 0) return 0;
    
    const scores = kpis.map(kpi => {
      const achievementRate = kpi.target > 0 ? (kpi.current / kpi.target) * 100 : 0;
      return Math.min(achievementRate, 100); // Cap at 100%
    });
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }, [kpis]);
  
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };
  
  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Average';
    return 'Needs Improvement';
  };
  
  return (
    <div className={`border-2 rounded-lg p-6 ${getScoreColor(totalScore)}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Overall Performance Score</h3>
        
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="text-4xl font-bold">
            {totalScore.toFixed(1)}
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{getScoreLabel(totalScore)}</div>
            <div className="text-xs opacity-75">out of 100</div>
          </div>
        </div>
        
        {/* Score Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium">KPIs Tracked</div>
            <div className="text-lg font-bold">{kpis?.length || 0}</div>
          </div>
          <div>
            <div className="font-medium">Targets Met</div>
            <div className="text-lg font-bold">
              {kpis?.filter(kpi => kpi.current >= kpi.target).length || 0}
            </div>
          </div>
          <div>
            <div className="font-medium">Avg Achievement</div>
            <div className="text-lg font-bold">{totalScore.toFixed(0)}%</div>
          </div>
          <div>
            <div className="font-medium">Rank</div>
            <div className="text-lg font-bold">#-</div>
          </div>
        </div>
        
        <div className="mt-4 text-xs opacity-75">
          This score is visible on your profile and agency dashboard
        </div>
      </div>
    </div>
  );
};

// KPI Editor Modal
const KPIEditor = ({ isOpen, onClose, kpi, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    target: 0,
    current: 0,
    format: 'number',
    description: ''
  });
  
  useEffect(() => {
    if (kpi) {
      setFormData({
        title: kpi.title || '',
        target: kpi.target || 0,
        current: kpi.current || 0,
        format: kpi.format || 'number',
        description: kpi.description || ''
      });
    } else {
      setFormData({
        title: '',
        target: 0,
        current: 0,
        format: 'number',
        description: ''
      });
    }
  }, [kpi, isOpen]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">
          {kpi ? 'Edit KPI' : 'Add New KPI'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">KPI Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
              <input
                type="number"
                value={formData.target}
                onChange={(e) => setFormData(prev => ({ ...prev, target: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current</label>
              <input
                type="number"
                value={formData.current}
                onChange={(e) => setFormData(prev => ({ ...prev, current: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              value={formData.format}
              onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="number">Number</option>
              <option value="percentage">Percentage</option>
              <option value="currency">Currency (₹)</option>
              <option value="decimal">Decimal</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="What does this KPI measure?"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {kpi ? 'Update' : 'Add'} KPI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const PerformanceKPI = ({ employee }) => {
  const supabase = useSupabase();
  const { notify } = useToast();
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState([]);
  const [historicalData, setHistoricalData] = useState({});
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [canOverride, setCanOverride] = useState(false);
  
  const currentMonth = thisMonthKey();
  const previousMonth = prevMonthKey(currentMonth);
  
  // Fetch KPIs and historical data
  useEffect(() => {
    const fetchKPIData = async () => {
      if (!employee?.id) return;
      
      setLoading(true);
      try {
        // Fetch current month KPIs
        const { data: currentKPIs, error: kpiError } = await supabase
          .from('employee_kpis')
          .select('*')
          .eq('employee_id', employee.id)
          .eq('month_key', currentMonth);
        
        if (kpiError) throw kpiError;
        
        // Fetch previous month KPIs for comparison
        const { data: previousKPIs, error: prevError } = await supabase
          .from('employee_kpis')
          .select('*')
          .eq('employee_id', employee.id)
          .eq('month_key', previousMonth);
        
        if (prevError) throw prevError;
        
        // Fetch historical data for charts (last 6 months)
        const months = [];
        let currentDate = new Date();
        for (let i = 0; i < 6; i++) {
          const year = currentDate.getFullYear();
          const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
          months.push(`${year}-${month}`);
          currentDate.setMonth(currentDate.getMonth() - 1);
        }
        
        const { data: historicalKPIs, error: histError } = await supabase
          .from('employee_kpis')
          .select('*')
          .eq('employee_id', employee.id)
          .in('month_key', months)
          .order('month_key', { ascending: true });
        
        if (histError) throw histError;
        
        // Process data
        const processedKPIs = (currentKPIs || []).map(kpi => {
          const prevKPI = previousKPIs?.find(p => p.kpi_name === kpi.kpi_name);
          const historical = historicalKPIs?.filter(h => h.kpi_name === kpi.kpi_name) || [];
          
          return {
            id: kpi.id,
            title: kpi.kpi_name,
            current: kpi.current_value || 0,
            previous: prevKPI?.current_value || 0,
            target: kpi.target_value || 0,
            format: kpi.format || 'number',
            description: kpi.description || '',
            data: historical.map(h => h.current_value || 0),
            color: kpi.color || 'blue'
          };
        });
        
        setKpis(processedKPIs);
        
        // Process historical data for charts
        const histData = {};
        historicalKPIs?.forEach(kpi => {
          if (!histData[kpi.kpi_name]) {
            histData[kpi.kpi_name] = [];
          }
          histData[kpi.kpi_name].push({
            month: kpi.month_key,
            value: kpi.current_value || 0
          });
        });
        
        setHistoricalData(histData);
        
      } catch (error) {
        console.error('Error fetching KPI data:', error);
        notify('Failed to load KPI data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchKPIData();
  }, [employee, currentMonth, previousMonth, supabase, notify]);
  
  const handleSaveKPI = async (kpiData) => {
    try {
      const dataToSave = {
        employee_id: employee.id,
        month_key: currentMonth,
        kpi_name: kpiData.title,
        current_value: kpiData.current,
        target_value: kpiData.target,
        format: kpiData.format,
        description: kpiData.description,
        color: 'blue',
        updated_at: new Date().toISOString()
      };
      
      if (editingKPI) {
        const { error } = await supabase
          .from('employee_kpis')
          .update(dataToSave)
          .eq('id', editingKPI.id);
        
        if (error) throw error;
        notify('KPI updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('employee_kpis')
          .insert(dataToSave);
        
        if (error) throw error;
        notify('KPI added successfully!', 'success');
      }
      
      // Refresh data
      window.location.reload();
      
    } catch (error) {
      console.error('Error saving KPI:', error);
      notify('Failed to save KPI', 'error');
    }
  };
  
  const handleDeleteKPI = async (kpiId) => {
    if (!confirm('Are you sure you want to delete this KPI?')) return;
    
    try {
      const { error } = await supabase
        .from('employee_kpis')
        .delete()
        .eq('id', kpiId);
      
      if (error) throw error;
      
      setKpis(prev => prev.filter(kpi => kpi.id !== kpiId));
      notify('KPI deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting KPI:', error);
      notify('Failed to delete KPI', 'error');
    }
  };
  
  if (loading) {
    return (
      <Section title="📊 Performance & KPI Tracking" className="bg-white">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Section>
    );
  }
  
  return (
    <Section title="📊 Performance & KPI Tracking" className="bg-white">
      <div className="space-y-6">
        {/* Header with Add KPI Button */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Your KPIs for {monthLabel(currentMonth)}</h3>
            <p className="text-sm text-gray-600">Track your key performance indicators and see growth trends</p>
          </div>
          
          <button
            onClick={() => {
              setEditingKPI(null);
              setIsEditorOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <span>+</span>
            <span>Add KPI</span>
          </button>
        </div>
        
        {/* Performance Score */}
        <PerformanceScore kpis={kpis} employee={employee} />
        
        {/* KPI Cards Grid */}
        {kpis.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi) => (
              <KPICard 
                key={kpi.id}
                {...kpi}
                onEdit={(kpiData) => {
                  setEditingKPI(kpiData);
                  setIsEditorOpen(true);
                }}
                onDelete={() => handleDeleteKPI(kpi.id)}
                onViewDetails={(kpiData) => {
                  setSelectedKPI(kpiData);
                  setDetailModalOpen(true);
                }}
                canOverride={canOverride}
                onOverride={(kpiData) => {
                  // Handle manager override functionality
                  console.log('Override KPI:', kpiData);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No KPIs Added Yet</h3>
            <p className="text-gray-600 mb-4">Start tracking your performance by adding your first KPI</p>
            <button
              onClick={() => {
                setEditingKPI(null);
                setIsEditorOpen(true);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Your First KPI
            </button>
          </div>
        )}
        
        {/* KPI Editor Modal */}
        <KPIEditor
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          kpi={editingKPI}
          onSave={handleSaveKPI}
        />
        
        {/* KPI Detail Modal */}
        <KPIDetailModal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          kpi={selectedKPI}
          historicalData={selectedKPI ? historicalData[selectedKPI.title] || [] : []}
        />
        
        {/* Info Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-800 mb-2">ℹ️ How KPI Tracking Works</h5>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• <strong>Performance Score:</strong> Average of all your KPI achievement rates (target vs actual)</p>
            <p>• <strong>Trend Indicators:</strong> Compare current month performance with previous month</p>
            <p>• <strong>Visual Charts:</strong> See your progress over the last 6 months</p>
            <p>• <strong>Agency Ranking:</strong> Your performance score is used for agency-wide rankings</p>
            <p>• <strong>Target Setting:</strong> Work with your manager to set realistic and challenging targets</p>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default PerformanceKPI;