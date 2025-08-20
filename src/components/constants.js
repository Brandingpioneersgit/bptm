export const DEPARTMENTS = [
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

export const ROLES_BY_DEPT = {
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

export const uid = () => Math.random().toString(36).slice(2, 9);

export const thisMonthKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };

export const prevMonthKey = (mk) => { if (!mk) return ""; const [y, m] = mk.split("-").map(Number); const d = new Date(y, m - 2, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };

export const monthLabel = (mk) => { if (!mk) return ""; const [y, m] = mk.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleString(undefined, { month: 'short', year: 'numeric' }); };

export const round1 = (n) => Math.round(n * 10) / 10;

export const isDriveUrl = (u) => /https?:\/\/(drive|docs)\.google\.com\//i.test(u || "");

export const isPhoneNumber = (p) => !!p && /^\d{10}$/.test(p);

export const isGensparkUrl = (u) => /https?:\/\/(www\.)?genspark\.ai/i.test(u || "");

export const toDDMMYYYY = (dateStr) => {
  if (!dateStr || !dateStr.includes('-')) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export const toYYYYMMDD = (dateStr) => {
  if (!dateStr || !dateStr.includes('/')) return '';
  const [d, m, y] = dateStr.split('/');
  return `${y}-${m}-${d}`;
};

export function daysInMonth(monthKey) {
  const [y, m] = (monthKey || "").split("-").map(Number);
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate();
}

export const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_ACCESS_TOKEN || "admin";

export const EMPTY_SUBMISSION = {
  monthKey: prevMonthKey(thisMonthKey()), // Default to previous month for reporting
  isDraft: true,
  employee: { name: "", department: "Web", role: [], phone: "" },
  meta: { attendance: { wfo: 0, wfh: 0 }, tasks: { count: 0, aiTableLink: "", aiTableScreenshot: "" } },
  clients: [],
  learning: [],
  aiUsageNotes: "",
  feedback: { team: "", manager: "", hr: "" },
  flags: { missingLearningHours: false, hasEscalations: false, missingReports: false },
  manager: { verified: false, comments: "", score: 0, hiddenDataFlag: false },
  scores: { kpiScore: 0, learningScore: 0, relationshipScore: 0, overall: 0 },
};