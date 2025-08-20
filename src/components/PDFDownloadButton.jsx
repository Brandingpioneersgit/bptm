import React from 'react';
import { monthLabel } from './constants';

export const PDFDownloadButton = ({ data, employeeName, yearlySummary }) => {
  const generateComprehensiveReport = () => {
    if (!data || data.length === 0) {
      return `
        <div class="section">
          <h3>No Data Available</h3>
          <p>No submissions found for ${employeeName}.</p>
        </div>
      `;
    }

    const months = data.map(d => monthLabel(d.monthKey));
    const kpiScores = data.map(d => d.scores?.kpiScore || 0);
    const learningHours = data.map(d => (d.learning || []).reduce((sum, l) => sum + (l.durationMins || 0), 0) / 60);

    const chartWidth = 300;
    const chartHeight = 80;
    const kpiPoints = kpiScores.map((s, i) => {
      const x = (i / Math.max(kpiScores.length - 1, 1)) * chartWidth;
      const y = chartHeight - (s / 10) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
    const kpiChart = `<svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="chart"><polyline points="${kpiPoints}" fill="none" stroke="#2563eb" stroke-width="2"/></svg>`;

    const maxHours = Math.max(...learningHours, 1);
    const barWidth = chartWidth / Math.max(learningHours.length, 1);
    const learningBars = learningHours.map((h, i) => {
      const height = (h / maxHours) * chartHeight;
      const x = i * barWidth + barWidth * 0.1;
      const y = chartHeight - height;
      const width = barWidth * 0.8;
      return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#10b981"/>`;
    }).join('');
    const learningChart = `<svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="chart">${learningBars}</svg>`;

    const growth = [];
    const shortcomings = [];
    if ((yearlySummary?.avgKpi || 0) >= 7) growth.push(`KPI avg ${yearlySummary.avgKpi}`); else shortcomings.push(`KPI avg ${yearlySummary?.avgKpi || 0}`);
    if ((yearlySummary?.avgLearning || 0) >= 7) growth.push(`Learning avg ${yearlySummary.avgLearning}`); else shortcomings.push(`Learning avg ${yearlySummary?.avgLearning || 0}`);
    if ((yearlySummary?.avgRelationship || 0) >= 7) growth.push(`Client Rel. avg ${yearlySummary.avgRelationship}`); else shortcomings.push(`Client Rel. avg ${yearlySummary?.avgRelationship || 0}`);
    if ((yearlySummary?.avgOverall || 0) >= 7) growth.push(`Overall avg ${yearlySummary.avgOverall}`); else shortcomings.push(`Overall avg ${yearlySummary?.avgOverall || 0}`);

    const recommendations = [
      'Maintain strong client communication.',
      'Dedicate consistent time to learning.',
      'Seek feedback to address shortcomings.'
    ];

    const actionItems = shortcomings.length
      ? shortcomings.map(s => `Improve ${s.toLowerCase()}`)
      : ['Continue current momentum and aim higher.'];

    return `
      <div class="section">
        <h3>🎯 KPI Performance</h3>
        ${kpiChart}
        <ul class="client-list">
          ${data.map(d => `
            <li>
              <strong>${monthLabel(d.monthKey)}</strong>
              <ul>
                ${(d.clients && d.clients.length > 0) ? d.clients.map(c => {
                  const status = c.op_clientStatus || '';
                  const badge = /win|success|complete|good/i.test(status) ? '✅' : '⚠️';
                  return `<li><span class="badge ${badge === '✅' ? 'win' : 'warn'}">${badge}</span> ${c.op_clientName || 'Unnamed'} - ${status || 'Unknown'}</li>`;
                }).join('') : '<li>No client activities</li>'}
              </ul>
            </li>
          `).join('')}
        </ul>
      </div>

      <div class="section">
        <h3>📚 Learning & Development</h3>
        ${learningChart}
        <table class="table">
          <tr><th>Month</th><th>Hours</th></tr>
          ${data.map((d, i) => `<tr><td>${months[i]}</td><td>${learningHours[i].toFixed(1)}h</td></tr>`).join('')}
        </table>
      </div>

      <div class="section">
        <h3>💬 Feedback</h3>
        <ul class="feedback-list">
          ${data.map(d => `
            <li>
              <strong>${monthLabel(d.monthKey)}:</strong>
              Manager - ${d.manager?.comments || 'No comments'}; Employee - ${d.feedback?.company || d.feedback?.hr || d.feedback?.challenges || 'No feedback'}
            </li>
          `).join('')}
        </ul>
      </div>

      <div class="section">
        <h3>🛠 Discipline</h3>
        <table class="table">
          <tr><th>Month</th><th>WFO</th><th>WFH</th><th>Tasks</th><th>AI Usage</th></tr>
          ${data.map(d => `<tr>
            <td>${monthLabel(d.monthKey)}</td>
            <td>${d.meta?.attendance?.wfo || 0}</td>
            <td>${d.meta?.attendance?.wfh || 0}</td>
            <td>${d.meta?.tasks?.count || 0}</td>
            <td>${d.aiUsageNotes || 'N/A'}</td>
          </tr>`).join('')}
        </table>
      </div>

      <div class="section">
        <h3>🔍 Summary</h3>
        <ul class="recommendations">
          ${recommendations.map(r => `<li>${r}</li>`).join('')}
        </ul>
        <table class="summary-table">
          <tr><th>Growth</th><th>Shortcomings</th></tr>
          <tr>
            <td>${growth.join('<br/>') || '—'}</td>
            <td>${shortcomings.join('<br/>') || '—'}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h3>✅ Action Items</h3>
        <ol class="action-list">
          ${actionItems.map(a => `<li>${a}</li>`).join('')}
        </ol>
      </div>
    `;
  };

  const downloadPDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Performance Report - ${employeeName}</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              .page-break { page-break-before: always; }
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 20px;
              line-height: 1.6;
              color: #1f2937;
            }

            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
            }

            .logo {
              width: 60px;
              margin: 0 auto 10px;
            }

            .header h1 {
              color: #2563eb;
              font-size: 28px;
              margin-bottom: 5px;
            }

            .header h2 {
              color: #1f2937;
              margin: 6px 0;
              font-size: 24px;
            }

            .section {
              margin-bottom: 30px;
              break-inside: avoid;
            }

            .section h3 {
              color: #1f2937;
              border-left: 4px solid #2563eb;
              padding-left: 12px;
              margin-bottom: 12px;
              font-size: 20px;
            }

            .chart {
              width: 100%;
              height: auto;
              margin: 10px 0;
            }

            .client-list > li { margin-bottom: 8px; }
            .client-list ul { margin-left: 16px; }

            .table,
            .summary-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 12px;
            }

            .table th,
            .table td,
            .summary-table th,
            .summary-table td {
              border: 1px solid #e5e7eb;
              padding: 6px;
              text-align: left;
            }

            .table th {
              background-color: #2563eb;
              color: white;
            }

            .summary-table th {
              background-color: #f3f4f6;
            }

            .badge {
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 11px;
              display: inline-block;
            }

            .badge.win {
              background: #dcfce7;
              color: #166534;
            }

            .badge.warn {
              background: #fef3c7;
              color: #92400e;
            }

            .feedback-list li {
              margin-bottom: 6px;
            }

            .recommendations li,
            .action-list li {
              margin-left: 16px;
              margin-bottom: 4px;
            }

            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" rx="20" fill="#2563eb" />
                <text x="50" y="55" font-size="45" fill="white" text-anchor="middle" font-family="sans-serif">BP</text>
              </svg>
            </div>
            <h1>Branding Pioneers</h1>
            <h2>Employee Performance Report</h2>
            <h2>${employeeName}</h2>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
          
          ${generateComprehensiveReport()}
          
          <div class="footer">
            <p>This report was generated by the Branding Pioneers Monthly Tactical System</p>
            <p>For questions about this report, please contact your manager or HR department</p>
          </div>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${employeeName.replace(/\s+/g, '_')}_Complete_Performance_Report_${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={downloadPDF}
      className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-200 shadow-sm flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      Download Complete Report
    </button>
  );
};