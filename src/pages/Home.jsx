import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import UserProfile from '../components/UserProfile';
import soundService from '../lib/soundService';
import { getDailyChallenges } from '../lib/game/challengeService';
import { logoutUser } from '../lib/authService';
import ProfileEditModal from '../components/ProfileEditModal';
import toast from 'react-hot-toast';

const MENU_ITEMS = [
  {
    id: 'local',
    label: 'Local Multiplayer',
    desc: 'Two players, one device',
    icon: '👥',
    path: '/local',
    color: 'var(--success)',
  },
  {
    id: 'computer',
    label: 'vs Computer',
    desc: 'Easy, Medium, or Hard AI',
    icon: '🤖',
    path: '/computer',
    color: 'var(--accent-o)',
  },
  {
    id: 'online',
    label: 'Online Multiplayer',
    desc: 'Play with anyone, anywhere',
    icon: '🌐',
    path: '/online',
    color: 'var(--accent-x)',
    badge: '',
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    desc: 'View top players worldwide',
    icon: '🏆',
    path: '/leaderboard',
    color: '#ffcc4d',
  },
  {
    id: 'friends',
    label: 'Friends',
    desc: 'Add friends & challenge them',
    icon: '👥',
    path: '/friends',
    color: '#bf4dff',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { user, userName, userStats } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    getDailyChallenges().then(setChallenges);
  }, []);

  const handleLogout = async () => {
    soundService.move();
    const res = await logoutUser();
    if (res.success) {
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top left, #1e1e2e, var(--bg-primary))',
      color: 'var(--text-primary)',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      
      <ProfileEditModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        currentName={userName}
      />

      {/* Dynamic Background Blobs */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(255,77,109,0.05) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(77,159,255,0.05) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

      <div className="hero-grid-container" style={{ maxWidth: 1200, width: '100%', zIndex: 1 }}>

        {/* Left Column: Profile & Dashboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Header Section */}
          <div>
            <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
              TIC<span style={{ color: 'var(--accent-x)' }}>·</span>TAC<br />
              <span style={{ color: 'var(--accent-o)' }}>TOE</span> <span style={{ fontSize: 24, verticalAlign: 'middle', opacity: 0.5 }}>ULTIMATE</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 12, fontSize: 16 }}>
              The most competitive way to play the classic.
            </p>
          </div>

          {/* User Card */}
          <div className="glass" style={{ padding: 32, borderRadius: 32, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 8 }}>
              <button
                onClick={() => { soundService.move(); navigate('/settings'); }}
                className="btn-ghost"
                title="Settings"
                style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >⚙️</button>
              <button
                onClick={handleLogout}
                className="btn-ghost"
                title="Logout"
                style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,77,109,0.1)', color: '#ff4d6d', border: '1px solid rgba(255,77,109,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >🚪</button>
            </div>

            <div 
              onClick={() => { soundService.move(); setShowEditModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, cursor: 'pointer' }}
              title="Edit Profile"
            >
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, var(--accent-x), var(--accent-o))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                {userName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Welcome back, <span style={{ fontSize: 10 }}>✏️</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{userName}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>ELO RATING</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#4dffaa' }}>⚡ {userStats?.elo || 1200}</div>
              </div>
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>COIN BALANCE</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#ffcc4d' }}>🪙 {userStats?.coins || 0}</div>
              </div>
            </div>
          </div>

          {/* Daily Challenges Section */}
          <div className="glass" style={{ padding: 32, borderRadius: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800 }}>Daily Tasks</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>RESETS DAILY</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {challenges.map(c => (
                <div key={c.id} style={{
                  padding: 16,
                  borderRadius: 20,
                  background: c.completed ? 'rgba(77,255,170,0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${c.completed ? 'rgba(77,255,170,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: c.completed ? '#4dffaa' : 'var(--text-primary)' }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.desc}</div>
                    </div>
                    {c.completed ? (
                      <span style={{ fontSize: 16 }}>✅</span>
                    ) : (
                      <span style={{ fontSize: 12, color: '#ffcc4d', fontWeight: 800 }}>+{c.reward} 🪙</span>
                    )}
                  </div>
                  {!c.completed && (
                    <div style={{ height: 4, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                      <div style={{
                        height: '100%',
                        width: `${(c.progress / c.goal) * 100}%`,
                        background: 'linear-gradient(90deg, var(--accent-x), var(--accent-o))',
                        borderRadius: 2,
                        transition: 'width 1s ease'
                      }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Game Modes Grid */}
        <div className="responsive-bento" style={{ gridAutoRows: 'minmax(140px, auto)' }}>
          {MENU_ITEMS.map((item, index) => {
            const isLarge = item.id === 'online';
            return (
              <button
                key={item.id}
                onClick={() => { soundService.move(); navigate(item.path); }}
                className={`bento-btn ${isLarge ? 'bento-span-2' : ''}`}
                style={{
                  padding: 24,
                  borderRadius: 24,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 20,
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  position: 'relative',
                  overflow: 'hidden',
                  textAlign: 'left'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.borderColor = item.color;
                  e.currentTarget.style.boxShadow = `0 20px 40px ${item.color}15`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Decorative Icon Background */}
                <div style={{
                  position: 'absolute',
                  bottom: -20,
                  right: -20,
                  fontSize: 120,
                  opacity: 0.05,
                  transform: 'rotate(-15deg)',
                  pointerEvents: 'none'
                }}>
                  {item.icon}
                </div>

                <div style={{ zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: isLarge ? 48 : 32 }}>{item.icon}</span>
                    {item.badge && (
                      <span style={{ padding: '4px 10px', borderRadius: 20, background: `${item.color}20`, color: item.color, fontSize: 10, fontWeight: 800 }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontSize: isLarge ? 28 : 20, fontWeight: 800 }}>{item.label}</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 200 }}>{item.desc}</p>
                </div>

                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: 'var(--text-muted)'
                }}>
                  →
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Footer */}
      <div style={{ marginTop: 60, display: 'flex', gap: 40, opacity: 0.5, fontSize: 12, fontWeight: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
          <span>942 PLAYERS ONLINE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>VERSION 2.4.0</span>
        </div>
      </div>
    </div>
  );
}