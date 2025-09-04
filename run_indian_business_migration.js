import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Running Indian business fields migration...');
    
    // Define the ALTER TABLE statements
    const alterStatements = [
      'ALTER TABLE public.client_onboarding ADD COLUMN IF NOT EXISTS gstin VARCHAR(15)',
      'ALTER TABLE public.client_onboarding ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10)',
      'ALTER TABLE public.client_onboarding ADD COLUMN IF NOT EXISTS state VARCHAR(100)',
      'ALTER TABLE public.client_onboarding ADD COLUMN IF NOT EXISTS city VARCHAR(100)',
      'ALTER TABLE public.client_onboarding ADD COLUMN IF NOT EXISTS pincode VARCHAR(10)',
      'ALTER TABLE public.client_onboarding ADD COLUMN IF NOT EXISTS business_registration_type VARCHAR(50)',
      'ALTER TABLE public.client_onboarding ADD COLUMN IF NOT EXISTS udyam_registration VARCHAR(20)',
      'ALTER TABLE public.client_onboarding ADD COLUMN IF NOT EXISTS medical_council_registration VARCHAR(50)',
      'ALTER TABLE public.client_onboarding ADD COLUMN IF NOT EXISTS clinical_establishment_license VARCHAR(50)',
      'ALTER TABLE public.client_onboarding ADD COLUMN IF NOT EXISTS drug_license VARCHAR(50)',
      'ALTER TABLE public.client_onboarding ADD COLUMN IF NOT EXISTS nabh_jci_accreditation VARCHAR(50)',
      'ALTER TABLE public.client_onboarding ADD COLUMN IF NOT EXISTS fssai_license VARCHAR(20)',
      'ALTER TABLE public.client_onboarding ADD COLUMN IF NOT EXISTS biomedical_waste_authorization VARCHAR(50)'
    ];
    
    // Execute each statement
    for (const statement of alterStatements) {
      console.log(`Executing: ${statement}`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement
      });
      
      if (error) {
        console.error(`❌ Error executing statement: ${statement}`);
        console.error('Error details:', error);
        // Continue with other statements
      } else {
        console.log('✅ Statement executed successfully');
      }
    }
    
    console.log('✅ Migration completed!');
    console.log('Indian business fields have been added to client_onboarding table.');
    
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    process.exit(1);
  }
}

// Run the migration
runMigration();