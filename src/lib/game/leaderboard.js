// src/lib/game/leaderboard.js
import { ref, get, update, onValue } from '../firebase';

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

// Update player stats with achievements and game mode tracking
export async function updatePlayerStats(winner, loser, isDraw = false, gameMode = 'classic') {
  const winnerId = winner?.playerId;
  const winnerName = winner?.playerName;
  const loserId = loser?.playerId;
  const loserName = loser?.playerName;
  
  const updates = {};
  const achievements = [];
  
  if (!isDraw && winnerId) {
    const winnerRef = ref(db, `leaderboard/${winnerId}`);
    const winnerSnapshot = await get(winnerRef);
    let winnerStats = winnerSnapshot.val() || {
      playerId: winnerId,
      playerName: winnerName,
      wins: 0,
      losses: 0,
      draws: 0,
      totalGames: 0,
      winStreak: 0,
      bestWinStreak: 0,
      achievements: [],
      modeWins: {},
      lastUpdated: Date.now()
    };
    
    // Update win streak
    const newWinStreak = (winnerStats.winStreak || 0) + 1;
    
    // Check achievements
    if (winnerStats.totalGames === 0) achievements.push('FIRST_BLOOD');
    if (newWinStreak === 3) achievements.push('WIN_STREAK_3');
    if (newWinStreak === 5) achievements.push('WIN_STREAK_5');
    if (newWinStreak === 10) achievements.push('WIN_STREAK_10');
    
    // Game mode specific tracking
    const modeWins = winnerStats.modeWins || {};
    modeWins[gameMode] = (modeWins[gameMode] || 0) + 1;
    
    if (gameMode === 'sudden_death' && modeWins.sudden_death === 3) achievements.push('SUDDEN_DEATH_MASTER');
    if (gameMode === 'blitz' && modeWins.blitz === 5) achievements.push('BLITZ_CHAMPION');
    
    updates[`leaderboard/${winnerId}`] = {
      ...winnerStats,
      playerName: winnerName,
      wins: (winnerStats.wins || 0) + 1,
      totalGames: (winnerStats.totalGames || 0) + 1,
      winStreak: newWinStreak,
      bestWinStreak: Math.max(winnerStats.bestWinStreak || 0, newWinStreak),
      modeWins: modeWins,
      achievements: [...new Set([...(winnerStats.achievements || []), ...achievements])],
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
        achievements: [],
        modeWins: {},
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
    const players = [winnerId, loserId];
    for (const pid of players) {
      const playerRef = ref(db, `leaderboard/${pid}`);
      const playerSnapshot = await get(playerRef);
      const playerStats = playerSnapshot.val() || {
        playerId: pid,
        playerName: pid === winnerId ? winnerName : loserName,
        wins: 0,
        losses: 0,
        draws: 0,
        totalGames: 0,
        winStreak: 0,
        bestWinStreak: 0,
        achievements: [],
        modeWins: {},
        lastUpdated: Date.now()
      };
      
      updates[`leaderboard/${pid}`] = {
        ...playerStats,
        draws: (playerStats.draws || 0) + 1,
        totalGames: (playerStats.totalGames || 0) + 1,
        winStreak: 0,
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