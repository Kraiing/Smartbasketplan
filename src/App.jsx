// ในไฟล์ App.jsx
import React, { useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// นำเข้า components
import Court from './components/Court';
import MenuBar from './components/MenuBar';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import FeedbackForm from './components/FeedbackForm';
import FeedbackDashboard from './components/FeedbackDashboard';

// PrivateRoute component
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
}

function MainApp() {
  const courtRef = useRef(null);

  // เพิ่มสถานะภาษาใน App.jsx
  const [language, setLanguage] = useState('th');

  // ตำแหน่งของผู้เล่นเริ่มต้น
  const [activePositions, setActivePositions] = useState({
    red: { PG: true, SG: true, SF: true, PF: true, C: true },
    white: { PG: true, SG: true, SF: true, PF: true, C: true }
  });

  // ฟังก์ชันจัดการผู้เล่น
  const handleResetPositions = () => {
    courtRef.current?.resetInitialPositions();
  };

  const handleUndo = () => {
    courtRef.current?.undo();
  };

  const handleRedo = () => {
    courtRef.current?.redo();
  };

  const handleClearAllLines = () => {
    courtRef.current?.clearAllLines();
  };

  const handleResetBallPassState = () => {
    courtRef.current?.resetBallPassState();
  };

  // ฟังก์ชันจัดการการเปิด/ปิดตำแหน่งผู้เล่น
  const handleTogglePosition = (team, position) => {
    const newActivePositions = {
      ...activePositions,
      [team]: {
        ...activePositions[team],
        [position]: !activePositions[team][position]
      }
    };
    setActivePositions(newActivePositions);
    // ไม่ต้องเรียกใช้ updateActivePositions เพราะใช้ props การอัพเดตจะเกิดขึ้นอัตโนมัติ
  };

  return (
    <div className="app h-screen w-screen overflow-hidden">
      <MenuBar
        language={language}
        setLanguage={setLanguage}
        onResetPositions={handleResetPositions}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearAllLines={handleClearAllLines}
        onResetBallPassState={handleResetBallPassState}
        activePositions={activePositions}
        onTogglePosition={handleTogglePosition}
      />
      <div className="h-screen w-screen absolute top-0 left-0">
        <Court ref={courtRef} activePositions={activePositions} />
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
