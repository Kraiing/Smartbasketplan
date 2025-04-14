import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook สำหรับจัดการการแสดง/ซ่อนเมนู
 * เมนูจะปรากฏเมื่อ:
 * 1. เมาส์เลื่อนไปด้านบนของหน้าจอ
 * 2. สัมผัสและลากลงจากด้านบนของหน้าจอ (บนอุปกรณ์ทัชสกรีน)
 * 
 * @param {number} threshold ระยะจากขอบบนของหน้าจอที่จะทำให้เมนูปรากฏ (หน่วยเป็นพิกเซล)
 * @param {number} hideDelay เวลาที่ต้องรอก่อนซ่อนเมนูอัตโนมัติหลังจากเมาส์ออกจากพื้นที่ (หน่วยเป็นมิลลิวินาที)
 * @param {boolean} initialState สถานะเริ่มต้นของเมนู (true = แสดง, false = ซ่อน)
 * @returns {object} ข้อมูลและฟังก์ชันสำหรับควบคุมการแสดงเมนู
 */
const useMenuVisibility = (threshold = 40, hideDelay = 1500, initialState = true) => {
  const [isVisible, setIsVisible] = useState(initialState);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // ตรวจสอบว่าเป็นอุปกรณ์ทัชสกรีนหรือไม่
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);
  
  // ฟังก์ชันตรวจสอบตำแหน่งเมาส์
  const handleMouseMove = useCallback((event) => {
    const mouseY = event.clientY;
    
    // แสดงเมนูเมื่อเมาส์อยู่ใกล้ด้านบนของหน้าจอ
    if (mouseY <= threshold) {
      setIsVisible(true);
    }
  }, [threshold]);
  
  // จัดการกับการเริ่มต้นสัมผัสหน้าจอ (เฉพาะอุปกรณ์ทัชสกรีน)
  const handleTouchStart = useCallback((event) => {
    // บันทึกตำแหน่ง Y เริ่มต้นเมื่อสัมผัสหน้าจอ
    if (event.touches && event.touches[0]) {
      setTouchStartY(event.touches[0].clientY);
    }
  }, []);
  
  // จัดการกับการเคลื่อนนิ้วบนหน้าจอ (เฉพาะอุปกรณ์ทัชสกรีน)
  const handleTouchMove = useCallback((event) => {
    if (event.touches && event.touches[0]) {
      const currentY = event.touches[0].clientY;
      const startY = touchStartY;
      
      // ถ้าเริ่มสัมผัสที่ตำแหน่งบนสุดของหน้าจอและลากลงมา
      if (startY <= threshold && currentY > startY) {
        const distance = currentY - startY;
        // ถ้าลากลงมาไกลพอ ให้แสดงเมนู
        if (distance > 20) {  // ต้องลากลงอย่างน้อย 20px
          setIsVisible(true);
        }
      }
    }
  }, [touchStartY, threshold]);
  
  // ฟังก์ชันบังคับให้แสดงหรือซ่อนเมนู
  const toggleMenu = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);
  
  // ฟังก์ชันบังคับให้แสดงเมนู
  const showMenu = useCallback(() => {
    setIsVisible(true);
  }, []);
  
  // ฟังก์ชันบังคับให้ซ่อนเมนู
  const hideMenu = useCallback(() => {
    setIsVisible(false);
  }, []);
  
  // จัดการกับการเข้าไปในพื้นที่เมนู
  const handleMenuEnter = useCallback(() => {
    setIsHovered(true);
  }, []);
  
  // จัดการกับการออกจากพื้นที่เมนู
  const handleMenuLeave = useCallback(() => {
    setIsHovered(false);
  }, []);
  
  // ฟังก์ชันซ่อนเมนูอัตโนมัติเมื่อไม่ได้ใช้งาน
  useEffect(() => {
    let hideTimeout;
    
    // ถ้าเมนูแสดงอยู่และเมาส์ไม่ได้อยู่เหนือเมนู ให้ตั้งเวลาเพื่อซ่อนเมนู
    if (isVisible && !isHovered) {
      hideTimeout = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);
    }
    
    // ล้างเวลาที่ตั้งไว้เมื่อ component unmount หรือเมื่อ dependencies เปลี่ยนแปลง
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [isVisible, isHovered, hideDelay]);
  
  // ลงทะเบียน event listeners เมื่อ component mount
  useEffect(() => {
    // ลงทะเบียน event listeners
    if (!isTouchDevice) {
      // บนอุปกรณ์ที่ใช้เมาส์ ให้ตรวจจับการเคลื่อนไหวของเมาส์
      document.addEventListener('mousemove', handleMouseMove);
    } else {
      // บนอุปกรณ์ทัชสกรีน ให้ตรวจจับการสัมผัส
      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchmove', handleTouchMove);
    }
    
    // ยกเลิกการลงทะเบียน event listeners เมื่อ component unmount
    return () => {
      if (!isTouchDevice) {
        document.removeEventListener('mousemove', handleMouseMove);
      } else {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, [handleMouseMove, handleTouchStart, handleTouchMove, isTouchDevice]);
  
  return {
    isVisible,
    isTouchDevice,
    handleMenuEnter,
    handleMenuLeave,
    toggleMenu,
    showMenu,
    hideMenu
  };
};

export default useMenuVisibility;