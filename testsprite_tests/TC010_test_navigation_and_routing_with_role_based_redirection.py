import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:5173"
TIMEOUT = 30
USERNAME = "admin@example.com"
PASSWORD = "9876543225"

# List of roles to test role-based redirection and protected route access
USER_ROLES = [
    "admin",
    "super_admin",
    "manager",
    "employee",
    "seo",
    "hr",
    "accountant",
    "sales",
    "operations_head",
    "client",
    "seo_team",
    "financial_analyst",
    "project_manager",
    "lead_developer",
    "qa_engineer",
    # Add more if applicable
]

# Known protected routes and their allowed roles for this test (example, assumed)
PROTECTED_ROUTES = {
    "/dashboard/admin": ["admin", "super_admin"],
    "/dashboard/manager": ["manager", "super_admin"],
    "/dashboard/employee": ["employee", "hr", "seo", "accountant", "sales"],
    "/dashboard/client": ["client"],
    "/employee/onboarding": ["admin", "hr", "super_admin"],
    "/client/onboarding": ["admin", "manager", "super_admin"],
    "/reports/quarterly": ["manager", "super_admin"],
    "/sales/kanban": ["sales", "manager", "super_admin"],
    "/accounts/compliance": ["accountant", "operations_head", "super_admin"],
    # Add more routes as relevant from PRD features
}

def authenticate(username, password):
    """Authenticate user and return auth token if successful."""
    url = f"{BASE_URL}/api/auth/login"
    try:
        response = requests.post(
            url,
            json={"email": username, "password": password},
            timeout=TIMEOUT
        )
        response.raise_for_status()
        data = response.json()
        token = data.get("token")
        return token
    except requests.RequestException:
        return None

def get_user_role_from_token(token):
    """Fetch user info to determine role from token."""
    url = f"{BASE_URL}/api/auth/userinfo"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
        data = response.json()
        return data.get("role")
    except requests.RequestException:
        return None

