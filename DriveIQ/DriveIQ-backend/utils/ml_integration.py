import os
import numpy as np
import pickle
import pandas as pd
import logging
import joblib
from utils.data_predict_processing import analyze_driving_data

# Configure logging
logging.basicConfig(level=logging.INFO)

# Paths to the trip-level, bulk-level models, and scalers
current_dir = os.path.dirname(os.path.abspath(__file__))

# Trip-level model and scaler
trip_model_path = os.path.join(current_dir, '../../ml_model/models/driving_data_model.pkl')
trip_scaler_path = os.path.join(current_dir, '../../ml_model/models/scaler.pkl')

# Bulk-level model and scaler
bulk_model_path = os.path.join(current_dir, '../../ml_model/models/bulk_driving_model.pkl')
bulk_scaler_path = os.path.join(current_dir, '../../ml_model/models/bulk_scaler.pkl')

# Model with parameters
model_with_params_path = os.path.join(current_dir, '../../ml_model/models/driving_model_with_params.pkl')
model = joblib.load(model_with_params_path)  # Load the model with parameters


# Load the trip-level model and scaler
with open(trip_model_path, 'rb') as trip_model_file:
    trip_model = pickle.load(trip_model_file)

with open(trip_scaler_path, 'rb') as trip_scaler_file:
    trip_scaler = pickle.load(trip_scaler_file)

# Load the bulk-level model and scaler
with open(bulk_model_path, 'rb') as bulk_model_file:
    bulk_model = pickle.load(bulk_model_file)

with open(bulk_scaler_path, 'rb') as bulk_scaler_file:
    bulk_scaler = pickle.load(bulk_scaler_file)

# Categorize driving score based on thresholds
def categorize_driving_score(score):
    """Categorize driving score into Safe, Moderate, or Risky."""
    if score >= 75:
        return 'Safe'
    elif score >= 55:
        return 'Moderate'
    else:
        return 'Risky'

# Function to calculate driving score from category probabilities
def calculate_driving_score_from_probabilities(category_probabilities):
    """Calculate the driving score using weighted category probabilities."""
    weighted_scores = np.dot(category_probabilities, [20, 50, 100])
    return np.mean(weighted_scores)

# Function to predict driving behavior for a single trip
def predict_driver_behavior(processed_data):
    """Predict driving behavior based on processed trip data."""
    if not isinstance(processed_data, pd.DataFrame):
        raise ValueError("Input data must be a pandas DataFrame")

    # Features required for the ML model
    features = ['Speed(m/s)', 'Acceleration(m/s^2)', 'Heading_Change(degrees)', 
                'Jerk(m/s^3)', 'Braking_Intensity', 'SASV', 'Speed_Violation']

    # Ensure all required columns are present
    missing_features = [f for f in features if f not in processed_data.columns]
    if missing_features:
        raise ValueError(f"Missing required features for prediction: {', '.join(missing_features)}")

    # Scale the data and predict category probabilities
    processed_data_scaled = trip_scaler.transform(processed_data[features])
    category_probabilities = trip_model.predict_proba(processed_data_scaled)

    # Calculate driving score and category
    driving_score = calculate_driving_score_from_probabilities(category_probabilities)
    driving_category = categorize_driving_score(driving_score)

    return int(driving_score), driving_category

def predict_bulk_driver_behavior(bulk_data):
    """Predict driving behavior for bulk data."""
    # Ensure feature consistency in the bulk model
    feature_columns = [
        'Speed(m/s)_mean', 'Acceleration(m/s^2)_mean', 'Heading_Change(degrees)_mean',
        'Jerk(m/s^3)_mean', 'Braking_Intensity_mean', 'SASV_total', 'Speed_Violation_total'
    ]

    # Convert bulk_data to DataFrame if it is not already one
    if not isinstance(bulk_data, pd.DataFrame):
        try:
            bulk_data_df = pd.DataFrame(bulk_data)
        except Exception as e:
            logging.error(f"Error converting bulk_data to DataFrame: {str(e)}")
            raise ValueError("Input bulk_data could not be converted to a DataFrame")
    else:
        bulk_data_df = bulk_data

    # Print the columns for debugging
    print("Columns in bulk_data_df:", bulk_data_df.columns.tolist())

    # Drop unnecessary columns that are not needed for prediction
    bulk_data_df = bulk_data_df[feature_columns]

    # Ensure all required columns are present
    missing_features = [f for f in feature_columns if f not in bulk_data_df.columns]
    if missing_features:
        raise ValueError(f"Missing required features for prediction: {', '.join(missing_features)}")

    # Check if the bulk data has the correct number of features
    if bulk_data_df.shape[1] != len(feature_columns):
        raise ValueError(f"Input bulk data has {bulk_data_df.shape[1]} features, expected {len(feature_columns)}")

    # Scale the data for prediction
    bulk_data_scaled = bulk_scaler.transform(bulk_data_df)

    # Print the shape of scaled bulk data for debugging
    print("Shape of scaled bulk_data:", bulk_data_scaled.shape)

    # Predict category probabilities using the bulk model
    category_probabilities = bulk_model.predict_proba(bulk_data_scaled)

    # Print the shape of category probabilities for debugging
    print("Shape of category probabilities:", category_probabilities.shape)

    # Check if the number of classes matches expectations
    if category_probabilities.shape[1] != 3:
        raise ValueError(f"Unexpected number of output classes: {category_probabilities.shape[1]} (expected 3)")

    # Calculate the average score and determine the most frequent category
    average_score = calculate_driving_score_from_probabilities(category_probabilities)
    driving_category = categorize_driving_score(average_score)

    return driving_category, int(average_score)

