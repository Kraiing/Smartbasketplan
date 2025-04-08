import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ปรับแต่ง viewport สำหรับ iOS
const setViewportForIOS = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  if (isIOS) {
    // ปรับแก้ meta viewport เพื่อป้องกันปัญหาต่างๆ บน iOS
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute(
        'content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }
    
    // กำหนดความสูงเริ่มต้นสำหรับ CSS variable
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
};

// เรียกใช้ฟังก์ชันก่อนเรนเดอร์แอป
setViewportForIOS();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);