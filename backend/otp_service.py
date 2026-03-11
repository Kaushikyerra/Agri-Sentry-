import os
import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
else:
    print("Warning: Twilio credentials not configured")

OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 10
MAX_OTP_ATTEMPTS_PER_HOUR = 5

def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=OTP_LENGTH))

def send_otp_sms(phone_number: str, otp: str) -> bool:
    if not twilio_client:
        print(f"Twilio not configured. OTP for {phone_number}: {otp}")
        return False
    
    try:
        message = twilio_client.messages.create(
            body=f"Your KrishiAI verification code is: {otp}. Valid for {OTP_EXPIRY_MINUTES} minutes. Do not share this code.",
            from_=TWILIO_PHONE_NUMBER,
            to=phone_number
        )
        print(f"SMS sent successfully: {message.sid}")
        return True
    except Exception as e:
        error_msg = str(e)
        # If it's an unverified number error, log it but don't fail
        if "unverified" in error_msg.lower() or "21608" in error_msg:
            print(f"⚠️  Twilio Trial Limitation: Cannot send to unverified number {phone_number}")
            print(f"📝 OTP for testing: {otp}")
            print(f"💡 To fix: Verify phone number at https://www.twilio.com/user/account/phone-numbers/verified")
            return True  # Return True so OTP flow continues
        else:
            print(f"Error sending SMS: {e}")
            return False

def normalize_phone_number(phone: str) -> str:
    phone = phone.strip().replace(" ", "").replace("-", "")
    
    if phone.startswith("+91"):
        return phone
    elif phone.startswith("91") and len(phone) == 12:
        return f"+{phone}"
    elif len(phone) == 10:
        return f"+91{phone}"
    else:
        return phone

def create_otp_record(supabase, phone_number: str, otp: str) -> Tuple[bool, str]:
    try:
        normalized_phone = normalize_phone_number(phone_number)
        
        one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
        one_hour_ago_iso = one_hour_ago.isoformat().replace("+00:00", "Z")
        recent_otps = supabase.table("otp_verifications").select("*").eq("phone_number", normalized_phone).gte("created_at", one_hour_ago_iso).execute()
        
        if len(recent_otps.data) >= MAX_OTP_ATTEMPTS_PER_HOUR:
            return False, "Maximum OTP attempts exceeded. Please try again after 1 hour."
        
        expiry_time = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
        expiry_time_iso = expiry_time.isoformat().replace("+00:00", "Z")
        
        otp_record = {
            "phone_number": normalized_phone,
            "otp_code": otp,
            "expires_at": expiry_time_iso,
            "is_verified": False,
            "attempts": 0
        }
        
        supabase.table("otp_verifications").insert(otp_record).execute()
        
        return True, "OTP sent successfully"
    except Exception as e:
        print(f"Error creating OTP record: {e}")
        return False, f"Failed to create OTP record: {str(e)}"

def verify_otp(supabase, phone_number: str, otp_code: str) -> Tuple[bool, str, Optional[str]]:
    try:
        normalized_phone = normalize_phone_number(phone_number)
        
        otp_records = supabase.table("otp_verifications").select("*").eq("phone_number", normalized_phone).eq("otp_code", otp_code).eq("is_verified", False).order("created_at", desc=True).limit(1).execute()
        
        if not otp_records.data:
            return False, "Invalid OTP code", None
        
        otp_record = otp_records.data[0]
        
        # Parse the expires_at timestamp (Supabase returns ISO format with Z suffix)
        expires_at_str = otp_record["expires_at"]
        if expires_at_str.endswith("Z"):
            expires_at_str = expires_at_str[:-1] + "+00:00"
        expires_at = datetime.fromisoformat(expires_at_str)
        
        now_utc = datetime.now(timezone.utc)
        
        if expires_at < now_utc:
            supabase.table("otp_verifications").update({"is_verified": True}).eq("id", otp_record["id"]).execute()
            return False, "OTP has expired", None
        
        if otp_record["attempts"] >= 3:
            return False, "Maximum verification attempts exceeded", None
        
        supabase.table("otp_verifications").update({
            "is_verified": True,
            "verified_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        }).eq("id", otp_record["id"]).execute()
        
        return True, "OTP verified successfully", normalized_phone
    except Exception as e:
        print(f"Error verifying OTP: {e}")
        return False, f"Verification failed: {str(e)}", None

def increment_otp_attempts(supabase, phone_number: str, otp_code: str):
    try:
        normalized_phone = normalize_phone_number(phone_number)
        
        otp_records = supabase.table("otp_verifications").select("*").eq("phone_number", normalized_phone).eq("otp_code", otp_code).eq("is_verified", False).order("created_at", desc=True).limit(1).execute()
        
        if otp_records.data:
            otp_record = otp_records.data[0]
            supabase.table("otp_verifications").update({
                "attempts": otp_record["attempts"] + 1
            }).eq("id", otp_record["id"]).execute()
    except Exception as e:
        print(f"Error incrementing OTP attempts: {e}")

def cleanup_expired_otps(supabase):
    try:
        now_utc = datetime.now(timezone.utc)
        now_iso = now_utc.isoformat().replace("+00:00", "Z")
        
        supabase.table("otp_verifications").delete().lt("expires_at", now_iso).execute()
        
        print("Expired OTPs cleaned up successfully")
    except Exception as e:
        print(f"Error cleaning up expired OTPs: {e}")
