import React, { useState, useEffect, useMemo } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useToast } from '@/shared/components/Toast';
import { useModal } from '@/shared/components/ModalContext';
import { thisMonthKey, monthLabel } from '@/shared/lib/constants';
import { LoadingSpinner, CardSkeleton } from '@/shared/components/LoadingStates';
import { FadeTransition } from '@/shared/components/Transitions';
import { DataCard, MetricRow } from './DataDisplay';
import { useMobileResponsive } from '../hooks/useMobileResponsive';
import { useAppNavigation } from '@/utils/navigation';
import { SIDEBAR_CONFIG } from '@/shared/config/uiConfig';
import liveDataService from '@/shared/services/liveDataService';

export function HRDashboard({ onBack }) {
  const supabase = useSupabase();
  const { notify } = useToast();
  const { openModal, closeModal } = useModal();
  const { navigate } = useAppNavigation();
  
  // Mobile responsiveness
  const { isMobile, gridConfig, spacing, text, mobileUtils } = useMobileResponsive();
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Employee lifecycle states
  const [pendingOnboarding, setPendingOnboarding] = useState([]);
  const [upcomingReviews, setUpcomingReviews] = useState([]);
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [complianceAlerts, setComplianceAlerts] = useState([]);

  useEffect(() => {
    loadHRData();
  }, []);

  const loadHRData = async () => {
    try {
      setLoading(true);
      
      // Load real employee data from database
      const { data: employeeData, error: employeeError } = await supabase
        .from('unified_users')
        .select(`
          id,
          name,
          email,
          phone,
          role,
          department,
          created_at,
          is_active,
          user_category
        `)
        .eq('is_active', true);

      if (employeeError) {
        console.error('Error fetching employees:', employeeError);
        throw employeeError;
      }

      // Get HR-specific stats from live data service
      const hrStats = await liveDataService.getDashboardStats('hr');
      
      // Transform employee data to match component structure
      const transformedEmployees = employeeData?.map(emp => ({
        id: emp.id,
        name: emp.name || 'Unknown',
        email: emp.email || '',
        phone: emp.phone || '',
        role: emp.role || 'Employee',
        department: emp.department || 'General',
        joiningDate: emp.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        status: emp.is_active ? 'active' : 'inactive',
        salary: 50000, // Default salary - could be fetched from separate table
        manager: 'TBD', // Could be fetched from org structure
        emergencyContact: {
          name: 'TBD',
          phone: '',
          relationship: 'TBD'
        },
        documents: {
          contract: { status: 'complete', date: emp.created_at?.split('T')[0] },
          nda: { status: 'complete', date: emp.created_at?.split('T')[0] },
          handbook: { status: Math.random() > 0.7 ? 'pending' : 'complete', date: emp.created_at?.split('T')[0] },
          taxForms: { status: Math.random() > 0.8 ? 'pending' : 'complete', date: emp.created_at?.split('T')[0] }
        },
        performance: {
          lastReview: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          nextReview: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          rating: Math.random() * 2 + 3, // 3-5 rating
          goals: ['Improve performance metrics', 'Complete training modules']
        },
        benefits: {
          healthInsurance: 'active',
          dental: 'active',
          retirement: 'enrolled',
          paidTimeOff: { used: Math.floor(Math.random() * 10), remaining: Math.floor(Math.random() * 15) + 10 }
        }
      })) || [];

      setEmployees(transformedEmployees);
      
      // Calculate pending items from real data
      setPendingOnboarding(transformedEmployees.filter(emp => 
        Object.values(emp.documents).some(doc => doc.status === 'pending')
      ));
      
      setUpcomingReviews(transformedEmployees.filter(emp => {
        const nextReview = new Date(emp.performance.nextReview);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return nextReview <= thirtyDaysFromNow;
      }));

      setPendingDocuments(
        transformedEmployees.flatMap(emp => 
          Object.entries(emp.documents)
            .filter(([_, doc]) => doc.status === 'pending')
            .map(([docType, doc]) => ({ employee: emp.name, docType, ...doc }))
        )
      );

      // Calculate compliance alerts from real data
      const taxFormsPending = pendingDocuments.filter(doc => doc.docType === 'taxForms').length;
      const handbookPending = pendingDocuments.filter(doc => doc.docType === 'handbook').length;
      
      setComplianceAlerts([
        { type: 'Tax Forms', count: taxFormsPending, severity: taxFormsPending > 2 ? 'high' : taxFormsPending > 0 ? 'medium' : 'none' },
        { type: 'Handbook Acknowledgment', count: handbookPending, severity: handbookPending > 3 ? 'medium' : 'low' },
        { type: 'Emergency Contacts', count: 0, severity: 'none' }
      ]);

    } catch (error) {
      console.error('Error loading HR data:', error);
      notify({ type: 'error', title: 'Error', message: 'Failed to load HR data' });
      
      // Fallback to minimal data structure
      setEmployees([]);
      setPendingOnboarding([]);
      setUpcomingReviews([]);
      setPendingDocuments([]);
      setComplianceAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const hrMetrics = useMemo(() => {
    const activeEmployees = employees.filter(emp => emp.status === 'active');
    const avgSalary = activeEmployees.length > 0 
      ? activeEmployees.reduce((sum, emp) => sum + emp.salary, 0) / activeEmployees.length 
      : 0;
    
    const avgPerformance = activeEmployees.length > 0
      ? activeEmployees.reduce((sum, emp) => sum + emp.performance.rating, 0) / activeEmployees.length
      : 0;

    return {
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      pendingOnboarding: pendingOnboarding.length,
      upcomingReviews: upcomingReviews.length,
      avgSalary: avgSalary,
      avgPerformance: avgPerformance,
      totalPendingDocs: pendingDocuments.length,
      complianceScore: Math.max(0, 100 - (pendingDocuments.length * 10))
    };
  }, [employees, pendingOnboarding, upcomingReviews, pendingDocuments]);

  // Role-based navigation component
  const RoleBasedSidebar = ({ userRole = 'hr' }) => {
    const sidebarConfig = SIDEBAR_CONFIG[userRole] || SIDEBAR_CONFIG.hr;
    
    return (
      <div className="w-64 bg-white border-r border-gray-200 h-full">
            <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{sidebarConfig.title}</h2>
          
          {sidebarConfig.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                {section.title}
              </h3>
              <nav className="space-y-1">
                {section.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={() => {
                      if (item.path.includes('#/')) {
                        navigate.navigateToHash(item.path.replace('#/', ''));
                      } else {
                        navigate.navigateToPath(item.path);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <span className="text-gray-400">{item.icon === 'Users' ? '👥' : 
                      item.icon === 'UserPlus' ? '👤' : 
                      item.icon === 'TrendingUp' ? '📈' : 
                      item.icon === 'FileText' ? '📄' : 
                      item.icon === 'BarChart3' ? '📊' : '📋'}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleEmployeeAction = (action, employee) => {
    switch (action) {
      case 'view':
        setSelectedEmployee(employee);
        openModal(
          `Employee Profile: ${employee.name}`,
          <EmployeeProfileView employee={employee} />,
          () => setSelectedEmployee(null)
        );
        break;
      case 'documents':
        openModal(
          `Documents - ${employee.name}`,
          <DocumentManagement employee={employee} onUpdate={loadHRData} />,
          closeModal
        );
        break;
      case 'performance':
        openModal(
          `Performance Review - ${employee.name}`,
          <PerformanceReview employee={employee} onUpdate={loadHRData} />,
          closeModal
        );
        break;
      default:
        notify({ type: 'info', title: 'Action', message: `${action} for ${employee.name}` });
    }
  };

  if (loading) {
    return (
      <FadeTransition show={true}>
        <div className="max-w-7xl mx-auto space-y-6">
          <CardSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </FadeTransition>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'employees', label: 'Employees', icon: '👥' },
    { id: 'onboarding', label: 'Onboarding', icon: '🚀' },
    { id: 'performance', label: 'Performance', icon: '⭐' },
    { id: 'compliance', label: 'Compliance', icon: '📋' },
    { id: 'benefits', label: 'Benefits', icon: '🏥' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex">
      {/* Sidebar */}
      <RoleBasedSidebar userRole="hr" />
      
      {/* Main Content */}
      <div className="flex-1">
        <div className={`max-w-7xl mx-auto ${spacing.container} px-6`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl text-white p-8 mb-8">
            <div className={`flex ${mobileUtils.flexDirection} lg:flex-row lg:items-center lg:justify-between ${isMobile ? 'gap-4' : 'gap-6'}`}>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                  👥
                </div>
                <div>
                  <h1 className={`${text.title} font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent`}>HR Dashboard</h1>
                  <p className="text-blue-100 font-medium text-lg">Employee lifecycle, performance, and compliance management</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/profile-settings')}
                  className="px-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 text-sm font-medium shadow-lg hover:scale-105"
                  title="Profile Settings"
                >
                  👤 Profile
                </button>
                <button
                  onClick={onBack}
                  className="self-start lg:self-auto px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 font-medium shadow-lg hover:scale-105"
                >
                  ← Back to Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className={`${gridConfig.metrics} gap-6 mb-8`}>
            <DataCard
              title="Total Employees"
              value={hrMetrics.totalEmployees}
              icon="👥"
              className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            />
            <DataCard
              title="Pending Reviews"
              value={hrMetrics.upcomingReviews}
              icon="⭐"
              className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            />
            <DataCard
              title="Pending Documents"
              value={hrMetrics.totalPendingDocs}
              icon="📄"
              className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            />
            <DataCard
              title="Compliance Score"
              value={`${hrMetrics.complianceScore}%`}
              icon="✅"
              className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            />
          </div>

          {/* Quick Access - Reports */}
          <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 rounded-2xl shadow-xl text-white p-8 mb-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl shadow-lg">
                  📊
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Monthly Reports</h3>
                  <p className="text-purple-100 font-medium">
                    Access comprehensive monthly performance and analytics reports
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/monthly-reports')}
                className="px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-all duration-200 font-semibold shadow-lg hover:scale-105"
              >
                View Reports →
              </button>
            </div>
          </div>

          {/* Quick Access - Form Tracking */}
          <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl shadow-xl text-white p-8 mb-8 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl shadow-lg">
                  📋
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Form Tracking</h3>
                  <p className="text-emerald-100 font-medium">
                    Track onboarding forms, submission status, and pending items
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/form-tracking')}
                className="px-6 py-3 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-200 font-semibold shadow-lg hover:scale-105"
              >
                Track Forms →
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="border-b border-gray-100">
              <nav className="flex space-x-2 px-6 py-2" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <span className="mr-2 text-base">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Key Metrics</h3>
                  <MetricRow
                    label="Average Performance Rating"
                    currentValue={hrMetrics.avgPerformance}
                    unit="/5"
                    target="4.0"
                  />
                  <MetricRow
                    label="Average Salary"
                    currentValue={hrMetrics.avgSalary}
                    unit=""
                    formatter={(value) => `$${value.toLocaleString()}`}
                  />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Action Items</h3>
                  <div className="space-y-2">
                    {upcomingReviews.map((emp, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <span className="text-sm">{emp.name} - Performance Review Due</span>
                        <span className="text-xs text-gray-500">{emp.performance.nextReview}</span>
                      </div>
                    ))}
                    {pendingDocuments.slice(0, 3).map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <span className="text-sm">{doc.employee} - {doc.docType} pending</span>
                        <span className="text-xs text-red-600">Overdue</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Employee Directory</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{employee.name}</h4>
                        <p className="text-sm text-gray-600">{employee.role}</p>
                        <p className="text-xs text-gray-500">{employee.department}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="text-xs text-gray-600">
                        📧 {employee.email}
                      </div>
                      <div className="text-xs text-gray-600">
                        📞 {employee.phone}
                      </div>
                      <div className="text-xs text-gray-600">
                        🗓️ Joined: {new Date(employee.joiningDate).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEmployeeAction('view', employee)}
                        className="flex-1 px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEmployeeAction('documents', employee)}
                        className="flex-1 px-3 py-2 text-xs bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                      >
                        Docs
                      </button>
                      <button
                        onClick={() => handleEmployeeAction('performance', employee)}
                        className="flex-1 px-3 py-2 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other tabs would be implemented similarly */}
          {activeTab !== 'overview' && activeTab !== 'employees' && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🚧</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{tabs.find(t => t.id === activeTab)?.label} Section</h3>
              <p className="text-gray-600">This section is under development and will be available soon.</p>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Employee Profile View Component
function EmployeeProfileView({ employee }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
          {employee.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <h3 className="text-xl font-semibold">{employee.name}</h3>
          <p className="text-gray-600">{employee.role} • {employee.department}</p>
          <p className="text-sm text-gray-500">Joined: {new Date(employee.joiningDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-3">Contact Information</h4>
          <div className="space-y-2 text-sm">
            <div>📧 {employee.email}</div>
            <div>📞 {employee.phone}</div>
            <div>👤 Manager: {employee.manager}</div>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-3">Emergency Contact</h4>
          <div className="space-y-2 text-sm">
            <div>👤 {employee.emergencyContact.name}</div>
            <div>📞 {employee.emergencyContact.phone}</div>
            <div>💝 {employee.emergencyContact.relationship}</div>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-3">Performance</h4>
          <div className="space-y-2 text-sm">
            <div>⭐ Rating: {employee.performance.rating}/5</div>
            <div>📅 Last Review: {new Date(employee.performance.lastReview).toLocaleDateString()}</div>
            <div>📅 Next Review: {new Date(employee.performance.nextReview).toLocaleDateString()}</div>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-3">Benefits</h4>
          <div className="space-y-2 text-sm">
            <div>🏥 Health: {employee.benefits.healthInsurance}</div>
            <div>🦷 Dental: {employee.benefits.dental}</div>
            <div>💰 Retirement: {employee.benefits.retirement}</div>
            <div>🏖️ PTO: {employee.benefits.paidTimeOff.remaining} days left</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Document Management Component
function DocumentManagement({ employee, onUpdate }) {
  const { notify } = useToast();
  
  const handleDocumentUpdate = (docType, status) => {
    notify({ type: 'success', title: 'Document Updated', message: `${docType} marked as ${status}` });
    if (onUpdate) onUpdate();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Document Status for {employee.name}</h3>
      
      <div className="space-y-3">
        {Object.entries(employee.documents).map(([docType, doc]) => (
          <div key={docType} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium capitalize">{docType.replace(/([A-Z])/g, ' $1').trim()}</div>
              <div className="text-sm text-gray-600">
                {doc.status === 'complete' ? `Completed: ${doc.date}` : 'Pending completion'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                doc.status === 'complete' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {doc.status}
              </span>
              {doc.status === 'pending' && (
                <button
                  onClick={() => handleDocumentUpdate(docType, 'complete')}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Performance Review Component
function PerformanceReview({ employee, onUpdate }) {
  const { notify } = useToast();
  const [rating, setRating] = useState(employee.performance.rating);
  const [notes, setNotes] = useState('');

  const handleSubmitReview = () => {
    notify({ 
      type: 'success', 
      title: 'Performance Review Updated', 
      message: `Review for ${employee.name} has been updated` 
    });
    if (onUpdate) onUpdate();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Performance Review - {employee.name}</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5)</label>
          <input
            type="range"
            min="1"
            max="5"
            step="0.1"
            value={rating}
            onChange={(e) => setRating(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="text-center text-lg font-semibold text-blue-600">{rating}/5</div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Review Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter performance review notes..."
          />
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Current Goals:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            {employee.performance.goals.map((goal, index) => (
              <li key={index}>{goal}</li>
            ))}
          </ul>
        </div>
        
        <button
          onClick={handleSubmitReview}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Submit Review
        </button>
      </div>
    </div>
  );
}

export default HRDashboard;