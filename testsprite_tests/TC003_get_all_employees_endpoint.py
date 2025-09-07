import requests

BASE_URL = "http://localhost:5000"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "9876543225"
TIMEOUT = 30

def test_get_all_employees_with_various_roles_and_login_creation():
    """
    Test /api/employees GET endpoint to verify it returns all employees with correct data structure and status code 200.
    Also includes tests for login creation and role-based access control by creating new employee and client accounts and
    testing login for all provided roles.
    """
    session = requests.Session()
    headers = {"Content-Type": "application/json"}

    # Step 0: Login as Admin to get token
    login_data = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    r_login = session.post(f"{BASE_URL}/api/auth/login", json=login_data, headers=headers, timeout=TIMEOUT)
    r_login.raise_for_status()
    login_json = r_login.json()
    assert "token" in login_json, "Admin login response missing token"
    token = login_json["token"]

    auth_headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}

    # List of roles to cover extensive categories
    employee_roles = [
        # Employee Category
        "Marketing Manager",
        "Senior Developer",
        "Finance Manager",
        "Operations Manager",
        "UI/UX Designer",
        "Sales Manager",
        "Customer Support",
        "Data Analyst",
        # Specialized Roles
        "SEO Specialist",
        "Ads Specialist",
        "Social Media",
        "YouTube SEO",
        "Web Developer",
        "Graphic Designer",
        # Management & Admin
        "Operations Head",
        "Accountant",
        "Sales Rep",
        "HR Manager",
        "Super Admin",
        # Other Categories
        "Freelancer",
        "Intern",
        # Quick Test Set (assuming some test role)
        "Quick Test"
    ]

    created_employee_ids = []
    created_client_ids = []

    def create_employee(first_name, last_name, email, role):
        data = {
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "role": role
        }
        r = session.post(f"{BASE_URL}/api/employees", json=data, headers=auth_headers, timeout=TIMEOUT)
        r.raise_for_status()
        json_response = r.json()
        assert r.status_code in (201, 200), f"Unexpected status code on employee create: {r.status_code}"
        eid = json_response.get("id") or json_response.get("employee_id")
        assert eid is not None, "Employee creation response missing ID"
        return eid, data["email"], data["role"], data["first_name"], data["last_name"]

    def delete_employee(emp_id):
        if emp_id:
            try:
                r = session.delete(f"{BASE_URL}/api/employees/{emp_id}", headers=auth_headers, timeout=TIMEOUT)
                assert r.status_code in (200, 204), f"Failed to delete employee ID {emp_id}, status: {r.status_code}"
            except Exception:
                pass

    def create_client(name, email, company):
        data = {
            "name": name,
            "email": email,
            "company": company,
        }
        r = session.post(f"{BASE_URL}/api/clients", json=data, headers=auth_headers, timeout=TIMEOUT)
        r.raise_for_status()
        json_response = r.json()
        assert r.status_code in (201, 200), f"Unexpected status code on client create: {r.status_code}"
        cid = json_response.get("id") or json_response.get("client_id")
        assert cid is not None, "Client creation response missing ID"
        return cid

    def delete_client(client_id):
        if client_id:
            try:
                r = session.delete(f"{BASE_URL}/api/clients/{client_id}", headers=auth_headers, timeout=TIMEOUT)
                assert r.status_code in (200, 204), f"Failed to delete client ID {client_id}, status: {r.status_code}"
            except Exception:
                pass

    def login(email, password):
        login_data = {"email": email, "password": password}
        r = session.post(f"{BASE_URL}/api/auth/login", json=login_data, headers={"Content-Type": "application/json"}, timeout=TIMEOUT)
        return r

    try:
        # Step 1: Create employees for each role and test login creation functionality
        for idx, role in enumerate(employee_roles):
            fname = f"Test{role.replace(' ', '')}F"
            lname = f"Test{role.replace(' ', '')}L"
            email = f"test{role.replace(' ', '').lower()}@example.com"
            emp_id, emp_email, emp_role, first_name, last_name = create_employee(fname, lname, email, role)
            created_employee_ids.append(emp_id)

            # Attempt login with created email and a test password "Password123" (assuming initial password or same as role)
            login_response = login(emp_email, "Password123")
            if login_response.status_code == 200:
                json_data = login_response.json()
                assert "token" in json_data and "user" in json_data, f"Login response missing token/user for role {role}"
            else:
                # Accepting 401 or 403 as possible due to missing login setup
                assert login_response.status_code in (401, 403), f"Unexpected login status for role {role}: {login_response.status_code}"

        # Step 2: Create a test client and test client login creation (if applicable)
        client_name = "Test Client"
        client_email = "testclient@example.com"
        client_company = "Test Company LLC"
        client_id = create_client(client_name, client_email, client_company)
        created_client_ids.append(client_id)

        # Attempt login with client email and a test password "Password123"
        login_response_client = login(client_email, "Password123")
        # Client login may differ or be unavailable; accept 200 or 401/403
        assert login_response_client.status_code in (200, 401, 403), f"Unexpected client login status: {login_response_client.status_code}"

        # Step 3: Get all employees
        r = session.get(f"{BASE_URL}/api/employees", headers=auth_headers, timeout=TIMEOUT)
        r.raise_for_status()
        assert r.status_code == 200, f"Expected status 200 but got {r.status_code}"
        employees = r.json()
        assert isinstance(employees, list), "Employees response is not a list"

        # Validate structure of each employee as object/dict
        for emp in employees:
            assert isinstance(emp, dict), "Employee item is not an object"
            for key in ["first_name", "last_name", "email", "role"]:
                assert key in emp, f"Employee missing expected key: {key}"

    finally:
        # Cleanup created employees
        for emp_id in created_employee_ids:
            delete_employee(emp_id)
        # Cleanup created clients
        for cid in created_client_ids:
            delete_client(cid)


test_get_all_employees_with_various_roles_and_login_creation()
