import requests

BASE_URL = "http://localhost:5173"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
CLIENTS_URL = f"{BASE_URL}/api/clients"
EMPLOYEES_URL = f"{BASE_URL}/api/employees"

USERS = [
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
    # Quick Test Set accounts
    {"email": "quick.test1@example.com", "password": "password123"},
    {"email": "quick.test2@example.com", "password": "password123"}
]


def login(email, password):
    try:
        resp = requests.post(
            LOGIN_URL,
            json={"email": email, "password": password},
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        token = data.get("token")
        user = data.get("user")
        assert token and isinstance(token, str), "Token missing or invalid"
        assert user and isinstance(user, dict), "User object missing or invalid"
        return token
    except Exception as e:
        raise AssertionError(f"Login failed for user {email}: {e}")


def create_employee(token):
    headers = {"Authorization": f"Bearer {token}"}
    employee_data = {
        "first_name": "Test",
        "last_name": "Employee",
        "email": "test.employee@example.com",
        "role": "Intern"
    }
    resp = requests.post(
        EMPLOYEES_URL,
        json=employee_data,
        headers=headers,
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    employee_id = data.get("id") or data.get("employee_id")
    assert employee_id is not None, "Employee creation failed, no ID returned"
    return employee_id


def delete_employee(token, employee_id):
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{EMPLOYEES_URL}/{employee_id}"
    try:
        resp = requests.delete(url, headers=headers, timeout=30)
        # If deletion not supported or fails, just pass
        if resp.status_code not in (200, 204):
            pass
    except Exception:
        pass


def create_client(token):
    headers = {"Authorization": f"Bearer {token}"}
    client_data = {
        "name": "Test Client",
        "email": "test.client@example.com",
        "company": "Test Company"
    }
    resp = requests.post(
        CLIENTS_URL,
        json=client_data,
        headers=headers,
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    client_id = data.get("id") or data.get("client_id")
    assert client_id is not None, "Client creation failed, no ID returned"
    return client_id


def delete_client(token, client_id):
    headers = {"Authorization": f"Bearer {token}"}
    url = f"{CLIENTS_URL}/{client_id}"
    try:
        resp = requests.delete(url, headers=headers, timeout=30)
        # If deletion not supported or fails, just pass
        if resp.status_code not in (200, 204):
            pass
    except Exception:
        pass


def test_get_all_clients():
    for user in USERS:
        email = user["email"]
        password = user["password"]
        token = login(email, password)
        headers = {"Authorization": f"Bearer {token}"}

        # Create new employee and client accounts to verify creation and then test GET /api/clients
        employee_id = None
        client_id = None
        try:
            # Create an employee as test data
            employee_id = create_employee(token)
            # Create a client as test data
            client_id = create_client(token)

            # Now test GET /api/clients
            resp = requests.get(CLIENTS_URL, headers=headers, timeout=30)
            resp.raise_for_status()
            assert resp.status_code == 200, f"Expected status 200 got {resp.status_code}"
            clients = resp.json()
            assert isinstance(clients, list), "Clients response is not a list"
            for client in clients:
                assert isinstance(client, dict), "Client item is not a dict"
                # check expected keys if possible
                assert "name" in client or "email" in client or "company" in client, "Client missing expected fields"
        finally:
            if employee_id:
                delete_employee(token, employee_id)
            if client_id:
                delete_client(token, client_id)


test_get_all_clients()