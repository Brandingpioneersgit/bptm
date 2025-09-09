# Foreign Key Fix Instructions

## Problem
The `submissions` table lacks a proper foreign key relationship with the `employees` table, causing data integrity issues and making joins difficult.

## Current Status
- ❌ `employee_id` column does not exist in `submissions` table
- ❌ No foreign key constraint between `submissions` and `employees`
- ⚠️ This causes referential integrity issues

## Solution
Execute the SQL script to add the missing foreign key relationship.

## Manual Steps Required

### Step 1: Access Supabase Dashboard
1. Open your browser and go to: https://supabase.com/dashboard
2. Log in to your Supabase account
3. Navigate to your project: `igwgryykglsetfvomhdj`

### Step 2: Open SQL Editor
1. In the left sidebar, click on "SQL Editor"
2. Click "New Query" to create a new SQL query

### Step 3: Execute the Fix
1. Copy the entire contents of the file: `fix_submissions_employees_foreign_key.sql`
2. Paste it into the SQL Editor
3. Click the "Run" button to execute the script

### Step 4: Verify the Fix
After running the SQL script, verify it worked by running:
```bash
node verify_foreign_key_fix.js
```

## What the Fix Will Do

✅ **Add `employee_id` column** to `submissions` table  
✅ **Create foreign key constraint** to `employees` table  
✅ **Populate `employee_id`** for existing submissions  
✅ **Create trigger** to auto-populate `employee_id` for new submissions  
✅ **Add indexes** for better performance  
✅ **Create helpful views** for easier querying  

## Expected Results

After the fix:
- Submissions will have proper referential integrity
- Joins between submissions and employees will be more efficient
- Data consistency will be enforced at the database level
- New submissions will automatically link to employees

## Files Involved

- **SQL Script**: `fix_submissions_employees_foreign_key.sql`
- **Verification**: `verify_foreign_key_fix.js`
- **Status Check**: `execute_foreign_key_sql.js`

## Troubleshooting

If you encounter any errors:
1. Check that you have the correct permissions in Supabase
2. Ensure you're in the correct project
3. Verify the SQL script copied completely
4. Contact support if issues persist

## Next Steps After Fix

1. ✅ Run verification script
2. ✅ Test the application
3. ✅ Update todo list to mark task as completed
4. ✅ Move on to next database schema issue