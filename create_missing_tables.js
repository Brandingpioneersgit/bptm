import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://igwgryykglsetfvomhdj.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2dyeXlrZ2xzZXRmdm9taGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTcxMDgsImV4cCI6MjA3MDMzMzEwOH0.yL1hK263qf9msp7K4vUtF4Lvb7x7yxPcyvgkPiLokqA'
);

async function createMissingTables() {
  try {
    console.log('Creating client_onboarding table...');
    
    // Create client_onboarding table
    const { data: clientOnboardingResult, error: clientOnboardingError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.client_onboarding (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_name VARCHAR(255) NOT NULL,
          contact_person VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(20),
          company_size VARCHAR(50),
          industry VARCHAR(100),
          website_url TEXT,
          service_scope TEXT[],
          budget_range VARCHAR(100),
          timeline VARCHAR(100),
          target_audience TEXT,
          target_occupation VARCHAR(100),
          top_services TEXT[],
          customer_learning_points TEXT[],
          customer_questions TEXT[],
          education_topics TEXT[],
          keywords TEXT[],
          customer_fears TEXT[],
          customer_pain_points TEXT[],
          customer_problems TEXT[],
          customer_desires TEXT[],
          review_meeting_date DATE,
          submission_status VARCHAR(50) DEFAULT 'submitted',
          assigned_team VARCHAR(100),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.client_onboarding ENABLE ROW LEVEL SECURITY;
        
        -- Create policy to allow all operations for now
        CREATE POLICY IF NOT EXISTS "Allow all operations on client_onboarding" ON public.client_onboarding
        FOR ALL USING (true) WITH CHECK (true);
      `
    });
    
    if (clientOnboardingError) {
      console.error('Error creating client_onboarding table:', clientOnboardingError);
    } else {
      console.log('client_onboarding table created successfully');
    }
    
    console.log('\nCreating client_payments table...');
    
    // Create client_payments table
    const { data: clientPaymentsResult, error: clientPaymentsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.client_payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id UUID,
          client_name VARCHAR(255) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          payment_date DATE NOT NULL,
          payment_method VARCHAR(50),
          payment_status VARCHAR(50) DEFAULT 'pending',
          invoice_number VARCHAR(100),
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE public.client_payments ENABLE ROW LEVEL SECURITY;
        
        -- Create policy to allow all operations for now
        CREATE POLICY IF NOT EXISTS "Allow all operations on client_payments" ON public.client_payments
        FOR ALL USING (true) WITH CHECK (true);
      `
    });
    
    if (clientPaymentsError) {
      console.error('Error creating client_payments table:', clientPaymentsError);
    } else {
      console.log('client_payments table created successfully');
    }
    
    console.log('\nVerifying tables...');
    
    // Verify tables exist
    const { data: clientOnboarding, error: e1 } = await supabase
      .from('client_onboarding')
      .select('*')
      .limit(1);
    
    const { data: clientPayments, error: e2 } = await supabase
      .from('client_payments')
      .select('*')
      .limit(1);
    
    console.log('client_onboarding accessible:', !e1);
    console.log('client_payments accessible:', !e2);
    
    if (e1) console.log('client_onboarding error:', e1.message);
    if (e2) console.log('client_payments error:', e2.message);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

createMissingTables();