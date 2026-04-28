// OnlineMenu.jsx — Online multiplayer options
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame, joinGame } from '../lib/gameService';
import { getPlayerId, getPlayerName, setPlayerName } from '../utils/gameLogic';
import toast from 'react-hot-toast';

export default function OnlineMenu() {
  const navigate = useNavigate();
  const [playerName, setName] = useState(getPlayerName() || '');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState('');

  const saveName = (val) => {
    setName(val);
    setPlayerName(val);
  };

  const handleCreate = async () => {
    if (!playerName.trim()) { 
      toast.error('Enter your name first'); 
      return; 
    }
    setLoading('create');
    const toastId = toast.loading('Creating game room...');
    try {
      const gameId = await createGame(playerName.trim());
      toast.success('Game created!', { id: toastId, duration: 2000 });
      navigate(`/game/${gameId}`, { state: { role: 'X', playerName: playerName.trim() } });
    } catch (e) {
      toast.error('Failed to create game: ' + e.message, { id: toastId });
    } finally {
      setLoading('');
    }
  };

  const handleJoin = async () => {
    if (!playerName.trim()) { 
      toast.error('Enter your name first'); 
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
      const { role } = await joinGame(code, playerName.trim());
      toast.success('Joined game!', { id: toastId, duration: 2000 });
      navigate(`/game/${code}`, { state: { role, playerName: playerName.trim() } });
    } catch (e) {
      toast.error(e.message || 'Failed to join game', { id: toastId });
    } finally {
      setLoading('');
    }
  };

  const handleSearch = () => {
    if (!playerName.trim()) { 
      toast.error('Enter your name first'); 
      return; 
    }
    setPlayerName(playerName.trim());
    navigate('/matchmaking', { state: { playerName: playerName.trim() } });
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 500, margin: '0 auto', padding: '24px 20px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <button 
          onClick={() => navigate('/')} 
          className="btn btn-ghost" 
          style={{ 
            padding: '8px 16px',
            borderRadius: 10,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
        >
          ← Back
        </button>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Online Play</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Real-time multiplayer via Firebase</p>
        </div>
      </div>

      {/* Player Name Section */}
      <div className="card" style={{ 
        padding: 20, 
        marginBottom: 24,
        borderRadius: 16,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
      }}>
        <label style={{ 
          fontSize: 11, 
          color: 'var(--text-muted)', 
          display: 'block', 
          marginBottom: 8, 
          textTransform: 'uppercase', 
          letterSpacing: '0.08em',
          fontWeight: 700,
        }}>
          Your Name
        </label>
        <input
          className="input"
          value={playerName}
          onChange={e => saveName(e.target.value)}
          placeholder="Enter your name"
          maxLength={20}
          style={{ fontSize: 15 }}
        />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
          Player ID: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>{getPlayerId().substring(0, 12)}…</span>
        </p>
      </div>

      {/* Options Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Create Game Card */}
        <div 
          className="card" 
          style={{ 
            padding: 24, 
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(77, 255, 170, 0.05), rgba(77, 255, 170, 0.01))',
            border: '1px solid rgba(77, 255, 170, 0.2)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'rgba(77, 255, 170, 0.4)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(77, 255, 170, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(77, 255, 170, 0.2)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Create Game</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
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
              background: loading === 'create' ? 'var(--text-muted)' : 'var(--text-primary)',
            }}
          >
            {loading === 'create' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="animate-spin-slow" style={{ fontSize: 14 }}>⚙️</span>
                Creating...
              </span>
            ) : (
              'Create Game →'
            )}
          </button>
        </div>

        {/* Join Game Card */}
        <div 
          className="card" 
          style={{ 
            padding: 24, 
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(77, 159, 255, 0.05), rgba(77, 159, 255, 0.01))',
            border: '1px solid rgba(77, 159, 255, 0.2)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'rgba(77, 159, 255, 0.4)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(77, 159, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(77, 159, 255, 0.2)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Join by Code</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
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
                fontFamily: 'JetBrains Mono, monospace',
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
              }}
            >
              {loading === 'join' ? (
                <span className="animate-spin-slow" style={{ fontSize: 14 }}>⚙️</span>
              ) : (
                'Join →'
              )}
            </button>
          </div>
        </div>

        {/* Quick Match Card */}
        <div 
          className="card" 
          style={{ 
            padding: 24, 
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(255, 77, 109, 0.05), rgba(255, 77, 109, 0.01))',
            border: '1px solid rgba(255, 77, 109, 0.2)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'rgba(255, 77, 109, 0.4)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 77, 109, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'rgba(255, 77, 109, 0.2)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Quick Match</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
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
              border: '1px solid rgba(255, 77, 109, 0.3)',
              color: 'var(--accent-x)',
            }}
          >
            Search for Opponent →
          </button>
        </div>
      </div>

      {/* How it works section */}
      <div style={{ marginTop: 32, padding: 20, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          How to Play Online
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 24, height: 24, borderRadius: 12, background: 'rgba(77, 255, 170, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>1</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Create a game and share the code with a friend</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 24, height: 24, borderRadius: 12, background: 'rgba(77, 159, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent-o)' }}>2</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Or use Quick Match to find a random opponent</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 24, height: 24, borderRadius: 12, background: 'rgba(255, 204, 77, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--warning)' }}>3</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Wait for opponent to join and start playing!</span>
          </div>
        </div>
      </div>

     
    </div>
  );
}