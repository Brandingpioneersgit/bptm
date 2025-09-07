-- Fix Foreign Key Relationship Between Submissions and Employees Tables
-- This script addresses the database schema issue where submissions table
-- lacks a proper foreign key relationship with the employees table

-- =====================================================
-- PROBLEM ANALYSIS:
-- =====================================================
-- 1. submissions table has employee_name and employee_phone but no employee_id
-- 2. employees table has id (UUID) as primary key
-- 3. No foreign key constraint exists between the tables
-- 4. This causes data integrity issues and makes joins difficult

-- =====================================================
-- SOLUTION: Add employee_id column and create foreign key
-- =====================================================

BEGIN;

-- Step 1: Add employee_id column to submissions table
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS employee_id UUID;

-- Step 2: Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_employee_id 
ON public.submissions(employee_id);

-- Step 3: Update existing records to populate employee_id
-- Match submissions to employees based on name and phone
UPDATE public.submissions 
SET employee_id = e.id
FROM public.employees e
WHERE submissions.employee_name = e.name 
  AND submissions.employee_phone = e.phone
  AND submissions.employee_id IS NULL;

-- Step 4: Handle records that couldn't be matched
-- Log unmatched records for manual review
DO $$
DECLARE
    unmatched_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unmatched_count
    FROM public.submissions s
    LEFT JOIN public.employees e ON s.employee_name = e.name AND s.employee_phone = e.phone
    WHERE e.id IS NULL;
    
    IF unmatched_count > 0 THEN
        RAISE NOTICE 'WARNING: % submission records could not be matched to employees', unmatched_count;
        RAISE NOTICE 'These records will need manual review and correction';
        
        -- Create a temporary table to store unmatched records for review
        CREATE TEMP TABLE IF NOT EXISTS unmatched_submissions AS
        SELECT s.id, s.employee_name, s.employee_phone, s.department, s.month_key
        FROM public.submissions s
        LEFT JOIN public.employees e ON s.employee_name = e.name AND s.employee_phone = e.phone
        WHERE e.id IS NULL;
        
        RAISE NOTICE 'Unmatched submissions stored in temp table: unmatched_submissions';
    ELSE
        RAISE NOTICE 'SUCCESS: All submission records successfully matched to employees';
    END IF;
END $$;

-- Step 5: Add foreign key constraint (only for matched records)
-- Note: We'll make this nullable initially to handle unmatched records
ALTER TABLE public.submissions 
ADD CONSTRAINT fk_submissions_employee 
FOREIGN KEY (employee_id) REFERENCES public.employees(id) 
ON DELETE CASCADE;

-- Step 6: Create a function to automatically populate employee_id for new submissions
CREATE OR REPLACE FUNCTION populate_submission_employee_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Try to find matching employee by name and phone
    SELECT id INTO NEW.employee_id
    FROM public.employees
    WHERE name = NEW.employee_name 
      AND phone = NEW.employee_phone
    LIMIT 1;
    
    -- If no match found, log a warning
    IF NEW.employee_id IS NULL THEN
        RAISE WARNING 'Could not find matching employee for submission: name=%, phone=%', 
                     NEW.employee_name, NEW.employee_phone;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to auto-populate employee_id on insert/update
DROP TRIGGER IF EXISTS trigger_populate_submission_employee_id ON public.submissions;
CREATE TRIGGER trigger_populate_submission_employee_id
    BEFORE INSERT OR UPDATE ON public.submissions
    FOR EACH ROW
    WHEN (NEW.employee_id IS NULL AND NEW.employee_name IS NOT NULL)
    EXECUTE FUNCTION populate_submission_employee_id();

-- Step 8: Create a view for easier querying with employee details
CREATE OR REPLACE VIEW submission_details AS
SELECT 
    s.*,
    e.name as verified_employee_name,
    e.phone as verified_employee_phone,
    e.email as employee_email,
    e.department as verified_department,
    e.role as verified_role,
    e.employee_type,
    e.status as employee_status
FROM public.submissions s
LEFT JOIN public.employees e ON s.employee_id = e.id;

-- Step 9: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_employee_name 
ON public.submissions(employee_name);

CREATE INDEX IF NOT EXISTS idx_submissions_employee_phone 
ON public.submissions(employee_phone);

CREATE INDEX IF NOT EXISTS idx_submissions_month_key 
ON public.submissions(month_key);

-- Step 10: Add helpful comments
COMMENT ON COLUMN public.submissions.employee_id IS 'Foreign key reference to employees.id for data integrity';
COMMENT ON TRIGGER trigger_populate_submission_employee_id ON public.submissions IS 'Auto-populates employee_id based on employee_name and employee_phone';
COMMENT ON VIEW submission_details IS 'Combines submission data with verified employee information';

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check foreign key constraint
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'submissions'
  AND tc.table_schema = 'public';

-- Check data integrity
SELECT 
    'Total submissions' as metric,
    COUNT(*) as count
FROM public.submissions
UNION ALL
SELECT 
    'Submissions with employee_id' as metric,
    COUNT(*) as count
FROM public.submissions
WHERE employee_id IS NOT NULL
UNION ALL
SELECT 
    'Submissions without employee_id' as metric,
    COUNT(*) as count
FROM public.submissions
WHERE employee_id IS NULL;

-- Show sample of the new relationship
SELECT 
    s.id as submission_id,
    s.employee_name,
    s.employee_phone,
    s.month_key,
    e.id as employee_id,
    e.name as verified_name,
    e.phone as verified_phone
FROM public.submissions s
LEFT JOIN public.employees e ON s.employee_id = e.id
LIMIT 10;

SELECT 'Database schema fix completed successfully!' as status;