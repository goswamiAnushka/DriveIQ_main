import React, { useEffect, useState } from 'react';
import './AdminDashboard.scss';
import { Bar } from 'react-chartjs-2'; // Ensure this is installed via npm
import 'chart.js/auto'; // Required for chart.js

const AdminDashboard = () => {
    const [drivers, setDrivers] = useState([]); // State for storing drivers
    const [apiData, setApiData] = useState(null); // State for API response data
    const [chartData, setChartData] = useState(null); // State for chart data
    const [selectedDriverId, setSelectedDriverId] = useState(''); // State for selected driver ID
    const [loading, setLoading] = useState(false); // Loading state
    const [error, setError] = useState(null); // Error state
    const [modalOpen, setModalOpen] = useState(false); // State for controlling modal visibility
    const [csvContent, setCsvContent] = useState(''); // State to hold pasted CSV content



    // Fetch all drivers on component mount
    const fetchDrivers = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:5000/admin/drivers');
            if (!response.ok) throw new Error('Failed to fetch drivers');
            const data = await response.json();
            setDrivers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrivers(); // Fetch drivers on mount
    }, []);

    // Function to fetch daily data for a specific driver
    const fetchDailyData = async (driverId) => {
        setLoading(true);
        try {
            const response = await fetch(`http://127.0.0.1:5000/admin/driver/all_daily_data/${driverId}`);
            if (!response.ok) throw new Error('Failed to fetch daily data');

            const data = await response.json();
            console.log('Daily Data:', data); // Log the daily data response for debugging

            setApiData(data); // Store the API response in state
            setSelectedDriverId(driverId);
            setModalOpen(true); // Open modal with response data
            prepareChartData(data.daily_data); // Prepare chart data for daily performance
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Function to fetch consolidated data for a specific driver
    const fetchConsolidatedData = async (driverId) => {
        setLoading(true);
        try {
            const response = await fetch(`http://127.0.0.1:5000/admin/driver/bulk_consolidated_data/${driverId}`);
            if (!response.ok) throw new Error('Failed to fetch consolidated data');
            const data = await response.json();
            setApiData(data); // Store the API response in state
            setSelectedDriverId(driverId);
            setModalOpen(true); // Open modal with response data
            prepareComparisonChart(data); // Prepare chart data for consolidated performance
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Function to handle bulk CSV prediction
    const handleBulkCsvPrediction = async () => {
        setLoading(true);
        try {
            const parsedData = csvContent.split('\n').map(row => row.split(',')).filter(row => row.length === 7); // Ensure correct column count
            const jsonData = {
                headers: ["Speed(m/s)", "Acceleration(m/s^2)", "Heading_Change(degrees)", "Jerk(m/s^3)", "Braking_Intensity", "SASV", "Speed_Violation"],
                data: parsedData // Use the validated data
            };

            console.log("Sending data to the API:", jsonData); // Log the data being sent for debugging

            const response = await fetch('http://127.0.0.1:5000/admin/upload_driver_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData),
            });

            if (!response.ok) {
                const errorResponse = await response.json();
                throw new Error(`Error ${response.status}: ${errorResponse.error || 'Failed to process CSV data'}`);
            }

            const data = await response.json();
            console.log("API response data:", data); // Log the successful response

            setApiData(data); // Store the API response in state
            setModalOpen(true); // Open modal with response data
        } catch (err) {
            console.error("Error during bulk CSV prediction:", err.message); // Log the error message
            setError(`Failed to process CSV: ${err.message}`); // More user-friendly error
        } finally {
            setLoading(false); // Reset loading state
        }
    };


    // Function to prepare comparison chart for consolidated data
    const prepareComparisonChart = (data) => {
        const avgDrivingScore = data.average_driving_score;
        const modelPredictedScore = data.model_predicted_score;

        setChartData({
            labels: ['Average Driving Score', 'Model Predicted Score'],
            datasets: [
                {
                    label: 'Driving Scores Comparison',
                    data: [avgDrivingScore, modelPredictedScore],
                    backgroundColor: ['rgba(75, 192, 192, 0.5)', 'rgba(255, 99, 132, 0.5)'],
                },
            ],
        });
    };

    // Function to close the modal
    const closeModal = () => {
        setModalOpen(false);
        setApiData(null); // Clear the data when modal closes
        setChartData(null); // Clear chart data when modal closes
    };

    // Function to convert API data to plain text format for consolidated data
    const formatConsolidatedDataToText = (data) => {
        if (!data) return "No consolidated data available"; // Handle case where data is null or undefined

        let textOutput = `Average Driving Score: ${data.average_driving_score}\n` +
                         `Driving Category: ${data.driving_category}\n` +
                         `Model Predicted Score: ${data.model_predicted_score}\n` +
                         `Total Observations: ${data.aggregated_data.Total_Observations}\n\n` +
                         `Aggregated Data:\n` +
                         `Acceleration (m/s²) Mean: ${data.aggregated_data['Acceleration(m/s²)_mean']}\n` +
                         `Braking Intensity Mean: ${data.aggregated_data.Braking_Intensity_mean}\n` +
                         `Heading Change (degrees) Mean: ${data.aggregated_data['Heading_Change(degrees)_mean']}\n` +
                         `Jerk (m/s³) Mean: ${data.aggregated_data['Jerk(m/s³)_mean']}\n` +
                         `SASV Total: ${data.aggregated_data.SASV_total}\n` +
                         `Speed (m/s) Mean: ${data.aggregated_data['Speed(m/s)_mean']}\n` +
                         `Speed Violation Total: ${data.aggregated_data.Speed_Violation_total}\n`;

        return textOutput; // Return the formatted text
    };

    // Function to format daily data into a more readable structure
    const formatDailyDataToText = (dailyData) => {
        if (!dailyData) return "No daily data available"; // Handle case where data is null or undefined

        let textOutput = 'Daily Data:\n';
        for (const [date, entries] of Object.entries(dailyData)) {
            textOutput += `Date: ${date}\n`;
            entries.forEach((entry, index) => {
                textOutput += `Entry ${index + 1}:\n` +
                    `  Driving Score: ${entry.driving_score}\n` +
                    `  Average Speed: ${entry.avg_speed}\n` +
                    `  Average Acceleration: ${entry.avg_acceleration}\n` +
                    `  Average Braking Intensity: ${entry.avg_braking_intensity}\n` +
                    `  Average Heading Change: ${entry.avg_heading_change}\n` +
                    `  Average Jerk: ${entry.avg_jerk || 'N/A'}\n` +
                    `  Average SASV: ${entry.avg_sasv}\n` +
                    `  Speed Violation Count: ${entry.speed_violation_count}\n` +
                    `  Total Observations: ${entry.total_observations}\n\n`;
            });
        }

        return textOutput; // Return the formatted text
    };

    return (
        <div className="admin-dashboard">
            <h2>Admin Dashboard</h2>

            {/* Button to fetch all drivers */}
            <button className="fetch-drivers-btn" onClick={fetchDrivers}>Get Info of Drivers</button>

                         {/* Text area for CSV content */}
            <div className="csv-input">
                <textarea
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    placeholder="Paste CSV content here"
                    rows="10"
                />
                <button onClick={handleBulkCsvPrediction}>Submit CSV</button>
            </div>

            {/* Display drivers in a table */}
            {drivers.length > 0 && (
                <table className="drivers-table">
                    <thead>
                        <tr>
                            <th>Driver ID</th>
                            <th>Driver Name</th>
                            <th>Fetch All Daily Data</th>
                            <th>Get Consolidated Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        {drivers.map(driver => (
                            <tr key={driver.id}>
                                <td>{driver.id}</td>
                                <td>{driver.name}</td>
                                <td>
                                    <button className="action-btn" onClick={() => fetchDailyData(driver.id)}>
                                        Fetch Daily Data
                                    </button>
                                </td>
                                <td>
                                    <button className="action-btn" onClick={() => fetchConsolidatedData(driver.id)}>
                                        Get Consolidated Data
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {loading && <p>Loading...</p>}
            {error && <p className="error">{error}</p>}

            {/* Modal to show API data */}
            {modalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeModal}>&times;</span>
                        {apiData && (
                            <div>
                                <h3>Driver Data</h3>
                                {/* Displaying API data: driving category and score */}
                                <p>Driving Category: {apiData.driving_category}</p>
                                <p>Driving Score: {apiData.driving_score}</p>
                                <p>Message: {apiData.message}</p>
                                {/* Chart Data */}
                                {chartData && (
                                    <Bar
                                        data={chartData}
                                        options={{
                                            responsive: true,
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                },
                                            },
                                        }}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
