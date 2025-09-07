import requests
from requests.auth import HTTPBasicAuth
import time

BASE_URL = "http://localhost:5173"
AUTH = HTTPBasicAuth("Admin", "9876543225")
TIMEOUT = 30

def test_reporting_and_analytics_generation_and_export():
    headers = {
        "Accept": "application/json"
    }
    
    report_ids = []
    try:
        # 1. Generate monthly tactical report
        monthly_payload = {
            "report_type": "monthly_tactical",
            "period": "2025-08"
        }
        monthly_start = time.time()
        monthly_resp = requests.post(f"{BASE_URL}/api/reports/generate", 
                                     auth=AUTH, headers=headers, json=monthly_payload, timeout=TIMEOUT)
        monthly_duration = time.time() - monthly_start
        assert monthly_resp.status_code == 201, f"Monthly report generation failed: {monthly_resp.text}"
        monthly_data = monthly_resp.json()
        assert "report_id" in monthly_data, "Missing report_id in monthly report response"
        report_ids.append(monthly_data["report_id"])
        assert monthly_duration < 10, f"Monthly report generation exceeded performance limits: {monthly_duration}s"
        
        # 2. Generate quarterly strategic report
        quarterly_payload = {
            "report_type": "quarterly_strategic",
            "period": "2025-Q2"
        }
        quarterly_start = time.time()
        quarterly_resp = requests.post(f"{BASE_URL}/api/reports/generate", 
                                      auth=AUTH, headers=headers, json=quarterly_payload, timeout=TIMEOUT)
        quarterly_duration = time.time() - quarterly_start
        assert quarterly_resp.status_code == 201, f"Quarterly report generation failed: {quarterly_resp.text}"
        quarterly_data = quarterly_resp.json()
        assert "report_id" in quarterly_data, "Missing report_id in quarterly report response"
        report_ids.append(quarterly_data["report_id"])
        assert quarterly_duration < 10, f"Quarterly report generation exceeded performance limits: {quarterly_duration}s"
        
        # 3. Export generated reports to PDF and CSV formats and check performance
        for report_id in report_ids:
            for fmt in ["pdf", "csv"]:
                export_start = time.time()
                export_resp = requests.get(f"{BASE_URL}/api/reports/{report_id}/export?format={fmt}",
                                           auth=AUTH, headers=headers, timeout=TIMEOUT)
                export_duration = time.time() - export_start
                assert export_resp.status_code == 200, f"Export {fmt.upper()} failed for report {report_id}: {export_resp.text}"
                content_type = export_resp.headers.get("Content-Type", "")
                if fmt == "pdf":
                    assert "application/pdf" in content_type, f"Invalid content type for PDF export: {content_type}"
                else:
                    assert "text/csv" in content_type or "application/csv" in content_type, f"Invalid content type for CSV export: {content_type}"
                assert export_duration < 10, f"Export {fmt.upper()} exceeded performance limits for report {report_id}: {export_duration}s"

        # 4. Role-based access control test for reporting endpoints for 15+ user roles
        user_roles = [
            "admin", "super_admin", "manager", "employee", "seo_specialist", "hr", "accountant",
            "sales", "operations_head", "client", "guest", "intern", "finance_manager",
            "project_manager", "support"
        ]
        for role in user_roles:
            # Get token for role (simulate login or token retrieval)
            # Since no API provided to get tokens for roles, simulate with a header for test purposes:
            role_headers = headers.copy()
            role_headers["X-User-Role"] = role
            # Attempt to get monthly reports list, which should be protected by role
            resp = requests.get(f"{BASE_URL}/api/reports?type=monthly_tactical", auth=AUTH, headers=role_headers, timeout=TIMEOUT)
            # Allowed roles: admin, super_admin, manager, operations_head, finance_manager, project_manager
            if role in ["admin", "super_admin", "manager", "operations_head", "finance_manager", "project_manager"]:
                assert resp.status_code == 200, f"Role {role} should have access but got {resp.status_code}"
            else:
                assert resp.status_code in [401,403], f"Role {role} should be denied access but got {resp.status_code}"

        # 5. Verify that database sync is reflected by fetching report metadata (assuming /api/reports/sync-status)
        sync_resp = requests.get(f"{BASE_URL}/api/reports/sync-status", auth=AUTH, headers=headers, timeout=TIMEOUT)
        assert sync_resp.status_code == 200, "Failed to get sync status"
        sync_data = sync_resp.json()
        assert "last_synced" in sync_data, "Sync status missing last_synced field"
        # Basic validation: last synced timestamp is recent
        import datetime
        last_synced = datetime.datetime.fromisoformat(sync_data["last_synced"].replace("Z","+00:00"))
        now = datetime.datetime.utcnow()
        delta = now - last_synced
        assert delta.total_seconds() < 3600, "Database sync is older than 1 hour, indicating potential sync issues"

        # 6. Test employee/client onboarding related reporting endpoints (simulate GET requests)
        # Employee onboarding report
        emp_report_resp = requests.get(f"{BASE_URL}/api/reports/employee_onboarding?period=2025-08",
                                       auth=AUTH, headers=headers, timeout=TIMEOUT)
        assert emp_report_resp.status_code == 200, "Failed to fetch employee onboarding report"
        emp_report_data = emp_report_resp.json()
        assert isinstance(emp_report_data, dict), "Employee onboarding report response not dict"

        # Client onboarding report
        client_report_resp = requests.get(f"{BASE_URL}/api/reports/client_onboarding?period=2025-08",
                                         auth=AUTH, headers=headers, timeout=TIMEOUT)
        assert client_report_resp.status_code == 200, "Failed to fetch client onboarding report"
        client_report_data = client_report_resp.json()
        assert isinstance(client_report_data, dict), "Client onboarding report response not dict"

    finally:
        # Cleanup: delete generated reports to keep database clean
        for report_id in report_ids:
            del_resp = requests.delete(f"{BASE_URL}/api/reports/{report_id}", auth=AUTH, headers=headers, timeout=TIMEOUT)
            # Accept 200 or 204 for successful deletion
            assert del_resp.status_code in [200, 204, 404], f"Failed to delete report {report_id}: {del_resp.text}"

test_reporting_and_analytics_generation_and_export()
