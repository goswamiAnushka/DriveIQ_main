import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
from app.db import  unregister_driver
from flask import jsonify, request
from sqlalchemy.exc import IntegrityError
from app.db import db, Driver, Trip, AggregatedData
from utils.jwt_auth import create_token, jwt_required
from utils.data_processing import process_gps_data
from utils.ml_integration import predict_driver_behavior
from datetime import datetime, timedelta
from utils.jwt_auth import jwt_required, get_jwt_identity
from sqlalchemy.exc import IntegrityError
import pandas as pd
import json
from datetime import date
import logging

api_bp = Blueprint('api', __name__)

UPLOAD_FOLDER = 'uploads/identity_proofs'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Driver Registration Route without OTP
@api_bp.route('/register', methods=['POST'])
def register():
    data = request.form
    identity_proof = request.files.get('identity_proof')

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    accepted_terms = data.get('accepted_terms')

    # Ensure all fields are provided
    if not name or not email or not password or not accepted_terms or not identity_proof:
        logging.error("Missing registration data.")
        return jsonify({"error": "All fields are required"}), 400

    # Check if driver is already registered
    if Driver.query.filter_by(email=email).first():
        logging.error(f"Email {email} is already registered.")
        return jsonify({"error": "Email is already registered"}), 400

    # Validate and save the uploaded identity proof
    if identity_proof and allowed_file(identity_proof.filename):
        filename = secure_filename(identity_proof.filename)
        identity_proof_path = os.path.join(UPLOAD_FOLDER, filename)
        identity_proof.save(identity_proof_path)
    else:
        logging.error("Invalid file format for identity proof.")
        return jsonify({"error": "Invalid file format"}), 400

    # Create a new driver
    new_driver = Driver(name=name, email=email, accepted_terms=True)
    new_driver.set_password(password)
    db.session.add(new_driver)
    db.session.commit()

    token = create_token(new_driver.id)

    logging.info(f"Driver {email} registered successfully.")
    return jsonify({"message": "Registration successful", "token": token}), 201

# Define thresholds (SPEED_THRESHOLD for low speeds and STOP_TIME_THRESHOLD for idle time)
SPEED_THRESHOLD = 5  # m/s (~18 km/h)
STOP_TIME_THRESHOLD = timedelta(minutes=5)  # Idle time threshold before starting a new trip

def generate_unique_trip_id(driver_id):
    """Generate a truly unique trip ID."""
    return f'T-{driver_id}-{uuid.uuid4()}'

@api_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        logging.error("Missing email or password in login.")
        return jsonify({"error": "Email and password are required"}), 400

    driver = Driver.query.filter_by(email=email).first()
    if not driver or not driver.check_password(password):
        logging.error("Invalid login credentials.")
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_token(driver.id)

    logging.info(f"Driver {email} logged in successfully.")
    return jsonify({
        "message": "Login successful",
        "token": token,
        "driver_id": driver.id,
        "driver_name": driver.name  # Include the driver's name
    }), 200




