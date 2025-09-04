-- =============================================
-- USER PREFERENCES SCHEMA
-- =============================================
-- This migration creates user preferences table for storing
-- notification settings, privacy settings, and other user preferences
-- Timestamp: 20240102006000

BEGIN;

-- =============================================
-- USER PREFERENCES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.unified_users(id) ON DELETE CASCADE,
    
    -- Notification Settings
    notification_settings JSONB DEFAULT '{
        "emailNotifications": true,
        "pushNotifications": true,
        "monthlyReminders": true,
        "performanceAlerts": true,
        "systemUpdates": true,
        "marketingEmails": false,
        "weeklyDigest": true,
        "instantMessages": true
    }'::jsonb,
    
    -- Privacy Settings
    privacy_settings JSONB DEFAULT '{
        "profileVisibility": "team",
        "showEmail": true,
        "showPhone": false,
        "showAddress": false,
        "allowDirectMessages": true,
        "sharePerformanceData": false
    }'::jsonb,
    
    -- Theme and UI Preferences
    ui_preferences JSONB DEFAULT '{
        "theme": "light",
        "language": "en",
        "timezone": "UTC",
        "dateFormat": "MM/DD/YYYY",
        "timeFormat": "12h",
        "dashboardLayout": "default"
    }'::jsonb,
    
    -- Security Preferences
    security_preferences JSONB DEFAULT '{
        "twoFactorEnabled": false,
        "sessionTimeout": 30,
        "loginNotifications": true,
        "passwordChangeNotifications": true
    }'::jsonb,
    
    -- Communication Preferences
    communication_preferences JSONB DEFAULT '{
        "preferredContactMethod": "email",
        "workingHours": {
            "start": "09:00",
            "end": "17:00",
            "timezone": "UTC"
        },
        "availableForMessages": true,
        "autoReplyEnabled": false,
        "autoReplyMessage": ""
    }'::jsonb,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one preference record per user
    UNIQUE(user_id)
);

-- =============================================
-- NOTIFICATION HISTORY TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.unified_users(id) ON DELETE CASCADE,
    
    -- Notification Details
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'email', 'push', 'sms', 'in_app', 'system'
    )),
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Notification Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'sent', 'delivered', 'read', 'failed'
    )),
    
    -- Delivery Information
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN (
        'low', 'normal', 'high', 'urgent'
    )),
    
    -- Related Entity (optional)
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SYSTEM SETTINGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(50) NOT NULL CHECK (setting_type IN (
        'string', 'number', 'boolean', 'object', 'array'
    )),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_editable BOOLEAN DEFAULT TRUE,
    
    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.unified_users(id),
    updated_by UUID REFERENCES public.unified_users(id)
);

-- =============================================
-- INDEXES
-- =============================================

-- User Preferences Indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated_at ON public.user_preferences(updated_at);

-- Notification History Indexes
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON public.notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON public.notification_history(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_history_status ON public.notification_history(status);
CREATE INDEX IF NOT EXISTS idx_notification_history_created_at ON public.notification_history(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_history_priority ON public.notification_history(priority);

-- System Settings Indexes
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON public.system_settings(is_public);

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamp trigger for user_preferences
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- Update timestamp trigger for notification_history
CREATE OR REPLACE FUNCTION update_notification_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_history_updated_at
    BEFORE UPDATE ON public.notification_history
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_history_updated_at();

-- Update timestamp trigger for system_settings
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_system_settings_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- User Preferences Policies
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
    FOR ALL USING (
        user_id IN (
            SELECT id FROM public.unified_users 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all preferences" ON public.user_preferences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.unified_users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.user_category IN ('admin', 'super_admin')
        )
    );

-- Notification History Policies
CREATE POLICY "Users can view their own notifications" ON public.notification_history
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.unified_users 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert notifications" ON public.notification_history
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their notification status" ON public.notification_history
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.unified_users 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all notifications" ON public.notification_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.unified_users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.user_category IN ('admin', 'super_admin')
        )
    );

-- System Settings Policies
CREATE POLICY "Anyone can read public settings" ON public.system_settings
    FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage all settings" ON public.system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.unified_users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.user_category IN ('admin', 'super_admin')
        )
    );

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('app_name', '"BPTM Dashboard"', 'string', 'Application name', true),
('app_version', '"1.0.0"', 'string', 'Application version', true),
('maintenance_mode', 'false', 'boolean', 'Maintenance mode status', true),
('max_file_upload_size', '10485760', 'number', 'Maximum file upload size in bytes (10MB)', false),
('session_timeout_minutes', '30', 'number', 'Default session timeout in minutes', false),
('password_min_length', '8', 'number', 'Minimum password length', false),
('notification_batch_size', '100', 'number', 'Notification batch processing size', false),
('backup_retention_days', '30', 'number', 'Backup retention period in days', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert sample notification types configuration
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('notification_types', '{
    "email": {
        "enabled": true,
        "smtp_host": "smtp.gmail.com",
        "smtp_port": 587,
        "from_address": "noreply@bptm.com"
    },
    "push": {
        "enabled": true,
        "service": "firebase"
    },
    "sms": {
        "enabled": false,
        "provider": "twilio"
    },
    "in_app": {
        "enabled": true,
        "retention_days": 30
    }
}', 'object', 'Notification service configurations', false)
ON CONFLICT (setting_key) DO NOTHING;

COMMIT;