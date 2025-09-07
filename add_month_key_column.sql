-- Add missing month_key column to monthly_form_submissions table
-- This column is used by MonthlyFormPrompt.jsx to check monthly submissions

ALTER TABLE public.monthly_form_submissions 
ADD COLUMN IF NOT EXISTS month_key VARCHAR(7); -- Format: YYYY-MM

-- Update existing records to populate month_key from submission_month
UPDATE public.monthly_form_submissions 
SET month_key = TO_CHAR(submission_month, 'YYYY-MM')
WHERE month_key IS NULL;

-- Add index for better performance on month_key queries
CREATE INDEX IF NOT EXISTS idx_monthly_form_submissions_month_key 
ON public.monthly_form_submissions(month_key);

-- Add is_submitted column if it doesn't exist (used by MonthlyFormPrompt)
ALTER TABLE public.monthly_form_submissions 
ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN DEFAULT true;

-- Update existing records to set is_submitted based on status
UPDATE public.monthly_form_submissions 
SET is_submitted = (status IN ('submitted', 'reviewed', 'approved'))
WHERE is_submitted IS NULL;

-- Add index for is_submitted column
CREATE INDEX IF NOT EXISTS idx_monthly_form_submissions_is_submitted 
ON public.monthly_form_submissions(is_submitted);

COMMIT;