import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPage.scss';

const AdminPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        // Prepare the request payload
        const requestBody = {
            username,
            password,
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                // Redirect to AdminDashboard directly
                navigate('/admin-dashboard');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'An error occurred. Please try again.');
            }
        } catch (error) {
            setError('An error occurred. Please check your network connection.');
        }
    };

    return (
        <div className="admin-page">
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin}>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Login</button>
                {error && <p className="error-message">{error}</p>}
            </form>
        </div>
    );
};

export default AdminPage;
