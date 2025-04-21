import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Component สำหรับป้องกันหน้าที่ต้องการการยืนยันตัวตน
const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="loading">กำลังโหลด...</div>
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
