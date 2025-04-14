import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const BasketballHoop = forwardRef(({ position, onDunk }, ref) => {
  // สถานะอนิเมชั่นเมื่อมีการดังก์
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef(null);
  
  // ฟังก์ชั่นเริ่มการเล่นอนิเมชั่นแป้นบาส
  const startHoopAnimation = () => {
    setIsAnimating(true);
    
    // ตั้งเวลาหยุดอนิเมชั่น
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 800); // อนิเมชั่นทำงาน 0.8 วินาที
  };
  
  // ฟังก์ชั่นสำหรับตรวจสอบการดังก์
  const checkForDunk = (ballX, ballY, hoopX, hoopY) => {
    // คำนวณระยะห่างจากลูกบอลถึงตำแหน่งห่วง
    const distance = Math.sqrt(
      Math.pow(ballX - hoopX, 2) + 
      Math.pow(ballY - hoopY, 2)
    );
    
    // รัศมีของห่วงบาส (ปรับให้เหมาะสมตามขนาดที่ลดลง)
    const hoopRadius = 4; // เปอร์เซ็นต์ของความกว้างจอ
    
    // ตรวจสอบว่าลูกบอลอยู่ในบริเวณห่วงหรือไม่
    return distance < hoopRadius;
  };
  
  // ฟังก์ชั่นสำหรับตรวจสอบการชนของลูกบอลกับแป้น
  const checkForCollision = (ball) => {
    if (!ball) return false;
    
    // เช็คระยะทางระหว่างลูกบอลกับตำแหน่งแป้น
    const isDunk = checkForDunk(ball.x, ball.y, position.x, position.y);
    
    if (isDunk && !isAnimating) {
      // ถ้าเป็นการดังก์ และยังไม่ได้เล่นอนิเมชั่น
      startHoopAnimation();
      
      // เรียกใช้ callback onDunk ถ้ามี
      if (onDunk) {
        onDunk();
      }
      
      return true;
    }
    
    return false;
  };
  
  // เปิดเผยฟังก์ชั่นให้ parent component สามารถใช้งานได้
  useImperativeHandle(ref, () => ({
    startAnimation: startHoopAnimation,
    checkForCollision
  }));
  
  // ล้าง timeout เมื่อ component unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);
  
  // ตรวจสอบว่าเป็นอุปกรณ์ iOS หรือไม่
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // คุณสมบัติอนิเมชั่นของตะข่าย
  const netAnimationStyle = isAnimating ? {
    animation: 'netShake 0.5s ease-in-out',
    willChange: 'transform',
    WebkitBackfaceVisibility: "hidden"
  } : {
    transform: 'translateX(-50%) scaleY(1)',
    transition: 'transform 0.4s ease-out'
  };
  
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        zIndex: 10,
        width: '10vmin',
        height: '10vmin',
      }}
    >
      {/* วงกลมแป้นบาสเกตบอล (อย่างเรียบง่าย) */}
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 40 40"
        style={{
          transform: 'translate(-50%, -50%)',
          position: 'absolute',
        }}
      >
        {/* วงกลมรอบนอก (เส้นขอบแป้น) - ปรับเป็นสีดำและลดขนาดลง */}
        <circle
          cx="20"
          cy="20"
          r="12"
          fill="none"
          stroke="rgba(0,0,0,0.8)"
          strokeWidth="3.0"
          className={isAnimating ? 'hoop-animating' : ''}
        />
        
        {/* ตะข่ายแป้นบาส */}
        <svg 
          x="8" 
          y="20" 
          width="24" 
          height="15" 
          style={netAnimationStyle}
        >
          {/* เส้นตรงแนวตั้งของตะข่าย - ปรับเป็นสีขาวที่ชัดขึ้น */}
          <line x1="0" y1="0" x2="0" y2="15" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" />
          <line x1="4" y1="0" x2="3" y2="15" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" />
          <line x1="8" y1="0" x2="7" y2="15" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" />
          <line x1="12" y1="0" x2="12" y2="15" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" />
          <line x1="16" y1="0" x2="17" y2="15" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" />
          <line x1="20" y1="0" x2="21" y2="15" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" />
          <line x1="24" y1="0" x2="24" y2="15" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" />
          
          {/* เส้นแนวนอนของตะข่าย - ปรับเป็นสีขาวที่ชัดขึ้น */}
          <line x1="0" y1="5" x2="24" y2="5" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" />
          <line x1="0" y1="10" x2="24" y2="10" stroke="rgba(255,255,255,0.9)" strokeWidth="0.5" />
        </svg>
      </svg>
    </div>
  );
});

export default BasketballHoop;