-- =============================================
-- GROWTH REPORTS TABLE
-- =============================================
-- Table for storing generated growth reports and analytics

CREATE TABLE IF NOT EXISTS public.growth_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('individual', 'team', 'department')),
  period VARCHAR(20) NOT NULL CHECK (period IN ('3months', '6months', '12months')),
  report_data JSONB NOT NULL,
  generated_by UUID REFERENCES users(id) NOT NULL,
  
  -- Report metadata
  title VARCHAR(255),
  description TEXT,
  tags TEXT[],
  
  -- Report status and sharing
  status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'shared', 'archived')),
  is_public BOOLEAN DEFAULT false,
  shared_with UUID[],
  
  -- Analytics tracking
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  export_count INTEGER DEFAULT 0,
  last_exported_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_growth_reports_user_id ON growth_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_reports_generated_by ON growth_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_growth_reports_report_type ON growth_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_growth_reports_period ON growth_reports(period);
CREATE INDEX IF NOT EXISTS idx_growth_reports_status ON growth_reports(status);
CREATE INDEX IF NOT EXISTS idx_growth_reports_created_at ON growth_reports(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_growth_reports_updated_at
  BEFORE UPDATE ON public.growth_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- GROWTH REPORT TEMPLATES TABLE
-- =============================================
-- Table for storing reusable report templates

CREATE TABLE IF NOT EXISTS public.growth_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  role VARCHAR(100) NOT NULL,
  template_config JSONB NOT NULL,
  
  -- Template metadata
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_growth_report_templates_role ON growth_report_templates(role);
CREATE INDEX IF NOT EXISTS idx_growth_report_templates_is_default ON growth_report_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_growth_report_templates_is_active ON growth_report_templates(is_active);

-- Create trigger for updated_at
CREATE TRIGGER update_growth_report_templates_updated_at
  BEFORE UPDATE ON public.growth_report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- MONTHLY SCORING SYSTEM TABLE
-- =============================================
-- Table for automated monthly scoring calculations

CREATE TABLE IF NOT EXISTS public.monthly_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  role VARCHAR(100) NOT NULL,
  
  -- Calculated scores
  overall_score DECIMAL(5,2) NOT NULL,
  kpi_score DECIMAL(5,2),
  attendance_score DECIMAL(5,2),
  performance_score DECIMAL(5,2),
  learning_score DECIMAL(5,2),
  
  -- Score breakdown
  score_breakdown JSONB,
  
  -- Comparison metrics
  previous_month_score DECIMAL(5,2),
  score_change DECIMAL(5,2),
  score_change_percentage DECIMAL(5,2),
  
  -- Ranking and percentiles
  department_rank INTEGER,
  department_percentile DECIMAL(5,2),
  company_rank INTEGER,
  company_percentile DECIMAL(5,2),
  
  -- Automated insights
  insights JSONB,
  recommendations JSONB,
  
  -- Calculation metadata
  calculation_method VARCHAR(50) DEFAULT 'automated',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  is_final BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, month)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_monthly_scores_user_month ON monthly_scores(user_id, month);
CREATE INDEX IF NOT EXISTS idx_monthly_scores_month ON monthly_scores(month);
CREATE INDEX IF NOT EXISTS idx_monthly_scores_role ON monthly_scores(role);
CREATE INDEX IF NOT EXISTS idx_monthly_scores_overall_score ON monthly_scores(overall_score);
CREATE INDEX IF NOT EXISTS idx_monthly_scores_is_final ON monthly_scores(is_final);

-- Create trigger for updated_at
CREATE TRIGGER update_monthly_scores_updated_at
  BEFORE UPDATE ON public.monthly_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SCORING RULES TABLE
-- =============================================
-- Table for configurable scoring rules by role

CREATE TABLE IF NOT EXISTS public.scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(100) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  weight DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  min_value DECIMAL(5,2) DEFAULT 0,
  max_value DECIMAL(5,2) DEFAULT 100,
  target_value DECIMAL(5,2),
  
  -- Scoring configuration
  scoring_method VARCHAR(50) DEFAULT 'linear', -- linear, exponential, threshold
  threshold_config JSONB,
  
  -- Rule metadata
  is_active BOOLEAN DEFAULT true,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(role, metric_name, effective_from)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scoring_rules_role ON scoring_rules(role);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_metric_name ON scoring_rules(metric_name);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_is_active ON scoring_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_effective_dates ON scoring_rules(effective_from, effective_to);

-- Create trigger for updated_at
CREATE TRIGGER update_scoring_rules_updated_at
  BEFORE UPDATE ON public.scoring_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INSERT DEFAULT SCORING RULES
