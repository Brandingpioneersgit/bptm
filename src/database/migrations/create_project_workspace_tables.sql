-- Create project workspace system tables
-- This migration creates tables for user projects, tasks, and workspace tracking

-- User Projects Table
CREATE TABLE IF NOT EXISTS user_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE,
    end_date DATE,
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    tags TEXT[], -- Array of project tags
    metadata JSONB DEFAULT '{}', -- Additional project metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Tasks Table
CREATE TABLE IF NOT EXISTS user_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'blocked')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    assigned_to UUID REFERENCES auth.users(id), -- For team tasks
    tags TEXT[], -- Array of task tags
    dependencies UUID[], -- Array of task IDs this task depends on
    metadata JSONB DEFAULT '{}', -- Additional task metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Workspace Access Tracking Table
CREATE TABLE IF NOT EXISTS workspace_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_name VARCHAR(100) NOT NULL,
    workspace_type VARCHAR(50) NOT NULL,
    access_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_duration INTEGER, -- Duration in seconds
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Project Collaborators Table (for team projects)
CREATE TABLE IF NOT EXISTS project_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES user_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions TEXT[] DEFAULT ARRAY['read'], -- Array of permissions
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    UNIQUE(project_id, user_id)
);

-- Task Comments Table
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES user_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    parent_comment_id UUID REFERENCES task_comments(id), -- For threaded comments
    attachments JSONB DEFAULT '[]', -- Array of attachment objects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Templates Table
CREATE TABLE IF NOT EXISTS project_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    role_access TEXT[] DEFAULT ARRAY['all'], -- Roles that can use this template
    template_data JSONB NOT NULL, -- Project structure and default tasks
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_status ON user_projects(status);
CREATE INDEX IF NOT EXISTS idx_user_projects_created_at ON user_projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_project_id ON user_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON user_tasks(status);
CREATE INDEX IF NOT EXISTS idx_user_tasks_due_date ON user_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_user_tasks_created_at ON user_tasks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workspace_access_logs_user_id ON workspace_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_access_logs_access_time ON workspace_access_logs(access_time DESC);
CREATE INDEX IF NOT EXISTS idx_workspace_access_logs_workspace_name ON workspace_access_logs(workspace_name);

CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON project_collaborators(user_id);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(created_at DESC);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_projects_updated_at BEFORE UPDATE ON user_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tasks_updated_at BEFORE UPDATE ON user_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_templates_updated_at BEFORE UPDATE ON project_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Set completed_at when task status changes to completed
CREATE OR REPLACE FUNCTION set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    ELSIF NEW.status != 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_user_tasks_completed_at BEFORE UPDATE ON user_tasks
    FOR EACH ROW EXECUTE FUNCTION set_task_completed_at();

-- Row Level Security (RLS) Policies
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;

-- User Projects Policies
CREATE POLICY "Users can view their own projects" ON user_projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON user_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON user_projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON user_projects
    FOR DELETE USING (auth.uid() = user_id);

-- Collaborators can view projects they're part of
CREATE POLICY "Collaborators can view shared projects" ON user_projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_collaborators 
            WHERE project_id = user_projects.id 
            AND user_id = auth.uid() 
            AND status = 'active'
        )
    );

-- User Tasks Policies
CREATE POLICY "Users can view their own tasks" ON user_tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" ON user_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON user_tasks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON user_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- Assigned users can view and update tasks assigned to them
CREATE POLICY "Assigned users can view tasks" ON user_tasks
    FOR SELECT USING (auth.uid() = assigned_to);

CREATE POLICY "Assigned users can update task status" ON user_tasks
    FOR UPDATE USING (auth.uid() = assigned_to);

-- Workspace Access Logs Policies
CREATE POLICY "Users can view their own access logs" ON workspace_access_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own access logs" ON workspace_access_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Project Collaborators Policies
CREATE POLICY "Project owners can manage collaborators" ON project_collaborators
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_projects 
            WHERE id = project_collaborators.project_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view collaborations they're part of" ON project_collaborators
    FOR SELECT USING (auth.uid() = user_id);

-- Task Comments Policies
CREATE POLICY "Users can view comments on their tasks" ON task_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_tasks 
            WHERE id = task_comments.task_id 
            AND (user_id = auth.uid() OR assigned_to = auth.uid())
        )
    );

CREATE POLICY "Users can create comments on accessible tasks" ON task_comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM user_tasks 
            WHERE id = task_comments.task_id 
            AND (user_id = auth.uid() OR assigned_to = auth.uid())
        )
    );

CREATE POLICY "Users can update their own comments" ON task_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON task_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Project Templates Policies
CREATE POLICY "Users can view public templates" ON project_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own templates" ON project_templates
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create templates" ON project_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" ON project_templates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates" ON project_templates
    FOR DELETE USING (auth.uid() = created_by);

