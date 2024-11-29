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

// Haversine formula to calculate distance between two GPS points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // Distance in meters
};

// Calculate speed based on distance and time
const calculateSpeed = (distance, timeDiff) => (timeDiff > 0 ? distance / timeDiff : 0); // Speed in m/s

// Smart logic for detecting vehicle movement or idle time
export const smartGpsTracking = (currentBatch, previousBatch) => {
    const SPEED_THRESHOLD = 2; // Speed threshold in m/s (~7.2 km/h)

    if (previousBatch.length > 0) {
        const lastPoint = previousBatch[previousBatch.length - 1];
        const firstPoint = currentBatch[0];
        const distance = calculateDistance(lastPoint.Latitude, lastPoint.Longitude, firstPoint.Latitude, firstPoint.Longitude);
        const timeDiff = firstPoint.Timestamp - lastPoint.Timestamp;
        if (calculateSpeed(distance, timeDiff) < SPEED_THRESHOLD) {
            console.log('Vehicle idle detected');
            return false;
        }
    }
    return true;
};

// Generate realistic GPS routes with varying speed and random deviations
export const generateSimulatedRoute = (driverId, batchSize) => {
    const gpsBatches = [];
    const routeCoordinates = [
        { Latitude: 37.7749, Longitude: -122.4194 }, // Point A
        { Latitude: 37.7755, Longitude: -122.4189 }, // Point B
        { Latitude: 37.7760, Longitude: -122.4183 }, // Point C
        { Latitude: 37.7765, Longitude: -122.4177 }, // Point D
        { Latitude: 37.7770, Longitude: -122.4172 }, // Point E
    ];

    let timestamp = Math.floor(Date.now() / 1000);

    for (let i = 0; i < batchSize; i++) {
        const batch = [];
        let totalDistance = 0;
        let speed = 11.1 + (Math.random() * 3); // ~40 km/h initial speed with fluctuation

        let prevLat = routeCoordinates[0].Latitude;
        let prevLon = routeCoordinates[0].Longitude;

        while (totalDistance < 10000) { // Ensure 10 km per batch
            for (let j = 0; j < routeCoordinates.length; j++) {
                const lat = routeCoordinates[j].Latitude + (Math.random() * 0.0005 - 0.00025); // Random shift
                const lon = routeCoordinates[j].Longitude + (Math.random() * 0.0005 - 0.00025);
                const timeDiff = Math.max(5, Math.floor((1000 / speed) * (Math.random() * 1.5 + 0.5))); // Dynamic time adjustment
                timestamp += timeDiff;

                const distance = calculateDistance(prevLat, prevLon, lat, lon);
                totalDistance += distance;

                batch.push({
                    Latitude: parseFloat(lat.toFixed(6)),
                    Longitude: parseFloat(lon.toFixed(6)),
                    Timestamp: timestamp,
                });

                prevLat = lat;
                prevLon = lon;
                speed += Math.random() * 2 - 1; // Random speed fluctuation
            }
        }

        gpsBatches.push({ driver_id: driverId, gps_data: batch });
        console.log(`Batch ${i + 1} - Total Distance: ${(totalDistance / 1000).toFixed(2)} km`);
    }

    return gpsBatches;
};

// Example usage: Generate 5 batches of simulated GPS data
const batches = generateSimulatedRoute(1, 5);
console.log(JSON.stringify(batches, null, 2));
