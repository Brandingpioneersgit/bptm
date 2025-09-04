import { createClient } from '@supabase/supabase-js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://igwgryykglsetfvomhdj.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2dyeXlrZ2xzZXRmdm9taGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTcxMDgsImV4cCI6MjA3MDMzMzEwOH0.yL1hK263qf9msp7K4vUtF4Lvb7x7yxPcyvgkPiLokqA'
);

console.log('Connecting to Supabase URL:', process.env.VITE_SUPABASE_URL || 'https://igwgryykglsetfvomhdj.supabase.co');

async function checkTables() {
  try {
    console.log('Checking client_onboarding table...');
    const { data: clientOnboarding, error: e1 } = await supabase
      .from('client_onboarding')
      .select('*')
      .limit(1);
    
    if (e1) {
      console.log('client_onboarding error:', e1.message);
    } else {
      console.log('client_onboarding exists and accessible');
    }
    
    console.log('\nChecking submissions table...');
    const { data: submissions, error: e2 } = await supabase
      .from('submissions')
      .select('*')
      .limit(1);
    
    if (e2) {
      console.log('submissions error:', e2.message);
    } else {
      console.log('submissions exists and accessible');
    }
    
    console.log('\nChecking client_payments table...');
    const { data: clientPayments, error: e3 } = await supabase
      .from('client_payments')
      .select('*')
      .limit(1);
    
    if (e3) {
      console.log('client_payments error:', e3.message);
    } else {
      console.log('client_payments exists and accessible');
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkTables();