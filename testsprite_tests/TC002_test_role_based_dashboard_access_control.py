import requests

BASE_URL = "http://localhost:8000"
LOGIN_ENDPOINT = "/api/auth/login"
DASHBOARD_ENDPOINTS = {
    "Super Admin": "/api/super-admin/dashboard",
    "Admin": "/api/admin/dashboard",
    "Manager": "/api/manager/dashboard",
    "Employee": "/api/employee/dashboard",
    "Freelancer": "/api/freelancer/dashboard",
    "Intern": "/api/intern/dashboard"
}
TIMEOUT = 30

# Test credentials for various roles (assuming these are set in the test system)
ROLE_CREDENTIALS = {
    "Super Admin": {"email": "super.admin@example.com", "password": "password123"},
    "Admin": {"email": "admin@example.com", "password": "password123"},
    "Manager": {"email": "marketing.manager@example.com", "password": "password123"},
    "Employee": {"email": "employee@example.com", "password": "password123"},
    "Freelancer": {"email": "freelancer@example.com", "password": "password123"},
    "Intern": {"email": "intern@example.com", "password": "password123"},
}

# Authorized dashboards mapping per role - list of dashboards each role can access
ROLE_AUTHORIZED_DASHBOARDS = {
    "Super Admin": set(DASHBOARD_ENDPOINTS.values()),
    "Admin": set(DASHBOARD_ENDPOINTS.values()) - {DASHBOARD_ENDPOINTS["Super Admin"]},
    "Manager": {DASHBOARD_ENDPOINTS["Manager"]},
    "Employee": {DASHBOARD_ENDPOINTS["Employee"]},
    "Freelancer": {DASHBOARD_ENDPOINTS["Freelancer"]},
    "Intern": {DASHBOARD_ENDPOINTS["Intern"]},
}

def login(email, password, role):
    payload = {"email": email, "password": password}
    try:
        response = requests.post(
            BASE_URL + LOGIN_ENDPOINT,
            json=payload,
            timeout=TIMEOUT
        )
        response.raise_for_status()
        data = response.json()
        token = data.get("token")
        assert token, "Login successful but token not found in response"
        return token
    except requests.RequestException as e:
        raise AssertionError(f"Login failed for {email}: {str(e)}")

def test_role_based_dashboard_access_control():
    for role, creds in ROLE_CREDENTIALS.items():
        token = login(creds["email"], creds["password"], role)
        headers = {"Authorization": f"Bearer {token}"}
        
        # Check access to all dashboards
        for dashboard_role, endpoint in DASHBOARD_ENDPOINTS.items():
            url = BASE_URL + endpoint
            try:
                response = requests.get(url, headers=headers, timeout=TIMEOUT)
            except requests.RequestException as e:
                assert False, f"Request to {url} failed for role {role}: {str(e)}"
            
            if endpoint in ROLE_AUTHORIZED_DASHBOARDS[role]:
                # Should be accessible: expect 200 OK and valid JSON dashboard data
                assert response.status_code == 200, (
                    f"Role {role} should have access to {dashboard_role} dashboard at {endpoint}, "
                    f"but got HTTP {response.status_code}"
                )
                try:
                    data = response.json()
                except Exception:
                    assert False, f"Role {role} got non-JSON response at {endpoint}"
                # Basic sanity check: dashboard should contain "dashboard" or "data" key
                assert any(k in data for k in ("dashboard", "data", "user", "role")), (
                    f"Role {role} dashboard response missing expected keys at {endpoint}"
                )
            else:
                # Should not be accessible: expect 403 Forbidden or 401 Unauthorized
                assert response.status_code in (401, 403), (
                    f"Role {role} should NOT have access to {dashboard_role} dashboard at {endpoint}, "
                    f"but got HTTP {response.status_code}"
                )

test_role_based_dashboard_access_control()
