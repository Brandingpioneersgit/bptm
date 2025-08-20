import { daysInMonth, monthLabel, isDriveUrl, isGensparkUrl } from "./constants";

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
  if (wfo < 0 || wfo > 31) errors.push("WFO days must be between 0 and 31.");
  if (wfh < 0 || wfh > 31) errors.push("WFH days must be between 0 and 31.");

  const maxDays = daysInMonth(monthKey);
  if (wfo + wfh > maxDays) {
    errors.push(`Attendance total (WFO+WFH) cannot exceed ${maxDays} for ${monthLabel(monthKey)}.`);
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

  });

  return { ok: errors.length === 0, errors };
}