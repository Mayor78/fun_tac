// src/lib/game/leaderboard.js
import { ref, get, update, onValue,db } from '../firebase';

// Achievements
export const ACHIEVEMENTS = {
  FIRST_BLOOD: { id: 'first_blood', name: 'First Blood', desc: 'Win your first game', icon: '🏆', points: 10 },
  WIN_STREAK_3: { id: 'win_streak_3', name: 'On Fire!', desc: 'Win 3 games in a row', icon: '🔥', points: 20 },
  WIN_STREAK_5: { id: 'win_streak_5', name: 'Unstoppable!', desc: 'Win 5 games in a row', icon: '💪', points: 50 },
  WIN_STREAK_10: { id: 'win_streak_10', name: 'God Mode', desc: 'Win 10 games in a row', icon: '👑', points: 100 },
  PERFECT_GAME: { id: 'perfect_game', name: 'Perfect Game', desc: 'Win without opponent marking any cell', icon: '🎯', points: 30 },
  SPEED_DEMON: { id: 'speed_demon', name: 'Speed Demon', desc: 'Win in under 10 moves', icon: '⚡', points: 25 },
  COMEBACK_KING: { id: 'comeback_king', name: 'Comeback King', desc: 'Win after being 2 moves from losing', icon: '👑', points: 40 },
  SUDDEN_DEATH_MASTER: { id: 'sudden_death_master', name: 'Sudden Death Master', desc: 'Win 3 Sudden Death games', icon: '💀', points: 35 },
  BLITZ_CHAMPION: { id: 'blitz_champion', name: 'Blitz Champion', desc: 'Win 5 Blitz games', icon: '⚡', points: 45 },
  POWER_UP_MASTER: { id: 'power_up_master', name: 'Power Up Master', desc: 'Use 10 power ups', icon: '✨', points: 40 }
};

// ELO Calculation
function calculateELO(ratingA, ratingB, scoreA, kFactor = 32) {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  return Math.round(ratingA + kFactor * (scoreA - expectedA));
}

// Update player stats with achievements, ELO, and game mode tracking
export async function updatePlayerStats(winner, loser, isDraw = false, gameMode = 'classic') {
  const winnerId = winner?.playerId;
  const winnerName = winner?.playerName;
  const loserId = loser?.playerId;
  const loserName = loser?.playerName;
  
  const updates = {};
  const achievements = [];
  
  if (winnerId && loserId) {
    const winnerRef = ref(db, `leaderboard/${winnerId}`);
    const loserRef = ref(db, `leaderboard/${loserId}`);
    const [winnerSnap, loserSnap] = await Promise.all([get(winnerRef), get(loserRef)]);
    
    const winnerStats = winnerSnap.val() || { wins: 0, losses: 0, draws: 0, totalGames: 0, winStreak: 0, elo: 1200, achievements: [], modeWins: {}, coins: 0 };
    const loserStats = loserSnap.val() || { wins: 0, losses: 0, draws: 0, totalGames: 0, winStreak: 0, elo: 1200, achievements: [], modeWins: {}, coins: 0 };
    
    const winRating = winnerStats.elo || 1200;
    const loseRating = loserStats.elo || 1200;
    
    let newWinRating, newLoseRating;
    if (isDraw) {
      newWinRating = calculateELO(winRating, loseRating, 0.5);
      newLoseRating = calculateELO(loseRating, winRating, 0.5);
    } else {
      newWinRating = calculateELO(winRating, loseRating, 1);
      newLoseRating = calculateELO(loseRating, winRating, 0);
    }

    if (!isDraw) {
      // Winner updates
      const newWinStreak = (winnerStats.winStreak || 0) + 1;
      if (winnerStats.totalGames === 0) achievements.push('FIRST_BLOOD');
      if (newWinStreak === 3) achievements.push('WIN_STREAK_3');
      if (newWinStreak === 5) achievements.push('WIN_STREAK_5');
      if (newWinStreak === 10) achievements.push('WIN_STREAK_10');
      
      const modeWins = winnerStats.modeWins || {};
      modeWins[gameMode] = (modeWins[gameMode] || 0) + 1;
      if (gameMode === 'sudden_death' && modeWins.sudden_death === 3) achievements.push('SUDDEN_DEATH_MASTER');
      if (gameMode === 'blitz' && modeWins.blitz === 5) achievements.push('BLITZ_CHAMPION');

      updates[`leaderboard/${winnerId}`] = {
        ...winnerStats,
        playerId: winnerId,
        playerName: winnerName,
        wins: (winnerStats.wins || 0) + 1,
        totalGames: (winnerStats.totalGames || 0) + 1,
        winStreak: newWinStreak,
        bestWinStreak: Math.max(winnerStats.bestWinStreak || 0, newWinStreak),
        modeWins: modeWins,
        achievements: [...new Set([...(winnerStats.achievements || []), ...achievements])],
        elo: newWinRating,
        coins: (winnerStats.coins || 0) + 50,
        lastUpdated: Date.now()
      };

      updates[`leaderboard/${loserId}`] = {
        ...loserStats,
        playerId: loserId,
        playerName: loserName,
        losses: (loserStats.losses || 0) + 1,
        totalGames: (loserStats.totalGames || 0) + 1,
        winStreak: 0,
        elo: newLoseRating,
        coins: (loserStats.coins || 0) + 5,
        lastUpdated: Date.now()
      };
    } else {
      // Draw updates
      updates[`leaderboard/${winnerId}`] = {
        ...winnerStats,
        playerId: winnerId,
        playerName: winnerName,
        draws: (winnerStats.draws || 0) + 1,
        totalGames: (winnerStats.totalGames || 0) + 1,
        winStreak: 0,
        elo: newWinRating,
        coins: (winnerStats.coins || 0) + 20,
        lastUpdated: Date.now()
      };
      updates[`leaderboard/${loserId}`] = {
        ...loserStats,
        playerId: loserId,
        playerName: loserName,
        draws: (loserStats.draws || 0) + 1,
        totalGames: (loserStats.totalGames || 0) + 1,
        winStreak: 0,
        elo: newLoseRating,
        coins: (loserStats.coins || 0) + 20,
        lastUpdated: Date.now()
      };
    }
  }
  
  if (Object.keys(updates).length > 0) {
    await update(ref(db), updates);
  }
  
  return achievements;
}

