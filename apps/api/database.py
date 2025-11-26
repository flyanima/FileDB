import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY") # Use Service Key for Backend to bypass RLS if needed, or Anon Key if acting as user

if not url or not key:
    raise ValueError("Supabase credentials not found in environment variables.")

supabase: Client = create_client(url, key)

def get_supabase() -> Client:
    return supabase
