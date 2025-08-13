import React, { useEffect, useMemo, useState, useCallback, useRef, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

/**
 * Branding Pioneers – Monthly Tactical System (MVP++ v8)
 * Single-file React app (Vite + Tailwind)
 *
 * Highlights:
 * - Single entry point with in-page manager login form
 * - Supabase-ready (ENV: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_ACCESS_TOKEN)
 * - All KPIs are month-on-month with labels
 * - Deep SEO, Ads, Social, Web KPIs + proofs
 * - HR/Accounts/Sales internal KPIs (prev vs this; Sales includes next-month projection)
 * - Attendance & Tasks (AI table link)
 * - Client Report Status (roadmap/report dates, meetings, satisfaction, payment, omissions)
 * - Learning (>= 6h required; multiple entries)
 * - Scoring (KPI / Learning / Client Status) out of 10; Overall average
 * - CSV/JSON export; Manager notes with save (Supabase UPDATE)
 *
 * NEW FEATURES:
 * - Employee identity now mapped to a phone number to prevent duplicates.
 * - Manager dashboard has filters for departments and individual employees.
 * - Individual employee reports show a month-on-month journey and yearly summary.
 * - Removed "Omission suspected" field.
 * - Updated KPI fields for various departments.
 *
 * REIMAGINED ARCHITECTURE:
 * - When filling the KPI form, selecting an employee automatically loads their most recent submission into the "Previous Month" section.
 * - The "Current Month" fields remain blank for new data entry.
 * - New custom hook for fetching and managing submissions.
 * - Consolidated data flow for a more robust application.
 *
 * RECENT UPDATES:
 * - Replaced date text inputs with native date pickers for better user experience.
 * - All dates are now stored as 'YYYY-MM-DD' strings for consistency.
 * - Added utility functions for date formatting and conversion.
 * - Reviewed and improved form validation across all fields.
 *
 * CHANGES TO ADDRESS USER FEEDBACK:
 * - Fixed issue where "add new client" fields were not clickable by ensuring proper state binding.
 * - Modified KPI components to allow manual entry of previous month's data for new clients.
 * - Removed the mandatory 360-minute learning requirement from validation. The score will still be calculated, but the submission won't be blocked.
 * - The "Role(s)" dropdown is no longer pre-filled; it starts as an empty selection.
 * - Updated text for report links to explicitly mention "Google Drive or Genspark URL".
 */

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
const thisMonthKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const prevMonthKey = (mk)=>{ if(!mk) return ""; const [y,m]=mk.split("-").map(Number); const d=new Date(y, m-2, 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const monthLabel = (mk)=>{ if(!mk) return ""; const [y,m]=mk.split("-").map(Number); return new Date(y, m-1, 1).toLocaleString(undefined,{month:'short',year:'numeric'}); };
const round1 = (n) => Math.round(n*10)/10;
const isDriveUrl = (u)=> /https?:\/\/(drive|docs)\.google\.com\//i.test(u||"");
const isPhoneNumber = (p) => !!p && /^\d{10}$/.test(p);
const isGensparkUrl = (u) => /https?:\/\/(www\.)?genspark\.ai/i.test(u||"");

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

/*****************
 * Local Storage *
 *****************/
const Storage = {
  key: "bp-tactical-mvp-v8-submissions",
  load(){
    try {
      const stored = JSON.parse(localStorage.getItem(this.key) || "[]");
      // Convert old date formats to YYYY-MM-DD on load
      return stored.map(s => {
        const newS = { ...s };
        const convert = (dateStr) => (dateStr && dateStr.includes('/')) ? toYYYYMMDD(dateStr) : dateStr;
        
        if (newS.clients) {
          newS.clients = newS.clients.map(c => {
            const newC = { ...c };
            if (newC.relationship) {
              newC.relationship.roadmapSentDate = convert(newC.relationship.roadmapSentDate);
              newC.relationship.reportSentDate = convert(newC.relationship.reportSentDate);
              newC.relationship.paymentDate = convert(newC.relationship.paymentDate);
              if (newC.relationship.meetings) {
                newC.relationship.meetings = newC.relationship.meetings.map(m => ({ ...m, date: convert(m.date) }));
              }
            }
            if (newC.op_paymentDate) {
              newC.op_paymentDate = convert(newC.op_paymentDate);
            }
            return newC;
          });
        }
        return newS;
      });
    } catch {
      return [];
    }
  },
  save(all){ localStorage.setItem(this.key, JSON.stringify(all)); },
};

/********************
 * Scoring Functions *
 ********************/
function scoreKPIs(employee, clients){
  const dept = employee.department;
  if(dept === "Web"){
    let pages=0,onTime=0,bugs=0; (clients||[]).forEach(c=>{ pages+=(c.web_pagesThis||0); onTime+=(c.web_onTimeThis||0); bugs+=(c.web_bugsThis||0);});
    const n = clients?.length||1;
    const pagesScore = Math.min(10,(pages/10)*10);
    const onTimeScore = Math.min(10,(onTime/n)/10);
    const bugsScore = Math.min(10,(bugs/20)*10);
    return round1(pagesScore*0.5 + onTimeScore*0.3 + bugsScore*0.2);
  }
  if(dept === "Social Media"){
    let folDelta=0,reach=0,er=0,campaigns=0, creatives=0, quality=0, hasDesignerRole=false;
    (employee.role||[]).forEach(r => {
      if(r.includes("Designer")) hasDesignerRole = true;
    });

    (clients||[]).forEach(c=>{
      folDelta+=(c.sm_followersThis||0)-(c.sm_followersPrev||0);
      reach+=(c.sm_reachThis||0);
      er+=(c.sm_erThis||0);
      campaigns+=(c.sm_campaignsThis||0);
      if (hasDesignerRole) {
        creatives+=(c.sm_graphicsPhotoshop + c.sm_graphicsCanva + c.sm_graphicsAi || 0);
        quality+=(c.sm_qualityScore||0);
      }
    });
    const n = clients?.length||1;
    const growthScore = Math.min(10,((folDelta/n)/200)*10);
    const reachScore = Math.min(10,((reach/n)/50000)*10);
    const erScore = Math.min(10,((er/n)/5)*10);
    const campScore = Math.min(10,((campaigns/n)/4)*10);
    const creativeScore = Math.min(10, (creatives/n/10)*10);
    const qualityScore = quality > 0 ? (quality/n) : 0;
    
    if (hasDesignerRole) {
      return round1(creativeScore * 0.5 + qualityScore * 0.5);
    }
    
    return round1(growthScore*0.35 + reachScore*0.25 + erScore*0.25 + campScore*0.15);
  }
  if(dept === "Ads"){
    let ctr=0,cpl=0,leads=0,newAds=0; (clients||[]).forEach(c=>{ ctr+=(c.ads_ctrThis||0); cpl+=(c.ads_cplThis||0); leads+=(c.ads_leadsThis||0); newAds+=(c.ads_newAds||0);});
    const n = clients?.length||1;
    const ctrScore = Math.min(10,((ctr/n)/3)*10);
    const cplScore = Math.min(10,(3/Math.max(0.1,(cpl/n)))*10); // lower is better
    const leadsScore = Math.min(10,((leads/n)/150)*10);
    const buildScore = Math.min(10,((newAds/n)/15)*10);
    return round1(ctrScore*0.3 + cplScore*0.3 + leadsScore*0.3 + buildScore*0.1);
  }
  if(dept === "SEO"){
    let trafThis=0, trafPrev=0, kwImproved=0, aiCount=0, volSum=0, kwCount=0, llmThis=0, llmPrev=0, leadsThis=0, leadsPrev=0, top3=0;
    (clients||[]).forEach(c=>{
      trafThis+=(c.seo_trafficThis||0); trafPrev+=(c.seo_trafficPrev||0);
      kwImproved+=(c.seo_kwImprovedThis||0); aiCount+=(c.seo_aiOverviewThis||0);
      llmThis+=(c.seo_llmTrafficThis||0); llmPrev+=(c.seo_llmTrafficPrev||0);
      leadsThis+=(c.seo_leadsThis||0); leadsPrev+=(c.seo_leadsPrev||0);
      top3+=(c.seo_top3?.length||0);
      (c.seo_keywordsWorked||[]).forEach(k=>{ volSum+=(k.searchVolume||0); kwCount++; });
    });
    const n = clients?.length||1;
    const deltaPct = ((trafThis - trafPrev)/Math.max(1,trafPrev))*100;
    const trafScore = Math.min(10,(Math.max(0,deltaPct)/20)*10);
    const kwScore = Math.min(10,((kwImproved/n)/10)*10);
    const aiScore = Math.min(10,((aiCount/n)/5)*10);
    const volScore = Math.min(10,((volSum/Math.max(1,kwCount))/500)*10);
    const llmDelta = ((llmThis-llmPrev)/Math.max(1,llmPrev))*100; const llmScore = Math.min(10,(Math.max(0,llmDelta)/20)*10);
    const leadsDelta = ((leadsThis-leadsPrev)/Math.max(1,leadsPrev))*100; const leadsScore = Math.min(10,(Math.max(0,leadsDelta)/20)*10);
    const top3Score = Math.min(10,((top3/n)/10)*10);
    return round1(trafScore*0.25 + kwScore*0.2 + aiScore*0.1 + volScore*0.1 + llmScore*0.15 + leadsScore*0.15 + top3Score*0.05);
  }
  if(dept === "HR"){
    const c = clients?.[0]||{}; const hiresThis=c.hr_hiresThis||0, screened=c.hr_screened||0, activities=c.hr_engagements||0;
    const hiresScore = Math.min(10, hiresThis * 3);
    const screenedScore = Math.min(10, screened / 50 * 10);
    const activityScore = Math.min(10, activities * 2.5);
    return round1(hiresScore*0.4 + screenedScore*0.4 + activityScore*0.2);
  }
  if(dept === "Accounts"){
    const c = clients?.[0]||{}; const colThis=c.ac_collectionsPctThis||0, colPrev=c.ac_collectionsPctPrev||0, gstDone=c.ac_gstDone||false, tdsDone=c.ac_tdsDone||false;
    const colScore = Math.min(10, ((Math.max(0,colThis-colPrev)/20)*5));
    const complianceScore = (gstDone ? 2.5 : 0) + (tdsDone ? 2.5 : 0);
    return round1(colScore*0.5 + complianceScore*0.5);
  }
  if(dept === "Sales"){
    const c = clients?.[0]||{}; const revThis=c.sa_revenueThis||0, revPrev=c.sa_revenuePrev||0, convThis=c.sa_conversionRateThis||0, convPrev=c.sa_conversionRatePrev||0, pipeThis=c.sa_pipelineThis||0, pipePrev=c.sa_pipelinePrev||0, upsThis=c.sa_aiUpsellValueThis||0, upsPrev=c.sa_aiUpsellValuePrev||0;
    const revDelta = Math.max(0,revThis-revPrev), convDelta=Math.max(0,convThis-convPrev), pipeDelta=Math.max(0,pipeThis-pipePrev), upsDelta=Math.max(0,upsThis-upsPrev);
    const s1=Math.min(10,(revDelta/500000)*10), s2=Math.min(10,(convDelta/5)*10), s3=Math.min(10,(pipeDelta/25)*10), s4=Math.min(10,(upsDelta/100000)*10);
    return round1(s1*0.45 + s2*0.2 + s3*0.2 + s4*0.15);
  }
  if(dept === "Blended (HR + Sales)"){
    const hr=clients?.[0]||{}, sales=clients?.[1]||{};
    const hrScore = Math.min(10,Math.max(0,(hr.hr_hiresThis||0)-(hr.hr_hiresPrev||0))/3*10)*0.6 + Math.min(10,Math.max(0,(hr.hr_processDonePctThis||0)-(hr.hr_processDonePctPrev||0))/10*10)*0.4;
    const salesScore = Math.min(10,Math.max(0,(sales.sa_revenueThis||0)-(sales.sa_revenuePrev||0))/300000*10)*0.7 + Math.min(10,Math.max(0,(sales.sa_conversionRateThis||0)-(sales.sa_conversionRatePrev||0))/5*10)*0.3;
    return round1(hrScore*0.8 + salesScore*0.2);
  }
  if(dept === "Operations Head"){
    const client_scores = (clients||[]).map(c=>{
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
    return round1(totalScore/n);
  }
  if(dept === "Web Head"){
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
function scoreLearning(entries){ const total = (entries||[]).reduce((s,e)=>s+(e.durationMins||0),0); return round1(Math.min(10, (total / 360) * 10)); }
function scoreRelationshipFromClients(clients, dept){
  let meetings=0, appr=0, esc=0, satSum=0, satCnt=0, totalInteractions=0;
  (clients||[]).forEach(c=>{ 
    if (c.relationship) {
      meetings += c.relationship.meetings?.length || 0; 
      appr += c.relationship.appreciations?.length || 0; 
      esc += c.relationship.escalations?.length || 0; 
      const s=c.relationship.clientSatisfaction||0; 
      if(s>0){ satSum+=s; satCnt++; } 
      totalInteractions += c.clientInteractions || 0;
    }
    if (c.op_appreciations) {
      appr += c.op_appreciations.length || 0;
    }
    if (c.op_escalations) {
      esc += c.op_escalations.length || 0;
    }
  });

  const ms=Math.min(4,meetings*0.8), as=Math.min(3,appr*0.75), ep=Math.min(5,esc*1.5); // caps
  const sat = Math.min(3, (satCnt? (satSum/satCnt):0) *0.3);
  const interactionScore = Math.min(10, totalInteractions/50 * 5); // Example scoring
  return round1(Math.max(0, ms+as+sat-ep)); // out of 10
}
function overallOutOf10(kpi, learning, rel, manager){ return round1((kpi*0.4 + learning*0.3 + rel*0.2 + manager*0.1)); }

function generateSummary(model){
  const names = (model.clients||[]).map(c=>c.name).filter(Boolean);
  const meet = (model.clients||[]).reduce((s,c)=> s + (c.relationship?.meetings?.length||0), 0);
  const esc  = (model.clients||[]).reduce((s,c)=> s + (c.relationship?.escalations?.length||0), 0);
  const appr = (model.clients||[]).reduce((s,c)=> s + (c.relationship?.appreciations?.length||0), 0);
  const learnMin = (model.learning||[]).reduce((s,e)=>s+(e.durationMins||0),0);
  const parts = [];
  parts.push(`Handled ${names.length} client(s): ${names.join(', ')||'—'}.`);
  parts.push(`Meetings ${meet}, Appreciations ${appr}, Escalations ${esc}.`);
  parts.push(`Learning: ${(learnMin/60).toFixed(1)}h (${learnMin>=360?'Meets 6h':'Below 6h'}).`);
  if(model.flags?.missingReports) parts.push('⚠️ Missing report links for some clients.');
  if(model.flags?.hasEscalations) parts.push('⚠️ Escalations present — investigate.');
  parts.push(`Scores — KPI ${model.scores?.kpiScore}/10, Learning ${model.scores?.learningScore}/10, Client Status ${model.scores?.relationshipScore}/10, Overall ${model.scores?.overall}/10.`);
  if (model.manager?.score) parts.push(`Manager Score: ${model.manager.score}/10`);
  return parts.join(' ');
}

/****************
 * Theming Bits  *
 ****************/
const HeaderBrand = () => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">BP</div>
    <div className="font-bold">Branding Pioneers • Monthly Tactical</div>
  </div>
);
const ADMIN_TOKEN = "admin";

/****************
 * App Shell    *
 ****************/
const EMPTY_SUBMISSION = {
  id: uid(),
  monthKey: thisMonthKey(),
  isDraft: true,
  employee: { name: "", department: "Web", role: [], phone: "" }, // Default role is now an empty array
  meta: { attendance: { wfo: 0, wfh: 0 }, tasks: { count: 0, aiTableLink: "", aiTableScreenshot: "" } },
  clients: [],
  learning: [],
  aiUsageNotes: "",
  flags: { missingLearningHours: false, hasEscalations: false, omittedChecked: false, missingReports: false },
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
const ModalContext = React.createContext({ openModal: () => {}, closeModal: () => {} });
const useModal = () => React.useContext(ModalContext);

// Custom Modal component
function Modal({ isOpen, onClose, title, message, onConfirm, onCancel, inputLabel, inputValue, onInputChange }) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      const submissions = Storage.load().filter(s => !s.isDraft);
      setAllSubmissions(submissions);
    } catch (e) {
      console.error("Failed to load submissions from local storage:", e);
      setError("Failed to load local data.");
      setAllSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { allSubmissions, loading, error };
}

export default function App(){
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
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white text-gray-900 font-sans">
        <Modal {...modalState} />
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b z-20">
          <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
            <HeaderBrand/>
            <div className="flex items-center gap-3">
              {isManagerLoggedIn && <button onClick={handleLogout} className="text-sm px-3 py-1 border rounded-xl bg-gray-100 hover:bg-gray-200">Log Out</button>}
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-4">
          {isManagerLoggedIn ? (
            <ManagerSection />
          ) : (
            <EmployeeForm/>
          )}
        </main>
        <footer className="bg-white/80 backdrop-blur-md border-t mt-auto py-6">
          <div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
            <div className="mb-2 md:mb-0">
              <div className="flex items-center gap-2">
                <span>Created for Branding Pioneers Agency</span>
                <span className="text-gray-400">•</span>
                <span>v8</span>
              </div>
            </div>
            <div className="flex-1 md:text-right md:ml-8">
              <h2 className="text-lg font-bold mb-2 text-gray-800">Manager Login</h2>
              <form onSubmit={handleLogin} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <input
                  type="password"
                  className="flex-grow sm:flex-grow-0 sm:w-48 border rounded-xl p-2 text-sm text-gray-900"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2 text-sm font-semibold"
                >
                  Log In
                </button>
              </form>
              {loginError && <p className="text-red-500 text-sm mt-2 md:text-right">{loginError}</p>}
            </div>
          </div>
        </footer>
      </div>
    </ModalContext.Provider>
  );
}

/**********************
 * Employee Form View *
 **********************/
function EmployeeForm(){
  const { openModal, closeModal } = useModal();
  const { allSubmissions } = useFetchSubmissions();
  
  const [currentSubmission, setCurrentSubmission] = useState({ ...EMPTY_SUBMISSION, isDraft:true });
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

  const kpiScore = useMemo(()=>scoreKPIs(currentSubmission.employee, currentSubmission.clients), [currentSubmission.employee, currentSubmission.clients]);
  const learningScore = useMemo(()=>scoreLearning(currentSubmission.learning), [currentSubmission.learning]);
  const relationshipScore = useMemo(()=>scoreRelationshipFromClients(currentSubmission.clients), [currentSubmission.employee, currentSubmission.clients]);
  const overall = useMemo(()=>overallOutOf10(kpiScore, learningScore, relationshipScore, currentSubmission.manager?.score), [kpiScore,learningScore,relationshipScore, currentSubmission.manager?.score]);

  const flags = useMemo(()=>{
    const learningMins = (currentSubmission.learning||[]).reduce((s,e)=>s+(e.durationMins||0),0);
    const missingLearningHours = learningMins < 360;
    const hasEscalations = (currentSubmission.clients||[]).some(c=> (c.relationship?.escalations||[]).length>0);
    const missingReports = (currentSubmission.clients||[]).some(c=> (c.reports||[]).length===0);
    return { missingLearningHours, hasEscalations, missingReports };
  },[currentSubmission]);
  
  useEffect(()=>{
    setCurrentSubmission(m=>{
      const nextScores = { kpiScore, learningScore, relationshipScore, overall };
      const sameScores = JSON.stringify(nextScores) === JSON.stringify(m.scores||{});
      const sameFlags = JSON.stringify(flags) === JSON.stringify(m.flags||{});
      if (sameScores && sameFlags) return m;
      return { ...m, flags, scores: nextScores };
    });
  },[kpiScore, learningScore, relationshipScore, overall, flags]);

  async function submitFinal(){
    const check = validateSubmission(currentSubmission);
    if(!check.ok){
      openModal(
        "Validation Errors",
        `Please fix the following before submitting:\n\n${check.errors.map((e,i)=> `${i+1}. ${e}`).join('\n')}`,
        closeModal
      );
      return;
    }
    const final = { ...currentSubmission, id: uid(), isDraft:false, employee: { ...currentSubmission.employee, name: (currentSubmission.employee?.name||"").trim(), phone: currentSubmission.employee.phone } };

    // local backup
    const all = Storage.load().filter(x=>x.employee?.phone !== final.employee?.phone);
    Storage.save([...all, final]);

    openModal("Submission Result", "Submitted! (Saved to local storage)", closeModal);

    setCurrentSubmission({ ...EMPTY_SUBMISSION, id: uid(), monthKey: currentSubmission.monthKey });
    setSelectedEmployee(null);
  }

  const mPrev = previousSubmission ? previousSubmission.monthKey : prevMonthKey(currentSubmission.monthKey);
  const mThis = currentSubmission.monthKey;
  const rolesForDept = ROLES_BY_DEPT[currentSubmission.employee.department] || [];
  const isNewEmployee = !selectedEmployee;

  return (
    <div>
      <Section title="1) Employee & Report Month">
        <div className="grid md:grid-cols-4 gap-3">
          {/* Employee Selection dropdown */}
          <div className="md:col-span-2">
            <label className="text-sm">Select Employee</label>
            <select
              className="w-full border rounded-xl p-2"
              value={selectedEmployee ? `${selectedEmployee.name}-${selectedEmployee.phone}` : ""}
              onChange={(e) => {
                if(e.target.value === "") {
                  setSelectedEmployee(null);
                  setCurrentSubmission({...EMPTY_SUBMISSION, id: uid(), monthKey: thisMonthKey()});
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
            <TextField label="Name" placeholder="Your name" value={currentSubmission.employee.name||""} onChange={v=>updateCurrentSubmission('employee.name', v)}/>
          )}
          {isNewEmployee && (
            <TextField label="Phone Number" placeholder="e.g., 9876543210" value={currentSubmission.employee.phone||""} onChange={v=>updateCurrentSubmission('employee.phone', v)} />
          )}
          <div>
            <label className="text-sm">Department</label>
            <select className="w-full border rounded-xl p-2" value={currentSubmission.employee.department} onChange={e=>updateCurrentSubmission('employee.department', e.target.value)}>
              {DEPARTMENTS.map(d=> <option key={d}>{d}</option>)}
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
            <input type="month" className="w-full border rounded-xl p-2" value={currentSubmission.monthKey} onChange={e=>updateCurrentSubmission('monthKey', e.target.value)} />
            <div className="text-xs text-gray-500 mt-1">Comparisons: {monthLabel(mPrev)} vs {monthLabel(mThis)}</div>
          </div>
        </div>
      </Section>

      <Section title="1b) Attendance & Tasks (this month)">
        <div className="grid md:grid-cols-4 gap-3">
          <NumField label="WFO days (0–30)" value={currentSubmission.meta.attendance.wfo} onChange={v=>updateCurrentSubmission('meta.attendance.wfo', v)}/>
          <NumField label="WFH days (0–30)" value={currentSubmission.meta.attendance.wfh} onChange={v=>updateCurrentSubmission('meta.attendance.wfh', v)}/>
          <div className="md:col-span-2 text-xs text-gray-500 mt-1">
            Total cannot exceed the number of days in {currentSubmission.monthKey} ({daysInMonth(currentSubmission.monthKey)} days).
          </div>
          <NumField label="Tasks completed (per AI table)" value={currentSubmission.meta.tasks.count} onChange={v=>updateCurrentSubmission('meta.tasks.count', v)}/>
          <TextField label="AI Table / PM link (Drive/URL)" value={currentSubmission.meta.tasks.aiTableLink} onChange={v=>updateCurrentSubmission('meta.tasks.aiTableLink', v)}/>
          <TextField label="AI Table screenshot (Drive URL)" value={currentSubmission.meta.tasks.aiTableScreenshot} onChange={v=>updateCurrentSubmission('meta.tasks.aiTableScreenshot', v)}/>
        </div>
      </Section>

      <DeptClientsBlock currentSubmission={currentSubmission} previousSubmission={previousSubmission} setModel={setCurrentSubmission} monthPrev={mPrev} monthThis={mThis} openModal={openModal} closeModal={closeModal}/>
      <LearningBlock model={currentSubmission} setModel={setCurrentSubmission} openModal={openModal}/>

      <Section title="5) AI Usage (Optional)">
        <textarea className="w-full border rounded-xl p-3" rows={4} placeholder="List ways you used AI to work faster/better this month. Include links or examples." value={currentSubmission.aiUsageNotes} onChange={e=>updateCurrentSubmission('aiUsageNotes', e.target.value)}/>
      </Section>

      <Section title="AI Summary & Suggestions">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="bg-blue-600 text-white rounded-2xl p-4"><div className="text-sm opacity-80">KPI</div><div className="text-3xl font-semibold">{currentSubmission.scores.kpiScore}/10</div></div>
          <div className="bg-blue-600 text-white rounded-2xl p-4"><div className="text-sm opacity-80">Learning</div><div className="text-3xl font-semibold">{currentSubmission.scores.learningScore}/10</div></div>
          <div className="bg-blue-600 text-white rounded-2xl p-4"><div className="text-sm opacity-80">Client Status</div><div className="text-3xl font-semibold">{currentSubmission.scores.relationshipScore}/10</div></div>
          <div className="bg-blue-600 text-white rounded-2xl p-4"><div className="text-sm opacity-80">Overall</div><div className="text-3xl font-semibold">{currentSubmission.scores.overall}/10</div></div>
        </div>
        <div className="mt-4 text-sm bg-blue-50 border border-blue-100 rounded-xl p-3 whitespace-pre-wrap">{generateSummary(currentSubmission)}</div>
      </Section>

      <div className="flex items-center gap-3">
        <button onClick={submitFinal} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-5 py-3">Submit Monthly Report</button>
      </div>
    </div>
  );
}

/***********************
 * Validation helpers  *
 ***********************/
function validateSubmission(model){
  const errors = [];
  const m = model || {};
  const emp = m.employee || {};
  const dept = emp.department || "";
  const monthKey = m.monthKey || "";

  // Helper to validate YYYY-MM-DD date string from date picker
  const isDateYYYYMMDD = (d) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
  const isUrl = (u) => !!u && u.startsWith('http');
  const isPhoneNumber = (p) => !!p && /^\d{10}$/.test(p);
  const isDriveUrl = (u)=> /https?:\/\/(drive|docs)\.google\.com\//i.test(u||"");
  const isGensparkUrl = (u) => /https?:\/\/(www\.)?genspark\.ai/i.test(u||"");

  // 1) employee + month
  if (!emp.name || !emp.name.trim()) errors.push("Enter your Name.");
  if (!dept) errors.push("Select Department.");
  if (!emp.role || emp.role.length === 0) errors.push("Select at least one Role.");
  if (!monthKey) errors.push("Pick Report Month (YYYY-MM).");
  if (!emp.phone || !isPhoneNumber(emp.phone)) errors.push("Enter a valid 10-digit Phone Number.");

  // 2) attendance & tasks
  const meta = m.meta || {};
  const att = meta.attendance || { wfo:0, wfh:0 };
  const wfo = Number(att.wfo || 0);
  const wfh = Number(att.wfh || 0);
  if (wfo < 0 || wfo > 30) errors.push("WFO days must be between 0 and 30.");
  if (wfh < 0 || wfh > 30) errors.push("WFH days must be between 0 and 30.");

  const maxDays = daysInMonth(monthKey);
  if (wfo + wfh > maxDays) {
    errors.push(`Attendance total (WFO+WFH) cannot exceed ${maxDays} for ${monthKey}.`);
  }

  const tasks = (meta.tasks || {});
  const tCount = Number(tasks.count || 0);
  const aiTableLink = tasks.aiTableLink || "";
  const aiTableScreenshot = tasks.aiTableScreenshot || "";
  if (tCount > 0 && !aiTableLink && !aiTableScreenshot) {
    errors.push("Tasks completed > 0: provide an AI table link or a Drive screenshot.");
  }
  if (aiTableLink && !isUrl(aiTableLink)) errors.push("AI table link must be a valid URL.");
  if (aiTableScreenshot && !isDriveUrl(aiTableScreenshot)) errors.push("AI table screenshot must be a Google Drive URL.");

  // 3) learning
  // No longer a mandatory field

  // 4) clients & dept KPIs
  const clients = m.clients || [];
  const isInternal = ["HR","Accounts","Sales","Blended (HR + Sales)"].includes(dept);
  const isWebHead = dept === "Web Head";
  const isOpsHead = dept === "Operations Head";
  if (!isInternal && clients.length===0 && !isWebHead && !isOpsHead) errors.push("Add at least one Client for this department.");

  clients.forEach((c, idx)=>{
    const row = `Client "${c?.name || `#${idx+1}`}"`;

    if (!c.name || !c.name.trim()) errors.push(`${row}: name is required.`);
    const isGraphicDesigner = emp.role.includes("Graphic Designer");
    const needsReports = !["Web", "Web Head", "Social Media"].includes(dept) || (dept === "Social Media" && !isGraphicDesigner);

    if (needsReports){
      if(!c.reports || c.reports.length===0) errors.push(`${c.name||'Client'}: add at least one report/proof link (Drive/Genspark).`);
      if((c.reports||[]).some(r=> !isDriveUrl(r.url) && !isGensparkUrl(r.url))) errors.push(`${c.name||'Client'}: report/proof links must be Google Drive/Docs or Genspark URLs.`);
    }

    if (dept === "SEO") {
      if (c?.seo_trafficThis == null) {
        errors.push(`${row}: enter Organic Traffic (this month).`);
      }

      const kws = c?.seo_keywordsWorked || [];
      kws.forEach((k,ki)=>{
        if (!k.keyword || !k.keyword.trim()) errors.push(`${row}: Keyword #${ki+1} missing text.`);
        if (k.searchVolume == null || Number.isNaN(Number(k.searchVolume))) errors.push(`${row}: Keyword #${ki+1} missing search volume.`);
      });

      if (kws.length > 0) {
        const hasTop3 = kws.some(k => Number(k.rankNow) > 0 && Number(k.rankNow) <= 3);
        if (!hasTop3) {
          errors.push(`${row}: provide at least one keyword currently ranking in Top 3 (or remove keywords section for this client).`);
        }
      }

      if ((c?.seo_aiOverviewPrev != null) ^ (c?.seo_aiOverviewThis != null)){
        errors.push(`${row}: AI overview traffic should have prev & this values for comparison.`);
      }
    } else if (dept === "Web" || dept === "Web Head") {
      if (Number(c?.web_saasUpsells || 0) > 0 && c?.web_saasProof && !isDriveUrl(c.web_saasProof)){
        errors.push(`${row}: SaaS upsell proof must be a Google Drive/Docs URL.`);
      }
    } else if (dept === "Social Media" && isGraphicDesigner) {
        if (!c.sm_creativesThis) {
            errors.push(`${row}: Graphic Designer role requires a number of creatives.`)
        }
    } else if (dept === "Operations Head") {
        if(!c.op_clientScope || c.op_clientScope.length === 0) errors.push(`${row}: select at least one client scope.`);
        if(c.op_paymentDate && !isDateYYYYMMDD(c.op_paymentDate)) errors.push(`${row}: enter client payment date.`);
        if(c.op_clientStatus === 'Upgraded' || c.op_clientStatus === 'Left' || c.op_clientStatus === 'Reduced') {
          if (!c.op_clientStatusReason || !c.op_clientStatusReason.trim()) errors.push(`${row}: provide a reason for the client status.`);
        }
    }
    
    // Client Report Status + payments + meetings
    if (!isGraphicDesigner && !isWebHead) {
      const rel = c.relationship||{};
      if(rel.roadmapSentDate && !isDateYYYYMMDD(rel.roadmapSentDate)) errors.push(`${c.name||'Client'}: Roadmap Sent Date is required.`);
      if(rel.reportSentDate && !isDateYYYYMMDD(rel.reportSentDate)) errors.push(`${c.name||'Client'}: Report Sent Date is required.`);
      if(rel.meetings?.some(m=> m.notesLink && !isDriveUrl(m.notesLink))) errors.push(`${c.name||'Client'}: Meeting notes links must be Drive.`);
      if(rel.paymentReceived && !isDateYYYYMMDD(rel.paymentDate)) errors.push(`${c.name||'Client'}: Payment date required.`);
      if(rel.clientSatisfaction && (rel.clientSatisfaction<1 || rel.clientSatisfaction>10)) errors.push(`${c.name||'Client'}: Client satisfaction must be 1–10.`);
      if((rel.appreciations||[]).some(a=>a.url && !isDriveUrl(a.url))) errors.push(`${c.name||'Client'}: Appreciation proof links must be Google Drive/Docs.`);
      if((rel.escalations||[]).some(a=>a.url && !isDriveUrl(a.url))) errors.push(`${c.name||'Client'}: Escalation proof links must be Google Drive/Docs.`);
    }

  });

  return { ok: errors.length===0, errors };
}

/************************
 * Clients & KPI Section *
 ************************/
function DeptClientsBlock({currentSubmission, previousSubmission, setModel, monthPrev, monthThis, openModal, closeModal}){
  const isInternal = ["HR","Accounts","Sales","Blended (HR + Sales)"].includes(currentSubmission.employee.department);
  const isWebHead = currentSubmission.employee.department === "Web Head";
  const isOpsHead = currentSubmission.employee.department === "Operations Head";

  return (
    <Section title="2) KPIs, Reports & Client Report Status">
      {(isInternal && !isOpsHead && !isWebHead) ? (
        <InternalKPIs model={currentSubmission} prevModel={previousSubmission} setModel={setModel} monthPrev={monthPrev} monthThis={monthThis} />
      ) : (
        <ClientTable currentSubmission={currentSubmission} previousSubmission={previousSubmission} setModel={setModel} monthPrev={monthPrev} monthThis={monthThis} openModal={openModal} closeModal={closeModal}/>
      )}
    </Section>
  );
}

function ClientTable({currentSubmission, previousSubmission, setModel, monthPrev, monthThis, openModal, closeModal}){
  const [draftRow, setDraftRow] = useState({ name:"", scopeOfWork:"", url:"" });
  const isOpsHead = currentSubmission.employee.department === "Operations Head";
  const isWebHead = currentSubmission.employee.department === "Web Head";
  const isGraphicDesigner = currentSubmission.employee.role?.includes("Graphic Designer");
  const hasClientStatusSection = ["SEO", "Social Media", "Ads", "Operations Head"].includes(currentSubmission.employee.department);

  function pushDraft(){
    if(!draftRow.name.trim()) return;
    if(draftRow.url && !isDriveUrl(draftRow.url) && !isGensparkUrl(draftRow.url)) {
      openModal('Invalid Link', 'Please paste a Google Drive, Google Docs, or Genspark URL.', closeModal);
      return;
    }
    const base = { id: uid(), name: draftRow.name.trim(), reports: [], relationship: { roadmapSentDate:'', reportSentDate:'', meetings:[], appreciations:[], escalations:[], clientSatisfaction:0, paymentReceived:false, paymentDate:'', omissionSuspected:'No' } };
    const withReport = (draftRow.url)
      ? { ...base, reports:[{ id: uid(), label: draftRow.scopeOfWork.trim()||'Report', url: draftRow.url.trim() }] }
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
    
    if(isWebHead){
      withReport.web_saasUpsells = 0;
      withReport.web_saasProof = "";
      withReport.web_pagesThis = 0;
      withReport.web_onTimeThis = 0;
    }

    setModel(m=>({ ...m, clients:[...m.clients, withReport] }));
    setDraftRow({ name:"", scopeOfWork:"", url:"" });
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
      <p className="text-xs text-gray-600 mb-2">Upload <b>Google Drive</b> or **Genspark URL** links only (give view access). Use Scope of Work to describe the link (e.g., GA4 Dashboard, Ads PDF, WhatsApp screenshot).</p>
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
        <table className="w-full text-sm border-separate" style={{borderSpacing:0}}>
          <thead>
            <tr className="bg-blue-50">
              <th className="text-left p-2 border">Client</th>
              <th className="text-left p-2 border">Scope of Work</th>
              <th className="text-left p-2 border">Drive/Genspark URL</th>
              <th className="text-left p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentSubmission.clients.map(c=> (
              <tr key={c.id} className="odd:bg-white even:bg-blue-50/40">
                <td className="p-2 border font-medium">{c.name}</td>
                <td className="p-2 border" colSpan={2}>
                  <TinyLinks
                    items={(c.reports||[])}
                    onAdd={(r)=>{
                      if(!isDriveUrl(r.url) && !isGensparkUrl(r.url)) {
                        openModal('Invalid Link', 'Please paste a Google Drive/Docs or Genspark URL link.', closeModal);
                        return;
                      }
                      setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?{...x, reports:[...(x.reports||[]), r]}:x)}));
                    }}
                    onRemove={(id)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?{...x, reports:x.reports.filter(rr=>rr.id!==id)}:x)}))}
                  />
                </td>
                <td className="p-2 border">
                  <button className="text-xs text-red-600" onClick={()=>setModel(m=>({...m, clients: m.clients.filter(x=>x.id!==c.id)}))}>Remove</button>
                </td>
              </tr>
            ))}
            <tr className="bg-amber-50">
              <td className="p-2 border">
                <input className="w-full border rounded-lg p-2" placeholder="Enter client name" value={draftRow.name} onChange={e=>setDraftRow(d=>({...d, name:e.target.value}))} />
              </td>
              <td className="p-2 border">
                <textarea className="w-full border rounded-lg p-2" rows={2} placeholder="Scope of Work (Dashboard, PDF, WhatsApp…)" value={draftRow.scopeOfWork} onChange={e=>setDraftRow(d=>({...d, scopeOfWork:e.target.value}))} />
              </td>
              <td className="p-2 border">
                <input className="w-full border rounded-lg p-2" placeholder="Google Drive or Genspark URL (view access)" value={draftRow.url} onChange={e=>setDraftRow(d=>({...d, url:e.target.value}))} />
              </td>
              <td className="p-2 border">
                <button className="px-3 py-2 rounded-lg bg-blue-600 text-white" onClick={pushDraft}>Add Client</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {currentSubmission.clients.length===0 && (
        <div className="text-sm text-gray-600 mt-2">Start by typing a client name in the first row, optionally add a Drive link, then hit <b>Add Client</b>. KPIs for that client will appear below.</div>
      )}

      {currentSubmission.clients.map(c=> {
        const prevClient = previousSubmission?.clients.find(pc => pc.name === c.name) || {};
        const isNewClient = !previousSubmission || Object.keys(prevClient).length === 0;
        return (
          <div key={c.id} className="border rounded-2xl p-4 my-4 bg-white">
            <div className="font-semibold mb-2">KPIs • {c.name} <span className="text-xs text-gray-500">({monthLabel(monthPrev)} vs {monthLabel(monthThis)})</span></div>
            {currentSubmission.employee.department === 'Web' && (
              <KPIsWeb client={c} prevClient={prevClient} onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))} monthPrev={monthPrev} monthThis={monthThis} isNewClient={isNewClient}/>
            )}
            {currentSubmission.employee.department === 'Social Media' && (
              <KPIsSocial client={c} prevClient={prevClient} employeeRole={currentSubmission.employee.role} onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))} monthPrev={monthPrev} monthThis={monthThis} isNewClient={isNewClient}/>
            )}
            {currentSubmission.employee.department === 'Ads' && (
              <KPIsAds client={c} prevClient={prevClient} onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))} monthPrev={monthPrev} monthThis={monthThis} isNewClient={isNewClient}/>
            )}
            {currentSubmission.employee.department === 'SEO' && (
              <KPIsSEO client={c} prevClient={prevClient} onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))} monthPrev={monthPrev} monthThis={monthThis} openModal={openModal} closeModal={closeModal} isNewClient={isNewClient}/>
            )}
            {isWebHead && (
              <KPIsWebHead client={c} prevClient={prevClient} onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))} monthPrev={monthPrev} monthThis={monthThis} isNewClient={isNewClient} />
            )}
            {isOpsHead && (
              <KPIsOperationsHead client={c} onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))} />
            )}
            {hasClientStatusSection && (
              <ClientReportStatus client={c} prevClient={prevClient} onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))}/>
            )}
          </div>
        )})}
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

