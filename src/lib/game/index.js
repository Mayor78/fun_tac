// src/lib/game/index.js
// Export all game service functions from one place

// Core game functions
export {
  createGame,
  joinGame,
  makeOnlineMove,
  resetGame,
  leaveGame,
  subscribeToGame,
  requestRematch,
  acceptRematch,
  GAME_MODES,
  GAME_CONFIG,
  POWER_UPS,
  getRandomPowerUp
} from './gameCore';

// Chat functions
export {
  sendChatMessage,
  subscribeToChat
} from './chat';

// Matchmaking functions
export {
  joinMatchmaking,
  subscribeToMatchmaking,
  leaveMatchmaking,
  getQueueStatus
} from './matchmaking';

// Leaderboard functions
export {
  updatePlayerStats,
  getLeaderboard,
  subscribeToLeaderboard,
  getPlayerStats,
  getPlayerAchievements,
  ACHIEVEMENTS
} from './leaderboard';

// Board utilities
export {
  boardToArray,
  boardToObject,
  determineWinner
} from './boardUtils';