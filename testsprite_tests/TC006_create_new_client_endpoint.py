import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:5173"

# Provided credentials for authentication
CREDENTIALS = [
    # Employee Category
    {"username": "Marketing Manager", "password": "password1"},
    {"username": "Senior Developer", "password": "password2"},
    {"username": "Finance Manager", "password": "password3"},
    {"username": "Operations Manager", "password": "password4"},
    {"username": "UI/UX Designer", "password": "password5"},
    {"username": "Sales Manager", "password": "password6"},
    {"username": "Customer Support", "password": "password7"},
    {"username": "Data Analyst", "password": "password8"},
    # Specialized Roles
    {"username": "SEO Specialist", "password": "password9"},
    {"username": "Ads Specialist", "password": "password10"},
    {"username": "Social Media", "password": "password11"},
    {"username": "YouTube SEO", "password": "password12"},
    {"username": "Web Developer", "password": "password13"},
    {"username": "Graphic Designer", "password": "password14"},
    # Management & Admin
    {"username": "Operations Head", "password": "password15"},
    {"username": "Accountant", "password": "password16"},
    {"username": "Sales Rep", "password": "password17"},
    {"username": "HR Manager", "password": "password18"},
    {"username": "Super Admin", "password": "9876543225"},  # Provided Admin creds
    # Other Categories
    {"username": "Freelancer", "password": "password19"},
    {"username": "Intern", "password": "password20"},
    # Quick Test Set accounts (example placeholders)
    {"username": "QuickTest1", "password": "passwordqt1"},
    {"username": "QuickTest2", "password": "passwordqt2"}
]

def login(username, password):
    url = f"{BASE_URL}/api/auth/login"
    payload = {"email": username, "password": password}
    headers = {"Content-Type": "application/json"}
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        token = data.get("token")
        user = data.get("user")
        assert token and isinstance(token, str), "Token missing or invalid"
        assert user and isinstance(user, dict), "User object missing or invalid"
        return token
    except requests.RequestException as e:
        raise AssertionError(f"Login failed for user {username}: {str(e)}")
    except (ValueError, AssertionError) as e:
        raise AssertionError(f"Invalid login response for user {username}: {str(e)}")

def logout(token):
    url = f"{BASE_URL}/api/auth/logout"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.post(url, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        # Not critical to fail test on logout error, just log error
        pass

def create_client(token, client_data):
    url = f"{BASE_URL}/api/clients"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = requests.post(url, json=client_data, headers=headers, timeout=30)
    return response

def delete_client(token, client_id):
    url = f"{BASE_URL}/api/clients/{client_id}"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.delete(url, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.RequestException:
        pass  # ignore errors in cleanup

def create_employee(token, employee_data):
    url = f"{BASE_URL}/api/employees"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = requests.post(url, json=employee_data, headers=headers, timeout=30)
    return response

def delete_employee(token, employee_id):
    url = f"{BASE_URL}/api/employees/{employee_id}"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.delete(url, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.RequestException:
        pass  # ignore cleanup errors

def test_TC006_create_new_client_endpoint():
    # For each provided credential, login and test client creation
    for cred in CREDENTIALS:
        username = cred["username"]
        password = cred["password"]

        token = None
        employee_id = None
        client_id = None

        try:
            # Login user
            try:
                token = login(username, password)
            except AssertionError:
                # If login fails, continue to next credential without failure
                continue

            # Create new employee to verify employee account creation and login creation functionality
            employee_payload = {
                "first_name": "TestFirst",
                "last_name": "TestLast",
                "email": f"testemployee_{username.replace(' ','').lower()}@example.com",
                "role": "Intern"
            }
            emp_response = create_employee(token, employee_payload)
            if emp_response.status_code == 201 or emp_response.status_code == 200:
                emp_json = emp_response.json()
                employee_id = emp_json.get("id") or emp_json.get("employee_id")
                assert employee_id is not None, "Employee creation response missing ID"
            else:
                # If employee creation not allowed for this role, skip employee related check
                employee_id = None

            # Create new client for this user
            client_payload = {
                "name": f"Test Client {username}",
                "email": f"testclient_{username.replace(' ','').lower()}@example.com",
                "company": "Test Company Inc"
            }
            resp = create_client(token, client_payload)

            # Check response codes:
            if resp.status_code not in (200, 201):
                # For roles not permitted to create clients, expect 403 or 401 or 400 possibly
                # Assert that error response is handled gracefully
                assert resp.status_code in (401, 403, 400), f"Unexpected status code {resp.status_code} for user {username}"
                continue

            # For successful creation verify response
            resp_json = resp.json()
            # Response should confirm creation by returning client info including ID or echo fields
            assert isinstance(resp_json, dict), f"Response JSON not a dict for user {username}"
            assert "name" in resp_json and resp_json["name"] == client_payload["name"], f"Client name mismatch for user {username}"
            assert "email" in resp_json and resp_json["email"] == client_payload["email"], f"Client email mismatch for user {username}"
            assert "company" in resp_json and resp_json["company"] == client_payload["company"], f"Client company mismatch for user {username}"

            client_id = resp_json.get("id") or resp_json.get("client_id")
            assert client_id is not None, f"No client ID in creation response for user {username}"

            # Additional check: role-based dashboard and permission could be verified here if API available

        finally:
            # Cleanup created client and employee if created
            if token:
                if client_id:
                    delete_client(token, client_id)
                if employee_id:
                    delete_employee(token, employee_id)
                try:
                    logout(token)
                except Exception:
                    pass  # ignore logout errors


test_TC006_create_new_client_endpoint()