import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/**
 * Branding Pioneers – Monthly Tactical System (MVP+)
 * Single-file React app ready for Vite + Tailwind.
 * - Employee Form with dynamic KPIs
 * - Spreadsheet-like Client entry (first row asks Client name + evidence)
 * - Learning (exact 6h target), Relationship, AI usage
 * - Real-time Growth Score (10/5/5) and red flags
 * - Manager Dashboard (#admin) with token gate + Supabase or local fallback
 *
 * ENV (Netlify/Vercel):
 *  VITE_SUPABASE_URL
 *  VITE_SUPABASE_ANON_KEY
 *  VITE_ADMIN_ACCESS_TOKEN (optional but recommended)
 */

/***********************
 * Supabase Integration *
 ***********************/
const SUPABASE_URL = import.meta?.env?.VITE_SUPABASE_URL || "";
const SUPABASE_ANON = import.meta?.env?.VITE_SUPABASE_ANON_KEY || "";
const ADMIN_TOKEN = import.meta?.env?.VITE_ADMIN_ACCESS_TOKEN || ""; // simple gate for #admin
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
const round1 = (n) => Math.round(n*10)/10;

/*****************
 * Local Storage  *
 *****************/
const Storage = {
  key: "codex-mvp-v1",
  load(){ try { return JSON.parse(localStorage.getItem(this.key)||"[]"); } catch { return []; } },
  save(all){ localStorage.setItem(this.key, JSON.stringify(all)); },
};

/********************
 * Scoring Functions *
 ********************/
function scoreKPIs(employee, clients){
  const dept = employee.department;
  if(dept === "Web"){
    let pages=0,onTime=0,bugs=0,urls=0; (clients||[]).forEach(c=>{ pages+=c.web_pagesDelivered||0; onTime+=c.web_onTimePct||0; bugs+=c.web_bugsFixed||0; urls+=(c.web_urls||[]).length;});
    const n = clients?.length||1;
    const pagesScore = Math.min(10,(pages/10)*10);
    const onTimeScore = Math.min(10,(onTime/n)/10);
    const bugsScore = Math.min(10,(bugs/20)*10);
    const urlsScore = Math.min(10,(urls/10)*10);
    return round1(pagesScore*0.45 + onTimeScore*0.25 + bugsScore*0.15 + urlsScore*0.15);
  }
  if(dept === "Social Media"){
    let fol=0,reach=0,eng=0,camp=0,creatives=0; (clients||[]).forEach(c=>{ fol+=c.sm_followersDelta||0; reach+=c.sm_reach||0; eng+=c.sm_engagementRate||0; camp+=c.sm_campaigns||0; creatives+=c.sm_creativesCount||0;});
    const n = clients?.length||1;
    const growthScore = Math.min(10,((fol/n)/200)*10);
    const reachScore = Math.min(10,((reach/n)/50000)*10);
    const engScore = Math.min(10,((eng/n)/5)*10);
    const campScore = Math.min(10,((camp/n)/4)*10);
    const creativeScore = Math.min(10,((creatives/n)/20)*10);
    return round1(growthScore*0.25 + reachScore*0.20 + engScore*0.25 + campScore*0.15 + creativeScore*0.15);
  }
  if(dept === "Ads"){
    let newAds=0,ctr=0,cpl=0,leads=0; (clients||[]).forEach(c=>{ newAds+=c.ads_newAds||0; ctr+=c.ads_ctr||0; cpl+=c.ads_cpl||0; leads+=c.ads_leads||0;});
    const n = clients?.length||1;
    const newAdsScore = Math.min(10,((newAds/n)/15)*10);
    const ctrScore = Math.min(10,((ctr/n)/3)*10);
    const cplScore = Math.min(10,(3/Math.max(0.1,(cpl/n)))*10);
    const leadsScore = Math.min(10,((leads/n)/150)*10);
    return round1(newAdsScore*0.2 + ctrScore*0.25 + cplScore*0.25 + leadsScore*0.3);
  }
  if(dept === "SEO"){
    let traf=0, rankKw=0, aiO=0, volSum=0, kwCount=0; (clients||[]).forEach(c=>{ traf+=c.seo_trafficDeltaPct||0; rankKw+=c.seo_rankImprovedKeywords||0; aiO+=c.seo_aiOverviewCount||0; (c.seo_keywordsWorked||[]).forEach(k=>{ volSum+=(k.searchVolume||0); kwCount++; });});
    const n = clients?.length||1;
    const trafScore = Math.min(10,((traf/n)/20)*10);
    const rankScore = Math.min(10,((rankKw/n)/10)*10);
    const aiScore = Math.min(10,((aiO/n)/5)*10);
    const volScore = Math.min(10,((volSum/Math.max(1,kwCount))/500)*10);
    return round1(trafScore*0.35 + rankScore*0.30 + aiScore*0.15 + volScore*0.20);
  }
  if(dept === "HR"){
    const c = clients?.[0]||{}; const hires=c.hr_hires||0, ret=c.hr_retentionPct||0, proc=c.hr_processDonePct||0;
    const s1=Math.min(10,(hires/5)*10), s2=Math.min(10,ret/10), s3=Math.min(10,proc/10);
    return round1(s1*0.4 + s2*0.3 + s3*0.3);
  }
  if(dept === "Accounts"){
    const c = clients?.[0]||{}; const col=c.ac_collectionsPct||0, comp=c.ac_compliancePct||0, onb=c.ac_onboardingOnTimePct||0;
    const score=(col/10)*0.5 + (comp/10)*0.25 + (onb/10)*0.25; return round1(Math.min(10,score));
  }
  if(dept === "Sales"){
    const c = clients?.[0]||{}; const rev=c.sa_revenue||0, conv=c.sa_conversionRate||0, pipe=c.sa_pipeline||0, ups=c.sa_aiUpsellValue||0;
    const s1=Math.min(10,(rev/500000)*10), s2=Math.min(10,(conv/5)*10), s3=Math.min(10,(pipe/25)*10), s4=Math.min(10,(ups/100000)*10);
    return round1(s1*0.45 + s2*0.2 + s3*0.2 + s4*0.15);
  }
  if(dept === "Blended (HR + Sales)"){
    const hr=clients?.[0]||{}, sales=clients?.[1]||{};
    const hrScore = Math.min(10,(hr.hr_hires||0)/5*10)*0.6 + Math.min(10,(hr.hr_processDonePct||0)/10)*0.4;
    const salesScore = Math.min(10,(sales.sa_revenue||0)/300000*10)*0.7 + Math.min(10,(sales.sa_conversionRate||0)/5*10)*0.3;
    return round1(hrScore*0.8 + salesScore*0.2);
  }
  return 0;
}
function scoreLearning(entries){ const total = (entries||[]).reduce((s,e)=>s+(e.durationMins||0),0); const ratio = Math.min(1,total/(6*60)); return round1(5*ratio); }
function scoreRelationship(r){ const meetings=r.meetings?.length||0, appr=r.appreciations?.length||0, esc=r.escalations?.length||0; const ms=Math.min(3,meetings*0.6), as=Math.min(2,appr*0.5), ep=Math.min(3,esc*0.8); return round1(Math.max(0, ms+as-ep)); }

