# Role-Specific Dashboards Documentation

## Overview
This document provides comprehensive information about all role-specific dashboards in the BPTM (Business Performance Tracking and Management) system, including direct URLs, test credentials, and feature descriptions.

## Application Base URL
**Development Server**: `http://localhost:5173`

## Role Dashboard URLs

### 1. SEO Employee Dashboard
- **URL**: `http://localhost:5173/seo-dashboard`
- **Role**: SEO
- **Category**: Employee
- **Department**: Marketing
- **Test Credentials**:
  - Email: `seo@test.com`
  - Password: `test123`
- **Features**:
  - SEO performance metrics and KPIs
  - Client account management
  - Keyword ranking tracking
  - Content optimization tools
  - Monthly performance reports
  - SERP analysis and GMB management

### 2. Social Media Dashboard
- **URL**: `http://localhost:5173/social-media-dashboard`
- **Role**: Social Media
- **Category**: Employee
- **Department**: Marketing
- **Test Credentials**:
  - Email: `social@test.com`
  - Password: `test123`
- **Features**:
  - Social media performance analytics
  - Content calendar management
  - Engagement metrics tracking
  - Client social media accounts
  - Campaign performance reports
  - Platform-specific analytics

### 3. YouTube SEO Dashboard
- **URL**: `http://localhost:5173/youtube-seo-dashboard`
- **Role**: YouTube SEO
- **Category**: Employee
- **Department**: Marketing
- **Test Credentials**:
  - Email: `youtube@test.com`
  - Password: `test123`
- **Features**:
  - YouTube channel analytics
  - Video performance metrics
  - SEO optimization tracking
  - Subscriber growth analysis
  - Content strategy planning
  - Monetization tracking

### 4. Accountant Dashboard
- **URL**: `http://localhost:5173/accountant-dashboard`
- **Role**: Accountant
- **Category**: Management
- **Department**: Finance
- **Test Credentials**:
  - Email: `accounts@test.com`
  - Password: `test123`
- **Features**:
  - Financial performance overview
  - Revenue and expense tracking
  - Client billing management
  - Profit margin analysis
  - Budget vs actual reports
  - Tax and compliance tracking

### 5. HR Dashboard
- **URL**: `http://localhost:5173/hr-dashboard`
- **Role**: HR
- **Category**: Management
- **Department**: Human Resources
- **Test Credentials**:
  - Email: `hr@test.com`
  - Password: `test123`
- **Features**:
  - Employee management system
  - Performance review tracking
  - Leave management
  - Recruitment pipeline
  - Training and development
  - Employee satisfaction metrics

### 6. Sales Dashboard
- **URL**: `http://localhost:5173/sales-dashboard`
- **Role**: Sales
- **Category**: Management
- **Department**: Sales
- **Test Credentials**:
  - Email: `sales@test.com`
  - Password: `test123`
- **Features**:
  - Sales pipeline management
  - Lead tracking and conversion
  - Revenue forecasting
  - Client acquisition metrics
  - Performance targets tracking
  - Commission calculations

### 7. Ads Dashboard
- **URL**: `http://localhost:5173/ads-dashboard`
- **Role**: Ads
- **Category**: Employee
- **Department**: Marketing
- **Test Credentials**:
  - Email: `ads@test.com`
  - Password: `test123`
- **Features**:
  - Ad campaign performance
  - ROI and ROAS tracking
  - Budget management
  - A/B testing results
  - Platform-specific metrics
  - Client ad account management

### 8. Design Dashboard
- **URL**: `http://localhost:5173/design-dashboard`
- **Role**: Graphic Designer
- **Category**: Employee
- **Department**: Creative
- **Test Credentials**:
  - Email: `design@test.com`
  - Password: `test123`
- **Features**:
  - Design project tracking
  - Creative asset management
  - Client feedback system
  - Design tool proficiency
  - Portfolio showcase
  - Brand guideline compliance

### 9. Web Developer Dashboard
- **URL**: `http://localhost:5173/web-developer-dashboard`
- **Role**: Web Developer
- **Category**: Employee
- **Department**: Technology
- **Test Credentials**:
  - Email: `web@test.com`
  - Password: `test123`
- **Features**:
  - Development project tracking
  - Code quality metrics
  - Website performance monitoring
  - Client website management
  - Technical skill assessment
  - Bug tracking and resolution

