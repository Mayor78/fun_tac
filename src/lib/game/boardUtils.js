// src/lib/game/boardUtils.js
import { checkWinner } from '../../utils/gameLogic';

// No Firebase imports needed here - pure functions
export function boardToArray(boardObj) {
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

export function boardToObject(boardArray) {
  if (!boardArray || !Array.isArray(boardArray)) return {};
  const obj = {};
  for (let i = 0; i < boardArray.length; i++) {
    if (boardArray[i] !== null && boardArray[i] !== undefined) {
      obj[i] = boardArray[i];
    }
  }
  return obj;
}

export function determineWinner(boardArray) {
  const board = boardToArray(boardArray);
  const xWin = checkWinner(board, 'X');
  if (xWin) return { winner: 'X', line: xWin.line };
  const oWin = checkWinner(board, 'O');
  if (oWin) return { winner: 'O', line: oWin.line };
  const isFull = board.every(cell => cell !== null);
  if (isFull) return { winner: 'draw', line: [] };
  return null;
}