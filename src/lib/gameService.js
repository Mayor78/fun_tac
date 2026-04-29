import {
  db, ref, set, onValue, update, remove, get,
  serverTimestamp, push, query, orderByChild, limitToLast
} from './firebase';
import { generateGameId, getPlayerId, getPlayerName, checkWinner } from '../utils/gameLogic';
import { GAME_MODES } from './game';
import { updatePlayerStats, getLeaderboard, subscribeToLeaderboard, getPlayerStats } from './game/leaderboard';
export { updatePlayerStats, getLeaderboard, subscribeToLeaderboard, getPlayerStats };

// Helper functions for board conversion
function boardToArray(boardObj, size = 3) {
  const length = size * size;
  const arr = Array(length).fill(null);
  if (!boardObj) return arr;

  if (Array.isArray(boardObj)) {
    // Strictly return an array of the requested size
    const result = Array(length).fill(null);
    for (let i = 0; i < length && i < boardObj.length; i++) {
      result[i] = boardObj[i] !== undefined ? boardObj[i] : null;
    }
    return result;
  }

  for (let i = 0; i < length; i++) {
    if (boardObj[i] !== undefined && boardObj[i] !== null) {
      arr[i] = boardObj[i];
    }
  }
  return arr;
}

function boardToObject(boardArray) {
  if (!boardArray || !Array.isArray(boardArray)) return {};
  const obj = {};
  for (let i = 0; i < boardArray.length; i++) {
    if (boardArray[i] !== null && boardArray[i] !== undefined) {
      obj[i] = boardArray[i];
    }
  }
  return obj;
}

function determineWinner(boardArray) {
  if (!boardArray || !Array.isArray(boardArray)) return null;
  
  const moveCount = boardArray.filter(c => c !== null).length;
  if (moveCount < 5 && boardArray.length >= 9) return null; // Minimum moves for a 3x3 win is 5
  if (moveCount < 7 && boardArray.length > 9) return null; // Minimum moves for 4x4 or 5x5 is higher
  if (xWin) return { winner: 'X', line: xWin.line };
  const oWin = checkWinner(boardArray, 'O');
  if (oWin) return { winner: 'O', line: oWin.line };
  const isFull = boardArray.length >= 9 && boardArray.every(cell => cell === 'X' || cell === 'O');
  if (isFull) return { winner: 'draw', line: [] };
  return null;
}

// Create a new game
export async function createGame(hostName, gameMode = GAME_MODES.CLASSIC, boardSize = 3) {
  const gameId = generateGameId();
  const playerId = getPlayerId();
  const playerName = hostName || getPlayerName() || 'Player 1';

  const gameData = {
    id: gameId,
    board: boardToObject(Array(boardSize * boardSize).fill(null)),
    boardSize: boardSize,
    gameMode: gameMode,
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

// Make a move with proper score update
export async function makeOnlineMove(gameId, boardArray, nextTurn, result, providedScores, powerUpUsed = null, moveHistory = null) {
  console.log('🎯 makeOnlineMove called:', { gameId, nextTurn, result, providedScores });

  const gameRef = ref(db, `games/${gameId}`);
  const snapshot = await get(gameRef);
  const currentGame = snapshot.val();

  if (!currentGame) {
    console.error('❌ Game not found');
    throw new Error('Game not found');
  }

  let newScores = providedScores || currentGame?.scores || { X: 0, O: 0, draw: 0 };
  const updates = {
    board: boardToObject(boardArray),
    currentTurn: nextTurn,
    updatedAt: serverTimestamp(),
    lastMoveTime: Date.now(),
    moveHistory: moveHistory || currentGame.moveHistory || { X: [], O: [] }
  };

  if (powerUpUsed) {
    updates.lastPowerUpUsed = powerUpUsed;
  }

  // If game has a winner, update status
  if (result && result.winner) {
    updates.status = 'finished';
    updates.winner = result.winner;
    updates.winLine = result.line || [];
    updates.scores = newScores;
    console.log('🏆 Game finished - Winner:', result.winner, 'Scores:', newScores);

    // Update leaderboard
    if (result.winner === 'draw') {
      await updatePlayerStats(
        { playerId: currentGame?.players?.X, playerName: currentGame?.playerNames?.X },
        { playerId: currentGame?.players?.O, playerName: currentGame?.playerNames?.O },
        true
      );
    } else {
      const winnerId = currentGame?.players[result.winner];
      const winnerName = currentGame?.playerNames[result.winner];
      const loserId = currentGame?.players[result.winner === 'X' ? 'O' : 'X'];
      const loserName = currentGame?.playerNames[result.winner === 'X' ? 'O' : 'X'];

      await updatePlayerStats(
        { playerId: winnerId, playerName: winnerName },
        { playerId: loserId, playerName: loserName },
        false,
        currentGame.gameMode || 'classic'
      );
    }
  }

  await update(gameRef, updates);
  console.log('✅ Move saved successfully');
}
// Listen to game changes
export function subscribeToGame(gameId, callback) {
  const gameRef = ref(db, `games/${gameId}`);

  return onValue(gameRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback(null);
      return;
    }

    // Convert board from object to array using the game's stored boardSize
    const boardSize = data.boardSize || 3;
    const fullBoard = boardToArray(data.board, boardSize);
    const updatedData = { ...data, board: fullBoard };

    callback(updatedData);
  });
}