function ProofField({label, value, onChange}){
  return (
    <div>
      <label className="text-xs text-gray-600">{label} (Drive URL)</label>
      <input className="w-full border rounded-xl p-2" placeholder="https://drive.google.com/..." value={value||""} onChange={e=>onChange(e.target.value)} />
    </div>
  );
}

function KPIsWeb({client, prevClient, onChange, monthPrev, monthThis, isNewClient}){
  const delta = (a,b)=> (a||0) - (b||0);
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      {isNewClient ? (
        <NumField label={`# Pages (${monthLabel(monthPrev)})`} value={client.web_pagesPrev || 0} onChange={v=>onChange({...client, web_pagesPrev: v})}/>
      ) : (
        <PrevValue label={`# Pages (${monthLabel(monthPrev)})`} value={prevClient.web_pagesThis || 0} />
      )}
      <NumField label={`# Pages (${monthLabel(monthThis)})`} value={client.web_pagesThis||0} onChange={v=>onChange({...client, web_pagesThis:v})}/>
      {isNewClient ? (
        <NumField label={`On-time % (${monthLabel(monthPrev)})`} value={client.web_onTimePrev || 0} onChange={v=>onChange({...client, web_onTimePrev: v})}/>
      ) : (
        <PrevValue label={`On-time % (${monthLabel(monthPrev)})`} value={prevClient.web_onTimeThis || 0} />
      )}
      <NumField label={`On-time % (${monthLabel(monthThis)})`} value={client.web_onTimeThis||0} onChange={v=>onChange({...client, web_onTimeThis:v})}/>
      {isNewClient ? (
        <NumField label={`Bugs Fixed (${monthLabel(monthPrev)})`} value={client.web_bugsPrev || 0} onChange={v=>onChange({...client, web_bugsPrev: v})}/>
      ) : (
        <PrevValue label={`Bugs Fixed (${monthLabel(monthPrev)})`} value={prevClient.web_bugsThis || 0} />
      )}
      <NumField label={`Bugs Fixed (${monthLabel(monthThis)})`} value={client.web_bugsThis||0} onChange={v=>onChange({...client, web_bugsThis:v})}/>
      <NumField label="# SaaS tools upsold (this)" value={client.web_saasUpsells||0} onChange={v=>onChange({...client, web_saasUpsells:v})}/>
      <ProofField label="SaaS proof / invoice / deck" value={client.web_saasProof} onChange={(v)=>onChange({...client, web_saasProof:v})}/>
      <ProofField label="CRO/Design review proof" value={client.web_proof} onChange={(v)=>onChange({...client, web_proof:v})}/>
      <div className="md:col-span-4 text-xs text-gray-600">MoM Pages Δ: {delta(client.web_pagesThis, isNewClient ? client.web_pagesPrev : prevClient.web_pagesThis)} • On-time Δ: {round1((client.web_onTimeThis||0)-(isNewClient ? client.web_onTimePrev : prevClient.web_onTimeThis||0))} • Bugs Δ: {delta(client.web_bugsThis, isNewClient ? client.web_bugsPrev : prevClient.web_bugsThis)}</div>
    </div>
  );
}

