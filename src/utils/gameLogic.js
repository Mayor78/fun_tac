// ─────────────────────────────────────────────
// Game Logic Utilities
// ─────────────────────────────────────────────



export const DIFFICULTIES = [
  { key: 'easy', label: 'Easy', emoji: '😌', color: '#4dffaa' },
  { key: 'medium', label: 'Medium', emoji: '🧠', color: '#ffcc4d' },
  { key: 'hard', label: 'Hard', emoji: '💀', color: '#ff4d6d' },
];

/** 
 * Get all possible winning line combinations for a given board size.
 * @param {number} size - Board size (3, 4, or 5)
 * @returns {number[][]}
 */
export function getWinLines(size = 3) {
  const lines = [];
  const winCount = Math.floor(size);
  if (winCount < 3) return []; // Minimum win line is 3

  // Rows
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - winCount; c++) {
      const line = [];
      for (let i = 0; i < winCount; i++) line.push(r * size + (c + i));
      lines.push(line);
    }
  }

  // Columns
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - winCount; r++) {
      const line = [];
      for (let i = 0; i < winCount; i++) line.push((r + i) * size + c);
      lines.push(line);
    }
  }

  // Diagonals (top-left to bottom-right)
  for (let r = 0; r <= size - winCount; r++) {
    for (let c = 0; c <= size - winCount; c++) {
      const line = [];
      for (let i = 0; i < winCount; i++) line.push((r + i) * size + (c + i));
      lines.push(line);
    }
  }

  // Diagonals (top-right to bottom-left)
  for (let r = 0; r <= size - winCount; r++) {
    for (let c = winCount - 1; c < size; c++) {
      const line = [];
      for (let i = 0; i < winCount; i++) line.push((r + i) * size + (c - i));
      lines.push(line);
    }
  }

  return lines;
}



/**
 * Check if a player has won the board.
 * @param {string[]} board - Array of size*size cells
 * @param {string} player - 'X' or 'O'
 * @returns {{ winner: string, line: number[] } | null}
 */
export function checkWinner(board, player) {
  if (!board || board.length < 9) return null;
  const size = Math.round(Math.sqrt(board.length));
  const winLines = getWinLines(size);

  for (const line of winLines) {
    if (line.every(index => board[index] === player)) {
      return { winner: player, line };
    }
  }
  return null;
}

/**
 * Check game result for any winner or draw.
 * @param {string[]} board
 * @returns {{ winner: string, line: number[] } | { winner: 'draw' } | null}
 */
export function getGameResult(board) {
  const xWin = checkWinner(board, 'X');
  if (xWin) return xWin;
  const oWin = checkWinner(board, 'O');
  if (oWin) return oWin;
  if (board.every(cell => cell !== null)) return { winner: 'draw', line: [] };
  return null;
}

/**
 * Create a fresh empty board of given size.
 */
export function createEmptyBoard(size = 3) {
  return Array(size * size).fill(null);
}

/**
 * Make a move on the board (immutable).
 * @param {string[]} board
 * @param {number} index
 * @param {string} player
 * @returns {string[] | null} New board or null if invalid move
 */
export function makeMove(board, index, player) {
  if (board[index] !== null) return null;
  const newBoard = [...board];
  newBoard[index] = player;
  return newBoard;
}

/**
 * Check if the board is full (draw)
 */
export function isBoardFull(board) {
  return board.every(cell => cell !== null);
}

/**
 * Get all empty cell indices
 */
export function getEmptyCells(board) {
  const empty = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) empty.push(i);
  }
  return empty;
}

// AI Logic moved to ComputerAI.js

/**
 * Get a suggested move for the current player (useful for hints)
 */
export function getSuggestedMove(board, currentPlayer, opponentPlayer = currentPlayer === 'X' ? 'O' : 'X') {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return null;

  // First, check if we can win
  for (const i of empty) {
    const b = makeMove(board, i, currentPlayer);
    if (checkWinner(b, currentPlayer)) return i;
  }

  // Then, check if we need to block opponent
  for (const i of empty) {
    const b = makeMove(board, i, opponentPlayer);
    if (checkWinner(b, opponentPlayer)) return i;
  }

  // Take center if available
  const size = Math.sqrt(board.length);
  const mid = Math.floor(board.length / 2);
  if (board[mid] === null) return mid;

  // Random empty move for now (hint only)
  return empty[Math.floor(Math.random() * empty.length)];
}

// ─────────────────────────────────────────────
// Game State Management
// ─────────────────────────────────────────────

/** Generate a random game ID */
export function generateGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/** Generate a simple player ID stored in sessionStorage */
export function getPlayerId() {
  let id = sessionStorage.getItem('ttt_player_id');
  if (!id) {
    id = 'P' + Math.random().toString(36).substring(2, 10).toUpperCase();
    sessionStorage.setItem('ttt_player_id', id);
  }
  return id;
}

/** Get/set player name */
export function getPlayerName() {
  return sessionStorage.getItem('ttt_player_name') || '';
}

export function setPlayerName(name) {
  sessionStorage.setItem('ttt_player_name', name);
}

/**
 * Reset player session (clears stored data)
 */
export function resetPlayerSession() {
  sessionStorage.removeItem('ttt_player_id');
  sessionStorage.removeItem('ttt_player_name');
}

/**
 * Calculate game statistics from an array of game results
 */
export function calculateStats(games) {
  const stats = {
    total: games.length,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0
  };

  games.forEach(game => {
    if (game.result === 'win') stats.wins++;
    else if (game.result === 'loss') stats.losses++;
    else if (game.result === 'draw') stats.draws++;
  });

  if (stats.total > 0) {
    stats.winRate = (stats.wins / stats.total) * 100;
  }

  return stats;
}

/**
 * Get a random game ID for testing or demo
 */
export function getRandomGameId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate if a move is legal
 */
export function isValidMove(board, index) {
  return index >= 0 && index < board.length && board[index] === null;
}

/**
 * Get the next player
 */
export function getNextPlayer(currentPlayer) {
  return currentPlayer === 'X' ? 'O' : 'X';
}

/**
 * Get a visual representation of the board as emoji/string
 */
export function boardToEmoji(board) {
  return board.map(cell => {
    if (cell === 'X') return '❌';
    if (cell === 'O') return '⭕';
    return '⬜';
  }).join(' ');
}

/**
 * Check if the game is in a terminal state (win or draw)
 */
export function isGameTerminal(board) {
  return getGameResult(board) !== null;
}

/**
 * Get the winner symbol or null if game not finished
 */
export function getWinnerSymbol(board) {
  const result = getGameResult(board);
  if (result && result.winner !== 'draw') {
    return result.winner;
  }
  return null;
}

/**
 * Create a deep copy of the board
 */
export function copyBoard(board) {
  return [...board];
}

/**
 * Reset scores for a new session
 */
export function resetScores() {
  return { X: 0, O: 0, draw: 0 };
}