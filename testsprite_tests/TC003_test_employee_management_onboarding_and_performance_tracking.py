import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:5173"
AUTH = HTTPBasicAuth("Admin", "9876543225")
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_employee_management_onboarding_and_performance_tracking():
    employee_id = None
    try:
        # Step 1: Employee Onboarding - Create new employee
        onboarding_payload = {
            "firstName": "Test",
            "lastName": "Employee",
            "email": "test.employee@example.com",
            "role": "employee",
            "startDate": "2025-09-01",
            "department": "Marketing",
            "phone": "1234567890",
            "status": "active",
            "password": "Password123!"
        }
        onboarding_resp = requests.post(
            f"{BASE_URL}/api/employees/onboard",
            json=onboarding_payload,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert onboarding_resp.status_code == 201, "Employee onboarding failed"
        employee_id = onboarding_resp.json().get('id')
        assert employee_id is not None, "Onboarded employee ID not returned"

        # Step 2: Track Performance Metrics - Add performance data for the employee
        performance_payload = {
            "employeeId": employee_id,
            "kpis": {
                "monthlySales": 15000,
                "clientSatisfaction": 4.5,
                "attendance": 95
            },
            "reviewPeriod": "2025-09"
        }
        performance_resp = requests.post(
            f"{BASE_URL}/api/employees/{employee_id}/performance",
            json=performance_payload,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert performance_resp.status_code == 200, "Failed to add performance metrics"
        perf_data = performance_resp.json()
        assert perf_data.get("employeeId") == employee_id, "Performance data employee ID mismatch"

        # Step 3: Manage Leave Application - Submit a leave application
        leave_payload = {
            "employeeId": employee_id,
            "leaveType": "Annual",
            "startDate": "2025-10-10",
            "endDate": "2025-10-15",
            "reason": "Vacation"
        }
        leave_resp = requests.post(
            f"{BASE_URL}/api/employees/{employee_id}/leave",
            json=leave_payload,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert leave_resp.status_code == 201, "Leave application submission failed"
        leave_id = leave_resp.json().get('leaveId')
        assert leave_id is not None, "Leave ID not returned"

        # Step 4: Profile Update - Update employee profile info
        profile_update_payload = {
            "phone": "0987654321",
            "department": "Sales"
        }
        profile_update_resp = requests.put(
            f"{BASE_URL}/api/employees/{employee_id}/profile",
            json=profile_update_payload,
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert profile_update_resp.status_code == 200, "Employee profile update failed"
        updated_profile = profile_update_resp.json()
        assert updated_profile.get("phone") == "0987654321", "Phone update not reflected"
        assert updated_profile.get("department") == "Sales", "Department update not reflected"

        # Step 5: Verify role-based authentication enforcement - Try to fetch employee info as Admin (allowed)
        get_employee_resp = requests.get(
            f"{BASE_URL}/api/employees/{employee_id}",
            auth=AUTH,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert get_employee_resp.status_code == 200, "Admin should access employee data"
        employee_data = get_employee_resp.json()
        assert employee_data.get("id") == employee_id, "Fetched employee ID mismatch"

        # Step 6: Role-based access check: attempt restricted action with limited role token
        # Simulate login for a role with limited permission (e.g., "intern")
        intern_auth = HTTPBasicAuth("InternUser", "internpass123")
        restricted_resp = requests.delete(
            f"{BASE_URL}/api/employees/{employee_id}",
            auth=intern_auth,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert restricted_resp.status_code in [401, 403], "Restricted role should not delete employee"

    finally:
        # Cleanup - Delete the employee created if exists
        if employee_id:
            try:
                requests.delete(
                    f"{BASE_URL}/api/employees/{employee_id}",
                    auth=AUTH,
                    headers=HEADERS,
                    timeout=TIMEOUT
                )
            except Exception:
                pass

test_employee_management_onboarding_and_performance_tracking()
