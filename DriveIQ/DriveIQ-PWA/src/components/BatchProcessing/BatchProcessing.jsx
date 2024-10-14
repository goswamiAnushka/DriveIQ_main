import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import './Batchprocessing.scss';  // Ensure the file name matches your file system case sensitivity

const BatchProcessing = ({ gpsData }) => {
  const [processedData, setProcessedData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if gpsData is an array and has items
    if (Array.isArray(gpsData) && gpsData.length > 0) {
      processBatch(gpsData);
    }
  }, [gpsData]);

  const processBatch = async (batch) => {
    try {
      const driver_id = localStorage.getItem('driver_id');
      
      // Ensure driver_id is not null or undefined
      if (!driver_id) {
        throw new Error('Driver ID not found');
      }

      const response = await api.post('/record-telematics', { driver_id, gps_data: batch });

      // Log the response to inspect the data structure
      console.log('API Response:', response.data);

      // Set the processed data in state
      setProcessedData(response.data);
      setError(null);  // Clear any previous errors
    } catch (err) {
      console.error('Error processing batch:', err);
      setError('Failed to process batch. Please try again.'); // Display a user-friendly error message
      setProcessedData(null); // Clear processed data on error
    }
  };

  return (
    <div className="batch-processing-container">
      <h3>Batch Processing</h3>

      {/* Display error if there's any */}
      {error && <p className="error">{error}</p>}

      {/* If processed data is available, display it */}
      {processedData ? (
        <div className="processed-data">
          <p>Processed batch data successfully!</p>

          {/* Display Trip Information */}
          <div className="summary-item">
            <strong>Trip ID:</strong> {processedData.trip_id ?? 'N/A'}
          </div>
          <div className="summary-item">
            <strong>Driving Score:</strong> {processedData.driving_score ?? 'N/A'} / 100
          </div>
          <div className="summary-item">
            <strong>Driving Category:</strong> {processedData.driving_category ?? 'N/A'}
          </div>

          {/* Processed Features */}
          <h4>Processed Features:</h4>
          <div className="summary-item">
            <strong>Speed (m/s):</strong> {processedData.features?.['Speed(m/s)'] ?? 'N/A'}
          </div>
          <div className="summary-item">
            <strong>Acceleration (m/s²):</strong> {processedData.features?.['Acceleration(m/s^2)'] ?? 'N/A'}
          </div>
          <div className="summary-item">
            <strong>Jerk (m/s³):</strong> {processedData.features?.['Jerk(m/s^3)'] ?? 'N/A'}
          </div>
          <div className="summary-item">
            <strong>Braking Intensity:</strong> {processedData.features?.['Braking_Intensity'] ?? 'N/A'}
          </div>
          <div className="summary-item">
            <strong>SASV:</strong> {processedData.features?.['SASV'] ?? 'N/A'}
          </div>
          <div className="summary-item">
            <strong>Speed Violation:</strong> {processedData.features?.['Speed_Violation'] ?? 'N/A'}
          </div>
        </div>
      ) : (
        <p>No batch processed yet.</p>
      )}
    </div>
  );
};

export default BatchProcessing;
