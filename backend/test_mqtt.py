import paho.mqtt.client as mqtt
import json
import time
import random

MQTT_BROKER = "broker.hivemq.com"
MQTT_PORT = 1883

device_id = "ESP32_TEST_001"
farm_id = "test_farm_123"
field_id = "test_field_456"

def publish_sensor_data():
    client = mqtt.Client()
    
    try:
        print(f"Connecting to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        
        sensors = [
            {
                "topic": f"krishi/{farm_id}/{field_id}/temperature",
                "data": {
                    "device_id": device_id,
                    "value": round(random.uniform(15, 35), 2),
                    "unit": "°C"
                }
            },
            {
                "topic": f"krishi/{farm_id}/{field_id}/humidity",
                "data": {
                    "device_id": device_id,
                    "value": round(random.uniform(40, 80), 2),
                    "unit": "%"
                }
            },
            {
                "topic": f"krishi/{farm_id}/{field_id}/soil_moisture",
                "data": {
                    "device_id": device_id,
                    "value": round(random.uniform(30, 70), 2),
                    "unit": "%"
                }
            },
            {
                "topic": f"krishi/{farm_id}/{field_id}/ec",
                "data": {
                    "device_id": device_id,
                    "value": round(random.uniform(1.0, 2.5), 2),
                    "unit": "dS/m"
                }
            },
            {
                "topic": f"krishi/{farm_id}/{field_id}/ph",
                "data": {
                    "device_id": device_id,
                    "value": round(random.uniform(6.0, 7.0), 2),
                    "unit": "pH"
                }
            }
        ]
        
        for sensor in sensors:
            payload = json.dumps(sensor["data"])
            result = client.publish(sensor["topic"], payload)
            print(f"Published to {sensor['topic']}: {payload}")
            print(f"Result: {result.rc}")
            time.sleep(0.5)
        
        client.disconnect()
        print("\nAll sensor data published successfully!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("ESP32 Simulator - Publishing test sensor data...")
    print(f"Device ID: {device_id}")
    print(f"Farm ID: {farm_id}")
    print(f"Field ID: {field_id}\n")
    
    while True:
        publish_sensor_data()
        print("\nWaiting 30 seconds before next publish...\n")
        time.sleep(30)
