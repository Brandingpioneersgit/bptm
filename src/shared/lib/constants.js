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

// Indian holidays by month (common national holidays)
const INDIAN_HOLIDAYS = {
  // Fixed date holidays
  '01-26': 'Republic Day',
  '08-15': 'Independence Day',
  '10-02': 'Gandhi Jayanti',
  '12-25': 'Christmas Day',
  
  // Variable holidays (approximate dates - in real implementation, use a proper holiday API)
  // These are common dates, but actual dates vary by year
  '01-14': 'Makar Sankranti',
  '03-08': 'Holi (approx)',
  '04-14': 'Ram Navami (approx)',
  '05-01': 'Labour Day',
  '08-19': 'Janmashtami (approx)',
  '09-02': 'Ganesh Chaturthi (approx)',
  '10-24': 'Dussehra (approx)',
  '11-12': 'Diwali (approx)',
  '11-19': 'Guru Nanak Jayanti (approx)'
};

/**
 * Calculate working days in a month excluding:
 * - All Sundays
 * - Alternate 2nd and 4th Saturdays
 * - Indian national holidays
 * 
 * @param {string} monthKey - Format: "YYYY-MM"
 * @returns {number} Number of working days
 */
export function workingDaysInMonth(monthKey) {
  const [y, m] = (monthKey || "").split("-").map(Number);
  if (!y || !m) return 22; // Default fallback
  
  const totalDays = new Date(y, m, 0).getDate();
  let workingDays = 0;
  
  // Track which Saturdays we've encountered
  let saturdayCount = 0;
  
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(y, m - 1, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Skip Sundays
    if (dayOfWeek === 0) {
      continue;
    }
    
    // Handle alternate Saturdays (2nd and 4th)
    if (dayOfWeek === 6) {
      saturdayCount++;
      // Skip 2nd and 4th Saturdays (alternate Saturdays)
      if (saturdayCount === 2 || saturdayCount === 4) {
        continue;
      }
    }
    
    // Check for Indian holidays
    const monthDay = `${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (INDIAN_HOLIDAYS[monthDay]) {
      continue;
    }
    
    // If we reach here, it's a working day
    workingDays++;
  }
  
  return workingDays;
}

/**
 * Get working days information for a month
 * @param {string} monthKey - Format: "YYYY-MM"
 * @returns {object} Object with working days details
 */
export function getWorkingDaysInfo(monthKey) {
  const [y, m] = (monthKey || "").split("-").map(Number);
  if (!y || !m) return { total: 31, working: 22, holidays: [], weekends: [] };
  
  const totalDays = new Date(y, m, 0).getDate();
  const holidays = [];
  const weekends = [];
  let saturdayCount = 0;
  
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(y, m - 1, day);
    const dayOfWeek = date.getDay();
    const monthDay = `${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Track Sundays
    if (dayOfWeek === 0) {
      weekends.push({ day, type: 'Sunday' });
    }
    
    // Track alternate Saturdays
    if (dayOfWeek === 6) {
      saturdayCount++;
      if (saturdayCount === 2 || saturdayCount === 4) {
        weekends.push({ day, type: `${saturdayCount === 2 ? '2nd' : '4th'} Saturday` });
      }
    }
    
    // Track holidays
    if (INDIAN_HOLIDAYS[monthDay]) {
      holidays.push({ day, name: INDIAN_HOLIDAYS[monthDay] });
    }
  }
  
  return {
    total: totalDays,
    working: workingDaysInMonth(monthKey),
    holidays,
    weekends
  };
}

// DEPRECATED: Use secureConfig.validateAdminToken() instead
// This is kept for backward compatibility only
import { ADMIN_TOKEN as SECURE_ADMIN_TOKEN } from '../config/secureConfig.js';
export const ADMIN_TOKEN = SECURE_ADMIN_TOKEN;

export const EMPTY_SUBMISSION = {
  monthKey: prevMonthKey(thisMonthKey()),
  isDraft: true,
  employee: {
    name: "",
    department: "Web",
    role: [],
    phone: "",
    photoUrl: "",
    joiningDate: "",
    dob: "",
    education: "",
    certifications: "",
    skills: "",
  },
  meta: { attendance: { wfo: 0, wfh: 0 }, tasks: { count: 0, aiTableLink: "", aiTableScreenshot: "" } },
  clients: [],
  learning: [],
  aiUsageNotes: "",
  feedback: { company: "", hr: "", challenges: "" },
  flags: { missingLearningHours: false, hasEscalations: false, missingReports: false },
  manager: { verified: false, comments: "", score: 0, hiddenDataFlag: false },
  scores: { kpiScore: 0, learningScore: 0, relationshipScore: 0, overall: 0 },
};

