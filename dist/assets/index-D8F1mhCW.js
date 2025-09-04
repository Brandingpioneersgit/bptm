import{j as u,a7 as m}from"./manager-dashboard-BSBEKJka.js";import{R as N,r as f}from"./react-vendor-z5qVsTvS.js";const H=N.forwardRef(({className:r="",...e},t)=>u.jsx("textarea",{className:`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${r}`,ref:t,...e}));H.displayName="Textarea";const z=N.forwardRef(({className:r="",...e},t)=>u.jsx("label",{ref:t,className:`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${r}`,...e}));z.displayName="Label";const C=f.createContext(),je=({children:r,open:e,onOpenChange:t})=>u.jsx(C.Provider,{value:{open:e,onOpenChange:t},children:r}),Oe=({children:r,className:e="",...t})=>{const{open:o,onOpenChange:a}=f.useContext(C);return o?u.jsxs("div",{className:"fixed inset-0 z-50 flex items-center justify-center",children:[u.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50",onClick:()=>a(!1)}),u.jsxs("div",{className:`relative bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4 ${e}`,...t,children:[u.jsx("button",{className:"absolute top-4 right-4 text-gray-400 hover:text-gray-600",onClick:()=>a(!1),children:u.jsx("svg",{className:"w-6 h-6",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:u.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})}),r]})]}):null},Te=({children:r,className:e="",...t})=>u.jsx("div",{className:`flex flex-col space-y-1.5 text-center sm:text-left ${e}`,...t,children:r}),De=({children:r,className:e="",...t})=>u.jsx("h2",{className:`text-lg font-semibold leading-none tracking-tight ${e}`,...t,children:r}),Ne=({children:r,className:e="",...t})=>u.jsx("div",{className:"relative w-full overflow-auto",children:u.jsx("table",{className:`w-full caption-bottom text-sm ${e}`,...t,children:r})}),Ce=({children:r,className:e="",...t})=>u.jsx("thead",{className:`[&_tr]:border-b ${e}`,...t,children:r}),Fe=({children:r,className:e="",...t})=>u.jsx("tbody",{className:`[&_tr:last-child]:border-0 ${e}`,...t,children:r}),Ie=({children:r,className:e="",...t})=>u.jsx("tr",{className:`border-b transition-colors hover:bg-gray-100/50 data-[state=selected]:bg-gray-100 ${e}`,...t,children:r}),Ae=({children:r,className:e="",...t})=>u.jsx("th",{className:`h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0 ${e}`,...t,children:r}),Ge=({children:r,className:e="",...t})=>u.jsx("td",{className:`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${e}`,...t,children:r});class Q{constructor(){this.config=null}async loadConfig(){if(this.config)return this.config;const{data:e,error:t}=await m.from("seo_config").select("config_key, config_value");if(t)throw new Error(`Failed to load SEO config: ${t.message}`);return this.config={},e.forEach(o=>{this.config[o.config_key]=o.config_value}),this.config}async calculateMonthScore(e,t,o=[]){await this.loadConfig();const a={trafficImpact:this.calculateTrafficImpact(e),rankings:this.calculateRankings(e,t),technicalHealth:this.calculateTechnicalHealth(e),deliveryScope:this.calculateDeliveryScope(e,t),relationshipQuality:this.calculateRelationshipQuality(e)};let s=a.trafficImpact.points+a.rankings.points+a.technicalHealth.points+a.deliveryScope.points+a.relationshipQuality.points;const n=this.calculatePenalties(e,t,o);return s=Math.max(0,s-n.total),{totalScore:Math.round(s*100)/100,breakdown:a,penalties:n,maxScore:100}}calculateTrafficImpact(e){const t=this.calculateGrowthPercentage(e.gsc_organic_prev_30d,e.gsc_organic_curr_30d),o=this.calculateGrowthPercentage(e.ga_total_prev_30d,e.ga_total_curr_30d),a=this.mapGrowthToPoints(t,{30:20,15:16,5:12,0:8,[-10]:4,[-1/0]:0}),s=this.mapGrowthToPoints(o,{30:15,15:12,5:9,0:6,[-10]:3,[-1/0]:0});return{points:a+s,maxPoints:35,details:{organicGrowth:{percentage:t,points:a},totalTrafficGrowth:{percentage:o,points:s}}}}calculateRankings(e,t){const o=this.config.ranking_targets[t.type],a=(e.serp_top3_count*1.5+e.serp_top10_count*.5)/o.serp_target*12,s=Math.min(12,Math.max(0,a)),n=e.gmb_top3_count/o.gmb_target*8,i=Math.min(8,Math.max(0,n));return{points:s+i,maxPoints:20,details:{serp:{top3:e.serp_top3_count,top10:e.serp_top10_count,points:s,target:o.serp_target},gmb:{top3:e.gmb_top3_count,points:i,target:o.gmb_target}}}}calculateTechnicalHealth(e){const t=(e.pagespeed_home+e.pagespeed_service+e.pagespeed_location)/3,o=this.mapPageSpeedToPoints(t),a=e.sc_errors_home+e.sc_errors_service+e.sc_errors_location,s=this.mapErrorsToPoints(a);return{points:o+s,maxPoints:20,details:{pageSpeed:{average:Math.round(t),points:o,breakdown:{home:e.pagespeed_home,service:e.pagespeed_service,location:e.pagespeed_location}},errors:{total:a,points:s,breakdown:{home:e.sc_errors_home,service:e.sc_errors_service,location:e.sc_errors_location}}}}}calculateDeliveryScope(e,t){const o=this.config.delivery_targets[t.type],a={blogs:e.deliverables_blogs,backlinks:e.deliverables_backlinks,onpage:e.deliverables_onpage,techfixes:e.deliverables_techfixes},s=15/4;let n=0;const i={};return Object.keys(o).forEach(c=>{const d=a[c]||0,l=o[c],p=d/l*100;let g=0;p>=100?g=1:p>=75?g=.75:p>=50?g=.5:g=0;const x=s*g;n+=x,i[c]={achieved:d,target:l,percentage:Math.round(p),points:Math.round(x*100)/100}}),{points:Math.round(n*100)/100,maxPoints:15,details:i}}calculateRelationshipQuality(e){const t=e.nps_client?e.nps_client/10*6:0,o=e.client_meeting_date?1:0,a=(e.interactions_count||0)>=4?1:0,s=o&&a?2:o||a?1.5:0,n=e.mentor_score?e.mentor_score/10*2:0;return{points:t+s+n,maxPoints:10,details:{nps:{score:e.nps_client,points:Math.round(t*100)/100},interactions:{count:e.interactions_count,hasMeeting:o,points:s},mentor:{score:e.mentor_score,points:Math.round(n*100)/100}}}}calculatePenalties(e,t,o){const a=[];let s=0;if(o.length>=1){const c=this.calculateGrowthPercentage(e.gsc_organic_prev_30d,e.gsc_organic_curr_30d),d=this.calculateGrowthPercentage(o[0].gsc_organic_prev_30d,o[0].gsc_organic_curr_30d);c<0&&d<0&&(a.push({type:"consecutive_negative_growth",points:5}),s+=5)}const n=this.config.delivery_targets[t.type];return Object.keys(n).some(c=>(e[`deliverables_${c}`]||0)>0)||(a.push({type:"missing_mandatory_deliverables",points:5}),s+=5),{penalties:a,total:s}}calculateGrowthPercentage(e,t){return!e||e===0?t>0?100:0:(t-e)/e*100}mapGrowthToPoints(e,t){const o=Object.keys(t).map(Number).sort((a,s)=>s-a);for(const a of o)if(e>=a)return t[a];return 0}mapPageSpeedToPoints(e){return e>=90?10:e>=80?8:e>=70?6:e>=60?4:2}mapErrorsToPoints(e){return e===0?10:e<=5?8:e<=15?5:e<=40?2:0}async calculateEmployeeMonthScore(e,t){const{data:o,error:a}=await m.from("seo_monthly_entries").select(`
        *,
        clients!inner(*)
      `).eq("employee_id",e).eq("month",t).eq("status","approved");if(a)throw new Error(`Failed to fetch entries: ${a.message}`);if(!o.length)return null;await this.loadConfig();const s=this.config.client_weights;let n=0,i=0;return o.forEach(c=>{const d=s[c.clients.type]||1;n+=c.month_score*d,i+=d}),i>0?n/i:0}async calculateAppraisalScore(e,t,o){const{data:a,error:s}=await m.from("seo_monthly_entries").select("month_score").eq("employee_id",e).eq("status","approved").gte("month",t).lte("month",o);if(s)throw new Error(`Failed to fetch appraisal entries: ${s.message}`);if(!a.length)return null;const n=a.reduce((l,p)=>l+p.month_score,0)/a.length;await this.loadConfig();const i=this.config.appraisal_bands;let c="D",d=0;return["A","B","C","D"].forEach(l=>{n>=i[l].min_score&&(c=l,d=i[l].increment_pct)}),{avgScore:Math.round(n*100)/100,ratingBand:c,incrementPct:d,entryCount:a.length}}}const P=new Q;class B{async getEntries(e={}){const{employeeId:t,clientId:o,month:a,status:s,page:n=1,limit:i=50,sortBy:c="month",sortOrder:d="desc"}=e;let l=m.from("seo_monthly_entries").select(`
        *,
        clients!inner(id, name, type, active),
        users!inner(id, name, email),
        reviewer:reviewed_by(id, name, email)
      `,{count:"exact"});t&&(l=l.eq("employee_id",t)),o&&(l=l.eq("client_id",o)),a&&(l=l.eq("month",a)),s&&(l=l.eq("status",s)),l=l.order(c,{ascending:d==="asc"});const p=(n-1)*i,g=p+i-1;l=l.range(p,g);const{data:x,error:k,count:y}=await l;if(k)throw new Error(`Failed to fetch SEO entries: ${k.message}`);return{data:x,pagination:{page:n,limit:i,total:y,totalPages:Math.ceil(y/i)}}}async getEntry(e){const{data:t,error:o}=await m.from("seo_monthly_entries").select(`
        *,
        clients!inner(id, name, type, active),
        users!inner(id, name, email),
        reviewer:reviewed_by(id, name, email)
      `).eq("id",e).single();if(o)throw new Error(`Failed to fetch SEO entry: ${o.message}`);return t}async createEntry(e){const t=["employee_id","client_id","month"];for(const n of t)if(!e[n])throw new Error(`Missing required field: ${n}`);const{data:o}=await m.from("seo_monthly_entries").select("id").eq("employee_id",e.employee_id).eq("client_id",e.client_id).eq("month",e.month).single();if(o)throw new Error("Entry already exists for this employee, client, and month");const{data:a,error:s}=await m.from("seo_monthly_entries").insert(e).select().single();if(s)throw new Error(`Failed to create SEO entry: ${s.message}`);return a}async updateEntry(e,t){const o=["organic_growth_pct","traffic_growth_pct","technical_health_score","ranking_score","delivery_score","relationship_score","month_score"],a={...t};o.forEach(i=>delete a[i]);const{data:s,error:n}=await m.from("seo_monthly_entries").update(a).eq("id",e).select().single();if(n)throw new Error(`Failed to update SEO entry: ${n.message}`);return s}async submitEntry(e){const t=await this.getEntry(e);if(t.status!=="draft")throw new Error("Only draft entries can be submitted");this.validateEntryData(t);const{data:o}=await m.from("seo_monthly_entries").select("*").eq("employee_id",t.employee_id).eq("client_id",t.client_id).lt("month",t.month).order("month",{ascending:!1}).limit(2),a=await P.calculateMonthScore(t,t.clients,o||[]),s={organic_growth_pct:P.calculateGrowthPercentage(t.gsc_organic_prev_30d,t.gsc_organic_curr_30d),traffic_growth_pct:P.calculateGrowthPercentage(t.ga_total_prev_30d,t.ga_total_curr_30d),technical_health_score:a.breakdown.technicalHealth.points,ranking_score:a.breakdown.rankings.points,delivery_score:a.breakdown.deliveryScope.points,relationship_score:a.breakdown.relationshipQuality.points,month_score:a.totalScore,status:"submitted",submitted_at:new Date().toISOString()},{data:n,error:i}=await m.from("seo_monthly_entries").update(s).eq("id",e).select().single();if(i)throw new Error(`Failed to submit SEO entry: ${i.message}`);return{...n,scoring:a}}async approveEntry(e,t,o=""){const{data:a,error:s}=await m.from("seo_monthly_entries").update({status:"approved",review_comment:o,reviewed_by:t,reviewed_at:new Date().toISOString()}).eq("id",e).eq("status","submitted").select().single();if(s)throw new Error(`Failed to approve SEO entry: ${s.message}`);return a}async returnEntry(e,t,o){if(!o||o.trim()==="")throw new Error("Comment is required when returning an entry");const{data:a,error:s}=await m.from("seo_monthly_entries").update({status:"returned",review_comment:o,reviewed_by:t,reviewed_at:new Date().toISOString()}).eq("id",e).eq("status","submitted").select().single();if(s)throw new Error(`Failed to return SEO entry: ${s.message}`);return a}async addMentorScore(e,t,o){if(t<1||t>10)throw new Error("Mentor score must be between 1 and 10");const{data:a,error:s}=await m.from("seo_monthly_entries").update({mentor_score:t}).eq("id",e).select().single();if(s)throw new Error(`Failed to add mentor score: ${s.message}`);return a}async getEmployeeDashboard(e){const t=new Date().getFullYear(),o=new Date().getMonth()+1,a=o===1?12:o-1,s=o===1?t-1:t,{data:n}=await m.from("seo_monthly_entries").select("month_score").eq("employee_id",e).eq("status","approved").gte("month",`${t}-01`).lte("month",`${t}-12`),i=`${s}-${a.toString().padStart(2,"0")}`,{data:c}=await m.from("seo_monthly_entries").select("month_score").eq("employee_id",e).eq("status","approved").eq("month",i),{data:d}=await m.from("seo_accounts").select("client_id").eq("employee_id",e).eq("status","active"),l=new Date;l.setDate(l.getDate()-90);const{data:p}=await m.from("seo_monthly_entries").select("nps_client").eq("employee_id",e).not("nps_client","is",null).gte("created_at",l.toISOString()),g=(n==null?void 0:n.length)>0?n.reduce((y,S)=>y+S.month_score,0)/n.length:0,x=(c==null?void 0:c.length)>0?c.reduce((y,S)=>y+S.month_score,0)/c.length:0,k=(p==null?void 0:p.length)>0?p.reduce((y,S)=>y+S.nps_client,0)/p.length:0;return{ytdAvgScore:Math.round(g*100)/100,lastMonthScore:Math.round(x*100)/100,activeClientsCount:(d==null?void 0:d.length)||0,avgNPS:Math.round(k*100)/100}}async getTeamDashboard(e=null){new Date().toISOString().slice(0,7);let t=m.from("seo_monthly_entries").select(`
        *,
        users!inner(id, name, email, role),
        clients!inner(id, name, type)
      `);const{data:o}=await t;return this.calculateTeamMetrics(o||[])}async getClients(e={}){const{active:t=!0,type:o}=e;let a=m.from("clients").select("*").order("name");t!==null&&(a=a.eq("active",t)),o&&(a=a.eq("type",o));const{data:s,error:n}=await a;if(n)throw new Error(`Failed to fetch clients: ${n.message}`);return s}async getEmployeeAccounts(e){const{data:t,error:o}=await m.from("seo_accounts").select(`
        *,
        clients!inner(id, name, type, active)
      `).eq("employee_id",e).eq("status","active");if(o)throw new Error(`Failed to fetch SEO accounts: ${o.message}`);return t}validateEntryData(e){const o=["gsc_organic_prev_30d","gsc_organic_curr_30d","ga_total_prev_30d","ga_total_curr_30d","serp_top3_count","serp_top10_count","pagespeed_home","pagespeed_service","pagespeed_location"].filter(a=>e[a]===null||e[a]===void 0);if(o.length>0)throw new Error(`Missing required fields: ${o.join(", ")}`)}calculateTeamMetrics(e){const t=new Date().toISOString().slice(0,7),o=e.filter(i=>i.status==="approved"),a=e.filter(i=>i.month===t),s=o.length>0?o.reduce((i,c)=>i+c.month_score,0)/o.length:0,n=o.filter(i=>i.month_score<65);return{totalEntries:e.length,approvedEntries:o.length,pendingReview:e.filter(i=>i.status==="submitted").length,avgTeamScore:Math.round(s*100)/100,lowPerformersCount:n.length,currentMonthSubmissions:a.length}}}const Le=new B;let W={data:""},Y=r=>typeof window=="object"?((r?r.querySelector("#_goober"):window._goober)||Object.assign((r||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:r||W,Z=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,J=/\/\*[^]*?\*\/|  +/g,D=/\n+/g,b=(r,e)=>{let t="",o="",a="";for(let s in r){let n=r[s];s[0]=="@"?s[1]=="i"?t=s+" "+n+";":o+=s[1]=="f"?b(n,s):s+"{"+b(n,s[1]=="k"?"":e)+"}":typeof n=="object"?o+=b(n,e?e.replace(/([^,])+/g,i=>s.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,c=>/&/.test(c)?c.replace(/&/g,i):i?i+" "+c:c)):s):n!=null&&(s=/^--/.test(s)?s:s.replace(/[A-Z]/g,"-$&").toLowerCase(),a+=b.p?b.p(s,n):s+":"+n+";")}return t+(e&&a?e+"{"+a+"}":a)+o},_={},F=r=>{if(typeof r=="object"){let e="";for(let t in r)e+=t+F(r[t]);return e}return r},K=(r,e,t,o,a)=>{let s=F(r),n=_[s]||(_[s]=(c=>{let d=0,l=11;for(;d<c.length;)l=101*l+c.charCodeAt(d++)>>>0;return"go"+l})(s));if(!_[n]){let c=s!==r?r:(d=>{let l,p,g=[{}];for(;l=Z.exec(d.replace(J,""));)l[4]?g.shift():l[3]?(p=l[3].replace(D," ").trim(),g.unshift(g[0][p]=g[0][p]||{})):g[0][l[1]]=l[2].replace(D," ").trim();return g[0]})(r);_[n]=b(a?{["@keyframes "+n]:c}:c,t?"":"."+n)}let i=t&&_.g?_.g:null;return t&&(_.g=_[n]),((c,d,l,p)=>{p?d.data=d.data.replace(p,c):d.data.indexOf(c)===-1&&(d.data=l?c+d.data:d.data+c)})(_[n],e,o,i),n},U=(r,e,t)=>r.reduce((o,a,s)=>{let n=e[s];if(n&&n.call){let i=n(t),c=i&&i.props&&i.props.className||/^go/.test(i)&&i;n=c?"."+c:i&&typeof i=="object"?i.props?"":b(i,""):i===!1?"":i}return o+a+(n??"")},"");function M(r){let e=this||{},t=r.call?r(e.p):r;return K(t.unshift?t.raw?U(t,[].slice.call(arguments,1),e.p):t.reduce((o,a)=>Object.assign(o,a&&a.call?a(e.p):a),{}):t,Y(e.target),e.g,e.o,e.k)}let I,q,j;M.bind({g:1});let w=M.bind({k:1});function V(r,e,t,o){b.p=e,I=r,q=t,j=o}function v(r,e){let t=this||{};return function(){let o=arguments;function a(s,n){let i=Object.assign({},s),c=i.className||a.className;t.p=Object.assign({theme:q&&q()},i),t.o=/ *go\d+/.test(c),i.className=M.apply(t,o)+(c?" "+c:"");let d=r;return r[0]&&(d=i.as||r,delete i.as),j&&d[0]&&j(i),I(d,i)}return a}}var X=r=>typeof r=="function",O=(r,e)=>X(r)?r(e):r,ee=(()=>{let r=0;return()=>(++r).toString()})(),te=(()=>{let r;return()=>{if(r===void 0&&typeof window<"u"){let e=matchMedia("(prefers-reduced-motion: reduce)");r=!e||e.matches}return r}})(),re=20,A="default",G=(r,e)=>{let{toastLimit:t}=r.settings;switch(e.type){case 0:return{...r,toasts:[e.toast,...r.toasts].slice(0,t)};case 1:return{...r,toasts:r.toasts.map(n=>n.id===e.toast.id?{...n,...e.toast}:n)};case 2:let{toast:o}=e;return G(r,{type:r.toasts.find(n=>n.id===o.id)?1:0,toast:o});case 3:let{toastId:a}=e;return{...r,toasts:r.toasts.map(n=>n.id===a||a===void 0?{...n,dismissed:!0,visible:!1}:n)};case 4:return e.toastId===void 0?{...r,toasts:[]}:{...r,toasts:r.toasts.filter(n=>n.id!==e.toastId)};case 5:return{...r,pausedAt:e.time};case 6:let s=e.time-(r.pausedAt||0);return{...r,pausedAt:void 0,toasts:r.toasts.map(n=>({...n,pauseDuration:n.pauseDuration+s}))}}},oe=[],ae={toasts:[],pausedAt:void 0,settings:{toastLimit:re}},E={},L=(r,e=A)=>{E[e]=G(E[e]||ae,r),oe.forEach(([t,o])=>{t===e&&o(E[e])})},R=r=>Object.keys(E).forEach(e=>L(r,e)),se=r=>Object.keys(E).find(e=>E[e].toasts.some(t=>t.id===r)),T=(r=A)=>e=>{L(e,r)},ne=(r,e="blank",t)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:e,ariaProps:{role:"status","aria-live":"polite"},message:r,pauseDuration:0,...t,id:(t==null?void 0:t.id)||ee()}),$=r=>(e,t)=>{let o=ne(e,r,t);return T(o.toasterId||se(o.id))({type:2,toast:o}),o.id},h=(r,e)=>$("blank")(r,e);h.error=$("error");h.success=$("success");h.loading=$("loading");h.custom=$("custom");h.dismiss=(r,e)=>{let t={type:3,toastId:r};e?T(e)(t):R(t)};h.dismissAll=r=>h.dismiss(void 0,r);h.remove=(r,e)=>{let t={type:4,toastId:r};e?T(e)(t):R(t)};h.removeAll=r=>h.remove(void 0,r);h.promise=(r,e,t)=>{let o=h.loading(e.loading,{...t,...t==null?void 0:t.loading});return typeof r=="function"&&(r=r()),r.then(a=>{let s=e.success?O(e.success,a):void 0;return s?h.success(s,{id:o,...t,...t==null?void 0:t.success}):h.dismiss(o),a}).catch(a=>{let s=e.error?O(e.error,a):void 0;s?h.error(s,{id:o,...t,...t==null?void 0:t.error}):h.dismiss(o)}),r};var ie=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,ce=w`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,le=w`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,de=v("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${r=>r.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${ie} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${ce} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${r=>r.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${le} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,pe=w`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,me=v("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${r=>r.secondary||"#e0e0e0"};
  border-right-color: ${r=>r.primary||"#616161"};
  animation: ${pe} 1s linear infinite;
`,ue=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,ge=w`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,he=v("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${r=>r.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${ue} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${ge} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${r=>r.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,fe=v("div")`
  position: absolute;
`,_e=v("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,we=w`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ye=v("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${we} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,be=({toast:r})=>{let{icon:e,type:t,iconTheme:o}=r;return e!==void 0?typeof e=="string"?f.createElement(ye,null,e):e:t==="blank"?null:f.createElement(_e,null,f.createElement(me,{...o}),t!=="loading"&&f.createElement(fe,null,t==="error"?f.createElement(de,{...o}):f.createElement(he,{...o})))},ve=r=>`
0% {transform: translate3d(0,${r*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,xe=r=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${r*-150}%,-1px) scale(.6); opacity:0;}
`,Ee="0%{opacity:0;} 100%{opacity:1;}",Se="0%{opacity:1;} 100%{opacity:0;}",$e=v("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,ke=v("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Me=(r,e)=>{let t=r.includes("top")?1:-1,[o,a]=te()?[Ee,Se]:[ve(t),xe(t)];return{animation:e?`${w(o)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${w(a)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};f.memo(({toast:r,position:e,style:t,children:o})=>{let a=r.height?Me(r.position||e||"top-center",r.visible):{opacity:0},s=f.createElement(be,{toast:r}),n=f.createElement(ke,{...r.ariaProps},O(r.message,r));return f.createElement($e,{className:r.className,style:{...a,...t,...r.style}},typeof o=="function"?o({icon:s,message:n}):f.createElement(f.Fragment,null,s,n))});V(f.createElement);M`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;export{je as D,z as L,Ne as T,Ce as a,Ie as b,Ae as c,Fe as d,Ge as e,Oe as f,Te as g,De as h,H as i,h as n,Le as s};
