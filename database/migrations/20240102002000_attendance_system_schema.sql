-- Migration: attendance_system_schema
-- Source: 18_attendance_system_schema.sql
-- Timestamp: 20240102002000

-- Attendance System Schema for Monthly Operating System
-- Supports daily attendance capture, monthly calculations, and discipline scoring

-- Calendar configuration table for India timezone rules
CREATE TABLE calendar_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    alternate_saturdays_off TEXT[] DEFAULT ARRAY['2', '4'], -- Which Saturdays are off (2nd, 4th)
    holidays DATE[] DEFAULT ARRAY[]::DATE[], -- Admin-managed holidays
    wfh_counts_as_presence BOOLEAN DEFAULT FALSE, -- Admin switch for WFH counting
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(year)
);

-- Daily attendance capture
CREATE TABLE daily_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    presence TEXT NOT NULL CHECK (presence IN ('office', 'wfh', 'leave', 'off')),
    morning_meeting_attended BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Monthly attendance cache (computed nightly)
CREATE TABLE monthly_attendance_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    
    -- Calendar calculations
    working_days_expected INTEGER NOT NULL DEFAULT 0,
    total_days_in_month INTEGER NOT NULL DEFAULT 0,
    sundays_count INTEGER NOT NULL DEFAULT 0,
    off_saturdays_count INTEGER NOT NULL DEFAULT 0,
    holidays_count INTEGER NOT NULL DEFAULT 0,
    
    -- Attendance metrics
    office_days_present INTEGER NOT NULL DEFAULT 0,
    wfh_days INTEGER NOT NULL DEFAULT 0,
    leaves INTEGER NOT NULL DEFAULT 0,
    off_days INTEGER NOT NULL DEFAULT 0,
    
    -- Meeting attendance
    office_days_with_meeting INTEGER NOT NULL DEFAULT 0,
    
    -- Calculated rates (0.0 to 1.0)
    office_attendance_rate DECIMAL(5,4) DEFAULT 0.0,
    meeting_attendance_rate DECIMAL(5,4) DEFAULT 0.0,
    
    -- Discipline component (0-10)
    discipline_component DECIMAL(3,1) DEFAULT 0.0,
    
    -- Metadata
    last_computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, year, month)
);

-- Indexes for performance
CREATE INDEX idx_daily_attendance_user_date ON daily_attendance(user_id, date);
CREATE INDEX idx_daily_attendance_date ON daily_attendance(date);
CREATE INDEX idx_monthly_attendance_cache_user_month ON monthly_attendance_cache(user_id, year, month);
CREATE INDEX idx_calendar_config_year ON calendar_config(year);

-- RLS Policies
ALTER TABLE calendar_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_attendance_cache ENABLE ROW LEVEL SECURITY;

-- Calendar config: Only admins can modify, everyone can read
CREATE POLICY "calendar_config_read" ON calendar_config
    FOR SELECT USING (true);

CREATE POLICY "calendar_config_admin_write" ON calendar_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'Manager'
        )
    );

-- Daily attendance: Users can manage their own, managers can view all
CREATE POLICY "daily_attendance_own" ON daily_attendance
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "daily_attendance_manager_read" ON daily_attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'Manager'
        )
    );

-- Monthly cache: Users can read their own, managers can read all
CREATE POLICY "monthly_attendance_cache_own" ON monthly_attendance_cache
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "monthly_attendance_cache_manager_read" ON monthly_attendance_cache
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'Manager'
        )
    );

-- System can update cache
CREATE POLICY "monthly_attendance_cache_system_write" ON monthly_attendance_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.user_type = 'Manager'
        )
    );

-- Insert default calendar config for current year
INSERT INTO calendar_config (year, alternate_saturdays_off, holidays, wfh_counts_as_presence)
VALUES (
    EXTRACT(YEAR FROM NOW())::INTEGER,
    ARRAY['2', '4'],
    ARRAY[]::DATE[],
    FALSE
) ON CONFLICT (year) DO NOTHING;

-- Function to get working days for a month
CREATE OR REPLACE FUNCTION get_working_days_in_month(
    p_year INTEGER,
    p_month INTEGER
) RETURNS INTEGER AS $$
DECLARE
    total_days INTEGER;
    sundays_count INTEGER;
    off_saturdays_count INTEGER;
    holidays_count INTEGER;
    config_rec RECORD;
    working_days INTEGER;
