// src/lib/gameService.js - FULLY FIXED WITH PROPER SCORING
import { 
  db, ref, set, onValue, update, remove, get, 
  serverTimestamp, push, query, orderByChild, limitToLast
} from './firebase';
import { generateGameId, getPlayerId, getPlayerName, checkWinner } from '../utils/gameLogic';

// Helper functions for board conversion
function boardToArray(boardObj) {
  const arr = Array(9).fill(null);
  if (!boardObj) return arr;
  if (Array.isArray(boardObj)) {
    for (let i = 0; i < 9 && i < boardObj.length; i++) {
      arr[i] = boardObj[i] || null;
    }
    return arr;
  }
  for (let i = 0; i < 9; i++) {
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
  const board = boardToArray(boardArray);
  const xWin = checkWinner(board, 'X');
  if (xWin) return { winner: 'X', line: xWin.line };
  const oWin = checkWinner(board, 'O');
  if (oWin) return { winner: 'O', line: oWin.line };
  const isFull = board.every(cell => cell !== null);
  if (isFull) return { winner: 'draw', line: [] };
  return null;
}

// Create a new game
export async function createGame(hostName) {
  const gameId = generateGameId();
  const playerId = getPlayerId();
  const playerName = hostName || getPlayerName() || 'Player 1';

  const gameData = {
    id: gameId,
    board: {},
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
    gameStartTime: null
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
// Make a move with proper score update
export async function makeOnlineMove(gameId, boardArray, nextTurn, result, providedScores) {
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
    lastMoveTime: Date.now()
  };

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
        false
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
    
    // Convert board from object to array
    const fullBoard = boardToArray(data.board);
    const updatedData = { ...data, board: fullBoard };
    
    // Check for winner on EVERY update
    const result = determineWinner(fullBoard);
    
    // If there's a winner and game is still playing, update it
    if (result && data.status === 'playing') {
      const newScores = { ...(data.scores || { X: 0, O: 0, draw: 0 }) };
      if (result.winner === 'draw') {
        newScores.draw = (newScores.draw || 0) + 1;
      } else {
        newScores[result.winner] = (newScores[result.winner] || 0) + 1;
      }
      
      // Update Firebase with winner info
      update(ref(db, `games/${gameId}`), {
        status: 'finished',
        winner: result.winner,
        winLine: result.line || [],
        scores: newScores,
        updatedAt: serverTimestamp()
      }).catch(console.error);
      
      callback({ ...updatedData, ...result, status: 'finished', scores: newScores });
      return;
    }
    
    // Check for timeout (only if game is playing and no winner yet)
    if (data.status === 'playing' && data.lastMoveTime && !result) {
      const timeSinceLastMove = (Date.now() - data.lastMoveTime) / 1000;
      if (timeSinceLastMove >= 60) {
        const currentPlayer = data.currentTurn;
        const winner = currentPlayer === 'X' ? 'O' : 'X';
        const newScores = { ...(data.scores || { X: 0, O: 0, draw: 0 }) };
        newScores[winner] = (newScores[winner] || 0) + 1;
        
        update(ref(db, `games/${gameId}`), {
          status: 'finished',
          winner: winner,
          winLine: [],
          scores: newScores,
          timeoutForfeit: currentPlayer,
          updatedAt: serverTimestamp()
        }).catch(console.error);
        
        callback({ ...updatedData, winner: winner, status: 'finished', scores: newScores });
        return;
      }
      updatedData.timeRemaining = Math.max(0, 60 - timeSinceLastMove);
    }
    
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
  
  await update(gameRef, {
    board: {},
    currentTurn: 'X',
    status: 'playing',
    winner: null,
    winLine: [],
    rematchRequestedBy: null,
    lastMoveTime: Date.now(),
    updatedAt: serverTimestamp()
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

  console.log('🎯 Joining matchmaking:', playerId, name);

  // Clean up any existing queue entries
  await leaveMatchmaking();

  // Check for existing waiting players
  const queueRef = ref(db, 'queue');
  const snapshot = await get(queueRef);
  const queue = snapshot.val() || {};
  
  let waitingPlayerId = null;
  let waitingPlayerData = null;
  
  for (const [id, data] of Object.entries(queue)) {
    if (data.status === 'waiting' && id !== playerId) {
      waitingPlayerId = id;
      waitingPlayerData = data;
      break;
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
      board: {},
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
      gameStartTime: Date.now()
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



// Leaderboard Functions

// Update player stats after a game ends
export async function updatePlayerStats(winner, loser, isDraw = false) {
  const winnerId = winner?.playerId;
  const winnerName = winner?.playerName;
  const loserId = loser?.playerId;
  const loserName = loser?.playerName;
  
  const updates = {};
  
  if (!isDraw && winnerId) {
    // Update winner stats
    const winnerRef = ref(db, `leaderboard/${winnerId}`);
    const winnerSnapshot = await get(winnerRef);
    const winnerStats = winnerSnapshot.val() || {
      playerId: winnerId,
      playerName: winnerName,
      wins: 0,
      losses: 0,
      draws: 0,
      totalGames: 0,
      winStreak: 0,
      bestWinStreak: 0,
      lastUpdated: Date.now()
    };
    
    updates[`leaderboard/${winnerId}`] = {
      ...winnerStats,
      playerName: winnerName,
      wins: (winnerStats.wins || 0) + 1,
      totalGames: (winnerStats.totalGames || 0) + 1,
      winStreak: (winnerStats.winStreak || 0) + 1,
      bestWinStreak: Math.max(winnerStats.bestWinStreak || 0, (winnerStats.winStreak || 0) + 1),
      lastUpdated: Date.now()
    };
    
    // Update loser stats
    if (loserId) {
      const loserRef = ref(db, `leaderboard/${loserId}`);
      const loserSnapshot = await get(loserRef);
      const loserStats = loserSnapshot.val() || {
        playerId: loserId,
        playerName: loserName,
        wins: 0,
        losses: 0,
        draws: 0,
        totalGames: 0,
        winStreak: 0,
        bestWinStreak: 0,
        lastUpdated: Date.now()
      };
      
      updates[`leaderboard/${loserId}`] = {
        ...loserStats,
        playerName: loserName,
        losses: (loserStats.losses || 0) + 1,
        totalGames: (loserStats.totalGames || 0) + 1,
        winStreak: 0,
        lastUpdated: Date.now()
      };
    }
  } else if (isDraw && winnerId && loserId) {
    // Update both players for draw
    [winnerId, loserId].forEach(async (playerId) => {
      if (!playerId) return;
      const playerRef = ref(db, `leaderboard/${playerId}`);
      const playerSnapshot = await get(playerRef);
      const playerStats = playerSnapshot.val() || {
        playerId: playerId,
        playerName: playerId === winnerId ? winnerName : loserName,
        wins: 0,
        losses: 0,
        draws: 0,
        totalGames: 0,
        winStreak: 0,
        bestWinStreak: 0,
        lastUpdated: Date.now()
      };
      
      updates[`leaderboard/${playerId}`] = {
        ...playerStats,
        draws: (playerStats.draws || 0) + 1,
        totalGames: (playerStats.totalGames || 0) + 1,
        winStreak: 0,
        lastUpdated: Date.now()
      };
    });
  }
  
  if (Object.keys(updates).length > 0) {
    await update(ref(db), updates);
  }
}

// Get leaderboard data
export async function getLeaderboard(limit = 10) {
  const leaderboardRef = ref(db, 'leaderboard');
  const snapshot = await get(leaderboardRef);
  const data = snapshot.val() || {};
  
  // Convert to array and sort by wins
  const players = Object.values(data).map(player => ({
    ...player,
    winRate: player.totalGames > 0 ? ((player.wins / player.totalGames) * 100).toFixed(1) : 0
  }));
  
  // Sort by wins (descending), then by winRate
  players.sort((a, b) => {
    if (a.wins !== b.wins) return b.wins - a.wins;
    return parseFloat(b.winRate) - parseFloat(a.winRate);
  });
  
  return players.slice(0, limit);
}

// Subscribe to real-time leaderboard updates
export function subscribeToLeaderboard(callback) {
  const leaderboardRef = ref(db, 'leaderboard');
  return onValue(leaderboardRef, async (snapshot) => {
    const data = snapshot.val() || {};
    const players = Object.values(data).map(player => ({
      ...player,
      winRate: player.totalGames > 0 ? ((player.wins / player.totalGames) * 100).toFixed(1) : 0
    }));
    players.sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      return parseFloat(b.winRate) - parseFloat(a.winRate);
    });
    callback(players);
  });
}

// Get current player's stats
export async function getPlayerStats(playerId) {
  const playerRef = ref(db, `leaderboard/${playerId}`);
  const snapshot = await get(playerRef);
  return snapshot.val() || null;
}
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