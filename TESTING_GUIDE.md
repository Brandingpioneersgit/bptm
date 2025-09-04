# Homapeg Agency Dashboard - Testing Guide

## Overview
The Homapeg Agency Dashboard is now fully implemented with a proper login interface and role-based navigation to profile dashboards.

## Application Flow
1. **Agency Dashboard** - Main homepage/application interface at `http://localhost:5173`
2. **Login Modal** - Click "Login" button to access authentication
3. **Profile Dashboards** - After login, users are redirected to role-specific dashboards

## Current Status

### ✅ Completed Features
- Agency Dashboard as main application interface
- Login modal with email/password authentication
- Role-based navigation to profile dashboards
- Integration with Supabase authentication
- Profile dashboard components for all roles

### 🔧 Setup Required
To fully test the application, you need to create demo users in your Supabase project:

#### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add user" and create users with these details:

**Super Admin**
- Email: `admin@homapeg.com`
- Password: `admin123`
- User Metadata: `{"full_name": "Admin Super", "role": "Super Admin", "category": "admin"}`

**HR Manager**
- Email: `hr@homapeg.com`
- Password: `hr123`
- User Metadata: `{"full_name": "Sarah HR", "role": "HR", "category": "management"}`

**Manager**
- Email: `manager@homapeg.com`
- Password: `manager123`
- User Metadata: `{"full_name": "John Manager", "role": "Manager", "category": "management"}`

**Employee**
- Email: `employee@homapeg.com`
- Password: `employee123`
- User Metadata: `{"full_name": "Alice Employee", "role": "Employee", "category": "employee"}`

**Freelancer**
- Email: `freelancer@homapeg.com`
- Password: `freelancer123`
- User Metadata: `{"full_name": "Bob Freelancer", "role": "Freelancer", "category": "freelancer"}`

**Intern**
- Email: `intern@homapeg.com`
- Password: `intern123`
- User Metadata: `{"full_name": "Emma Intern", "role": "Intern", "category": "intern"}`

#### Option 2: Configure Email Validation
If you want to use the signup flow:
1. In Supabase Dashboard > Authentication > Settings
2. Disable "Enable email confirmations" for testing
3. Or configure SMTP settings for email confirmation

## Testing Steps

### 1. Access the Application
```bash
npm run dev
```
Open `http://localhost:5173`

### 2. Test Login Flow
1. Click the "Login" button in the top-right corner
2. Enter credentials for any demo user
3. Verify successful login and redirection to role-specific dashboard

### 3. Test Role-Based Navigation
- **Super Admin** → Super Admin Profile Dashboard
- **HR** → HR Profile Dashboard  
- **Manager** → Manager Profile Dashboard
- **Employee** → Employee Profile Dashboard
- **Freelancer** → Freelancer Profile Dashboard
- **Intern** → Intern Profile Dashboard

### 4. Test Profile Dashboards
Each role should have access to:
- Personal profile information
- Role-specific features and tools
- Calendar integration
- Data persistence in the database

## Expected Behavior

### Agency Dashboard (Homepage)
- Shows company information, news, and updates
- Login button for unauthenticated users
- "My Profile" button for authenticated users
- Public access to general company information

### Login Modal
- Email and password fields
- Error handling for invalid credentials
- Demo account information displayed
- Proper form validation

### Profile Dashboards
- Role-specific interface and features
- Personal data management
- Calendar and task management
- Database integration for data persistence

## Troubleshooting

### Login Issues
- Verify users exist in Supabase Auth
- Check user metadata includes role and category
- Ensure RLS policies allow user access

### Navigation Issues
- Check browser console for JavaScript errors
- Verify role mapping in AppShell.jsx
- Ensure all profile components are properly imported

### Database Issues
- Verify unified_users table exists
- Check RLS policies for table access
- Ensure user profiles are created after authentication

## Development Notes

### Key Files
- `src/components/AgencyDashboard.jsx` - Main homepage with login
- `src/components/AppShell.jsx` - Navigation and routing logic
- `src/components/ProfileDashboard.jsx` - Role-specific dashboards
- `src/features/auth/UnifiedAuthContext.jsx` - Authentication logic

### Authentication Flow
1. User clicks login on Agency Dashboard
2. Login modal appears with form
3. Credentials submitted to Supabase Auth
4. On success, user redirected to role-specific dashboard
5. Profile data loaded from unified_users table

## Next Steps

Once users are created and login is working:
1. Test all role-specific dashboard features
2. Verify data persistence across sessions
3. Test role-based access controls
4. Validate calendar and task management features
5. Ensure proper error handling and user feedback

The application is now ready for comprehensive testing with proper user accounts!