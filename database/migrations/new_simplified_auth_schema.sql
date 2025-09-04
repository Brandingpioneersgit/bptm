-- New Simplified Authentication Schema
-- This replaces the complex unified_users and user_accounts system

-- Drop existing complex auth tables if they exist
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS unified_users CASCADE;
DROP TABLE IF EXISTS user_accounts CASCADE;

-- Create simplified users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'employee',
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  needs_password_setup BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create sessions table for secure session management
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);

-- Function to create user from employee onboarding
CREATE OR REPLACE FUNCTION create_user_from_employee(
  p_full_name VARCHAR(255),
  p_phone VARCHAR(20),
  p_email VARCHAR(255) DEFAULT NULL,
  p_role VARCHAR(50) DEFAULT 'employee'
) RETURNS UUID AS $$
DECLARE
  user_id UUID;
  temp_password VARCHAR(255);
BEGIN
  -- Generate temporary password (last 4 digits of phone)
  temp_password := RIGHT(p_phone, 4);
  
  -- Insert new user
  INSERT INTO users (full_name, phone, email, role, password_hash, needs_password_setup)
  VALUES (
    p_full_name,
    p_phone,
    p_email,
    p_role,
    crypt(temp_password, gen_salt('bf')),
    true
  )
  RETURNING id INTO user_id;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to authenticate user
CREATE OR REPLACE FUNCTION authenticate_user(
  p_phone VARCHAR(20),
  p_password VARCHAR(255)
) RETURNS TABLE(
  user_id UUID,
  full_name VARCHAR(255),
  role VARCHAR(50),
  needs_setup BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.full_name, u.role, u.needs_password_setup
  FROM users u
  WHERE u.phone = p_phone
    AND u.password_hash = crypt(p_password, u.password_hash)
    AND u.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to update password
CREATE OR REPLACE FUNCTION update_user_password(
  p_user_id UUID,
  p_new_password VARCHAR(255)
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users
  SET password_hash = crypt(p_new_password, gen_salt('bf')),
      needs_password_setup = false,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to create session
CREATE OR REPLACE FUNCTION create_user_session(
  p_user_id UUID,
  p_session_token VARCHAR(255),
  p_expires_hours INTEGER DEFAULT 24
) RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  -- Clean up expired sessions for this user
  DELETE FROM user_sessions 
  WHERE user_id = p_user_id AND expires_at < NOW();
  
  -- Create new session
  INSERT INTO user_sessions (user_id, session_token, expires_at)
  VALUES (
    p_user_id,
    p_session_token,
    NOW() + INTERVAL '1 hour' * p_expires_hours
  )
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to verify session
CREATE OR REPLACE FUNCTION verify_session(
  p_session_token VARCHAR(255)
) RETURNS TABLE(
  user_id UUID,
  full_name VARCHAR(255),
  role VARCHAR(50),
  email VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.full_name, u.role, u.email
  FROM users u
  JOIN user_sessions s ON u.id = s.user_id
  WHERE s.session_token = p_session_token
    AND s.expires_at > NOW()
    AND u.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (can be expanded based on needs)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (true); -- Allow all for now, can be restricted later

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (true); -- Allow all for now, can be restricted later

-- Insert some test users for development
INSERT INTO users (full_name, phone, email, role, password_hash, needs_password_setup) VALUES
('John Doe', '1234567890', 'john@example.com', 'employee', crypt('7890', gen_salt('bf')), true),
('Jane Manager', '0987654321', 'jane@example.com', 'manager', crypt('4321', gen_salt('bf')), true),
('HR Admin', '5555555555', 'hr@example.com', 'hr', crypt('5555', gen_salt('bf')), true);

-- Verify the setup
SELECT 'Users table created successfully' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT 'Database functions created successfully' as status;