@api_bp.route('/record-telematics', methods=['POST'])
@jwt_required
def record_telematics():
    gps_data = request.json.get('gps_data', [])
    driver_id = request.json.get('driver_id')

    if not gps_data or not driver_id:
        logging.error("Invalid telematics data provided.")
        return jsonify({"error": "Invalid data provided"}), 400

    try:
        # Process the GPS data
        processed_data = process_gps_data(gps_data)  # Function to process and calculate driving features

        # Check if a new trip should be started or continue the last trip
        latest_trip = Trip.query.filter_by(driver_id=driver_id).order_by(Trip.created_at.desc()).first()

        start_new_trip = False
        if latest_trip:
            time_since_last_trip = (datetime.utcnow() - latest_trip.created_at).total_seconds()
            if processed_data['avg_speed'] < SPEED_THRESHOLD and time_since_last_trip > STOP_TIME_THRESHOLD.total_seconds():
                start_new_trip = True
        else:
            start_new_trip = True

        # Generate a new trip ID if starting a new trip
        trip_id = generate_unique_trip_id(driver_id) if start_new_trip else latest_trip.trip_id

        # Prepare data for ML model prediction
        ml_ready_data = {
            'Speed(m/s)': processed_data['avg_speed'],
            'Acceleration(m/s^2)': processed_data['avg_acceleration'],
            'Heading_Change(degrees)': processed_data['avg_heading_change'],
            'Jerk(m/s^3)': processed_data['avg_jerk'],
            'Braking_Intensity': processed_data['avg_braking_intensity'],
            'SASV': processed_data['avg_sasv'],
            'Speed_Violation': processed_data.get('Speed_Violation', 0)  # Default to 0 if not present
        }

        # Call the ML model to get driving behavior score and category
        score, category = predict_driver_behavior(pd.DataFrame([ml_ready_data]))

        # Try inserting the trip data, handle unique constraint error
        try:
            new_trip = Trip(
                driver_id=driver_id,
                trip_id=trip_id,
                gps_data=json.dumps(gps_data),  # Convert to JSON format
                avg_speed=processed_data['avg_speed'],
                avg_acceleration=processed_data['avg_acceleration'],
                avg_jerk=processed_data['avg_jerk'],
                avg_heading_change=processed_data['avg_heading_change'],
                avg_braking_intensity=processed_data['avg_braking_intensity'],
                avg_sasv=processed_data['avg_sasv'],
                total_distance=processed_data['total_distance'],
                score=score,
                category=category,
                created_at=datetime.utcnow()
            )
            db.session.add(new_trip)
            db.session.commit()

        except IntegrityError:
            db.session.rollback()
            trip_id = generate_unique_trip_id(driver_id)  # Generate new trip_id on conflict
            new_trip.trip_id = trip_id
            db.session.add(new_trip)
            db.session.commit()

        return jsonify({
            "message": "Telematics data recorded",
            "trip_id": trip_id,
            "driving_score": score,
            "driving_category": category,
            "features": ml_ready_data,
        }), 200

    except Exception as e:
        logging.error(f"Error processing telematics data: {str(e)}")
        return jsonify({"error": f"Error processing data: {str(e)}"}), 500


@api_bp.route('/unregister', methods=['POST'])
def unregister():
    data = request.get_json()

    # Extract email and password from the request data
    email = data.get('email')
    password = data.get('password')

    # Check if both email and password are provided
    if not email or not password:
        logging.error("Missing email or password for unregistration.")
        return jsonify({"error": "Email and password are required"}), 400

    # Query the driver by email
    driver = Driver.query.filter(Driver.email.ilike(email)).first()  # Case-insensitive search for the email

    # If no driver is found or password is incorrect
    if not driver or not driver.check_password(password):
        logging.error(f"Unregistration failed. Invalid credentials for email: {email}.")
        return jsonify({"error": "Invalid email or password"}), 401

    try:
        # Delete all related data (trips, aggregated data, etc.) associated with the driver
        Trip.query.filter_by(driver_id=driver.id).delete()
        AggregatedData.query.filter_by(driver_id=driver.id).delete()

        # Then delete the driver from the database
        db.session.delete(driver)

        db.session.commit()

        logging.info(f"Driver with email {email} successfully unregistered.")
        return jsonify({"message": "Driver unregistered successfully"}), 200

    except Exception as e:
        logging.error(f"Error while unregistering driver with email {email}: {str(e)}")
        db.session.rollback()
        return jsonify({"error": "An error occurred while processing your request"}), 500



    
