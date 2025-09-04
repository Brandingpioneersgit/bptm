import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const supabaseUrl = 'https://igwgryykglsetfvomhdj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLFile(filePath) {
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    console.log(`Executing ${filePath}...`);
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error(`Error executing ${filePath}:`, error);
      return false;
    }
    
    console.log(`Successfully executed ${filePath}`);
    return true;
  } catch (err) {
    console.error(`Failed to read or execute ${filePath}:`, err);
    return false;
  }
}

async function createWorkspaceTables() {
  console.log('Creating workspace tables...');
  
  const sqlFiles = [
    'src/database/migrations/create_project_workspace_tables.sql',
    'src/database/migrations/workspace_usage_table.sql'
  ];
  
  for (const file of sqlFiles) {
    const success = await executeSQLFile(file);
    if (!success) {
      console.error(`Failed to execute ${file}`);
      process.exit(1);
    }
  }
  
  console.log('All workspace tables created successfully!');
}

// Run the script
createWorkspaceTables().catch(console.error);