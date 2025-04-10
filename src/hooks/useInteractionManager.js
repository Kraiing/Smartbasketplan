import { useState, useRef, useCallback } from 'react';

// ฟังก์ชันช่วยสำหรับคำนวณตำแหน่ง pointer เป็นเปอร์เซ็นต์ของพื้นที่สนาม
const getPointerPositionPercent = (clientX, clientY) => {
  const court = document.getElementById('basketball-court');

  if (!court) return { x: 0, y: 0 };

  const rect = court.getBoundingClientRect();

  // คำนวณตำแหน่งเป็นเปอร์เซ็นต์ของความกว้างและความสูงของสนาม
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;

  return { x, y };
};

export const useInteractionManager = (
  players,
  setPlayers,
  ballLogic,
  drawingLogic,
  setHistory,
  setFuture
) => {
  // สถานะการกระทำปัจจุบัน
  const [currentAction, setCurrentAction] = useState(null);

  // สถานะเมื่อมีอนิเมชันกำลังทำงานอยู่
  const [isAnimating, setIsAnimating] = useState(false);

  // Map สำหรับเก็บข้อมูล pointer ที่กำลังทำงานอยู่
  const activePointersRef = useRef(new Map());

  // ฟังก์ชันสำหรับตรวจสอบว่าคลิกที่ผู้เล่นหรือไม่
  const isClickingPlayer = useCallback((id) => {
    return players.some(player => player.id === id);
  }, [players]);

  // ฟังก์ชันรีเซ็ตฉุกเฉินสำหรับการส่งบอล
  const resetBallPassState = useCallback(() => {
    setCurrentAction(null);
    activePointersRef.current.clear();
    ballLogic.cancelBallPass && ballLogic.cancelBallPass();
  }, [ballLogic]);

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
          // เริ่มลากผู้เล่น (ไม่ว่าจะถือบอลหรือไม่)
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
  }, [players, ballLogic, drawingLogic, isAnimating, resetBallPassState, isClickingPlayer, setHistory, setFuture]);

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

  // จัดการเมื่อ pointer ถูกยกเลิก (เช่น ออกนอกพื้นที่)
  const handlePointerCancel = useCallback(handlePointerUp, [handlePointerUp]);

  return {
    currentAction,
    setCurrentAction,
    isAnimating,
    setIsAnimating,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    resetBallPassState
  };
};