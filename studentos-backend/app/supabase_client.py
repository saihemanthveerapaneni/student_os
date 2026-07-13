from supabase import create_client, Client
from app.config import settings

supabase: Client = None

if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY and "mockproject" not in settings.SUPABASE_URL and "mock-url" not in settings.SUPABASE_URL:
    try:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    except Exception as e:
        print(f"Supabase client initialization failed: {e}")
else:
    print("Supabase credentials missing or mock. Supabase Client is not initialized.")
