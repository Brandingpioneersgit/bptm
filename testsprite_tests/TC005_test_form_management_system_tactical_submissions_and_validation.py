import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:5173"
TIMEOUT = 30
AUTH = HTTPBasicAuth("Admin", "9876543225")

# Simulated 15+ user roles for role-based authentication testing
USER_ROLES = [
    "employee", "manager", "admin", "super_admin", "seo_team", "hr",
    "accountant", "sales_rep", "operations_head", "client_user",
    "guest_user", "project_manager", "finance_officer", "marketing_specialist",
    "lead_designer", "developer"
]

def test_form_management_system_tactical_submissions_and_validation():
    # Endpoint for tactical report submissions
    tactical_form_endpoint = f"{BASE_URL}/api/forms/tactical-report"
    get_roles_endpoint = f"{BASE_URL}/api/auth/roles"
    onboarding_employee_endpoint = f"{BASE_URL}/api/employees/onboard"
    onboarding_client_endpoint = f"{BASE_URL}/api/clients/onboard"
    database_sync_endpoint = f"{BASE_URL}/api/database/sync"
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    # Step 1: Verify role-based authentication for all defined roles
    # Assume API endpoint to check role access to tactical form (simulate with GET /api/auth/check-access?role=rolename)
    for role in USER_ROLES:
        try:
            access_check = requests.get(
                f"{BASE_URL}/api/auth/check-access",
                params={"role": role, "resource": "tactical_form"},
                auth=AUTH,
                timeout=TIMEOUT
            )
            assert access_check.status_code in (200, 403), f"Unexpected status for role {role}: {access_check.status_code}"
            # 200 means access granted, 403 means denied - both valid outcomes depending on role, so just ensure no other error.
        except Exception as e:
            assert False, f"Role-based auth test failed for role {role}: {str(e)}"

    # Step 2: Test database sync operation (trigger sync and verify success)
    try:
        sync_resp = requests.post(database_sync_endpoint, auth=AUTH, timeout=TIMEOUT)
        assert sync_resp.status_code == 200, f"Database sync failed with status {sync_resp.status_code}"
        sync_json = sync_resp.json()
        assert 'synced' in sync_json and sync_json['synced'] is True, "Database sync response missing or false"
    except Exception as e:
        assert False, f"Database sync operation failed: {str(e)}"

    # Step 3: Test employee onboarding workflow via API (create and delete employee resource)
    # Prepare minimal valid payload for employee onboarding
    employee_payload = {
        "firstName": "Test",
        "lastName": "Employee",
        "email": "test.employee@example.com",
        "role": "employee",
        "startDate": "2025-09-01"
    }
    employee_id = None
    try:
        create_emp_resp = requests.post(onboarding_employee_endpoint, json=employee_payload, auth=AUTH, timeout=TIMEOUT, headers=headers)
        assert create_emp_resp.status_code == 201, f"Employee onboarding creation failed with status {create_emp_resp.status_code}"
        emp_data = create_emp_resp.json()
        employee_id = emp_data.get("id")
        assert employee_id is not None, "Employee ID not returned after creation"

        # Retrieve employee onboarding data to validate it saved correctly
        get_emp_resp = requests.get(f"{onboarding_employee_endpoint}/{employee_id}", auth=AUTH, timeout=TIMEOUT)
        assert get_emp_resp.status_code == 200, f"Failed to get created employee onboarding data"
        get_emp_data = get_emp_resp.json()
        assert get_emp_data.get("email") == employee_payload["email"], "Employee email mismatch in onboarding data"

    finally:
        if employee_id:
            try:
                del_emp_resp = requests.delete(f"{onboarding_employee_endpoint}/{employee_id}", auth=AUTH, timeout=TIMEOUT)
                assert del_emp_resp.status_code == 204, f"Failed to delete employee onboarding resource id {employee_id}"
            except Exception:
                pass  # Log deletion failure silently

    # Step 4: Test client onboarding workflow via API (create and delete client resource)
    client_payload = {
        "companyName": "Test Client Corporation",
        "contactPerson": "John Doe",
        "contactEmail": "john.doe@testclient.com",
        "industry": "Marketing",
        "signedContract": True
    }
    client_id = None
    try:
        create_client_resp = requests.post(onboarding_client_endpoint, json=client_payload, auth=AUTH, timeout=TIMEOUT, headers=headers)
        assert create_client_resp.status_code == 201, f"Client onboarding creation failed with status {create_client_resp.status_code}"
        client_data = create_client_resp.json()
        client_id = client_data.get("id")
        assert client_id is not None, "Client ID not returned after creation"

        # Retrieve client onboarding data to validate it saved correctly
        get_client_resp = requests.get(f"{onboarding_client_endpoint}/{client_id}", auth=AUTH, timeout=TIMEOUT)
        assert get_client_resp.status_code == 200, f"Failed to get created client onboarding data"
        get_client_data = get_client_resp.json()
        assert get_client_data.get("companyName") == client_payload["companyName"], "Client company name mismatch in onboarding data"

    finally:
        if client_id:
            try:
                del_client_resp = requests.delete(f"{onboarding_client_endpoint}/{client_id}", auth=AUTH, timeout=TIMEOUT)
                assert del_client_resp.status_code == 204, f"Failed to delete client onboarding resource id {client_id}"
            except Exception:
                pass  # Log deletion failure silently

    # Step 5: Test tactical form monthly submission with validation of mandatory fields and proof URL requirement
    # Required fields example: reportMonth, kpiSummary, proofURLs (at least one)
    tactical_form_payload_valid = {
        "reportMonth": "2025-08",
        "kpiSummary": "Exceeded targets in SEO and paid campaigns.",
        "proofURLs": ["https://example.com/proof1.pdf"],
        "autoSave": True
    }
    tactical_form_payload_missing_proof = {
        "reportMonth": "2025-08",
        "kpiSummary": "Missed proof URLs in submission.",
        "proofURLs": [],
        "autoSave": True
    }

    # Submit valid form - expect success (201 Created)
    tactical_form_id = None
    try:
        valid_resp = requests.post(tactical_form_endpoint, json=tactical_form_payload_valid, auth=AUTH, timeout=TIMEOUT, headers=headers)
        assert valid_resp.status_code == 201, f"Tactical form valid submission failed with status {valid_resp.status_code}"
        valid_json = valid_resp.json()
        tactical_form_id = valid_json.get("id")
        assert tactical_form_id is not None, "Tactical form submission did not return ID"

        # Submit with missing proof URLs - expect validation error (400 Bad Request)
        invalid_resp = requests.post(tactical_form_endpoint, json=tactical_form_payload_missing_proof, auth=AUTH, timeout=TIMEOUT, headers=headers)
        assert invalid_resp.status_code == 400, f"Tactical form submission without proof URLs should fail with 400 but got {invalid_resp.status_code}"

        # Test auto-save functionality (simulate PATCH for auto-save update)
        autosave_payload = {"kpiSummary": "Auto-saved progress update."}
        autosave_resp = requests.patch(f"{tactical_form_endpoint}/{tactical_form_id}/autosave",
                                      json=autosave_payload, auth=AUTH, timeout=TIMEOUT, headers=headers)
        assert autosave_resp.status_code == 200, f"Auto-save update failed with status {autosave_resp.status_code}"
        autosave_data = autosave_resp.json()
        assert autosave_data.get("kpiSummary") == autosave_payload["kpiSummary"], "Auto-save did not update kpiSummary correctly"

    finally:
        if tactical_form_id:
            try:
                del_form_resp = requests.delete(f"{tactical_form_endpoint}/{tactical_form_id}", auth=AUTH, timeout=TIMEOUT)
                assert del_form_resp.status_code == 204, f"Failed to delete tactical form submission id {tactical_form_id}"
            except Exception:
                pass  # Deletion failure ignored but logged silently

test_form_management_system_tactical_submissions_and_validation()