def test_navigation_and_routing_with_role_based_redirection():
    # Authenticate as Admin first (Admin credentials from instructions)
    token = authenticate(USERNAME, PASSWORD)
    assert token is not None, "Authentication failed for Admin user."

    # Test database sync operation endpoint (example sync endpoint from PRD context)
    sync_url = f"{BASE_URL}/api/database/sync"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        sync_response = requests.post(sync_url, headers=headers, timeout=TIMEOUT)
        assert sync_response.status_code == 200, "Database sync failed."
        sync_data = sync_response.json()
        assert sync_data.get("status") == "success", "Database sync response invalid."
    except requests.RequestException as e:
        assert False, f"Exception during database sync: {e}"

    # For each user role, authenticate and test protected routes and redirection
    for role in USER_ROLES:
        # Simulate login for each role (assuming endpoint /api/auth/login supports role-specific test users)
        login_url = f"{BASE_URL}/api/auth/login"
        # Payload: username formatted as role_user@example.com to differentiate in test environment
        user_username = f"{role}_user@example.com"
        # Password same or could be role specific; here assume 'password123' for test users
        user_password = "password123"

        try:
            login_resp = requests.post(
                login_url,
                json={"email": user_username, "password": user_password},
                timeout=TIMEOUT
            )
            if login_resp.status_code != 200:
                # User may not exist or invalid creds, skip testing this role
                continue
            user_token = login_resp.json().get("token")
            assert user_token, f"Token missing for role {role}"
        except requests.RequestException:
            # Skip role if login fails
            continue

        auth_headers = {"Authorization": f"Bearer {user_token}"}

        for route, allowed_roles in PROTECTED_ROUTES.items():
            route_url = f"{BASE_URL}{route}"

            try:
                resp = requests.get(route_url, headers=auth_headers, timeout=TIMEOUT)

                if role in allowed_roles:
                    # Allowed role: expect 200 OK or redirect handled at frontend (simulate API success)
                    assert resp.status_code == 200, (
                        f"Role '{role}' should have access to '{route}' but got status {resp.status_code}"
                    )
                    # Response should contain expected data or dashboard info
                    data = resp.json()
                    assert "dashboard" in data or "access" in data or "content" in data, (
                        f"Missing expected keys in dashboard response for role '{role}' at '{route}'"
                    )
                else:
                    # Disallowed role: expect 403 Forbidden or redirect (simulate API deny)
                    assert resp.status_code in (401, 403), (
                        f"Role '{role}' should be denied access to '{route}' but got status {resp.status_code}"
                    )
            except requests.RequestException as e:
                assert False, f"Exception accessing route '{route}' for role '{role}': {e}"

        # Test navigation utilities via API if available (e.g., get navigation menu for role)
        nav_url = f"{BASE_URL}/api/navigation/menu"
        try:
            nav_resp = requests.get(nav_url, headers=auth_headers, timeout=TIMEOUT)
            assert nav_resp.status_code == 200, f"Failed to get navigation menu for role {role}"
            nav_data = nav_resp.json()
            assert isinstance(nav_data, list), "Navigation menu data should be a list"
            # Verify menu items correspond to role permissions roughly
            for item in nav_data:
                assert "name" in item and "path" in item, "Invalid navigation menu item format"
        except requests.RequestException as e:
            assert False, f"Exception fetching navigation menu for role '{role}': {e}"

    # Test onboarding workflow APIs with Admin token for coverage
    new_employee_payload = {
        "name": "Test Employee",
        "email": "testemployee@example.com",
        "role": "employee",
        "department": "marketing",
    }
    employee_onboarding_url = f"{BASE_URL}/api/employees/onboard"
    created_employee_id = None
    try:
        create_resp = requests.post(employee_onboarding_url, headers=headers, json=new_employee_payload, timeout=TIMEOUT)
        assert create_resp.status_code == 201, "Employee onboarding failed to create resource."
        created_employee = create_resp.json()
        created_employee_id = created_employee.get("id")
        assert created_employee_id is not None, "Created employee ID missing."

        # Verify onboarding data retrieval
        get_resp = requests.get(f"{employee_onboarding_url}/{created_employee_id}", headers=headers, timeout=TIMEOUT)
        assert get_resp.status_code == 200, "Failed to retrieve created employee onboarding data."
        emp_data = get_resp.json()
        for key in new_employee_payload:
            assert emp_data.get(key) == new_employee_payload[key], f"Mismatch in employee {key}"

    finally:
        # Cleanup created employee onboarding record if exists
        if created_employee_id:
            try:
                del_resp = requests.delete(f"{employee_onboarding_url}/{created_employee_id}", headers=headers, timeout=TIMEOUT)
                assert del_resp.status_code == 204, "Failed to delete created employee onboarding record."
            except requests.RequestException:
                pass

    # Test client onboarding similarly
    new_client_payload = {
        "company_name": "Test Client Inc",
        "contact_email": "contact@testclient.com",
        "service_type": "digital_marketing",
        "status": "pending",
    }
    client_onboarding_url = f"{BASE_URL}/api/clients/onboard"
    created_client_id = None
    try:
        create_resp = requests.post(client_onboarding_url, headers=headers, json=new_client_payload, timeout=TIMEOUT)
        assert create_resp.status_code == 201, "Client onboarding failed to create resource."
        created_client = create_resp.json()
        created_client_id = created_client.get("id")
        assert created_client_id is not None, "Created client ID missing."

        # Verify client data retrieval
        get_resp = requests.get(f"{client_onboarding_url}/{created_client_id}", headers=headers, timeout=TIMEOUT)
        assert get_resp.status_code == 200, "Failed to retrieve created client onboarding data."
        client_data = get_resp.json()
        for key in new_client_payload:
            assert client_data.get(key) == new_client_payload[key], f"Mismatch in client {key}"

    finally:
        # Cleanup created client onboarding record if exists
        if created_client_id:
            try:
                del_resp = requests.delete(f"{client_onboarding_url}/{created_client_id}", headers=headers, timeout=TIMEOUT)
                assert del_resp.status_code == 204, "Failed to delete created client onboarding record."
            except requests.RequestException:
                pass

test_navigation_and_routing_with_role_based_redirection()
