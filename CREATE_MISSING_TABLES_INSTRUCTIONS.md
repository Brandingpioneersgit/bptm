# Create Missing Database Tables - Manual Instructions

## Issue
The application is missing 7 critical database tables causing 404 errors:
- `client_projects`
- `announcements` 
- `events`
- `system_updates`
- `client_payments`
- `web_projects`
- `recurring_clients`

## Solution
Execute the SQL script in Supabase SQL Editor to create all missing tables.

## Step-by-Step Instructions

### 1. Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `igwgryykglsetfvomhdj`
3. Navigate to **SQL Editor** in the left sidebar

### 2. Execute SQL Script
1. Click **"New Query"** in SQL Editor
2. Copy the entire contents of `create_missing_backend_tables.sql`
3. Paste into the SQL Editor
4. Click **"Run"** to execute

### 3. Verify Table Creation
After execution, run this verification query:

```sql
-- Verify all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'client_projects',
    'announcements',
    'events', 
    'system_updates',
    'client_payments',
    'web_projects',
    'recurring_clients'
)
ORDER BY table_name;
```

Expected result: 7 rows showing all table names.

## Tables Being Created

### 1. CLIENT_PROJECTS
- **Purpose**: Client project management and tracking
- **Key Features**: Project status, budget tracking, team assignments
- **Relationships**: Links to `clients` table

### 2. ANNOUNCEMENTS
- **Purpose**: Company-wide announcements and news
- **Key Features**: Priority levels, role-based targeting, scheduling
- **Relationships**: Links to `unified_users` for authors

### 3. EVENTS
- **Purpose**: Company events and calendar management
- **Key Features**: Event scheduling, attendee tracking, reminders
- **Relationships**: Links to `unified_users` for organizers

### 4. SYSTEM_UPDATES
- **Purpose**: System maintenance and update notifications
- **Key Features**: Severity levels, downtime tracking, rollback plans
- **Relationships**: Links to `unified_users` for creators

### 5. CLIENT_PAYMENTS
- **Purpose**: Client payment and billing tracking
- **Key Features**: Payment status, multiple payment methods, invoicing
- **Relationships**: Links to `clients` and `client_projects`

### 6. WEB_PROJECTS
- **Purpose**: Web development project tracking
- **Key Features**: Technology stack, progress tracking, repository links
- **Relationships**: Links to `clients` and `unified_users`

### 7. RECURRING_CLIENTS
- **Purpose**: Recurring client relationships and contracts
- **Key Features**: Service types, payment schedules, auto-renewal
- **Relationships**: Links to `clients` and `unified_users`

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Basic policies allow authenticated users full access
- Policies can be customized later for specific role restrictions

### Indexes
- Performance indexes created for frequently queried columns
- Foreign key indexes for efficient joins
- Status and date indexes for filtering

## Expected Results

After successful execution:

✅ **7 new tables created**
✅ **28 indexes created** for performance
✅ **14 RLS policies created** for security
✅ **404 errors resolved** for missing endpoints
✅ **Application functionality restored**

## Troubleshooting

### Common Issues

1. **"relation already exists" errors**
   - Safe to ignore - tables already exist
   - Script uses `IF NOT EXISTS` clauses

2. **Foreign key constraint errors**
   - Ensure `clients` and `unified_users` tables exist first
   - Check table relationships in error message

3. **Permission denied errors**
   - Ensure you have admin access to Supabase project
   - Use service role key if needed

### Verification Commands

```sql
-- Check table structure
\d client_projects;
\d announcements;
\d events;
\d system_updates;
\d client_payments;
\d web_projects;
\d recurring_clients;

-- Test table access
SELECT COUNT(*) FROM client_projects;
SELECT COUNT(*) FROM announcements;
SELECT COUNT(*) FROM events;
SELECT COUNT(*) FROM system_updates;
SELECT COUNT(*) FROM client_payments;
SELECT COUNT(*) FROM web_projects;
SELECT COUNT(*) FROM recurring_clients;
```

## Next Steps

1. ✅ Execute SQL script in Supabase
2. ✅ Verify all 7 tables created
3. ✅ Test application - 404 errors should be resolved
4. ✅ Run `node check_all_missing_tables.js` to confirm
5. ✅ Update todo list to mark task completed

## Files Affected

- **SQL Script**: `create_missing_backend_tables.sql` (230 lines)
- **Verification**: `check_all_missing_tables.js`
- **Application**: All components using these tables will now work

---

**Note**: This is a critical fix that resolves multiple 404 errors and enables full application functionality. Execute as soon as possible to restore normal operations.