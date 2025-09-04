import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/features/auth/UnifiedAuthContext';
import { useToast } from '@/shared/components/Toast';
import { useDataSync } from './DataSyncContext';

// KPI Editor Component
export const KPIEditor = ({ employeeId = null, isManager = false }) => {
  const { user, role } = useUnifiedAuth();
  const { notify } = useToast();
  const { employees } = useDataSync();
  const [kpis, setKpis] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(employeeId || user?.id);
  const [editingKpi, setEditingKpi] = useState(null);
  const [newKpi, setNewKpi] = useState({
    title: '',
    description: '',
    target: '',
    current: '',
    unit: '',
    category: 'performance',
    priority: 'medium',
    deadline: ''
  });
  const [loading, setLoading] = useState(false);

  // KPI Categories
  const kpiCategories = [
    { value: 'performance', label: 'Performance', icon: '📊' },
    { value: 'productivity', label: 'Productivity', icon: '⚡' },
    { value: 'quality', label: 'Quality', icon: '✨' },
    { value: 'learning', label: 'Learning & Development', icon: '📚' },
    { value: 'collaboration', label: 'Collaboration', icon: '🤝' },
    { value: 'innovation', label: 'Innovation', icon: '💡' }
  ];

  // Priority levels
  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' }
  ];

  // Sample KPIs for demonstration
  useEffect(() => {
    loadKpis();
  }, [selectedEmployee]);

  const loadKpis = () => {
    // In a real app, this would fetch from the database
    const sampleKpis = [
      {
        id: 1,
        title: 'Monthly Sales Target',
        description: 'Achieve monthly sales target of $50,000',
        target: '50000',
        current: '35000',
        unit: 'USD',
        category: 'performance',
        priority: 'high',
        deadline: '2024-02-29',
        progress: 70,
        employeeId: selectedEmployee
      },
      {
        id: 2,
        title: 'Customer Satisfaction Score',
        description: 'Maintain customer satisfaction above 4.5/5',
        target: '4.5',
        current: '4.2',
        unit: 'rating',
        category: 'quality',
        priority: 'medium',
        deadline: '2024-03-15',
        progress: 93,
        employeeId: selectedEmployee
      },
      {
        id: 3,
        title: 'Training Completion',
        description: 'Complete 3 professional development courses',
        target: '3',
        current: '1',
        unit: 'courses',
        category: 'learning',
        priority: 'medium',
        deadline: '2024-04-30',
        progress: 33,
        employeeId: selectedEmployee
      }
    ];
    setKpis(sampleKpis);
  };

  const handleAddKpi = () => {
    if (!newKpi.title.trim() || !newKpi.target.trim()) {
      notify({
        title: 'Validation Error',
        message: 'Please fill in title and target value',
        type: 'error'
      });
      return;
    }

    const kpi = {
      id: Date.now(),
      ...newKpi,
      current: newKpi.current || '0',
      progress: newKpi.current && newKpi.target ? 
        Math.round((parseFloat(newKpi.current) / parseFloat(newKpi.target)) * 100) : 0,
      employeeId: selectedEmployee,
      createdAt: new Date().toISOString()
    };

    setKpis(prev => [...prev, kpi]);
    setNewKpi({
      title: '',
      description: '',
      target: '',
      current: '',
      unit: '',
      category: 'performance',
      priority: 'medium',
      deadline: ''
    });

    notify({
      title: 'KPI Added',
      message: 'New KPI has been successfully created',
      type: 'success'
    });
  };

  const handleUpdateKpi = (kpiId, updates) => {
    setKpis(prev => prev.map(kpi => {
      if (kpi.id === kpiId) {
        const updated = { ...kpi, ...updates };
        if (updated.current && updated.target) {
          updated.progress = Math.round((parseFloat(updated.current) / parseFloat(updated.target)) * 100);
        }
        return updated;
      }
      return kpi;
    }));

    notify({
      title: 'KPI Updated',
      message: 'KPI has been successfully updated',
      type: 'success'
    });
  };

  const handleDeleteKpi = (kpiId) => {
    setKpis(prev => prev.filter(kpi => kpi.id !== kpiId));
    notify({
      title: 'KPI Deleted',
      message: 'KPI has been removed',
      type: 'success'
    });
  };

  const getProgressColor = (progress) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-brand p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-brand-text">KPI Management</h2>
            <p className="text-brand-text-secondary mt-1">
              {isManager ? 'Manage team KPIs and track performance' : 'Track your key performance indicators'}
            </p>
          </div>
          
          {isManager && (
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.role}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-brand p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {kpis.length}
          </div>
          <div className="text-sm text-brand-text-secondary">Total KPIs</div>
        </div>
        
        <div className="card-brand p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {kpis.filter(kpi => kpi.progress >= 90).length}
          </div>
          <div className="text-sm text-brand-text-secondary">Achieved</div>
        </div>
        
        <div className="card-brand p-6 text-center">
          <div className="text-2xl font-bold text-yellow-600 mb-1">
            {kpis.filter(kpi => kpi.progress >= 50 && kpi.progress < 90).length}
          </div>
          <div className="text-sm text-brand-text-secondary">In Progress</div>
        </div>
        
        <div className="card-brand p-6 text-center">
          <div className="text-2xl font-bold text-red-600 mb-1">
            {kpis.filter(kpi => kpi.progress < 50).length}
          </div>
          <div className="text-sm text-brand-text-secondary">At Risk</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add New KPI */}
        <div className="card-brand p-6">
          <h3 className="text-lg font-semibold text-brand-text mb-4">Add New KPI</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">Title *</label>
              <input
                type="text"
                value={newKpi.title}
                onChange={(e) => setNewKpi(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter KPI title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text mb-2">Description</label>
              <textarea
                value={newKpi.description}
                onChange={(e) => setNewKpi(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the KPI"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">Target *</label>
                <input
                  type="number"
                  value={newKpi.target}
                  onChange={(e) => setNewKpi(prev => ({ ...prev, target: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Target value"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">Current</label>
                <input
                  type="number"
                  value={newKpi.current}
                  onChange={(e) => setNewKpi(prev => ({ ...prev, current: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Current value"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">Category</label>
                <select
                  value={newKpi.category}
                  onChange={(e) => setNewKpi(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {kpiCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">Priority</label>
                <select
                  value={newKpi.priority}
                  onChange={(e) => setNewKpi(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {priorityLevels.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">Unit</label>
                <input
                  type="text"
                  value={newKpi.unit}
                  onChange={(e) => setNewKpi(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., USD, %, hours"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">Deadline</label>
                <input
                  type="date"
                  value={newKpi.deadline}
                  onChange={(e) => setNewKpi(prev => ({ ...prev, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleAddKpi}
              className="w-full btn-brand-primary"
            >
              Add KPI
            </button>
          </div>
        </div>

        {/* KPI List */}
        <div className="card-brand p-6">
          <h3 className="text-lg font-semibold text-brand-text mb-4">
            Current KPIs {selectedEmployeeData && `- ${selectedEmployeeData.name}`}
          </h3>
          
          <div className="space-y-4">
            {kpis.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-brand-text-secondary">No KPIs defined yet</p>
              </div>
            ) : (
              kpis.map(kpi => (
                <div key={kpi.id} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-brand-text">{kpi.title}</h4>
                      <p className="text-sm text-brand-text-secondary mt-1">
                        {kpi.description}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingKpi(kpi.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteKpi(kpi.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress: {kpi.current}/{kpi.target} {kpi.unit}</span>
                      <span className="font-medium">{kpi.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(kpi.progress)}`}
                        style={{ width: `${Math.min(kpi.progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-brand-text-secondary">
                    <span className={`px-2 py-1 rounded-full ${
                      kpi.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      kpi.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      kpi.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {kpi.priority}
                    </span>
                    
                    {kpi.deadline && (
                      <span>Due: {new Date(kpi.deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIEditor;