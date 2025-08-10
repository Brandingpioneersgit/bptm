import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

/**
 * Branding Pioneers – Monthly Tactical System (MVP++ v8)
 * Single-file React app (Vite + Tailwind)
 *
 * Highlights:
 * - Single entry point with in-page manager login form
 * - Supabase-ready (ENV: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_ACCESS_TOKEN)
 * - All KPIs are month-over-month with labels
 * - Deep SEO, Ads, Social, Web KPIs + proofs
 * - HR/Accounts/Sales internal KPIs (prev vs this; Sales includes next-month projection)
 * - Attendance & Tasks (AI table link)
 * - Client Report Status (roadmap/report dates, meetings, satisfaction, payment, omissions)
 * - Learning (>= 6h required; multiple entries)
 * - Scoring (KPI / Learning / Client Status) out of 10; Overall average
 * - CSV/JSON export; Manager notes with save (Supabase UPDATE)
 *
 * NEW FEATURES:
 * - Manager login form is now on the main page.
 * - Individual employee reports accessible from the manager dashboard.
 * - Yearly summary and appraisal delay calculation per employee.
 * - Multi-select for roles in certain departments.
 * - "Remarks" replaced with "Scope of Work" textarea.
 * - New "Manager Score" field for individual submissions.
 * - Specific KPI fields for Graphic Designers.
 */

/***********************
 * Supabase Integration *
 ***********************/
const SUPABASE_URL = "";
const SUPABASE_ANON = "";
const ADMIN_TOKEN = "admin";
const supabase = null;

