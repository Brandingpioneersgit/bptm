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
const PDFDownloadButton = ({ data, employeeName }) => {
  const downloadPDF = () => {
    // Create a simple HTML content for PDF
    const htmlContent = `
      <html>
        <head>
          <title>Performance Report - ${employeeName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .score-card { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Performance Report</h1>
            <h2>${employeeName}</h2>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <h3>Performance Summary</h3>
            ${data.map(d => `
              <div class="score-card">
                <strong>${d.monthKey}</strong><br>
                Overall Score: ${d.scores?.overall || 'N/A'}/10<br>
                KPI: ${d.scores?.kpiScore || 'N/A'}/10<br>
                Learning: ${d.scores?.learningScore || 'N/A'}/10
              </div>
            `).join('')}
          </div>
          
          <div class="section">
            <h3>Detailed Submissions</h3>
            <table>
              <tr>
                <th>Month</th>
                <th>Department</th>
                <th>Overall Score</th>
                <th>KPI Score</th>
                <th>Learning Score</th>
                <th>Manager Score</th>
              </tr>
              ${data.map(d => `
                <tr>
                  <td>${monthLabel(d.monthKey)}</td>
                  <td>${d.employee?.department || 'N/A'}</td>
                  <td>${d.scores?.overall || 'N/A'}/10</td>
                  <td>${d.scores?.kpiScore || 'N/A'}/10</td>
                  <td>${d.scores?.learningScore || 'N/A'}/10</td>
                  <td>${d.manager?.score || 'N/A'}/10</td>
                </tr>
              `).join('')}
            </table>
          </div>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${employeeName.replace(/\s+/g, '_')}_Performance_Report.html`;
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
      Download PDF
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
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  {title}
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 whitespace-pre-wrap">
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                        value={inputValue}
                        onChange={onInputChange}
                      />
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2 justify-end">
                  {onCancel && (
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                      onClick={onCancel}
                    >
                      Cancel
                    </button>
                  )}
                  {onConfirm && (
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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
  const [isManagerLoggedIn, setIsManagerLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [view, setView] = useState('main'); // 'main' or 'employeeReport'
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
      setIsManagerLoggedIn(true);
    }
  }, [hash]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_TOKEN) {
      setIsManagerLoggedIn(true);
      setLoginError('');
      window.location.hash = '#/manager';
    } else {
      setLoginError('Incorrect password. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsManagerLoggedIn(false);
    setPassword('');
    setLoginError('');
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
      return <EmployeeReportDashboard employeeName={selectedEmployee.name} employeePhone={selectedEmployee.phone} onBack={handleBackToDashboard} />;
    }
    return <ManagerDashboard onViewReport={handleViewEmployeeReport} />;
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900 font-sans">
        <Modal {...modalState} />
        <header className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg shadow-blue-100/20 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <HeaderBrand />
            <div className="flex items-center gap-3">
              {isManagerLoggedIn && (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Manager Dashboard
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {isManagerLoggedIn ? (
            <ManagerSection />
          ) : (
            <EmployeeForm />
          )}
        </main>
        <footer className="bg-white/90 backdrop-blur-lg border-t border-gray-200 mt-auto py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-gray-600">
                  <span>Created for Branding Pioneers Agency</span>
                  <span className="text-gray-400">•</span>
                  <span>v10 (Supabase)</span>
                </div>
              </div>
              {!isManagerLoggedIn && (
                <div className="w-full lg:w-auto lg:max-w-md">
                  <h2 className="text-lg font-bold mb-4 text-gray-800 text-center lg:text-right">Manager Login</h2>
                  <form onSubmit={handleLogin} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="password"
                      className="flex-1 border border-gray-300 rounded-xl p-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter manager password"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 text-sm font-semibold transition-colors duration-200 shadow-sm"
                    >
                      Log In
                    </button>
                  </form>
                  {loginError && <p className="text-red-500 text-sm mt-3 text-center lg:text-right">{loginError}</p>}
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
function EmployeeForm() {
  const supabase = useSupabase();
  const { openModal, closeModal } = useModal();
  const { allSubmissions } = useFetchSubmissions();

  const [currentSubmission, setCurrentSubmission] = useState({ ...EMPTY_SUBMISSION, isDraft: true });
  const [previousSubmission, setPreviousSubmission] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null); // {name, phone}

  const uniqueEmployees = useMemo(() => {
    const employees = {};
    allSubmissions.forEach(s => {
      const key = `${s.employee.name}-${s.employee.phone}`;
      employees[key] = { name: s.employee.name, phone: s.employee.phone };
    });
    return Object.values(employees).sort((a, b) => a.name.localeCompare(b.name));
  }, [allSubmissions]);

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
  }, []);

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

  async function submitFinal() {
    if (!supabase) {
      openModal("Error", "Database connection not ready. Please wait a moment and try again.");
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
    const final = { ...currentSubmission, isDraft: false, employee: { ...currentSubmission.employee, name: (currentSubmission.employee?.name || "").trim(), phone: currentSubmission.employee.phone } };

    // Remove the temporary ID if it exists before upserting
    delete final.id;

    const { data, error } = await supabase
      .from('submissions')
      .upsert(final, { onConflict: 'employee_phone, monthKey' }); // Assumes a unique constraint on (employee_phone, monthKey)

    if (error) {
      console.error("Supabase submission error:", error);
      openModal("Submission Error", `There was a problem saving your report to the database: ${error.message}`, closeModal);
    } else {
      openModal("Submission Successful", "Your report has been saved to the database.", closeModal);
      setCurrentSubmission({ ...EMPTY_SUBMISSION, monthKey: currentSubmission.monthKey });
      setSelectedEmployee(null);
    }
  }

  const mPrev = previousSubmission ? previousSubmission.monthKey : prevMonthKey(currentSubmission.monthKey);
  const mThis = currentSubmission.monthKey;
  const rolesForDept = ROLES_BY_DEPT[currentSubmission.employee.department] || [];
  const isNewEmployee = !selectedEmployee;

  return (
    <div>
      <CelebrationEffect show={showCelebration} />
      <Section
        title="Employee & Report Month"
        number="1"
        info="Select your profile from existing employees or create a new one. Choose the month you're reporting for. This helps track your progress over time and ensures accurate month-over-month comparisons."
      >
        <div className="grid md:grid-cols-4 gap-3">
          {/* Employee Selection dropdown */}
          <div className="md:col-span-2">
            <label className="text-sm">Select Employee</label>
            <select
              className="w-full border rounded-xl p-2"
              value={selectedEmployee ? `${selectedEmployee.name}-${selectedEmployee.phone}` : ""}
              onChange={(e) => {
                if (e.target.value === "") {
                  setSelectedEmployee(null);
                  setCurrentSubmission({ ...EMPTY_SUBMISSION, monthKey: thisMonthKey() });
                } else {
                  const [name, phone] = e.target.value.split('-');
                  setSelectedEmployee({ name, phone });
                }
              }}
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
            <TextField label="Name" placeholder="Your name" value={currentSubmission.employee.name || ""} onChange={v => updateCurrentSubmission('employee.name', v)} />
          )}
          {isNewEmployee && (
            <TextField label="Phone Number" placeholder="e.g., 9876543210" value={currentSubmission.employee.phone || ""} onChange={v => updateCurrentSubmission('employee.phone', v)} />
          )}
          <div>
            <label className="text-sm">Department</label>
            <select className="w-full border rounded-xl p-2" value={currentSubmission.employee.department} onChange={e => updateCurrentSubmission('employee.department', e.target.value)}>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm">Role(s)</label>
            <MultiSelect
              options={rolesForDept}
              selected={currentSubmission.employee.role}
              onChange={(newRoles) => updateCurrentSubmission('employee.role', newRoles)}
              placeholder="Select roles"
            />
          </div>
          <div>
            <label className="text-sm">Report Month</label>
            <input type="month" className="w-full border rounded-xl p-2" value={currentSubmission.monthKey} onChange={e => updateCurrentSubmission('monthKey', e.target.value)} />
            <div className="text-xs text-gray-500 mt-1">Comparisons: {monthLabel(mPrev)} vs {monthLabel(mThis)}</div>
          </div>
        </div>
      </Section>

      <Section
        title="Attendance & Tasks (this month)"
        number="1b"
        info="Record your work attendance for the month - both Work From Office (WFO) and Work From Home (WFH) days. Also track the number of tasks completed and provide your AI task management table link with screenshot proof."
      >
        <div className="grid md:grid-cols-4 gap-3">
          <NumField label="WFO days (0–31)" value={currentSubmission.meta.attendance.wfo} onChange={v => updateCurrentSubmission('meta.attendance.wfo', v)} />
          <NumField label="WFH days (0–31)" value={currentSubmission.meta.attendance.wfh} onChange={v => updateCurrentSubmission('meta.attendance.wfh', v)} />
          <div className="md:col-span-2 text-xs text-gray-500 self-end">
            Total cannot exceed the number of days in {monthLabel(currentSubmission.monthKey)} ({daysInMonth(currentSubmission.monthKey)} days).
          </div>
          <NumField label="Tasks completed (per AI table)" value={currentSubmission.meta.tasks.count} onChange={v => updateCurrentSubmission('meta.tasks.count', v)} />
          <TextField label="AI Table / PM link (Drive/URL)" value={currentSubmission.meta.tasks.aiTableLink} onChange={v => updateCurrentSubmission('meta.tasks.aiTableLink', v)} />
          <TextField label="AI Table screenshot (Drive URL)" value={currentSubmission.meta.tasks.aiTableScreenshot} onChange={v => updateCurrentSubmission('meta.tasks.aiTableScreenshot', v)} />
        </div>
      </Section>

      <DeptClientsBlock currentSubmission={currentSubmission} previousSubmission={previousSubmission} setModel={setCurrentSubmission} monthPrev={mPrev} monthThis={mThis} openModal={openModal} closeModal={closeModal} />
      <LearningBlock model={currentSubmission} setModel={setCurrentSubmission} openModal={openModal} />

      <Section
        title="AI Usage (Optional)"
        number="4"
        info="Describe how you used AI tools to improve your work efficiency this month. Include specific examples, tools used, and measurable improvements. This helps us understand AI adoption across the team."
      >
        <textarea className="w-full border rounded-xl p-3" rows={4} placeholder="List ways you used AI to work faster/better this month. Include links or examples." value={currentSubmission.aiUsageNotes} onChange={e => updateCurrentSubmission('aiUsageNotes', e.target.value)} />
      </Section>

      <Section
        title="Employee Feedback"
        number="5"
        info="Share your honest feedback about the company, HR processes, and any challenges you're facing. This information helps management improve the work environment and address concerns proactively."
      >
        <div className="grid md:grid-cols-1 gap-4">
          <TextArea label="General feedback about the company" placeholder="What's working well? What could be improved?" rows={3} value={currentSubmission.feedback.company} onChange={v => updateCurrentSubmission('feedback.company', v)} />
          <TextArea label="Feedback regarding HR and policies" placeholder="Any thoughts on HR processes, communication, or company policies?" rows={3} value={currentSubmission.feedback.hr} onChange={v => updateCurrentSubmission('feedback.hr', v)} />
          <TextArea label="Challenges you are facing" placeholder="Are there any obstacles or challenges hindering your work or growth?" rows={3} value={currentSubmission.feedback.challenges} onChange={v => updateCurrentSubmission('feedback.challenges', v)} />
        </div>
      </Section>

      <Section
        title="Performance Summary & Submission"
        number="6"
        info="Review your calculated scores based on KPIs, learning hours, and client relationships. Scores of 8+ trigger celebration effects! Submit as draft to save progress or finalize to complete your monthly report."
      >
        <div className="grid md:grid-cols-4 gap-3">
          <div className="bg-blue-600 text-white rounded-2xl p-4"><div className="text-sm opacity-80">KPI</div><div className="text-3xl font-semibold">{currentSubmission.scores.kpiScore}/10</div></div>
          <div className="bg-blue-600 text-white rounded-2xl p-4"><div className="text-sm opacity-80">Learning</div><div className="text-3xl font-semibold">{currentSubmission.scores.learningScore}/10</div></div>
          <div className="bg-blue-600 text-white rounded-2xl p-4"><div className="text-sm opacity-80">Client Status</div><div className="text-3xl font-semibold">{currentSubmission.scores.relationshipScore}/10</div></div>
          <div className="bg-blue-600 text-white rounded-2xl p-4"><div className="text-sm opacity-80">Overall</div><div className="text-3xl font-semibold">{currentSubmission.scores.overall}/10</div></div>
        </div>
        <div className="mt-4 text-sm bg-blue-50 border border-blue-100 rounded-xl p-3 whitespace-pre-wrap">{generateSummary(currentSubmission)}</div>
      </Section>

      <div className="flex items-center gap-3 mt-8">
        <button onClick={submitFinal} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 py-3 text-lg font-semibold disabled:bg-gray-400" disabled={!supabase}>Submit Monthly Report</button>
      </div>
    </div>
  );
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
function TextField({ label, value, onChange, placeholder, className, info }) {
  return (
    <div className={className || ''}>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
        {label}
        {info && <InfoTooltip content={info} />}
      </label>
      <input
        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
        placeholder={placeholder || ""}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
function NumField({ label, value, onChange, className, info }) {
  return (
    <div className={className || ''}>
      <label className="text-sm flex items-center">
        {label}
        {info && <InfoTooltip content={info} />}
      </label>
      <input type="number" className="w-full border rounded-xl p-2" value={Number(value || 0)} onChange={e => onChange(Number(e.target.value || 0))} />
    </div>
  );
}
function TextArea({ label, value, onChange, rows = 4, className, placeholder }) {
  return (
    <div className={className || ''}>
      <label className="text-sm">{label}</label>
      <textarea className="w-full border rounded-xl p-2" rows={rows} placeholder={placeholder || ""} value={value || ""} onChange={e => onChange(e.target.value)} />
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

/**********************
 * Manager Dashboard  *
 **********************/
function ManagerDashboard({ onViewReport }) {
  const supabase = useSupabase();
  const [monthKey, setMonthKey] = useState(thisMonthKey());
  const [startMonth, setStartMonth] = useState(thisMonthKey());
  const [endMonth, setEndMonth] = useState(thisMonthKey());
  const [timeRangeMode, setTimeRangeMode] = useState('single'); // 'single' or 'range'
  const { allSubmissions, loading, error, refreshSubmissions } = useFetchSubmissions();
  const [filterDept, setFilterDept] = useState("All");
  const [filterEmployee, setFilterEmployee] = useState("All");
  const [sortBy, setSortBy] = useState("name"); // 'name', 'score', 'department', 'date'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'
  const [openId, setOpenId] = useState(null);
  const [notes, setNotes] = useState("");
  const [payload, setPayload] = useState(null);
  const [managerScore, setManagerScore] = useState(0);
  const { openModal, closeModal } = useModal();

  const filteredSubmissions = useMemo(() => {
    let filtered = allSubmissions;

    // Filter by time range
    if (timeRangeMode === 'single') {
      filtered = filtered.filter(s => s.monthKey === monthKey);
    } else {
      filtered = filtered.filter(s => s.monthKey >= startMonth && s.monthKey <= endMonth);
    }

    // Filter by department
    if (filterDept !== "All") {
      filtered = filtered.filter(s => s.employee?.department === filterDept);
    }

    // Filter by employee
    if (filterEmployee !== "All") {
      filtered = filtered.filter(s => s.employee?.name === filterEmployee);
    }

    // Sort submissions
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = (a.employee?.name || '').localeCompare(b.employee?.name || '');
          break;
        case 'score':
          comparison = (b.scores?.overall || 0) - (a.scores?.overall || 0);
          break;
        case 'department':
          comparison = (a.employee?.department || '').localeCompare(b.employee?.department || '');
          break;
        case 'date':
          comparison = b.monthKey.localeCompare(a.monthKey);
          break;
        default:
          comparison = (a.employee?.name || '').localeCompare(b.employee?.name || '');
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allSubmissions, monthKey, startMonth, endMonth, timeRangeMode, filterDept, filterEmployee, sortBy, sortOrder]);

  function openRow(r) {
    setOpenId(r.id);
    setNotes(r.manager?.comments || "");
    setPayload(r);
    setManagerScore(r.manager?.score || 0);
  }

  async function saveNotes() {
    if (!supabase) {
      openModal("Error", "Database connection not ready. Please wait a moment and try again.");
      return;
    }
    const r = allSubmissions.find(x => x.id === openId);
    if (!r) return;

    const { data, error } = await supabase
      .from('submissions')
      .update({ manager: { ...(r.manager || {}), comments: notes, score: managerScore } })
      .eq('id', openId);

    if (error) {
      console.error("Supabase update error:", error);
      openModal("Save Error", `Could not save notes: ${error.message}`, closeModal);
    } else {
      openModal('Saved', 'Notes and score have been saved to the database.', closeModal);
      refreshSubmissions(); // Re-fetch data to show the update
    }
  }

  async function deleteSubmission(submissionId, employeeName) {
    if (!supabase) {
      openModal("Error", "Database connection not ready. Please wait a moment and try again.");
      return;
    }

    openModal(
      "Confirm Delete",
      `Are you sure you want to delete the submission for ${employeeName}? This action cannot be undone.`,
      async () => {
        const { error } = await supabase
          .from('submissions')
          .delete()
          .eq('id', submissionId);

        if (error) {
          console.error("Supabase delete error:", error);
          openModal("Delete Error", `Could not delete submission: ${error.message}`, closeModal);
        } else {
          openModal('Deleted', 'Submission has been deleted successfully.', closeModal);
          refreshSubmissions(); // Re-fetch data to show the update
        }
        closeModal();
      },
      closeModal
    );
  }

  function exportCSV() {
    const header = ['id', 'month_key', 'employee_name', 'employee_phone', 'department', 'role', 'kpi', 'learning', 'client', 'overall', 'manager_score', 'missingLearning', 'hasEscalations', 'missingReports', 'feedback_company', 'feedback_hr', 'feedback_challenges'];
    const rowsCsv = filteredSubmissions.map(r => [
      r.id,
      r.monthKey,
      clean(r.employee?.name),
      clean(r.employee?.phone),
      r.employee?.department,
      (r.employee?.role || []).join('; '),
      r.scores?.kpiScore ?? '',
      r.scores?.learningScore ?? '',
      r.scores?.relationshipScore ?? '',
      r.scores?.overall ?? '',
      r.manager?.score ?? '',
      r.flags?.missingLearningHours ?? '',
      r.flags?.hasEscalations ?? '',
      r.flags?.missingReports ?? '',
      clean(r.feedback?.company),
      clean(r.feedback?.hr),
      clean(r.feedback?.challenges),
    ].map(String).map(s => `"${s.replaceAll('"', '""')}"`).join(','));
    const blob = new Blob([[header.join(',')].concat(rowsCsv).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `bp-submissions-${monthKey}.csv`; a.click(); URL.revokeObjectURL(url);
  }
  function exportJSON() {
    const blob = new Blob([JSON.stringify(filteredSubmissions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `bp-submissions-${monthKey}.json`; a.click(); URL.revokeObjectURL(url);
  }

  const uniqueEmployees = useMemo(() => {
    const names = new Set();
    allSubmissions.forEach(r => names.add(r.employee?.name));
    return Array.from(names).filter(Boolean).sort();
  }, [allSubmissions]);

  // Group submissions by employee (by name, since phone numbers might be inconsistent)
  const groupedSubmissions = useMemo(() => {
    const groups = {};
    filteredSubmissions.forEach(submission => {
      const employeeName = submission.employee?.name;
      if (!employeeName) return;

      if (!groups[employeeName]) {
        groups[employeeName] = [];
      }
      groups[employeeName].push(submission);
    });

    // Convert to array and calculate metrics
    let groupedArray = Object.entries(groups)
      .map(([name, submissions]) => {
        const sortedSubmissions = submissions.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
        const latestSubmission = sortedSubmissions[0];

        // Calculate average score across all submissions
        const avgScore = submissions.length > 0
          ? submissions.reduce((sum, s) => sum + (s.scores?.overall || 0), 0) / submissions.length
          : 0;

        return {
          employeeName: name,
          submissions: sortedSubmissions,
          latestSubmission,
          avgScore: Math.round(avgScore * 10) / 10,
          submissionCount: submissions.length
        };
      });

    // Sort grouped submissions
    groupedArray.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.employeeName.localeCompare(b.employeeName);
          break;
        case 'score':
          comparison = b.avgScore - a.avgScore;
          break;
        case 'department':
          comparison = (a.latestSubmission.employee?.department || '').localeCompare(b.latestSubmission.employee?.department || '');
          break;
        case 'entries':
          comparison = b.submissionCount - a.submissionCount;
          break;
        default:
          comparison = a.employeeName.localeCompare(b.employeeName);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return groupedArray;
  }, [filteredSubmissions, sortBy, sortOrder]);

  const uniqueDepartments = useMemo(() => {
    const departments = new Set();
    allSubmissions.forEach(r => departments.add(r.employee?.department));
    return Array.from(departments).filter(Boolean).sort();
  }, [allSubmissions]);


  // Calculate dashboard statistics
  const dashboardStats = useMemo(() => {
    const stats = {
      totalEmployees: groupedSubmissions.length,
      totalSubmissions: filteredSubmissions.length,
      avgOverallScore: 0,
      departmentBreakdown: {},
      topPerformers: [],
      needsAttention: []
    };

    // Calculate averages and department breakdown
    let totalScore = 0;
    let scoreCount = 0;

    groupedSubmissions.forEach(group => {
      const r = group.latestSubmission;
      const dept = r.employee?.department || 'Unknown';

      if (!stats.departmentBreakdown[dept]) {
        stats.departmentBreakdown[dept] = { count: 0, avgScore: 0, totalScore: 0 };
      }

      stats.departmentBreakdown[dept].count++;

      if (r.scores?.overall) {
        totalScore += r.scores.overall;
        scoreCount++;
        stats.departmentBreakdown[dept].totalScore += r.scores.overall;
      }

      // Top performers (score >= 8)
      if (r.scores?.overall >= 8) {
        stats.topPerformers.push({
          name: group.employeeName,
          score: r.scores.overall,
          department: dept
        });
      }

      // Needs attention (score < 6 or flags)
      if (r.scores?.overall < 6 || r.flags?.missingLearningHours || r.flags?.hasEscalations) {
        stats.needsAttention.push({
          name: group.employeeName,
          score: r.scores?.overall || 0,
          department: dept,
          issues: [
            r.scores?.overall < 6 ? 'Low Score' : null,
            r.flags?.missingLearningHours ? 'Learning <6h' : null,
            r.flags?.hasEscalations ? 'Escalations' : null
          ].filter(Boolean)
        });
      }
    });

    stats.avgOverallScore = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : 0;

    // Calculate department averages
    Object.keys(stats.departmentBreakdown).forEach(dept => {
      const deptData = stats.departmentBreakdown[dept];
      deptData.avgScore = deptData.count > 0 ? (deptData.totalScore / deptData.count).toFixed(1) : 0;
    });

    return stats;
  }, [groupedSubmissions, filteredSubmissions]);

  return (
    <div className="space-y-8">
      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Employees</p>
              <p className="text-3xl font-bold">{dashboardStats.totalEmployees}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Avg Score</p>
              <p className="text-3xl font-bold">{dashboardStats.avgOverallScore}/10</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Top Performers</p>
              <p className="text-3xl font-bold">{dashboardStats.topPerformers.length}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Needs Attention</p>
              <p className="text-3xl font-bold">{dashboardStats.needsAttention.length}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Department Performance */}
      <Section title="📊 Department Performance Overview">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(dashboardStats.departmentBreakdown).map(([dept, data]) => (
            <div key={dept} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{dept}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${data.avgScore >= 8 ? 'bg-green-100 text-green-800' :
                    data.avgScore >= 6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                  {data.avgScore}/10
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {data.count} employee{data.count !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="🎯 Filters, Sorting & Export">
        <div className="space-y-6">
          {/* Time Range Selection */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-medium text-blue-800 mb-3">📅 Time Range Selection</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                <select
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  value={timeRangeMode}
                  onChange={e => setTimeRangeMode(e.target.value)}
                >
                  <option value="single">Single Month</option>
                  <option value="range">Date Range</option>
                </select>
              </div>

              {timeRangeMode === 'single' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Month</label>
                  <input
                    type="month"
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    value={monthKey}
                    onChange={e => setMonthKey(e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Month</label>
                    <input
                      type="month"
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      value={startMonth}
                      onChange={e => setStartMonth(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Month</label>
                    <input
                      type="month"
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      value={endMonth}
                      onChange={e => setEndMonth(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Filters and Sorting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={filterDept}
                onChange={e => setFilterDept(e.target.value)}
              >
                <option value="All">All Departments</option>
                {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
              <select
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={filterEmployee}
                onChange={e => setFilterEmployee(e.target.value)}
              >
                <option value="All">All Employees</option>
                {uniqueEmployees.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="name">Name</option>
                <option value="score">Average Score</option>
                <option value="department">Department</option>
                <option value="entries">Number of Entries</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <select
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export</label>
              <div className="flex gap-2">
                <button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 py-3 text-sm font-medium transition-colors duration-200 shadow-sm"
                  onClick={exportCSV}
                >
                  CSV
                </button>
                <button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl px-3 py-3 text-sm font-medium transition-colors duration-200 shadow-sm"
                  onClick={exportJSON}
                >
                  JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title={loading ? 'Loading…' : `Employees for ${monthLabel(monthKey)} (${groupedSubmissions.length} employees, ${filteredSubmissions.length} total submissions)`}>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-auto">
          <table className="w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <th className="p-3 border border-gray-200 text-left font-semibold text-gray-700">Employee</th>
                <th className="p-3 border border-gray-200 text-left font-semibold text-gray-700">Dept</th>
                <th className="p-3 border border-gray-200 font-semibold text-gray-700">Entries</th>
                <th className="p-3 border border-gray-200 font-semibold text-gray-700">Avg Score</th>
                <th className="p-3 border border-gray-200 font-semibold text-gray-700">Latest Score</th>
                <th className="p-3 border border-gray-200 font-semibold text-gray-700">Manager Score</th>
                <th className="p-3 border border-gray-200 font-semibold text-gray-700">Flags</th>
                <th className="p-3 border border-gray-200 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedSubmissions.map(group => {
                const r = group.latestSubmission; // Show latest submission data
                return (
                  <tr key={`${group.employeeName}-${r.id}`} className="odd:bg-white even:bg-blue-50/40 hover:bg-blue-50/60 transition-colors duration-200">
                    <td className="p-3 border border-gray-200 text-left font-medium">
                      {clean(group.employeeName)}
                      <div className="text-xs text-gray-500 mt-1">
                        {timeRangeMode === 'range' ? `${group.submissions.length} submissions` : 'Latest submission'}
                      </div>
                    </td>
                    <td className="p-3 border border-gray-200 text-left">{r.employee?.department}</td>
                    <td className="p-3 border border-gray-200 text-center font-semibold">{group.submissionCount}</td>
                    <td className="p-3 border border-gray-200 text-center font-bold text-lg">
                      <span className={`${group.avgScore >= 8 ? 'text-green-600' : group.avgScore >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {group.avgScore}/10
                      </span>
                    </td>
                    <td className="p-3 border border-gray-200 text-center font-semibold">{r.scores?.overall ?? 'N/A'}/10</td>
                    <td className="p-3 border border-gray-200 text-center">{r.manager?.score || 'N/A'}</td>
                    <td className="p-3 border border-gray-200 text-xs text-left">
                      {r.flags?.missingLearningHours ? '⏱️<6h ' : ''}
                      {r.flags?.hasEscalations ? '⚠️Esc ' : ''}
                      {r.flags?.missingReports ? '📄Miss ' : ''}
                    </td>
                    <td className="p-3 border border-gray-200 text-center">
                      <div className="flex gap-1 justify-center flex-wrap">
                        <button className="text-blue-600 hover:text-blue-800 underline text-xs transition-colors duration-200" onClick={() => openRow(r)}>Notes</button>
                        <button className="text-blue-600 hover:text-blue-800 underline text-xs transition-colors duration-200" onClick={() => {
                          // Find the most frequent phone number from submissions
                          const phoneNumbers = group.submissions.map(s => s.employee?.phone).filter(Boolean);
                          const phoneCounts = phoneNumbers.reduce((acc, phone) => {
                            acc[phone] = (acc[phone] || 0) + 1;
                            return acc;
                          }, {});
                          const mostCommonPhone = Object.keys(phoneCounts).length > 0 
                            ? Object.keys(phoneCounts).reduce((a, b) => phoneCounts[a] > phoneCounts[b] ? a : b)
                            : 'no-phone';
                          onViewReport(group.employeeName, mostCommonPhone);
                        }}>Full Report</button>
                        <button className="text-red-600 hover:text-red-800 underline text-xs transition-colors duration-200" onClick={() => deleteSubmission(r.id, group.employeeName)}>Delete Latest</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {groupedSubmissions.map(group => {
            const r = group.latestSubmission;
            return (
              <div key={`mobile-${group.employeeName}-${r.id}`} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{clean(group.employeeName)}</h3>
                    <p className="text-sm text-gray-600">{r.employee?.department}</p>
                    {group.submissions.length > 1 && (
                      <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {group.submissions.length} reports
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{r.scores?.overall ?? 'N/A'}</div>
                    <div className="text-xs text-gray-500">Overall Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <div className="font-semibold text-gray-800">{r.scores?.kpiScore ?? 'N/A'}</div>
                    <div className="text-xs text-gray-500">KPI</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{r.scores?.learningScore ?? 'N/A'}</div>
                    <div className="text-xs text-gray-500">Learning</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{r.scores?.relationshipScore ?? 'N/A'}</div>
                    <div className="text-xs text-gray-500">Client</div>
                  </div>
                </div>

                {(r.flags?.missingLearningHours || r.flags?.hasEscalations || r.flags?.missingReports) && (
                  <div className="mb-3 text-xs">
                    {r.flags?.missingLearningHours && <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded mr-1">⏱️ &lt;6h</span>}
                    {r.flags?.hasEscalations && <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded mr-1">⚠️ Escalations</span>}
                    {r.flags?.missingReports && <span className="inline-block bg-orange-100 text-orange-800 px-2 py-1 rounded mr-1">📄 Missing Reports</span>}
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg transition-colors duration-200"
                    onClick={() => openRow(r)}
                  >
                    Notes
                  </button>
                  <button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-3 rounded-lg transition-colors duration-200"
                    onClick={() => {
                      const phoneNumbers = group.submissions.map(s => s.employee?.phone).filter(Boolean);
                      const phoneCounts = phoneNumbers.reduce((acc, phone) => {
                        acc[phone] = (acc[phone] || 0) + 1;
                        return acc;
                      }, {});
                      const mostCommonPhone = Object.keys(phoneCounts).length > 0 
                        ? Object.keys(phoneCounts).reduce((a, b) => phoneCounts[a] > phoneCounts[b] ? a : b)
                        : 'no-phone';
                      onViewReport(group.employeeName, mostCommonPhone);
                    }}
                  >
                    Full Report
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded-lg transition-colors duration-200"
                    onClick={() => deleteSubmission(r.id, group.employeeName)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {openId && (
        <Section title={`Details for ${payload?.employee?.name}`}>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium mb-1">Manager Notes</div>
              <textarea className="w-full border rounded-xl p-2" rows={8} value={notes} onChange={e => setNotes(e.target.value)} />
              <div className="mt-4">
                <label className="text-sm font-medium">Manager Score (1-10)</label>
                <input type="number" min={1} max={10} className="w-full border rounded-xl p-2 mt-1" value={managerScore} onChange={e => setManagerScore(Number(e.target.value || 0))} />
              </div>
              <button className="mt-4 bg-blue-600 text-white rounded-xl px-3 py-2" onClick={saveNotes}>Save Notes & Score</button>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Employee Feedback</div>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-700">Company Feedback</h4>
                  <p className="bg-gray-50 p-2 rounded-lg border">{payload.feedback?.company || 'No feedback provided.'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">HR Feedback</h4>
                  <p className="bg-gray-50 p-2 rounded-lg border">{payload.feedback?.hr || 'No feedback provided.'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700">Challenges</h4>
                  <p className="bg-gray-50 p-2 rounded-lg border">{payload.feedback?.challenges || 'No challenges mentioned.'}</p>
                </div>
              </div>
            </div>
          </div>
        </Section>
      )}
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
            </div>
            
            <h4 className="font-medium text-yellow-800 mt-4 mb-3">Available Employees:</h4>
            <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
              {allSubmissions.map((s, i) => (
                <div key={i} className="flex justify-between">
                  <span>"{s.employee?.name}"</span>
                  <span>"{s.employee?.phone || 'No phone'}"</span>
                </div>
              ))}
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
    <div className="space-y-6">
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
            <PDFDownloadButton data={employeeSubmissions} employeeName={employeeName} />
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
