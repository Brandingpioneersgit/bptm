import requests
from requests.auth import HTTPBasicAuth

base_url = "http://localhost:5173"
login_url = f"{base_url}/api/auth/login"
logout_url = f"{base_url}/api/auth/logout"
workspaces_url = f"{base_url}/api/workspaces"
timeout = 30

# Credentials as per instructions for multiple user roles
user_credentials = [
    {"email": "marketing.manager@example.com", "password": "pass1234"},
    {"email": "senior.developer@example.com", "password": "pass1234"},
    {"email": "finance.manager@example.com", "password": "pass1234"},
    {"email": "operations.manager@example.com", "password": "pass1234"},
    {"email": "ui.ux.designer@example.com", "password": "pass1234"},
    {"email": "sales.manager@example.com", "password": "pass1234"},
    {"email": "customer.support@example.com", "password": "pass1234"},
    {"email": "data.analyst@example.com", "password": "pass1234"},
    {"email": "seo.specialist@example.com", "password": "pass1234"},
    {"email": "ads.specialist@example.com", "password": "pass1234"},
    {"email": "social.media@example.com", "password": "pass1234"},
    {"email": "youtube.seo@example.com", "password": "pass1234"},
    {"email": "web.developer@example.com", "password": "pass1234"},
    {"email": "graphic.designer@example.com", "password": "pass1234"},
    {"email": "operations.head@example.com", "password": "pass1234"},
    {"email": "accountant@example.com", "password": "pass1234"},
    {"email": "sales.rep@example.com", "password": "pass1234"},
    {"email": "hr.manager@example.com", "password": "pass1234"},
    {"email": "super.admin@example.com", "password": "pass1234"},
    {"email": "freelancer@example.com", "password": "pass1234"},
    {"email": "intern@example.com", "password": "pass1234"},
    {"email": "quicktest1@example.com", "password": "pass1234"},
    {"email": "quicktest2@example.com", "password": "pass1234"}
]

def test_get_all_workspaces_endpoint():
    headers = {"Content-Type": "application/json"}
    for cred in user_credentials:
        token = None
        try:
            # Login
            login_resp = requests.post(
                login_url,
                json={"email": cred["email"], "password": cred["password"]},
                headers=headers,
                timeout=timeout,
            )
            assert login_resp.status_code == 200, f"Login failed for {cred['email']}"
            login_data = login_resp.json()
            assert "token" in login_data and "user" in login_data, f"Invalid login response for {cred['email']}"

            token = login_data["token"]
            auth_headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            }

            # Get all workspaces
            ws_resp = requests.get(workspaces_url, headers=auth_headers, timeout=timeout)
            assert ws_resp.status_code == 200, f"Workspace GET failed for {cred['email']}"
            workspaces = ws_resp.json()
            assert isinstance(workspaces, list), f"Workspaces response is not a list for {cred['email']}"

            # Additional basic structure check if list has elements
            if workspaces:
                assert isinstance(workspaces[0], dict), f"Workspace item is not an object for {cred['email']}"

        finally:
            # Logout if token was acquired
            if token:
                try:
                    requests.post(logout_url, headers={"Authorization": f"Bearer {token}"}, timeout=timeout)
                except Exception:
                    pass

test_get_all_workspaces_endpoint()