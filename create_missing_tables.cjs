const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMissingTables() {
  try {
    console.log('🚀 Creating missing database tables...');
    
    // Create client_onboarding table using raw SQL
    const clientOnboardingSQL = `
      CREATE TABLE IF NOT EXISTS public.client_onboarding (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        industry VARCHAR(100),
        website_url VARCHAR(255),
        business_address TEXT,
        gstin VARCHAR(15),
        pan_number VARCHAR(10),
        state VARCHAR(100),
        city VARCHAR(100),
        pincode VARCHAR(10),
        business_registration_type VARCHAR(100),
        udyam_registration VARCHAR(20),
        medical_council_registration VARCHAR(50),
        clinical_establishment_license VARCHAR(50),
        drug_license VARCHAR(50),
        nabh_jci_accreditation VARCHAR(50),
        fssai_license VARCHAR(20),
        biomedical_waste_authorization VARCHAR(50),
        services_needed TEXT[],
        service_scopes JSONB,
        primary_contact_name VARCHAR(255),
        primary_contact_email VARCHAR(255),
        primary_contact_phone VARCHAR(20),
        secondary_contact_name VARCHAR(255),
        secondary_contact_email VARCHAR(255),
        secondary_contact_phone VARCHAR(20),
        website_access_available BOOLEAN DEFAULT false,
        website_username VARCHAR(255),
        website_password VARCHAR(255),
        hosting_provider VARCHAR(255),
        domain_registrar VARCHAR(255),
        google_analytics_access BOOLEAN DEFAULT false,
        google_ads_access BOOLEAN DEFAULT false,
        social_media_access JSONB,
        current_marketing_efforts TEXT,
        marketing_budget VARCHAR(100),
        target_audience TEXT,
        target_age_group VARCHAR(50),
        target_gender VARCHAR(20),
        target_income_level VARCHAR(50),
        target_location VARCHAR(255),
        target_interests TEXT,
        customer_pain_points TEXT,
        customer_motivations TEXT,
        customer_buying_behavior TEXT,
        preferred_contact_method VARCHAR(50),
        best_time_to_contact VARCHAR(100),
        additional_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log('📋 Creating client_onboarding table...');
    console.log('SQL to execute in Supabase SQL Editor:');
    console.log(clientOnboardingSQL);
    
    // Try to create the table by inserting a test record (this will create the table if it doesn't exist)
    const testData = {
      client_name: 'Test Client',
      email: 'test@example.com',
      phone: '+91-9999999999',
      industry: 'Technology',
      services_needed: ['Web Development'],
      created_at: new Date().toISOString()
    };
    
    // First, let's try to insert test data to see if table exists
    const { data: insertData, error: insertError } = await supabase
      .from('client_onboarding')
      .insert([testData])
      .select();
      
    if (insertError) {
      console.log('❌ client_onboarding table does not exist or has issues:', insertError.message);
      console.log('\n🔧 Please manually create the table using the SQL above in your Supabase SQL Editor.');
    } else {
      console.log('✅ client_onboarding table exists and working!');
      console.log('📊 Test data inserted:', insertData);
      
      // Clean up test data
      await supabase
        .from('client_onboarding')
        .delete()
        .eq('email', 'test@example.com');
      console.log('🧹 Test data cleaned up');
    }
    
    // Test all critical tables
    console.log('\n🔍 Testing all critical tables...');
    
    const tables = [
      'employees',
      'clients', 
      'submissions',
      'client_onboarding'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`❌ Table '${table}':`, error.message);
        } else {
          console.log(`✅ Table '${table}': accessible (${data?.length || 0} records found)`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createMissingTables();