import os
import logging
import requests
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
BASE_URL = "https://api.openweathermap.org/data/2.5"

def get_current_weather(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    if not OPENWEATHER_API_KEY:
        logger.warning("OpenWeather API key not configured")
        return {
            "temp": 28.0,
            "feels_like": 30.0,
            "humidity": 65,
            "description": "Partly cloudy",
            "wind_speed": 5.5,
            "icon": "02d"
        }
    
    try:
        response = requests.get(
            f"{BASE_URL}/weather",
            params={
                "lat": lat,
                "lon": lon,
                "appid": OPENWEATHER_API_KEY,
                "units": "metric"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "temp": data["main"]["temp"],
                "feels_like": data["main"]["feels_like"],
                "humidity": data["main"]["humidity"],
                "pressure": data["main"]["pressure"],
                "description": data["weather"][0]["description"],
                "wind_speed": data["wind"]["speed"],
                "icon": data["weather"][0]["icon"]
            }
        else:
            logger.error(f"OpenWeather API error: {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"Error fetching weather: {e}")
        return None

def get_forecast(lat: float, lon: float, days: int = 5) -> Optional[Dict[str, Any]]:
    if not OPENWEATHER_API_KEY:
        logger.warning("OpenWeather API key not configured")
        return {
            "forecast": [
                {
                    "date": "2024-01-01",
                    "temp_max": 32.0,
                    "temp_min": 22.0,
                    "humidity": 65,
                    "description": "Partly cloudy",
                    "rain_probability": 20
                }
            ]
        }
    
    try:
        response = requests.get(
            f"{BASE_URL}/forecast",
            params={
                "lat": lat,
                "lon": lon,
                "appid": OPENWEATHER_API_KEY,
                "units": "metric",
                "cnt": days * 8
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            daily_forecasts = {}
            for item in data["list"]:
                date = item["dt_txt"].split(" ")[0]
                
                if date not in daily_forecasts:
                    daily_forecasts[date] = {
                        "temps": [],
                        "humidity": [],
                        "description": item["weather"][0]["description"],
                        "rain_prob": item.get("pop", 0) * 100
                    }
                
                daily_forecasts[date]["temps"].append(item["main"]["temp"])
                daily_forecasts[date]["humidity"].append(item["main"]["humidity"])
            
            forecast = []
            for date, info in daily_forecasts.items():
                forecast.append({
                    "date": date,
                    "temp_max": max(info["temps"]),
                    "temp_min": min(info["temps"]),
                    "humidity": sum(info["humidity"]) / len(info["humidity"]),
                    "description": info["description"],
                    "rain_probability": info["rain_prob"]
                })
            
            return {"forecast": forecast[:days]}
        else:
            logger.error(f"OpenWeather API error: {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"Error fetching forecast: {e}")
        return None

def check_weather_alerts(lat: float, lon: float) -> list:
    current = get_current_weather(lat, lon)
    forecast = get_forecast(lat, lon, days=3)
    
    alerts = []
    
    if not current or not forecast:
        return alerts
    
    if current["temp"] > 40:
        alerts.append({
            "type": "heatwave",
            "severity": "high",
            "message": f"Extreme heat warning: {current['temp']}°C. Ensure adequate irrigation."
        })
    elif current["temp"] < 5:
        alerts.append({
            "type": "frost",
            "severity": "high",
            "message": f"Frost warning: {current['temp']}°C. Protect sensitive crops."
        })
    
    for day in forecast["forecast"]:
        if day["rain_probability"] > 70:
            alerts.append({
                "type": "heavy_rain",
                "severity": "medium",
                "message": f"Heavy rain expected on {day['date']} ({day['rain_probability']}% chance). Plan accordingly."
            })
    
    if current["wind_speed"] > 15:
        alerts.append({
            "type": "strong_wind",
            "severity": "medium",
            "message": f"Strong winds: {current['wind_speed']} m/s. Secure equipment."
        })
    
    return alerts
