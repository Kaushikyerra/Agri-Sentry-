import logging
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_log_generator import generate_daily_log
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")

# Lazy initialization of Supabase client
_supabase_client: Client = None

def get_supabase_client() -> Client:
    """Get or initialize Supabase client on first use (lazy initialization)"""
    global _supabase_client
    
    if _supabase_client is not None:
        return _supabase_client
    
    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
    
    if not url or not key:
        logger.error("Supabase credentials not configured. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.")
        return None
    
    try:
        _supabase_client = create_client(url, key)
        logger.info("Supabase client initialized successfully")
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None

async def generate_daily_logs_for_all_users():
    logger.info("🌾 Starting daily log generation for all users")
    
    supabase = get_supabase_client()
    if not supabase:
        logger.error("Supabase client not configured")
        return
    
    try:
        users_response = supabase.table("profiles").select("id, name, phone_verified").eq("phone_verified", True).execute()
        
        if not users_response.data:
            logger.info("No verified users found")
            return
        
        users = users_response.data
        logger.info(f"Found {len(users)} verified users to process")
        
        success_count = 0
        error_count = 0
        
        for user in users:
            try:
                result = await generate_daily_log(supabase, user["id"])
                if result.get("success"):
                    success_count += 1
                    logger.info(f"✅ Generated log for user {user.get('name', user['id'])}")
                else:
                    error_count += 1
                    logger.error(f"❌ Failed to generate log for user {user['id']}")
            except Exception as e:
                error_count += 1
                logger.error(f"❌ Error generating log for user {user['id']}: {e}")
        
        logger.info(f"📊 Daily log generation complete: {success_count} success, {error_count} errors")
    except Exception as e:
        logger.error(f"Failed to generate daily logs: {e}")
        raise
