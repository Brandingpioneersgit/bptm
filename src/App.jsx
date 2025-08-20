import React, { useEffect, useMemo, useState, useCallback, useRef, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
// The Supabase client will be available globally via a script tag.
// We do not import it directly to avoid race conditions on script load.

/**
 * Branding Pioneers – Monthly Tactical System (MVP++ v10 - Supabase Integrated)
 * Single-file React app (Vite + Tailwind)
 *
 * HIGHLIGHTS:
 * - NOW LIVE ON SUPABASE: All data is fetched from and saved to your Supabase database.
 * - Replaced all localStorage logic with Supabase client calls.
 * - Single entry point with in-page manager login form
 * - All KPIs are month-on-month with labels
 * - Deep SEO, Ads, Social, Web KPIs + proofs
 * - HR/Accounts/Sales internal KPIs (prev vs this; Sales includes next-month projection)
 * - Attendance & Tasks (AI table link)
 * - Client Report Status (roadmap/report dates, meetings, satisfaction, payment)
 * - Learning (>= 6h required; multiple entries)
 * - Scoring (KPI / Learning / Client Status) out of 10; Overall average
 * - CSV/JSON export; Manager notes with save (Supabase UPDATE)
 *
 * NEW FEATURES (v10):
 * - Full Supabase Integration: The app is now a real, cloud-based application.
 * - Added an Employee Feedback section for thoughts on the company, HR, and challenges.
 * - Manager dashboard now shows a detailed, user-friendly report instead of raw JSON.
 * - Enhanced UI for better readability and interaction in both employee and manager views.
 * - Implemented a cumulative, multi-month audit report for individual employees.
 * - Strengthened form validation with more specific and helpful error messages.
 */

/*************************
 * Supabase Configuration *
 *************************/
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://igwgryykglsetfvomhdj.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_SDqrksN-DTMdHP01p3z6wQ_OlX5bJ3o";

// **IMPORTANT**: This section sets up a React Context to safely manage the Supabase client.
// It ensures the client is initialized only after the external Supabase script has loaded,
// preventing the "supabase is not defined" error.

const SupabaseContext = React.createContext(null);

const SupabaseProvider = ({ children }) => {
  const [supabaseClient, setSupabaseClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set a timeout to handle cases where the Supabase script fails to load.
    const timeoutId = setTimeout(() => {
      if (!window.supabase) {
        setError("Failed to connect to the database. The Supabase script did not load in time. Please check your network connection or ad-blocker.");
        setLoading(false);
      }
    }, 5000); // 5-second timeout

    // Poll every 100ms for the global 'supabase' object.
    const intervalId = setInterval(() => {
      if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        setSupabaseClient(client);
        setLoading(false);
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600"><div>Loading Database Connection...</div></div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600 p-4"><div>Error: {error}</div></div>;
  }

  return (
    <SupabaseContext.Provider value={supabaseClient}>
      {children}
    </SupabaseContext.Provider>
  );
};

const useSupabase = () => {
  const context = React.useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};


/*************************
 * Constants & Helpers   *
 *************************/
const DEPARTMENTS = [
  "Web",
  "Social Media",
  "Ads",
  "SEO",
  "HR",
  "Accounts",
  "Sales",
  "Blended (HR + Sales)",
  "Operations Head",
  "Web Head"
];
const ROLES_BY_DEPT = {
  Web: ["Web Designer/Developer", "Graphic Designer (Web)"],
  "Social Media": [
    "Client Servicing",
    "Graphic Designer",
    "YouTube Manager",
    "LinkedIn Manager",
    "Meta (Facebook/Instagram) Manager",
  ],
  Ads: ["Google Ads", "Meta Ads"],
  SEO: ["SEO Executive/Manager"],
  HR: ["HR"],
  Accounts: ["Accounts"],
  Sales: ["Sales"],
  "Blended (HR + Sales)": ["HR (80%) + Sales (20%)"],
  "Operations Head": ["Operations Head"],
  "Web Head": ["Web Head"],
};
const uid = () => Math.random().toString(36).slice(2, 9);
const thisMonthKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
const prevMonthKey = (mk) => { if (!mk) return ""; const [y, m] = mk.split("-").map(Number); const d = new Date(y, m - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
const monthLabel = (mk) => { if (!mk) return ""; const [y, m] = mk.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleString(undefined, { month: 'short', year: 'numeric' }); };
const round1 = (n) => Math.round(n * 10) / 10;
const isDriveUrl = (u) => /https?:\/\/(drive|docs)\.google\.com\//i.test(u || "");
const isPhoneNumber = (p) => !!p && /^\d{10}$/.test(p);
const isGensparkUrl = (u) => /https?:\/\/(www\.)?genspark\.ai/i.test(u || "");

// Date formatting helpers
const toDDMMYYYY = (dateStr) => {
  if (!dateStr || !dateStr.includes('-')) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};
const toYYYYMMDD = (dateStr) => {
  if (!dateStr || !dateStr.includes('/')) return '';
  const [d, m, y] = dateStr.split('/');
  return `${y}-${m}-${d}`;
};

function daysInMonth(monthKey) {
  // monthKey: "YYYY-MM"
  const [y, m] = (monthKey || "").split("-").map(Number);
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate();
}

/********************
 * Scoring Functions *
 ********************/
function scoreKPIs(employee, clients) {
  const dept = employee.department;
  if (dept === "Web") {
    let pages = 0, onTime = 0, bugs = 0; (clients || []).forEach(c => { pages += (c.web_pagesThis || 0); onTime += (c.web_onTimeThis || 0); bugs += (c.web_bugsThis || 0); });
    const n = clients?.length || 1;
    const pagesScore = Math.min(10, (pages / 10) * 10);
    const onTimeScore = Math.min(10, (onTime / n) / 10);
    const bugsScore = Math.min(10, (bugs / 20) * 10);
    return round1(pagesScore * 0.5 + onTimeScore * 0.3 + bugsScore * 0.2);
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

    if (hasDesignerRole) {
      return round1(creativeScore * 0.5 + qualityScore * 0.5);
    }

    return round1(growthScore * 0.35 + reachScore * 0.25 + erScore * 0.25 + campScore * 0.15);
  }
  if (dept === "Ads") {
    let ctr = 0, cpl = 0, leads = 0, newAds = 0; (clients || []).forEach(c => { ctr += (c.ads_ctrThis || 0); cpl += (c.ads_cplThis || 0); leads += (c.ads_leadsThis || 0); newAds += (c.ads_newAds || 0); });
    const n = clients?.length || 1;
    const ctrScore = Math.min(10, ((ctr / n) / 3) * 10);
    const cplScore = Math.min(10, (3 / Math.max(0.1, (cpl / n))) * 10); // lower is better
    const leadsScore = Math.min(10, ((leads / n) / 150) * 10);
    const buildScore = Math.min(10, ((newAds / n) / 15) * 10);
    return round1(ctrScore * 0.3 + cplScore * 0.3 + leadsScore * 0.3 + buildScore * 0.1);
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
    return round1(trafScore * 0.25 + kwScore * 0.2 + aiScore * 0.1 + volScore * 0.1 + llmScore * 0.15 + leadsScore * 0.15 + top3Score * 0.05);
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
    // Web Head KPIs based on client performance
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
function scoreLearning(entries) { const total = (entries || []).reduce((s, e) => s + (e.durationMins || 0), 0); return round1(Math.min(10, (total / 360) * 10)); }
function scoreRelationshipFromClients(clients, dept) {
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
function overallOutOf10(kpi, learning, rel, manager) { return round1((kpi * 0.4 + learning * 0.3 + rel * 0.2 + manager * 0.1)); }

function generateSummary(model) {
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

/****************
 * Theming Bits  *
 ****************/
// Celebration Component
const CelebrationEffect = ({ show }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div className="celebration-container">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'][Math.floor(Math.random() * 6)]
            }}
          />
        ))}
      </div>
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-50">
        <div className="bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 p-1 rounded-2xl animate-pulse">
          <div className="bg-white rounded-2xl p-8 shadow-2xl animate-bounce">
            <div className="text-6xl mb-4 animate-spin">🎉</div>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent mb-2">
              Excellent Work!
            </div>
            <div className="text-lg text-gray-600 mb-2">Overall Score: {overall}/10</div>
            <div className="text-sm text-green-600 font-semibold">🌟 Outstanding Performance! 🌟</div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .celebration-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          animation: confetti-fall 3s linear infinite;
        }
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Simple Performance Chart Component
const PerformanceChart = ({ data, title }) => {
  if (!data || data.length === 0) return null;

  const maxScore = Math.max(...data.map(d => d.score), 10);
  const chartHeight = 200;

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <h4 className="font-medium text-gray-800 mb-4">{title}</h4>
      <div className="relative" style={{ height: chartHeight }}>
        <svg width="100%" height={chartHeight} className="overflow-visible">
          {/* Grid lines */}
          {[0, 2, 4, 6, 8, 10].map(score => (
            <g key={score}>
              <line
                x1="40"
                y1={chartHeight - (score / 10) * (chartHeight - 40)}
                x2="100%"
                y2={chartHeight - (score / 10) * (chartHeight - 40)}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x="35"
                y={chartHeight - (score / 10) * (chartHeight - 40) + 4}
                fontSize="12"
                fill="#6b7280"
                textAnchor="end"
              >
                {score}
              </text>
            </g>
          ))}

          {/* Chart line */}
          <polyline
            points={data.map((d, i) =>
              `${50 + (i * (100 / Math.max(data.length - 1, 1)) * 8)},${chartHeight - (d.score / 10) * (chartHeight - 40)}`
            ).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((d, i) => (
            <g key={i}>
              <circle
                cx={50 + (i * (100 / Math.max(data.length - 1, 1)) * 8)}
                cy={chartHeight - (d.score / 10) * (chartHeight - 40)}
                r="4"
                fill="#3b82f6"
              />
              <text
                x={50 + (i * (100 / Math.max(data.length - 1, 1)) * 8)}
                y={chartHeight - 10}
                fontSize="10"
                fill="#6b7280"
                textAnchor="middle"
              >
                {d.month}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

// PDF Download Component
const PDFDownloadButton = ({ data, employeeName, yearlySummary }) => {
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
            <th>Manager Score</th>
            <th>Manager Comments</th>
          </tr>
          ${data.map(d => {
            const learningHours = ((d.learning || []).reduce((sum, l) => sum + (l.durationMins || 0), 0) / 60).toFixed(1);
            return `
              <tr>
                <td><strong>${monthLabel(d.monthKey)}</strong></td>
                <td class="score-cell ${(d.scores?.overall || 0) >= 7 ? 'score-good' : 'score-poor'}">${d.scores?.overall || 'N/A'}/10</td>
                <td class="score-cell">${d.scores?.kpiScore || 'N/A'}/10</td>
                <td class="score-cell">${d.scores?.learningScore || 'N/A'}/10</td>
                <td class="score-cell">${d.scores?.relationshipScore || 'N/A'}/10</td>
                <td>${learningHours}h</td>
                <td>${d.manager?.score || 'N/A'}/10</td>
                <td class="comments-cell">${d.manager?.comments || 'No comments'}</td>
              </tr>
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
                  <ul>
                    ${d.clients.map(c => `
                      <li>${c.op_clientName || 'Unnamed Client'} - ${c.op_clientStatus || 'Unknown Status'}</li>
                    `).join('')}
                  </ul>
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
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  const downloadPDF = () => {
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
            <h1>🏢 Branding Pioneers</h1>
            <h2>Employee Performance Report</h2>
            <h2>${employeeName}</h2>
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

// Information Tooltip Component
const InfoTooltip = ({ content }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block ml-2">
      <button
        type="button"
        className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </button>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10">
          <div className="whitespace-pre-wrap">{content}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

const HeaderBrand = () => (
  <div className="flex items-center gap-3">
    <img
      src="https://brandingpioneers.com/assets/logo.png"
      alt="Branding Pioneers"
      className="w-10 h-10 object-contain"
      onError={(e) => {
        // Fallback to initials if logo fails to load
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
      }}
    />
    <div className="w-10 h-10 rounded-full bg-blue-600 text-white items-center justify-center font-bold text-sm hidden">BP</div>
    <div className="font-bold text-gray-800">
      <div className="text-lg">Branding Pioneers</div>
      <div className="text-sm text-gray-600 font-normal hidden sm:block">Monthly Tactical System</div>
    </div>
  </div>
);
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_ACCESS_TOKEN || "admin";

/****************
 * App Shell     *
 ****************/
const EMPTY_SUBMISSION = {
  // `id` will be set by Supabase on insert
  monthKey: thisMonthKey(),
  isDraft: true,
  employee: { name: "", department: "Web", role: [], phone: "" }, // Default role is now an empty array
  meta: { attendance: { wfo: 0, wfh: 0 }, tasks: { count: 0, aiTableLink: "", aiTableScreenshot: "" } },
  clients: [],
  learning: [],
  aiUsageNotes: "",
  feedback: { company: "", hr: "", challenges: "" }, // New feedback section
  flags: { missingLearningHours: false, hasEscalations: false, missingReports: false },
  manager: { verified: false, comments: "", score: 0, hiddenDataFlag: false },
  scores: { kpiScore: 0, learningScore: 0, relationshipScore: 0, overall: 0 },
};

function useHash() {
  const initial = typeof window === 'undefined' ? '' : (window.location.hash || '');
  const [hash, setHash] = useState(initial);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return hash;
}

// Hook to provide modal functionality
const ModalContext = React.createContext({ openModal: () => { }, closeModal: () => { } });
const useModal = () => React.useContext(ModalContext);

// Custom Modal component
function Modal({ isOpen, onClose, title, message, onConfirm, onCancel, inputLabel, inputValue, onInputChange }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white p-4 sm:p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-base sm:text-lg font-medium leading-6 text-gray-900">
                  {title}
                </Dialog.Title>
                <div className="mt-2 sm:mt-3">
                  <p className="text-sm text-gray-500 whitespace-pre-wrap leading-relaxed">
                    {message}
                  </p>
                  {inputLabel && (
                    <div className="mt-4">
                      <label htmlFor="modal-input" className="block text-sm font-medium text-gray-700">
                        {inputLabel}
                      </label>
                      <input
                        type="text"
                        id="modal-input"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base p-3 sm:text-sm sm:p-2"
                        value={inputValue}
                        onChange={onInputChange}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 sm:justify-end">
                  {onCancel && (
                    <button
                      type="button"
                      className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 touch-manipulation"
                      onClick={onCancel}
                    >
                      Cancel
                    </button>
                  )}
                  {onConfirm && (
                    <button
                      type="button"
                      className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-3 sm:py-2 text-base sm:text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation"
                      onClick={onConfirm}
                    >
                      OK
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function useFetchSubmissions() {
  const supabase = useSupabase();
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubmissions = useCallback(async () => {
    if (!supabase) return; // Guard clause: don't fetch if client isn't ready.

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*');

      if (error) throw error;

      setAllSubmissions(data || []);
    } catch (e) {
      console.error("Failed to load submissions from Supabase:", e);
      setError("Failed to load data from the database. Please check your connection and the table setup.");
      setAllSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]); // Re-run this effect when the supabase client becomes available.

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return { allSubmissions, loading, error, refreshSubmissions: fetchSubmissions };
}

function AppContent() {
  const hash = useHash();
  const { allSubmissions } = useFetchSubmissions();
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    userType: null, // 'employee' or 'manager'
    currentUser: null, // employee data or manager info
    loginError: ''
  });
  const [loginForm, setLoginForm] = useState({
    name: '',
    phone: '',
    userType: 'employee' // 'employee' or 'manager'
  });
  const [view, setView] = useState('main'); // 'main', 'employeeReport', 'employeeDashboard'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null, inputLabel: '', inputValue: '', onClose: () => setModalState(s => ({ ...s, isOpen: false })) });
  const openModal = (title, message, onConfirm = null, onCancel = null, inputLabel = '', inputValue = '') => {
    setModalState({ isOpen: true, title, message, onConfirm, onCancel, inputLabel, inputValue, onClose: () => setModalState(s => ({ ...s, isOpen: false })) });
  };
  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  // Auto-login if the URL hash is set
  useEffect(() => {
    if (hash === '#/manager') {
      setLoginForm(prev => ({ ...prev, userType: 'manager' }));
    } else if (hash === '#/employee') {
      setLoginForm(prev => ({ ...prev, userType: 'employee' }));
    }
  }, [hash]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthState(prev => ({ ...prev, loginError: '' }));

    if (loginForm.userType === 'manager') {
      // Manager login with admin token
      if (loginForm.phone === ADMIN_TOKEN) {
        setAuthState({
          isLoggedIn: true,
          userType: 'manager',
          currentUser: { name: 'Manager', role: 'Administrator' },
          loginError: ''
        });
        window.location.hash = '#/manager';
      } else {
        setAuthState(prev => ({ ...prev, loginError: 'Invalid manager credentials. Please check your admin token.' }));
      }
    } else {
      // Employee login with phone number as password
      if (!loginForm.name.trim() || !loginForm.phone.trim()) {
        setAuthState(prev => ({ ...prev, loginError: 'Please enter both name and phone number.' }));
        return;
      }

      try {
        // Verify employee exists in submissions
        const employeeExists = allSubmissions.find(s => 
          s.employee?.name?.toLowerCase().trim() === loginForm.name.toLowerCase().trim() &&
          s.employee?.phone === loginForm.phone
        );

        if (employeeExists) {
          setAuthState({
            isLoggedIn: true,
            userType: 'employee',
            currentUser: {
              name: employeeExists.employee.name,
              phone: employeeExists.employee.phone,
              department: employeeExists.employee.department
            },
            loginError: ''
          });
          window.location.hash = '#/employee';
        } else {
          setAuthState(prev => ({ ...prev, loginError: 'Employee not found. Please check your name and phone number, or contact your manager.' }));
        }
      } catch (error) {
        setAuthState(prev => ({ ...prev, loginError: 'Login failed. Please try again.' }));
      }
    }
  };

  const handleLogout = () => {
    setAuthState({
      isLoggedIn: false,
      userType: null,
      currentUser: null,
      loginError: ''
    });
    setLoginForm({
      name: '',
      phone: '',
      userType: 'employee'
    });
    setView('main');
    setSelectedEmployee(null);
    window.location.hash = '';
  };

  const handleViewEmployeeReport = useCallback((employeeName, employeePhone) => {
    setSelectedEmployee({ name: employeeName, phone: employeePhone });
    setView('employeeReport');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setView('main');
    setSelectedEmployee(null);
  }, []);

  const ManagerSection = () => {
    if (view === 'employeeReport' && selectedEmployee) {
      return (
        <div className="min-h-screen bg-white">
          <EmployeeReportDashboard 
            employeeName={selectedEmployee.name} 
            employeePhone={selectedEmployee.phone} 
            onBack={handleBackToDashboard} 
          />
        </div>
      );
    }
    return <ManagerDashboard onViewReport={handleViewEmployeeReport} />;
  };

  const EmployeeSection = () => {
    if (view === 'employeeDashboard') {
      return (
        <div className="min-h-screen bg-white">
          <EmployeePersonalDashboard 
            employee={authState.currentUser}
            onBack={() => setView('main')}
          />
        </div>
      );
    }
    return <EmployeeForm currentUser={authState.currentUser} />;
  };

  const LoginSection = () => {
    return <LoginForm 
      loginForm={loginForm}
      setLoginForm={setLoginForm}
      onLogin={handleLogin}
      loginError={authState.loginError}
    />;
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900 font-sans">
        <Modal {...modalState} />
        <header className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg shadow-blue-100/20 z-20">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <HeaderBrand />
              <div className="flex items-center gap-2 sm:gap-3">
                {authState.isLoggedIn && (
                  <>
                    <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      {authState.userType === 'manager' ? 'Manager Dashboard' : `Welcome, ${authState.currentUser?.name}`}
                    </div>
                    
                    {/* Mobile user indicator */}
                    <div className="lg:hidden flex items-center gap-1 text-xs text-gray-600">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="truncate max-w-20">
                        {authState.userType === 'manager' ? 'Manager' : authState.currentUser?.name?.split(' ')[0]}
                      </span>
                    </div>
                    
                    {authState.userType === 'employee' && (
                      <button
                        onClick={() => setView(view === 'employeeDashboard' ? 'main' : 'employeeDashboard')}
                        className="text-xs sm:text-sm px-2 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation"
                      >
                        <span className="hidden sm:inline">{view === 'employeeDashboard' ? 'Submit Report' : 'My Dashboard'}</span>
                        <span className="sm:hidden">{view === 'employeeDashboard' ? 'Form' : 'Stats'}</span>
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="text-xs sm:text-sm px-2 sm:px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg touch-manipulation"
                    >
                      <span className="hidden sm:inline">Log Out</span>
                      <span className="sm:hidden">Exit</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          {!authState.isLoggedIn ? (
            <LoginSection />
          ) : authState.userType === 'manager' ? (
            <ManagerSection />
          ) : (
            <EmployeeSection />
          )}
        </main>
        <footer className="bg-white/90 backdrop-blur-lg border-t border-gray-200 mt-auto py-6 sm:py-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm text-gray-600">
                <span>Created for Branding Pioneers Agency</span>
                <span className="hidden sm:inline text-gray-400">•</span>
                <span>Employee Performance Management System</span>
                <span className="hidden sm:inline text-gray-400">•</span>
                <span>v11 (Auth + Mobile)</span>
              </div>
              {!authState.isLoggedIn && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500">
                    Employee or Manager? Use the login form above to access your dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>
        </footer>
      </div>
    </ModalContext.Provider>
  );
}

export default function App() {
  return (
    <SupabaseProvider>
      <AppContent />
    </SupabaseProvider>
  );
}

/**********************
 * Employee Form View *
 **********************/
function EmployeeForm({ currentUser = null }) {
  const supabase = useSupabase();
  const { openModal, closeModal } = useModal();
  const { allSubmissions } = useFetchSubmissions();

  const [currentSubmission, setCurrentSubmission] = useState({ ...EMPTY_SUBMISSION, isDraft: true });
  const [previousSubmission, setPreviousSubmission] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(currentUser); // {name, phone}
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Form steps configuration
  const FORM_STEPS = [
    { id: 1, title: "Profile & Month", icon: "👤", description: "Basic information and reporting period" },
    { id: 2, title: "Attendance & Tasks", icon: "📅", description: "Work attendance and task completion" },
    { id: 3, title: "KPI & Performance", icon: "📊", description: "Department-specific metrics and achievements" },
    { id: 4, title: "Client Management", icon: "🤝", description: "Client relationships and project status" },
    { id: 5, title: "Learning & AI", icon: "🎓", description: "Learning activities and AI usage" },
    { id: 6, title: "Feedback & Review", icon: "💬", description: "Company feedback and final review" },
  ];

  // Auto-save key for localStorage
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

  // Check if submission is already finalized and restrict editing
  const isSubmissionFinalized = useMemo(() => {
    if (!selectedEmployee || !currentSubmission.monthKey) return false;
    
    // Find existing submission for this employee and month
    const existingSubmission = allSubmissions.find(s => 
      s.employee?.name === selectedEmployee.name && 
      s.employee?.phone === selectedEmployee.phone && 
      s.monthKey === currentSubmission.monthKey &&
      s.isDraft === false
    );
    
    return !!existingSubmission;
  }, [selectedEmployee, currentSubmission.monthKey, allSubmissions]);

  // Check if trying to edit previous month (only current month allowed)
  const isPreviousMonth = useMemo(() => {
    const currentMonth = thisMonthKey();
    return currentSubmission.monthKey !== currentMonth;
  }, [currentSubmission.monthKey]);

  // Effect to load previous submission data when an employee is selected
  useEffect(() => {
    if (!selectedEmployee) {
      setPreviousSubmission(null);
      setCurrentSubmission(prev => ({
        ...prev,
        employee: { ...prev.employee, name: "", phone: "" }
      }));
      return;
    }

    // Find the most recent submission for the selected employee
    const prevSub = allSubmissions
      .filter(s => s.employee.phone === selectedEmployee.phone)
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))[0] || null;

    setPreviousSubmission(prevSub);

    // Set up the current submission form with the selected employee's details
    // but keep the rest of the fields blank for this month's data.
    setCurrentSubmission(prev => ({
      ...EMPTY_SUBMISSION,
      employee: { ...prev.employee, name: selectedEmployee.name, phone: selectedEmployee.phone, department: prevSub?.employee?.department || "Web", role: prevSub?.employee?.role || [] },
      monthKey: thisMonthKey(),
    }));
  }, [selectedEmployee, allSubmissions]);


  // Auto-save functionality
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

  // Load saved draft
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

  // Clear saved draft
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
      // Handle nested updates
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
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
  }, []);

  // Auto-save effect - save every 30 seconds when there are changes
  useEffect(() => {
    if (hasUnsavedChanges && selectedEmployee) {
      const timer = setTimeout(autoSave, 30000); // 30 seconds
      return () => clearTimeout(timer);
    }
  }, [hasUnsavedChanges, selectedEmployee, autoSave]);

  // Load draft when employee is selected
  useEffect(() => {
    if (selectedEmployee && getAutoSaveKey()) {
      const hasDraft = loadDraft();
      if (hasDraft) {
        openModal(
          'Draft Found',
          `We found a saved draft for ${selectedEmployee.name} from ${lastAutoSave ? lastAutoSave.toLocaleString() : 'recently'}. Would you like to continue where you left off?`,
          () => {
            // User chose to keep draft - already loaded
            closeModal();
          },
          () => {
            // User chose to start fresh
            clearDraft();
            setCurrentSubmission(prev => ({
              ...EMPTY_SUBMISSION,
              employee: { ...prev.employee, name: selectedEmployee.name, phone: selectedEmployee.phone, department: previousSubmission?.employee?.department || "Web", role: previousSubmission?.employee?.role || [] },
              monthKey: thisMonthKey(),
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

  // Celebration effect for good scores
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

  // Performance feedback generation function
  const generatePerformanceFeedback = (submission) => {
    const scores = submission.scores || {};
    const feedback = {
      overall: scores.overall || 0,
      strengths: [],
      improvements: [],
      nextMonthGoals: [],
      summary: ''
    };

    // Analyze KPI performance
    if (scores.kpiScore >= 8) {
      feedback.strengths.push('Excellent KPI performance - exceeding departmental targets');
    } else if (scores.kpiScore >= 6) {
      feedback.strengths.push('Good KPI performance - meeting most targets');
      feedback.improvements.push('Focus on key metrics that are slightly below target');
    } else {
      feedback.improvements.push('KPI performance needs improvement - review departmental goals and strategies');
      feedback.nextMonthGoals.push('Develop action plan to improve key performance indicators');
    }

    // Analyze learning performance
    const learningHours = (submission.learning || []).reduce((s, e) => s + (e.durationMins || 0), 0) / 60;
    if (scores.learningScore >= 8) {
      feedback.strengths.push(`Outstanding commitment to learning with ${learningHours.toFixed(1)} hours completed`);
    } else if (scores.learningScore >= 6) {
      feedback.strengths.push('Good learning progress this month');
    } else {
      feedback.improvements.push('Increase learning activities to meet minimum 6-hour requirement');
      feedback.nextMonthGoals.push('Schedule dedicated learning time throughout the month');
    }

    // Analyze client relationship performance
    if (scores.relationshipScore >= 8) {
      feedback.strengths.push('Excellent client relationship management and communication');
    } else if (scores.relationshipScore >= 6) {
      feedback.improvements.push('Continue strengthening client relationships and communication');
    } else {
      feedback.improvements.push('Client relationship management needs significant improvement');
      feedback.nextMonthGoals.push('Develop better client communication strategies and follow-up systems');
    }

    // Check for flags and add specific feedback
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

    // Generate overall summary
    if (feedback.overall >= 8) {
      feedback.summary = 'Exceptional performance this month! You\'re exceeding expectations and making significant contributions to the team.';
    } else if (feedback.overall >= 6) {
      feedback.summary = 'Good solid performance with room for growth. Focus on the improvement areas to reach the next level.';
    } else {
      feedback.summary = 'Performance needs improvement. Please work closely with your manager to address the identified areas.';
    }

    return feedback;
  };

  // Show performance feedback modal
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

    // Check submission restrictions
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

    // Remove the temporary ID if it exists before upserting
    delete final.id;

    const { data, error } = await supabase
      .from('submissions')
      .upsert(final, { onConflict: 'employee_phone, monthKey' }); // Assumes a unique constraint on (employee_phone, monthKey)

    if (error) {
      console.error("Supabase submission error:", error);
      openModal("Submission Error", `There was a problem saving your report to the database: ${error.message}`, closeModal);
    } else {
      // Generate and show performance feedback report
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

  // Navigation functions
  const goToStep = (stepId) => {
    setCurrentStep(stepId);
    if (selectedEmployee) {
      autoSave(); // Auto-save when switching steps
    }
  };

  const nextStep = () => {
    if (currentStep < FORM_STEPS.length) {
      goToStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  const getCurrentStepData = () => FORM_STEPS.find(step => step.id === currentStep);

  // Progress Indicator Component
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
                onClick={() => goToStep(step.id)}
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-semibold transition-all duration-200 ${
                  currentStep === step.id
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
        
        {/* Progress Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 -z-10">
          <div 
            className="h-full bg-green-600 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (FORM_STEPS.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );

  // Step Content Component
  const StepContent = () => {
    const stepData = getCurrentStepData();
    const isFormDisabled = isSubmissionFinalized || isPreviousMonth;
    
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${
        isFormDisabled ? 'opacity-75' : ''
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
            isFormDisabled ? 'bg-gray-200 text-gray-500' : 'bg-blue-100'
          }`}>
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
          </div>
        </div>

        {renderStepContent()}
      </div>
    );
  };

  // Render content based on current step
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

  return (
    <div className="max-w-4xl mx-auto">
      <CelebrationEffect show={showCelebration} />
      
      {/* Submission Status Banner */}
      {isSubmissionFinalized && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            ✓
          </div>
          <div>
            <h4 className="font-semibold text-green-800">Submission Complete</h4>
            <p className="text-sm text-green-700">
              This month's report has been successfully submitted and locked. No further edits are allowed.
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

      {/* Navigation */}
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
            className={`rounded-xl px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-colors touch-manipulation ${
              isSubmissionFinalized || isPreviousMonth
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

  // Step 1: Profile & Month
  function renderProfileStep() {
    const isFormDisabled = isSubmissionFinalized || isPreviousMonth;
    
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {currentUser ? (
              // Logged in user - show their info (read-only)
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
              // Not logged in - show employee selector
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Select Employee</label>
                  <select
                    className={`w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isFormDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    value={selectedEmployee ? `${selectedEmployee.name}-${selectedEmployee.phone}` : ""}
                    onChange={(e) => {
                      if (isFormDisabled) return;
                      if (e.target.value === "") {
                        setSelectedEmployee(null);
                        setCurrentSubmission({ ...EMPTY_SUBMISSION, monthKey: thisMonthKey() });
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
                    className={`w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      isFormDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
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
                className={`w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  isFormDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
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

  // Step 2: Attendance & Tasks  
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

  // Step 3: KPI & Performance
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

  // Step 4: Client Management  
  function renderClientStep() {
    // This content is handled in DeptClientsBlock, so we show a summary
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

  // Step 5: Learning & AI
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

  // Step 6: Feedback & Review
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

        {/* Performance Summary */}
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
}

/***********************
 * Validation helpers  *
 ***********************/
function validateSubmission(model) {
  const errors = [];
  const m = model || {};
  const emp = m.employee || {};
  const dept = emp.department || "";
  const monthKey = m.monthKey || "";

  // Helper to validate YYYY-MM-DD date string from date picker
  const isDateYYYYMMDD = (d) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
  const isUrl = (u) => !!u && u.startsWith('http');
  const isPhoneNumber = (p) => !!p && /^\d{10}$/.test(p);
  const isDriveUrl = (u) => /https?:\/\/(drive|docs)\.google\.com\//i.test(u || "");
  const isGensparkUrl = (u) => /https?:\/\/(www\.)?genspark\.ai/i.test(u || "");

  // 1) employee + month
  if (!emp.name || !emp.name.trim()) errors.push("Enter your Name.");
  if (!dept) errors.push("Select Department.");
  if (!emp.role || emp.role.length === 0) errors.push("Select at least one Role.");
  if (!monthKey) errors.push("Pick Report Month (YYYY-MM).");
  if (!emp.phone || !isPhoneNumber(emp.phone)) errors.push("Enter a valid 10-digit Phone Number.");

  // 2) attendance & tasks
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

  // 3) learning
  // No longer a mandatory field

  // 4) clients & dept KPIs
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
          // This is a soft warning, not a blocking error
          // errors.push(`${row}: provide at least one keyword currently ranking in Top 3 (or remove keywords section for this client).`);
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
      if (!c.sm_creativesThis) {
        // errors.push(`${row}: Graphic Designer role requires a number of creatives.`)
      }
    } else if (dept === "Operations Head") {
      if (!c.op_clientScope || c.op_clientScope.length === 0) errors.push(`${row}: select at least one client scope.`);
      if (c.op_paymentDate && !isDateYYYYMMDD(c.op_paymentDate)) errors.push(`${row}: enter client payment date.`);
      if (c.op_clientStatus === 'Upgraded' || c.op_clientStatus === 'Left' || c.op_clientStatus === 'Reduced') {
        if (!c.op_clientStatusReason || !c.op_clientStatusReason.trim()) errors.push(`${row}: provide a reason for the client status.`);
      }
    }

    // Client Report Status + payments + meetings
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

/************************
 * Clients & KPI Section *
 ************************/
function DeptClientsBlock({ currentSubmission, previousSubmission, setModel, monthPrev, monthThis, openModal, closeModal }) {
  const isInternal = ["HR", "Accounts", "Sales", "Blended (HR + Sales)"].includes(currentSubmission.employee.department);
  const isWebHead = currentSubmission.employee.department === "Web Head";
  const isOpsHead = currentSubmission.employee.department === "Operations Head";

  return (
    <Section
      title="KPIs, Reports & Client Report Status"
      number="2"
      info="Enter your key performance indicators based on your department. Include client work, deliverables, and performance metrics. Upload proof links (Google Drive URLs) to validate your achievements. This section is crucial for performance evaluation."
    >
      {(isInternal && !isOpsHead && !isWebHead) ? (
        <InternalKPIs model={currentSubmission} prevModel={previousSubmission} setModel={setModel} monthPrev={monthPrev} monthThis={monthThis} />
      ) : (
        <ClientTable currentSubmission={currentSubmission} previousSubmission={previousSubmission} setModel={setModel} monthPrev={monthPrev} monthThis={monthThis} openModal={openModal} closeModal={closeModal} />
      )}
    </Section>
  );
}

function ClientTable({ currentSubmission, previousSubmission, setModel, monthPrev, monthThis, openModal, closeModal }) {
  const [draftRow, setDraftRow] = useState({ name: "", scopeOfWork: "", url: "" });
  const isOpsHead = currentSubmission.employee.department === "Operations Head";
  const isWebHead = currentSubmission.employee.department === "Web Head";
  const isGraphicDesigner = currentSubmission.employee.role?.includes("Graphic Designer");
  const hasClientStatusSection = ["SEO", "Social Media", "Ads", "Operations Head"].includes(currentSubmission.employee.department);

  function pushDraft() {
    if (!draftRow.name.trim()) return;
    if (draftRow.url && !isDriveUrl(draftRow.url) && !isGensparkUrl(draftRow.url)) {
      openModal('Invalid Link', 'Please paste a Google Drive, Google Docs, or Genspark URL.', closeModal);
      return;
    }
    const base = { id: uid(), name: draftRow.name.trim(), reports: [], relationship: { roadmapSentDate: '', reportSentDate: '', meetings: [], appreciations: [], escalations: [], clientSatisfaction: 0, paymentReceived: false, paymentDate: '' } };
    const withReport = (draftRow.url)
      ? { ...base, reports: [{ id: uid(), label: draftRow.scopeOfWork.trim() || 'Report', url: draftRow.url.trim() }] }
      : base;

    if (isOpsHead) {
      withReport.op_clientScope = [];
      withReport.op_paymentDate = '';
      withReport.op_teamFinishedScope = false;
      withReport.op_satisfactionScore = 0;
      withReport.op_appreciations = [];
      withReport.op_escalations = [];
      withReport.op_clientStatus = 'Active';
      withReport.op_performanceRemarks = '';
      withReport.op_comingMonthActions = '';
    }

    if (isWebHead) {
      withReport.web_saasUpsells = 0;
      withReport.web_saasProof = "";
      withReport.web_pagesThis = 0;
      withReport.web_onTimeThis = 0;
    }

    setModel(m => ({ ...m, clients: [...m.clients, withReport] }));
    setDraftRow({ name: "", scopeOfWork: "", url: "" });
  }

  const prevClients = previousSubmission?.clients || [];
  const clientNames = useMemo(() => {
    const names = new Set(prevClients.map(c => c.name));
    return [...names].sort();
  }, [prevClients]);

  const addClientFromDropdown = (clientName) => {
    const prevClient = prevClients.find(c => c.name === clientName);
    const newClient = prevClient ? { ...prevClient, id: uid(), reports: [] } : { id: uid(), name: clientName, reports: [], relationship: {} };
    setModel(m => ({ ...m, clients: [...m.clients, newClient] }));
  };

  return (
    <div>
      <p className="text-xs text-gray-600 mb-2">Upload <b>Google Drive</b> or <b>Genspark URL</b> links only (give view access). Use Scope of Work to describe the link (e.g., GA4 Dashboard, Ads PDF, WhatsApp screenshot).</p>
      <div className="flex gap-2 items-center mb-4">
        <label className="text-sm font-medium">Add Client</label>
        <select
          className="flex-1 border rounded-xl p-2 text-sm"
          onChange={(e) => addClientFromDropdown(e.target.value)}
          value=""
        >
          <option value="" disabled>Select a previous client...</option>
          {clientNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <div className="flex-1 border rounded-xl p-2 text-sm text-gray-500">or enter a new client below.</div>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="bg-blue-50">
              <th className="text-left p-2 border">Client</th>
              <th className="text-left p-2 border">Scope of Work</th>
              <th className="text-left p-2 border">Drive/Genspark URL</th>
              <th className="text-left p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSubmission.clients.map(c => (
              <tr key={c.id} className="odd:bg-white even:bg-blue-50/40">
                <td className="p-2 border font-medium">{c.name}</td>
                <td className="p-2 border" colSpan={2}>
                  <TinyLinks
                    items={(c.reports || [])}
                    onAdd={(r) => {
                      if (!isDriveUrl(r.url) && !isGensparkUrl(r.url)) {
                        openModal('Invalid Link', 'Please paste a Google Drive/Docs or Genspark URL link.', closeModal);
                        return;
                      }
                      setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? { ...x, reports: [...(x.reports || []), r] } : x) }));
                    }}
                    onRemove={(id) => setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? { ...x, reports: x.reports.filter(rr => rr.id !== id) } : x) }))}
                  />
                </td>
                <td className="p-2 border">
                  <button className="text-xs text-red-600" onClick={() => setModel(m => ({ ...m, clients: m.clients.filter(x => x.id !== c.id) }))}>Remove</button>
                </td>
              </tr>
            ))}
            <tr className="bg-amber-50">
              <td className="p-2 border">
                <input className="w-full border rounded-lg p-2" placeholder="Enter client name" value={draftRow.name} onChange={e => setDraftRow(d => ({ ...d, name: e.target.value }))} />
              </td>
              <td className="p-2 border">
                <textarea className="w-full border rounded-lg p-2" rows={2} placeholder="Scope of Work (Dashboard, PDF, WhatsApp…)" value={draftRow.scopeOfWork} onChange={e => setDraftRow(d => ({ ...d, scopeOfWork: e.target.value }))} />
              </td>
              <td className="p-2 border">
                <input className="w-full border rounded-lg p-2" placeholder="Google Drive or Genspark URL (view access)" value={draftRow.url} onChange={e => setDraftRow(d => ({ ...d, url: e.target.value }))} />
              </td>
              <td className="p-2 border">
                <button className="px-3 py-2 rounded-lg bg-blue-600 text-white" onClick={pushDraft}>Add Client</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {currentSubmission.clients.length === 0 && (
        <div className="text-sm text-gray-600 mt-2">Start by typing a client name in the first row, optionally add a Drive link, then hit <b>Add Client</b>. KPIs for that client will appear below.</div>
      )}

      {currentSubmission.clients.map(c => {
        const prevClient = previousSubmission?.clients.find(pc => pc.name === c.name) || {};
        const isNewClient = !previousSubmission || Object.keys(prevClient).length === 0;
        return (
          <div key={c.id} className="border rounded-2xl p-4 my-4 bg-white">
            <div className="font-semibold mb-2">KPIs • {c.name} <span className="text-xs text-gray-500">({monthLabel(monthPrev)} vs {monthLabel(monthThis)})</span></div>
            {currentSubmission.employee.department === 'Web' && (
              <KPIsWeb client={c} prevClient={prevClient} onChange={(cc) => setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? cc : x) }))} monthPrev={monthPrev} monthThis={monthThis} isNewClient={isNewClient} />
            )}
            {currentSubmission.employee.department === 'Social Media' && (
              <KPIsSocial client={c} prevClient={prevClient} employeeRole={currentSubmission.employee.role} onChange={(cc) => setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? cc : x) }))} monthPrev={monthPrev} monthThis={monthThis} isNewClient={isNewClient} />
            )}
            {currentSubmission.employee.department === 'Ads' && (
              <KPIsAds client={c} prevClient={prevClient} onChange={(cc) => setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? cc : x) }))} monthPrev={monthPrev} monthThis={monthThis} isNewClient={isNewClient} />
            )}
            {currentSubmission.employee.department === 'SEO' && (
              <KPIsSEO client={c} prevClient={prevClient} onChange={(cc) => setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? cc : x) }))} monthPrev={monthPrev} monthThis={monthThis} openModal={openModal} closeModal={closeModal} isNewClient={isNewClient} />
            )}
            {isWebHead && (
              <KPIsWebHead client={c} prevClient={prevClient} onChange={(cc) => setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? cc : x) }))} monthPrev={monthPrev} monthThis={monthThis} isNewClient={isNewClient} />
            )}
            {isOpsHead && (
              <KPIsOperationsHead client={c} onChange={(cc) => setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? cc : x) }))} />
            )}
            {hasClientStatusSection && (
              <ClientReportStatus client={c} prevClient={prevClient} onChange={(cc) => setModel(m => ({ ...m, clients: m.clients.map(x => x.id === c.id ? cc : x) }))} />
            )}
          </div>
        )
      })}
    </div>
  );
}

