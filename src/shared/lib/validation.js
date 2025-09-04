import { daysInMonth, workingDaysInMonth, getWorkingDaysInfo, monthLabel, isDriveUrl, isGensparkUrl } from "@/shared/lib/constants";
import { calculateScopeCompletion } from "@/shared/lib/scoring";
import { ValidationResult, unifiedValidator } from "@/shared/utils/unifiedValidation.js";

// Re-export ValidationResult for backward compatibility
export { ValidationResult };

// Enhanced field-level validation with descriptive messages
export function validateField(fieldName, value, context = {}) {
  const { model = {}, step = null } = context;
  const emp = model.employee || {};
  const meta = model.meta || {};
  
  try {
    switch (fieldName) {
      case 'employee.name':
        if (!value || !value.trim()) {
          return ValidationResult.error('Full name is required for identification and reporting', 'critical');
        }
        if (value.trim().length < 2) {
          return ValidationResult.error('Name must be at least 2 characters long', 'error');
        }
        if (value.trim().length > 100) {
          return ValidationResult.error('Employee name is too long (max 100 characters)', 'error');
        }
        if (!/^[a-zA-Z\s\-\.]+$/.test(value.trim())) {
          return ValidationResult.warning('Name contains unusual characters. Please verify it\'s correct.');
        }
        return ValidationResult.success();
        
      case 'employee.phone':
        if (!value || !value.trim()) {
          return ValidationResult.error('Phone number is required for contact purposes', 'critical');
        }
        const cleanPhone = value.replace(/\D/g, '');
        if (cleanPhone.length === 0) {
          return ValidationResult.error('Please enter a valid phone number', 'error');
        }
        if (cleanPhone.length < 10) {
          return ValidationResult.error(`Phone number incomplete (${cleanPhone.length}/10 digits)`, 'error');
        }
        if (cleanPhone.length > 10) {
          return ValidationResult.error('Phone number too long (max 10 digits)', 'error');
        }
        if (!/^[6-9]/.test(cleanPhone)) {
          return ValidationResult.warning('Phone number should start with 6, 7, 8, or 9 for Indian mobile numbers.');
        }
        return ValidationResult.success();
        
      case 'employee.department':
        if (!value) {
          return ValidationResult.error('Department selection is required for proper reporting structure', 'critical');
        }
        return ValidationResult.success();
        
      case 'employee.role':
        if (!value || (Array.isArray(value) && value.length === 0)) {
          return ValidationResult.error('At least one role must be selected for performance evaluation', 'critical');
        }
        return ValidationResult.success();
        
      case 'monthKey':
        if (!value) {
          return ValidationResult.error('Report month is required to track performance timeline', 'critical');
        }
        if (!/^\d{4}-\d{2}$/.test(value)) {
          return ValidationResult.error('Month format should be YYYY-MM (e.g., 2024-01)', 'error');
        }
        const [year, month] = value.split('-').map(Number);
        if (month < 1 || month > 12) {
          return ValidationResult.error('Invalid month. Must be between 01-12', 'error');
        }
        if (year < 2020 || year > new Date().getFullYear() + 1) {
          return ValidationResult.warning('Month year seems unusual. Please verify it\'s correct.');
        }
        return ValidationResult.success();
        
      case 'meta.attendance.wfo':
        const wfo = Number(value || 0);
        const maxWorkingDays = model?.monthKey ? workingDaysInMonth(model.monthKey) : 22;
        const totalDays = model?.monthKey ? daysInMonth(model.monthKey) : 31;
        if (isNaN(wfo)) {
          return ValidationResult.error('Work from Office days must be a valid number', 'error');
        }
        if (wfo < 0) {
          return ValidationResult.error('Work from Office days cannot be negative', 'error');
        }
        if (wfo > maxWorkingDays) {
          return ValidationResult.error(`Work from Office days cannot exceed ${maxWorkingDays} working days for ${monthLabel(model?.monthKey)} (${totalDays} total days)`, 'error');
        }
        if (wfo > 0 && wfo < 1) {
          return ValidationResult.warning('Partial WFO days detected. Please verify this is correct.');
        }
        return ValidationResult.success();
        
      case 'meta.attendance.wfh':
        const wfh = Number(value || 0);
        const maxWorkingDaysWfh = model?.monthKey ? workingDaysInMonth(model.monthKey) : 22;
        const totalDaysWfh = model?.monthKey ? daysInMonth(model.monthKey) : 31;
        if (isNaN(wfh)) {
          return ValidationResult.error('Work from Home days must be a valid number', 'error');
        }
        if (wfh < 0) {
          return ValidationResult.error('Work from Home days cannot be negative', 'error');
        }
        if (wfh > maxWorkingDaysWfh) {
          return ValidationResult.error(`Work from Home days cannot exceed ${maxWorkingDaysWfh} working days for ${monthLabel(model?.monthKey)} (${totalDaysWfh} total days)`, 'error');
        }
        if (wfh > 0 && wfh < 1) {
          return ValidationResult.warning('Partial WFH days detected. Please verify this is correct.');
        }
        return ValidationResult.success();
        
      case 'meta.tasks.count':
        const taskCount = Number(value || 0);
        if (isNaN(taskCount)) {
          return ValidationResult.error('Task count must be a valid number', 'error');
        }
        if (taskCount < 0) {
          return ValidationResult.error('Task count cannot be negative', 'error');
        }
        if (taskCount > 200) {
          return ValidationResult.error('Task count seems unrealistic (max 200)', 'error');
        }
        if (taskCount > 100) {
          return ValidationResult.warning('Task count seems unusually high. Please verify.');
        }
        if (taskCount === 0) {
          return ValidationResult.warning('No tasks reported. Consider adding completed tasks.');
        }
        return ValidationResult.success();
        
      default:
        return ValidationResult.success();
    }
  } catch (error) {
    console.error(`Validation error for field ${fieldName}:`, error);
    return ValidationResult.error('Validation failed due to an internal error', 'error');
  }
}

