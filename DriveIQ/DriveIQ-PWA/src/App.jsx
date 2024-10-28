// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import ChatBot from './components/ChatBot/ChatBot';
import Dashboard from './components/Dashboard/Dashboard';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import AdminPage from './pages/AdminPage/AdminPage'; // Import the AdminPage
import DriverPage from './pages/DriverPage/DriverPage'; // Import the DriverPage
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'; // Import the ProtectedRoute

const App = () => {
  const token = localStorage.getItem('token'); // Adjust this according to your auth logic

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminPage />} /> {/* Route for AdminPage */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} /> {/* Route for AdminDashboard */}
        <Route path="/driver" element={<ProtectedRoute element={DriverPage} isAuthenticated={!!token} />} /> {/* Protected Route for DriverPage */}
        <Route path="/chatbot" element={<ChatBot />} />
      </Routes>
    </Router>
  );
};

export default App;
