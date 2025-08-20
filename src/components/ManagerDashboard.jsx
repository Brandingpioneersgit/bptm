import React, { useMemo, useState } from "react";
import { useSupabase } from "./SupabaseProvider";
import { useModal } from "./AppShell";
import { useFetchSubmissions } from "./useFetchSubmissions";
import { ClientManagementView } from "./ClientManagementView";
import { ClientDashboardView } from "./ClientDashboardView";
import { FixedLeaderboardView } from "./FixedLeaderboardView";
import { TestimonialsBadge } from "./TestimonialsBadge";

export function ManagerDashboard({ onViewReport, onEditEmployee, onEditReport }) {
  const supabase = useSupabase();
  const { allSubmissions, loading, error, refreshSubmissions } = useFetchSubmissions();
  const { openModal, closeModal } = useModal();
  
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
  
  const [evaluationPanel, setEvaluationPanel] = useState({
    isOpen: false,
    submission: null,
    score: 8,
    comments: '',
    recommendations: ''
  });

  const processedData = useMemo(() => {
    if (!allSubmissions.length) return { employees: [], stats: {}, departments: [] };

    const filteredByDate = selectedMonth === 'all' 
      ? allSubmissions 
      : allSubmissions.filter(sub => sub.monthKey === selectedMonth);

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
          performance: 'Medium',
          testimonials: submission.employee?.testimonials || []
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

      emp.testimonials = emp.submissions[0]?.employee?.testimonials || [];

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

    const stats = {
      totalEmployees: employees.length,
      totalSubmissions: filteredByDate.length,
      averageScore: employees.length ? 
        (employees.reduce((sum, emp) => sum + parseFloat(emp.averageScore), 0) / employees.length).toFixed(1) : 0,
      highPerformers: employees.filter(emp => emp.performance === 'High').length,
      needsAttention: employees.filter(emp => emp.performance === 'Low').length
    };

    const departments = [...new Set(employees.map(emp => emp.department))].sort();

    return { employees: filteredEmployees, stats, departments, allEmployees: employees };
  }, [allSubmissions, selectedMonth, searchQuery, filters, sortConfig]);

  const openEvaluation = (submission) => {
    setEvaluationPanel({
      isOpen: true,
      submission,
      score: submission.manager?.score || 8,
      comments: submission.manager?.comments || '',
      recommendations: submission.manager?.recommendations || ''
    });
  };

  const saveEvaluation = async () => {
    if (!evaluationPanel.submission || !supabase) return;

    try {
      const updatedSubmission = {
        ...evaluationPanel.submission,
        manager: {
          score: evaluationPanel.score,
          comments: evaluationPanel.comments,
          recommendations: evaluationPanel.recommendations,
          evaluatedAt: new Date().toISOString(),
          evaluatedBy: 'Manager'
        }
      };

      const { error } = await supabase
        .from('submissions')
        .update(updatedSubmission)
        .eq('id', evaluationPanel.submission.id);

      if (error) throw error;

      await refreshSubmissions();
      setEvaluationPanel({ isOpen: false, submission: null, score: 8, comments: '', recommendations: '' });
      openModal('Success', 'Employee evaluation saved successfully!', closeModal);
    } catch (error) {
      console.error('Failed to save evaluation:', error);
      openModal('Error', 'Failed to save evaluation. Please try again.', closeModal);
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

  const exportBulkData = () => {
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
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team_performance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewReport = (employee) => {
    console.log('📊 Opening Report View for:', employee.name);
    
    if (!employee.submissions || employee.submissions.length === 0) {
      openModal('No Data', `No submissions found for ${employee.name}`, closeModal);
      return;
    }

    const phoneNumber = employee.phone && employee.phone !== 'N/A' ? employee.phone : 'no-phone';
    
    console.log('📞 Using phone number:', phoneNumber);
    console.log('📊 Submissions count:', employee.submissions.length);
    
    onViewReport(employee.name, phoneNumber);
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

  const handleEditReport = (employee) => {
    console.log('✏️ Opening Report Editor for:', employee.name);
    
    if (!employee.latestSubmission) {
      openModal('No Data', `No submissions found for ${employee.name}`, closeModal);
      return;
    }

    onEditReport(employee.name, employee.phone);
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
          onClick={refreshSubmissions}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
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
              onClick={refreshSubmissions}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            
            <button
              onClick={exportBulkData}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
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
              </div>
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
                      <tr key={`${employee.name}-${employee.phone}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {employee.name}
                              <TestimonialsBadge testimonials={employee.testimonials} />
                            </div>
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
                              onClick={() => handleViewReport(employee)}
                              className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-3 py-1 rounded transition-colors"
                            >
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
                              onClick={() => onEditEmployee(employee)}
                              className="text-orange-600 hover:text-orange-900 hover:bg-orange-50 px-3 py-1 rounded transition-colors"
                            >
                              Edit Employee
                            </button>
                            {employee.latestSubmission && (
                              <button
                                onClick={() => handleEditReport(employee)}
                                className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 px-3 py-1 rounded transition-colors"
                              >
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                disabled={!supabase}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Save Evaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
