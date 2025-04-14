import { useState, useEffect, useCallback } from 'react';

// Hook สำหรับการจัดการอนิเมชั่นและการตรวจจับการดังก์
export const useHoopLogic = (ball) => {
  // State สำหรับเก็บข้อมูลการดังก์ล่าสุด
  const [lastDunk, setLastDunk] = useState(null);
  
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
  }, [lastDunk]);
  
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
  
  return { 
    lastDunk,
    hoopPositions,
    handleDunk
  };
};

export default useHoopLogic;