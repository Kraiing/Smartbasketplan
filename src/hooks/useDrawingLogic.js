import { useState, useRef, useCallback } from 'react';

export const useDrawingLogic = () => {
  // State สำหรับการวาดเส้น
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  
  // Refs
  const isDrawingRef = useRef(false);
  const lineIdRef = useRef(1);
  const pathPointsRef = useRef([]);
  const lastTimeRef = useRef(0);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  
  // ฟังก์ชันสำหรับทำให้เส้นเรียบมากขึ้นด้วยการใช้เทคนิคแบบผสม
  const smoothPoints = (points) => {
    if (!points || points.length < 3) return points;
    
    // ขั้นตอนที่ 1: กรองจุดที่อยู่ใกล้กันเกินไปออก
    const filteredPoints = [points[0]]; // เริ่มต้นด้วยจุดแรกเสมอ
    let lastPoint = points[0];
    
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const distance = Math.sqrt(
        Math.pow(point.x - lastPoint.x, 2) + 
        Math.pow(point.y - lastPoint.y, 2)
      );
      
      // เพิ่มจุดเมื่อมีระยะห่างมากพอ
      if (distance > 0.8 || i === points.length - 1) { // เพิ่มจุดสุดท้ายเสมอ
        filteredPoints.push(point);
        lastPoint = point;
      }
    }
    
    // ถ้ามีจุดน้อยเกินไป ก็คืนค่าจุดที่กรองแล้ว
    if (filteredPoints.length < 3) return filteredPoints;
    
    // ขั้นตอนที่ 2: ใช้ Chaikin's Algorithm สำหรับทำให้เส้นโค้งเรียบ
    // (เทคนิคนี้จะสร้างจุดใหม่ระหว่างจุดที่มีอยู่เพื่อให้มีความโค้งมนมากขึ้น)
    const iterations = 1; // จำนวนรอบการทำซ้ำ (มากรอบ = สมูทมากขึ้น แต่จะเสียรายละเอียดต้นฉบับ)
    let smoothedPoints = [...filteredPoints];
    
    for (let iter = 0; iter < iterations; iter++) {
      const newPoints = [];
      
      // เก็บจุดแรกไว้เสมอ
      newPoints.push(smoothedPoints[0]);
      
      // ใช้ algorithm สร้างจุดใหม่ระหว่างจุดเดิม
      for (let i = 0; i < smoothedPoints.length - 1; i++) {
        const p0 = smoothedPoints[i];
        const p1 = smoothedPoints[i + 1];
        
        // จุดใหม่ที่ 1: ระยะ 1/4 จากจุดแรกไปจุดที่สอง
        const q0 = {
          x: p0.x * 0.75 + p1.x * 0.25,
          y: p0.y * 0.75 + p1.y * 0.25
        };
        
        // จุดใหม่ที่ 2: ระยะ 3/4 จากจุดแรกไปจุดที่สอง
        const q1 = {
          x: p0.x * 0.25 + p1.x * 0.75,
          y: p0.y * 0.25 + p1.y * 0.75
        };
        
        newPoints.push(q0);
        newPoints.push(q1);
      }
      
      // เก็บจุดสุดท้ายไว้เสมอ
      newPoints.push(smoothedPoints[smoothedPoints.length - 1]);
      
      smoothedPoints = newPoints;
    }
    
    return smoothedPoints;
  };
  
  // เริ่มวาดเส้น
  const startDrawing = useCallback((x, y) => {
    // เก็บจุดเริ่มต้น
    const initialPoint = { x, y };
    pathPointsRef.current = [initialPoint];
    isDrawingRef.current = true;
    lastTimeRef.current = Date.now();
    lastPositionRef.current = initialPoint;
    
    // สร้างเส้นใหม่
    const newLine = {
      id: lineIdRef.current,
      path: [initialPoint],
      color: 'black', // เปลี่ยนเป็นสีดำตามต้องการ
      showArrow: true
    };
    
    setCurrentLine(newLine);
    lineIdRef.current += 1;
    
    return true;
  }, []);
  
  // ดำเนินการวาดเส้น
  const continueDrawing = useCallback((x, y) => {
    if (!isDrawingRef.current) {
      return;
    }
    
    // ป้องกันการเรียกบ่อยเกินไปด้วยการจำกัดความถี่ (throttling)
    const now = Date.now();
    if (now - lastTimeRef.current < 16) { // ประมาณ 60fps
      return;
    }
    lastTimeRef.current = now;
    
    // เพิ่มจุดใหม่
    const newPoint = { x, y };
    
    // ตรวจสอบระยะห่างจากจุดสุดท้าย
    const lastPoint = lastPositionRef.current;
    const distance = Math.sqrt(
      Math.pow(newPoint.x - lastPoint.x, 2) + 
      Math.pow(newPoint.y - lastPoint.y, 2)
    );
    
    // เพิ่มจุดเมื่อมีระยะห่างมากพอ
    if (distance > 0.5) {
      pathPointsRef.current = [...pathPointsRef.current, newPoint];
      lastPositionRef.current = newPoint;
      
      // อัพเดตเส้นปัจจุบัน
      setCurrentLine(prev => {
        if (!prev) return {
          id: lineIdRef.current - 1,
          path: [...pathPointsRef.current],
          color: 'black', // เปลี่ยนเป็นสีดำตามต้องการ
          showArrow: true
        };
        
        return {
          ...prev,
          path: [...pathPointsRef.current]
        };
      });
    }
  }, []);
  
  // จบการวาดเส้น
  const finishDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    
    // บันทึกเส้นเฉพาะเมื่อมีจุดมากกว่า 1 จุด
    if (pathPointsRef.current.length > 1) {
      // ปรับแต่งและทำให้เส้นเรียบมากขึ้นก่อนบันทึก
      const smoothedPoints = smoothPoints([...pathPointsRef.current]);
      
      const lineToSave = {
        id: (currentLine && currentLine.id) || lineIdRef.current - 1,
        path: smoothedPoints,
        color: 'black', // เปลี่ยนเป็นสีดำตามต้องการ
        showArrow: true
      };
      
      setLines(prev => [...prev, lineToSave]);
    }
    
    // รีเซ็ต state
    setCurrentLine(null);
    isDrawingRef.current = false;
    pathPointsRef.current = [];
    lastPositionRef.current = { x: 0, y: 0 };
  }, [currentLine]);
  
  // ลบเส้นที่เลือก
  const deleteLine = useCallback((lineId) => {
    setLines(prev => prev.filter(line => line.id !== lineId));
  }, []);
  
  // ลบเส้นทั้งหมด
  const clearAllLines = useCallback(() => {
    if (lines.length > 0) {
      setLines([]);
    }
  }, [lines]);
  
  // ตรวจสอบว่ากำลังวาดเส้นอยู่หรือไม่
  const isDrawing = useCallback(() => {
    return isDrawingRef.current;
  }, []);
  
  return {
    lines,
    setLines,
    currentLine,
    startDrawing,
    continueDrawing,
    finishDrawing,
    deleteLine,
    clearAllLines,
    isDrawing
  };
};