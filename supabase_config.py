"""
Supabase Backend Configuration
Initializes Supabase client for backend operations with service role key
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# Validate environment variables
if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not SUPABASE_JWT_SECRET:
    raise ValueError(
        "Missing required Supabase environment variables. "
        "Please set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_JWT_SECRET in your .env file"
    )

# Initialize Supabase client with service role key for backend operations
# Reference: https://supabase.com/docs/reference/python/initializing
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Storage bucket name for user CSV files
STORAGE_BUCKET_NAME = "user-datasets"
