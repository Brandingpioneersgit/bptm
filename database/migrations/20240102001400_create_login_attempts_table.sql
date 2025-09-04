-- Migration: create_login_attempts_table
-- Source: 11_create_login_attempts_table.sql
-- Timestamp: 20240102001400

-- Create login_attempts table for authentication security tracking
-- This table tracks login attempts, failed logins, and security events for rate limiting and monitoring

CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User identification
    attempted_username VARCHAR(255), -- Username/name attempted
    attempted_phone VARCHAR(20), -- Phone number attempted
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('employee', 'manager', 'intern')),
    
    -- Attempt details
    attempt_status VARCHAR(20) NOT NULL CHECK (attempt_status IN (
        'success', 'failed_credentials', 'failed_rate_limit', 'failed_validation',
        'failed_inactive', 'failed_blocked', 'failed_system_error'
    )),
    failure_reason VARCHAR(200), -- Detailed failure reason
    
    -- Security context
    ip_address INET,
    user_agent TEXT,
    browser_fingerprint VARCHAR(255),
    device_info JSONB, -- Device type, OS, browser details
    
    -- Geographic and network info
    country_code VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    timezone VARCHAR(50),
    isp VARCHAR(200),
    
    -- Security flags
    is_suspicious BOOLEAN DEFAULT false,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    blocked_by_rate_limit BOOLEAN DEFAULT false,
    requires_verification BOOLEAN DEFAULT false,
    
    -- Session information (if successful)
    session_id UUID, -- Reference to user_sessions table
    session_duration INTEGER, -- How long the session lasted (in seconds)
    
    -- Rate limiting data
    attempts_in_window INTEGER DEFAULT 1, -- Number of attempts in current time window
    rate_limit_window_start TIMESTAMP WITH TIME ZONE,
    rate_limit_reset_at TIMESTAMP WITH TIME ZONE,
    
    -- Security events
    security_events JSONB, -- Array of security-related events during login
    captcha_required BOOLEAN DEFAULT false,
    captcha_solved BOOLEAN DEFAULT false,
    two_factor_required BOOLEAN DEFAULT false,
    two_factor_verified BOOLEAN DEFAULT false,
    
    -- Audit and tracking
    attempt_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance and security queries
CREATE INDEX IF NOT EXISTS idx_login_attempts_username ON login_attempts(attempted_username);
CREATE INDEX IF NOT EXISTS idx_login_attempts_phone ON login_attempts(attempted_phone);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_timestamp ON login_attempts(attempt_timestamp);
CREATE INDEX IF NOT EXISTS idx_login_attempts_status ON login_attempts(attempt_status);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_type ON login_attempts(user_type);
CREATE INDEX IF NOT EXISTS idx_login_attempts_suspicious ON login_attempts(is_suspicious);
CREATE INDEX IF NOT EXISTS idx_login_attempts_risk_score ON login_attempts(risk_score);

-- Create composite indexes for rate limiting and security
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_timestamp ON login_attempts(ip_address, attempt_timestamp);
CREATE INDEX IF NOT EXISTS idx_login_attempts_username_timestamp ON login_attempts(attempted_username, attempt_timestamp);
CREATE INDEX IF NOT EXISTS idx_login_attempts_phone_timestamp ON login_attempts(attempted_phone, attempt_timestamp);
CREATE INDEX IF NOT EXISTS idx_login_attempts_status_timestamp ON login_attempts(attempt_status, attempt_timestamp);

-- Enable Row Level Security
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only managers can view login attempts
CREATE POLICY "Managers can view login attempts" ON login_attempts
    FOR SELECT USING (
        current_setting('app.user_type', true) = 'manager'
    );

-- System can insert login attempts (no user context required)
CREATE POLICY "System can insert login attempts" ON login_attempts
    FOR INSERT WITH CHECK (true);

