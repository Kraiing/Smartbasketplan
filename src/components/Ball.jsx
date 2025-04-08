import React from 'react';

const Ball = ({ ball, onPointerDown }) => {
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
  
  // ปรับอนิเมชันให้เรียบง่ายขึ้นบน iOS
  const animations = isMoving 
    ? (isIOS 
      ? 'spin 1s linear infinite' // ใช้แค่การหมุน ลดความซับซ้อนอนิเมชันบน iOS
      : 'spin 0.7s linear infinite, pulseShadow 1s ease-in-out infinite') // ใช้หลายอนิเมชันบนอุปกรณ์อื่น
    : 'none';
  
  // ปรับความเข้มของเงาลงบน iOS เพื่อเพิ่มประสิทธิภาพ
  const shadowFilter = isMoving
    ? (isIOS 
      ? 'drop-shadow(0 0 4px rgba(255,215,0,0.7))' 
      : 'drop-shadow(0 0 6px rgba(255,215,0,0.8))')
    : 'drop-shadow(0 0 2px rgba(0,0,0,0.5))';
  
  return (
    <img
      src="/ball.png"
      alt="ball"
      className={`absolute ${isMoving ? 'ball-in-motion' : 'transition-all'}`}
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
        willChange: isMoving ? "transform, top, left" : "auto",
        WebkitBackfaceVisibility: "hidden"
      }}
      onPointerDown={handleBallPointerDown}
      onTouchStart={handleTouchStart}
      draggable="false" // ป้องกันการลากรูปภาพปกติ
    />
  );
};

export default Ball;