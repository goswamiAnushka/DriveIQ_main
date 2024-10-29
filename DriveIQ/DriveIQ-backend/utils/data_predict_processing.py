import osmnx as ox
import pandas as pd
import numpy as np
from shapely.geometry import Point
import geopandas as gpd

def get_sensitive_areas(lat, lon):
    """Finds sensitive areas around the given latitude and longitude."""
    buffer_radius = 300  # Define a buffer radius in meters
    tags = {'amenity': True}  # Customize as needed
    
    try:
        # Use the new OSMnx function to get features within buffer_radius meters of (lat, lon)
        sensitive_areas = ox.features_from_point((lat, lon), dist=buffer_radius, tags=tags)
        
        # Convert sensitive_areas to a GeoDataFrame if it contains features
        if not sensitive_areas.empty:
            return gpd.GeoDataFrame(sensitive_areas, geometry='geometry', crs="EPSG:4326")
        else:
            return gpd.GeoDataFrame()  # Return empty GeoDataFrame if no areas are found
    except Exception as e:
        print(f"Error fetching sensitive areas for ({lat}, {lon}): {e}")
        return gpd.GeoDataFrame()  # Return empty in case of an error

def analyze_driving_data(df):
    """Analyzes driving data based on absolute metrics."""
    
    # Ensure 'Timestamp' is converted to datetime
    df['Timestamp'] = pd.to_datetime(df['Timestamp'], errors='coerce')
    df = df.dropna(subset=['Timestamp'])  # Drop rows where Timestamp could not be converted

    # Convert Timestamp to UNIX time in seconds
    df['Timestamp'] = df['Timestamp'].astype(np.int64) // 10**9  

    # Define thresholds
    speed_limit = 30  # Speed limit in km/h
    harsh_acceleration_threshold = 3.0  # Harsh acceleration in m/s^2
    harsh_braking_threshold = -3.0  # Harsh braking in m/s^2
    jerk_threshold = 5.0  # Jerk threshold in m/s^3
    heading_change_threshold = 30.0  # Heading change threshold in degrees

    # Initialize columns
    df['Jerk'] = 0.0  # Initialize Jerk column

    # Calculate the time difference in seconds
    time_diff = df['Timestamp'].diff().fillna(0)  # Replace NaN with 0 for the first row

    # Calculate Jerk (change in acceleration over change in time)
    df['Jerk'] = df['Acceleration'].diff() / time_diff  # m/s^3
    df['Jerk'] = df['Jerk'].fillna(0)  # Fill NaN values with 0

    # Calculate penalties based on thresholds
    df['Speed_Violation'] = np.where(df['Speed'] > speed_limit, df['Speed'] - speed_limit, 0)
    df['Speed_Violation_Count'] = np.where(df['Speed'] > speed_limit, 1, 0)  # Counts each instance of speed violation
    df['Harsh_Acceleration'] = np.where(df['Acceleration'] > harsh_acceleration_threshold, 
                                         (df['Acceleration'] - harsh_acceleration_threshold), 0)
    df['Harsh_Braking'] = np.where(df['Acceleration'] < harsh_braking_threshold, 
                                    (harsh_braking_threshold - df['Acceleration']), 0)
    df['High_Jerk'] = np.where(abs(df['Jerk']) > jerk_threshold, abs(df['Jerk'] - jerk_threshold), 0)
    df['High_Heading_Change'] = np.where(abs(df['HeadingChange']) > heading_change_threshold, 
                                          abs(df['HeadingChange'] - heading_change_threshold), 0)

    # Prepare for distance calculation
    df['geometry'] = df.apply(lambda row: Point(row['Longitude'], row['Latitude']), axis=1)
    gdf = gpd.GeoDataFrame(df, geometry='geometry', crs="EPSG:4326")  # Set to WGS 84

    # Project to UTM for accurate distance calculations (assuming UTM Zone 10N for San Francisco)
    gdf = gdf.to_crs(epsg=32610)  # Adjust for your location (Tezpur: epsg=32646)

    # Calculate the distance to sensitive locations and check for violations
    df['Sensitive_Area_Violation'] = 0

    for index, row in df.iterrows():
        lat, lon = row['Latitude'], row['Longitude']
        sensitive_areas = get_sensitive_areas(lat, lon)

        if not sensitive_areas.empty:  # Efficient check for empty GeoDataFrame
            sensitive_areas = sensitive_areas.to_crs(epsg=32610)  # Adjust projection for accurate distance
            driver_location = gdf.at[index, 'geometry']

            # Calculate distances from driver location to sensitive areas
            distances = sensitive_areas.distance(driver_location)
            if (distances <= 300).any() and row['Speed'] > (speed_limit * 1000 / 3600):  # Speed limit in m/s
                df.at[index, 'Sensitive_Area_Violation'] = 1

    # Summary metrics calculation
    overall_metrics = {
        'Average_Speed': df['Speed'].mean(),
        'Average_Acceleration': df['Acceleration'].mean(),
        'Total_Speed_Violations': df['Speed_Violation_Count'].sum(),  # Total count of speed violations
        'Cumulative_Speed_Violation': df['Speed_Violation'].sum(),  # Cumulative amount over the limit
        'Total_Harsh_Acceleration': df['Harsh_Acceleration'].sum(),
        'Total_Harsh_Braking': df['Harsh_Braking'].sum(),
        'Total_Sensitive_Area_Violations': df['Sensitive_Area_Violation'].sum(),
        'Average_Jerk': df['Jerk'].mean(),
        'Average_Heading_Change': df['HeadingChange'].mean()
    }

    # Create a summary DataFrame with modified column names
    summary_df = pd.DataFrame([{
        'Speed': overall_metrics['Average_Speed'],
        'Acceleration': overall_metrics['Average_Acceleration'],
        'Jerk': overall_metrics['Average_Jerk'],
        'High_Jerk': overall_metrics['Average_Jerk'],  # Ensure this matches your model's requirement
        'Speed_Violation': overall_metrics['Cumulative_Speed_Violation'],  # Use cumulative for the 'Speed_Violation' name
        'Harsh_Acceleration': overall_metrics['Total_Harsh_Acceleration'],
        'Harsh_Braking': overall_metrics['Total_Harsh_Braking'],
        'Sensitive_Area_Violation': overall_metrics['Total_Sensitive_Area_Violations'],
        'High_Heading_Change': overall_metrics['Average_Heading_Change']
    }])

    return df, summary_df
