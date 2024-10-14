// src/utils/geolocation.js

// Function to get the current location using the Geolocation API
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  const { latitude, longitude } = position.coords;
                  const timestamp = Math.floor(Date.now() / 1000);
                  resolve({ Latitude: latitude, Longitude: longitude, Timestamp: timestamp });
              },
              (error) => reject(error),
              { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
      } else {
          reject(new Error('Geolocation not supported'));
      }
  });
};

// Simulates GPS data with realistic latitude, longitude, and timestamps
export const simulateGpsData = () => {
  const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds

  return [
      { Latitude: 26.6337, Longitude: 92.7926, Timestamp: currentTimestamp - 300 },
      { Latitude: 26.6347, Longitude: 92.7936, Timestamp: currentTimestamp - 240 },
      { Latitude: 26.6357, Longitude: 92.7946, Timestamp: currentTimestamp - 180 },
      { Latitude: 26.6367, Longitude: 92.7956, Timestamp: currentTimestamp - 120 },
      { Latitude: 26.6377, Longitude: 92.7966, Timestamp: currentTimestamp - 60 },
      { Latitude: 26.6387, Longitude: 92.7976, Timestamp: currentTimestamp }, // Current position
  ];
};

// Smart logic for detecting vehicle movement or idle time based on lat/lon and timestamps
export const smartGpsTracking = (currentBatch, previousBatch) => {
  const SPEED_THRESHOLD = 2; // Speed threshold in m/s (~7.2 km/h)

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3; // Earth's radius in meters
      const toRad = (deg) => (deg * Math.PI) / 180;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in meters
  };

  const calculateSpeed = (distance, timeDiff) => {
      // Prevent division by zero or negative time difference
      return timeDiff > 0 ? distance / timeDiff : 0; // Speed in m/s
  };

  if (previousBatch.length > 0) {
      const lastPoint = previousBatch[previousBatch.length - 1];
      const firstPoint = currentBatch[0];

      const distance = calculateDistance(
          lastPoint.Latitude,
          lastPoint.Longitude,
          firstPoint.Latitude,
          firstPoint.Longitude
      );

      const timeDiff = firstPoint.Timestamp - lastPoint.Timestamp; // Time difference in seconds

      if (calculateSpeed(distance, timeDiff) < SPEED_THRESHOLD) {
          console.log('Vehicle idle detected');
          return false;
      }
  }

  return true;
};

// Function to generate GPS data batches
export const generateSimulatedRoute = (driverId, batchSize) => {
  const gpsBatches = [];
  const initialLat = 26.6340; // Starting latitude
  const initialLon = 92.7930; // Starting longitude
  let timestamp = Math.floor(Date.now() / 1000); // Start with the current timestamp

  for (let i = 0; i < batchSize; i++) {
      const batch = [];
      let lat = initialLat + (Math.random() * 0.001); // Simulate small random initial movements in latitude
      let lon = initialLon + (Math.random() * 0.001); // Simulate small random initial movements in longitude

      for (let j = 0; j < 10; j++) {
          // Generate each GPS data point
          lat += (Math.random() * 0.001); // Simulate small random movements in latitude
          lon += (Math.random() * 0.001); // Simulate small random movements in longitude
          timestamp += Math.floor(Math.random() * 60) + 30; // Random time interval (30 to 90 seconds)

          // Push the new GPS data point to the batch
          batch.push({ Latitude: parseFloat(lat.toFixed(4)), Longitude: parseFloat(lon.toFixed(4)), Timestamp: timestamp });
      }

      // Add the current batch to the gpsBatches array
      gpsBatches.push({ driver_id: driverId, gps_data: batch });
  }

  return gpsBatches;
};

// Example usage: Generate 5 batches of simulated GPS data
const batches = generateSimulatedRoute(1, 5);
console.log(JSON.stringify(batches, null, 2)); // Log the generated batches in a readable format
