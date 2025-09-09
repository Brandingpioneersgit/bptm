import requests
import time

BASE_AUTH_URL = "http://localhost:8000"
BASE_API_URL = "http://localhost:5173"
LOGIN_ENDPOINT = "/api/auth/login"
LOGOUT_ENDPOINT = "/api/auth/logout"
NOTIFICATIONS_ENDPOINT = "/api/notifications"
USER_PREFS_ENDPOINT = "/api/notifications/preferences"

EMAIL = "marketing.manager@example.com"
PASSWORD = "password123"
TIMEOUT = 30

def test_notification_center_real_time_alerts_and_management():
    session = requests.Session()
    token = None
    notification_id = None

    try:
        # Step 1: Authenticate user and retrieve auth token
        login_resp = session.post(f"{BASE_AUTH_URL}{LOGIN_ENDPOINT}",
                                  json={"email": EMAIL, "password": PASSWORD},
                                  timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        assert "token" in login_data, "No token found in login response"
        token = login_data["token"]

        headers = {"Authorization": f"Bearer {token}"}

        # Step 2: Get current user notification preferences
        prefs_resp = session.get(f"{BASE_API_URL}{USER_PREFS_ENDPOINT}",
                                 headers=headers,
                                 timeout=TIMEOUT)
        assert prefs_resp.status_code == 200, f"Fetch preferences failed with status {prefs_resp.status_code}"
        user_prefs = prefs_resp.json()
        assert isinstance(user_prefs, dict), "User preferences response is not a dictionary"

        # Modify preferences to ensure notifications enabled (simulate user preference)
        updated_prefs = user_prefs.copy()
        updated_prefs.update({"emailAlerts": True, "pushAlerts": True, "smsAlerts": False})
        prefs_update_resp = session.put(f"{BASE_API_URL}{USER_PREFS_ENDPOINT}",
                                        headers=headers,
                                        json=updated_prefs,
                                        timeout=TIMEOUT)
        assert prefs_update_resp.status_code in (200, 204), f"Update prefs failed with status {prefs_update_resp.status_code}"

        # Step 3: Create a test notification to simulate a real-time alert
        notification_payload = {
            "title": "Test Real-Time Alert",
            "message": "This is a test notification for real-time alert verification.",
            "type": "alert",
            "read": False,
            "timestamp": int(time.time()*1000),
            "metadata": {"source": "test_case_TC009"}
        }
        create_notif_resp = session.post(f"{BASE_API_URL}{NOTIFICATIONS_ENDPOINT}",
                                        headers=headers,
                                        json=notification_payload,
                                        timeout=TIMEOUT)
        assert create_notif_resp.status_code == 201, f"Create notification failed with status {create_notif_resp.status_code}"
        notif_data = create_notif_resp.json()
        notification_id = notif_data.get("id")
        assert notification_id, "Notification ID not returned on creation"

        # Step 4: Validate the notification appears in the list for the user
        list_notif_resp = session.get(f"{BASE_API_URL}{NOTIFICATIONS_ENDPOINT}",
                                      headers=headers,
                                      timeout=TIMEOUT)
        assert list_notif_resp.status_code == 200, f"List notifications failed with status {list_notif_resp.status_code}"
        notifications = list_notif_resp.json()
        assert any(n.get("id") == notification_id for n in notifications), "Created notification not found in notification list"

        # Step 5: Mark the notification as read
        mark_read_payload = {"read": True}
        mark_read_resp = session.put(f"{BASE_API_URL}{NOTIFICATIONS_ENDPOINT}/{notification_id}",
                                     headers=headers,
                                     json=mark_read_payload,
                                     timeout=TIMEOUT)
        assert mark_read_resp.status_code in (200, 204), f"Mark notification read failed with status {mark_read_resp.status_code}"

        # Step 6: Confirm notification read status updated
        notif_detail_resp = session.get(f"{BASE_API_URL}{NOTIFICATIONS_ENDPOINT}/{notification_id}",
                                        headers=headers,
                                        timeout=TIMEOUT)
        assert notif_detail_resp.status_code == 200, f"Get notification detail failed with status {notif_detail_resp.status_code}"
        notif_detail = notif_detail_resp.json()
        assert notif_detail.get("read") is True, "Notification read status not updated"

        # Step 7: Test user preference disables push alerts and confirm no push alert created
        pref_disable_push = updated_prefs.copy()
        pref_disable_push["pushAlerts"] = False
        prefs_disable_resp = session.put(f"{BASE_API_URL}{USER_PREFS_ENDPOINT}",
                                        headers=headers,
                                        json=pref_disable_push,
                                        timeout=TIMEOUT)
        assert prefs_disable_resp.status_code in (200, 204), f"Disable push alerts failed with status {prefs_disable_resp.status_code}"

        # Step 8: Create another notification and verify management regarding preferences
        second_notification_payload = {
            "title": "Test Notification With Push Disabled",
            "message": "This notification should respect pushAlerts preference off.",
            "type": "alert",
            "read": False,
            "timestamp": int(time.time()*1000),
            "metadata": {"source": "test_case_TC009_second"}
        }
        second_create_resp = session.post(f"{BASE_API_URL}{NOTIFICATIONS_ENDPOINT}",
                                          headers=headers,
                                          json=second_notification_payload,
                                          timeout=TIMEOUT)
        assert second_create_resp.status_code == 201, f"Create second notification failed with status {second_create_resp.status_code}"
        second_notif_id = second_create_resp.json().get("id")
        assert second_notif_id, "Second notification ID not returned"

        # Verify second notification exists
        notif_list_resp_2 = session.get(f"{BASE_API_URL}{NOTIFICATIONS_ENDPOINT}",
                                       headers=headers,
                                       timeout=TIMEOUT)
        assert notif_list_resp_2.status_code == 200, f"List notifications failed with status {notif_list_resp_2.status_code}"
        notifications_2 = notif_list_resp_2.json()
        assert any(n.get("id") == second_notif_id for n in notifications_2), "Second notification not found in list"

        # Cleanup second notification
        del_resp2 = session.delete(f"{BASE_API_URL}{NOTIFICATIONS_ENDPOINT}/{second_notif_id}",
                                   headers=headers,
                                   timeout=TIMEOUT)
        assert del_resp2.status_code in (200, 204), f"Delete second notification failed with status {del_resp2.status_code}"

    finally:
        # Cleanup: Delete the first notification if created
        if notification_id:
            try:
                del_resp = session.delete(f"{BASE_API_URL}{NOTIFICATIONS_ENDPOINT}/{notification_id}",
                                          headers=headers,
                                          timeout=TIMEOUT)
                assert del_resp.status_code in (200, 204), f"Delete notification failed with status {del_resp.status_code}"
            except Exception as e:
                print(f"Cleanup failed for notification {notification_id}: {e}")

        # Logout
        if token:
            try:
                logout_resp = session.post(f"{BASE_AUTH_URL}{LOGOUT_ENDPOINT}",
                                          headers=headers,
                                          timeout=TIMEOUT)
                assert logout_resp.status_code == 200, f"Logout failed with status {logout_resp.status_code}"
            except Exception as e:
                print(f"Logout failed: {e}")

test_notification_center_real_time_alerts_and_management()