import numpy as np
import pandas as pd
import logging
from app.db import AggregatedData

# Function to calculate averages for multiple daily aggregated records
def process_bulk_data(driver_id):
    try:
        # Query all daily aggregated data for the given driver
        daily_aggregates = AggregatedData.query.filter_by(driver_id=driver_id).order_by(AggregatedData.date).all()

        if not daily_aggregates:
            logging.error(f"No daily data found for driver_id {driver_id}.")
            return {"error": "No daily data found for this driver."}

        # Initialize dictionary to accumulate aggregated factors
        total_data = {
            'Speed(m/s)_mean': 0,
            'Acceleration(m/s^2)_mean': 0,
            'Jerk(m/s^3)_mean': 0,
            'Heading_Change(degrees)_mean': 0,
            'Braking_Intensity_mean': 0,
            'SASV_total': 0,
            'Speed_Violation_total': 0,
            'Total_Observations': 0
        }
        total_score = 0  # Track total driving score
        total_days = len(daily_aggregates)

        # Accumulate data from each day's record
        for day_data in daily_aggregates:
           total_data['Speed(m/s)_mean'] += day_data.avg_speed if day_data.avg_speed is not None else 0
           total_data['Acceleration(m/s^2)_mean'] += day_data.avg_acceleration if day_data.avg_acceleration is not None else 0
           total_data['Jerk(m/s^3)_mean'] += day_data.avg_jerk if day_data.avg_jerk is not None else 0
           total_data['Heading_Change(degrees)_mean'] += day_data.avg_heading_change if day_data.avg_heading_change is not None else 0
           total_data['Braking_Intensity_mean'] += day_data.avg_braking_intensity if day_data.avg_braking_intensity is not None else 0
           total_data['SASV_total'] += day_data.avg_sasv if day_data.avg_sasv is not None else 0
           total_data['Speed_Violation_total'] += day_data.speed_violation_count if day_data.speed_violation_count is not None else 0
           total_data['Total_Observations'] += day_data.total_observations if day_data.total_observations is not None else 0
           total_score += day_data.driving_score if day_data.driving_score is not None else 0  # Accumulate daily driving score


        # Calculate averages for features
        for key in total_data.keys():
            if key.endswith('_mean'):
                total_data[key] /= total_days

        # Calculate the average driving score
        average_score = total_score / total_days

        # Prepare the data for ML model (returning only the relevant metrics)
        processed_data = pd.DataFrame([{
            'Speed(m/s)_mean': total_data['Speed(m/s)_mean'],
            'Acceleration(m/s^2)_mean': total_data['Acceleration(m/s^2)_mean'],
            'Jerk(m/s^3)_mean': total_data['Jerk(m/s^3)_mean'],
            'Heading_Change(degrees)_mean': total_data['Heading_Change(degrees)_mean'],
            'Braking_Intensity_mean': total_data['Braking_Intensity_mean'],
            'SASV_total': total_data['SASV_total'],
            'Speed_Violation_total': total_data['Speed_Violation_total'],
            'Average_Score': average_score  # Include the average score
        }])

        return processed_data

    except Exception as e:
        logging.error(f"Error in bulk data processing for driver {driver_id}: {str(e)}")
        return {"error": "An error occurred during bulk data processing."}