// Send a chat message
export async function sendChatMessage(gameId, playerId, playerName, message) {
  const chatRef = ref(db, `games/${gameId}/chat`);
  const newMessage = {
    id: Date.now(),
    playerId,
    playerName,
    message: message.substring(0, 200),
    timestamp: serverTimestamp(),
    time: Date.now()
  };
  await push(chatRef, newMessage);
}

// Subscribe to chat messages
export function subscribeToChat(gameId, callback) {
  const chatRef = ref(db, `games/${gameId}/chat`);
  const chatQuery = query(chatRef, orderByChild('time'), limitToLast(50));
  return onValue(chatQuery, (snapshot) => {
    const messages = [];
    snapshot.forEach((child) => {
      messages.push({ id: child.key, ...child.val() });
    });
    callback(messages.reverse());
  });
}

// Reset game - keep scores
export async function resetGame(gameId) {
  const gameRef = ref(db, `games/${gameId}`);
  const snapshot = await get(gameRef);
  if (!snapshot.exists()) throw new Error('Game not found');
  const data = snapshot.val();
  const size = data.boardSize || 3;

  await update(gameRef, {
    board: boardToObject(Array(size * size).fill(null)),
    currentTurn: 'X',
    status: 'playing',
    winner: null,
    winLine: [],
    rematchRequestedBy: null,
    lastMoveTime: Date.now(),
    updatedAt: serverTimestamp(),
    moveHistory: { X: [], O: [] }
  });
}

// Leave game - notify opponent
export async function leaveGame(gameId, playerId) {
  const gameRef = ref(db, `games/${gameId}`);
  await update(gameRef, {
    status: 'abandoned',
    abandonedBy: playerId,
    updatedAt: serverTimestamp()
  });
}

