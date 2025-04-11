import { useState, useCallback } from 'react';

export const usePositionManager = (initialPositions, players, setPlayers, ballLogic) => {
  const [activePositions, setActivePositions] = useState(initialPositions || {
    red: {
      PG: true, SG: true, SF: true, PF: true, C: true
    },
    white: {
      PG: true, SG: true, SF: true, PF: true, C: true
    }
  });

  const togglePosition = useCallback((team, position) => {
    console.log(`togglePosition called with team: ${team}, position: ${position}`);

    // ตรวจสอบว่าเป็น team: "red", "white" หรือ "A", "B"
    // แปลงให้เป็น "A" หรือ "B" สำหรับใช้กับโค้ดที่มีอยู่แล้ว
    const internalTeam = team === "red" ? "A" : (team === "white" ? "B" : team);

    // ตรวจสอบว่า activePositions มีโครงสร้างถูกต้อง
    if (!activePositions || typeof activePositions !== 'object') {
      console.error("Invalid activePositions:", activePositions);
      return;
    }

    // ตรวจสอบว่า team มีอยู่ใน activePositions
    const teamKey = team === "red" || team === "white" ? team : (team === "A" ? "red" : "white");

    // ถ้าไม่มี key สำหรับทีมนี้ สร้างใหม่
    if (!activePositions[teamKey] || typeof activePositions[teamKey] !== 'object') {
      console.log(`Creating new activePositions entry for team: ${teamKey}`);
      setActivePositions(prev => ({
        ...prev,
        [teamKey]: {
          PG: true, SG: true, SF: true, PF: true, C: true
        }
      }));
      return; // ออกจากฟังก์ชันเพื่อให้ state update ก่อน
    }

    // ตรวจสอบว่าตำแหน่งที่ระบุมีอยู่หรือไม่
    if (activePositions[teamKey][position] === undefined) {
      console.log(`Position ${position} not found in team ${teamKey}, initializing`);
      setActivePositions(prev => ({
        ...prev,
        [teamKey]: {
          ...prev[teamKey],
          [position]: true
        }
      }));
      return; // ออกจากฟังก์ชันเพื่อให้ state update ก่อน
    }

    // โค้ดส่วนที่เกี่ยวกับลูกบอล
    // ตรวจสอบว่าเป็นการปิดตำแหน่งที่มีลูกบอลหรือไม่
    
    console.log(`Looking for player with position: ${position} in team: ${internalTeam}`);
    console.log("Available players:", players.map(p => `${p.id} (team:${p.team}, pos:${p.position})`).join(", "));
    
    // หาผู้เล่นจากตำแหน่งและทีมโดยตรง
    const player = players.find(p => p.team === internalTeam && p.position === position);
    
    // ถ้าไม่พบผู้เล่น ให้ใช้ ID ตามรูปแบบเดิม
    const teamLetter = internalTeam.toLowerCase();
    let positionNumber = 1;
    if (position === 'SG') positionNumber = 2;
    else if (position === 'SF') positionNumber = 3;
    else if (position === 'PF') positionNumber = 4;
    else if (position === 'C') positionNumber = 5;
    
    const playerId = player ? player.id : `${teamLetter}${positionNumber}`;
    
    // ถ้าเป็นการปิดตำแหน่ง และผู้เล่นนั้นมีลูกบอล
    if (activePositions[teamKey] && activePositions[teamKey][position] && player && player.hasBall) {
      // ต้องหาผู้เล่นคนอื่นในทีมเดียวกันที่ยังเปิดอยู่
      const teamPlayers = players.filter(p =>
        p.team === internalTeam &&
        p.id !== playerId &&
        activePositions[p.team === "A" ? "red" : "white"][p.position]
      );

      // ถ้าไม่มีผู้เล่นคนอื่นในทีมที่เปิดอยู่
      if (teamPlayers.length === 0) {
        const oppositeInternalTeam = internalTeam === 'A' ? 'B' : 'A';
        const oppositeTeamKey = internalTeam === 'A' ? 'white' : 'red';

        const oppositeTeamPlayers = players.filter(p =>
          p.team === oppositeInternalTeam &&
          activePositions[oppositeTeamKey] &&
          activePositions[oppositeTeamKey][p.position]
        );

        // ถ้ามีผู้เล่นในทีมตรงข้ามที่เปิดอยู่ ส่งบอลไปให้ผู้เล่นคนแรกของทีมตรงข้าม
        if (oppositeTeamPlayers.length > 0) {
          const newHolder = oppositeTeamPlayers[0];

          // ส่งบอลไปให้ผู้เล่นทีมตรงข้าม
          ballLogic.setBall({
            x: newHolder.x,
            y: newHolder.y,
            holderId: newHolder.id
          });

          // อัปเดตข้อมูลผู้เล่น
          setPlayers(prev => prev.map(p => ({
            ...p,
            hasBall: p.id === newHolder.id
          })));
        } else {
          // ไม่สามารถปิดตำแหน่งได้เพราะไม่มีที่จะส่งบอลไป
          console.warn("Cannot disable position: no player available to take the ball");
          return;
        }
      } else {
        // ส่งบอลไปให้ผู้เล่นคนแรกในทีมเดียวกันที่ยังเปิดอยู่
        const newHolder = teamPlayers[0];

        // ส่งบอลไปให้ผู้เล่นคนใหม่
        ballLogic.setBall({
          x: newHolder.x,
          y: newHolder.y,
          holderId: newHolder.id
        });

        // อัปเดตข้อมูลผู้เล่น
        setPlayers(prev => prev.map(p => ({
          ...p,
          hasBall: p.id === newHolder.id
        })));
      }
    }

    // อัปเดตสถานะตำแหน่งที่เปิดใช้งาน
    console.log(`Updating activePositions: ${teamKey}.${position} = ${!activePositions[teamKey][position]}`);
    setActivePositions(prev => ({
      ...prev,
      [teamKey]: {
        ...prev[teamKey],
        [position]: !prev[teamKey][position]
      }
    }));

  }, [activePositions, players, setPlayers, ballLogic]);

  return {
    activePositions,
    setActivePositions,
    togglePosition
  };
};