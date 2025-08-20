import React, { useMemo, useState } from "react";
import { useFetchSubmissions } from "./useFetchSubmissions.js";
import { useModal } from "./AppShell";
import { thisMonthKey, monthLabel } from "./constants";
import { ClientReportsView } from "./ClientReportsView";
import { EmployeeProfileModal } from "./EmployeeProfileModal";
import { useSupabase } from "./SupabaseProvider";

export function EmployeePersonalDashboard({ employee, onBack }) {
  const supabase = useSupabase();
  const { allSubmissions, loading } = useFetchSubmissions();
  const { openModal, closeModal } = useModal();

  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem(`employee-profile-${employee.phone}`);
    return stored ? JSON.parse(stored) : {};
    });
  const mergedEmployee = { ...employee, ...profile };
  const missingFields = ["photoUrl", "joiningDate", "dob", "education", "certifications", "skills"].filter(f => !mergedEmployee[f]);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const employeeSubmissions = useMemo(() => {
    return allSubmissions.filter(s =>
      s.employee?.name === employee.name &&
      s.employee?.phone === employee.phone
    ).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [allSubmissions, employee]);

  const currentMonthSubmission = useMemo(() => {
    const currentMonth = thisMonthKey();
    return employeeSubmissions.find(s => s.monthKey === currentMonth);
  }, [employeeSubmissions]);

  const overallStats = useMemo(() => {
    if (employeeSubmissions.length === 0) return null;
    
    const avgOverallScore = employeeSubmissions.reduce((sum, s) => sum + (s.scores?.overall || 0), 0) / employeeSubmissions.length;
    const avgKpiScore = employeeSubmissions.reduce((sum, s) => sum + (s.scores?.kpiScore || 0), 0) / employeeSubmissions.length;
    const avgLearningScore = employeeSubmissions.reduce((sum, s) => sum + (s.scores?.learningScore || 0), 0) / employeeSubmissions.length;
    const avgRelationshipScore = employeeSubmissions.reduce((sum, s) => sum + (s.scores?.relationshipScore || 0), 0) / employeeSubmissions.length;
    
    const totalLearningHours = employeeSubmissions.reduce((sum, s) => {
      return sum + (s.learning || []).reduce((learningSum, l) => learningSum + (l.durationMins || 0), 0);
    }, 0) / 60;
    
    return {
      avgOverallScore: avgOverallScore.toFixed(1),
      avgKpiScore: avgKpiScore.toFixed(1),
      avgLearningScore: avgLearningScore.toFixed(1),
      avgRelationshipScore: avgRelationshipScore.toFixed(1),
      totalSubmissions: employeeSubmissions.length,
      totalLearningHours: totalLearningHours.toFixed(1),
      improvementTrend: employeeSubmissions.length >= 2 ? 
        ((employeeSubmissions[0].scores?.overall || 0) - (employeeSubmissions[1].scores?.overall || 0)).toFixed(1) : '0'
    };
  }, [employeeSubmissions]);

  const handleSaveProfile = async (data) => {
    const updated = { ...mergedEmployee, ...data };
    setProfile(updated);
    localStorage.setItem(`employee-profile-${employee.phone}`, JSON.stringify(updated));
    if (supabase) {
      try {
        await Promise.all(
          employeeSubmissions.map(s =>
            supabase.from('submissions').update({ employee: { ...s.employee, ...data } }).eq('id', s.id)
          )
        );
      } catch (e) {
        console.error('Failed to update profile in submissions', e);
      }
    }
  };

  const generateAndDownloadPDF = (submission, employeeName) => {
    const pdfContent = `
      EMPLOYEE PERFORMANCE REPORT\n\n
      Employee: ${employeeName}\n
      Month: ${monthLabel(submission.monthKey)}\n
      Department: ${submission.employee?.department || 'N/A'}\n\n      

      PERFORMANCE SCORES:\n
      Overall Score: ${submission.scores?.overall?.toFixed(1) || 'N/A'}/10\n
      KPI Score: ${submission.scores?.kpiScore?.toFixed(1) || 'N/A'}/10\n
      Learning Score: ${submission.scores?.learningScore?.toFixed(1) || 'N/A'}/10\n
      Client Relations: ${submission.scores?.relationshipScore?.toFixed(1) || 'N/A'}/10\n\n      

      ${submission.manager_remarks ? `MANAGER FEEDBACK:\n${submission.manager_remarks}\n\n` : ''}
      

      Generated on: ${new Date().toLocaleDateString()}\n
      

      © Branding Pioneers Agency - Employee Performance Management System
    `;
    
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${employeeName.replace(/\s+/g, '_')}_${submission.monthKey}_Report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSubmissionSummary = (submission) => {
    return `📈 PERFORMANCE SUMMARY - ${monthLabel(submission.monthKey)}\n\n★ Overall Score: ${submission.scores?.overall?.toFixed(1) || 'N/A'}/10\n\n🎯 KPI Performance: ${submission.scores?.kpiScore?.toFixed(1) || 'N/A'}/10\n🎓 Learning Activities: ${submission.scores?.learningScore?.toFixed(1) || 'N/A'}/10\n🤝 Client Relations: ${submission.scores?.relationshipScore?.toFixed(1) || 'N/A'}/10\n\n${submission.flags?.missingLearningHours ? '⚠️ Action needed: Complete learning hours requirement\n' : ''}
${submission.flags?.hasEscalations ? '⚠️ Action needed: Address client escalations\n' : ''}
${submission.flags?.missingReports ? '⚠️ Action needed: Submit missing client reports\n' : ''}
${submission.manager_remarks ? `\n📝 Manager Feedback:\n${submission.manager_remarks}` : '\n📝 No manager feedback yet'}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg sm:text-2xl font-bold flex-shrink-0">
              {mergedEmployee.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{mergedEmployee.name}</h1>
              <p className="text-sm sm:text-base text-gray-600">{mergedEmployee.department} Department</p>
              <p className="text-xs sm:text-sm text-gray-500">Phone: {mergedEmployee.phone}</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation self-start sm:self-auto"
          >
            <span className="sm:hidden">← Form</span>
            <span className="hidden sm:inline">← Back to Form</span>
          </button>
        </div>
      </div>

      {missingFields.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
              !
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-yellow-800 text-sm sm:text-base">Complete Your Profile</h3>
              <p className="text-xs sm:text-sm text-yellow-700 leading-relaxed">Add missing details to keep your profile up to date.</p>
              <button onClick={() => setProfileModalOpen(true)} className="mt-2 text-xs sm:text-sm text-yellow-800 underline">Edit profile</button>
            </div>
          </div>
        </div>
      )}

      {currentMonthSubmission && (
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
              ✓
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-green-800 text-sm sm:text-base">Current Month Submitted</h3>
              <p className="text-xs sm:text-sm text-green-700 leading-relaxed">
                {monthLabel(currentMonthSubmission.monthKey)} report submitted with {currentMonthSubmission.scores?.overall?.toFixed(1) || 'N/A'}/10 overall score
              </p>
            </div>
          </div>
        </div>
      )}

      {overallStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{overallStats.avgOverallScore}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">Average Score</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">{overallStats.totalSubmissions}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">Total Reports</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">{overallStats.totalLearningHours}</div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">Learning Hours</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 text-center">
            <div className={`text-2xl sm:text-3xl font-bold ${ 
              parseFloat(overallStats.improvementTrend) > 0 ? 'text-green-600' : 
              parseFloat(overallStats.improvementTrend) < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {parseFloat(overallStats.improvementTrend) > 0 ? '+' : ''}{overallStats.improvementTrend}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">Trend</div>
          </div>
        </div>
      )}

      {overallStats && (
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4">Performance Breakdown</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">KPI Performance</span>
                <span className="font-medium text-sm">{overallStats.avgKpiScore}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(parseFloat(overallStats.avgKpiScore) / 10) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Learning Score</span>
                <span className="font-medium text-sm">{overallStats.avgLearningScore}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(parseFloat(overallStats.avgLearningScore) / 10) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Client Relations</span>
                <span className="font-medium text-sm">{overallStats.avgRelationshipScore}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(parseFloat(overallStats.avgRelationshipScore) / 10) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {employeeSubmissions.some(s => s.manager_remarks) && (
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
            📝 Manager Feedback
          </h3>
          <div className="space-y-4">
            {employeeSubmissions
              .filter(s => s.manager_remarks)
              .map((submission, index) => (
                <div key={submission.id || index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-900">{monthLabel(submission.monthKey)}</h4>
                    <span className="text-xs text-blue-600">
                      {submission.manager_edited_at ? new Date(submission.manager_edited_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
                    {submission.manager_remarks}
                  </p>
                  {submission.manager_edited_by && (
                    <p className="text-xs text-blue-600 mt-2">
                      — {submission.manager_edited_by}
                    </p>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      )}

      <ClientReportsView employee={mergedEmployee} employeeSubmissions={employeeSubmissions} />

      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Submission History & Reports</h3>
        {employeeSubmissions.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📊</div>
            <p className="text-sm sm:text-base text-gray-600 px-4">No submissions yet. Submit your first monthly report to see your progress here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {employeeSubmissions.map((submission, index) => (
              <div key={submission.id || index} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base ${ 
                      submission.isDraft ? 'bg-orange-500' : 'bg-green-500'
                    }`}>
                      {submission.isDraft ? '📋' : '✓'}
                    </div>
                    <div>
                      <div className="font-medium text-sm sm:text-base">{monthLabel(submission.monthKey)}</div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        {submission.isDraft ? 'Draft' : 'Submitted'} • Score: {submission.scores?.overall?.toFixed(1) || 'N/A'}/10
                      </div>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
                    <span className="hidden sm:inline">{new Date(submission.created_at || submission.updated_at).toLocaleDateString()}</span>
                    <span className="sm:hidden">{new Date(submission.created_at || submission.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                
                {!submission.isDraft && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => generateAndDownloadPDF(submission, mergedEmployee.name)}
                      className="flex-1 px-3 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation"
                    >
                      📊 Download Report
                    </button>
                    <button
                      onClick={() => openModal('Submission Details', getSubmissionSummary(submission), closeModal)}
                      className="flex-1 px-3 py-2 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
                    >
                      🔍 View Summary
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
      <EmployeeProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        initialProfile={mergedEmployee}
        onSave={handleSaveProfile}
      />
      </>
    );
  }
