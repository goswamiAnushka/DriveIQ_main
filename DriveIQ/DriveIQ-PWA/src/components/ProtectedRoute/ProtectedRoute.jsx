// src/components/ProtectedRoute/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ element: Element, isAuthenticated }) => {
  return isAuthenticated ? <Element /> : <Navigate to="/" />;
};

export default ProtectedRoute;