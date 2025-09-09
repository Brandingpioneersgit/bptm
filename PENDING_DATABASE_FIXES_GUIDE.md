# Pending Database Fixes Guide

## Overview
There are 2 pending database schema issues that require manual execution via the Supabase Dashboard. Both fixes have been prepared and documented with step-by-step instructions.

## 🔧 Required Fixes

### 1. Foreign Key Relationship Fix (Priority: Medium)
**Issue**: Missing foreign key relationship between `submissions` and `employees` tables
**Status**: ❌ Requires manual execution
**Instructions**: See `FOREIGN_KEY_FIX_INSTRUCTIONS.md`

**Quick Summary**:
- Add `employee_id` column to `submissions` table
- Create foreign key constraint to `employees` table
- Update existing records with proper relationships
- Add performance indexes and triggers

### 2. Month Key Column Addition (Priority: Medium)
**Issue**: Missing `month_key` and `is_submitted` columns in `monthly_form_submissions` table
**Status**: ❌ Requires manual execution
**Instructions**: See `MONTH_KEY_COLUMN_FIX_INSTRUCTIONS.md`

**Quick Summary**:
- Add `month_key` VARCHAR(7) column for YYYY-MM format
- Add `is_submitted` BOOLEAN column for status tracking
- Update existing records with appropriate values
- Add performance indexes

## 🚀 How to Execute Fixes

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Log in to your account
3. Navigate to project: `igwgryykglsetfvomhdj`
4. Click "SQL Editor" in the left sidebar

### Step 2: Execute Foreign Key Fix
1. Open `FOREIGN_KEY_FIX_INSTRUCTIONS.md`
2. Copy the SQL commands from Step 3
3. Paste into Supabase SQL Editor
4. Click "Run" to execute
5. Verify success (should see "Success. No rows returned")

### Step 3: Execute Month Key Fix
1. Open `MONTH_KEY_COLUMN_FIX_INSTRUCTIONS.md`
2. Copy the SQL commands from Step 3
3. Paste into Supabase SQL Editor
4. Click "Run" to execute
5. Verify success (should see "Success. No rows returned")

### Step 4: Verify Fixes
Run the verification scripts:
```bash
# Verify foreign key fix
node verify_foreign_key_fix.js

# Verify month key fix
node execute_month_key_fix.js
```

## 📋 SQL Commands Quick Reference

### Foreign Key Fix SQL
```sql
-- Add employee_id column
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS employee_id UUID;

-- Create index
CREATE INDEX IF NOT EXISTS idx_submissions_employee_id ON public.submissions(employee_id);

-- Update existing records (match by name and phone)
UPDATE public.submissions 
SET employee_id = e.id 
FROM public.employees e 
WHERE submissions.employee_id IS NULL 
AND (submissions.employee_name ILIKE e.name OR submissions.employee_phone = e.phone);

-- Add foreign key constraint
ALTER TABLE public.submissions 
ADD CONSTRAINT fk_submissions_employee_id 
FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;

-- Create trigger function and trigger
-- (See full SQL in FOREIGN_KEY_FIX_INSTRUCTIONS.md)
```

### Month Key Fix SQL
```sql
-- Add month_key column
ALTER TABLE public.monthly_form_submissions 
ADD COLUMN IF NOT EXISTS month_key VARCHAR(7);

-- Update existing records
UPDATE public.monthly_form_submissions 
SET month_key = TO_CHAR(submission_month, 'YYYY-MM')
WHERE month_key IS NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_monthly_form_submissions_month_key 
ON public.monthly_form_submissions(month_key);

-- Add is_submitted column
ALTER TABLE public.monthly_form_submissions 
ADD COLUMN IF NOT EXISTS is_submitted BOOLEAN DEFAULT true;

-- Update is_submitted records
UPDATE public.monthly_form_submissions 
SET is_submitted = (status IN ('submitted', 'reviewed', 'approved'))
WHERE is_submitted IS NULL;

-- Add is_submitted index
CREATE INDEX IF NOT EXISTS idx_monthly_form_submissions_is_submitted 
ON public.monthly_form_submissions(is_submitted);
```

## ⚠️ Important Notes

1. **Backup First**: Supabase automatically handles backups, but be cautious
2. **Execute in Order**: Run foreign key fix first, then month key fix
3. **Check Permissions**: Ensure you have admin access to the Supabase project
4. **Verify Results**: Always run verification scripts after execution
5. **No Downtime**: These operations are safe and won't affect running applications

## 🔍 Troubleshooting

### If Foreign Key Fix Fails:
- Check that `employees` table exists and has data
- Verify `submissions` table structure
- Ensure no conflicting constraints exist

### If Month Key Fix Fails:
- Check that `monthly_form_submissions` table exists
- Verify column names match exactly
- Ensure no duplicate indexes exist

### Common Error Messages:
- `relation "public.table_name" does not exist` → Table missing, check table creation
- `column "column_name" already exists` → Column exists, safe to ignore
- `index "index_name" already exists` → Index exists, safe to ignore

## ✅ Success Indicators

After successful execution, you should see:
- ✅ No error messages in Supabase SQL Editor
- ✅ Verification scripts pass all checks
- ✅ MonthlyFormPrompt component works without errors
- ✅ Submission-employee relationships function properly

## 📞 Support

If you encounter issues:
1. Check the detailed instruction files
2. Verify your Supabase project permissions
3. Ensure you're in the correct project (`igwgryykglsetfvomhdj`)
4. Contact support if problems persist

---

**Next Steps**: After completing these fixes, all pending database schema issues will be resolved and your BPTM dashboard will be fully operational.