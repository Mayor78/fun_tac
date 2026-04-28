// src/lib/game/matchmaking.js
import { db, ref, set, get, remove, onValue, serverTimestamp } from '../firebase';
import { generateGameId, getPlayerId, getPlayerName } from '../../utils/gameLogic';
import { createGame } from './gameCore';

// Join matchmaking queue
export async function joinMatchmaking(playerName) {
  const playerId = getPlayerId();
  const name = playerName || getPlayerName() || 'Player';

  console.log('🎯 Joining matchmaking:', playerId, name);

  await leaveMatchmaking();

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
    console.log('✅ Match found with opponent:', waitingPlayerId);
    await remove(ref(db, `queue/${waitingPlayerId}`));

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
      gameStartTime: Date.now(),
      gameMode: 'classic'
    };

    await set(ref(db, `games/${gameId}`), gameData);
    
    const matchRef = ref(db, `match/${waitingPlayerData.playerId}`);
    await set(matchRef, {
      gameId,
      role: 'X',
      matchedAt: serverTimestamp()
    });

    console.log('✅ Match created, game ID:', gameId);
    return { status: 'matched', gameId, role: 'O' };
  } else {
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

// Subscribe to matchmaking
export function subscribeToMatchmaking(playerId, callback) {
  console.log('📡 Subscribing to matchmaking for:', playerId);
  const matchRef = ref(db, `match/${playerId}`);
  
  return onValue(matchRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      console.log('✅ Match found via subscription!', data);
      callback(data);
      remove(matchRef).catch(console.error);
    }
  }, (error) => {
    console.error('❌ Matchmaking subscription error:', error);
  });
}

// Leave matchmaking
export async function leaveMatchmaking() {
  const playerId = getPlayerId();
  console.log('🚪 Leaving matchmaking for:', playerId);
  
  try {
    await remove(ref(db, `queue/${playerId}`));
    await remove(ref(db, `match/${playerId}`));
    console.log('✅ Successfully left matchmaking');
  } catch (error) {
    console.log('Error leaving matchmaking:', error);
  }
}

// Get queue status
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