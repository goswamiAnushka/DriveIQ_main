import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import './Register.scss';
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaComments } from 'react-icons/fa'; // Chatbot icon

const Register = () => {
  const navigate = useNavigate(); // React Router hook to navigate between pages
  const [showTerms, setShowTerms] = useState(false); // State for showing/hiding terms
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    acceptedTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Toggle terms visibility
  const toggleTerms = () => setShowTerms(!showTerms);

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file)); // Create a preview URL for the selected image
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.acceptedTerms) {
      alert('You must accept the terms and conditions.');
      return;
    }

    const formPayload = new FormData();
    formPayload.append('name', formData.name);
    formPayload.append('email', formData.email);
    formPayload.append('password', formData.password);
    formPayload.append('accepted_terms', formData.acceptedTerms);
    formPayload.append('identity_proof', image);

    try {
      setIsSubmitting(true);
      const response = await api.post('/register', formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 201) {
        alert('Registration Successful! You will be redirected to the login page.');
        navigate('/login'); // Redirect to login after alert
      }
    } catch (error) {
      setError('Registration failed. Please try again.'); // Set error state
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sample data for the discount score chart
  const data = [
    { name: 'Speed Penalty', value: 25 },
    { name: 'Acceleration Penalty', value: 15 },
    { name: 'Jerk Penalty', value: 5 },
    { name: 'Braking Intensity Penalty', value: 5 },
    { name: 'Heading Change Penalty', value: 10 },
    { name: 'SASV Penalty', value: 15 },
    { name: 'Speed Violation Penalty', value: 15 },
  ];

  return (
    <div className="register-container">
      <h2>Register for DriveIQ Telematics</h2>
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Image Upload Section */}
        <div className="form-group">
          <label htmlFor="upload">Upload Identity Document</label>
          <input
            type="file"
            id="upload"
            name="upload"
            accept="image/*"
            onChange={handleImageUpload}
            required
          />
          {imagePreview && (
            <img src={imagePreview} alt="Uploaded Preview" className="image-preview" />
          )}
        </div>

        <div className="terms-section">
          <button type="button" onClick={toggleTerms} className="read-terms-btn">
            {showTerms ? 'Hide Terms and Conditions' : 'Read Terms and Conditions'}
          </button>

          {showTerms && (
            <div className={`terms-dropdown ${showTerms ? 'open' : ''}`}>
              <h3>Terms and Conditions</h3>
              <p>By registering for DriveIQ Telematics, you agree to the following terms:</p>
              <ul>
                <li>DriveIQ will track your driving behavior using GPS data.</li>
                <li>Your driving data will be used to analyze your driving and determine a safety score.</li>
                <li>The data is confidential and will not be shared with third parties without your consent.</li>
                <li>The score will influence discounts on insurance premiums based on driving metrics like speed, acceleration, braking, etc.</li>
              </ul>

              <div className="score-chart">
                <h4>Discount Score Breakdown</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={data}
                    margin={{ top: 18, right: 18, left: 18, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-30} 
                      textAnchor="end"
                      tick={{ fontSize: 7 }} // Adjust font size for better fit
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="value" 
                      fill="#007bff" 
                      label={{ position: 'top', fill: '#fff' }} // Show values on top of bars
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="accept-terms">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.acceptedTerms}
                  onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                  required
                />
                <label htmlFor="terms">I accept the terms and conditions</label>
              </div>
            </div>
          )}
        </div>

        <button type="submit" className="submit-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>

      {/* Chatbot Icon */}
      <div className="chatbot-icon" onClick={() => window.open('/chatbot', '_blank')}>
        <FaComments size={40} color="#007bff" />
      </div>

      <div className="no-account">
        <p>Already have an account?</p>
        <a href="/login">Login here</a>
      </div>
    </div>
  );
};

export default Register;
