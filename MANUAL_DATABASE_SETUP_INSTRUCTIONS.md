# Manual Database Setup Instructions

## ⚠️ URGENT: Create client_onboarding Table

The `client_onboarding` table doesn't exist in your Supabase database. You need to create it manually for the client onboarding form to work.

### Steps to Create the Table:

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the "SQL Editor" section

2. **Run the Following SQL**
   Copy and paste this complete SQL script:

```sql
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
```

3. **Click "Run" to execute the SQL**

4. **Verify Table Creation**
   - Go to "Table Editor" in Supabase
   - You should see the new `client_onboarding` table
   - It should have all the columns including Indian business fields

### What This Enables:

✅ **Client Onboarding Form** will now save data to the database
✅ **Indian Business Fields** (GSTIN, PAN, State/City selection)
✅ **Healthcare-specific Fields** (Medical licenses, FSSAI, etc.)
✅ **Client Directory** will show live data from onboarding submissions

### Next Steps After Table Creation:

1. Test the client onboarding form at `http://localhost:5173/client-onboarding`
2. Submit a test client to verify database integration
3. Check the client directory at `http://localhost:5173/client-directory` for live data

---

## 🚨 Critical Issues to Address Next:

### 1. Agency Home Dashboard (High Priority)
- Static stats and leaderboards need live Supabase connection
- Buttons don't open modals or forms
- Need to make all tiles/cards functional

### 2. Department Dashboards (High Priority)
- Fix import errors in `/super-admin`, `/hr`, `/manager` routes
- Connect KPIs to real database tables
- Add navigation back to agency home

### 3. All Directories (High Priority)
- Employee, client, and organization directories show static data
- Need live Supabase integration
- Make rows clickable for detailed views

### 4. Profile & Settings (Medium Priority)
- Profile editing not functional
- Settings and password changes don't work
- Need live DB sync for user profiles

### 5. Reporting & Forms (Medium Priority)
- Monthly reports and forms are static
- Need Supabase integration for data persistence
- Add draft saving and progress tracking

### 6. Arcade & Incentives (Low Priority)
- Points earning/redeeming not functional
- Incentive applications don't save
- Need backend integration for all game mechanics

This setup guide addresses the foundational database issue. Once the table is created, we can proceed with fixing the dashboard and directory issues systematically.