// Enhanced step-level validation with field-specific feedback
export function validateStep(stepNumber, model) {
  const errors = {};
  const warnings = {};
  const m = model || {};
  const emp = m.employee || {};
  const meta = m.meta || {};
  
  switch (stepNumber) {
    case 1: // Profile & Month
      const nameValidation = validateField('employee.name', emp.name, { model });
      if (!nameValidation.isValid) errors['employee.name'] = nameValidation.error;
      
      const phoneValidation = validateField('employee.phone', emp.phone, { model });
      if (!phoneValidation.isValid) errors['employee.phone'] = phoneValidation.error;
      
      const deptValidation = validateField('employee.department', emp.department, { model });
      if (!deptValidation.isValid) errors['employee.department'] = deptValidation.error;
      
      const roleValidation = validateField('employee.role', emp.role, { model });
      if (!roleValidation.isValid) errors['employee.role'] = roleValidation.error;
      
      const monthValidation = validateField('monthKey', m.monthKey, { model });
      if (!monthValidation.isValid) errors['monthKey'] = monthValidation.error;
      
      break;
      
    case 2: // Attendance & Tasks
      const attendance = meta.attendance || {};
      const wfoValidation = validateField('meta.attendance.wfo', attendance.wfo, { model });
      if (!wfoValidation.isValid) {
        if (wfoValidation.error) errors['attendance.wfo'] = wfoValidation.error;
        if (wfoValidation.warning) warnings['attendance.wfo'] = wfoValidation.warning;
      }
      
      const wfhValidation = validateField('meta.attendance.wfh', attendance.wfh, { model });
      if (!wfhValidation.isValid) {
        if (wfhValidation.error) errors['attendance.wfh'] = wfhValidation.error;
        if (wfhValidation.warning) warnings['attendance.wfh'] = wfhValidation.warning;
      }
      
      // Check total attendance doesn't exceed working days
      const wfo = Number(attendance.wfo || 0);
      const wfh = Number(attendance.wfh || 0);
      const maxWorkingDays = workingDaysInMonth(m.monthKey);
      const totalDays = daysInMonth(m.monthKey);
      if (wfo + wfh > maxWorkingDays) {
        errors['attendance.total'] = `Total attendance (${wfo + wfh} days) cannot exceed ${maxWorkingDays} working days for ${monthLabel(m.monthKey)} (${totalDays} total days)`;
      }
      
      // Task validation
      const tasks = meta.tasks || {};
      const taskCountValidation = validateField('meta.tasks.count', tasks.count, { model });
      if (!taskCountValidation.isValid) {
        if (taskCountValidation.error) errors['tasks.count'] = taskCountValidation.error;
        if (taskCountValidation.warning) warnings['tasks.count'] = taskCountValidation.warning;
      }
      
      // Task evidence validation
      const tCount = Number(tasks.count || 0);
      if (tCount > 0 && !tasks.aiTableLink && !tasks.aiTableScreenshot) {
        warnings['tasks.evidence'] = 'Consider adding task evidence (AI Table link or screenshot) for better tracking';
      }
      
      break;
      
    case 4: // Learning
      const learning = m.learning || [];
      const learningHours = learning.reduce((sum, l) => sum + (l.durationMins || 0), 0) / 60;
      if (learningHours < 6) {
        warnings['learning.hours'] = `Only ${learningHours.toFixed(1)} hours logged. Target: 6+ hours for optimal development`;
      }
      
      // Validate individual learning entries
      learning.forEach((entry, index) => {
        if (!entry.title || !entry.title.trim()) {
          errors[`learning.${index}.title`] = `Learning activity ${index + 1}: Title is required`;
        }
        if (!entry.durationMins || entry.durationMins <= 0) {
          errors[`learning.${index}.duration`] = `Learning activity ${index + 1}: Duration must be greater than 0`;
        }
        if (entry.durationMins > 480) { // 8 hours
          warnings[`learning.${index}.duration`] = `Learning activity ${index + 1}: Duration seems unusually long (${entry.durationMins} minutes)`;
        }
      });
      
      break;
  }
  
  return { errors: Object.values(errors), warnings: Object.values(warnings) };
}

