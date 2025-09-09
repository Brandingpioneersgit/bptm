import requests

BASE_URL_BACKEND = "http://localhost:8000"
BASE_URL_FRONTEND = "http://localhost:5173"
LOGIN_ENDPOINT = "/api/auth/login"
LOGOUT_ENDPOINT = "/api/auth/logout"
MONTHLY_REPORT_ENDPOINT = "/api/reports/monthly-tactical"
LIVE_DATA_ENDPOINT = "/api/live-data"
HEADERS_COMMON = {"Content-Type": "application/json"}
TIMEOUT = 30

def test_kpi_and_performance_tracking_submission():
    session = requests.Session()
    auth_headers = None
    try:
        # 1. Authenticate and get token
        login_resp = session.post(
            BASE_URL_BACKEND + LOGIN_ENDPOINT,
            json={"username": "marketing.manager@example.com", "password": "password123"},
            headers=HEADERS_COMMON,
            timeout=TIMEOUT,
        )
        assert login_resp.status_code == 200, "Login failed"
        login_data = login_resp.json()
        token = login_data.get("token")
        assert token, "No token received on login"

        auth_headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        # 2. Submit an interactive KPI form (simulate quick submission with KPIs and proof URL)
        interactive_kpi_payload = {
            "reportingMonth": "2025-09",
            "employeeId": login_data.get("user", {}).get("id"),
            "kpis": [
                {"kpiId": "seo_traffic", "value": 1500, "proofUrl": "http://proof.example.com/seo_traffic.png"},
                {"kpiId": "leads_generated", "value": 30, "proofUrl": "http://proof.example.com/leads_report.pdf"},
            ],
            "comments": "KPI quick submission for September 2025",
        }
        submit_resp = session.post(
            BASE_URL_BACKEND + MONTHLY_REPORT_ENDPOINT,
            json=interactive_kpi_payload,
            headers=auth_headers,
            timeout=TIMEOUT,
        )
        assert submit_resp.status_code in (200, 201), f"Failed KPI submission: {submit_resp.text}"
        submit_data = submit_resp.json()
        report_id = submit_data.get("id")
        assert report_id, "No report ID returned after KPI submission"

        # 3. Retrieve the monthly reporting dashboard data to verify submission presence and correctness
        dashboard_resp = session.get(
            f"{BASE_URL_BACKEND}/api/reports/monthly-tactical?month=2025-09&employeeId={interactive_kpi_payload['employeeId']}",
            headers=auth_headers,
            timeout=TIMEOUT,
        )
        assert dashboard_resp.status_code == 200, "Failed to fetch monthly tactical reports"
        dashboard_data = dashboard_resp.json()
        # Find the submitted report among fetched data
        matching_reports = [r for r in dashboard_data if r.get("id") == report_id]
        assert len(matching_reports) == 1, "Submitted KPI report not found in monthly dashboard"
        report = matching_reports[0]

        # Validate kpi values and proof URLs returned match submitted data
        received_kpis = report.get("kpis", [])
        assert len(received_kpis) == len(interactive_kpi_payload["kpis"]), "Mismatch in number of KPIs returned"
        for sent_kpi in interactive_kpi_payload["kpis"]:
            matched_kpi = next((k for k in received_kpis if k.get("kpiId") == sent_kpi["kpiId"]), None)
            assert matched_kpi, f"KPI {sent_kpi['kpiId']} missing in response"
            assert matched_kpi.get("value") == sent_kpi["value"], f"KPI value mismatch for {sent_kpi['kpiId']}"
            assert matched_kpi.get("proofUrl") == sent_kpi["proofUrl"], f"KPI proof URL mismatch for {sent_kpi['kpiId']}"

        # 4. Verify live KPI data endpoint reflects the new KPI submission (simulate quick submission form dashboard)
        live_data_resp = session.get(
            LIVE_DATA_ENDPOINT,
            headers=auth_headers,
            timeout=TIMEOUT,
        )
        assert live_data_resp.status_code == 200, "Failed to fetch live KPI data"
        live_data = live_data_resp.json()
        # Check that the KPIs contain submitted values with the same employeeId and month if possible
        # This is a lightweight check just for presence and reasonable value
        found = False
        for record in live_data:
            if record.get("employeeId") == interactive_kpi_payload["employeeId"] and record.get("month") == "2025-09":
                kpis = record.get("kpis", [])
                if any(k.get("kpiId") == "seo_traffic" and k.get("value") == 1500 for k in kpis):
                    found = True
                    break
        assert found, "Submitted KPI data not reflected in live KPI data feed"

    finally:
        # Logout user session if token available
        if auth_headers:
            try:
                session.post(
                    BASE_URL_BACKEND + LOGOUT_ENDPOINT,
                    headers=auth_headers,
                    timeout=TIMEOUT,
                )
            except requests.RequestException:
                pass
        session.close()

test_kpi_and_performance_tracking_submission()
