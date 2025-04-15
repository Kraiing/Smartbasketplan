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
    transform: 'translateY(0) scaleY(1)',
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
      {/* วงกลมแป้นบาสเกตบอล */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 40 40"
        style={{
          transform: 'translate(-50%, -50%)',
          position: 'absolute',
        }}
      >
        {/* ตะข่ายแป้นบาสที่อยู่ด้านหลังห่วง (z-index ต่ำกว่า) */}
        <g 
          style={{
            ...netAnimationStyle,
            transform: isAnimating ? 'translateY(2px) scaleY(1.1)' : 'translateY(0) scaleY(1)',
          }}
        >
          {/* วงกลมด้านในเพื่อให้ดูเป็นตะข่ายที่อยู่ในห่วง */}
          <circle
            cx="20"
            cy="20"
            r="9.5"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.3"
            strokeDasharray="1,1"
          />
          
          {/* วงกลมด้านในเล็กกว่า */}
          <circle
            cx="20"
            cy="20"
            r="7.5"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.3"
            strokeDasharray="1,1"
          />
          
          {/* วงกลมด้านในเล็กที่สุด */}
          <circle
            cx="20"
            cy="20"
            r="5.5"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.3"
            strokeDasharray="1,1"
          />
          
          {/* เส้นตรงแนวตั้งของตะข่าย - วาดจากขอบห่วงลงมาด้านล่าง */}
          <line x1="12" y1="20" x2="12" y2="32" stroke="rgba(255,255,255,0.7)" strokeWidth="0.4" strokeDasharray="1,1" />
          <line x1="14.5" y1="20" x2="14.5" y2="32" stroke="rgba(255,255,255,0.7)" strokeWidth="0.4" strokeDasharray="1,1" />
          <line x1="17" y1="20" x2="17" y2="32" stroke="rgba(255,255,255,0.7)" strokeWidth="0.4" strokeDasharray="1,1" />
          <line x1="20" y1="20" x2="20" y2="32" stroke="rgba(255,255,255,0.7)" strokeWidth="0.4" strokeDasharray="1,1" />
          <line x1="23" y1="20" x2="23" y2="32" stroke="rgba(255,255,255,0.7)" strokeWidth="0.4" strokeDasharray="1,1" />
          <line x1="25.5" y1="20" x2="25.5" y2="32" stroke="rgba(255,255,255,0.7)" strokeWidth="0.4" strokeDasharray="1,1" />
          <line x1="28" y1="20" x2="28" y2="32" stroke="rgba(255,255,255,0.7)" strokeWidth="0.4" strokeDasharray="1,1" />

          {/* เส้นแนวนอนของตะข่าย */}
          <path
            d="M12,24 C15,24 25,24 28,24"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.4"
            strokeDasharray="1,1"
          />
          <path
            d="M12,28 C15,28 25,28 28,28"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.4"
            strokeDasharray="1,1"
          />
          <path
            d="M12,32 C15,32 25,32 28,32"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="0.4"
            strokeDasharray="1,1"
          />
        </g>
        
        {/* วงกลมรอบนอก (เส้นขอบแป้น) - อยู่ด้านหน้าตะข่าย */}
        <circle
          cx="20"
          cy="20"
          r="12"
          fill="none"
          stroke="rgba(0,0,0,0.8)"
          strokeWidth="3.0"
          className={isAnimating ? 'hoop-animating' : ''}
        />
      </svg>
    </div>
  );
});

export default BasketballHoop;