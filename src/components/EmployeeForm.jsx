import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSupabase } from "./SupabaseProvider";
import { useModal } from "./AppShell";
import { useFetchSubmissions } from "./useFetchSubmissions";
import { EMPTY_SUBMISSION, thisMonthKey, prevMonthKey, monthLabel, DEPARTMENTS, ROLES_BY_DEPT } from "./constants";
import { scoreKPIs, scoreLearning, scoreRelationshipFromClients, overallOutOf10, generateSummary } from "./scoring";
import { CelebrationEffect } from "./CelebrationEffect";
import { Section, TextField, NumField, TextArea, MultiSelect } from "./ui";
import { DeptClientsBlock } from "./kpi";
import { LearningBlock } from "./LearningBlock";
import { validateSubmission } from "./validation";

export function EmployeeForm({ currentUser = null, isManagerEdit = false, onBack = null }) {
  const supabase = useSupabase();
  const { openModal, closeModal } = useModal();
  const { allSubmissions } = useFetchSubmissions();

  const [currentSubmission, setCurrentSubmission] = useState({ ...EMPTY_SUBMISSION, isDraft: true });
  const [previousSubmission, setPreviousSubmission] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(currentUser);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const FORM_STEPS = [
    { id: 1, title: "Profile & Month", icon: "👤", description: "Basic information and reporting period" },
    { id: 2, title: "Attendance & Tasks", icon: "📅", description: "Work attendance and task completion" },
    { id: 3, title: "KPI & Performance", icon: "📊", description: "Department-specific metrics and achievements" },
    { id: 4, title: "Client Management", icon: "🤝", description: "Client relationships and project status" },
    { id: 5, title: "Learning & AI", icon: "🎓", description: "Learning activities and AI usage" },
    { id: 6, title: "Feedback & Review", icon: "💬", description: "Company feedback and final review" },
  ];

  const getAutoSaveKey = () => {
    const employeeId = selectedEmployee ? `${selectedEmployee.name}-${selectedEmployee.phone}` : 'anonymous';
    return `autosave-${employeeId}-${currentSubmission.monthKey}`;
  };

  const uniqueEmployees = useMemo(() => {
    const employees = {};
    allSubmissions.forEach(s => {
      const key = `${s.employee.name}-${s.employee.phone}`;
      employees[key] = { name: s.employee.name, phone: s.employee.phone };
    });
    return Object.values(employees).sort((a, b) => a.name.localeCompare(b.name));
  }, [allSubmissions]);

  const isSubmissionFinalized = useMemo(() => {
    if (!selectedEmployee || !currentSubmission.monthKey) return false;
    
    const existingSubmission = allSubmissions.find(s => 
      s.employee?.name === selectedEmployee.name && 
      s.employee?.phone === selectedEmployee.phone && 
      s.monthKey === currentSubmission.monthKey &&
      s.isDraft === false
    );
    
    return !!existingSubmission;
  }, [selectedEmployee, currentSubmission.monthKey, allSubmissions]);

  const isPreviousMonth = useMemo(() => {
    const currentMonth = thisMonthKey();
    return currentSubmission.monthKey !== currentMonth;
  }, [currentSubmission.monthKey]);

  if (currentUser && isSubmissionFinalized && currentSubmission.monthKey === thisMonthKey() && !isManagerEdit) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
            ✓
          </div>
          <h2 className="text-xl font-bold text-green-800 mb-2">Monthly Report Already Submitted!</h2>
          <p className="text-green-700 mb-4">
            You have already submitted your report for {monthLabel(currentSubmission.monthKey)}. 
            Your submission is complete and locked.
          </p>
          <p className="text-green-600 text-sm mb-6">
            Only managers can edit submitted reports. Check your dashboard to view your performance and manager feedback.
          </p>
          <button
            onClick={() => {
              window.location.hash = '#/dashboard';
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            View My Dashboard
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!selectedEmployee) {
      setPreviousSubmission(null);
      setCurrentSubmission(prev => ({
        ...prev,
        employee: { ...prev.employee, name: "", phone: "" }
      }));
      return;
    }

    const prevSub = allSubmissions
      .filter(s => s.employee.phone === selectedEmployee.phone)
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))[0] || null;

    setPreviousSubmission(prevSub);

    setCurrentSubmission(prev => ({
      ...EMPTY_SUBMISSION,
      employee: { ...prev.employee, name: selectedEmployee.name, phone: selectedEmployee.phone, department: prevSub?.employee?.department || "Web", role: prevSub?.employee?.role || [] },
      monthKey: prevMonthKey(thisMonthKey()), // Default to previous month for reporting
    }));
  }, [selectedEmployee, allSubmissions]);


  const autoSave = useCallback(async () => {
    if (!selectedEmployee || !currentSubmission) return;
    
    try {
      const autoSaveData = {
        ...currentSubmission,
        lastSaved: new Date().toISOString(),
        currentStep: currentStep
      };
      
      localStorage.setItem(getAutoSaveKey(), JSON.stringify(autoSaveData));
      setLastAutoSave(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [selectedEmployee, currentSubmission, currentStep, getAutoSaveKey]);

  const loadDraft = useCallback(() => {
    try {
      const savedData = localStorage.getItem(getAutoSaveKey());
      if (savedData) {
        const draft = JSON.parse(savedData);
        setCurrentSubmission(draft);
        setCurrentStep(draft.currentStep || 1);
        setLastAutoSave(new Date(draft.lastSaved));
        return true;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return false;
  }, [getAutoSaveKey]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(getAutoSaveKey());
      setLastAutoSave(null);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [getAutoSaveKey]);

  const updateCurrentSubmission = useCallback((key, value) => {
    setCurrentSubmission(prev => {
      const updated = { ...prev };
      let current = updated;
      const keyParts = key.split('.');
      for (let i = 0; i < keyParts.length - 1; i++) {
        const part = keyParts[i];
        if (!current[part]) current[part] = {};
        current = current[part];
      }
      current[keyParts[keyParts.length - 1]] = value;
      return updated;
    });
    
    setHasUnsavedChanges(true);
  }, []);

  // Validation for step progression
  const canProgressToStep = useCallback((stepNumber) => {
    if (stepNumber <= 1) return true;
    
    const { ok, errors } = validateSubmission(currentSubmission);
    
    // Step 1 requirements (Profile & Month)
    if (stepNumber > 1) {
      if (!currentSubmission.employee?.name?.trim() || 
          !currentSubmission.employee?.phone?.trim() ||
          !currentSubmission.employee?.department ||
          !currentSubmission.employee?.role?.length ||
          !currentSubmission.monthKey) {
        return false;
      }
    }
    
    // Step 2 requirements (Attendance & Tasks) 
    if (stepNumber > 2) {
      const wfo = Number(currentSubmission.meta?.attendance?.wfo || 0);
      const wfh = Number(currentSubmission.meta?.attendance?.wfh || 0);
      if (wfo + wfh === 0) return false;
    }
    
    return true;
  }, [currentSubmission]);

  useEffect(() => {
    if (hasUnsavedChanges && selectedEmployee) {
      const timer = setTimeout(autoSave, 30000);
      return () => clearTimeout(timer);
    }
  }, [hasUnsavedChanges, selectedEmployee, autoSave]);

  useEffect(() => {
    if (selectedEmployee && getAutoSaveKey()) {
      const hasDraft = loadDraft();
      if (hasDraft) {
        openModal(
          'Draft Found',
          `We found a saved draft for ${selectedEmployee.name} from ${lastAutoSave ? lastAutoSave.toLocaleString() : 'recently'}. Would you like to continue where you left off?`,
          () => {
            closeModal();
          },
          () => {
            clearDraft();
            setCurrentSubmission(prev => ({
              ...EMPTY_SUBMISSION,
              employee: { ...prev.employee, name: selectedEmployee.name, phone: selectedEmployee.phone, department: previousSubmission?.employee?.department || "Web", role: previousSubmission?.employee?.role || [] },
              monthKey: prevMonthKey(thisMonthKey()),
            }));
            setCurrentStep(1);
            closeModal();
          },
          'Keep Draft',
          'Start Fresh'
        );
      }
    }
  }, [selectedEmployee, loadDraft, clearDraft, openModal, closeModal, lastAutoSave, previousSubmission]);

  const kpiScore = useMemo(() => scoreKPIs(currentSubmission.employee, currentSubmission.clients), [currentSubmission.employee, currentSubmission.clients]);
  const learningScore = useMemo(() => scoreLearning(currentSubmission.learning), [currentSubmission.learning]);
  const relationshipScore = useMemo(() => scoreRelationshipFromClients(currentSubmission.clients), [currentSubmission.employee, currentSubmission.clients]);
  const overall = useMemo(() => overallOutOf10(kpiScore, learningScore, relationshipScore, currentSubmission.manager?.score), [kpiScore, learningScore, relationshipScore, currentSubmission.manager?.score]);

  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (overall >= 8) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [overall]);

  const flags = useMemo(() => {
    const learningMins = (currentSubmission.learning || []).reduce((s, e) => s + (e.durationMins || 0), 0);
    const missingLearningHours = learningMins < 360;
    const hasEscalations = (currentSubmission.clients || []).some(c => (c.relationship?.escalations || []).length > 0);
    const missingReports = (currentSubmission.clients || []).some(c => (c.reports || []).length === 0);
    return { missingLearningHours, hasEscalations, missingReports };
  }, [currentSubmission]);

  useEffect(() => {
    setCurrentSubmission(m => {
      const nextScores = { kpiScore, learningScore, relationshipScore, overall };
      const sameScores = JSON.stringify(nextScores) === JSON.stringify(m.scores || {});
      const sameFlags = JSON.stringify(flags) === JSON.stringify(m.flags || {});
      if (sameScores && sameFlags) return m;
      return { ...m, flags, scores: nextScores };
    });
  }, [kpiScore, learningScore, relationshipScore, overall, flags]);

  const generatePerformanceFeedback = (submission) => {
    const scores = submission.scores || {};
    const feedback = {
      overall: scores.overall || 0,
      strengths: [],
      improvements: [],
      nextMonthGoals: [],
      summary: ''
    };

    if (scores.kpiScore >= 8) {
      feedback.strengths.push('Excellent KPI performance - exceeding departmental targets');
    } else if (scores.kpiScore >= 6) {
      feedback.strengths.push('Good KPI performance - meeting most targets');
      feedback.improvements.push('Focus on key metrics that are slightly below target');
    } else {
      feedback.improvements.push('KPI performance needs improvement - review departmental goals and strategies');
      feedback.nextMonthGoals.push('Develop action plan to improve key performance indicators');
    }

    const learningHours = (submission.learning || []).reduce((s, e) => s + (e.durationMins || 0), 0) / 60;
    if (scores.learningScore >= 8) {
      feedback.strengths.push(`Outstanding commitment to learning with ${learningHours.toFixed(1)} hours completed`);
    } else if (scores.learningScore >= 6) {
      feedback.strengths.push('Good learning progress this month');
    } else {
      feedback.improvements.push('Increase learning activities to meet minimum 6-hour requirement');
      feedback.nextMonthGoals.push('Schedule dedicated learning time throughout the month');
    }

    if (scores.relationshipScore >= 8) {
      feedback.strengths.push('Excellent client relationship management and communication');
    } else if (scores.relationshipScore >= 6) {
      feedback.improvements.push('Continue strengthening client relationships and communication');
    } else {
      feedback.improvements.push('Client relationship management needs significant improvement');
      feedback.nextMonthGoals.push('Develop better client communication strategies and follow-up systems');
    }

    if (submission.flags?.missingLearningHours) {
      feedback.improvements.push('Complete the required 6 hours of learning activities');
      feedback.nextMonthGoals.push('Plan learning schedule at the beginning of each month');
    }

    if (submission.flags?.hasEscalations) {
      feedback.improvements.push('Address client escalations and improve proactive communication');
      feedback.nextMonthGoals.push('Implement client satisfaction monitoring and regular check-ins');
    }

    if (submission.flags?.missingReports) {
      feedback.improvements.push('Ensure all client reports are completed and delivered on time');
      feedback.nextMonthGoals.push('Set up report delivery tracking and deadline reminders');
    }

    if (feedback.overall >= 8) {
      feedback.summary = 'Exceptional performance this month! You\'re exceeding expectations and making significant contributions to the team.';
    } else if (feedback.overall >= 6) {
      feedback.summary = 'Good solid performance with room for growth. Focus on the improvement areas to reach the next level.';
    } else {
      feedback.summary = 'Performance needs improvement. Please work closely with your manager to address the identified areas.';
    }

    return feedback;
  };

  const showPerformanceFeedbackModal = (feedback, submission) => {
    const modalContent = `
📊 PERFORMANCE REPORT - ${submission.monthKey.replace('-', ' ').toUpperCase()}

🎯 Overall Score: ${feedback.overall.toFixed(1)}/10

${feedback.summary}

✅ STRENGTHS:
${feedback.strengths.map(s => `• ${s}`).join('\n') || '• None identified this month'}

🔧 AREAS FOR IMPROVEMENT:
${feedback.improvements.map(i => `• ${i}`).join('\n') || '• Keep up the excellent work!'}

🎯 NEXT MONTH'S GOALS:
${feedback.nextMonthGoals.map(g => `• ${g}`).join('\n') || '• Continue current performance level'}

💡 Remember: Consistent improvement leads to long-term success!
    `;

    openModal(
      'Performance Feedback Report',
      modalContent,
      closeModal,
      null,
      '',
      ''
    );
  };

  async function submitFinal() {
    if (!supabase) {
      openModal("Error", "Database connection not ready. Please wait a moment and try again.");
      return;
    }

    if (isSubmissionFinalized) {
      openModal("Submission Already Completed", "This month's submission has already been finalized and cannot be edited.", closeModal);
      return;
    }

    if (isPreviousMonth) {
      openModal("Previous Month Editing Restricted", "You can only edit the current month's submission. Previous months cannot be modified.", closeModal);
      return;
    }

    const check = validateSubmission(currentSubmission);
    if (!check.ok) {
      openModal(
        "Validation Errors",
        `Please fix the following before submitting:\n\n${check.errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`,
        closeModal
      );
      return;
    }
    const final = { ...currentSubmission, isDraft: false, submittedAt: new Date().toISOString(), employee: { ...currentSubmission.employee, name: (currentSubmission.employee?.name || "").trim(), phone: currentSubmission.employee.phone } };

    delete final.id;

    const { data, error } = await supabase
      .from('submissions')
      .upsert(final, { onConflict: 'employee_phone, monthKey' });

    if (error) {
      console.error("Supabase submission error:", error);
      openModal("Submission Error", `There was a problem saving your report to the database: ${error.message}`, closeModal);
    } else {
      const performanceFeedback = generatePerformanceFeedback(final);
      showPerformanceFeedbackModal(performanceFeedback, final);
      
      setCurrentSubmission({ ...EMPTY_SUBMISSION, monthKey: currentSubmission.monthKey });
      setSelectedEmployee(null);
    }
  }

  const mPrev = previousSubmission ? previousSubmission.monthKey : prevMonthKey(currentSubmission.monthKey);
  const mThis = currentSubmission.monthKey;
  const rolesForDept = ROLES_BY_DEPT[currentSubmission.employee.department] || [];
  const isNewEmployee = !selectedEmployee;

  const goToStep = (stepId) => {
    setCurrentStep(stepId);
    if (selectedEmployee) {
      autoSave();
    }
  };

  const nextStep = () => {
    const nextStepNumber = currentStep + 1;
    if (nextStepNumber <= FORM_STEPS.length && canProgressToStep(nextStepNumber)) {
      goToStep(nextStepNumber);
    } else if (nextStepNumber <= FORM_STEPS.length) {
      // Show validation error
      const { errors } = validateSubmission(currentSubmission);
      const errorMessage = errors.slice(0, 3).join('\n'); // Show first 3 errors
      openModal('Complete Required Fields', errorMessage, closeModal);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  const getCurrentStepData = () => FORM_STEPS.find(step => step.id === currentStep);

  const ProgressIndicator = () => (
    <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Monthly Report Progress</h2>
        {lastAutoSave && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Auto-saved {lastAutoSave.toLocaleTimeString()}
          </div>
        )}
      </div>
      
      <div className="relative">
        <div className="flex justify-between">
          {FORM_STEPS.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <button
                onClick={() => {
                  if (canProgressToStep(step.id)) {
                    goToStep(step.id);
                  } else {
                    const { errors } = validateSubmission(currentSubmission);
                    openModal('Complete Previous Steps', errors.slice(0, 3).join('\n'), closeModal);
                  }
                }}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-semibold transition-all duration-200 ${ currentStep === step.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : currentStep > step.id
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-gray-100 text-gray-400 border-gray-300 hover:border-gray-400'
                }`}
              >
                {currentStep > step.id ? '✓' : step.icon}
              </button>
              <div className="mt-2 text-center">
                <div className={`text-xs font-medium ${currentStep === step.id ? 'text-blue-600' : currentStep > step.id ? 'text-green-600' : 'text-gray-500'}`}>
                  {step.title}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 -z-10">
          <div 
            className="h-full bg-green-600 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (FORM_STEPS.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );

  const StepContent = () => {
    const stepData = getCurrentStepData();
    const isFormDisabled = (isSubmissionFinalized || isPreviousMonth) && !isManagerEdit;
    
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${ isFormDisabled ? 'opacity-75' : ''}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${ isFormDisabled ? 'bg-gray-200 text-gray-500' : 'bg-blue-100'}`}>
            {stepData.icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold">{stepData.title}</h3>
            <p className="text-gray-600 text-sm">{stepData.description}</p>
            {isFormDisabled && (
              <p className="text-sm text-red-600 mt-1">
                {isSubmissionFinalized ? '✓ Submission completed - form locked' : '🔒 Previous month - editing restricted'}
              </p>
            )}
            {isManagerEdit && isSubmissionFinalized && (
              <p className="text-sm text-blue-600 mt-1">
                ✏️ Manager editing mode - submission can be modified
              </p>
            )}
          </div>
        </div>

        {renderStepContent()}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderProfileStep();
      case 2:
        return renderAttendanceStep();
      case 3:
        return renderKPIStep();
      case 4:
        return renderClientStep();
      case 5:
        return renderLearningStep();
      case 6:
        return renderFeedbackStep();
      default:
        return null;
    }
  };

  function renderProfileStep() {
    const isFormDisabled = isSubmissionFinalized || isPreviousMonth;
    
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {currentUser ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-medium text-blue-800 mb-3">Logged in as:</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Name:</span>
                    <span className="font-medium">{currentUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="font-medium">{currentUser.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Department:</span>
                    <span className="font-medium">{currentUser.department}</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Select Employee</label>
                  <select
                    className={`w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${ isFormDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                    value={selectedEmployee ? `${selectedEmployee.name}-${selectedEmployee.phone}` : ""}
                    onChange={(e) => {
                      if (isFormDisabled) return;
                      if (e.target.value === "") {
                        setSelectedEmployee(null);
                        setCurrentSubmission({ ...EMPTY_SUBMISSION, monthKey: prevMonthKey(thisMonthKey()) });
                      } else {
                        const [name, phone] = e.target.value.split('-');
                        setSelectedEmployee({ name, phone });
                      }
                    }}
                    disabled={isFormDisabled}
                  >
                    <option value="">-- New Employee --</option>
                    {uniqueEmployees.map((emp) => (
                      <option key={`${emp.name}-${emp.phone}`} value={`${emp.name}-${emp.phone}`}>
                        {emp.name} ({emp.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {isNewEmployee && (
                  <div className="space-y-4">
                    <TextField 
                      label="Name" 
                      placeholder="Your full name" 
                      value={currentSubmission.employee.name || ""} 
                      onChange={v => updateCurrentSubmission('employee.name', v)}
                      disabled={isFormDisabled}
                    />
                    <TextField 
                      label="Phone Number" 
                      placeholder="e.g., 9876543210" 
                      value={currentSubmission.employee.phone || ""} 
                      onChange={v => updateCurrentSubmission('employee.phone', v)}
                      disabled={isFormDisabled}
                    />
                  </div>
                )}
              </>
            )}

            {!currentUser && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Department</label>
                  <select 
                    className={`w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${ isFormDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                    value={currentSubmission.employee.department} 
                    onChange={e => isFormDisabled ? null : updateCurrentSubmission('employee.department', e.target.value)}
                    disabled={isFormDisabled}
                  >
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Role(s)</label>
                  <MultiSelect
                    options={rolesForDept}
                    selected={currentSubmission.employee.role}
                    onChange={(newRoles) => isFormDisabled ? null : updateCurrentSubmission('employee.role', newRoles)}
                    placeholder="Select your roles"
                    disabled={isFormDisabled}
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Report Month</label>
              <input 
                type="month" 
                className={`w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${ isFormDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                value={currentSubmission.monthKey}
                disabled={isFormDisabled} 
                onChange={e => updateCurrentSubmission('monthKey', e.target.value)} 
              />
              <div className="text-xs text-gray-500 mt-2">
                📊 Comparison: {monthLabel(mPrev)} vs {monthLabel(mThis)}
              </div>
            </div>

            {previousSubmission && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Previous Report</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>📅 Month: {monthLabel(previousSubmission.monthKey)}</div>
                  <div>⭐ Score: {previousSubmission.scores?.overall || 'N/A'}/10</div>
                  <div>🏢 Department: {previousSubmission.employee?.department}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderAttendanceStep() {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              📅 Work Attendance
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <NumField 
                label="WFO days" 
                placeholder="0-31" 
                value={currentSubmission.meta.attendance.wfo} 
                onChange={v => updateCurrentSubmission('meta.attendance.wfo', v)} 
              />
              <NumField 
                label="WFH days" 
                placeholder="0-31"
                value={currentSubmission.meta.attendance.wfh} 
                onChange={v => updateCurrentSubmission('meta.attendance.wfh', v)} 
              />
            </div>
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              📍 Total days in {monthLabel(currentSubmission.monthKey)}: {daysInMonth(currentSubmission.monthKey)}
              <br />
              Current total: {(currentSubmission.meta.attendance.wfo || 0) + (currentSubmission.meta.attendance.wfh || 0)} days
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              ✅ Task Management
            </h4>
            <NumField 
              label="Tasks completed" 
              placeholder="Number of tasks" 
              value={currentSubmission.meta.tasks.count} 
              onChange={v => updateCurrentSubmission('meta.tasks.count', v)} 
            />
            <TextField 
              label="AI Table / PM link" 
              placeholder="Google Drive or project management URL" 
              value={currentSubmission.meta.tasks.aiTableLink} 
              onChange={v => updateCurrentSubmission('meta.tasks.aiTableLink', v)} 
            />
            <TextField 
              label="Screenshot proof" 
              placeholder="Google Drive URL for screenshot" 
              value={currentSubmission.meta.tasks.aiTableScreenshot} 
              onChange={v => updateCurrentSubmission('meta.tasks.aiTableScreenshot', v)} 
            />
          </div>
        </div>
      </div>
    );
  }

  function renderKPIStep() {
    return (
      <div className="space-y-6">
        <DeptClientsBlock 
          currentSubmission={currentSubmission} 
          previousSubmission={previousSubmission} 
          setModel={setCurrentSubmission} 
          monthPrev={mPrev} 
          monthThis={mThis} 
          openModal={openModal} 
          closeModal={closeModal} 
        />
      </div>
    );
  }

  function renderClientStep() {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🤝</div>
          <h3 className="text-lg font-semibold mb-2">Client Management</h3>
          <p className="text-gray-600">
            Client information is integrated with your KPI section in Step 3.
            <br />
            Use the Previous/Next buttons to navigate between steps.
          </p>
        </div>
      </div>
    );
  }

  function renderLearningStep() {
    return (
      <div className="space-y-6">
        <LearningBlock model={currentSubmission} setModel={setCurrentSubmission} openModal={openModal} />
        
        <div className="bg-white border rounded-xl p-6">
          <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
            🤖 AI Usage (Optional)
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Describe how you used AI tools to improve your work efficiency this month.
          </p>
          <textarea 
            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            rows={4}
            placeholder="List ways you used AI to work faster/better this month. Include links or examples."
            value={currentSubmission.aiUsageNotes}
            onChange={e => updateCurrentSubmission('aiUsageNotes', e.target.value)}
          />
        </div>
      </div>
    );
  }

  function renderFeedbackStep() {
    return (
      <div className="space-y-6">
        <div className="bg-white border rounded-xl p-6">
          <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
            💬 Employee Feedback
          </h4>
          <p className="text-sm text-gray-600 mb-6">
            Share your honest feedback to help improve the work environment.
          </p>
          <div className="space-y-4">
            <TextArea 
              label="General feedback about the company" 
              placeholder="What's working well? What could be improved?"
              rows={3}
              value={currentSubmission.feedback.company}
              onChange={v => updateCurrentSubmission('feedback.company', v)}
            />
            <TextArea 
              label="Feedback regarding HR and policies" 
              placeholder="Any thoughts on HR processes, communication, or company policies?"
              rows={3}
              value={currentSubmission.feedback.hr}
              onChange={v => updateCurrentSubmission('feedback.hr', v)}
            />
            <TextArea 
              label="Challenges you are facing" 
              placeholder="Are there any obstacles or challenges hindering your work or growth?"
              rows={3}
              value={currentSubmission.feedback.challenges}
              onChange={v => updateCurrentSubmission('feedback.challenges', v)}
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border rounded-xl p-6">
          <h4 className="font-medium text-gray-900 flex items-center gap-2 mb-4">
            📊 Performance Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{kpiScore}/10</div>
              <div className="text-sm text-gray-600">KPI Score</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{learningScore}/10</div>
              <div className="text-sm text-gray-600">Learning</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{relationshipScore}/10</div>
              <div className="text-sm text-gray-600">Client Relations</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{overall}/10</div>
              <div className="text-sm text-gray-600">Overall</div>
            </div>
          </div>
          
          {overall >= 8 && (
            <div className="mt-4 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-green-600 font-semibold">Excellent performance!</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <CelebrationEffect show={showCelebration} overall={overall} />
      
      {isManagerEdit && onBack && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              ✏️
            </div>
            <div>
              <h4 className="font-semibold text-blue-800">Manager Edit Mode</h4>
              <p className="text-sm text-blue-700">
                Editing {selectedEmployee?.name}'s submission for {monthLabel(currentSubmission.monthKey)}
              </p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      )}
      
      {isSubmissionFinalized && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            ✓
          </div>
          <div>
            <h4 className="font-semibold text-green-800">
              {isManagerEdit ? "Editing Submitted Report" : "Submission Complete"}
            </h4>
            <p className="text-sm text-green-700">
              {isManagerEdit 
                ? "This report has been submitted. As a manager, you can edit and re-submit it."
                : "This month's report has been successfully submitted and locked. No further edits are allowed."
              }
            </p>
          </div>
        </div>
      )}
      
      {isPreviousMonth && !isSubmissionFinalized && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            📅
          </div>
          <div>
            <h4 className="font-semibold text-orange-800">Previous Month Selected</h4>
            <p className="text-sm text-orange-700">
              You can only edit the current month's submission. Please select the current month to make changes.
            </p>
          </div>
        </div>
      )}
      
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-yellow-800">You have unsaved changes. They will be auto-saved in a moment.</span>
        </div>
      )}

      <ProgressIndicator />
      <StepContent />

      <div className="flex justify-between items-center mt-4 sm:mt-6 gap-3">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
        >
          <span className="hidden sm:inline">← Previous</span>
          <span className="sm:hidden">← Back</span>
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-gray-500">
            <span className="hidden sm:inline">Step </span>{currentStep} of {FORM_STEPS.length}
          </span>
        </div>

        {currentStep === FORM_STEPS.length ? (
          <button
            onClick={submitFinal}
            disabled={!supabase || isSubmissionFinalized || isPreviousMonth}
            className={`rounded-xl px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-colors touch-manipulation ${ isSubmissionFinalized || isPreviousMonth
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white disabled:opacity-50'
            }`}
            title={isSubmissionFinalized ? 'Submission already completed' : isPreviousMonth ? 'Can only edit current month' : ''}
          >
            <span className="hidden sm:inline">
              {isSubmissionFinalized ? 'Already Submitted' : isPreviousMonth ? 'Previous Month' : 'Submit Report'}
            </span>
            <span className="sm:hidden">
              {isSubmissionFinalized ? 'Submitted' : isPreviousMonth ? 'Locked' : 'Submit'}
            </span>
          </button>
        ) : (
          <button
            onClick={nextStep}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base transition-colors touch-manipulation"
          >
            <span className="hidden sm:inline">Next →</span>
            <span className="sm:hidden">Next</span>
          </button>
        )}
      </div>
    </div>
  );
}
