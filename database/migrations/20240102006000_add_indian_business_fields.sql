-- Migration: add_indian_business_fields
-- Timestamp: 20240102006000
-- Description: Add Indian business-specific fields to client_onboarding table

BEGIN;

-- Add Indian business details columns to client_onboarding table
ALTER TABLE public.client_onboarding 
ADD COLUMN IF NOT EXISTS gstin VARCHAR(15),
ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS pincode VARCHAR(10),
ADD COLUMN IF NOT EXISTS business_registration_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS udyam_registration VARCHAR(20),
ADD COLUMN IF NOT EXISTS medical_council_registration VARCHAR(50),
ADD COLUMN IF NOT EXISTS clinical_establishment_license VARCHAR(50),
ADD COLUMN IF NOT EXISTS drug_license VARCHAR(50),
ADD COLUMN IF NOT EXISTS nabh_jci_accreditation VARCHAR(50),
ADD COLUMN IF NOT EXISTS fssai_license VARCHAR(20),
ADD COLUMN IF NOT EXISTS biomedical_waste_authorization VARCHAR(50);

-- Add comments for documentation
COMMENT ON COLUMN public.client_onboarding.gstin IS 'Goods and Services Tax Identification Number';
COMMENT ON COLUMN public.client_onboarding.pan_number IS 'Permanent Account Number';
COMMENT ON COLUMN public.client_onboarding.state IS 'Indian state where business is located';
COMMENT ON COLUMN public.client_onboarding.city IS 'City where business is located';
COMMENT ON COLUMN public.client_onboarding.pincode IS 'Postal code';
COMMENT ON COLUMN public.client_onboarding.business_registration_type IS 'Type of business registration (Private Limited, LLP, etc.)';
COMMENT ON COLUMN public.client_onboarding.udyam_registration IS 'Udyam Registration Number for MSMEs';
COMMENT ON COLUMN public.client_onboarding.medical_council_registration IS 'Medical Council Registration for healthcare businesses';
COMMENT ON COLUMN public.client_onboarding.clinical_establishment_license IS 'Clinical Establishment License for healthcare facilities';
COMMENT ON COLUMN public.client_onboarding.drug_license IS 'Drug License for pharmaceutical businesses';
COMMENT ON COLUMN public.client_onboarding.nabh_jci_accreditation IS 'NABH/JCI Accreditation for healthcare quality';
COMMENT ON COLUMN public.client_onboarding.fssai_license IS 'Food Safety and Standards Authority of India License';
COMMENT ON COLUMN public.client_onboarding.biomedical_waste_authorization IS 'Biomedical Waste Management Authorization';

-- Add indexes for commonly searched fields
CREATE INDEX IF NOT EXISTS idx_client_onboarding_gstin ON public.client_onboarding(gstin);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_pan ON public.client_onboarding(pan_number);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_state ON public.client_onboarding(state);
CREATE INDEX IF NOT EXISTS idx_client_onboarding_city ON public.client_onboarding(city);

COMMIT;

-- Success message
SELECT 'Indian business fields added to client_onboarding table successfully!' as result;