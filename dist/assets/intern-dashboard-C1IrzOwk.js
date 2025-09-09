import{j as d}from"./manager-dashboard-DkJhgLpj.js";import{r as h}from"./react-vendor-z5qVsTvS.js";import"./auth-Bu1Z9VuU.js";const be=({isManager:e=!1})=>{const[t,a]=h.useState(null),[r,i]=h.useState(!0),[s,o]=h.useState(null),n={motivation:[{text:"The only way to do great work is to love what you do.",author:"Steve Jobs",category:"motivation"},{text:"Success is not final, failure is not fatal: it is the courage to continue that counts.",author:"Winston Churchill",category:"motivation"},{text:"The future belongs to those who believe in the beauty of their dreams.",author:"Eleanor Roosevelt",category:"motivation"},{text:"It is during our darkest moments that we must focus to see the light.",author:"Aristotle",category:"motivation"},{text:"The way to get started is to quit talking and begin doing.",author:"Walt Disney",category:"motivation"}],leadership:[{text:"A leader is one who knows the way, goes the way, and shows the way.",author:"John C. Maxwell",category:"leadership"},{text:"The greatest leader is not necessarily the one who does the greatest things. He is the one that gets the people to do the greatest things.",author:"Ronald Reagan",category:"leadership"},{text:"Leadership is not about being in charge. It's about taking care of those in your charge.",author:"Simon Sinek",category:"leadership"},{text:"The art of leadership is saying no, not saying yes. It is very easy to say yes.",author:"Tony Blair",category:"leadership"},{text:"A good leader takes a little more than his share of the blame, a little less than his share of the credit.",author:"Arnold H. Glasow",category:"leadership"}],productivity:[{text:"Focus on being productive instead of busy.",author:"Tim Ferriss",category:"productivity"},{text:"The key is not to prioritize what's on your schedule, but to schedule your priorities.",author:"Stephen Covey",category:"productivity"},{text:"Efficiency is doing things right; effectiveness is doing the right things.",author:"Peter Drucker",category:"productivity"},{text:"Time is what we want most, but what we use worst.",author:"William Penn",category:"productivity"},{text:"You don't have to be great to get started, but you have to get started to be great.",author:"Les Brown",category:"productivity"}],teamwork:[{text:"Alone we can do so little; together we can do so much.",author:"Helen Keller",category:"teamwork"},{text:"Teamwork makes the dream work.",author:"John C. Maxwell",category:"teamwork"},{text:"Coming together is a beginning, staying together is progress, and working together is success.",author:"Henry Ford",category:"teamwork"},{text:"The strength of the team is each individual member. The strength of each member is the team.",author:"Phil Jackson",category:"teamwork"},{text:"If you want to go fast, go alone. If you want to go far, go together.",author:"African Proverb",category:"teamwork"}]},l=()=>{let c=[];e?c=[...n.leadership,...n.teamwork]:c=[...n.motivation,...n.productivity];const f=Math.floor(Math.random()*c.length);return c[f]};h.useEffect(()=>{try{i(!0);const c=l();a(c),o(null)}catch(c){o("Failed to load quote"),console.error("Error loading quote:",c)}finally{i(!1)}},[e]);const u=()=>{try{const c=l();a(c)}catch(c){o("Failed to refresh quote"),console.error("Error refreshing quote:",c)}};return r?d.jsx("div",{className:"card-brand p-6",children:d.jsxs("div",{className:"animate-pulse",children:[d.jsx("div",{className:"h-4 bg-slate-200 rounded w-3/4 mb-2"}),d.jsx("div",{className:"h-4 bg-slate-200 rounded w-1/2"})]})}):s?d.jsx("div",{className:"card-brand p-6",children:d.jsxs("div",{className:"text-center text-red-600",children:[d.jsx("p",{children:s}),d.jsx("button",{onClick:u,className:"mt-2 text-sm text-blue-600 hover:text-blue-800",children:"Try Again"})]})}):d.jsxs("div",{className:"card-brand p-6",children:[d.jsxs("div",{className:"flex justify-between items-start mb-4",children:[d.jsxs("h3",{className:"text-lg font-semibold text-brand-text flex items-center",children:[d.jsx("span",{className:"mr-2",children:"💡"}),e?"Leadership Insight":"Daily Inspiration"]}),d.jsx("button",{onClick:u,className:"text-brand-text-secondary hover:text-brand-text transition-colors duration-200",title:"Get new quote",children:"🔄"})]}),t&&d.jsxs("div",{className:"space-y-4",children:[d.jsxs("blockquote",{className:"text-brand-text italic text-lg leading-relaxed",children:['"',t.text,'"']}),d.jsxs("div",{className:"flex justify-between items-center",children:[d.jsxs("cite",{className:"text-brand-text-secondary font-medium not-italic",children:["— ",t.author]}),d.jsx("span",{className:`px-2 py-1 rounded-full text-xs font-medium ${t.category==="leadership"?"bg-purple-100 text-purple-800":t.category==="teamwork"?"bg-blue-100 text-blue-800":t.category==="motivation"?"bg-green-100 text-green-800":"bg-orange-100 text-orange-800"}`,children:t.category})]})]}),d.jsx("div",{className:"mt-4 pt-4 border-t border-slate-200 dark:border-slate-600",children:d.jsx("p",{className:"text-xs text-brand-text-secondary text-center",children:e?"Leadership wisdom to guide your team":"Daily motivation to fuel your success"})})]})};let D={data:""},L=e=>typeof window=="object"?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||D,z=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,O=/\/\*[^]*?\*\/|  +/g,A=/\n+/g,y=(e,t)=>{let a="",r="",i="";for(let s in e){let o=e[s];s[0]=="@"?s[1]=="i"?a=s+" "+o+";":r+=s[1]=="f"?y(o,s):s+"{"+y(o,s[1]=="k"?"":t)+"}":typeof o=="object"?r+=y(o,t?t.replace(/([^,])+/g,n=>s.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,l=>/&/.test(l)?l.replace(/&/g,n):n?n+" "+l:l)):s):o!=null&&(s=/^--/.test(s)?s:s.replace(/[A-Z]/g,"-$&").toLowerCase(),i+=y.p?y.p(s,o):s+":"+o+";")}return a+(t&&i?t+"{"+i+"}":i)+r},p={},T=e=>{if(typeof e=="object"){let t="";for(let a in e)t+=a+T(e[a]);return t}return e},Q=(e,t,a,r,i)=>{let s=T(e),o=p[s]||(p[s]=(l=>{let u=0,c=11;for(;u<l.length;)c=101*c+l.charCodeAt(u++)>>>0;return"go"+c})(s));if(!p[o]){let l=s!==e?e:(u=>{let c,f,b=[{}];for(;c=z.exec(u.replace(O,""));)c[4]?b.shift():c[3]?(f=c[3].replace(A," ").trim(),b.unshift(b[0][f]=b[0][f]||{})):b[0][c[1]]=c[2].replace(A," ").trim();return b[0]})(e);p[o]=y(i?{["@keyframes "+o]:l}:l,a?"":"."+o)}let n=a&&p.g?p.g:null;return a&&(p.g=p[o]),((l,u,c,f)=>{f?u.data=u.data.replace(f,l):u.data.indexOf(l)===-1&&(u.data=c?l+u.data:u.data+l)})(p[o],t,r,n),o},P=(e,t,a)=>e.reduce((r,i,s)=>{let o=t[s];if(o&&o.call){let n=o(a),l=n&&n.props&&n.props.className||/^go/.test(n)&&n;o=l?"."+l:n&&typeof n=="object"?n.props?"":y(n,""):n===!1?"":n}return r+i+(o??"")},"");function k(e){let t=this||{},a=e.call?e(t.p):e;return Q(a.unshift?a.raw?P(a,[].slice.call(arguments,1),t.p):a.reduce((r,i)=>Object.assign(r,i&&i.call?i(t.p):i),{}):a,L(t.target),t.g,t.o,t.k)}let I,j,N;k.bind({g:1});let g=k.bind({k:1});function H(e,t,a,r){y.p=t,I=e,j=a,N=r}function x(e,t){let a=this||{};return function(){let r=arguments;function i(s,o){let n=Object.assign({},s),l=n.className||i.className;a.p=Object.assign({theme:j&&j()},n),a.o=/ *go\d+/.test(l),n.className=k.apply(a,r)+(l?" "+l:"");let u=e;return e[0]&&(u=n.as||e,delete n.as),N&&u[0]&&N(n),I(u,n)}return i}}var R=e=>typeof e=="function",E=(e,t)=>R(e)?e(t):e,J=(()=>{let e=0;return()=>(++e).toString()})(),W=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),_=20,S="default",C=(e,t)=>{let{toastLimit:a}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,a)};case 1:return{...e,toasts:e.toasts.map(o=>o.id===t.toast.id?{...o,...t.toast}:o)};case 2:let{toast:r}=t;return C(e,{type:e.toasts.find(o=>o.id===r.id)?1:0,toast:r});case 3:let{toastId:i}=t;return{...e,toasts:e.toasts.map(o=>o.id===i||i===void 0?{...o,dismissed:!0,visible:!1}:o)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(o=>o.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let s=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(o=>({...o,pauseDuration:o.pauseDuration+s}))}}},M=[],B={toasts:[],pausedAt:void 0,settings:{toastLimit:_}},v={},F=(e,t=S)=>{v[t]=C(v[t]||B,e),M.forEach(([a,r])=>{a===t&&r(v[t])})},q=e=>Object.keys(v).forEach(t=>F(e,t)),G=e=>Object.keys(v).find(t=>v[t].toasts.some(a=>a.id===e)),$=(e=S)=>t=>{F(t,e)},Y=(e,t="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(a==null?void 0:a.id)||J()}),w=e=>(t,a)=>{let r=Y(t,e,a);return $(r.toasterId||G(r.id))({type:2,toast:r}),r.id},m=(e,t)=>w("blank")(e,t);m.error=w("error");m.success=w("success");m.loading=w("loading");m.custom=w("custom");m.dismiss=(e,t)=>{let a={type:3,toastId:e};t?$(t)(a):q(a)};m.dismissAll=e=>m.dismiss(void 0,e);m.remove=(e,t)=>{let a={type:4,toastId:e};t?$(t)(a):q(a)};m.removeAll=e=>m.remove(void 0,e);m.promise=(e,t,a)=>{let r=m.loading(t.loading,{...a,...a==null?void 0:a.loading});return typeof e=="function"&&(e=e()),e.then(i=>{let s=t.success?E(t.success,i):void 0;return s?m.success(s,{id:r,...a,...a==null?void 0:a.success}):m.dismiss(r),i}).catch(i=>{let s=t.error?E(t.error,i):void 0;s?m.error(s,{id:r,...a,...a==null?void 0:a.error}):m.dismiss(r)}),e};var Z=g`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,K=g`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,U=g`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,V=x("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Z} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${K} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${U} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,X=g`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,ee=x("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${X} 1s linear infinite;
`,te=g`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,ae=g`
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
}`,oe=x("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${te} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${ae} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,re=x("div")`
  position: absolute;
