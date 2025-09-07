import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:5173"
TIMEOUT = 30
AUTH_USERNAME = "Admin"
AUTH_PASSWORD = "9876543225"

# Define all roles known for SEO and other users to test role-based access (15+ roles assumed)
ALL_ROLES = [
    "admin", "super_admin", "manager", "employee", "seo_specialist", "seo_manager",
    "seo_analyst", "seo_intern", "hr", "accountant", "sales_representative",
    "operations_head", "client", "guest", "seo_team_member", "marketing_specialist",
]

def get_auth_headers(username, password):
    # Basic token authentication header format: "Basic base64(username:password)"
    # Using requests HTTPBasicAuth for convenience but headers prepared manually if needed
    return HTTPBasicAuth(username, password)

def create_employee(payload, auth):
    url = f"{BASE_URL}/api/employees"
    resp = requests.post(url, json=payload, auth=auth, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()

def delete_employee(emp_id, auth):
    url = f"{BASE_URL}/api/employees/{emp_id}"
    resp = requests.delete(url, auth=auth, timeout=TIMEOUT)
    return resp

def create_client(payload, auth):
    url = f"{BASE_URL}/api/clients"
    resp = requests.post(url, json=payload, auth=auth, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()

def delete_client(client_id, auth):
    url = f"{BASE_URL}/api/clients/{client_id}"
    resp = requests.delete(url, auth=auth, timeout=TIMEOUT)
    return resp

def test_seo_module_performance_tracking_and_appraisal():
    auth = get_auth_headers(AUTH_USERNAME, AUTH_PASSWORD)

    # 1. Check role-based access for SEO module endpoints for all user roles
    seo_module_endpoints = [
        "/api/seo/performance",     # GET SEO performance tracking
        "/api/seo/keywords",        # GET keyword monitoring
        "/api/seo/appraisals",      # GET appraisal data
        "/api/seo/appraisals/submit",   # POST appraisal submission
    ]

    # Verify access control: Allowed roles for SEO module assumed: seo_specialist, seo_manager, seo_analyst, seo_team_member
    allowed_roles = {"seo_specialist", "seo_manager", "seo_analyst", "seo_team_member"}

    # For endpoints that require POST, prepare sample payload
    appraisal_submit_payload = {
        "employeeId": None,   # Will be set after creating test employee below
        "period": "2025-Q3",
        "kpis": [
            {"name": "Keyword Ranking Improvement", "target": 10, "actual": 12, "proofUrl": "https://proof.example.com/report123"},
            {"name": "Backlink Acquisition", "target": 20, "actual": 18, "proofUrl": "https://proof.example.com/report456"}
        ],
        "comments": "Exceeded expectations in Q3 SEO performance."
    }

    # 2. Create a test employee with SEO role for appraisal submit and data links
    test_employee_payload = {
        "name": "Test SEO Employee",
        "email": "test.seo.employee@example.com",
        "role": "seo_specialist",
        "department": "SEO",
        "startDate": "2025-01-01"
    }

    # 3. Create a test client for onboarding workflow validation
    test_client_payload = {
        "name": "Test Client SEO",
        "email": "client.seo@example.com",
        "company": "SEO Client Inc",
        "onboardingStatus": "pending"
    }

    employee_id = None
    client_id = None
    try:
        emp_resp = create_employee(test_employee_payload, auth)
        employee_id = emp_resp.get("id")
        assert employee_id is not None, "Failed to create test employee"

        client_resp = create_client(test_client_payload, auth)
        client_id = client_resp.get("id")
        assert client_id is not None, "Failed to create test client"

        appraisal_submit_payload["employeeId"] = employee_id

        # 4. Test role-based access for SEO endpoints by simulating role based requests
        headers_common = {'Accept': 'application/json'}
        for role in ALL_ROLES:
            # We simulate authentication per role by changing user credentials.
            # Here, we simulate by passing role as a header (since no other credentials given).
            # The real system may require different tokens; we test access via an endpoint that returns role info.
            # This is a simplification for demonstration.

            # We attempt GET on each SEO endpoint except for appraisal submit which is POST
            for endpoint in seo_module_endpoints:
                url = f"{BASE_URL}{endpoint}"

                # For testing, we append a query parameter to "simulateRole" for role based backend check
                # (In real test, would authenticate as users with that role; here, this is an assumption.)
                simulated_url = f"{url}?simulateRole={role}"

                if endpoint.endswith("/submit"):
                    # POST request for appraisal submit
                    try:
                        resp = requests.post(simulated_url, json=appraisal_submit_payload, auth=auth, headers=headers_common, timeout=TIMEOUT)
                        if role in allowed_roles:
                            assert resp.status_code == 201 or resp.status_code == 200, f"Role {role} should have access to submit appraisal, got {resp.status_code}"
                            json_data = resp.json()
                            assert "appraisalId" in json_data or "id" in json_data, "Appraisal submit response missing appraisal ID"
                        else:
                            assert resp.status_code == 403 or resp.status_code == 401, f"Role {role} should be denied appraisal submit, got {resp.status_code}"
                    except requests.RequestException as e:
                        assert False, f"Request failed for role {role} on {endpoint}: {str(e)}"
                else:
                    # GET request for performance, keywords, appraisals
                    try:
                        resp = requests.get(simulated_url, auth=auth, headers=headers_common, timeout=TIMEOUT)
                        if role in allowed_roles:
                            assert resp.status_code == 200, f"Role {role} should have access to {endpoint}, got {resp.status_code}"
                            json_data = resp.json()
                            assert isinstance(json_data, (list, dict)), f"Expected JSON data structure for {endpoint} for role {role}"
                        else:
                            assert resp.status_code == 403 or resp.status_code == 401, f"Role {role} should be denied access to {endpoint}, got {resp.status_code}"
                    except requests.RequestException as e:
                        assert False, f"Request failed for role {role} on {endpoint}: {str(e)}"

        # 5. Test database sync for newly created test employee and client (assuming an endpoint exists)
        sync_employee_url = f"{BASE_URL}/api/employees/{employee_id}/sync"
        sync_client_url = f"{BASE_URL}/api/clients/{client_id}/sync"

        resp_emp_sync = requests.post(sync_employee_url, auth=auth, timeout=TIMEOUT)
        assert resp_emp_sync.status_code == 200, f"Employee sync failed with status {resp_emp_sync.status_code}"
        resp_client_sync = requests.post(sync_client_url, auth=auth, timeout=TIMEOUT)
        assert resp_client_sync.status_code == 200, f"Client sync failed with status {resp_client_sync.status_code}"

        # 6. Test employee onboarding workflow status update (PUT)
        update_employee_url = f"{BASE_URL}/api/employees/{employee_id}"
        update_payload = {"onboardingStatus": "completed"}
        resp_update_employee = requests.put(update_employee_url, json=update_payload, auth=auth, timeout=TIMEOUT)
        assert resp_update_employee.status_code == 200, "Failed to update employee onboarding status"
        assert resp_update_employee.json().get("onboardingStatus") == "completed", "Employee onboarding status not updated"

        # 7. Test client onboarding workflow status update (PUT)
        update_client_url = f"{BASE_URL}/api/clients/{client_id}"
        update_payload_client = {"onboardingStatus": "completed"}
        resp_update_client = requests.put(update_client_url, json=update_payload_client, auth=auth, timeout=TIMEOUT)
        assert resp_update_client.status_code == 200, "Failed to update client onboarding status"
        assert resp_update_client.json().get("onboardingStatus") == "completed", "Client onboarding status not updated"

    finally:
        # Cleanup created resources
        if employee_id:
            delete_employee(employee_id, auth)
        if client_id:
            delete_client(client_id, auth)

test_seo_module_performance_tracking_and_appraisal()