-- Create function to record login attempt
CREATE OR REPLACE FUNCTION record_login_attempt(
    p_attempted_username VARCHAR(255) DEFAULT NULL,
    p_attempted_phone VARCHAR(20) DEFAULT NULL,
    p_user_type VARCHAR(20),
    p_attempt_status VARCHAR(20),
    p_failure_reason VARCHAR(200) DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    attempt_id UUID;
    current_attempts INTEGER;
    window_start TIMESTAMP WITH TIME ZONE;
    risk_score_calc INTEGER := 0;
BEGIN
    -- Calculate risk score based on recent attempts
    SELECT COUNT(*), MIN(attempt_timestamp)
    INTO current_attempts, window_start
    FROM login_attempts
    WHERE (
        (p_attempted_username IS NOT NULL AND attempted_username = p_attempted_username)
        OR (p_attempted_phone IS NOT NULL AND attempted_phone = p_attempted_phone)
        OR (p_ip_address IS NOT NULL AND ip_address = p_ip_address)
    )
    AND attempt_timestamp >= NOW() - INTERVAL '1 hour'
    AND attempt_status LIKE 'failed_%';
    
    -- Calculate risk score
    risk_score_calc := LEAST(current_attempts * 10, 100);
    
    -- Insert the login attempt
    INSERT INTO login_attempts (
        attempted_username, attempted_phone, user_type,
        attempt_status, failure_reason, ip_address, user_agent,
        session_id, attempts_in_window, rate_limit_window_start,
        rate_limit_reset_at, risk_score, is_suspicious,
        blocked_by_rate_limit
    ) VALUES (
        p_attempted_username, p_attempted_phone, p_user_type,
        p_attempt_status, p_failure_reason, p_ip_address, p_user_agent,
        p_session_id, current_attempts + 1, COALESCE(window_start, NOW()),
        NOW() + INTERVAL '1 hour', risk_score_calc, risk_score_calc > 30,
        current_attempts >= 5
    )
    RETURNING id INTO attempt_id;
    
    RETURN attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_username VARCHAR(255) DEFAULT NULL,
    p_phone VARCHAR(20) DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_time_window_minutes INTEGER DEFAULT 60,
    p_max_attempts INTEGER DEFAULT 5
)
RETURNS TABLE(
    is_rate_limited BOOLEAN,
    attempts_count INTEGER,
    reset_time TIMESTAMP WITH TIME ZONE,
    risk_level VARCHAR(20)
) AS $$
DECLARE
    recent_attempts INTEGER;
    latest_attempt TIMESTAMP WITH TIME ZONE;
    reset_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Count recent failed attempts
    SELECT COUNT(*), MAX(attempt_timestamp)
    INTO recent_attempts, latest_attempt
    FROM login_attempts
    WHERE (
        (p_username IS NOT NULL AND attempted_username = p_username)
        OR (p_phone IS NOT NULL AND attempted_phone = p_phone)
        OR (p_ip_address IS NOT NULL AND ip_address = p_ip_address)
    )
    AND attempt_timestamp >= NOW() - (p_time_window_minutes || ' minutes')::INTERVAL
    AND attempt_status LIKE 'failed_%';
    
    -- Calculate reset time
    reset_timestamp := COALESCE(latest_attempt, NOW()) + (p_time_window_minutes || ' minutes')::INTERVAL;
    
    RETURN QUERY SELECT 
        recent_attempts >= p_max_attempts as is_rate_limited,
        COALESCE(recent_attempts, 0) as attempts_count,
        reset_timestamp as reset_time,
        CASE 
            WHEN recent_attempts >= p_max_attempts THEN 'high'
            WHEN recent_attempts >= (p_max_attempts * 0.7) THEN 'medium'
            WHEN recent_attempts >= (p_max_attempts * 0.4) THEN 'low'
            ELSE 'normal'
        END as risk_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get security analytics
CREATE OR REPLACE FUNCTION get_security_analytics(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '7 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE(
    total_attempts BIGINT,
    successful_logins BIGINT,
    failed_attempts BIGINT,
    success_rate DECIMAL(5,2),
    unique_ips BIGINT,
    suspicious_attempts BIGINT,
    rate_limited_attempts BIGINT,
    top_failure_reasons JSONB,
    hourly_distribution JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH attempt_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE attempt_status = 'success') as successful,
            COUNT(*) FILTER (WHERE attempt_status LIKE 'failed_%') as failed,
            COUNT(DISTINCT ip_address) as unique_ips,
            COUNT(*) FILTER (WHERE is_suspicious = true) as suspicious,
            COUNT(*) FILTER (WHERE blocked_by_rate_limit = true) as rate_limited
        FROM login_attempts
        WHERE attempt_timestamp BETWEEN start_date AND end_date
    ),
    failure_reasons AS (
        SELECT 
            failure_reason,
            COUNT(*) as count
        FROM login_attempts
        WHERE attempt_timestamp BETWEEN start_date AND end_date
          AND attempt_status LIKE 'failed_%'
          AND failure_reason IS NOT NULL
        GROUP BY failure_reason
        ORDER BY count DESC
        LIMIT 10
    ),
    hourly_stats AS (
        SELECT 
            EXTRACT(HOUR FROM attempt_timestamp) as hour,
            COUNT(*) as attempts
        FROM login_attempts
        WHERE attempt_timestamp BETWEEN start_date AND end_date
        GROUP BY EXTRACT(HOUR FROM attempt_timestamp)
        ORDER BY hour
    )
    SELECT 
        s.total::BIGINT as total_attempts,
        s.successful::BIGINT as successful_logins,
        s.failed::BIGINT as failed_attempts,
        CASE WHEN s.total > 0 THEN (s.successful * 100.0 / s.total)::DECIMAL(5,2) ELSE 0 END as success_rate,
        s.unique_ips::BIGINT as unique_ips,
        s.suspicious::BIGINT as suspicious_attempts,
        s.rate_limited::BIGINT as rate_limited_attempts,
        (
            SELECT JSONB_OBJECT_AGG(failure_reason, count)
            FROM failure_reasons
        ) as top_failure_reasons,
        (
            SELECT JSONB_OBJECT_AGG(hour, attempts)
            FROM hourly_stats
        ) as hourly_distribution
    FROM attempt_stats s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user login history
