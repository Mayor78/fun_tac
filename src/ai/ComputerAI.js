// src/ai/ComputerAI.js
import { makeMove, getGameResult } from '../utils/gameLogic';
import { GAME_MODES } from '../lib/game';

class ComputerAI {
  constructor(difficulty = 'medium', gameMode = GAME_MODES.CLASSIC) {
    this.difficulty = difficulty;
    this.gameMode = gameMode;
    this.moveHistory = [];
  }

  // Get all empty cells
  getEmptyCells(board) {
    const empty = [];
    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) empty.push(i);
    }
    return empty;
  }

  // Check if move wins the game
  wouldWin(board, move, player) {
    const testBoard = makeMove([...board], move, player);
    const result = getGameResult(testBoard);
    return result && result.winner === player;
  }

  // Check if move blocks opponent
  wouldBlock(board, move, player, opponent) {
    const testBoard = makeMove([...board], move, opponent);
    const result = getGameResult(testBoard);
    return result && result.winner === opponent;
  }

  // Get all winning patterns for current board size
  getWinningPatterns(board) {
    const size = Math.sqrt(board.length);
    const patterns = [];
    const winCount = size;

    // Rows
    for (let r = 0; r < size; r++) {
      for (let c = 0; c <= size - winCount; c++) {
        const pattern = [];
        for (let i = 0; i < winCount; i++) pattern.push(r * size + (c + i));
        patterns.push(pattern);
      }
    }

    // Columns
    for (let c = 0; c < size; c++) {
      for (let r = 0; r <= size - winCount; r++) {
        const pattern = [];
        for (let i = 0; i < winCount; i++) pattern.push((r + i) * size + c);
        patterns.push(pattern);
      }
    }

    // Diagonals
    for (let r = 0; r <= size - winCount; r++) {
      for (let c = 0; c <= size - winCount; c++) {
        const diag1 = [];
        const diag2 = [];
        for (let i = 0; i < winCount; i++) {
          diag1.push((r + i) * size + (c + i));
          diag2.push((r + i) * size + (c + winCount - 1 - i));
        }
        patterns.push(diag1);
        patterns.push(diag2);
      }
    }

    return patterns;
  }

  // Evaluate board score for minimax
  evaluateBoard(board, aiPlayer, humanPlayer) {
    const result = getGameResult(board);
    if (result) {
      if (result.winner === aiPlayer) return 1000;
      if (result.winner === humanPlayer) return -1000;
      if (result.winner === 'draw') return 0;
    }
    
    let score = 0;
    const patterns = this.getWinningPatterns(board);
    const size = Math.sqrt(board.length);
    
    for (const pattern of patterns) {
      let ai = 0, human = 0;
      for (const idx of pattern) {
        if (board[idx] === aiPlayer) ai++;
        else if (board[idx] === humanPlayer) human++;
      }
      
      if (ai > 0 && human === 0) score += Math.pow(10, ai);
      if (human > 0 && ai === 0) score -= Math.pow(10, human);
    }
    
    // Center control
    const mid = Math.floor(board.length / 2);
    if (board[mid] === aiPlayer) score += size * 2;
    if (board[mid] === humanPlayer) score -= size * 2;
    
    return score;
  }

  // Minimax algorithm with alpha-beta pruning
  minimax(board, depth, isMaximizing, alpha, beta, aiPlayer, humanPlayer) {
    const score = this.evaluateBoard(board, aiPlayer, humanPlayer);
    
    if (Math.abs(score) === 100 || depth === 0) {
      return score;
    }
    
    const emptyCells = this.getEmptyCells(board);
    if (emptyCells.length === 0) return 0;
    
    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const move of emptyCells) {
        const newBoard = makeMove([...board], move, aiPlayer);
        const moveScore = this.minimax(newBoard, depth - 1, false, alpha, beta, aiPlayer, humanPlayer);
        maxScore = Math.max(maxScore, moveScore);
        alpha = Math.max(alpha, moveScore);
        if (beta <= alpha) break;
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const move of emptyCells) {
        const newBoard = makeMove([...board], move, humanPlayer);
        const moveScore = this.minimax(newBoard, depth - 1, true, alpha, beta, aiPlayer, humanPlayer);
        minScore = Math.min(minScore, moveScore);
        beta = Math.min(beta, moveScore);
        if (beta <= alpha) break;
      }
      return minScore;
    }
  }

  // Get best move using minimax (Hard mode)
  getBestMove(board, aiPlayer, humanPlayer) {
    const emptyCells = this.getEmptyCells(board);
    if (emptyCells.length === 0) return null;

    // Opening move: take center
    const mid = Math.floor(board.length / 2);
    if (board[mid] === null) return mid;

    let bestMove = emptyCells[0];
    let bestScore = -Infinity;
    
    // Depth limit based on board size to prevent lag
    const maxDepth = board.length > 9 ? 3 : 5;
    
    for (const move of emptyCells) {
      const newBoard = makeMove([...board], move, aiPlayer);
      const moveScore = this.minimax(newBoard, maxDepth, false, -Infinity, Infinity, aiPlayer, humanPlayer);
      if (moveScore > bestScore) {
        bestScore = moveScore;
        bestMove = move;
      }
    }
    return bestMove;
  }

  // Get move for Medium difficulty
  getMediumMove(board, aiPlayer, humanPlayer) {
    const emptyCells = this.getEmptyCells(board);
    const size = Math.sqrt(board.length);
    
    // Try to win
    for (const move of emptyCells) {
      if (this.wouldWin(board, move, aiPlayer)) return move;
    }
    
    // Block opponent
    for (const move of emptyCells) {
      if (this.wouldBlock(board, move, aiPlayer, humanPlayer)) return move;
    }
    
    // Take center
    const mid = Math.floor(board.length / 2);
    if (board[mid] === null) return mid;
    
    // Random empty cell for others
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  // Get move for Easy difficulty
  getEasyMove(board, aiPlayer, humanPlayer) {
    const emptyCells = this.getEmptyCells(board);
    
    // 30% chance to block or win
    if (Math.random() < 0.3) {
      for (const move of emptyCells) {
        if (this.wouldWin(board, move, aiPlayer)) return move;
      }
      for (const move of emptyCells) {
        if (this.wouldBlock(board, move, aiPlayer, humanPlayer)) return move;
      }
    }
    
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  // Main function to get AI move
  getMove(board, aiPlayer, humanPlayer) {
    const emptyCells = this.getEmptyCells(board);
    if (emptyCells.length === 0) return null;
    
    // Fast mode for Blitz
    if (this.gameMode === GAME_MODES.BLITZ) {
      return this.getMediumMove(board, aiPlayer, humanPlayer);
    }
    
    switch(this.difficulty) {
      case 'easy':
        return this.getEasyMove(board, aiPlayer, humanPlayer);
      case 'medium':
        return this.getMediumMove(board, aiPlayer, humanPlayer);
      case 'hard':
        return this.getBestMove(board, aiPlayer, humanPlayer);
      default:
        return this.getMediumMove(board, aiPlayer, humanPlayer);
    }
  }
}

export default ComputerAI;