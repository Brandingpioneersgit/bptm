import { round1, daysInMonth } from '@/shared/lib/constants';

// Service weight mapping for scope contribution
const SERVICE_WEIGHTS = {
  'Website Maintenance': 1.0,
  'SEO': 1.2,
  'GBP SEO': 1.0,
  'Social Media': 1.1,
  'Google Ads': 1.2,
  'Meta Ads': 1.2,
  'AI': 0.8,
};

export function getServiceWeight(serviceName) {
  return SERVICE_WEIGHTS[serviceName] ?? 1.0;
}

function getScopeCompletionScore(clients, employee) {
  if (!clients || clients.length === 0) return 0;
  let totalCompletion = 0;
  let clientsWithServices = 0;
  clients.forEach(client => {
    if (client.services && client.services.length > 0) {
      let wsum = 0;
      let wcomp = 0;
      client.services.forEach(service => {
        const serviceName = typeof service === 'string' ? service : service.service;
        const completion = calculateScopeCompletion(client, serviceName);
        if (completion !== null) {
          const w = getServiceWeight(serviceName);
          wsum += w;
          wcomp += w * completion;
        }
      });
      if (wsum > 0) {
        totalCompletion += (wcomp / wsum);
        clientsWithServices++;
      }
    }
  });
  if (clientsWithServices === 0) return 0;
  const avgCompletion = totalCompletion / clientsWithServices;
  return round1(Math.min(10, (avgCompletion / 100) * 10));
}

export function scoreKPIs(employee, clients, opts = {}) {
  const monthKey = opts.monthKey || null;
  const dept = employee.department;
  const scopeScore10 = getScopeCompletionScore(clients, employee);
  const blend = (base, weight) => round1((base * (1 - weight)) + (scopeScore10 * weight));
  if (dept === "Web") {
    let pages = 0, onTime = 0, bugs = 0; (clients || []).forEach(c => { pages += (c.web_pagesThis || 0); onTime += (c.web_onTimeThis || 0); bugs += (c.web_bugsThis || 0); });
    const n = clients?.length || 1;
    const pagesScore = Math.min(10, (pages / 20) * 10);
    const onTimeScore = Math.min(10, (onTime / n) * 10);
    const bugScore = Math.max(0, Math.min(10, 10 - (bugs / n)));
    const base = round1((pagesScore * 0.4) + (onTimeScore * 0.4) + (bugScore * 0.2));
    return blend(base, 0.5);
  }
  if (dept === "SEO") {
    let traffic = 0; (clients || []).forEach(c => { traffic += (c.seo_trafficThis || 0); });
    const base = round1(Math.min(10, (traffic / 10000) * 10));
    return blend(base, 0.3);
  }
  if (dept === "Sales") {
    let deals = 0; (clients || []).forEach(c => { deals += (c.sales_deals || 0); });
    const base = round1(Math.min(10, (deals / 10) * 10));
    return blend(base, 0.4);
  }
  if (dept === "Social Media" || dept === "Ads") {
    // If no established base formula, lean more on scope completion
    const base = 5; // neutral baseline
    return blend(base, 0.5);
  }
  return 5;
}

export function scoreLearning(learning) {
  const hours = (learning || []).reduce((a, b) => a + Number(b.hours || 0), 0);
  return round1(Math.min(10, (hours / 20) * 10));
}

export function scoreRelationshipFromClients(clients) {
  const avgSat = (clients || []).reduce((a, c) => a + Number(c.relationship?.clientSatisfaction || 0), 0) / ((clients || []).length || 1);
  return round1(Math.min(10, avgSat));
}

export function overallOutOf10(scores) {
  const { kpiScore = 0, learningScore = 0, relationshipScore = 0 } = scores || {};
  return round1((kpiScore * 0.5) + (learningScore * 0.2) + (relationshipScore * 0.3));
}

export function generateSummary(employee, clients, scores) {
  const lines = [];
  lines.push(`Department: ${employee.department}`);
  lines.push(`KPI Score: ${scores.kpiScore}`);
  if (employee.department === 'Web') {
    let pages = 0; (clients || []).forEach(c => { pages += (c.web_pagesThis || 0); });
    lines.push(`Total Pages: ${pages}`);
  }
  lines.push(`Learning Hours: ${(scores.learningScore / 10) * 20}`);
  lines.push(`Relationship Score: ${scores.relationshipScore}`);
  return lines.join('\n');
}

