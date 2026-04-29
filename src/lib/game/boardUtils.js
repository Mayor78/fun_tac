// src/lib/game/boardUtils.js
import { checkWinner } from '../../utils/gameLogic';

export function boardToArray(boardObj, size = 3) {
  const length = size * size;
  const arr = Array(length).fill(null);
  if (!boardObj) return arr;
  
  if (Array.isArray(boardObj)) {
    // Normalize array
    for (let i = 0; i < length && i < boardObj.length; i++) {
      arr[i] = boardObj[i] !== undefined ? boardObj[i] : null;
    }
    return arr;
  }
  
  // If it's an object, map keys to array
  for (let i = 0; i < length; i++) {
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
  if (!boardArray || !Array.isArray(boardArray)) return null;
  
  const moveCount = boardArray.filter(c => c !== null).length;
  // Safety checks to prevent instant draws/wins
  if (moveCount < 5 && boardArray.length >= 9) return null;
  if (moveCount < 7 && boardArray.length > 9) return null;

  const xWin = checkWinner(boardArray, 'X');
  if (xWin) return { winner: 'X', line: xWin.line };
  
  const oWin = checkWinner(boardArray, 'O');
  if (oWin) return { winner: 'O', line: oWin.line };
  
  const isFull = boardArray.length >= 9 && boardArray.every(cell => cell === 'X' || cell === 'O');
  if (isFull) return { winner: 'draw', line: [] };
  
  return null;
}