-- =============================================

-- Default scoring rules for Intern role
INSERT INTO scoring_rules (role, metric_name, weight, target_value, scoring_method) VALUES
('Intern', 'skill_development', 1.0, 80, 'linear'),
('Intern', 'learning_hours', 1.0, 75, 'linear'),
('Intern', 'goal_completion', 1.2, 85, 'linear'),
('Intern', 'mentor_rating', 1.1, 80, 'linear'),
('Intern', 'project_quality', 1.0, 75, 'linear'),
('Intern', 'technical_growth', 1.0, 75, 'linear'),
('Intern', 'soft_skills', 0.8, 70, 'linear'),
('Intern', 'initiative_score', 0.9, 70, 'linear')
ON CONFLICT (role, metric_name, effective_from) DO NOTHING;

-- Default scoring rules for Freelancer role
INSERT INTO scoring_rules (role, metric_name, weight, target_value, scoring_method) VALUES
('Freelancer', 'client_satisfaction', 1.2, 85, 'linear'),
('Freelancer', 'project_delivery', 1.1, 80, 'linear'),
('Freelancer', 'quality_score', 1.0, 85, 'linear'),
('Freelancer', 'communication_rating', 0.9, 80, 'linear'),
('Freelancer', 'deadline_adherence', 1.1, 90, 'linear'),
('Freelancer', 'technical_skills', 1.0, 80, 'linear'),
('Freelancer', 'creativity_score', 0.8, 75, 'linear'),
('Freelancer', 'earnings_growth', 0.7, 70, 'linear')
ON CONFLICT (role, metric_name, effective_from) DO NOTHING;

-- Default scoring rules for Employee role
INSERT INTO scoring_rules (role, metric_name, weight, target_value, scoring_method) VALUES
('Employee', 'client_satisfaction', 1.1, 80, 'linear'),
('Employee', 'attendance', 1.2, 90, 'linear'),
('Employee', 'punctuality_score', 1.0, 85, 'linear'),
('Employee', 'team_collaboration', 1.0, 80, 'linear'),
('Employee', 'initiative_score', 0.9, 70, 'linear'),
('Employee', 'productivity_score', 1.0, 75, 'linear')
ON CONFLICT (role, metric_name, effective_from) DO NOTHING;

-- =============================================
-- INSERT DEFAULT REPORT TEMPLATES
-- =============================================

-- Default template for Intern reports
INSERT INTO growth_report_templates (name, description, role, template_config, is_default) VALUES
('Intern Growth Report', 'Standard growth report template for interns focusing on learning and development', 'Intern', '{
  "sections": [
    {"id": "learning_overview", "title": "Learning Overview", "weight": 0.3},
    {"id": "skill_development", "title": "Skill Development", "weight": 0.25},
    {"id": "project_performance", "title": "Project Performance", "weight": 0.25},
    {"id": "mentor_feedback", "title": "Mentor Feedback", "weight": 0.2}
  ],
  "metrics": ["skill_development", "learning_hours", "goal_completion", "mentor_rating", "project_quality", "technical_growth", "soft_skills", "initiative_score"],
  "insights": {
    "focus_areas": ["learning_hours", "technical_growth"],
    "strength_indicators": ["mentor_rating", "goal_completion"]
  }
}', true)
ON CONFLICT DO NOTHING;

-- Default template for Freelancer reports
INSERT INTO growth_report_templates (name, description, role, template_config, is_default) VALUES
('Freelancer Performance Report', 'Standard performance report template for freelancers focusing on client satisfaction and project delivery', 'Freelancer', '{
  "sections": [
    {"id": "client_satisfaction", "title": "Client Satisfaction", "weight": 0.3},
    {"id": "project_delivery", "title": "Project Delivery", "weight": 0.25},
    {"id": "quality_metrics", "title": "Quality Metrics", "weight": 0.25},
    {"id": "earnings_growth", "title": "Earnings Growth", "weight": 0.2}
  ],
  "metrics": ["client_satisfaction", "project_delivery", "quality_score", "communication_rating", "deadline_adherence", "technical_skills", "creativity_score", "earnings_growth"],
  "insights": {
    "focus_areas": ["deadline_adherence", "project_delivery"],
    "strength_indicators": ["client_satisfaction", "quality_score"]
  }
}', true)
ON CONFLICT DO NOTHING;

