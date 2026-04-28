// src/components/UserProfile.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../lib/authService';
import { getPlayerStats } from '../lib/gameService';
import toast from 'react-hot-toast';

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    if (currentUser) {
      loadStats(currentUser.uid);
    }
  }, []);

  const loadStats = async (userId) => {
    const playerStats = await getPlayerStats(userId);
    if (playerStats) {
      setStats(playerStats.stats);
    }
  };

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      toast.success('Logged out');
      navigate('/login');
    } else {
      toast.error(result.error);
    }
    setShowMenu(false);
  };

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '30px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '24px' }}>👤</span>
        <span style={{ fontWeight: '600' }}>{user.displayName?.split(' ')[0] || 'Player'}</span>
        <span style={{ fontSize: '12px' }}>▼</span>
      </button>

      {showMenu && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '12px',
          minWidth: '200px',
          zIndex: 100,
        }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 'bold' }}>{user.displayName}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email}</div>
          </div>
          
          {stats && (
            <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-around' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d6d' }}>{stats.wins || 0}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Wins</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffcc4d' }}>{stats.draws || 0}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Draws</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4dffaa' }}>{stats.winRate || 0}%</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Win Rate</div>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={() => navigate('/leaderboard')}
            style={{
              width: '100%',
              padding: '8px 12px',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              borderRadius: '8px',
            }}
          >
            🏆 Leaderboard
          </button>
          
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px 12px',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              color: '#ff4d6d',
              cursor: 'pointer',
              borderRadius: '8px',
            }}
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
}