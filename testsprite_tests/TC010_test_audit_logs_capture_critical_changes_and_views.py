import requests
from datetime import datetime
import time

BASE_AUTH_URL = "http://localhost:8000"
BASE_API_URL = "http://localhost:5173"
LOGIN_ENDPOINT = "/api/auth/login"
LOGOUT_ENDPOINT = "/api/auth/logout"
AUDIT_LOGS_ENDPOINT = "/api/audit/logs"
HEADERS = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_audit_logs_capture_critical_changes_and_views():
    session = requests.Session()
    auth_token = None
    user_email = 'marketing.manager@example.com'
    user_password = 'password123'

    try:
        # Step 1: Authenticate and get token
        login_resp = session.post(
            f"{BASE_AUTH_URL}{LOGIN_ENDPOINT}",
            json={"email": user_email, "password": user_password},
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert "token" in login_data, "No token found in login response"
        auth_token = login_data["token"]
        auth_headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }

        # Step 2: Perform a critical change - create a new client (simulate critical change)
        create_client_payload = {
            "name": "Test Client Audit",
            "email": f"testclient_{int(time.time())}@example.com",
            "phone": "1234567890",
            "address": "123 Audit Street",
            "industry": "Marketing"
        }
        create_client_resp = session.post(
            f"{BASE_API_URL}/api/clients",
            json=create_client_payload,
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert create_client_resp.status_code == 201, f"Failed to create client: {create_client_resp.text}"
        client_data = create_client_resp.json()
        client_id = client_data.get("id")
        assert client_id is not None, "Created client has no ID"

        # Step 3: Simulate a view action by retrieving client details
        read_client_resp = session.get(
            f"{BASE_API_URL}/api/clients/{client_id}",
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert read_client_resp.status_code == 200, f"Failed to get client details: {read_client_resp.text}"

        # Step 4: Fetch audit logs and validate critical entries for this client and user
        audit_logs_resp = session.get(
            f"{BASE_API_URL}{AUDIT_LOGS_ENDPOINT}",
            headers=auth_headers,
            timeout=TIMEOUT
        )
        assert audit_logs_resp.status_code == 200, f"Failed to fetch audit logs: {audit_logs_resp.text}"
        audit_logs = audit_logs_resp.json()
        assert isinstance(audit_logs, list), "Audit logs response is not a list"

        # Filter audit logs related to the client id and user email for critical changes and views
        related_logs = [
            log for log in audit_logs
            if log.get("resourceId") == str(client_id)
            and log.get("userEmail") == user_email
            and log.get("timestamp") is not None
            and log.get("action") in ["CREATE", "VIEW"]
        ]
        assert len(related_logs) >= 2, "Audit logs missing expected critical changes/views"

        # Validate immutable record: no duplicates with same timestamp and action for same resource and user
        seen_entries = set()
        for log in related_logs:
            timestamp = log.get("timestamp")
            action = log.get("action")
            resource_id = log.get("resourceId")
            user_email_log = log.get("userEmail")
            entry_key = (timestamp, action, resource_id, user_email_log)
            assert entry_key not in seen_entries, "Duplicate audit log entry detected"
            seen_entries.add(entry_key)

            # Validate timestamp format ISO8601
            try:
                # Some logs might have ISO8601 with timezone offset or 'Z'
                datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            except Exception:
                assert False, f"Invalid timestamp format in log: {timestamp}"

            # Validate user details (email) matches session user
            assert user_email_log == user_email, f"Audit log userEmail does not match logged-in user"

    finally:
        # Cleanup: delete created client if exists
        if auth_token and 'client_id' in locals():
            session.delete(
                f"{BASE_API_URL}/api/clients/{client_id}",
                headers={"Authorization": f"Bearer {auth_token}"},
                timeout=TIMEOUT
            )
        # Logout to invalidate session/token
        if auth_token:
            session.post(
                f"{BASE_AUTH_URL}{LOGOUT_ENDPOINT}",
                headers={"Authorization": f"Bearer {auth_token}"},
                timeout=TIMEOUT
            )

test_audit_logs_capture_critical_changes_and_views()