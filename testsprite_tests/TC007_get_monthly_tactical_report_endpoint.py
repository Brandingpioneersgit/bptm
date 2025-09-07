import requests

BASE_URL = "http://localhost:5000"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
REPORT_URL = f"{BASE_URL}/api/reports/monthly-tactical"
TIMEOUT = 30

# List of user credentials to test login (email and password assumed based on role naming conventions)
# Since PRD lacks specific emails and passwords for each role, we'll simulate username-password pairs.
# Replace these with actual valid credentials as appropriate.
USER_CREDENTIALS = [
    # Employee Category
    {"email": "marketing.manager@example.com", "password": "Password123!"},
    {"email": "senior.developer@example.com", "password": "Password123!"},
    {"email": "finance.manager@example.com", "password": "Password123!"},
    {"email": "operations.manager@example.com", "password": "Password123!"},
    {"email": "uiux.designer@example.com", "password": "Password123!"},
    {"email": "sales.manager@example.com", "password": "Password123!"},
    {"email": "customer.support@example.com", "password": "Password123!"},
    {"email": "data.analyst@example.com", "password": "Password123!"},
    # Specialized Roles
    {"email": "seo.specialist@example.com", "password": "Password123!"},
    {"email": "ads.specialist@example.com", "password": "Password123!"},
    {"email": "social.media@example.com", "password": "Password123!"},
    {"email": "youtube.seo@example.com", "password": "Password123!"},
    {"email": "web.developer@example.com", "password": "Password123!"},
    {"email": "graphic.designer@example.com", "password": "Password123!"},
    # Management & Admin
    {"email": "operations.head@example.com", "password": "Password123!"},
    {"email": "accountant@example.com", "password": "Password123!"},
    {"email": "sales.rep@example.com", "password": "Password123!"},
    {"email": "hr.manager@example.com", "password": "Password123!"},
    {"email": "super.admin@example.com", "password": "Password123!"},
    # Other Categories
    {"email": "freelancer@example.com", "password": "Password123!"},
    {"email": "intern@example.com", "password": "Password123!"},
    # Quick Test Set (examples)
    {"email": "test.user1@example.com", "password": "Password123!"},
    {"email": "test.user2@example.com", "password": "Password123!"},
]

# New employee and client data to test creation and login creation functionality
NEW_EMPLOYEE = {
    "first_name": "Test",
    "last_name": "Employee",
    "email": "test.employee@example.com",
    "role": "Intern"
}

NEW_CLIENT = {
    "name": "Test Client",
    "email": "test.client@example.com",
    "company": "Test Company"
}

EMPLOYEES_POST_URL = f"{BASE_URL}/api/employees"
CLIENTS_POST_URL = f"{BASE_URL}/api/clients"

def test_get_monthly_tactical_report_role_based_access():
    # Helper to login and return token
    def login(email, password):
        resp = requests.post(
            LOGIN_URL,
            json={"email": email, "password": password},
            timeout=TIMEOUT
        )
        if resp.status_code == 200:
            token = resp.json().get("token")
            assert token, f"Login succeeded but no token returned for {email}"
            return token
        else:
            raise Exception(f"Login failed for {email} with status {resp.status_code}: {resp.text}")

    # Helper to logout
    def logout(token):
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.post(f"{BASE_URL}/api/auth/logout", headers=headers, timeout=TIMEOUT)
        assert resp.status_code == 200, f"Logout failed with status {resp.status_code}"

    # Helper to create new employee, returns created employee ID
    def create_employee():
        resp = requests.post(EMPLOYEES_POST_URL, json=NEW_EMPLOYEE, timeout=TIMEOUT)
        if resp.status_code == 200 or resp.status_code == 201:
            data = resp.json()
            emp_id = data.get("id") or data.get("employee_id")
            assert emp_id, "Employee creation response missing id"
            return emp_id
        else:
            raise Exception(f"Employee creation failed with status {resp.status_code}: {resp.text}")

    # Helper to delete employee by ID
    def delete_employee(emp_id, token):
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.delete(f"{EMPLOYEES_POST_URL}/{emp_id}", headers=headers, timeout=TIMEOUT)
        # If delete is not implemented or returns not found, ignore
        if resp.status_code not in (200, 204, 404):
            raise Exception(f"Failed to delete employee {emp_id} with status {resp.status_code}")

    # Helper to create new client, returns created client ID
    def create_client():
        resp = requests.post(CLIENTS_POST_URL, json=NEW_CLIENT, timeout=TIMEOUT)
        if resp.status_code == 200 or resp.status_code == 201:
            data = resp.json()
            client_id = data.get("id") or data.get("client_id")
            assert client_id, "Client creation response missing id"
            return client_id
        else:
            raise Exception(f"Client creation failed with status {resp.status_code}: {resp.text}")

    # Helper to delete client by ID
    def delete_client(client_id, token):
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.delete(f"{CLIENTS_POST_URL}/{client_id}", headers=headers, timeout=TIMEOUT)
        # If delete is not implemented or returns not found, ignore
        if resp.status_code not in (200, 204, 404):
            raise Exception(f"Failed to delete client {client_id} with status {resp.status_code}")

    # Store tokens map email->token
    tokens = {}

    # Login all predefined users
    for cred in USER_CREDENTIALS:
        try:
            token = login(cred["email"], cred["password"])
            tokens[cred["email"]] = token
        except Exception as e:
            # If user credential is invalid or login fails, fail test
            assert False, str(e)

    # Create and login new employee
    new_employee_id = None
    new_employee_token = None
    try:
        new_employee_id = create_employee()
        # Attempt login as new employee using email and test password
        new_employee_token = login(NEW_EMPLOYEE["email"], "Password123!")  # Assuming default password on creation
        tokens[NEW_EMPLOYEE["email"]] = new_employee_token
    except Exception as e:
        assert False, f"New employee creation or login failed: {e}"

    # Create and login new client
    new_client_id = None
    new_client_token = None
    try:
        new_client_id = create_client()
        # Attempt login as client (assuming clients can login)
        new_client_token = login(NEW_CLIENT["email"], "Password123!")  # Assuming default password on creation
        tokens[NEW_CLIENT["email"]] = new_client_token
    except Exception:
        # Clients may not have login, ignore if login fails here
        pass

    try:
        # For each logged-in user, test the monthly tactical report access
        for email, token in tokens.items():
            headers = {"Authorization": f"Bearer {token}"}
            resp = requests.get(REPORT_URL, headers=headers, timeout=TIMEOUT)
            assert resp.status_code == 200, f"User {email} failed to get monthly tactical report, status {resp.status_code}"
            # Basic response content checks:
            json_data = resp.json()
            assert isinstance(json_data, (dict, list)), f"Unexpected response format for user {email}"
    finally:
        # Clean up created employee
        if new_employee_id and new_employee_token:
            try:
                delete_employee(new_employee_id, new_employee_token)
            except Exception:
                pass
        # Clean up created client (if token available)
        if new_client_id and new_client_token:
            try:
                delete_client(new_client_id, new_client_token)
            except Exception:
                pass

        # Logout all users
        for token in tokens.values():
            try:
                logout(token)
            except Exception:
                pass

test_get_monthly_tactical_report_role_based_access()