function KPIsWebHead({client, prevClient, onChange}){
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
        <NumField label={`# Pages Delivered`} value={client.web_pagesThis||0} onChange={v=>onChange({...client, web_pagesThis:v})}/>
        <NumField label={`On-time % Delivered`} value={client.web_onTimeThis||0} onChange={v=>onChange({...client, web_onTimeThis:v})}/>
        <NumField label="# SaaS tools upsold (this)" value={client.web_saasUpsells||0} onChange={v=>onChange({...client, web_saasUpsells:v})}/>
        <ProofField label="Upsell proof / invoice" value={client.web_saasProof} onChange={v=>onChange({...client, web_saasProof:v})}/>
    </div>
  );
}


function KPIsSocial({client, prevClient, employeeRole, onChange, monthPrev, monthThis, isNewClient}){
  const folDelta = (client.sm_followersThis||0) - (isNewClient ? (client.sm_followersPrev||0) : (prevClient.sm_followersThis||0));
  const reachDelta = (client.sm_reachThis||0) - (isNewClient ? (client.sm_reachPrev||0) : (prevClient.sm_reachThis||0));
  const erDelta = (client.sm_erThis||0) - (isNewClient ? (client.sm_erPrev||0) : (prevClient.sm_erThis||0));
  const isDesigner = employeeRole?.includes('Graphic Designer');
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      {!isDesigner && (
        <>
          {isNewClient ? (
            <NumField label={`Followers (${monthLabel(monthPrev)})`} value={client.sm_followersPrev || 0} onChange={v=>onChange({...client, sm_followersPrev:v})}/>
          ) : (
            <PrevValue label={`Followers (${monthLabel(monthPrev)})`} value={prevClient.sm_followersThis || 0} />
          )}
          <NumField label={`Followers (${monthLabel(monthThis)})`} value={client.sm_followersThis||0} onChange={v=>onChange({...client, sm_followersThis:v})}/>
          {isNewClient ? (
            <NumField label={`Reach (${monthLabel(monthPrev)})`} value={client.sm_reachPrev || 0} onChange={v=>onChange({...client, sm_reachPrev:v})}/>
          ) : (
            <PrevValue label={`Reach (${monthLabel(monthPrev)})`} value={prevClient.sm_reachThis || 0} />
          )}
          <NumField label={`Reach (${monthLabel(monthThis)})`} value={client.sm_reachThis||0} onChange={v=>onChange({...client, sm_reachThis:v})}/>
          {isNewClient ? (
            <NumField label={`Engagement Rate % (${monthLabel(monthPrev)})`} value={client.sm_erPrev || 0} onChange={v=>onChange({...client, sm_erPrev:v})}/>
          ) : (
            <PrevValue label={`Engagement Rate % (${monthLabel(monthPrev)})`} value={prevClient.sm_erThis || 0} />
          )}
          <NumField label={`Engagement Rate % (${monthLabel(monthThis)})`} value={client.sm_erThis||0} onChange={v=>onChange({...client, sm_erThis:v})}/>
          <NumField label="# Campaigns (this)" value={client.sm_campaignsThis||0} onChange={v=>onChange({...client, sm_campaignsThis:v})}/>
          <p className="md:col-span-4 text-xs text-gray-600">MoM Δ — Followers: {folDelta} • Reach: {reachDelta} • ER: {round1(erDelta)}</p>
          <TextField label="Best Performing Post (title/desc)" value={client.sm_bestPostTitle||""} onChange={v=>onChange({...client, sm_bestPostTitle:v})}/>
          <ProofField label="Best Post proof (post URL / insights)" value={client.sm_bestPostProof} onChange={v=>onChange({...client, sm_bestPostProof:v})}/>
          <TextArea label="Distribution Achievements (what you did)" rows={3} value={client.sm_distributionNotes||""} onChange={v=>onChange({...client, sm_distributionNotes:v})} className="md:col-span-2"/>
          <ProofField label="Campaign proof (deck / screenshots)" value={client.sm_campaignProof} onChange={v=>onChange({...client, sm_campaignProof:v})}/>
        </>
      )}
      {isDesigner && (
        <>
          <h4 className="font-semibold text-sm col-span-4 mt-2">Graphic Designer KPIs</h4>
          <NumField label="Graphics (Photoshop)" value={client.sm_graphicsPhotoshop||0} onChange={v=>onChange({...client, sm_graphicsPhotoshop:v})}/>
          <NumField label="Graphics (Canva)" value={client.sm_graphicsCanva||0} onChange={v=>onChange({...client, sm_graphicsCanva:v})}/>
          <NumField label="Graphics (AI)" value={client.sm_graphicsAi||0} onChange={v=>onChange({...client, sm_graphicsAi:v})}/>
          <NumField label="Short Videos" value={client.sm_shortVideos||0} onChange={v=>onChange({...client, sm_shortVideos:v})}/>
          <NumField label="Long Videos" value={client.sm_longVideos||0} onChange={v=>onChange({...client, sm_longVideos:v})}/>
          <NumField label="Quality Score (1-10)" value={client.sm_qualityScore||0} onChange={v=>onChange({...client, sm_qualityScore:v})}/>
        </>
      )}
    </div>
  );
}

