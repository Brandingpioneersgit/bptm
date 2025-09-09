import requests

BASE_FRONTEND_URL = "http://localhost:5173"
BASE_BACKEND_URL = "http://localhost:8000"
LOGIN_ENDPOINT = "/api/auth/login"
LOGOUT_ENDPOINT = "/api/auth/logout"
EMPLOYEES_ENDPOINT = "/api/employees"

AUTH_CREDENTIALS = {
    "email": "manager@example.com",
    "password": "Password123!"
}

TIMEOUT = 30


def test_employee_onboarding_and_hr_approval_workflow():
    session = requests.Session()
    try:
        # Login and get auth token / session cookie
        login_response = session.post(
            BASE_BACKEND_URL + LOGIN_ENDPOINT,
            json=AUTH_CREDENTIALS,
            timeout=TIMEOUT
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        auth_data = login_response.json()
        # The system likely returns a token or sets cookies, use session for cookies
        # Check expected fields to confirm login success
        assert "token" in auth_data or session.cookies, "Authentication token or cookies missing"

        headers = {}
        if "token" in auth_data:
            token = auth_data["token"]
            headers["Authorization"] = f"Bearer {token}"

        # Step 1: Create a new employee onboarding form (simulate onboarding)
        new_employee_payload = {
            "firstName": "Test",
            "lastName": "Employee",
            "email": "test.employee@example.com",
            "position": "Marketing Intern",
            "department": "Marketing",
            "startDate": "2025-10-01",
            "status": "onboarding",
            "profileCompleted": False,
            "hrApprovalStatus": "pending"
        }
        create_resp = session.post(
            BASE_BACKEND_URL + EMPLOYEES_ENDPOINT,
            json=new_employee_payload,
            headers=headers,
            timeout=TIMEOUT
        )
        assert create_resp.status_code == 201, f"Employee creation failed: {create_resp.text}"
        employee = create_resp.json()
        assert "id" in employee, "Created employee response missing ID"
        employee_id = employee["id"]

        # Step 2: Simulate signup navigation by fetching the employee record
        get_emp_resp = session.get(
            f"{BASE_BACKEND_URL}{EMPLOYEES_ENDPOINT}/{employee_id}",
            headers=headers,
            timeout=TIMEOUT
        )
        assert get_emp_resp.status_code == 200, f"Fetching employee failed: {get_emp_resp.text}"
        employee_data = get_emp_resp.json()
        # Verify onboarding fields
        assert employee_data.get("status") == "onboarding", "Employee status should be onboarding"
        assert employee_data.get("email") == new_employee_payload["email"], "Employee email mismatch"

        # Step 3: Simulate HR approval - update approval status
        hr_approval_update = {
            "hrApprovalStatus": "approved",
            "status": "active",
            "profileCompleted": True
        }
        update_resp = session.put(
            f"{BASE_BACKEND_URL}{EMPLOYEES_ENDPOINT}/{employee_id}",
            json=hr_approval_update,
            headers=headers,
            timeout=TIMEOUT
        )
        assert update_resp.status_code == 200, f"HR approval update failed: {update_resp.text}"
        updated_employee = update_resp.json()
        assert updated_employee.get("hrApprovalStatus") == "approved", "HR approval status not updated"
        assert updated_employee.get("status") == "active", "Employee status not updated to active"
        assert updated_employee.get("profileCompleted") is True, "Profile completion flag not updated"

        # Step 4: Confirm changes reflect in employee profile
        final_get_resp = session.get(
            f"{BASE_BACKEND_URL}{EMPLOYEES_ENDPOINT}/{employee_id}",
            headers=headers,
            timeout=TIMEOUT
        )
        assert final_get_resp.status_code == 200, f"Fetching employee after update failed: {final_get_resp.text}"
        final_data = final_get_resp.json()
        assert final_data.get("hrApprovalStatus") == "approved", "Final HR approval status incorrect"
        assert final_data.get("status") == "active", "Final employee status incorrect"
        assert final_data.get("profileCompleted") is True, "Final profile completion flag incorrect"

    finally:
        # Clean up: delete the created employee to maintain test isolation
        # Attempt delete only if employee_id exists
        try:
            if 'employee_id' in locals():
                del_resp = session.delete(
                    f"{BASE_BACKEND_URL}{EMPLOYEES_ENDPOINT}/{employee_id}",
                    headers=headers,
                    timeout=TIMEOUT
                )
                # Allow 200 or 204 as successful deletes
                assert del_resp.status_code in (200, 204), f"Failed to delete employee: {del_resp.text}"
        except Exception as e:
            # Log or pass as we must not break test cleanup
            pass

        # Logout to clean session if possible
        try:
            session.post(
                BASE_BACKEND_URL + LOGOUT_ENDPOINT,
                headers=headers,
                timeout=TIMEOUT
            )
        except Exception:
            pass


test_employee_onboarding_and_hr_approval_workflow()
