import sys
sys.path.insert(0, '.')

try:
    import mqtt_client
    print("[OK] mqtt_client imported successfully")
except Exception as e:
    print(f"[FAIL] Failed to import mqtt_client: {e}")
    sys.exit(1)

try:
    import api
    print("[OK] api module imported successfully")
except Exception as e:
    print(f"[FAIL] Failed to import api: {e}")
    sys.exit(1)

print("\nAll imports completed!")
