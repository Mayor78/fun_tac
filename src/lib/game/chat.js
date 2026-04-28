// src/lib/game/chat.js
import { ref, push, query, orderByChild, limitToLast, onValue, serverTimestamp } from '../firebase';

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