// src/pages/Leaderboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard, subscribeToLeaderboard, getPlayerStats } from '../lib/gameService';
import { getPlayerId, getPlayerName } from '../utils/gameLogic';
import toast from 'react-hot-toast';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myStats, setMyStats] = useState(null);
  const [filter, setFilter] = useState('wins'); // wins, winRate, totalGames
  const playerId = getPlayerId();
  const playerName = getPlayerName();

  useEffect(() => {
    // Load leaderboard
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await getLeaderboard(50);
        setPlayers(data);
        
        // Get current player stats
        const stats = await getPlayerStats(playerId);
        if (stats) {
          setMyStats(stats);
        }
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    
    loadLeaderboard();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToLeaderboard((updatedPlayers) => {
      setPlayers(updatedPlayers);
    });
    
    return () => unsubscribe();
  }, [playerId]);

  const getSortedPlayers = () => {
    const sorted = [...players];
    if (filter === 'wins') {
      sorted.sort((a, b) => b.wins - a.wins);
    } else if (filter === 'winRate') {
      sorted.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
    } else if (filter === 'totalGames') {
      sorted.sort((a, b) => b.totalGames - a.totalGames);
    }
    return sorted.slice(0, 20);
  };

  const getMedalEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px', minHeight: '100vh' }}>
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
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
            🏆 Leaderboard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Top players ranked by wins
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('wins')}
          style={{
            padding: '8px 20px',
            borderRadius: 30,
            background: filter === 'wins' ? 'var(--accent-x)' : 'var(--bg-elevated)',
            border: `1px solid ${filter === 'wins' ? 'var(--accent-x)' : 'var(--border)'}`,
            color: filter === 'wins' ? 'white' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🏆 Most Wins
        </button>
        <button
          onClick={() => setFilter('winRate')}
          style={{
            padding: '8px 20px',
            borderRadius: 30,
            background: filter === 'winRate' ? 'var(--accent-o)' : 'var(--bg-elevated)',
            border: `1px solid ${filter === 'winRate' ? 'var(--accent-o)' : 'var(--border)'}`,
            color: filter === 'winRate' ? 'white' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          📊 Best Win Rate
        </button>
        <button
          onClick={() => setFilter('totalGames')}
          style={{
            padding: '8px 20px',
            borderRadius: 30,
            background: filter === 'totalGames' ? 'var(--success)' : 'var(--bg-elevated)',
            border: `1px solid ${filter === 'totalGames' ? 'var(--success)' : 'var(--border)'}`,
            color: filter === 'totalGames' ? 'white' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🎮 Most Games
        </button>
      </div>

      {/* My Stats Card */}
      {myStats && (
        <div className="card" style={{ 
          padding: '20px', 
          marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(77,255,170,0.1), rgba(77,159,255,0.05))',
          border: '1px solid rgba(77,255,170,0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Your Stats
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>
                {playerName || myStats.playerName}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-x)' }}>{myStats.wins || 0}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Wins</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-muted)' }}>{myStats.losses || 0}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Losses</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--warning)' }}>{myStats.draws || 0}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Draws</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--success)' }}>{myStats.winRate || 0}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Win Rate</div>
              </div>
              {myStats.bestWinStreak > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#ffcc4d' }}>🔥{myStats.bestWinStreak}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Best Streak</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="animate-spin-slow" style={{ fontSize: 40 }}>⚙️</div>
          <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Loading leaderboard...</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                <th style={{ padding: '16px 12px', textAlign: 'left', width: 60 }}>#</th>
                <th style={{ padding: '16px 12px', textAlign: 'left' }}>Player</th>
                <th style={{ padding: '16px 12px', textAlign: 'center', width: 80 }}>
                  <span style={{ color: '#ff4d6d' }}>🏆 Wins</span>
                </th>
                <th style={{ padding: '16px 12px', textAlign: 'center', width: 80 }}>
                  <span style={{ color: '#888' }}>📉 Losses</span>
                </th>
                <th style={{ padding: '16px 12px', textAlign: 'center', width: 80 }}>
                  <span style={{ color: '#ffcc4d' }}>🤝 Draws</span>
                </th>
                <th style={{ padding: '16px 12px', textAlign: 'center', width: 100 }}>
                  <span style={{ color: '#4dffaa' }}>📊 Win Rate</span>
                </th>
                <th style={{ padding: '16px 12px', textAlign: 'center', width: 100 }}>
                  <span style={{ color: '#4d9fff' }}>🎮 Games</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {getSortedPlayers().map((player, idx) => {
                const isCurrentUser = player.playerId === playerId;
                return (
                  <tr
                    key={player.playerId}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: isCurrentUser ? 'rgba(77,255,170,0.05)' : 'transparent',
                      transition: 'background 0.2s',
                    }}
                  >
                    <td style={{ padding: '16px 12px', fontWeight: 700, fontSize: 18 }}>
                      {getMedalEmoji(idx)}
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: isCurrentUser ? 800 : 600 }}>
                          {player.playerName || 'Anonymous'}
                        </span>
                        {isCurrentUser && (
                          <span style={{
                            fontSize: 10,
                            padding: '2px 8px',
                            borderRadius: 20,
                            background: 'rgba(77,255,170,0.2)',
                            color: '#4dffaa',
                          }}>
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 700, color: '#ff4d6d' }}>
                      {player.wins || 0}
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {player.losses || 0}
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center', color: '#ffcc4d' }}>
                      {player.draws || 0}
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 700, color: '#4dffaa' }}>
                      {player.winRate || 0}%
                    </td>
                    <td style={{ padding: '16px 12px', textAlign: 'center', color: '#4d9fff' }}>
                      {player.totalGames || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {players.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
              <p>No players yet. Play some games to appear on the leaderboard!</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        Leaderboard updates in real-time as games are completed
      </p>
    </div>
  );
}