async function saveSubmissionToSupabase(record){
  if(!supabase) return { ok:false, error: "Supabase not configured" };
  const { error } = await supabase.from("submissions").insert(record);
  if(error) return { ok:false, error };
  return { ok:true };
}
async function listSubmissionsFromSupabase(monthKey){
  if(!supabase) return { ok:false, error: "Supabase not configured", data: [] };
  let q = supabase.from("submissions").select("*").order("created_at", { ascending:false });
  if(monthKey) q = q.eq("month_key", monthKey);
  const { data, error } = await q;
  if(error) return { ok:false, error, data: [] };
  return { ok:true, data: data||[] };
}
async function updateSubmissionNotes(id, payload, manager_notes, manager_score){
  if(!supabase) return { ok:false, error: "Supabase not configured" };
  const { error } = await supabase.from('submissions').update({ payload, manager_notes, manager_score }).eq('id', id);
  if(error) return { ok:false, error };
  return { ok:true };
}

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
};
const uid = () => Math.random().toString(36).slice(2, 9);
const thisMonthKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const prevMonthKey = (mk)=>{ if(!mk) return ""; const [y,m]=mk.split("-").map(Number); const d=new Date(y, m-2, 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const monthLabel = (mk)=>{ if(!mk) return ""; const [y,m]=mk.split("-").map(Number); return new Date(y, m-1, 1).toLocaleString(undefined,{month:'short',year:'numeric'}); };
const round1 = (n) => Math.round(n*10)/10;
const isDriveUrl = (u)=> /https?:\/\/(drive|docs)\.google\.com\//i.test(u||"");

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
  key: "bp-tactical-mvp-v8",
  load(){ try { return JSON.parse(localStorage.getItem(this.key)||"[]"); } catch { return []; } },
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
        creatives+=(c.sm_creativesThis||0);
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
    const c = clients?.[0]||{}; const hiresThis=c.hr_hiresThis||0, hiresPrev=c.hr_hiresPrev||0, retThis=c.hr_retentionPctThis||0, retPrev=c.hr_retentionPctPrev||0, procThis=c.hr_processDonePctThis||0, procPrev=c.hr_processDonePctPrev||0;
    const hiresDelta = Math.max(0, hiresThis-hiresPrev); const s1=Math.min(10,(hiresDelta/3)*10);
    const retDelta = Math.max(0, retThis-retPrev); const s2=Math.min(10,(retDelta/10)*10);
    const procDelta = Math.max(0, procThis-procPrev); const s3=Math.min(10,(procDelta/10)*10);
    return round1(s1*0.4 + s2*0.3 + s3*0.3);
  }
  if(dept === "Accounts"){
    const c = clients?.[0]||{}; const colThis=c.ac_collectionsPctThis||0, colPrev=c.ac_collectionsPctPrev||0, compThis=c.ac_compliancePctThis||0, compPrev=c.ac_compliancePctPrev||0, onbThis=c.ac_onboardingOnTimePctThis||0, onbPrev=c.ac_onboardingOnTimePctPrev||0;
    const score = Math.min(10, ((Math.max(0,colThis-colPrev)/20)*5 + (Math.max(0,compThis-compPrev)/20)*2.5 + (Math.max(0,onbThis-onbPrev)/20)*2.5));
    return round1(score);
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
  return 0;
}
function scoreLearning(entries){ const total = (entries||[]).reduce((s,e)=>s+(e.durationMins||0),0); const ratio = Math.min(1,total/(6*60)); return round1(10*ratio); }
function scoreRelationshipFromClients(clients){
  let meetings=0, appr=0, esc=0, satSum=0, satCnt=0;
  (clients||[]).forEach(c=>{ meetings += c.relationship?.meetings?.length || 0; appr += c.relationship?.appreciations?.length || 0; esc += c.relationship?.escalations?.length || 0; const s=c.relationship?.clientSatisfaction||0; if(s>0){ satSum+=s; satCnt++; } });
  const ms=Math.min(4,meetings*0.8), as=Math.min(3,appr*0.75), ep=Math.min(5,esc*1.5); // caps
  const sat = Math.min(3, (satCnt? (satSum/satCnt):0) *0.3);
  return round1(Math.max(0, ms+as+sat-ep)); // out of 10
}
function overallOutOf10(kpi, learning, rel){ return round1((kpi + learning + rel) / 3); }

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
  if(model.flags?.omittedChecked) parts.push('⚠️ Possible omissions in client-facing report.');
  if(model.flags?.hasEscalations) parts.push('⚠️ Escalations present — investigate.');
  parts.push(`Scores — KPI ${model.scores?.kpiScore}/10, Learning ${model.scores?.learningScore}/10, Client Status ${model.scores?.relationshipScore}/10, Overall ${model.scores?.overall}/10.`);
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

/****************
 * App Shell    *
 ****************/
const EMPTY_SUBMISSION = {
  id: uid(),
  monthKey: thisMonthKey(),
  isDraft: true,
  employee: { name: "", department: "Web", role: ["Web Designer/Developer"] },
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

/***********************
 * Validation helpers  *
 ***********************/
function validateSubmission(model){
  const errors = [];
  const m = model || {};
  const emp = m.employee || {};
  const dept = emp.department || "";
  const monthKey = m.monthKey || "";

  const isDateYMD = (d) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);

  // 1) employee + month
  if (!emp.name || !emp.name.trim()) errors.push("Enter your Name.");
  if (!dept) errors.push("Select Department.");
  if (!emp.role || emp.role.length === 0) errors.push("Select at least one Role.");
  if (!monthKey) errors.push("Pick Report Month (YYYY-MM).");

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
  if (aiTableLink && !isDriveUrl(aiTableLink)) errors.push("AI table link must be a Google Drive/Docs URL.");
  if (aiTableScreenshot && !isDriveUrl(aiTableScreenshot)) errors.push("AI table screenshot must be a Google Drive URL.");

  // 3) learning
  const learningMins = (m.learning || []).reduce((s,e)=>s+(e.durationMins||0),0);
  if(learningMins < 360) errors.push('Learning must total at least 360 minutes (6 hours).');

  // 4) clients & dept KPIs
  const clients = m.clients || [];
  const isInternal = ["HR","Accounts","Sales","Blended (HR + Sales)"].includes(dept);
  if (!isInternal && clients.length===0) errors.push("Add at least one Client for this department.");

  clients.forEach((c, idx)=>{
    const row = `Client "${c?.name || `#${idx+1}`}"`;

    if (!c.name || !c.name.trim()) errors.push(`${row}: name is required.`);
    const needsReports = !(dept === 'Web');
    if(needsReports){
      if(!c.reports || c.reports.length===0) errors.push(`${c.name||'Client'}: add at least one report/proof link (Drive).`);
      if((c.reports||[]).some(r=> !isDriveUrl(r.url))) errors.push(`${c.name||'Client'}: report/proof links must be Google Drive/Docs.`);
    }

    if (dept === "SEO") {
      if (c?.seo_trafficPrev == null || c?.seo_trafficThis == null) {
        errors.push(`${row}: enter Organic Traffic (prev & this month).`);
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
    } else if (dept === "Web") {
      if (Number(c?.web_saasUpsells || 0) > 0 && c?.web_saasProof && !isDriveUrl(c.web_saasProof)){
        errors.push(`${row}: SaaS upsell proof must be a Google Drive/Docs URL.`);
      }
    } else if (dept === "Social Media" && emp.role.includes("Graphic Designer")) {
        if (!c.sm_creativesThis) {
            errors.push(`${row}: Graphic Designer role requires a number of creatives.`)
        }
    }
    
    // Client Report Status + payments + meetings
    const rel = c.relationship||{};
    if(!rel.roadmapSentDate) errors.push(`${c.name||'Client'}: Roadmap Sent Date is required.`);
    if(!rel.reportSentDate) errors.push(`${c.name||'Client'}: Report Sent Date is required.`);
    if(rel.meetings?.some(m=> m.notesLink && !isDriveUrl(m.notesLink))) errors.push(`${c.name||'Client'}: Meeting notes links must be Drive.`);
    if(rel.paymentReceived && !rel.paymentDate) errors.push(`${c.name||'Client'}: Payment date required because payment is marked received.`);
    if(rel.clientSatisfaction && (rel.clientSatisfaction<1 || rel.clientSatisfaction>10)) errors.push(`${c.name||'Client'}: Client satisfaction must be 1–10.`);
    if((rel.appreciations||[]).some(a=>a.url && !isDriveUrl(a.url))) errors.push(`${c.name||'Client'}: Appreciation proof links must be Google Drive/Docs.`);
    if((rel.escalations||[]).some(a=>a.url && !isDriveUrl(a.url))) errors.push(`${c.name||'Client'}: Escalation proof links must be Google Drive/Docs.`);
  });

  return { ok: errors.length===0, errors };
}

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

export default function App(){
  const hash = useHash();
  const [isManagerLoggedIn, setIsManagerLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [view, setView] = useState('main'); // 'main' or 'employeeReport'
  const [selectedEmployee, setSelectedEmployee] = useState(null);

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

  const handleViewEmployeeReport = useCallback((employeeName) => {
    setSelectedEmployee(employeeName);
    setView('employeeReport');
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setView('main');
    setSelectedEmployee(null);
  }, []);

  const ManagerSection = () => {
    if (view === 'employeeReport' && selectedEmployee) {
      return <EmployeeReportDashboard employeeName={selectedEmployee} onBack={handleBackToDashboard} />;
    }
    return <ManagerDashboard onViewReport={handleViewEmployeeReport} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white text-gray-900 font-sans">
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
  );
}

/**********************
 * Employee Form View *
 **********************/
function EmployeeForm(){
  const [model, setModel] = useState(()=>{
    const drafts = Storage.load().filter(x=>x.monthKey===thisMonthKey());
    return drafts.find(x=>x.isDraft) || { ...EMPTY_SUBMISSION };
  });
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null, inputLabel: '', inputValue: '' });
  const openModal = (title, message, onConfirm = null, onCancel = null, inputLabel = '', inputValue = '') => {
    setModalState({ isOpen: true, title, message, onConfirm, onCancel, inputLabel, inputValue });
  };
  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  useEffect(()=>{ const all = Storage.load().filter(x=>x.id!==model.id); Storage.save([...all, model]); },[model]);

  const kpiScore = useMemo(()=>scoreKPIs(model.employee, model.clients), [model.employee, model.clients]);
  const learningScore = useMemo(()=>scoreLearning(model.learning), [model.learning]);
  const relationshipScore = useMemo(()=>scoreRelationshipFromClients(model.clients), [model.clients]);
  const overall = useMemo(()=>overallOutOf10(kpiScore, learningScore, relationshipScore), [kpiScore,learningScore,relationshipScore]);

  const flags = useMemo(()=>{
    const learningMins = (model.learning||[]).reduce((s,e)=>s+(e.durationMins||0),0);
    const missingLearningHours = learningMins < 360;
    const hasEscalations = (model.clients||[]).some(c=> (c.relationship?.escalations||[]).length>0);
    const omittedChecked = (model.clients||[]).some(c=> c.relationship && c.relationship.omissionSuspected==='Yes');
    const missingReports = (model.clients||[]).some(c=> (c.reports||[]).length===0);
    return { missingLearningHours, hasEscalations, omittedChecked, missingReports };
  },[model]);

  useEffect(()=>{
    setModel(m=>{
      const nextScores = { kpiScore, learningScore, relationshipScore, overall };
      const sameScores = JSON.stringify(nextScores) === JSON.stringify(m.scores||{});
      const sameFlags = JSON.stringify(flags) === JSON.stringify(m.flags||{});
      if (sameScores && sameFlags) return m;
      return { ...m, flags, scores: nextScores };
    });
  },[kpiScore, learningScore, relationshipScore, overall, flags]);

  async function submitFinal(){
    const check = validateSubmission(model);
    if(!check.ok){
      openModal(
        "Validation Errors",
        `Please fix the following before submitting:\n\n${check.errors.map((e,i)=> `${i+1}. ${e}`).join('\n')}`,
        closeModal
      );
      return;
    }
    const final = { ...model, id: uid(), isDraft:false, employee: { ...model.employee, name: (model.employee?.name||"").trim() } };

    // local backup
    const all = Storage.load().filter(x=>!x.isDraft);
    Storage.save([...all, final]);

    // supabase
    const record = {
      month_key: final.monthKey,
      employee_email: "",
      employee_name: final.employee.name,
      department: final.employee.department,
      role: final.employee.role,
      payload: final,
      scores: final.scores,
      flags: final.flags,
    };
    const result = await saveSubmissionToSupabase(record);
    if(!result.ok){ console.warn("Supabase insert failed:", result.error); openModal("Submission Result", "Submitted locally. (Cloud storage not configured)", closeModal); }
    else { openModal("Submission Result", "Submitted! (Saved to Supabase)", closeModal); }

    setModel({ ...EMPTY_SUBMISSION, id: uid(), monthKey: model.monthKey });
  }

  const mPrev = prevMonthKey(model.monthKey); const mThis = model.monthKey;
  const rolesForDept = ROLES_BY_DEPT[model.employee.department] || [];

  return (
    <div>
      <Modal {...modalState} />
      <Section title="1) Employee & Report Month">
        <div className="grid md:grid-cols-4 gap-3">
          <TextField label="Name" placeholder="Your name" value={model.employee.name||""} onChange={v=>setModel(m=>({...m, employee:{...m.employee, name:v}}))}/>
          <div>
            <label className="text-sm">Department</label>
            <select className="w-full border rounded-xl p-2" value={model.employee.department} onChange={e=>setModel(m=>({ ...m, employee: { ...m.employee, department: e.target.value, role: [ROLES_BY_DEPT[e.target.value][0]] }, clients: [] }))}>
              {DEPARTMENTS.map(d=> <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm">Role(s)</label>
            <MultiSelect
              options={rolesForDept}
              selected={model.employee.role}
              onChange={(newRoles) => setModel(m => ({ ...m, employee: { ...m.employee, role: newRoles } }))}
              placeholder="Select roles"
            />
          </div>
          <div>
            <label className="text-sm">Report Month</label>
            <input type="month" className="w-full border rounded-xl p-2" value={model.monthKey} onChange={e=>setModel(m=>({...m, monthKey:e.target.value}))} />
            <div className="text-xs text-gray-500 mt-1">Comparisons: {monthLabel(mPrev)} vs {monthLabel(mThis)}</div>
          </div>
        </div>
      </Section>

      <Section title="1b) Attendance & Tasks (this month)">
        <div className="grid md:grid-cols-4 gap-3">
          <NumField label="WFO days (0–30)" value={model.meta.attendance.wfo} onChange={v=>setModel(m=>({...m, meta:{...m.meta, attendance:{...m.meta.attendance, wfo:v}}}))}/>
          <NumField label="WFH days (0–30)" value={model.meta.attendance.wfh} onChange={v=>setModel(m=>({...m, meta:{...m.meta, attendance:{...m.meta.attendance, wfh:v}}}))}/>
          <div className="md:col-span-2 text-xs text-gray-500 mt-1">
            Total cannot exceed the number of days in {model.monthKey} ({daysInMonth(model.monthKey)} days).
          </div>
          <NumField label="Tasks completed (per AI table)" value={model.meta.tasks.count} onChange={v=>setModel(m=>({...m, meta:{...m.meta, tasks:{...m.meta.tasks, count:v}}}))}/>
          <TextField label="AI Table / PM link (Drive/URL)" value={model.meta.tasks.aiTableLink} onChange={v=>setModel(m=>({...m, meta:{...m.meta, tasks:{...m.meta.tasks, aiTableLink:v}}}))}/>
          <TextField label="AI Table screenshot (Drive URL)" value={model.meta.tasks.aiTableScreenshot} onChange={v=>setModel(m=>({...m, meta:{...m.meta, tasks:{...m.meta.tasks, aiTableScreenshot:v}}}))}/>
        </div>
      </Section>

      <DeptClientsBlock model={model} setModel={setModel} monthPrev={mPrev} monthThis={mThis} openModal={openModal} closeModal={closeModal}/>
      <LearningBlock model={model} setModel={setModel} openModal={openModal}/>

      <Section title="5) AI Usage (Optional)">
        <textarea className="w-full border rounded-xl p-3" rows={4} placeholder="List ways you used AI to work faster/better this month. Include links or examples." value={model.aiUsageNotes} onChange={e=>setModel(m=>({...m, aiUsageNotes: e.target.value}))}/>
      </Section>

      <Section title="AI Summary & Suggestions">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="bg-blue-600 text-white rounded-2xl p-4"><div className="text-sm opacity-80">KPI</div><div className="text-3xl font-semibold">{model.scores.kpiScore}/10</div></div>
          <div className="bg-blue-600 text-white rounded-2xl p-4"><div className="text-sm opacity-80">Learning</div><div className="text-3xl font-semibold">{model.scores.learningScore}/10</div></div>
          <div className="bg-blue-600 text-white rounded-2xl p-4"><div className="text-sm opacity-80">Client Status</div><div className="text-3xl font-semibold">{model.scores.relationshipScore}/10</div></div>
          <div className="bg-blue-600 text-white rounded-2xl p-4"><div className="text-sm opacity-80">Overall</div><div className="text-3xl font-semibold">{model.scores.overall}/10</div></div>
        </div>
        <div className="mt-4 text-sm bg-blue-50 border border-blue-100 rounded-xl p-3 whitespace-pre-wrap">{generateSummary(model)}</div>
      </Section>

      <div className="flex items-center gap-3">
        <button onClick={submitFinal} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-5 py-3">Submit Monthly Report</button>
      </div>
    </div>
  );
}

/************************
 * Clients & KPI Section *
 ************************/
function DeptClientsBlock({model, setModel, monthPrev, monthThis, openModal, closeModal}){
  const isInternal = ["HR","Accounts","Sales","Blended (HR + Sales)"].includes(model.employee.department);
  return (
    <Section title="2) KPIs, Reports & Client Report Status">
      {isInternal ? (
        <InternalKPIs model={model} setModel={setModel} monthPrev={monthPrev} monthThis={monthThis} />
      ) : (
        <ClientTable model={model} setModel={setModel} monthPrev={monthPrev} monthThis={monthThis} openModal={openModal} closeModal={closeModal}/>
      )}
    </Section>
  );
}

function ClientTable({model, setModel, monthPrev, monthThis, openModal, closeModal}){
  const [draftRow, setDraftRow] = useState({ name:"", scopeOfWork:"", url:"" });
  function pushDraft(){
    if(!draftRow.name.trim()) return;
    if(draftRow.url && !isDriveUrl(draftRow.url)) {
      openModal('Invalid Link', 'Please paste a Google Drive or Google Docs link.', closeModal);
      return;
    }
    const base = { id: uid(), name: draftRow.name.trim(), reports: [], relationship: { roadmapSentDate:'', reportSentDate:'', meetings:[], appreciations:[], escalations:[], clientSatisfaction:0, paymentReceived:false, paymentDate:'', omissionSuspected:'No' } };
    const withReport = (draftRow.url)
      ? { ...base, reports:[{ id: uid(), label: draftRow.scopeOfWork.trim()||'Report', url: draftRow.url.trim() }] }
      : base;
    setModel(m=>({ ...m, clients:[...m.clients, withReport] }));
    setDraftRow({ name:"", scopeOfWork:"", url:"" });
  }
  return (
    <div>
      <p className="text-xs text-gray-600 mb-2">Upload <b>Google Drive</b> links only (give view access). Use Scope of Work to describe the link (e.g., GA4 Dashboard, Ads PDF, WhatsApp screenshot).</p>
      <div className="overflow-auto">
        <table className="w-full text-sm border-separate" style={{borderSpacing:0}}>
          <thead>
            <tr className="bg-blue-50">
              <th className="text-left p-2 border">Client</th>
              <th className="text-left p-2 border">Scope of Work</th>
              <th className="text-left p-2 border">Drive URL</th>
              <th className="text-left p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {model.clients.map(c=> (
              <tr key={c.id} className="odd:bg-white even:bg-blue-50/40">
                <td className="p-2 border font-medium">{c.name}</td>
                <td className="p-2 border" colSpan={2}>
                  <TinyLinks
                    items={(c.reports||[])}
                    onAdd={(r)=>{
                      if(!isDriveUrl(r.url)) {
                        openModal('Invalid Link', 'Please paste a Google Drive/Docs link.', closeModal);
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
                <input className="w-full border rounded-lg p-2" placeholder="Google Drive link (view access)" value={draftRow.url} onChange={e=>setDraftRow(d=>({...d, url:e.target.value}))} />
              </td>
              <td className="p-2 border">
                <button className="px-3 py-2 rounded-lg bg-blue-600 text-white" onClick={pushDraft}>Add Client</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {model.clients.length===0 && (
        <div className="text-sm text-gray-600 mt-2">Start by typing a client name in the first row, optionally add a Drive link, then hit <b>Add Client</b>. KPIs for that client will appear below.</div>
      )}

      {model.clients.map(c=> (
        <div key={c.id} className="border rounded-2xl p-4 my-4 bg-white">
          <div className="font-semibold mb-2">KPIs • {c.name} <span className="text-xs text-gray-500">({monthLabel(monthPrev)} vs {monthLabel(monthThis)})</span></div>
          {model.employee.department === 'Web' && (
            <KPIsWeb client={c} onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))} monthPrev={monthPrev} monthThis={monthThis}/>
          )}
          {model.employee.department === 'Social Media' && (
            <KPIsSocial client={c} employeeRole={model.employee.role} onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))} monthPrev={monthPrev} monthThis={monthThis}/>
          )}
          {model.employee.department === 'Ads' && (
            <KPIsAds client={c} onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))} monthPrev={monthPrev} monthThis={monthThis}/>
          )}
          {model.employee.department === 'SEO' && (
            <KPIsSEO client={c} onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))} monthPrev={monthPrev} monthThis={monthThis} openModal={openModal} closeModal={closeModal}/>
          )}
          <ClientReportStatus client={c} onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))}/>
        </div>
      ))}
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


