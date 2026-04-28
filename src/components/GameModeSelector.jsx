// src/components/GameModeSelector.jsx
import { useState } from 'react';
import { GAME_MODES, GAME_CONFIG } from '../config/gameModes';

export default function GameModeSelector({ selectedMode, onSelectMode, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const modes = Object.values(GAME_MODES);
  
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          padding: '10px 16px',
          borderRadius: 12,
          background: `linear-gradient(135deg, ${GAME_CONFIG[selectedMode]?.color || '#4d9fff'}20, transparent)`,
          border: `1px solid ${GAME_CONFIG[selectedMode]?.color || '#4d9fff'}`,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span>{GAME_CONFIG[selectedMode]?.icon || '🎮'}</span>
        <span style={{ fontWeight: 600 }}>{GAME_CONFIG[selectedMode]?.name || 'Classic'}</span>
        <span>▼</span>
      </button>
      
      {isOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 8,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 8,
          zIndex: 100,
          minWidth: 180,
        }}>
          {modes.map(mode => (
            <button
              key={mode}
              onClick={() => {
                onSelectMode(mode);
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                textAlign: 'left',
                background: selectedMode === mode ? `linear-gradient(135deg, ${GAME_CONFIG[mode].color}20, transparent)` : 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = `rgba(255,255,255,0.05)`}
              onMouseLeave={e => {
                if (selectedMode !== mode) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: 20 }}>{GAME_CONFIG[mode].icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{GAME_CONFIG[mode].name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {GAME_CONFIG[mode].totalTime ? `${GAME_CONFIG[mode].totalTime}s bank` : `${GAME_CONFIG[mode].timePerMove}s per move`}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}