`,se=x("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,ie=g`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ne=x("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${ie} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,le=({toast:e})=>{let{icon:t,type:a,iconTheme:r}=e;return t!==void 0?typeof t=="string"?h.createElement(ne,null,t):t:a==="blank"?null:h.createElement(se,null,h.createElement(ee,{...r}),a!=="loading"&&h.createElement(re,null,a==="error"?h.createElement(V,{...r}):h.createElement(oe,{...r})))},ce=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,de=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,ue="0%{opacity:0;} 100%{opacity:1;}",he="0%{opacity:1;} 100%{opacity:0;}",me=x("div")`
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
`,pe=x("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,ge=(e,t)=>{let a=e.includes("top")?1:-1,[r,i]=W()?[ue,he]:[ce(a),de(a)];return{animation:t?`${g(r)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${g(i)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};h.memo(({toast:e,position:t,style:a,children:r})=>{let i=e.height?ge(e.position||t||"top-center",e.visible):{opacity:0},s=h.createElement(le,{toast:e}),o=h.createElement(pe,{...e.ariaProps},E(e.message,e));return h.createElement(me,{className:e.className,style:{...i,...a,...e.style}},typeof r=="function"?r({icon:s,message:o}):h.createElement(h.Fragment,null,s,o))});H(h.createElement);k`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;export{be as Q,m as n};