function ProofField({label, value, onChange}){
  return (
    <div>
      <label className="text-xs text-gray-600">{label} (Drive URL)</label>
      <input className="w-full border rounded-xl p-2" placeholder="https://drive.google.com/..." value={value||""} onChange={e=>onChange(e.target.value)} />
    </div>
  );
}

function KPIsWeb({client, onChange, monthPrev, monthThis}){
  const delta = (a,b)=> (a||0) - (b||0);
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      <NumField label={`# Pages (${monthLabel(monthPrev)})`} value={client.web_pagesPrev||0} onChange={v=>onChange({...client, web_pagesPrev:v})}/>
      <NumField label={`# Pages (${monthLabel(monthThis)})`} value={client.web_pagesThis||0} onChange={v=>onChange({...client, web_pagesThis:v})}/>
      <NumField label={`On-time % (${monthLabel(monthPrev)})`} value={client.web_onTimePrev||0} onChange={v=>onChange({...client, web_onTimePrev:v})}/>
      <NumField label={`On-time % (${monthLabel(monthThis)})`} value={client.web_onTimeThis||0} onChange={v=>onChange({...client, web_onTimeThis:v})}/>
      <NumField label={`Bugs Fixed (${monthLabel(monthPrev)})`} value={client.web_bugsPrev||0} onChange={v=>onChange({...client, web_bugsPrev:v})}/>
      <NumField label={`Bugs Fixed (${monthLabel(monthThis)})`} value={client.web_bugsThis||0} onChange={v=>onChange({...client, web_bugsThis:v})}/>
      <NumField label="# SaaS tools upsold (this)" value={client.web_saasUpsells||0} onChange={v=>onChange({...client, web_saasUpsells:v})}/>
      <ProofField label="SaaS proof / invoice / deck" value={client.web_saasProof} onChange={(v)=>onChange({...client, web_saasProof:v})}/>
      <ProofField label="CRO/Design review proof" value={client.web_proof} onChange={(v)=>onChange({...client, web_proof:v})}/>
      <div className="md:col-span-4 text-xs text-gray-600">MoM Pages Δ: {delta(client.web_pagesThis, client.web_pagesPrev)} • On-time Δ: {round1((client.web_onTimeThis||0)-(client.web_onTimePrev||0))} • Bugs Δ: {delta(client.web_bugsThis, client.web_bugsPrev)}</div>
    </div>
  );
}


