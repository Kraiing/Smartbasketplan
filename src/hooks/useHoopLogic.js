import { useState, useEffect, useCallback, useRef } from 'react';

// Hook สำหรับการจัดการอนิเมชั่นและการตรวจจับการดังก์
export const useHoopLogic = (ball, players, setBall, setPlayers) => {
  // State สำหรับเก็บข้อมูลการดังก์ล่าสุด
  const [lastDunk, setLastDunk] = useState(null);
  // Ref เพื่อเก็บ timeout ของการรีเซ็ตลูกบอล
  const resetTimeoutRef = useRef(null);

  // กำหนดตำแหน่งของแป้นบาสเกตบอลทั้งสองข้าง
  const hoopPositions = {
    left: { x: 10, y: 50 },   // ตำแหน่งด้านซ้าย ขยับมาทางขวา 1mm
    right: { x: 86, y: 50 }   // ตำแหน่งด้านขวา ขยับมาทางขวา 23mm
  };

  // ฟังก์ชันเช็คระยะห่างระหว่างวัตถุสองตำแหน่ง
  const getDistance = (x1, y1, x2, y2) => {
    return Math.sqrt(
      Math.pow(x1 - x2, 2) +
      Math.pow(y1 - y2, 2)
    );
  };

  // ฟังก์ชันสำหรับตรวจสอบการดังก์
  const checkForDunk = useCallback((ballX, ballY, hoopPosition) => {
    const distance = getDistance(ballX, ballY, hoopPosition.x, hoopPosition.y);
    const threshold = 7; // รัศมีในการตรวจจับ (%)
    return distance < threshold;
  }, []);

  // ฟังก์ชันสำหรับรีเซ็ตลูกบอลหลังจากการดังก์
  const resetBallToPlayer = useCallback((side) => {
    // ยกเลิก timeout เดิมถ้ามี
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }

    // กำหนดทีมที่จะได้ลูกบอล
    const targetTeam = side === 'left' ? 'A' : 'B'; // ด้านซ้าย = ทีมแดง (A), ด้านขวา = ทีมขาว (B)
    
    // ค้นหาผู้เล่นในทีมที่กำหนด
    const teamPlayers = players.filter(p => p.team === targetTeam);
    
    // ถ้าไม่มีผู้เล่นในทีม
    if (teamPlayers.length === 0) {
      console.log(`No players in team ${targetTeam} to reset ball to`);
      return;
    }
    
    // เลือกผู้เล่นแบบสุ่มจากทีมที่กำหนด
    const randomIndex = Math.floor(Math.random() * teamPlayers.length);
    const targetPlayer = teamPlayers[randomIndex];
    
    console.log(`Resetting ball to player ${targetPlayer.id} in team ${targetTeam}`);
    
    // อัพเดตสถานะลูกบอลให้ไปอยู่กับผู้เล่นที่เลือก
    setBall({
      x: targetPlayer.x,
      y: targetPlayer.y + 2, // เพิ่มค่า y เล็กน้อยเพื่อให้ลูกบอลอยู่ด้านล่างของผู้เล่น
      holderId: targetPlayer.id
    });
    
    // อัพเดตสถานะผู้เล่นให้ถือลูกบอล
    setPlayers(prev => 
      prev.map(p => ({
        ...p,
        hasBall: p.id === targetPlayer.id
      }))
    );
  }, [players, setBall, setPlayers]);

  // ฟังก์ชัน callback เมื่อมีการดังก์
  const handleDunk = useCallback((side) => {
    // ป้องกันการดังก์ซ้ำในเวลาใกล้เคียงกัน
    if (lastDunk && Date.now() - lastDunk.time < 1000) {
      return; // ยังไม่เล่นอนิเมชั่นซ้ำถ้าเพิ่งมีการดังก์
    }

    setLastDunk({
      side: side,
      time: Date.now()
    });

    // สร้างเสียงดังก์ (ถ้าต้องการ)
    try {
      const audio = new Audio('/dunk-sound.mp3');
      audio.volume = 0.6;
      audio.play().catch(e => console.log('Audio play error:', e));
    } catch (error) {
      console.log('Error playing dunk sound:', error);
    }

    // ตั้งเวลารอ 1.5 วินาที แล้วค่อยรีเซ็ตลูกบอลไปที่ผู้เล่น
    resetTimeoutRef.current = setTimeout(() => {
      resetBallToPlayer(side);
    }, 1500); // รอ 1.5 วินาที
  }, [lastDunk, resetBallToPlayer]);

  // ตรวจสอบการชนกับแป้นบาสเมื่อลูกบอลเคลื่อนที่
  useEffect(() => {
    if (!ball || ball.holderId) return; // ไม่ตรวจสอบถ้าบอลไม่เคลื่อนที่หรือมีคนถือบอลอยู่

    // ตรวจสอบระยะห่างจากแป้นทั้งสองข้าง
    const isDunkLeft = checkForDunk(ball.x, ball.y, hoopPositions.left);
    const isDunkRight = checkForDunk(ball.x, ball.y, hoopPositions.right);

    if (isDunkLeft) {
      // ชนกับแป้นด้านซ้าย
      handleDunk('left');
    } else if (isDunkRight) {
      // ชนกับแป้นด้านขวา
      handleDunk('right');
    }
  }, [ball, checkForDunk, handleDunk]);

  // ล้าง timeout เมื่อ component unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  return {
    lastDunk,
    hoopPositions,
    handleDunk,
    resetBallToPlayer
  };
};

export default useHoopLogic;