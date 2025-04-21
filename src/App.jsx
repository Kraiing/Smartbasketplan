import React, { useRef, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// นำเข้า components เดิม
import Court from './components/Court';
import MenuBar from './components/MenuBar';
import useMenuVisibility from './hooks/useMenuVisibility';

// นำเข้า components ใหม่
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import FeedbackForm from './components/FeedbackForm';
import FeedbackDashboard from './components/FeedbackDashboard';

import './styles/globals.css';

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

// Component หลักของแอพ
function MainApp({ onLanguageChange, language }) {
  const courtRef = useRef(null);
  // ใช้เฉพาะ toggleMenu จาก useMenuVisibility เพื่อแก้ไข unused variable
  const { toggleMenu } = useMenuVisibility();
  
  // ตรวจสอบการหมุนจอและปรับขนาดหน้าจอ
  useEffect(() => {
    // ฟังก์ชันปรับค่า CSS variables ตามขนาดจอจริง
    const updateViewportHeight = () => {
      // ปรับค่า --vh ให้เป็น 1% ของความสูงหน้าจอที่แท้จริง (สำหรับ iOS)
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      document.documentElement.style.setProperty('--screen-height', `${window.innerHeight}px`);

      // ปรับค่า --menu-height ตามโหมดแนวนอน/แนวตั้ง
      const isLandscape = window.innerWidth > window.innerHeight;
      const menuHeight = isLandscape ? 40 : 50;  // MenuBar สูง 40px ในแนวนอน, 50px ในแนวตั้ง
      document.documentElement.style.setProperty('--menu-height', `${menuHeight}px`);
    };

    // เรียกใช้ครั้งแรกและลงทะเบียนกับ event
    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.addEventListener('orientationchange', () => {
      // รอให้การหมุนจอเสร็จสมบูรณ์ก่อนปรับค่า
      setTimeout(updateViewportHeight, 100);
    });

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.removeEventListener('orientationchange', updateViewportHeight);
    };
  }, []);

  // ตรวจสอบและแก้ไขปัญหา iOS Safari
  useEffect(() => {
    // ตรวจสอบว่าเป็น iOS หรือไม่
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS) {
      // ป้องกันการ scroll และการ bounce บน iOS Safari
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.overflow = 'hidden';

      // ป้องกันการซูม
      document.addEventListener('gesturestart', (e) => e.preventDefault());
      document.addEventListener('gesturechange', (e) => e.preventDefault());
      document.addEventListener('gestureend', (e) => e.preventDefault());

      // ป้องกันการดับเบิลแตะเพื่อซูม
      const preventZoom = (e) => {
        if (e.touches && e.touches.length > 1) {
          e.preventDefault();
        }
      };

      document.addEventListener('touchstart', preventZoom, { passive: false });

      return () => {
        document.removeEventListener('gesturestart', (e) => e.preventDefault());
        document.removeEventListener('gesturechange', (e) => e.preventDefault());
        document.removeEventListener('gestureend', (e) => e.preventDefault());
        document.removeEventListener('touchstart', preventZoom);
      };
    }
  }, []);

  const handleAddPlayer = (team) => {
    if (courtRef.current) {
      courtRef.current.addPlayer(team);
    }
  };

  const handleRemovePlayer = (team) => {
    if (courtRef.current) {
      courtRef.current.removePlayer(team);
    }
  };

  const handleResetPositions = () => {
    if (courtRef.current) {
      courtRef.current.resetPositions();
    }
  };

  const handleUndo = () => {
    if (courtRef.current) {
      courtRef.current.undo();
    }
  };

  const handleRedo = () => {
    if (courtRef.current) {
      courtRef.current.redo();
    }
  };

  const handleClearAllLines = () => {
    if (courtRef.current) {
      courtRef.current.clearAllLines();
    }
  };

  const handleResetBallPassState = () => {
    if (courtRef.current) {
      courtRef.current.resetBallPassState();
    }
  };

  // สร้างค่าเริ่มต้นสำหรับ activePositions เพื่อป้องกันหน้าจอขาว
  const [defaultActivePositions, setDefaultActivePositions] = useState({
    red: {
      PG: true,
      SG: true,
      SF: true,
      PF: true,
      C: true
    },
    white: {
      PG: true,
      SG: true,
      SF: true,
      PF: true,
      C: true
    }
  });

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <MenuBar
        language={language}
        setLanguage={onLanguageChange}
        onAddPlayer={handleAddPlayer}
        onRemovePlayer={handleRemovePlayer}
        onResetPositions={handleResetPositions}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClearAllLines={handleClearAllLines}
        onResetBallPassState={handleResetBallPassState}
        activePositions={courtRef.current?.activePositions || defaultActivePositions}
        onTogglePosition={(team, position) => {
          console.log(`App - Toggling position: ${team} - ${position}`);
          if (courtRef.current && courtRef.current.togglePosition) {
            // เรียก togglePosition พร้อมกับบังคับอัพเดท UI เสมอ
            courtRef.current.togglePosition(team, position);

            // เพิ่ม timeout เพื่อบังคับให้ re-render อีกครั้ง (สำคัญมากสำหรับการแก้ปัญหา)
            setTimeout(() => {
              // อัพเดท defaultActivePositions ด้วย เพื่อให้แน่ใจว่า UI จะอัพเดท
              setDefaultActivePositions(prev => {
                const newState = JSON.parse(JSON.stringify(prev));
                if (newState[team]) {
                  newState[team][position] = !newState[team][position];
                }
                return newState;
              });
            }, 10);
          } else {
            console.warn('Court togglePosition function is not available');
            // Fallback: อัพเดตค่าใน defaultActivePositions เพื่อให้การแสดงผลทำงานได้ถึงแม้จะไม่มีฟังก์ชัน togglePosition
            setDefaultActivePositions(prev => {
              const newState = JSON.parse(JSON.stringify(prev));
              if (newState[team]) {
                newState[team][position] = !newState[team][position];
              }
              return newState;
            });
          }
        }}
      />
      <div className="flex-grow overflow-hidden">
        <Court ref={courtRef} />
      </div>
    </div>
  );
}

// แอพหลักพร้อมการจัดการเส้นทาง
function App() {
  const [language, setLanguage] = useState('th'); // เพิ่ม state ภาษาที่ App level
  
  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };
  
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainApp language={language} onLanguageChange={handleLanguageChange} />} />
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