// Get player achievements - ADD THIS EXPORT
export async function getPlayerAchievements(playerId) {
  const playerRef = ref(db, `leaderboard/${playerId}/achievements`);
  const snapshot = await get(playerRef);
  return snapshot.val() || [];
}

// Get leaderboard data
export async function getLeaderboard(limit = 10) {
  const leaderboardRef = ref(db, 'leaderboard');
  const snapshot = await get(leaderboardRef);
  const data = snapshot.val() || {};
  
  const players = Object.values(data).map(player => ({
    ...player,
    winRate: player.totalGames > 0 ? ((player.wins / player.totalGames) * 100).toFixed(1) : 0,
    achievementCount: player.achievements?.length || 0,
    totalPoints: (player.achievements || []).reduce((sum, ach) => sum + (ACHIEVEMENTS[ach]?.points || 0), 0)
  }));
  
  players.sort((a, b) => {
    if (a.wins !== b.wins) return b.wins - a.wins;
    return b.totalPoints - a.totalPoints;
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
      winRate: player.totalGames > 0 ? ((player.wins / player.totalGames) * 100).toFixed(1) : 0,
      achievementCount: player.achievements?.length || 0,
      totalPoints: (player.achievements || []).reduce((sum, ach) => sum + (ACHIEVEMENTS[ach]?.points || 0), 0)
    }));
    players.sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins;
      return b.totalPoints - a.totalPoints;
    });
    callback(players);
  });
}

// Get current player's stats
export async function getPlayerStats(playerId) {
  const playerRef = ref(db, `leaderboard/${playerId}`);
  const snapshot = await get(playerRef);
  const stats = snapshot.val();
  if (stats) {
    stats.winRate = stats.totalGames > 0 ? ((stats.wins / stats.totalGames) * 100).toFixed(1) : 0;
    stats.achievementCount = stats.achievements?.length || 0;
    stats.totalPoints = (stats.achievements || []).reduce((sum, ach) => sum + (ACHIEVEMENTS[ach]?.points || 0), 0);
  }
  return stats || null;
}