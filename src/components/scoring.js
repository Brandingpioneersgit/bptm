import { round1 } from './constants';

function getScopeCompletionScore(clients, employee) {
  if (!clients || clients.length === 0) return 0;
  
  let totalCompletion = 0;
  let clientsWithServices = 0;
  
  clients.forEach(client => {
    if (client.services && client.services.length > 0) {
      let clientCompletion = 0;
      let serviceCount = 0;
      
      client.services.forEach(service => {
        const completion = calculateScopeCompletion(client, service);
        if (completion !== null) {
          clientCompletion += completion;
          serviceCount++;
        }
      });
      
      if (serviceCount > 0) {
        totalCompletion += (clientCompletion / serviceCount);
        clientsWithServices++;
      }
    }
  });
  
  if (clientsWithServices === 0) return 0;
  
  const avgCompletion = totalCompletion / clientsWithServices;
  return round1(Math.min(10, (avgCompletion / 100) * 10));
}

export function scoreKPIs(employee, clients) {
  const dept = employee.department;
  if (dept === "Web") {
    let pages = 0, onTime = 0, bugs = 0; (clients || []).forEach(c => { pages += (c.web_pagesThis || 0); onTime += (c.web_onTimeThis || 0); bugs += (c.web_bugsThis || 0); });
    const n = clients?.length || 1;
    const pagesScore = Math.min(10, (pages / 10) * 10);
    const onTimeScore = Math.min(10, (onTime / n) / 10);
    const bugsScore = Math.min(10, (bugs / 20) * 10);
    const scopeScore = getScopeCompletionScore(clients, employee);
    return round1(pagesScore * 0.4 + onTimeScore * 0.25 + bugsScore * 0.15 + scopeScore * 0.2);
  }
  if (dept === "Social Media") {
    let folDelta = 0, reach = 0, er = 0, campaigns = 0, creatives = 0, quality = 0, hasDesignerRole = false;
    (employee.role || []).forEach(r => {
      if (r.includes("Designer")) hasDesignerRole = true;
    });

    (clients || []).forEach(c => {
      folDelta += (c.sm_followersThis || 0) - (c.sm_followersPrev || 0);
      reach += (c.sm_reachThis || 0);
      er += (c.sm_erThis || 0);
      campaigns += (c.sm_campaignsThis || 0);
      if (hasDesignerRole) {
        creatives += (c.sm_graphicsPhotoshop + c.sm_graphicsCanva + c.sm_graphicsAi || 0);
        quality += (c.sm_qualityScore || 0);
      }
    });
    const n = clients?.length || 1;
    const growthScore = Math.min(10, ((folDelta / n) / 200) * 10);
    const reachScore = Math.min(10, ((reach / n) / 50000) * 10);
    const erScore = Math.min(10, ((er / n) / 5) * 10);
    const campScore = Math.min(10, ((campaigns / n) / 4) * 10);
    const creativeScore = Math.min(10, (creatives / n / 10) * 10);
    const qualityScore = quality > 0 ? (quality / n) : 0;

    const scopeScore = getScopeCompletionScore(clients, employee);
    
    if (hasDesignerRole) {
      return round1(creativeScore * 0.4 + qualityScore * 0.4 + scopeScore * 0.2);
    }

    return round1(growthScore * 0.3 + reachScore * 0.2 + erScore * 0.2 + campScore * 0.1 + scopeScore * 0.2);
  }
  if (dept === "Ads") {
    let ctr = 0, cpl = 0, leads = 0, newAds = 0; (clients || []).forEach(c => { ctr += (c.ads_ctrThis || 0); cpl += (c.ads_cplThis || 0); leads += (c.ads_leadsThis || 0); newAds += (c.ads_newAds || 0); });
    const n = clients?.length || 1;
    const ctrScore = Math.min(10, ((ctr / n) / 3) * 10);
    const cplScore = Math.min(10, (3 / Math.max(0.1, (cpl / n))) * 10); // lower is better
    const leadsScore = Math.min(10, ((leads / n) / 150) * 10);
    const buildScore = Math.min(10, ((newAds / n) / 15) * 10);
    const scopeScore = getScopeCompletionScore(clients, employee);
    return round1(ctrScore * 0.25 + cplScore * 0.25 + leadsScore * 0.25 + buildScore * 0.05 + scopeScore * 0.2);
  }
  if (dept === "SEO") {
    let trafThis = 0, trafPrev = 0, kwImproved = 0, aiCount = 0, volSum = 0, kwCount = 0, llmThis = 0, llmPrev = 0, leadsThis = 0, leadsPrev = 0, top3 = 0;
    (clients || []).forEach(c => {
      trafThis += (c.seo_trafficThis || 0); trafPrev += (c.seo_trafficPrev || 0);
      kwImproved += (c.seo_kwImprovedThis || 0); aiCount += (c.seo_aiOverviewThis || 0);
      llmThis += (c.seo_llmTrafficThis || 0); llmPrev += (c.seo_llmTrafficPrev || 0);
      leadsThis += (c.seo_leadsThis || 0); leadsPrev += (c.seo_leadsPrev || 0);
      top3 += (c.seo_top3?.length || 0);
      (c.seo_keywordsWorked || []).forEach(k => { volSum += (k.searchVolume || 0); kwCount++; });
    });
    const n = clients?.length || 1;
    const deltaPct = ((trafThis - trafPrev) / Math.max(1, trafPrev)) * 100;
    const trafScore = Math.min(10, (Math.max(0, deltaPct) / 20) * 10);
    const kwScore = Math.min(10, ((kwImproved / n) / 10) * 10);
    const aiScore = Math.min(10, ((aiCount / n) / 5) * 10);
    const volScore = Math.min(10, ((volSum / Math.max(1, kwCount)) / 500) * 10);
    const llmDelta = ((llmThis - llmPrev) / Math.max(1, llmPrev)) * 100; const llmScore = Math.min(10, (Math.max(0, llmDelta) / 20) * 10);
    const leadsDelta = ((leadsThis - leadsPrev) / Math.max(1, leadsPrev)) * 100; const leadsScore = Math.min(10, (Math.max(0, leadsDelta) / 20) * 10);
    const top3Score = Math.min(10, ((top3 / n) / 10) * 10);
    const scopeScore = getScopeCompletionScore(clients, employee);
    return round1(trafScore * 0.2 + kwScore * 0.15 + aiScore * 0.08 + volScore * 0.08 + llmScore * 0.12 + leadsScore * 0.12 + top3Score * 0.05 + scopeScore * 0.2);
  }
  if (dept === "HR") {
    const c = clients?.[0] || {}; const hiresThis = c.hr_hiresThis || 0, screened = c.hr_screened || 0, activities = c.hr_engagements || 0;
    const hiresScore = Math.min(10, hiresThis * 3);
    const screenedScore = Math.min(10, screened / 50 * 10);
    const activityScore = Math.min(10, activities * 2.5);
    return round1(hiresScore * 0.4 + screenedScore * 0.4 + activityScore * 0.2);
  }
  if (dept === "Accounts") {
    const c = clients?.[0] || {}; const colThis = c.ac_collectionsPctThis || 0, colPrev = c.ac_collectionsPctPrev || 0, gstDone = c.ac_gstDone || false, tdsDone = c.ac_tdsDone || false;
    const colScore = Math.min(10, ((Math.max(0, colThis - colPrev) / 20) * 5));
    const complianceScore = (gstDone ? 2.5 : 0) + (tdsDone ? 2.5 : 0);
    return round1(colScore * 0.5 + complianceScore * 0.5);
  }
  if (dept === "Sales") {
    const c = clients?.[0] || {}; const revThis = c.sa_revenueThis || 0, revPrev = c.sa_revenuePrev || 0, convThis = c.sa_conversionRateThis || 0, convPrev = c.sa_conversionRatePrev || 0, pipeThis = c.sa_pipelineThis || 0, pipePrev = c.sa_pipelinePrev || 0, upsThis = c.sa_aiUpsellValueThis || 0, upsPrev = c.sa_aiUpsellValuePrev || 0;
    const revDelta = Math.max(0, revThis - revPrev), convDelta = Math.max(0, convThis - convPrev), pipeDelta = Math.max(0, pipeThis - pipePrev), upsDelta = Math.max(0, upsThis - upsPrev);
    const s1 = Math.min(10, (revDelta / 500000) * 10), s2 = Math.min(10, (convDelta / 5) * 10), s3 = Math.min(10, (pipeDelta / 25) * 10), s4 = Math.min(10, (upsDelta / 100000) * 10);
    return round1(s1 * 0.45 + s2 * 0.2 + s3 * 0.2 + s4 * 0.15);
  }
  if (dept === "Blended (HR + Sales)") {
    const hr = clients?.[0] || {}, sales = clients?.[1] || {};
    const hrScore = Math.min(10, Math.max(0, (hr.hr_hiresThis || 0) - (hr.hr_hiresPrev || 0)) / 3 * 10) * 0.6 + Math.min(10, Math.max(0, (hr.hr_processDonePctThis || 0) - (hr.hr_processDonePctPrev || 0)) / 10 * 10) * 0.4;
    const salesScore = Math.min(10, Math.max(0, (sales.sa_revenueThis || 0) - (sales.sa_revenuePrev || 0)) / 300000 * 10) * 0.7 + Math.min(10, Math.max(0, (sales.sa_conversionRateThis || 0) - (sales.sa_conversionRatePrev || 0)) / 5 * 10) * 0.3;
    return round1(hrScore * 0.8 + salesScore * 0.2);
  }
  if (dept === "Operations Head") {
    const client_scores = (clients || []).map(c => {
      let score = 0;
      if (c.op_paymentDate && c.op_paymentDate.length > 0) score += 2;
      if (c.op_teamFinishedScope) score += 3;
      score += (c.op_satisfactionScore || 0) * 0.5;
      if (c.op_clientStatus === 'upgraded') score += 2;
      if (c.op_clientStatus === 'left' || c.op_clientStatus === 'reduced') score -= 2;
      score += (c.op_appreciations?.length || 0) * 0.5;
      score -= (c.op_escalations?.length || 0) * 0.5;
      return Math.min(10, Math.max(0, score));
    });
    const n = client_scores.length || 1;
    const totalScore = client_scores.reduce((sum, s) => sum + s, 0);
    return round1(totalScore / n);
  }
  if (dept === "Web Head") {
    let upselling = 0;
    let pages = 0;
    let onTime = 0;

    (clients || []).forEach(c => {
      upselling += c.web_saasUpsells || 0;
      pages += c.web_pagesThis || 0;
      onTime += c.web_onTimeThis || 0;
    });

    const n = clients?.length || 1;
    const upsellingScore = Math.min(10, (upselling / (n * 2)) * 10);
    const pagesScore = Math.min(10, (pages / (n * 5)) * 10);
    const onTimeScore = Math.min(10, (onTime / n) * 10);

    return round1(upsellingScore * 0.4 + pagesScore * 0.4 + onTimeScore * 0.2);
  }
  return 0;
}

