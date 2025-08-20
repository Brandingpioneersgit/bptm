# Branding Pioneers – Codex (Monthly Tactical MVP)

[![Netlify Status](https://api.netlify.com/api/v1/badges/dfcaf2a4-e2a5-4e74-a3e2-eb5423ad8267/deploy-status)](https://app.netlify.com/projects/bptm/deploys)

Vite + React + Tailwind app with localStorage fallback and optional Supabase storage.
Manager dashboard is gated via `VITE_ADMIN_ACCESS_TOKEN` and lives at `/#admin`.

---

## 1) Run locally
```bash
npm install
npm run dev
```
Open http://localhost:5173

---

## 2) Environment Configuration
1. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` with your actual credentials (never commit this file!)

## 3) (Optional) Supabase setup
1. Create a Supabase project → grab **Project URL** and **anon key**.
2. In SQL editor, run:
```sql
create extension if not exists pgcrypto;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  month_key text not null,
  employee_email text not null,
  employee_name text not null,
  department text not null,
  role text not null,
  payload jsonb not null,
  scores jsonb not null,
  flags  jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.submissions enable row level security;
create policy "public can insert submissions" on public.submissions
  for insert to anon with check (true);
create policy "read submissions (MVP)" on public.submissions
  for select to anon using (true);
```
3. Add your credentials to `.env` file (keep these secure and never commit them!):
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_ADMIN_ACCESS_TOKEN=your_secure_admin_password
   ```

> If you skip Supabase, the app still works using localStorage and the admin dashboard will read local drafts.

---

## 4) Push to GitHub (repo name: codex)
```bash
git init
git add .
git commit -m "feat: Codex MVP"
git branch -M main
git remote add origin https://github.com/<your-user-or-org>/codex.git
git push -u origin main
```

---

## 5) Deploy on Netlify
- New Site from Git → select **codex**
- Build: `npm run build`
- Publish directory: `dist`
- Environment variables (Site settings → Build & deploy → Environment):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_ADMIN_ACCESS_TOKEN` (choose a strong string; required for `/#admin`)

Manager Dashboard: `https://<your-site>.netlify.app/#admin` → will prompt for the token.

---

## 6) Authentication System
**NEW:** Secure login system for employees and managers:

- 👥 **Employee Login**: Name + Phone number (phone acts as password)
- 🔐 **Manager Login**: Admin access token authentication
- 📊 **Personal Dashboard**: Employees can view their performance history and progress
- 🎯 **Role-Based Access**: Different interfaces for employees vs managers
- 📱 **Mobile Optimized**: Fully responsive design for mobile devices

## 6.1) Mobile Responsiveness Features
**NEW:** Enhanced mobile experience across all devices:

- 📱 **Touch-First Design**: Optimized buttons and interactions for mobile
- 🔄 **Responsive Layout**: Adaptive grids and layouts for all screen sizes
- 📊 **Mobile Dashboard**: Mobile-optimized employee performance dashboard
- 🎯 **Form Wizard**: Mobile-friendly step-by-step form with touch navigation
- 💬 **Modal Dialogs**: Bottom-sheet style modals on mobile devices
- 🔧 **Input Optimization**: Proper keyboard types for numeric inputs

## 7) Submission Rules & Restrictions
**NEW:** The system now enforces submission restrictions for data integrity:

- ✅ **Current Month Only**: Employees can only edit current month submissions
- 🔒 **Post-Submission Lock**: Once submitted, forms are locked and cannot be edited
- 📊 **Performance Feedback**: Detailed performance report generated after submission
- 🎯 **Improvement Insights**: Automatic analysis with suggestions for next month

## 8) Quick QA checklist
**Authentication Testing:**
- [ ] Test employee login with name + phone number
- [ ] Test manager login with admin token
- [ ] Verify employee personal dashboard shows correct data
- [ ] Test logout functionality for both user types

**Form & Submission Testing:**
- [ ] Add at least one Client in the KPIs section.
- [ ] Attach Report URLs (dashboard/drive/figma/etc.).
- [ ] Add Learning entries until you reach 6 hours.
- [ ] Add at least one Meeting note link in Relationship.
- [ ] Submit → If Supabase is configured, data is stored server-side; else saved locally.
- [ ] Verify submission restrictions: try editing a submitted form (should be locked)
- [ ] Check performance feedback appears after submission
- [ ] Check Admin dashboard (`/#admin`), change the month dropdown, and Export JSON.

---

## 9) Common gotchas
• **Employee login**: Phone number must match exactly what was used during registration  
• **Manager access**: Use `VITE_ADMIN_ACCESS_TOKEN` value as password for manager login  
• **Token gate**: If `VITE_ADMIN_ACCESS_TOKEN` is empty, dashboard opens without prompt  
• **Supabase insert error**: Usually missing `pgcrypto` or wrong env vars. See SQL above  
• **SPA routing**: `netlify.toml` contains a fallback so deep links work

---

## 10) Customize branding
• Replace the inline favicon in `index.html`.  
• Replace the header image source with your BP logo.  
• Add colors via Tailwind in `tailwind.config.js` if desired.

Enjoy! 🚀