function KPIsAds({client, prevClient, onChange, monthPrev, monthThis, isNewClient}){
  const cplDelta = (client.ads_cplThis||0) - (isNewClient ? (client.ads_cplPrev||0) : (prevClient.ads_cplThis||0));
  const ctrDelta = (client.ads_ctrThis||0) - (isNewClient ? (client.ads_ctrPrev||0) : (prevClient.ads_ctrThis||0));
  const leadsDelta = (client.ads_leadsThis||0) - (isNewClient ? (client.ads_leadsPrev||0) : (prevClient.ads_leadsThis||0));
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      <NumField label="# New Ads Created (this)" value={client.ads_newAds||0} onChange={v=>onChange({...client, ads_newAds:v})}/>
      {isNewClient ? (
        <NumField label={`CTR % (${monthLabel(monthPrev)})`} value={client.ads_ctrPrev || 0} onChange={v=>onChange({...client, ads_ctrPrev:v})}/>
      ) : (
        <PrevValue label={`CTR % (${monthLabel(monthPrev)})`} value={prevClient.ads_ctrThis || 0} />
      )}
      <NumField label={`CTR % (${monthLabel(monthThis)})`} value={client.ads_ctrThis||0} onChange={v=>onChange({...client, ads_ctrThis:v})}/>
      {isNewClient ? (
        <NumField label={`CPL (${monthLabel(monthPrev)})`} value={client.ads_cplPrev || 0} onChange={v=>onChange({...client, ads_cplPrev:v})}/>
      ) : (
        <PrevValue label={`CPL (${monthLabel(monthPrev)})`} value={prevClient.ads_cplThis || 0} />
      )}
      <NumField label={`CPL (${monthLabel(monthThis)})`} value={client.ads_cplThis||0} onChange={v=>onChange({...client, ads_cplThis:v})}/>
      {isNewClient ? (
        <NumField label={`Leads (${monthLabel(monthPrev)})`} value={client.ads_leadsPrev || 0} onChange={v=>onChange({...client, ads_leadsPrev:v})}/>
      ) : (
        <PrevValue label={`Leads (${monthLabel(monthPrev)})`} value={prevClient.ads_leadsThis || 0} />
      )}
      <NumField label={`Leads (${monthLabel(monthThis)})`} value={client.ads_leadsThis||0} onChange={v=>onChange({...client, ads_leadsThis:v})}/>
      <TextField label="Best Performing Ad (name/desc)" value={client.ads_bestAdTitle||""} onChange={v=>onChange({...client, ads_bestAdTitle:v})}/>
      <ProofField label="Best Ad proof (screenshot/insights)" value={client.ads_bestAdProof} onChange={v=>onChange({...client, ads_bestAdProof:v})}/>
      <TextArea label="Landing Page URL" value={client.ads_landingPageUrl || ""} onChange={v => onChange({...client, ads_landingPageUrl: v})} />
      <TextArea label="Landing Page Improvements" value={client.ads_landingPageImprovements || ""} onChange={v => onChange({...client, ads_landingPageImprovements: v})} />
      <p className="md:col-span-4 text-xs text-gray-600">MoM Δ — CTR: {round1(ctrDelta)}pp • CPL: {round1(cplDelta)} (↓ is better) • Leads: {leadsDelta}</p>
    </div>
  );
}

