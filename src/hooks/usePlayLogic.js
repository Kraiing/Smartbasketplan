 (isAnimating) return;
    
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