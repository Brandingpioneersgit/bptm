import requests

BASE_API_URL = "http://localhost:8000"
BASE_APP_URL = "http://localhost:5173"
LOGIN_ENDPOINT = "/api/auth/login"
LOGOUT_ENDPOINT = "/api/auth/logout"

EMAIL = "marketing.manager@example.com"
PASSWORD = "password123"

TIMEOUT = 30


def test_navigation_and_protected_route_role_based_redirection():
    session = requests.Session()
    try:
        # Login to backend API to obtain auth token or session cookie
        login_resp = session.post(
            f"{BASE_API_URL}{LOGIN_ENDPOINT}",
            json={"email": EMAIL, "password": PASSWORD},
            timeout=TIMEOUT,
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        # We expect token or session cookie; first try token in response
        token = login_data.get("token")
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        else:
            # fallback assume session cookie handled by session
            pass

        # Define a set of restricted endpoints and open endpoints to test navigation & role-based redirects
        # According to instructions, test that user with marketing manager role:
        # - can access permitted endpoints
        # - is redirected or forbidden for unauthorized endpoints
        # Since no exact mapping is given, we test a few representative endpoints:

        accessible_endpoints = [
            "/api/reports/monthly-tactical",
            "/api/sales/leads",
            "/api/notifications",
        ]
        # endpoints that marketing manager likely cannot access (Admin/Super Admin routes)
        protected_endpoints = [
            "/api/employees",
            "/api/clients",
            "/api/workspaces",
            "/api/payments",
            "/api/audit/logs",
        ]

        # Check allowed access endpoints
        for ep in accessible_endpoints:
            resp = session.get(f"{BASE_API_URL}{ep}", headers=headers, timeout=TIMEOUT)
            assert resp.status_code == 200, f"Access to {ep} denied unexpectedly: {resp.status_code} {resp.text}"
            try:
                data = resp.json()
                assert isinstance(data, (dict, list)), f"Invalid JSON response at {ep}"
            except Exception as e:
                assert False, f"Response JSON parse error at {ep}: {str(e)}"

        # Check protected endpoints - expect 403 Forbidden or 401 Unauthorized or redirection
        for ep in protected_endpoints:
            resp = session.get(f"{BASE_API_URL}{ep}", headers=headers, timeout=TIMEOUT)
            # Accept 401 or 403 as expected denial, or redirect status (3xx)
            assert resp.status_code in (401, 403), (
                f"Unauthorized access not enforced for {ep}. "
                f"Status: {resp.status_code}, Response: {resp.text}"
            )

        # Additional check: verify navigation to frontend protected route redirects unauthorized user properly
        # Since this is frontend on localhost:5173, simulate navigation by requesting protected routes without valid role
        # For simplicity, test a known protected frontend route (simulate fetching HTML)

        protected_frontend_paths = [
            "/admin/dashboard",
            "/employees/manage",
            "/finance/payments",
        ]
        for path in protected_frontend_paths:
            # request without frontend auth headers (simulate unauthorized user)
            resp = requests.get(f"{BASE_APP_URL}{path}", timeout=TIMEOUT, allow_redirects=False)
            # Expect redirect status to login or landing page (e.g. 302 or 303)
            assert resp.status_code in (302, 303), (
                f"Frontend protected route {path} did not redirect unauthorized user. "
                f"Status: {resp.status_code}"
            )
            location = resp.headers.get("Location", "")
            assert location, f"Redirect missing Location header on {path}"
            # Location should be login or home page path on frontend
            assert any(login_path in location for login_path in ["/login", "/"]), (
                f"Redirect location for {path} unexpected: {location}"
            )

        # Now simulate login to frontend with marketing manager and check role-based dashboard or route access

        # Login at frontend (simulate form post to backend)
        frontend_login_resp = session.post(
            f"{BASE_API_URL}{LOGIN_ENDPOINT}",
            json={"email": EMAIL, "password": PASSWORD},
            timeout=TIMEOUT,
        )
        assert frontend_login_resp.status_code == 200, f"Frontend login failed: {frontend_login_resp.text}"

        # After login, access marketing manager dashboard
        marketing_dashboard_path = "/manager/dashboard"
        resp = session.get(f"{BASE_APP_URL}{marketing_dashboard_path}", timeout=TIMEOUT)
        # Should be accessible: 200 OK with HTML or JSON content
        assert resp.status_code == 200, f"Marketing Manager dashboard not accessible: {resp.status_code}"

        # Attempt accessing unauthorized role dashboard and expect redirect to not authorized page or dashboard home
        unauthorized_dashboard_paths = [
            "/admin/dashboard",
            "/superadmin/dashboard",
        ]
        for path in unauthorized_dashboard_paths:
            resp = session.get(f"{BASE_APP_URL}{path}", timeout=TIMEOUT, allow_redirects=False)
            assert resp.status_code in (302, 303), (
                f"Unauthorized dashboard {path} did not redirect user. Status: {resp.status_code}"
            )
            location = resp.headers.get("Location", "")
            assert location, f"Redirect missing Location header on {path}"
            assert any(page in location for page in ["/manager/dashboard", "/not-authorized", "/"]), (
                f"Redirect location for {path} unexpected: {location}"
            )
    finally:
        # Logout for cleanup/session end
        session.post(f"{BASE_API_URL}{LOGOUT_ENDPOINT}", timeout=TIMEOUT)


test_navigation_and_protected_route_role_based_redirection()