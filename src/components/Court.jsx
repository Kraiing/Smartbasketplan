import React, { useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import Player from './Player.jsx';
import Ball from './Ball.jsx';
import { usePlayLogic } from '../hooks/usePlayLogic.js';

const Court = forwardRef((props, ref) => {
  const {
    players,
    ball,
    passLine,
    currentLine,
    lines,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    resetToInitialPositions,
    resetBallPassState,
    addPlayer,
    removePlayer,
    undo,
    redo,
    clearAllLines,
    deleteLine,
    currentAction,
    isAnimating,
    activePositions,
    togglePosition
  } = usePlayLogic();

  // เปิดเผย function ไปยัง parent component ผ่าน ref
  useImperativeHandle(ref, () => ({
    resetPositions: resetToInitialPositions,
    addPlayer,
    removePlayer,
    undo,
    redo,
    clearAllLines,
    resetBallPassState,
    activePositions,
    togglePosition: (team, position) => {
      console.log(`Court.jsx - Calling togglePosition: ${team} - ${position}`);
      try {
        togglePosition(team, position);
      } catch (error) {
        console.error("Court.jsx - Error in togglePosition:", error);
      }
    }
  }));

  // ป้องกันการ scroll บนอุปกรณ์มือถือและเริ่มต้นการตั้งค่า touch events
  useEffect(() => {
    const courtElement = document.getElementById('basketball-court');
    if (!courtElement) return;
    
    // เพิ่ม touch-action: manipulation ด้วย JavaScript
    courtElement.style.touchAction = "manipulation";
    
    // ป้องกันการ scroll บนอุปกรณ์มือถือ
    const preventScroll = (e) => {
      // อนุญาตให้ scroll ปกติเฉพาะเมื่อไม่ได้ interactive กับแอพ
      if (currentAction) {
        e.preventDefault();
      }
    };
    
    // เพิ่ม event listeners สำหรับ touch events
    courtElement.addEventListener('touchmove', preventScroll, { passive: false });
    
    // ตั้งค่า touch-action สำหรับรองรับ multi-touch
    document.documentElement.style.touchAction = "manipulation";
    document.body.style.touchAction = "manipulation";
    
    return () => {
      if (courtElement) {
        courtElement.removeEventListener('touchmove', preventScroll);
      }
    };
  }, [currentAction]);

  // เพิ่ม safety timeout สำหรับรีเซ็ตอนิเมชันที่ค้าง
  useEffect(() => {
    let safetyTimeout;
    
    if (isAnimating) {
      // ตั้งเวลา 3 วินาทีเพื่อรีเซ็ตอนิเมชันที่ค้าง (ลดลงจาก 5 วินาที)
      safetyTimeout = setTimeout(() => {
        console.log("Safety timeout: resetting animation");
        resetBallPassState();
      }, 3000);
    }
    
    return () => {
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
      }
    };
  }, [isAnimating, resetBallPassState]);

  // ตรวจสอบอุปกรณ์ iOS และปรับแต่งการแสดงผล
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isLandscape = window.innerWidth > window.innerHeight;
  
  // ระบบการจัดการกับ double tap ของเส้น
  const lastTapRef = useRef({ time: 0, lineId: null });
  
  // ฟังก์ชันที่ใช้จัดการกับการแตะที่เส้น
  const handleLineTap = (e, lineId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const now = Date.now();
    const lastTap = lastTapRef.current;
    
    // ตรวจสอบว่าเป็น double tap หรือไม่ (แตะในระยะเวลาไม่เกิน 500ms และเป็นเส้นเดียวกัน)
    if (now - lastTap.time < 500 && lastTap.lineId === lineId) {
      // ถ้าเป็น double tap ให้ลบเส้น
      deleteLine(lineId);
      // รีเซ็ตข้อมูล last tap
      lastTapRef.current = { time: 0, lineId: null };
    } else {
      // ถ้าเป็น single tap ให้เก็บข้อมูลการแตะไว้
      lastTapRef.current = { time: now, lineId };
    }
  };

  // ฟังก์ชันสำหรับทำให้เส้นสมูทด้วยการปรับแต่งพิเศษ
  const createSmoothLine = (points) => {
    if (!points || points.length < 2) return '';
    
    try {
      if (points.length === 2) {
        // ถ้ามีแค่ 2 จุด ก็ใช้เส้นตรงธรรมดา
        return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;
      }
      
      // ปรับประสิทธิภาพการสร้างเส้นบน iOS
      if (isIOS && points.length > 10) {
        // ถ้าเป็น iOS และมีจุดเยอะ ให้ลดจำนวนจุดลง
        const simplifiedPoints = [];
        simplifiedPoints.push(points[0]); // เก็บจุดแรก
        
        // เก็บเฉพาะจุดที่มีระยะห่างพอสมควร (ประมาณทุกๆ 2-3 จุด)
        for (let i = 1; i < points.length - 1; i += 2) {
          simplifiedPoints.push(points[i]);
        }
        
        simplifiedPoints.push(points[points.length - 1]); // เก็บจุดสุดท้าย
        
        // สร้างเส้นแบบง่ายๆ (ลดความซับซ้อนของการคำนวณ)
        return `M${simplifiedPoints[0].x},${simplifiedPoints[0].y} ${simplifiedPoints.slice(1).map(p => `L${p.x},${p.y}`).join(' ')}`;
      }
      
      // เพิ่มการกำจัดจุดที่ไม่จำเป็นเพื่อลดสะเทือน
      const filteredPoints = [];
      filteredPoints.push(points[0]); // จุดแรกเก็บไว้เสมอ
      
      let prevPoint = points[0];
      for (let i = 1; i < points.length - 1; i++) {
        const point = points[i];
        const nextPoint = points[i + 1];
        
        // คำนวณความชันระหว่างจุดปัจจุบันกับจุดก่อนหน้า และจุดปัจจุบันกับจุดถัดไป
        const slope1 = (point.y - prevPoint.y) / (point.x - prevPoint.x || 0.001);
        const slope2 = (nextPoint.y - point.y) / (nextPoint.x - point.x || 0.001);
        
        // ถ้าความชันเปลี่ยนไปมาก จึงเก็บจุดนี้ไว้
        if (Math.abs(slope1 - slope2) > 0.2 || i % 3 === 0) {
          filteredPoints.push(point);
          prevPoint = point;
        }
      }
      
      filteredPoints.push(points[points.length - 1]); // จุดสุดท้ายเก็บไว้เสมอ
      
      // ลดความซับซ้อนของการสร้าง bezier curve บนอุปกรณ์ iOS
      if (isIOS) {
        // สร้าง path string แบบง่ายขึ้นสำหรับ iOS
        return `M${filteredPoints[0].x},${filteredPoints[0].y} ${filteredPoints.slice(1).map(p => `L${p.x},${p.y}`).join(' ')}`;
      }
      
      // สร้าง path string ด้วย cardinal spline เพื่อให้เส้นสมูทมากขึ้น (สำหรับ non-iOS)
      let pathString = `M${filteredPoints[0].x},${filteredPoints[0].y}`;
      
      // ลูปสร้าง bezier curves สำหรับแต่ละส่วนของเส้น
      for (let i = 0; i < filteredPoints.length - 1; i++) {
        const p0 = i > 0 ? filteredPoints[i - 1] : filteredPoints[0];
        const p1 = filteredPoints[i];
        const p2 = filteredPoints[i + 1];
        const p3 = i < filteredPoints.length - 2 ? filteredPoints[i + 2] : p2;
        
        // คำนวณจุดควบคุมสำหรับ cubic bezier curve ด้วยค่า tension ที่เหมาะสม
        const tension = 0.2; // ค่าต่ำให้ความสมูทสูง
        
        // จุดควบคุมที่ 1
        const cp1x = p1.x + (p2.x - p0.x) * tension;
        const cp1y = p1.y + (p2.y - p0.y) * tension;
        
        // จุดควบคุมที่ 2
        const cp2x = p2.x - (p3.x - p1.x) * tension;
        const cp2y = p2.y - (p3.y - p1.y) * tension;
        
        // เพิ่ม cubic bezier curve segment ไปยัง path
        pathString += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
      }
      
      return pathString;
      
    } catch (error) {
      console.error("Error creating smooth path:", error);
      // Fallback to simple polyline if error
      return `M${points[0].x},${points[0].y} ${points.slice(1).map(p => `L${p.x},${p.y}`).join(' ')}`;
    }
  };

  return (
    <div className="relative w-full h-full">
      <div
        id="basketball-court"
        className="relative w-full h-full bg-center bg-no-repeat bg-cover"
        style={{ 
          backgroundImage: "url('/court-real.png')",
          touchAction: "manipulation" // เพิ่ม touch-action ใน style โดยตรง
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel} // เพิ่ม event handler สำหรับกรณี pointer ถูกยกเลิก
        onPointerLeave={handlePointerCancel} // ใช้ handlePointerCancel สำหรับกรณี pointer ออกนอกพื้นที่
        touch-action="manipulation"
        onTouchStart={(e) => {
          // กรณี fallback สำหรับเบราว์เซอร์ที่ไม่รองรับ pointer events
          // แปลง touch event เป็น pointer event
          if (!e.clientX && e.touches && e.touches[0]) {
            const touch = e.touches[0];
            const simulatedEvent = {
              clientX: touch.clientX,
              clientY: touch.clientY,
              pointerId: `touch-${Date.now()}`,
              preventDefault: () => e.preventDefault(),
              stopPropagation: () => e.stopPropagation()
            };
            handlePointerDown(simulatedEvent);
          }
          // ป้องกันการทำงานพร้อมกันของ touch และ pointer events
          if (window.PointerEvent) {
            e.preventDefault();
          }
        }}
      >
        {/* แสดงผู้เล่น */}
        {players.map((player) => (
          <Player
            key={player.id}
            player={player}
            onPointerDown={(e) => handlePointerDown(e, player.id)}
          />
        ))}
        
        {/* ลูกบอลวางไว้ตรงนี้เพื่อให้อยู่ด้านหน้าของผู้เล่น */}
        <Ball ball={ball} onPointerDown={handlePointerDown} />
        
        {/* SVG สำหรับวาดเส้นทั้งหมด */}
        <svg 
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ zIndex: 30 }}
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            {/* Markers สำหรับลูกศรสีดำ */}
            <marker
              id="arrow-black"
              markerWidth="5"
              markerHeight="3"
              refX="0"
              refY="1.5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0 0, 5 1.5, 0 3" fill="black" />
            </marker>
            {/* Markers สำหรับลูกศรสีทอง */}
            <marker
              id="arrow-gold"
              markerWidth="5"
              markerHeight="3"
              refX="0"
              refY="1.5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0 0, 5 1.5, 0 3" fill="gold" />
            </marker>
          </defs>
          
          {/* เส้นที่กำลังวาด - ใช้ path แทน polyline และเปลี่ยนเป็นสีดำ */}
          {currentLine && currentLine.path && currentLine.path.length > 1 && (
            <path
              d={createSmoothLine(currentLine.path)}
              fill="none"
              stroke="black"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.9"
              markerEnd="url(#arrow-black)"
            />
          )}
          
          {/* เส้นที่วาดแล้ว - ใช้ path แทน polyline และเปลี่ยนเป็นสีดำ */}
          {lines && lines.map((line) => {
            if (!line || !line.path || line.path.length < 2) return null;
            
            return (
              <path
                key={line.id}
                d={createSmoothLine(line.path)}
                fill="none"
                stroke="black"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd="url(#arrow-black)"
                style={{ pointerEvents: "all", cursor: "pointer" }}
                onDoubleClick={() => deleteLine(line.id)}
                onClick={(e) => handleLineTap(e, line.id)}
                onTouchStart={(e) => {
                  // ใช้สำหรับอุปกรณ์ touch โดยเฉพาะ
                  if (isIOS) {
                    handleLineTap(e, line.id);
                  }
                }}
              />
            );
          })}
          
          {/* เส้นส่งบอล - ใช้เส้นตรง */}
          {passLine && (
            <line
              x1={passLine.fromX}
              y1={passLine.fromY}
              x2={passLine.toX}
              y2={passLine.toY}
              stroke="gold"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="5,3"
              markerEnd="url(#arrow-gold)"
            />
          )}
        </svg>
        
        {/* แสดงสถานะการกระทำปัจจุบัน (สำหรับ debug) */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          {isAnimating ? '🏀 passing...' : currentAction || 'idle'}
          {currentLine && <span> - {currentLine.path?.length || 0} pts</span>}
        </div>
        
        {/* เพิ่มปุ่มรีเซ็ตกรณีอนิเมชันค้าง (แสดงหลังจากอนิเมชันทำงานเกิน 1 วินาที) */}
        {isAnimating && (
          <button 
            className="absolute top-14 right-2 bg-red-500 text-white px-3 py-1 rounded text-xs z-50 opacity-90 hover:opacity-100"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              resetBallPassState();
            }}
          >
            Reset Animation
          </button>
        )}
        
        {/* เพิ่มคำแนะนำการลบเส้นบนอุปกรณ์ iOS */}
        {isIOS && (
          <div className="absolute top-24 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs opacity-70">
            แตะสองครั้งที่เส้นเพื่อลบ
          </div>
        )}
        
        {/* เพิ่มฮินท์กรณีอยู่บน iOS เพื่อปรับปรุงประสบการณ์ผู้ใช้ */}
        {isIOS && isLandscape && (
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            หมุนจอในแนวตั้งเพื่อประสบการณ์ที่ดีกว่า
          </div>
        )}
      </div>
    </div>
  );
});

export default Court;