import React from 'react';

const Player = ({ player, onPointerDown }) => {
  // ตรวจสอบว่าเป็นอุปกรณ์ iOS หรือไม่
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // เลือกรูปภาพตามทีม
  const imgSrc = player.team === 'red' ? '/red-player.png' : '/white-player.png';
  
  const handlePlayerPointerDown = (e) => {
    // ใช้ preventDefault เพื่อป้องกันพฤติกรรมปกติโดยไม่ขัดขวางการส่งต่อเหตุการณ์
    e.preventDefault();
    
    // เรียกใช้ callback ที่ส่งมาจาก parent
    if (onPointerDown) {
      onPointerDown(e);
    }
  };
  
  // สำหรับอุปกรณ์ที่ไม่รองรับ pointer events
  const handleTouchStart = (e) => {
    // ป้องกันในกรณีที่รองรับทั้ง touch และ pointer events
    if (window.PointerEvent) {
      return;
    }
    
    if (e.touches && e.touches[0]) {
      const touch = e.touches[0];
      const simulatedEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        pointerId: `touch-${Date.now()}-${player.id}`,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation()
      };
      
      if (onPointerDown) {
        onPointerDown(simulatedEvent);
      }
    }
  };
  
  return (
    <div className="absolute player-container" style={{
      left: `${player.x}%`,
      top: `${player.y}%`,
      zIndex: 20,
      transform: 'translate(-50%, -50%)',
      touchAction: "manipulation", // เพิ่ม touch-action เพื่อรองรับการแตะหลายนิ้ว
      pointerEvents: 'auto', // เปิด pointer events เพื่อให้สามารถแตะและลากได้
      cursor: 'pointer',
      // เพิ่ม hardware acceleration
      willChange: "transform, top, left",
      WebkitBackfaceVisibility: "hidden"
    }}>
      {/* แสดงตำแหน่ง (PG, SG, SF, PF, C) */}
      <div 
        className="absolute bg-black bg-opacity-70 text-white text-xs px-1 rounded-sm"
        style={{
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '2px',
          zIndex: 26, // Z-index สูงกว่าลูกบอล
          // ปรับขนาดตัวอักษรบน iOS
          fontSize: isIOS ? '0.65rem' : '0.75rem'
        }}
      >
        {player.position || ''}
      </div>
      
      <img
        src={imgSrc}
        alt={player.team}
        className={`player-img ${player.hasBall ? 'player-has-ball' : ''}`}
        style={{
          cursor: 'pointer',
          width: '6vmin',
          height: 'auto',
          filter: player.hasBall ? 'drop-shadow(0 0 3px yellow)' : 'none',
          pointerEvents: 'auto', // เปิด pointer events เพื่อให้สามารถแตะและลากได้
          touchAction: "manipulation", // เพิ่ม touch-action เพื่อรองรับการแตะหลายนิ้ว
          // เพิ่ม hardware acceleration
          willChange: "transform",
          WebkitBackfaceVisibility: "hidden"
        }}
        onPointerDown={handlePlayerPointerDown}
        onTouchStart={handleTouchStart}
        draggable="false" // ป้องกันการลากรูปภาพปกติ
      />
    </div>
  );
};

export default Player;