import requests

base_url = "http://localhost:8000"
timeout = 30

user_roles = [
    {"role": "Admin", "username": "admin_user", "password": "admin_pass"},
    {"role": "SuperAdmin", "username": "superadmin_user", "password": "superadmin_pass"},
    {"role": "Manager", "username": "manager_user", "password": "manager_pass"},
    {"role": "Employee", "username": "employee_user", "password": "employee_pass"},
    {"role": "SEO", "username": "seo_user", "password": "seo_pass"},
    {"role": "HR", "username": "hr_user", "password": "hr_pass"},
    {"role": "Accountant", "username": "accountant_user", "password": "accountant_pass"},
    {"role": "Sales", "username": "sales_user", "password": "sales_pass"},
    {"role": "OperationsHead", "username": "operations_user", "password": "operations_pass"},
    {"role": "Client", "username": "client_user", "password": "client_pass"},
    {"role": "Lead", "username": "lead_user", "password": "lead_pass"},
    {"role": "TacticalReporter", "username": "tactical_user", "password": "tactical_pass"},
    {"role": "ComplianceOfficer", "username": "compliance_user", "password": "compliance_pass"},
    {"role": "Marketing", "username": "marketing_user", "password": "marketing_pass"},
    {"role": "QA", "username": "qa_user", "password": "qa_pass"},
    {"role": "Support", "username": "support_user", "password": "support_pass"},
]

headers_template = {
    "Content-Type": "application/json"
}

def test_data_services_and_api_integration_consistency():
    login_url = f"{base_url}/api/login"

    # Store tokens for each user role
    tokens = {}

    # 1. Test role-based authentication for all user roles
    for user in user_roles:
        auth_data = {
            "username": user["username"],
            "password": user["password"]
        }
        try:
            resp = requests.post(login_url, json=auth_data, timeout=timeout)
        except requests.RequestException as e:
            assert False, f"Login request failed for role {user['role']} with error: {e}"

        assert resp.status_code in (200, 201), f"Login failed for role {user['role']} (status {resp.status_code})"
        json_resp = resp.json()
        # Check presence of token/session and role attribute
        assert ("token" in json_resp or "session" in json_resp), f"No token/session returned for role {user['role']}"
        assert "role" in json_resp, f"No role info returned for role {user['role']}"
        assert json_resp["role"].lower() == user["role"].lower() or user["role"].lower() in json_resp["role"].lower(), \
            f"Returned role mismatch for role {user['role']}"

        # Save token
        if "token" in json_resp:
            tokens[user["role"]] = json_resp["token"]
        else:
            tokens[user["role"]] = json_resp.get("session")

    # Use Admin token for further authenticated operations
    admin_token = tokens.get("Admin")
    assert admin_token is not None, "Admin token not found after login"

    auth_headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}

    # 2. Database sync operations: Test workspace management endpoint and data sync integrity
    ws_url = f"{base_url}/api/workspaces"
    try:
        ws_resp = requests.get(ws_url, headers=auth_headers, timeout=timeout)
    except requests.RequestException as e:
        assert False, f"Workspace GET request failed with error: {e}"
    assert ws_resp.status_code == 200, f"Workspace GET failed with status {ws_resp.status_code}"
    ws_data = ws_resp.json()
    assert isinstance(ws_data, list), "Workspace response is not a list"
    for ws in ws_data:
        assert "id" in ws and "name" in ws, "Workspace missing id or name"

    # 3. Live data updates
    live_url = f"{base_url}/api/live-data"
    try:
        live_resp = requests.get(live_url, headers=auth_headers, timeout=timeout)
    except requests.RequestException as e:
        assert False, f"Live data GET failed with error: {e}"
    assert live_resp.status_code == 200, f"Live data GET failed with status: {live_resp.status_code}"
    live_data = live_resp.json()
    expected_live_keys = {"status", "updates", "timestamp"}
    assert expected_live_keys.issubset(set(live_data.keys())), "Live data response missing expected keys"

    # 4. API endpoints for employee/client onboarding workflows
    emp_url = f"{base_url}/api/employees"
    new_employee = {
        "first_name": "Test",
        "last_name": "User",
        "email": "test.user@example.com",
        "role": "Employee",
        "department": "Marketing"
    }
    created_emp_id = None
    try:
        emp_resp = requests.post(emp_url, json=new_employee, headers=auth_headers, timeout=timeout)
        assert emp_resp.status_code in (200,201), f"Employee creation failed with status {emp_resp.status_code}"
        created_emp = emp_resp.json()
        created_emp_id = created_emp.get("id")
        assert created_emp_id is not None, "Created employee missing id"
    except requests.RequestException as e:
        assert False, f"Employee onboarding POST failed with error: {e}"

    client_url = f"{base_url}/api/clients"
    new_client = {
        "company_name": "Test Client Inc.",
        "contact_person": "Client Contact",
        "email": "contact@testclient.com",
        "phone": "1234567890"
    }
    created_client_id = None
    try:
        client_resp = requests.post(client_url, json=new_client, headers=auth_headers, timeout=timeout)
        assert client_resp.status_code in (200,201), f"Client creation failed with status {client_resp.status_code}"
        created_client = client_resp.json()
        created_client_id = created_client.get("id")
        assert created_client_id is not None, "Created client missing id"
    except requests.RequestException as e:
        assert False, f"Client onboarding POST failed with error: {e}"

    try:
        if created_emp_id:
            try:
                get_emp_resp = requests.get(f"{emp_url}/{created_emp_id}", headers=auth_headers, timeout=timeout)
                assert get_emp_resp.status_code == 200, f"Failed to retrieve created employee (status {get_emp_resp.status_code})"
                emp_obj = get_emp_resp.json()
                for k in new_employee:
                    assert emp_obj.get(k) == new_employee[k], f"Employee data mismatch for field {k}"
            except requests.RequestException as e:
                assert False, f"Employee retrieval GET failed with error: {e}"

        if created_client_id:
            try:
                get_client_resp = requests.get(f"{client_url}/{created_client_id}", headers=auth_headers, timeout=timeout)
                assert get_client_resp.status_code == 200, f"Failed to retrieve created client (status {get_client_resp.status_code})"
                client_obj = get_client_resp.json()
                for k in new_client:
                    assert client_obj.get(k) == new_client[k], f"Client data mismatch for field {k}"
            except requests.RequestException as e:
                assert False, f"Client retrieval GET failed with error: {e}"
    finally:
        if created_emp_id:
            try:
                del_emp_resp = requests.delete(f"{emp_url}/{created_emp_id}", headers=auth_headers, timeout=timeout)
                assert del_emp_resp.status_code in (200,204), f"Failed to delete employee (status {del_emp_resp.status_code})"
            except requests.RequestException:
                pass
        if created_client_id:
            try:
                del_client_resp = requests.delete(f"{client_url}/{created_client_id}", headers=auth_headers, timeout=timeout)
                assert del_client_resp.status_code in (200,204), f"Failed to delete client (status {del_client_resp.status_code})"
            except requests.RequestException:
                pass

test_data_services_and_api_integration_consistency()