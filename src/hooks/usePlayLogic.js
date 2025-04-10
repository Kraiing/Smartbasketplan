import { useState, useRef, useCallback } from 'react';
import { useDrawingLogic } from './useDrawingLogic';
import { useBallLogic } from './useBallLogic';
import { usePositionManager } from './usePositionManager';
import { usePlayerManager } from './usePlayerManager';
import { useHistoryManager } from './useHistoryManager';
import { useInteractionManager } from './useInteractionManager';

export const usePlayLogic = () => {
  // สถานะผู้เล่น
  const [players, setPlayers] = useState([
    // ทีม A (ฝั่งซ้าย/แดง)
    { id: 'a1', x: 25, y: 20, team: 'A', number: 1, position: 'PG', hasBall: true },
    { id: 'a2', x: 40, y: 30, team: 'A', number: 2, position: 'SG', hasBall: false },
    { id: 'a3', x: 25, y: 40, team: 'A', number: 3, position: 'SF', hasBall: false },
    { id: 'a4', x: 25, y: 60, team: 'A', number: 4, position: 'PF', hasBall: false },
    { id: 'a5', x: 25, y: 80, team: 'A', number: 5, position: 'C', hasBall: false },
  
    // ทีม B (ฝั่งขวา/ขาว)
    { id: 'b1', x: 75, y: 20, team: 'B', number: 1, position: 'PG', hasBall: false },
    { id: 'b2', x: 60, y: 30, team: 'B', number: 2, position: 'SG', hasBall: false },
    { id: 'b3', x: 75, y: 40, team: 'B', number: 3, position: 'SF', hasBall: false },
    { id: 'b4', x: 75, y: 60, team: 'B', number: 4, position: 'PF', hasBall: false },
    { id: 'b5', x: 75, y: 80, team: 'B', number: 5, position: 'C', hasBall: false }
  ]);

  // ค่าเริ่มต้นของตำแหน่งที่ใช้งาน
  const initialActivePositions = {
    red: {
      PG: true, SG: true, SF: true, PF: true, C: true
    },
    white: {
      PG: true, SG: true, SF: true, PF: true, C: true
    }
  };

  // Logic สำหรับการวาดเส้น
  const drawingLogic = useDrawingLogic();

  // Logic สำหรับการจัดการลูกบอล
  const ballLogic = useBallLogic(players, { x: 25, y: 20, holderId: 'a1' }, setPlayers);

  // การจัดการ history และ undo/redo
  const positionManager = usePositionManager(
    initialActivePositions, 
    players, 
    setPlayers, 
    ballLogic
  );

  // ใช้ setActivePositions จาก positionManager
  const historyManager = useHistoryManager(
    setPlayers, 
    ballLogic, 
    drawingLogic, 
    positionManager.setActivePositions
  );

  // การจัดการผู้เล่น
  const playerManager = usePlayerManager(
    players, 
    setPlayers, 
    ballLogic, 
    drawingLogic, 
    historyManager.setHistory, 
    historyManager.setFuture
  );
  
  // การจัดการการโต้ตอบกับผู้ใช้
  const interactionManager = useInteractionManager(
    players, 
    setPlayers, 
    ballLogic, 
    drawingLogic, 
    historyManager.setHistory, 
    historyManager.setFuture
  );

  // รวม logic ทั้งหมดแล้ว return
  return {
    // Player และ Position
    players,
    setPlayers,
    activePositions: positionManager.activePositions,
    setActivePositions: positionManager.setActivePositions,
    togglePosition: positionManager.togglePosition,
    
    // Player Management
    resetToInitialPositions: playerManager.resetToInitialPositions,
    addPlayer: playerManager.addPlayer,
    removePlayer: playerManager.removePlayer,
    
    // History Management
    history: historyManager.history,
    future: historyManager.future,
    setHistory: historyManager.setHistory,
    setFuture: historyManager.setFuture,
    undo: historyManager.undo,
    redo: () => historyManager.redo(interactionManager.isAnimating),
    
    // Interaction Management
    currentAction: interactionManager.currentAction,
    setCurrentAction: interactionManager.setCurrentAction,
    isAnimating: interactionManager.isAnimating,
    setIsAnimating: interactionManager.setIsAnimating,
    handlePointerDown: interactionManager.handlePointerDown,
    handlePointerMove: interactionManager.handlePointerMove,
    handlePointerUp: interactionManager.handlePointerUp,
    handlePointerCancel: interactionManager.handlePointerCancel,
    resetBallPassState: interactionManager.resetBallPassState,
    
    // Raw objects
    ball: ballLogic.ball,
    passLine: ballLogic.passLine,
    currentLine: drawingLogic.currentLine,
    lines: drawingLogic.lines,
    
    // Functions
    deleteLine: drawingLogic.deleteLine,
    clearAllLines: drawingLogic.clearAllLines,
    
    // Full modules
    drawingLogic,
    ballLogic
  };
};