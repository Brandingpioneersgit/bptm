-- Fix missing auth_user_id column in unified_users table
-- This script adds the auth_user_id column that references Supabase auth.users

BEGIN;

-- Add the missing auth_user_id column
ALTER TABLE public.unified_users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_unified_users_auth_user_id ON public.unified_users(auth_user_id);

-- Update RLS policies to use auth_user_id instead of user_id
DROP POLICY IF EXISTS "Users can view own profile" ON public.unified_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.unified_users;

-- Create new policies using auth_user_id
CREATE POLICY "Users can view own profile" ON public.unified_users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON public.unified_users
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Managers can view team members" ON public.unified_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.unified_users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.user_category IN ('management', 'admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can manage all users" ON public.unified_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.unified_users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.user_category IN ('admin', 'super_admin')
        )
    );

COMMIT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'unified_users' 
AND table_schema = 'public'
AND column_name = 'auth_user_id';