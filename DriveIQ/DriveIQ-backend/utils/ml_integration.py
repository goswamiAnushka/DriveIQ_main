import os
import numpy as np
import pandas as pd
import pickle
import logging
import joblib
from sklearn.preprocessing import StandardScaler

# Configure logging
logging.basicConfig(level=logging.INFO)

# Paths to the models and scalers
current_dir = os.path.dirname(os.path.abspath(__file__))

# File paths
trip_model_path = os.path.join(current_dir, '../../ml_model/models/driving_data_model.pkl')
trip_scaler_path = os.path.join(current_dir, '../../ml_model/models/scaler.pkl')
bulk_model_path = os.path.join(current_dir, '../../ml_model/models/bulk_driving_model.pkl')
bulk_scaler_path = os.path.join(current_dir, '../../ml_model/models/bulk_scaler.pkl')
model_with_params_path = os.path.join(current_dir, '../../ml_model/models/driving_model_with_params.pkl')

# Load the models and scalers
def load_model_and_scaler(model_path, scaler_path):
    """Load a model and its scaler from the given file paths."""
    with open(model_path, 'rb') as model_file:
        model = pickle.load(model_file)
    with open(scaler_path, 'rb') as scaler_file:
        scaler = pickle.load(scaler_file)
    return model, scaler

# Load trip-level models
trip_model, trip_scaler = load_model_and_scaler(trip_model_path, trip_scaler_path)

# Load bulk-level models
bulk_model, bulk_scaler = load_model_and_scaler(bulk_model_path, bulk_scaler_path)

# Load the model with parameters
model_with_params = joblib.load(model_with_params_path)

# Utility functions
def categorize_driving_score(score):
    """Categorize driving score into Safe, Moderate, or Risky."""
    if score >= 75:
        return 'Safe'
    elif score >= 60:
        return 'Moderate'
    else:
        return 'Risky'

def calculate_driving_score_from_probabilities(category_probabilities):
    """Calculate the driving score using weighted category probabilities."""
    weights = [20, 50, 100]
    weighted_scores = np.dot(category_probabilities, weights)
    return np.mean(weighted_scores)

# Prediction functions
def predict_driver_behavior(processed_data):
    """Predict driving behavior for a single trip."""
    if not isinstance(processed_data, pd.DataFrame):
        raise ValueError("Input data must be a pandas DataFrame")

    features = ['Speed(m/s)', 'Acceleration(m/s^2)', 'Heading_Change(degrees)', 
                'Jerk(m/s^3)', 'Braking_Intensity', 'SASV', 'Speed_Violation']

    missing_features = [f for f in features if f not in processed_data.columns]
    if missing_features:
        raise ValueError(f"Missing required features for prediction: {', '.join(missing_features)}")

    processed_data_scaled = trip_scaler.transform(processed_data[features])
    category_probabilities = trip_model.predict_proba(processed_data_scaled)

    driving_score = calculate_driving_score_from_probabilities(category_probabilities)
    driving_category = categorize_driving_score(driving_score)

    return int(driving_score), driving_category

def predict_bulk_driver_behavior(bulk_data):
    """Predict driving behavior for bulk data."""
    feature_columns = [
        'Speed(m/s)_mean', 'Acceleration(m/s^2)_mean', 'Heading_Change(degrees)_mean',
        'Jerk(m/s^3)_mean', 'Braking_Intensity_mean', 'SASV_total', 'Speed_Violation_total'
    ]

    if not isinstance(bulk_data, pd.DataFrame):
        try:
            bulk_data = pd.DataFrame(bulk_data)
        except Exception as e:
            logging.error(f"Error converting bulk_data to DataFrame: {str(e)}")
            raise ValueError("Input bulk_data could not be converted to a DataFrame")

    missing_features = [f for f in feature_columns if f not in bulk_data.columns]
    if missing_features:
        raise ValueError(f"Missing required features for prediction: {', '.join(missing_features)}")

    bulk_data_scaled = bulk_scaler.transform(bulk_data[feature_columns])
    category_probabilities = bulk_model.predict_proba(bulk_data_scaled)

    average_score = calculate_driving_score_from_probabilities(category_probabilities)
    driving_category = categorize_driving_score(average_score)

    return driving_category, int(average_score)

def predict_driving_category(summary_data):
    """Predict driving category based on summary data."""
    features = ['Speed', 'Acceleration', 'Jerk', 'High_Jerk', 'Speed_Violation',
                'Harsh_Acceleration', 'Harsh_Braking', 'Sensitive_Area_Violation',
                'High_Heading_Change']

    if not isinstance(summary_data, pd.DataFrame):
        raise ValueError("Input summary_data must be a pandas DataFrame")

    X = summary_data[features]
    category_probabilities = model_with_params.predict_proba(X)

    driving_score = calculate_driving_score_from_probabilities(category_probabilities)
    driving_category = categorize_driving_score(driving_score)

    summary_data['Driving_Score'] = driving_score
    summary_data['Driving_Category'] = driving_category

    return summary_data[['Driving_Score', 'Driving_Category'] + features]

# Example usage
if __name__ == "__main__":
    # Example trip-level data
    sample_trip_data = pd.DataFrame({
        'Speed(m/s)': [15.0, 20.0],
        'Acceleration(m/s^2)': [1.5, 1.2],
        'Heading_Change(degrees)': [5.0, 10.0],
        'Jerk(m/s^3)': [0.1, 0.05],
        'Braking_Intensity': [0.3, 0.2],
        'SASV': [0.1, 0.2],
        'Speed_Violation': [0.0, 0.0]
    })

    # Example bulk-level data
    sample_bulk_data = pd.DataFrame({
        'Speed(m/s)_mean': [15.0, 20.0],
        'Acceleration(m/s^2)_mean': [1.5, 1.2],
        'Heading_Change(degrees)_mean': [5.0, 10.0],
        'Jerk(m/s^3)_mean': [0.1, 0.05],
        'Braking_Intensity_mean': [0.3, 0.2],
        'SASV_total': [0.1, 0.2],
        'Speed_Violation_total': [0.0, 0.0]
    })

    # Predictions
    try:
        trip_score, trip_category = predict_driver_behavior(sample_trip_data)
        print(f"Trip Score: {trip_score}, Trip Category: {trip_category}")

        bulk_category, bulk_score = predict_bulk_driver_behavior(sample_bulk_data)
        print(f"Bulk Score: {bulk_score}, Bulk Category: {bulk_category}")
    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
