import { useState, useCallback } from 'react';

export const usePositionManager = (initialPositions, players, setPlayers, ballLogic, positionToPlayerId) => {
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
    
    if (player) {
      console.log(`Found player: ${player.id} with position ${position}`);
    } else {
      console.log(`No player found with position ${position} in team ${internalTeam}`);
      console.log("Players in this team:", 
        players.filter(p => p.team === internalTeam)
          .map(p => `${p.id} (pos:${p.position})`)
          .join(", ")
      );
    }
    
    // ใช้ positionToPlayerId เพื่อหา ID ของผู้เล่นจากตำแหน่ง
    let playerId;
    
    if (player) {
      // ถ้าพบผู้เล่น ใช้ ID ของผู้เล่นนั้น
      playerId = player.id;
    } else if (positionToPlayerId && positionToPlayerId[internalTeam] && positionToPlayerId[internalTeam][position]) {
      // ถ้ามีการกำหนด positionToPlayerId ให้ใช้ ID จากนั้น
      playerId = positionToPlayerId[internalTeam][position];
      console.log(`Using ID from positionToPlayerId: ${playerId}`);
    } else {
      // ถ้าไม่มีทั้งคู่ ให้สร้าง ID แบบเดิม
      const teamLetter = internalTeam.toLowerCase();
      let positionNumber = 1;
      if (position === 'SG') positionNumber = 2;
      else if (position === 'SF') positionNumber = 3;
      else if (position === 'PF') positionNumber = 4;
      else if (position === 'C') positionNumber = 5;
      
      playerId = `${teamLetter}${positionNumber}`;
      console.log(`Generated fallback ID: ${playerId}`);
    }
    
    // ถ้าเป็นการปิดตำแหน่ง และผู้เล่นนั้นมีลูกบอล (เราต้องการส่งบอลไปให้ผู้เล่นคนอื่น)
    console.log(`Checking if player has ball and position is being turned off: ${position}`);
    console.log(`Current position status: ${activePositions[teamKey][position]}, player with ball:`, player?.hasBall ? 'yes' : 'no');

    // ตรวจสอบว่าเราจะปิดตำแหน่งหรือเปิดตำแหน่ง
    const willTurnOff = activePositions[teamKey][position];
    
    // จัดการกับลูกบอลก่อนที่จะอัพเดท activePositions
    if (willTurnOff && player && player.hasBall) {
      // ต้องหาผู้เล่นคนอื่นในทีมเดียวกันที่ยังเปิดอยู่
      const teamPlayers = players.filter(p =>
        p.team === internalTeam &&
        p.id !== playerId &&
        activePositions[p.team === "A" ? "red" : "white"][p.position]
      );
      
      console.log(`Found ${teamPlayers.length} other players in team ${internalTeam} to pass the ball to`);

      // ถ้าไม่มีผู้เล่นคนอื่นในทีมที่เปิดอยู่
      if (teamPlayers.length === 0) {
        const oppositeInternalTeam = internalTeam === 'A' ? 'B' : 'A';
        const oppositeTeamKey = internalTeam === 'A' ? 'white' : 'red';

        const oppositeTeamPlayers = players.filter(p =>
          p.team === oppositeInternalTeam &&
          activePositions[oppositeTeamKey] &&
          activePositions[oppositeTeamKey][p.position]
        );
        
        console.log(`Found ${oppositeTeamPlayers.length} players in opposite team ${oppositeInternalTeam} to pass the ball to`);

        // ถ้ามีผู้เล่นในทีมตรงข้ามที่เปิดอยู่ ส่งบอลไปให้ผู้เล่นคนแรกของทีมตรงข้าม
        if (oppositeTeamPlayers.length > 0) {
          const newHolder = oppositeTeamPlayers[0];
          console.log(`Passing ball to player ${newHolder.id} in opposite team`);

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
    
    // อัพเดทสถานะก่อน เพื่อให้ UI แสดงผลทันที
    setActivePositions(prev => {
      // สร้าง state ใหม่โดยกำหนดค่าใหม่ให้กับตำแหน่งที่ต้องการจะเปลี่ยน
      const newState = {
        ...prev,
        [teamKey]: {
          ...prev[teamKey],
          [position]: !prev[teamKey][position]
        }
      };
      
      // แสดงข้อมูล state ใหม่เพื่อการดีบัก
      console.log("New activePositions state:", JSON.stringify(newState));
      
      // บันทึกการเปลี่ยนแปลงลงใน localStorage เพื่อให้สามารถดีบักได้
      try {
        localStorage.setItem('debug_activePositions', JSON.stringify(newState));
      } catch (e) {
        // ไม่ต้องทำอะไรถ้าไม่สามารถบันทึกลง localStorage ได้
      }
      
      // สำคัญ: ต้องส่งค่า state ใหม่กลับไป
      return newState;
    });
    
    // ทำให้แน่ใจว่า UI จะอัพเดท โดยใช้ setTimeout
    setTimeout(() => {
      console.log("Forcing UI update after position toggle");
    }, 0);

  }, [activePositions, players, setPlayers, ballLogic]);

  return {
    activePositions,
    setActivePositions,
    togglePosition
  };
};