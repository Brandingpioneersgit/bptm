import requests

BASE_URL_AUTH = "http://localhost:8000"
BASE_URL_APP = "http://localhost:5173"
LOGIN_ENDPOINT = "/api/auth/login"
LOGOUT_ENDPOINT = "/api/auth/logout"
SEO_DATA_ENTRY_ENDPOINT = "/api/live-data"
EMPLOYEE_DASHBOARD_ENDPOINT = "/api/employees"
TEAM_DASHBOARD_ENDPOINT = "/api/workspaces"
APPRAISAL_ENDPOINT = "/api/reports/monthly-tactical"

TEST_CREDENTIALS = {
    "email": "manager@example.com",
    "password": "managerPass123"
}

TIMEOUT = 30

def test_seo_module_data_entry_and_appraisal_linkage():
    session = requests.Session()
    try:
        # Authenticate and get token
        login_resp = session.post(
            BASE_URL_AUTH + LOGIN_ENDPOINT,
            json=TEST_CREDENTIALS,
            timeout=TIMEOUT,
        )
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        login_data = login_resp.json()
        assert "token" in login_data, "Token missing in login response"
        token = login_data["token"]

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # 1. Submit SEO KPI data entry form - create a new live-data record referring SEO KPIs
        seo_payload = {
            "module": "seo",
            "kpis": {
                "organic_traffic": 12500,
                "keyword_ranking": 35,
                "backlinks": 120,
                "content_updates": 4
            },
            "proof_urls": [
                "http://proof.example.com/seo/organic_traffic_report",
                "http://proof.example.com/seo/keyword_ranking_report"
            ],
            "submitted_by": "manager@example.com"
        }
        seo_create_resp = session.post(
            BASE_URL_APP + SEO_DATA_ENTRY_ENDPOINT,
            json=seo_payload,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert seo_create_resp.status_code in (200, 201), f"SEO data entry failed: {seo_create_resp.text}"
        seo_data = seo_create_resp.json()
        assert "id" in seo_data, "Created SEO data entry missing id"
        seo_id = seo_data["id"]

        # 2. Verify employee dashboard access and data visibility (for manager@example.com)
        employee_resp = session.get(
            BASE_URL_APP + EMPLOYEE_DASHBOARD_ENDPOINT,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert employee_resp.status_code == 200, f"Employee dashboard access failed: {employee_resp.text}"
        employee_data = employee_resp.json()
        # Check that SEO KPIs data or module data is visible or referenced
        seo_found = False
        for entry in employee_data.get("seo_kpi_entries", []):
            if entry.get("id") == seo_id:
                seo_found = True
                break
        assert seo_found, "SEO KPI entry not found in employee dashboard"

        # 3. Verify team dashboard shows aggregated SEO KPI data
        team_resp = session.get(
            BASE_URL_APP + TEAM_DASHBOARD_ENDPOINT,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert team_resp.status_code == 200, f"Team dashboard access failed: {team_resp.text}"
        team_data = team_resp.json()
        # Expect some aggregated SEO KPI summary, e.g. team organic traffic or recent entries count
        assert "seo_kpi_summary" in team_data, "SEO KPI summary missing in team dashboard"
        assert team_data["seo_kpi_summary"].get("total_entries", 0) > 0, "Team dashboard SEO KPI summary empty"

        # 4. Verify appraisal system correctly tracks the SEO KPI and enforces role-based access
        # Try to fetch appraisal report for the user
        appraisal_resp = session.get(
            BASE_URL_APP + APPRAISAL_ENDPOINT,
            headers=headers,
            timeout=TIMEOUT,
        )
        assert appraisal_resp.status_code == 200, f"Appraisal report access failed: {appraisal_resp.text}"
        appraisal_data = appraisal_resp.json()
        # Verify appraisal data contains SEO KPI linkage & performance scoring related to the SEO ID
        appraisal_entries = appraisal_data.get("appraisals", [])
        linked_in_appraisal = False
        for appraisal in appraisal_entries:
            if appraisal.get("related_seo_data_id") == seo_id:
                linked_in_appraisal = True
                # Check presence of performance KPIs and appraisal score
                assert "performance_kpis" in appraisal, "Performance KPIs missing in appraisal"
                assert "score" in appraisal, "Appraisal score missing"
                break
        assert linked_in_appraisal, "SEO data entry not linked in appraisal system"

        # 5. Attempt unauthorized access test for restricted roles by altering token (simulate as Intern)
        # Note: For test simplicity, we'll try to fetch appraisal with an invalid token that simulates no access
        unauthorized_headers = {
            "Authorization": "Bearer invalid_or_intern_token",
            "Content-Type": "application/json"
        }
        unauthorized_resp = session.get(
            BASE_URL_APP + APPRAISAL_ENDPOINT,
            headers=unauthorized_headers,
            timeout=TIMEOUT,
        )
        # Expect unauthorized or forbidden response for restricted role
        assert unauthorized_resp.status_code in (401, 403), "Unauthorized access not blocked properly"

    finally:
        # Logout to end session
        try:
            session.post(BASE_URL_AUTH + LOGOUT_ENDPOINT, headers=headers, timeout=TIMEOUT)
        except Exception:
            pass

test_seo_module_data_entry_and_appraisal_linkage()
