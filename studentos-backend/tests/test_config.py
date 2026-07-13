import unittest

from app.config import settings


class ConfigTests(unittest.TestCase):
    def test_groq_provider_is_selected_from_env(self):
        self.assertEqual(settings.AI_PROVIDER, "groq")

    def test_backend_allows_local_frontend_origins(self):
        origins = [origin.strip() for origin in settings.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]
        self.assertIn("http://localhost:3000", origins)
        self.assertIn("http://127.0.0.1:3000", origins)


if __name__ == "__main__":
    unittest.main()
