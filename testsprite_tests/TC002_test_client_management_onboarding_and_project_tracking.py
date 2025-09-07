import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:5173"
TIMEOUT = 30
AUTH = HTTPBasicAuth("Admin", "9876543225")
HEADERS = {"Content-Type": "application/json"}

def test_client_management_onboarding_and_project_tracking():
    client_data = {
        "companyName": "Test Client BP",
        "email": "testclientbp@example.com",
        "phone": "1234567890",
        "address": "123 Test Ave, Test City, TC 12345",
        "industry": "Digital Marketing",
        "notes": "Onboarded via automated test"
    }
    project_data = {
        "title": "Initial Campaign Setup",
        "description": "Setup initial marketing campaign for test client",
        "startDate": "2025-09-10",
        "endDate": "2025-12-10",
        "status": "planning"
    }
    payment_data = {
        "amount": 10000,
        "dueDate": "2025-10-10",
        "status": "pending",
        "proofUrl": None
    }

    client_id = None
    project_id = None
    payment_id = None

    try:
        # 1. Onboard new client - Create client
        resp_create_client = requests.post(
            f"{BASE_URL}/api/clients",
            json=client_data,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT
        )
        assert resp_create_client.status_code == 201, f"Failed to create client: {resp_create_client.text}"
        client_resp_json = resp_create_client.json()
        client_id = client_resp_json.get("id")
        assert client_id, "Client ID not returned after creation"

        # 2. Track client projects - Create project for client
        resp_create_project = requests.post(
            f"{BASE_URL}/api/clients/{client_id}/projects",
            json=project_data,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT
        )
        assert resp_create_project.status_code == 201, f"Failed to create project: {resp_create_project.text}"
        project_resp_json = resp_create_project.json()
        project_id = project_resp_json.get("id")
        assert project_id, "Project ID not returned after creation"

        # 3. Monitor payment statuses - Create payment record for project
        resp_create_payment = requests.post(
            f"{BASE_URL}/api/projects/{project_id}/payments",
            json=payment_data,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT
        )
        assert resp_create_payment.status_code == 201, f"Failed to create payment record: {resp_create_payment.text}"
        payment_resp_json = resp_create_payment.json()
        payment_id = payment_resp_json.get("id")
        assert payment_id, "Payment ID not returned after creation"

        # 4. Retrieve and verify client details including projects and payments
        resp_get_client = requests.get(
            f"{BASE_URL}/api/clients/{client_id}",
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT
        )
        assert resp_get_client.status_code == 200, f"Failed to get client details: {resp_get_client.text}"
        client_details = resp_get_client.json()
        assert client_details["companyName"] == client_data["companyName"], "Client name mismatch"
        assert any(p["id"] == project_id for p in client_details.get("projects", [])), "Project not found in client details"

        # 5. Update project status to 'active'
        update_project_data = {"status": "active"}
        resp_update_project = requests.put(
            f"{BASE_URL}/api/projects/{project_id}",
            json=update_project_data,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT
        )
        assert resp_update_project.status_code == 200, f"Failed to update project: {resp_update_project.text}"
        updated_project = resp_update_project.json()
        assert updated_project["status"] == "active", "Project status not updated"

        # 6. Update payment status with proof URL - mark as 'paid'
        update_payment_data = {
            "status": "paid",
            "proofUrl": "https://proof-storage.example.com/proofs/payment-proof-12345.pdf"
        }
        resp_update_payment = requests.put(
            f"{BASE_URL}/api/payments/{payment_id}",
            json=update_payment_data,
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT
        )
        assert resp_update_payment.status_code == 200, f"Failed to update payment: {resp_update_payment.text}"
        updated_payment = resp_update_payment.json()
        assert updated_payment["status"] == "paid", "Payment status not updated"
        assert updated_payment["proofUrl"] == update_payment_data["proofUrl"], "Payment proof URL not updated"

        # 7. Delete payment record
        resp_delete_payment = requests.delete(
            f"{BASE_URL}/api/payments/{payment_id}",
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT
        )
        assert resp_delete_payment.status_code == 204, f"Failed to delete payment: {resp_delete_payment.text}"
        payment_id = None

        # 8. Delete project
        resp_delete_project = requests.delete(
            f"{BASE_URL}/api/projects/{project_id}",
            headers=HEADERS,
            auth=AUTH,
            timeout=TIMEOUT
        )
        assert resp_delete_project.status_code == 204, f"Failed to delete project: {resp_delete_project.text}"
        project_id = None

    finally:
        # Clean up client record if exists
        if payment_id:
            try:
                requests.delete(
                    f"{BASE_URL}/api/payments/{payment_id}",
                    headers=HEADERS,
                    auth=AUTH,
                    timeout=TIMEOUT
                )
            except Exception:
                pass
        if project_id:
            try:
                requests.delete(
                    f"{BASE_URL}/api/projects/{project_id}",
                    headers=HEADERS,
                    auth=AUTH,
                    timeout=TIMEOUT
                )
            except Exception:
                pass
        if client_id:
            try:
                requests.delete(
                    f"{BASE_URL}/api/clients/{client_id}",
                    headers=HEADERS,
                    auth=AUTH,
                    timeout=TIMEOUT
                )
            except Exception:
                pass

test_client_management_onboarding_and_project_tracking()
