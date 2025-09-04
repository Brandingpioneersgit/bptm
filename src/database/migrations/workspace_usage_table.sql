-- Create workspace_usage table for tracking user workspace access
CREATE TABLE IF NOT EXISTS workspace_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_name TEXT NOT NULL,
  workspace_type TEXT NOT NULL CHECK (workspace_type IN ('internal', 'external')),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workspace_usage_user_id ON workspace_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_usage_accessed_at ON workspace_usage(accessed_at);
CREATE INDEX IF NOT EXISTS idx_workspace_usage_workspace_name ON workspace_usage(workspace_name);

-- Enable Row Level Security
ALTER TABLE workspace_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own workspace usage" ON workspace_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workspace usage" ON workspace_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all workspace usage" ON workspace_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('Super Admin', 'Operations Head')
    )
  );

-- Grant permissions
GRANT SELECT, INSERT ON workspace_usage TO authenticated;
GRANT ALL ON workspace_usage TO service_role;

-- Add comments
COMMENT ON TABLE workspace_usage IS 'Tracks user access to different workspaces for analytics';
COMMENT ON COLUMN workspace_usage.workspace_name IS 'Name of the workspace accessed';
COMMENT ON COLUMN workspace_usage.workspace_type IS 'Type of workspace: internal or external';
COMMENT ON COLUMN workspace_usage.accessed_at IS 'Timestamp when workspace was accessed';