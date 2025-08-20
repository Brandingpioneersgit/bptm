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

  // Extract detailed client data
  const clientDetails = useMemo(() => {
    const clientMap = new Map();
    
    displaySubmissions.forEach(submission => {
      if (submission.clients && Array.isArray(submission.clients)) {
        submission.clients.forEach(client => {
          if (client && client.name) {
            const key = client.name.toLowerCase().trim();
            if (!clientMap.has(key)) {
              clientMap.set(key, {
                name: client.name,
                submissions: [],
                services: new Set(),
                firstSeen: submission.monthKey,
                lastSeen: submission.monthKey
              });
            }
            
            const clientData = clientMap.get(key);
            clientData.submissions.push({
              month: submission.monthKey,
              services: client.services || [],
              score: submission.scores?.relationshipScore || 0
            });
            
            if (client.services) {
              client.services.forEach(service => clientData.services.add(service));
            }
            
            if (submission.monthKey > clientData.lastSeen) {
              clientData.lastSeen = submission.monthKey;
            }
            if (submission.monthKey < clientData.firstSeen) {
              clientData.firstSeen = submission.monthKey;
            }
          }
        });
      }
    });
    
    return Array.from(clientMap.values()).map(client => ({
      ...client,
      services: Array.from(client.services),
      totalSubmissions: client.submissions.length,
      avgScore: client.submissions.length > 0 
        ? round1(client.submissions.reduce((sum, s) => sum + s.score, 0) / client.submissions.length)
        : 0
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [displaySubmissions]);

  // Extract detailed KPI data
  const kpiDetails = useMemo(() => {
    const kpiData = displaySubmissions.map(submission => {
      const kpiSection = submission.kpi || {};
      return {
        month: submission.monthKey,
        department: submission.employee?.department,
        isDraft: submission.isDraft,
        scores: submission.scores,
        // Sales KPIs
        salesTargets: kpiSection.salesTargets || 0,
        salesAchieved: kpiSection.salesAchieved || 0,
        salesRatio: kpiSection.salesTargets > 0 
          ? round1((kpiSection.salesAchieved / kpiSection.salesTargets) * 100) 
          : 0,
        // HR KPIs
        hiringsTarget: kpiSection.hiringsTarget || 0,
        hiringsAchieved: kpiSection.hiringsAchieved || 0,
        hiringRatio: kpiSection.hiringsTarget > 0 
          ? round1((kpiSection.hiringsAchieved / kpiSection.hiringsTarget) * 100) 
          : 0,
        // Accounts KPIs
        revenueTarget: kpiSection.revenueTarget || 0,
        revenueAchieved: kpiSection.revenueAchieved || 0,
        revenueRatio: kpiSection.revenueTarget > 0 
          ? round1((kpiSection.revenueAchieved / kpiSection.revenueTarget) * 100) 
          : 0,
        // Task completion
        tasksCount: submission.meta?.tasks?.count || 0,
        tasksCompleted: submission.meta?.tasks?.completed || 0,
        taskCompletionRate: submission.meta?.tasks?.count > 0
          ? round1((submission.meta?.tasks?.completed / submission.meta?.tasks?.count) * 100)
          : 0
      };
    }).filter(data => !data.isDraft);
    
    return kpiData.sort((a, b) => b.month.localeCompare(a.month));
  }, [displaySubmissions]);

  // Generate verification URLs for manager access
  const verificationData = useMemo(() => {
    return displaySubmissions.map(submission => ({
      month: submission.monthKey,
      submissionId: submission.id,
      verificationUrl: `${window.location.origin}/verify/${submission.id}`,
      isDraft: submission.isDraft,
      lastModified: submission.updatedAt || submission.createdAt,
      score: submission.scores?.overall || 0
    }));
  }, [displaySubmissions]);

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

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="px-6 py-0">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'clients' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 Client Details
            </button>
            <button
              onClick={() => setActiveTab('kpis')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'kpis' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🎯 KPI Analysis
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'verification' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔗 Verification
            </button>
          </nav>
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

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
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
        </>
      )}

      {activeTab === 'clients' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">👥 Client Details & Analysis</h2>
          {clientDetails.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Client Data</h3>
              <p className="text-gray-600">No client information found for the selected period.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{clientDetails.length}</div>
                  <div className="text-sm text-gray-600">Total Clients</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {round1(clientDetails.reduce((sum, c) => sum + c.avgScore, 0) / clientDetails.length)}/10
                  </div>
                  <div className="text-sm text-gray-600">Avg Client Score</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {[...new Set(clientDetails.flatMap(c => c.services))].length}
                  </div>
                  <div className="text-sm text-gray-600">Unique Services</div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submissions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clientDetails.map((client, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {client.services.map((service, i) => (
                              <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {service}
                              </span>
                            ))}
                            {client.services.length === 0 && (
                              <span className="text-gray-400 text-sm">No services specified</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.totalSubmissions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            client.avgScore >= 8 ? 'text-green-600' :
                            client.avgScore >= 6 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {client.avgScore}/10
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {monthLabel(client.firstSeen)} - {monthLabel(client.lastSeen)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'kpis' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🎯 KPI Performance Analysis</h2>
          {kpiDetails.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No KPI Data</h3>
              <p className="text-gray-600">No KPI information found for the selected period.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {round1(kpiDetails.reduce((sum, k) => sum + k.scores?.kpiScore || 0, 0) / kpiDetails.length)}/10
                  </div>
                  <div className="text-sm text-gray-600">Avg KPI Score</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {round1(kpiDetails.reduce((sum, k) => sum + k.taskCompletionRate, 0) / kpiDetails.length)}%
                  </div>
                  <div className="text-sm text-gray-600">Task Completion</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {kpiDetails.reduce((sum, k) => sum + k.tasksCount, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Tasks</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {kpiDetails.filter(k => k.scores?.kpiScore >= 8).length}
                  </div>
                  <div className="text-sm text-gray-600">High Performance</div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KPI Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Completion</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Performance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HR Performance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {kpiDetails.map((kpi, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{monthLabel(kpi.month)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {kpi.department}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            (kpi.scores?.kpiScore || 0) >= 8 ? 'text-green-600' :
                            (kpi.scores?.kpiScore || 0) >= 6 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {kpi.scores?.kpiScore || 0}/10
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {kpi.tasksCompleted}/{kpi.tasksCount} ({kpi.taskCompletionRate}%)
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {kpi.salesTargets > 0 ? (
                            <div className="text-sm text-gray-900">
                              {kpi.salesAchieved}/{kpi.salesTargets} ({kpi.salesRatio}%)
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {kpi.hiringsTarget > 0 ? (
                            <div className="text-sm text-gray-900">
                              {kpi.hiringsAchieved}/{kpi.hiringsTarget} ({kpi.hiringRatio}%)
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'verification' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔗 Verification & Report Links</h2>
          <p className="text-gray-600 mb-6">Direct links for managers to verify and review individual submissions.</p>
          
          {verificationData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Verification Data</h3>
              <p className="text-gray-600">No submission data available for verification.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Modified</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification Link</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {verificationData.map((data, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{monthLabel(data.month)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {data.isDraft ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Draft
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          data.score >= 8 ? 'text-green-600' :
                          data.score >= 6 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {data.score}/10
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.lastModified ? new Date(data.lastModified).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={data.verificationUrl} 
                            readOnly 
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-xs rounded-lg p-2 w-64"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(data.verificationUrl);
                              openModal('Copied!', 'Verification URL copied to clipboard.', closeModal);
                            }}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            Copy
                          </button>
                          <a
                            href={data.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900 text-sm font-medium"
                          >
                            Open
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Submissions List - Only show in Overview tab */}
      {activeTab === 'overview' && (
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
      )}
    </div>
  );
}