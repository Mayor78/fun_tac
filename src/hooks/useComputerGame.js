// src/hooks/useComputerGame.js (updated AI integration)
import { useState, useEffect, useRef, useCallback } from 'react';
import { createEmptyBoard, makeMove, getGameResult, DIFFICULTIES } from '../utils/gameLogic';
import { GAME_MODES, GAME_CONFIG } from '../lib/game';
import { updateChallengeProgress } from '../lib/game/challengeService';
import ComputerAI from '../ai/ComputerAI';

export function useComputerGame() {
  const [difficulty, setDifficulty] = useState('medium');
  const [gameMode, setGameMode] = useState(GAME_MODES.CLASSIC);
  const [board, setBoard] = useState(createEmptyBoard());
  const [playerSide, setPlayerSide] = useState('X');
  const [currentTurn, setCurrentTurn] = useState('X');
  const [result, setResult] = useState(null);
  const [winLine, setWinLine] = useState([]);
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 });
  const [aiThinking, setAiThinking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [timeBank, setTimeBank] = useState(90);
  const [moveHistory, setMoveHistory] = useState({ X: [], O: [] });
  const [showConfetti, setShowConfetti] = useState(false);
  const [flashColor, setFlashColor] = useState('');
  const [shakeBoard, setShakeBoard] = useState(false);
  const [suddenDeathWarning, setSuddenDeathWarning] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [lastWinner, setLastWinner] = useState(null); // Track who won last
  
  const aiTimeout = useRef(null);
  const timerInterval = useRef(null);
  const aiRef = useRef(null);
  
  const aiSide = playerSide === 'X' ? 'O' : 'X';
  const config = GAME_CONFIG[gameMode];

  // Initialize AI with current settings
  useEffect(() => {
    aiRef.current = new ComputerAI(difficulty, gameMode);
  }, [difficulty, gameMode]);

  // Timer effect based on game mode
  useEffect(() => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    
    if (!result && currentTurn === playerSide && !gameEnded) {
      if (gameMode === GAME_MODES.TIME_BANK && timeBank > 0) {
        timerInterval.current = setInterval(() => {
          setTimeBank(prev => {
            if (prev <= 1) {
              clearInterval(timerInterval.current);
              handleTimeoutLoss();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else if (config?.timePerMove && gameMode !== GAME_MODES.TIME_BANK) {
        setTimeRemaining(config.timePerMove);
        timerInterval.current = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(timerInterval.current);
              handleTimeoutLoss();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
    
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [currentTurn, result, gameEnded, gameMode, playerSide, config?.timePerMove, timeBank]);

  const handleTimeoutLoss = useCallback(() => {
    if (gameEnded) return;
    const winner = aiSide;
    const newScores = { ...scores };
    newScores[winner] = (newScores[winner] || 0) + 1;
    setScores(newScores);
    setResult({ winner, line: [], timeout: true });
    setGameEnded(true);
    setLastWinner(winner);
    setFlashColor('rgba(255,77,109,0.2)');
    updateChallengeProgress('play');
  }, [aiSide, scores, gameEnded]);

  // Sudden Death warning
  useEffect(() => {
    if (gameMode === GAME_MODES.SUDDEN_DEATH && !result && !gameEnded) {
      const filledCount = board.filter(cell => cell !== null).length;
      setSuddenDeathWarning(filledCount >= 6);
    }
  }, [board, gameMode, result, gameEnded]);

  // AI move logic using the new AI class
  useEffect(() => {
    if (result || currentTurn !== aiSide || gameEnded || !aiRef.current) return;
    
    setAiThinking(true);
    
    let delay = 500;
    if (gameMode === GAME_MODES.BLITZ) delay = 200;
    if (gameMode === GAME_MODES.TIME_BANK) delay = 300;
    
    aiTimeout.current = setTimeout(() => {
      const move = aiRef.current.getMove(board, aiSide, playerSide);
      if (move === null) {
        setAiThinking(false);
        return;
      }
      
      const newBoard = makeMove(board, move, aiSide);
      if (!newBoard) {
        setAiThinking(false);
        return;
      }
      
      let newMoveHistory = { ...moveHistory };
      if (gameMode === GAME_MODES.SUDDEN_DEATH) {
        newMoveHistory[aiSide] = [...newMoveHistory[aiSide], move];
        if (newMoveHistory[aiSide].length > 3) {
          const oldestMove = newMoveHistory[aiSide].shift();
          newBoard[oldestMove] = null;
        }
        setMoveHistory(newMoveHistory);
      }
      
      let gameResult = getGameResult(newBoard);
      
      // In Sudden Death, draws are impossible because pieces vanish.
      if (gameResult && gameResult.winner === 'draw' && gameMode === GAME_MODES.SUDDEN_DEATH) {
        gameResult = null;
      }
      
      setBoard(newBoard);
      
      if (gameResult) {
        setResult(gameResult);
        setWinLine(gameResult.line || []);
        setScores(s => ({ ...s, [gameResult.winner]: (s[gameResult.winner] || 0) + 1 }));
        setGameEnded(true);
        setLastWinner(gameResult.winner);
        
        const size = Math.sqrt(newBoard.length);
        if (gameResult.winner === playerSide) {
          updateChallengeProgress('win', { size });
          if (gameMode === GAME_MODES.SUDDEN_DEATH) {
            updateChallengeProgress('mode', { mode: 'sudden_death' });
          }
        }
        updateChallengeProgress('play');
      } else {
        setCurrentTurn(playerSide);
      }
      setAiThinking(false);
    }, delay);
    
    return () => clearTimeout(aiTimeout.current);
  }, [board, currentTurn, aiSide, playerSide, result, gameMode, gameEnded]);

  // Handle player move
  const handleMove = useCallback((index) => {
    if (result || currentTurn !== playerSide || aiThinking || gameEnded) return;
    
    const newBoard = makeMove(board, index, playerSide);
    if (!newBoard) return;
    
    let newMoveHistory = { ...moveHistory };
    if (gameMode === GAME_MODES.SUDDEN_DEATH) {
      newMoveHistory[playerSide] = [...newMoveHistory[playerSide], index];
      if (newMoveHistory[playerSide].length > 3) {
        const oldestMove = newMoveHistory[playerSide].shift();
        newBoard[oldestMove] = null;
      }
      setMoveHistory(newMoveHistory);
    }
    
    let gameResult = getGameResult(newBoard);
    
    if (gameResult && gameResult.winner === 'draw' && gameMode === GAME_MODES.SUDDEN_DEATH) {
      gameResult = null;
    }
    
    setBoard(newBoard);
    
    if (gameResult) {
      setResult(gameResult);
      setWinLine(gameResult.line || []);
      setScores(s => ({ ...s, [gameResult.winner]: (s[gameResult.winner] || 0) + 1 }));
      setGameEnded(true);
      setLastWinner(gameResult.winner);
      
      const size = Math.sqrt(newBoard.length);
      if (gameResult.winner === playerSide) {
        updateChallengeProgress('win', { size });
        if (gameMode === GAME_MODES.SUDDEN_DEATH) {
          updateChallengeProgress('mode', { mode: 'sudden_death' });
        }
      }
      updateChallengeProgress('play');
    } else {
      setCurrentTurn(aiSide);
      if (gameMode !== GAME_MODES.TIME_BANK && config?.timePerMove) {
        setTimeRemaining(config.timePerMove);
      }
    }
  }, [board, currentTurn, playerSide, aiThinking, result, gameMode, config, gameEnded, aiSide]);

  // Trigger effects on game end
  useEffect(() => {
    if (!result) return;
    const isWin = result.winner === playerSide;
    const isLoss = result.winner !== playerSide && result.winner !== 'draw';

    if (isWin) {
      setShowConfetti(true);
      setFlashColor('rgba(77,255,170,0.25)');
      setTimeout(() => setShowConfetti(false), 2200);
    } else if (isLoss) {
      setFlashColor('rgba(255,77,109,0.2)');
      setShakeBoard(true);
      setTimeout(() => setShakeBoard(false), 600);
    } else if (result.winner === 'draw') {
      setFlashColor('rgba(255,204,77,0.15)');
    }
    setTimeout(() => setFlashColor(''), 700);
  }, [result, playerSide]);

  const handleRestart = () => {
    const size = Math.sqrt(board.length);
    clearTimeout(aiTimeout.current);
    clearInterval(timerInterval.current);
    setBoard(createEmptyBoard(size));
    setResult(null);
    setWinLine([]);
    setMoveHistory({ X: [], O: [] });
    // Loser starts the next game (if there was a winner)
    let nextStarter = playerSide;
    if (lastWinner) {
      nextStarter = lastWinner === playerSide ? aiSide : playerSide;
    }
    setCurrentTurn(nextStarter);
    setGameEnded(false);
    setAiThinking(false);
    setShowConfetti(false);
    setShakeBoard(false);
    setSuddenDeathWarning(false);
    if (gameMode === GAME_MODES.TIME_BANK) {
      setTimeBank(90);
    } else if (config?.timePerMove) {
      setTimeRemaining(config.timePerMove);
    }
  };

  const handleApplySettings = (newDifficulty, newPlayerSide, newGameMode, newBoardSize = 3) => {
    setDifficulty(newDifficulty);
    setPlayerSide(newPlayerSide);
    setGameMode(newGameMode);
    setLastWinner(null);
    clearTimeout(aiTimeout.current);
    clearInterval(timerInterval.current);
    setBoard(createEmptyBoard(newBoardSize));
    setResult(null);
    setWinLine([]);
    setMoveHistory({ X: [], O: [] });
    // When starting fresh, the player who chooses X goes first
    setCurrentTurn(newPlayerSide === 'X' ? 'X' : 'O');
    setGameEnded(false);
    setAiThinking(false);
    setShowConfetti(false);
    setShakeBoard(false);
    setSuddenDeathWarning(false);
    if (newGameMode === GAME_MODES.TIME_BANK) {
      setTimeBank(90);
    } else if (GAME_CONFIG[newGameMode]?.timePerMove) {
      setTimeRemaining(GAME_CONFIG[newGameMode].timePerMove);
    }
  };

  return {
    board,
    difficulty,
    gameMode,
    playerSide,
    currentTurn,
    result,
    winLine,
    scores,
    aiThinking,
    timeRemaining,
    timeBank,
    suddenDeathWarning,
    showConfetti,
    flashColor,
    shakeBoard,
    aiSide,
    diff: DIFFICULTIES.find(d => d.key === difficulty),
    config,
    handleMove,
    handleRestart,
    handleApplySettings,
    setDifficulty,
    setPlayerSide,
    setGameMode,
    moveHistory
  };
}