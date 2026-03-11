from typing import Dict, List, Tuple
import math
import requests
import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")


def calculate_polygon_area(coordinates: List[Dict[str, float]]) -> float:
    if len(coordinates) < 3:
        return 0.0
    
    area = 0.0
    n = len(coordinates)
    
    for i in range(n):
        j = (i + 1) % n
        lat1 = math.radians(coordinates[i]["lat"])
        lon1 = math.radians(coordinates[i]["lng"])
        lat2 = math.radians(coordinates[j]["lat"])
        lon2 = math.radians(coordinates[j]["lng"])
        
        area += lon1 * lat2 - lon2 * lat1
    
    area = abs(area) / 2.0
    
    EARTH_RADIUS_M = 6371000
    area_sqm = area * EARTH_RADIUS_M * EARTH_RADIUS_M
    
    return round(area_sqm, 2)


def validate_geojson(geojson: Dict) -> bool:
    if not isinstance(geojson, dict):
        return False
    
    if geojson.get("type") != "Polygon":
        return False
    
    coordinates = geojson.get("coordinates")
    if not coordinates or not isinstance(coordinates, list):
        return False
    
    if len(coordinates) == 0 or not isinstance(coordinates[0], list):
        return False
    
    first_ring = coordinates[0]
    if len(first_ring) < 4:
        return False
    
    if first_ring[0] != first_ring[-1]:
        return False
    
    for point in first_ring:
        if not isinstance(point, list) or len(point) < 2:
            return False
        lng, lat = point[0], point[1]
        if not (-180 <= lng <= 180) or not (-90 <= lat <= 90):
            return False
    
    return True


def geojson_to_coordinates(geojson: Dict) -> List[Dict[str, float]]:
    if not validate_geojson(geojson):
        return []
    
    first_ring = geojson["coordinates"][0]
    coordinates = []
    
    for point in first_ring[:-1]:
        coordinates.append({"lng": point[0], "lat": point[1]})
    
    return coordinates


def reverse_geocode(lat: float, lng: float) -> Dict:
    if not GOOGLE_MAPS_API_KEY:
        return {
            "formatted_address": f"{lat}, {lng}",
            "city": "Unknown",
            "state": "Unknown",
            "country": "Unknown"
        }
    
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "latlng": f"{lat},{lng}",
        "key": GOOGLE_MAPS_API_KEY
    }
    
    try:
        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") == "OK" and data.get("results"):
            result = data["results"][0]
            address_components = result.get("address_components", [])
            
            city = None
            state = None
            country = None
            
            for component in address_components:
                types = component.get("types", [])
                if "locality" in types:
                    city = component.get("long_name")
                elif "administrative_area_level_1" in types:
                    state = component.get("long_name")
                elif "country" in types:
                    country = component.get("long_name")
            
            return {
                "formatted_address": result.get("formatted_address", f"{lat}, {lng}"),
                "city": city or "Unknown",
                "state": state or "Unknown",
                "country": country or "Unknown"
            }
    except Exception as e:
        print(f"Reverse geocoding error: {e}")
    
    return {
        "formatted_address": f"{lat}, {lng}",
        "city": "Unknown",
        "state": "Unknown",
        "country": "Unknown"
    }


def calculate_field_center(geojson: Dict) -> Tuple[float, float]:
    if not validate_geojson(geojson):
        return (0.0, 0.0)
    
    coordinates = geojson_to_coordinates(geojson)
    if not coordinates:
        return (0.0, 0.0)
    
    lat_sum = sum(coord["lat"] for coord in coordinates)
    lng_sum = sum(coord["lng"] for coord in coordinates)
    
    count = len(coordinates)
    center_lat = lat_sum / count
    center_lng = lng_sum / count
    
    return (center_lat, center_lng)
