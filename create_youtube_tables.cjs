const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createYouTubeTables() {
  console.log('Creating YouTube SEO tables...');
  
  // Create yt_users table
  const createYtUsersSQL = `
    CREATE TABLE IF NOT EXISTS yt_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'tl', 'employee', 'reviewer')),
      department VARCHAR(50) DEFAULT 'YouTube' CHECK (department = 'YouTube'),
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createYtUsersSQL });
    if (error) {
      console.log('Error creating yt_users table:', error.message);
    } else {
      console.log('yt_users table created successfully');
    }
  } catch (e) {
    console.log('Error with yt_users table:', e.message);
  }
  
  // Create yt_channels table
  const createYtChannelsSQL = `
    CREATE TABLE IF NOT EXISTS yt_channels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID REFERENCES clients(id),
      handle VARCHAR(255),
      url VARCHAR(500),
      niche VARCHAR(100),
      client_name VARCHAR(255) NOT NULL,
      client_type VARCHAR(50) NOT NULL CHECK (client_type IN ('Standard', 'Premium', 'Enterprise')),
      scope_of_work TEXT,
      start_date DATE,
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'paused')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createYtChannelsSQL });
    if (error) {
      console.log('Error creating yt_channels table:', error.message);
    } else {
      console.log('yt_channels table created successfully');
    }
  } catch (e) {
    console.log('Error with yt_channels table:', e.message);
  }
  
  // Insert sample YouTube users
  const insertUsersSQL = `
    INSERT INTO yt_users (name, email, role, department) VALUES
    ('Alex Johnson', 'alex.johnson@company.com', 'employee', 'YouTube'),
    ('Sarah Chen', 'sarah.chen@company.com', 'tl', 'YouTube'),
    ('Mike Rodriguez', 'mike.rodriguez@company.com', 'admin', 'YouTube')
    ON CONFLICT (email) DO NOTHING;
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: insertUsersSQL });
    if (error) {
      console.log('Error inserting YouTube users:', error.message);
    } else {
      console.log('YouTube users inserted successfully');
    }
  } catch (e) {
    console.log('Error inserting users:', e.message);
  }
}

createYouTubeTables().then(() => {
  console.log('YouTube tables setup completed');
}).catch(console.error);