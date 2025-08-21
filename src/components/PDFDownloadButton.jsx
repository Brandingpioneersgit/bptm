import React from 'react';
import { monthLabel } from '@/shared/lib/constants';
import { calculateScopeCompletion, getServiceWeight } from '@/shared/lib/scoring';

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

    const latest = [...data].sort((a, b) => b.monthKey.localeCompare(a.monthKey))[0];
    const employeePhoto = latest?.employee?.photoUrl || '';

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
            <th>Penalty</th>
            <th>Manager Score</th>
            <th>Manager Comments</th>
          </tr>
          ${data.map(d => {
            const learningHours = ((d.learning || []).reduce((sum, l) => sum + (l.durationMins || 0), 0) / 60).toFixed(1);
            const clientScopeHtml = (d.clients || []).map(c => {
              const services = c.services || [];
              if (!services.length) return '';
              const total = services.reduce((acc, sv) => {
                const nm = typeof sv === 'string' ? sv : sv.service;
                let pp = 0; try { pp = calculateScopeCompletion(c, nm, { monthKey: d.monthKey }) || 0; } catch {}
                const ww = getServiceWeight(nm);
                return acc + (ww * pp);
              }, 0) || 1;
              const serviceBars = services.map(s => {
                const name = typeof s === 'string' ? s : s.service;
                let pct = 0;
                try { pct = calculateScopeCompletion(c, name, { monthKey: d.monthKey }) || 0; } catch {}
                const w = getServiceWeight(name);
                const share = Math.round(((w * pct) / total) * 100);
                const color = pct>=100? '#10b981' : pct>=60 ? '#f59e0b' : '#ef4444';
                return `
                  <div style="font-size:12px;margin:2px 0;">
                    <div style="display:flex;justify-content:space-between;"><span>${name} <span style=\"color:#6b7280\">(w ${w}, ${share}% of scope)</span></span><span>${pct}%</span></div>
                    <div style="background:#e5e7eb;height:6px;border-radius:9999px;">
                      <div style="height:6px;background:${color};width:${pct}%;border-radius:9999px;"></div>
                    </div>
                  </div>`;
              }).join('');
              return `
                <div style="margin:8px 0;">
                  <div><strong>${c.name || c.op_clientName || 'Client'}</strong> ${c.op_clientStatus ? `- ${c.op_clientStatus}` : ''}</div>
                  <div style="margin-top:4px;">${serviceBars}</div>
                </div>`;
            }).join('');

            return `
              <tr>
                <td><strong>${monthLabel(d.monthKey)}</strong></td>
                <td class="score-cell ${(d.scores?.overall || 0) >= 7 ? 'score-good' : 'score-poor'}">${d.scores?.overall || 'N/A'}/10</td>
                <td class="score-cell">${d.scores?.kpiScore || 'N/A'}/10</td>
                <td class="score-cell">${d.scores?.learningScore || 'N/A'}/10</td>
                <td class="score-cell">${d.scores?.relationshipScore || 'N/A'}/10</td>
                <td>${learningHours}h</td>
                <td>${d.discipline?.penalty ? `-${d.discipline.penalty}` : '0'}</td>
                <td>${d.manager?.score || 'N/A'}/10</td>
                <td class="comments-cell">${d.manager?.comments || 'No comments'}</td>
              </tr>
              ${clientScopeHtml ? `<tr><td colspan="9"><div class="detail-section"><strong>Service Progress</strong>${clientScopeHtml}</div></td></tr>` : ''}
            `;
          }).join('')}
        </table>
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
                  ${d.clients.map(c => `
                    <div style="margin:8px 0;">
                      <div><strong>${c.name || c.op_clientName || 'Client'}</strong> ${c.op_clientStatus ? `- ${c.op_clientStatus}` : ''}</div>
                      ${(c.services && c.services.length) ? `
                        <div style="margin-top:4px;">
                          ${(c.services||[]).map(s => {
                            const name = typeof s === 'string' ? s : s.service;
                            try {
                              return `
                                <div style=\"font-size:12px;margin:2px 0;\">
                                  <div style=\"display:flex;justify-content:space-between;\"><span>${name}</span><span>${0}%</span></div>
                                  <div style=\"background:#e5e7eb;height:6px;border-radius:9999px;\">
                                    <div style=\"height:6px;background:#10b981;width:${0}%;border-radius:9999px;\"></div>
                                  </div>
                                </div>`
                            } catch (e) { return '' }
                          }).join('')}
                        </div>
                      ` : ''}
                    </div>
                  `).join('')}
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

              ${(d.manager && (d.manager.score || d.manager.comments || d.manager.recommendations || (d.manager.rubrics && (d.manager.rubrics.collaboration || d.manager.rubrics.ownership || d.manager.rubrics.quality || d.manager.rubrics.communication)))) ? `
                <div class="detail-section">
                  <strong>Manager Evaluation:</strong>
                  ${d.manager.score ? `<p><em>Score:</em> ${d.manager.score}/10</p>` : ''}
                  ${d.manager.rubrics ? `
                    <p><em>Rubrics:</em>
                      <span>Collab: ${d.manager.rubrics.collaboration || '—'}</span>,
                      <span>Ownership: ${d.manager.rubrics.ownership || '—'}</span>,
                      <span>Quality: ${d.manager.rubrics.quality || '—'}</span>,
                      <span>Comm: ${d.manager.rubrics.communication || '—'}</span>
                    </p>
                  ` : ''}
                  ${d.manager.comments ? `<p><em>Comments:</em> ${d.manager.comments}</p>` : ''}
                  ${d.manager.recommendations ? `<p><em>Recommendations:</em> ${d.manager.recommendations}</p>` : ''}
                  ${d.manager.testimonialUrl ? `<p><em>Testimonial:</em> <a href="${d.manager.testimonialUrl}">${d.manager.testimonialUrl}</a></p>` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  const downloadPDF = () => {
    const latest = data && data.length ? [...data].sort((a, b) => b.monthKey.localeCompare(a.monthKey))[0] : null;
    const employeePhoto = latest?.employee?.photoUrl || '';
    const brandLogo = 'https://brandingpioneers.com/assets/logo.png';
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
            .brand-row { display: flex; align-items: center; justify-content: center; gap: 12px; }
            .brand-row img.logo { height: 36px; }
            .profile { margin-top: 8px; }
            .profile img { width: 72px; height: 72px; border-radius: 9999px; object-fit: cover; border: 3px solid #e5e7eb; }
            
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
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand-row">
              <img class="logo" src="${brandLogo}" alt="Branding Pioneers" onerror="this.style.display='none'" />
              <h1>Branding Pioneers</h1>
            </div>
            <h2>Employee Performance Report</h2>
            <h2>${employeeName}</h2>
            ${employeePhoto ? `<div class="profile"><img src="${employeePhoto}" alt="${employeeName}" /></div>` : ''}
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
