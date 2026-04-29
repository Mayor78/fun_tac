import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { GAME_MODES } from '../lib/game';

export function useGameRoom(gameId, myRole, setMyRole, myName) {
  const store = useGameStore();

  useEffect(() => {
    if (!gameId) return;
    const unsubscribe = store.initGame(gameId, myName, myRole);
    return () => unsubscribe();
  }, [gameId, myName, myRole]);

  // Sync role back to parent if needed
  useEffect(() => {
    if (store.myRole && store.myRole !== myRole) {
      setMyRole(store.myRole);
    }
  }, [store.myRole, myRole, setMyRole]);

  return {
    game: store.game,
    scores: store.scores,
    error: store.error,
    resetting: store.resetting,
    showResultModal: store.showResultModal,
    resultMessage: store.resultMessage,
    gameEnded: store.gameEnded,
    gameMode: store.game?.gameMode || GAME_MODES.CLASSIC,
    timeRemaining: store.game?.timeRemaining || 60,
    timeBank: store.game?.timeBank || 0,
    showPowerUpModal: false, // Power-up logic can be added to store later
    currentPowerUp: null,
    isMyTurn: store.myRole === store.game?.currentTurn && store.game?.status === 'playing' && !store.gameEnded,
    board: Array.isArray(store.game?.board) ? store.game.board : Array((store.game?.boardSize || 3) * (store.game?.boardSize || 3)).fill(null),
    moveHistory: store.game?.moveHistory || { X: [], O: [] },
    handleMove: store.handleMove,
    handlePlayAgain: store.handlePlayAgain,
    handleLeave: store.handleLeave,
    handlePowerUpUse: () => {},
    handlePurchase: () => {},
    closePowerUpModal: () => {}
  };
}