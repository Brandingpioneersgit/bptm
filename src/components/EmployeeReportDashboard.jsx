import React, { useMemo, useEffect, useState } from "react";
import { useModal } from "@/shared/components/ModalContext";
import { Section } from "@/shared/components/ui";
import { PerformanceChart } from "./PerformanceChart";
import { PDFDownloadButton } from "./PDFDownloadButton";
import { generateSummary } from "@/shared/lib/scoring";
import { monthLabel, round1 } from "@/shared/lib/constants";
import { EmployeeReportService } from "../services/employeeReportService";

function SummarySection({ title, items }) {
  return (
    <div className="mt-2">
      <h5 className="font-medium text-gray-700">{title}:</h5>
      {items && items.length > 0 ? (
        <ul className="list-disc ml-5 text-sm text-gray-600">
          {items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-600">None</p>
      )}
    </div>
  );
}

export function EmployeeReportDashboard({ employeeName, employeePhone, onBack }) {
  const { openModal, closeModal } = useModal();
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [reportData, setReportData] = useState({
    submissions: [],
    loading: true,
    error: null
  });

  if (!employeeName) {
    return <div className="p-8 text-red-600">Error: No employee name provided</div>;
  }


  // Fetch employee submissions on component mount and when employee changes
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!employeeName) return;
      
      setReportData(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const submissions = await EmployeeReportService.getEmployeeSubmissions(employeeName, employeePhone);
        setReportData({
          submissions,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching employee submissions:', error);
        setReportData({
          submissions: [],
          loading: false,
          error: error.message
        });
      }
    };
    
    fetchEmployeeData();
  }, [employeeName, employeePhone]);
  
  const employeeSubmissions = reportData.submissions;

  const selectedReport = useMemo(() => {
    return employeeSubmissions.find(s => s.id === selectedReportId) || null;
  }, [employeeSubmissions, selectedReportId]);

  const structuredSummary = useMemo(() => {
    if (!selectedReport) return null;
    return generateSummary(selectedReport);
  }, [selectedReport]);

  const yearlySummary = useMemo(() => {
    return EmployeeReportService.calculateYearlySummary(employeeSubmissions);
  }, [employeeSubmissions]);

  useEffect(() => {
    if (employeeSubmissions.length > 0) {
      setSelectedReportId(employeeSubmissions[employeeSubmissions.length - 1].id);
    }
  }, [employeeSubmissions]);

  if (reportData.loading) {
    return <div className="text-center p-8">Loading employee report...</div>;
  }
  
  if (reportData.error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Report for {employeeName}</h1>
          <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl px-4 py-2">
            &larr; Back to Dashboard
          </button>
        </div>
        <Section title="Error Loading Report">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <h4 className="font-medium text-red-800 mb-2">Failed to load employee report</h4>
            <p className="text-sm text-red-600">{reportData.error}</p>
          </div>
        </Section>
      </div>
    );
  }


  if (!employeeSubmissions.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Report for {employeeName}</h1>
          <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl px-4 py-2">
            &larr; Back to Dashboard
          </button>
        </div>
        
        <Section title="🔍 Debug Information">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h4 className="font-medium text-yellow-800 mb-3">Searching for:</h4>
            <div className="text-sm space-y-1">
              <div><strong>Employee Name:</strong> "{employeeName}"</div>
              <div><strong>Employee Phone:</strong> "{employeePhone}"</div>
              <div><strong>Total Submissions Found:</strong> {employeeSubmissions.length}</div>
              <div><strong>Loading:</strong> {reportData.loading ? 'Yes' : 'No'}</div>
            </div>
            
            <h4 className="font-medium text-yellow-800 mt-4 mb-3">Search Details:</h4>
            <div className="text-xs space-y-1">
              <div><strong>Search performed for:</strong> "{employeeName}"</div>
              <div><strong>Phone filter:</strong> {employeePhone || 'None'}</div>
              <div><strong>Service used:</strong> EmployeeReportService</div>
              <div><strong>Data sources:</strong> monthly_form_submissions, unified_users, submissions (legacy)</div>
            </div>
          </div>
        </Section>
        
        <Section title="No Submissions Found">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No submissions found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any submissions for "{employeeName}". 
              This might be due to:
            </p>
            <ul className="text-left text-sm text-gray-600 space-y-1 max-w-md mx-auto">
              <li>• Employee name mismatch (check spelling/spacing)</li>
              <li>• Phone number mismatch</li>
              <li>• No submissions created yet</li>
              <li>• Data filtering issues</li>
            </ul>
          </div>
        </Section>
      </div>
    );
  }

  const formattedReport = useMemo(() => {
    let reportText = `---
### Employee Performance Report for ${employeeName}
-   **Total Months Submitted:** ${yearlySummary.totalMonths}
-   **Average Overall Score:** ${yearlySummary.avgOverall}/10
-   **Months with Learning Shortfall:** ${yearlySummary.monthsWithLearningShortfall}
---

`;
    employeeSubmissions.forEach(s => {
      reportText += `#### ${monthLabel(s.monthKey)} Report
-   **Overall Score:** ${s.scores.overall}/10
-   **KPI Score:** ${s.scores.kpiScore}/10
-   **Learning Score:** ${s.scores.learningScore}/10
-   **Learning Hours:** ${(s.learning || []).reduce((sum, e) => sum + (e.durationMins || 0), 0) / 60}h
-   **Client Relationship Score:** ${s.scores.relationshipScore}/10
-   **Manager Notes:** ${s.manager?.comments || 'N/A'}
-   **Manager Score:** ${s.manager?.score || 'N/A'}
---
`;
    });
    return reportText;
  }, [employeeSubmissions, yearlySummary, employeeName]);

  const handleCopyReport = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(formattedReport);
        openModal('Copied', 'The report text has been copied to your clipboard. You can now paste it into a document or email.', closeModal);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = formattedReport;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          openModal('Copied', 'The report text has been copied to your clipboard. You can now paste it into a document or email.', closeModal);
        } else {
          throw new Error('Fallback copy failed');
        }
      }
    } catch (err) {
      openModal('Error', 'Failed to copy report text. Please try selecting and copying the text manually.', closeModal);
    }
  };

  const getImprovementRecommendations = () => {
    return EmployeeReportService.getImprovementRecommendations(yearlySummary);
  };


  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Report for {employeeName}</h1>
        <button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl px-4 py-2">
          &larr; Back to Dashboard
        </button>
      </div>



      {yearlySummary && (
        <Section title="Cumulative Summary & Recommendations">
          <div className="grid md:grid-cols-4 gap-4 text-center mb-6">
            <div className="bg-blue-600 text-white rounded-2xl p-4">
              <div className="text-sm opacity-80">Average Overall</div>
              <div className="text-3xl font-semibold">{yearlySummary.avgOverall}/10</div>
            </div>
            <div className="bg-white border rounded-2xl p-4 shadow-sm">
              <div className="text-sm opacity-80">Average KPI</div>
              <div className="text-3xl font-semibold">{yearlySummary.avgKpi}/10</div>
            </div>
            <div className="bg-white border rounded-2xl p-4 shadow-sm">
              <div className="text-sm opacity-80">Average Learning</div>
              <div className="font-bold text-3xl">{yearlySummary.avgLearning}/10</div>
            </div>
            <div className="bg-white border rounded-2xl p-4 shadow-sm">
              <div className="text-sm opacity-80">Learning Shortfall</div>
              <div className="text-3xl font-semibold text-red-600">
                {yearlySummary.monthsWithLearningShortfall}
                <span className="text-xl"> month{yearlySummary.monthsWithLearningShortfall !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {employeeSubmissions.length > 1 && (
            <div className="mb-6">
              <PerformanceChart
                data={employeeSubmissions.map(s => ({
                  month: monthLabel(s.monthKey),
                  score: s.scores?.overall || 0
                }))}
                title="📈 Performance Trend Over Time"
              />
            </div>
          )}

          <div className="mt-4">
            <h4 className="font-medium text-gray-700">Recommendations:</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{getImprovementRecommendations()}</p>
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <button
              onClick={handleCopyReport}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-semibold"
            >
              Copy Full Report to Clipboard
            </button>
            <PDFDownloadButton data={employeeSubmissions} employeeName={employeeName} yearlySummary={yearlySummary} />
          </div>
        </Section>
      )}

      <Section title="Monthly Submissions">
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium">View Report for:</label>
          <select
            className="border rounded-xl p-2"
            value={selectedReportId || ''}
            onChange={(e) => setSelectedReportId(e.target.value)}
          >
            {employeeSubmissions.map(s => (
              <option key={s.id} value={s.id}>
                {monthLabel(s.monthKey)}
              </option>
            ))}
          </select>
        </div>

        {selectedReport && (
          <div className="border rounded-2xl p-4 shadow-sm bg-blue-50/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{monthLabel(selectedReport.monthKey)} Report</h3>
              <span className={`text-sm font-semibold ${selectedReport.scores.overall >= 7 ? 'text-emerald-600' : 'text-red-600'}`}>
                Overall Score: {selectedReport.scores.overall}/10
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
              <div className="bg-white rounded-xl p-2 border">
                <div className="font-medium text-gray-700">KPI</div>
                <div className="font-bold text-xl">{selectedReport.scores.kpiScore}/10</div>
              </div>
              <div className="bg-white rounded-xl p-2 border">
                <div className="font-medium text-gray-700">Learning</div>
                <div className="font-bold text-xl">{selectedReport.scores.learningScore}/10</div>
              </div>
              <div className="bg-white rounded-xl p-2 border">
                <div className="font-medium text-gray-700">Client Status</div>
                <div className="font-bold text-xl">{selectedReport.scores.relationshipScore}/10</div>
              </div>
              <div className="bg-white rounded-xl p-2 border">
                <div className="font-medium text-gray-700">Learning Hours</div>
                <div className="font-bold text-xl">{(selectedReport.learning || []).reduce((sum, e) => sum + (e.durationMins || 0), 0) / 60}h</div>
              </div>
            </div>
            {structuredSummary && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-gray-700">Summary</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{structuredSummary.overview}</p>
                <SummarySection title="Strengths" items={structuredSummary.strengths} />
                <SummarySection title="Weaknesses" items={structuredSummary.weaknesses} />
                <SummarySection title="Missed Tasks" items={structuredSummary.missed} />
                <SummarySection title="Next Month Tips" items={structuredSummary.tips} />
              </div>
            )}
            <details className="mt-4 cursor-pointer">
              <summary className="font-medium text-blue-600 hover:text-blue-800">
                View Full Submission Data
              </summary>
              <pre className="text-xs bg-gray-50 border rounded-xl p-2 overflow-auto max-h-60 mt-2">
                {JSON.stringify(selectedReport, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </Section>
    </div>
  );
}