BEGIN
    -- Get calendar config
    SELECT * INTO config_rec FROM calendar_config WHERE year = p_year;
    
    -- If no config found, use defaults
    IF NOT FOUND THEN
        config_rec.alternate_saturdays_off := ARRAY['2', '4'];
        config_rec.holidays := ARRAY[]::DATE[];
    END IF;
    
    -- Total days in month
    total_days := EXTRACT(DAY FROM (DATE(p_year || '-' || p_month || '-01') + INTERVAL '1 month - 1 day'));
    
    -- Count Sundays
    SELECT COUNT(*) INTO sundays_count
    FROM generate_series(
        DATE(p_year || '-' || p_month || '-01'),
        DATE(p_year || '-' || p_month || '-01') + INTERVAL '1 month - 1 day',
        '1 day'::INTERVAL
    ) AS day_series
    WHERE EXTRACT(DOW FROM day_series) = 0; -- Sunday = 0
    
    -- Count off Saturdays (2nd and 4th by default)
    SELECT COUNT(*) INTO off_saturdays_count
    FROM generate_series(
        DATE(p_year || '-' || p_month || '-01'),
        DATE(p_year || '-' || p_month || '-01') + INTERVAL '1 month - 1 day',
        '1 day'::INTERVAL
    ) AS day_series
    WHERE EXTRACT(DOW FROM day_series) = 6 -- Saturday = 6
    AND (
        (EXTRACT(DAY FROM day_series)::INTEGER BETWEEN 8 AND 14 AND '2' = ANY(config_rec.alternate_saturdays_off))
        OR (EXTRACT(DAY FROM day_series)::INTEGER BETWEEN 22 AND 28 AND '4' = ANY(config_rec.alternate_saturdays_off))
    );
    
    -- Count holidays in the month
    SELECT COUNT(*) INTO holidays_count
    FROM unnest(config_rec.holidays) AS holiday
    WHERE EXTRACT(YEAR FROM holiday) = p_year
    AND EXTRACT(MONTH FROM holiday) = p_month;
    
    working_days := total_days - sundays_count - off_saturdays_count - holidays_count;
    
    RETURN GREATEST(working_days, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to compute monthly attendance for a user
CREATE OR REPLACE FUNCTION compute_monthly_attendance(
    p_user_id UUID,
    p_year INTEGER,
    p_month INTEGER
) RETURNS VOID AS $$
DECLARE
    working_days INTEGER;
    office_days INTEGER;
    wfh_days INTEGER;
    leaves INTEGER;
    off_days INTEGER;
    office_with_meeting INTEGER;
    office_rate DECIMAL(5,4);
    meeting_rate DECIMAL(5,4);
    discipline_score DECIMAL(3,1);
    base_score DECIMAL(3,1);
    bonus_score DECIMAL(3,1);
BEGIN
    -- Get working days
    working_days := get_working_days_in_month(p_year, p_month);
    
    -- Count attendance by type
    SELECT 
        COALESCE(SUM(CASE WHEN presence = 'office' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN presence = 'wfh' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN presence = 'leave' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN presence = 'off' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN presence = 'office' AND morning_meeting_attended = true THEN 1 ELSE 0 END), 0)
    INTO office_days, wfh_days, leaves, off_days, office_with_meeting
    FROM daily_attendance
    WHERE user_id = p_user_id
    AND EXTRACT(YEAR FROM date) = p_year
    AND EXTRACT(MONTH FROM date) = p_month;
    
    -- Calculate rates
    office_rate := CASE WHEN working_days > 0 THEN office_days::DECIMAL / working_days ELSE 0 END;
    meeting_rate := CASE WHEN office_days > 0 THEN office_with_meeting::DECIMAL / office_days ELSE 0 END;
    
    -- Calculate discipline component (0-10)
    IF office_rate = 1.0 AND meeting_rate >= 0.95 THEN
        discipline_score := 10.0;
    ELSE
        base_score := office_rate * 8.0;
        bonus_score := LEAST(meeting_rate * 2.0, 2.0);
        discipline_score := LEAST(ROUND(base_score + bonus_score, 1), 10.0);
    END IF;
    
    -- Upsert monthly cache
    INSERT INTO monthly_attendance_cache (
        user_id, year, month,
        working_days_expected,
        total_days_in_month,
        office_days_present,
        wfh_days,
        leaves,
        off_days,
        office_days_with_meeting,
        office_attendance_rate,
        meeting_attendance_rate,
        discipline_component,
        last_computed_at
    ) VALUES (
        p_user_id, p_year, p_month,
        working_days,
        EXTRACT(DAY FROM (DATE(p_year || '-' || p_month || '-01') + INTERVAL '1 month - 1 day'))::INTEGER,
        office_days,
        wfh_days,
        leaves,
        off_days,
        office_with_meeting,
        office_rate,
        meeting_rate,
        discipline_score,
        NOW()
    ) ON CONFLICT (user_id, year, month) DO UPDATE SET
        working_days_expected = EXCLUDED.working_days_expected,
        total_days_in_month = EXCLUDED.total_days_in_month,
        office_days_present = EXCLUDED.office_days_present,
        wfh_days = EXCLUDED.wfh_days,
        leaves = EXCLUDED.leaves,
        off_days = EXCLUDED.off_days,
        office_days_with_meeting = EXCLUDED.office_days_with_meeting,
        office_attendance_rate = EXCLUDED.office_attendance_rate,
        meeting_attendance_rate = EXCLUDED.meeting_attendance_rate,
        discipline_component = EXCLUDED.discipline_component,
        last_computed_at = EXCLUDED.last_computed_at,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to recompute monthly attendance when daily attendance changes
CREATE OR REPLACE FUNCTION trigger_recompute_monthly_attendance()
RETURNS TRIGGER AS $$
BEGIN
    -- Recompute for the affected month
    IF TG_OP = 'DELETE' THEN
        PERFORM compute_monthly_attendance(
            OLD.user_id,
            EXTRACT(YEAR FROM OLD.date)::INTEGER,
            EXTRACT(MONTH FROM OLD.date)::INTEGER
        );
        RETURN OLD;
    ELSE
        PERFORM compute_monthly_attendance(
            NEW.user_id,
            EXTRACT(YEAR FROM NEW.date)::INTEGER,
            EXTRACT(MONTH FROM NEW.date)::INTEGER
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_attendance_recompute_trigger
    AFTER INSERT OR UPDATE OR DELETE ON daily_attendance
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recompute_monthly_attendance();

COMMENT ON TABLE calendar_config IS 'Calendar configuration for India timezone with configurable alternate Saturdays and holidays';
COMMENT ON TABLE daily_attendance IS 'Daily attendance capture with presence type and meeting attendance';
COMMENT ON TABLE monthly_attendance_cache IS 'Monthly attendance calculations cached for performance';
COMMENT ON FUNCTION get_working_days_in_month IS 'Calculate working days in a month based on calendar rules';
COMMENT ON FUNCTION compute_monthly_attendance IS 'Compute monthly attendance metrics and discipline score for a user';