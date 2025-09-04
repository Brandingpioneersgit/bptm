-- Migration: create_user_sessions_table
-- Source: 07_create_user_sessions_table.sql
-- Timestamp: 20240102000900

-- Create user_sessions table for authentication persistence and session management
-- This table stores active user sessions and enables persistent login across browser restarts

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL, -- Can be employee ID, manager token hash, or intern identifier
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('employee', 'manager', 'intern')),
    user_name VARCHAR(255) NOT NULL,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_type ON user_sessions(user_type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_sessions_updated_at
    BEFORE UPDATE ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_sessions_updated_at();

-- Enable Row Level Security
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only access their own sessions
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (
        -- Allow access if user_id matches current user context
        user_id = current_setting('app.current_user_id', true)
        OR 
        -- Allow managers to view all sessions for admin purposes
        current_setting('app.user_type', true) = 'manager'
    );

CREATE POLICY "Users can insert their own sessions" ON user_sessions
    FOR INSERT WITH CHECK (
        user_id = current_setting('app.current_user_id', true)
    );

CREATE POLICY "Users can update their own sessions" ON user_sessions
    FOR UPDATE USING (
        user_id = current_setting('app.current_user_id', true)
        OR 
        current_setting('app.user_type', true) = 'manager'
    );

CREATE POLICY "Users can delete their own sessions" ON user_sessions
    FOR DELETE USING (
        user_id = current_setting('app.current_user_id', true)
        OR 
        current_setting('app.user_type', true) = 'manager'
    );

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR is_active = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate session
CREATE OR REPLACE FUNCTION validate_session(session_id_param VARCHAR(255))
RETURNS TABLE(
    is_valid BOOLEAN,
    user_id VARCHAR(255),
    user_type VARCHAR(50),
    user_name VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (s.id IS NOT NULL AND s.expires_at > NOW() AND s.is_active = true) as is_valid,
        s.user_id,
        s.user_type,
        s.user_name,
        s.expires_at
    FROM user_sessions s
    WHERE s.session_id = session_id_param
    LIMIT 1;
    
    -- Update last_activity if session is valid
    UPDATE user_sessions 
    SET last_activity = NOW()
    WHERE session_id = session_id_param 
      AND expires_at > NOW() 
      AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to extend session
CREATE OR REPLACE FUNCTION extend_session(
    session_id_param VARCHAR(255),
    extension_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    session_exists BOOLEAN;
BEGIN
    UPDATE user_sessions 
    SET 
        expires_at = NOW() + (extension_minutes || ' minutes')::INTERVAL,
        last_activity = NOW()
    WHERE session_id = session_id_param 
      AND expires_at > NOW() 
      AND is_active = true;
    
    GET DIAGNOSTICS session_exists = FOUND;
    
    RETURN session_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data for testing
INSERT INTO user_sessions (session_id, user_id, user_type, user_name, expires_at, ip_address, user_agent) VALUES
('test_session_manager_001', 'manager_admin', 'manager', 'System Manager', NOW() + INTERVAL '24 hours', '127.0.0.1', 'Test Browser Manager'),
('test_session_employee_001', 'emp_001', 'employee', 'John Doe', NOW() + INTERVAL '8 hours', '127.0.0.1', 'Test Browser Employee'),
('test_session_intern_001', 'intern_001', 'intern', 'Jane Smith', NOW() + INTERVAL '4 hours', '127.0.0.1', 'Test Browser Intern')
ON CONFLICT (session_id) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_sessions TO authenticated;
GRANT USAGE ON SEQUENCE user_sessions_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_session(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION extend_session(VARCHAR, INTEGER) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE user_sessions IS 'Stores active user sessions for authentication persistence';
COMMENT ON COLUMN user_sessions.session_id IS 'Unique session identifier generated by frontend';
COMMENT ON COLUMN user_sessions.user_id IS 'User identifier - employee ID, manager token hash, or intern ID';
COMMENT ON COLUMN user_sessions.user_type IS 'Type of user: employee, manager, or intern';
COMMENT ON COLUMN user_sessions.expires_at IS 'When the session expires and should be cleaned up';
COMMENT ON COLUMN user_sessions.last_activity IS 'Last time user performed any action';
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Removes expired and inactive sessions';
COMMENT ON FUNCTION validate_session(VARCHAR) IS 'Validates session and returns user info';
COMMENT ON FUNCTION extend_session(VARCHAR, INTEGER) IS 'Extends session expiry time';