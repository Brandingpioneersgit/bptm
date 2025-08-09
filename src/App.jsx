import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/**
 * Branding Pioneers – Monthly Tactical System (MVP++ v7)
 * Single-file React app (Vite + Tailwind)
 *
 * What's new in v7 (based on your feedback):
 *  - Header logo fixed (no Japanese char); clean BP monogram
 *  - Validations (blocking) incl. Drive-only links, required fields, 6h learning
 *  - Attendance & Tasks section (WFO/WFH + tasks count + AI Table link)
 *  - Client list table uses "Remarks" (not Label)
 *  - Client Report Status (renamed from Relationship):
 *      • Roadmap Sent Date, Report Sent Date
 *      • Meetings w/ summary + notes link (Drive)
 *      • Client Satisfaction 1–10, Payment Received? + Payment Date
 *      • Evidence links area for appreciations & escalations
 *  - KPIs are monthly-comparison everywhere; month labels appear in fields
 *  - SEO KPIs expanded:
 *      • Organic Traffic prev/this (with %)
 *      • LLM (AI Overview) Traffic prev/this
 *      • Leads from SEO prev/this
 *      • Keywords Worked list (with location, volume, ranks, proof)
 *      • Keywords Top 3 list (keyword + SV + proof)
 *  - Sales/HR/Accounts now accept prev/this and (for Sales) next-month projection
 *  - Relationship score now also considers client satisfaction
 *  - Export CSV/JSON solid, Manager Notes keep working
 */

/***********************
 * Supabase Integration *
 ***********************/
const SUPABASE_URL = import.meta?.env?.VITE_SUPABASE_URL || "";
const SUPABASE_ANON = import.meta?.env?.VITE_SUPABASE_ANON_KEY || "";
const ADMIN_TOKEN = import.meta?.env?.VITE_ADMIN_ACCESS_TOKEN || ""; // simple gate for #/manager
const supabase = SUPABASE_URL && SUPABASE_ANON ? createClient(SUPABASE_URL, SUPABASE_ANON) : null;

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
async function updateSubmissionNotes(id, payload, manager_notes){
  if(!supabase) return { ok:false, error: "Supabase not configured" };
  const { error } = await supabase.from('submissions').update({ payload, manager_notes }).eq('id', id);
  if(error) return { ok:false, error };
  return { ok:true };
}

/*************************
 * Constants & Helpers    *
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

/*****************
 * Local Storage  *
 *****************/
const Storage = {
  key: "bp-tactical-mvp-v7",
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
    let folDelta=0,reach=0,er=0,campaigns=0; (clients||[]).forEach(c=>{ folDelta+=(c.sm_followersThis||0)-(c.sm_followersPrev||0); reach+=(c.sm_reachThis||0); er+=(c.sm_erThis||0); campaigns+=(c.sm_campaignsThis||0);});
    const n = clients?.length||1;
    const growthScore = Math.min(10,((folDelta/n)/200)*10);
    const reachScore = Math.min(10,((reach/n)/50000)*10);
    const erScore = Math.min(10,((er/n)/5)*10);
    const campScore = Math.min(10,((campaigns/n)/4)*10);
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
    <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold">BP</div>
    <div className="font-bold">Branding Pioneers • Monthly Tactical</div>
  </div>
);

/****************
 * App Shell     *
 ****************/
