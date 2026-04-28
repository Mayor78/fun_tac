// ─────────────────────────────────────────────
// Game Logic Utilities
// ─────────────────────────────────────────────

/** All possible winning line combinations */
export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

/**
 * Check if a player has won the board.
 * @param {string[]} board - Array of 9 cells ('X', 'O', or null)
 * @param {string} player - 'X' or 'O'
 * @returns {{ winner: string, line: number[] } | null}
 */
export function checkWinner(board, player) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] === player && board[b] === player && board[c] === player) {
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
 * Create a fresh empty board.
 */
export function createEmptyBoard() {
  return Array(9).fill(null);
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
  return board.reduce((acc, cell, index) => {
    if (cell === null) acc.push(index);
    return acc;
  }, []);
}

// ─────────────────────────────────────────────
// AI Logic with Enhanced Strategies
// ─────────────────────────────────────────────

/** Get all empty cell indices */
function getEmpty(board) {
  return board.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
}

/** Easy AI: random move */
export function aiMoveEasy(board) {
  const empty = getEmpty(board);
  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}

/** Medium AI: block opponent or win if possible, else strategic */
export function aiMoveMedium(board, aiPlayer = 'O', humanPlayer = 'X') {
  // 1. Try to win immediately
  for (const i of getEmpty(board)) {
    const b = makeMove(board, i, aiPlayer);
    if (checkWinner(b, aiPlayer)) return i;
  }
  
  // 2. Block opponent from winning
  for (const i of getEmpty(board)) {
    const b = makeMove(board, i, humanPlayer);
    if (checkWinner(b, humanPlayer)) return i;
  }
  
  // 3. Take center if available
  if (board[4] === null) return 4;
  
  // 4. Take corners (prioritize opposite corner if opponent has one)
  const corners = [0, 2, 6, 8];
  const opponentCorners = corners.filter(i => board[i] === humanPlayer);
  
  if (opponentCorners.length === 1) {
    const opposite = { 0: 8, 8: 0, 2: 6, 6: 2 };
    const target = opposite[opponentCorners[0]];
    if (target !== undefined && board[target] === null) return target;
  }
  
  const availableCorners = corners.filter(i => board[i] === null);
  if (availableCorners.length > 0) {
    return availableCorners[Math.floor(Math.random() * availableCorners.length)];
  }
  
  // 5. Any remaining move
  const remaining = getEmpty(board);
  if (remaining.length > 0) {
    return remaining[Math.floor(Math.random() * remaining.length)];
  }
  
  return null;
}

/** Hard AI: minimax algorithm with alpha-beta pruning */
export function aiMoveHard(board, aiPlayer = 'O', humanPlayer = 'X') {
  const bestMove = minimaxAlphaBeta(board, true, aiPlayer, humanPlayer, 0, -Infinity, Infinity);
  return bestMove.index;
}

function minimaxAlphaBeta(board, isMaximizing, aiPlayer, humanPlayer, depth, alpha, beta) {
  const result = getGameResult(board);
  
  if (result) {
    if (result.winner === aiPlayer) return { score: 100 - depth };
    if (result.winner === humanPlayer) return { score: depth - 100 };
    return { score: 0 };
  }

  const empty = getEmpty(board);
  let best = isMaximizing ? { score: -Infinity } : { score: Infinity };

  for (const i of empty) {
    const newBoard = makeMove(board, i, isMaximizing ? aiPlayer : humanPlayer);
    const result = minimaxAlphaBeta(newBoard, !isMaximizing, aiPlayer, humanPlayer, depth + 1, alpha, beta);
    result.index = i;
    
    if (isMaximizing) {
      if (result.score > best.score) best = result;
      alpha = Math.max(alpha, result.score);
    } else {
      if (result.score < best.score) best = result;
      beta = Math.min(beta, result.score);
    }
    
    // Alpha-beta pruning
    if (beta <= alpha) break;
  }
  
  return best;
}

/** Get AI move based on difficulty */
export function getAIMove(board, difficulty, aiPlayer = 'O', humanPlayer = 'X') {
  switch (difficulty) {
    case 'easy': return aiMoveEasy(board);
    case 'medium': return aiMoveMedium(board, aiPlayer, humanPlayer);
    case 'hard': return aiMoveHard(board, aiPlayer, humanPlayer);
    default: return aiMoveEasy(board);
  }
}

/**
 * Get a suggested move for the current player (useful for hints)
 */
export function getSuggestedMove(board, currentPlayer, opponentPlayer = currentPlayer === 'X' ? 'O' : 'X') {
  // First, check if we can win
  for (const i of getEmpty(board)) {
    const b = makeMove(board, i, currentPlayer);
    if (checkWinner(b, currentPlayer)) return i;
  }
  
  // Then, check if we need to block opponent
  for (const i of getEmpty(board)) {
    const b = makeMove(board, i, opponentPlayer);
    if (checkWinner(b, opponentPlayer)) return i;
  }
  
  // Take center
  if (board[4] === null) return 4;
  
  // Take corners
  const corners = [0, 2, 6, 8].filter(i => board[i] === null);
  if (corners.length > 0) return corners[0];
  
  // Any move
  const empty = getEmpty(board);
  return empty.length > 0 ? empty[0] : null;
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
  return index >= 0 && index < 9 && board[index] === null;
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