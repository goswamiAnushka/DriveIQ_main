import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './DailyScorePopup.scss';  // Import the SCSS styles

const DailyScorePopup = ({ closePopup }) => {
  const [dailyData, setDailyData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to call the /process-daily-data API
  const fetchDailyData = async () => {
    const driver_id = localStorage.getItem('driver_id');
    console.log('Driver ID:', driver_id);  // Debugging to check driver ID
    if (!driver_id) {
      setError('Driver ID not found. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/process-daily-data', { driver_id });
      console.log('API Response:', response.data);  // Debugging to check the API response
      setDailyData(response.data);  // Store the API response in state
      setError(null);
    } catch (err) {
      console.error('Error fetching daily data:', err);
      setError('Failed to fetch daily data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when the component mounts
  useEffect(() => {
    fetchDailyData();
  }, []);

  // Safely extract data from dailyData
  const aggregatedData = dailyData?.aggregated_data || {};

  return (
    <div className="daily-score-popup">
      <button className="close-button" onClick={closePopup}>Close</button>

      {/* Display loading state */}
      {loading && <p>Loading daily data...</p>}

      {/* Display error message */}
      {error && <p className="error">{error}</p>}

      {/* Display daily data in a structured format */}
      {dailyData && aggregatedData ? (
        <div>
          <h3>Daily Driving Summary</h3>
          <div className="summary-item">
            <strong>Driving Score:</strong> {dailyData.driving_score ?? 'N/A'} / 100
          </div>
          <div className="summary-item">
            <strong>Driving Category:</strong> {dailyData.driving_category ?? 'N/A'}
          </div>
          <div className="summary-item">
            <strong>Total Distance Covered:</strong> {dailyData.total_distance_covered_km ?? 'N/A'} km
          </div>
          <div className="summary-item">
            <strong>Total Trips:</strong> {dailyData.total_trips ?? 'N/A'}
          </div>
          <h4>Aggregated Data:</h4>
          <div className="summary-item">
            <strong>Acceleration:</strong> {aggregatedData['Acceleration(m/s^2)'] ?? 'N/A'} m/s²
          </div>
          <div className="summary-item">
            <strong>Braking Intensity:</strong> {aggregatedData['Braking_Intensity'] ?? 'N/A'}
          </div>
          <div className="summary-item">
            <strong>Heading Change:</strong> {aggregatedData['Heading_Change(degrees)'] ?? 'N/A'} degrees
          </div>
          <div className="summary-item">
            <strong>Jerk:</strong> {isNaN(aggregatedData['Jerk(m/s^3)']) ? 'N/A' : aggregatedData['Jerk(m/s^3)']} m/s³
          </div>
          <div className="summary-item">
            <strong>SASV:</strong> {aggregatedData['SASV'] ?? 'N/A'}
          </div>
          <div className="summary-item">
            <strong>Speed (km/h):</strong> {aggregatedData['Speed(km/h)'] ?? 'N/A'} km/h
          </div>
          <div className="summary-item">
            <strong>Speed Violation:</strong> {aggregatedData['Speed_Violation'] ?? 'N/A'}
          </div>
        </div>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default DailyScorePopup;