// Matchmaking Queue
// Matchmaking Queue - FIXED VERSION
// Matchmaking Queue - FIXED to use match/ instead of match_
export async function joinMatchmaking(playerName) {
  const playerId = getPlayerId();
  const name = playerName || getPlayerName() || 'Player';

  // Get current player's ELO
  const stats = await getPlayerStats(playerId);
  const myElo = stats?.elo || 1200;

  console.log('🎯 Joining matchmaking:', playerId, name, 'ELO:', myElo);

  // Clean up any existing queue entries
  await leaveMatchmaking();

  // Check for existing waiting players
  const queueRef = ref(db, 'queue');
  const snapshot = await get(queueRef);
  const queue = snapshot.val() || {};

  let waitingPlayerId = null;
  let waitingPlayerData = null;

  // Try to find someone within 200 ELO range first
  for (const [id, data] of Object.entries(queue)) {
    if (data.status === 'waiting' && id !== playerId) {
      const opponentElo = data.elo || 1200;
      if (Math.abs(myElo - opponentElo) <= 200) {
        waitingPlayerId = id;
        waitingPlayerData = data;
        break;
      }
    }
  }

  // If no one in range, take the first available if they've been waiting long (>10s)
  if (!waitingPlayerId) {
    for (const [id, data] of Object.entries(queue)) {
      if (data.status === 'waiting' && id !== playerId) {
        waitingPlayerId = id;
        waitingPlayerData = data;
        break;
      }
    }
  }

  if (waitingPlayerId && waitingPlayerData) {
    // Match found! Remove opponent from queue
    console.log('✅ Match found with opponent:', waitingPlayerId);
    await remove(ref(db, `queue/${waitingPlayerId}`));

    // Create new game
    const gameId = generateGameId();
    const gameData = {
      id: gameId,
      board: boardToObject(Array(9).fill(null)),
      players: { X: waitingPlayerData.playerId, O: playerId },
      playerNames: { X: waitingPlayerData.playerName, O: name },
      currentTurn: 'X',
      status: 'playing',
      winner: null,
      winLine: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      rematchRequestedBy: null,
      rematchGameId: null,
      matchmade: true,
      scores: { X: 0, O: 0, draw: 0 },
      lastMoveTime: Date.now(),
      gameStartTime: Date.now(),
      gameMode: GAME_MODES.CLASSIC,
      moveHistory: { X: [], O: [] }
    };

    await set(ref(db, `games/${gameId}`), gameData);

    // Use match/ path (with slash) to match your security rules
    const matchRef = ref(db, `match/${waitingPlayerData.playerId}`);
    await set(matchRef, {
      gameId,
      role: 'X',
      matchedAt: serverTimestamp()
    });

    console.log('✅ Match created, game ID:', gameId);
    return { status: 'matched', gameId, role: 'O' };
  } else {
    // No waiting players - add to queue
    console.log('⏳ No opponent found, adding to queue');
    await set(ref(db, `queue/${playerId}`), {
      playerId,
      playerName: name,
      status: 'waiting',
      elo: myElo,
      joinedAt: serverTimestamp()
    });
    return { status: 'queued', playerId };
  }
}

// Subscribe to matchmaking - FIXED to use match/ path
export function subscribeToMatchmaking(playerId, callback) {
  console.log('📡 Subscribing to matchmaking for:', playerId);
  const matchRef = ref(db, `match/${playerId}`);

  return onValue(matchRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      console.log('✅ Match found via subscription!', data);
      callback(data);
      // Clean up the match notification after use
      remove(matchRef).catch(console.error);
    }
  }, (error) => {
    console.error('❌ Matchmaking subscription error:', error);
  });
}

// Leave matchmaking - FIXED to use match/ path
export async function leaveMatchmaking() {
  const playerId = getPlayerId();
  console.log('🚪 Leaving matchmaking for:', playerId);

  try {
    // Remove from queue
    await remove(ref(db, `queue/${playerId}`));
    // Remove any match notification - using match/ path
    await remove(ref(db, `match/${playerId}`));
    console.log('✅ Successfully left matchmaking');
  } catch (error) {
    console.log('Error leaving matchmaking:', error);
  }
}



export async function getQueueStatus(playerId) {
  try {
    const snapshot = await get(ref(db, `queue/${playerId}`));
    if (snapshot.exists()) {
      return { inQueue: true, data: snapshot.val() };
    }
    return { inQueue: false, data: null };
  } catch (error) {
    console.error('Error getting queue status:', error);
    return { inQueue: false, data: null };
  }
}
export async function requestRematch(gameId, playerId) {
  await update(ref(db, `games/${gameId}`), {
    rematchRequestedBy: playerId,
    updatedAt: serverTimestamp()
  });
}



// Leaderboard Functions are exported at the top of the file
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
    gameStartTime: Date.now()
  };

  await set(ref(db, `games/${newGameId}`), gameData);
  await update(ref(db, `games/${oldGameId}`), {
    rematchGameId: newGameId,
    updatedAt: serverTimestamp()
  });

  return newGameId;
}