import React, { useState } from 'react';
import { exportReport, reportUtils } from '../utils/reportGenerator';
import { useToast } from '@/shared/components/Toast';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/shared/components/LoadingStates';

export const PDFDownloadButton = ({ data, employeeName, yearlySummary }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { notify } = useToast();

  const handleDownloadPDF = async () => {
    if (!data || data.length === 0) {
      notify({
        type: 'error',
        title: 'No Data Available',
        message: 'No performance data available to generate PDF report.'
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      notify({
        type: 'info',
        title: 'Generating PDF',
        message: 'Creating your performance report...'
      });

      // Prepare report data
      const reportData = {
        employeeName: employeeName || 'Unknown Employee',
        department: data[0]?.department || 'N/A',
        period: 'Annual Report',
        metrics: {
          'Total Submissions': data.length,
          'Average Score': `${(data.reduce((sum, item) => sum + (item.scores?.overall || 0), 0) / data.length).toFixed(1)}/10`,
          'Best Performance': `${Math.max(...data.map(item => item.scores?.overall || 0)).toFixed(1)}/10`,
          'Latest Score': `${data[data.length - 1]?.scores?.overall?.toFixed(1) || 'N/A'}/10`
        },
        summary: yearlySummary || 'Annual performance summary based on monthly submissions.',
        performanceData: data.map(submission => ({
          month: submission.monthKey,
          overallScore: submission.scores?.overall || 0,
          kpiScore: submission.scores?.kpiScore || 0,
          learningScore: submission.scores?.learningScore || 0,
          relationshipScore: submission.scores?.relationshipScore || 0
        })),
        kpiDetails: data.flatMap(submission => submission.kpis || [])
      };

      const filename = reportUtils.generateFilename(`${employeeName.replace(/\s+/g, '_')}_Annual_Report`);
      const result = await exportReport(reportData, 'pdf', 'employeePerformance', filename);

      if (result.success) {
        notify({
          type: 'success',
          title: 'PDF Generated',
          message: 'Your performance report has been downloaded successfully.'
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      notify({
        type: 'error',
        title: 'PDF Generation Failed',
        message: error.message || 'Failed to generate PDF report. Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownloadPDF}
      disabled={isGenerating || !data || data.length === 0}
      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-colors"
    >
      {isGenerating ? (
        <>
          <LoadingSpinner size="small" />
          <span>Generating PDF...</span>
        </>
      ) : (
        <>
          <DocumentArrowDownIcon className="h-4 w-4" />
          <span>Download PDF Report</span>
        </>
      )}
    </button>
  );
};

export default PDFDownloadButton;