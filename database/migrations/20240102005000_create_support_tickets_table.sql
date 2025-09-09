-- Migration: create_support_tickets_table
-- Source: support_tickets_schema.sql
-- Timestamp: 20240102005000

-- =====================================================
-- SUPPORT TICKETS TABLE - Schema for Issue Reporting
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- This creates the support_tickets table for storing user-reported issues

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ticket Information
  issue_type TEXT NOT NULL CHECK (issue_type IN ('bug', 'feature_request', 'help', 'account', 'other')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Bug-specific fields
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  
  -- System Information
  current_url TEXT,
  browser_info TEXT,
  user_email TEXT,
  
  -- Error Context (for GlobalErrorHandler integration)
  error_message TEXT,
  error_stack TEXT,
  error_component_stack TEXT,
  
  -- Ticket Status and Assignment
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- User who created the ticket
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_issue_type ON public.support_tickets(issue_type);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_by ON public.support_tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at);

-- Enable Row Level Security
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view and create their own tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Admins and managers can view and manage all tickets
CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.unified_users
            WHERE id = auth.uid()
            AND user_category IN ('admin', 'super_admin', 'management')
        )
    );

-- Support staff can view and update assigned tickets
CREATE POLICY "Support staff can manage assigned tickets" ON public.support_tickets
    FOR UPDATE USING (assigned_to = auth.uid());

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Set resolved_at when status changes to resolved or closed
    IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN
        NEW.resolved_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_support_ticket_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_support_ticket_updated_at();

-- Grant permissions
GRANT SELECT, INSERT ON public.support_tickets TO authenticated;
GRANT UPDATE ON public.support_tickets TO authenticated;

-- Insert some sample data for testing
INSERT INTO public.support_tickets (
    issue_type, priority, subject, description, status, user_email
) VALUES 
(
    'bug',
    'medium',
    'Sample Bug Report',
    'This is a sample bug report for testing the support ticket system.',
    'open',
    'test@example.com'
),
(
    'feature_request',
    'low',
    'Sample Feature Request',
    'This is a sample feature request for testing the support ticket system.',
    'open',
    'test@example.com'
);

-- Success message
SELECT 'Support tickets table created successfully! 🎫' as status;

-- Display table info
SELECT 
    'Support Tickets Table Info:' as info,
    COUNT(*) as total_tickets,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
    COUNT(CASE WHEN issue_type = 'bug' THEN 1 END) as bug_reports,
    COUNT(CASE WHEN issue_type = 'feature_request' THEN 1 END) as feature_requests
FROM public.support_tickets;