def predict_driving_category(summary_data):
    """
    Predicts the driving category based on the provided summary data using probabilities,
    and prints additional driving factors.
    """

    # Prepare the necessary features for model prediction
    features = ['Speed', 'Acceleration', 'Jerk', 'High_Jerk', 'Speed_Violation',
                'Harsh_Acceleration', 'Harsh_Braking', 'Sensitive_Area_Violation',
                'High_Heading_Change']

    # Extract feature values from the summary data
    X = summary_data[features]

    # Make probability-based predictions using the ML model
    category_probabilities = model.predict_proba(X)

    # Calculate driving score based on probabilities
    driving_score = calculate_driving_score_from_probabilities(category_probabilities)

    # Determine driving category based on the score
    driving_category = categorize_driving_score(driving_score)

    # Add predictions to the summary data
    summary_data['Driving_Score'] = driving_score
    summary_data['Driving_Category'] = driving_category

    # Print the other averaged factors for inspection
    print("Average Speed:", summary_data['Speed'].mean())
    print("Average Acceleration:", summary_data['Acceleration'].mean())
    print("Average Jerk:", summary_data['Jerk'].mean())
    print("Total Speed Violations:", summary_data['Speed_Violation'].sum())
    print("Total Harsh Acceleration:", summary_data['Harsh_Acceleration'].sum())
    print("Total Harsh Braking:", summary_data['Harsh_Braking'].sum())
    print("Total Sensitive Area Violations:", summary_data['Sensitive_Area_Violation'].sum())
    print("Average Heading Change:", summary_data['High_Heading_Change'].mean())

    # Return the driving score and category along with the averaged factors
    return summary_data[['Driving_Score', 'Driving_Category', 'Speed', 'Acceleration', 
                         'Jerk', 'High_Jerk', 'Speed_Violation', 'Harsh_Acceleration', 
                         'Harsh_Braking', 'Sensitive_Area_Violation', 'High_Heading_Change']]



# Example usage (you can replace this with actual data input)
if __name__ == "__main__":
    # Create a sample DataFrame for testing
    sample_trip_data = pd.DataFrame({
        'Speed(m/s)': [15.0, 20.0],
        'Acceleration(m/s^2)': [1.5, 1.2],
        'Heading_Change(degrees)': [5.0, 10.0],
        'Jerk(m/s^3)': [0.1, 0.05],
        'Braking_Intensity': [0.3, 0.2],
        'SASV': [0.1, 0.2],
        'Speed_Violation': [0.0, 0.0]
    })

    sample_bulk_data = pd.DataFrame({
        'Speed(m/s)_mean': [15.0, 20.0],
        'Acceleration(m/s^2)_mean': [1.5, 1.2],
        'Heading_Change(degrees)_mean': [5.0, 10.0],
        'Jerk(m/s^3)_mean': [0.1, 0.05],
        'Braking_Intensity_mean': [0.3, 0.2],
        'SASV_total': [0.1, 0.2],
        'Speed_Violation_total': [0.0, 0.0]
    })

    try:
        trip_score, trip_category = predict_driver_behavior(sample_trip_data)
        print(f"Trip Score: {trip_score}, Trip Category: {trip_category}")

        bulk_category, bulk_score = predict_bulk_driver_behavior(sample_bulk_data)
        print(f"Bulk Score: {bulk_score}, Bulk Category: {bulk_category}")
    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")