import requests

BASE_URL = "http://localhost:5173"
AUTH_USERNAME = "Admin"
AUTH_PASSWORD = "9876543225"
TIMEOUT = 30

# Defined roles (assuming these 15+ roles exist in the system)
ROLES = [
    "employee", "manager", "admin", "super_admin", "seo", "hr", "accountant",
    "operations_head", "sales", "client_user", "auditor", "finance", "developer",
    "support", "marketing"
]

# Sample protected endpoints with required roles (hypothetical based on PRD)
# The value is a list of roles allowed to access the endpoint
PROTECTED_ENDPOINTS = {
    "/api/employee/onboarding": ["admin", "hr", "super_admin"],
    "/api/client/onboarding": ["admin", "manager", "super_admin"],
    "/api/employee/performance": ["manager", "admin", "super_admin"],
    "/api/seo/appraisal": ["seo", "super_admin"],
    "/api/sales/leads": ["sales", "manager", "super_admin"],
    "/api/accounts/payments": ["accountant", "finance", "super_admin"],
    "/api/notifications": ROLES,  # All roles can access notifications
    "/api/reports/monthly-tactical": ["manager", "admin", "super_admin"],
    "/api/reports/quarterly-strategic": ["super_admin"],
    "/api/audit/logs": ["auditor", "super_admin"],
}

def get_auth_token(username, password):
    """Authenticate and get token if authentication endpoint exists."""
    # Assuming authentication is basic token with HTTP Basic Auth
    # For testing these endpoints, we will send basic auth headers directly
    return requests.auth.HTTPBasicAuth(username, password)

def test_permission_and_access_control_enforcement():
    auth = get_auth_token(AUTH_USERNAME, AUTH_PASSWORD)
    headers = {"Accept": "application/json"}

    # Iterate all roles to test access (simulate by attempting to access endpoints with different roles)
    # Since we only have one credential, simulate role by an assumed endpoint param or header
    # For this test, attempt to access endpoints with the Admin user (should have full access),
    # then try access without auth (unauthorized),
    # and then test clients with insufficient roles by faking a role header or param if allowed.

    # 1. Test access for Admin - should be allowed on all protected endpoints
    for endpoint, allowed_roles in PROTECTED_ENDPOINTS.items():
        url = BASE_URL + endpoint
        try:
            response = requests.get(url, headers=headers, auth=auth, timeout=TIMEOUT)
            assert response.status_code == 200, f"Admin should have access to {endpoint}. Status: {response.status_code}"
        except requests.RequestException as e:
            assert False, f"Request to {url} failed unexpectedly: {e}"

    # 2. Test access without authentication - should be denied (401 or 403)
    for endpoint in PROTECTED_ENDPOINTS.keys():
        url = BASE_URL + endpoint
        try:
            response = requests.get(url, headers=headers, timeout=TIMEOUT)
            assert response.status_code in (401, 403), f"Unauthenticated request to {endpoint} should be denied, got {response.status_code}"
        except requests.RequestException as e:
            assert False, f"Request to {url} failed unexpectedly: {e}"

    # 3. Test access with other roles - simulate by changing credentials or adding a header "X-Role"
    # Since actual different credentials are not given, simulate by adding header "X-Role" and expecting access deny for roles not allowed.
    # We will test that role-based access control denies roles not in allowed_roles.

    # For testing, assume that passing 'X-Role' header is honored by backend (simulation)
    headers.update({"Authorization": f"Basic dummytoken"})  # dummy auth to skip auth failure
    for endpoint, allowed_roles in PROTECTED_ENDPOINTS.items():
        url = BASE_URL + endpoint
        for role in ROLES:
            if role == "admin":
                continue  # admin tested above

            test_headers = headers.copy()
            test_headers["X-Role"] = role

            try:
                response = requests.get(url, headers=test_headers, timeout=TIMEOUT)
                if role in allowed_roles:
                    assert response.status_code == 200, \
                        f"Role '{role}' should have access to {endpoint}, got {response.status_code}"
                else:
                    assert response.status_code in (401, 403), \
                        f"Role '{role}' should be denied access to {endpoint}, got {response.status_code}"
            except requests.RequestException as e:
                assert False, f"Request to {url} with role {role} failed unexpectedly: {e}"

    # 4. Test database sync operation endpoint permission
    # Assuming an endpoint /api/database/sync exists and only super_admin can access
    sync_endpoint = BASE_URL + "/api/database/sync"
    # Admin access
    try:
        response = requests.post(sync_endpoint, headers=headers, auth=auth, timeout=TIMEOUT)
        assert response.status_code == 403 or response.status_code == 401, \
            "Admin should not have access to database sync if restricted to super_admin"
    except requests.RequestException as e:
        assert False, f"Request to {sync_endpoint} failed unexpectedly: {e}"

    # Super admin simulated via X-Role header, bypassing real auth here for test
    try:
        response = requests.post(sync_endpoint, headers={"X-Role": "super_admin"}, timeout=TIMEOUT)
        # Accept 200 or 202 as success (depends on implementation)
        assert response.status_code in (200, 202), f"super_admin should be able to perform DB sync, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"Request to {sync_endpoint} failed unexpectedly: {e}"

    # 5. Test onboarding workflows permissions for employee and client
    # Employee onboarding endpoint, allowed roles
    emp_onboarding_url = BASE_URL + "/api/employee/onboarding"
    # Attempt POST with allowed role admin
    employee_payload = {
        "name": "Test Employee",
        "email": "test.employee@example.com",
        "role": "employee"
    }
    try:
        response = requests.post(emp_onboarding_url, headers={"Content-Type": "application/json"}, json=employee_payload, auth=auth, timeout=TIMEOUT)
        assert response.status_code in (200, 201), f"Admin should be able to onboard employee, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"POST to {emp_onboarding_url} failed unexpectedly: {e}"

    # Client onboarding - only allowed for admin, manager, super_admin
    client_onboarding_url = BASE_URL + "/api/client/onboarding"
    client_payload = {
        "company_name": "Test Client Co",
        "contact_email": "contact@testclient.com"
    }
    try:
        response = requests.post(client_onboarding_url, headers={"Content-Type": "application/json"}, json=client_payload, auth=auth, timeout=TIMEOUT)
        assert response.status_code in (200, 201), f"Admin should be able to onboard client, got {response.status_code}"
    except requests.RequestException as e:
        assert False, f"POST to {client_onboarding_url} failed unexpectedly: {e}"

    # Negative test - disallowed role tries employee onboarding - simulate with X-Role 'client_user'
    try:
        response = requests.post(emp_onboarding_url, headers={"Content-Type": "application/json", "X-Role": "client_user"}, json=employee_payload, timeout=TIMEOUT)
        assert response.status_code in (401, 403), "client_user role should be denied access to employee onboarding"
    except requests.RequestException as e:
        assert False, f"POST to {emp_onboarding_url} with client_user role failed unexpectedly: {e}"


test_permission_and_access_control_enforcement()