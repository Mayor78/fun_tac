// src/components/TurnIndicator.jsx
import { GAME_CONFIG, GAME_MODES } from '../lib/game';

export default function TurnIndicator({ isMyTurn, currentTurn, playerNames, timeRemaining, timeBank, gameMode, myRole }) {
  const config = GAME_CONFIG[gameMode];
  const isTimeBankMode = gameMode === GAME_MODES.TIME_BANK;
  const timeToShow = isTimeBankMode ? timeBank : timeRemaining;
  
  return (
    <div style={{ textAlign: 'center', marginBottom: 20 }}>
      <div style={{
        display: 'inline-block', padding: '8px 24px', borderRadius: 30,
        background: isMyTurn ? 'rgba(77,255,170,0.2)' : 'rgba(255,255,255,0.05)',
        border: isMyTurn ? '1px solid #4dffaa' : '1px solid var(--border)',
      }}>
        <div>{isMyTurn ? '🎯 YOUR TURN' : `⏳ ${currentTurn}'s turn...`}</div>
        {isMyTurn && config?.timePerMove && (
          <div style={{ 
            fontSize: 24, fontWeight: 'bold', marginTop: 4, 
            color: timeToShow <= 10 ? '#ff4d6d' : '#4dffaa',
            animation: timeToShow <= 5 ? 'pulse 0.5s ease-in-out infinite' : 'none'
          }}>
            {isTimeBankMode ? `⏰ ${timeToShow}s left` : `${timeToShow}s`}
          </div>
        )}
        {isMyTurn && isTimeBankMode && (
          <div style={{ 
            fontSize: 18, fontWeight: 'bold', marginTop: 4,
            color: timeToShow <= 10 ? '#ff4d6d' : '#4dffaa'
          }}>
            ⏰ Bank: {timeToShow}s
          </div>
        )}
      </div>
    </div>
  );
}