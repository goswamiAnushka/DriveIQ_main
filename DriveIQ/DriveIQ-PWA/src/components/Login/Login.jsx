// src/components/Login/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Login.scss';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const response = await axios.post('http://localhost:5000/api/login', { email, password });
        console.log(response.data);  // Log the entire response
        if (response.status === 200) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('driver_id', response.data.driver_id);
            localStorage.setItem('driver_name', response.data.driver_name); // Save driver's name
            navigate('/driver'); // Navigate to the DriverPage
        }
    } catch (err) {
        setError('Invalid email or password');
    }
};


  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-box">
          <h2>Driver Login</h2>
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" className="btn-login">Login</button>

            <p className="register-link">
              No account? <Link to="/register">Register</Link>
            </p>
          </form>

          <p className="admin-link">
            Admin? <Link to="/admin-dashboard">Admin Login</Link>
          </p>
        </div>
      </div>

      <div className="login-right">
        <img src="https://images.autoinsurance.com/app/uploads/2022/01/03210448/Types-of-Car-Insurance-Discounts-1-1024x796.png" alt="Telematics App" />
      </div>
    </div>
  );
};

export default Login;