-- Default template for Employee reports
INSERT INTO growth_report_templates (name, description, role, template_config, is_default) VALUES
('Employee Performance Report', 'Standard performance report template for employees focusing on productivity and collaboration', 'Employee', '{
  "sections": [
    {"id": "performance_overview", "title": "Performance Overview", "weight": 0.3},
    {"id": "attendance_punctuality", "title": "Attendance & Punctuality", "weight": 0.25},
    {"id": "team_collaboration", "title": "Team Collaboration", "weight": 0.25},
    {"id": "client_relations", "title": "Client Relations", "weight": 0.2}
  ],
  "metrics": ["client_satisfaction", "attendance", "punctuality_score", "team_collaboration", "initiative_score", "productivity_score"],
  "insights": {
    "focus_areas": ["productivity_score", "initiative_score"],
    "strength_indicators": ["team_collaboration", "attendance"]
  }
}', true)
ON CONFLICT DO NOTHING;

-- =============================================
-- FUNCTIONS FOR AUTOMATED SCORING
-- =============================================

-- Function to calculate monthly score for a user
CREATE OR REPLACE FUNCTION calculate_monthly_score(
  p_user_id UUID,
  p_month VARCHAR(7),
  p_role VARCHAR(100)
)
RETURNS DECIMAL AS $$
DECLARE
  total_score DECIMAL := 0;
  weighted_sum DECIMAL := 0;
  total_weight DECIMAL := 0;
  rule_record RECORD;
  kpi_value DECIMAL;
  kpi_table_name TEXT;
BEGIN
  -- Determine KPI table based on role
  CASE p_role
    WHEN 'Intern' THEN kpi_table_name := 'intern_kpis';
    WHEN 'Freelancer' THEN kpi_table_name := 'freelancer_kpis';
    WHEN 'Super Admin' THEN kpi_table_name := 'superadmin_kpis';
    WHEN 'HR' THEN kpi_table_name := 'hr_kpis';
    WHEN 'Operations Head' THEN kpi_table_name := 'operations_head_kpis';

    ELSE kpi_table_name := 'employee_kpis';
  END CASE;
  
  -- Get scoring rules for the role
  FOR rule_record IN 
    SELECT * FROM scoring_rules 
    WHERE role = p_role 
    AND is_active = true 
    AND (effective_from <= CURRENT_DATE)
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
  LOOP
    -- Get KPI value (this would need dynamic SQL in a real implementation)
    -- For now, we'll use a placeholder approach
    kpi_value := 0;
    
    -- Calculate weighted score
    IF rule_record.target_value > 0 THEN
      weighted_sum := weighted_sum + (LEAST(kpi_value / rule_record.target_value * 100, 100) * rule_record.weight);
      total_weight := total_weight + rule_record.weight;
    END IF;
  END LOOP;
  
  -- Calculate final score
  IF total_weight > 0 THEN
    total_score := weighted_sum / total_weight;
  END IF;
  
  RETURN GREATEST(0, LEAST(100, total_score));
END;
$$ LANGUAGE plpgsql;

-- Function to generate automated monthly scores for all users
CREATE OR REPLACE FUNCTION generate_monthly_scores(p_month VARCHAR(7))
RETURNS INTEGER AS $$
DECLARE
  user_record RECORD;
  calculated_score DECIMAL;
  records_processed INTEGER := 0;
BEGIN
  -- Process all active users
  FOR user_record IN 
    SELECT u.id, u.role, e.name 
    FROM users u 
    LEFT JOIN employees e ON u.id = e.user_id 
    WHERE u.is_active = true
  LOOP
    -- Calculate score for user
    calculated_score := calculate_monthly_score(user_record.id, p_month, user_record.role);
    
    -- Insert or update monthly score
    INSERT INTO monthly_scores (
      user_id, month, role, overall_score, calculated_at, is_final
    ) VALUES (
      user_record.id, p_month, user_record.role, calculated_score, NOW(), false
    )
    ON CONFLICT (user_id, month) 
    DO UPDATE SET 
      overall_score = calculated_score,
      calculated_at = NOW(),
      updated_at = NOW();
    
    records_processed := records_processed + 1;
  END LOOP;
  
  RETURN records_processed;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE growth_reports IS 'Stores generated growth reports with analytics and sharing capabilities';
COMMENT ON TABLE growth_report_templates IS 'Reusable report templates for different roles and use cases';
COMMENT ON TABLE monthly_scores IS 'Automated monthly scoring system with rankings and insights';
COMMENT ON TABLE scoring_rules IS 'Configurable scoring rules and weights for different roles and metrics';

COMMENT ON FUNCTION calculate_monthly_score(UUID, VARCHAR, VARCHAR) IS 'Calculates weighted monthly score for a user based on role-specific rules';
COMMENT ON FUNCTION generate_monthly_scores(VARCHAR) IS 'Generates monthly scores for all active users for a given month';