function KPIsSocial({client, employeeRole, onChange, monthPrev, monthThis}){
  const isDesigner = employeeRole?.includes('Graphic Designer');
  const folDelta = (client.sm_followersThis||0) - (client.sm_followersPrev||0);
  const reachDelta = (client.sm_reachThis||0) - (client.sm_reachPrev||0);
  const erDelta = (client.sm_erThis||0) - (client.sm_erPrev||0);
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      {!isDesigner && (
        <>
          <NumField label={`Followers (${monthLabel(monthPrev)})`} value={client.sm_followersPrev||0} onChange={v=>onChange({...client, sm_followersPrev:v})}/>
          <NumField label={`Followers (${monthLabel(monthThis)})`} value={client.sm_followersThis||0} onChange={v=>onChange({...client, sm_followersThis:v})}/>
          <NumField label={`Reach (${monthLabel(monthPrev)})`} value={client.sm_reachPrev||0} onChange={v=>onChange({...client, sm_reachPrev:v})}/>
          <NumField label={`Reach (${monthLabel(monthThis)})`} value={client.sm_reachThis||0} onChange={v=>onChange({...client, sm_reachThis:v})}/>
          <NumField label={`Engagement Rate % (${monthLabel(monthPrev)})`} value={client.sm_erPrev||0} onChange={v=>onChange({...client, sm_erPrev:v})}/>
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
          <NumField label="# Creatives (this)" value={client.sm_creativesThis||0} onChange={v=>onChange({...client, sm_creativesThis:v})}/>
          <NumField label="Quality Score (1-10)" value={client.sm_qualityScore||0} onChange={v=>onChange({...client, sm_qualityScore:v})}/>
        </>
      )}
    </div>
  );
}