function KPIsSEO({client, prevClient, onChange, monthPrev, monthThis, openModal, closeModal, isNewClient}){
  const [kw, setKw] = useState(client.seo_keywordsWorked||[]);
  const [top3, setTop3] = useState(client.seo_top3||[]);
  useEffect(()=>{ onChange({...client, seo_keywordsWorked: kw}); },[kw]);
  useEffect(()=>{ onChange({...client, seo_top3: top3}); },[top3]);

  const addKw = ()=>{
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
        setKw(list=>[...list, newKw]);
        closeModal();
      }, closeModal, 'Proof URL', currentVal);
    };

    getKeyword();
  };
  const addTop3 = ()=>{
    let newTop3 = { keyword: '', searchVolume: 0, proof: '' };
    const getKeyword = (currentVal = '') => {
      openModal('Add Top 3 Keyword', 'Enter the keyword.', (keyword) => {
        if(!keyword) { closeModal(); return; }
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
        setTop3(list=>[...list, newTop3]);
        closeModal();
      }, closeModal, 'Proof URL', currentVal);
    };

    getKeyword();
  };
  const trafDelta = (client.seo_trafficThis||0) - (isNewClient ? (client.seo_trafficPrev||0) : (prevClient.seo_trafficThis||0));
  const llmDelta  = (client.seo_llmTrafficThis||0) - (isNewClient ? (client.seo_llmTrafficPrev||0) : (prevClient.seo_llmTrafficThis||0));
  const leadsDelta = (client.seo_leadsThis||0) - (isNewClient ? (client.seo_leadsPrev||0) : (prevClient.seo_leadsThis||0));
  const localCallsDelta = (client.seo_localCallsThis||0) - (isNewClient ? (client.seo_localCallsPrev||0) : (prevClient.seo_localCallsThis||0));
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      {isNewClient ? (
        <NumField label={`Organic Traffic (${monthLabel(monthPrev)})`} value={client.seo_trafficPrev || 0} onChange={v=>onChange({...client, seo_trafficPrev:v})}/>
      ) : (
        <PrevValue label={`Organic Traffic (${monthLabel(monthPrev)})`} value={prevClient.seo_trafficThis || 0} />
      )}
      <NumField label={`Organic Traffic (${monthLabel(monthThis)})`} value={client.seo_trafficThis||0} onChange={v=>onChange({...client, seo_trafficThis:v})}/>
      {isNewClient ? (
        <NumField label={`LLM/AI Overview Traffic (${monthLabel(monthPrev)})`} value={client.seo_llmTrafficPrev || 0} onChange={v=>onChange({...client, seo_llmTrafficPrev:v})}/>
      ) : (
        <PrevValue label={`LLM/AI Overview Traffic (${monthLabel(monthPrev)})`} value={prevClient.seo_llmTrafficThis || 0} />
      )}
      <NumField label={`LLM/AI Overview Traffic (${monthLabel(monthThis)})`} value={client.seo_llmTrafficThis||0} onChange={v=>onChange({...client, seo_llmTrafficThis:v})}/>
      {isNewClient ? (
        <NumField label={`Leads from SEO (${monthLabel(monthPrev)})`} value={client.seo_leadsPrev || 0} onChange={v=>onChange({...client, seo_leadsPrev:v})}/>
      ) : (
        <PrevValue label={`Leads from SEO (${monthLabel(monthPrev)})`} value={prevClient.seo_leadsThis || 0} />
      )}
      <NumField label={`Leads from SEO (${monthLabel(monthThis)})`} value={client.seo_leadsThis||0} onChange={v=>onChange({...client, seo_leadsThis:v})}/>
      <NumField label="# Keywords Improved (this)" value={client.seo_kwImprovedThis||0} onChange={v=>onChange({...client, seo_kwImprovedThis:v})}/>
      <NumField label="# AI Overviews / LLM (this)" value={client.seo_aiOverviewThis||0} onChange={v=>onChange({...client, seo_aiOverviewThis:v})}/>
      {isNewClient ? (
        <NumField label={`Local SEO Calls (${monthLabel(monthPrev)})`} value={client.seo_localCallsPrev || 0} onChange={v=>onChange({...client, seo_localCallsPrev:v})}/>
      ) : (
        <PrevValue label={`Local SEO Calls (${monthLabel(monthPrev)})`} value={prevClient.seo_localCallsThis || 0} />
      )}
      <NumField label={`Local SEO Calls (${monthLabel(monthThis)})`} value={client.seo_localCallsThis||0} onChange={v=>onChange({...client, seo_localCallsThis:v})}/>
      <ProofField label="Traffic/GA4 proof" value={client.seo_trafficProof} onChange={(v)=>onChange({...client, seo_trafficProof:v})}/>
      <ProofField label="AI Overview proof" value={client.seo_aiOverviewProof} onChange={(v)=>onChange({...client, seo_aiOverviewProof:v})}/>
      <div className="md:col-span-4 text-xs text-gray-600">MoM Δ — Organic: {trafDelta} {isNewClient ? '' : prevClient.seo_trafficThis? '('+round1((trafDelta/prevClient.seo_trafficThis)*100)+'%)' : ''} • LLM: {llmDelta} • SEO Leads: {leadsDelta} • Local Calls: {localCallsDelta}</div>

      <div className="md:col-span-4">
        <div className="flex items-center justify-between">
          <label className="text-sm">Keywords Worked (with Location & Volume)</label>
          <button className="text-xs px-2 py-1 bg-blue-600 text-white rounded-lg" onClick={addKw}>+ Add Keyword</button>
        </div>
        <div className="mt-2 space-y-1">
          {kw.map((k,i)=> (
            <div key={i} className="text-xs flex items-center justify-between border rounded-lg p-2 gap-2">
              <div className="truncate"><b>{k.keyword}</b> • {k.location||'—'} • SV {k.searchVolume} • Rank {k.rankPrev||"-"}→{k.rankNow||"-"} • <a className="underline" href={k.proof||'#'} target="_blank" rel="noreferrer">proof</a></div>
              <button className="text-red-600" onClick={()=>setKw(list=>list.filter((_,idx)=>idx!==i))}>Remove</button>
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
          {top3.map((k,i)=> (
            <div key={i} className="text-xs flex items-center justify-between border rounded-lg p-2 gap-2">
              <div className="truncate"><b>{k.keyword}</b> • SV {k.searchVolume} • <a className="underline" href={k.proof||'#'} target="_blank" rel="noreferrer">proof</a></div>
              <button className="text-red-600" onClick={()=>setTop3(list=>list.filter((_,idx)=>idx!==i))}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KPIsOperationsHead({client, onChange}){
  const scopeOptions = ["Social Media", "SEO", "Ads"];
  const statusOptions = ["Active", "Upgraded", "Left", "Reduced"];
  const [appDraft, setAppDraft] = useState({ url:'', remark:'' });
  const [escDraft, setEscDraft] = useState({ url:'', remark:'' });
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

  return(
    <div className="grid md:grid-cols-4 gap-3 mt-3">
        <TextField label="Client Name" value={client.name} onChange={v => onChange({...client, name: v})} />
        <MultiSelect 
          options={scopeOptions}
          selected={client.op_clientScope || []}
          onChange={v => onChange({...client, op_clientScope: v})}
          placeholder="Select Scope"
        />
        <NumField label="Client Satisfaction (1-10)" value={client.op_satisfactionScore || 0} onChange={v => onChange({...client, op_satisfactionScore: v})} />
        <div>
          <label className="text-sm">Client Payment Date</label>
          <input type="date" className="w-full border rounded-xl p-2" value={client.op_paymentDate || ''} onChange={e => onChange({...client, op_paymentDate: e.target.value})} />
        </div>
        
        <div className="col-span-4">
          <label className="text-sm">Team Finished Scope?</label>
          <input type="checkbox" checked={client.op_teamFinishedScope || false} onChange={e => onChange({...client, op_teamFinishedScope: e.target.checked})} />
        </div>
        
        <div className="col-span-2">
          <label className="text-sm">Client Status</label>
          <select className="w-full border rounded-xl p-2" value={client.op_clientStatus || 'Active'} onChange={e => onChange({...client, op_clientStatus: e.target.value})}>
            {statusOptions.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        {(client.op_clientStatus === 'Upgraded' || client.op_clientStatus === 'Left' || client.op_clientStatus === 'Reduced') && (
          <TextArea label="Reason for status change" value={client.op_clientStatusReason || ''} onChange={v => onChange({...client, op_clientStatusReason: v})} rows={2} className="col-span-2" />
        )}
        
        <TextArea label="Who Performed Well/Poorly" value={client.op_performanceRemarks || ''} onChange={v => onChange({...client, op_performanceRemarks: v})} rows={3} className="col-span-2" />
        <TextArea label="Things to do differently next month" value={client.op_comingMonthActions || ''} onChange={v => onChange({...client, op_comingMonthActions: v})} rows={3} className="col-span-2" />
        
        <div className="md:col-span-2">
          <div className="font-medium">Appreciations</div>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <input className="border rounded-xl p-2 col-span-2" placeholder="Proof link (Drive/WhatsApp in Drive) – optional" value={appDraft.url} onChange={e=>setAppDraft(d=>({...d, url:e.target.value}))} />
            <input className="border rounded-xl p-2" placeholder="Remark (client/channel)" value={appDraft.remark} onChange={e=>setAppDraft(d=>({...d, remark:e.target.value}))} />
            <button className="col-span-3 rounded-xl bg-emerald-600 text-white px-3 py-2" onClick={addAppreciation}>+ Add Appreciation</button>
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="font-medium">Escalations</div>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <input className="border rounded-xl p-2 col-span-2" placeholder="Proof link (Drive) – optional" value={escDraft.url} onChange={e=>setEscDraft(d=>({...d, url:e.target.value}))} />
            <input className="border rounded-xl p-2" placeholder="Why did this happen?" value={escDraft.remark} onChange={e=>setEscDraft(d=>({...d, remark:e.target.value}))} />
            <button className="col-span-3 rounded-xl bg-red-600 text-white px-3 py-2" onClick={addEscalation}>+ Add Escalation</button>
          </div>
        </div>
    </div>
  );
}

/*****************************
 * Client Report Status block *
 *****************************/
function ClientReportStatus({client, prevClient, onChange}){
  const rel = client.relationship||{ roadmapSentDate:'', reportSentDate:'', meetings:[], appreciations:[], escalations:[], clientSatisfaction:0, paymentReceived:false, paymentDate:'', omissionSuspected:'No' };
  const prevRel = prevClient.relationship || {};
  const [meetDraft, setMeetDraft] = useState({ date:'', summary:'', notesLink:'' });
  const [appDraft, setAppDraft] = useState({ url:'', remark:'' });
  const [escDraft, setEscDraft] = useState({ url:'', remark:'' });
  const openModal = useModal();
  
  function addMeeting(){ if(!meetDraft.date || !meetDraft.summary) return; if(meetDraft.notesLink && !isDriveUrl(meetDraft.notesLink)) { openModal('Invalid Link', 'Notes link must be a Google Drive/Docs URL.'); return; } onChange({ ...client, relationship: { ...rel, meetings:[...(rel.meetings||[]), { id:uid(), ...meetDraft }] }}); setMeetDraft({ date:'', summary:'', notesLink:'' }); }
  function addAppreciation(){ if(appDraft.url && !isDriveUrl(appDraft.url)) { openModal('Invalid Link', 'Use Google Drive link for proof.'); return; } const item = { id:uid(), url: appDraft.url||'', remark: appDraft.remark||'' }; onChange({ ...client, relationship:{...rel, appreciations:[...(rel.appreciations||[]), item]}}); setAppDraft({ url:'', remark:'' }); }
  function addEscalation(){ if(escDraft.url && !isDriveUrl(escDraft.url)) { openModal('Invalid Link', 'Use Google Drive link for proof.'); return; } const item = { id:uid(), url: escDraft.url||'', why: escDraft.remark||'' }; onChange({ ...client, relationship:{...rel, escalations:[...(rel.escalations||[]), item]}}); setEscDraft({ url:'', remark:'' }); }

  return (
    <div className="mt-4 border-t pt-3">
      <div className="font-medium mb-2">Client Report Status</div>
      <div className="grid md:grid-cols-4 gap-3">
        <div>
          <label className="text-sm">Roadmap Sent Date</label>
          <input type="date" className="w-full border rounded-xl p-2" value={rel.roadmapSentDate||''} onChange={e=>onChange({...client, relationship:{...rel, roadmapSentDate:e.target.value}})} />
          {prevRel.roadmapSentDate && <div className="text-xs text-gray-500 mt-1">Prev: {toDDMMYYYY(prevRel.roadmapSentDate)}</div>}
        </div>
        <div>
          <label className="text-sm">Report Sent Date</label>
          <input type="date" className="w-full border rounded-xl p-2" value={rel.reportSentDate||''} onChange={e=>onChange({...client, relationship:{...rel, reportSentDate:e.target.value}})} />
          {prevRel.reportSentDate && <div className="text-xs text-gray-500 mt-1">Prev: {toDDMMYYYY(prevRel.reportSentDate)}</div>}
        </div>
        <div>
          <label className="text-sm">Client Satisfaction (1–10)</label>
          <input type="number" min={1} max={10} className="w-full border rounded-xl p-2" value={rel.clientSatisfaction||0} onChange={e=>onChange({...client, relationship:{...rel, clientSatisfaction:Number(e.target.value||0)}})} />
          {prevRel.clientSatisfaction > 0 && <div className="text-xs text-gray-500 mt-1">Prev: {prevRel.clientSatisfaction}</div>}
        </div>
        <div className="md:col-span-1 flex items-end gap-2">
          <label className="text-sm mr-2">Payment Received?</label>
          <input type="checkbox" checked={!!rel.paymentReceived} onChange={e=>onChange({...client, relationship:{...rel, paymentReceived:e.target.checked}})} />
        </div>
        <div>
          <label className="text-sm">Payment Date</label>
          <input type="date" className="w-full border rounded-xl p-2" value={rel.paymentDate||''} onChange={e=>onChange({...client, relationship:{...rel, paymentDate:e.target.value}})} />
          {prevRel.paymentDate && <div className="text-xs text-gray-500 mt-1">Prev: {toDDMMYYYY(prevRel.paymentDate)}</div>}
        </div>
        
        <div className="col-span-4">
            <NumField label="Client Interactions (messages/mails)" value={client.clientInteractions || 0} onChange={v => onChange({ ...client, clientInteractions: v })}/>
            {prevClient.clientInteractions > 0 && <div className="text-xs text-gray-500 mt-1">Prev: {prevClient.clientInteractions}</div>}
        </div>

        <div className="md:col-span-4">
          <div className="font-medium">Meetings</div>
          <div className="grid md:grid-cols-4 gap-3 mt-1">
            <div>
              <label className="text-sm">Date</label>
              <input type="date" className="border rounded-xl p-2 w-full" value={meetDraft.date} onChange={e=>setMeetDraft(d=>({...d, date:e.target.value}))} />
            </div>
            <input className="border rounded-xl p-2" placeholder="Summary of discussion" value={meetDraft.summary} onChange={e=>setMeetDraft(d=>({...d, summary:e.target.value}))} />
            <input className="border rounded-xl p-2" placeholder="Notes link (Drive/Doc)" value={meetDraft.notesLink} onChange={e=>setMeetDraft(d=>({...d, notesLink:e.target.value}))} />
            <button className="rounded-xl bg-blue-600 text-white px-3" onClick={addMeeting}>Add Meeting</button>
          </div>
          <ul className="text-xs mt-2 space-y-1">
            {(rel.meetings||[]).map(m=> (
              <li key={m.id} className="border rounded-lg p-2 flex items-center justify-between">
                <div>{toDDMMYYYY(m.date)} • {m.summary} {m.notesLink && (<a className="underline ml-2" href={m.notesLink} target="_blank" rel="noreferrer">notes</a>)}</div>
                <button className="text-red-600" onClick={()=>onChange({...client, relationship:{...rel, meetings:(rel.meetings||[]).filter(x=>x.id!==m.id)}})}>Remove</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <div className="font-medium">Appreciations</div>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <input className="border rounded-xl p-2 col-span-2" placeholder="Proof link (Drive/WhatsApp in Drive) – optional" value={appDraft.url} onChange={e=>setAppDraft(d=>({...d, url:e.target.value}))} />
            <input className="border rounded-xl p-2" placeholder="Remark (client/channel)" value={appDraft.remark} onChange={e=>setAppDraft(d=>({...d, remark:e.target.value}))} />
            <button className="col-span-3 rounded-xl bg-emerald-600 text-white px-3 py-2" onClick={addAppreciation}>+ Add Appreciation</button>
          </div>
          <ul className="text-xs mt-2 space-y-1">
            {(rel.appreciations||[]).map(a=> (
              <li key={a.id} className="border rounded-lg p-2 flex items-center justify-between">
                <div className="truncate">{a.remark||'—'} {a.url && (<a className="underline ml-2" href={a.url} target="_blank" rel="noreferrer">proof</a>)}</div>
                <button className="text-red-600" onClick={()=>onChange({...client, relationship:{...rel, appreciations:(rel.appreciations||[]).filter(x=>x.id!==a.id)}})}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2">
          <div className="font-medium">Escalations</div>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <input className="border rounded-xl p-2 col-span-2" placeholder="Proof link (Drive) – optional" value={escDraft.url} onChange={e=>setEscDraft(d=>({...d, url:e.target.value}))} />
            <input className="border rounded-xl p-2" placeholder="Why did this happen?" value={escDraft.remark} onChange={e=>setEscDraft(d=>({...d, remark:e.target.value}))} />
            <button className="col-span-3 rounded-xl bg-red-600 text-white px-3 py-2" onClick={addEscalation}>+ Add Escalation</button>
          </div>
          <ul className="text-xs mt-2 space-y-1">
            {(rel.escalations||[]).map(a=> (
              <li key={a.id} className="border rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div className="truncate">{a.why||'—'} {a.url && (<a className="underline ml-2" href={a.url} target="_blank" rel="noreferrer">proof</a>)}</div>
                  <button className="text-red-600" onClick={()=>onChange({...client, relationship:{...rel, escalations:(rel.escalations||[]).filter(x=>x.id!==a.id)}})}>Remove</button>
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
function LearningBlock({model, setModel, openModal}){
  const [draft, setDraft] = useState({ title:'', link:'', durationMins:0, learned:'', applied:'' });
  const total = (model.learning||[]).reduce((s,e)=>s+(e.durationMins||0),0);
  function addEntry(){
    if(!draft.title || !draft.link || !draft.durationMins) {
      openModal('Missing Information', 'Please fill in the title, link, and duration to add a learning entry.', () => {});
      return;
    }
    const entry = { id: uid(), ...draft };
    setModel(m=>({...m, learning:[...m.learning, entry]}));
    setDraft({ title:'', link:'', durationMins:0, learned:'', applied:'' });
  }
  return (
    <Section title="4) Learning (min 6 hours = 360 mins; proofs required)">
      <div className="grid md:grid-cols-4 gap-3">
        <TextField label="Title / Topic" value={draft.title} onChange={v=>setDraft(d=>({...d, title:v}))}/>
        <TextField label="Link (YouTube/Course/Doc)" value={draft.link} onChange={v=>setDraft(d=>({...d, link:v}))}/>
        <NumField label="Duration (mins)" value={draft.durationMins} onChange={v=>setDraft(d=>({...d, durationMins:v}))}/>
        <button className="bg-blue-600 text-white rounded-xl px-3" onClick={addEntry}>Add</button>
        <TextArea className="md:col-span-2" label="What did you learn (key points)" rows={3} value={draft.learned} onChange={v=>setDraft(d=>({...d, learned:v}))}/>
        <TextArea className="md:col-span-2" label="How did you apply it in work?" rows={3} value={draft.applied} onChange={v=>setDraft(d=>({...d, applied:v}))}/>
      </div>
      <div className="mt-2 text-sm">Total this month: <b>{(total/60).toFixed(1)} hours</b> {total<360 && <span className="text-red-600">(below 6h)</span>}</div>
      <ul className="mt-2 space-y-1 text-xs">
        {(model.learning||[]).map(item=> (
          <li key={item.id} className="border rounded-lg p-2 flex items-center justify-between">
            <div className="truncate"><b>{item.title}</b> • {item.durationMins}m • <a className="underline" href={item.link} target="_blank" rel="noreferrer">link</a></div>
            <button className="text-red-600" onClick={()=>setModel(m=>({...m, learning: m.learning.filter(x=>x.id!==item.id)}))}>Remove</button>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/*******************
 * Internal KPIs   *
 *******************/
function InternalKPIs({model, prevModel, setModel, monthPrev, monthThis}){
  const dept = model.employee.department;
  const c = (model.clients[0]||{ id:uid(), name: dept+" Internal" });
  const prevC = (prevModel?.clients[0]||{});
  function merge(p){ setModel(m=>{ const first = m.clients[0]? {...m.clients[0], ...p} : {...c, ...p}; const rest = m.clients.slice(1); return {...m, clients:[first, ...rest]};}); }
  return (
    <div className="grid md:grid-cols-4 gap-3">
      {dept==='HR' && (
        <>
          <NumField label="# Candidates Screened" value={c.hr_screened||0} onChange={v=>merge({ hr_screened:v })}/>
          <PrevValue label={`# New Hires Done (${monthLabel(monthPrev)})`} value={prevC.hr_hiresThis || 0} />
          <NumField label={`# New Hires Done (${monthLabel(monthThis)})`} value={c.hr_hiresThis||0} onChange={v=>merge({ hr_hiresThis:v })}/>
          <NumField label="# Engagement Activities" value={c.hr_engagements||0} onChange={v=>merge({ hr_engagements:v })}/>
          <TextArea className="md:col-span-4" label="Employee Resolutions (Hurdles & Resolutions)" rows={3} value={c.hr_resolutions || ""} onChange={v => merge({ hr_resolutions: v })} />
          <h4 className="font-semibold text-sm col-span-4 mt-2">Candidate Pipeline</h4>
          <NumField label="Screening" value={c.hr_pipeline_screening||0} onChange={v=>merge({ hr_pipeline_screening: v })}/>
          <NumField label="Shortlisting" value={c.hr_pipeline_shortlisting||0} onChange={v=>merge({ hr_pipeline_shortlisting: v })}/>
          <NumField label="Interviews Conducted" value={c.hr_pipeline_interviews||0} onChange={v=>merge({ hr_pipeline_interviews: v })}/>
        </>
      )}
      {dept==='Accounts' && (
        <>
          <h4 className="font-semibold text-sm col-span-4 mt-2">Client Payments</h4>
          <NumField label="New Client Onboarding (Count)" value={c.ac_newOnboardings || 0} onChange={v => merge({ ac_newOnboardings: v })} />
          <PrevValue label={`Collections % (${monthLabel(monthPrev)})`} value={prevC.ac_collectionsPctThis || 0} />
          <NumField label={`Collections % (${monthLabel(monthThis)})`} value={c.ac_collectionsPctThis||0} onChange={v=>merge({ ac_collectionsPctThis:v })}/>
          <h4 className="font-semibold text-sm col-span-4 mt-2">Compliance</h4>
          <div className="flex items-center gap-2">
            <label className="text-sm">GST Filed?</label>
            <input type="checkbox" checked={!!c.ac_gstDone} onChange={e=>merge({ ac_gstDone: e.target.checked })} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm">TDS Filed?</label>
            <input type="checkbox" checked={!!c.ac_tdsDone} onChange={e=>merge({ ac_tdsDone: e.target.checked })} />
          </div>
        </>
      )}
      {dept==='Sales' && (
        <>
          <PrevValue label={`New Revenue (₹) ${monthLabel(monthPrev)}`} value={prevC.sa_revenueThis || 0} />
          <NumField label={`New Revenue (₹) ${monthLabel(monthThis)}`} value={c.sa_revenueThis||0} onChange={v=>merge({ sa_revenueThis:v })}/>
          <PrevValue label={`Conversion % (${monthLabel(monthPrev)})`} value={prevC.sa_conversionRateThis || 0} />
          <NumField label={`Conversion % (${monthLabel(monthThis)})`} value={c.sa_conversionRateThis||0} onChange={v=>merge({ sa_conversionRateThis:v })}/>
          <PrevValue label={`Pipeline (#) ${monthLabel(monthPrev)}`} value={prevC.sa_pipelineThis || 0} />
          <NumField label={`Pipeline (#) ${monthLabel(monthThis)}`} value={c.sa_pipelineThis||0} onChange={v=>merge({ sa_pipelineThis:v })}/>
          <PrevValue label={`AI Upsell Value (₹) ${monthLabel(monthPrev)}`} value={prevC.sa_aiUpsellValueThis || 0} />
          <NumField label={`AI Upsell Value (₹) ${monthLabel(monthThis)}`} value={c.sa_aiUpsellValueThis||0} onChange={v=>merge({ sa_aiUpsellValueThis:v })}/>
          <NumField label={`Next Month Projection (₹)`} value={c.sa_projectionNext||0} onChange={v=>merge({ sa_projectionNext:v })}/>
        </>
      )}
      {dept==='Blended (HR + Sales)' && (
        <>
          <div className="md:col-span-4 text-xs text-gray-600">Blended role: fill HR metrics first, then Sales metrics.</div>
          {/* HR */}
          <PrevValue label={`(HR) Hires (${monthLabel(monthPrev)})`} value={prevC.hr_hiresThis || 0} />
          <NumField label={`(HR) Hires (${monthLabel(monthThis)})`} value={c.hr_hiresThis||0} onChange={v=>merge({ hr_hiresThis:v })}/>
          {/* Sales */}
          <PrevValue label={`(Sales) New Revenue (₹) ${monthLabel(monthPrev)}`} value={prevC.sa_revenueThis || 0} />
          <NumField label={`(Sales) New Revenue (₹) ${monthLabel(monthThis)}`} value={c.sa_revenueThis||0} onChange={v=>merge({ sa_revenueThis:v })}/>
        </>
      )}
    </div>
  );
}

/********************
 * Shared UI bits    *
 ********************/
function Section({title, children}){
  return (
    <section className="my-6">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-blue-600 rounded-full"></span>{title}</h2>
      <div className="bg-white border rounded-2xl p-4 shadow-sm">{children}</div>
    </section>
  );
}
function TextField({label, value, onChange, placeholder, className}){
  return (
    <div className={className||''}>
      <label className="text-sm">{label}</label>
      <input className="w-full border rounded-xl p-2" placeholder={placeholder||""} value={value||""} onChange={e=>onChange(e.target.value)} />
    </div>
  );
}
function NumField({label, value, onChange, className}){
  return (
    <div className={className||''}>
      <label className="text-sm">{label}</label>
      <input type="number" className="w-full border rounded-xl p-2" value={Number(value||0)} onChange={e=>onChange(Number(e.target.value||0))} />
    </div>
  );
}
function TextArea({label, value, onChange, rows=4, className}){
  return (
    <div className={className||''}>
      <label className="text-sm">{label}</label>
      <textarea className="w-full border rounded-xl p-2" rows={rows} value={value||""} onChange={e=>onChange(e.target.value)} />
    </div>
  );
}

function TinyLinks({items, onAdd, onRemove}){
  const [draft, setDraft] = useState({ label:'', url:'' });
  const { openModal, closeModal } = useModal();
  function add(){
    if(!draft.url) return;
    if(!isDriveUrl(draft.url) && !isGensparkUrl(draft.url)) {
      openModal('Invalid Link', 'Please paste a Google Drive/Docs or Genspark URL link.', closeModal);
      return;
    }
    onAdd({ id: uid(), label: draft.label||'Link', url: draft.url });
    setDraft({ label:'', url:'' });
  }
  return (
    <div>
      <div className="flex gap-2">
        <input className="flex-1 border rounded-lg p-2" placeholder="Scope of Work" value={draft.label} onChange={e=>setDraft(d=>({...d, label:e.target.value}))}/>
        <input className="flex-[2] border rounded-lg p-2" placeholder="Google Drive or Genspark URL (view access)" value={draft.url} onChange={e=>setDraft(d=>({...d, url:e.target.value}))}/>
        <button className="px-3 rounded-lg bg-blue-600 text-white" onClick={add}>Add</button>
      </div>
      <ul className="mt-2 space-y-1 text-xs">
        {(items||[]).map(it=> (
          <li key={it.id} className="border rounded-lg p-2 flex items-center justify-between">
            <div className="truncate"><b>{it.label}</b> • <a className="underline" href={it.url} target="_blank" rel="noreferrer">open</a></div>
            <button className="text-red-600" onClick={()=>onRemove(it.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**********************
 * Manager Dashboard  *
 **********************/
function ManagerDashboard({ onViewReport }){
  const [monthKey, setMonthKey] = useState(thisMonthKey());
  const { allSubmissions, loading, error } = useFetchSubmissions();
  const [filterDept, setFilterDept] = useState("All");
  const [filterEmployee, setFilterEmployee] = useState("All");
  const [openId, setOpenId] = useState(null);
  const [notes, setNotes] = useState("");
  const [payload, setPayload] = useState(null);
  const [managerScore, setManagerScore] = useState(0);
  const { openModal, closeModal } = useModal();

  const filteredSubmissions = useMemo(() => {
    let filtered = allSubmissions.filter(s => s.monthKey === monthKey);
    if (filterDept !== "All") {
      filtered = filtered.filter(s => s.employee?.department === filterDept);
    }
    if (filterEmployee !== "All") {
      filtered = filtered.filter(s => s.employee?.name === filterEmployee);
    }
    return filtered;
  }, [allSubmissions, monthKey, filterDept, filterEmployee]);

  function openRow(r){
    setOpenId(r.id);
    setNotes(r.manager?.comments || "");
    setPayload(r);
    setManagerScore(r.manager?.score || 0);
  }

  async function saveNotes(){
    const r = allSubmissions.find(x=>x.id===openId);
    if(!r) return;
    
    // Update local storage
    const all = Storage.load().map(x => {
      if (x.id === r.id) {
        return { ...x, manager: { ...(x.manager || {}), comments: notes, score: managerScore } };
      }
      return x;
    });
    Storage.save(all);
    openModal('Saved', 'Notes saved locally.');
  }

  function exportCSV(){
    const header = ['id','month_key','employee_name','employee_phone','department','role','kpi','learning','client','overall','manager_score','missingLearning','hasEscalations','omitted','missingReports','created_at'];
    const rowsCsv = filteredSubmissions.map(r=> [
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
      r.flags?.omittedChecked ?? '',
      r.flags?.missingReports ?? '',
      r.createdAt
    ].map(String).map(s=>`"${s.replaceAll('"','""')}"`).join(','));
    const blob = new Blob([[header.join(',')].concat(rowsCsv).join('\n')], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`bp-submissions-${monthKey}.csv`; a.click(); URL.revokeObjectURL(url);
  }
  function exportJSON(){
    const blob = new Blob([JSON.stringify(filteredSubmissions,null,2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`bp-submissions-${monthKey}.json`; a.click(); URL.revokeObjectURL(url);
  }

  const uniqueEmployees = useMemo(() => {
    const names = new Set();
    allSubmissions.forEach(r => names.add(r.employee?.name));
    return Array.from(names).filter(Boolean).sort();
  }, [allSubmissions]);
  
  const uniqueDepartments = useMemo(() => {
    const departments = new Set();
    allSubmissions.forEach(r => departments.add(r.employee?.department));
    return Array.from(departments).filter(Boolean).sort();
  }, [allSubmissions]);


  return (
    <div>
      <Section title="Filters & Export">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-sm">Report Month</label>
            <input type="month" className="border rounded-xl p-2" value={monthKey} onChange={e=>setMonthKey(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">Filter by Department</label>
            <select className="border rounded-xl p-2" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="All">All</option>
              {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm">Filter by Employee</label>
            <select className="border rounded-xl p-2" value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
              <option value="All">All</option>
              {uniqueEmployees.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <button className="bg-blue-600 text-white rounded-xl px-3 py-2" onClick={exportCSV}>Export CSV</button>
          <button className="bg-blue-600 text-white rounded-xl px-3 py-2" onClick={exportJSON}>Export JSON</button>
        </div>
      </Section>

      <Section title={loading? 'Loading…' : `Submissions (${filteredSubmissions.length})`}>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <div className="overflow-auto">
          <table className="w-full text-sm border-separate" style={{borderSpacing:0}}>
            <thead>
              <tr className="bg-blue-50">
                <th className="p-2 border text-left">Employee</th>
                <th className="p-2 border text-left">Dept</th>
                <th className="p-2 border text-left">Role(s)</th>
                <th className="p-2 border">KPI</th>
                <th className="p-2 border">Learning</th>
                <th className="p-2 border">Client</th>
                <th className="p-2 border">Overall</th>
                <th className="p-2 border">Manager Score</th>
                <th className="p-2 border">Flags</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map(r=> (
                <tr key={r.id} className="odd:bg-white even:bg-blue-50/40">
                  <td className="p-2 border text-left">{clean(r.employee?.name)}</td>
                  <td className="p-2 border text-left">{r.employee?.department}</td>
                  <td className="p-2 border text-left">{(r.employee?.role || []).join(', ')}</td>
                  <td className="p-2 border text-center">{r.scores?.kpiScore ?? ''}</td>
                  <td className="p-2 border text-center">{r.scores?.learningScore ?? ''}</td>
                  <td className="p-2 border text-center">{r.scores?.relationshipScore ?? ''}</td>
                  <td className="p-2 border text-center">{r.scores?.overall ?? ''}</td>
                  <td className="p-2 border text-center">{r.manager?.score ?? ''}</td>
                  <td className="p-2 border text-xs text-left">
                    {r.flags?.missingLearningHours ? '⏱<6h ' : ''}
                    {r.flags?.hasEscalations ? '⚠️Esc ' : ''}
                    {r.flags?.omittedChecked ? '🙈Omit ' : ''}
                    {r.flags?.missingReports ? '📄Miss ' : ''}
                  </td>
                  <td className="p-2 border text-center">
                    <div className="flex gap-2">
                        <button className="text-blue-600 underline" onClick={()=>openRow(r)}>Open</button>
                        <button className="text-blue-600 underline" onClick={()=>onViewReport(r.employee?.name, r.employee?.phone)}>View Report</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {openId && (
        <Section title="Submission Detail">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-1">Manager Notes</div>
              <textarea className="w-full border rounded-xl p-2" rows={8} value={notes} onChange={e=>setNotes(e.target.value)} />
              <div className="mt-4">
                  <label className="text-sm font-medium">Manager Score (1-10)</label>
                  <input type="number" min={1} max={10} className="w-full border rounded-xl p-2 mt-1" value={managerScore} onChange={e=>setManagerScore(Number(e.target.value || 0))} />
              </div>
              <button className="mt-4 bg-blue-600 text-white rounded-xl px-3 py-2" onClick={saveNotes}>Save Notes</button>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Payload (read-only)</div>
              <pre className="text-xs bg-gray-50 border rounded-xl p-2 overflow-auto max-h-80">{JSON.stringify(payload, null, 2)}</pre>
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
    return allSubmissions.filter(s => s.employee?.phone === employeePhone)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [allSubmissions, employeePhone]);
  
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
      if ((s.learning||[]).reduce((sum, e) => sum + (e.durationMins || 0), 0) < 360) {
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
        <Section title="No Submissions Found">
          <p>No submissions found for this employee yet.</p>
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

  const handleCopyReport = () => {
    // Fallback for clipboard access
    const textArea = document.createElement("textarea");
    textArea.value = formattedReport;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      openModal('Copied', 'The report text has been copied to your clipboard. You can now paste it into a document or email.', closeModal);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
      openModal('Error', 'Failed to copy report text. Your browser may not support this feature.', closeModal);
    }
    document.body.removeChild(textArea);
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
        <Section title="Yearly Summary">
          <div className="grid md:grid-cols-4 gap-4 text-center">
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
              <div className="font-bold">{yearlySummary.avgLearning}/10</div>
            </div>
            <div className="bg-white border rounded-2xl p-4 shadow-sm">
              <div className="text-sm opacity-80">Learning Shortfall</div>
              <div className="text-3xl font-semibold text-red-600">
                {yearlySummary.monthsWithLearningShortfall}
                <span className="text-xl"> month{yearlySummary.monthsWithLearningShortfall !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="font-medium text-gray-700">Recommendations:</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{getImprovementRecommendations()}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleCopyReport}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-semibold"
            >
              Copy Full Report to Clipboard
            </button>
          </div>
        </Section>
      )}

      <Section title="Monthly Submissions">
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm font-medium">View Report for:</label>
          <select
            className="border rounded-xl p-2"
            value={selectedReportId}
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
          <div className="border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{monthLabel(selectedReport.monthKey)} Report</h3>
              <span className={`text-sm font-semibold ${selectedReport.scores.overall >= 7 ? 'text-emerald-600' : 'text-red-600'}`}>
                Overall Score: {selectedReport.scores.overall}/10
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
              <div className="bg-gray-50 rounded-xl p-2">
                <div className="font-medium text-gray-700">KPI</div>
                <div className="font-bold">{selectedReport.scores.kpiScore}/10</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-2">
                <div className="font-medium text-gray-700">Learning</div>
                <div className="font-bold">{selectedReport.scores.learningScore}/10</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-2">
                <div className="font-medium text-gray-700">Client Status</div>
                <div className="font-bold">{selectedReport.scores.relationshipScore}/10</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-2">
                <div className="font-medium text-gray-700">Learning Hours</div>
                <div className="font-bold">{(selectedReport.learning || []).reduce((sum, e) => sum + (e.durationMins || 0), 0) / 60}h</div>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-medium text-gray-700">Summary:</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{generateSummary(selectedReport)}</p>
            </div>
            <details className="mt-4 cursor-pointer">
              <summary className="font-medium text-blue-600 hover:text-blue-800">
                View Full Payload
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


function clean(s){ return (s||'').toString(); }
