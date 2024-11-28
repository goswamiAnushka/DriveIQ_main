import React, { useEffect, useState } from 'react';
import './AdminDashboard.scss';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AdminDashboard = () => {
    const [drivers, setDrivers] = useState([]);
    const [apiData, setApiData] = useState(null);
    const [filteredData, setFilteredData] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [selectedDriverId, setSelectedDriverId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [predictionResponse, setPredictionResponse] = useState('');
    const [gpsData, setGpsData] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);

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
        fetchDrivers();
    }, []);

    const fetchDailyData = async (driverId, date = null) => {
        setLoading(true);
        try {
            const url = date
                ? `http://127.0.0.1:5000/admin/driver/daily_data/${driverId}?date=${date}`
                : `http://127.0.0.1:5000/admin/driver/all_daily_data/${driverId}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch daily data');
            const data = await response.json();
            setApiData(data);
            setFilteredData(data.daily_data); // Initialize with full data
            setSelectedDriverId(driverId);
            setModalOpen(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchConsolidatedData = async (driverId) => {
        setLoading(true);
        try {
            const response = await fetch(`http://127.0.0.1:5000/admin/driver/bulk_consolidated_data/${driverId}`);
            if (!response.ok) throw new Error('Failed to fetch consolidated data');
            const data = await response.json();
            setApiData(data);
            setSelectedDriverId(driverId);
            setModalOpen(true);
            prepareComparisonChart(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filterDataByDate = () => {
        if (!apiData || !apiData.daily_data) return;

        if (!selectedDate) {
            setFilteredData(apiData.daily_data);
            return;
        }

        const filtered = Object.entries(apiData.daily_data).reduce((acc, [date, entries]) => {
            const entryDate = new Date(date).toDateString();
            const selectedDateString = selectedDate.toDateString();
            if (entryDate === selectedDateString) {
                acc[date] = entries;
            }
            return acc;
        }, {});

        setFilteredData(filtered);
    };

    useEffect(() => {
        filterDataByDate();
    }, [selectedDate]);

    const prepareChartData = (dailyData) => {
        const dates = Object.keys(dailyData);
        const drivingScores = dates.map(date => dailyData[date][0]?.driving_score || 0);
        setChartData({
            labels: dates,
            datasets: [
                {
                    label: 'Driving Score',
                    data: drivingScores,
                    backgroundColor: 'rgba(153, 102, 255, 0.5)',
                },
            ],
        });
    };

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

    const closeModal = () => {
        setModalOpen(false);
        setApiData(null);
        setFilteredData(null);
        setChartData(null);
    };

    const formatConsolidatedDataToText = (data) => {
        if (!data) return "No consolidated data available";
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
        return textOutput;
    };

    const formatDailyDataToText = (dailyData) => {
        if (!dailyData) return "No daily data available";
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
        return textOutput;
    };

    const handleGpsDataSubmit = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/admin/process_gps_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: gpsData,
            });
            if (!response.ok) throw new Error('Failed to process GPS data');
            const data = await response.json();
            setPredictionResponse(JSON.stringify(data, null, 2));
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="admin-dashboard">
            <h2>Admin Dashboard</h2>
            <button className="fetch-drivers-btn" onClick={fetchDrivers}>Get Info of Drivers</button>
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
            {modalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={closeModal}>&times;</span>
                        <h3>Data for Driver ID: {selectedDriverId}</h3>
                        {apiData && apiData.average_driving_score ? (
                            <div>
                                <pre>{formatConsolidatedDataToText(apiData)}</pre>
                                {chartData && <Bar data={chartData} options={{ responsive: true }} />}
                            </div>
                        ) : (
                            <div>
                                <div className="date-filter">
                                    <label>Select Date:</label>
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={(date) => setSelectedDate(date)}
                                        dateFormat="yyyy-MM-dd"
                                    />
                                </div>
                                <pre>{formatDailyDataToText(filteredData)}</pre>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="gps-data-section">
                <h3>Input GPS Data (JSON format)</h3>
                <textarea
                    value={gpsData}
                    onChange={(e) => setGpsData(e.target.value)}
                    placeholder='Enter GPS data in JSON format...'
                    rows={5}
                />
                <button onClick={handleGpsDataSubmit}>Submit GPS Data</button>
            </div>
            {predictionResponse && (
                <div className="prediction-response">
                    <h3>Prediction Response</h3>
                    <pre>{predictionResponse}</pre>
                </div>
            )}
            {loading && <p>Loading...</p>}
            {error && <p className="error">{error}</p>}
        </div>
    );
};

export default AdminDashboard;
