// src/pages/Leaderboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard, subscribeToLeaderboard } from '../lib/gameService';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user, userId, userName, userStats: authUserStats } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myStats, setMyStats] = useState(null);
  const [filter, setFilter] = useState('wins');
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile for responsive design
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await getLeaderboard(100);
        setPlayers(data);
        
        // Get current player stats from auth or from leaderboard data
        if (userId) {
          const myPlayerData = data.find(p => p.playerId === userId);
          if (myPlayerData) {
            const winRate = myPlayerData.totalGames > 0 
              ? ((myPlayerData.wins / myPlayerData.totalGames) * 100).toFixed(1) 
              : 0;
            setMyStats({
              ...myPlayerData,
              winRate
            });
          } else if (authUserStats) {
            setMyStats(authUserStats);
          }
        }
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    
    loadLeaderboard();
    
    const unsubscribe = subscribeToLeaderboard((updatedPlayers) => {
      setPlayers(updatedPlayers);
      if (userId) {
        const myPlayerData = updatedPlayers.find(p => p.playerId === userId);
        if (myPlayerData) {
          const winRate = myPlayerData.totalGames > 0 
            ? ((myPlayerData.wins / myPlayerData.totalGames) * 100).toFixed(1) 
            : 0;
          setMyStats({
            ...myPlayerData,
            winRate
          });
        }
      }
    });
    
    return () => unsubscribe();
  }, [userId, authUserStats]);

  const getSortedPlayers = () => {
    const sorted = [...players];
    if (filter === 'wins') {
      sorted.sort((a, b) => b.wins - a.wins);
    } else if (filter === 'winRate') {
      sorted.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
    } else if (filter === 'totalGames') {
      sorted.sort((a, b) => b.totalGames - a.totalGames);
    }
    return sorted.slice(0, isMobile ? 50 : 100);
  };

  const getMedalEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  const topThree = getSortedPlayers().slice(0, 3);
  const restPlayers = getSortedPlayers().slice(3);

  return (
    <div className="animate-fade-in" style={{ 
      maxWidth: 1200, 
      margin: '0 auto', 
      padding: '20px',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-ghost" 
            style={{ padding: '8px 16px' }}
          >
            ← Back
          </button>
          <div>
            <h1 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              🏆 Leaderboard
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Top players ranked by performance
            </p>
          </div>
        </div>
        
        {/* User rank badge */}
        {myStats && myStats.rank && (
          <div style={{
            padding: '8px 16px',
            borderRadius: 30,
            background: 'rgba(77,255,170,0.1)',
            border: '1px solid rgba(77,255,170,0.3)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your Rank: </span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#4dffaa' }}>#{myStats.rank}</span>
          </div>
        )}
      </div>

      {/* My Stats Card - Responsive */}
      {myStats && (
        <div className="card" style={{ 
          padding: '20px', 
          marginBottom: 32,
          background: 'linear-gradient(135deg, rgba(77,255,170,0.08), rgba(77,159,255,0.04))',
          border: '1px solid rgba(77,255,170,0.3)',
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            gap: 16 
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Your Stats
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>{userName || myStats.playerName || 'Player'}</span>
                {myStats.rank && (
                  <span style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: 'rgba(77,255,170,0.2)',
                    color: '#4dffaa',
                  }}>
                    Rank #{myStats.rank}
                  </span>
                )}
              </div>
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${isMobile ? 3 : 5}, 1fr)`,
              gap: isMobile ? 12 : 20,
              width: isMobile ? '100%' : 'auto',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 800, color: 'var(--accent-x)' }}>{myStats.wins || 0}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Wins</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 800, color: 'var(--text-muted)' }}>{myStats.losses || 0}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Losses</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 800, color: 'var(--warning)' }}>{myStats.draws || 0}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Draws</div>
              </div>
              {!isMobile && (
                <>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--success)' }}>{myStats.winRate || 0}%</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Win Rate</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#ffcc4d' }}>🔥{myStats.bestWinStreak || 0}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Best Streak</div>
                  </div>
                </>
              )}
            </div>
          </div>
          {isMobile && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-around', 
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid var(--border)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>{myStats.winRate || 0}%</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Win Rate</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#ffcc4d' }}>🔥{myStats.bestWinStreak || 0}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Best Streak</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top 3 Podium - Responsive */}
      {!loading && topThree.length > 0 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'flex-end',
          gap: isMobile ? 8 : 24,
          marginBottom: 40,
          flexWrap: 'wrap',
        }}>
          {/* 2nd Place */}
          {topThree[1] && (
            <div style={{ textAlign: 'center', order: isMobile ? 0 : 1 }}>
              <div style={{ 
                width: isMobile ? 80 : 100, 
                height: isMobile ? 80 : 100, 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                border: '3px solid #C0C0C0',
              }}>
                <span style={{ fontSize: isMobile ? 32 : 40 }}>🥈</span>
              </div>
              <div style={{ fontWeight: 700 }}>{topThree[1].playerName?.substring(0, 12)}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-x)' }}>{topThree[1].wins || 0}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>wins</div>
            </div>
          )}
          
          {/* 1st Place */}
          {topThree[0] && (
            <div style={{ textAlign: 'center', order: 0 }}>
              <div style={{ 
                width: isMobile ? 100 : 120, 
                height: isMobile ? 100 : 120, 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                border: '3px solid #FFD700',
                boxShadow: '0 0 20px rgba(255,215,0,0.5)',
              }}>
                <span style={{ fontSize: isMobile ? 40 : 48 }}>👑</span>
              </div>
              <div style={{ fontWeight: 800, fontSize: isMobile ? 14 : 16 }}>{topThree[0].playerName?.substring(0, 12)}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#FFD700' }}>{topThree[0].wins || 0}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>wins</div>
            </div>
          )}
          
          {/* 3rd Place */}
          {topThree[2] && (
            <div style={{ textAlign: 'center', order: isMobile ? 0 : 2 }}>
              <div style={{ 
                width: isMobile ? 80 : 100, 
                height: isMobile ? 80 : 100, 
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #CD7F32, #B87333)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                border: '3px solid #CD7F32',
              }}>
                <span style={{ fontSize: isMobile ? 32 : 40 }}>🥉</span>
              </div>
              <div style={{ fontWeight: 700 }}>{topThree[2].playerName?.substring(0, 12)}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-o)' }}>{topThree[2].wins || 0}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>wins</div>
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs - Responsive */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 24, 
        flexWrap: 'wrap',
        justifyContent: isMobile ? 'center' : 'flex-start',
      }}>
        <button
          onClick={() => setFilter('wins')}
          style={{
            padding: isMobile ? '6px 14px' : '8px 20px',
            borderRadius: 30,
            background: filter === 'wins' ? 'var(--accent-x)' : 'var(--bg-elevated)',
            border: `1px solid ${filter === 'wins' ? 'var(--accent-x)' : 'var(--border)'}`,
            color: filter === 'wins' ? 'white' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: isMobile ? 11 : 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🏆 Most Wins
        </button>
        <button
          onClick={() => setFilter('winRate')}
          style={{
            padding: isMobile ? '6px 14px' : '8px 20px',
            borderRadius: 30,
            background: filter === 'winRate' ? 'var(--accent-o)' : 'var(--bg-elevated)',
            border: `1px solid ${filter === 'winRate' ? 'var(--accent-o)' : 'var(--border)'}`,
            color: filter === 'winRate' ? 'white' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: isMobile ? 11 : 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          📊 Best Win Rate
        </button>
        <button
          onClick={() => setFilter('totalGames')}
          style={{
            padding: isMobile ? '6px 14px' : '8px 20px',
            borderRadius: 30,
            background: filter === 'totalGames' ? 'var(--success)' : 'var(--bg-elevated)',
            border: `1px solid ${filter === 'totalGames' ? 'var(--success)' : 'var(--border)'}`,
            color: filter === 'totalGames' ? 'white' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: isMobile ? 11 : 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🎮 Most Games
        </button>
      </div>

      {/* Leaderboard Table - Responsive */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="animate-spin-slow" style={{ fontSize: 48 }}>⚙️</div>
          <p style={{ marginTop: 20, color: 'var(--text-muted)' }}>Loading leaderboard...</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'auto', borderRadius: 16 }}>
          {isMobile ? (
            /* Mobile Card View */
            <div style={{ padding: 12 }}>
              {getSortedPlayers().map((player, idx) => {
                const isCurrentUser = player.playerId === userId;
                const winRate = player.totalGames > 0 ? ((player.wins / player.totalGames) * 100).toFixed(1) : 0;
                return (
                  <div
                    key={player.playerId}
                    style={{
                      padding: '12px',
                      marginBottom: 8,
                      borderRadius: 12,
                      background: isCurrentUser ? 'rgba(77,255,170,0.08)' : 'var(--bg-elevated)',
                      border: `1px solid ${isCurrentUser ? 'rgba(77,255,170,0.3)' : 'var(--border)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, minWidth: 40 }}>
                        {idx < 3 ? getMedalEmoji(idx) : `${idx + 1}`}
                      </span>
                      <span style={{ fontWeight: isCurrentUser ? 800 : 600, flex: 1 }}>
                        {player.playerName || 'Anonymous'}
                        {isCurrentUser && (
                          <span style={{
                            fontSize: 9,
                            marginLeft: 8,
                            padding: '2px 6px',
                            borderRadius: 10,
                            background: 'rgba(77,255,170,0.2)',
                            color: '#4dffaa',
                          }}>
                            You
                          </span>
                        )}
                      </span>
                    </div>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(4, 1fr)', 
                      gap: 8,
                      textAlign: 'center',
                      fontSize: 12,
                    }}>
                      <div><span style={{ color: '#ff4d6d' }}>🏆 {player.wins || 0}</span></div>
                      <div><span style={{ color: '#888' }}>📉 {player.losses || 0}</span></div>
                      <div><span style={{ color: '#ffcc4d' }}>🤝 {player.draws || 0}</span></div>
                      <div><span style={{ color: '#4dffaa' }}>📊 {winRate}%</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Desktop Table View */
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  <th style={{ padding: '16px 12px', textAlign: 'left', width: 70 }}>Rank</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left' }}>Player</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center', width: 80 }}>🏆 Wins</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center', width: 80 }}>📉 Losses</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center', width: 80 }}>🤝 Draws</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center', width: 100 }}>📊 Win Rate</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center', width: 100 }}>🎮 Games</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center', width: 100 }}>🔥 Streak</th>
                </tr>
              </thead>
              <tbody>
                {getSortedPlayers().map((player, idx) => {
                  const isCurrentUser = player.playerId === userId;
                  const winRate = player.totalGames > 0 ? ((player.wins / player.totalGames) * 100).toFixed(1) : 0;
                  return (
                    <tr
                      key={player.playerId}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: isCurrentUser ? 'rgba(77,255,170,0.05)' : 'transparent',
                        transition: 'background 0.2s',
                      }}
                    >
                      <td style={{ padding: '16px 12px', fontWeight: 700, fontSize: 18, textAlign: 'center' }}>
                        {idx < 3 ? getMedalEmoji(idx) : `#${idx + 1}`}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                        {winRate}%
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center', color: '#4d9fff' }}>
                        {player.totalGames || 0}
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center', color: '#ffcc4d' }}>
                        🔥{player.bestWinStreak || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          
          {players.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>🎮</div>
              <p style={{ fontSize: 16 }}>No players yet.</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>Play some games to appear on the leaderboard!</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
        Leaderboard updates in real-time • Compete for the top spot! 🏆
      </p>
    </div>
  );
}