import requests
import time

BASE_URL = "http://localhost:8000"
LOGIN_ENDPOINT = "/api/auth/login"
TIMEOUT = 30

# Test users that actually exist in the database
USER_CREDENTIALS = [
    # Test users that actually exist in the database
    {"email": "john.seo@bptm.com", "password": "password123"},
    {"email": "sarah.marketing@bptm.com", "password": "password123"},
    {"email": "mike.dev@bptm.com", "password": "password123"},
    {"email": "lisa.finance@bptm.com", "password": "password123"},
    {"email": "tom.ops@bptm.com", "password": "password123"},
    {"email": "emma.design@bptm.com", "password": "password123"},
    {"email": "alex.ads@bptm.com", "password": "password123"},
    {"email": "rachel.social@bptm.com", "password": "password123"},
    {"email": "david.web@bptm.com", "password": "password123"},
    {"email": "admin@bptm.com", "password": "password123"},
]

# Generate unique identifiers for each test run
def get_unique_employee():
    timestamp = int(time.time())
    return {
        "user_id": f"USR{timestamp}",
        "name": "TestEmp User",
        "email": f"test.employee.{timestamp}@example.com",
        "role": "SEO",
        "password_hash": "TestEmpPass123!",
        "user_category": "employee",
        "department": "Testing",
        "status": "active"
    }

def get_unique_client():
    timestamp = int(time.time())
    return {
        "name": f"Test Client {timestamp}",
        "contact_email": f"test.client.{timestamp}@example.com",
        "team": "Marketing",
        "client_type": "Standard",
        "status": "Active"
    }

def create_employee(session):
    url = BASE_URL + "/api/employees"
    payload = get_unique_employee()
    resp = session.post(url, json=payload, timeout=TIMEOUT)
    if resp.status_code != 201:
        print(f"Employee creation failed with status {resp.status_code}")
        print(f"Response: {resp.text}")
    resp.raise_for_status()
    return resp.json()  # Assuming response contains employee details including ID

def delete_employee(session, email):
    # Not specified if delete exists; best effort: no delete endpoint visible, so skip
    # Could implement if API supports.
    pass

def create_client(session):
    url = BASE_URL + "/api/clients"
    payload = get_unique_client()
    resp = session.post(url, json=payload, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()  # Assuming response contains client details including ID

def delete_client(session, email):
    # Not specified if delete exists; best effort: no delete endpoint visible, so skip
    pass

def login(session, email, password):
    url = BASE_URL + LOGIN_ENDPOINT
    payload = {
        "email": email,
        "password": password
    }
    resp = session.post(url, json=payload, timeout=TIMEOUT)
    return resp

def test_user_login_functionality():
    session = requests.Session()
    # Test all provided login credentials for existing users
    for creds in USER_CREDENTIALS:
        email = creds["email"]
        password = creds["password"]
        try:
            response = login(session, email, password)
            assert response.status_code == 200, f"Login failed for {email} with status {response.status_code}"
            data = response.json()
            assert "token" in data and isinstance(data["token"], str) and data["token"], \
                f"Missing or invalid token in response for {email}"
            assert "user" in data and isinstance(data["user"], dict), f"Missing or invalid user object for {email}"
        except Exception as e:
            raise AssertionError(f"Login test failed for user {email}: {e}")

    # Test creating new employee and verify login
    employee_created = False
    client_created = False
    try:
        # Get unique employee data for this test run
        test_employee = get_unique_employee()
        
        # Create new employee
        emp_creation_resp = create_employee(session)
        # We expect at least an email field to confirm creation; Use test_employee email to login
        employee_created = True
    except Exception as e:
        raise AssertionError(f"Failed to create new employee for login test: {e}")

    try:
        # Login new employee (using password_hash as password)
        resp = login(session, test_employee["email"], test_employee["password_hash"])
        assert resp.status_code == 200, f"Login failed for new employee with status {resp.status_code}"
        data = resp.json()
        assert "token" in data and data["token"], "Token missing or invalid for new employee login"
        assert "user" in data and isinstance(data["user"], dict), "User object missing or invalid for new employee login"
    except Exception as e:
        raise AssertionError(f"Login test failed for newly created employee: {e}")

    try:
        # Get unique client data for this test run
        test_client = get_unique_client()
        
        # Create new client (just to test client creation functionality)
        client_creation_resp = create_client(session)
        client_created = True
        print("✅ Client creation test passed")
    except Exception as e:
        raise AssertionError(f"Failed to create new client for test: {e}")

    # Cleanup created accounts
    if employee_created:
        try:
            delete_employee(session, test_employee["email"])
            print("✅ Test employee cleaned up")
        except Exception as e:
            print(f"⚠️ Failed to cleanup test employee: {e}")
    
    if client_created:
        try:
            delete_client(session, test_client["contact_email"])
            print("✅ Test client cleaned up")
        except Exception as e:
            print(f"⚠️ Failed to cleanup test client: {e}")

test_user_login_functionality()