### 10. Intern Dashboard
- **URL**: `http://localhost:5173/intern-dashboard`
- **Role**: Intern
- **Category**: Intern
- **Department**: Various
- **Test Credentials**:
  - Email: `intern@test.com`
  - Password: `test123`
- **Features**:
  - Learning progress tracking
  - Task assignment and completion
  - Mentor feedback system
  - Skill development metrics
  - Project portfolio
  - Performance evaluation

### 11. Freelancer Dashboard
- **URL**: `http://localhost:5173/freelancer-dashboard`
- **Role**: Freelancer
- **Category**: Freelancer
- **Department**: External
- **Test Credentials**:
  - Email: `freelancer@test.com`
  - Password: `test123`
- **Features**:
  - Project management
  - Time tracking and billing
  - Client communication
  - Payment tracking
  - Portfolio management
  - Performance metrics

## Management Dashboards

### 12. Manager Dashboard
- **URL**: `http://localhost:5173/manager-dashboard`
- **Role**: Manager
- **Category**: Management
- **Department**: Management
- **Test Credentials**:
  - Email: `manager@test.com`
  - Password: `test123`
- **Features**:
  - Team performance overview
  - Resource allocation
  - Project management
  - Budget tracking
  - Team productivity metrics
  - Strategic planning tools

### 13. Operations Head Dashboard
- **URL**: `http://localhost:5173/operations-head-dashboard`
- **Role**: Operations Head
- **Category**: Admin
- **Department**: Operations
- **Test Credentials**:
  - Email: `operations@test.com`
  - Password: `test123`
- **Features**:
  - Operational efficiency metrics
  - Cross-department coordination
  - Process optimization
  - Resource management
  - Performance analytics
  - Strategic oversight

### 14. Super Admin Dashboard
- **URL**: `http://localhost:5173/super-admin-dashboard`
- **Role**: Super Admin
- **Category**: Admin
- **Department**: Administration
- **Test Credentials**:
  - Email: `admin@test.com`
  - Password: `test123`
- **Features**:
  - System-wide analytics
  - User management
  - Role and permission management
  - System configuration
  - Security monitoring
  - Complete system oversight

## Database Integration

### Role-Specific Tables
- **unified_users**: Main user management table with role-based access
- **monthly_kpi_reports**: KPI tracking for all roles
- **employee_performance**: Performance evaluation system
- **seo_accounts**: SEO-specific client and project management
- **yt_monthly_entries**: YouTube SEO performance tracking
- **sales_users**: Sales CRM and pipeline management
- **hr_monthly_entries**: HR performance and employee management

### KPI Integration
Each dashboard integrates with role-specific KPIs:
- **Client Management**: Meetings, satisfaction scores, retention rates
- **Work Performance**: Tasks completed, quality scores, productivity
- **Learning & Growth**: Training hours, certifications, skill development
- **Attendance & Engagement**: Attendance rates, collaboration scores

## Testing Instructions

### 1. Access Dashboard
1. Navigate to the specific role dashboard URL
2. Use the provided test credentials to log in
3. Verify role-based access and features

### 2. Feature Testing
1. Test all dashboard tabs and sections
2. Verify data display and KPI calculations
3. Test interactive elements and forms
4. Check responsive design on different screen sizes

### 3. Data Validation
1. Verify dummy data is properly displayed
2. Test data filtering and sorting
3. Check chart and graph functionality
4. Validate export and reporting features

## Development Notes

### Database Setup
- Run `setup_complete_database.sql` for initial database setup
- Use `comprehensive_test_data.sql` for dummy data population
- Execute role-specific migration files for specialized features

### Authentication
- All dashboards use unified authentication system
- Role-based access control implemented
- Session management and security policies enabled

### Performance
- Real-time data synchronization
- Optimized queries for dashboard metrics
- Caching implemented for frequently accessed data

## Support and Maintenance

### Common Issues
1. **Login Issues**: Verify user exists in unified_users table
2. **Data Not Loading**: Check database connections and RLS policies
3. **Permission Errors**: Verify role permissions in role_permissions table

### Updates and Modifications
1. Dashboard components located in `/src/components/dashboards/`
2. Routing configuration in `/src/components/Router.jsx`
3. Authentication logic in `/src/features/auth/UnifiedAuthContext.jsx`

---

**Last Updated**: January 2025
**Version**: 1.0
**Maintainer**: Development Team