@api_bp.route('/process-daily-data', methods=['POST'])
@jwt_required
def process_daily_data():
    driver_id = request.json.get('driver_id')

    if not driver_id:
        logging.error("Driver ID is required for daily data processing.")
        return jsonify({"error": "Driver ID is required"}), 400

    driver = Driver.query.get(driver_id)
    if not driver:
        logging.error(f"Driver {driver_id} not found for daily data processing.")
        return jsonify({"error": "Driver not found"}), 404

    # Calculate the start and end times for the current day
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    # Query trips for the current day only
    trips = Trip.query.filter(Trip.driver_id == driver_id, Trip.created_at >= today_start, Trip.created_at < today_end).all()

    if not trips:
        logging.info(f"No trips found for driver {driver_id} for the current day.")
        return jsonify({"error": "No trips found for today to calculate daily metrics"}), 404

    # Initialize total metrics for aggregation
    total_distance, total_speed_kmph, total_speed_mps = 0, 0, 0
    total_acceleration, total_jerk = 0, 0
    total_heading_change, total_braking_intensity, total_sasv, total_speed_violation = 0, 0, 0, 0
    total_entries = 0

    for trip in trips:
        try:
            gps_data = json.loads(trip.gps_data)
            processed_data = process_gps_data(gps_data)

            # Ensure all required keys are present
            processed_data.setdefault('SASV', 0)
            processed_data.setdefault('Speed_Violation', 0)

            # Aggregate metrics from each trip
            total_distance += processed_data['total_distance']
            total_speed_kmph += processed_data['avg_speed_kmph']
            total_speed_mps += processed_data['avg_speed_mps']
            total_acceleration += processed_data['avg_acceleration']
            total_jerk += processed_data['avg_jerk']
            total_heading_change += processed_data['avg_heading_change']
            total_braking_intensity += processed_data['avg_braking_intensity']
            total_sasv += processed_data['SASV']
            total_speed_violation += processed_data['Speed_Violation']
            total_entries += 1

        except ValueError as e:
            logging.error(f"Error processing trip {trip.trip_id}: {str(e)}")
            continue

    if total_entries > 0:
        # Calculate average metrics over all trips for the day
        avg_speed_kmph = total_speed_kmph / total_entries
        avg_speed_mps = total_speed_mps / total_entries
        avg_acceleration = total_acceleration / total_entries
        avg_jerk = total_jerk / total_entries
        avg_heading_change = total_heading_change / total_entries
        avg_braking_intensity = total_braking_intensity / total_entries
        avg_sasv = total_sasv / total_entries
        avg_speed_violation = total_speed_violation / total_entries

        aggregated_data = {
            'Speed(km/h)': avg_speed_kmph,
            'Speed(m/s)': avg_speed_mps,
            'Acceleration(m/s^2)': avg_acceleration,
            'Heading_Change(degrees)': avg_heading_change,
            'Jerk(m/s^3)': avg_jerk,
            'Braking_Intensity': avg_braking_intensity,
            'SASV': avg_sasv,
            'Speed_Violation': avg_speed_violation
        }

        # Call the ML model to predict driving score and category
        driving_score, driving_category = predict_driver_behavior(pd.DataFrame([aggregated_data]))

        # Save the aggregated data in the database with driving score and category
        aggregated_entry = AggregatedData(
            driver_id=driver_id,
            period="daily",
            date=date.today(),  # Save the current day
            avg_speed=avg_speed_mps,
            avg_acceleration=avg_acceleration,
            avg_jerk=avg_jerk,
            avg_heading_change=avg_heading_change,
            avg_braking_intensity=avg_braking_intensity,
            avg_sasv=avg_sasv,
            speed_violation_count=avg_speed_violation,
            total_observations=total_entries,
            driving_score=driving_score,
            driving_category=driving_category,
            created_at=datetime.utcnow()
        )

        db.session.add(aggregated_entry)
        db.session.commit()

        logging.info(f"Daily data processed for driver {driver_id} on {date.today()}.")
        return jsonify({
            "message": "Daily data processed successfully",
            "driving_score": driving_score,
            "driving_category": driving_category,
            "aggregated_data": aggregated_data,
            "total_trips": len(trips),
            "total_distance_covered_km": total_distance / 1000  # Convert meters to kilometers
        }), 200

    logging.error(f"No valid trips found for driver {driver_id} to calculate daily metrics.")
    return jsonify({"error": "No valid trips found to calculate daily metrics"}), 400
