import React, { useState, useEffect } from 'react';

const Ball = ({ ball, onPointerDown }) => {
  // เพิ่ม state สำหรับการควบคุมอนิเมชั่นการดังก์
  const [isDunking, setIsDunking] = useState(false);
  
  // ตรวจสอบการเคลื่อนที่ของบอลเพื่อตรวจจับการดังก์
  useEffect(() => {
    // ถ้าบอลกำลังเคลื่อนที่และไม่มีใครถือ
    if (!ball.holderId && !isDunking) {
      // ตรวจสอบว่าบอลอยู่ใกล้แป้นหรือไม่ (ปรับตำแหน่งให้ตรงกับตำแหน่งแป้นที่เปลี่ยนไป)
      const isNearLeftHoop = Math.abs(ball.x - 10) < 7 && Math.abs(ball.y - 50) < 7;
      const isNearRightHoop = Math.abs(ball.x - 86) < 7 && Math.abs(ball.y - 50) < 7;
      
      if (isNearLeftHoop || isNearRightHoop) {
        // เริ่มอนิเมชั่นการดังก์
        setIsDunking(true);
        
        // เล่นเสียงดังก์
        try {
          const audio = new Audio('/dunk-sound.mp3');
          audio.volume = 0.6;
          audio.play().catch(e => console.log('Audio play error:', e));
        } catch (error) {
          console.log('Error playing dunk sound:', error);
        }
        
        // ตั้งเวลาให้จบอนิเมชั่น
        setTimeout(() => {
          setIsDunking(false);
        }, 1000);
      }
    }
  }, [ball, isDunking]);
  
  // ตรวจสอบว่าเป็นอุปกรณ์ iOS หรือไม่
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const handleBallPointerDown = (e) => {
    // ใช้ preventDefault แทน stopPropagation เพื่อป้องกันเฉพาะพฤติกรรมปกติของเบราว์เซอร์
    // โดยไม่ขัดขวางการส่งผ่านเหตุการณ์ไปยังคอมโพเนนต์อื่น
    e.preventDefault();

    // ส่งต่อเหตุการณ์ไปยังฟังก์ชัน handler หลัก
    if (onPointerDown) {
      onPointerDown(e);
    }
  };

  // สำหรับอุปกรณ์ที่ไม่รองรับ pointer events
  const handleTouchStart = (e) => {
    // ป้องกันในกรณีที่รองรับทั้ง touch และ pointer events
    if (window.PointerEvent) {
      return;
    }

    if (e.touches && e.touches[0]) {
      const touch = e.touches[0];
      const simulatedEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        pointerId: `touch-${Date.now()}-ball`,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation()
      };

      if (onPointerDown) {
        onPointerDown(simulatedEvent);
      }
    }
  };

  // ตรวจสอบว่าลูกบอลกำลังเคลื่อนที่อยู่หรือไม่ (ไม่ได้อยู่กับผู้เล่นและไม่ได้ถูกคลิก)
  const isMoving = !ball.holderId;

  // ปรับอนิเมชันให้เหมาะสมตามสถานะของลูกบอล
  let animations = 'none';
  if (isDunking) {
    // อนิเมชั่นสำหรับการดังก์
    animations = isIOS 
      ? 'dunkBall 0.8s ease-in-out' 
      : 'dunkBall 0.8s ease-in-out';
  } else if (isMoving) {
    // อนิเมชั่นปกติเมื่อลูกบอลเคลื่อนที่
    animations = isIOS
      ? 'spin 1s linear infinite' 
      : 'spin 0.7s linear infinite, pulseShadow 1s ease-in-out infinite';
  }

  // ปรับความเข้มของเงาตามสถานะของลูกบอล
  let shadowFilter = 'drop-shadow(0 0 2px rgba(0,0,0,0.5))';
  if (isDunking) {
    // เงาสำหรับการดังก์
    shadowFilter = isIOS
      ? 'drop-shadow(0 0 5px rgba(255,140,0,0.8))'
      : 'drop-shadow(0 0 7px rgba(255,140,0,0.9))';
  } else if (isMoving) {
    // เงาปกติเมื่อลูกบอลเคลื่อนที่
    shadowFilter = isIOS
      ? 'drop-shadow(0 0 4px rgba(255,215,0,0.7))'
      : 'drop-shadow(0 0 6px rgba(255,215,0,0.8))';
  }

  return (
    <img
      src="/ball.png"
      alt="ball"
      className={`absolute ${isMoving ? 'ball-in-motion' : 'transition-all'} ${isDunking ? 'dunking' : ''}`}
      style={{
        left: `${ball.x}%`,
        top: `${ball.y}%`,
        transform: 'translate(-50%, -50%)',
        width: '4vmin',
        height: 'auto',
        zIndex: 25,  // ค่า z-index สูงกว่าผู้เล่น (20) เพื่อให้ลูกบอลอยู่ด้านหน้า
        filter: shadowFilter,
        opacity: isMoving ? 1 : (ball.holderId ? 1 : 0.8),
        pointerEvents: isMoving ? 'none' : 'auto',  // ปิด pointer events ระหว่างอนิเมชัน
        cursor: isMoving ? 'default' : 'pointer',  // เปลี่ยน cursor เมื่อกำลังเคลื่อนที่
        animation: animations,
        touchAction: "manipulation", // เพิ่ม touch-action เพื่อรองรับการแตะหลายนิ้ว
        // เพิ่ม hardware acceleration
        willChange: isMoving || isDunking ? "transform, top, left" : "auto",
        WebkitBackfaceVisibility: "hidden"
      }}
      onPointerDown={handleBallPointerDown}
      onTouchStart={handleTouchStart}
      draggable="false" // ป้องกันการลากรูปภาพปกติ
    />
  );
};

export default Ball;