export function scoreLearning(entries) { 
  const total = (entries || []).reduce((s, e) => s + (e.durationMins || 0), 0); 
  return round1(Math.min(10, (total / 360) * 10)); 
}

export function scoreRelationshipFromClients(clients, dept) {
  let meetings = 0, appr = 0, esc = 0, satSum = 0, satCnt = 0, totalInteractions = 0;
  (clients || []).forEach(c => {
    if (c.relationship) {
      meetings += c.relationship.meetings?.length || 0;
      appr += c.relationship.appreciations?.length || 0;
      esc += c.relationship.escalations?.length || 0;
      const s = c.relationship.clientSatisfaction || 0;
      if (s > 0) { satSum += s; satCnt++; }
      totalInteractions += c.clientInteractions || 0;
    }
    if (c.op_appreciations) {
      appr += c.op_appreciations.length || 0;
    }
    if (c.op_escalations) {
      esc += c.op_escalations.length || 0;
    }
  });

  const ms = Math.min(4, meetings * 0.8), as = Math.min(3, appr * 0.75), ep = Math.min(5, esc * 1.5); // caps
  const sat = Math.min(3, (satCnt ? (satSum / satCnt) : 0) * 0.3);
  const interactionScore = Math.min(10, totalInteractions / 50 * 5); // Example scoring
  return round1(Math.max(0, ms + as + sat - ep)); // out of 10
}

