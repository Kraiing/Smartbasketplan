import React, { useRef, useEffect, useState } from 'react';
import Court from './components/Court';
import MenuBar from './components/MenuBar';
import './styles/globals.css';

function App() {
  const courtRef = useRef(null);
  
  // ตรวจสอบการหมุนจอและปรับขนาดหน้าจอ
  useEffect(() => {
    // ฟังก์ชันปรับค่า CSS variables ตามขนาดจอจริง
    const updateViewportHeight = () => {
      // ปรับค่า --vh ให้เป็น 1% ของความสูงหน้าจอที่แท้จริง (สำหรับ iOS)
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      document.documentElement.style.setProperty('--screen-height', `${window.innerHeight}px`);
      
      // ปรับค่า --court-top-offset ตามโหมดแนวนอน/แนวตั้ง
      const isLandscape = window.innerWidth > window.innerHeight;
      const courtTopOffset = isLandscape ? 40 : 50; // MenuBar สูง 40px ในแนวนอน, 50px ในแนวตั้ง
      document.documentElement.style.setProperty('--court-top-offset', `${courtTopOffset}px`);
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
            courtRef.current.togglePosition(team, position);
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

export default App;