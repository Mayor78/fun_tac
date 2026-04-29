import { create } from 'zustand';
import { 
  subscribeToGame, 
  makeOnlineMove, 
  resetGame, 
  leaveGame, 
  joinGame 
} from '../lib/game';
import { getGameResult, getPlayerId } from '../utils/gameLogic';
import toast from 'react-hot-toast';

export const useGameStore = create((set, get) => ({
  game: null,
  gameId: null,
  scores: { X: 0, O: 0, draw: 0 },
  myRole: null,
  myName: 'Player',
  timeRemaining: 60,
  timerId: null,
  gameEnded: false,
  error: null,
  resetting: false,
  showResultModal: false,
  resultMessage: { title: '', message: '', emoji: '', color: '' },

  // Initialize and subscribe
  initGame: (id, name, role) => {
    const { timerId } = get();
    if (timerId) clearInterval(timerId);

    set({ 
      gameId: id, 
      myName: name, 
      myRole: role, 
      error: null, 
      timeRemaining: 60,
      gameEnded: false,
      showResultModal: false 
    });
    
    // Join if no role
    if (!role) {
      joinGame(id, name)
        .then(({ role: joinedRole }) => set({ myRole: joinedRole }))
        .catch(e => set({ error: e.message }));
    }

    const unsubscribe = subscribeToGame(id, (data) => {
      if (!data) {
        set({ error: 'Game not found' });
        return;
      }

      const state = get();
      const currentEnded = state.gameEnded;
      const currentRole = state.myRole;
      
      const newState = {
        game: data,
        scores: data.scores || { X: 0, O: 0, draw: 0 },
      };

      // Handle Game Finished
      if (data.status === 'finished' && !currentEnded) {
        newState.gameEnded = true;
        newState.showResultModal = true;
        
        if (data.winner === 'draw') {
          newState.resultMessage = {
            title: "It's a Draw!",
            message: "Well played! Both players gave it their best.",
            emoji: "🤝",
            color: "var(--warning)"
          };
        } else if (data.winner === currentRole) {
          newState.resultMessage = {
            title: "You Won! 🎉",
            message: data.timeoutForfeit === currentRole ? "Opponent ran out of time!" : "Great game!",
            emoji: "🏆",
            color: "var(--success)"
          };
        } else if (data.winner) {
          newState.resultMessage = {
            title: `${data.winner} Wins!`,
            message: data.timeoutForfeit ? "You ran out of time!" : "Better luck next time!",
            emoji: data.winner === 'X' ? "❌" : "⭕",
            color: data.winner === 'X' ? "#ff4d6d" : "#4d9fff"
          };
        }
      }

      // Handle Game Reset
      if (data.status === 'playing' && currentEnded) {
        newState.gameEnded = false;
        newState.showResultModal = false;
        newState.timeRemaining = 60;
      }

      if (data.status === 'abandoned') {
        toast.error('Opponent left the game!');
        newState.error = 'Opponent left the game';
      }

      set(newState);
    });

    // Start local timer
    const newTimerId = setInterval(() => {
      const { game, gameEnded } = get();
      if (game?.status === 'playing' && game.lastMoveTime && !gameEnded) {
        const elapsed = (Date.now() - game.lastMoveTime) / 1000;
        set({ timeRemaining: Math.max(0, Math.ceil(60 - elapsed)) });
      }
    }, 1000);

    set({ timerId: newTimerId });

    return () => {
      unsubscribe();
      clearInterval(newTimerId);
    };
  },

  handleMove: async (index) => {
    const { game, myRole, gameEnded, gameId, scores } = get();
    
    if (!game || !myRole || gameEnded || game.status !== 'playing') return;
    if (game.currentTurn !== myRole) {
      toast(`Not your turn! It's ${game.currentTurn}'s turn`);
      return;
    }
    
    const size = game.boardSize || 3;
    const board = Array.isArray(game.board) ? [...game.board] : Array(size * size).fill(null);
    if (board[index] !== null) return;

    board[index] = myRole;
    const result = getGameResult(board);
    
    let newScores = { ...scores };
    if (result) {
      if (result.winner === 'draw') newScores.draw++;
      else newScores[result.winner]++;
    }

    try {
      await makeOnlineMove(gameId, board, myRole === 'X' ? 'O' : 'X', result, newScores);
      set({ timeRemaining: 60 }); 
    } catch (err) {
      toast.error('Move failed: ' + err.message);
    }
  },

  handlePlayAgain: async () => {
    const { gameId, resetting } = get();
    if (resetting) return;
    
    set({ resetting: true, showResultModal: false, gameEnded: false, timeRemaining: 60 });
    toast.loading('Starting new round...', { id: 'reset' });
    
    try {
      await resetGame(gameId);
      toast.success('New round!', { id: 'reset' });
    } catch (err) {
      toast.error('Failed to reset', { id: 'reset' });
    } finally {
      set({ resetting: false });
    }
  },

  handleLeave: async () => {
    const { gameId, timerId } = get();
    const playerId = getPlayerId();
    if (timerId) clearInterval(timerId);
    if (gameId) leaveGame(gameId, playerId);
    set({ game: null, gameId: null, gameEnded: false, showResultModal: false, timerId: null });
  }
}));