-- Insert some default project templates
INSERT INTO project_templates (name, description, category, role_access, template_data, is_public) VALUES
('Basic Project', 'A simple project template with essential tasks', 'General', ARRAY['all'], '{
  "tasks": [
    {"title": "Project Planning", "description": "Define project scope and requirements", "priority": "high"},
    {"title": "Research & Analysis", "description": "Gather information and analyze requirements", "priority": "medium"},
    {"title": "Implementation", "description": "Execute the main project work", "priority": "high"},
    {"title": "Testing & Review", "description": "Test and review project deliverables", "priority": "medium"},
    {"title": "Project Completion", "description": "Finalize and deliver project", "priority": "high"}
  ]
}', true),

('Web Development Project', 'Template for web development projects', 'Development', ARRAY['Web Developer', 'Freelancer', 'Manager'], '{
  "tasks": [
    {"title": "Requirements Gathering", "description": "Collect and document project requirements", "priority": "high"},
    {"title": "UI/UX Design", "description": "Create wireframes and design mockups", "priority": "high"},
    {"title": "Frontend Development", "description": "Implement user interface", "priority": "high"},
    {"title": "Backend Development", "description": "Develop server-side functionality", "priority": "high"},
    {"title": "Database Setup", "description": "Design and implement database", "priority": "medium"},
    {"title": "Testing", "description": "Perform comprehensive testing", "priority": "high"},
    {"title": "Deployment", "description": "Deploy to production environment", "priority": "medium"}
  ]
}', true),

('Marketing Campaign', 'Template for marketing campaign projects', 'Marketing', ARRAY['Social Media', 'Ads', 'Manager'], '{
  "tasks": [
    {"title": "Campaign Strategy", "description": "Define campaign goals and strategy", "priority": "high"},
    {"title": "Target Audience Research", "description": "Identify and analyze target audience", "priority": "high"},
    {"title": "Content Creation", "description": "Create campaign content and assets", "priority": "high"},
    {"title": "Channel Setup", "description": "Set up marketing channels and platforms", "priority": "medium"},
    {"title": "Campaign Launch", "description": "Launch and monitor campaign", "priority": "high"},
    {"title": "Performance Analysis", "description": "Analyze campaign performance and ROI", "priority": "medium"}
  ]
}', true),

('SEO Optimization Project', 'Template for SEO optimization projects', 'SEO', ARRAY['SEO', 'Manager'], '{
  "tasks": [
    {"title": "SEO Audit", "description": "Perform comprehensive SEO audit", "priority": "high"},
    {"title": "Keyword Research", "description": "Research and identify target keywords", "priority": "high"},
    {"title": "On-Page Optimization", "description": "Optimize on-page SEO elements", "priority": "high"},
    {"title": "Technical SEO", "description": "Fix technical SEO issues", "priority": "medium"},
    {"title": "Content Optimization", "description": "Optimize existing content for SEO", "priority": "medium"},
    {"title": "Link Building", "description": "Develop and execute link building strategy", "priority": "medium"},
    {"title": "Performance Monitoring", "description": "Monitor and report SEO performance", "priority": "low"}
  ]
}', true);

-- Create views for analytics and reporting
CREATE OR REPLACE VIEW project_analytics AS
SELECT 
    p.user_id,
    COUNT(p.id) as total_projects,
    COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_projects,
    COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_projects,
    AVG(p.completion_percentage) as avg_completion_percentage,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COALESCE(SUM(t.actual_hours), 0) as total_hours_logged
FROM user_projects p
LEFT JOIN user_tasks t ON p.id = t.project_id
GROUP BY p.user_id;

CREATE OR REPLACE VIEW workspace_usage_analytics AS
SELECT 
    user_id,
    workspace_name,
    workspace_type,
    COUNT(*) as access_count,
    MAX(access_time) as last_access,
    AVG(session_duration) as avg_session_duration
FROM workspace_access_logs
WHERE access_time >= NOW() - INTERVAL '30 days'
GROUP BY user_id, workspace_name, workspace_type;

-- Grant necessary permissions
GRANT SELECT ON project_analytics TO authenticated;
GRANT SELECT ON workspace_usage_analytics TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE user_projects IS 'Stores user-created projects with status tracking and metadata';
COMMENT ON TABLE user_tasks IS 'Stores tasks associated with projects or standalone tasks';
COMMENT ON TABLE workspace_access_logs IS 'Tracks user access to different workspace tools and applications';
COMMENT ON TABLE project_collaborators IS 'Manages project collaboration and permissions';
COMMENT ON TABLE task_comments IS 'Stores comments and discussions on tasks';
COMMENT ON TABLE project_templates IS 'Predefined project templates for quick project creation';

COMMENT ON VIEW project_analytics IS 'Aggregated project and task statistics per user';
COMMENT ON VIEW workspace_usage_analytics IS 'Workspace usage statistics for the last 30 days';