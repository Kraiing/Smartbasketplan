import { useState, useRef, useCallback, useEffect } from 'react';
import { useDrawingLogic } from './useDrawingLogic';
import { useBallLogic } from './useBallLogic';

export const usePlayLogic = () => {
  // ข้อมูลตำแหน่งผู้เล่นทั้งหมด (ใช้เป็นข้อมูลอ้างอิง)
  const playerPositions = {
    red: {
      PG: { id: 1, x: 25, y: 30, team: 'red', position: 'PG', hasBall: true },
      SG: { id: 2, x: 35, y: 50, team: 'red', position: 'SG', hasBall: false },
      SF: { id: 3, x: 20, y: 70, team: 'red', position: 'SF', hasBall: false },
      PF: { id: 4, x: 40, y: 70, team: 'red', position: 'PF', hasBall: false },
      C:  { id: 5, x: 30, y: 40, team: 'red', position: 'C', hasBall: false },
    },
    white: {
      PG: { id: 6, x: 75, y: 30, team: 'white', position: 'PG', hasBall: false },
      SG: { id: 7, x: 65, y: 50, team: 'white', position: 'SG', hasBall: false },
      SF: { id: 8, x: 80, y: 70, team: 'white', position: 'SF', hasBall: false },
      PF: { id: 9, x: 60, y: 70, team: 'white', position: 'PF', hasBall: false },
      C:  { id: 10, x: 70, y: 40, team: 'white', position: 'C', hasBall: false },
    }
  };

  // State สำหรับตำแหน่งที่เปิดใช้งาน (ค่าเริ่มต้นคือเปิดทุกตำแหน่ง)
  const [activePositions, setActivePositions] = useState({
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

  // ฟังก์ชันสร้างรายการผู้เล่นจากตำแหน่งที่เปิดใช้งาน
  const createPlayersList = useCallback(() => {
    const players = [];
    
    // เพิ่มผู้เล่นทีมแดง
    Object.entries(activePositions.red || {}).forEach(([position, isActive]) => {
      if (isActive && playerPositions.red[position]) {
        players.push({...playerPositions.red[position]});
      }
    });
    
    // เพิ่มผู้เล่นทีมขาว
    Object.entries(activePositions.white || {}).forEach(([position, isActive]) => {
      if (isActive && playerPositions.white[position]) {
        players.push({...playerPositions.white[position]});
      }
    });
    
    return players;
  }, [activePositions, playerPositions]);
  
  // ตำแหน่งเริ่มต้นของผู้เล่น
  const initialPlayers = createPlayersList();

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
      lines: [...drawingLogic.lines],
      activePositions: JSON.parse(JSON.stringify(activePositions))
    }]);
    setFuture([]);
    
    // รีเซ็ตตำแหน่งที่เปิดใช้งานให้เป็นเริ่มต้น (เปิดทุกตำแหน่ง)
    setActivePositions({
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
    
    // สร้างรายการผู้เล่นใหม่จากค่าเริ่มต้น
    const initialPlayersList = [
      playerPositions.red.PG,
      playerPositions.red.SG,
      playerPositions.red.SF,
      playerPositions.red.PF,
      playerPositions.red.C,
      playerPositions.white.PG,
      playerPositions.white.SG,
      playerPositions.white.SF,
      playerPositions.white.PF,
      playerPositions.white.C
    ];
    
    setPlayers(initialPlayersList);
    ballLogic.setBall({...initialBall});
    drawingLogic.clearAllLines();
    activePointersRef.current.clear();
    setCurrentAction(null);
  }, [players, ballLogic.ball, drawingLogic.lines, initialBall, activePositions, playerPositions]);

  // ฟังก์ชันเปิด/ปิดตำแหน่งผู้เล่น
  const togglePosition = useCallback((team, position) => {
    if (!team || !position) {
      console.warn("Invalid team or position in togglePosition", team, position);
      return;
    }
    
    // ตรวจสอบว่า activePositions มีค่าและมี team ที่ต้องการหรือไม่
    if (!activePositions || !activePositions[team]) {
      console.warn(`Team ${team} not found in activePositions`);
      return;
    }
    
    try {
      // เช็คก่อนว่าจะปิดตำแหน่งผู้เล่นหรือไม่
      const willDisable = activePositions[team][position];
      
      // ถ้าปิด ให้ตรวจสอบว่าเป็นผู้เล่นที่ถือบอลอยู่หรือไม่
      if (willDisable) {
        // หาผู้เล่นในตำแหน่งที่จะปิด
        const playerToDisable = players.find(p => p.team === team && p.position === position);
        
        // ตรวจสอบว่าผู้เล่นนี้มีบอลหรือไม่
        if (playerToDisable && playerToDisable.hasBall) {
          // หาผู้เล่นในทีมเดียวกันที่ยังเปิดใช้งานอยู่
          const otherActivePlayers = players.filter(p => 
            p.team === team && 
            p.id !== playerToDisable.id && 
            activePositions[team][p.position]
          );
          
          // ถ้ามีผู้เล่นอื่นในทีมเดียวกัน โอนบอลไปให้คนแรก
          if (otherActivePlayers.length > 0) {
            // โอนบอลไปให้ผู้เล่นคนแรกที่พบ
            const newBallHolder = otherActivePlayers[0];
            
            // อัพเดต hasBall สำหรับผู้เล่นทุกคน
            setPlayers(prev => prev.map(p => ({
              ...p,
              hasBall: p.id === newBallHolder.id
            })));
            
            // อัพเดตตำแหน่งบอล
            ballLogic.setBall({
              x: newBallHolder.x,
              y: newBallHolder.y + 2,
              holderId: newBallHolder.id
            });
          } else {
            // ถ้าไม่มีผู้เล่นในทีมเดียวกัน หาผู้เล่นทีมตรงข้าม
            const oppositeTeam = team === 'red' ? 'white' : 'red';
            const oppositeTeamPlayers = players.filter(p => 
              p.team === oppositeTeam && 
              activePositions[oppositeTeam][p.position]
            );
            
            // ถ้ามีผู้เล่นทีมตรงข้าม โอนบอลไปให้
            if (oppositeTeamPlayers.length > 0) {
              const newBallHolder = oppositeTeamPlayers[0];
              
              // อัพเดต hasBall สำหรับผู้เล่นทุกคน
              setPlayers(prev => prev.map(p => ({
                ...p,
                hasBall: p.id === newBallHolder.id
              })));
              
              // อัพเดตตำแหน่งบอล
              ballLogic.setBall({
                x: newBallHolder.x,
                y: newBallHolder.y + 2,
                holderId: newBallHolder.id
              });
            } else {
              // ถ้าไม่มีผู้เล่นอื่นเลย ให้บอลลอยตรงกลางสนาม
              ballLogic.setBall({
                x: 50,
                y: 50,
                holderId: null
              });
            }
          }
        }
      }
      
      // ถ้าจะปิดตำแหน่งทั้งหมดในทีม (ซึ่งไม่อนุญาตถ้าทีมนั้นถือบอลอยู่)
      // ตรวจสอบว่าหลังจากปิดแล้วจะเหลือผู้เล่นในทีมอีกไหม
      const activePlayersInTeam = Object.keys(activePositions[team])
        .filter(pos => pos !== position && activePositions[team][pos]);
        
      const ballHolderInTeam = players.find(p => p.team === team && p.hasBall);
      
      // ถ้าไม่มีผู้เล่นเหลือในทีมและทีมนี้มีผู้เล่นถือบอลอยู่ ให้ยกเลิกการปิด
      if (willDisable && activePlayersInTeam.length === 0 && ballHolderInTeam) {
        // แจ้งผู้ใช้ว่าไม่สามารถปิดทุกตำแหน่งได้
        console.log("Cannot disable all positions in a team holding the ball");
        return; // ยกเลิกการปิดตำแหน่ง
      }
      
      // บันทึกประวัติก่อนเปลี่ยนแปลง
      setHistory(prev => [...prev, { 
        players: [...players],
        ball: {...ballLogic.ball},
        activePositions: JSON.parse(JSON.stringify(activePositions))
      }]);
      setFuture([]);
      
      // เปลี่ยนสถานะการเปิด/ปิดตำแหน่งผู้เล่น
      setActivePositions(prev => {
        // สร้าง Object ใหม่เพื่อหลีกเลี่ยงการ mutate state โดยตรง
        const newState = { ...prev };
        
        // ตรวจสอบว่ามี team และ position ที่ต้องการหรือไม่
        if (!newState[team]) {
          newState[team] = {};
        }
        
        // สลับค่า (toggle) สถานะของตำแหน่งที่ระบุ
        newState[team][position] = !newState[team][position];
        return newState;
      });
      
      // อัพเดตรายการผู้เล่นตามตำแหน่งที่เปิดใช้งาน
      setTimeout(() => {
        try {
          const newPlayers = createPlayersList();
          
          // อัพเดตผู้เล่นที่มีบอลถ้ามีการเปลี่ยนแปลงผู้เล่น
          const currentBallHolder = players.find(p => p.hasBall);
          
          if (currentBallHolder) {
            // ถ้าผู้เล่นที่มีบอลยังอยู่ในรายการใหม่
            const ballHolderInNewPlayers = newPlayers.find(p => p.id === currentBallHolder.id);
            
            if (ballHolderInNewPlayers) {
              // ถ้าผู้เล่นที่มีบอลยังอยู่ ก็ให้เขาถือบอลต่อไป
              setPlayers(newPlayers.map(p => ({
                ...p,
                hasBall: p.id === currentBallHolder.id
              })));
            } else {
              // กำหนดผู้เล่นคนใหม่ให้ถือบอล (หรือไม่มีก็ได้ถ้าไม่มีผู้เล่นเหลือ)
              setPlayers(newPlayers);
              
              if (newPlayers.length > 0) {
                // ถ้ามีผู้เล่นเหลืออยู่ ให้คนแรกถือบอล
                setPlayers(newPlayers.map((p, index) => ({
                  ...p,
                  hasBall: index === 0
                })));
                
                // อัพเดตตำแหน่งบอล
                const firstPlayer = newPlayers[0];
                ballLogic.setBall({
                  x: firstPlayer.x,
                  y: firstPlayer.y + 2,
                  holderId: firstPlayer.id
                });
              } else {
                // ถ้าไม่มีผู้เล่นเหลือเลย ให้บอลลอยกลางสนาม
                ballLogic.setBall({
                  x: 50,
                  y: 50,
                  holderId: null
                });
              }
            }
          } else {
            // ถ้าตอนแรกไม่มีใครถือบอล ก็ใช้ผู้เล่นใหม่
            setPlayers(newPlayers);
          }
        } catch (error) {
          console.error("Error updating players after position toggle:", error);
          // ถ้ามีข้อผิดพลาด ใช้ผู้เล่นเดิมและเช็คลูกบอล
          const currentBallHolder = players.find(p => p.hasBall);
          if (!currentBallHolder && players.length > 0) {
            // ถ้าไม่มีผู้ถือบอล แต่มีผู้เล่น ให้คนแรกถือบอล
            setPlayers(players.map((p, index) => ({
              ...p,
              hasBall: index === 0
            })));
            
            // อัพเดตตำแหน่งบอล
            const firstPlayer = players[0];
            ballLogic.setBall({
              x: firstPlayer.x,
              y: firstPlayer.y + 2,
              holderId: firstPlayer.id
            });
          }
        }
      }, 0);
    } catch (error) {
      console.error("Error in togglePosition:", error);
    }
  }, [players, ballLogic, activePositions, createPlayersList]);

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
        lines: [...drawingLogic.lines],
        activePositions: lastState.activePositions ? JSON.parse(JSON.stringify(activePositions)) : undefined
      },
      ...prev
    ]);
    
    if (lastState.players) setPlayers(lastState.players);
    if (lastState.ball) ballLogic.setBall(lastState.ball);
    if (lastState.lines) drawingLogic.setLines(lastState.lines);
    if (lastState.activePositions) setActivePositions(lastState.activePositions);
    
    setHistory(prev => prev.slice(0, -1));
  }, [history, players, ballLogic.ball, drawingLogic.lines, isAnimating, activePositions]);

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
        lines: [...drawingLogic.lines],
        activePositions: nextState.activePositions ? JSON.parse(JSON.stringify(activePositions)) : undefined
      }
    ]);
    
    if (nextState.players) setPlayers(nextState.players);
    if (nextState.ball) ballLogic.setBall(nextState.ball);
    if (nextState.lines) drawingLogic.setLines(nextState.lines);
    if (nextState.activePositions) setActivePositions(nextState.activePositions);
    
    setFuture(prev => prev.slice(1));
  }, [future, players, ballLogic.ball, drawingLogic.lines, isAnimating, activePositions]);

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
    isAnimating,
    activePositions,
    togglePosition
  };
};