export function overallOutOf10(kpi, learning, rel, manager) { 
  return round1((kpi * 0.4 + learning * 0.3 + rel * 0.2 + manager * 0.1)); 
}

export function generateSummary(model) {
  const names = (model.clients || []).map(c => c.name).filter(Boolean);
  const meet = (model.clients || []).reduce((s, c) => s + (c.relationship?.meetings?.length || 0), 0);
  const esc = (model.clients || []).reduce((s, c) => s + (c.relationship?.escalations?.length || 0), 0);
  const appr = (model.clients || []).reduce((s, c) => s + (c.relationship?.appreciations?.length || 0), 0);
  const learnMin = (model.learning || []).reduce((s, e) => s + (e.durationMins || 0), 0);
  const parts = [];
  parts.push(`Handled ${names.length} client(s): ${names.join(', ') || '—'}.`);
  parts.push(`Meetings ${meet}, Appreciations ${appr}, Escalations ${esc}.`);
  parts.push(`Learning: ${(learnMin / 60).toFixed(1)}h (${learnMin >= 360 ? 'Meets 6h' : 'Below 6h'}).`);
  if (model.flags?.missingReports) parts.push('⚠️ Missing report links for some clients.');
  if (model.flags?.hasEscalations) parts.push('⚠️ Escalations present — investigate.');
  parts.push(`Scores — KPI ${model.scores?.kpiScore}/10, Learning ${model.scores?.learningScore}/10, Client Status ${model.scores?.relationshipScore}/10, Overall ${model.scores?.overall}/10.`);
  if (model.manager?.score) parts.push(`Manager Score: ${model.manager.score}/10`);
  return parts.join(' ');
}

function calculateScopeCompletion(client, service) {
  if (!client.service_scopes || !client.service_scopes[service]) return null;
  
  const scope = client.service_scopes[service];
  const deliverables = scope.deliverables || 0;
  
  switch (service) {
    case 'Social Media':
      const totalPosts = (client.sm_graphicsPhotoshop || 0) + (client.sm_graphicsCanva || 0) + 
                        (client.sm_graphicsAi || 0) + (client.sm_shortVideos || 0) + (client.sm_longVideos || 0);
      return deliverables > 0 ? Math.min(100, Math.round((totalPosts / deliverables) * 100)) : 0;
    case 'SEO':
    case 'GBP SEO':
      const keywordsWorked = client.seo_keywordsWorked ? client.seo_keywordsWorked.length : 0;
      const top3Keywords = client.seo_top3 ? client.seo_top3.length : 0;
      const totalSeoWork = keywordsWorked + top3Keywords + (client.seo_technicalIssues || 0);
      return deliverables > 0 ? Math.min(100, Math.round((totalSeoWork / deliverables) * 100)) : 0;
    case 'Google Ads':
    case 'Meta Ads':
      const adsCreated = client.ads_newAds || 0;
      return deliverables > 0 ? Math.min(100, Math.round((adsCreated / deliverables) * 100)) : 0;
    case 'Website Maintenance':
      const webPages = (client.web_pagesThis || 0);
      const webTasks = webPages + (client.web_saasUpsells || 0);
      return deliverables > 0 ? Math.min(100, Math.round((webTasks / deliverables) * 100)) : 0;
    case 'AI':
      return 0;
    default:
      return 0;
  }
}