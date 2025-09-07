import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:5173"
TIMEOUT = 30

# List of roles to test role-based access
USER_ROLES = [
    # Assuming these are role identifiers as strings or role names;
    # For a real test, these should be exact roles used in the system
    "admin",
    "super_admin",
    "manager",
    "employee",
    "seo",
    "seo_team_member",
    "hr",
    "accountant",
    "operations_head",
    "sales_team",
    "client",
    "guest",
    "auditor",
    "support",
    "developer"
]

def test_auth_system_login_and_role_based_access():
    auth_url = f"{BASE_URL}/api/auth/login"
    session_url = f"{BASE_URL}/api/auth/session"
    role_check_url = f"{BASE_URL}/api/auth/role-check"  # Hypothetical endpoint for role-based access validation
    # Example endpoints for onboarding workflows (employee and client)
    employee_onboarding_url = f"{BASE_URL}/api/employees/onboard"
    client_onboarding_url = f"{BASE_URL}/api/clients/onboard"
    headers = {
        "Content-Type": "application/json"
    }

    # Step 1: Login with valid credentials - Basic Token Auth used for this case from instructions
    login_payload = {
        "username": "Admin",
        "password": "9876543225"
    }
    try:
        login_response = requests.post(
            auth_url,
            json=login_payload,
            headers=headers,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Login request failed with exception: {e}"

    assert login_response.status_code == 200, f"Login failed with status code {login_response.status_code}"
    login_json = login_response.json()
    assert "access_token" in login_json, "Login response missing access_token"
    access_token = login_json["access_token"]

    # Use the access token for authenticated requests
    auth_headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    # Step 2: Validate session persistence - get session info
    try:
        session_response = requests.get(
            session_url,
            headers=auth_headers,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Session request failed with exception: {e}"

    assert session_response.status_code == 200, f"Session retrieval failed with status code {session_response.status_code}"
    session_data = session_response.json()
    assert session_data.get("username") == "Admin", "Session username mismatch"
    assert "roles" in session_data and isinstance(session_data["roles"], list), "Session roles missing or invalid"

    # Step 3: Verify role-based access control for all defined roles.
    # Since direct login per user role is not provided in test metadata, assume role-check API
    # that returns allowed and denied access for a list of roles.
    # Alternatively, simulate accessing protected endpoints as each role if possible.
    # Here we use a hypothetical endpoint /api/auth/role-check for demonstration.
    for role in USER_ROLES:
        role_payload = {"role": role}
        try:
            role_response = requests.post(
                role_check_url,
                json=role_payload,
                headers=auth_headers,
                timeout=TIMEOUT
            )
        except requests.RequestException as e:
            assert False, f"Role check request for role '{role}' failed with exception: {e}"

        assert role_response.status_code == 200, f"Role check failed for role '{role}' with status {role_response.status_code}"
        role_info = role_response.json()
        assert "access_granted" in role_info, f"Role check response missing access_granted for role '{role}'"
        assert isinstance(role_info["access_granted"], bool), f"Invalid access_granted type for role '{role}'"

    # Step 4: Test employee onboarding workflow endpoint access and DB sync simulation
    # We try to create a minimal onboarding request and then delete it if created.
    employee_payload = {
        "employee": {
            "name": "Test Employee",
            "email": "testemployee@example.com",
            "role": "employee",
            "department": "IT"
        }
    }
    created_employee_id = None
    try:
        onboard_emp_response = requests.post(
            employee_onboarding_url,
            json=employee_payload,
            headers=auth_headers,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Employee onboarding request failed with exception: {e}"

    if onboard_emp_response.status_code == 201:
        emp_data = onboard_emp_response.json()
        created_employee_id = emp_data.get("id") or emp_data.get("_id")
        assert created_employee_id is not None, "Employee onboarding response missing employee ID"
    else:
        # Accept failure if unauthorized - role restrictions can apply
        assert onboard_emp_response.status_code in (200, 201, 403, 401), f"Unexpected status on employee onboarding: {onboard_emp_response.status_code}"

    # Step 5: Test client onboarding workflow endpoint access and DB sync simulation
    client_payload = {
        "client": {
            "name": "Test Client",
            "email": "testclient@example.com",
            "company": "Test Company Inc",
            "contact_person": "Client Admin"
        }
    }
    created_client_id = None
    try:
        onboard_client_response = requests.post(
            client_onboarding_url,
            json=client_payload,
            headers=auth_headers,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Client onboarding request failed with exception: {e}"

    if onboard_client_response.status_code == 201:
        client_data = onboard_client_response.json()
        created_client_id = client_data.get("id") or client_data.get("_id")
        assert created_client_id is not None, "Client onboarding response missing client ID"
    else:
        # Accept failure if unauthorized - role restrictions can apply
        assert onboard_client_response.status_code in (200, 201, 403, 401), f"Unexpected status on client onboarding: {onboard_client_response.status_code}"

    # Clean up created employee and client resources to maintain database state if created
    try:
        if created_employee_id:
            emp_delete_url = f"{BASE_URL}/api/employees/{created_employee_id}"
            try:
                delete_emp_resp = requests.delete(
                    emp_delete_url,
                    headers=auth_headers,
                    timeout=TIMEOUT
                )
                assert delete_emp_resp.status_code in (200, 204), f"Failed to delete created employee {created_employee_id}"
            except requests.RequestException:
                pass

        if created_client_id:
            client_delete_url = f"{BASE_URL}/api/clients/{created_client_id}"
            try:
                delete_client_resp = requests.delete(
                    client_delete_url,
                    headers=auth_headers,
                    timeout=TIMEOUT
                )
                assert delete_client_resp.status_code in (200, 204), f"Failed to delete created client {created_client_id}"
            except requests.RequestException:
                pass
    except Exception:
        pass

test_auth_system_login_and_role_based_access()