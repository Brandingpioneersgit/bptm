import requests

BASE_URL_AUTH = "http://localhost:8000"
BASE_URL_API = "http://localhost:5173"
LOGIN_ENDPOINT = "/api/auth/login"
LOGOUT_ENDPOINT = "/api/auth/logout"
PAYMENTS_ENDPOINT = "/api/payments"
ACCOUNTS_PAYMENTS_ENDPOINT = "/api/accounts/payments"
FINANCIAL_DASHBOARD_ENDPOINT = "/api/reports/monthly-tactical"

TEST_EMAIL = "marketing.manager@example.com"
TEST_PASSWORD = "password123"

TIMEOUT = 30

def test_financial_management_payment_tracking_and_reporting():
    session = requests.Session()
    token = None
    try:
        # Authenticate and get token
        login_resp = session.post(
            BASE_URL_AUTH + LOGIN_ENDPOINT,
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert "token" in login_data or "accessToken" in login_data, "Auth token not found in response"
        token = login_data.get("token") or login_data.get("accessToken")
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        session.headers.update(headers)

        # --- Test creating a recurring payment with proof URL ---
        recurring_payment_payload = {
            "type": "recurring",
            "amount": 1500.75,
            "currency": "USD",
            "proof_url": "http://example.com/proof/recurring_payment_001.pdf",
            "due_date": "2025-12-31",
            "status": "pending",
            "description": "Monthly subscription fee"
        }
        create_rec_resp = session.post(
            BASE_URL_API + PAYMENTS_ENDPOINT,
            json=recurring_payment_payload,
            timeout=TIMEOUT
        )
        assert create_rec_resp.status_code == 201, f"Failed to create recurring payment: {create_rec_resp.text}"
        rec_payment_data = create_rec_resp.json()
        rec_payment_id = rec_payment_data.get("id")
        assert rec_payment_id is not None, "Recurring payment ID missing in response"
        assert rec_payment_data.get("proof_url") == recurring_payment_payload["proof_url"], "Proof URL not saved properly"

        # --- Test creating a one-time payment missing proof URL (should error) ---
        one_time_payment_payload = {
            "type": "one-time",
            "amount": 300.00,
            "currency": "USD",
            "due_date": "2025-10-15",
            "status": "pending",
            "description": "One-time consulting fee"
            # proof_url intentionally missing to test enforcement
        }
        create_one_time_resp = session.post(
            BASE_URL_API + PAYMENTS_ENDPOINT,
            json=one_time_payment_payload,
            timeout=TIMEOUT
        )
        # Expecting a 400 or 422 error due to missing proof URL
        assert create_one_time_resp.status_code in [400, 422], \
            "One-time payment creation without proof URL should fail"
        error_resp = create_one_time_resp.json()
        assert "proof_url" in str(error_resp).lower() or "proof" in str(error_resp).lower(), \
            "Error message should mention missing proof URL"

        # --- Fetch financial dashboard report and validate data accuracy ---
        dashboard_resp = session.get(
            BASE_URL_API + FINANCIAL_DASHBOARD_ENDPOINT,
            timeout=TIMEOUT
        )
        assert dashboard_resp.status_code == 200, f"Failed to fetch financial dashboard: {dashboard_resp.text}"
        dashboard_data = dashboard_resp.json()

        # Validate that the dashboard contains payment summary data
        assert isinstance(dashboard_data, dict), "Dashboard data should be a dictionary"
        assert "payments" in dashboard_data or "paymentStatusSummary" in dashboard_data or "summary" in dashboard_data, \
            "Dashboard response missing payments summary"

        # Validate recurring and one-time payments presence in report
        payments_list = dashboard_data.get("payments") or dashboard_data.get("paymentStatusSummary") or []
        # Find our recurring payment in the dashboard
        recurring_found = False
        for payment in payments_list:
            if payment.get("id") == rec_payment_id:
                recurring_found = True
                # Check fields
                assert payment.get("type") == "recurring", "Payment type mismatch in dashboard"
                assert payment.get("proof_url") == recurring_payment_payload["proof_url"], "Proof URL mismatch in dashboard payment"
                assert payment.get("amount") == recurring_payment_payload["amount"], "Amount mismatch in dashboard payment"
                break
        assert recurring_found, "Recurring payment not found in financial dashboard report"

    finally:
        # Cleanup: delete recurring payment if created
        if token and 'rec_payment_id' in locals():
            try:
                del_resp = session.delete(
                    f"{BASE_URL_API}{PAYMENTS_ENDPOINT}/{rec_payment_id}",
                    timeout=TIMEOUT
                )
                # It's ok if deletion fails after test, so no assertion on delete
            except Exception:
                pass

        # Logout session if authenticated
        if token:
            try:
                session.post(
                    BASE_URL_AUTH + LOGOUT_ENDPOINT,
                    timeout=TIMEOUT
                )
            except Exception:
                pass


test_financial_management_payment_tracking_and_reporting()