# URL Paths and Login Credentials Documentation

## 🌐 Application URL Paths

### Main Dashboard Routes
- **Agency Dashboard (Default)**: `http://localhost:5173/` or `#/`
- **Manager Dashboard**: `http://localhost:5173/#admin`
- **Employee Dashboard**: `http://localhost:5173/#/employee`
- **Intern Dashboard**: `http://localhost:5173/#/intern`
- **Master Tools**: `http://localhost:5173/#/master-tools`
- **Tactical Form**: `http://localhost:5173/#/form`

### Feature-Specific Routes
- **Employee Signup**: `http://localhost:5173/#/employee-signup`
- **Employee Onboarding**: `http://localhost:5173/#/employee-onboarding`
- **Client Onboarding**: `http://localhost:5173/#/client-onboarding`
- **Arcade System**: `http://localhost:5173/#/arcade`
- **Arcade Earn Points**: `http://localhost:5173/#/arcade-earn`
- **Arcade Redeem Points**: `http://localhost:5173/#/arcade-redeem`
- **Arcade History**: `http://localhost:5173/#/arcade-history`
- **Arcade Admin**: `http://localhost:5173/#/arcade-admin`

### Report and Analytics Routes
- **Employee Reports**: Accessible through employee dashboard
- **Performance Analytics**: Accessible through manager dashboard
- **Client Management**: Accessible through agency dashboard

---

## 🔐 Login Credentials for Testing

### Manager/Admin Access
**Login Type**: Admin Token Authentication
- **Access Token**: `admin123`
- **URL**: `http://localhost:5173/#admin`
- **Usage**: Enter `admin123` as the admin token when prompted
- **Permissions**: Full access to all features, employee management, reports

### Employee Login Credentials
**Login Type**: Name + Phone Number Authentication

#### Test Employee Accounts (from sample data):

1. **Manish Kushwaha**
   - **Name**: `Manish Kushwaha`
   - **Phone**: `9565416467`
   - **Department**: Web
   - **Role**: Full Stack Developer, Team Lead
   - **Status**: Active

2. **Sarah Johnson**
   - **Name**: `Sarah Johnson`
   - **Phone**: `9876543210`
   - **Department**: Marketing
   - **Role**: Marketing Manager
   - **Status**: Active

3. **David Chen**
   - **Name**: `David Chen`
   - **Phone**: `8765432109`
   - **Department**: Sales
   - **Role**: Sales Executive
   - **Status**: Active

4. **Emily Johnson**
   - **Name**: `Emily Johnson`
   - **Phone**: `5551234571`
   - **Department**: HR
   - **Role**: HR Manager, Recruiter
   - **Status**: Active

5. **Alex Williams**
   - **Name**: `Alex Williams`
   - **Phone**: `5551234572`
   - **Department**: Marketing
   - **Role**: Digital Marketing Specialist
   - **Status**: Active

### Intern Login Credentials
**Login Type**: Name + Student ID/Phone Authentication
- **Name**: Any valid name (minimum 2 characters)
- **Student ID/Phone**: Any valid ID (minimum 3 characters)
- **Note**: Intern login is more flexible and doesn't require pre-existing records

---

## 🛠️ Environment Configuration

### Required Environment Variables
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://igwgryykglsetfvomhdj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2dyeXlrZ2xzZXRmdm9taGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NTcxMDgsImV4cCI6MjA3MDMzMzEwOH0.yL1hK263qf9msp7K4vUtF4Lvb7x7yxPcyvgkPiLokqA

# Admin Access Token
VITE_ADMIN_ACCESS_TOKEN=admin123
```

### Local Development Server
- **URL**: `http://localhost:5173/`
- **Command**: `npm run dev`
- **Port**: 5173 (default Vite port)

---

## 📋 Testing Workflow

### 1. Manager Dashboard Testing
1. Navigate to `http://localhost:5173/#admin`
2. Enter admin token: `admin123`
3. Access all management features:
   - Employee management
   - Performance analytics
   - Report generation
   - System administration

### 2. Employee Dashboard Testing
1. Navigate to `http://localhost:5173/`
2. Click "Login" and select "Employee"
3. Use any of the test employee credentials above
4. Test features:
   - Personal dashboard
   - Form submissions
   - Performance tracking
   - Leave applications

### 3. Form Testing
1. Navigate to `http://localhost:5173/#/form`
2. Login required - use employee credentials
3. Test tactical form functionality:
   - KPI entries
   - Learning hours tracking
   - Client management
   - Report submissions

### 4. Feature-Specific Testing
- **Arcade System**: Use `http://localhost:5173/#/arcade`
- **Employee Onboarding**: Use `http://localhost:5173/#/employee-onboarding`
- **Client Management**: Access through agency dashboard

---

## 🔒 Security Features

### Authentication Security
- **Rate Limiting**: 5 failed attempts trigger 15-minute cooldown
- **Session Management**: 24-hour session timeout for employees, 8 hours for managers
- **Input Validation**: All inputs are sanitized and validated
- **Role-Based Access**: Different permissions for different user types

### Data Protection
- **Row Level Security (RLS)**: Enabled on all sensitive tables
- **Audit Logging**: All login attempts and actions are logged
- **Secure Token Storage**: Admin tokens are securely validated

---

## 🚨 Troubleshooting

### Common Login Issues
1. **Employee Login Failed**:
   - Ensure exact name match (case-insensitive)
   - Verify phone number format matches exactly
   - Check if employee status is "Active"

2. **Manager Access Denied**:
   - Verify `VITE_ADMIN_ACCESS_TOKEN` in .env file
   - Ensure token is at least 8 characters
   - Check for typos in token entry

3. **Page Not Loading**:
   - Verify development server is running
   - Check console for JavaScript errors
   - Ensure all dependencies are installed

### Database Connection Issues
- **Supabase Connection**: Verify URL and anon key in .env
- **Local Fallback**: App works with localStorage if Supabase unavailable
- **Sample Data**: Test employees are auto-populated in localStorage

---

## 📊 Feature Access Matrix

| Feature | Agency User | Employee | Manager | Intern |
|---------|-------------|----------|---------|--------|
| Dashboard Access | ✅ | ✅ | ✅ | ✅ |
| Form Submission | ❌ | ✅ | ✅ | ✅ |
| Employee Management | ❌ | ❌ | ✅ | ❌ |
| Reports & Analytics | ❌ | Limited | ✅ | ❌ |
| Client Management | ✅ | Limited | ✅ | ❌ |
| Arcade System | ❌ | ✅ | ✅ | ✅ |
| HR Workflows | ❌ | ❌ | ✅ | ❌ |
| System Administration | ❌ | ❌ | ✅ | ❌ |

---

## 📝 Notes

- **Phone numbers** act as passwords for employee authentication
- **Case sensitivity**: Names are case-insensitive, phone numbers are exact match
- **Session persistence**: Login sessions are maintained across browser refreshes
- **Mobile responsive**: All pages work on mobile devices
- **Offline capability**: Basic functionality available without internet connection

---

*Last Updated: January 2025*
*For technical support, contact the development team*