import { useState, useCallback } from 'react';

export const useHistoryManager = (setPlayers, ballLogic, drawingLogic, setActivePositions) => {
  // ประวัติการกระทำ (สำหรับ undo)
  const [history, setHistory] = useState([]);

  // ประวัติการกระทำในอนาคต (สำหรับ redo)
  const [future, setFuture] = useState([]);

  // ย้อนกลับการกระทำ (Undo)
  const undo = useCallback(() => {
    if (history.length === 0) return;

    const lastState = history[history.length - 1];

    setFuture(prev => [
      {
        players: [...(lastState.players || [])],
        ball: lastState.ball ? {...lastState.ball} : undefined,
        lines: lastState.lines ? [...lastState.lines] : undefined,
        activePositions: lastState.activePositions ? { ...lastState.activePositions } : undefined
      },
      ...prev
    ]);

    if (lastState.players) setPlayers(lastState.players);
    if (lastState.ball) ballLogic.setBall(lastState.ball);
    if (lastState.lines) drawingLogic.setLines(lastState.lines);
    if (lastState.activePositions) setActivePositions(lastState.activePositions);

    setHistory(prev => prev.slice(0, -1));
  }, [history, setHistory, future, setFuture, setPlayers, ballLogic, drawingLogic, setActivePositions]);

  // ทำซ้ำการกระทำ (Redo)
  const redo = useCallback((isAnimating) => {
    // ไม่อนุญาตให้มีการโต้ตอบระหว่างที่มีอนิเมชันทำงานอยู่
    if (isAnimating) return;

    if (future.length === 0) return;

    const nextState = future[0];

    setHistory(prev => [
      ...prev,
      {
        players: nextState.players ? [...nextState.players] : undefined,
        ball: nextState.ball ? {...nextState.ball} : undefined,
        lines: nextState.lines ? [...nextState.lines] : undefined,
        activePositions: nextState.activePositions ? { ...nextState.activePositions } : undefined
      }
    ]);

    if (nextState.players) setPlayers(nextState.players);
    if (nextState.ball) ballLogic.setBall(nextState.ball);
    if (nextState.lines) drawingLogic.setLines(nextState.lines);
    if (nextState.activePositions) setActivePositions(nextState.activePositions);

    setFuture(prev => prev.slice(1));
  }, [future, setFuture, history, setHistory, setPlayers, ballLogic, drawingLogic, setActivePositions]);

  return {
    history,
    setHistory,
    future,
    setFuture,
    undo,
    redo
  };
};