/*********************
 * KPI Block Widgets  *
 *********************/
function MultiSelect({ options, selected, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const displayValue = selected.length > 0 ? selected.join(", ") : placeholder;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="w-full border rounded-xl p-2 text-left"
        onClick={toggleDropdown}
      >
        {displayValue}
      </button>
      {isOpen && (
        <ul className="absolute z-10 w-full bg-white border rounded-xl mt-1 max-h-60 overflow-y-auto shadow-lg">
          {options.map((option) => (
            <li
              key={option}
              onClick={() => handleSelect(option)}
              className={`p-2 cursor-pointer hover:bg-blue-100 ${selected.includes(option) ? 'bg-blue-50 font-semibold' : ''}`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PrevValue({ label, value }) {
  return (
    <div>
      <label className="text-xs text-gray-600 block">{label}</label>
      <div className="w-full border rounded-xl p-2 bg-gray-100 text-gray-700 font-medium">{value}</div>
    </div>
  );
}

function ProofField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-gray-600">{label} (Drive URL)</label>
      <input className="w-full border rounded-xl p-2" placeholder="https://drive.google.com/..." value={value || ""} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function KPIsWeb({ client, prevClient, onChange, monthPrev, monthThis, isNewClient }) {
  const delta = (a, b) => (a || 0) - (b || 0);
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      {isNewClient ? (
        <NumField label={`# Pages (${monthLabel(monthPrev)})`} value={client.web_pagesPrev || 0} onChange={v => onChange({ ...client, web_pagesPrev: v })} />
      ) : (
        <PrevValue label={`# Pages (${monthLabel(monthPrev)})`} value={prevClient.web_pagesThis || 0} />
      )}
      <NumField label={`# Pages (${monthLabel(monthThis)})`} value={client.web_pagesThis || 0} onChange={v => onChange({ ...client, web_pagesThis: v })} />
      {isNewClient ? (
        <NumField label={`On-time % (${monthLabel(monthPrev)})`} value={client.web_onTimePrev || 0} onChange={v => onChange({ ...client, web_onTimePrev: v })} />
      ) : (
        <PrevValue label={`On-time % (${monthLabel(monthPrev)})`} value={prevClient.web_onTimeThis || 0} />
      )}
      <NumField label={`On-time % (${monthLabel(monthThis)})`} value={client.web_onTimeThis || 0} onChange={v => onChange({ ...client, web_onTimeThis: v })} />
      {isNewClient ? (
        <NumField label={`Bugs Fixed (${monthLabel(monthPrev)})`} value={client.web_bugsPrev || 0} onChange={v => onChange({ ...client, web_bugsPrev: v })} />
      ) : (
        <PrevValue label={`Bugs Fixed (${monthLabel(monthPrev)})`} value={prevClient.web_bugsThis || 0} />
      )}
      <NumField label={`Bugs Fixed (${monthLabel(monthThis)})`} value={client.web_bugsThis || 0} onChange={v => onChange({ ...client, web_bugsThis: v })} />
      <NumField label="# SaaS tools upsold (this)" value={client.web_saasUpsells || 0} onChange={v => onChange({ ...client, web_saasUpsells: v })} />
      <ProofField label="SaaS proof / invoice / deck" value={client.web_saasProof} onChange={(v) => onChange({ ...client, web_saasProof: v })} />
      <ProofField label="CRO/Design review proof" value={client.web_proof} onChange={(v) => onChange({ ...client, web_proof: v })} />

      {/* Additional Web KPIs */}
      <NumField label="Client Satisfaction (1-10)" value={client.web_clientSatisfaction || 0} onChange={v => onChange({ ...client, web_clientSatisfaction: v })} />
      <NumField label="Code Quality Score (1-10)" value={client.web_codeQuality || 0} onChange={v => onChange({ ...client, web_codeQuality: v })} />
      <NumField label="Website Speed Score (1-100)" value={client.web_speedScore || 0} onChange={v => onChange({ ...client, web_speedScore: v })} />
      <NumField label="Security Audits Completed" value={client.web_securityAudits || 0} onChange={v => onChange({ ...client, web_securityAudits: v })} />

      <div className="md:col-span-4 text-xs text-gray-600">MoM Pages Δ: {delta(client.web_pagesThis, isNewClient ? client.web_pagesPrev : prevClient.web_pagesThis)} • On-time Δ: {round1((client.web_onTimeThis || 0) - (isNewClient ? client.web_onTimePrev : prevClient.web_onTimeThis || 0))} • Bugs Δ: {delta(client.web_bugsThis, isNewClient ? client.web_bugsPrev : prevClient.web_bugsThis)}</div>
    </div>
  );
}

function KPIsWebHead({ client, prevClient, onChange }) {
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      <NumField label={`# Pages Delivered`} value={client.web_pagesThis || 0} onChange={v => onChange({ ...client, web_pagesThis: v })} />
      <NumField label={`On-time % Delivered`} value={client.web_onTimeThis || 0} onChange={v => onChange({ ...client, web_onTimeThis: v })} />
      <NumField label="# SaaS tools upsold (this)" value={client.web_saasUpsells || 0} onChange={v => onChange({ ...client, web_saasUpsells: v })} />
      <ProofField label="Upsell proof / invoice" value={client.web_saasProof} onChange={v => onChange({ ...client, web_saasProof: v })} />
    </div>
  );
}


function KPIsSocial({ client, prevClient, employeeRole, onChange, monthPrev, monthThis, isNewClient }) {
  const folDelta = (client.sm_followersThis || 0) - (isNewClient ? (client.sm_followersPrev || 0) : (prevClient.sm_followersThis || 0));
  const reachDelta = (client.sm_reachThis || 0) - (isNewClient ? (client.sm_reachPrev || 0) : (prevClient.sm_reachThis || 0));
  const erDelta = (client.sm_erThis || 0) - (isNewClient ? (client.sm_erPrev || 0) : (prevClient.sm_erThis || 0));
  const isDesigner = employeeRole?.includes('Graphic Designer');
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      {!isDesigner && (
        <>
          {isNewClient ? (
            <NumField label={`Followers (${monthLabel(monthPrev)})`} value={client.sm_followersPrev || 0} onChange={v => onChange({ ...client, sm_followersPrev: v })} />
          ) : (
            <PrevValue label={`Followers (${monthLabel(monthPrev)})`} value={prevClient.sm_followersThis || 0} />
          )}
          <NumField label={`Followers (${monthLabel(monthThis)})`} value={client.sm_followersThis || 0} onChange={v => onChange({ ...client, sm_followersThis: v })} />
          {isNewClient ? (
            <NumField label={`Reach (${monthLabel(monthPrev)})`} value={client.sm_reachPrev || 0} onChange={v => onChange({ ...client, sm_reachPrev: v })} />
          ) : (
            <PrevValue label={`Reach (${monthLabel(monthPrev)})`} value={prevClient.sm_reachThis || 0} />
          )}
          <NumField label={`Reach (${monthLabel(monthThis)})`} value={client.sm_reachThis || 0} onChange={v => onChange({ ...client, sm_reachThis: v })} />
          {isNewClient ? (
            <NumField label={`Engagement Rate % (${monthLabel(monthPrev)})`} value={client.sm_erPrev || 0} onChange={v => onChange({ ...client, sm_erPrev: v })} />
          ) : (
            <PrevValue label={`Engagement Rate % (${monthLabel(monthPrev)})`} value={prevClient.sm_erThis || 0} />
          )}
          <NumField label={`Engagement Rate % (${monthLabel(monthThis)})`} value={client.sm_erThis || 0} onChange={v => onChange({ ...client, sm_erThis: v })} />
          <NumField label="# Campaigns (this)" value={client.sm_campaignsThis || 0} onChange={v => onChange({ ...client, sm_campaignsThis: v })} />
          <p className="md:col-span-4 text-xs text-gray-600">MoM Δ — Followers: {folDelta} • Reach: {reachDelta} • ER: {round1(erDelta)}</p>
          <TextField label="Best Performing Post (title/desc)" value={client.sm_bestPostTitle || ""} onChange={v => onChange({ ...client, sm_bestPostTitle: v })} />
          <ProofField label="Best Post proof (post URL / insights)" value={client.sm_bestPostProof} onChange={v => onChange({ ...client, sm_bestPostProof: v })} />
          <TextArea label="Distribution Achievements (what you did)" rows={3} value={client.sm_distributionNotes || ""} onChange={v => onChange({ ...client, sm_distributionNotes: v })} className="md:col-span-2" />
          <ProofField label="Campaign proof (deck / screenshots)" value={client.sm_campaignProof} onChange={v => onChange({ ...client, sm_campaignProof: v })} />
        </>
      )}
      {isDesigner && (
        <>
          <h4 className="font-semibold text-sm col-span-4 mt-2">Graphic Designer KPIs</h4>
          <NumField label="Graphics (Photoshop)" value={client.sm_graphicsPhotoshop || 0} onChange={v => onChange({ ...client, sm_graphicsPhotoshop: v })} />
          <NumField label="Graphics (Canva)" value={client.sm_graphicsCanva || 0} onChange={v => onChange({ ...client, sm_graphicsCanva: v })} />
          <NumField label="Graphics (AI)" value={client.sm_graphicsAi || 0} onChange={v => onChange({ ...client, sm_graphicsAi: v })} />
          <NumField label="Short Videos" value={client.sm_shortVideos || 0} onChange={v => onChange({ ...client, sm_shortVideos: v })} />
          <NumField label="Long Videos" value={client.sm_longVideos || 0} onChange={v => onChange({ ...client, sm_longVideos: v })} />
          <NumField label="Quality Score (1-10)" value={client.sm_qualityScore || 0} onChange={v => onChange({ ...client, sm_qualityScore: v })} />

          {/* Additional Designer KPIs */}
          <NumField label="Brand Consistency Score (1-10)" value={client.sm_brandConsistency || 0} onChange={v => onChange({ ...client, sm_brandConsistency: v })} />
          <NumField label="Client Revisions Required" value={client.sm_revisions || 0} onChange={v => onChange({ ...client, sm_revisions: v })} />
          <NumField label="Templates Created" value={client.sm_templatesCreated || 0} onChange={v => onChange({ ...client, sm_templatesCreated: v })} />
        </>
      )}

      {/* Common Social Media KPIs for all roles */}
      <div className="md:col-span-4 bg-purple-50 rounded-lg p-4 mt-4">
        <h4 className="font-medium text-purple-800 mb-3">📈 Additional Social Media Metrics</h4>
        <div className="grid md:grid-cols-4 gap-3">
          <NumField label="Story Views" value={client.sm_storyViews || 0} onChange={v => onChange({ ...client, sm_storyViews: v })} />
          <NumField label="Saves/Shares" value={client.sm_savesShares || 0} onChange={v => onChange({ ...client, sm_savesShares: v })} />
          <NumField label="Comments Responded %" value={client.sm_responseRate || 0} onChange={v => onChange({ ...client, sm_responseRate: v })} />
          <NumField label="Hashtag Performance Score (1-10)" value={client.sm_hashtagScore || 0} onChange={v => onChange({ ...client, sm_hashtagScore: v })} />
        </div>
      </div>
    </div>
  );
}

function KPIsAds({ client, prevClient, onChange, monthPrev, monthThis, isNewClient }) {
  const cplDelta = (client.ads_cplThis || 0) - (isNewClient ? (client.ads_cplPrev || 0) : (prevClient.ads_cplThis || 0));
  const ctrDelta = (client.ads_ctrThis || 0) - (isNewClient ? (client.ads_ctrPrev || 0) : (prevClient.ads_ctrThis || 0));
  const leadsDelta = (client.ads_leadsThis || 0) - (isNewClient ? (client.ads_leadsPrev || 0) : (prevClient.ads_leadsThis || 0));
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      <NumField label="# New Ads Created (this)" value={client.ads_newAds || 0} onChange={v => onChange({ ...client, ads_newAds: v })} />
      {isNewClient ? (
        <NumField label={`CTR % (${monthLabel(monthPrev)})`} value={client.ads_ctrPrev || 0} onChange={v => onChange({ ...client, ads_ctrPrev: v })} />
      ) : (
        <PrevValue label={`CTR % (${monthLabel(monthPrev)})`} value={prevClient.ads_ctrThis || 0} />
      )}
      <NumField label={`CTR % (${monthLabel(monthThis)})`} value={client.ads_ctrThis || 0} onChange={v => onChange({ ...client, ads_ctrThis: v })} />
      {isNewClient ? (
        <NumField label={`CPL (${monthLabel(monthPrev)})`} value={client.ads_cplPrev || 0} onChange={v => onChange({ ...client, ads_cplPrev: v })} />
      ) : (
        <PrevValue label={`CPL (${monthLabel(monthPrev)})`} value={prevClient.ads_cplThis || 0} />
      )}
      <NumField label={`CPL (${monthLabel(monthThis)})`} value={client.ads_cplThis || 0} onChange={v => onChange({ ...client, ads_cplThis: v })} />
      {isNewClient ? (
        <NumField label={`Leads (${monthLabel(monthPrev)})`} value={client.ads_leadsPrev || 0} onChange={v => onChange({ ...client, ads_leadsPrev: v })} />
      ) : (
        <PrevValue label={`Leads (${monthLabel(monthPrev)})`} value={prevClient.ads_leadsThis || 0} />
      )}
      <NumField label={`Leads (${monthLabel(monthThis)})`} value={client.ads_leadsThis || 0} onChange={v => onChange({ ...client, ads_leadsThis: v })} />
      <TextField label="Best Performing Ad (name/desc)" value={client.ads_bestAdTitle || ""} onChange={v => onChange({ ...client, ads_bestAdTitle: v })} />
      <ProofField label="Best Ad proof (screenshot/insights)" value={client.ads_bestAdProof} onChange={v => onChange({ ...client, ads_bestAdProof: v })} />
      <TextArea label="Landing Page URL" value={client.ads_landingPageUrl || ""} onChange={v => onChange({ ...client, ads_landingPageUrl: v })} />
      <TextArea label="Landing Page Improvements" value={client.ads_landingPageImprovements || ""} onChange={v => onChange({ ...client, ads_landingPageImprovements: v })} />
      <p className="md:col-span-4 text-xs text-gray-600">MoM Δ — CTR: {round1(ctrDelta)}pp • CPL: {round1(cplDelta)} (↓ is better) • Leads: {leadsDelta}</p>

      {/* Additional Ads KPIs */}
      <div className="md:col-span-4 bg-orange-50 rounded-lg p-4 mt-4">
        <h4 className="font-medium text-orange-800 mb-3">📊 Advanced Ads Metrics</h4>
        <div className="grid md:grid-cols-4 gap-3">
          <NumField label="ROAS (Return on Ad Spend)" value={client.ads_roas || 0} onChange={v => onChange({ ...client, ads_roas: v })} />
          <NumField label="Conversion Rate %" value={client.ads_conversionRate || 0} onChange={v => onChange({ ...client, ads_conversionRate: v })} />
          <NumField label="Quality Score (1-10)" value={client.ads_qualityScore || 0} onChange={v => onChange({ ...client, ads_qualityScore: v })} />
          <NumField label="Impression Share %" value={client.ads_impressionShare || 0} onChange={v => onChange({ ...client, ads_impressionShare: v })} />
          <NumField label="Ad Spend ($)" value={client.ads_spend || 0} onChange={v => onChange({ ...client, ads_spend: v })} />
          <NumField label="Campaigns Optimized" value={client.ads_campaignsOptimized || 0} onChange={v => onChange({ ...client, ads_campaignsOptimized: v })} />
          <NumField label="A/B Tests Conducted" value={client.ads_abTests || 0} onChange={v => onChange({ ...client, ads_abTests: v })} />
          <NumField label="Negative Keywords Added" value={client.ads_negativeKeywords || 0} onChange={v => onChange({ ...client, ads_negativeKeywords: v })} />
        </div>
      </div>
    </div>
  );
}

function KPIsSEO({ client, prevClient, onChange, monthPrev, monthThis, openModal, closeModal, isNewClient }) {
  const [kw, setKw] = useState(client.seo_keywordsWorked || []);
  const [top3, setTop3] = useState(client.seo_top3 || []);
  useEffect(() => { onChange({ ...client, seo_keywordsWorked: kw }); }, [kw]);
  useEffect(() => { onChange({ ...client, seo_top3: top3 }); }, [top3]);

  const addKw = () => {
    let newKw = { keyword: '', location: '', searchVolume: 0, rankPrev: 0, rankNow: 0, proof: '' };
    const getKeyword = (currentVal = '') => {
      openModal('Add Keyword', 'Enter the keyword.', (keyword) => {
        if (!keyword) { closeModal(); return; }
        newKw.keyword = keyword;
        getLocation(newKw.location);
      }, closeModal, 'Keyword', currentVal);
    };

    const getLocation = (currentVal = '') => {
      openModal('Add Location', 'Enter location (city/region) for the keyword.', (location) => {
        newKw.location = location;
        getSearchVolume(newKw.searchVolume);
      }, closeModal, 'Keyword Location', currentVal);
    };

    const getSearchVolume = (currentVal = '') => {
      openModal('Search Volume', 'Enter the search volume.', (volume) => {
        newKw.searchVolume = Number(volume || 0);
        getRankPrev(newKw.rankPrev);
      }, closeModal, 'Search Volume', currentVal);
    };

    const getRankPrev = (currentVal = '') => {
      openModal('Previous Rank', `Enter the previous rank (${monthLabel(monthPrev)}).`, (rank) => {
        newKw.rankPrev = Number(rank || 0);
        getRankNow(newKw.rankNow);
      }, closeModal, 'Previous Rank', currentVal);
    };

    const getRankNow = (currentVal = '') => {
      openModal('Current Rank', `Enter the current rank (${monthLabel(monthThis)}).`, (rank) => {
        newKw.rankNow = Number(rank || 0);
        getProof(newKw.proof);
      }, closeModal, 'Current Rank', currentVal);
    };

    const getProof = (currentVal = '') => {
      openModal('Proof URL', 'Enter the proof URL (Drive / SERP screenshot).', (proof) => {
        newKw.proof = proof;
        setKw(list => [...list, newKw]);
        closeModal();
      }, closeModal, 'Proof URL', currentVal);
    };

    getKeyword();
  };
  const addTop3 = () => {
    let newTop3 = { keyword: '', searchVolume: 0, proof: '' };
    const getKeyword = (currentVal = '') => {
      openModal('Add Top 3 Keyword', 'Enter the keyword.', (keyword) => {
        if (!keyword) { closeModal(); return; }
        newTop3.keyword = keyword;
        getSearchVolume(newTop3.searchVolume);
      }, closeModal, 'Top 3 Keyword', currentVal);
    };

    const getSearchVolume = (currentVal = '') => {
      openModal('Search Volume', 'Enter the search volume.', (volume) => {
        newTop3.searchVolume = Number(volume || 0);
        getProof(newTop3.proof);
      }, closeModal, 'Search Volume', currentVal);
    };

    const getProof = (currentVal = '') => {
      openModal('Proof URL', 'Enter the proof URL (Drive/SERP).', (proof) => {
        newTop3.proof = proof;
        setTop3(list => [...list, newTop3]);
        closeModal();
      }, closeModal, 'Proof URL', currentVal);
    };

    getKeyword();
  };
  const trafDelta = (client.seo_trafficThis || 0) - (isNewClient ? (client.seo_trafficPrev || 0) : (prevClient.seo_trafficThis || 0));
  const llmDelta = (client.seo_llmTrafficThis || 0) - (isNewClient ? (client.seo_llmTrafficPrev || 0) : (prevClient.seo_llmTrafficThis || 0));
  const leadsDelta = (client.seo_leadsThis || 0) - (isNewClient ? (client.seo_leadsPrev || 0) : (prevClient.seo_leadsThis || 0));
  const localCallsDelta = (client.seo_localCallsThis || 0) - (isNewClient ? (client.seo_localCallsPrev || 0) : (prevClient.seo_localCallsThis || 0));
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      {isNewClient ? (
        <NumField label={`Organic Traffic (${monthLabel(monthPrev)})`} value={client.seo_trafficPrev || 0} onChange={v => onChange({ ...client, seo_trafficPrev: v })} />
      ) : (
        <PrevValue label={`Organic Traffic (${monthLabel(monthPrev)})`} value={prevClient.seo_trafficThis || 0} />
      )}
      <NumField label={`Organic Traffic (${monthLabel(monthThis)})`} value={client.seo_trafficThis || 0} onChange={v => onChange({ ...client, seo_trafficThis: v })} />
      {isNewClient ? (
        <NumField label={`LLM/AI Overview Traffic (${monthLabel(monthPrev)})`} value={client.seo_llmTrafficPrev || 0} onChange={v => onChange({ ...client, seo_llmTrafficPrev: v })} />
      ) : (
        <PrevValue label={`LLM/AI Overview Traffic (${monthLabel(monthPrev)})`} value={prevClient.seo_llmTrafficThis || 0} />
      )}
      <NumField label={`LLM/AI Overview Traffic (${monthLabel(monthThis)})`} value={client.seo_llmTrafficThis || 0} onChange={v => onChange({ ...client, seo_llmTrafficThis: v })} />
      {isNewClient ? (
        <NumField label={`Leads from SEO (${monthLabel(monthPrev)})`} value={client.seo_leadsPrev || 0} onChange={v => onChange({ ...client, seo_leadsPrev: v })} />
      ) : (
        <PrevValue label={`Leads from SEO (${monthLabel(monthPrev)})`} value={prevClient.seo_leadsThis || 0} />
      )}
      <NumField label={`Leads from SEO (${monthLabel(monthThis)})`} value={client.seo_leadsThis || 0} onChange={v => onChange({ ...client, seo_leadsThis: v })} />
      <NumField label="# Keywords Improved (this)" value={client.seo_kwImprovedThis || 0} onChange={v => onChange({ ...client, seo_kwImprovedThis: v })} />
      <NumField label="# AI Overviews / LLM (this)" value={client.seo_aiOverviewThis || 0} onChange={v => onChange({ ...client, seo_aiOverviewThis: v })} />
      {isNewClient ? (
        <NumField label={`Local SEO Calls (${monthLabel(monthPrev)})`} value={client.seo_localCallsPrev || 0} onChange={v => onChange({ ...client, seo_localCallsPrev: v })} />
      ) : (
        <PrevValue label={`Local SEO Calls (${monthLabel(monthPrev)})`} value={prevClient.seo_localCallsThis || 0} />
      )}
      <NumField label={`Local SEO Calls (${monthLabel(monthThis)})`} value={client.seo_localCallsThis || 0} onChange={v => onChange({ ...client, seo_localCallsThis: v })} />
      <ProofField label="Traffic/GA4 proof" value={client.seo_trafficProof} onChange={(v) => onChange({ ...client, seo_trafficProof: v })} />
      <ProofField label="AI Overview proof" value={client.seo_aiOverviewProof} onChange={(v) => onChange({ ...client, seo_aiOverviewProof: v })} />
      <div className="md:col-span-4 text-xs text-gray-600">MoM Δ — Organic: {trafDelta} {isNewClient ? '' : prevClient.seo_trafficThis ? '(' + round1((trafDelta / prevClient.seo_trafficThis) * 100) + '%)' : ''} • LLM: {llmDelta} • SEO Leads: {leadsDelta} • Local Calls: {localCallsDelta}</div>

      <div className="md:col-span-4">
        <div className="flex items-center justify-between">
          <label className="text-sm">Keywords Worked (with Location & Volume)</label>
          <button className="text-xs px-2 py-1 bg-blue-600 text-white rounded-lg" onClick={addKw}>+ Add Keyword</button>
        </div>
        <div className="mt-2 space-y-1">
          {kw.map((k, i) => (
            <div key={i} className="text-xs flex items-center justify-between border rounded-lg p-2 gap-2">
              <div className="truncate"><b>{k.keyword}</b> • {k.location || '—'} • SV {k.searchVolume} • Rank {k.rankPrev || "-"}→{k.rankNow || "-"} • <a className="underline" href={k.proof || '#'} target="_blank" rel="noreferrer">proof</a></div>
              <button className="text-red-600" onClick={() => setKw(list => list.filter((_, idx) => idx !== i))}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      <div className="md:col-span-4">
        <div className="flex items-center justify-between">
          <label className="text-sm">Keywords Ranking in Top 3 (with Volume)</label>
          <button className="text-xs px-2 py-1 bg-blue-600 text-white rounded-lg" onClick={addTop3}>+ Add Top-3 Keyword</button>
        </div>
        <div className="mt-2 space-y-1">
          {top3.map((k, i) => (
            <div key={i} className="text-xs flex items-center justify-between border rounded-lg p-2 gap-2">
              <div className="truncate"><b>{k.keyword}</b> • SV {k.searchVolume} • <a className="underline" href={k.proof || '#'} target="_blank" rel="noreferrer">proof</a></div>
              <button className="text-red-600" onClick={() => setTop3(list => list.filter((_, idx) => idx !== i))}>Remove</button>
            </div>
          ))}
        </div>
      </div>

      {/* Additional SEO KPIs */}
      <div className="md:col-span-4 bg-green-50 rounded-lg p-4 mt-4">
        <h4 className="font-medium text-green-800 mb-3">🔍 Advanced SEO Metrics</h4>
        <div className="grid md:grid-cols-4 gap-3">
          <NumField label="Core Web Vitals Score (1-100)" value={client.seo_coreWebVitals || 0} onChange={v => onChange({ ...client, seo_coreWebVitals: v })} />
          <NumField label="Backlinks Acquired" value={client.seo_backlinks || 0} onChange={v => onChange({ ...client, seo_backlinks: v })} />
          <NumField label="Technical Issues Fixed" value={client.seo_technicalFixes || 0} onChange={v => onChange({ ...client, seo_technicalFixes: v })} />
          <NumField label="Content Pieces Published" value={client.seo_contentPublished || 0} onChange={v => onChange({ ...client, seo_contentPublished: v })} />
          <NumField label="Local Citations Built" value={client.seo_localCitations || 0} onChange={v => onChange({ ...client, seo_localCitations: v })} />
          <NumField label="Schema Markup Implemented" value={client.seo_schemaMarkup || 0} onChange={v => onChange({ ...client, seo_schemaMarkup: v })} />
          <NumField label="Page Speed Score (1-100)" value={client.seo_pageSpeed || 0} onChange={v => onChange({ ...client, seo_pageSpeed: v })} />
          <NumField label="Mobile Usability Score (1-100)" value={client.seo_mobileUsability || 0} onChange={v => onChange({ ...client, seo_mobileUsability: v })} />
        </div>
      </div>
    </div>
  );
}

function KPIsOperationsHead({ client, onChange }) {
  const scopeOptions = ["Social Media", "SEO", "Ads"];
  const statusOptions = ["Active", "Upgraded", "Left", "Reduced"];
  const [appDraft, setAppDraft] = useState({ url: '', remark: '' });
  const [escDraft, setEscDraft] = useState({ url: '', remark: '' });
  const openModal = useModal();

  const addAppreciation = () => {
    if (appDraft.url && !isDriveUrl(appDraft.url)) {
      openModal('Invalid Link', 'Use Google Drive link for proof.');
      return;
    }
    const item = { id: uid(), url: appDraft.url || '', remark: appDraft.remark || '' };
    const newApps = [...(client.op_appreciations || []), item];
    onChange({ ...client, op_appreciations: newApps });
    setAppDraft({ url: '', remark: '' });
  };

  const addEscalation = () => {
    if (escDraft.url && !isDriveUrl(escDraft.url)) {
      openModal('Invalid Link', 'Use Google Drive link for proof.');
      return;
    }
    const item = { id: uid(), url: escDraft.url || '', why: escDraft.remark || '' };
    const newEscs = [...(client.op_escalations || []), item];
    onChange({ ...client, op_escalations: newEscs });
    setEscDraft({ url: '', remark: '' });
  };

  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      <TextField label="Client Name" value={client.name} onChange={v => onChange({ ...client, name: v })} />
      <MultiSelect
        options={scopeOptions}
        selected={client.op_clientScope || []}
        onChange={v => onChange({ ...client, op_clientScope: v })}
        placeholder="Select Scope"
      />
      <NumField label="Client Satisfaction (1-10)" value={client.op_satisfactionScore || 0} onChange={v => onChange({ ...client, op_satisfactionScore: v })} />
      <div>
        <label className="text-sm">Client Payment Date</label>
        <input type="date" className="w-full border rounded-xl p-2" value={client.op_paymentDate || ''} onChange={e => onChange({ ...client, op_paymentDate: e.target.value })} />
      </div>

      <div className="col-span-4">
        <label className="text-sm">Team Finished Scope?</label>
        <input type="checkbox" checked={client.op_teamFinishedScope || false} onChange={e => onChange({ ...client, op_teamFinishedScope: e.target.checked })} />
      </div>

      <div className="col-span-2">
        <label className="text-sm">Client Status</label>
        <select className="w-full border rounded-xl p-2" value={client.op_clientStatus || 'Active'} onChange={e => onChange({ ...client, op_clientStatus: e.target.value })}>
          {statusOptions.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      {(client.op_clientStatus === 'Upgraded' || client.op_clientStatus === 'Left' || client.op_clientStatus === 'Reduced') && (
        <TextArea label="Reason for status change" value={client.op_clientStatusReason || ''} onChange={v => onChange({ ...client, op_clientStatusReason: v })} rows={2} className="col-span-2" />
      )}

      <TextArea label="Who Performed Well/Poorly" value={client.op_performanceRemarks || ''} onChange={v => onChange({ ...client, op_performanceRemarks: v })} rows={3} className="col-span-2" />
      <TextArea label="Things to do differently next month" value={client.op_comingMonthActions || ''} onChange={v => onChange({ ...client, op_comingMonthActions: v })} rows={3} className="col-span-2" />

      <div className="md:col-span-2">
        <div className="font-medium">Appreciations</div>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <input className="border rounded-xl p-2 col-span-2" placeholder="Proof link (Drive/WhatsApp in Drive) – optional" value={appDraft.url} onChange={e => setAppDraft(d => ({ ...d, url: e.target.value }))} />
          <input className="border rounded-xl p-2" placeholder="Remark (client/channel)" value={appDraft.remark} onChange={e => setAppDraft(d => ({ ...d, remark: e.target.value }))} />
          <button className="col-span-3 rounded-xl bg-emerald-600 text-white px-3 py-2" onClick={addAppreciation}>+ Add Appreciation</button>
        </div>
      </div>
      <div className="md:col-span-2">
        <div className="font-medium">Escalations</div>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <input className="border rounded-xl p-2 col-span-2" placeholder="Proof link (Drive) – optional" value={escDraft.url} onChange={e => setEscDraft(d => ({ ...d, url: e.target.value }))} />
          <input className="border rounded-xl p-2" placeholder="Why did this happen?" value={escDraft.remark} onChange={e => setEscDraft(d => ({ ...d, remark: e.target.value }))} />
          <button className="col-span-3 rounded-xl bg-red-600 text-white px-3 py-2" onClick={addEscalation}>+ Add Escalation</button>
        </div>
      </div>
    </div>
  );
}

/*****************************
 * Client Report Status block *
 *****************************/
function ClientReportStatus({ client, prevClient, onChange }) {
  const rel = client.relationship || { roadmapSentDate: '', reportSentDate: '', meetings: [], appreciations: [], escalations: [], clientSatisfaction: 0, paymentReceived: false, paymentDate: '' };
  const prevRel = prevClient.relationship || {};
  const [meetDraft, setMeetDraft] = useState({ date: '', summary: '', notesLink: '' });
  const [appDraft, setAppDraft] = useState({ url: '', remark: '' });
  const [escDraft, setEscDraft] = useState({ url: '', remark: '' });
  const openModal = useModal();

  function addMeeting() { if (!meetDraft.date || !meetDraft.summary) return; if (meetDraft.notesLink && !isDriveUrl(meetDraft.notesLink)) { openModal('Invalid Link', 'Notes link must be a Google Drive/Docs URL.'); return; } onChange({ ...client, relationship: { ...rel, meetings: [...(rel.meetings || []), { id: uid(), ...meetDraft }] } }); setMeetDraft({ date: '', summary: '', notesLink: '' }); }
  function addAppreciation() { if (appDraft.url && !isDriveUrl(appDraft.url)) { openModal('Invalid Link', 'Use Google Drive link for proof.'); return; } const item = { id: uid(), url: appDraft.url || '', remark: appDraft.remark || '' }; onChange({ ...client, relationship: { ...rel, appreciations: [...(rel.appreciations || []), item] } }); setAppDraft({ url: '', remark: '' }); }
  function addEscalation() { if (escDraft.url && !isDriveUrl(escDraft.url)) { openModal('Invalid Link', 'Use Google Drive link for proof.'); return; } const item = { id: uid(), url: escDraft.url || '', why: escDraft.remark || '' }; onChange({ ...client, relationship: { ...rel, escalations: [...(rel.escalations || []), item] } }); setEscDraft({ url: '', remark: '' }); }

  return (
    <div className="mt-4 border-t pt-3">
      <div className="font-medium mb-2">Client Report Status</div>
      <div className="grid md:grid-cols-4 gap-3">
        <div>
          <label className="text-sm">Roadmap Sent Date</label>
          <input type="date" className="w-full border rounded-xl p-2" value={rel.roadmapSentDate || ''} onChange={e => onChange({ ...client, relationship: { ...rel, roadmapSentDate: e.target.value } })} />
          {prevRel.roadmapSentDate && <div className="text-xs text-gray-500 mt-1">Prev: {toDDMMYYYY(prevRel.roadmapSentDate)}</div>}
        </div>
        <div>
          <label className="text-sm">Report Sent Date</label>
          <input type="date" className="w-full border rounded-xl p-2" value={rel.reportSentDate || ''} onChange={e => onChange({ ...client, relationship: { ...rel, reportSentDate: e.target.value } })} />
          {prevRel.reportSentDate && <div className="text-xs text-gray-500 mt-1">Prev: {toDDMMYYYY(prevRel.reportSentDate)}</div>}
        </div>
        <div>
          <label className="text-sm">Client Satisfaction (1–10)</label>
          <input type="number" min={1} max={10} className="w-full border rounded-xl p-2" value={rel.clientSatisfaction || 0} onChange={e => onChange({ ...client, relationship: { ...rel, clientSatisfaction: Number(e.target.value || 0) } })} />
          {prevRel.clientSatisfaction > 0 && <div className="text-xs text-gray-500 mt-1">Prev: {prevRel.clientSatisfaction}</div>}
        </div>
        <div className="md:col-span-1 flex items-end gap-2">
          <label className="text-sm mr-2">Payment Received?</label>
          <input type="checkbox" checked={!!rel.paymentReceived} onChange={e => onChange({ ...client, relationship: { ...rel, paymentReceived: e.target.checked } })} />
        </div>
        <div>
          <label className="text-sm">Payment Date</label>
          <input type="date" className="w-full border rounded-xl p-2" value={rel.paymentDate || ''} onChange={e => onChange({ ...client, relationship: { ...rel, paymentDate: e.target.value } })} />
          {prevRel.paymentDate && <div className="text-xs text-gray-500 mt-1">Prev: {toDDMMYYYY(prevRel.paymentDate)}</div>}
        </div>

        <div className="col-span-4">
          <NumField label="Client Interactions (messages/mails)" value={client.clientInteractions || 0} onChange={v => onChange({ ...client, clientInteractions: v })} />
          {prevClient.clientInteractions > 0 && <div className="text-xs text-gray-500 mt-1">Prev: {prevClient.clientInteractions}</div>}
        </div>

        <div className="md:col-span-4">
          <div className="font-medium">Meetings</div>
          <div className="grid md:grid-cols-4 gap-3 mt-1">
            <div>
              <label className="text-sm">Date</label>
              <input type="date" className="border rounded-xl p-2 w-full" value={meetDraft.date} onChange={e => setMeetDraft(d => ({ ...d, date: e.target.value }))} />
            </div>
            <input className="border rounded-xl p-2" placeholder="Summary of discussion" value={meetDraft.summary} onChange={e => setMeetDraft(d => ({ ...d, summary: e.target.value }))} />
            <input className="border rounded-xl p-2" placeholder="Notes link (Drive/Doc)" value={meetDraft.notesLink} onChange={e => setMeetDraft(d => ({ ...d, notesLink: e.target.value }))} />
            <button className="rounded-xl bg-blue-600 text-white px-3" onClick={addMeeting}>Add Meeting</button>
          </div>
          <ul className="text-xs mt-2 space-y-1">
            {(rel.meetings || []).map(m => (
              <li key={m.id} className="border rounded-lg p-2 flex items-center justify-between">
                <div>{toDDMMYYYY(m.date)} • {m.summary} {m.notesLink && (<a className="underline ml-2" href={m.notesLink} target="_blank" rel="noreferrer">notes</a>)}</div>
                <button className="text-red-600" onClick={() => onChange({ ...client, relationship: { ...rel, meetings: (rel.meetings || []).filter(x => x.id !== m.id) } })}>Remove</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <div className="font-medium">Appreciations</div>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <input className="border rounded-xl p-2 col-span-2" placeholder="Proof link (Drive/WhatsApp in Drive) – optional" value={appDraft.url} onChange={e => setAppDraft(d => ({ ...d, url: e.target.value }))} />
            <input className="border rounded-xl p-2" placeholder="Remark (client/channel)" value={appDraft.remark} onChange={e => setAppDraft(d => ({ ...d, remark: e.target.value }))} />
            <button className="col-span-3 rounded-xl bg-emerald-600 text-white px-3 py-2" onClick={addAppreciation}>+ Add Appreciation</button>
          </div>
          <ul className="text-xs mt-2 space-y-1">
            {(rel.appreciations || []).map(a => (
              <li key={a.id} className="border rounded-lg p-2 flex items-center justify-between">
                <div className="truncate">{a.remark || '—'} {a.url && (<a className="underline ml-2" href={a.url} target="_blank" rel="noreferrer">proof</a>)}</div>
                <button className="text-red-600" onClick={() => onChange({ ...client, relationship: { ...rel, appreciations: (rel.appreciations || []).filter(x => x.id !== a.id) } })}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2">
          <div className="font-medium">Escalations</div>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <input className="border rounded-xl p-2 col-span-2" placeholder="Proof link (Drive) – optional" value={escDraft.url} onChange={e => setEscDraft(d => ({ ...d, url: e.target.value }))} />
            <input className="border rounded-xl p-2" placeholder="Why did this happen?" value={escDraft.remark} onChange={e => setEscDraft(d => ({ ...d, remark: e.target.value }))} />
            <button className="col-span-3 rounded-xl bg-red-600 text-white px-3 py-2" onClick={addEscalation}>+ Add Escalation</button>
          </div>
          <ul className="text-xs mt-2 space-y-1">
            {(rel.escalations || []).map(a => (
              <li key={a.id} className="border rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div className="truncate">{a.why || '—'} {a.url && (<a className="underline ml-2" href={a.url} target="_blank" rel="noreferrer">proof</a>)}</div>
                  <button className="text-red-600" onClick={() => onChange({ ...client, relationship: { ...rel, escalations: (rel.escalations || []).filter(x => x.id !== a.id) } })}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}


/*****************
 * Learning Block *
 *****************/
function LearningBlock({ model, setModel, openModal }) {
  const [draft, setDraft] = useState({ title: '', link: '', durationMins: 0, learned: '', applied: '' });
  const total = (model.learning || []).reduce((s, e) => s + (e.durationMins || 0), 0);
  function addEntry() {
    if (!draft.title || !draft.link || !draft.durationMins) {
      openModal('Missing Information', 'Please fill in the title, link, and duration to add a learning entry.', () => { });
      return;
    }
    const entry = { id: uid(), ...draft };
    setModel(m => ({ ...m, learning: [...m.learning, entry] }));
    setDraft({ title: '', link: '', durationMins: 0, learned: '', applied: '' });
  }
  return (
    <Section
      title="Learning (min 6 hours = 360 mins; proofs required)"
      number="3"
      info="Document your learning activities for the month. You must complete at least 6 hours (360 minutes) of learning. Include courses, certifications, workshops, or skill development. Provide proof links to validate your learning efforts."
    >
      <div className="grid md:grid-cols-4 gap-3">
        <TextField label="Title / Topic" value={draft.title} onChange={v => setDraft(d => ({ ...d, title: v }))} />
        <TextField label="Link (YouTube/Course/Doc)" value={draft.link} onChange={v => setDraft(d => ({ ...d, link: v }))} />
        <NumField label="Duration (mins)" value={draft.durationMins} onChange={v => setDraft(d => ({ ...d, durationMins: v }))} />
        <button className="bg-blue-600 text-white rounded-xl px-3 self-end py-2" onClick={addEntry}>Add</button>
        <TextArea className="md:col-span-2" label="What did you learn (key points)" rows={3} value={draft.learned} onChange={v => setDraft(d => ({ ...d, learned: v }))} />
        <TextArea className="md:col-span-2" label="How did you apply it in work?" rows={3} value={draft.applied} onChange={v => setDraft(d => ({ ...d, applied: v }))} />
      </div>
      <div className="mt-2 text-sm">Total this month: <b>{(total / 60).toFixed(1)} hours</b> {total < 360 && <span className="text-red-600">(below 6h)</span>}</div>
      <ul className="mt-2 space-y-1 text-xs">
        {(model.learning || []).map(item => (
          <li key={item.id} className="border rounded-lg p-2 flex items-center justify-between">
            <div className="truncate"><b>{item.title}</b> • {item.durationMins}m • <a className="underline" href={item.link} target="_blank" rel="noreferrer">link</a></div>
            <button className="text-red-600" onClick={() => setModel(m => ({ ...m, learning: m.learning.filter(x => x.id !== item.id) }))}>Remove</button>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/*******************
 * Internal KPIs    *
 *******************/
function InternalKPIs({ model, prevModel, setModel, monthPrev, monthThis }) {
  const dept = model.employee.department;
  const c = (model.clients[0] || { id: uid(), name: dept + " Internal" });
  const prevC = (prevModel?.clients[0] || {});
  function merge(p) { setModel(m => { const first = m.clients[0] ? { ...m.clients[0], ...p } : { ...c, ...p }; const rest = m.clients.slice(1); return { ...m, clients: [first, ...rest] }; }); }
  return (
    <div className="grid md:grid-cols-4 gap-3">
      {dept === 'HR' && (
        <>
          <NumField label="# Candidates Screened" value={c.hr_screened || 0} onChange={v => merge({ hr_screened: v })} />
          <PrevValue label={`# New Hires Done (${monthLabel(monthPrev)})`} value={prevC.hr_hiresThis || 0} />
          <NumField label={`# New Hires Done (${monthLabel(monthThis)})`} value={c.hr_hiresThis || 0} onChange={v => merge({ hr_hiresThis: v })} />
          <NumField label="# Engagement Activities" value={c.hr_engagements || 0} onChange={v => merge({ hr_engagements: v })} />
          <TextArea className="md:col-span-4" label="Employee Resolutions (Hurdles & Resolutions)" rows={3} value={c.hr_resolutions || ""} onChange={v => merge({ hr_resolutions: v })} />
          <h4 className="font-semibold text-sm col-span-4 mt-2">Candidate Pipeline</h4>
          <NumField label="Screening" value={c.hr_pipeline_screening || 0} onChange={v => merge({ hr_pipeline_screening: v })} />
          <NumField label="Shortlisting" value={c.hr_pipeline_shortlisting || 0} onChange={v => merge({ hr_pipeline_shortlisting: v })} />
          <NumField label="Interviews Conducted" value={c.hr_pipeline_interviews || 0} onChange={v => merge({ hr_pipeline_interviews: v })} />
        </>
      )}
      {dept === 'Accounts' && (
        <>
          <h4 className="font-semibold text-sm col-span-4 mt-2">Client Payments</h4>
          <NumField label="New Client Onboarding (Count)" value={c.ac_newOnboardings || 0} onChange={v => merge({ ac_newOnboardings: v })} />
          <PrevValue label={`Collections % (${monthLabel(monthPrev)})`} value={prevC.ac_collectionsPctThis || 0} />
          <NumField label={`Collections % (${monthLabel(monthThis)})`} value={c.ac_collectionsPctThis || 0} onChange={v => merge({ ac_collectionsPctThis: v })} />
          <h4 className="font-semibold text-sm col-span-4 mt-2">Compliance</h4>
          <div className="flex items-center gap-2">
            <label className="text-sm">GST Filed?</label>
            <input type="checkbox" checked={!!c.ac_gstDone} onChange={e => merge({ ac_gstDone: e.target.checked })} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">TDS Filed?</label>
            <input type="checkbox" checked={!!c.ac_tdsDone} onChange={e => merge({ ac_tdsDone: e.target.checked })} />
          </div>
        </>
      )}
      {dept === 'Sales' && (
        <>
          <PrevValue label={`New Revenue (₹) ${monthLabel(monthPrev)}`} value={prevC.sa_revenueThis || 0} />
          <NumField label={`New Revenue (₹) ${monthLabel(monthThis)}`} value={c.sa_revenueThis || 0} onChange={v => merge({ sa_revenueThis: v })} />
          <PrevValue label={`Conversion % (${monthLabel(monthPrev)})`} value={prevC.sa_conversionRateThis || 0} />
          <NumField label={`Conversion % (${monthLabel(monthThis)}`} value={c.sa_conversionRateThis || 0} onChange={v => merge({ sa_conversionRateThis: v })} />
          <PrevValue label={`Pipeline (#) ${monthLabel(monthPrev)}`} value={prevC.sa_pipelineThis || 0} />
          <NumField label={`Pipeline (#) ${monthLabel(monthThis)}`} value={c.sa_pipelineThis || 0} onChange={v => merge({ sa_pipelineThis: v })} />
          <PrevValue label={`AI Upsell Value (₹) ${monthLabel(monthPrev)}`} value={prevC.sa_aiUpsellValueThis || 0} />
          <NumField label={`AI Upsell Value (₹) ${monthLabel(monthThis)}`} value={c.sa_aiUpsellValueThis || 0} onChange={v => merge({ sa_aiUpsellValueThis: v })} />
          <NumField label={`Next Month Projection (₹)`} value={c.sa_projectionNext || 0} onChange={v => merge({ sa_projectionNext: v })} />
        </>
      )}
      {dept === 'Blended (HR + Sales)' && (
        <>
          <div className="md:col-span-4 text-xs text-gray-600">Blended role: fill HR metrics first, then Sales metrics.</div>
          {/* HR */}
          <PrevValue label={`(HR) Hires (${monthLabel(monthPrev)})`} value={prevC.hr_hiresThis || 0} />
          <NumField label={`(HR) Hires (${monthLabel(monthThis)})`} value={c.hr_hiresThis || 0} onChange={v => merge({ hr_hiresThis: v })} />
          {/* Sales */}
          <PrevValue label={`(Sales) New Revenue (₹) ${monthLabel(monthPrev)}`} value={prevC.sa_revenueThis || 0} />
          <NumField label={`(Sales) New Revenue (₹) ${monthLabel(monthThis)}`} value={c.sa_revenueThis || 0} onChange={v => merge({ sa_revenueThis: v })} />
        </>
      )}
    </div>
  );
}

/********************
 * Shared UI bits    *
 ********************/
function Section({ title, children, number, info }) {
  return (
    <section className="my-6 sm:my-8">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
        {number && (
          <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            {number}
          </span>
        )}
        {!number && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
        {title}
        {info && <InfoTooltip content={info} />}
      </h2>
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-lg shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-100/60 transition-shadow duration-300">
        {children}
      </div>
    </section>
  );
}
function TextField({ label, value, onChange, placeholder, className, info, disabled = false }) {
  return (
    <div className={className || ''}>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
        {label}
        {info && <InfoTooltip content={info} />}
      </label>
      <input
        className={`w-full border border-gray-300 rounded-xl p-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 touch-manipulation ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
        }`}
        placeholder={placeholder || ""}
        value={value || ""}
        onChange={e => disabled ? null : onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
function NumField({ label, value, onChange, className, info, disabled = false }) {
  return (
    <div className={className || ''}>
      <label className="text-sm flex items-center mb-1">
        {label}
        {info && <InfoTooltip content={info} />}
      </label>
      <input 
        type="number" 
        inputMode="numeric"
        pattern="[0-9]*"
        className={`w-full border rounded-xl p-3 text-base touch-manipulation ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
        }`}
        value={Number(value || 0)} 
        onChange={e => disabled ? null : onChange(Number(e.target.value || 0))}
        disabled={disabled}
      />
    </div>
  );
}
function TextArea({ label, value, onChange, rows = 4, className, placeholder, disabled = false }) {
  return (
    <div className={className || ''}>
      <label className="text-sm block mb-2">{label}</label>
      <textarea 
        className={`w-full border rounded-xl p-3 text-base resize-y touch-manipulation ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
        }`}
        rows={rows} 
        placeholder={placeholder || ""} 
        value={value || ""} 
        onChange={e => disabled ? null : onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}

function TinyLinks({ items, onAdd, onRemove }) {
  const [draft, setDraft] = useState({ label: '', url: '' });
  const { openModal, closeModal } = useModal();
  function add() {
    if (!draft.url) return;
    if (!isDriveUrl(draft.url) && !isGensparkUrl(draft.url)) {
      openModal('Invalid Link', 'Please paste a Google Drive/Docs or Genspark URL link.', closeModal);
      return;
    }
    onAdd({ id: uid(), label: draft.label || 'Link', url: draft.url });
    setDraft({ label: '', url: '' });
  }
  return (
    <div>
      <div className="flex gap-2">
        <input className="flex-1 border rounded-lg p-2" placeholder="Scope of Work" value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} />
        <input className="flex-[2] border rounded-lg p-2" placeholder="Google Drive or Genspark URL (view access)" value={draft.url} onChange={e => setDraft(d => ({ ...d, url: e.target.value }))} />
        <button className="px-3 rounded-lg bg-blue-600 text-white" onClick={add}>Add</button>
      </div>
      <ul className="mt-2 space-y-1 text-xs">
        {(items || []).map(it => (
          <li key={it.id} className="border rounded-lg p-2 flex items-center justify-between">
            <div className="truncate"><b>{it.label}</b> • <a className="underline" href={it.url} target="_blank" rel="noreferrer">open</a></div>
            <button className="text-red-600" onClick={() => onRemove(it.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/*******************
 * Login Component *
 *******************/
function LoginForm({ loginForm, setLoginForm, onLogin, loginError }) {
  const switchUserType = (userType) => {
    setLoginForm(prev => ({ ...prev, userType, name: '', phone: '' }));
    window.location.hash = userType === 'manager' ? '#/manager' : '#/employee';
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔑</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </div>

        {/* User Type Selector */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <button
            onClick={() => switchUserType('employee')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-all duration-200 ${
              loginForm.userType === 'employee'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            👥 Employee
          </button>
          <button
            onClick={() => switchUserType('manager')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-all duration-200 ${
              loginForm.userType === 'manager'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📋 Manager
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={onLogin} className="mt-8 space-y-6">
          <div className="space-y-4">
            {loginForm.userType === 'employee' ? (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your full name"
                    value={loginForm.name}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number (Password)
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your phone number"
                    value={loginForm.phone}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use the phone number you registered with
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="adminToken" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Access Token
                </label>
                <input
                  id="adminToken"
                  type="password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter admin access token"
                  value={loginForm.phone}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            )}
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 flex items-start gap-3">
              <div className="text-red-600 flex-shrink-0 mt-0.5">⚠️</div>
              <div className="text-sm text-red-700 leading-relaxed">{loginError}</div>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-3 sm:py-3 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 touch-manipulation"
          >
            Sign In
          </button>
        </form>

        {loginForm.userType === 'employee' && (
          <div className="text-center px-4">
            <p className="text-sm text-gray-500 leading-relaxed">
              New employee? Contact your manager to get registered.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**********************
 * Manager Dashboard  *
 **********************/

/********************************
 * Employee Personal Dashboard *
 ********************************/
function EmployeePersonalDashboard({ employee, onBack }) {
  const { allSubmissions, loading } = useFetchSubmissions();
  const { openModal, closeModal } = useModal();

  // Filter submissions for this employee
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
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-lg sm:text-2xl font-bold flex-shrink-0">
              {employee.name.charAt(0).toUpperCase()}
            </div>
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

      {/* Current Month Status */}
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

      {/* Overall Statistics */}
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

      {/* Performance Breakdown */}
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

      {/* Submission History */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Submission History</h3>
        {employeeSubmissions.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📊</div>
            <p className="text-sm sm:text-base text-gray-600 px-4">No submissions yet. Submit your first monthly report to see your progress here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {employeeSubmissions.map((submission, index) => (
              <div key={submission.id || index} className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base ${
                    submission.isDraft ? 'bg-orange-500' : 'bg-green-500'
                  }`}>
                    {submission.isDraft ? '📋' : '✓'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm sm:text-base truncate">{monthLabel(submission.monthKey)}</div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      {submission.isDraft ? 'Draft' : 'Submitted'} • Score: {submission.scores?.overall?.toFixed(1) || 'N/A'}/10
                    </div>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-500 flex-shrink-0">
                  <span className="hidden sm:inline">{new Date(submission.created_at || submission.updated_at).toLocaleDateString()}</span>
                  <span className="sm:hidden">{new Date(submission.created_at || submission.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/***************************
 * Employee Report Dashboard *
 ***************************/
function EmployeeReportDashboard({ employeeName, employeePhone, onBack }) {
  const { allSubmissions, loading } = useFetchSubmissions();
  const { openModal, closeModal } = useModal();
  const [selectedReportId, setSelectedReportId] = useState(null);

  // Simple test to verify component is rendering
  if (!employeeName) {
    return <div className="p-8 text-red-600">Error: No employee name provided</div>;
  }


  const employeeSubmissions = useMemo(() => {

    // Primary filter: match by name (case-insensitive and trimmed)
    const filtered = allSubmissions.filter(s => {
      const submissionName = (s.employee?.name || '').trim().toLowerCase();
      const searchName = (employeeName || '').trim().toLowerCase();
      const nameMatch = submissionName === searchName;
      
      return nameMatch;
    }).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    return filtered;
  }, [allSubmissions, employeePhone, employeeName]);

  const selectedReport = useMemo(() => {
    return employeeSubmissions.find(s => s.id === selectedReportId) || null;
  }, [employeeSubmissions, selectedReportId]);

  const yearlySummary = useMemo(() => {
    if (!employeeSubmissions.length) {
      return null;
    }

    let totalKpi = 0;
    let totalLearning = 0;
    let totalRelationship = 0;
    let totalOverall = 0;
    let monthsWithLearningShortfall = 0;

    employeeSubmissions.forEach(s => {
      totalKpi += s.scores?.kpiScore || 0;
      totalLearning += s.scores?.learningScore || 0;
      totalRelationship += s.scores?.relationshipScore || 0;
      totalOverall += s.scores?.overall || 0;
      if ((s.learning || []).reduce((sum, e) => sum + (e.durationMins || 0), 0) < 360) {
        monthsWithLearningShortfall++;
      }
    });

    const totalMonths = employeeSubmissions.length;
    const avgKpi = round1(totalKpi / totalMonths);
    const avgLearning = round1(totalLearning / totalMonths);
    const avgRelationship = round1(totalRelationship / totalMonths);
    const avgOverall = round1(totalOverall / totalMonths);

    return {
      avgKpi,
      avgLearning,
      avgRelationship,
      avgOverall,
      totalMonths,
      monthsWithLearningShortfall
    };
  }, [employeeSubmissions]);

  useEffect(() => {
    // Automatically select the most recent report when the page loads
    if (employeeSubmissions.length > 0) {
      setSelectedReportId(employeeSubmissions[employeeSubmissions.length - 1].id);
    }
  }, [employeeSubmissions]);

  if (loading) {
    return <div className="text-center p-8">Loading employee report...</div>;
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
              <div><strong>Total Submissions in Database:</strong> {allSubmissions.length}</div>
              <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
            </div>
            
            <h4 className="font-medium text-yellow-800 mt-4 mb-3">Available Employees:</h4>
            <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
              {allSubmissions.length === 0 ? (
                <div className="text-gray-500 italic">No submissions found in database</div>
              ) : (
                allSubmissions.map((s, i) => (
                  <div key={i} className="flex justify-between">
                    <span>"{s.employee?.name}"</span>
                    <span>"{s.employee?.phone || 'No phone'}"</span>
                  </div>
                ))
              )}
            </div>
            
            <h4 className="font-medium text-yellow-800 mt-4 mb-3">Name Matching Test:</h4>
            <div className="text-xs space-y-1">
              {allSubmissions.map((s, i) => {
                const submissionName = (s.employee?.name || '').trim().toLowerCase();
                const searchName = (employeeName || '').trim().toLowerCase();
                const nameMatch = submissionName === searchName;
                return (
                  <div key={i} className={nameMatch ? 'text-green-600' : 'text-red-600'}>
                    "{s.employee?.name}" vs "{employeeName}" = {nameMatch ? 'MATCH' : 'NO MATCH'}
                  </div>
                );
              })}
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
      // Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(formattedReport);
        openModal('Copied', 'The report text has been copied to your clipboard. You can now paste it into a document or email.', closeModal);
      } else {
        // Fallback for older browsers - create a temporary textarea
        const textArea = document.createElement("textarea");
        textArea.value = formattedReport;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        // Use deprecated execCommand as fallback only
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
    const learningShortfall = yearlySummary?.monthsWithLearningShortfall > 0;
    const lowKPIScore = yearlySummary?.avgKpi < 7; // Example threshold
    const lowRelationshipScore = yearlySummary?.avgRelationship < 7; // Example threshold

    let recommendations = [];
    if (learningShortfall) {
      recommendations.push("Focus on dedicating at least 6 hours per month to learning to avoid appraisal delays.");
    }
    if (lowKPIScore) {
      recommendations.push("Review KPI performance to identify areas for improvement and focus on key metrics.");
    }
    if (lowRelationshipScore) {
      recommendations.push("Improve client relationship management by scheduling more regular check-ins and proactively addressing issues.");
    }

    if (recommendations.length === 0) {
      return "No specific recommendations at this time. Keep up the great work!";
    }
    return recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n');
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

          {/* Performance Chart */}
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
            <div className="mt-4">
              <h4 className="font-medium text-gray-700">AI-Generated Summary:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{generateSummary(selectedReport)}</p>
            </div>
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


function clean(s) { return (s || '').toString(); }
function ManagerDashboard({ onViewReport }) {
  const supabase = useSupabase();
  const { allSubmissions, loading, error, refreshSubmissions } = useFetchSubmissions();
  const { openModal, closeModal } = useModal();
  
  // Modern state management
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(thisMonthKey());
  const [dateRange, setDateRange] = useState({ start: thisMonthKey(), end: thisMonthKey() });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    department: 'All',
    performance: 'All',
    status: 'All'
  });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  
  // Manager evaluation
  const [evaluationPanel, setEvaluationPanel] = useState({
    isOpen: false,
    submission: null,
    score: 8,
    comments: '',
    recommendations: ''
  });

  // Process and filter submissions
  const processedData = useMemo(() => {
    if (!allSubmissions.length) return { employees: [], stats: {}, departments: [] };

    // Filter by date range
    const filteredByDate = allSubmissions.filter(sub => 
      sub.monthKey >= dateRange.start && sub.monthKey <= dateRange.end
    );

    // Group by employee
    const employeeGroups = {};
    filteredByDate.forEach(submission => {
      const key = `${submission.employee?.name}-${submission.employee?.phone}`;
      if (!employeeGroups[key]) {
        employeeGroups[key] = {
          name: submission.employee?.name || 'Unknown',
          phone: submission.employee?.phone || 'N/A',
          department: submission.employee?.department || 'Unknown',
          submissions: [],
          latestSubmission: null,
          averageScore: 0,
          totalHours: 0,
          performance: 'Medium'
        };
      }
      employeeGroups[key].submissions.push(submission);
    });

    // Calculate metrics for each employee
    const employees = Object.values(employeeGroups).map(emp => {
      emp.submissions.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
      emp.latestSubmission = emp.submissions[0];
      
      // Calculate averages
      const totalScore = emp.submissions.reduce((sum, sub) => sum + (sub.scores?.overall || 0), 0);
      emp.averageScore = emp.submissions.length ? (totalScore / emp.submissions.length).toFixed(1) : 0;
      
      // Calculate total learning hours
      emp.totalHours = emp.submissions.reduce((total, sub) => {
        return total + ((sub.learning || []).reduce((sum, l) => sum + (l.durationMins || 0), 0) / 60);
      }, 0);
      
      // Determine performance level
      emp.performance = emp.averageScore >= 8 ? 'High' : emp.averageScore >= 6 ? 'Medium' : 'Low';
      
      return emp;
    });

    // Apply filters
    let filteredEmployees = employees.filter(emp => {
      const matchesSearch = !searchQuery || 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDepartment = filters.department === 'All' || emp.department === filters.department;
      const matchesPerformance = filters.performance === 'All' || emp.performance === filters.performance;
      
      return matchesSearch && matchesDepartment && matchesPerformance;
    });

    // Apply sorting
    filteredEmployees.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'score':
          aVal = parseFloat(a.averageScore);
          bVal = parseFloat(b.averageScore);
          break;
        case 'department':
          aVal = a.department;
          bVal = b.department;
          break;
        case 'hours':
          aVal = a.totalHours;
          bVal = b.totalHours;
          break;
        default:
          aVal = a.name;
          bVal = b.name;
      }
      
      if (sortConfig.direction === 'desc') {
        return typeof aVal === 'string' ? bVal.localeCompare(aVal) : bVal - aVal;
      }
      return typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
    });

    // Calculate overall stats
    const stats = {
      totalEmployees: employees.length,
      totalSubmissions: filteredByDate.length,
      averageScore: employees.length ? 
        (employees.reduce((sum, emp) => sum + parseFloat(emp.averageScore), 0) / employees.length).toFixed(1) : 0,
      highPerformers: employees.filter(emp => emp.performance === 'High').length,
      needsAttention: employees.filter(emp => emp.performance === 'Low').length
    };

    // Get unique departments
    const departments = [...new Set(employees.map(emp => emp.department))].sort();

    return { employees: filteredEmployees, stats, departments, allEmployees: employees };
  }, [allSubmissions, dateRange, searchQuery, filters, sortConfig]);

  // Handle employee evaluation
  const openEvaluation = (submission) => {
    setEvaluationPanel({
      isOpen: true,
      submission,
      score: submission.manager?.score || 8,
      comments: submission.manager?.comments || '',
      recommendations: submission.manager?.recommendations || ''
    });
  };

  const saveEvaluation = async () => {
    if (!evaluationPanel.submission || !supabase) return;

    try {
      const updatedSubmission = {
        ...evaluationPanel.submission,
        manager: {
          score: evaluationPanel.score,
          comments: evaluationPanel.comments,
          recommendations: evaluationPanel.recommendations,
          evaluatedAt: new Date().toISOString(),
          evaluatedBy: 'Manager'
        }
      };

      const { error } = await supabase
        .from('submissions')
        .update(updatedSubmission)
        .eq('id', evaluationPanel.submission.id);

      if (error) throw error;

      await refreshSubmissions();
      setEvaluationPanel({ isOpen: false, submission: null, score: 8, comments: '', recommendations: '' });
      openModal('Success', 'Employee evaluation saved successfully!', closeModal);
    } catch (error) {
      console.error('Failed to save evaluation:', error);
      openModal('Error', 'Failed to save evaluation. Please try again.', closeModal);
    }
  };

  // Download functions
  const downloadEmployeePDF = (employee) => {
    const employeeData = employee.submissions;
    const employeeName = employee.name;

    if (!employeeData || employeeData.length === 0) {
      openModal('No Data', `No submissions found for ${employeeName}`, closeModal);
      return;
    }

    // Generate comprehensive HTML report
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Performance Report - ${employeeName}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; line-height: 1.6; color: #1f2937; }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #3b82f6; }
        .header h1 { color: #3b82f6; margin: 0; font-size: 28px; }
        .header h2 { color: #374151; margin: 10px 0; font-size: 24px; }
        .header .meta { color: #6b7280; font-size: 14px; }
        .section { margin: 30px 0; page-break-inside: avoid; }
        .section h3 { color: #374151; border-left: 4px solid #3b82f6; padding-left: 12px; margin-bottom: 15px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; }
        .stat-value { font-size: 32px; font-weight: bold; color: #3b82f6; margin-bottom: 5px; }
        .stat-label { font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .performance-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .performance-table th, .performance-table td { border: 1px solid #d1d5db; padding: 12px; text-align: left; }
        .performance-table th { background: #3b82f6; color: white; font-weight: 600; }
        .score-good { color: #059669; font-weight: bold; }
        .score-medium { color: #d97706; font-weight: bold; }
        .score-poor { color: #dc2626; font-weight: bold; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏢 Branding Pioneers</h1>
        <h2>Employee Performance Report</h2>
        <h2>${employeeName}</h2>
        <div class="meta">
            Department: ${employee.department} | Generated: ${new Date().toLocaleDateString()}
        </div>
    </div>

    <div class="section">
        <h3>📊 Performance Summary</h3>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${employee.averageScore}/10</div>
                <div class="stat-label">Average Score</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${employeeData.length}</div>
                <div class="stat-label">Reports Submitted</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${employee.totalHours.toFixed(1)}h</div>
                <div class="stat-label">Total Learning</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${employee.performance}</div>
                <div class="stat-label">Performance Level</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h3>📈 Monthly Performance</h3>
        <table class="performance-table">
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Overall Score</th>
                    <th>KPI Score</th>
                    <th>Learning Score</th>
                    <th>Learning Hours</th>
                    <th>Manager Notes</th>
                </tr>
            </thead>
            <tbody>
                ${employeeData.map(sub => {
                    const learningHours = ((sub.learning || []).reduce((sum, l) => sum + (l.durationMins || 0), 0) / 60).toFixed(1);
                    const scoreClass = sub.scores?.overall >= 8 ? 'score-good' : sub.scores?.overall >= 6 ? 'score-medium' : 'score-poor';
                    return `
                        <tr>
                            <td><strong>${monthLabel(sub.monthKey)}</strong></td>
                            <td class="${scoreClass}">${sub.scores?.overall || 'N/A'}/10</td>
                            <td>${sub.scores?.kpiScore || 'N/A'}/10</td>
                            <td>${sub.scores?.learningScore || 'N/A'}/10</td>
                            <td>${learningHours}h</td>
                            <td>${sub.manager?.comments || 'No comments'}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>This report was generated by the Branding Pioneers Monthly Tactical System</p>
        <p>For questions about this report, contact your HR department</p>
    </div>
</body>
</html>
    `;

    // Create and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${employeeName.replace(/\\s+/g, '_')}_Performance_Report_${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Bulk export function
  const exportBulkData = () => {
    const csvContent = [
      ['Employee Name', 'Department', 'Phone', 'Average Score', 'Total Hours', 'Performance', 'Latest Month', 'Reports Count'],
      ...processedData.employees.map(emp => [
        emp.name,
        emp.department,
        emp.phone,
        emp.averageScore,
        emp.totalHours.toFixed(1),
        emp.performance,
        emp.latestSubmission?.monthKey || 'N/A',
        emp.submissions.length
      ])
    ].map(row => row.join(',')).join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team_performance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle Full Report - FIXED VERSION
  const handleFullReport = (employee) => {
    console.log('🚀 Opening Full Report for:', employee.name);
    
    if (!employee.submissions || employee.submissions.length === 0) {
      openModal('No Data', `No submissions found for ${employee.name}`, closeModal);
      return;
    }

    // Use the most recent submission's phone number for consistency
    const phoneNumber = employee.phone && employee.phone !== 'N/A' ? employee.phone : 'no-phone';
    
    console.log('📞 Using phone number:', phoneNumber);
    console.log('📊 Submissions count:', employee.submissions.length);
    
    // Call the parent component's onViewReport function
    onViewReport(employee.name, phoneNumber);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading team data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="text-red-600 text-lg mb-2">⚠️ Error Loading Data</div>
        <div className="text-red-700 mb-4">{error}</div>
        <button 
          onClick={refreshSubmissions}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Manager Dashboard</h1>
            <p className="text-gray-600">Monitor team performance and manage evaluations</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={refreshSubmissions}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            
            <button
              onClick={exportBulkData}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Employees</h3>
              <p className="text-2xl font-semibold text-gray-900">{processedData.stats.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">High Performers</h3>
              <p className="text-2xl font-semibold text-gray-900">{processedData.stats.highPerformers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Needs Attention</h3>
              <p className="text-2xl font-semibold text-gray-900">{processedData.stats.needsAttention}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Avg Team Score</h3>
              <p className="text-2xl font-semibold text-gray-900">{processedData.stats.averageScore}/10</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search employees, departments..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Departments</option>
              {processedData.departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={filters.performance}
              onChange={(e) => setFilters(prev => ({ ...prev, performance: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All Performance</option>
              <option value="High">High Performers</option>
              <option value="Medium">Medium Performers</option>
              <option value="Low">Needs Attention</option>
            </select>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Team Overview ({processedData.employees.length} employees)
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select
                value={sortConfig.key}
                onChange={(e) => setSortConfig(prev => ({ ...prev, key: e.target.value }))}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="name">Name</option>
                <option value="score">Score</option>
                <option value="department">Department</option>
                <option value="hours">Learning Hours</option>
              </select>
              <button
                onClick={() => setSortConfig(prev => ({ 
                  ...prev, 
                  direction: prev.direction === 'asc' ? 'desc' : 'asc' 
                }))}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className={`w-4 h-4 transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {processedData.employees.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <div className="text-lg font-medium text-gray-900 mb-2">No employees found</div>
            <div className="text-gray-500">Try adjusting your filters or search query</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Learning Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reports</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedData.employees.map((employee, index) => (
                  <tr key={`${employee.name}-${employee.phone}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {employee.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        employee.performance === 'High' ? 'bg-green-100 text-green-800' :
                        employee.performance === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {employee.performance}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-lg font-semibold ${
                        employee.averageScore >= 8 ? 'text-green-600' :
                        employee.averageScore >= 6 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {employee.averageScore}/10
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.totalHours.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.submissions.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleFullReport(employee)}
                          className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 px-3 py-1 rounded transition-colors"
                        >
                          Full Report
                        </button>
                        <button
                          onClick={() => downloadEmployeePDF(employee)}
                          className="text-green-600 hover:text-green-900 hover:bg-green-50 px-3 py-1 rounded transition-colors"
                        >
                          Download PDF
                        </button>
                        {employee.latestSubmission && (
                          <button
                            onClick={() => openEvaluation(employee.latestSubmission)}
                            className="text-purple-600 hover:text-purple-900 hover:bg-purple-50 px-3 py-1 rounded transition-colors"
                          >
                            Evaluate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Evaluation Panel */}
      {evaluationPanel.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Evaluate: {evaluationPanel.submission?.employee?.name}
                </h3>
                <button
                  onClick={() => setEvaluationPanel(prev => ({ ...prev, isOpen: false }))}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager Score (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={evaluationPanel.score}
                  onChange={(e) => setEvaluationPanel(prev => ({ 
                    ...prev, 
                    score: parseInt(e.target.value) 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  rows={4}
                  value={evaluationPanel.comments}
                  onChange={(e) => setEvaluationPanel(prev => ({ 
                    ...prev, 
                    comments: e.target.value 
                  }))}
                  placeholder="Add your feedback about the employee's performance..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommendations
                </label>
                <textarea
                  rows={3}
                  value={evaluationPanel.recommendations}
                  onChange={(e) => setEvaluationPanel(prev => ({ 
                    ...prev, 
                    recommendations: e.target.value 
                  }))}
                  placeholder="Provide recommendations for improvement..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setEvaluationPanel(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEvaluation}
                disabled={!supabase}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Save Evaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}