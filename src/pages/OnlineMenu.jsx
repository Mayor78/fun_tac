// OnlineMenu.jsx — Online multiplayer options with Game Modes
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame, joinGame, GAME_MODES, GAME_CONFIG } from '../lib/game';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

// Game Mode Selector Component
function GameModeSelector({ selectedMode, onSelectMode, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const modes = Object.values(GAME_MODES);
  
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 12,
          background: `linear-gradient(135deg, ${GAME_CONFIG[selectedMode]?.color || '#4d9fff'}20, transparent)`,
          border: `1px solid ${GAME_CONFIG[selectedMode]?.color || '#4d9fff'}`,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>{GAME_CONFIG[selectedMode]?.icon || '🎮'}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{GAME_CONFIG[selectedMode]?.name || 'Classic'}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {GAME_CONFIG[selectedMode]?.totalTime 
                ? `${GAME_CONFIG[selectedMode].totalTime}s time bank` 
                : `${GAME_CONFIG[selectedMode]?.timePerMove}s per move`}
            </div>
          </div>
        </div>
        <span>▼</span>
      </button>
      
      {isOpen && !disabled && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 8,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 8,
          zIndex: 100,
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
                padding: '12px',
                textAlign: 'left',
                background: selectedMode === mode ? `linear-gradient(135deg, ${GAME_CONFIG[mode].color}20, transparent)` : 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = `rgba(255,255,255,0.05)`}
              onMouseLeave={e => {
                if (selectedMode !== mode) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: 28 }}>{GAME_CONFIG[mode].icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{GAME_CONFIG[mode].name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {GAME_CONFIG[mode].totalTime 
                    ? `${GAME_CONFIG[mode].totalTime}s time bank • No time per move` 
                    : `${GAME_CONFIG[mode].timePerMove}s per move`}
                </div>
                {mode === GAME_MODES.POWER_UPS && (
                  <div style={{ fontSize: 10, color: '#bf4dff', marginTop: 2 }}>
                    ✨ Special abilities every 3 moves!
                  </div>
                )}
                {mode === GAME_MODES.SUDDEN_DEATH && (
                  <div style={{ fontSize: 10, color: '#ff4d6d', marginTop: 2 }}>
                    💀 No draws - continue until someone wins!
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OnlineMenu() {
  const navigate = useNavigate();
  const { user, userName } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState('');
  const [selectedMode, setSelectedMode] = useState(GAME_MODES.CLASSIC);

  const playerName = userName || 'Player';

  const handleCreate = async () => {
    if (!playerName) { 
      toast.error('Please login first'); 
      return; 
    }
    setLoading('create');
    const toastId = toast.loading(`Creating ${GAME_CONFIG[selectedMode]?.name} game room...`);
    try {
      const gameId = await createGame(playerName, selectedMode);
      toast.success('Game created!', { id: toastId, duration: 2000 });
      navigate(`/game/${gameId}`, { 
        state: { role: 'X', playerName: playerName, gameMode: selectedMode } 
      });
    } catch (e) {
      toast.error('Failed to create game: ' + e.message, { id: toastId });
    } finally {
      setLoading('');
    }
  };

  const handleJoin = async () => {
    if (!playerName) { 
      toast.error('Please login first'); 
      return; 
    }
    const code = joinCode.trim().toUpperCase();
    if (!code) { 
      toast.error('Enter a game code'); 
      return; 
    }
    setLoading('join');
    const toastId = toast.loading('Joining game...');
    try {
      const { role } = await joinGame(code, playerName);
      toast.success('Joined game!', { id: toastId, duration: 2000 });
      navigate(`/game/${code}`, { state: { role, playerName: playerName } });
    } catch (e) {
      toast.error(e.message || 'Failed to join game', { id: toastId });
    } finally {
      setLoading('');
    }
  };

  const handleSearch = () => {
    if (!playerName) { 
      toast.error('Please login first'); 
      return; 
    }
    navigate('/matchmaking', { state: { playerName: playerName } });
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 550, margin: '0 auto', padding: '24px 20px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button 
          onClick={() => navigate('/')} 
          className="btn btn-ghost" 
          style={{ padding: '8px 16px' }}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Online Play</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Real-time multiplayer with game modes</p>
        </div>
      </div>

      {/* Player Info Section */}
      <div className="card" style={{ 
        padding: 20, 
        marginBottom: 24,
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(77, 159, 255, 0.08), rgba(255, 77, 109, 0.05))',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>👤</span>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Playing as
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{playerName}</div>
          </div>
        </div>
        <div style={{ 
          fontSize: 11, 
          color: 'var(--text-muted)', 
          padding: '8px 12px', 
          background: 'var(--bg-elevated)',
          borderRadius: 10,
          fontFamily: 'monospace',
        }}>
          ID: {user?.uid?.substring(0, 12)}…
        </div>
      </div>

      {/* Game Mode Selector */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-muted)' }}>
          🎮 Select Game Mode
        </div>
        <GameModeSelector 
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
          disabled={!!loading}
        />
      </div>

      {/* Options Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Create Game Card */}
        <div className="card" style={{ 
          padding: 24, 
          borderRadius: 20,
          background: `linear-gradient(135deg, ${GAME_CONFIG[selectedMode]?.color}10, transparent)`,
          border: `1px solid ${GAME_CONFIG[selectedMode]?.color}30`,
          transition: 'all 0.3s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Create Game</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Get a shareable invite link
              </p>
            </div>
            <span style={{ fontSize: 32 }}>🔗</span>
          </div>
          <button
            onClick={handleCreate}
            disabled={!!loading}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              padding: '14px',
              fontSize: 15,
              fontWeight: 700,
              background: loading === 'create' ? 'var(--text-muted)' : `linear-gradient(135deg, ${GAME_CONFIG[selectedMode]?.color}, ${GAME_CONFIG[selectedMode]?.color}cc)`,
            }}
          >
            {loading === 'create' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="animate-spin-slow">⚙️</span>
                Creating...
              </span>
            ) : (
              `Create ${GAME_CONFIG[selectedMode]?.name} Game →`
            )}
          </button>
        </div>

        {/* Join Game Card */}
        <div className="card" style={{ 
          padding: 24, 
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(77, 159, 255, 0.05), rgba(77, 159, 255, 0.01))',
          border: '1px solid rgba(77, 159, 255, 0.2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Join by Code</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Enter a game code from your friend
              </p>
            </div>
            <span style={{ fontSize: 32 }}>🎮</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              className="input"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Game code (e.g. A1B2C3)"
              maxLength={8}
              style={{ 
                flex: 1, 
                fontSize: 15,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'monospace',
              }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <button
              onClick={handleJoin}
              disabled={!!loading}
              className="btn btn-primary"
              style={{ 
                whiteSpace: 'nowrap', 
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 700,
                background: loading === 'join' ? 'var(--text-muted)' : 'linear-gradient(135deg, #4d9fff, #4dffaa)',
              }}
            >
              {loading === 'join' ? <span className="animate-spin-slow">⚙️</span> : 'Join →'}
            </button>
          </div>
        </div>

        {/* Quick Match Card */}
        <div className="card" style={{ 
          padding: 24, 
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(255, 77, 109, 0.05), rgba(255, 77, 109, 0.01))',
          border: '1px solid rgba(255, 77, 109, 0.2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Quick Match</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Auto-match with a random online player
              </p>
            </div>
            <span style={{ fontSize: 32 }}>⚡</span>
          </div>
          <button
            onClick={handleSearch}
            disabled={!!loading}
            className="btn btn-ghost"
            style={{ 
              width: '100%', 
              padding: '14px',
              fontSize: 15,
              fontWeight: 700,
              border: '1px solid rgba(255, 77, 109, 0.4)',
              color: 'var(--accent-x)',
            }}
          >
            Search for Opponent →
          </button>
        </div>
      </div>

      {/* How to play */}
      <div style={{ marginTop: 32, padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>🎯 How to Play Online</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 24, height: 24, borderRadius: 12, background: 'rgba(77,255,170,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#4dffaa' }}>1</span>
            <span style={{ fontSize: 13 }}>Select a game mode and create a game</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 24, height: 24, borderRadius: 12, background: 'rgba(77,159,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#4d9fff' }}>2</span>
            <span style={{ fontSize: 13 }}>Share the game code with a friend</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 24, height: 24, borderRadius: 12, background: 'rgba(255,204,77,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#ffcc4d' }}>3</span>
            <span style={{ fontSize: 13 }}>Or use Quick Match to find a random opponent</span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div style={{ marginTop: 24, padding: 12, borderRadius: 12, background: 'rgba(77,255,170,0.05)', border: '1px solid rgba(77,255,170,0.15)', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div className="status-dot status-dot-green" />
          <span style={{ fontSize: 11 }}>Connected as <strong style={{ color: '#4dffaa' }}>{playerName}</strong></span>
        </div>
      </div>
    </div>
  );
}