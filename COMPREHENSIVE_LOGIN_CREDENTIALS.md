# Comprehensive Login Credentials for Testing

## Overview
This document contains all available login credentials for testing different user roles in the application. The application uses **Name + Phone Number + Role** for authentication.

## How to Login
1. Go to http://localhost:5173
2. Click the "Login" button in the header
3. Enter the **Name**, **Phone Number**, and select the **Role** from the dropdown
4. Click "Login" to access the role-specific dashboard

---

## 🗄️ Database Users (Primary)
These users are stored in the actual database and will be found first:

### Employee Category (Database)

#### Marketing Manager
- **Name:** `Sarah Marketing`
- **Phone:** `+91-9876543230` or `9876543230`
- **Role:** `Marketing Manager`
- **Department:** Marketing
- **Dashboard:** Employee Dashboard

#### Senior Developer
- **Name:** `David Developer`
- **Phone:** `+91-9876543231` or `9876543231`
- **Role:** `Senior Developer`
- **Department:** Technology
- **Dashboard:** Employee Dashboard

#### Finance Manager
- **Name:** `Lisa Finance`
- **Phone:** `+91-9876543232` or `9876543232`
- **Role:** `Finance Manager`
- **Department:** Finance
- **Dashboard:** Employee Dashboard

#### Operations Manager
- **Name:** `Tom Operations`
- **Phone:** `+91-9876543233` or `9876543233`
- **Role:** `Operations Manager`
- **Department:** Operations
- **Dashboard:** Employee Dashboard

#### UI/UX Designer
- **Name:** `Emma Designer`
- **Phone:** `+91-9876543234` or `9876543234`
- **Role:** `UI/UX Designer`
- **Department:** Creative
- **Dashboard:** Employee Dashboard

#### Sales Manager
- **Name:** `Kevin Sales`
- **Phone:** `+91-9876543235` or `9876543235`
- **Role:** `Sales Manager`
- **Department:** Sales
- **Dashboard:** Employee Dashboard

#### Customer Support
- **Name:** `Nina Support`
- **Phone:** `+91-9876543236` or `9876543236`
- **Role:** `Customer Support`
- **Department:** Support
- **Dashboard:** Employee Dashboard

#### Data Analyst
- **Name:** `Ryan Analytics`
- **Phone:** `+91-9876543237` or `9876543237`
- **Role:** `Data Analyst`
- **Department:** Analytics
- **Dashboard:** Employee Dashboard

---

## 💾 Local Fallback Users (Secondary)
These users are used when database is unavailable:

### 🏢 Employee Category (Fallback)

### SEO Specialist
- **Name:** `John SEO`
- **Phone:** `+91-9876543210` or `9876543210`
- **Role:** `SEO`
- **Department:** Marketing
- **Dashboard:** SEO Dashboard + Employee Dashboard

### Ads Specialist
- **Name:** `Sarah Ads`
- **Phone:** `+91-9876543211` or `9876543211`
- **Role:** `Ads`
- **Department:** Marketing
- **Dashboard:** Ads Dashboard + Employee Dashboard

### Social Media Specialist
- **Name:** `Mike Social`
- **Phone:** `+91-9876543212` or `9876543212`
- **Role:** `Social Media`
- **Department:** Marketing
- **Dashboard:** Social Dashboard + Employee Dashboard

### YouTube SEO Specialist
- **Name:** `Lisa YouTube`
- **Phone:** `+91-9876543213` or `9876543213`
- **Role:** `YouTube SEO`
- **Department:** Marketing
- **Dashboard:** YouTube Dashboard + Employee Dashboard

### Web Developer
- **Name:** `David Dev`
- **Phone:** `+91-9876543214` or `9876543214`
- **Role:** `Web Developer`
- **Department:** Technology
- **Dashboard:** Dev Dashboard + Employee Dashboard

### Graphic Designer
- **Name:** `Emma Design`
- **Phone:** `+91-9876543215` or `9876543215`
- **Role:** `Graphic Designer`
- **Department:** Creative
- **Dashboard:** Design Dashboard + Employee Dashboard

---

## 🎯 Freelancer Category

### Freelancer
- **Name:** `Alex Freelancer`
- **Phone:** `+91-9876543216` or `9876543216`
- **Role:** `Freelancer`
- **Department:** N/A
- **Dashboard:** Freelancer Dashboard

---

## 🎓 Intern Category

