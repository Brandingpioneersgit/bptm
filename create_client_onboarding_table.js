import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the original SQL file and extract CREATE TABLE statement
const createTableSQL = `
CREATE TABLE IF NOT EXISTS public.client_onboarding (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    industry VARCHAR(100),
    website_url VARCHAR(255),
    business_address TEXT,
    
    -- Indian Business Fields
    gstin VARCHAR(15),
    pan_number VARCHAR(10),
    state VARCHAR(100),
    city VARCHAR(100),
    pincode VARCHAR(10),
    business_registration_type VARCHAR(100),
    udyam_registration VARCHAR(20),
    
    -- Healthcare-specific fields
    medical_council_registration VARCHAR(50),
    clinical_establishment_license VARCHAR(50),
    drug_license VARCHAR(50),
    nabh_jci_accreditation VARCHAR(50),
    fssai_license VARCHAR(20),
    biomedical_waste_authorization VARCHAR(50),
    
    -- Service Selection
    services_needed TEXT[],
    service_scopes JSONB,
    
    -- Contact Information
    primary_contact_name VARCHAR(255),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(20),
    secondary_contact_name VARCHAR(255),
    secondary_contact_email VARCHAR(255),
    secondary_contact_phone VARCHAR(20),
    
    -- Website and Technical Access
    website_access_available BOOLEAN DEFAULT false,
    website_username VARCHAR(255),
    website_password VARCHAR(255),
    hosting_provider VARCHAR(255),
    domain_registrar VARCHAR(255),
    
    -- Google Services Access
    google_analytics_access BOOLEAN DEFAULT false,
    google_search_console_access BOOLEAN DEFAULT false,
    google_ads_access BOOLEAN DEFAULT false,
    google_my_business_access BOOLEAN DEFAULT false,
    
    -- SEO and Marketing Services
    seo_audit_needed BOOLEAN DEFAULT false,
    keyword_research_needed BOOLEAN DEFAULT false,
    content_marketing_needed BOOLEAN DEFAULT false,
    local_seo_needed BOOLEAN DEFAULT false,
    
    -- Advertising Details
    current_advertising_budget DECIMAL(10,2),
    advertising_goals TEXT,
    target_audience TEXT,
    
    -- Social Media and Content Management
    social_media_management_needed BOOLEAN DEFAULT false,
    content_creation_needed BOOLEAN DEFAULT false,
    social_platforms TEXT[],
    
    -- Business Understanding
    business_goals TEXT,
    target_market TEXT,
    unique_selling_proposition TEXT,
    main_competitors TEXT,
    
    -- Target Audience
    target_age_group VARCHAR(50),
    target_gender VARCHAR(20),
    target_income_level VARCHAR(50),
    target_location VARCHAR(255),
    target_interests TEXT,
    
    -- Customer Psychology
    customer_pain_points TEXT,
    customer_motivations TEXT,
    customer_buying_behavior TEXT,
    
    -- Follow-up
    preferred_contact_method VARCHAR(50),
    best_time_to_contact VARCHAR(100),
    additional_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_onboarding_email ON public.client_onboarding(email);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_gstin ON public.client_onboarding(gstin);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_pan ON public.client_onboarding(pan_number);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_state ON public.client_onboarding(state);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_city ON public.client_onboarding(city);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_industry ON public.client_onboarding(industry);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_created_at ON public.client_onboarding(created_at);

-- Add comments for documentation
COMMENT ON TABLE public.client_onboarding IS 'Client onboarding form data with Indian business compliance fields';
COMMENT ON COLUMN public.client_onboarding.gstin IS 'Goods and Services Tax Identification Number (15 characters)';
COMMENT ON COLUMN public.client_onboarding.pan_number IS 'Permanent Account Number (10 characters)';
COMMENT ON COLUMN public.client_onboarding.udyam_registration IS 'Udyam Registration Number for MSMEs';
COMMENT ON COLUMN public.client_onboarding.medical_council_registration IS 'Medical Council registration for healthcare providers';
COMMENT ON COLUMN public.client_onboarding.fssai_license IS 'Food Safety and Standards Authority of India license';
`;

async function createClientOnboardingTable() {
  try {
    console.log('🚀 Creating client_onboarding table with Indian business fields...');
    
    // Split the SQL into individual statements
    const statements = createTableSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n${i + 1}. Executing: ${statement.substring(0, 100)}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception executing statement ${i + 1}:`, err.message);
        // Continue with other statements
      }
    }
    
    // Test if table was created successfully
    console.log('\n🔍 Testing table creation...');
    const { data, error } = await supabase
      .from('client_onboarding')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table creation failed:', error.message);
      console.log('\n📋 Manual SQL to run in Supabase SQL Editor:');
      console.log(createTableSQL);
    } else {
      console.log('✅ client_onboarding table created successfully!');
      console.log('🎉 All Indian business fields are now available in the database.');
    }
    
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    console.log('\n📋 Manual SQL to run in Supabase SQL Editor:');
    console.log(createTableSQL);
  }
}

// Run the creation
createClientOnboardingTable();