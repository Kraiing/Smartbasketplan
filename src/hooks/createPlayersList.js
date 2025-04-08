import { useCallback } from 'react';

export const useCreatePlayersList = (activePositions, playerPositions) => {
  const createPlayersList = useCallback(() => {
    const players = [];
    
    // เพิ่มผู้เล่นทีมแดง
    if (activePositions.red) {
      Object.entries(activePositions.red || {}).forEach(([position, isActive]) => {
        if (isActive && playerPositions.red[position]) {
          players.push({...playerPositions.red[position]});
        }
      });
    }
    
    // เพิ่มผู้เล่นทีมขาว
    if (activePositions.white) {
      Object.entries(activePositions.white || {}).forEach(([position, isActive]) => {
        if (isActive && playerPositions.white[position]) {
          players.push({...playerPositions.white[position]});
        }
      });
    }
    
    return players;
  }, [activePositions, playerPositions]);
  
  return createPlayersList;
};

export default useCreatePlayersList;