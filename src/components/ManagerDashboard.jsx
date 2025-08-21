import React, { useMemo, useState } from "react";
import { useSupabase } from "./SupabaseProvider";
import { useToast } from "@/shared/components/Toast";
import { useModal } from "@/shared/components/ModalContext";
import { useFetchSubmissions } from "./useFetchSubmissions";
import { useDataSync } from "./DataSyncContext";
import { ClientManagementView } from "@/features/clients/components/ClientManagementView";
import { ClientDashboardView } from "@/features/clients/components/ClientDashboardView";
import { FixedLeaderboardView } from "./FixedLeaderboardView";
import { calculateScopeCompletion } from "@/shared/lib/scoring";

export function ManagerDashboard({ onViewReport, onEditEmployee, onEditReport }) {
  const supabase = useSupabase();
  const { notify } = useToast();
  const { allSubmissions, loading, error, refreshSubmissions } = useFetchSubmissions();
  const { submissions: syncedSubmissions, refreshAllData, updateSubmission } = useDataSync();
  const { openModal, closeModal } = useModal();
  
  // Use synced submissions if available, fallback to fetch hook
  const workingSubmissions = syncedSubmissions.length > 0 ? syncedSubmissions : allSubmissions;
  
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    department: 'All',
    performance: 'All',
    status: 'All'
  });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [expandedRows, setExpandedRows] = useState({});
  const [underService, setUnderService] = useState('All');
  const [underDept, setUnderDept] = useState('All');
  const [learningThreshold, setLearningThreshold] = useState(10);
  
  // Loading states for different operations
  const [operationStates, setOperationStates] = useState({
    refreshing: false,
    exporting: false,
    savingEvaluation: false,
    bulkOperations: false
  });
  
  const [evaluationPanel, setEvaluationPanel] = useState({
    isOpen: false,
    submission: null,
    score: 8,
    comments: '',
    recommendations: '',
    testimonialUrl: ''
  });

  const processedData = useMemo(() => {
    if (!workingSubmissions.length) return { employees: [], stats: {}, departments: [] };

    const filteredByDate = selectedMonth === 'all' 
      ? workingSubmissions 
      : workingSubmissions.filter(sub => sub.monthKey === selectedMonth);

    const employeeGroups = {};
    filteredByDate.forEach(submission => {
      const key = `${submission.employee?.name}-${submission.employee?.phone}`;
      if (!employeeGroups[key]) {
        employeeGroups[key] = {
          name: submission.employee?.name || 'Unknown',
          phone: submission.employee?.phone || 'N/A',
          department: submission.employee?.department || 'Unknown',
          submissions: [],
          latestSubmission: null,
          averageScore: 0,
          totalHours: 0,
          performance: 'Medium'
        };
      }
      employeeGroups[key].submissions.push(submission);
    });

    const employees = Object.values(employeeGroups).map(emp => {
      emp.submissions.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
      emp.latestSubmission = emp.submissions[0];
      
      const totalScore = emp.submissions.reduce((sum, sub) => sum + (sub.scores?.overall || 0), 0);
      emp.averageScore = emp.submissions.length ? (totalScore / emp.submissions.length).toFixed(1) : 0;
      
      emp.totalHours = emp.submissions.reduce((total, sub) => {
        return total + ((sub.learning || []).reduce((sum, l) => sum + (l.durationMins || 0), 0) / 60);
      }, 0);
      
      emp.performance = emp.averageScore >= 8 ? 'High' : emp.averageScore >= 6 ? 'Medium' : 'Low';
      emp.hasTestimonial = emp.submissions.some(s => s.manager?.testimonialUrl);
      
      return emp;
    });

    let filteredEmployees = employees.filter(emp => {
      const matchesSearch = !searchQuery || 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDepartment = filters.department === 'All' || emp.department === filters.department;
      const matchesPerformance = filters.performance === 'All' || emp.performance === filters.performance;
      
      return matchesSearch && matchesDepartment && matchesPerformance;
    });

    filteredEmployees.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'score':
          aVal = parseFloat(a.averageScore);
          bVal = parseFloat(b.averageScore);
          break;
        case 'department':
          aVal = a.department;
          bVal = b.department;
          break;
        case 'hours':
          aVal = a.totalHours;
          bVal = b.totalHours;
          break;
        default:
          aVal = a.name;
          bVal = b.name;
      }
      
      if (sortConfig.direction === 'desc') {
        return typeof aVal === 'string' ? bVal.localeCompare(aVal) : bVal - aVal;
      }
      return typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
    });

    // Stats
    const stats = {
      totalEmployees: employees.length,
      totalSubmissions: filteredByDate.length,
      averageScore: employees.length ? 
        (employees.reduce((sum, emp) => sum + parseFloat(emp.averageScore), 0) / employees.length).toFixed(1) : 0,
      highPerformers: employees.filter(emp => emp.performance === 'High').length,
      needsAttention: employees.filter(emp => emp.performance === 'Low').length,
      withPenalties: employees.filter(emp => emp.latestSubmission?.discipline?.penalty > 0).length,
      missingLearning: employees.filter(emp => {
        const latest = emp.latestSubmission;
        if (!latest) return false;
        const hours = (latest.learning || []).reduce((h, l) => h + (l.durationMins || 0), 0) / 60;
        return hours < learningThreshold; // threshold for learning compliance
      }).length
    };

    const departments = [...new Set(employees.map(emp => emp.department))].sort();

    return { employees: filteredEmployees, stats, departments, allEmployees: employees };
  }, [workingSubmissions, selectedMonth, searchQuery, filters, sortConfig, learningThreshold]);

  const underServiceOptions = useMemo(() => {
    try {
      const set = new Set();
      (processedData.employees || []).forEach(emp => {
        const sub = emp.latestSubmission;
        (sub?.clients || []).forEach(c => (c.services || []).forEach(s => {
          const name = typeof s === 'string' ? s : s.service;
          if (name) set.add(name);
        }));
      });
      return ['All', ...Array.from(set).sort()];
    } catch { return ['All']; }
  }, [processedData]);

  const openEvaluation = (submission) => {
    setEvaluationPanel({
      isOpen: true,
      submission,
      score: submission.manager?.score || 8,
      comments: submission.manager?.comments || '',
      recommendations: submission.manager?.recommendations || '',
      testimonialUrl: submission.manager?.testimonialUrl || '',
      rubrics: {
        collaboration: submission.manager?.rubrics?.collaboration || 7,
        ownership: submission.manager?.rubrics?.ownership || 7,
        quality: submission.manager?.rubrics?.quality || 7,
        communication: submission.manager?.rubrics?.communication || 7,
      }
    });
  };

  const saveEvaluation = async () => {
    if (!evaluationPanel.submission || !supabase || operationStates.savingEvaluation) return;

    setOperationStates(prev => ({ ...prev, savingEvaluation: true }));
    
    try {
      console.log('💾 Saving employee evaluation...');
      
      const updatedSubmission = {
        ...evaluationPanel.submission,
        manager: {
          score: evaluationPanel.score,
          comments: evaluationPanel.comments,
          recommendations: evaluationPanel.recommendations,
          testimonialUrl: evaluationPanel.testimonialUrl,
          rubrics: {
            collaboration: Number(evaluationPanel.rubrics?.collaboration || 0),
            ownership: Number(evaluationPanel.rubrics?.ownership || 0),
            quality: Number(evaluationPanel.rubrics?.quality || 0),
            communication: Number(evaluationPanel.rubrics?.communication || 0),
          },
          evaluatedAt: new Date().toISOString(),
          evaluatedBy: 'Manager'
        }
      };

      const { error } = await supabase
        .from('submissions')
        .update(updatedSubmission)
        .eq('id', evaluationPanel.submission.id);

      if (error) throw error;

      console.log('🔄 Refreshing submissions data...');
      
      // Notify DataSync of the updated submission
      await updateSubmission(updatedSubmission);
      
      // Also refresh traditional hook for backward compatibility
      await refreshSubmissions();
      
      setEvaluationPanel({ isOpen: false, submission: null, score: 8, comments: '', recommendations: '' });
      console.log('✅ Evaluation saved successfully');
      notify({ type: 'success', title: 'Evaluation saved', message: 'Manager evaluation updated.' });
      openModal('Success', 'Employee evaluation saved successfully!', closeModal);
    } catch (error) {
      console.error('❌ Failed to save evaluation:', error);
      notify({ type: 'error', title: 'Save failed', message: error.message });
      openModal('Error', 'Failed to save evaluation. Please try again.', closeModal);
    } finally {
      setOperationStates(prev => ({ ...prev, savingEvaluation: false }));
    }
  };

  // Enhanced refresh with loading state
  const handleRefresh = async () => {
    if (operationStates.refreshing) return;
    
    setOperationStates(prev => ({ ...prev, refreshing: true }));
    
    try {
      console.log('🔄 Refreshing dashboard data...');
      // Use DataSync for consistent refreshing
      await Promise.all([
        refreshAllData(),
        refreshSubmissions()
      ]);
      console.log('✅ Dashboard data refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh data:', error);
      openModal('Error', 'Failed to refresh data. Please try again.', closeModal);
    } finally {
      setOperationStates(prev => ({ ...prev, refreshing: false }));
    }
  };

  // Enhanced export with loading state
  const handleExportBulkData = async () => {
    if (operationStates.exporting) return;
    
    setOperationStates(prev => ({ ...prev, exporting: true }));
    
    try {
      console.log('📄 Exporting bulk data...');
      
      const csvContent = [
        ['Employee Name', 'Department', 'Phone', 'Average Score', 'Total Hours', 'Performance', 'Latest Month', 'Reports Count'],
        ...processedData.employees.map(emp => [
          emp.name,
          emp.department,
          emp.phone,
          emp.averageScore,
          emp.totalHours.toFixed(1),
          emp.performance,
          emp.latestSubmission?.monthKey || 'N/A',
          emp.submissions.length
        ])
      ];
      
      const csvString = csvContent.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `employee-performance-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log('✅ Data exported successfully');
      openModal('Success', 'Employee data exported successfully!', closeModal);
    } catch (error) {
      console.error('❌ Failed to export data:', error);
      openModal('Error', 'Failed to export data. Please try again.', closeModal);
    } finally {
      setOperationStates(prev => ({ ...prev, exporting: false }));
    }
  };

  const downloadEmployeePDF = (employee) => {
    const employeeData = employee.submissions;
    const employeeName = employee.name;

    if (!employeeData || employeeData.length === 0) {
      openModal('No Data', `No submissions found for ${employeeName}`, closeModal);
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Report - ${employeeName}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; line-height: 1.6; color: #1f2937; }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #3b82f6; }
        .header h1 { color: #3b82f6; margin: 0; font-size: 28px; }
        .header h2 { color: #374151; margin: 10px 0; font-size: 24px; }
        .header .meta { color: #6b7280; font-size: 14px; }
        .section { margin: 30px 0; page-break-inside: avoid; }
        .section h3 { color: #374151; border-left: 4px solid #3b82f6; padding-left: 12px; margin-bottom: 15px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; }
        .stat-value { font-size: 32px; font-weight: bold; color: #3b82f6; margin-bottom: 5px; }
        .stat-label { font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .performance-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .performance-table th, .performance-table td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }
        .performance-table th { background: #3b82f6; color: white; font-weight: 600; }
        .score-good { color: #059669; font-weight: bold; }
        .score-medium { color: #d97706; font-weight: bold; }
        .score-poor { color: #dc2626; font-weight: bold; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏢 Branding Pioneers</h1>
        <h2>Employee Performance Report</h2>
        <h2>${employeeName}</h2>
        <div class="meta">
            Department: ${employee.department} | Generated: ${new Date().toLocaleDateString()}
        </div>
    </div>

    <div class="section">
        <h3>📊 Performance Summary</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${employee.averageScore}/10</div>
                <div class="stat-label">Average Score</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${employeeData.length}</div>
                <div class="stat-label">Reports Submitted</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${employee.totalHours.toFixed(1)}h</div>
                <div class="stat-label">Total Learning</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${employee.performance}</div>
                <div class="stat-label">Performance Level</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h3>📈 Monthly Performance</h3>
        <table class="performance-table">
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Overall Score</th>
                    <th>KPI Score</th>
                    <th>Learning Score</th>
                    <th>Learning Hours</th>
                    <th>Manager Notes</th>
                </tr>
            </thead>
            <tbody>
                ${employeeData.map(sub => {
                    const learningHours = ((sub.learning || []).reduce((sum, l) => sum + (l.durationMins || 0), 0) / 60).toFixed(1);
                    const scoreClass = sub.scores?.overall >= 8 ? 'score-good' : sub.scores?.overall >= 6 ? 'score-medium' : 'score-poor';
                    return `
                        <tr>
                            <td><strong>${monthLabel(sub.monthKey)}</strong></td>
                            <td class="${scoreClass}">${sub.scores?.overall || 'N/A'}/10</td>
                            <td>${sub.scores?.kpiScore || 'N/A'}/10</td>
                            <td>${sub.scores?.learningScore || 'N/A'}/10</td>
                            <td>${learningHours}h</td>
                            <td>${sub.manager?.comments || 'No comments'}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>This report was generated by the Branding Pioneers Monthly Tactical System</p>
        <p>For questions about this report, contact your HR department</p>
    </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${employeeName.replace(/\s+/g, '_')}_Performance_Report_${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Removed old exportBulkData - replaced with handleExportBulkData above

  const handleViewReport = async (employee) => {
    if (operationStates.bulkOperations) return;
    
    console.log('📊 Opening Report View for:', employee.name);
    
    if (!employee.submissions || employee.submissions.length === 0) {
      openModal('No Data', `No submissions found for ${employee.name}`, closeModal);
      return;
    }

    const phoneNumber = employee.phone && employee.phone !== 'N/A' ? employee.phone : 'no-phone';
    
    console.log('📞 Using phone number:', phoneNumber);
    console.log('📊 Submissions count:', employee.submissions.length);
    
    setOperationStates(prev => ({ ...prev, bulkOperations: true }));
    
    try {
      onViewReport(employee.name, phoneNumber);
      // Give a brief moment for navigation to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('❌ Failed to open report view:', error);
      openModal('Error', 'Failed to open report view. Please try again.', closeModal);
    } finally {
      setTimeout(() => {
        setOperationStates(prev => ({ ...prev, bulkOperations: false }));
      }, 500);
    }
  };
  
  const handleFullReport = (employee) => {
    console.log('🚀 Opening Full Report for:', employee.name);
    
    if (!employee.submissions || employee.submissions.length === 0) {
      openModal('No Data', `No submissions found for ${employee.name}`, closeModal);
      return;
    }

    const phoneNumber = employee.phone && employee.phone !== 'N/A' ? employee.phone : 'no-phone';
    
    console.log('📞 Using phone number:', phoneNumber);
    console.log('📊 Submissions count:', employee.submissions.length);
    
    onViewReport(employee.name, phoneNumber);
  };

  const handleEditReport = async (employee) => {
    if (operationStates.bulkOperations) return;
    
    console.log('✏️ Opening Report Editor for:', employee.name);
    
    if (!employee.latestSubmission) {
      openModal('No Data', `No submissions found for ${employee.name}`, closeModal);
      return;
    }

    setOperationStates(prev => ({ ...prev, bulkOperations: true }));
    
    try {
      onEditReport(employee.name, employee.phone);
      // Give a brief moment for navigation to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('❌ Failed to open report editor:', error);
      openModal('Error', 'Failed to open report editor. Please try again.', closeModal);
    } finally {
      setTimeout(() => {
        setOperationStates(prev => ({ ...prev, bulkOperations: false }));
      }, 500);
    }
  };

  // General purpose button handler for immediate feedback
  const handleButtonClick = (callback, buttonId = null) => {
    return async (e) => {
      // Prevent double clicks
      if (e.target.disabled || operationStates.bulkOperations) return;
      
      // Visual feedback
      const button = e.target;
      const originalText = button.textContent;
      
      try {
        // Add clicked state
        button.style.transform = 'scale(0.95)';
        
        // Execute callback
        if (typeof callback === 'function') {
          await callback();
        }
        
      } catch (error) {
        console.error('Button action failed:', error);
      } finally {
        // Reset visual state
        setTimeout(() => {
          button.style.transform = 'scale(1)';
        }, 150);
      }
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading team data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="text-red-600 text-lg mb-2">⚠️ Error Loading Data</div>
        <div className="text-red-700 mb-4">{error}</div>
        <button 
          onClick={handleRefresh}
          disabled={operationStates.refreshing}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {operationStates.refreshing && (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
          )}
          {operationStates.refreshing ? 'Retrying...' : 'Try Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Manager Dashboard</h1>
            <p className="text-gray-600">Monitor team performance and manage evaluations</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={operationStates.refreshing}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 transition-colors"
            >
              {operationStates.refreshing ? (
                <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {operationStates.refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            
            <button
              onClick={handleExportBulkData}
              disabled={operationStates.exporting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
            >
              {operationStates.exporting ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {operationStates.exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-0">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeView === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Employee Dashboard
            </button>
            <button
              onClick={() => setActiveView('clients')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeView === 'clients' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Client Management
            </button>
            <button
              onClick={() => setActiveView('clientDashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeView === 'clientDashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Client Progress
            </button>
            <button
              onClick={() => setActiveView('leaderboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeView === 'leaderboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              🏆 Leaderboard
            </button>
          </nav>
        </div>
      </div>

      {activeView === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Employees</h3>
                  <p className="text-2xl font-semibold text-gray-900">{processedData.stats.totalEmployees}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">High Performers</h3>
                  <p className="text-2xl font-semibold text-gray-900">{processedData.stats.highPerformers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Needs Attention</h3>
                  <p className="text-2xl font-semibold text-gray-900">{processedData.stats.needsAttention}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Avg Team Score</h3>
                  <p className="text-2xl font-semibold text-gray-900">{processedData.stats.averageScore}/10</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search employees, departments..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <select
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="All">All Departments</option>
                  {processedData.departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                <select
                  value={filters.performance}
                  onChange={(e) => setFilters(prev => ({ ...prev, performance: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="All">All Performance</option>
                  <option value="High">High Performers</option>
                  <option value="Medium">Medium Performers</option>
                  <option value="Low">Needs Attention</option>
                </select>

                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Months</option>
                  {(() => {
                    const months = new Set();
                    allSubmissions.forEach(sub => {
                      if (sub.monthKey) months.add(sub.monthKey);
                    });
                    return Array.from(months).sort((a, b) => b.localeCompare(a)).map(month => (
                      <option key={month} value={month}>
                        {new Date(month + '-01').toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </option>
                    ));
                  })()}
                </select>
              </div>
            </div>
          </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Team Overview ({processedData.employees.length} employees)
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
                  <select
                    value={sortConfig.key}
                    onChange={(e) => setSortConfig(prev => ({ ...prev, key: e.target.value }))}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="name">Name</option>
                    <option value="score">Score</option>
                    <option value="department">Department</option>
                    <option value="hours">Learning Hours</option>
                  </select>
                  <button
                    onClick={() => setSortConfig(prev => ({ 
                      ...prev, 
                      direction: prev.direction === 'asc' ? 'desc' : 'asc' 
                    }))}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <svg className={`w-4 h-4 transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const map = {}; (processedData.employees||[]).forEach(emp => { map[`${emp.name}-${emp.phone}`] = true; }); setExpandedRows(map);
                    }}
                    className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => setExpandedRows({})}
                    className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                  >
                    Collapse All
                  </button>
                </div>
              </div>
            </div>

          {/* Quick analytics chips */}
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">Avg Score: {processedData.stats.averageScore}</span>
            <span className="px-2 py-1 rounded-full bg-green-100 text-green-800">High Perf: {processedData.stats.highPerformers}</span>
            <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Needs Attention: {processedData.stats.needsAttention}</span>
            <span className="px-2 py-1 rounded-full bg-red-100 text-red-800">Penalties: {processedData.stats.withPenalties}</span>
            <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800"><span className="hidden sm:inline">Missing Learning (&lt;{learningThreshold}h): </span>{processedData.stats.missingLearning}</span>
          </div>

            {processedData.employees.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <div className="text-lg font-medium text-gray-900 mb-2">No employees found</div>
                <div className="text-gray-500">Try adjusting your filters or search query</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Learning Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reports</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedData.employees.map((employee, index) => (
                      <React.Fragment key={`${employee.name}-${employee.phone}`}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {employee.department}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${employee.performance === 'High' ? 'bg-green-100 text-green-800' : employee.performance === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {employee.performance}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-lg font-semibold ${employee.averageScore >= 8 ? 'text-green-600' : employee.averageScore >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {employee.averageScore}/10
                          </div>
                          {employee.latestSubmission?.discipline?.penalty > 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              Penalty: -{employee.latestSubmission.discipline.penalty} • {employee.latestSubmission.discipline.lateDays} day(s) late
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.totalHours.toFixed(1)}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.submissions.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedRows(prev => ({ ...prev, [`${employee.name}-${employee.phone}`]: !prev[`${employee.name}-${employee.phone}`] }))}
                              className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-1 rounded"
                            >
                              {expandedRows[`${employee.name}-${employee.phone}`] ? 'Hide' : 'Progress'}
                            </button>
                            <button
                              onClick={() => handleViewReport(employee)}
                              disabled={operationStates.bulkOperations}
                              className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 disabled:text-blue-300 disabled:bg-gray-50 disabled:cursor-not-allowed px-3 py-1 rounded transition-colors flex items-center gap-1"
                            >
                              {operationStates.bulkOperations ? (
                                <div className="animate-spin w-3 h-3 border border-blue-300 border-t-transparent rounded-full"></div>
                              ) : null}
                              View Report
                            </button>
                            <button
                              onClick={() => handleFullReport(employee)}
                              className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-3 py-1 rounded transition-colors"
                            >
                              Full Report
                            </button>
                            <button
                              onClick={() => downloadEmployeePDF(employee)}
                              className="text-green-600 hover:text-green-900 hover:bg-green-50 px-3 py-1 rounded transition-colors"
                            >
                              Download PDF
                            </button>
                            <button
                              onClick={() => {
                                if (!operationStates.bulkOperations) {
                                  setOperationStates(prev => ({ ...prev, bulkOperations: true }));
                                  onEditEmployee(employee.name, employee.phone);
                                  setTimeout(() => {
                                    setOperationStates(prev => ({ ...prev, bulkOperations: false }));
                                  }, 500);
                                }
                              }}
                              disabled={operationStates.bulkOperations}
                              className="text-orange-600 hover:text-orange-900 hover:bg-orange-50 disabled:text-orange-300 disabled:bg-gray-50 disabled:cursor-not-allowed px-3 py-1 rounded transition-colors"
                            >
                              Edit Employee
                            </button>
                            {employee.latestSubmission && (
                              <button
                                onClick={() => handleEditReport(employee)}
                                disabled={operationStates.bulkOperations}
                                className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 disabled:text-indigo-300 disabled:bg-gray-50 disabled:cursor-not-allowed px-3 py-1 rounded transition-colors flex items-center gap-1"
                              >
                                {operationStates.bulkOperations ? (
                                  <div className="animate-spin w-3 h-3 border border-indigo-300 border-t-transparent rounded-full"></div>
                                ) : null}
                                Edit Report
                              </button>
                            )}
                            {employee.latestSubmission && (
                              <button
                                onClick={() => openEvaluation(employee.latestSubmission)}
                                className="text-purple-600 hover:text-purple-900 hover:bg-purple-50 px-3 py-1 rounded transition-colors"
                              >
                                Evaluate
                              </button>
                            )}
                            {employee.latestSubmission?.manager?.testimonialUrl && (
                              <a
                                href={employee.latestSubmission.manager.testimonialUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-purple-700 underline"
                              >
                                🎥 Testimonial
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedRows[`${employee.name}-${employee.phone}`] && (
                        <tr className="bg-gray-50/50">
                          <td colSpan={7} className="px-6 py-4">
                            {employee.latestSubmission?.clients && employee.latestSubmission.clients.length > 0 ? (
                              <div className="grid md:grid-cols-2 gap-4">
                                {employee.latestSubmission.clients.map((c, ci) => (
                                  <div key={ci} className="border rounded-lg p-3 bg-white">
                                    <div className="text-sm font-semibold mb-2">{c.name}</div>
                                    {Array.isArray(c.services) && c.services.length > 0 ? (
                                      <div className="space-y-2">
                                        {c.services.map((s, si) => {
                                          const name = typeof s === 'string' ? s : s.service;
                              const pct = calculateScopeCompletion(c, name, { monthKey: employee.latestSubmission.monthKey }) || 0;
                              const w = require('@/shared/lib/scoring').getServiceWeight(name);
                              return (
                                <div key={si} className="text-xs">
                                  <div className="flex justify-between mb-0.5"><span className="font-medium">{name} <span className="text-gray-500">(w {w})</span></span><span>{pct}%</span></div>
                                  <div className="w-full bg-gray-200 h-1.5 rounded-full">
                                    <div className={`${pct>=100?'bg-green-500':pct>=60?'bg-yellow-500':'bg-red-500'} h-1.5 rounded-full`} style={{ width: `${pct}%` }}></div>
                                  </div>
                                </div>
                              );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-500">No services scoped</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">No client data in latest submission.</div>
                            )}
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Underperforming Scopes */}
          <div className="bg-white rounded-xl shadow-sm border p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-semibold text-gray-900">🔍 Underperforming Scopes</h4>
              <div className="flex items-center gap-3">
                <div className="text-xs text-gray-500">Period: {selectedMonth==='all' ? 'All' : new Date(selectedMonth+'-01').toLocaleString(undefined,{month:'long',year:'numeric'})}</div>
                <select className="text-xs border rounded px-2 py-1" value={underService} onChange={e=>setUnderService(e.target.value)}>
                  {underServiceOptions.map(s => (<option key={s}>{s}</option>))}
                </select>
                <select className="text-xs border rounded px-2 py-1" value={underDept} onChange={e=>setUnderDept(e.target.value)}>
                  {['All', ...(processedData.departments||[])].map(d => (<option key={d}>{d}</option>))}
                </select>
              </div>
            </div>
            {(() => {
              try {
                const entries = [];
                (processedData.employees||[]).forEach(emp => {
                  if (underDept !== 'All' && emp.department !== underDept) return;
                  const sub = emp.latestSubmission;
                  if (!sub || !sub.clients) return;
                  sub.clients.forEach(c => {
                    (c.services||[]).forEach(s => {
                      const name = typeof s === 'string' ? s : s.service;
                      const { calculateScopeCompletion } = require('@/shared/lib/scoring');
                      const pct = calculateScopeCompletion(c, name, { monthKey: sub.monthKey }) || 0;
                      if (pct < 60 && (underService==='All' || name===underService)) {
                        entries.push({ employee: emp.name, client: c.name, service: name, pct });
                      }
                    });
                  });
                });
                const top = entries.sort((a,b)=>a.pct-b.pct).slice(0,10);
                if (top.length === 0) return (<div className="text-sm text-gray-600">No underperforming scopes found.</div>);
                return (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b">
                          <th className="py-2 pr-4">Employee</th>
                          <th className="py-2 pr-4">Client</th>
                          <th className="py-2 pr-4">Service</th>
                          <th className="py-2 pr-4">Progress</th>
                        </tr>
                      </thead>
                      <tbody>
                        {top.map((e,i)=> (
                          <tr key={`${e.employee}-${e.client}-${e.service}-${i}`} className="border-b last:border-0">
                            <td className="py-2 pr-4">{e.employee}</td>
                            <td className="py-2 pr-4">{e.client}</td>
                            <td className="py-2 pr-4">{e.service}</td>
                            <td className="py-2 pr-4">
                              <div className="w-40 bg-gray-200 h-2 rounded-full">
                                <div className={`${e.pct>=100?'bg-green-500':e.pct>=60?'bg-yellow-500':'bg-red-500'} h-2 rounded-full`} style={{ width: `${Math.max(0,Math.min(100,e.pct))}%` }}></div>
                              </div>
                              <div className="text-xs text-gray-600 mt-1">{e.pct}%</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              } catch (e) {
                return (<div className="text-sm text-gray-600">Unable to compute scope analytics.</div>);
              }
            })()}
          </div>

        </>
      )}

      {activeView === 'clients' && (
        <ClientManagementView />
      )}

      {activeView === 'clientDashboard' && (
        <ClientDashboardView />
      )}

      {activeView === 'leaderboard' && (
        <FixedLeaderboardView allSubmissions={allSubmissions} />
      )}

      {/* Top Improving Scopes */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base font-semibold text-gray-900">📈 Top Improving Scopes</h4>
          <div className="text-xs text-gray-500">Compared to previous month</div>
        </div>
        {(() => {
          try {
            const rows = [];
            (processedData.employees||[]).forEach(emp => {
              const subs = (emp.submissions||[]).sort((a,b)=>b.monthKey.localeCompare(a.monthKey));
              if (subs.length < 2) return;
              const latest = subs[0], prev = subs[1];
              (latest.clients||[]).forEach(c => {
                const prevClient = (prev.clients||[]).find(pc => pc.name === c.name);
                if (!prevClient) return;
                (c.services||[]).forEach(s => {
                  const name = typeof s === 'string' ? s : s.service;
                  const { calculateScopeCompletion } = require('@/shared/lib/scoring');
                  const nowPct = calculateScopeCompletion(c, name, { monthKey: latest.monthKey }) || 0;
                  const prevPct = calculateScopeCompletion(prevClient, name, { monthKey: prev.monthKey }) || 0;
                  const delta = nowPct - prevPct;
                  if (delta > 0) rows.push({ employee: emp.name, client: c.name, service: name, delta, nowPct, prevPct });
                });
              });
            });
            const top = rows.sort((a,b)=>b.delta - a.delta).slice(0,10);
            if (top.length === 0) return (<div className="text-sm text-gray-600">No significant improvements detected.</div>);
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2 pr-4">Employee</th>
                      <th className="py-2 pr-4">Client</th>
                      <th className="py-2 pr-4">Service</th>
                      <th className="py-2 pr-4">Δ%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((e,i)=> (
                      <tr key={`${e.employee}-${e.client}-${e.service}-${i}`} className="border-b last:border-0">
                        <td className="py-2 pr-4">{e.employee}</td>
                        <td className="py-2 pr-4">{e.client}</td>
                        <td className="py-2 pr-4">{e.service}</td>
                        <td className="py-2 pr-4 text-green-700 font-semibold">+{Math.round(e.delta)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          } catch (e) {
            return (<div className="text-sm text-gray-600">Unable to compute improvements.</div>);
          }
        })()}
      </div>

      {/* Top Improving Clients */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base font-semibold text-gray-900">📈 Top Improving Clients</h4>
          <div className="text-xs text-gray-500">Average service improvement</div>
        </div>
        {(() => {
          try {
            const rows = [];
            (processedData.employees||[]).forEach(emp => {
              const subs = (emp.submissions||[]).sort((a,b)=>b.monthKey.localeCompare(a.monthKey));
              if (subs.length < 2) return;
              const latest = subs[0], prev = subs[1];
              (latest.clients||[]).forEach(c => {
                const prevClient = (prev.clients||[]).find(pc => pc.name === c.name);
                if (!prevClient) return;
                let deltas = [];
                (c.services||[]).forEach(s => {
                  const name = typeof s === 'string' ? s : s.service;
                  const { calculateScopeCompletion } = require('@/shared/lib/scoring');
                  const nowPct = calculateScopeCompletion(c, name, { monthKey: latest.monthKey }) || 0;
                  const prevPct = calculateScopeCompletion(prevClient, name, { monthKey: prev.monthKey }) || 0;
                  deltas.push(nowPct - prevPct);
                });
                if (deltas.length) {
                  const avgDelta = deltas.reduce((a,b)=>a+b,0)/deltas.length;
                  if (avgDelta > 0) rows.push({ employee: emp.name, client: c.name, delta: avgDelta });
                }
              });
            });
            const top = rows.sort((a,b)=>b.delta - a.delta).slice(0,10);
            if (top.length === 0) return (<div className="text-sm text-gray-600">No significant improvements detected.</div>);
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2 pr-4">Employee</th>
                      <th className="py-2 pr-4">Client</th>
                      <th className="py-2 pr-4">Δ%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((e,i)=> (
                      <tr key={`${e.employee}-${e.client}-${i}`} className="border-b last:border-0">
                        <td className="py-2 pr-4">{e.employee}</td>
                        <td className="py-2 pr-4">{e.client}</td>
                        <td className="py-2 pr-4 text-green-700 font-semibold">+{Math.round(e.delta)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          } catch (e) {
            return (<div className="text-sm text-gray-600">Unable to compute improvements.</div>);
          }
        })()}
      </div>
      {evaluationPanel.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Evaluate: {evaluationPanel.submission?.employee?.name}
                </h3>
                <button
                  onClick={() => setEvaluationPanel(prev => ({ ...prev, isOpen: false }))}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              {evaluationPanel.submission?.discipline?.penalty > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  Late submission penalty applied: -{evaluationPanel.submission.discipline.penalty} (late by {evaluationPanel.submission.discipline.lateDays} day(s)).
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Testimonial URL (optional)</label>
                <input
                  type="url"
                  value={evaluationPanel.testimonialUrl}
                  onChange={(e) => setEvaluationPanel(prev => ({ ...prev, testimonialUrl: e.target.value }))}
                  placeholder="https://... (video/review link)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Add a link to a client testimonial or video to award recognition.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rubric Ratings (1-10)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Collaboration</div>
                    <input type="number" min="1" max="10" value={evaluationPanel.rubrics?.collaboration || 0} onChange={(e)=>setEvaluationPanel(prev=>({ ...prev, rubrics: { ...prev.rubrics, collaboration: parseInt(e.target.value)||0 } }))} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Ownership</div>
                    <input type="number" min="1" max="10" value={evaluationPanel.rubrics?.ownership || 0} onChange={(e)=>setEvaluationPanel(prev=>({ ...prev, rubrics: { ...prev.rubrics, ownership: parseInt(e.target.value)||0 } }))} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Quality</div>
                    <input type="number" min="1" max="10" value={evaluationPanel.rubrics?.quality || 0} onChange={(e)=>setEvaluationPanel(prev=>({ ...prev, rubrics: { ...prev.rubrics, quality: parseInt(e.target.value)||0 } }))} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Communication</div>
                    <input type="number" min="1" max="10" value={evaluationPanel.rubrics?.communication || 0} onChange={(e)=>setEvaluationPanel(prev=>({ ...prev, rubrics: { ...prev.rubrics, communication: parseInt(e.target.value)||0 } }))} className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
              </div>

              {/* Client scope summary for this submission */}
              {evaluationPanel.submission?.clients && evaluationPanel.submission.clients.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Client Scope Progress (Submission Month)</div>
                  <div className="space-y-3">
                    {evaluationPanel.submission.clients.map((c, ci) => (
                      <div key={ci} className="border rounded-lg p-3">
                        <div className="text-sm font-semibold mb-2">{c.name}</div>
                        {Array.isArray(c.services) && c.services.length > 0 ? (
                          <div className="space-y-2">
                            {c.services.map((s, si) => {
                              const name = typeof s === 'string' ? s : s.service;
                              // defer require to avoid circular import at top-level
                              const { calculateScopeCompletion } = require('@/shared/lib/scoring');
                              const pct = calculateScopeCompletion(c, name, { monthKey: evaluationPanel.submission.monthKey }) || 0;
                              return (
                                <div key={si} className="text-xs">
                                  <div className="flex justify-between mb-0.5"><span className="font-medium">{name}</span><span>{pct}%</span></div>
                                  <div className="w-full bg-gray-200 h-1.5 rounded-full">
                                    <div className={`${pct>=100?'bg-green-500':pct>=60?'bg-yellow-500':'bg-red-500'} h-1.5 rounded-full`} style={{ width: `${pct}%` }}></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">No services scoped</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager Score (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={evaluationPanel.score}
                  onChange={(e) => setEvaluationPanel(prev => ({ 
                    ...prev, 
                    score: parseInt(e.target.value) 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  rows={4}
                  value={evaluationPanel.comments}
                  onChange={(e) => setEvaluationPanel(prev => ({ 
                    ...prev, 
                    comments: e.target.value 
                  }))}
                  placeholder="Add your feedback about the employee's performance..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommendations
                </label>
                <textarea
                  rows={3}
                  value={evaluationPanel.recommendations}
                  onChange={(e) => setEvaluationPanel(prev => ({ 
                    ...prev, 
                    recommendations: e.target.value 
                  }))}
                  placeholder="Provide recommendations for improvement..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setEvaluationPanel(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEvaluation}
                disabled={!supabase || operationStates.savingEvaluation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {operationStates.savingEvaluation && (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                )}
                {operationStates.savingEvaluation ? 'Saving...' : 'Save Evaluation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
