import { ref, set, get, update, serverTimestamp,db, onValue } from '../firebase';
import { generateGameId, getPlayerId, getPlayerName } from '../../utils/gameLogic';
import { boardToArray, boardToObject, determineWinner } from './boardUtils';
import { updatePlayerStats } from './leaderboard';

// Game Modes
export const GAME_MODES = {
  CLASSIC: 'classic',
  SUDDEN_DEATH: 'sudden_death',
  TIME_BANK: 'time_bank',
  BLITZ: 'blitz',
  POWER_UPS: 'power_ups'
};

export const GAME_CONFIG = {
  [GAME_MODES.CLASSIC]: { name: 'Classic', timePerMove: 60, totalTime: null, powerUps: false, icon: '🎯', color: '#4d9fff' },
  [GAME_MODES.SUDDEN_DEATH]: { name: 'Sudden Death', timePerMove: 45, totalTime: null, powerUps: false, icon: '💀', color: '#ff4d6d' },
  [GAME_MODES.TIME_BANK]: { name: 'Time Bank', timePerMove: null, totalTime: 90, powerUps: false, icon: '⏰', color: '#ffcc4d' },
  [GAME_MODES.BLITZ]: { name: 'Blitz', timePerMove: 10, totalTime: null, powerUps: false, icon: '⚡', color: '#4dffaa' },
  [GAME_MODES.POWER_UPS]: { name: 'Power Ups', timePerMove: 50, totalTime: null, powerUps: true, icon: '✨', color: '#bf4dff' }
};

// Power Ups
export const POWER_UPS = {
  FREEZE_TIME: { id: 'freeze_time', name: 'Freeze Time', emoji: '❄️', effect: 'Freeze opponent timer for 10 seconds' },
  DOUBLE_MOVE: { id: 'double_move', name: 'Double Move', emoji: '🎯', effect: 'Make 2 moves in a row' },
  REVEAL: { id: 'reveal', name: 'Reveal', emoji: '👁️', effect: 'See opponent\'s best move' },
  SHIELD: { id: 'shield', name: 'Shield', emoji: '🛡️', effect: 'Block opponent from taking a cell' },
  SWAP: { id: 'swap', name: 'Swap', emoji: '🔄', effect: 'Swap positions with opponent' }
};

export function getRandomPowerUp() {
  const powerUps = Object.values(POWER_UPS);
  return powerUps[Math.floor(Math.random() * powerUps.length)];
}

// Sudden death winner logic moved to utils/gameLogic.js

// Create a new game with game mode
export async function createGame(hostName, gameMode = GAME_MODES.CLASSIC, boardSize = 3) {
  const gameId = generateGameId();
  const playerId = getPlayerId();
  const playerName = hostName || getPlayerName() || 'Player 1';

  const gameData = {
    id: gameId,
    board: boardToObject(Array(boardSize * boardSize).fill(null)),
    players: { X: playerId, O: null },
    playerNames: { X: playerName, O: null },
    currentTurn: 'X',
    status: 'waiting',
    winner: null,
    winLine: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    rematchRequestedBy: null,
    rematchGameId: null,
    scores: { X: 0, O: 0, draw: 0 },
    lastMoveTime: Date.now(),
    gameStartTime: null,
    gameMode: gameMode,
    powerUpsUsed: [],
    timeBank: GAME_CONFIG[gameMode]?.totalTime || null,
    suddenDeathActive: false,
    moveHistory: { X: [], O: [] }
  };

  await set(ref(db, `games/${gameId}`), gameData);
  return gameId;
}

// Join an existing game
export async function joinGame(gameId, guestName) {
  const playerId = getPlayerId();
  const playerName = guestName || getPlayerName() || 'Player 2';
  const gameRef = ref(db, `games/${gameId}`);
  
  const snapshot = await get(gameRef);
  if (!snapshot.exists()) throw new Error('Game not found');
  
  const game = snapshot.val();
  const currentPlayers = game.players || {};
  
  if (currentPlayers.X === playerId) {
    game.board = boardToArray(game.board);
    return { role: 'X', game };
  }
  if (currentPlayers.O === playerId) {
    game.board = boardToArray(game.board);
    return { role: 'O', game };
  }
  if (currentPlayers.O !== null && currentPlayers.O !== undefined) throw new Error('Game is full');
  if (game.status !== 'waiting') throw new Error('Game already started');

  await update(gameRef, {
    'players/O': playerId,
    'playerNames/O': playerName,
    status: 'playing',
    gameStartTime: Date.now(),
    lastMoveTime: Date.now(),
    updatedAt: serverTimestamp()
  });

  const newSnapshot = await get(gameRef);
  const updatedGame = newSnapshot.val();
  updatedGame.board = boardToArray(updatedGame.board);
  
  return { role: 'O', game: updatedGame };
}

