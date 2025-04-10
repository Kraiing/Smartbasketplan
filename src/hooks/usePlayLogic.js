import { useState, useRef, useCallback } from 'react';
import * as uuid from 'uuid';
const uuidv4 = uuid.v4;
import useDrawingLogic from './useDrawingLogic';
import useBallLogic from './useBallLogic';

// ฟังก์ชันช่วยสำหรับคำนวณตำแหน่ง pointer เป็นเปอร์เซ็นต์ของพื้นที่สนาม
const getPointerPositionPercent = (clientX, clientY) => {
  const court = document.getElementById('court');
  
  if (!court) return { x: 0, y: 0 };
  
  const rect = court.getBoundingClientRect();
  
  // คำนวณตำแหน่งเป็นเปอร์เซ็นต์ของความกว้างและความสูงของสนาม
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  
  return { x, y };
};

export default function usePlayLogic() {
  // สถานะผู้เล่น
  const [players, setPlayers] = useState([
    // ทีม A (ฝั่งซ้าย/แดง)
    { id: 'a1', x: 25, y: 20, team: 'A', number: 1, hasBall: true },
    { id: 'a2', x: 40, y: 30, team: 'A', number: 2, hasBall: false },
    { id: 'a3', x: 25, y: 40, team: 'A', number: 3, hasBall: false },
    { id: 'a4', x: 25, y: 60, team: 'A', number: 4, hasBall: false },
    { id: 'a5', x: 25, y: 80, team: 'A', number: 5, hasBall: false },
    
    // ทีม B (ฝั่งขวา/น้ำเงิน)
    { id: 'b1', x: 75, y: 20, team: 'B', number: 1, hasBall: false },
    { id: 'b2', x: 60, y: 30, team: 'B', number: 2, hasBall: false },
    { id: 'b3', x: 75, y: 40, team: 'B', number: 3, hasBall: false },
    { id: 'b4', x: 75, y: 60, team: 'B', number: 4, hasBall: false },
    { id: 'b5', x: 75, y: 80, team: 'B', number: 5, hasBall: false }
  ]);
  
  // สถานะตำแหน่งที่เปิดใช้งาน
  const [activePositions, setActivePositions] = useState({
    'A1': true, 'A2': true, 'A3': true, 'A4': true, 'A5': true,
    'B1': true, 'B2': true, 'B3': true, 'B4': true, 'B5': true
  });
  
  // ตำแหน่งดั้งเดิมของผู้เล่นสำหรับรีเซ็ต
  const initialPlayerPositions = useRef([...players]);
  
  // สถานะการกระทำปัจจุบัน
  const [currentAction, setCurrentAction] = useState(null);
  
  // สถานะเมื่อมีอนิเมชันกำลังทำงานอยู่
  const [isAnimating, _] = useState(false);
  
  // ประวัติการกระทำ (สำหรับ undo)
  const [history, setHistory] = useState([]);
  
  // ประวัติการกระทำในอนาคต (สำหรับ redo)
  const [future, setFuture] = useState([]);
  
  // Map สำหรับเก็บข้อมูล pointer ที่กำลังทำงานอยู่
  const activePointersRef = useRef(new Map());
  
  // Logic สำหรับการวาดเส้น
  const drawingLogic = useDrawingLogic();
  
  // Logic สำหรับการจัดการลูกบอล
  const ballLogic = useBallLogic(players, { x: 25, y: 20, holder: 'a1' }, setPlayers);
  
  // ฟังก์ชันรีเซ็ตฉุกเฉินสำหรับการส่งบอล
  const resetBallPassState = useCallback(() => {
    setCurrentAction(null);
    activePointersRef.current.clear();
    ballLogic.cancelBallPass && ballLogic.cancelBallPass();
  }, [ballLogic]);
  
  // ฟังก์ชันสำหรับตรวจสอบว่าคลิกที่ผู้เล่นหรือไม่
  const isClickingPlayer = useCallback((id) => {
    return players.some(player => player.id === id);
  }, [players]);
  
  // รีเซ็ตตำแหน่งผู้เล่นให้กลับไปที่ตำแหน่งเริ่มต้น
  const resetToInitialPositions = useCallback(() => {
    setHistory(prev => [...prev, {
      players: [...players],
      ball: {...ballLogic.ball}
    }]);
    
    setPlayers(initialPlayerPositions.current);
    
    // รีเซ็ตบอลให้กลับไปอยู่กับผู้เล่นคนแรกของทีม A
    const firstPlayerA = initialPlayerPositions.current.find(p => p.team === 'A' && p.number === 1);
    if (firstPlayerA) {
      setPlayers(prev => prev.map(p => ({
        ...p,
        hasBall: p.id === firstPlayerA.id
      })));
      
      ballLogic.setBall({
        x: firstPlayerA.x,
        y: firstPlayerA.y,
        holder: firstPlayerA.id
      });
    }
    
    setFuture([]);
  }, [players, ballLogic, setPlayers]);
  
  // เปิด/ปิดตำแหน่งผู้เล่น
  const togglePosition = useCallback((team, number) => {
    const positionKey = `${team}${number}`;
    
    // ตรวจสอบว่าเป็นการปิดตำแหน่งที่มีลูกบอลหรือไม่
    const playerId = `${team.toLowerCase()}${number}`;
    const player = players.find(p => p.id === playerId);
    
    // ถ้าเป็นการปิดตำแหน่ง
    if (activePositions[positionKey] && player && player.hasBall) {
      // ต้องหาผู้เล่นคนอื่นในทีมเดียวกันที่ยังเปิดอยู่
      const teamPlayers = players.filter(p => 
        p.team === team && 
        p.id !== playerId && 
        activePositions[`${p.team}${p.number}`]
      );
      
      // ถ้าไม่มีผู้เล่นคนอื่นในทีมที่เปิดอยู่ ไม่อนุญาตให้ปิด
      if (teamPlayers.length === 0) {
        const oppositeTeam = team === 'A' ? 'B' : 'A';
        const oppositeTeamPlayers = players.filter(p => 
          p.team === oppositeTeam && 
          activePositions[`${p.team}${p.number}`]
        );
        
        // ถ้ามีผู้เล่นในทีมตรงข้ามที่เปิดอยู่ ส่งบอลไปให้ผู้เล่นคนแรกของทีมตรงข้าม
        if (oppositeTeamPlayers.length > 0) {
          const newHolder = oppositeTeamPlayers[0];
          
          // ส่งบอลไปให้ผู้เล่นทีมตรงข้าม
          ballLogic.setBall({
            x: newHolder.x,
            y: newHolder.y,
            holder: newHolder.id
          });
          
          // อัปเดตข้อมูลผู้เล่น
          setPlayers(prev => prev.map(p => ({
            ...p,
            hasBall: p.id === newHolder.id
          })));
        } else {
          // ไม่สามารถปิดตำแหน่งได้เพราะไม่มีที่จะส่งบอลไป
          return;
        }
      } else {
        // ส่งบอลไปให้ผู้เล่นคนแรกในทีมเดียวกันที่ยังเปิดอยู่
        const newHolder = teamPlayers[0];
        
        // ส่งบอลไปให้ผู้เล่นคนใหม่
        ballLogic.setBall({
          x: newHolder.x,
          y: newHolder.y,
          holder: newHolder.id
        });
        
        // อัปเดตข้อมูลผู้เล่น
        setPlayers(prev => prev.map(p => ({
          ...p,
          hasBall: p.id === newHolder.id
        })));
      }
    }
    
    // อัปเดตสถานะตำแหน่งที่เปิดใช้งาน
    setActivePositions(prev => ({
      ...prev,
      [positionKey]: !prev[positionKey]
    }));
    
  }, [activePositions, players, ballLogic]);
  
  // เพิ่มผู้เล่นใหม่
  const addPlayer = useCallback((team) => {
    const newPlayerId = uuidv4();
    const lastPlayerNumber = Math.max(...players.filter(p => p.team === team).map(p => p.number), 0);
    const newPlayerNumber = lastPlayerNumber + 1;
    
    // กำหนดตำแหน่งเริ่มต้นตามทีม
    const startX = team === 'A' ? 25 : 75;
    const startY = 50;
    
    const newPlayer = {
      id: newPlayerId,
      x: startX,
      y: startY,
      team,
      number: newPlayerNumber,
      hasBall: false
    };
    
    setHistory(prev => [...prev, {
      players: [...players]
    }]);
    
    setPlayers(prev => [...prev, newPlayer]);
    
    // เพิ่มตำแหน่งใหม่ในรายการตำแหน่งที่เปิดใช้งาน
    setActivePositions(prev => ({
      ...prev,
      [`${team}${newPlayerNumber}`]: true
    }));
    
    setFuture([]);
  }, [players]);
  
  // ลบผู้เล่น
  const removePlayer = useCallback((playerId) => {
    const playerToRemove = players.find(p => p.id === playerId);
    
    // ถ้าไม่พบผู้เล่น หรือผู้เล่นมีบอลอยู่และเป็นผู้เล่นคนสุดท้ายในทีม ไม่อนุญาตให้ลบ
    if (!playerToRemove) return;
    
    const teamPlayers = players.filter(p => p.team === playerToRemove.team);
    
    if (playerToRemove.hasBall && teamPlayers.length === 1) {
      // ถ้าผู้เล่นมีบอลและเป็นคนสุดท้ายในทีม ไม่อนุญาตให้ลบ
      return;
    }
    
    setHistory(prev => [...prev, {
      players: [...players],
      ball: {...ballLogic.ball}
    }]);
    
    // ถ้าผู้เล่นที่จะลบมีบอล ให้ส่งบอลไปให้ผู้เล่นคนอื่นในทีมเดียวกัน
    if (playerToRemove.hasBall) {
      const otherTeamPlayer = players.find(p => p.team === playerToRemove.team && p.id !== playerId);
      
      if (otherTeamPlayer) {
        // ส่งบอลไปให้ผู้เล่นคนอื่นในทีมเดียวกัน
        ballLogic.setBall({
          x: otherTeamPlayer.x,
          y: otherTeamPlayer.y,
          holder: otherTeamPlayer.id
        });
        
        // อัปเดตข้อมูลผู้เล่น
        setPlayers(prev => 
          prev
            .filter(p => p.id !== playerId)
            .map(p => ({
              ...p,
              hasBall: p.id === otherTeamPlayer.id
            }))
        );
      }
    } else {
      // ลบผู้เล่นโดยไม่ต้องจัดการลูกบอล
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    }
    
    // ลบตำแหน่งออกจากรายการตำแหน่งที่เปิดใช้งาน
    setActivePositions(prev => {
      const newActivePositions = { ...prev };
      delete newActivePositions[`${playerToRemove.team}${playerToRemove.number}`];
      return newActivePositions;
    });
    
    setFuture([]);
  }, [players, ballLogic]);
  
  // ย้อนกลับการกระทำ (Undo)
  const undo = useCallback(() => {
    if (history.length === 0) return;
    
    const lastState = history[history.length - 1];
    
    setFuture(prev => [
      {
        players: players.length > 0 ? [...players] : undefined,
        ball: ballLogic.ball ? {...ballLogic.ball} : undefined,
        lines: drawingLogic.lines.length > 0 ? [...drawingLogic.lines] : undefined,
        activePositions: activePositions ? { ...activePositions } : undefined
      },
      ...prev
    ]);
    
    if (lastState.players) setPlayers(lastState.players);
    if (lastState.ball) ballLogic.setBall(lastState.ball);
    if (lastState.lines) drawingLogic.setLines(lastState.lines);
    if (lastState.activePositions) setActivePositions(lastState.activePositions);
    
    setHistory(prev => prev.slice(0, -1));
  }, [history, players, ballLogic, drawingLogic.lines, activePositions, drawingLogic.setLines]);
  
  // ทำซ้ำการกระทำ (Redo)
  const redo = useCallback(() => {
    // ไม่อนุญาตให้มีการโต้ตอบระหว่างที่มีอนิเมชันทำงานอยู่
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
  }, [players, ballLogic, drawingLogic, isAnimating, resetBallPassState, isClickingPlayer]);
  
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
  }, [ballLogic, drawingLogic, resetBallPassState, setCurrentAction]);
  
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
}