function KPIsAds({client, onChange, monthPrev, monthThis}){
  const cplDelta = (client.ads_cplThis||0) - (client.ads_cplPrev||0);
  const ctrDelta = (client.ads_ctrThis||0) - (client.ads_ctrPrev||0);
  const leadsDelta = (client.ads_leadsThis||0) - (client.ads_leadsPrev||0);
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      <NumField label="# New Ads Created (this)" value={client.ads_newAds||0} onChange={v=>onChange({...client, ads_newAds:v})}/>
      <NumField label={`CTR % (${monthLabel(monthPrev)})`} value={client.ads_ctrPrev||0} onChange={v=>onChange({...client, ads_ctrPrev:v})}/>
      <NumField label={`CTR % (${monthLabel(monthThis)})`} value={client.ads_ctrThis||0} onChange={v=>onChange({...client, ads_ctrThis:v})}/>
      <NumField label={`CPL (${monthLabel(monthPrev)})`} value={client.ads_cplPrev||0} onChange={v=>onChange({...client, ads_cplPrev:v})}/>
      <NumField label={`CPL (${monthLabel(monthThis)})`} value={client.ads_cplThis||0} onChange={v=>onChange({...client, ads_cplThis:v})}/>
      <NumField label={`Leads (${monthLabel(monthPrev)})`} value={client.ads_leadsPrev||0} onChange={v=>onChange({...client, ads_leadsPrev:v})}/>
      <NumField label={`Leads (${monthLabel(monthThis)})`} value={client.ads_leadsThis||0} onChange={v=>onChange({...client, ads_leadsThis:v})}/>
      <TextField label="Best Performing Ad (name/desc)" value={client.ads_bestAdTitle||""} onChange={v=>onChange({...client, ads_bestAdTitle:v})}/>
      <ProofField label="Best Ad proof (screenshot/insights)" value={client.ads_bestAdProof} onChange={v=>onChange({...client, ads_bestAdProof:v})}/>
      <p className="md:col-span-4 text-xs text-gray-600">MoM Δ — CTR: {round1(ctrDelta)}pp • CPL: {round1(cplDelta)} (↓ is better) • Leads: {leadsDelta}</p>
    </div>
  );
}

