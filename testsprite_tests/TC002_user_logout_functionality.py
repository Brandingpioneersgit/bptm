import requests

BASE_URL = "http://localhost:5173"
TIMEOUT = 30

# User credentials by category and roles
user_credentials = {
    "Employee Category": [
        {"email": "marketing.manager@example.com", "password": "MarketingPass123"},
        {"email": "senior.developer@example.com", "password": "SeniorDevPass123"},
        {"email": "finance.manager@example.com", "password": "FinancePass123"},
        {"email": "operations.manager@example.com", "password": "OperationsPass123"},
        {"email": "ui.ux.designer@example.com", "password": "UIUXPass123"},
        {"email": "sales.manager@example.com", "password": "SalesPass123"},
        {"email": "customer.support@example.com", "password": "SupportPass123"},
        {"email": "data.analyst@example.com", "password": "DataAnalystPass123"}
    ],
    "Specialized Roles": [
        {"email": "seo.specialist@example.com", "password": "SEOPass123"},
        {"email": "ads.specialist@example.com", "password": "AdsPass123"},
        {"email": "social.media@example.com", "password": "SocialMediaPass123"},
        {"email": "youtube.seo@example.com", "password": "YouTubePass123"},
        {"email": "web.developer@example.com", "password": "WebDevPass123"},
        {"email": "graphic.designer@example.com", "password": "GraphicPass123"}
    ],
    "Management & Admin": [
        {"email": "operations.head@example.com", "password": "OpsHeadPass123"},
        {"email": "accountant@example.com", "password": "AccountantPass123"},
        {"email": "sales.rep@example.com", "password": "SalesRepPass123"},
        {"email": "hr.manager@example.com", "password": "HRManagerPass123"},
        {"email": "super.admin@example.com", "password": "SuperAdminPass123"}
    ],
    "Other Categories": [
        {"email": "freelancer@example.com", "password": "FreelancerPass123"},
        {"email": "intern@example.com", "password": "InternPass123"}
    ],
    "Quick Test Set": [
        {"email": "quick.test1@example.com", "password": "QuickTest123"},
        {"email": "quick.test2@example.com", "password": "QuickTest234"}
    ]
}

def create_employee(first_name, last_name, email, role, token):
    url = f"{BASE_URL}/api/employees"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "role": role
    }
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()

def delete_employee(employee_id, token):
    url = f"{BASE_URL}/api/employees/{employee_id}"
    headers = {"Authorization": f"Bearer {token}"}
    # Assuming the API supports DELETE for employee deletion, if not adjust accordingly
    response = requests.delete(url, headers=headers, timeout=TIMEOUT)
    # No assertion here, best effort cleanup

def create_client(name, email, company, token):
    url = f"{BASE_URL}/api/clients"
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": name,
        "email": email,
        "company": company
    }
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    return response.json()

def delete_client(client_id, token):
    url = f"{BASE_URL}/api/clients/{client_id}"
    headers = {"Authorization": f"Bearer {token}"}
    # Assuming the API supports DELETE for client deletion, if not adjust accordingly
    response = requests.delete(url, headers=headers, timeout=TIMEOUT)
    # No assertion here, best effort cleanup

def login(email, password):
    url = f"{BASE_URL}/api/auth/login"
    payload = {"email": email, "password": password}
    response = requests.post(url, json=payload, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    assert "token" in data and isinstance(data["token"], str)
    assert "user" in data and isinstance(data["user"], dict)
    return data["token"]

def logout(token):
    url = f"{BASE_URL}/api/auth/logout"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(url, headers=headers, timeout=TIMEOUT)
    return response

def test_user_logout_functionality():
    # First test existing user credentials for login and logout
    for category, creds_list in user_credentials.items():
        for creds in creds_list:
            email = creds["email"]
            password = creds["password"]
            try:
                token = login(email, password)
                logout_response = logout(token)
                assert logout_response.status_code == 200
                assert logout_response.text or logout_response.content  # Expecting some confirmation content
            except requests.HTTPError as e:
                assert False, f"HTTPError during login/logout for user {email}: {e}"
            except AssertionError as e:
                raise

    # Use Admin credentials (from instructions) to create and test new employee and client accounts
    admin_token = None
    try:
        admin_email = "Admin"
        admin_password = "9876543225"
        admin_token = login(admin_email, admin_password)

        # Create new employee
        new_employee_payload = {
            "first_name": "TestFirst",
            "last_name": "TestLast",
            "email": "test.employee@example.com",
            "role": "Intern"
        }
        created_employee = create_employee(
            new_employee_payload["first_name"],
            new_employee_payload["last_name"],
            new_employee_payload["email"],
            new_employee_payload["role"],
            admin_token
        )
        employee_email = new_employee_payload["email"]
        employee_password = "TestEmp1234"  # Assuming password is preset or same as in test, else login may fail
        employee_id = created_employee.get("id", None)

        # Test login/logout for new employee
        if employee_id:
            try:
                token = login(employee_email, employee_password)
                logout_response = logout(token)
                assert logout_response.status_code == 200
            except requests.HTTPError as e:
                # For this test, if login fails due to password or setup, fail the test
                assert False, f"HTTPError during login/logout for new employee: {e}"
            except AssertionError as e:
                raise
        else:
            assert False, "New employee creation response missing employee ID"

        # Create new client
        new_client_payload = {
            "name": "Test Client",
            "email": "test.client@example.com",
            "company": "Test Company Inc"
        }
        created_client = create_client(
            new_client_payload["name"],
            new_client_payload["email"],
            new_client_payload["company"],
            admin_token
        )
        client_id = created_client.get("id", None)

        # No login/logout for client, only creation confirmed

    finally:
        # Clean up created employee and client if possible
        if admin_token:
            if 'employee_id' in locals() and employee_id:
                try:
                    delete_employee(employee_id, admin_token)
                except Exception:
                    pass
            if 'client_id' in locals() and client_id:
                try:
                    delete_client(client_id, admin_token)
                except Exception:
                    pass
            try:
                logout(admin_token)
            except Exception:
                pass


test_user_logout_functionality()