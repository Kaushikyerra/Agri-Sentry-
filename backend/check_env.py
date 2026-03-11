"""
KrishiAI — Environment & External Service Validator

Run this script to verify all environment variables are configured and
all external services are reachable before starting the backend.

Usage:
    cd backend
    python check_env.py
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

RESET = "\033[0m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"

PASS = f"{GREEN}✔ PASS{RESET}"
WARN = f"{YELLOW}⚠ WARN{RESET}"
FAIL = f"{RED}✖ FAIL{RESET}"

errors = []
warnings = []


def check(label: str, value: str | None, required: bool = True) -> bool:
    if value:
        print(f"  {PASS}  {label}")
        return True
    elif required:
        print(f"  {FAIL}  {label} — NOT SET (required)")
        errors.append(label)
        return False
    else:
        print(f"  {WARN}  {label} — not set (optional)")
        warnings.append(label)
        return False


def section(title: str):
    print(f"\n{BOLD}{title}{RESET}")
    print("─" * 50)


def test_supabase():
    section("Supabase")
    url = os.getenv("VITE_SUPABASE_URL")
    anon_key = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    check("VITE_SUPABASE_URL", url)
    check("VITE_SUPABASE_PUBLISHABLE_KEY", anon_key)
    check("SUPABASE_SERVICE_ROLE_KEY", service_key)

    if url and service_key:
        try:
            from supabase import create_client
            client = create_client(url, service_key)
            client.table("profiles").select("id").limit(1).execute()
            print(f"  {PASS}  Supabase connection (profiles table reachable)")
        except Exception as e:
            print(f"  {FAIL}  Supabase connection — {e}")
            errors.append("Supabase connectivity")


def test_mqtt():
    section("MQTT Broker (HiveMQ)")
    broker = os.getenv("MQTT_BROKER", "broker.hivemq.com")
    port = int(os.getenv("MQTT_PORT", "1883"))
    username = os.getenv("MQTT_USERNAME", "")
    password = os.getenv("MQTT_PASSWORD", "")
    use_tls = os.getenv("MQTT_USE_TLS", "false").lower() == "true"

    check("MQTT_BROKER", broker)
    check("MQTT_PORT", os.getenv("MQTT_PORT", "1883"))

    if username:
        print(f"  {PASS}  MQTT_USERNAME / MQTT_PASSWORD — set")
    else:
        print(f"  {WARN}  MQTT_USERNAME / MQTT_PASSWORD — using public broker (no auth)")
        warnings.append("MQTT credentials")

    try:
        import paho.mqtt.client as mqtt

        connected = False

        def on_connect(c, ud, flags, rc):
            nonlocal connected
            connected = (rc == 0)

        client = mqtt.Client()
        if username and password:
            client.username_pw_set(username, password)
        if use_tls:
            client.tls_set()
        client.on_connect = on_connect
        client.connect(broker, port, keepalive=5)
        client.loop_start()

        import time
        time.sleep(2)
        client.loop_stop()
        client.disconnect()

        if connected:
            print(f"  {PASS}  MQTT connection to {broker}:{port}")
        else:
            print(f"  {FAIL}  MQTT connection to {broker}:{port} — handshake failed")
            errors.append("MQTT connectivity")

    except Exception as e:
        print(f"  {FAIL}  MQTT connection — {e}")
        errors.append("MQTT connectivity")


def test_twilio():
    section("Twilio (SMS / OTP / Voice / WhatsApp)")
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    phone = os.getenv("TWILIO_PHONE_NUMBER")
    wa_number = os.getenv("TWILIO_WHATSAPP_NUMBER")

    check("TWILIO_ACCOUNT_SID", sid)
    check("TWILIO_AUTH_TOKEN", token)
    check("TWILIO_PHONE_NUMBER", phone)
    check("TWILIO_WHATSAPP_NUMBER", wa_number, required=False)

    if sid and token:
        try:
            from twilio.rest import Client
            client = Client(sid, token)
            account = client.api.accounts(sid).fetch()
            print(f"  {PASS}  Twilio account active: {account.friendly_name}")
        except Exception as e:
            print(f"  {FAIL}  Twilio credentials invalid — {e}")
            errors.append("Twilio connectivity")


def test_google_maps():
    section("Google Maps API")
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    check("GOOGLE_MAPS_API_KEY", api_key)

    if api_key:
        try:
            import requests
            resp = requests.get(
                "https://maps.googleapis.com/maps/api/geocode/json",
                params={"latlng": "28.6139,77.2090", "key": api_key},
                timeout=10,
            )
            data = resp.json()
            status = data.get("status")
            if status == "OK":
                print(f"  {PASS}  Google Maps Geocoding API — OK")
            elif status == "REQUEST_DENIED":
                print(f"  {FAIL}  Google Maps API key rejected — {data.get('error_message', status)}")
                errors.append("Google Maps API key")
            else:
                print(f"  {WARN}  Google Maps response status: {status}")
                warnings.append("Google Maps API")
        except Exception as e:
            print(f"  {FAIL}  Google Maps API request failed — {e}")
            errors.append("Google Maps connectivity")


def test_openweather():
    section("OpenWeather API")
    api_key = os.getenv("OPENWEATHER_API_KEY")
    check("OPENWEATHER_API_KEY", api_key)

    if api_key:
        try:
            import requests
            resp = requests.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={"q": "Delhi", "appid": api_key},
                timeout=10,
            )
            if resp.status_code == 200:
                print(f"  {PASS}  OpenWeather API — OK")
            elif resp.status_code == 401:
                print(f"  {FAIL}  OpenWeather API key invalid")
                errors.append("OpenWeather API key")
            else:
                print(f"  {WARN}  OpenWeather API returned {resp.status_code}")
                warnings.append("OpenWeather API")
        except Exception as e:
            print(f"  {FAIL}  OpenWeather API request failed — {e}")
            errors.append("OpenWeather connectivity")


def test_gemini():
    section("Gemini AI (Google GenerativeAI)")
    api_key = os.getenv("VITE_GEMINI_API_KEY")
    check("VITE_GEMINI_API_KEY", api_key)

    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.0-flash")
            resp = model.generate_content("Say 'OK' in one word.")
            if resp.text:
                print(f"  {PASS}  Gemini AI API — OK (response: {resp.text.strip()[:20]})")
            else:
                print(f"  {WARN}  Gemini AI returned empty response")
                warnings.append("Gemini AI")
        except Exception as e:
            print(f"  {FAIL}  Gemini AI API failed — {e}")
            errors.append("Gemini AI connectivity")


def test_optional():
    section("Optional / Legacy (Market Prices DB)")
    check("DB_NAME", os.getenv("DB_NAME"), required=False)
    check("DB_USER", os.getenv("DB_USER"), required=False)
    check("DB_PASS", os.getenv("DB_PASS"), required=False)
    check("DB_HOST", os.getenv("DB_HOST"), required=False)
    check("DB_PORT", os.getenv("DB_PORT"), required=False)
    check("API_KEY (data.gov.in)", os.getenv("API_KEY"), required=False)
    check("APP_BASE_URL", os.getenv("APP_BASE_URL"), required=False)


def print_summary():
    section("Summary")
    total_errors = len(errors)
    total_warnings = len(warnings)

    if total_errors == 0 and total_warnings == 0:
        print(f"  {GREEN}{BOLD}All checks passed! Backend is ready to start.{RESET}")
    elif total_errors == 0:
        print(f"  {YELLOW}{BOLD}{total_warnings} warning(s) — backend will start but some features may be limited.{RESET}")
        for w in warnings:
            print(f"    {WARN}  {w}")
    else:
        print(f"  {RED}{BOLD}{total_errors} error(s) found — fix these before starting the backend.{RESET}")
        for e in errors:
            print(f"    {FAIL}  {e}")
        if total_warnings:
            print(f"\n  {total_warnings} warning(s):")
            for w in warnings:
                print(f"    {WARN}  {w}")

    print()
    print("  Next steps:")
    print("    1. Edit backend/.env with missing values")
    print("    2. Run: uvicorn api:app --reload --port 8000")
    print("    3. Visit: http://localhost:8000/docs")
    print()

    return total_errors


if __name__ == "__main__":
    print(f"\n{BOLD}KrishiAI — Environment & Service Validation{RESET}")
    print("=" * 50)
    print("Checking all required environment variables and")
    print("testing connectivity to external services...")

    test_supabase()
    test_mqtt()
    test_twilio()
    test_google_maps()
    test_openweather()
    test_gemini()
    test_optional()

    exit_code = print_summary()
    sys.exit(1 if exit_code > 0 else 0)
