import requests

BASE_AUTH_URL = "http://localhost:8000"
LOGIN_ENDPOINT = "/api/auth/login"
LOGOUT_ENDPOINT = "/api/auth/logout"
TIMEOUT = 30

def test_secure_multi_role_authentication_login():
    login_url = BASE_AUTH_URL + LOGIN_ENDPOINT
    logout_url = BASE_AUTH_URL + LOGOUT_ENDPOINT

    # Test credentials provided
    credentials = {
        "email": "marketing.manager@example.com",
        "password": "password123"
    }

    session = requests.Session()

    try:
        # Step 1: Login using email and password credentials
        login_resp = session.post(login_url, json=credentials, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        assert "token" in login_data or "sessionId" in login_data or "user" in login_data, "Missing authentication token/session in response"
        # If token-based, set Authorization header for the session
        token = login_data.get("token")
        if token:
            session.headers.update({"Authorization": f"Bearer {token}"})

        # Step 2: Verify role information presence in response (role-based access)
        user_info = login_data.get("user") or {}
        user_role = user_info.get("role") or login_data.get("role")
        assert user_role, "No role information returned in login response"

        # Step 3: Test login fallback with phone number and role-based info (simulate another login)
        # Assuming API accepts username as phone or name, here use Admin username and password from instructions
        fallback_credentials = {"username": "Admin", "password": "9876543225"}
        fallback_login_resp = requests.post(
            login_url, json=fallback_credentials, timeout=TIMEOUT
        )
        assert fallback_login_resp.status_code == 200, f"Fallback login failed with status {fallback_login_resp.status_code}"
        fallback_data = fallback_login_resp.json()
        assert "token" in fallback_data or "sessionId" in fallback_data or "user" in fallback_data, "Missing token/session in fallback login response"

        # Step 4: Confirm session consistency - logout and then verify access is revoked
        logout_resp = session.post(logout_url, timeout=TIMEOUT)
        assert logout_resp.status_code == 200 or logout_resp.status_code == 204, f"Logout failed with status {logout_resp.status_code}"

        # After logout, access to protected endpoint should be denied
        protected_url = BASE_AUTH_URL + "/api/employees"  # example protected resource
        protected_resp = session.get(protected_url, timeout=TIMEOUT)
        # Expect unauthorized after logout
        assert protected_resp.status_code in (401, 403), "Access to protected resource not denied after logout"

    except requests.RequestException as e:
        assert False, f"RequestException during test: {e}"
    finally:
        session.close()

test_secure_multi_role_authentication_login()