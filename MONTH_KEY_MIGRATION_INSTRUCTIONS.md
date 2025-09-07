# Month Key Column Migration Instructions

## Issue
The `monthly_form_submissions` table is missing the `month_key` column that is required by the `MonthlyFormPrompt.jsx` component. This causes errors when checking monthly submissions.

## Error Message
```
column monthly_form_submissions.month_key does not exist
```

## Solution
Execute the following SQL commands in your Supabase SQL Editor:

### Step 1: Add month_key column
```sql
ALTER TABLE public.monthly_form_submissions
ADD COLUMN IF NOT EXISTS month_key VARCHAR(7);
```

### Step 2: Update existing records
```sql
UPDATE public.monthly_form_submissions
SET month_key = TO_CHAR(submission_month, 'YYYY-MM')
WHERE month_key IS NULL;
```

### Step 3: Add is_submitted column (also required by MonthlyFormPrompt)
```sql
ALTER TABLE public.monthly_form_submissions
ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN DEFAULT true;
```

### Step 4: Update is_submitted values
```sql
UPDATE public.monthly_form_submissions
SET is_submitted = (status IN ('submitted', 'reviewed', 'approved'))
WHERE is_submitted IS NULL;
```

### Step 5: Add performance indexes
```sql
CREATE INDEX IF NOT EXISTS idx_monthly_form_submissions_month_key
ON public.monthly_form_submissions(month_key);

CREATE INDEX IF NOT EXISTS idx_monthly_form_submissions_is_submitted
ON public.monthly_form_submissions(is_submitted);
```

## How to Execute
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the above SQL commands
4. Execute them one by one or all at once

## Verification
After executing the migration, the `MonthlyFormPrompt.jsx` component should work without errors when checking monthly submissions.

## Files Affected
- `src/components/MonthlyFormPrompt.jsx` - Uses month_key and is_submitted columns
- `database/migrations/20240102004000_unified_auth_schema.sql` - Original table definition
- Various service files that query monthly_form_submissions

## Migration Script
A migration script has been created at `execute_month_key_migration.cjs` that can be run to display these instructions.