// Home.jsx — Main menu (clean & simple)
import { useNavigate } from 'react-router-dom';

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
    badge: 'Firebase',
  },
    {
    id: 'leaderboard',  // Add this
    label: 'Leaderboard',
    desc: 'View top players worldwide',
    icon: '🏆',
    path: '/leaderboard',
    color: '#ffcc4d',
    glow: 'rgba(255, 204, 77, 0.15)',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
    }}>
      
      {/* Simple Logo Section */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        {/* Mini Board Preview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 40px)',
          gap: 4,
          margin: '0 auto 20px',
          padding: 8,
          borderRadius: 12,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          width: 'fit-content',
        }}>
          {['X', '', 'O', '', 'X', '', 'O', '', 'X'].map((v, i) => (
            <div key={i} style={{
              width: 40, 
              height: 40, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: 6, 
              fontSize: 16, 
              fontWeight: 800,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: v === 'X' ? 'var(--accent-x)' : v === 'O' ? 'var(--accent-o)' : 'transparent',
            }}>
              {v}
            </div>
          ))}
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 7vw, 42px)',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          marginBottom: 8,
        }}>
          Tic<span style={{ color: 'var(--accent-x)' }}>·</span>Tac
          <span style={{ color: 'var(--accent-o)' }}>·</span>Toe
        </h1>
      </div>

      {/* Menu Buttons - Clean & Simple */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        maxWidth: 360,
      }}>
        {MENU_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            style={{
              width: '100%',
              padding: '16px 20px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = item.color;
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.background = 'var(--bg-card)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
            onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ fontSize: 28 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ 
                  fontSize: 16, 
                  fontWeight: 700, 
                  color: 'var(--text-primary)' 
                }}>
                  {item.label}
                </span>
                {item.badge && (
                  <span style={{
                    fontSize: 9, 
                    padding: '2px 6px', 
                    borderRadius: 12,
                    background: 'rgba(255,204,77,0.15)', 
                    color: 'var(--warning)',
                    border: '1px solid rgba(255,204,77,0.2)', 
                    fontWeight: 600,
                  }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {item.desc}
              </p>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}