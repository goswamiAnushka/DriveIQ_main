import pandas as pd
import numpy as np
from math import radians, sin, cos, sqrt, atan2, degrees
import osmnx as ox

# Haversine formula to calculate distance between two GPS points
def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # Earth's radius in meters
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    d_lat = lat2 - lat1
    d_lon = lon2 - lon1
    a = sin(d_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(d_lon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c  # Distance in meters

# Calculate heading change between two GPS points
def calculate_heading(lat1, lon1, lat2, lon2):
    d_lon = lon2 - lon1
    x = cos(radians(lat2)) * sin(radians(d_lon))
    y = cos(radians(lat1)) * sin(radians(lat2)) - sin(radians(lat1)) * cos(radians(lat2)) * cos(radians(d_lon))
    initial_heading = atan2(x, y)
    return (degrees(initial_heading) + 360) % 360  # Normalize heading to [0, 360]

# Fetch sensitive areas (e.g., schools, hospitals)
def fetch_sensitive_areas(lat, lon, radius=300):
    try:
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            raise ValueError(f"Invalid coordinates: Latitude = {lat}, Longitude = {lon}")

        tags = {'amenity': ['school', 'hospital']}
        sensitive_areas = ox.features_from_point((lat, lon), tags, dist=radius)

        if sensitive_areas.empty:
            return []

        sensitive_coords = sensitive_areas['geometry'].apply(lambda x: (x.centroid.y, x.centroid.x))
        return sensitive_coords.tolist()
    except Exception as e:
        return []

def calculate_sasv(lat, lon, speed, sensitive_locations):
    distances = [haversine(lat, lon, s_lat, s_lon) for s_lat, s_lon in sensitive_locations]
    if any(dist < 300 for dist in distances) and speed > 8.33:  # ~30 km/h speed limit in sensitive areas
        return 1
    return 0

def process_gps_data(gps_data):
    if not gps_data or len(gps_data) < 2:
        raise ValueError("Insufficient GPS data")

    df = pd.DataFrame(gps_data)
    required_columns = ['Latitude', 'Longitude', 'Timestamp']  # Updated column name

    # Check for required columns
    for col in required_columns:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    df['Latitude'] = pd.to_numeric(df['Latitude'], errors='coerce')
    df['Longitude'] = pd.to_numeric(df['Longitude'], errors='coerce')
    df['Timestamp'] = pd.to_numeric(df['Timestamp'], errors='coerce')  # Changed to 'Timestamp'

    # Drop any rows with missing values
    df.dropna(subset=['Latitude', 'Longitude', 'Timestamp'], inplace=True)

    # Ensure sufficient data remains after dropping rows with missing values
    if len(df) < 2:
        raise ValueError("Insufficient valid GPS data after cleaning")

    # Calculate distance and speed
    df['Lat_Shifted'] = df['Latitude'].shift(1)
    df['Lon_Shifted'] = df['Longitude'].shift(1)
    df['Distance(m)'] = df.apply(lambda row: haversine(row['Lat_Shifted'], row['Lon_Shifted'], row['Latitude'], row['Longitude']), axis=1)

    # Calculate time difference, with a minimum of 1 second to avoid division by very small values
    df['Time_Diff(s)'] = df['Timestamp'].diff().fillna(1)
    df['Time_Diff(s)'] = df['Time_Diff(s)'].apply(lambda x: max(x, 1))  # Set minimum time difference

    # Calculate speed (m/s)
    df['Speed(m/s)'] = df['Distance(m)'] / df['Time_Diff(s)']
    
    # Convert speed to km/h
    df['Speed(km/h)'] = df['Speed(m/s)'] * 3.6

    # Print speeds for each GPS data point
    for index, row in df.iterrows():
        print(f"Timestamp: {row['Timestamp']}, Speed: {row['Speed(km/h)']} km/h")



    # Calculate acceleration and jerk
    df['Acceleration(m/s^2)'] = df['Speed(m/s)'].diff() / df['Time_Diff(s)']
    df['Jerk(m/s^3)'] = df['Acceleration(m/s^2)'].diff() / df['Time_Diff(s)']

    # Calculate heading change
    df['Heading'] = df.apply(lambda row: calculate_heading(row['Lat_Shifted'], row['Lon_Shifted'], row['Latitude'], row['Longitude']), axis=1)
    df['Heading_Change(degrees)'] = df['Heading'].diff().fillna(0)

    # Calculate braking intensity (negative acceleration)
    df['Braking_Intensity'] = df['Acceleration(m/s^2)'].apply(lambda x: abs(x) if x < 0 else 0)

    # Sensitive area speed violation
    df['SASV'] = df.apply(lambda row: calculate_sasv(row['Latitude'], row['Longitude'], row['Speed(m/s)'], fetch_sensitive_areas(row['Latitude'], row['Longitude'])), axis=1)

    # Speed violation (above ~50 km/h)
    df['Speed_Violation'] = df['Speed(km/h)'].apply(lambda x: 1 if x > 80 else 0)  # Speed limit: 50 km/h

    # Aggregate metrics
    total_distance = df['Distance(m)'].sum()
    avg_speed_mps = df['Speed(m/s)'].mean()
    avg_speed_kmph = df['Speed(km/h)'].mean()
    avg_acceleration = df['Acceleration(m/s^2)'].mean()
    avg_jerk = df['Jerk(m/s^3)'].mean()
    avg_heading_change = df['Heading_Change(degrees)'].mean()
    avg_braking_intensity = df['Braking_Intensity'].mean()
    avg_sasv = df['SASV'].mean()

    if pd.isna(avg_speed_kmph):
        raise ValueError("Insufficient valid speed data to calculate avg_speed")

    return {
        'avg_speed': avg_speed_mps,  # The key you're expecting in your original code
        'avg_speed_mps': avg_speed_mps,  # Speed in meters per second
        'avg_speed_kmph': avg_speed_kmph,  # Speed in kilometers per hour
        'avg_acceleration': avg_acceleration,
        'avg_jerk': avg_jerk,
        'avg_heading_change': avg_heading_change,
        'avg_braking_intensity': avg_braking_intensity,
        'avg_sasv': avg_sasv,
        'total_distance': total_distance
    }
