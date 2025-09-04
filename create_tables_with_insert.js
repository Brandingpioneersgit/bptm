import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://igwgryykglsetfvomhdj.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2dyeXlrZ2xzZXRmdm9taGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTcxMDgsImV4cCI6MjA3MDMzMzEwOH0.yL1hK263qf9msp7K4vUtF4Lvb7x7yxPcyvgkPiLokqA'
);

async function createTablesWithData() {
  try {
    console.log('Attempting to create client_onboarding table by inserting sample data...');
    
    // Try to insert sample data for client_onboarding
    const { data: clientOnboardingData, error: clientOnboardingError } = await supabase
      .from('client_onboarding')
      .insert({
        client_name: 'Sample Client',
        contact_person: 'John Doe',
        email: 'john@sampleclient.com',
        phone: '+1234567890',
        company_size: 'Medium',
        industry: 'Technology',
        website_url: 'https://sampleclient.com',
        service_scope: ['SEO', 'Web Development'],
        budget_range: '$10,000 - $50,000',
        timeline: '3-6 months',
        target_audience: 'Tech professionals',
        submission_status: 'submitted',
        assigned_team: 'Web Team'
      })
      .select();
    
    if (clientOnboardingError) {
      console.log('client_onboarding table does not exist:', clientOnboardingError.message);
      console.log('This table needs to be created manually in Supabase dashboard.');
    } else {
      console.log('client_onboarding table exists and sample data inserted:', clientOnboardingData);
    }
    
    console.log('\nAttempting to create client_payments table by inserting sample data...');
    
    // Try to insert sample data for client_payments
    const { data: clientPaymentsData, error: clientPaymentsError } = await supabase
      .from('client_payments')
      .insert({
        client_name: 'Sample Client',
        amount: 5000.00,
        payment_date: '2024-01-15',
        payment_method: 'Bank Transfer',
        payment_status: 'completed',
        invoice_number: 'INV-001',
        description: 'Monthly retainer payment'
      })
      .select();
    
    if (clientPaymentsError) {
      console.log('client_payments table does not exist:', clientPaymentsError.message);
      console.log('This table needs to be created manually in Supabase dashboard.');
    } else {
      console.log('client_payments table exists and sample data inserted:', clientPaymentsData);
    }
    
    console.log('\n=== SOLUTION ===');
    console.log('The missing tables need to be created manually in the Supabase dashboard.');
    console.log('Please follow these steps:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project: igwgryykglsetfvomhdj');
    console.log('3. Go to SQL Editor');
    console.log('4. Run the SQL commands from the database setup files');
    console.log('\nAlternatively, the application can work with mock data for now.');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

createTablesWithData();