import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:5173"
AUTH_USERNAME = "Admin"
AUTH_PASSWORD = "9876543225"
TIMEOUT = 30

# Employee roles to test creation for
employee_roles = [
    "Marketing Manager",
    "Senior Developer",
    "Finance Manager",
    "Operations Manager",
    "UI/UX Designer",
    "Sales Manager",
    "Customer Support",
    "Data Analyst",
    "SEO Specialist",
    "Ads Specialist",
    "Social Media",
    "YouTube SEO",
    "Web Developer",
    "Graphic Designer",
    "Operations Head",
    "Accountant",
    "Sales Rep",
    "HR Manager",
    "Super Admin",
    "Freelancer",
    "Intern"
]

def test_create_new_employee_endpoint():
    headers = {
        "Content-Type": "application/json"
    }
    auth = HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD)

    created_employee_ids = []

    try:
        for idx, role in enumerate(employee_roles):
            # Unique test data for each employee
            first_name = f"TestFirst{idx}"
            last_name = f"TestLast{idx}"
            email = f"testemployee{idx}@example.com"
            payload = {
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                "role": role
            }

            response = requests.post(
                f"{BASE_URL}/api/employees",
                json=payload,
                headers=headers,
                auth=auth,
                timeout=TIMEOUT
            )

            # Assert status code 201 Created (typical for creation)
            assert response.status_code == 201 or response.status_code == 200, f"Failed to create employee with role {role}, status code: {response.status_code}"

            data = response.json()
            # Check that returned data confirms creation and contains expected fields
            assert isinstance(data, dict), f"Response data is not a JSON object for role {role}"
            assert "id" in data, f"Response JSON missing 'id' field for role {role}"
            assert data.get("first_name") == first_name, f"First name mismatch for role {role}"
            assert data.get("last_name") == last_name, f"Last name mismatch for role {role}"
            assert data.get("email") == email, f"Email mismatch for role {role}"
            assert data.get("role") == role, f"Role mismatch for role {role}"

            created_employee_ids.append(data["id"])

    finally:
        # Cleanup: delete created employees
        for emp_id in created_employee_ids:
            try:
                del_response = requests.delete(
                    f"{BASE_URL}/api/employees/{emp_id}",
                    headers=headers,
                    auth=auth,
                    timeout=TIMEOUT
                )
                # Accept 200 OK or 204 No Content as successful deletion
                assert del_response.status_code in (200, 204), f"Failed to delete employee {emp_id}, status code: {del_response.status_code}"
            except Exception:
                # Ignore exceptions during cleanup to avoid masking test failures
                pass

test_create_new_employee_endpoint()