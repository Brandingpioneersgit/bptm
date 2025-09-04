-- Migration: create_tools_table
-- Source: 06_create_tools_table.sql
-- Timestamp: 20240102000800

-- =============================================
-- Master Tools Table Creation Script
-- =============================================
-- This script creates the tools table for the Master Tools Library feature
-- Run this in Supabase SQL Editor to enable database persistence for tools

-- Drop table if it exists (uncomment if you need to recreate)
-- DROP TABLE IF EXISTS public.tools CASCADE;

-- Create tools table
CREATE TABLE IF NOT EXISTS public.tools (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('free', 'premium', 'enterprise')),
    department VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    youtube_url VARCHAR(500),
    website VARCHAR(500),
    remarks TEXT,
    submitted_by VARCHAR(255) NOT NULL,
    submitted_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tags JSONB DEFAULT '[]'::jsonb,
    credentials JSONB DEFAULT '{"username": "", "password": ""}'::jsonb,
    shareable_link VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tools_category ON public.tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_department ON public.tools(department);
CREATE INDEX IF NOT EXISTS idx_tools_active ON public.tools(is_active);
CREATE INDEX IF NOT EXISTS idx_tools_submitted_date ON public.tools(submitted_date);
CREATE INDEX IF NOT EXISTS idx_tools_tags ON public.tools USING GIN(tags);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tools_updated_at
    BEFORE UPDATE ON public.tools
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow authenticated users to read all tools
CREATE POLICY "Allow authenticated users to read tools" ON public.tools
    FOR SELECT TO authenticated
    USING (true);

-- Allow authenticated users to insert tools
CREATE POLICY "Allow authenticated users to insert tools" ON public.tools
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Allow users to update tools they submitted
CREATE POLICY "Allow users to update their own tools" ON public.tools
    FOR UPDATE TO authenticated
    USING (submitted_by = auth.jwt() ->> 'email' OR submitted_by = auth.jwt() ->> 'user_metadata' ->> 'name');

-- Allow managers to update any tool (you may need to adjust this based on your auth setup)
CREATE POLICY "Allow managers to update any tool" ON public.tools
    FOR UPDATE TO authenticated
    USING (true); -- Adjust this condition based on your role system

-- Allow users to delete tools they submitted
CREATE POLICY "Allow users to delete their own tools" ON public.tools
    FOR DELETE TO authenticated
    USING (submitted_by = auth.jwt() ->> 'email' OR submitted_by = auth.jwt() ->> 'user_metadata' ->> 'name');

-- Allow managers to delete any tool
CREATE POLICY "Allow managers to delete any tool" ON public.tools
    FOR DELETE TO authenticated
    USING (true); -- Adjust this condition based on your role system

-- Insert sample data
INSERT INTO public.tools (name, category, department, description, youtube_url, website, remarks, submitted_by, submitted_date, tags, credentials, shareable_link) VALUES
('Canva', 'free', 'Design', 'Free graphic design tool for creating marketing materials, social media posts, and presentations', 'https://youtube.com/watch?v=dQw4w9WgXcQ', 'https://canva.com', 'Great for quick social media posts and basic design work', 'Sarah Wilson', '2024-01-15', '["design", "graphics", "templates"]'::jsonb, '{"username": "company@canva.com", "password": "CanvaTeam2024"}'::jsonb, 'https://canva.com/brand/join/team-bptm-2024'),

('Adobe Creative Suite', 'premium', 'Design', 'Professional design software suite including Photoshop, Illustrator, and InDesign', 'https://youtube.com/watch?v=oHg5SJYRHA0', 'https://adobe.com', 'Company license available for all designers. Industry standard for professional work', 'Mike Chen', '2024-01-10', '["design", "professional", "creative"]'::jsonb, '{"username": "bptm-creative@adobe.com", "password": "AdobeCreative2024!"}'::jsonb, 'https://adobe.com/teams/bptm-creative-suite'),

('Figma', 'free', 'Design', 'Collaborative interface design tool for creating wireframes, prototypes, and UI designs', 'https://youtube.com/watch?v=FTFaQWZBqQ8', 'https://figma.com', 'Excellent for team collaboration and real-time design feedback', 'Emma Davis', '2024-01-20', '["design", "collaboration", "prototyping"]'::jsonb, '{"username": "bptm-design@figma.com", "password": "FigmaDesign2024"}'::jsonb, 'https://figma.com/team/bptm-design-team'),

('HubSpot', 'premium', 'Marketing', 'All-in-one marketing, sales, and customer service platform', 'https://youtube.com/watch?v=xvFZjo5PgG0', 'https://hubspot.com', 'Comprehensive CRM solution with excellent analytics and automation', 'Alex Johnson', '2024-01-25', '["marketing", "crm", "automation"]'::jsonb, '{"username": "bptm-marketing@hubspot.com", "password": "HubSpotCRM2024!"}'::jsonb, 'https://app.hubspot.com/team/bptm-marketing'),

('Slack', 'free', 'Management', 'Team communication and collaboration platform', 'https://youtube.com/watch?v=9RJZMSsH7-g', 'https://slack.com', 'Essential for team communication and project coordination', 'Lisa Brown', '2024-02-01', '["communication", "collaboration", "productivity"]'::jsonb, '{"username": "bptm.slack.com", "password": "SlackTeam2024"}'::jsonb, 'https://bptm.slack.com/join/shared_invite/zt-team2024');

-- Create a view for easy querying
CREATE OR REPLACE VIEW public.tools_summary AS
SELECT 
    id,
    name,
    category,
    department,
    description,
    submitted_by,
    submitted_date,
    array_length(tags::text[]::text[], 1) as tag_count,
    CASE WHEN credentials->>'username' != '' THEN true ELSE false END as has_credentials,
    CASE WHEN shareable_link IS NOT NULL AND shareable_link != '' THEN true ELSE false END as has_shareable_link,
    is_active,
    created_at
FROM public.tools
ORDER BY submitted_date DESC;

-- Grant permissions on the view
GRANT SELECT ON public.tools_summary TO authenticated;

-- Success message
SELECT 'Tools table created successfully! 🛠️' as status;