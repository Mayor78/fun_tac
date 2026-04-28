// src/pages/Matchmaking.jsx - FIXED VERSION
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { joinMatchmaking, subscribeToMatchmaking, leaveMatchmaking, getQueueStatus } from '../lib/gameService';
import { getPlayerId } from '../utils/gameLogic';
import toast from 'react-hot-toast';

export default function Matchmaking() {
  const navigate = useNavigate();
  const location = useLocation();
  const playerName = location.state?.playerName || 'Player';
  const [status, setStatus] = useState('initializing');
  const [dots, setDots] = useState('');
  const [waitingTime, setWaitingTime] = useState(0);
  const unsubRef = useRef(null);
  const timerRef = useRef(null);
  const timeIntervalRef = useRef(null);
  const cancelledRef = useRef(false);
  const isMounted = useRef(true);

  // Animated dots
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(timerRef.current);
  }, []);

  // Waiting timer
  useEffect(() => {
    if (status === 'searching') {
      timeIntervalRef.current = setInterval(() => {
        setWaitingTime(t => t + 1);
      }, 1000);
    }
    return () => {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    };
  }, [status]);

  useEffect(() => {
    const playerId = getPlayerId();
    let isSubscribed = true;

    async function start() {
      if (cancelledRef.current || !isMounted.current) return;
      
      try {
        setStatus('connecting');
        
        // Check if already in queue
        const { inQueue } = await getQueueStatus(playerId);
        if (inQueue && !cancelledRef.current) {
          setStatus('searching');
          
          // Listen for match signal
          unsubRef.current = subscribeToMatchmaking(playerId, (data) => {
            if (cancelledRef.current || !isMounted.current) return;
            if (data?.gameId) {
              setStatus('matched');
              toast.success('Opponent found!', { duration: 2000 });
              setTimeout(() => {
                navigate(`/game/${data.gameId}`, {
                  state: { role: data.role || 'X', playerName }
                });
              }, 1000);
            }
          });
          return;
        }
        
        const result = await joinMatchmaking(playerName);
        
        if (cancelledRef.current || !isMounted.current) return;

        if (result.status === 'matched') {
          setStatus('matched');
          setTimeout(() => {
            navigate(`/game/${result.gameId}`, {
              state: { role: result.role, playerName }
            });
          }, 1000);
        } else if (result.status === 'queued') {
          setStatus('searching');
          
          // Listen for match signal
          unsubRef.current = subscribeToMatchmaking(playerId, (data) => {
            if (cancelledRef.current || !isMounted.current) return;
            if (data?.gameId) {
              setStatus('matched');
              toast.success('Opponent found!');
              setTimeout(() => {
                navigate(`/game/${data.gameId}`, {
                  state: { role: data.role || 'X', playerName }
                });
              }, 1000);
            }
          });
        }
      } catch (e) {
        console.error('Matchmaking error:', e);
        if (isMounted.current && !cancelledRef.current) {
          toast.error('Matchmaking error: ' + e.message);
          navigate('/online');
        }
      }
    }

    start();

    return () => {
      cancelledRef.current = true;
      isMounted.current = false;
      if (unsubRef.current) unsubRef.current();
      leaveMatchmaking();
    };
  }, [navigate, playerName]);

  const handleCancel = async () => {
    cancelledRef.current = true;
    if (unsubRef.current) unsubRef.current();
    await leaveMatchmaking();
    navigate('/online');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const statusConfig = {
    initializing: { icon: '⚡', title: 'Initializing', subtitle: 'Preparing matchmaking...', color: '#888' },
    connecting: { icon: '🔌', title: 'Connecting', subtitle: 'Connecting to game server...', color: '#888' },
    searching: { icon: '🔍', title: 'Searching', subtitle: 'Looking for an opponent...', color: '#4d9fff' },
    matched: { icon: '🎯', title: 'Opponent Found!', subtitle: 'Redirecting to game room...', color: '#4dffaa' }
  };

  const config = statusConfig[status] || statusConfig.initializing;

  return (
    <div className="animate-fade-in" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      {/* Animated search visual */}
      <div style={{ position: 'relative', marginBottom: 48 }}>
        {status === 'searching' && [1, 2, 3].map(i => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 60 + i * 45,
            height: 60 + i * 45,
            borderRadius: '50%',
            border: `1px solid ${config.color}`,
            animation: `pulse-ring ${1 + i * 0.3}s ease-out infinite`,
            animationDelay: `${i * 0.2}s`,
            opacity: 0.4 / i,
          }} />
        ))}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: status === 'matched' ? 'rgba(77, 255, 170, 0.15)' : 'var(--bg-elevated)',
          border: `2px solid ${config.color}`,
          fontSize: 36,
          position: 'relative', zIndex: 1,
          transition: 'all 0.4s ease',
        }}>
          {config.icon}
        </div>
      </div>

      {/* Status text */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, color: config.color }}>
          {config.title}{status === 'searching' ? dots : ''}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
          {config.subtitle}
        </p>
        {status === 'searching' && waitingTime > 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
            Waiting: {formatTime(waitingTime)}
          </p>
        )}
      </div>

      {/* Player card */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', background: 'var(--success)', animation: 'pulse-ring 1.5s ease-out infinite', opacity: 0.4 }} />
        </div>
        <span style={{ fontSize: 16, fontWeight: 700 }}>{playerName}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>· {status === 'searching' ? 'Searching...' : 'Connecting...'}</span>
      </div>

      {/* Tips for long wait */}
      {status === 'searching' && waitingTime > 15 && (
        <div style={{ 
          marginBottom: 24, 
          padding: '12px 20px', 
          borderRadius: 12, 
          background: 'rgba(255,204,77,0.08)', 
          border: '1px solid rgba(255,204,77,0.2)',
          fontSize: 13,
          color: 'var(--warning)',
          textAlign: 'center'
        }}>
          💡 Taking a while? Try creating an invite link instead!
        </div>
      )}

      {/* Cancel button */}
      {status !== 'matched' && (
        <button onClick={handleCancel} className="btn btn-ghost" style={{ padding: '12px 28px' }}>
          Cancel Search
        </button>
      )}

      <p style={{ marginTop: 32, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        You'll be matched automatically when another player searches<br />
        or share a game link with a friend
      </p>
    </div>
  );
}