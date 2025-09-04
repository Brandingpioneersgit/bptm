# Manual Testing Guide for Agency Dashboard & Role-Based Navigation

## 🎯 Testing Objectives
1. Verify Agency Dashboard loads as the main login interface
2. Test role-based navigation after authentication
3. Confirm profile dashboards display correctly for each role
4. Validate back navigation returns to Agency Dashboard

## 🚀 Testing Steps

### Step 1: Access the Application
1. Open browser and navigate to: `http://localhost:5173`
2. **Expected**: Agency Dashboard should load as the main interface
3. **Verify**: Login form is visible and functional

### Step 2: Test Login Flow
1. Click on the login button/form in Agency Dashboard
2. **Expected**: Login modal or form appears
3. Try logging in with test credentials (if available)

### Step 3: Test Role-Based Navigation
After successful login, verify navigation based on user role:

#### Super Admin
- **Expected Route**: Should navigate to Super Admin Profile Dashboard
- **Features to Check**:
  - System overview metrics
  - User management capabilities
  - Calendar with system events
  - Profile editing functionality

#### HR Role
- **Expected Route**: Should navigate to HR Profile Dashboard
- **Features to Check**:
  - HR-specific metrics
  - Employee management tools
  - Leave approval systems

#### Manager Role
- **Expected Route**: Should navigate to Manager Profile Dashboard
- **Features to Check**:
  - Team overview
  - Performance tracking
  - Employee reports

#### Employee Role
- **Expected Route**: Should navigate to Employee Profile Dashboard
- **Features to Check**:
  - Personal performance metrics
  - Task management
  - Leave application forms

#### Freelancer Role
- **Expected Route**: Should navigate to Freelancer Profile Dashboard
- **Features to Check**:
  - Project tracking
  - Payment information
  - Portfolio management

### Step 4: Test Back Navigation
1. From any profile dashboard, click "Back" or navigation buttons
2. **Expected**: Should return to Agency Dashboard
3. **Verify**: Agency Dashboard loads correctly

### Step 5: Test Profile Editing
1. In any profile dashboard, locate profile edit functionality
2. **Expected**: Profile edit modal/form opens
3. **Verify**: Can edit user details (name, phone, location, etc.)
4. **Check**: IP tracking is implemented (if visible in logs/database)

## 🔍 Key Features to Verify

### Agency Dashboard (Login Interface)
- [ ] Loads as default view
- [ ] Login form/modal functionality
- [ ] Responsive design
- [ ] Proper branding and styling

### Profile Dashboards
- [ ] Role-specific content displays
- [ ] Navigation handlers work correctly
- [ ] CRUD operations function properly
- [ ] Calendar integration (where applicable)
- [ ] Performance metrics display

### Navigation Flow
- [ ] Login redirects to correct role dashboard
- [ ] Back navigation returns to Agency Dashboard
- [ ] URL routing works correctly
- [ ] Hash-based navigation functions

### Profile Management
- [ ] Profile editing modal opens
- [ ] User details can be modified
- [ ] Changes save correctly
- [ ] IP tracking implemented

## 🐛 Common Issues to Check

1. **Authentication Issues**
   - Login modal not appearing
   - Authentication failures
   - Role detection problems

2. **Navigation Issues**
   - Wrong dashboard after login
   - Back navigation not working
   - URL routing errors

3. **UI/UX Issues**
   - Components not loading
   - Styling problems
   - Responsive design issues

4. **Data Issues**
   - Profile data not loading
   - Metrics not displaying
   - Calendar events missing

## 📊 Expected Architecture Flow

```
Agency Dashboard (Login)
    ↓ (After Authentication)
Role Detection
    ↓
┌─────────────────────────────────────────────────────┐
│  Super Admin → Super Admin Profile Dashboard        │
│  HR → HR Profile Dashboard                          │
│  Manager → Manager Profile Dashboard                │
│  Employee → Employee Profile Dashboard              │
│  Freelancer → Freelancer Profile Dashboard         │
│  Intern → Intern Profile Dashboard                 │
└─────────────────────────────────────────────────────┘
    ↓ (Back Navigation)
Agency Dashboard
```

## 🎯 Success Criteria

✅ **Complete Success**: All roles navigate correctly, profile dashboards load with appropriate content, back navigation works, and profile editing functions properly.

⚠️ **Partial Success**: Most features work but some minor issues exist (styling, minor navigation glitches).

❌ **Needs Work**: Major navigation issues, authentication problems, or profile dashboards not loading correctly.

---

**Note**: This application now supports the annual landscape view with month-on-month tracking for tasks, performance, and learning, with role-based report access and comprehensive profile management including IP tracking.