const EMPTY_SUBMISSION = {
  id: uid(),
  monthKey: thisMonthKey(),
  isDraft: true,
  employee: { name: "", department: "Web", role: ROLES_BY_DEPT["Web"][0] },
  meta: { attendance: { wfo: 0, wfh: 0 }, tasks: { count: 0, aiTableLink: "" } },
  clients: [],
  learning: [],
  aiUsageNotes: "",
  flags: { missingLearningHours: false, hasEscalations: false, omittedChecked: false, missingReports: false },
  manager: { verified: false, comments: "", hiddenDataFlag: false },
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
 * Validation helpers   *
 ***********************/
function validateSubmission(model){
  const errors = [];
  if(!(model.employee?.name||"").trim()) errors.push('Name is required.');
  const isInternal = ["HR","Accounts","Sales","Blended (HR + Sales)"].includes(model.employee.department);
  if(!isInternal && (model.clients||[]).length===0) errors.push('Add at least one client.');
  const learningMins = (model.learning||[]).reduce((s,e)=>s+(e.durationMins||0),0);
  if(learningMins < 360) errors.push('Learning must total at least 360 minutes (6 hours).');
  // Attendance simple sanity
  if(model.meta?.attendance){ const {wfo,wfh}=model.meta.attendance; if(wfo<0||wfh<0||wfo>31||wfh>31) errors.push('Attendance days must be 0–31.'); }
  // Per-client checks
  (model.clients||[]).forEach((c, idx)=>{
    if(!c.name) errors.push(`Client #${idx+1}: name is required.`);
    if(!c.reports || c.reports.length===0) errors.push(`${c.name||'Client'}: add at least one report/proof link (Drive).`);
    if((c.reports||[]).some(r=> !isDriveUrl(r.url))) errors.push(`${c.name||'Client'}: report/proof links must be Google Drive/Docs.`);
    const rel = c.relationship||{};
    if(!rel.roadmapSentDate) errors.push(`${c.name||'Client'}: Roadmap Sent Date is required.`);
    if(!rel.reportSentDate) errors.push(`${c.name||'Client'}: Report Sent Date is required.`);
    if(rel.meetings?.some(m=> m.notesLink && !isDriveUrl(m.notesLink))) errors.push(`${c.name||'Client'}: Meeting notes links must be Drive.`);
    if(rel.paymentReceived && !rel.paymentDate) errors.push(`${c.name||'Client'}: Payment date required because payment is marked received.`);
    if(rel.clientSatisfaction && (rel.clientSatisfaction<1 || rel.clientSatisfaction>10)) errors.push(`${c.name||'Client'}: Client satisfaction must be 1–10.`);
  });
  return { ok: errors.length===0, errors };
}

export default function App(){
  const hash = useHash();
  const isManager = hash.startsWith('#/manager');
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white text-gray-900">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b z-20">
        <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
          <HeaderBrand/>
          <div className="text-xs md:text-sm text-gray-600">{isManager ? 'Manager Dashboard' : 'Employee Form'} • v7</div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4">
        {isManager ? <ManagerDashboard/> : <EmployeeForm/>}
      </main>
      <footer className="max-w-6xl mx-auto p-8 text-center text-xs text-gray-500">Supabase-ready • #{thisMonthKey()}</footer>
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
    if(!check.ok){ alert('Please fix the following before submitting:

'+check.errors.map((e,i)=> (i+1)+'. '+e).join('
')); return; }
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
    if(!result.ok){ console.warn("Supabase insert failed:", result.error); alert("Submitted locally. (Cloud storage not configured)"); }
    else { alert("Submitted! (Saved to Supabase)"); }

    setModel({ ...EMPTY_SUBMISSION, id: uid(), monthKey: model.monthKey });
  }

  const mPrev = prevMonthKey(model.monthKey); const mThis = model.monthKey;

  return (
    <div>
      <Section title="1) Employee & Report Month">
        <div className="grid md:grid-cols-4 gap-3">
          <TextField label="Name" placeholder="Your name" value={model.employee.name||""} onChange={v=>setModel(m=>({...m, employee:{...m.employee, name:v}}))}/>
          <div>
            <label className="text-sm">Department</label>
            <select className="w-full border rounded-xl p-2" value={model.employee.department} onChange={e=>setModel(m=>({ ...m, employee: { ...m.employee, department: e.target.value, role: ROLES_BY_DEPT[e.target.value][0] }, clients: [] }))}>
              {DEPARTMENTS.map(d=> <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm">Role</label>
            <select className="w-full border rounded-xl p-2" value={model.employee.role} onChange={e=>setModel(m=>({ ...m, employee: { ...m.employee, role: e.target.value } }))}>
              {ROLES_BY_DEPT[model.employee.department].map(r=> <option key={r}>{r}</option>)}
            </select>
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
          <NumField label="WFO days" value={model.meta.attendance.wfo} onChange={v=>setModel(m=>({...m, meta:{...m.meta, attendance:{...m.meta.attendance, wfo:v}}}))}/>
          <NumField label="WFH days" value={model.meta.attendance.wfh} onChange={v=>setModel(m=>({...m, meta:{...m.meta, attendance:{...m.meta.attendance, wfh:v}}}))}/>
          <NumField label="Tasks completed" value={model.meta.tasks.count} onChange={v=>setModel(m=>({...m, meta:{...m.meta, tasks:{...m.meta.tasks, count:v}}}))}/>
          <TextField label="AI Table / PM link (Drive/URL)" value={model.meta.tasks.aiTableLink} onChange={v=>setModel(m=>({...m, meta:{...m.meta, tasks:{...m.meta.tasks, aiTableLink:v}}}))}/>
        </div>
      </Section>

      <DeptClientsBlock model={model} setModel={setModel} monthPrev={mPrev} monthThis={mThis} />
      <LearningBlock model={model} setModel={setModel} />

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
function DeptClientsBlock({model, setModel, monthPrev, monthThis}){
  const isInternal = ["HR","Accounts","Sales","Blended (HR + Sales)"].includes(model.employee.department);
  return (
    <Section title="2) KPIs, Reports & Client Report Status">
      {isInternal ? (
        <InternalKPIs model={model} setModel={setModel} monthPrev={monthPrev} monthThis={monthThis} />
      ) : (
        <ClientTable model={model} setModel={setModel} monthPrev={monthPrev} monthThis={monthThis} />
      )}
    </Section>
  );
}

function ClientTable({model, setModel, monthPrev, monthThis}){
  const [draftRow, setDraftRow] = useState({ name:"", remarks:"", url:"" });
  function pushDraft(){
    if(!draftRow.name.trim()) return;
    if(draftRow.url && !isDriveUrl(draftRow.url)) { alert('Please paste a Google Drive or Google Docs link.'); return; }
    const base = { id: uid(), name: draftRow.name.trim(), reports: [], relationship: { roadmapSentDate:'', reportSentDate:'', meetings:[], appreciations:[], escalations:[], clientSatisfaction:0, paymentReceived:false, paymentDate:'', omissionSuspected:'No' } };
    const withReport = (draftRow.url)
      ? { ...base, reports:[{ id: uid(), label: draftRow.remarks.trim()||'Report', url: draftRow.url.trim() }] }
      : base;
    setModel(m=>({ ...m, clients:[...m.clients, withReport] }));
    setDraftRow({ name:"", remarks:"", url:"" });
  }
  return (
    <div>
      <p className="text-xs text-gray-600 mb-2">Upload <b>Google Drive</b> links only (give view access). Use Remarks to describe the link (e.g., GA4 Dashboard, Ads PDF, WhatsApp screenshot).</p>
      <div className="overflow-auto">
        <table className="w-full text-sm border-separate" style={{borderSpacing:0}}>
          <thead>
            <tr className="bg-blue-50">
              <th className="text-left p-2 border">Client</th>
              <th className="text-left p-2 border">Remarks</th>
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
                      if(!isDriveUrl(r.url)) { alert('Please paste a Google Drive/Docs link.'); return; }
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
                <input className="w-full border rounded-lg p-2" placeholder="Remarks (Dashboard, PDF, WhatsApp…)" value={draftRow.remarks} onChange={e=>setDraftRow(d=>({...d, remarks:e.target.value}))} />
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
            <KPIsSocial client={c} role={model.employee.role} onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))} monthPrev={monthPrev} monthThis={monthThis}/>
          )}
          {model.employee.department === 'Ads' && (
            <KPIsAds client={c} onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))} monthPrev={monthPrev} monthThis={monthThis}/>
          )}
          {model.employee.department === 'SEO' && (
            <KPIsSEO client={c} onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))} monthPrev={monthPrev} monthThis={monthThis}/>
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
      <ProofField label="CRO/Design review proof" value={client.web_proof} onChange={(v)=>onChange({...client, web_proof:v})}/>
      <div className="md:col-span-4 text-xs text-gray-600">MoM Pages Δ: {delta(client.web_pagesThis, client.web_pagesPrev)} • On-time Δ: {round1((client.web_onTimeThis||0)-(client.web_onTimePrev||0))} • Bugs Δ: {delta(client.web_bugsThis, client.web_bugsPrev)}</div>
    </div>
  );
}

