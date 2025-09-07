import requests
from requests.auth import HTTPBasicAuth
import time

BASE_URL = "http://localhost:5173"
AUTH_USERNAME = "Admin"
AUTH_PASSWORD = "9876543225"
TIMEOUT = 30

user_roles = [
    "employee", "manager", "admin", "superadmin", "seo_team", "hr", "accountant",
    "sales", "operations_head", "client", "lead", "guest", "marketing", "support", "trainer"
]

def get_auth_token(username, password):
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": username, "password": password},
            timeout=TIMEOUT
        )
        response.raise_for_status()
        data = response.json()
        return data.get("token")
    except Exception as e:
        assert False, f"Authentication failed for {username}: {e}"

def create_onboard_entity(entity_type, token, payload):
    try:
        response = requests.post(
            f"{BASE_URL}/api/{entity_type}/onboard",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=TIMEOUT
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        assert False, f"Failed to create {entity_type} onboarding entity: {e}"

def delete_onboard_entity(entity_type, entity_id, token):
    try:
        response = requests.delete(
            f"{BASE_URL}/api/{entity_type}/{entity_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=TIMEOUT
        )
        response.raise_for_status()
    except Exception as e:
        # Cleanup failure should not break tests but note it
        print(f"Warning: Failed to delete {entity_type} entity with ID {entity_id}: {e}")

def fetch_notifications(token, role):
    try:
        response = requests.get(
            f"{BASE_URL}/api/notifications?role={role}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=TIMEOUT
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        assert False, f"Failed to fetch notifications for role '{role}': {e}"

def test_notification_system_real_time_alerts_and_messaging():
    # Authenticate as Admin to manage onboarding and access
    admin_token = get_auth_token(AUTH_USERNAME, AUTH_PASSWORD)
    assert admin_token is not None, "Admin token should not be None"

    # Create a new test employee onboarding entity to test notifications scoped to employee role
    employee_payload = {
        "name": "Test Employee",
        "email": "testemployee@example.com",
        "role": "employee"
    }
    new_employee = create_onboard_entity("employees", admin_token, employee_payload)
    employee_id = new_employee.get("id")
    assert employee_id is not None, "New employee id must be returned"

    # Create a new test client onboarding entity to test notifications scoped to client role
    client_payload = {
        "name": "Test Client",
        "email": "testclient@example.com",
        "status": "active"
    }
    new_client = create_onboard_entity("clients", admin_token, client_payload)
    client_id = new_client.get("id")
    assert client_id is not None, "New client id must be returned"

    try:
        # For each user role, verify notifications delivered promptly and correctly
        for role in user_roles:
            # Authenticate as user of this role; simulate login with role-based test credentials
            # Here we reuse admin credentials to fetch tokens (simplification due to no user creds provided)
            token = admin_token

            start_time = time.time()
            notifications = fetch_notifications(token, role)
            duration = time.time() - start_time

            # Validate response structure and timeliness
            assert isinstance(notifications, dict), f"Notifications for role {role} must be a dict"
            assert "toast_notifications" in notifications, f"Missing toast_notifications for role {role}"
            assert "system_alerts" in notifications, f"Missing system_alerts for role {role}"
            assert "user_messages" in notifications, f"Missing user_messages for role {role}"

            # Confirm all notification types are lists
            assert isinstance(notifications["toast_notifications"], list), "toast_notifications must be list"
            assert isinstance(notifications["system_alerts"], list), "system_alerts must be list"
            assert isinstance(notifications["user_messages"], list), "user_messages must be list"

            # Confirm API responds within acceptable delay (e.g., < 5 seconds for real-time)
            assert duration < 5, f"Notifications API too slow for role {role}: {duration} seconds"

            # Further content checks can be performed: e.g., entries should have required fields
            for notif_type in ["toast_notifications", "system_alerts", "user_messages"]:
                for notif in notifications[notif_type]:
                    assert "id" in notif, f"Notification missing id in {notif_type} for role {role}"
                    assert "message" in notif, f"Notification missing message in {notif_type} for role {role}"
                    assert "timestamp" in notif, f"Notification missing timestamp in {notif_type} for role {role}"

    finally:
        # Cleanup created resources
        if employee_id:
            delete_onboard_entity("employees", employee_id, admin_token)
        if client_id:
            delete_onboard_entity("clients", client_id, admin_token)


test_notification_system_real_time_alerts_and_messaging()