/*****************
 * Small Controls *
 *****************/
const Section = ({title, children}) => (
  <div className="bg-white rounded-2xl shadow p-5 mb-5">
    <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-semibold">{title}</h2></div>
    {children}
  </div>
);
const Pill = ({children}) => (<span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs mr-2">{children}</span>);
const NumField = ({label, value, onChange}) => (<div><label className="text-sm">{label}</label><input type="number" className="w-full border rounded-xl p-2" value={value} onChange={e=>onChange(Number(e.target.value))}/></div>);
const TextField = ({label, value, onChange}) => (<div><label className="text-sm">{label}</label><input className="w-full border rounded-xl p-2" value={value} onChange={e=>onChange(e.target.value)}/></div>);
const TextArea = ({label, value, onChange}) => (<div className="md:col-span-3"><label className="text-sm">{label}</label><textarea className="w-full border rounded-xl p-2" rows={3} value={value} onChange={e=>onChange(e.target.value)} /></div>);

function TinyLinks({items=[], onAdd, onRemove}){
  const [label, setLabel] = useState(""); const [url, setUrl] = useState("");
  return (
    <div>
      <div className="flex gap-2">
        <input className="flex-1 border rounded-xl p-2" placeholder="Label" value={label} onChange={e=>setLabel(e.target.value)} />
        <input className="flex-1 border rounded-xl p-2" placeholder="URL" value={url} onChange={e=>setUrl(e.target.value)} />
        <button className="px-3 bg-gray-900 text-white rounded-xl" onClick={()=>{ if(!label||!url) return; onAdd({ id: uid(), label, url }); setLabel(""); setUrl(""); }}>Add</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">{(items||[]).map(i=> (<span key={i.id} className="text-xs bg-gray-100 rounded-lg px-2 py-1 flex items-center gap-2"><a className="underline" href={i.url} target="_blank" rel="noreferrer">{i.label}</a><button className="text-red-600" onClick={()=>onRemove(i.id)}>×</button></span>))}</div>
    </div>
  );
}

/****************
 * App Shell     *
 ****************/
const EMPTY_SUBMISSION = {
  id: uid(),
  monthKey: thisMonthKey(),
  employee: { name: "", email: "", department: "Web", role: ROLES_BY_DEPT["Web"][0] },
  clients: [],
  learning: [],
  relationship: { meetings: [], appreciations: [], escalations: [], omittedMetricsDeclared: false },
  aiUsageNotes: "",
  flags: { missingLearningHours: false, hasEscalations: false, omittedChecked: false, missingReports: false },
  manager: { verified: false, comments: "", hiddenDataFlag: false },
  scores: { kpiScore: 0, learningScore: 0, relationshipScore: 0, totalGrowthScore: 0 },
};

export default function App(){
  const isAdmin = typeof window !== 'undefined' && window.location.hash.includes('admin');
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 bg-white/85 backdrop-blur-md border-b z-20">
        <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://dummyimage.com/64x64/111/fff&text=BP" alt="Branding Pioneers" className="w-8 h-8 rounded"/>
            <div className="font-bold">Branding Pioneers • Codex</div>
          </div>
          <div className="text-xs md:text-sm text-gray-600">{isAdmin ? 'Manager Dashboard' : 'Employee Form'} • v1</div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4">
        {isAdmin ? <ManagerDashboard/> : <EmployeeForm/>}
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
    return drafts.find(x=>x.employee?.email==="__DRAFT__") || { ...EMPTY_SUBMISSION, employee: { ...EMPTY_SUBMISSION.employee, email: "__DRAFT__" } };
  });
  useEffect(()=>{ const all = Storage.load().filter(x=>x.id!==model.id); Storage.save([...all, model]); },[model]);

  const kpiScore = useMemo(()=>scoreKPIs(model.employee, model.clients), [model.employee, model.clients]);
  const learningScore = useMemo(()=>scoreLearning(model.learning), [model.learning]);
  const relationshipScore = useMemo(()=>scoreRelationship(model.relationship), [model.relationship]);
  const totalGrowthScore = round1(kpiScore + learningScore + relationshipScore);

  const flags = useMemo(()=>{
    const learningMins = (model.learning||[]).reduce((s,e)=>s+(e.durationMins||0),0);
    const missingLearningHours = learningMins < 360;
    const hasEscalations = (model.relationship?.escalations||[]).length>0;
    const omittedChecked = !!model.relationship?.omittedMetricsDeclared;
    const missingReports = (model.clients||[]).some(c=> (c.reports||[]).length===0);
    return { missingLearningHours, hasEscalations, omittedChecked, missingReports };
  },[model]);
  useEffect(()=>{ setModel(m=>({ ...m, flags, scores: { kpiScore, learningScore, relationshipScore, totalGrowthScore } })); },[kpiScore, learningScore, relationshipScore]);

  async function submitFinal(){
    const email = (document.getElementById('empEmail')?.value||"").trim();
    const name = (document.getElementById('empName')?.value||"").trim();
    if(!email || !/.+@.+/.test(email)) { alert('Please enter a valid email'); return; }
    if(!name) { alert('Please enter your name'); return; }
    const final = { ...model, id: uid(), employee: { ...model.employee, email, name } };

    // local backup
    const all = Storage.load().filter(x=>x.employee?.email!=="__DRAFT__");
    Storage.save([...all, final]);

    // supabase primary
    const record = {
      month_key: final.monthKey,
      employee_email: final.employee.email,
      employee_name: final.employee.name,
      department: final.employee.department,
      role: final.employee.role,
      payload: final,
      scores: final.scores,
      flags: final.flags,
    };
    const result = await saveSubmissionToSupabase(record);
    if(!result.ok){ console.warn("Supabase insert failed:", result.error); alert("Submitted locally. Supabase not configured or failed."); }
    else { alert("Submitted! You can review your summary below."); }

    setModel({ ...EMPTY_SUBMISSION, employee: { ...EMPTY_SUBMISSION.employee, email: "__DRAFT__" } });
  }

  return (
    <div>
      <Section title="1) Employee Details">
        <div className="grid md:grid-cols-3 gap-3">
          <div><label className="text-sm">Name</label><input id="empName" className="w-full border rounded-xl p-2" placeholder="Your name" defaultValue=""/></div>
          <div><label className="text-sm">Email</label><input id="empEmail" className="w-full border rounded-xl p-2" placeholder="name@company.com" defaultValue=""/></div>
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
        </div>
      </Section>

      <DeptClientsBlock model={model} setModel={setModel} />
      <LearningBlock model={model} setModel={setModel} />
      <RelationshipBlock model={model} setModel={setModel} />

      <Section title="5) AI Usage (Optional)">
        <textarea className="w-full border rounded-xl p-3" rows={4} placeholder="List specific ways you used AI to work faster/better this month. Include links or examples if possible." value={model.aiUsageNotes} onChange={e=>setModel(m=>({...m, aiUsageNotes: e.target.value}))}/>
      </Section>

      <Section title="Real-time Summary & Suggestions">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="bg-gray-900 text-white rounded-2xl p-4"><div className="text-sm opacity-80">KPI</div><div className="text-3xl font-semibold">{model.scores.kpiScore}/10</div></div>
          <div className="bg-gray-900 text-white rounded-2xl p-4"><div className="text-sm opacity-80">Learning</div><div className="text-3xl font-semibold">{model.scores.learningScore}/5</div></div>
          <div className="bg-gray-900 text-white rounded-2xl p-4"><div className="text-sm opacity-80">Relationship</div><div className="text-3xl font-semibold">{model.scores.relationshipScore}/5</div></div>
          <div className="bg-gray-900 text-white rounded-2xl p-4"><div className="text-sm opacity-80">Growth Score</div><div className="text-3xl font-semibold">{model.scores.totalGrowthScore}/20</div></div>
        </div>
        <div className="mt-3 text-sm">
          {model.flags.missingLearningHours && <Pill>⚠️ Learning below 6 hours</Pill>}
          {model.flags.hasEscalations && <Pill>⚠️ Escalations reported</Pill>}
          {model.flags.omittedChecked && <Pill>⚠️ Omitted metrics declared</Pill>}
          {model.flags.missingReports && <Pill>⚠️ Missing report uploads</Pill>}
        </div>
        <div className="mt-4 text-sm text-gray-600">Suggestions are auto-derived from the inputs. Aim for at least one client meeting per month, upload dashboards for transparency, ensure exactly 6 hours of focused learning, and document practical application.</div>
      </Section>

      <div className="flex items-center gap-3">
        <button onClick={submitFinal} className="bg-black text-white rounded-2xl px-5 py-3">Submit Monthly Report</button>
        <a href="#admin" className="text-sm underline">Manager dashboard</a>
      </div>
    </div>
  );
}

