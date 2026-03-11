import os
import logging
from datetime import datetime, date
from typing import Dict, List, Any, Optional
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("Gemini AI configured successfully")
else:
    logger.warning("Gemini API key not found")

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
    "gu": "Gujarati",
    "pa": "Punjabi",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam"
}

async def aggregate_sensor_data(supabase, user_id: str, log_date: date) -> Dict[str, Any]:
    try:
        start_time = datetime.combine(log_date, datetime.min.time())
        end_time = datetime.combine(log_date, datetime.max.time())
        
        response = supabase.table("sensor_readings").select(
            "sensor_type, value"
        ).eq("user_id", user_id).gte(
            "timestamp", start_time.isoformat()
        ).lte(
            "timestamp", end_time.isoformat()
        ).execute()
        
        readings = response.data if response.data else []
        
        stats = {}
        for sensor_type in ["temperature", "humidity", "soil_moisture", "ec"]:
            values = [r["value"] for r in readings if r["sensor_type"] == sensor_type]
            
            if values:
                stats[sensor_type] = {
                    "avg": round(sum(values) / len(values), 1),
                    "min": round(min(values), 1),
                    "max": round(max(values), 1),
                    "count": len(values)
                }
            else:
                stats[sensor_type] = None
        
        return stats
    except Exception as e:
        logger.error(f"Error aggregating sensor data: {e}")
        return {}

async def fetch_weather_summary(location: str, log_date: date) -> Optional[Dict[str, Any]]:
    try:
        return {
            "condition": "Partly cloudy",
            "temp_high": 32,
            "temp_low": 22,
            "rainfall": 0,
            "humidity_avg": 65
        }
    except Exception as e:
        logger.error(f"Error fetching weather: {e}")
        return None

async def fetch_user_activities(supabase, user_id: str, log_date: date) -> List[Dict[str, Any]]:
    try:
        response = supabase.table("farmer_activities").select(
            "*"
        ).eq("user_id", user_id).eq("activity_date", log_date.isoformat()).execute()
        
        return response.data if response.data else []
    except Exception as e:
        logger.error(f"Error fetching activities: {e}")
        return []

async def fetch_completed_tasks(supabase, user_id: str, log_date: date) -> List[Dict[str, Any]]:
    try:
        start_time = datetime.combine(log_date, datetime.min.time())
        end_time = datetime.combine(log_date, datetime.max.time())
        
        response = supabase.table("tasks").select(
            "*"
        ).eq("user_id", user_id).gte(
            "completed_at", start_time.isoformat()
        ).lte(
            "completed_at", end_time.isoformat()
        ).execute()
        
        return response.data if response.data else []
    except Exception as e:
        logger.error(f"Error fetching tasks: {e}")
        return []

async def fetch_alerts(supabase, user_id: str, log_date: date) -> List[Dict[str, Any]]:
    try:
        start_time = datetime.combine(log_date, datetime.min.time())
        end_time = datetime.combine(log_date, datetime.max.time())
        
        response = supabase.table("alerts").select(
            "*"
        ).eq("user_id", user_id).gte(
            "triggered_at", start_time.isoformat()
        ).lte(
            "triggered_at", end_time.isoformat()
        ).execute()
        
        return response.data if response.data else []
    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")
        return []

