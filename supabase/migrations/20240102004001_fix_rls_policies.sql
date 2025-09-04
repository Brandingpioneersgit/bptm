-- Fix RLS policies to prevent infinite recursion
-- This migration fixes the circular dependency in unified_users policies

BEGIN;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Super Admin full access to users" ON public.unified_users;
DROP POLICY IF EXISTS "Operations Head access to marketing users" ON public.unified_users;
DROP POLICY IF EXISTS "Managers can view team submissions" ON public.monthly_form_submissions;

-- Create simplified policies that don't cause recursion
-- Allow service role full access (for system operations)
CREATE POLICY "Service role full access" ON public.unified_users
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view all users (for now, can be restricted later)
CREATE POLICY "Authenticated users can view users" ON public.unified_users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile using JWT claims
CREATE POLICY "Users can update own profile via JWT" ON public.unified_users
    FOR UPDATE USING (
        auth.jwt() ->> 'user_id' = id::TEXT OR
        auth.jwt() ->> 'email' = email
    );

-- Simplified monthly form submissions policy
CREATE POLICY "Authenticated users can manage submissions" ON public.monthly_form_submissions
    FOR ALL USING (auth.role() = 'authenticated');

COMMIT;