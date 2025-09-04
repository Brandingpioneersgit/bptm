import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runHRTablesScript() {
  try {
    console.log('Reading HR tables SQL script...');
    const sqlScript = fs.readFileSync(path.join(__dirname, 'database/scripts/create_hr_tables.sql'), 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== 'COMMIT');
    
    console.log(`Found ${statements.length} SQL statements to execute...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
          
          if (error) {
            console.error(`Error in statement ${i + 1}:`, error.message);
            // Try direct query for some statements
            const { data: directData, error: directError } = await supabase
              .from('information_schema.tables')
              .select('*')
              .limit(1);
            
            if (directError) {
              console.error('Direct query also failed:', directError.message);
            }
          } else {
            console.log(`Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`Exception in statement ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('HR tables script execution completed!');
    
    // Verify tables were created
    console.log('\nVerifying HR tables...');
    const hrTables = [
      'hr_employees',
      'employee_documents', 
      'performance_reviews',
      'employee_training',
      'employee_attendance',
      'leave_requests',
      'disciplinary_actions'
    ];
    
    for (const tableName of hrTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`❌ Table ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ Table ${tableName}: Created successfully`);
        }
      } catch (err) {
        console.log(`❌ Table ${tableName}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error running HR tables script:', error.message);
  }
}

runHRTablesScript();