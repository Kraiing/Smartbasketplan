import React from 'react';
import Switch from './Switch';

/**
 * คอมโพเนนต์จัดการตำแหน่งผู้เล่นสำหรับทีม
 *
 * @param {Object} props - คุณสมบัติของคอมโพเนนต์
 * @param {string} props.team - ชื่อทีม ("red" หรือ "white")
 * @param {Object} props.activePositions - ออบเจ็กต์แสดงตำแหน่งที่เปิดใช้งาน เช่น { PG: true, SG: true, ... }
 * @param {Function} props.onTogglePosition - ฟังก์ชันที่จะเรียกเมื่อเปลี่ยนสถานะตำแหน่ง
 * @param {Object} props.t - ออบเจ็กต์การแปลภาษา
 */
const TeamPositionsManager = ({ team, activePositions = {}, onTogglePosition, t, isIOS = false }) => {
  // รายการตำแหน่งผู้เล่น
  const positions = ['PG', 'SG', 'SF', 'PF', 'C'];

  // Default positions ในกรณีที่ activePositions ไม่มีข้อมูล
  const defaultPositions = {
    PG: true,
    SG: true,
    SF: true,
    PF: true,
    C: true
  };

  // ใช้ค่า default ถ้า activePositions ไม่มีค่าหรือเป็น null/undefined
  const positionsState = activePositions ? { ...defaultPositions, ...activePositions } : defaultPositions;
  
  // Debug เพื่อตรวจสอบค่า activePositions ที่ได้รับ
  console.log(`TeamPositionsManager for ${team} - activePositions:`, activePositions);

  const handleToggle = (position) => {
    if (onTogglePosition && typeof onTogglePosition === 'function') {
      // เพิ่มเอฟเฟคเสียงคลิก (ถ้ามีการรองรับ)
      try {
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(5); // สั่นเบาๆ 5ms
        }
      } catch (e) {
        // ไม่ต้องทำอะไรถ้าไม่รองรับ
      }

      // เรียกฟังก์ชัน toggle
      console.log(`TeamPositionsManager - Toggling: ${team} - ${position}`);

      // ลองใช้ try-catch เพื่อจับข้อผิดพลาดที่อาจเกิดขึ้น
      try {
        // MenuBar จะส่งฟังก์ชันที่รับเฉพาะ position และจัดการเรื่อง team เอง
        onTogglePosition(position);
        
        // Log เพื่อดีบัก
        console.log(`TeamPositionsManager - Toggle called for: ${team} ${position}, new state should be: ${!positionsState[position]}`);
      } catch (error) {
        console.error("Error in onTogglePosition:", error);
      }
    } else {
      console.warn("onTogglePosition is not a function or undefined");
    }
  };

  const handleTouchStart = (e) => {
    if (isIOS) {
      e.currentTarget.style.opacity = '0.7';
    }
  };

  const handleTouchEnd = (e) => {
    if (isIOS) {
      e.currentTarget.style.opacity = '1';
    }
  };

  // ฟังก์ชันคำนวณสีพื้นหลัง hover ตามทีม
  const getHoverColor = () => {
    return team === 'red' ? 'hover:bg-red-50' : 'hover:bg-blue-50';
  };

  return (
    <div className="px-3 py-2">
      <div className={`text-center font-bold py-1 border-b border-gray-200 mb-2 ${team === 'red' ? 'text-red-600' : 'text-blue-600'}`}>
        {team === 'red' ? t.teamRed : t.teamWhite}
      </div>

      <div className="space-y-1">
        {positions.map((position) => (
          <div
            key={position}
            className={`flex items-center justify-between p-2 rounded transition-colors duration-200 ${getHoverColor()} cursor-pointer`}
            onClick={() => handleToggle(position)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex items-center">
              <img
                src={team === 'red' ? '/red-player.png' : '/white-player.png'}
                alt={`${team} player`}
                className="w-6 h-6 mr-2"
                style={{
                  opacity: positionsState[position] ? 1 : 0.4,
                  transition: 'opacity 0.3s ease-in-out'
                }}
              />
              <div>
                <div className={`font-medium ${positionsState[position] ? '' : 'text-gray-400'}`}>{t.positions[position]}</div>
                <div className={`text-xs ${positionsState[position] ? 'text-gray-500' : 'text-gray-300'}`}>{t.positionNames[position]}</div>
              </div>
            </div>
            <div className="flex items-center">
              <span className={`text-xs mr-2 ${positionsState[position] ? 'text-blue-500' : 'text-gray-400'}`}>
                {positionsState[position] ? t.positionEnabled : ''}
              </span>
              <Switch
                checked={!!positionsState[position]}
                onChange={() => {
                  console.log(`Switch onChange triggered for ${team} ${position} - current value: ${positionsState[position]}`);
                  handleToggle(position);
                  
                  // เพิ่มการบังคับให้ re-render โดยใช้ setTimeout
                  setTimeout(() => {
                    console.log("Forcing UI update after switch toggle");
                  }, 0);
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamPositionsManager;