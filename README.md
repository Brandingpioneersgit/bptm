# Branding Pioneers – Codex (Monthly Tactical MVP)

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

## 2) (Optional) Supabase setup
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
3. Keep these secure: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

> If you skip Supabase, the app still works using localStorage and the admin dashboard will read local drafts.

---

## 3) Push to GitHub (repo name: codex)
```bash
git init
git add .
git commit -m "feat: Codex MVP"
git branch -M main
git remote add origin https://github.com/<your-user-or-org>/codex.git
git push -u origin main
```

---

## 4) Deploy on Netlify
- New Site from Git → select **codex**
- Build: `npm run build`
- Publish directory: `dist`
- Environment variables (Site settings → Build & deploy → Environment):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_ADMIN_ACCESS_TOKEN` (choose a strong string; required for `/#admin`)

**Manager Dashboard:** `https://<your-site>/#admin` → will prompt for the token.

---

## 5) Quick QA checklist
- [ ] Add at least one **Client** in the KPIs section.
- [ ] Attach **Report URLs** (dashboard/drive/figma/etc.).
- [ ] Add **Learning entries** until you reach **6 hours**.
- [ ] Add at least one **Meeting** note link in Relationship.
- [ ] Submit → If Supabase is configured, data is stored server-side; else saved locally.
- [ ] Check Admin dashboard (`/#admin`), change the month dropdown, and **Export JSON**.

---

## 6) Common gotchas
- **Token gate**: If `VITE_ADMIN_ACCESS_TOKEN` is empty, dashboard opens without prompt.
- **Supabase insert error**: Usually missing `pgcrypto` or wrong env vars. See SQL above.
- **SPA routing**: `netlify.toml` contains a fallback so deep links work.

---

## 7) Customize branding
- Replace the inline favicon in `index.html`.
- Replace the header image source with your BP logo.
- Add colors via Tailwind in `tailwind.config.js` if desired.

Enjoy! 🚀
