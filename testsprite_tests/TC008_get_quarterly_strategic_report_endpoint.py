import requests

BASE_URL = "http://localhost:5173"
TIMEOUT = 30

# User credentials by category and roles to test
USERS = [
    # Employee Category
    {"email": "marketing.manager@example.com", "password": "password1", "role": "Marketing Manager"},
    {"email": "senior.dev@example.com", "password": "password2", "role": "Senior Developer"},
    {"email": "finance.manager@example.com", "password": "password3", "role": "Finance Manager"},
    {"email": "operations.manager@example.com", "password": "password4", "role": "Operations Manager"},
    {"email": "ui.ux.designer@example.com", "password": "password5", "role": "UI/UX Designer"},
    {"email": "sales.manager@example.com", "password": "password6", "role": "Sales Manager"},
    {"email": "customer.support@example.com", "password": "password7", "role": "Customer Support"},
    {"email": "data.analyst@example.com", "password": "password8", "role": "Data Analyst"},
    # Specialized Roles
    {"email": "seo.specialist@example.com", "password": "password9", "role": "SEO Specialist"},
    {"email": "ads.specialist@example.com", "password": "password10", "role": "Ads Specialist"},
    {"email": "social.media@example.com", "password": "password11", "role": "Social Media"},
    {"email": "youtube.seo@example.com", "password": "password12", "role": "YouTube SEO"},
    {"email": "web.developer@example.com", "password": "password13", "role": "Web Developer"},
    {"email": "graphic.designer@example.com", "password": "password14", "role": "Graphic Designer"},
    # Management & Admin
    {"email": "operations.head@example.com", "password": "password15", "role": "Operations Head"},
    {"email": "accountant@example.com", "password": "password16", "role": "Accountant"},
    {"email": "sales.rep@example.com", "password": "password17", "role": "Sales Rep"},
    {"email": "hr.manager@example.com", "password": "password18", "role": "HR Manager"},
    {"email": "super.admin@example.com", "password": "password19", "role": "Super Admin"},
    # Other Categories
    {"email": "freelancer@example.com", "password": "password20", "role": "Freelancer"},
    {"email": "intern@example.com", "password": "password21", "role": "Intern"},
    # Quick Test Set (some additional)
    {"email": "quick.test1@example.com", "password": "password22", "role": "Quick Test"},
    {"email": "quick.test2@example.com", "password": "password23", "role": "Quick Test"},
]

def login(user_email, user_password):
    url = f"{BASE_URL}/api/auth/login"
    payload = {"email": user_email, "password": user_password}
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    response.raise_for_status()
    data = response.json()
    assert "token" in data and isinstance(data["token"], str)
    assert "user" in data and isinstance(data["user"], dict)
    return data["token"]

def logout(token):
    url = f"{BASE_URL}/api/auth/logout"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(url, headers=headers, timeout=TIMEOUT)
    assert response.status_code == 200

def get_quarterly_strategic_report(token):
    url = f"{BASE_URL}/api/reports/quarterly-strategic"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers, timeout=TIMEOUT)
    return response

def test_get_quarterly_strategic_report_endpoint():
    for user in USERS:
        token = None
        try:
            token = login(user["email"], user["password"])
            response = get_quarterly_strategic_report(token)
            assert response.status_code == 200, f"Failed for role {user['role']} with status {response.status_code}"
            # Validate response content is JSON and contains expected keys (if known)
            json_data = response.json()
            assert isinstance(json_data, dict), f"Response is not a JSON object for role {user['role']}"
            # Additional structure checks can be added here if details are known
        except requests.exceptions.RequestException as e:
            assert False, f"HTTP request error for role {user['role']}: {e}"
        except AssertionError as ae:
            raise ae
        finally:
            if token:
                try:
                    logout(token)
                except Exception:
                    pass

test_get_quarterly_strategic_report_endpoint()