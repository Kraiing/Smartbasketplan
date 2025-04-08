import { useState, useRef, useCallback, useEffect } from 'react';
import { useDrawingLogic } from './useDrawingLogic';
import { useBallLogic } from './useBallLogic';

export const usePlayLogic = () => {
  // ตำแหน่งเริ่มต้นของผู้เล่น
  const initialPlayers = [
    { id: 1, x: 25, y: 30, team: 'red', position: 'PG', hasBall: true },
    { id: 2, x: 35, y: 50, team: 'red', position: 'SG', hasBall: false },
    { id: 3, x: 20, y: 70, team: 'red', position: 'SF', hasBall: false },
    { id: 4, x: 40, y: 70, team: 'red', position: 'PF', hasBall: false },
    { id: 5, x: 30, y: 40, team: 'red', position: 'C', hasBall: false },
    { id: 6, x: 75, y: 30, team: 'white', position: 'PG', hasBall: false },
    { id: 7, x: 65, y: 50, team: 'white', position: 'SG', hasBall: false },
    { id: 8, x: 80, y: 70, team: 'white', position: 'SF', hasBall: false },
    { id: 9, x: 60, y: 70, team: 'white', position: 'PF', hasBall: false },
    { id: 10, x: 70, y: 40, team: 'white', position: 'C', hasBall: false },
  ];

  // ตำแหน่งเริ่มต้นของลูกบอล
  const initialBall = { x: 25, y: 32, holderId: 1 };

  // State หลัก
  const [players, setPlayers] = useState(initialPlayers);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  
  // State สำหรับติดตามการกระทำปัจจุบัน
  const [currentAction, setCurrentAction] = useState(null); // 'drawing', 'draggingPlayer', 'draggingBall', null

  // Ref สำหรับการลากผู้เล่น
  const activePointersRef = useRef(new Map()); // เก็บข้อมูล pointers ที่กำลังทำงานอยู่
  const nextPlayerIdRef = useRef(11);
  const errorTimeoutRef = useRef(null); // สำหรับเคลียร์ข้อความ error

  // ตรวจสอบว่าเป็นอุปกรณ์ iOS หรือไม่
  const isIOS = useRef(/iPad|iPhone|iPod/.test(navigator.userAgent) || 
                       (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  // ใช้ custom hooks
  const drawingLogic = useDrawingLogic();
  const ballLogic = useBallLogic(initialPlayers, initialBall, setPlayers);

  // ตรวจสอบว่ากำลังแสดงอนิเมชันอยู่หรือไม่
  const isAnimating = ballLogic.isAnimating ? ballLogic.isAnimating() : false;

  // การตรวจจับขนาดจอและการหมุนจอ
  useEffect(() => {
    const handleResize = () => {
      // ปรับค่า CSS variable --vh ให้เท่ากับ 1% ของความสูงจริงของวินโดว์
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // ดำเนินการทันทีและลงทะเบียนเหตุการณ์
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // ฟังก์ชันช่วยสำหรับการแปลงพิกัด pointer เป็นเปอร์เซ็นต์บนสนาม
  const getPointerPositionPercent = (clientX, clientY) => {
    const courtElement = document.getElementById('basketball-court');
    if (!courtElement) return { x: 0, y: 0 };
    
    const court = courtElement.getBoundingClientRect();
    const pointerX = Math.min(Math.max(0, ((clientX - court.left) / court.width) * 100), 100);
    const pointerY = Math.min(Math.max(0, ((clientY - court.top) / court.height) * 100), 100);
    
    return { x: pointerX, y: pointerY };
  };

  // ฟังก์ชันสำหรับตรวจสอบว่าคลิกที่ผู้เล่นหรือไม่
  const isClickingPlayer = (id) => {
    return id && players.some(player => player.id === id);
  };

  // ฟังก์ชันสำหรับแสดงข้อความ error และเคลียร์อัตโนมัติ
  const showErrorMessage = (message) => {
    console.error(message);
    
    // เคลียร์ timeout ที่มีอยู่ (ถ้ามี)
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    
    // ตั้ง timeout ใหม่เพื่อเคลียร์ข้อความ error หลังจาก 3 วินาที
    errorTimeoutRef.current = setTimeout(() => {
      // คุณสามารถเพิ่ม state สำหรับแสดงข้อความ error ได้ที่นี่ถ้าต้องการ
      errorTimeoutRef.current = null;
    }, 3000);
  };

  // รีเซ็ตทุกอย่างกลับไปที่เริ่มต้น
  const resetToInitialPositions = useCallback(() => {
    setHistory(prev => [...prev, {
      players: [...players],
      ball: {...ballLogic.ball},
      lines: [...drawingLogic.lines]
    }]);
    setFuture([]);
    
    setPlayers([...initialPlayers]);
    ballLogic.setBall({...initialBall});
    drawingLogic.clearAllLines();
    activePointersRef.current.clear();
    setCurrentAction(null);
  }, [players, ballLogic.ball, drawingLogic.lines, initialPlayers, initialBall]);

  // ฟังก์ชันรีเซ็ตสถานะการส่งบอลหรืออนิเมชันฉุกเฉิน
  const resetBallPassState = useCallback(() => {
    // ลบเส้นส่งบอล
    ballLogic.setPassLine && ballLogic.setPassLine(null);
    
    // ใช้ resetAnimation จาก ballLogic ถ้ามี
    if (ballLogic.resetAnimation) {
      ballLogic.resetAnimation();
    } else {
      // ยกเลิกการส่งบอลแบบเดิม (กรณีไม่มี resetAnimation)
      ballLogic.cancelBallPass && ballLogic.cancelBallPass();
    }
    
    // รีเซ็ตสถานะการกระทำ
    setCurrentAction(null);
    
    // ล้าง active pointers
    activePointersRef.current.clear();
    
    console.log("Ball pass state has been reset");
    return true;
  }, [ballLogic]);

  // เพิ่มผู้เล่น
  const addPlayer = useCallback((team) => {
    const newPlayer = {
      id: nextPlayerIdRef.current,
      x: team === 'red' ? 25 : 75,
      y: 50,
      team,
      position: '',
      hasBall: false
    };
    
    setHistory(prev => [...prev, { players: [...players] }]);
    setFuture([]);
    
    setPlayers(prev => [...prev, newPlayer]);
    nextPlayerIdRef.current += 1;
    
    return newPlayer;
  }, [players]);

  // ลบผู้เล่น
  const removePlayer = useCallback((team) => {
    // หาผู้เล่นคนล่าสุดในทีมที่ระบุ
    const teamPlayers = players.filter(p => p.team === team);
    if (teamPlayers.length === 0) return;
    
    const lastPlayer = teamPlayers[teamPlayers.length - 1];
    const playerId = lastPlayer.id;
    
    setHistory(prev => [...prev, { 
      players: [...players],
      ball: {...ballLogic.ball}
    }]);
    setFuture([]);
    
    // ถ้าผู้เล่นที่จะลบมีลูกบอล
    if (lastPlayer.hasBall) {
      // หาผู้เล่นทีมเดียวกันคนอื่น
      const sameTeamPlayer = players.find(p => p.team === team && p.id !== playerId);
      
      if (sameTeamPlayer) {
        // โอนลูกบอลไปที่ผู้เล่นคนอื่น
        setPlayers(prev => prev.map(p => 
          p.id === sameTeamPlayer.id ? { ...p, hasBall: true } : p
        ).filter(p => p.id !== playerId));
        
        ballLogic.setBall({ 
          x: sameTeamPlayer.x, 
          y: sameTeamPlayer.y + 2,
          holderId: sameTeamPlayer.id 
        });
      } else {
        // ถ้าไม่มีผู้เล่นทีมเดียวกันเหลือ ลูกบอลลอยอิสระ
        ballLogic.setBall(prev => ({
          ...prev,
          holderId: null
        }));
        setPlayers(prev => prev.filter(p => p.id !== playerId));
      }
    } else {
      // ลบผู้เล่นปกติ
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    }
  }, [players, ballLogic]);

  // Undo
  const undo = useCallback(() => {
    // ไม่อนุญาตให้ Undo ระหว่างที่มีอนิเมชันทำงานอยู่
    if (isAnimating) return;
    
    if (history.length === 0) return;
    
    const lastState = history[history.length - 1];
    
    setFuture(prev => [
      {
        players: [...players],
        ball: {...ballLogic.ball},
        lines: [...drawingLogic.lines]
      },
      ...prev
    ]);
    
    if (lastState.players) setPlayers(lastState.players);
    if (lastState.ball) ballLogic.setBall(lastState.ball);
    if (lastState.lines) drawingLogic.setLines(lastState.lines);
    
    setHistory(prev => prev.slice(0, -1));
  }, [history, players, ballLogic.ball, drawingLogic.lines, isAnimating]);

  // Redo
  const redo = useCallback(() => {
    // ไม่อนุญาตให้ Redo ระหว่างที่มีอนิเมชันทำงานอยู่
    if (isAnimating) return;
    
    if (future.length === 0) return;
    
    const nextState = future[0];
    
    setHistory(prev => [
      ...prev,
      {
        players: [...players],
        ball: {...ballLogic.ball},
        lines: [...drawingLogic.lines]
      }
    ]);
    
    if (nextState.players) setPlayers(nextState.players);
    if (nextState.ball) ballLogic.setBall(nextState.ball);
    if (nextState.lines) drawingLogic.setLines(nextState.lines);
    
    setFuture(prev => prev.slice(1));
  }, [future, players, ballLogic.ball, drawingLogic.lines, isAnimating]);

  // จัดการการคลิก/แตะ
  const handlePointerDown = useCallback((e, id) => {
    // ไม่อนุญาตให้มีการโต้ตอบระหว่างที่มีอนิเมชันทำงานอยู่
    if (isAnimating) return;
    
    if (e) {
      e.preventDefault();
      
      try {
        // เก็บข้อมูล pointer ใหม่
        const pointerId = e.pointerId || `touch-${Date.now()}`;
        const { x: pointerX, y: pointerY } = getPointerPositionPercent(e.clientX, e.clientY);
        
        // ตรวจสอบว่าพิกัดถูกต้อง
        if (isNaN(pointerX) || isNaN(pointerY)) {
          console.warn("Invalid pointer coordinates", pointerX, pointerY);
          return;
        }
        
        // เช็คว่าเป็นการแตะใหม่หรือแตะซ้ำ (ป้องกัน duplicate events)
        if (activePointersRef.current.has(pointerId)) {
          // อัปเดตตำแหน่ง pointer ที่มีอยู่แล้ว
          const pointerData = activePointersRef.current.get(pointerId);
          pointerData.x = pointerX;
          pointerData.y = pointerY;
          return;
        }

        // เก็บข้อมูล pointer ใหม่พร้อมข้อมูลเพิ่มเติม
        activePointersRef.current.set(pointerId, {
          id: id || null, // id ของ entity ที่ถูกแตะ (ถ้ามี)
          x: pointerX,
          y: pointerY,
          startX: pointerX,
          startY: pointerY,
          action: null // จะกำหนดภายหลัง
        });
        
        // 1. ถ้าคลิกที่ผู้เล่น
        if (isClickingPlayer(id)) {
          const playerWithBall = players.find(p => p.id === id && p.hasBall);
          
          if (playerWithBall && ballLogic.startBallPass(id)) {
            // ถ้าผู้เล่นมีลูกบอลและเริ่มการส่งบอล
            setCurrentAction('draggingBall');
            // อัปเดต action สำหรับ pointer นี้
            const pointerData = activePointersRef.current.get(pointerId);
            if (pointerData) {
              pointerData.action = 'draggingBall';
            }
          } else {
            // เริ่มลากผู้เล่น
            setCurrentAction('draggingPlayer');
            // อัปเดต action สำหรับ pointer นี้
            const pointerData = activePointersRef.current.get(pointerId);
            if (pointerData) {
              pointerData.action = 'draggingPlayer';
              pointerData.targetId = id; // เก็บ id ของผู้เล่นที่กำลังลาก
            }
            
            setHistory(prev => [...prev, {
              players: [...players],
              ball: {...ballLogic.ball}
            }]);
            setFuture([]);
          }
          return;
        }
        
        // 2. ตรวจสอบว่าแตะที่ลูกบอลหรือไม่
        if (ballLogic.handleBallPointerDown(e, players)) {
          setCurrentAction('draggingBall');
          // อัปเดต action สำหรับ pointer นี้
          const pointerData = activePointersRef.current.get(pointerId);
          if (pointerData) {
            pointerData.action = 'draggingBall';
          }
          return;
        }
        
        // 3. ถ้าคลิกที่พื้นสนาม (ไม่ได้คลิกที่ผู้เล่นหรือลูกบอล)
        
        // เริ่มวาดเส้น
        const started = drawingLogic.startDrawing(pointerX, pointerY);
        if (started) {
          setCurrentAction('drawing');
          // อัปเดต action สำหรับ pointer นี้
          const pointerData = activePointersRef.current.get(pointerId);
          if (pointerData) {
            pointerData.action = 'drawing';
          }
          
          setHistory(prev => [...prev, {
            lines: [...drawingLogic.lines]
          }]);
          setFuture([]);
        }
      } catch (error) {
        console.error("Error in handlePointerDown:", error);
        // รีเซ็ตสถานะถ้าเกิดข้อผิดพลาด
        resetBallPassState();
      }
    }
  }, [players, ballLogic, drawingLogic, isAnimating, resetBallPassState]);
  
  // จัดการการเคลื่อนไหว
  const handlePointerMove = useCallback((e) => {
    // ไม่อนุญาตให้มีการโต้ตอบระหว่างที่มีอนิเมชันทำงานอยู่
    if (isAnimating) return;
    
    // ตรวจสอบ e.clientX/Y ว่ามีค่าหรือไม่
    if (!e || !e.clientX || !e.clientY) return;

    try {
      // แปลงพิกัด pointer เป็นเปอร์เซ็นต์
      const { x: pointerX, y: pointerY } = getPointerPositionPercent(e.clientX, e.clientY);
      
      // ตรวจสอบว่าพิกัดถูกต้อง
      if (isNaN(pointerX) || isNaN(pointerY)) {
        console.warn("Invalid pointer coordinates in handlePointerMove", pointerX, pointerY);
        return;
      }
      
      // อัปเดตตำแหน่ง pointer ในบันทึก
      const pointerId = e.pointerId || `touch-${Date.now()}`;
      const pointerData = activePointersRef.current.get(pointerId);
      
      // ถ้าไม่เจอ pointer นี้ ไม่ต้องทำอะไร
      if (!pointerData) return;
      
      // อัปเดตตำแหน่งล่าสุด
      pointerData.x = pointerX;
      pointerData.y = pointerY;
      
      // ตรวจสอบว่า pointer นี้กำลังทำอะไรอยู่
      switch (pointerData.action) {
        case 'draggingPlayer':
          // ถ้ากำลังลากผู้เล่น
          if (pointerData.targetId) {
            // อัพเดตตำแหน่งผู้เล่น
            setPlayers(prev =>
              prev.map(p =>
                p.id === pointerData.targetId
                  ? { ...p, x: pointerX, y: pointerY }
                  : p
              )
            );
            
            // อัพเดตตำแหน่งลูกบอลถ้าผู้เล่นมีลูกบอล
            ballLogic.updateBallPosition(pointerData.targetId, pointerX, pointerY);
          }
          break;
          
        case 'draggingBall':
          // ถ้ากำลังส่งลูกบอล
          ballLogic.moveBallPass(pointerX, pointerY);
          break;
          
        case 'drawing':
          // ถ้ากำลังวาดเส้น
          drawingLogic.continueDrawing(pointerX, pointerY);
          break;
          
        default:
          // ไม่มีการกระทำที่กำลังดำเนินการอยู่
          break;
      }
    } catch (error) {
      console.error("Error in handlePointerMove:", error);
      // ไม่รีเซ็ตสถานะที่นี่เพราะอาจทำให้การใช้งานสะดุด
    }
  }, [ballLogic, drawingLogic, isAnimating, setPlayers]);

  // จัดการการปล่อยนิ้ว/เมาส์
  const handlePointerUp = useCallback((e) => {
    // ไม่อนุญาตให้มีการโต้ตอบระหว่างที่มีอนิเมชันทำงานอยู่ ยกเว้นการลากบอล
    if (isAnimating && currentAction !== 'draggingBall') return;
    
    try {
      // หา pointer ที่ถูกปล่อย
      const pointerId = e?.pointerId || `touch-${Date.now()}`;
      const pointerData = activePointersRef.current.get(pointerId);
      
      // ถ้าไม่เจอ pointer นี้ ไม่ต้องทำอะไร
      if (!pointerData) return;
      
      // แปลงพิกัด pointer เป็นเปอร์เซ็นต์
      const { x: pointerX, y: pointerY } = e ? 
        getPointerPositionPercent(e.clientX, e.clientY) : 
        { x: pointerData.x || 0, y: pointerData.y || 0 }; // ใช้ค่าล่าสุดที่บันทึกไว้ถ้าไม่มี event
      
      // ตรวจสอบว่าพิกัดถูกต้อง
      if (isNaN(pointerX) || isNaN(pointerY)) {
        console.warn("Invalid pointer coordinates in handlePointerUp", pointerX, pointerY);
        // ยกเลิกการกระทำที่เกี่ยวข้องกับ pointer นี้
        if (pointerData.action === 'draggingBall') {
          ballLogic.cancelBallPass && ballLogic.cancelBallPass();
        } else if (pointerData.action === 'drawing') {
          drawingLogic.finishDrawing();
        }
        activePointersRef.current.delete(pointerId);
        return;
      }
      
      // ตรวจสอบว่า pointer นี้กำลังทำอะไรอยู่
      switch (pointerData.action) {
        case 'draggingBall':
          // ถ้ากำลังส่งลูกบอล
          ballLogic.endBallPass(pointerX, pointerY, players);
          break;
          
        case 'drawing':
          // ถ้ากำลังวาดเส้น
          drawingLogic.finishDrawing();
          break;
          
        default:
          // ไม่มีการกระทำที่กำลังดำเนินการอยู่
          break;
      }
      
      // ลบ pointer นี้ออกจากรายการ
      activePointersRef.current.delete(pointerId);
      
      // ถ้าไม่มี pointer ที่ active แล้ว รีเซ็ตสถานะการกระทำปัจจุบัน
      if (activePointersRef.current.size === 0) {
        setCurrentAction(null);
      }
    } catch (error) {
      console.error("Error in handlePointerUp:", error);
      // ฟังก์ชันฉุกเฉิน: รีเซ็ตสถานะทั้งหมด
      resetBallPassState();
    }
  }, [currentAction, ballLogic, drawingLogic, players, isAnimating, resetBallPassState]);

  // จัดการการยกเลิก pointer (เช่น เมาส์ออกนอกพื้นที่)
  const handlePointerCancel = useCallback((e) => {
    try {
      // หา pointer ที่ถูกยกเลิก
      const pointerId = e?.pointerId || `touch-${Date.now()}`;
      const pointerData = activePointersRef.current.get(pointerId);
      
      // ยกเลิกการส่งบอลถ้ากำลังส่งบอลอยู่
      if (pointerData && pointerData.action === 'draggingBall') {
        ballLogic.cancelBallPass && ballLogic.cancelBallPass();
      }
      
      // ยกเลิกการวาดเส้นถ้ากำลังวาดเส้นอยู่
      if (pointerData && pointerData.action === 'drawing') {
        drawingLogic.finishDrawing();
      }
      
      // ลบ pointer นี้ออกจากรายการ
      activePointersRef.current.delete(pointerId);
      
      // ถ้าไม่มี pointer ที่ active แล้ว รีเซ็ตสถานะการกระทำปัจจุบัน
      if (activePointersRef.current.size === 0) {
        setCurrentAction(null);
      }
    } catch (error) {
      console.error("Error in handlePointerCancel:", error);
      // รีเซ็ตสถานะถ้าเกิดข้อผิดพลาด
      resetBallPassState();
    }
  }, [ballLogic, drawingLogic, resetBallPassState]);

  return {
    players,
    setPlayers,
    ball: ballLogic.ball,
    setBall: ballLogic.setBall,
    passLine: ballLogic.passLine,
    currentLine: drawingLogic.currentLine,
    lines: drawingLogic.lines,
    history,
    future,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    resetToInitialPositions,
    resetBallPassState, // เพิ่มฟังก์ชันรีเซ็ตฉุกเฉิน
    addPlayer,
    removePlayer,
    undo,
    redo,
    clearAllLines: drawingLogic.clearAllLines,
    deleteLine: drawingLogic.deleteLine,
    currentAction,
    isAnimating
  };
};