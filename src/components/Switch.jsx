import React, { useEffect, useRef } from 'react';

/**
 * ปุ่มเปิด/ปิดในสไตล์ iOS ที่มีอนิเมชั่นเรียบเนียน
 *
 * @param {Object} props - คุณสมบัติของคอมโพเนนต์
 * @param {boolean} props.checked - สถานะของสวิตช์ (true = เปิด, false = ปิด)
 * @param {Function} props.onChange - ฟังก์ชันที่จะเรียกเมื่อสถานะเปลี่ยน
 * @param {boolean} props.disabled - กำหนดว่าสวิตช์สามารถใช้งานได้หรือไม่
 */
const Switch = ({ checked, onChange, disabled = false }) => {
  const switchRef = useRef(null);
  const knobRef = useRef(null);

  // อัพเดตอนิเมชั่นเมื่อสถานะเปลี่ยน
  useEffect(() => {
    if (!switchRef.current || !knobRef.current) return;

    console.log(`Switch effect triggered with checked=${checked}`);
    
    const switchElem = switchRef.current;
    const knobElem = knobRef.current;

    if (checked) {
      // อนิเมชั่นตอนเปิด
      switchElem.style.backgroundColor = '#3b82f6'; // bg-blue-500
      knobElem.style.transform = 'translateX(18px)';
      switchElem.style.boxShadow = '0 0 3px rgba(59, 130, 246, 0.5)';

      // เพิ่มเอฟเฟกต์เรืองแสงตอนเปิด
      knobElem.style.boxShadow = '0 0 2px 1px rgba(59, 130, 246, 0.5)';

      // เพิ่มอนิเมชันขยับเล็กน้อย
      setTimeout(() => {
        if (knobRef.current) {
          knobRef.current.style.transform = 'translateX(19px)';
          setTimeout(() => {
            if (knobRef.current) {
              knobRef.current.style.transform = 'translateX(18px)';
            }
          }, 150);
        }
      }, 50);
    } else {
      // อนิเมชั่นตอนปิด
      switchElem.style.backgroundColor = '#d1d5db'; // bg-gray-300
      knobElem.style.transform = 'translateX(0)';
      switchElem.style.boxShadow = 'none';
      knobElem.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.2)';

      // เพิ่มอนิเมชันขยับเล็กน้อย
      setTimeout(() => {
        if (knobRef.current) {
          knobRef.current.style.transform = 'translateX(1px)';
          setTimeout(() => {
            if (knobRef.current) {
              knobRef.current.style.transform = 'translateX(0)';
            }
          }, 150);
        }
      }, 50);
    }
  }, [checked]);

  const handleClick = () => {
    if (!disabled) {
      // เพิ่มเอฟเฟคเมื่อคลิก
      if (knobRef.current) {
        // เอฟเฟคกระดอนเล็กน้อยตอนคลิก
        knobRef.current.style.transform = checked
          ? 'translateX(18px) scale(0.9)'
          : 'translateX(0) scale(0.9)';

        // คืนค่ากลับหลังจาก 100ms
        setTimeout(() => {
          if (knobRef.current) {
            knobRef.current.style.transform = checked
              ? 'translateX(18px) scale(1)'
              : 'translateX(0) scale(1)';
          }
        }, 100);
      }

      // เรียกฟังก์ชันเปลี่ยนสถานะ
      console.log(`Switch: changing state from ${checked} to ${!checked}`);
      onChange(!checked);
    }
  };

  return (
    <div
      ref={switchRef}
      className={`relative inline-block w-11 h-6 rounded-full cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{
        backgroundColor: checked ? '#3b82f6' : '#d1d5db',
        transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        boxShadow: checked ? '0 0 4px 1px rgba(59, 130, 246, 0.5)' : 'none'
      }}
      onClick={handleClick}
    >
      <span
        ref={knobRef}
        className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow"
        style={{
          transform: checked ? 'translateX(18px)' : 'translateX(0)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: checked
            ? '0 0 2px 1px rgba(59, 130, 246, 0.5), 0 1px 3px rgba(0, 0, 0, 0.1)'
            : '0 1px 2px rgba(0, 0, 0, 0.2)'
        }}
      />
    </div>
  );
};

export default Switch;