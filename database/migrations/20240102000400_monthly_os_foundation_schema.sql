-- Migration: monthly_os_foundation_schema
-- Source: 17_monthly_os_foundation_schema.sql
-- Timestamp: 20240102000400

-- Monthly Operating System Foundation Schema
-- Role-aware table-first monthly operating system
-- Foundation tables without department-specific KPIs

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users & Authentication
-- Replaces/extends existing employees table for the new system
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  user_type TEXT CHECK (user_type IN ('Employee','Intern','Freelancer')) NOT NULL,
  role_label TEXT,                         -- plain string; no dept schema yet
  manager_id UUID REFERENCES users(id),
  appraisal_date DATE,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Entities are either Clients or Projects (generic)
CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT CHECK (entity_type IN ('Client','Project')) NOT NULL,
  name TEXT NOT NULL,
  scope_summary TEXT,
  start_date DATE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User ↔ Entity mapping, includes capacity targets for accountability
CREATE TABLE IF NOT EXISTS user_entity_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  expected_projects INTEGER DEFAULT 0,    -- capacity by count
  expected_units INTEGER DEFAULT 0,       -- capacity by units (e.g., pages/tickets)
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, entity_id)
);

-- Monthly summaries (one row per user per month per entity)
CREATE TABLE IF NOT EXISTS monthly_rows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month DATE NOT NULL,                    -- use first day of month
  entity_id UUID REFERENCES entities(id),
  work_summary TEXT,
  kpi_json JSONB,                         -- placeholder; dept KPIs added later
  meetings_count INTEGER DEFAULT 0,
  meeting_links TEXT[],                   -- URLs
  client_satisfaction INTEGER CHECK (client_satisfaction BETWEEN 1 AND 10),
  learning_entries JSONB,                 -- [{topic,url,applied_where,minutes}]
  learning_minutes INTEGER DEFAULT 0,
  team_feedback TEXT,
  evidence_links TEXT[],                  -- URLs
  status TEXT CHECK (status IN ('draft','submitted','approved')) DEFAULT 'draft',
  reviewer_id UUID REFERENCES users(id),
  review_notes TEXT,
  row_score NUMERIC(5,2),                 -- 0–10 computed later
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, month, entity_id)
);

-- Attendance (daily grain) and cached monthly
CREATE TABLE IF NOT EXISTS attendance_daily (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  presence TEXT CHECK (presence IN ('office','wfh','leave','off')) NOT NULL,
  morning_meeting_attended BOOLEAN,
  PRIMARY KEY (user_id, day)
);

CREATE TABLE IF NOT EXISTS attendance_monthly_cache (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  working_days_expected INTEGER,
  office_days_present INTEGER,
  wfh_days INTEGER,
  leaves INTEGER,
  meeting_attendance_rate NUMERIC(5,4),
  office_attendance_rate NUMERIC(5,4),
  PRIMARY KEY (user_id, month)
);

-- Appraisal delay log (e.g., learning <360)
CREATE TABLE IF NOT EXISTS appraisal_delays (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  reason TEXT,
  months_delayed INTEGER DEFAULT 1,
  PRIMARY KEY (user_id, month, reason)
);

-- Audit log (simple)
CREATE TABLE IF NOT EXISTS change_audit (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT,
  row_id UUID,
  user_id UUID,
  action TEXT,           -- insert/update/status_change/approve/unlock
  diff JSONB,            -- before/after
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);

CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_active ON entities(active);

CREATE INDEX IF NOT EXISTS idx_user_entity_mappings_user_id ON user_entity_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_entity_mappings_entity_id ON user_entity_mappings(entity_id);
CREATE INDEX IF NOT EXISTS idx_user_entity_mappings_active ON user_entity_mappings(active);

CREATE INDEX IF NOT EXISTS idx_monthly_rows_user_id ON monthly_rows(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_rows_month ON monthly_rows(month);
CREATE INDEX IF NOT EXISTS idx_monthly_rows_entity_id ON monthly_rows(entity_id);
CREATE INDEX IF NOT EXISTS idx_monthly_rows_status ON monthly_rows(status);
CREATE INDEX IF NOT EXISTS idx_monthly_rows_user_month ON monthly_rows(user_id, month);

CREATE INDEX IF NOT EXISTS idx_attendance_daily_user_id ON attendance_daily(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_daily_day ON attendance_daily(day);

CREATE INDEX IF NOT EXISTS idx_attendance_monthly_cache_user_id ON attendance_monthly_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_monthly_cache_month ON attendance_monthly_cache(month);

CREATE INDEX IF NOT EXISTS idx_change_audit_table_name ON change_audit(table_name);
CREATE INDEX IF NOT EXISTS idx_change_audit_row_id ON change_audit(row_id);
CREATE INDEX IF NOT EXISTS idx_change_audit_user_id ON change_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_change_audit_created_at ON change_audit(created_at);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_rows_updated_at BEFORE UPDATE ON monthly_rows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_entity_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_monthly_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraisal_delays ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_audit ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be refined based on auth requirements)
-- Users can see their own data and their direct reports
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Monthly rows: users can see their own data, managers can see their reports
CREATE POLICY "Users can view own monthly rows" ON monthly_rows
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own draft monthly rows" ON monthly_rows
    FOR UPDATE USING (auth.uid()::text = user_id::text AND status = 'draft');

CREATE POLICY "Users can insert own monthly rows" ON monthly_rows
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Entity mappings: users can see their own mappings
CREATE POLICY "Users can view own entity mappings" ON user_entity_mappings
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Attendance: users can see and update their own attendance
CREATE POLICY "Users can view own attendance" ON attendance_daily
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own attendance" ON attendance_daily
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Comments
COMMENT ON TABLE users IS 'Core user profiles for Employee/Intern/Freelancer with role-based access';
COMMENT ON TABLE entities IS 'Generic entities (Clients/Projects) for user assignment and capacity planning';
COMMENT ON TABLE user_entity_mappings IS 'User-to-entity assignments with capacity targets for accountability scoring';
COMMENT ON TABLE monthly_rows IS 'Monthly summary rows - one per user per month per entity';
COMMENT ON TABLE attendance_daily IS 'Daily attendance tracking for discipline scoring';
COMMENT ON TABLE attendance_monthly_cache IS 'Pre-computed monthly attendance metrics for performance';
COMMENT ON TABLE appraisal_delays IS 'Log of appraisal delays due to insufficient learning or other factors';
COMMENT ON TABLE change_audit IS 'Audit trail for all data changes with before/after snapshots';