import{s as m,j as i}from"./manager-dashboard-BkEir6jh.js";import{r as c}from"./react-vendor-z5qVsTvS.js";import"./auth-vNnhMft6.js";class b{constructor(){this.cache=new Map,this.cacheTimeout=5*60*1e3}async getWorkspaceConfig(e,a){const r=`workspace_${e}_${a}`,n=this.cache.get(r);if(n&&Date.now()-n.timestamp<this.cacheTimeout)return n.data;try{const o=await this.generateWorkspaceConfig(e,a);return this.cache.set(r,{data:o,timestamp:Date.now()}),o}catch(o){return console.error("Error fetching workspace config:",o),this.getFallbackConfig(e)}}async generateWorkspaceConfig(e,a){const r={clientTracker:{title:"Client Tracker",description:"Track client projects and status",type:"internal",path:"/client-directory",icon:"👥",permissions:["read"]},projectManagement:{title:"Project Management",description:"Manage ongoing projects",type:"internal",path:"/projects",icon:"📋",permissions:["read","write"]}};switch(e){case"Super Admin":return{...r,adminPanel:{title:"Admin Panel",description:"System administration",type:"internal",path:"/admin",icon:"⚙️",permissions:["read","write","delete"]},userManagement:{title:"User Management",description:"Manage system users",type:"internal",path:"/user-management",icon:"👤",permissions:["read","write","delete"]},systemReports:{title:"System Reports",description:"View system analytics",type:"internal",path:"/reports",icon:"📊",permissions:["read"]},databaseAccess:{title:"Database Access",description:"Direct database management",type:"external",url:"https://supabase.com/dashboard",icon:"🗄️",permissions:["read","write"]}};case"Operations Head":return{...r,operationsDashboard:{title:"Operations Dashboard",description:"Monitor operations metrics",type:"internal",path:"/operations-dashboard",icon:"📈",permissions:["read","write"]},teamManagement:{title:"Team Management",description:"Manage team assignments",type:"internal",path:"/team-management",icon:"👥",permissions:["read","write"]},performanceReports:{title:"Performance Reports",description:"View team performance",type:"internal",path:"/performance-reports",icon:"📊",permissions:["read"]}};case"HR":return{...r,hrDashboard:{title:"HR Dashboard",description:"Human resources management",type:"internal",path:"/hr-dashboard",icon:"👨‍💼",permissions:["read","write"]},employeeRecords:{title:"Employee Records",description:"Manage employee information",type:"internal",path:"/employee-records",icon:"📁",permissions:["read","write"]},recruitmentPortal:{title:"Recruitment Portal",description:"Manage hiring process",type:"internal",path:"/recruitment",icon:"🎯",permissions:["read","write"]}};case"Manager":return{...r,teamDashboard:{title:"Team Dashboard",description:"Monitor team progress",type:"internal",path:"/team-dashboard",icon:"👥",permissions:["read","write"]},projectReviews:{title:"Project Reviews",description:"Review team submissions",type:"internal",path:"/project-reviews",icon:"✅",permissions:["read","write"]}};case"SEO":return{...r,seoTools:{title:"SEO Tools",description:"SEO analysis and tracking",type:"external",url:"https://ahrefs.com",icon:"🔍",permissions:["read"]},keywordTracker:{title:"Keyword Tracker",description:"Track keyword rankings",type:"internal",path:"/seo-dashboard",icon:"📈",permissions:["read","write"]},contentPlanner:{title:"Content Planner",description:"Plan SEO content",type:"internal",path:"/content-planner",icon:"📝",permissions:["read","write"]}};case"Ads":return{...r,adsPlatforms:{title:"Ads Platforms",description:"Manage advertising campaigns",type:"external",url:"https://ads.google.com",icon:"🎯",permissions:["read","write"]},campaignTracker:{title:"Campaign Tracker",description:"Track ad performance",type:"internal",path:"/ads-dashboard",icon:"📊",permissions:["read","write"]},budgetManager:{title:"Budget Manager",description:"Manage ad budgets",type:"internal",path:"/budget-manager",icon:"💰",permissions:["read","write"]}};case"Social Media":return{...r,socialPlatforms:{title:"Social Platforms",description:"Manage social media accounts",type:"external",url:"https://business.facebook.com",icon:"📱",permissions:["read","write"]},contentCalendar:{title:"Content Calendar",description:"Plan social media content",type:"internal",path:"/social-dashboard",icon:"📅",permissions:["read","write"]},analyticsHub:{title:"Analytics Hub",description:"Social media analytics",type:"internal",path:"/social-analytics",icon:"📈",permissions:["read"]}};case"Web Developer":return{...r,codeRepository:{title:"Code Repository",description:"Access code repositories",type:"external",url:"https://github.com",icon:"💻",permissions:["read","write"]},deploymentTools:{title:"Deployment Tools",description:"Manage deployments",type:"external",url:"https://vercel.com",icon:"🚀",permissions:["read","write"]},devDashboard:{title:"Dev Dashboard",description:"Development metrics",type:"internal",path:"/dev-dashboard",icon:"⚡",permissions:["read","write"]}};case"Graphic Designer":return{...r,designTools:{title:"Design Tools",description:"Access design software",type:"external",url:"https://figma.com",icon:"🎨",permissions:["read","write"]},assetLibrary:{title:"Asset Library",description:"Manage design assets",type:"internal",path:"/design-assets",icon:"🖼️",permissions:["read","write"]},designDashboard:{title:"Design Dashboard",description:"Track design projects",type:"internal",path:"/design-dashboard",icon:"📐",permissions:["read","write"]}};case"Freelancer":return{projectAssignments:{title:"Project Assignments",description:"View assigned projects",type:"internal",path:"/freelancer-projects",icon:"📋",permissions:["read"]},timeTracker:{title:"Time Tracker",description:"Track work hours",type:"internal",path:"/time-tracker",icon:"⏰",permissions:["read","write"]},invoicePortal:{title:"Invoice Portal",description:"Manage invoices",type:"internal",path:"/invoices",icon:"💰",permissions:["read","write"]}};case"Intern":return{learningPath:{title:"Learning Path",description:"Track learning progress",type:"internal",path:"/intern-dashboard",icon:"📚",permissions:["read","write"]},mentorConnect:{title:"Mentor Connect",description:"Connect with mentors",type:"internal",path:"/mentor-connect",icon:"👨‍🏫",permissions:["read"]},skillAssessment:{title:"Skill Assessment",description:"Take skill assessments",type:"internal",path:"/skill-assessment",icon:"🎯",permissions:["read","write"]}};default:return r}}getFallbackConfig(e){return{dashboard:{title:"Dashboard",description:"Your personal dashboard",type:"internal",path:"/dashboard",icon:"📊",permissions:["read"]},profile:{title:"Profile",description:"Manage your profile",type:"internal",path:"/profile",icon:"👤",permissions:["read","write"]}}}hasPermission(e,a){return e.permissions&&e.permissions.includes(a)}async getWorkspaceAnalytics(e){try{const{data:a,error:r}=await m.from("workspace_usage").select("*").eq("user_id",e).order("accessed_at",{ascending:!1}).limit(10);if(r)throw r;return a||[]}catch(a){return console.error("Error fetching workspace analytics:",a),[]}}async trackWorkspaceAccess(e,a,r){try{const{error:n}=await m.from("workspace_usage").insert({user_id:e,workspace_name:a,workspace_type:r,accessed_at:new Date().toISOString()});if(n)throw n}catch(n){console.error("Error tracking workspace access:",n)}}clearCache(){this.cache.clear()}}const de=new b;/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w=s=>s.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),v=s=>s.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,a,r)=>r?r.toUpperCase():a.toLowerCase()),g=s=>{const e=v(s);return e.charAt(0).toUpperCase()+e.slice(1)},u=(...s)=>s.filter((e,a,r)=>!!e&&e.trim()!==""&&r.indexOf(e)===a).join(" ").trim(),x=s=>{for(const e in s)if(e.startsWith("aria-")||e==="role"||e==="title")return!0};/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var M={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=c.forwardRef(({color:s="currentColor",size:e=24,strokeWidth:a=2,absoluteStrokeWidth:r,className:n="",children:o,iconNode:h,...d},y)=>c.createElement("svg",{ref:y,...M,width:e,height:e,stroke:s,strokeWidth:r?Number(a)*24/Number(e):a,className:u("lucide",n),...!o&&!x(d)&&{"aria-hidden":"true"},...d},[...h.map(([p,l])=>c.createElement(p,l)),...Array.isArray(o)?o:[o]]));/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const t=(s,e)=>{const a=c.forwardRef(({className:r,...n},o)=>c.createElement(_,{ref:o,iconNode:e,className:u(`lucide-${w(g(s))}`,`lucide-${s}`,r),...n}));return a.displayName=g(s),a};/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=[["path",{d:"m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",key:"1yiouv"}],["circle",{cx:"12",cy:"8",r:"6",key:"1vp47v"}]],pe=t("award",$);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",key:"11g9vi"}]],le=t("bell",C);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=[["path",{d:"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",key:"jecpp"}],["rect",{width:"20",height:"14",x:"2",y:"6",rx:"2",key:"i6l2r4"}]],he=t("briefcase",N);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]],ye=t("calendar",A);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]],me=t("circle-alert",j);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],ge=t("circle-check-big",T);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]],ue=t("circle-x",P);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=[["path",{d:"M12 6v6l4 2",key:"mmk7yg"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]],ke=t("clock",S);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=[["path",{d:"M12 15V3",key:"m9g1x1"}],["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["path",{d:"m7 10 5 5 5-5",key:"brsn70"}]],fe=t("download",D);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],be=t("eye-off",H);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],we=t("eye",q);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]],ve=t("file-text",z);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=[["path",{d:"M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z",key:"sc7q7i"}]],xe=t("funnel",L);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]],Me=t("globe",R);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]],_e=t("info",E);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]],$e=t("lock",V);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O=[["path",{d:"m16 17 5-5-5-5",key:"1bji2h"}],["path",{d:"M21 12H9",key:"dn1m92"}],["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}]],Ce=t("log-out",O);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=[["path",{d:"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",key:"132q7q"}],["rect",{x:"2",y:"4",width:"20",height:"16",rx:"2",key:"izxlao"}]],Ne=t("mail",B);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const W=[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]],Ae=t("map-pin",W);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=[["path",{d:"M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z",key:"18887p"}]],je=t("message-square",I);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=[["path",{d:"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",key:"9njp5v"}]],Te=t("phone",U);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]],Pe=t("plus",F);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G=[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]],Se=t("refresh-cw",G);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K=[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]],De=t("save",K);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z=[["path",{d:"m21 21-4.34-4.34",key:"14j7rj"}],["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}]],He=t("search",Z);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const X=[["path",{d:"M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",key:"1i5ecw"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],qe=t("settings",X);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Y=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]],ze=t("shield",Y);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const J=[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",key:"ohrbg2"}]],Le=t("square-pen",J);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]],Re=t("target",Q);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ee=[["path",{d:"M16 7h6v6",key:"box55l"}],["path",{d:"m22 7-8.5 8.5-5-5L2 17",key:"1t1m79"}]],Ee=t("trending-up",ee);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const te=[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]],Ve=t("triangle-alert",te);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ae=[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]],Oe=t("user",ae);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const re=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744",key:"16gr8j"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]],Be=t("users",re);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const se=[["path",{d:"m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",key:"ftymec"}],["rect",{x:"2",y:"6",width:"14",height:"12",rx:"2",key:"158x01"}]],We=t("video",se);/**
 * @license lucide-react v0.541.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ne=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],Ie=t("x",ne),Ue=({children:s,className:e="",...a})=>i.jsx("div",{className:`rounded-lg border bg-white text-gray-950 shadow-sm ${e}`,...a,children:s}),Fe=({children:s,className:e="",...a})=>i.jsx("div",{className:`flex flex-col space-y-1.5 p-6 ${e}`,...a,children:s}),Ge=({children:s,className:e="",...a})=>i.jsx("h3",{className:`text-2xl font-semibold leading-none tracking-tight ${e}`,...a,children:s}),Ke=({children:s,className:e="",...a})=>i.jsx("div",{className:`p-6 pt-0 ${e}`,...a,children:s}),Ze=({children:s,className:e="",onClick:a,disabled:r=!1,type:n="button",variant:o="default",size:h="default",...d})=>{const y="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",p={default:"bg-blue-600 text-white hover:bg-blue-700",destructive:"bg-red-600 text-white hover:bg-red-700",outline:"border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900",secondary:"bg-gray-100 text-gray-900 hover:bg-gray-200",ghost:"hover:bg-gray-100 hover:text-gray-900",link:"text-blue-600 underline-offset-4 hover:underline"},l={default:"h-10 px-4 py-2",sm:"h-9 rounded-md px-3",lg:"h-11 rounded-md px-8",icon:"h-10 w-10"},k=p[o]||p.default,f=l[h]||l.default;return i.jsx("button",{className:`${y} ${k} ${f} ${e}`,onClick:a,disabled:r,type:n,...d,children:s})},Xe=({children:s,className:e="",variant:a="default",...r})=>{const n={default:"bg-blue-100 text-blue-800",secondary:"bg-gray-100 text-gray-800",destructive:"bg-red-100 text-red-800",outline:"border border-gray-200 text-gray-700"},o=n[a]||n.default;return i.jsx("div",{className:`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${o} ${e}`,...r,children:s})};export{pe as A,le as B,me as C,fe as D,be as E,xe as F,Me as G,_e as I,$e as L,Ne as M,Te as P,Se as R,qe as S,Ee as T,Oe as U,We as V,Ie as X,ge as a,ze as b,Ae as c,he as d,ye as e,De as f,we as g,ke as h,Ce as i,Be as j,Pe as k,Re as l,Ze as m,Ue as n,Fe as o,Ge as p,Ke as q,je as r,Xe as s,ve as t,Ve as u,ue as v,de as w,Le as x,He as y};
