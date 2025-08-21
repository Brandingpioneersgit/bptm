import React, { useMemo, useState, useEffect } from "react";
import { useFetchSubmissions } from "./useFetchSubmissions.js";
import { useModal } from "@/shared/components/ModalContext";
import { thisMonthKey, monthLabel } from "@/shared/lib/constants";
import { calculateScopeCompletion, getServiceWeight } from "@/shared/lib/scoring";
import { ClientReportsView } from "@/features/clients/components/ClientReportsView";
import { ProfileEditModal } from "./ProfileEditModal";
import { useSupabase } from "./SupabaseProvider";
import { DataCard, MetricRow, SmartDataDisplay } from "./DataDisplay";
import { useToast } from "@/shared/components/Toast";

export function EmployeePersonalDashboard({ employee: initialEmployee, onBack }) {
  const [employee, setEmployee] = useState(initialEmployee);
  const { allSubmissions, loading } = useFetchSubmissions();
  const { openModal, closeModal } = useModal();
  const supabase = useSupabase();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { notify } = useToast();

  const profileCompleteness = useMemo(() => {
    const requiredFields = [
      { key: 'photoUrl', label: 'Profile Photo', critical: true },
      { key: 'joiningDate', label: 'Joining Date', critical: true },
      { key: 'dob', label: 'Date of Birth', critical: false },
      { key: 'education', label: 'Education', critical: true },
      { key: 'certifications', label: 'Certifications', critical: false },
      { key: 'skills', label: 'Skills & Tools', critical: true },
      { key: 'department', label: 'Department', critical: true },
      { key: 'role', label: 'Role', critical: true },
      { key: 'directManager', label: 'Direct Manager', critical: true },
    ];
    
    const missing = requiredFields.filter(field => {
      const value = employee?.[field.key];
      if (field.key === 'role') {
        return !value || (Array.isArray(value) && value.length === 0);
      }
      return !value || (typeof value === 'string' && value.trim() === '');
    });
    
    const criticalMissing = missing.filter(f => f.critical);
    const completionPercentage = Math.round(((requiredFields.length - missing.length) / requiredFields.length) * 100);
    
    return {
      missing,
      criticalMissing,
      completionPercentage,
      isComplete: missing.length === 0,
      needsCriticalInfo: criticalMissing.length > 0,
      isFirstTime: missing.length >= 6 // More than half fields missing suggests first time
    };
  }, [employee]);

  const [hasShownFirstTimeModal, setHasShownFirstTimeModal] = useState(false);
  
  // Auto-show profile modal for first-time users
  useEffect(() => {
    if (profileCompleteness.isFirstTime && !hasShownFirstTimeModal && !loading) {
      setShowProfileModal(true);
      setHasShownFirstTimeModal(true);
    }
  }, [profileCompleteness.isFirstTime, hasShownFirstTimeModal, loading]);

  const handleSaveProfile = async (data) => {
    if (!supabase) return;
    const updated = { ...employee, ...data };
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ employee: updated })
        .eq('employee->>name', employee.name)
        .eq('employee->>phone', employee.phone);
      if (error) throw error;
      setEmployee(updated);
      setShowProfileModal(false);
      notify({ type: 'success', title: 'Profile updated', message: 'Your profile has been saved.' });
      openModal('Success', 'Profile updated successfully!', closeModal);
    } catch (err) {
      notify({ type: 'error', title: 'Profile update failed', message: err.message });
      openModal('Error', `Failed to update profile: ${err.message}`, closeModal);
    }
  };

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
    const svcLines = [];
    (submission.clients||[]).forEach(c => {
      (c.services||[]).forEach(s => {
        const name = typeof s === 'string' ? s : s.service;
        const pct = calculateScopeCompletion(c, name, { monthKey: submission.monthKey }) || 0;
        const w = getServiceWeight(name);
        svcLines.push(`• ${c.name} — ${name} (w ${w}): ${pct}%`);
      });
    });
    return `📈 PERFORMANCE SUMMARY - ${monthLabel(submission.monthKey)}\n\n★ Overall Score: ${submission.scores?.overall?.toFixed(1) || 'N/A'}/10\n\n🎯 KPI Performance: ${submission.scores?.kpiScore?.toFixed(1) || 'N/A'}/10\n🎓 Learning Activities: ${submission.scores?.learningScore?.toFixed(1) || 'N/A'}/10\n🤝 Client Relations: ${submission.scores?.relationshipScore?.toFixed(1) || 'N/A'}/10\n\n${submission.flags?.missingLearningHours ? '⚠️ Action needed: Complete learning hours requirement\n' : ''}
${submission.flags?.hasEscalations ? '⚠️ Action needed: Address client escalations\n' : ''}
${submission.discipline?.penalty > 0 ? `⚠️ Late submission penalty: -${submission.discipline.penalty} (late by ${submission.discipline.lateDays} day(s))\n` : ''}
${submission.flags?.missingReports ? '⚠️ Action needed: Submit missing client reports\n' : ''}
${svcLines.length ? '\n🔧 Service Progress:\n' + svcLines.slice(0,10).join('\n') : ''}
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
        {currentMonthSubmission?.manager?.testimonialUrl && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
            <div className="text-sm text-purple-800">
              🎥 A testimonial was added to your latest submission.
            </div>
            <a
              className="text-purple-700 underline text-sm"
              href={currentMonthSubmission.manager.testimonialUrl}
              target="_blank"
              rel="noreferrer"
            >
              View Testimonial
            </a>
          </div>
        )}
        {/* Enhanced Profile Completeness Prompt */}
        {!profileCompleteness.isComplete && (
          <div className={`rounded-xl p-4 flex items-start gap-4 ${
            profileCompleteness.needsCriticalInfo 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className={`text-2xl ${
              profileCompleteness.needsCriticalInfo ? 'text-red-500' : 'text-blue-500'
            }`}>
              {profileCompleteness.needsCriticalInfo ? '🚨' : '📝'}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-sm font-semibold ${
                  profileCompleteness.needsCriticalInfo ? 'text-red-800' : 'text-blue-800'
                }`}>
                  {profileCompleteness.isFirstTime 
                    ? '🎉 Welcome! Complete Your Profile to Get Started' 
                    : `Profile ${profileCompleteness.completionPercentage}% Complete`
                  }
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        profileCompleteness.completionPercentage >= 80 ? 'bg-green-500' :
                        profileCompleteness.completionPercentage >= 50 ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`}
                      style={{ width: `${profileCompleteness.completionPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {profileCompleteness.completionPercentage}%
                  </span>
                </div>
              </div>
              
              {profileCompleteness.criticalMissing.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-red-700 mb-2">
                    🔴 <strong>Critical Info Needed:</strong>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {profileCompleteness.criticalMissing.slice(0, 4).map(field => (
                      <span key={field.key} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                        {field.label}
                      </span>
                    ))}
                    {profileCompleteness.criticalMissing.length > 4 && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                        +{profileCompleteness.criticalMissing.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <p className={`text-xs mb-3 ${
                profileCompleteness.needsCriticalInfo ? 'text-red-700' : 'text-blue-700'
              }`}>
                {profileCompleteness.isFirstTime 
                  ? 'Complete your profile to unlock performance tracking, personalized insights, and better reporting features.'
                  : profileCompleteness.needsCriticalInfo
                  ? 'Some critical information is missing. This may affect your performance tracking and reporting accuracy.'
                  : 'A few optional details are missing. Complete them for a richer dashboard experience.'
                }
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${
                    profileCompleteness.needsCriticalInfo
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {profileCompleteness.isFirstTime ? 'Get Started' : 'Complete Profile'}
                </button>
                {!profileCompleteness.needsCriticalInfo && (
                  <button
                    onClick={() => {/* dismiss for session */}}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Maybe Later
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              {employee.photoUrl ? (
                <img
                  src={employee.photoUrl}
                  alt={employee.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg sm:text-2xl font-bold flex-shrink-0">
                  {employee.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{employee.name}</h1>
                <p className="text-sm sm:text-base text-gray-600">{employee.department} Department</p>
                <p className="text-xs sm:text-sm text-gray-500">Phone: {employee.phone}</p>
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

        {/* Performance Overview Cards */}
        {overallStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DataCard
              title="Overall Score"
              value={overallStats.avgOverallScore}
              unit="/10"
              icon="⭐"
              className="bg-gradient-to-r from-purple-50 to-purple-100"
            />
            <DataCard
              title="KPI Performance"
              value={overallStats.avgKpiScore}
              unit="/10"
              icon="🎯"
              className="bg-gradient-to-r from-blue-50 to-blue-100"
            />
            <DataCard
              title="Learning Hours"
              value={overallStats.totalLearningHours}
              unit=" hrs"
              icon="📚"
              className="bg-gradient-to-r from-green-50 to-green-100"
            />
            <DataCard
              title="Total Reports"
              value={overallStats.totalSubmissions}
              unit=""
              icon="📊"
              className="bg-gradient-to-r from-yellow-50 to-yellow-100"
            />
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

        {/* Current Month Performance Details */}
        {currentMonthSubmission && (
          <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4">
              {monthLabel(currentMonthSubmission.monthKey)} Performance Breakdown
            </h3>
            <div className="space-y-3">
              <MetricRow
                label="Overall Score"
                currentValue={currentMonthSubmission.scores?.overall}
                previousValue={employeeSubmissions[1]?.scores?.overall}
                unit="/10"
                target="7.0"
              />
              <MetricRow
                label="KPI Performance"
                currentValue={currentMonthSubmission.scores?.kpiScore}
                previousValue={employeeSubmissions[1]?.scores?.kpiScore}
                unit="/10"
                target="8.0"
              />
              <MetricRow
                label="Learning Activities"
                currentValue={currentMonthSubmission.scores?.learningScore}
                previousValue={employeeSubmissions[1]?.scores?.learningScore}
                unit="/10"
                target="7.0"
              />
              <MetricRow
                label="Client Relations"
                currentValue={currentMonthSubmission.scores?.relationshipScore}
                previousValue={employeeSubmissions[1]?.scores?.relationshipScore}
                unit="/10"
                target="8.0"
              />
            </div>
          </div>
        )}

        <ClientReportsView employee={employee} employeeSubmissions={employeeSubmissions} />

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
                        onClick={() => generateAndDownloadPDF(submission, employee.name)}
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
      {showProfileModal && (
        <ProfileEditModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          employee={employee}
          onSave={handleSaveProfile}
          isFirstTime={profileCompleteness.isFirstTime}
        />
      )}
    </>
  );
}