function KPIsSocial({client, onChange, role, monthPrev, monthThis}){
  const isDesigner = role?.includes('Designer');
  const folDelta = (client.sm_followersThis||0) - (client.sm_followersPrev||0);
  const reachDelta = (client.sm_reachThis||0) - (client.sm_reachPrev||0);
  const erDelta = (client.sm_erThis||0) - (client.sm_erPrev||0);
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      {!isDesigner && <NumField label={`Followers (${monthLabel(monthPrev)})`} value={client.sm_followersPrev||0} onChange={v=>onChange({...client, sm_followersPrev:v})}/>} 
      {!isDesigner && <NumField label={`Followers (${monthLabel(monthThis)})`} value={client.sm_followersThis||0} onChange={v=>onChange({...client, sm_followersThis:v})}/>} 
      {!isDesigner && <NumField label={`Reach (${monthLabel(monthPrev)})`} value={client.sm_reachPrev||0} onChange={v=>onChange({...client, sm_reachPrev:v})}/>} 
      {!isDesigner && <NumField label={`Reach (${monthLabel(monthThis)})`} value={client.sm_reachThis||0} onChange={v=>onChange({...client, sm_reachThis:v})}/>} 
      {!isDesigner && <NumField label={`Engagement Rate % (${monthLabel(monthPrev)})`} value={client.sm_erPrev||0} onChange={v=>onChange({...client, sm_erPrev:v})}/>} 
      {!isDesigner && <NumField label={`Engagement Rate % (${monthLabel(monthThis)})`} value={client.sm_erThis||0} onChange={v=>onChange({...client, sm_erThis:v})}/>} 
      {!isDesigner && <NumField label="# Campaigns (this)" value={client.sm_campaignsThis||0} onChange={v=>onChange({...client, sm_campaignsThis:v})}/>} 
      {isDesigner && <NumField label="# Creatives (this)" value={client.sm_creativesThis||0} onChange={v=>onChange({...client, sm_creativesThis:v})}/>} 

      <TextField label="Best Performing Post (title/desc)" value={client.sm_bestPostTitle||""} onChange={v=>onChange({...client, sm_bestPostTitle:v})}/>
      <ProofField label="Best Post proof (post URL / insights)" value={client.sm_bestPostProof} onChange={v=>onChange({...client, sm_bestPostProof:v})}/>
      <TextArea label="Distribution Achievements (what you did)" rows={3} value={client.sm_distributionNotes||""} onChange={v=>onChange({...client, sm_distributionNotes:v})}/>
      <ProofField label="Campaign proof (deck / screenshots)" value={client.sm_campaignProof} onChange={v=>onChange({...client, sm_campaignProof:v})}/>

      <p className="md:col-span-4 text-xs text-gray-600">MoM Δ — Followers: {folDelta} • Reach: {reachDelta} • ER: {round1(erDelta)}</p>
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

function KPIsSEO({client, onChange, monthPrev, monthThis}){
  const [kw, setKw] = useState(client.seo_keywordsWorked||[]);
  const [top3, setTop3] = useState(client.seo_top3||[]);
  useEffect(()=>{ onChange({...client, seo_keywordsWorked: kw}); },[kw]);
  useEffect(()=>{ onChange({...client, seo_top3: top3}); },[top3]);
  const addKw = ()=>{ const keyword = prompt('Keyword?'); if(!keyword) return; const location = prompt('Location (city/region)?')||''; const searchVolume = Number(prompt('Search volume?')||0); const rankPrev = Number(prompt('Prev rank ('+monthLabel(monthPrev)+')?')||0); const rankNow = Number(prompt('Current rank ('+monthLabel(monthThis)+')?')||0); const proof = prompt('Proof URL (Drive / SERP screenshot)')||''; setKw(list=>[...list, { keyword, location, searchVolume, rankPrev, rankNow, proof }]); };
  const addTop3 = ()=>{ const keyword = prompt('Top 3 keyword?'); if(!keyword) return; const searchVolume = Number(prompt('Search volume?')||0); const proof = prompt('Proof URL (Drive/SERP)')||''; setTop3(list=>[...list, { keyword, searchVolume, proof }]); };
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

/*****************
 * Internal KPIs  *
 *****************/
function InternalKPIs({model, setModel, monthPrev, monthThis}){
  const c = model.clients[0] || { id: uid(), name: "Internal", reports: [] };
  function setC(next){ const exists = model.clients[0]; if(exists){ setModel(m=>({...m, clients:[next]})); } else { setModel(m=>({...m, clients:[next]})); } }
  if(model.employee.department === 'HR' || model.employee.department === 'Blended (HR + Sales)'){
    return (
      <div className="grid md:grid-cols-4 gap-3">
        <NumField label={`Hires (${monthLabel(monthPrev)})`} value={c.hr_hiresPrev||0} onChange={v=>setC({ ...c, hr_hiresPrev:v })}/>
        <NumField label={`Hires (${monthLabel(monthThis)})`} value={c.hr_hiresThis||0} onChange={v=>setC({ ...c, hr_hiresThis:v })}/>
        <NumField label={`Process Completion % (${monthLabel(monthPrev)})`} value={c.hr_processDonePctPrev||0} onChange={v=>setC({ ...c, hr_processDonePctPrev:v })}/>
        <NumField label={`Process Completion % (${monthLabel(monthThis)})`} value={c.hr_processDonePctThis||0} onChange={v=>setC({ ...c, hr_processDonePctThis:v })}/>
        {model.employee.department === 'HR' && (
          <>
            <NumField label={`Retention % (${monthLabel(monthPrev)})`} value={c.hr_retentionPctPrev||0} onChange={v=>setC({ ...c, hr_retentionPctPrev:v })}/>
            <NumField label={`Retention % (${monthLabel(monthThis)})`} value={c.hr_retentionPctThis||0} onChange={v=>setC({ ...c, hr_retentionPctThis:v })}/>
          </>
        )}
        {model.employee.department === 'Blended (HR + Sales)' && (
          <>
            <div className="md:col-span-4 text-sm font-medium mt-2">Sales (20%)</div>
            <NumField label={`Revenue (₹) ${monthLabel(monthPrev)}`} value={(model.clients[1]?.sa_revenuePrev)||0} onChange={v=>{ const s = model.clients[1] || { id: uid(), name: 'Sales', reports: [] }; setModel(m=>({...m, clients: [ { ...c }, { ...s, sa_revenuePrev: v } ] })); }}/>
            <NumField label={`Revenue (₹) ${monthLabel(monthThis)}`} value={(model.clients[1]?.sa_revenueThis)||0} onChange={v=>{ const s = model.clients[1] || { id: uid(), name: 'Sales', reports: [] }; setModel(m=>({...m, clients: [ { ...c }, { ...s, sa_revenueThis: v } ] })); }}/>
            <NumField label={`Conversion % ${monthLabel(monthPrev)}`} value={(model.clients[1]?.sa_conversionRatePrev)||0} onChange={v=>{ const s = model.clients[1] || { id: uid(), name: 'Sales', reports: [] }; setModel(m=>({...m, clients: [ { ...c }, { ...s, sa_conversionRatePrev: v } ] })); }}/>
            <NumField label={`Conversion % ${monthLabel(monthThis)}`} value={(model.clients[1]?.sa_conversionRateThis)||0} onChange={v=>{ const s = model.clients[1] || { id: uid(), name: 'Sales', reports: [] }; setModel(m=>({...m, clients: [ { ...c }, { ...s, sa_conversionRateThis: v } ] })); }}/>
            <NumField label={`Pipeline ${monthLabel(monthPrev)}`} value={(model.clients[1]?.sa_pipelinePrev)||0} onChange={v=>{ const s = model.clients[1] || { id: uid(), name: 'Sales', reports: [] }; setModel(m=>({...m, clients: [ { ...c }, { ...s, sa_pipelinePrev: v } ] })); }}/>
            <NumField label={`Pipeline ${monthLabel(monthThis)}`} value={(model.clients[1]?.sa_pipelineThis)||0} onChange={v=>{ const s = model.clients[1] || { id: uid(), name: 'Sales', reports: [] }; setModel(m=>({...m, clients: [ { ...c }, { ...s, sa_pipelineThis: v } ] })); }}/>
            <NumField label={`AI Upsell (₹) ${monthLabel(monthPrev)}`} value={(model.clients[1]?.sa_aiUpsellValuePrev)||0} onChange={v=>{ const s = model.clients[1] || { id: uid(), name: 'Sales', reports: [] }; setModel(m=>({...m, clients: [ { ...c }, { ...s, sa_aiUpsellValuePrev: v } ] })); }}/>
            <NumField label={`AI Upsell (₹) ${monthLabel(monthThis)}`} value={(model.clients[1]?.sa_aiUpsellValueThis)||0} onChange={v=>{ const s = model.clients[1] || { id: uid(), name: 'Sales', reports: [] }; setModel(m=>({...m, clients: [ { ...c }, { ...s, sa_aiUpsellValueThis: v } ] })); }}/>
            <TextField label="Next-month Revenue Projection (₹)" value={(model.clients[1]?.sa_projectionNext)||""} onChange={v=>{ const s = model.clients[1] || { id: uid(), name: 'Sales', reports: [] }; setModel(m=>({...m, clients: [ { ...c }, { ...s, sa_projectionNext: v } ] })); }}/>
          </>
        )}
      </div>
    );
  }
  if(model.employee.department === 'Accounts'){
    return (
      <div className="grid md:grid-cols-4 gap-3">
        <NumField label={`Collections % (${monthLabel(monthPrev)})`} value={c.ac_collectionsPctPrev||0} onChange={v=>setC({ ...c, ac_collectionsPctPrev:v })}/>
        <NumField label={`Collections % (${monthLabel(monthThis)})`} value={c.ac_collectionsPctThis||0} onChange={v=>setC({ ...c, ac_collectionsPctThis:v })}/>
        <NumField label={`Compliance % (${monthLabel(monthPrev)})`} value={c.ac_compliancePctPrev||0} onChange={v=>setC({ ...c, ac_compliancePctPrev:v })}/>
        <NumField label={`Compliance % (${monthLabel(monthThis)})`} value={c.ac_compliancePctThis||0} onChange={v=>setC({ ...c, ac_compliancePctThis:v })}/>
        <NumField label={`Onboarding On-time % (${monthLabel(monthPrev)})`} value={c.ac_onboardingOnTimePctPrev||0} onChange={v=>setC({ ...c, ac_onboardingOnTimePctPrev:v })}/>
        <NumField label={`Onboarding On-time % (${monthLabel(monthThis)})`} value={c.ac_onboardingOnTimePctThis||0} onChange={v=>setC({ ...c, ac_onboardingOnTimePctThis:v })}/>
      </div>
    );
  }
  if(model.employee.department === 'Sales'){
    return (
      <div className="grid md:grid-cols-4 gap-3">
        <NumField label={`Revenue (₹) ${monthLabel(monthPrev)}`} value={c.sa_revenuePrev||0} onChange={v=>setC({ ...c, sa_revenuePrev:v })}/>
        <NumField label={`Revenue (₹) ${monthLabel(monthThis)}`} value={c.sa_revenueThis||0} onChange={v=>setC({ ...c, sa_revenueThis:v })}/>
        <NumField label={`# Leads in Pipeline ${monthLabel(monthPrev)}`} value={c.sa_pipelinePrev||0} onChange={v=>setC({ ...c, sa_pipelinePrev:v })}/>
        <NumField label={`# Leads in Pipeline ${monthLabel(monthThis)}`} value={c.sa_pipelineThis||0} onChange={v=>setC({ ...c, sa_pipelineThis:v })}/>
        <NumField label={`Conversion Rate % ${monthLabel(monthPrev)}`} value={c.sa_conversionRatePrev||0} onChange={v=>setC({ ...c, sa_conversionRatePrev:v })}/>
        <NumField label={`Conversion Rate % ${monthLabel(monthThis)}`} value={c.sa_conversionRateThis||0} onChange={v=>setC({ ...c, sa_conversionRateThis:v })}/>
        <NumField label={`AI Upsell Value (₹) ${monthLabel(monthPrev)}`} value={c.sa_aiUpsellValuePrev||0} onChange={v=>setC({ ...c, sa_aiUpsellValuePrev:v })}/>
        <NumField label={`AI Upsell Value (₹) ${monthLabel(monthThis)}`} value={c.sa_aiUpsellValueThis||0} onChange={v=>setC({ ...c, sa_aiUpsellValueThis:v })}/>
        <TextField label="Next-month Revenue Projection (₹)" value={c.sa_projectionNext||""} onChange={v=>setC({ ...c, sa_projectionNext:v })}/>
      </div>
    );
  }
  return null;
}

/*****************
 * Learning Block *
 *****************/
function LearningBlock({model, setModel}){
  function addEntry(){ setModel(m=>({...m, learning:[...m.learning, { id: uid(), title:"", link:"", durationMins:0, whatLearned:"", howApplied:"" }]})); }
  function update(i, entry){ setModel(m=>({...m, learning: m.learning.map((x,idx)=> idx===i?entry:x)})); }
  return (
    <Section title="3) Learning (6 hours required; multiple entries allowed)">
      <button className="text-sm px-3 py-2 bg-blue-600 text-white rounded-xl mb-3" onClick={addEntry}>+ Add Learning Entry</button>
      {model.learning.length===0 && <div className="text-sm text-gray-600">Add videos/courses/articles with duration; include what you learned and how you applied it. Exactly six hours per month is ideal.</div>}
      <div className="space-y-3">
        {model.learning.map((e, idx)=> (
          <div key={e.id} className="border rounded-2xl p-3">
            <div className="grid md:grid-cols-3 gap-3">
              <TextField label="Title" value={e.title} onChange={v=>update(idx,{...e, title:v})}/>
              <TextField label="Link (Drive/URL)" value={e.link} onChange={v=>update(idx,{...e, link:v})}/>
              <NumField label="Duration (mins)" value={e.durationMins} onChange={v=>update(idx,{...e, durationMins:v})}/>
              <TextArea label="What did you learn?" value={e.whatLearned} onChange={v=>update(idx,{...e, whatLearned:v})}/>
              <TextArea label="How did you apply it?" value={e.howApplied} onChange={v=>update(idx,{...e, howApplied:v})}/>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-sm text-gray-600">If I quiz you on this, would you be able to answer? (Short quizzes coming soon.)</div>
    </Section>
  );
}

/***************************
 * Client Report Status     *
 ***************************/
function ClientReportStatus({client, onChange}){
  const r = client.relationship || { roadmapSentDate:'', reportSentDate:'', meetings:[], appreciations:[], escalations:[], clientSatisfaction:0, paymentReceived:false, paymentDate:'', omissionSuspected:'No', omissionNotes:'' };
  function addMeeting(){ onChange({ ...client, relationship: { ...r, meetings:[...r.meetings, { id: uid(), date: new Date().toISOString().slice(0,10), mode: 'Virtual', notesLink: '', summary: '' }] }}); }
  function addEsc(){ onChange({ ...client, relationship: { ...r, escalations:[...r.escalations, { id: uid(), description:'', proofLinks:[] }] }}); }
  function updMeet(i, val){ onChange({ ...client, relationship: { ...r, meetings: r.meetings.map((x,idx)=> idx===i?val:x) } }); }
  function updEsc(i, val){ onChange({ ...client, relationship: { ...r, escalations: r.escalations.map((x,idx)=> idx===i?val:x) } }); }
  return (
    <div className="mt-3 border rounded-2xl p-3">
      <div className="grid md:grid-cols-4 gap-2 mb-2">
        <div>
          <label className="text-sm">Roadmap Sent Date</label>
          <input type="date" className="w-full border rounded-xl p-2" value={r.roadmapSentDate||''} onChange={e=> onChange({ ...client, relationship:{...r, roadmapSentDate:e.target.value} })}/>
        </div>
        <div>
          <label className="text-sm">Report Sent Date</label>
          <input type="date" className="w-full border rounded-xl p-2" value={r.reportSentDate||''} onChange={e=> onChange({ ...client, relationship:{...r, reportSentDate:e.target.value} })}/>
        </div>
        <div>
          <label className="text-sm">Client Satisfaction (1–10)</label>
          <input type="number" min={1} max={10} className="w-full border rounded-xl p-2" value={r.clientSatisfaction||0} onChange={e=> onChange({ ...client, relationship:{...r, clientSatisfaction: Number(e.target.value) } })}/>
        </div>
        <div className="flex items-center gap-2">
          <input id={`pay-${client.id}`} type="checkbox" className="scale-110" checked={!!r.paymentReceived} onChange={e=> onChange({ ...client, relationship:{...r, paymentReceived:e.target.checked} })} />
          <label htmlFor={`pay-${client.id}`} className="text-sm">Payment received for this month</label>
        </div>
        {r.paymentReceived && (
          <div>
            <label className="text-sm">Payment Date</label>
            <input type="date" className="w-full border rounded-xl p-2" value={r.paymentDate||''} onChange={e=> onChange({ ...client, relationship:{...r, paymentDate:e.target.value} })}/>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-2"><div className="font-medium">Meetings • {client.name}</div><button className="text-xs px-2 py-1 bg-blue-600 text-white rounded-lg" onClick={addMeeting}>+ Add Meeting</button></div>
      <div className="space-y-2">
        {r.meetings.map((m,i)=> (
          <div key={m.id} className="grid md:grid-cols-5 gap-2 items-start">
            <input type="date" className="border rounded-xl p-2" value={m.date} onChange={e=>updMeet(i,{...m, date:e.target.value})}/>
            <select className="border rounded-xl p-2" value={m.mode} onChange={e=>updMeet(i,{...m, mode:e.target.value})}><option>Virtual</option><option>Physical</option></select>
            <input className="border rounded-xl p-2" placeholder="Minutes/Notes Link (Drive)" value={m.notesLink} onChange={e=>updMeet(i,{...m, notesLink:e.target.value})}/>
            <textarea className="md:col-span-2 border rounded-xl p-2" rows={2} placeholder="Summary of discussion / key decisions" value={m.summary||""} onChange={e=>updMeet(i,{...m, summary:e.target.value})}></textarea>
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-600">For any media/images, upload to <b>Google Drive</b> and paste the link here.</div>

      <div className="mt-2">
        <div className="font-medium mb-1">Appreciations (WhatsApp etc.)</div>
        <TinyLinks items={r.appreciations} onAdd={(x)=> { if(!isDriveUrl(x.url)) { alert('Please use Google Drive/Docs links.'); return; } onChange({ ...client, relationship:{...r, appreciations:[...(r.appreciations||[]), x]} }); }} onRemove={(id)=> onChange({ ...client, relationship:{...r, appreciations:r.appreciations.filter(a=>a.id!==id)} })} />
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1"><div className="font-medium">Escalations</div><button className="text-xs px-2 py-1 bg-blue-600 text-white rounded-lg" onClick={addEsc}>+ Add</button></div>
        <div className="space-y-2">
          {r.escalations.map((e,i)=> (
            <div key={e.id} className="space-y-2">
              <textarea className="w-full border rounded-xl p-2" rows={2} placeholder="What happened and why?" value={e.description} onChange={ev=>updEsc(i,{...e, description: ev.target.value})}/>
              <TinyLinks items={e.proofLinks||[]} onAdd={(x)=>{ if(!isDriveUrl(x.url)) { alert('Please use Google Drive/Docs links.'); return; } updEsc(i,{...e, proofLinks:[...(e.proofLinks||[]), x]}); }} onRemove={(id)=>updEsc(i,{...e, proofLinks:(e.proofLinks||[]).filter(p=>p.id!==id)})} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 grid md:grid-cols-2 gap-2">
        <div>
          <label className="text-sm">Do you suspect any key metrics were omitted from the client-facing report?</label>
          <select className="w-full border rounded-xl p-2" value={r.omissionSuspected||'No'} onChange={e=> onChange({ ...client, relationship:{...r, omissionSuspected:e.target.value} })}>
            <option>No</option>
            <option>Maybe</option>
            <option>Yes</option>
          </select>
        </div>
        <TextArea label="If Yes/Maybe, which metrics might be missing? (internal)" value={r.omissionNotes||''} onChange={v=> onChange({ ...client, relationship:{...r, omissionNotes:v} })} />
      </div>
    </div>
  );
}

/****************
 * Manager View *
 ****************/
function ManagerDashboard(){
  const [gateOK, setGateOK] = useState(!ADMIN_TOKEN);
  useEffect(()=>{
    if(!ADMIN_TOKEN) return; const cached = sessionStorage.getItem('bp-admin-token-ok'); if(cached==='1'){ setGateOK(true); return; }
    const input = prompt('Enter admin access token'); if(input && input===ADMIN_TOKEN){ sessionStorage.setItem('bp-admin-token-ok','1'); setGateOK(true); } else { alert('Invalid token. Reload page to retry.'); }
  },[]);

  const [items, setItems] = useState([]);
  const [month, setMonth] = useState(thisMonthKey());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  async function refresh(){
    setLoading(true); setError("");
    const supa = await listSubmissionsFromSupabase(month);
    if(supa.ok){ setItems(supa.data); setLoading(false); return; }
    const local = Storage.load().filter(x=>!x.isDraft && x.monthKey===month);
    setItems(local.map(s=>({ id:s.id, month_key:s.monthKey, employee_name:s.employee.name, department:s.employee.department, role:s.employee.role, payload:s, scores:s.scores, flags:s.flags, created_at:new Date().toISOString() })));
    setError("");
    setLoading(false);
  }
  useEffect(()=>{ refresh(); },[]);
  useEffect(()=>{ refresh(); },[month]);

  const monthList = useMemo(()=>{
    const localMonths = Storage.load().filter(s=>!s.isDraft).map(s=>s.monthKey);
    const supaMonths = items.map(s=> s.month_key).filter(Boolean);
    return Array.from(new Set([thisMonthKey(), ...localMonths, ...supaMonths])).sort();
  }, [items]);

  if(!gateOK) return <div className="text-center p-8">Waiting for valid admin token…</div>;

  if(selected){
    const s = selected; const p = s.payload || {}; const clients = p.clients || [];
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={()=>setSelected(null)} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm">← Back</button>
          <div className="text-sm text-gray-600">{s.employee_name} • {p.employee?.department} ({p.employee?.role}) — {s.month_key}</div>
          <button onClick={()=>{
            const data = JSON.stringify(s, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'bp-report-'+s.employee_name+'-'+s.month_key+'.json'; a.click(); URL.revokeObjectURL(url);
          }} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm">Export JSON</button>
          <button onClick={()=>{
            const rows = [];
            rows.push(['Employee','Department','Role','Month','KPI','Learning','ClientStatus','Overall'].join(','));
            rows.push([s.employee_name, p.employee?.department, p.employee?.role, s.month_key, p.scores?.kpiScore, p.scores?.learningScore, p.scores?.relationshipScore, p.scores?.overall].join(','));
            rows.push('');
            rows.push(['Client','KPIs (This)','MoM Notes','Meetings','Appr','Esc','Satisfaction','Payment','Flags'].join(','));
            (p.clients||[]).forEach(c=>{
              const rel = c.relationship||{};
              const flags = [ (c.reports||[]).length===0? 'No report': null, (rel.omissionSuspected&&rel.omissionSuspected!=='No')? 'Omission suspected': null, ].filter(Boolean).join(' / ');
              const dept = p.employee?.department;
              const kpis = (
                dept==='Ads' ? 'CTR '+(c.ads_ctrThis??'-')+'% / CPL '+(c.ads_cplThis??'-')+' / Leads '+(c.ads_leadsThis??'-') :
                dept==='SEO' ? 'Traffic '+(c.seo_trafficThis??'-')+' / LLM '+(c.seo_llmTrafficThis??'-')+' / Leads '+(c.seo_leadsThis??'-')+' / Top3 '+((c.seo_top3?.length)||0) :
                dept==='Social Media' ? 'Followers '+(c.sm_followersThis??'-')+' / Reach '+(c.sm_reachThis??'-')+' / ER '+(c.sm_erThis??'-')+'%' :
                dept==='Web' ? 'Pages '+(c.web_pagesThis??'-')+' / OnTime '+(c.web_onTimeThis??'-')+'% / Bugs '+(c.web_bugsThis??'-') : '—'
              );
              const mom = (
                dept==='Ads' ? 'ΔCTR '+round1((c.ads_ctrThis||0)-(c.ads_ctrPrev||0))+' • ΔCPL '+round1((c.ads_cplThis||0)-(c.ads_cplPrev||0))+' • ΔLeads '+((c.ads_leadsThis||0)-(c.ads_leadsPrev||0)) :
                dept==='SEO' ? 'ΔTraffic '+((c.seo_trafficThis||0)-(c.seo_trafficPrev||0))+' • ΔLLM '+((c.seo_llmTrafficThis||0)-(c.seo_llmTrafficPrev||0))+' • ΔLeads '+((c.seo_leadsThis||0)-(c.seo_leadsPrev||0)) :
                dept==='Social Media' ? 'ΔFollowers '+((c.sm_followersThis||0)-(c.sm_followersPrev||0))+' • ΔReach '+((c.sm_reachThis||0)-(c.sm_reachPrev||0))+' • ΔER '+round1((c.sm_erThis||0)-(c.sm_erPrev||0)) :
                dept==='Web' ? 'ΔPages '+((c.web_pagesThis||0)-(c.web_pagesPrev||0))+' • ΔOnTime '+round1((c.web_onTimeThis||0)-(c.web_onTimePrev||0))+' • ΔBugs '+((c.web_bugsThis||0)-(c.web_bugsPrev||0)) : '—'
              );
              rows.push([c.name, '"'+kpis+'"', '"'+mom+'"', rel.meetings?.length||0, rel.appreciations?.length||0, rel.escalations?.length||0, rel.clientSatisfaction||0, rel.paymentReceived?'Yes':'No', flags||'—'].join(','));
            });
            const blob = new Blob([rows.join('
')], { type:'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='bp-report-'+s.employee_name+'-'+s.month_key+'.csv'; a.click(); URL.revokeObjectURL(url);
          }} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm">Export CSV</button>
        </div>
        <div className="grid md:grid-cols-5 gap-3 mb-4">
          <div className="bg-blue-600 text-white rounded-2xl p-4"><div className="text-sm opacity-80">KPI</div><div className="text-3xl font-semibold">{p.scores?.kpiScore}/10</div></div>
          <div className="bg-blue-600 text-white rounded-2xl p-4"><div className="text-sm opacity-80">Learning</div><div className="text-3xl font-semibold">{p.scores?.learningScore}/10</div></div>
          <div className="bg-blue-600 text-white rounded-2xl p-4"><div className="text-sm opacity-80">Client Status</div><div className="text-3xl font-semibold">{p.scores?.relationshipScore}/10</div></div>
          <div className="bg-blue-600 text-white rounded-2xl p-4"><div className="text-sm opacity-80">Overall</div><div className="text-3xl font-semibold">{p.scores?.overall}/10</div></div>
          <div className="bg-blue-600 text-white rounded-2xl p-4"><div className="text-sm opacity-80">Tasks</div><div className="text-3xl font-semibold">{p.meta?.tasks?.count||0}</div></div>
        </div>
        <div className="bg-white border rounded-2xl p-4 mb-4">
          <div className="font-semibold mb-2">Per-Client Summary</div>
          <div className="overflow-auto">
            <table className="w-full text-sm border-separate" style={{borderSpacing:0}}>
              <thead><tr className="bg-blue-50"><th className="p-2 border text-left">Client</th><th className="p-2 border text-left">Key KPIs (This)</th><th className="p-2 border text-left">MoM Notes</th><th className="p-2 border text-left">Meet</th><th className="p-2 border text-left">Appr</th><th className="p-2 border text-left">Esc</th><th className="p-2 border text-left">Sat</th><th className="p-2 border text-left">Payment</th><th className="p-2 border text-left">Flags</th></tr></thead>
              <tbody>
                {clients.map(c=>{
                  const rel = c.relationship||{};
                  const flags = [ (c.reports||[]).length===0? 'No report': null, (rel.omissionSuspected&&rel.omissionSuspected!=='No')? 'Omission suspected': null, ].filter(Boolean).join(', ');
                  const dept = p.employee?.department;
                  const kpis = (
                    dept==='Ads' ? 'CTR '+(c.ads_ctrThis??'-')+'% / CPL '+(c.ads_cplThis??'-')+' / Leads '+(c.ads_leadsThis??'-') :
                    dept==='SEO' ? 'Traffic '+(c.seo_trafficThis??'-')+' / LLM '+(c.seo_llmTrafficThis??'-')+' / Leads '+(c.seo_leadsThis??'-')+' / Top3 '+((c.seo_top3?.length)||0) :
                    dept==='Social Media' ? 'Followers '+(c.sm_followersThis??'-')+' / Reach '+(c.sm_reachThis??'-')+' / ER '+(c.sm_erThis??'-')+'%' :
                    dept==='Web' ? 'Pages '+(c.web_pagesThis??'-')+' / OnTime '+(c.web_onTimeThis??'-')+'% / Bugs '+(c.web_bugsThis??'-') : '—'
                  );
                  const mom = (
                    dept==='Ads' ? 'ΔCTR '+round1((c.ads_ctrThis||0)-(c.ads_ctrPrev||0))+' • ΔCPL '+round1((c.ads_cplThis||0)-(c.ads_cplPrev||0))+' • ΔLeads '+((c.ads_leadsThis||0)-(c.ads_leadsPrev||0)) :
                    dept==='SEO' ? 'ΔTraffic '+((c.seo_trafficThis||0)-(c.seo_trafficPrev||0))+' • ΔLLM '+((c.seo_llmTrafficThis||0)-(c.seo_llmTrafficPrev||0))+' • ΔLeads '+((c.seo_leadsThis||0)-(c.seo_leadsPrev||0)) :
                    dept==='Social Media' ? 'ΔFollowers '+((c.sm_followersThis||0)-(c.sm_followersPrev||0))+' • ΔReach '+((c.sm_reachThis||0)-(c.sm_reachPrev||0))+' • ΔER '+round1((c.sm_erThis||0)-(c.sm_erPrev||0)) :
                    dept==='Web' ? 'ΔPages '+((c.web_pagesThis||0)-(c.web_pagesPrev||0))+' • ΔOnTime '+round1((c.web_onTimeThis||0)-(c.web_onTimePrev||0))+' • ΔBugs '+((c.web_bugsThis||0)-(c.web_bugsPrev||0)) : '—'
                  );
                  return (
                    <tr key={c.id} className="odd:bg-white even:bg-blue-50/40">
                      <td className="p-2 border">{c.name}</td>
                      <td className="p-2 border">{kpis}</td>
                      <td className="p-2 border">{mom}</td>
                      <td className="p-2 border">{rel.meetings?.length||0}</td>
                      <td className="p-2 border">{rel.appreciations?.length||0}</td>
                      <td className="p-2 border">{rel.escalations?.length||0}</td>
                      <td className="p-2 border">{rel.clientSatisfaction||0}</td>
                      <td className="p-2 border">{rel.paymentReceived?'Yes':'No'}</td>
                      <td className="p-2 border">{flags||'—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white border rounded-2xl p-4">
          <div className="font-semibold mb-2">AI Feedback</div>
          <div className="text-sm bg-blue-50 border border-blue-100 rounded-xl p-3 whitespace-pre-wrap">{generateSummary(p)}</div>
        </div>
        <div className="bg-white border rounded-2xl p-4 mt-4">
          <div className="font-semibold mb-2">Manager Notes (private)</div>
          <textarea className="w-full border rounded-2xl p-3" rows={4} defaultValue={s.manager_notes||''} onChange={e=>{ setSelected({ ...s, manager_notes: e.target.value }); }} placeholder="Observations, risks, development feedback…"></textarea>
          <div className="mt-2 flex items-center gap-2">
            <button className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm" onClick={async()=>{
              const updated = { ...s, payload: { ...p }, manager_notes: s.manager_notes||'' };
              const res = await updateSubmissionNotes(s.id, updated.payload, updated.manager_notes);
              if(!res.ok){ alert('Saved locally only (cloud not configured).'); } else { alert('Notes saved.'); }
            }}>Save Notes</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <select className="border rounded-xl p-2" value={month} onChange={e=>setMonth(e.target.value)}>
          {monthList.map(m=> <option key={m}>{m}</option>)}
        </select>
        <button onClick={refresh} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm">Refresh</button>
        <a href="#/" className="text-sm underline">Back to form</a>
        {!supabase && <span className="text-xs text-gray-500">Local mode (set VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY to enable cloud)</span>}
      </div>
      {loading && <div className="text-sm text-gray-600">Loading…</div>}
      {error && <div className="text-sm text-amber-700">{error}</div>}
      <div className="grid gap-3">
        {!loading && items.length===0 && <div className="text-sm text-gray-600">No submissions for this month yet.</div>}
        {items.map(s=> {
          const payload = s.payload || {}; const flags = s.flags || payload.flags || {}; const scores = s.scores || payload.scores || { kpiScore:0, learningScore:0, relationshipScore:0, overall:0 };
          return (
            <div key={s.id} className="bg-white border rounded-2xl p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700">{s.employee_name?.[0]||'U'}</div>
                  <div>
                    <div className="font-semibold">{s.employee_name} • {s.department} ({s.role})</div>
                    <div className="text-xs text-gray-500">{s.month_key}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-1 rounded-full bg-blue-600 text-white">{scores.overall}/10</span>
                  {flags.missingLearningHours && <Pill>Learning &lt; 6h</Pill>}
                  {flags.hasEscalations && <Pill>Escalations</Pill>}
                  {flags.omittedChecked && <Pill>Omission?</Pill>}
                  {flags.missingReports && <Pill>Missing reports</Pill>}
                </div>
                <button onClick={()=>setSelected(s)} className="px-3 py-2 bg-blue-600 text-white rounded-xl text-sm">Open</button>
              </div>
              <div className="mt-2 grid md:grid-cols-4 gap-2 text-sm">
                <div>KPI: <b>{scores.kpiScore}/10</b></div>
                <div>Learning: <b>{scores.learningScore}/10</b></div>
                <div>Client Status: <b>{scores.relationshipScore}/10</b></div>
                <div>Overall: <b>{scores.overall}/10</b></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/***********************
 * UI Primitives
 ***********************/
function Section({title, children}){
  return (
    <section className="my-6">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>{title}</h2>
      <div className="bg-white border rounded-2xl p-4 shadow-sm">{children}</div>
    </section>
  );
}
function TextField({label, value, onChange, placeholder}){
  return (
    <div>
      <label className="text-sm">{label}</label>
      <input className="w-full border rounded-xl p-2" value={value||''} placeholder={placeholder||''} onChange={e=>onChange(e.target.value)} />
    </div>
  );
}
function NumField({label, value, onChange}){
  return (
    <div>
      <label className="text-sm">{label}</label>
      <input type="number" className="w-full border rounded-xl p-2" value={value??0} onChange={e=>onChange(Number(e.target.value))} />
    </div>
  );
}
function TextArea({label, value, onChange, rows=3}){
  return (
    <div className="md:col-span-2">
      <label className="text-sm">{label}</label>
      <textarea className="w-full border rounded-xl p-2" rows={rows} value={value||''} onChange={e=>onChange(e.target.value)}></textarea>
    </div>
  );
}
function Pill({children}){
  return <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs">{children}</span>;
}
function TinyLinks({items=[], onAdd, onRemove}){
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  function add(){ if(!label || !url) return; onAdd?.({ id: uid(), label: label.trim(), url: url.trim() }); setLabel(''); setUrl(''); }
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <input className="flex-1 border rounded-lg p-2" placeholder="Remarks (e.g., GA4 Dashboard)" value={label} onChange={e=>setLabel(e.target.value)} />
        <input className="flex-[2] border rounded-lg p-2" placeholder="Drive URL" value={url} onChange={e=>setUrl(e.target.value)} />
        <button className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm" onClick={add}>Add</button>
      </div>
      <div className="space-y-1">
        {(items||[]).map(x=> (
          <div key={x.id} className="text-xs flex items-center justify-between border rounded-lg p-2">
            <div className="truncate"><b>{x.label}</b>: <a className="underline" href={x.url} target="_blank" rel="noreferrer">{x.url}</a></div>
            <button className="text-red-600" onClick={()=>onRemove?.(x.id)}>Remove</button>
          </div>
        ))}
        {(!items || items.length===0) && <div className="text-xs text-gray-500">No links added yet.</div>}
      </div>
    </div>
  );
}
