// ในไฟล์ App.jsx
import React, { useRef, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// นำเข้า components
import Court from './components/Court';
import MenuBar from './components/MenuBar';
import useMenuVisibility from './hooks/useMenuVisibility';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import FeedbackForm from './components/FeedbackForm';
import FeedbackDashboard from './components/FeedbackDashboard';

function MainApp() {
  const courtRef = useRef(null);
  const { isVisible } = useMenuVisibility();
  const { currentUser } = useAuth();
  
  // เพิ่มสถานะภาษาใน App.jsx
  const [language, setLanguage] = useState('th');
  
  // ...โค้ดอื่นๆ
  
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <MenuBar
        // ส่งค่าภาษาและฟังก์ชันเปลี่ยนภาษาไปยัง MenuBar
        language={language}
        setLanguage={setLanguage}
        // props อื่นๆ ยังคงเหมือนเดิม
        onAddPlayer={handleAddPlayer}
        onRemovePlayer={handleRemovePlayer}
        onResetPositions={handleResetPositions}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearAllLines={handleClearAllLines}
        onResetBallPassState={handleResetBallPassState}
        activePositions={courtRef.current?.activePositions || defaultActivePositions}
        onTogglePosition={(team, position) => {
          // โค้ดเดิม
        }}
      />
      <div className="flex-grow overflow-hidden">
        <Court ref={courtRef} />
      </div>
    </div>
  );
}

function App() {
  // เพิ่มสถานะภาษาในระดับ App
  const [language, setLanguage] = useState('th');
  
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainApp language={language} setLanguage={setLanguage} />} />
          <Route path="/profile" element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          } />
          <Route path="/analytics" element={
            <PrivateRoute>
              <AnalyticsDashboard />
            </PrivateRoute>
          } />
          {/* ส่งค่าภาษาไปยัง FeedbackForm */}
          <Route path="/feedback" element={<FeedbackForm language={language} />} />
          <Route path="/feedback-dashboard" element={
            <PrivateRoute>
              <FeedbackDashboard />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;