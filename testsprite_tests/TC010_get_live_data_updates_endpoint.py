import requests

BASE_URL = "http://localhost:5173"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
LIVE_DATA_URL = f"{BASE_URL}/api/live-data"
LOGOUT_URL = f"{BASE_URL}/api/auth/logout"

# Users by categories with sample email and password to test login
USER_CREDENTIALS = [
    # Employee Category
    {"email": "marketing.manager@example.com", "password": "password123"},
    {"email": "senior.developer@example.com", "password": "password123"},
    {"email": "finance.manager@example.com", "password": "password123"},
    {"email": "operations.manager@example.com", "password": "password123"},
    {"email": "uiux.designer@example.com", "password": "password123"},
    {"email": "sales.manager@example.com", "password": "password123"},
    {"email": "customer.support@example.com", "password": "password123"},
    {"email": "data.analyst@example.com", "password": "password123"},
    # Specialized Roles
    {"email": "seo.specialist@example.com", "password": "password123"},
    {"email": "ads.specialist@example.com", "password": "password123"},
    {"email": "social.media@example.com", "password": "password123"},
    {"email": "youtube.seo@example.com", "password": "password123"},
    {"email": "web.developer@example.com", "password": "password123"},
    {"email": "graphic.designer@example.com", "password": "password123"},
    # Management & Admin
    {"email": "operations.head@example.com", "password": "password123"},
    {"email": "accountant@example.com", "password": "password123"},
    {"email": "sales.rep@example.com", "password": "password123"},
    {"email": "hr.manager@example.com", "password": "password123"},
    {"email": "super.admin@example.com", "password": "password123"},
    # Other Categories
    {"email": "freelancer@example.com", "password": "password123"},
    {"email": "intern@example.com", "password": "password123"},
    # Quick Test Set accounts (assumed)
    {"email": "quicktest1@example.com", "password": "password123"},
    {"email": "quicktest2@example.com", "password": "password123"}
]

def login(email, password):
    try:
        resp = requests.post(
            LOGIN_URL,
            json={"email": email, "password": password},
            timeout=30
        )
        resp.raise_for_status()
        json_resp = resp.json()
        assert "token" in json_resp and "user" in json_resp, "Missing token or user in login response"
        return json_resp["token"]
    except Exception as e:
        raise AssertionError(f"Login failed for {email}: {str(e)}")

def logout(token):
    try:
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.post(LOGOUT_URL, headers=headers, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        # Log but do not raise to avoid masking main errors
        print(f"Logout failed: {str(e)}")

def get_live_data(token):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(LIVE_DATA_URL, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()

def test_get_live_data_updates():
    # Test all provided login credentials
    for creds in USER_CREDENTIALS:
        token = None
        try:
            token = login(creds["email"], creds["password"])
            data = get_live_data(token)
            assert isinstance(data, dict), "Live data response is not a JSON object"
            # Validate status and update information presence
            assert "status" in data, "Missing 'status' key in live data"
            assert "updates" in data, "Missing 'updates' key in live data"
            # Optionally check status value and updates type
            assert isinstance(data["status"], str), "'status' should be a string"
            assert isinstance(data["updates"], (list, dict)), "'updates' should be a list or dict"
        finally:
            if token:
                logout(token)

test_get_live_data_updates()