// Discipline penalty for late submissions
export function computeDisciplinePenalty(monthKey, submittedAtIso, options = {}) {
  try {
    const graceDays = options.graceDays ?? 3; // days after report month end
    const [y, m] = (monthKey || '').split('-').map(Number);
    if (!y || !m) return { dueDate: null, submittedAt: submittedAtIso, lateDays: 0, penalty: 0 };
    const endOfMonth = new Date(y, m, 0); // last day of month
    const dueDate = new Date(endOfMonth.getFullYear(), endOfMonth.getMonth(), endOfMonth.getDate() + graceDays);
    const submittedAt = submittedAtIso ? new Date(submittedAtIso) : new Date();
    const lateMs = submittedAt.getTime() - dueDate.getTime();
    const lateDays = lateMs > 0 ? Math.ceil(lateMs / (1000 * 60 * 60 * 24)) : 0;
    // Penalty: 0.5 per 7 late days, cap 2.0
    const penalty = lateDays > 0 ? Math.min(2, Math.ceil(lateDays / 7) * 0.5) : 0;
    return {
      dueDate: dueDate.toISOString(),
      submittedAt: submittedAt.toISOString(),
      lateDays,
      penalty
    };
  } catch {
    return { dueDate: null, submittedAt: submittedAtIso, lateDays: 0, penalty: 0 };
  }
}

export function calculateScopeCompletion(client, service, opts = {}) {
  const monthKey = opts.monthKey || null;
  if (!client?.service_scopes || !client.service_scopes[service]) return null;
  const scope = client.service_scopes[service];
  const baseDeliverables = Number(scope.deliverables || 0);
  if (baseDeliverables <= 0) return 0;

  // Normalize deliverables to monthly target based on frequency
  const freq = (scope.frequency || 'Monthly').toLowerCase();
  const freqMap = {
    daily: 20, // default fallback; if monthKey present, compute business days
    'bi-weekly': 2,
    biweekly: 2,
    weekly: 4, // ~4 weeks
    monthly: 1,
    quarterly: 1 / 3,
  };
  let factor = freqMap[freq] ?? 1;
  if (freq === 'daily' && monthKey) {
    // Compute business days in that month (Mon–Fri)
    const [y, m] = monthKey.split('-').map(Number);
    const totalDays = daysInMonth(monthKey);
    let business = 0;
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(y, m - 1, d);
      const day = date.getDay();
      if (day !== 0 && day !== 6) business++;
    }
    factor = business; // deliverables are per day
  }
  const monthlyTarget = Math.max(1, Math.round(baseDeliverables * factor));

  // Allow explicit progress override if provided
  const explicitCompleted = client.service_progress?.[service]?.completed;
  if (typeof explicitCompleted === 'number') {
    return Math.min(100, Math.round((explicitCompleted / monthlyTarget) * 100));
  }
  switch (service) {
    case 'Social Media': {
      const totalPosts = (client.sm_graphicsPhotoshop || 0) + (client.sm_graphicsCanva || 0) + (client.sm_graphicsAi || 0) + (client.sm_shortVideos || 0) + (client.sm_longVideos || 0);
      return Math.min(100, Math.round((totalPosts / monthlyTarget) * 100));
    }
    case 'SEO':
    case 'GBP SEO': {
      const keywordsWorked = client.seo_keywordsWorked ? client.seo_keywordsWorked.length : 0;
      const top3Keywords = client.seo_top3 ? client.seo_top3.length : 0;
      const totalSeoWork = keywordsWorked + top3Keywords + (client.seo_technicalIssues || 0);
      return Math.min(100, Math.round((totalSeoWork / monthlyTarget) * 100));
    }
    case 'Google Ads':
    case 'Meta Ads': {
      const adsCreated = client.ads_newAds || 0;
      return Math.min(100, Math.round((adsCreated / monthlyTarget) * 100));
    }
    case 'Website Maintenance': {
      const webPages = (client.web_pagesThis || 0);
      const webTasks = webPages + (client.web_saasUpsells || 0);
      return Math.min(100, Math.round((webTasks / monthlyTarget) * 100));
    }
    case 'AI': {
      const aiOutputs = client.ai_outputs || 0;
      return Math.min(100, Math.round((aiOutputs / monthlyTarget) * 100));
}
    default:
      return 0;
  }
}