// Make a move with game mode support
export async function makeOnlineMove(gameId, boardArray, nextTurn, result, providedScores, powerUp = null, newMoveHistory = null) {
  console.log('🎯 makeOnlineMove called:', { gameId, nextTurn, result, providedScores, powerUp, newMoveHistory });
  
  const gameRef = ref(db, `games/${gameId}`);
  const snapshot = await get(gameRef);
  const currentGame = snapshot.val();
  
  if (!currentGame) {
    console.error('❌ Game not found');
    throw new Error('Game not found');
  }
  
  let newScores = providedScores || currentGame?.scores || { X: 0, O: 0, draw: 0 };
  const gameMode = currentGame.gameMode || GAME_MODES.CLASSIC;
  
  const updates = {
    board: boardToObject(boardArray),
    currentTurn: nextTurn,
    updatedAt: serverTimestamp(),
    lastMoveTime: Date.now()
  };

  if (newMoveHistory) {
    updates.moveHistory = newMoveHistory;
  }

  let finalResult = result;

  if (finalResult && finalResult.winner) {
    updates.status = 'finished';
    updates.winner = finalResult.winner;
    updates.winLine = finalResult.line || [];
    updates.scores = newScores;
    console.log('🏆 Game finished - Winner:', finalResult.winner, 'Scores:', newScores, 'Mode:', gameMode);
    
    if (finalResult.winner === 'draw') {
      await updatePlayerStats(
        { playerId: currentGame?.players?.X, playerName: currentGame?.playerNames?.X },
        { playerId: currentGame?.players?.O, playerName: currentGame?.playerNames?.O },
        true, gameMode
      );
    } else {
      const winnerId = currentGame?.players[finalResult.winner];
      const winnerName = currentGame?.playerNames[finalResult.winner];
      const loserId = currentGame?.players[finalResult.winner === 'X' ? 'O' : 'X'];
      const loserName = currentGame?.playerNames[finalResult.winner === 'X' ? 'O' : 'X'];
      
      await updatePlayerStats(
        { playerId: winnerId, playerName: winnerName },
        { playerId: loserId, playerName: loserName },
        false, gameMode
      );
    }
  }

  if (powerUp) {
    updates.powerUpsUsed = [...(currentGame.powerUpsUsed || []), powerUp];
  }

  await update(gameRef, updates);
  console.log('✅ Move saved successfully');
}

// Reset game
export async function resetGame(gameId) {
  const gameRef = ref(db, `games/${gameId}`);
  const snapshot = await get(gameRef);
  if (!snapshot.exists()) throw new Error('Game not found');
  const game = snapshot.val();
  
  // Loser of the previous round starts the next round
  let nextTurn = 'X';
  if (game.winner && game.winner !== 'draw') {
    nextTurn = game.winner === 'X' ? 'O' : 'X';
  } else {
    // If it was a draw or no previous winner, swap from whoever went last
    nextTurn = game.currentTurn === 'X' ? 'O' : 'X';
  }

  const size = game.boardSize || 3;
  
  await update(gameRef, {
    board: boardToObject(Array(size * size).fill(null)),
    currentTurn: nextTurn,
    status: 'playing',
    winner: null,
    winLine: [],
    rematchRequestedBy: null,
    lastMoveTime: Date.now(),
    updatedAt: serverTimestamp(),
    suddenDeathActive: false,
    moveHistory: { X: [], O: [] }
  });
}

// Leave game
export async function leaveGame(gameId, playerId) {
  const gameRef = ref(db, `games/${gameId}`);
  await update(gameRef, {
    status: 'abandoned',
    abandonedBy: playerId,
    updatedAt: serverTimestamp()
  });
}

// Request rematch
export async function requestRematch(gameId, playerId) {
  await update(ref(db, `games/${gameId}`), { 
    rematchRequestedBy: playerId, 
    updatedAt: serverTimestamp() 
  });
}

// Accept rematch
export async function acceptRematch(oldGameId) {
  const snapshot = await get(ref(db, `games/${oldGameId}`));
  if (!snapshot.exists()) throw new Error('Game not found');
  const old = snapshot.val();

  if (old.rematchGameId) return old.rematchGameId;

  const newGameId = generateGameId();
  const gameData = {
    id: newGameId,
    board: {},
    players: { X: old.players.O, O: old.players.X },
    playerNames: { X: old.playerNames.O, O: old.playerNames.X },
    currentTurn: 'X',
    status: 'playing',
    winner: null,
    winLine: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    rematchRequestedBy: null,
    rematchGameId: null,
    rematchOf: oldGameId,
    scores: old.scores,
    lastMoveTime: Date.now(),
    gameStartTime: Date.now(),
    gameMode: old.gameMode || GAME_MODES.CLASSIC,
    suddenDeathActive: false,
    moveHistory: { X: [], O: [] }
  };

  await set(ref(db, `games/${newGameId}`), gameData);
  await update(ref(db, `games/${oldGameId}`), { 
    rematchGameId: newGameId,
    updatedAt: serverTimestamp()
  });
  
  return newGameId;
}

// Subscribe to game changes with all features
export function subscribeToGame(gameId, callback) {
  const gameRef = ref(db, `games/${gameId}`);
  
  return onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback(null);
      return;
    }
    
    const boardSize = data.boardSize || 3;
    const fullBoard = boardToArray(data.board, boardSize);
    const updatedData = { ...data, board: fullBoard };
    
    callback(updatedData);
  });
}