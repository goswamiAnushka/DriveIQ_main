from flask import Blueprint, jsonify, request, session, url_for
from app.db import db, Admin, Driver, Trip, AggregatedData
from utils.bulk_data_processing import process_bulk_data
from utils.ml_integration import predict_bulk_driver_behavior
import logging
from utils.ml_integration import predict_driver_behavior
import os
from utils.data_predict_processing import analyze_driving_data
from utils.ml_integration import predict_driving_category
from io import StringIO  
import pandas as pd
from flask import Flask, request, jsonify
import numpy as np



admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Validate input
    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    # Fetch the admin user from the database
    admin = Admin.query.filter_by(username=username).first()

    if admin:
        if admin.check_password(password):
            session['admin_id'] = admin.id
            logging.info(f"Admin {username} logged in successfully.")
            # Redirect URL to the admin dashboard
            return jsonify({"message": "Login successful", "redirect_url": "/admin/dashboard"}), 200
        else:
            logging.warning(f"Failed login attempt for username: {username} - Incorrect password.")
    else:
        logging.warning(f"Failed login attempt - Username: {username} not found.")

    return jsonify({"error": "Invalid username or password"}), 401

# Admin route to get all drivers
@admin_bp.route('/drivers', methods=['GET'])
def get_all_drivers():
    drivers = Driver.query.all()
    driver_list = [{"id": driver.id, "name": driver.name} for driver in drivers]
    logging.info(f"Admin retrieved all drivers: {driver_list}")
    return jsonify(driver_list), 200

# Admin route to get all daily data for a driver until the current date
@admin_bp.route('/driver/all_daily_data/<int:driver_id>', methods=['GET'])
def get_all_daily_driver_data(driver_id):
    try:
        # Query all daily aggregated data for the given driver
        daily_data = AggregatedData.query.filter_by(driver_id=driver_id).order_by(AggregatedData.date).all()

        if not daily_data:
            return jsonify({"error": f"No data found for driver {driver_id}."}), 404

        # Group and format the daily data
        grouped_data = {}
        for data in daily_data:
            day = str(data.date)
            if day not in grouped_data:
                grouped_data[day] = []
            grouped_data[day].append({
                'avg_speed': data.avg_speed,
                'avg_acceleration': data.avg_acceleration,
                'avg_jerk': data.avg_jerk,
                'avg_heading_change': data.avg_heading_change,
                'avg_braking_intensity': data.avg_braking_intensity,
                'avg_sasv': data.avg_sasv,
                'speed_violation_count': data.speed_violation_count,
                'total_observations': data.total_observations,
                'driving_score': data.driving_score,  # Fetch driving score
                'driving_category': data.driving_category  # Fetch driving category
            })

        # Format and return the data grouped by date
        return jsonify({
            "driver_id": driver_id,
            "daily_data": grouped_data
        }), 200

    except Exception as e:
        logging.error(f"Error fetching daily data for driver {driver_id}: {str(e)}")
        return jsonify({"error": "An error occurred while fetching daily data"}), 500


@admin_bp.route('/driver/bulk_consolidated_data/<int:driver_id>', methods=['GET'])
def get_bulk_consolidated_driver_data(driver_id):
    try:
        # Query all daily aggregated data for the given driver
        daily_aggregates = AggregatedData.query.filter_by(driver_id=driver_id).order_by(AggregatedData.date).all()

        if not daily_aggregates:
            return jsonify({"error": f"No daily data found for driver {driver_id}."}), 404

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
        total_score = 0
        total_days = len(daily_aggregates)

        # Accumulate data from each day's record
        for day_data in daily_aggregates:
            total_data['Speed(m/s)_mean'] += day_data.avg_speed
            total_data['Acceleration(m/s^2)_mean'] += day_data.avg_acceleration
            total_data['Jerk(m/s^3)_mean'] += day_data.avg_jerk
            total_data['Heading_Change(degrees)_mean'] += day_data.avg_heading_change
            total_data['Braking_Intensity_mean'] += day_data.avg_braking_intensity
            total_data['SASV_total'] += day_data.avg_sasv
            total_data['Speed_Violation_total'] += day_data.speed_violation_count
            total_data['Total_Observations'] += day_data.total_observations
            total_score += day_data.driving_score  # Accumulate daily driving score

        # Calculate averages for features
        for key in total_data.keys():
            if key.endswith('_mean'):
                total_data[key] /= total_days

        # Calculate the average score
        avg_driving_score = total_score / total_days

        # Send consolidated data to the bulk ML model (if needed)
        driving_category, driving_score = predict_bulk_driver_behavior([total_data])

        # You can choose to either use the score predicted by the ML model or the averaged score from daily data.
        # For now, we return the averaged daily score as well.
        return jsonify({
            "aggregated_data": total_data,
            "driving_category": driving_category,
            "average_driving_score": avg_driving_score,  # Average of daily driving scores
            "model_predicted_score": driving_score  # Predicted score from the model
        }), 200

    except Exception as e:
        logging.error(f"Error during bulk prediction for driver {driver_id}: {str(e)}")
        return jsonify({"error": "An error occurred while processing bulk data"}), 500

@admin_bp.route('/process_gps_data', methods=['POST'])
def process_gps_data_and_predict():
    try:
        # Step 1: Get the input GPS data from the request
        gps_data = request.get_json()

        if not gps_data:
            return jsonify({"error": "No data provided"}), 400

        # Step 2: Convert the GPS data to a DataFrame and process it
        df = pd.DataFrame(gps_data)

        # Ensure required fields are present
        required_columns = ['Latitude', 'Longitude', 'Speed', 'Acceleration', 'Timestamp', 'HeadingChange']
        if not all(column in df.columns for column in required_columns):
            return jsonify({"error": "Missing required fields in input data"}), 400

        # Step 3: Process the GPS data to extract metrics
        analyzed_data, summary_data = analyze_driving_data(df)

        if isinstance(analyzed_data, pd.DataFrame) and isinstance(summary_data, pd.DataFrame):
            # Step 4: Use the processed summary data to make predictions
            predicted_data = predict_driving_category(summary_data)

            # Step 5: Prepare the response data, including driving score, category, and averaged factors
            response_data = {
                "message": "Processing and prediction successful!",
                "driving_score": float(predicted_data['Driving_Score'].values[0]),
                "driving_category": str(predicted_data['Driving_Category'].values[0]),
                "average_speed": float(summary_data['Speed'].values[0]),
                "average_acceleration": float(summary_data['Acceleration'].values[0]),
                "average_jerk": float(summary_data['Jerk'].values[0]),
                "total_harsh_acceleration": float(summary_data['Harsh_Acceleration'].values[0]),
                "total_harsh_braking": float(summary_data['Harsh_Braking'].values[0]),
                "total_sensitive_area_violations": int(summary_data['Sensitive_Area_Violation'].values[0]),
                "average_heading_change": float(summary_data['High_Heading_Change'].values[0])
            }

            return jsonify(response_data), 200

        else:
            return jsonify({"error": "Unexpected format from analyze_driving_data."}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500
