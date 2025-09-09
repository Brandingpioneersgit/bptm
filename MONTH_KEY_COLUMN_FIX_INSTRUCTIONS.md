# Month Key Column Fix Instructions

## Problem
The `monthly_form_submissions` table is missing the `month_key` and `is_submitted` columns that are required by the `MonthlyFormPrompt.jsx` component.

## Current Status
- ❌ `month_key` column does not exist in `monthly_form_submissions` table
- ❌ `is_submitted` column does not exist in `monthly_form_submissions` table
- ✅ Table exists with 0 records
- ⚠️ This causes errors in the MonthlyFormPrompt component

## Error Messages
```
column monthly_form_submissions.month_key does not exist
column monthly_form_submissions.is_submitted does not exist
```

## Solution
Execute the SQL script to add the missing columns and indexes.

## Manual Steps Required

### Step 1: Access Supabase Dashboard
1. Open your browser and go to: https://supabase.com/dashboard
2. Log in to your Supabase account
3. Navigate to your project: `igwgryykglsetfvomhdj`

### Step 2: Open SQL Editor
1. In the left sidebar, click on "SQL Editor"
2. Click "New Query" to create a new SQL query

### Step 3: Execute the Fix
Copy and paste the following SQL commands into the SQL Editor and click "Run":

```sql
-- Add month_key column
ALTER TABLE public.monthly_form_submissions 
ADD COLUMN IF NOT EXISTS month_key VARCHAR(7);

-- Update existing records to populate month_key from submission_month
UPDATE public.monthly_form_submissions 
SET month_key = TO_CHAR(submission_month, 'YYYY-MM')
WHERE month_key IS NULL;

-- Add index for better performance on month_key queries
CREATE INDEX IF NOT EXISTS idx_monthly_form_submissions_month_key 
ON public.monthly_form_submissions(month_key);

-- Add is_submitted column (used by MonthlyFormPrompt)
ALTER TABLE public.monthly_form_submissions 
ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN DEFAULT true;

-- Update existing records to set is_submitted based on status
UPDATE public.monthly_form_submissions 
SET is_submitted = (status IN ('submitted', 'reviewed', 'approved'))
WHERE is_submitted IS NULL;

-- Add index for is_submitted column
CREATE INDEX IF NOT EXISTS idx_monthly_form_submissions_is_submitted 
ON public.monthly_form_submissions(is_submitted);
```

### Step 4: Verify the Fix
After running the SQL script, you can verify it worked by:
1. Checking the table structure in the Supabase Dashboard
2. Testing the MonthlyFormPrompt component in the application

## What the Fix Will Do

✅ **Add `month_key` column** (VARCHAR(7)) to store month in YYYY-MM format  
✅ **Add `is_submitted` column** (BOOLEAN) to track submission status  
✅ **Populate existing records** with appropriate values  
✅ **Add performance indexes** for faster queries  
✅ **Enable MonthlyFormPrompt.jsx** to work without errors  

## Expected Results

After the fix:
- MonthlyFormPrompt component will work without column errors
- Month-based queries will be more efficient
- Submission status tracking will be more reliable
- Better performance with proper indexing

## Files Affected

- **MonthlyFormPrompt.jsx**: Uses month_key and is_submitted columns
- **monthlyReportService.js**: Queries monthly_form_submissions
- **MonthlySummaryTable.jsx**: Displays monthly submission data

## SQL Script Files

- **Main Script**: `add_month_key_column.sql`
- **Instructions**: `MONTH_KEY_MIGRATION_INSTRUCTIONS.md`
- **Status Check**: `execute_month_key_fix.js`

## Troubleshooting

If you encounter any errors:
1. Check that you have the correct permissions in Supabase
2. Ensure you're in the correct project
3. Verify the SQL script copied completely
4. Check that the `monthly_form_submissions` table exists
5. Contact support if issues persist

## Next Steps After Fix

1. ✅ Test MonthlyFormPrompt component
2. ✅ Verify monthly submission queries work
3. ✅ Update todo list to mark task as completed
4. ✅ Move on to next database schema issue

## Component Dependencies

The following components depend on these columns:
- `MonthlyFormPrompt.jsx` - Primary user of month_key and is_submitted
- `monthlyReportService.js` - Service layer for monthly data
- `MonthlySummaryTable.jsx` - Display component for monthly data