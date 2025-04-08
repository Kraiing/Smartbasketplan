import { useState, useRef, useCallback, useEffect } from 'react';

export const useBallLogic = (initialPlayers, initialBall, setPlayers) => {
  // State สำหรับลูกบอล
  const [ball, setBall] = useState(initialBall);
  // State สำหรับแสดงเส้นการส่งบอล
  const [passLine, setPassLine] = useState(null);
  // State สำหรับควบคุมอนิเมชันการเคลื่อนที่ของลูกบอล
  const [ballAnimation, setBallAnimation] = useState({
    active: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    progress: 0,
    targetPlayerId: null,
    startTime: 0,
    duration: 0
  });
  
  // Refs สำหรับเก็บข้อมูลระหว่างการส่งบอล
  const ballDraggingRef = useRef(false);
  const ballOriginPlayerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const safetyTimeoutRef = useRef(null); // เพิ่ม ref สำหรับ safety timeout
  
  // ตรวจสอบว่าเป็นอุปกรณ์ iOS หรือไม่
  const isIOS = useRef(/iPad|iPhone|iPod/.test(navigator.userAgent) || 
                       (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  
  // ฟังก์ชันรีเซ็ตอนิเมชันค้าง
  const resetAnimation = useCallback(() => {
    // ยกเลิก animation frame ที่กำลังทำงานอยู่
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // ยกเลิก safety timeout ที่กำลังทำงาน
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
    
    // รีเซ็ต state อนิเมชัน
    setBallAnimation({
      active: false,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      progress: 0,
      targetPlayerId: null,
      startTime: 0,
      duration: 0
    });
    
    // ลบเส้นแสดงการส่งบอล
    setPassLine(null);
    
    console.log("Ball animation has been reset");
  }, []);

  // ฟังก์ชันสำหรับการยกเลิกการส่งบอล (สำหรับกรณีผู้ใช้ยกเลิกการทำงาน)
  const cancelBallPass = useCallback(() => {
    if (ballDraggingRef.current && ballOriginPlayerRef.current) {
      // ส่งลูกบอลกลับไปยังผู้เล่นเดิม
      setBall({
        x: ballOriginPlayerRef.current.x,
        y: ballOriginPlayerRef.current.y + 2,
        holderId: ballOriginPlayerRef.current.id
      });
      
      // ลบเส้นการส่งบอล
      setPassLine(null);
      
      // รีเซ็ต refs
      ballDraggingRef.current = false;
      ballOriginPlayerRef.current = null;
      
      return true;
    }
    return false;
  }, []);

  // Easing function for smooth animation
  const easeInOutQuad = (t) => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  };
  
  // ฟังก์ชันคำนวณตำแหน่ง Y ให้มีการโค้งขึ้นระหว่างการเคลื่อนที่ (parabolic arc)
  const calculateArcY = (startY, endY, progress) => {
    // ความสูงของโค้ง (arc height) - ปรับค่านี้เพื่อให้โค้งสูงหรือต่ำลง
    // ปรับความสูงของโค้งให้ต่ำลงสำหรับอุปกรณ์ iOS เพื่อเพิ่มประสิทธิภาพ
    const arcHeight = isIOS.current ? 4 : 8; // ลดความสูงลงเล็กน้อย
    
    // สมการพาราโบลา: y = a * (x - h)^2 + k โดยจุดสูงสุดอยู่ที่ x = 0.5
    const linearY = startY + (endY - startY) * progress; // การเคลื่อนที่แบบเส้นตรง
    const arcEffect = -4 * arcHeight * (progress - 0.5) * (progress - 0.5) + arcHeight; // รูปพาราโบลาหงาย
    
    return linearY - arcEffect; // ลบเพราะแกน Y เพิ่มลงด้านล่าง
  };
  
  // ใช้ useEffect สำหรับจัดการอนิเมชันลูกบอล
  useEffect(() => {
    let isMounted = true; // ใช้ตรวจสอบว่า component ยังแสดงอยู่หรือไม่
    
    // ฟังก์ชันสำหรับทำงานอนิเมชัน
    const runAnimation = () => {
      if (!ballAnimation.active || !isMounted) return;
      
      // จัดการอนิเมชันด้วย simple step-based animation แทน requestAnimationFrame
      // เพื่อความเสถียรมากขึ้น
      let currentProgress = 0;
      const startTime = Date.now();
      const duration = ballAnimation.duration;
      
      // เก็บค่าเริ่มต้นและปลายทาง
      const startX = ballAnimation.startX;
      const startY = ballAnimation.startY;
      const endX = ballAnimation.endX;
      const endY = ballAnimation.endY;
      const targetId = ballAnimation.targetPlayerId;
      
      // ฟังก์ชันอัพเดตสำหรับแต่ละเฟรมของอนิเมชัน
      const step = () => {
        if (!isMounted) return; // ถ้า component ถูก unmount แล้ว ไม่ต้องทำอะไร
        
        const elapsed = Date.now() - startTime;
        currentProgress = Math.min(elapsed / duration, 1);
        
        // คำนวณตำแหน่งปัจจุบัน
        const easeProgress = easeInOutQuad(currentProgress);
        const currentX = startX + (endX - startX) * easeProgress;
        const currentY = calculateArcY(startY, endY, easeProgress);
        
        // อัพเดตตำแหน่งลูกบอล
        setBall(ballState => ({
          ...ballState,
          x: currentX,
          y: currentY,
          // กำหนด holderId เมื่ออนิเมชันเสร็จสิ้น
          holderId: currentProgress >= 1 ? targetId : null
        }));
        
        // ถ้ายังไม่เสร็จ ทำต่อ
        if (currentProgress < 1 && isMounted) {
          animationFrameRef.current = requestAnimationFrame(step);
        } else if (currentProgress >= 1 && isMounted) {
          // เมื่ออนิเมชันเสร็จสิ้น
          // อัพเดตว่าผู้เล่นเป้าหมายถือลูกบอล
          setPlayers(players => 
            players.map(p => ({
              ...p,
              hasBall: p.id === targetId
            }))
          );
          
          // ยกเลิก safety timeout
          if (safetyTimeoutRef.current) {
            clearTimeout(safetyTimeoutRef.current);
            safetyTimeoutRef.current = null;
          }
          
          // รีเซ็ต state อนิเมชัน
          setBallAnimation({
            active: false,
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0,
            progress: 0,
            targetPlayerId: null,
            startTime: 0,
            duration: 0
          });
          
          console.log("Animation completed successfully!");
        }
      };
      
      // เริ่มอนิเมชัน
      animationFrameRef.current = requestAnimationFrame(step);
      
      // ตั้ง safety timeout
      safetyTimeoutRef.current = setTimeout(() => {
        if (isMounted) {
          console.log("Safety timeout triggered!");
          
          // ให้อนิเมชันเสร็จสิ้นทันที
          setBall({
            x: ballAnimation.endX,
            y: ballAnimation.endY,
            holderId: ballAnimation.targetPlayerId
          });
          
          setPlayers(players => 
            players.map(p => ({
              ...p,
              hasBall: p.id === ballAnimation.targetPlayerId
            }))
          );
          
          // รีเซ็ต state อนิเมชัน
          setBallAnimation({
            active: false,
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0,
            progress: 0,
            targetPlayerId: null,
            startTime: 0,
            duration: 0
          });
          
          // ยกเลิก animation frame
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
        }
      }, duration + 1000); // ให้เวลามากกว่า duration ของอนิเมชันเล็กน้อย
    };
    
    // เริ่มการทำงานเมื่อ ballAnimation.active เป็น true
    if (ballAnimation.active) {
      runAnimation();
    }
    
    // Cleanup
    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
    };
  }, [ballAnimation.active, ballAnimation.duration, ballAnimation.startX, ballAnimation.startY, 
      ballAnimation.endX, ballAnimation.endY, ballAnimation.targetPlayerId, setPlayers]);

  // ฟังก์ชันสำหรับเริ่มการส่งบอล
  const startBallPass = useCallback((playerId) => {
    // ตรวจสอบว่าผู้เล่นมีลูกบอลหรือไม่
    const playerWithBall = initialPlayers.find(p => p.id === playerId && p.hasBall);
    if (!playerWithBall) return false;
    
    // เริ่มการลากบอล
    ballDraggingRef.current = true;
    ballOriginPlayerRef.current = playerWithBall;
    
    return true;
  }, [initialPlayers]);

  // ฟังก์ชันสำหรับการเคลื่อนที่ขณะส่งบอล
  const moveBallPass = useCallback((pointerX, pointerY) => {
    if (!ballDraggingRef.current || !ballOriginPlayerRef.current) return;
    
    // ตรวจสอบว่าพิกัดถูกต้อง
    if (isNaN(pointerX) || isNaN(pointerY)) {
      console.warn("Invalid pointer coordinates in moveBallPass", pointerX, pointerY);
      return;
    }
    
    // อัพเดตแสดงเส้นการส่งบอล (ลูกบอลยังไม่เคลื่อนที่)
    setPassLine({
      fromX: ballOriginPlayerRef.current.x,
      fromY: ballOriginPlayerRef.current.y,
      toX: pointerX,
      toY: pointerY
    });
  }, []);

  // ฟังก์ชันสำหรับจบการส่งบอล
  const endBallPass = useCallback((pointerX, pointerY, players) => {
    if (!ballDraggingRef.current) return;
    
    // ตรวจสอบว่าพิกัดถูกต้อง
    if (isNaN(pointerX) || isNaN(pointerY)) {
      console.warn("Invalid pointer coordinates in endBallPass", pointerX, pointerY);
      // ยกเลิกการส่งบอล
      cancelBallPass();
      return;
    }
    
    try {
      // ตรวจสอบว่ามีผู้เล่นที่ตำแหน่งที่ปล่อยบอลหรือไม่
      const targetPlayersRadius = 7; // รัศมีการตรวจจับผู้เล่น (%)
      
      const targetPlayer = players.find(player => {
        const distance = Math.sqrt(
          Math.pow(player.x - pointerX, 2) + 
          Math.pow(player.y - pointerY, 2)
        );
        return distance < targetPlayersRadius;
      });
      
      if (targetPlayer && targetPlayer.id !== ballOriginPlayerRef.current.id) {
        // ถ้ามีผู้เล่นเป้าหมายและไม่ใช่ผู้เล่นเดิม
        
        // บันทึกข้อมูลการส่งบอลไว้
        const fromX = ballOriginPlayerRef.current.x;
        const fromY = ballOriginPlayerRef.current.y;
        const toX = targetPlayer.x;
        const toY = targetPlayer.y;
        
        // ลบเส้นการส่งบอลก่อนเริ่มอนิเมชัน
        setPassLine(null);
        
        // อัพเดต state ผู้เล่น - เอาลูกบอลออกจากผู้เล่นเก่า
        setPlayers(prevPlayers => 
          prevPlayers.map(p => ({
            ...p,
            hasBall: false // ระหว่างอนิเมชัน ไม่มีใครถือลูกบอล
          }))
        );
        
        // คำนวณระยะทางเพื่อกำหนดระยะเวลาของอนิเมชัน
        const distance = Math.sqrt(
          Math.pow(toX - fromX, 2) + 
          Math.pow(toY - fromY, 2)
        );
        
        // ปรับความเร็วให้เร็วขึ้น
        const minDuration = isIOS.current ? 800 : 600; // ลดเวลาลงเพื่อความรวดเร็ว
        const maxDuration = isIOS.current ? 1500 : 1200; // ลดเวลาลงเพื่อความรวดเร็ว
        const baseDuration = Math.min(maxDuration, Math.max(minDuration, distance * 20)); // ลดค่า multiplier
        
        console.log("Starting ball animation with duration:", baseDuration);
        
        // เริ่มอนิเมชันการส่งลูกบอล
        setBallAnimation({
          active: true,
          startX: fromX,
          startY: fromY + 2,
          endX: toX,
          endY: toY + 2,
          progress: 0,
          targetPlayerId: targetPlayer.id,
          startTime: Date.now(),
          duration: baseDuration // ระยะเวลาของอนิเมชันในหน่วย ms
        });
        
      } else {
        // ถ้าไม่มีผู้เล่นเป้าหมาย ส่งลูกบอลกลับไปยังผู้เล่นเดิม
        setBall({
          x: ballOriginPlayerRef.current.x,
          y: ballOriginPlayerRef.current.y + 2,
          holderId: ballOriginPlayerRef.current.id
        });
        
        // ลบเส้นการส่งบอล
        setPassLine(null);
      }
    } catch (error) {
      console.error("Error in endBallPass:", error);
      // ถ้าเกิดข้อผิดพลาด ยกเลิกการส่งบอล
      cancelBallPass();
    }
    
    // รีเซ็ต refs
    ballDraggingRef.current = false;
    ballOriginPlayerRef.current = null;
  }, [setPlayers, cancelBallPass]);

  // ฟังก์ชันสำหรับอัพเดตตำแหน่งลูกบอลเมื่อผู้เล่นเคลื่อนที่
  const updateBallPosition = useCallback((playerId, x, y) => {
    // ตรวจสอบว่าพิกัดถูกต้อง
    if (isNaN(x) || isNaN(y)) {
      console.warn("Invalid coordinates in updateBallPosition", x, y);
      return;
    }
    
    // อัพเดตตำแหน่งลูกบอลเฉพาะเมื่อไม่มีอนิเมชันการส่งบอลทำงานอยู่
    if (!ballAnimation.active) {
      setBall(prevBall => {
        if (prevBall.holderId === playerId) {
          return {
            ...prevBall,
            x: x,
            y: y + 2
          };
        }
        return prevBall;
      });
    }
  }, [ballAnimation.active]);
  
  // ฟังก์ชันสำหรับตรวจสอบว่ากำลังลากลูกบอลอยู่หรือไม่
  const isBallDragging = useCallback(() => {
    return ballDraggingRef.current;
  }, []);
  
  // ฟังก์ชันสำหรับการแตะที่ลูกบอล
  const handleBallPointerDown = useCallback((e, players) => {
    // ไม่อนุญาตให้แตะลูกบอลระหว่างที่มีอนิเมชันทำงานอยู่
    if (ballAnimation.active) return false;
    
    const court = document.getElementById('basketball-court');
    if (!court) return false;
    
    try {
      const courtRect = court.getBoundingClientRect();
      const pointerX = ((e.clientX - courtRect.left) / courtRect.width) * 100;
      const pointerY = ((e.clientY - courtRect.top) / courtRect.height) * 100;
      
      // ตรวจสอบว่าพิกัดถูกต้อง
      if (isNaN(pointerX) || isNaN(pointerY)) {
        console.warn("Invalid pointer coordinates in handleBallPointerDown", pointerX, pointerY);
        return false;
      }
      
      // ตรวจสอบว่าแตะที่ลูกบอลหรือไม่
      // ปรับรัศมีตรวจจับให้ใหญ่ขึ้นบนอุปกรณ์ iOS เพื่อให้ง่ายต่อการแตะ
      const ballRadius = isIOS.current ? 6 : 4; // เพิ่มรัศมีให้ใหญ่ขึ้น
      const distance = Math.sqrt(
        Math.pow(ball.x - pointerX, 2) + 
        Math.pow(ball.y - pointerY, 2)
      );
      
      if (distance < ballRadius) {
        // ถ้าแตะที่ลูกบอล
        if (ball.holderId) {
          // ถ้าลูกบอลอยู่กับผู้เล่น
          const playerWithBall = players.find(p => p.id === ball.holderId);
          if (playerWithBall) {
            ballDraggingRef.current = true;
            ballOriginPlayerRef.current = playerWithBall;
            return true;
          }
        }
      }
    } catch (error) {
      console.error("Error in handleBallPointerDown:", error);
    }
    
    return false;
  }, [ball, ballAnimation.active]);
  
  // สำหรับการทดสอบและ debugging อนิเมชัน
  const isAnimating = useCallback(() => {
    return ballAnimation.active;
  }, [ballAnimation.active]);
  
  return {
    ball,
    setBall,
    passLine,
    setPassLine,
    startBallPass,
    moveBallPass,
    endBallPass,
    updateBallPosition,
    isBallDragging,
    handleBallPointerDown,
    isAnimating,
    cancelBallPass,
    resetAnimation
  };
};