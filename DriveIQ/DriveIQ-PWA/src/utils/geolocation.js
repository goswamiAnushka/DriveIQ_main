// Updated San Francisco coordinates in src/utils/geolocation.js

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

// Simulates GPS data with realistic latitude, longitude, and timestamps for downtown San Francisco
export const simulateGpsData = () => {
    const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
    return [
        { Latitude: 37.7749, Longitude: -122.4194, Timestamp: currentTimestamp - 300 },
        { Latitude: 37.7755, Longitude: -122.4189, Timestamp: currentTimestamp - 240 },
        { Latitude: 37.7760, Longitude: -122.4183, Timestamp: currentTimestamp - 180 },
        { Latitude: 37.7765, Longitude: -122.4177, Timestamp: currentTimestamp - 120 },
        { Latitude: 37.7770, Longitude: -122.4172, Timestamp: currentTimestamp - 60 },
        { Latitude: 37.7775, Longitude: -122.4166, Timestamp: currentTimestamp }, // Current position
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

export const generateSimulatedRoute = (driverId, batchSize) => {
    const gpsBatches = [];
    const routeCoordinates = [
        { Latitude: 37.7749, Longitude: -122.4194 }, // Point A
        { Latitude: 37.7755, Longitude: -122.4189 }, // Point B
        { Latitude: 37.7760, Longitude: -122.4183 }, // Point C
        { Latitude: 37.7765, Longitude: -122.4177 }, // Point D
        { Latitude: 37.7770, Longitude: -122.4172 }, // Point E
        { Latitude: 37.7749, Longitude: -122.4194 }  // Back to Point A
    ];
    let timestamp = Math.floor(Date.now() / 1000); // Start with the current timestamp

    for (let i = 0; i < batchSize; i++) {
        const batch = [];
        let routeIndex = i % routeCoordinates.length; // Cycle through the defined route

        // Get the base coordinates for this batch
        let baseLat = routeCoordinates[routeIndex].Latitude;
        let baseLon = routeCoordinates[routeIndex].Longitude;

        for (let j = 0; j < 10; j++) {  // Generate GPS data points for each segment
            // Simulate small movements in latitude and longitude
            let lat = baseLat + (Math.random() * 0.0001); 
            let lon = baseLon + (Math.random() * 0.0001); 
            timestamp += Math.floor(Math.random() * 30) + 15; // Random interval (15 to 45 seconds)
            
            // Push the new GPS data point to the batch
            batch.push({ 
                Latitude: parseFloat(lat.toFixed(6)), // Fixed to 6 decimal places
                Longitude: parseFloat(lon.toFixed(6)), 
                Timestamp: timestamp 
            });
        }

        // Add the current batch to the gpsBatches array
        gpsBatches.push({ driver_id: driverId, gps_data: batch });

        // Log the generated batch to see the GPS data
        console.log(`Batch ${i + 1}:`, JSON.stringify(batch, null, 2));
    }

    return gpsBatches;
};

// Example usage: Generate 5 batches of simulated GPS data
const batches = generateSimulatedRoute(1, 5);
console.log(JSON.stringify(batches, null, 2)); // Log the generated batches in a readable format