function KPIsSEO({client, onChange, monthPrev, monthThis, openModal, closeModal}){
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
  const trafDelta = (client.seo_trafficThis||0) - (client.seo_trafficPrev||0);
  const llmDelta  = (client.seo_llmTrafficThis||0) - (client.seo_llmTrafficPrev||0);
  const leadsDelta = (client.seo_leadsThis||0) - (client.seo_leadsPrev||0);
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      <NumField label={`Organic Traffic (${monthLabel(monthPrev)})`} value={client.seo_trafficPrev||0} onChange={v=>onChange({...client, seo_trafficPrev:v})}/>
      <NumField label={`Organic Traffic (${monthLabel(monthThis)})`} value={client.seo_trafficThis||0} onChange={v=>onChange({...client, seo_trafficThis:v})}/>
      <NumField label={`LLM/AI Overview Traffic (${monthLabel(monthPrev)})`} value={client.seo_llmTrafficPrev||0} onChange={v=>onChange({...client, seo_llmTrafficPrev:v})}/>
      <NumField label={`LLM/AI Overview Traffic (${monthLabel(monthThis)})`} value={client.seo_llmTrafficThis||0} onChange={v=>onChange({...client, seo_llmTrafficThis:v})}/>
      <NumField label={`Leads from SEO (${monthLabel(monthPrev)})`} value={client.seo_leadsPrev||0} onChange={v=>onChange({...client, seo_leadsPrev:v})}/>
      <NumField label={`Leads from SEO (${monthLabel(monthThis)})`} value={client.seo_leadsThis||0} onChange={v=>onChange({...client, seo_leadsThis:v})}/>
      <NumField label="# Keywords Improved (this)" value={client.seo_kwImprovedThis||0} onChange={v=>onChange({...client, seo_kwImprovedThis:v})}/>
      <NumField label="# AI Overviews / LLM (this)" value={client.seo_aiOverviewThis||0} onChange={v=>onChange({...client, seo_aiOverviewThis:v})}/>
      <ProofField label="Traffic/GA4 proof" value={client.seo_trafficProof} onChange={(v)=>onChange({...client, seo_trafficProof:v})}/>
      <ProofField label="AI Overview proof" value={client.seo_aiOverviewProof} onChange={(v)=>onChange({...client, seo_aiOverviewProof:v})}/>
      <div className="md:col-span-4 text-xs text-gray-600">MoM Δ — Organic: {trafDelta} {client.seo_trafficPrev? '('+round1((trafDelta/client.seo_trafficPrev)*100)+'%)' : ''} • LLM: {llmDelta} • SEO Leads: {leadsDelta}</div>

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

/*****************************
 * Client Report Status block *
 *****************************/
function ClientReportStatus({client, onChange}){
  const rel = client.relationship||{ roadmapSentDate:'', reportSentDate:'', meetings:[], appreciations:[], escalations:[], clientSatisfaction:0, paymentReceived:false, paymentDate:'', omissionSuspected:'No' };
  const [meetDraft, setMeetDraft] = useState({ date:'', summary:'', notesLink:'' });
  const [appDraft, setAppDraft] = useState({ url:'', remark:'' });
  const [escDraft, setEscDraft] = useState({ url:'', remark:'' });
  function addMeeting(){ if(!meetDraft.date || !meetDraft.summary) return; if(meetDraft.notesLink && !isDriveUrl(meetDraft.notesLink)) { alert('Notes link must be Google Drive/Docs.'); return; } onChange({ ...client, relationship: { ...rel, meetings:[...(rel.meetings||[]), { id:uid(), ...meetDraft }] }}); setMeetDraft({ date:'', summary:'', notesLink:'' }); }
  function addAppreciation(){ if(appDraft.url && !isDriveUrl(appDraft.url)) { alert('Use Google Drive link for proof.'); return; } const item = { id:uid(), url: appDraft.url||'', remark: appDraft.remark||'' }; onChange({ ...client, relationship:{...rel, appreciations:[...(rel.appreciations||[]), item]}}); setAppDraft({ url:'', remark:'' }); }
  function addEscalation(){ if(escDraft.url && !isDriveUrl(escDraft.url)) { alert('Use Google Drive link for proof.'); return; } const item = { id:uid(), url: escDraft.url||'', why: escDraft.remark||'' }; onChange({ ...client, relationship:{...rel, escalations:[...(rel.escalations||[]), item]}}); setEscDraft({ url:'', remark:'' }); }

  return (
    <div className="mt-4 border-t pt-3">
      <div className="font-medium mb-2">Client Report Status</div>
      <div className="grid md:grid-cols-4 gap-3">
        <div>
          <label className="text-sm">Roadmap Sent Date</label>
          <input type="date" className="w-full border rounded-xl p-2" value={rel.roadmapSentDate||''} onChange={e=>onChange({...client, relationship:{...rel, roadmapSentDate:e.target.value}})} />
        </div>
        <div>
          <label className="text-sm">Report Sent Date</label>
          <input type="date" className="w-full border rounded-xl p-2" value={rel.reportSentDate||''} onChange={e=>onChange({...client, relationship:{...rel, reportSentDate:e.target.value}})} />
        </div>
        <div>
          <label className="text-sm">Client Satisfaction (1–10)</label>
          <input type="number" min={1} max={10} className="w-full border rounded-xl p-2" value={rel.clientSatisfaction||0} onChange={e=>onChange({...client, relationship:{...rel, clientSatisfaction:Number(e.target.value||0)}})} />
        </div>
        <div className="md:col-span-1 flex items-end gap-2">
          <label className="text-sm mr-2">Payment Received?</label>
          <input type="checkbox" checked={!!rel.paymentReceived} onChange={e=>onChange({...client, relationship:{...rel, paymentReceived:e.target.checked}})} />
        </div>
        <div>
          <label className="text-sm">Payment Date (dd-mm-yyyy)</label>
          <input type="date" className="w-full border rounded-xl p-2" value={rel.paymentDate||''} onChange={e=>onChange({...client, relationship:{...rel, paymentDate:e.target.value}})} />
        </div>
        <div className="md:col-span-4">
          <label className="text-sm">Omission suspected in client-facing report?</label>
          <select className="w-full border rounded-xl p-2" value={rel.omissionSuspected||'No'} onChange={e=>onChange({...client, relationship:{...rel, omissionSuspected:e.target.value}})}>
            <option>No</option>
            <option>Yes</option>
          </select>
        </div>

        <div className="md:col-span-4">
          <div className="font-medium">Meetings</div>
          <div className="grid md:grid-cols-4 gap-3 mt-1">
            <input type="date" className="border rounded-xl p-2" value={meetDraft.date} onChange={e=>setMeetDraft(d=>({...d, date:e.target.value}))} />
            <input className="border rounded-xl p-2" placeholder="Summary of discussion" value={meetDraft.summary} onChange={e=>setMeetDraft(d=>({...d, summary:e.target.value}))} />
            <input className="border rounded-xl p-2" placeholder="Notes link (Drive/Doc)" value={meetDraft.notesLink} onChange={e=>setMeetDraft(d=>({...d, notesLink:e.target.value}))} />
            <button className="rounded-xl bg-blue-600 text-white px-3" onClick={addMeeting}>Add Meeting</button>
          </div>
          <ul className="text-xs mt-2 space-y-1">
            {(rel.meetings||[]).map(m=> (
              <li key={m.id} className="border rounded-lg p-2 flex items-center justify-between">
                <div>{m.date} • {m.summary} {m.notesLink && (<a className="underline ml-2" href={m.notesLink} target="_blank" rel="noreferrer">notes</a>)}</div>
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
      openModal('Missing Information', 'Please fill in the title, link, and duration to add a learning entry.', () => {
        closeModal();
      });
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
function InternalKPIs({model, setModel, monthPrev, monthThis}){
  const dept = model.employee.department;
  const c = (model.clients[0]||{ id:uid(), name: dept+" Internal" });
  function merge(p){ setModel(m=>{ const first = m.clients[0]? {...m.clients[0], ...p} : {...c, ...p}; const rest = m.clients.slice(1); return {...m, clients:[first, ...rest]};}); }
  return (
    <div className="grid md:grid-cols-4 gap-3">
      {dept==='HR' && (
        <>
          <NumField label={`Hires (${monthLabel(monthPrev)})`} value={c.hr_hiresPrev||0} onChange={v=>merge({ hr_hiresPrev:v })}/>
          <NumField label={`Hires (${monthLabel(monthThis)})`} value={c.hr_hiresThis||0} onChange={v=>merge({ hr_hiresThis:v })}/>
          <NumField label={`Retention % (${monthLabel(monthPrev)})`} value={c.hr_retentionPctPrev||0} onChange={v=>merge({ hr_retentionPctPrev:v })}/>
          <NumField label={`Retention % (${monthLabel(monthThis)})`} value={c.hr_retentionPctThis||0} onChange={v=>merge({ hr_retentionPctThis:v })}/>
          <NumField label={`Process Done % (${monthLabel(monthPrev)})`} value={c.hr_processDonePctPrev||0} onChange={v=>merge({ hr_processDonePctPrev:v })}/>
          <NumField label={`Process Done % (${monthLabel(monthThis)})`} value={c.hr_processDonePctThis||0} onChange={v=>merge({ hr_processDonePctThis:v })}/>
        </>
      )}
      {dept==='Accounts' && (
        <>
          <NumField label={`Collections % (${monthLabel(monthPrev)})`} value={c.ac_collectionsPctPrev||0} onChange={v=>merge({ ac_collectionsPctPrev:v })}/>
          <NumField label={`Collections % (${monthLabel(monthThis)})`} value={c.ac_collectionsPctThis||0} onChange={v=>merge({ ac_collectionsPctThis:v })}/>
          <NumField label={`Compliance % (${monthLabel(monthPrev)})`} value={c.ac_compliancePctPrev||0} onChange={v=>merge({ ac_compliancePctPrev:v })}/>
          <NumField label={`Compliance % (${monthLabel(monthThis)})`} value={c.ac_compliancePctThis||0} onChange={v=>merge({ ac_compliancePctThis:v })}/>
          <NumField label={`Onboarding On-time % (${monthLabel(monthPrev)})`} value={c.ac_onboardingOnTimePctPrev||0} onChange={v=>merge({ ac_onboardingOnTimePctPrev:v })}/>
          <NumField label={`Onboarding On-time % (${monthLabel(monthThis)})`} value={c.ac_onboardingOnTimePctThis||0} onChange={v=>merge({ ac_onboardingOnTimePctThis:v })}/>
        </>
      )}
      {dept==='Sales' && (
        <>
          <NumField label={`New Revenue (₹) ${monthLabel(monthPrev)}`} value={c.sa_revenuePrev||0} onChange={v=>merge({ sa_revenuePrev:v })}/>
          <NumField label={`New Revenue (₹) ${monthLabel(monthThis)}`} value={c.sa_revenueThis||0} onChange={v=>merge({ sa_revenueThis:v })}/>
          <NumField label={`Conversion % (${monthLabel(monthPrev)})`} value={c.sa_conversionRatePrev||0} onChange={v=>merge({ sa_conversionRatePrev:v })}/>
          <NumField label={`Conversion % (${monthLabel(monthThis)})`} value={c.sa_conversionRateThis||0} onChange={v=>merge({ sa_conversionRateThis:v })}/>
          <NumField label={`Pipeline (#) ${monthLabel(monthPrev)}`} value={c.sa_pipelinePrev||0} onChange={v=>merge({ sa_pipelinePrev:v })}/>
          <NumField label={`Pipeline (#) ${monthLabel(monthThis)}`} value={c.sa_pipelineThis||0} onChange={v=>merge({ sa_pipelineThis:v })}/>
          <NumField label={`AI Upsell Value (₹) ${monthLabel(monthPrev)}`} value={c.sa_aiUpsellValuePrev||0} onChange={v=>merge({ sa_aiUpsellValuePrev:v })}/>
          <NumField label={`AI Upsell Value (₹) ${monthLabel(monthThis)}`} value={c.sa_aiUpsellValueThis||0} onChange={v=>merge({ sa_aiUpsellValueThis:v })}/>
          <NumField label={`Next Month Projection (₹)`} value={c.sa_projectionNext||0} onChange={v=>merge({ sa_projectionNext:v })}/>
        </>
      )}
      {dept==='Blended (HR + Sales)' && (
        <>
          <div className="md:col-span-4 text-xs text-gray-600">Blended role: fill HR metrics first, then Sales metrics.</div>
          {/* HR */}
          <NumField label={`(HR) Hires (${monthLabel(monthPrev)})`} value={c.hr_hiresPrev||0} onChange={v=>merge({ hr_hiresPrev:v })}/>
          <NumField label={`(HR) Hires (${monthLabel(monthThis)})`} value={c.hr_hiresThis||0} onChange={v=>merge({ hr_hiresThis:v })}/>
          {/* Sales */}
          <NumField label={`(Sales) New Revenue (₹) ${monthLabel(monthPrev)}`} value={c.sa_revenuePrev||0} onChange={v=>merge({ sa_revenuePrev:v })}/>
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
  const openModal = useModal();
  function add(){
    if(!draft.url) return;
    if(!isDriveUrl(draft.url)) {
      openModal('Invalid Link', 'Please paste a Google Drive/Docs link.', () => {});
      return;
    }
    onAdd({ id: uid(), label: draft.label||'Link', url: draft.url });
    setDraft({ label:'', url:'' });
  }
  return (
    <div>
      <div className="flex gap-2">
        <input className="flex-1 border rounded-lg p-2" placeholder="Remarks (Dashboard, PDF, WhatsApp…)" value={draft.label} onChange={e=>setDraft(d=>({...d, label:e.target.value}))}/>
        <input className="flex-[2] border rounded-lg p-2" placeholder="Google Drive link (view access)" value={draft.url} onChange={e=>setDraft(d=>({...d, url:e.target.value}))}/>
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

// Hook to provide modal functionality
const ModalContext = React.createContext(() => {});
const useModal = () => React.useContext(ModalContext);

/**********************
 * Manager Dashboard  *
 **********************/
function ManagerDashboard({ onViewReport }){
  const [monthKey, setMonthKey] = useState(thisMonthKey());
  const [rows, setRows] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [notes, setNotes] = useState("");
  const [payload, setPayload] = useState(null);
  const [managerScore, setManagerScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, onCancel: null, inputLabel: '', inputValue: '' });

  const openModal = useCallback((title, message, onConfirm = null, onCancel = null, inputLabel = '', inputValue = '') => {
    setModalState({ isOpen: true, title, message, onConfirm, onCancel, inputLabel, inputValue });
  }, []);
  const closeModal = useCallback(() => {
    setModalState(s => ({ ...s, isOpen: false }));
  }, []);

  useEffect(()=>{
    (async()=>{
      setLoading(true); setErr("");
      if(supabase){
        const res = await listSubmissionsFromSupabase(monthKey);
        if(!res.ok) { setErr("Supabase error: "+(res.error?.message||res.error)); setRows([]); }
        else setRows(res.data||[]);
      } else {
        // Fallback: read local submissions for the month
        const local = (Storage.load()||[]).filter(x=>!x.isDraft && x.monthKey===monthKey).map(x=>({ id:x.id, month_key:x.monthKey, employee_name:x.employee?.name, department:x.employee?.department, role:x.employee?.role, payload:x, scores:x.scores, flags:x.flags, created_at:new Date().toISOString() }));
        setRows(local);
      }
      setLoading(false);
    })();
  },[monthKey]);

  function openRow(r){ setOpenId(r.id); setNotes(r.manager_notes||""); setPayload(r.payload||null); setManagerScore(r.manager_score || r.payload?.manager?.score || 0); }

  async function saveNotes(){
    const r = rows.find(x=>x.id===openId); if(!r) return;
    const newPayload = payload || r.payload || {};
    if(supabase){
      const res = await updateSubmissionNotes(r.id, newPayload, notes, managerScore);
      if(!res.ok) { openModal('Save Failed', 'Save failed: '+(res.error?.message||res.error), closeModal); return; }
      openModal('Saved', 'Notes saved successfully!', closeModal);
    } else {
      // local fallback
      const all = Storage.load().map(x=> x.id===r.id ? { ...x, manager:{ ...(x.manager||{}), comments: notes, score: managerScore } } : x );
      Storage.save(all);
      openModal('Saved', 'Notes saved locally.', closeModal);
    }
  }

  function exportCSV(){
    const header = ['id','month_key','employee_name','department','role','kpi','learning','client','overall','manager_score','missingLearning','hasEscalations','omitted','missingReports','created_at'];
    const rowsCsv = rows.map(r=> [
      r.id,
      r.month_key,
      clean(r.employee_name),
      r.department,
      (r.role || r.payload?.employee?.role || []).join('; '),
      r.scores?.kpiScore ?? r.payload?.scores?.kpiScore ?? '',
      r.scores?.learningScore ?? r.payload?.scores?.learningScore ?? '',
      r.scores?.relationshipScore ?? r.payload?.scores?.relationshipScore ?? '',
      r.scores?.overall ?? r.payload?.scores?.overall ?? '',
      r.manager_score ?? r.payload?.manager?.score ?? '',
      r.flags?.missingLearningHours ?? r.payload?.flags?.missingLearningHours ?? '',
      r.flags?.hasEscalations ?? r.payload?.flags?.hasEscalations ?? '',
      r.flags?.omittedChecked ?? r.payload?.flags?.omittedChecked ?? '',
      r.flags?.missingReports ?? r.payload?.flags?.missingReports ?? '',
      r.created_at
    ].map(String).map(s=>`"${s.replaceAll('"','""')}"`).join(','));
    const blob = new Blob([[header.join(',')].concat(rowsCsv).join('\n')], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`bp-submissions-${monthKey}.csv`; a.click(); URL.revokeObjectURL(url);
  }
  function exportJSON(){
    const blob = new Blob([JSON.stringify(rows,null,2)], { type:'application/json' });
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`bp-submissions-${monthKey}.json`; a.click(); URL.revokeObjectURL(url);
  }

  // Get unique employee names
  const uniqueEmployees = useMemo(() => {
    const names = new Set();
    rows.forEach(r => names.add(r.employee_name));
    return Array.from(names).sort();
  }, [rows]);

  return (
    <div>
      <Modal {...modalState} onConfirm={(v) => {
        const onConfirmFunc = modalState.onConfirm;
        closeModal();
        if (onConfirmFunc) onConfirmFunc(v);
      }} onCancel={closeModal} />
      <Section title="Filters & Export">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-sm">Report Month</label>
            <input type="month" className="border rounded-xl p-2" value={monthKey} onChange={e=>setMonthKey(e.target.value)} />
          </div>
          <button className="bg-blue-600 text-white rounded-xl px-3 py-2" onClick={exportCSV}>Export CSV</button>
          <button className="bg-blue-600 text-white rounded-xl px-3 py-2" onClick={exportJSON}>Export JSON</button>
        </div>
      </Section>

      <Section title={loading? 'Loading…' : `Submissions (${rows.length})`}>
        {err && <div className="text-red-600 text-sm mb-2">{err}</div>}
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
              {rows.map(r=> (
                <tr key={r.id} className="odd:bg-white even:bg-blue-50/40">
                  <td className="p-2 border text-left">{clean(r.employee_name)}</td>
                  <td className="p-2 border text-left">{r.department}</td>
                  <td className="p-2 border text-left">{(r.role || r.payload?.employee?.role || []).join(', ')}</td>
                  <td className="p-2 border text-center">{r.scores?.kpiScore ?? r.payload?.scores?.kpiScore ?? ''}</td>
                  <td className="p-2 border text-center">{r.scores?.learningScore ?? r.payload?.scores?.learningScore ?? ''}</td>
                  <td className="p-2 border text-center">{r.scores?.relationshipScore ?? r.payload?.scores?.relationshipScore ?? ''}</td>
                  <td className="p-2 border text-center">{r.scores?.overall ?? r.payload?.scores?.overall ?? ''}</td>
                  <td className="p-2 border text-center">{r.manager_score ?? r.payload?.manager?.score ?? ''}</td>
                  <td className="p-2 border text-xs text-left">
                    {(r.flags?.missingLearningHours ?? r.payload?.flags?.missingLearningHours) ? '⏱<6h ' : ''}
                    {(r.flags?.hasEscalations ?? r.payload?.flags?.hasEscalations) ? '⚠️Esc ' : ''}
                    {(r.flags?.omittedChecked ?? r.payload?.flags?.omittedChecked) ? '🙈Omit ' : ''}
                    {(r.flags?.missingReports ?? r.payload?.flags?.missingReports) ? '📄Miss ' : ''}
                  </td>
                  <td className="p-2 border text-center">
                    <div className="flex gap-2">
                        <button className="text-blue-600 underline" onClick={()=>openRow(r)}>Open</button>
                        <button className="text-blue-600 underline" onClick={()=>onViewReport(r.employee_name)}>View Report</button>
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
function EmployeeReportDashboard({ employeeName, onBack }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubmissions() {
      setLoading(true);
      const allSubmissions = Storage.load().filter(s => !s.isDraft);
      const employeeSubmissions = allSubmissions.filter(s => s.employee?.name === employeeName);
      setSubmissions(employeeSubmissions.sort((a, b) => a.monthKey.localeCompare(b.monthKey)));
      setLoading(false);
    }
    fetchSubmissions();
  }, [employeeName]);

  const yearlySummary = useMemo(() => {
    if (!submissions.length) {
      return null;
    }
    
    let totalKpi = 0;
    let totalLearning = 0;
    let totalRelationship = 0;
    let totalOverall = 0;
    let monthsWithLearningShortfall = 0;

    submissions.forEach(s => {
      totalKpi += s.scores?.kpiScore || 0;
      totalLearning += s.scores?.learningScore || 0;
      totalRelationship += s.scores?.relationshipScore || 0;
      totalOverall += s.scores?.overall || 0;
      if ((s.scores?.learningScore || 0) < 10) {
        monthsWithLearningShortfall++;
      }
    });

    const totalMonths = submissions.length;
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
  }, [submissions]);

  if (loading) {
    return <div className="text-center p-8">Loading employee report...</div>;
  }

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
              <div className="text-3xl font-semibold">{yearlySummary.avgLearning}/10</div>
            </div>
            <div className="bg-white border rounded-2xl p-4 shadow-sm">
              <div className="text-sm opacity-80">Appraisal Delay</div>
              <div className="text-3xl font-semibold text-red-600">
                {yearlySummary.monthsWithLearningShortfall}
                <span className="text-xl"> month{yearlySummary.monthsWithLearningShortfall !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </Section>
      )}

      <Section title="Monthly Submissions">
        <div className="space-y-4">
          {submissions.map(s => (
            <div key={s.id} className="border rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{monthLabel(s.monthKey)} Report</h3>
                <span className={`text-sm font-semibold ${s.scores.overall >= 7 ? 'text-emerald-600' : 'text-red-600'}`}>
                  Overall Score: {s.scores.overall}/10
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
                <div className="bg-gray-50 rounded-xl p-2">
                  <div className="font-medium text-gray-700">KPI</div>
                  <div className="font-bold">{s.scores.kpiScore}/10</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-2">
                  <div className="font-medium text-gray-700">Learning</div>
                  <div className="font-bold">{s.scores.learningScore}/10</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-2">
                  <div className="font-medium text-gray-700">Client Status</div>
                  <div className="font-bold">{s.scores.relationshipScore}/10</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-2">
                  <div className="font-medium text-gray-700">Learning Hours</div>
                  <div className="font-bold">{(s.learning || []).reduce((sum, e) => sum + (e.durationMins || 0), 0) / 60}h</div>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-medium text-gray-700">Summary:</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{generateSummary(s)}</p>
              </div>
              <details className="mt-4 cursor-pointer">
                <summary className="font-medium text-blue-600 hover:text-blue-800">
                  View Full Payload
                </summary>
                <pre className="text-xs bg-gray-50 border rounded-xl p-2 overflow-auto max-h-60 mt-2">
                  {JSON.stringify(s, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}


function clean(s){ return (s||'').toString(); }
