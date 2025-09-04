-- Create login tracking table for security monitoring
CREATE TABLE IF NOT EXISTS login_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- Removed foreign key constraint as users table may not exist
  email TEXT NOT NULL,
  user_type TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  location_data JSONB,
  login_timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT,
  login_status TEXT NOT NULL CHECK (login_status IN ('success', 'failed', 'blocked')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_login_tracking_user_id ON login_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_login_tracking_email ON login_tracking(email);
CREATE INDEX IF NOT EXISTS idx_login_tracking_ip ON login_tracking(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_tracking_timestamp ON login_tracking(login_timestamp);
CREATE INDEX IF NOT EXISTS idx_login_tracking_status ON login_tracking(login_status);

-- Enable Row Level Security
ALTER TABLE login_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own login history
CREATE POLICY "Users can view own login history" ON login_tracking
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Service role can manage all records (for admin access)
CREATE POLICY "Service role full access" ON login_tracking
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "System can insert login records" ON login_tracking
  FOR INSERT WITH CHECK (true);

-- Create function to get client IP (for use in triggers or functions)
CREATE OR REPLACE FUNCTION get_client_ip()
RETURNS INET AS $$
BEGIN
  -- Try to get IP from various headers
  RETURN COALESCE(
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'x-real-ip',
    current_setting('request.headers', true)::json->>'cf-connecting-ip',
    '127.0.0.1'
  )::INET;
EXCEPTION
  WHEN OTHERS THEN
    RETURN '127.0.0.1'::INET;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON login_tracking TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_ip() TO authenticated;