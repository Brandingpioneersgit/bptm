import { supabase } from './supabase';

/**
 * Creates the employee_signups table in Supabase if it doesn't exist
 */
export async function ensureEmployeeSignupsTableExists() {
  try {
    // Check if table exists by trying to select from it
    const { data, error } = await supabase
      .from('employee_signups')
      .select('id')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, create it
      console.log('Creating employee_signups table...');
      
      const { error: createError } = await supabase.rpc('create_employee_signups_table');
      
      if (createError) {
        console.error('Error creating employee_signups table:', createError);
        throw createError;
      }
      
      console.log('employee_signups table created successfully');
    } else if (error) {
      console.error('Error checking employee_signups table:', error);
      throw error;
    } else {
      console.log('employee_signups table already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to ensure employee_signups table exists:', error);
    return false;
  }
}

/**
 * SQL function to create the employee_signups table
 * This should be run in Supabase SQL editor or via RPC
 */
export const CREATE_EMPLOYEE_SIGNUPS_TABLE_SQL = `
-- Create employee_signups table
CREATE TABLE IF NOT EXISTS employee_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Personal Information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  
  -- Address Information (stored as JSONB for flexibility)
  address JSONB DEFAULT '{}',
  
  -- Emergency Contact (stored as JSONB)
  emergency_contact JSONB DEFAULT '{}',
  
  -- Professional Information
  department TEXT NOT NULL,
  role TEXT[] NOT NULL, -- Array of roles
  expected_join_date DATE NOT NULL,
  expected_salary TEXT,
  
  -- Education & Experience
  education TEXT NOT NULL,
  experience TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}', -- Array of skills
  certifications TEXT,
  
  -- Additional Information
  portfolio_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  cover_letter TEXT,
  
  -- HR Workflow
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  hr_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_signups_status ON employee_signups(status);
CREATE INDEX IF NOT EXISTS idx_employee_signups_department ON employee_signups(department);
CREATE INDEX IF NOT EXISTS idx_employee_signups_submitted_at ON employee_signups(submitted_at);
CREATE INDEX IF NOT EXISTS idx_employee_signups_email ON employee_signups(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employee_signups_updated_at
  BEFORE UPDATE ON employee_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE employee_signups ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth setup)
-- Allow all operations for now (you may want to restrict this)
CREATE POLICY "Allow all operations on employee_signups" ON employee_signups
  FOR ALL USING (true);

-- Create RPC function to create the table (for programmatic creation)
CREATE OR REPLACE FUNCTION create_employee_signups_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Execute the table creation SQL
  EXECUTE '
    CREATE TABLE IF NOT EXISTS employee_signups (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      date_of_birth DATE,
      address JSONB DEFAULT ''{}'',
      emergency_contact JSONB DEFAULT ''{}'',
      department TEXT NOT NULL,
      role TEXT[] NOT NULL,
      expected_join_date DATE NOT NULL,
      expected_salary TEXT,
      education TEXT NOT NULL,
      experience TEXT NOT NULL,
      skills TEXT[] DEFAULT ''{}'',
      certifications TEXT,
      portfolio_url TEXT,
      linkedin_url TEXT,
      github_url TEXT,
      cover_letter TEXT,
      status TEXT DEFAULT ''pending'' CHECK (status IN (''pending'', ''approved'', ''rejected'')),
      hr_notes TEXT,
      reviewed_at TIMESTAMPTZ,
      reviewed_by TEXT,
      submitted_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_employee_signups_status ON employee_signups(status);
    CREATE INDEX IF NOT EXISTS idx_employee_signups_department ON employee_signups(department);
    CREATE INDEX IF NOT EXISTS idx_employee_signups_submitted_at ON employee_signups(submitted_at);
    CREATE INDEX IF NOT EXISTS idx_employee_signups_email ON employee_signups(email);
    
    ALTER TABLE employee_signups ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Allow all operations on employee_signups" ON employee_signups;
    CREATE POLICY "Allow all operations on employee_signups" ON employee_signups FOR ALL USING (true);
  ';
END;
$$;
`;

/**
 * Initialize the employee signups system
 */
export async function initializeEmployeeSignupsSystem() {
  try {
    console.log('Initializing employee signups system...');
    
    const tableExists = await ensureEmployeeSignupsTableExists();
    
    if (tableExists) {
      console.log('Employee signups system initialized successfully');
      return true;
    } else {
      console.error('Failed to initialize employee signups system');
      return false;
    }
  } catch (error) {
    console.error('Error initializing employee signups system:', error);
    return false;
  }
}

/**
 * Get all employee signups with optional filtering
 */
export async function getEmployeeSignups(filters = {}) {
  try {
    let query = supabase
      .from('employee_signups')
      .select('*')
      .order('submitted_at', { ascending: false });
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.department) {
      query = query.eq('department', filters.department);
    }
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching employee signups:', error);
    return [];
  }
}

/**
 * Create a new employee signup
 */
export async function createEmployeeSignup(signupData) {
  try {
    const { data, error } = await supabase
      .from('employee_signups')
      .insert([{
        ...signupData,
        submitted_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating employee signup:', error);
    throw error;
  }
}

/**
 * Update employee signup status (approve/reject)
 */
export async function updateEmployeeSignupStatus(signupId, status, hrNotes, reviewedBy) {
  try {
    const { data, error } = await supabase
      .from('employee_signups')
      .update({
        status,
        hr_notes: hrNotes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy
      })
      .eq('id', signupId)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error updating employee signup status:', error);
    throw error;
  }
}

/**
 * Get signup statistics
 */
export async function getSignupStatistics() {
  try {
    const { data, error } = await supabase
      .from('employee_signups')
      .select('status');
    
    if (error) throw error;
    
    const stats = {
      total: data.length,
      pending: data.filter(s => s.status === 'pending').length,
      approved: data.filter(s => s.status === 'approved').length,
      rejected: data.filter(s => s.status === 'rejected').length
    };
    
    return stats;
  } catch (error) {
    console.error('Error fetching signup statistics:', error);
    return { total: 0, pending: 0, approved: 0, rejected: 0 };
  }
}