export function validateSubmission(model) {
  const errors = [];
  const m = model || {};
  const emp = m.employee || {};
  const dept = emp.department || "";
  const monthKey = m.monthKey || "";

  const isDateYYYYMMDD = (d) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
  const isUrl = (u) => !!u && u.startsWith('http');
  const isPhoneNumber = (p) => !!p && /^\d{10}$/.test(p);

  if (!emp.name || !emp.name.trim()) errors.push("Enter your Name.");
  if (!dept) errors.push("Select Department.");
  if (!emp.role || emp.role.length === 0) errors.push("Select at least one Role.");
  if (!monthKey) errors.push("Pick Report Month (YYYY-MM).");
  if (!emp.phone || !isPhoneNumber(emp.phone)) errors.push("Enter a valid 10-digit Phone Number.");

  const meta = m.meta || {};
  const att = meta.attendance || { wfo: 0, wfh: 0 };
  const wfo = Number(att.wfo || 0);
  const wfh = Number(att.wfh || 0);
  const maxWorkingDays = workingDaysInMonth(monthKey);
  const totalDays = daysInMonth(monthKey);
  if (wfo < 0 || wfo > maxWorkingDays) errors.push(`WFO days must be between 0 and ${maxWorkingDays} working days (${totalDays} total days).`);
  if (wfh < 0 || wfh > maxWorkingDays) errors.push(`WFH days must be between 0 and ${maxWorkingDays} working days (${totalDays} total days).`);

  if (wfo + wfh > maxWorkingDays) {
    errors.push(`Attendance total (WFO+WFH) cannot exceed ${maxWorkingDays} working days for ${monthLabel(monthKey)} (${totalDays} total days).`);
  }

  const tasks = (meta.tasks || {});
  const tCount = Number(tasks.count || 0);
  const aiTableLink = tasks.aiTableLink || "";
  const aiTableScreenshot = tasks.aiTableScreenshot || "";
  if (tCount > 0 && !aiTableLink && !aiTableScreenshot) {
    errors.push("If tasks were completed, please provide an AI table link or a Drive screenshot.");
  }
  if (aiTableLink && !isUrl(aiTableLink)) errors.push("The AI table link must be a valid URL.");
  if (aiTableScreenshot && !isDriveUrl(aiTableScreenshot)) errors.push("The AI table screenshot must be a valid Google Drive URL.");

  const clients = m.clients || [];
  const isInternal = ["HR", "Accounts", "Sales", "Blended (HR + Sales)"].includes(dept);
  const isWebHead = dept === "Web Head";
  const isOpsHead = dept === "Operations Head";
  if (!isInternal && clients.length === 0 && !isWebHead && !isOpsHead) errors.push("Add at least one Client for this department.");

  clients.forEach((c, idx) => {
    const row = `Client "${c?.name || `#${idx + 1}`}"`;

    if (!c.name || !c.name.trim()) errors.push(`${row}: name is required.`);
    const isGraphicDesigner = emp.role.includes("Graphic Designer");
    const needsReports = !["Web", "Web Head", "Social Media"].includes(dept) || (dept === "Social Media" && !isGraphicDesigner);

    if (needsReports) {
      if (!c.reports || c.reports.length === 0) errors.push(`${c.name || 'Client'}: add at least one report/proof link (Drive/Genspark).`);
      if ((c.reports || []).some(r => !isDriveUrl(r.url) && !isGensparkUrl(r.url))) errors.push(`${c.name || 'Client'}: report/proof links must be Google Drive/Docs or Genspark URLs.`);
    }

    if (dept === "SEO") {
      if (c?.seo_trafficThis == null) {
        errors.push(`${row}: enter Organic Traffic (this month).`);
      }

      const kws = c?.seo_keywordsWorked || [];
      kws.forEach((k, ki) => {
        if (!k.keyword || !k.keyword.trim()) errors.push(`${row}: Keyword #${ki + 1} missing text.`);
        if (k.searchVolume == null || Number.isNaN(Number(k.searchVolume))) errors.push(`${row}: Keyword #${ki + 1} missing search volume.`);
      });

      if (kws.length > 0) {
        const hasTop3 = kws.some(k => Number(k.rankNow) > 0 && Number(k.rankNow) <= 3);
        if (!hasTop3) {
        }
      }

      if ((c?.seo_aiOverviewPrev != null) ^ (c?.seo_aiOverviewThis != null)) {
        errors.push(`${row}: AI overview traffic should have prev & this values for comparison.`);
      }
    } else if (dept === "Web" || dept === "Web Head") {
      if (Number(c?.web_saasUpsells || 0) > 0 && c?.web_saasProof && !isDriveUrl(c.web_saasProof)) {
        errors.push(`${row}: SaaS upsell proof must be a Google Drive/Docs URL.`);
      }
    } else if (dept === "Social Media" && isGraphicDesigner) {
    } else if (dept === "Operations Head") {
      if (!c.op_clientScope || c.op_clientScope.length === 0) errors.push(`${row}: select at least one client scope.`);
      if (c.op_paymentDate && !isDateYYYYMMDD(c.op_paymentDate)) errors.push(`${row}: enter client payment date.`);
      if (c.op_clientStatus === 'Upgraded' || c.op_clientStatus === 'Left' || c.op_clientStatus === 'Reduced') {
        if (!c.op_clientStatusReason || !c.op_clientStatusReason.trim()) errors.push(`${row}: provide a reason for the client status.`);
      }
    }

    if (!isGraphicDesigner && !isWebHead) {
      const rel = c.relationship || {};
      if (rel.roadmapSentDate && !isDateYYYYMMDD(rel.roadmapSentDate)) errors.push(`${c.name || 'Client'}: Roadmap Sent Date is not a valid date.`);
      if (rel.reportSentDate && !isDateYYYYMMDD(rel.reportSentDate)) errors.push(`${c.name || 'Client'}: Report Sent Date is not a valid date.`);
      if (rel.meetings?.some(m => m.notesLink && !isDriveUrl(m.notesLink))) errors.push(`${c.name || 'Client'}: Meeting notes links must be valid Google Drive URLs.`);
      if (rel.paymentReceived && !isDateYYYYMMDD(rel.paymentDate)) errors.push(`${c.name || 'Client'}: Payment date is required when payment is marked as received.`);
      if (rel.clientSatisfaction && (rel.clientSatisfaction < 1 || rel.clientSatisfaction > 10)) errors.push(`${c.name || 'Client'}: Client satisfaction must be between 1 and 10.`);
      if ((rel.appreciations || []).some(a => a.url && !isDriveUrl(a.url))) errors.push(`${c.name || 'Client'}: Appreciation proof links must be valid Google Drive/Docs URLs.`);
      if ((rel.escalations || []).some(a => a.url && !isDriveUrl(a.url))) errors.push(`${c.name || 'Client'}: Escalation proof links must be valid Google Drive/Docs URLs.`);
    }

    // Soft check: If scope progress exists but no reports attached, add a warning (not error)
    try {
      const services = Array.isArray(c.services) ? c.services : [];
      const hasProgressNoReports = services.some(s => {
        const name = typeof s === 'string' ? s : s.service;
        const comp = calculateScopeCompletion(c, name, { monthKey });
        return comp != null && comp > 0 && (!c.reports || c.reports.length === 0);
      });
      if (hasProgressNoReports) {
        errors.push(`${c.name || 'Client'}: add at least one report/proof link for tracked scope progress.`);
      }
    } catch (_) { /* ignore */ }

  });

  return { ok: errors.length === 0, errors };
}
