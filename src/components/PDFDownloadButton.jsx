import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

    // Calculate comprehensive statistics
    const totalLearningHours = data.reduce((sum, d) => {
      return sum + ((d.learning || []).reduce((learningSum, l) => learningSum + (l.durationMins || 0), 0) / 60);
    }, 0);

    const avgOverallScore = data.reduce((sum, d) => sum + (d.scores?.overall || 0), 0) / data.length;
    const avgKpiScore = data.reduce((sum, d) => sum + (d.scores?.kpiScore || 0), 0) / data.length;
    const avgLearningScore = data.reduce((sum, d) => sum + (d.scores?.learningScore || 0), 0) / data.length;

    const uniqueClients = Array.from(new Set(data.flatMap(d => (d.clients || []).map(c => c.op_clientName || 'Unnamed'))));

    const strengths = [];
    if (avgKpiScore >= 7) strengths.push('Strong KPI performance');
    if (avgLearningScore >= 7) strengths.push('Consistent learning');
    if (yearlySummary?.avgRelationship >= 7) strengths.push('Positive client relationships');

    const weaknesses = [];
    if (avgKpiScore < 7) weaknesses.push('KPIs below target');
    if (avgLearningScore < 7) weaknesses.push('Learning scores need improvement');
    if ((yearlySummary?.avgRelationship || 0) < 7) weaknesses.push('Client relationships need attention');
    if (yearlySummary?.monthsWithLearningShortfall > 0) weaknesses.push(`${yearlySummary.monthsWithLearningShortfall} month(s) with learning shortfall`);

    const actionItems = [];
    if (yearlySummary?.monthsWithLearningShortfall > 0) actionItems.push('Complete required learning hours each month');
    if (avgKpiScore < 7) actionItems.push('Focus on KPI improvements');
    if ((yearlySummary?.avgRelationship || 0) < 7) actionItems.push('Increase client relationship efforts');
    if (actionItems.length === 0) actionItems.push('Keep up the great work!');

    const chartSvg = (() => {
      const width = 500;
      const height = 200;
      const padding = 40;
      const points = data.map((d, i) => {
        const x = padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
        const y = height - padding - ((d.scores?.overall || 0) / 10) * (height - padding * 2);
        return `${x},${y}`;
      }).join(' ');
      const circles = data.map((d, i) => {
        const x = padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
        const y = height - padding - ((d.scores?.overall || 0) / 10) * (height - padding * 2);
        return `<circle cx="${x}" cy="${y}" r="4" fill="#3b82f6" />`;
      }).join('');
      return `<svg width="${width}" height="${height}"><polyline points="${points}" fill="none" stroke="#3b82f6" stroke-width="3" />${circles}</svg>`;
    })();

    return `
      <!-- Executive Summary -->
      <div class="section">
        <h3>📊 Executive Summary</h3>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="metric-value">${Math.round(avgOverallScore * 10) / 10}/10</div>
            <div class="metric-label">Average Overall Score</div>
          </div>
          <div class="summary-card">
            <div class="metric-value">${data.length}</div>
            <div class="metric-label">Months Reported</div>
          </div>
          <div class="summary-card">
            <div class="metric-value">${Math.round(totalLearningHours * 10) / 10}h</div>
            <div class="metric-label">Total Learning Hours</div>
          </div>
          <div class="summary-card">
            <div class="metric-value">${Math.round(avgKpiScore * 10) / 10}/10</div>
            <div class="metric-label">Average KPI Score</div>
          </div>
        </div>
      </div>

      <!-- Client Logos -->
      <div class="section">
        <h3>🤝 Client Portfolio</h3>
        <div class="logo-grid">
          ${uniqueClients.length ? uniqueClients.map(name => `<div class="logo-item"><img src="https://placehold.co/80x40?text=${encodeURIComponent(name.charAt(0))}" alt="${name}" /><div>${name}</div></div>`).join('') : '<p>No client data available</p>'}
        </div>
      </div>

      <!-- Testimonials & Achievements -->
      <div class="section">
        <h3>🏅 Testimonials & Achievements</h3>
        <div class="badge-grid">
          <div class="badge">
            <img src="https://placehold.co/60x60?text=%F0%9F%8F%86" alt="Top Performer" />
            <span>Top Performer</span>
          </div>
          <div class="badge">
            <img src="https://placehold.co/60x60?text=%E2%AD%90" alt="Client Kudos" />
            <span>Client Kudos</span>
          </div>
        </div>
      </div>

      <!-- Performance Chart -->
      <div class="section">
        <h3>📈 Overall Score Trend</h3>
        <div class="chart">${chartSvg}</div>
      </div>

      <!-- Performance Trends -->
      <div class="section">
        <h3>📈 Performance Trends</h3>
        <table class="performance-table">
          <tr>
            <th>Month</th>
            <th>Overall</th>
            <th>KPI</th>
            <th>Learning</th>
            <th>Client Relations</th>
            <th>Learning Hours</th>
            <th>Manager Score</th>
            <th>Manager Comments</th>
          </tr>
          ${data.map(d => {
            const learningHours = ((d.learning || []).reduce((sum, l) => sum + (l.durationMins || 0), 0) / 60).toFixed(1);
            return `
              <tr>
                <td><strong>${monthLabel(d.monthKey)}</strong></td>
                <td class="score-cell ${(d.scores?.overall || 0) >= 7 ? 'score-good' : 'score-poor'}">${d.scores?.overall || 'N/A'}/10</td>
                <td class="score-cell">${d.scores?.kpiScore || 'N/A'}/10</td>
                <td class="score-cell">${d.scores?.learningScore || 'N/A'}/10</td>
                <td class="score-cell">${d.scores?.relationshipScore || 'N/A'}/10</td>
                <td>${learningHours}h</td>
                <td>${d.manager?.score || 'N/A'}/10</td>
                <td class="comments-cell">${d.manager?.comments || 'No comments'}</td>
              </tr>
            `;
          }).join('')}
        </table>
      </div>

      <!-- Growth vs. Shortcomings -->
      <div class="section">
        <h3>📉 Growth vs. Shortcomings</h3>
        <p><strong>Growth:</strong> ${strengths.length ? strengths.join(', ') : 'No standout strengths identified'}</p>
        <p><strong>Shortcomings:</strong> ${weaknesses.length ? weaknesses.join(', ') : 'No significant shortcomings detected'}</p>
      </div>

      <!-- Action Items -->
      <div class="section">
        <h3>✅ Action Items</h3>
        <ul>${actionItems.map(item => `<li>${item}</li>`).join('')}</ul>
      </div>

      <!-- Detailed Monthly Breakdown -->
      <div class="section">
        <h3>📋 Monthly Breakdown</h3>
        ${data.map(d => `
          <div class="month-section">
            <h4>${monthLabel(d.monthKey)} Report</h4>
            <div class="month-details">
              <div class="detail-row">
                <strong>Department:</strong> ${d.employee?.department || 'N/A'}
              </div>
              <div class="detail-row">
                <strong>Role:</strong> ${(d.employee?.role || []).join(', ') || 'N/A'}
              </div>
              <div class="detail-row">
                <strong>Attendance:</strong> WFO: ${d.meta?.attendance?.wfo || 0} days, WFH: ${d.meta?.attendance?.wfh || 0} days
              </div>
              <div class="detail-row">
                <strong>Tasks Completed:</strong> ${d.meta?.tasks?.count || 0}
              </div>
              
              <!-- Clients -->
              ${(d.clients && d.clients.length > 0) ? `
                <div class="detail-section">
                  <strong>Client Work:</strong>
                  <ul>
                    ${d.clients.map(c => `
                      <li>${c.op_clientName || 'Unnamed Client'} - ${c.op_clientStatus || 'Unknown Status'}</li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
              
              <!-- Learning -->
              ${(d.learning && d.learning.length > 0) ? `
                <div class="detail-section">
                  <strong>Learning Activities:</strong>
                  <ul>
                    ${d.learning.map(l => `
                      <li>${l.course || 'Unknown Course'} - ${Math.round((l.durationMins || 0) / 60 * 10) / 10}h</li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
              
              <!-- AI Usage -->
              ${d.aiUsageNotes ? `
                <div class="detail-section">
                  <strong>AI Usage:</strong>
                  <p>${d.aiUsageNotes}</p>
                </div>
              ` : ''}
              
              <!-- Feedback -->
              ${(d.feedback && (d.feedback.company || d.feedback.hr || d.feedback.challenges)) ? `
                <div class="detail-section">
                  <strong>Employee Feedback:</strong>
                  ${d.feedback.company ? `<p><em>Company:</em> ${d.feedback.company}</p>` : ''}
                  ${d.feedback.hr ? `<p><em>HR:</em> ${d.feedback.hr}</p>` : ''}
                  ${d.feedback.challenges ? `<p><em>Challenges:</em> ${d.feedback.challenges}</p>` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  const downloadPDF = () => {
    window.html2canvas = html2canvas;
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
              color: #333;
            }
            
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
            }
            
            .header h1 { 
              color: #2563eb; 
              margin-bottom: 5px; 
              font-size: 28px;
            }
            
            .header h2 { 
              color: #1f2937; 
              margin: 10px 0; 
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
              margin-bottom: 15px;
              font-size: 20px;
            }
            
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin: 20px 0;
            }
            
            .summary-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
            }
            
            .metric-value {
              font-size: 32px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 5px;
            }
            
            .metric-label {
              font-size: 14px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .performance-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 15px 0; 
              font-size: 12px;
            }
            
            .performance-table th, 
            .performance-table td { 
              border: 1px solid #d1d5db; 
              padding: 8px; 
              text-align: left; 
            }
            
            .performance-table th { 
              background-color: #2563eb; 
              color: white; 
              font-weight: 600;
            }
            
            .score-cell {
              text-align: center;
              font-weight: 600;
            }
            
            .score-good { color: #059669; }
            .score-poor { color: #dc2626; }
            
            .comments-cell {
              max-width: 200px;
              font-size: 11px;
              word-wrap: break-word;
            }
            
            .month-section {
              margin: 20px 0;
              padding: 15px;
              background: #f9fafb;
              border-radius: 8px;
              border-left: 4px solid #10b981;
            }
            
            .month-section h4 {
              color: #1f2937;
              margin-bottom: 10px;
            }
            
            .detail-row {
              margin: 8px 0;
              padding: 4px 0;
            }
            
            .detail-section {
              margin: 12px 0;
              padding-left: 15px;
            }
            
            .detail-section ul {
              margin: 5px 0;
            }
            
            .detail-section li {
              margin: 3px 0;
            }

            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }

            .logo-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 15px;
              align-items: center;
            }

            .logo-item {
              text-align: center;
            }

            .logo-item img {
              max-height: 40px;
            }

            .badge-grid {
              display: flex;
              gap: 15px;
              flex-wrap: wrap;
            }

            .badge {
              display: flex;
              flex-direction: column;
              align-items: center;
              font-size: 12px;
            }

            .badge img {
              width: 60px;
              height: 60px;
              border-radius: 50%;
            }

            .chart {
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏢 Branding Pioneers</h1>
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
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    const doc = new jsPDF('p', 'pt', 'a4');
    doc.html(container, {
      callback: function (doc) {
        doc.save(`${employeeName.replace(/\s+/g, '_')}_Complete_Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        document.body.removeChild(container);
      },
      html2canvas: { scale: 0.6 }
    });
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