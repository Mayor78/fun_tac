// src/config/gameModes.js
export const GAME_MODES = {
  CLASSIC: 'classic',
  NO_DRAW_OVERTIME: 'no_draw_overtime',
  TIME_BANK: 'time_bank',
  BLITZ: 'blitz',
  POWER_UPS: 'power_ups'
};

export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

export const GAME_CONFIG = {
  [GAME_MODES.CLASSIC]: {
    name: 'Classic',
    timePerMove: 60,
    totalTime: null,
    powerUps: false,
    noDrawMode: false,
    icon: '🎯',
    color: '#4d9fff'
  },
  [GAME_MODES.NO_DRAW_OVERTIME]: {
    name: 'Sudden Death',
    timePerMove: 45,
    totalTime: null,
    powerUps: false,
    noDrawMode: true,
    icon: '💀',
    color: '#ff4d6d'
  },
  [GAME_MODES.TIME_BANK]: {
    name: 'Time Bank',
    timePerMove: null,
    totalTime: 90,
    powerUps: false,
    noDrawMode: false,
    icon: '⏰',
    color: '#ffcc4d'
  },
  [GAME_MODES.BLITZ]: {
    name: 'Blitz',
    timePerMove: 10,
    totalTime: null,
    powerUps: false,
    noDrawMode: false,
    icon: '⚡',
    color: '#4dffaa'
  },
  [GAME_MODES.POWER_UPS]: {
    name: 'Power Ups',
    timePerMove: 50,
    totalTime: null,
    powerUps: true,
    noDrawMode: false,
    icon: '✨',
    color: '#bf4dff'
  }
};

export const ACHIEVEMENTS = {
  FIRST_BLOOD: { id: 'first_blood', name: 'First Blood', desc: 'Win your first game', icon: '🏆', points: 10 },
  WIN_STREAK_3: { id: 'win_streak_3', name: 'On Fire!', desc: 'Win 3 games in a row', icon: '🔥', points: 20 },
  WIN_STREAK_5: { id: 'win_streak_5', name: 'Unstoppable!', desc: 'Win 5 games in a row', icon: '💪', points: 50 },
  WIN_STREAK_10: { id: 'win_streak_10', name: 'God Mode', desc: 'Win 10 games in a row', icon: '👑', points: 100 },
  PERFECT_GAME: { id: 'perfect_game', name: 'Perfect Game', desc: 'Win without opponent marking any cell', icon: '🎯', points: 30 },
  SPEED_DEMON: { id: 'speed_demon', name: 'Speed Demon', desc: 'Win in under 10 moves', icon: '⚡', points: 25 },
  COMEBACK_KING: { id: 'comeback_king', name: 'Comeback King', desc: 'Win after being 2 moves from losing', icon: '👑', points: 40 },
  NO_DRAW_MASTER: { id: 'no_draw_master', name: 'Sudden Death Master', desc: 'Win 3 Sudden Death games', icon: '💀', points: 35 },
  BLITZ_CHAMPION: { id: 'blitz_champion', name: 'Blitz Champion', desc: 'Win 5 Blitz games', icon: '⚡', points: 45 }
};