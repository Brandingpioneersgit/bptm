import React, { useMemo, useState } from "react";
import { useFetchSubmissions } from "./useFetchSubmissions";
import { useModal } from "./AppShell";
import { monthLabel, round1 } from "./constants";

export function NewReportDashboard({ employeeName, employeePhone, onBack }) {
  const { allSubmissions, loading, error } = useFetchSubmissions();
  const { openModal, closeModal } = useModal();
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Enhanced filtering with better error handling
  const employeeSubmissions = useMemo(() => {
    if (!allSubmissions || allSubmissions.length === 0) return [];
    
    const normalizedName = (employeeName || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const normalizedPhone = (employeePhone || '').trim();
    
    const filtered = allSubmissions.filter(s => {
      if (!s.employee?.name || !s.employee?.phone) return false;
      
      const submissionName = s.employee.name.trim().toLowerCase().replace(/\s+/g, ' ');
      const submissionPhone = s.employee.phone.trim();
      
      // Match by both name AND phone for accuracy
      const nameMatch = submissionName === normalizedName;
      const phoneMatch = submissionPhone === normalizedPhone;
      
      return nameMatch && phoneMatch;
    }).sort((a, b) => b.monthKey.localeCompare(a.monthKey)); // Most recent first

    return filtered;
  }, [allSubmissions, employeeName, employeePhone]);

  // Filter by selected month
  const displaySubmissions = useMemo(() => {
    if (selectedMonth === 'all') return employeeSubmissions;
    return employeeSubmissions.filter(s => s.monthKey === selectedMonth);
  }, [employeeSubmissions, selectedMonth]);

  // Get available months for dropdown
  const availableMonths = useMemo(() => {
    const months = [...new Set(employeeSubmissions.map(s => s.monthKey))];
    return months.sort((a, b) => b.localeCompare(a));
  }, [employeeSubmissions]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (displaySubmissions.length === 0) return null;

    const totalSubmissions = displaySubmissions.length;
    const completedSubmissions = displaySubmissions.filter(s => !s.isDraft);
    
    const avgKPI = completedSubmissions.length > 0 
      ? round1(completedSubmissions.reduce((sum, s) => sum + (s.scores?.kpiScore || 0), 0) / completedSubmissions.length)
      : 0;
    
    const avgLearning = completedSubmissions.length > 0
      ? round1(completedSubmissions.reduce((sum, s) => sum + (s.scores?.learningScore || 0), 0) / completedSubmissions.length)
      : 0;
    
    const avgRelationship = completedSubmissions.length > 0
      ? round1(completedSubmissions.reduce((sum, s) => sum + (s.scores?.relationshipScore || 0), 0) / completedSubmissions.length)
      : 0;
    
    const avgOverall = completedSubmissions.length > 0
      ? round1(completedSubmissions.reduce((sum, s) => sum + (s.scores?.overall || 0), 0) / completedSubmissions.length)
      : 0;

    // Learning hours calculation
    const totalLearningHours = completedSubmissions.reduce((sum, s) => {
      const learningMins = (s.learning || []).reduce((mins, l) => mins + (l.durationMins || 0), 0);
      return sum + (learningMins / 60);
    }, 0);

    // Client count
    const totalClients = completedSubmissions.reduce((sum, s) => sum + (s.clients?.length || 0), 0);

    return {
      totalSubmissions,
      completedSubmissions: completedSubmissions.length,
      draftSubmissions: totalSubmissions - completedSubmissions.length,
      avgKPI,
      avgLearning,
      avgRelationship,
      avgOverall,
      totalLearningHours: round1(totalLearningHours),
      totalClients
    };
  }, [displaySubmissions]);

  // Generate PDF download
  const downloadPDF = () => {
    if (!employeeSubmissions.length) {
      openModal('No Data', 'No submissions found to generate PDF report.', closeModal);
      return;
    }

    const htmlContent = generatePDFContent();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `${employeeName}_Performance_Report_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generatePDFContent = () => {
    const metrics = performanceMetrics;
    const currentDate = new Date().toLocaleDateString();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Employee Performance Report - ${employeeName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .metrics { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px; }
        .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; flex: 1; min-width: 200px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
        .submission-card { border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
        .submission-header { display: flex; justify-content: between; align-items: center; margin-bottom: 15px; }
        .month-badge { background: #3b82f6; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; }
        .scores { display: flex; gap: 15px; margin-top: 10px; }
        .score-item { text-align: center; }
        .score-value { font-weight: bold; font-size: 18px; }
        .client-list { margin-top: 15px; }
        .client-item { background: #f9fafb; padding: 10px; margin-bottom: 10px; border-radius: 4px; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>Employee Performance Report</h1>
        <h2>${employeeName} (${employeePhone})</h2>
        <p>Generated on: ${currentDate}</p>
        <p>Report Period: ${selectedMonth === 'all' ? 'All Months' : monthLabel(selectedMonth)}</p>
    </div>

    ${metrics ? `
    <div class="section">
        <h2>Performance Summary</h2>
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-value">${metrics.avgOverall}/10</div>
                <div>Overall Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.completedSubmissions}</div>
                <div>Completed Reports</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.avgKPI}/10</div>
                <div>Avg KPI Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.totalLearningHours}h</div>
                <div>Learning Hours</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.totalClients}</div>
                <div>Total Clients</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${metrics.avgRelationship}/10</div>
                <div>Client Relations</div>
            </div>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <h2>Detailed Submissions</h2>
        ${displaySubmissions.map(submission => `
            <div class="submission-card">
                <div class="submission-header">
                    <h3>${monthLabel(submission.monthKey)}</h3>
                    <span class="month-badge">${submission.isDraft ? 'DRAFT' : 'COMPLETED'}</span>
                </div>
                
                ${submission.scores ? `
                <div class="scores">
                    <div class="score-item">
                        <div class="score-value">${submission.scores.kpiScore}/10</div>
                        <div>KPI</div>
                    </div>
                    <div class="score-item">
                        <div class="score-value">${submission.scores.learningScore}/10</div>
                        <div>Learning</div>
                    </div>
                    <div class="score-item">
                        <div class="score-value">${submission.scores.relationshipScore}/10</div>
                        <div>Relations</div>
                    </div>
                    <div class="score-item">
                        <div class="score-value">${submission.scores.overall}/10</div>
                        <div>Overall</div>
                    </div>
                </div>
                ` : ''}

                <p><strong>Department:</strong> ${submission.employee?.department || 'N/A'}</p>
                <p><strong>Attendance:</strong> WFO: ${submission.meta?.attendance?.wfo || 0} days, WFH: ${submission.meta?.attendance?.wfh || 0} days</p>
                <p><strong>Tasks Completed:</strong> ${submission.meta?.tasks?.count || 0}</p>
                
                ${submission.clients && submission.clients.length > 0 ? `
                <div class="client-list">
                    <strong>Clients (${submission.clients.length}):</strong>
                    ${submission.clients.map(client => `
                        <div class="client-item">
                            <strong>${client.name}</strong>
                            ${client.services ? ` - Services: ${client.services.join(', ')}` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                ${submission.learning && submission.learning.length > 0 ? `
                <div>
                    <strong>Learning Activities:</strong>
                    <ul>
                        ${submission.learning.map(l => `
                            <li>${l.title} (${l.durationMins} mins) - ${l.category}</li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}

                ${submission.feedback ? `
                <div>
                    <strong>Feedback:</strong>
                    ${submission.feedback.company ? `<p><em>Company:</em> ${submission.feedback.company}</p>` : ''}
                    ${submission.feedback.challenges ? `<p><em>Challenges:</em> ${submission.feedback.challenges}</p>` : ''}
                </div>
                ` : ''}
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>Report Footer</h2>
        <p>This report was generated automatically from the Employee Performance Management System.</p>
        <p>For any questions or clarifications, please contact your manager or HR department.</p>
    </div>
</body>
</html>`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading employee data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <div className="text-red-400 text-2xl mr-3">⚠️</div>
            <div>
              <h3 className="text-lg font-medium text-red-800">Database Connection Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance Report</h1>
            <p className="text-gray-600 mt-1">{employeeName} ({employeePhone})</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadPDF}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📄 Download PDF
            </button>
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Month Filter */}
      {availableMonths.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Month:</label>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Months ({employeeSubmissions.length} submissions)</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {monthLabel(month)} ({employeeSubmissions.filter(s => s.monthKey === month).length})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Performance Metrics */}
      {performanceMetrics && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Performance Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{performanceMetrics.avgOverall}/10</div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{performanceMetrics.completedSubmissions}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{performanceMetrics.avgKPI}/10</div>
              <div className="text-sm text-gray-600">Avg KPI</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{performanceMetrics.totalLearningHours}h</div>
              <div className="text-sm text-gray-600">Learning</div>
            </div>
            <div className="bg-teal-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-teal-600">{performanceMetrics.totalClients}</div>
              <div className="text-sm text-gray-600">Clients</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-indigo-600">{performanceMetrics.avgRelationship}/10</div>
              <div className="text-sm text-gray-600">Relations</div>
            </div>
          </div>
        </div>
      )}

      {/* Submissions List */}
      <div className="space-y-4">
        {displaySubmissions.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Found</h3>
            <p className="text-gray-600">
              {employeeSubmissions.length === 0 
                ? `No performance reports found for ${employeeName}.`
                : `No submissions found for the selected period.`
              }
            </p>
          </div>
        ) : (
          displaySubmissions.map((submission, index) => (
            <div key={`${submission.monthKey}-${index}`} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{monthLabel(submission.monthKey)}</h3>
                <div className="flex items-center gap-2">
                  {submission.isDraft ? (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">DRAFT</span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">COMPLETED</span>
                  )}
                </div>
              </div>

              {submission.scores && (
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{submission.scores.kpiScore}/10</div>
                    <div className="text-xs text-gray-500">KPI</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{submission.scores.learningScore}/10</div>
                    <div className="text-xs text-gray-500">Learning</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">{submission.scores.relationshipScore}/10</div>
                    <div className="text-xs text-gray-500">Relations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-indigo-600">{submission.scores.overall}/10</div>
                    <div className="text-xs text-gray-500">Overall</div>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Department:</strong> {submission.employee?.department || 'N/A'}</p>
                  <p><strong>Attendance:</strong> WFO: {submission.meta?.attendance?.wfo || 0}, WFH: {submission.meta?.attendance?.wfh || 0}</p>
                  <p><strong>Tasks:</strong> {submission.meta?.tasks?.count || 0} completed</p>
                </div>
                <div>
                  <p><strong>Clients:</strong> {submission.clients?.length || 0}</p>
                  <p><strong>Learning:</strong> {submission.learning?.length || 0} activities</p>
                  {submission.learning && submission.learning.length > 0 && (
                    <p><strong>Learning Hours:</strong> {round1(submission.learning.reduce((sum, l) => sum + (l.durationMins || 0), 0) / 60)}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}