CREATE OR REPLACE FUNCTION get_user_login_history(
    p_username VARCHAR(255) DEFAULT NULL,
    p_phone VARCHAR(20) DEFAULT NULL,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    attempt_timestamp TIMESTAMP WITH TIME ZONE,
    attempt_status VARCHAR(20),
    failure_reason VARCHAR(200),
    ip_address INET,
    user_agent TEXT,
    risk_score INTEGER,
    session_duration INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        la.attempt_timestamp,
        la.attempt_status,
        la.failure_reason,
        la.ip_address,
        la.user_agent,
        la.risk_score,
        la.session_duration
    FROM login_attempts la
    WHERE (
        (p_username IS NOT NULL AND la.attempted_username = p_username)
        OR (p_phone IS NOT NULL AND la.attempted_phone = p_phone)
    )
    AND la.attempt_timestamp >= NOW() - (days_back || ' days')::INTERVAL
    ORDER BY la.attempt_timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up old login attempts
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts(
    retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM login_attempts
    WHERE attempt_timestamp < NOW() - (retention_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to detect suspicious patterns
CREATE OR REPLACE FUNCTION detect_suspicious_activity(
    time_window_hours INTEGER DEFAULT 24
)
RETURNS TABLE(
    pattern_type VARCHAR(50),
    description TEXT,
    affected_count INTEGER,
    risk_level VARCHAR(20),
    details JSONB
) AS $$
BEGIN
    -- Multiple failed attempts from same IP
    RETURN QUERY
    SELECT 
        'multiple_ip_failures'::VARCHAR(50) as pattern_type,
        'Multiple failed login attempts from same IP address'::TEXT as description,
        COUNT(*)::INTEGER as affected_count,
        CASE WHEN COUNT(*) > 20 THEN 'high' WHEN COUNT(*) > 10 THEN 'medium' ELSE 'low' END::VARCHAR(20) as risk_level,
        JSONB_BUILD_OBJECT(
            'ip_address', ip_address,
            'attempts', COUNT(*),
            'time_span', MAX(attempt_timestamp) - MIN(attempt_timestamp)
        ) as details
    FROM login_attempts
    WHERE attempt_timestamp >= NOW() - (time_window_hours || ' hours')::INTERVAL
      AND attempt_status LIKE 'failed_%'
      AND ip_address IS NOT NULL
    GROUP BY ip_address
    HAVING COUNT(*) >= 5;
    
    -- Rapid succession attempts
    RETURN QUERY
    SELECT 
        'rapid_succession'::VARCHAR(50) as pattern_type,
        'Rapid succession login attempts'::TEXT as description,
        COUNT(*)::INTEGER as affected_count,
        'high'::VARCHAR(20) as risk_level,
        JSONB_BUILD_OBJECT(
            'username', attempted_username,
            'phone', attempted_phone,
            'attempts', COUNT(*),
            'time_span_minutes', EXTRACT(EPOCH FROM (MAX(attempt_timestamp) - MIN(attempt_timestamp))) / 60
        ) as details
    FROM login_attempts
    WHERE attempt_timestamp >= NOW() - INTERVAL '1 hour'
      AND attempt_status LIKE 'failed_%'
    GROUP BY attempted_username, attempted_phone
    HAVING COUNT(*) >= 10
       AND EXTRACT(EPOCH FROM (MAX(attempt_timestamp) - MIN(attempt_timestamp))) < 600; -- 10 minutes
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample login attempts data
INSERT INTO login_attempts (
    attempted_username, user_type, attempt_status, ip_address, user_agent
) VALUES
('John Doe', 'employee', 'success', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'),
('Jane Smith', 'manager', 'success', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
('Invalid User', 'employee', 'failed_credentials', '192.168.1.102', 'Mozilla/5.0 (Linux; Android 10)'),
('Mike Johnson', 'employee', 'failed_validation', '192.168.1.103', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON login_attempts TO authenticated;
GRANT EXECUTE ON FUNCTION record_login_attempt(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INET, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(VARCHAR, VARCHAR, INET, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_security_analytics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_login_history(VARCHAR, VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_login_attempts(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_suspicious_activity(INTEGER) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE login_attempts IS 'Tracks all login attempts for security monitoring and rate limiting';
COMMENT ON COLUMN login_attempts.attempt_status IS 'Status of the login attempt (success, failed_credentials, etc.)';
COMMENT ON COLUMN login_attempts.risk_score IS 'Calculated risk score based on attempt patterns (0-100)';
COMMENT ON COLUMN login_attempts.attempts_in_window IS 'Number of attempts in current rate limiting window';
COMMENT ON FUNCTION record_login_attempt(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, INET, TEXT, UUID) IS 'Records a login attempt with security context';
COMMENT ON FUNCTION check_rate_limit(VARCHAR, VARCHAR, INET, INTEGER, INTEGER) IS 'Checks if user/IP is rate limited';
COMMENT ON FUNCTION get_security_analytics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) IS 'Returns comprehensive security analytics';
COMMENT ON FUNCTION detect_suspicious_activity(INTEGER) IS 'Detects suspicious login patterns';