/************************
 * Clients & KPI Section *
 ************************/
function DeptClientsBlock({model, setModel}){
  const isInternal = ["HR","Accounts","Sales","Blended (HR + Sales)"].includes(model.employee.department);
  return (
    <Section title="2) KPIs & Reports">
      {isInternal ? (<InternalKPIs model={model} setModel={setModel} />) : (<ClientTable model={model} setModel={setModel} />)}
    </Section>
  );
}

// Spreadsheet-like client entry with an always-visible first row
function ClientTable({model, setModel}){
  const [draftRow, setDraftRow] = useState({ name:"", label:"", url:"" });
  function pushDraft(){
    if(!draftRow.name.trim()) return;
    const base = { id: uid(), name: draftRow.name.trim(), reports: [] };
    const withReport = (draftRow.label && draftRow.url)
      ? { ...base, reports:[{ id: uid(), label: draftRow.label.trim(), url: draftRow.url.trim() }] }
      : base;
    setModel(m=>({ ...m, clients:[...m.clients, withReport] }));
    setDraftRow({ name:"", label:"", url:"" });
  }
  return (
    <div>
      <div className="overflow-auto">
        <table className="w-full text-sm border-separate" style={{borderSpacing:0}}>
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2 border">Client</th>
              <th className="text-left p-2 border">Evidence Label</th>
              <th className="text-left p-2 border">Evidence URL</th>
              <th className="text-left p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {model.clients.map(c=> (
              <tr key={c.id} className="odd:bg-white even:bg-gray-50">
                <td className="p-2 border font-medium">{c.name}</td>
                <td className="p-2 border" colSpan={2}>
                  <TinyLinks
                    items={c.reports||[]}
                    onAdd={(r)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?{...x, reports:[...(x.reports||[]), r]}:x)}))}
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
                <input className="w-full border rounded-lg p-2" placeholder="Evidence label (Dashboard, Report…)" value={draftRow.label} onChange={e=>setDraftRow(d=>({...d, label:e.target.value}))} />
              </td>
              <td className="p-2 border">
                <input className="w-full border rounded-lg p-2" placeholder="Evidence URL" value={draftRow.url} onChange={e=>setDraftRow(d=>({...d, url:e.target.value}))} />
              </td>
              <td className="p-2 border">
                <button className="px-3 py-2 rounded-lg bg-gray-900 text-white" onClick={pushDraft}>Add Client</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {model.clients.length===0 && (
        <div className="text-sm text-gray-600 mt-2">Start by typing a client name in the first row, optionally add a dashboard/report link, then hit <b>Add Client</b>. KPIs for that client will appear below.</div>
      )}

      {model.clients.map(c=> (
        <div key={c.id} className="border rounded-2xl p-4 my-4 bg-white">
          <div className="font-semibold mb-2">KPIs • {c.name}</div>
          {model.employee.department === 'Web' && (
            <KPIsWeb
              client={c}
              onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))}
            />
          )}
          {model.employee.department === 'Social Media' && (
            <KPIsSocial
              client={c}
              role={model.employee.role}
              onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))}
            />
          )}
          {model.employee.department === 'Ads' && (
            <KPIsAds
              client={c}
              onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))}
            />
          )}
          {model.employee.department === 'SEO' && (
            <KPIsSEO
              client={c}
              onChange={(cc)=>setModel(m=>({...m, clients: m.clients.map(x=>x.id===c.id?cc:x)}))}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/*********************
 * KPI Block Widgets  *
 *********************/
function KPIsWeb({client, onChange}){
  const [urls, setUrls] = useState("");
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      <NumField label="# Pages Delivered" value={client.web_pagesDelivered||0} onChange={v=>onChange({...client, web_pagesDelivered:v})}/>
      <NumField label="On-time Delivery %" value={client.web_onTimePct||0} onChange={v=>onChange({...client, web_onTimePct:v})}/>
      <NumField label="Bugs Fixed" value={client.web_bugsFixed||0} onChange={v=>onChange({...client, web_bugsFixed:v})}/>
      <div>
        <label className="text-sm">Page URLs (comma-separated)</label>
        <input className="w-full border rounded-xl p-2" placeholder="https://... , https://..." value={urls} onChange={e=>setUrls(e.target.value)} onBlur={()=>{ const list = urls.split(',').map(s=>s.trim()).filter(Boolean); onChange({...client, web_urls:list}); }}/>
      </div>
      <p className="md:col-span-4 text-xs text-gray-600">Auto-review (CRO/design) is planned in a later iteration.</p>
    </div>
  );
}
function KPIsSocial({client, onChange, role}){
  const isDesigner = role?.includes('Designer');
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      {!isDesigner && <NumField label="Follower Growth (net)" value={client.sm_followersDelta||0} onChange={v=>onChange({...client, sm_followersDelta:v})}/>}
      {!isDesigner && <NumField label="Monthly Reach" value={client.sm_reach||0} onChange={v=>onChange({...client, sm_reach:v})}/>}
      {!isDesigner && <NumField label="Engagement Rate %" value={client.sm_engagementRate||0} onChange={v=>onChange({...client, sm_engagementRate:v})}/>}
      {!isDesigner && <NumField label="# Campaigns Run" value={client.sm_campaigns||0} onChange={v=>onChange({...client, sm_campaigns:v})}/>}
      {isDesigner && <NumField label="# Creatives Delivered" value={client.sm_creativesCount||0} onChange={v=>onChange({...client, sm_creativesCount:v})}/>}
      <p className="md:col-span-4 text-xs text-gray-600">Upload sample links in Reports. Designers may also attach Figma/Drive links.</p>
    </div>
  );
}
function KPIsAds({client, onChange}){
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      <NumField label="# New Ads Created" value={client.ads_newAds||0} onChange={v=>onChange({...client, ads_newAds:v})}/>
      <NumField label="CTR % (avg)" value={client.ads_ctr||0} onChange={v=>onChange({...client, ads_ctr:v})}/>
      <NumField label="CPL (avg)" value={client.ads_cpl||0} onChange={v=>onChange({...client, ads_cpl:v})}/>
      <NumField label="Leads Generated" value={client.ads_leads||0} onChange={v=>onChange({...client, ads_leads:v})}/>
      <p className="md:col-span-4 text-xs text-gray-600">Add landing page links for quality review in Reports.</p>
    </div>
  );
}
function KPIsSEO({client, onChange}){
  const [kw, setKw] = useState(client.seo_keywordsWorked||[]);
  useEffect(()=>{ onChange({...client, seo_keywordsWorked: kw}); },[kw]);
  const addKw = ()=>{ const keyword = prompt('Keyword?'); if(!keyword) return; const searchVolume = Number(prompt('Search volume?')||0); const rankNow = Number(prompt('Current rank (optional)?')||0); const rankPrev = Number(prompt('Prev rank (optional)?')||0); setKw(list=>[...list, { keyword, searchVolume, rankNow, rankPrev }]); };
  return (
    <div className="grid md:grid-cols-4 gap-3 mt-3">
      <NumField label="Organic Traffic Δ % (avg)" value={client.seo_trafficDeltaPct||0} onChange={v=>onChange({...client, seo_trafficDeltaPct:v})}/>
      <NumField label="# Keywords Improved" value={client.seo_rankImprovedKeywords||0} onChange={v=>onChange({...client, seo_rankImprovedKeywords:v})}/>
      <NumField label="# AI Overviews / LLM" value={client.seo_aiOverviewCount||0} onChange={v=>onChange({...client, seo_aiOverviewCount:v})}/>
      <div>
        <label className="text-sm">Keywords Worked</label><br/>
        <button className="text-xs px-2 py-1 bg-gray-900 text-white rounded-lg" onClick={addKw}>+ Add Keyword</button>
        <div className="mt-2 space-y-1">
          {kw.map((k,i)=> (
            <div key={i} className="text-xs flex items-center justify-between border rounded-lg p-2">
              <div className="truncate"><b>{k.keyword}</b> • SV {k.searchVolume} • Rank {k.rankPrev||"-"}→{k.rankNow||"-"}</div>
              <button className="text-red-600" onClick={()=>setKw(list=>list.filter((_,idx)=>idx!==i))}>Remove</button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-1">We capture search volume to prevent low-value keyword gaming.</p>
      </div>
    </div>
  );
}

/*****************
 * Internal KPIs  *
 *****************/
function InternalKPIs({model, setModel}){
  const c = model.clients[0] || { id: uid(), name: "Internal", reports: [] };
  function setC(next){ const exists = model.clients[0]; if(exists){ setModel(m=>({...m, clients:[next]})); } else { setModel(m=>({...m, clients:[next]})); } }
  if(model.employee.department === 'HR' || model.employee.department === 'Blended (HR + Sales)'){
    return (
      <div className="grid md:grid-cols-4 gap-3">
        <NumField label="Hires Completed" value={c.hr_hires||0} onChange={v=>setC({ ...c, hr_hires:v })}/>
        <NumField label="Process Completion %" value={c.hr_processDonePct||0} onChange={v=>setC({ ...c, hr_processDonePct:v })}/>
        {model.employee.department === 'HR' && (<NumField label="Retention %" value={c.hr_retentionPct||0} onChange={v=>setC({ ...c, hr_retentionPct:v })}/>)}
        {model.employee.department === 'Blended (HR + Sales)' && (
          <>
            <div className="md:col-span-4 text-sm font-medium mt-2">Sales (20%)</div>
            <NumField label="Revenue Closed (₹)" value={(model.clients[1]?.sa_revenue)||0} onChange={v=>{ const s = model.clients[1] || { id: uid(), name: 'Sales', reports: [] }; setModel(m=>({...m, clients: [ { ...c }, { ...s, sa_revenue: v } ] })); }}/>
            <NumField label="Conversion Rate %" value={(model.clients[1]?.sa_conversionRate)||0} onChange={v=>{ const s = model.clients[1] || { id: uid(), name: 'Sales', reports: [] }; setModel(m=>({...m, clients: [ { ...c }, { ...s, sa_conversionRate: v } ] })); }}/>
          </>
        )}
      </div>
    );
  }
  if(model.employee.department === 'Accounts'){
    return (
      <div className="grid md:grid-cols-4 gap-3">
        <NumField label="Collections % (received/receivable)" value={c.ac_collectionsPct||0} onChange={v=>setC({ ...c, ac_collectionsPct:v })}/>
        <NumField label="Compliance % (GST/TDS/recon)" value={c.ac_compliancePct||0} onChange={v=>setC({ ...c, ac_compliancePct:v })}/>
        <NumField label="Onboarding On-time %" value={c.ac_onboardingOnTimePct||0} onChange={v=>setC({ ...c, ac_onboardingOnTimePct:v })}/>
      </div>
    );
  }
  if(model.employee.department === 'Sales'){
    return (
      <div className="grid md:grid-cols-4 gap-3">
        <NumField label="Revenue Closed (₹)" value={c.sa_revenue||0} onChange={v=>setC({ ...c, sa_revenue:v })}/>
        <NumField label="# Leads in Pipeline" value={c.sa_pipeline||0} onChange={v=>setC({ ...c, sa_pipeline:v })}/>
        <NumField label="Conversion Rate %" value={c.sa_conversionRate||0} onChange={v=>setC({ ...c, sa_conversionRate:v })}/>
        <NumField label="AI Upsell Value (₹)" value={c.sa_aiUpsellValue||0} onChange={v=>setC({ ...c, sa_aiUpsellValue:v })}/>
      </div>
    );
  }
  return null;
}

/*****************
 * Learning Block *
 *****************/
function LearningBlock({model, setModel}){
  function addEntry(){ setModel(m=>({...m, learning:[...m.learning, { id: uid(), title:"", link:"", durationMins:0, whatLearned:"", howApplied:"", proofLinks:[] }]})); }
  function update(i, entry){ setModel(m=>({...m, learning: m.learning.map((x,idx)=> idx===i?entry:x)})); }
  return (
    <Section title="3) Learning (6 hours required; multiple entries allowed)">
      <button className="text-sm px-3 py-2 bg-gray-900 text-white rounded-xl mb-3" onClick={addEntry}>+ Add Learning Entry</button>
      {model.learning.length===0 && <div className="text-sm text-gray-600">Add videos/courses/articles with duration; include what you learned and how you applied it. Exactly six hours per month is ideal.</div>}
      <div className="space-y-3">
        {model.learning.map((e, idx)=> (
          <div key={e.id} className="border rounded-2xl p-3">
            <div className="grid md:grid-cols-3 gap-3">
              <TextField label="Title" value={e.title} onChange={v=>update(idx,{...e, title:v})}/>
              <TextField label="Link" value={e.link} onChange={v=>update(idx,{...e, link:v})}/>
              <NumField label="Duration (mins)" value={e.durationMins} onChange={v=>update(idx,{...e, durationMins:v})}/>
              <TextArea label="What did you learn?" value={e.whatLearned} onChange={v=>update(idx,{...e, whatLearned:v})}/>
              <TextArea label="How did you apply it?" value={e.howApplied} onChange={v=>update(idx,{...e, howApplied:v})}/>
            </div>
            <TinyLinks items={e.proofLinks} onAdd={(r)=>update(idx,{...e, proofLinks:[...e.proofLinks, r]})} onRemove={(id)=>update(idx,{...e, proofLinks:e.proofLinks.filter(x=>x.id!==id)})} />
          </div>
        ))}
      </div>
      <div className="mt-2 text-sm text-gray-600">If I quiz you on this, would you be able to answer? (Short quizzes coming soon.)</div>
    </Section>
  );
}

/**************************
 * Relationship + Meetings *
 **************************/
function RelationshipBlock({model, setModel}){
  const r = model.relationship;
  function addMeeting(){ setModel(m=>({...m, relationship: { ...m.relationship, meetings:[...m.relationship.meetings, { id: uid(), date: new Date().toISOString().slice(0,10), mode: 'Virtual', notesLink: '' }] }})); }
  function addEsc(){ setModel(m=>({...m, relationship: { ...m.relationship, escalations:[...m.relationship.escalations, { id: uid(), description:'', proofLinks:[] }] }})); }
  function updMeet(i, val){ setModel(m=>({...m, relationship:{...m.relationship, meetings: m.relationship.meetings.map((x,idx)=> idx===i?val:x)}})); }
  function updEsc(i, val){ setModel(m=>({...m, relationship:{...m.relationship, escalations: m.relationship.escalations.map((x,idx)=> idx===i?val:x)}})); }
  return (
    <Section title="4) Relationship (Meetings, Appreciations, Escalations)">
      <div className="mb-2 text-sm text-gray-600">Add meeting notes links (from your note-taker/recorder). Upload WhatsApp appreciation screenshots as links.</div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2"><div className="font-medium">Meetings</div><button className="text-xs px-2 py-1 bg-gray-900 text-white rounded-lg" onClick={addMeeting}>+ Add</button></div>
          <div className="space-y-2">
            {r.meetings.map((m,i)=> (
              <div key={m.id} className="grid md:grid-cols-4 gap-2 items-center">
                <input type="date" className="border rounded-xl p-2" value={m.date} onChange={e=>updMeet(i,{...m, date:e.target.value})}/>
                <select className="border rounded-xl p-2" value={m.mode} onChange={e=>updMeet(i,{...m, mode:e.target.value})}><option>Virtual</option><option>Physical</option></select>
                <input className="border rounded-xl p-2 md:col-span-2" placeholder="Notes/Recording Link" value={m.notesLink} onChange={e=>updMeet(i,{...m, notesLink:e.target.value})}/>
              </div>
            ))}
          </div>
        </div>
        <div className="border rounded-2xl p-3">
          <div className="font-medium mb-2">Appreciations</div>
          <TinyLinks items={r.appreciations} onAdd={(x)=>setModel(m=>({...m, relationship:{...m.relationship, appreciations:[...m.relationship.appreciations, x]}}))} onRemove={(id)=>setModel(m=>({...m, relationship:{...m.relationship, appreciations:m.relationship.appreciations.filter(a=>a.id!==id)}}))} />
        </div>
      </div>
      <div className="border rounded-2xl p-3 mt-3">
        <div className="flex items-center justify-between mb-2"><div className="font-medium">Escalations</div><button className="text-xs px-2 py-1 bg-gray-900 text-white rounded-lg" onClick={addEsc}>+ Add</button></div>
        <div className="space-y-2">
          {r.escalations.map((e,i)=> (
            <div key={e.id} className="space-y-2">
              <textarea className="w-full border rounded-xl p-2" rows={2} placeholder="What happened and why?" value={e.description} onChange={ev=>updEsc(i,{...e, description: ev.target.value})}/>
              <TinyLinks items={e.proofLinks} onAdd={(x)=>updEsc(i,{...e, proofLinks:[...e.proofLinks, x]})} onRemove={(id)=>updEsc(i,{...e, proofLinks:e.proofLinks.filter(p=>p.id!==id)})} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2"><input id="omit" type="checkbox" className="scale-110" checked={r.omittedMetricsDeclared} onChange={e=>setModel(m=>({...m, relationship:{...m.relationship, omittedMetricsDeclared:e.target.checked}}))} /><label htmlFor="omit" className="text-sm">I omitted key metrics from the client-facing report (internal disclosure).</label></div>
    </Section>
  );
}

/****************
 * Manager View *
 ****************/
function ManagerDashboard(){
  const [gateOK, setGateOK] = useState(!ADMIN_TOKEN);
  useEffect(()=>{
    if(!ADMIN_TOKEN) return; const cached = sessionStorage.getItem('codex-admin-token-ok'); if(cached==='1'){ setGateOK(true); return; }
    const input = prompt('Enter admin access token'); if(input && input===ADMIN_TOKEN){ sessionStorage.setItem('codex-admin-token-ok','1'); setGateOK(true); } else { alert('Invalid token. Reload page to retry.'); }
  },[]);

  const [items, setItems] = useState([]);
  const [month, setMonth] = useState(thisMonthKey());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh(){
    setLoading(true); setError("");
    const supa = await listSubmissionsFromSupabase(month);
    if(supa.ok){ setItems(supa.data); setLoading(false); return; }
    const local = Storage.load().filter(x=>x.employee?.email!=="__DRAFT__" && x.monthKey===month);
    setItems(local.map(s=>({ id:s.id, month_key:s.monthKey, employee_email:s.employee.email, employee_name:s.employee.name, department:s.employee.department, role:s.employee.role, payload:s, scores:s.scores, flags:s.flags, created_at:new Date().toISOString() })));
    setError(supa.error? String(supa.error.message||supa.error): 'Supabase not configured; showing local data');
    setLoading(false);
  }
  useEffect(()=>{ refresh(); },[]);
  useEffect(()=>{ refresh(); },[month]);

  function exportJson(){ const data = JSON.stringify(items, null, 2); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `codex-${month}.json`; a.click(); URL.revokeObjectURL(url); }

  if(!gateOK) return <div className="text-center p-8">Waiting for valid admin token…</div>;

  const monthList = Array.from(new Set([thisMonthKey(), ...Storage.load().map(s=>s.monthKey)])).sort();

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <select className="border rounded-xl p-2" value={month} onChange={e=>setMonth(e.target.value)}>
          {monthList.map(m=> <option key={m}>{m}</option>)}
        </select>
        <button onClick={refresh} className="px-3 py-2 bg-gray-900 text-white rounded-xl text-sm">Refresh</button>
        <button onClick={exportJson} className="px-3 py-2 bg-gray-900 text-white rounded-xl text-sm">Export JSON</button>
        <a href="#" className="text-sm underline">Back to form</a>
      </div>
      {loading && <div className="text-sm text-gray-600">Loading…</div>}
      {error && <div className="text-sm text-amber-700">{error}</div>}
      <div className="grid gap-3">
        {!loading && items.length===0 && <div className="text-sm text-gray-600">No submissions for this month yet.</div>}
        {items.map(s=> {
          const payload = s.payload || {}; const flags = s.flags || payload.flags || {}; const scores = s.scores || payload.scores || { kpiScore:0, learningScore:0, relationshipScore:0, totalGrowthScore:0 }; const employee = payload.employee || { name: s.employee_name, department: s.department, role: s.role, email: s.employee_email }; const relMeetings = (payload.relationship?.meetings||[]).length;
          return (
            <div key={s.id} className="bg-white border rounded-2xl p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">{employee.name?.[0]||'U'}</div>
                  <div>
                    <div className="font-semibold">{employee.name} • {employee.department} ({employee.role})</div>
                    <div className="text-xs text-gray-500">{employee.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-2 py-1 rounded-full bg-gray-900 text-white">{scores.totalGrowthScore}/20</span>
                  {flags.missingLearningHours && <Pill>Learning &lt; 6h</Pill>}
                  {flags.hasEscalations && <Pill>Escalations</Pill>}
                  {flags.omittedChecked && <Pill>Omitted metrics</Pill>}
                  {flags.missingReports && <Pill>Missing reports</Pill>}
                </div>
              </div>
              <div className="mt-2 grid md:grid-cols-4 gap-2 text-sm">
                <div>KPI: <b>{scores.kpiScore}/10</b></div>
                <div>Learning: <b>{scores.learningScore}/5</b></div>
                <div>Relationship: <b>{scores.relationshipScore}/5</b></div>
                <div>Meetings: <b>{relMeetings}</b></div>
              </div>
              <div className="mt-2 text-sm text-gray-600">AI usage: {payload.aiUsageNotes || '—'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
