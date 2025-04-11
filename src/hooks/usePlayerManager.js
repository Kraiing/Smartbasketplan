import { useCallback, useRef } from 'react';
import * as uuid from 'uuid';
const uuidv4 = uuid.v4;

export const usePlayerManager = (players, setPlayers, ballLogic, drawingLogic, setHistory, setFuture) => {
  // ตำแหน่งดั้งเดิมของผู้เล่นสำหรับรีเซ็ต
  const initialPlayerPositions = useRef([...players]);

  // รีเซ็ตตำแหน่งผู้เล่นให้กลับไปที่ตำแหน่งเริ่มต้น
  const resetToInitialPositions = useCallback(() => {
    setHistory(prev => [...prev, {
      players: [...players],
      ball: {...ballLogic.ball}
    }]);

    setPlayers(initialPlayerPositions.current);

    // รีเซ็ตบอลให้กลับไปอยู่กับผู้เล่นคนแรกของทีม A
    const firstPlayerA = initialPlayerPositions.current.find(p => p.team === 'A' && p.number === 1);
    if (firstPlayerA) {
      setPlayers(prev => prev.map(p => ({
        ...p,
        hasBall: p.id === firstPlayerA.id
      })));

      ballLogic.setBall({
        x: firstPlayerA.x,
        y: firstPlayerA.y + 2, // เพิ่มค่า y อีก 2 เพื่อให้ลูกบอลอยู่ด้านล่างของตัวผู้เล่น
        holderId: firstPlayerA.id
      });
    }

    // ลบเส้นทั้งหมดเมื่อรีเซ็ต
    drawingLogic.setLines([]);

    setFuture([]);
  }, [players, setPlayers, ballLogic, drawingLogic, setHistory, setFuture]);

  // เพิ่มผู้เล่นใหม่
  const addPlayer = useCallback((team) => {
    const newPlayerId = uuidv4();
    const lastPlayerNumber = Math.max(...players.filter(p => p.team === team).map(p => p.number), 0);
    const newPlayerNumber = lastPlayerNumber + 1;

    // กำหนดตำแหน่งเริ่มต้นตามทีม
    const startX = team === 'A' ? 25 : 75;
    const startY = 50;

    const newPlayer = {
      id: newPlayerId,
      x: startX,
      y: startY,
      team,
      number: newPlayerNumber,
      position: `P${newPlayerNumber}`, // เพิ่ม position สำหรับแสดงผล
      hasBall: false
    };

    setHistory(prev => [...prev, {
      players: [...players]
    }]);

    setPlayers(prev => [...prev, newPlayer]);

    setFuture([]);
  }, [players, setHistory, setFuture]);

  // ลบผู้เล่น
  const removePlayer = useCallback((playerId) => {
    console.log(`Attempting to remove player with ID: ${playerId}`);
    const playerToRemove = players.find(p => p.id === playerId);

    // ถ้าไม่พบผู้เล่น หรือผู้เล่นมีบอลอยู่และเป็นผู้เล่นคนสุดท้ายในทีม ไม่อนุญาตให้ลบ
    if (!playerToRemove) {
      console.warn(`Player with ID ${playerId} not found.`);
      return;
    }

    const teamPlayers = players.filter(p => p.team === playerToRemove.team);
    console.log(`Found ${teamPlayers.length} players in team ${playerToRemove.team}`);

    if (playerToRemove.hasBall && teamPlayers.length === 1) {
      // ถ้าผู้เล่นมีบอลและเป็นคนสุดท้ายในทีม ไม่อนุญาตให้ลบ
      console.warn(`Cannot remove the last player with ball in team ${playerToRemove.team}`);
      return;
    }

    setHistory(prev => [...prev, {
      players: [...players],
      ball: {...ballLogic.ball}
    }]);

    // ถ้าผู้เล่นที่จะลบมีบอล ให้ส่งบอลไปให้ผู้เล่นคนอื่นในทีมเดียวกัน
    if (playerToRemove.hasBall) {
      const otherTeamPlayer = players.find(p => p.team === playerToRemove.team && p.id !== playerId);

      if (otherTeamPlayer) {
        // ส่งบอลไปให้ผู้เล่นคนอื่นในทีมเดียวกัน
        ballLogic.setBall({
          x: otherTeamPlayer.x,
          y: otherTeamPlayer.y,
          holderId: otherTeamPlayer.id
        });

        // อัปเดตข้อมูลผู้เล่น
        setPlayers(prev =>
          prev
            .filter(p => p.id !== playerId)
            .map(p => ({
              ...p,
              hasBall: p.id === otherTeamPlayer.id
            }))
        );
      }
    } else {
      // ลบผู้เล่นโดยไม่ต้องจัดการลูกบอล
      setPlayers(prev => prev.filter(p => p.id !== playerId));
    }

    setFuture([]);
  }, [players, setPlayers, ballLogic, setHistory, setFuture]);

  return {
    resetToInitialPositions,
    addPlayer,
    removePlayer
  };
};