import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_current_user
from app.supabase_client import supabase

# Mock current user dependency
def mock_get_current_user():
    return {"id": "test-user-id", "email": "test@example.com"}

class UserProfileTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Override get_current_user dependency
        app.dependency_overrides[get_current_user] = mock_get_current_user
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        # Clean up dependency overrides
        app.dependency_overrides.clear()

    def test_01_get_profile(self):
        response = self.client.get("/users/me")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify the presence of array fields
        self.assertIn("skills", data)
        self.assertIn("interests", data)
        self.assertIn("certifications", data)
        
        self.assertIsInstance(data["skills"], list)
        self.assertIsInstance(data["interests"], list)
        self.assertIsInstance(data["certifications"], list)

    def test_02_update_profile(self):
        payload = {
            "name": "Test User",
            "skills": ["Python", "TypeScript", "React"],
            "interests": ["Machine Learning", "Open Source"],
            "certifications": ["AWS Cloud Practitioner", "FastAPI Expert"]
        }
        response = self.client.put("/users/me", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "success")
        
        # Depending on if supabase is connected or not, check data
        if "updated_data" in data:
            updated = data["updated_data"]
            self.assertEqual(updated["skills"], ["Python", "TypeScript", "React"])
            self.assertEqual(updated["interests"], ["Machine Learning", "Open Source"])
            self.assertEqual(updated["certifications"], ["AWS Cloud Practitioner", "FastAPI Expert"])

if __name__ == "__main__":
    unittest.main()