def generate_prompt(
    user_language: str,
    location: str,
    log_date: date,
    sensor_stats: Dict[str, Any],
    weather: Optional[Dict[str, Any]],
    activities: List[Dict[str, Any]],
    tasks: List[Dict[str, Any]],
    alerts: List[Dict[str, Any]]
) -> str:
    language_name = LANGUAGE_NAMES.get(user_language, "English")
    
    prompt = f"""You are an agricultural advisor for KrishiAI, helping Indian farmers. Generate a concise daily farm log in {language_name}.

Date: {log_date.strftime("%d %B %Y")}
Location: {location}

"""

    if sensor_stats:
        prompt += "**Sensor Data (24-hour readings):**\n"
        if sensor_stats.get("temperature"):
            temp = sensor_stats["temperature"]
            prompt += f"- Temperature: {temp['avg']}°C (Range: {temp['min']}-{temp['max']}°C)\n"
        if sensor_stats.get("humidity"):
            hum = sensor_stats["humidity"]
            prompt += f"- Humidity: {hum['avg']}% (Range: {hum['min']}-{hum['max']}%)\n"
        if sensor_stats.get("soil_moisture"):
            soil = sensor_stats["soil_moisture"]
            prompt += f"- Soil Moisture: {soil['avg']}% (Range: {soil['min']}-{soil['max']}%)\n"
        if sensor_stats.get("ec"):
            ec = sensor_stats["ec"]
            prompt += f"- Electrical Conductivity: {ec['avg']} dS/m\n"
        prompt += "\n"

    if weather:
        prompt += "**Weather:**\n"
        prompt += f"- Condition: {weather['condition']}\n"
        prompt += f"- Temperature: {weather['temp_high']}°C (High) / {weather['temp_low']}°C (Low)\n"
        prompt += f"- Rainfall: {weather['rainfall']} mm\n\n"

    if activities:
        prompt += "**Farm Activities Completed Today:**\n"
        for activity in activities[:5]:
            prompt += f"- {activity.get('activity_type', 'Activity')}: {activity.get('description', '')}\n"
        prompt += "\n"

    if tasks:
        prompt += "**Tasks Completed:**\n"
        for task in tasks[:5]:
            prompt += f"- {task.get('title', 'Task completed')}\n"
        prompt += "\n"

    if alerts:
        prompt += "**Alerts Triggered:**\n"
        for alert in alerts[:3]:
            prompt += f"- {alert.get('alert_type', 'Alert')}: {alert.get('message', '')}\n"
        prompt += "\n"

    prompt += f"""Please provide in {language_name}:

1. **Brief Summary** (2-3 sentences): Overall farm status for today
2. **Key Observations** (3-4 bullet points): Important patterns or changes noticed
3. **Recommendations for Tomorrow** (2-3 actionable items): What the farmer should do

Keep the tone friendly and practical. Focus on actionable insights."""

    return prompt

async def generate_ai_summary(prompt: str) -> str:
    try:
        if not GEMINI_API_KEY:
            return "AI summary generation is not available (API key not configured)"
        
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        
        return response.text
    except Exception as e:
        logger.error(f"Error generating AI summary: {e}")
        return f"Failed to generate AI summary: {str(e)}"

async def generate_daily_log(
    supabase,
    user_id: str,
    log_date: date = None
) -> Dict[str, Any]:
    if log_date is None:
        log_date = date.today()
    
    logger.info(f"Generating daily log for user {user_id} on {log_date}")
    
    try:
        user_profile = supabase.table("profiles").select(
            "primary_language, location, timezone"
        ).eq("id", user_id).single().execute()
        
        if not user_profile.data:
            raise ValueError(f"User profile not found for user {user_id}")
        
        profile = user_profile.data
        language = profile.get("primary_language", "en")
        location = profile.get("location", "Unknown")
        
        sensor_stats = await aggregate_sensor_data(supabase, user_id, log_date)
        weather = await fetch_weather_summary(location, log_date)
        activities = await fetch_user_activities(supabase, user_id, log_date)
        tasks = await fetch_completed_tasks(supabase, user_id, log_date)
        alerts = await fetch_alerts(supabase, user_id, log_date)
        
        prompt = generate_prompt(
            language, location, log_date,
            sensor_stats, weather, activities, tasks, alerts
        )
        
        ai_summary = await generate_ai_summary(prompt)
        
        log_data = {
            "user_id": user_id,
            "log_date": log_date.isoformat(),
            "summary": ai_summary,
            "sensor_stats": sensor_stats,
            "weather_summary": weather,
            "activities_performed": activities + tasks,
            "recommendations": [],
            "notification_sent": False
        }
        
        existing_log = supabase.table("daily_farm_logs").select("id").eq(
            "user_id", user_id
        ).eq("log_date", log_date.isoformat()).execute()
        
        if existing_log.data:
            response = supabase.table("daily_farm_logs").update(
                log_data
            ).eq("id", existing_log.data[0]["id"]).execute()
            logger.info(f"Updated existing daily log for user {user_id}")
        else:
            response = supabase.table("daily_farm_logs").insert(log_data).execute()
            logger.info(f"Created new daily log for user {user_id}")
        
        return {
            "success": True,
            "log_id": response.data[0]["id"] if response.data else None,
            "user_id": user_id,
            "log_date": log_date.isoformat(),
            "summary": ai_summary
        }
    except Exception as e:
        logger.error(f"Failed to generate daily log for user {user_id}: {e}")
        raise
