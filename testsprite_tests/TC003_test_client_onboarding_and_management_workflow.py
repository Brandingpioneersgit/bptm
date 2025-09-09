import requests
from requests.exceptions import RequestException

BASE_URL_AUTH = "http://localhost:8000"
BASE_URL_APP = "http://localhost:5173"
LOGIN_ENDPOINT = "/api/auth/login"
LOGOUT_ENDPOINT = "/api/auth/logout"
CLIENTS_ENDPOINT = "/api/clients"
WORKSPACES_ENDPOINT = "/api/workspaces"
LIVE_DATA_ENDPOINT = "/api/live-data"

EMAIL = "marketing.manager@example.com"
PASSWORD = "password123"

TIMEOUT = 30

def test_client_onboarding_and_management_workflow():
    session = requests.Session()
    token = None
    created_client_id = None
    headers_auth = None
    workspace_id = None
    try:
        # 1. Authenticate and get token
        login_payload = {"email": EMAIL, "password": PASSWORD}
        login_resp = session.post(
            BASE_URL_AUTH + LOGIN_ENDPOINT,
            json=login_payload,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert "token" in login_data, "No auth token found in login response"
        token = login_data["token"]
        headers_auth = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        # 2. Create a workspace (if needed for client onboarding)
        workspace_payload = {
            "name": "Test Workspace for Client Onboarding",
            "description": "Workspace created during onboarding test"
        }
        workspace_resp = session.post(
            BASE_URL_APP + WORKSPACES_ENDPOINT,
            json=workspace_payload,
            headers=headers_auth,
            timeout=TIMEOUT
        )
        assert workspace_resp.status_code == 201, f"Workspace creation failed: {workspace_resp.text}"
        workspace_data = workspace_resp.json()
        workspace_id = workspace_data.get("id")
        assert workspace_id is not None, "Workspace ID missing in response"

        # 3. Onboard a new client
        client_onboard_payload = {
            "name": "Test Client Onboarding",
            "email": "client.onboarding@example.com",
            "phone": "1234567890",
            "workspace_id": workspace_id,
            "services": ["SEO", "PPC"],
            "billing_details": {
                "billing_cycle": "monthly",
                "payment_method": "credit_card"
            },
            "address": "123 Client St, Marketing City"
        }
        client_resp = session.post(
            BASE_URL_APP + CLIENTS_ENDPOINT,
            json=client_onboard_payload,
            headers=headers_auth,
            timeout=TIMEOUT
        )
        assert client_resp.status_code == 201, f"Client onboarding failed: {client_resp.text}"
        client_data = client_resp.json()
        created_client_id = client_data.get("id")
        assert created_client_id is not None, "Client ID missing in onboarding response"
        assert client_data.get("name") == client_onboard_payload["name"], "Client name mismatch"
        assert set(client_data.get("services", [])) == set(client_onboard_payload["services"]), "Services mismatch"

        # 4. Track service information for the created client - get client details to check service tracking
        client_detail_resp = session.get(
            f"{BASE_URL_APP}{CLIENTS_ENDPOINT}/{created_client_id}",
            headers=headers_auth,
            timeout=TIMEOUT
        )
        assert client_detail_resp.status_code == 200, f"Failed to get client details: {client_detail_resp.text}"
        client_detail = client_detail_resp.json()
        assert "services" in client_detail, "Services info missing in client details"
        assert set(client_detail["services"]) == set(client_onboard_payload["services"]), "Client services do not match onboarded services"

        # 5. Validate client dashboard data accuracy - fetch dashboard info for the client (assuming from live-data or clients endpoint)
        dashboard_resp = session.get(
            f"{BASE_URL_APP}/api/clients/{created_client_id}/dashboard",
            headers=headers_auth,
            timeout=TIMEOUT
        )
        # There may or may not be a dedicated client dashboard endpoint; if 404, try live-data with client param
        if dashboard_resp.status_code == 404:
            dashboard_resp = session.get(
                f"{BASE_URL_APP}{LIVE_DATA_ENDPOINT}",
                headers=headers_auth,
                params={"client_id": created_client_id},
                timeout=TIMEOUT
            )
        assert dashboard_resp.status_code == 200, f"Failed to get client dashboard data: {dashboard_resp.text}"
        dashboard_data = dashboard_resp.json()

        # Basic checks on dashboard data presence and structure
        assert isinstance(dashboard_data, dict), "Dashboard data is not a dictionary"
        # Example keys check: 'projects', 'billing', 'status', 'nps_score', etc. - based on PRD focus
        expected_keys = {"projects", "billing", "client_status"}
        # We allow partial presence, but at least one should be present
        assert any(key in dashboard_data for key in expected_keys), "No expected dashboard keys present"

    except RequestException as e:
        assert False, f"Request failed: {str(e)}"
    finally:
        # 6. Clean up created client and workspace if created
        if created_client_id:
            try:
                del_client_resp = session.delete(
                    f"{BASE_URL_APP}{CLIENTS_ENDPOINT}/{created_client_id}",
                    headers=headers_auth,
                    timeout=TIMEOUT
                )
                # Allow 200 or 204 as success for delete
                assert del_client_resp.status_code in (200, 204), f"Failed to delete client: {del_client_resp.text}"
            except Exception:
                pass

        if workspace_id:
            try:
                del_ws_resp = session.delete(
                    f"{BASE_URL_APP}{WORKSPACES_ENDPOINT}/{workspace_id}",
                    headers=headers_auth,
                    timeout=TIMEOUT
                )
                assert del_ws_resp.status_code in (200, 204), f"Failed to delete workspace: {del_ws_resp.text}"
            except Exception:
                pass

        # 7. Logout to end session
        if token:
            try:
                session.post(
                    BASE_URL_AUTH + LOGOUT_ENDPOINT,
                    headers=headers_auth,
                    timeout=TIMEOUT
                )
            except Exception:
                pass

test_client_onboarding_and_management_workflow()