import paho.mqtt.client as mqtt
import json
import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
MQTT_BROKER = os.getenv("MQTT_BROKER", "broker.hivemq.com")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USERNAME = os.getenv("MQTT_USERNAME", "")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "")
MQTT_USE_TLS = os.getenv("MQTT_USE_TLS", "false").lower() == "true"

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    logger.warning("Supabase credentials not configured. MQTT client will not function properly.")

SENSOR_THRESHOLDS = {
    "soil_moisture": {"min": 20, "max": 80, "unit": "%"},
    "temperature": {"min": 10, "max": 45, "unit": "°C"},
    "humidity": {"min": 30, "max": 90, "unit": "%"},
    "ec": {"min": 0.5, "max": 3.0, "unit": "dS/m"},
    "ph": {"min": 5.5, "max": 7.5, "unit": "pH"},
    "water_quality": {"min": 0, "max": 100, "unit": "score"}
}

def check_alert_thresholds(user_id: str, field_id: str, sensor_type: str, value: float):
    if not supabase:
        return
        
    if sensor_type not in SENSOR_THRESHOLDS:
        return

    thresholds = SENSOR_THRESHOLDS[sensor_type]
    severity = None
    message = None

    if value < thresholds["min"]:
        severity = "high" if sensor_type == "soil_moisture" else "medium"
        message = f"{sensor_type.replace('_', ' ').title()} is too low: {value}{thresholds['unit']} (Min: {thresholds['min']}{thresholds['unit']})"
    elif value > thresholds["max"]:
        severity = "high" if sensor_type == "temperature" else "medium"
        message = f"{sensor_type.replace('_', ' ').title()} is too high: {value}{thresholds['unit']} (Max: {thresholds['max']}{thresholds['unit']})"

    if severity and message:
        try:
            supabase.table("alerts").insert({
                "user_id": user_id,
                "alert_type": "sensor_threshold",
                "severity": severity,
                "title": f"{sensor_type.replace('_', ' ').title()} Alert",
                "message": message,
                "metadata": {
                    "field_id": field_id,
                    "sensor_type": sensor_type,
                    "value": value,
                    "threshold": thresholds
                }
            }).execute()
            logger.info(f"Alert created for {sensor_type} threshold breach: {value}")
        except Exception as e:
            logger.error(f"Error creating alert: {e}")

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logger.info("Connected to MQTT broker successfully")
        client.subscribe("krishi/+/+/#")
        logger.info("Subscribed to topic: krishi/+/+/#")
    else:
        logger.error(f"Failed to connect to MQTT broker. Return code: {rc}")

def on_disconnect(client, userdata, rc):
    if rc != 0:
        logger.warning(f"Unexpected MQTT disconnection. Return code: {rc}")
        logger.info("Attempting to reconnect...")

def on_message(client, userdata, msg):
    try:
        if not supabase:
            logger.error("Supabase client not initialized. Cannot process message.")
            return
            
        topic = msg.topic
        payload = json.loads(msg.payload.decode())
        
        logger.info(f"Received message on topic {topic}: {payload}")
        
        topic_parts = topic.split('/')
        if len(topic_parts) < 4:
            logger.error(f"Invalid topic format: {topic}")
            return
        
        field_id = topic_parts[2]
        sensor_type = topic_parts[3]
        
        if sensor_type not in ['temperature', 'humidity', 'soil_moisture', 'ec', 'ph', 'water_quality']:
            logger.error(f"Unknown sensor type: {sensor_type}")
            return
        
        device_id = payload.get('device_id')
        value = payload.get('value')
        unit = payload.get('unit', get_default_unit(sensor_type))
        
        if device_id is None or value is None:
            logger.error(f"Missing required fields in payload: {payload}")
            return
        
        try:
            device_response = supabase.table("devices").select("*").eq("device_id", device_id).execute()
            
            if not device_response.data or len(device_response.data) == 0:
                logger.error(f"Device not found: {device_id}")
                return
            
            device = device_response.data[0]
            user_id = device['user_id']
            
            supabase.table("sensor_readings").insert({
                "user_id": user_id,
                "field_id": field_id,
                "device_id": device['id'],
                "sensor_type": sensor_type,
                "value": float(value),
                "unit": unit
            }).execute()
            
            supabase.table("devices").update({
                "status": "online",
                "last_seen": datetime.utcnow().isoformat()
            }).eq("id", device['id']).execute()
            
            logger.info(f"Sensor reading saved: {sensor_type}={value}{unit} for device {device_id}")
            
            check_alert_thresholds(user_id, field_id, sensor_type, float(value))
            
        except Exception as e:
            logger.error(f"Database error: {e}")
            
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON payload: {e}")
    except Exception as e:
        logger.error(f"Error processing message: {e}")

def get_default_unit(sensor_type: str) -> str:
    units = {
        "temperature": "°C",
        "humidity": "%",
        "soil_moisture": "%",
        "ec": "dS/m",
        "ph": "pH",
        "water_quality": "score"
    }
    return units.get(sensor_type, "")

mqtt_client = mqtt.Client()

if MQTT_USERNAME and MQTT_PASSWORD:
    mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

if MQTT_USE_TLS:
    mqtt_client.tls_set()

mqtt_client.on_connect = on_connect
mqtt_client.on_disconnect = on_disconnect
mqtt_client.on_message = on_message

def start_mqtt_client():
    try:
        logger.info(f"Connecting to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
        logger.info("MQTT client started successfully")
    except Exception as e:
        logger.error(f"Failed to start MQTT client: {e}")

def stop_mqtt_client():
    try:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        logger.info("MQTT client stopped")
    except Exception as e:
        logger.error(f"Error stopping MQTT client: {e}")