### Marketing Intern
- **Name:** `Priya Intern`
- **Phone:** `+91-9876543218` or `9876543218`
- **Role:** `Intern`
- **Department:** Marketing
- **Dashboard:** Intern Dashboard

---

## 👔 Management Category

### Operations Head
- **Name:** `Jennifer Operations`
- **Phone:** `+91-9876543221` or `9876543221`
- **Role:** `Operations Head`
- **Department:** Operations
- **Dashboard:** Operations Dashboard + Management Dashboard

---

## 🔧 Admin Category

### Accountant
- **Name:** `Michael Accountant`
- **Phone:** `+91-9876543222` or `9876543222`
- **Role:** `Accountant`
- **Department:** Finance
- **Dashboard:** Accounting Dashboard + Admin Dashboard

### Sales Representative
- **Name:** `Amanda Sales`
- **Phone:** `+91-9876543223` or `9876543223`
- **Role:** `Sales`
- **Department:** Sales
- **Dashboard:** Sales Dashboard + Admin Dashboard

### HR Manager
- **Name:** `Rachel HR`
- **Phone:** `+91-9876543224` or `9876543224`
- **Role:** `HR`
- **Department:** Human Resources
- **Dashboard:** HR Dashboard + Admin Dashboard

---

## 👑 Super Admin Category

### Super Administrator
- **Name:** `Admin Super`
- **Phone:** `+91-9876543225` or `9876543225`
- **Role:** `Super Admin`
- **Department:** Administration
- **Dashboard:** Super Admin Dashboard (Full Access)

---

## 📋 Quick Test Credentials

For quick testing, use these simplified credentials:

| Role | Name | Phone | Quick Access |
|------|------|-------|-------------|
| Employee | `John SEO` | `9876543210` | Marketing Employee |
| HR | `Rachel HR` | `9876543224` | HR Management |
| Admin | `Admin Super` | `9876543225` | Full Admin Access |
| Freelancer | `Alex Freelancer` | `9876543216` | Freelancer Portal |
| Intern | `Priya Intern` | `9876543218` | Intern Dashboard |

---

## 🧪 Testing Instructions

### Basic Login Test
1. Open http://localhost:5173
2. Click "Login" button
3. Try any credential from above
4. Verify you're redirected to the correct dashboard

### Role-Based Access Test
1. Login with different roles
2. Verify each role sees appropriate dashboard
3. Check navigation and permissions
4. Test logout functionality

### Phone Number Formats
The system accepts phone numbers in these formats:
- `+91-9876543210` (with country code and dash)
- `+919876543210` (with country code, no dash)
- `9876543210` (without country code)

---

## 🔍 Troubleshooting

### Login Issues
- **Exact Match Required:** Name and phone must match exactly
- **Role Selection:** Make sure to select the correct role from dropdown
- **Case Sensitive:** Names are case-sensitive (e.g., "John SEO" not "john seo")

### Common Errors
- **"Invalid credentials":** Check name spelling and phone number
- **"Role mismatch":** Ensure selected role matches the user's actual role
- **"User not found":** Verify the name is typed exactly as shown above

---

## 📊 Dashboard Access Matrix

| User Category | Available Dashboards |
|---------------|---------------------|
| Employee | Employee Dashboard + Role-specific Dashboard |
| Freelancer | Freelancer Dashboard |
| Intern | Intern Dashboard |
| Management | Management Dashboard + Operations Dashboard |
| Admin | Admin Dashboard + Role-specific Dashboard |
| Super Admin | All Dashboards (Full Access) |

---

## 🎯 Test Scenarios

### Scenario 1: Employee Workflow
1. Login as `John SEO` (SEO Employee)
2. Access SEO Dashboard
3. Check employee-specific features
4. Test profile management

### Scenario 2: Management Oversight
1. Login as `Jennifer Operations` (Operations Head)
2. Access management dashboard
3. Review employee performance
4. Test administrative functions

### Scenario 3: Admin Functions
1. Login as `Rachel HR` (HR Manager)
2. Access HR dashboard
3. Test employee management
4. Review HR-specific features

### Scenario 4: Super Admin Access
1. Login as `Admin Super` (Super Admin)
2. Access all dashboards
3. Test system-wide controls
4. Verify full administrative access

---

## 📝 Notes

- All credentials are for **testing purposes only**
- The application uses **local fallback authentication** when database is unavailable
- Phone numbers can be entered with or without the `+91-` country code
- Each role has specific dashboard access and permissions
- Logout functionality is available in the header dropdown menu

---

**Last Updated:** January 2025  
**Status:** ✅ All credentials tested and verified