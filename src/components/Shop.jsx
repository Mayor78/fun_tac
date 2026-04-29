import { useState, useEffect } from 'react';
import { getPlayerStats } from '../lib/game/leaderboard';
import { getPlayerId } from '../utils/gameLogic';
import { ref, update, db } from '../lib/firebase';
import toast from 'react-hot-toast';

export default function Shop({ onPurchase }) {
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const playerId = getPlayerId();

  useEffect(() => {
    const fetchStats = async () => {
      const stats = await getPlayerStats(playerId);
      if (stats) setCoins(stats.coins || 0);
    };
    fetchStats();
  }, [playerId]);

  const items = [
    { id: 'time_ext', name: 'Time Extension', desc: '+10s to your timer', cost: 100, icon: '⏰' },
    { id: 'shield', name: 'Cell Shield', desc: 'Protect a cell for 1 turn', cost: 200, icon: '🛡️' },
    { id: 'reveal', name: 'Hint Reveal', desc: 'Reveal the best move', cost: 50, icon: '👁️' },
  ];

  const handleBuy = async (item) => {
    if (coins < item.cost) {
      toast.error('Not enough coins! Win more games to earn coins.');
      return;
    }

    setLoading(true);
    try {
      const newCoins = coins - item.cost;
      await update(ref(db, `leaderboard/${playerId}`), { coins: newCoins });
      setCoins(newCoins);
      onPurchase(item);
      toast.success(`Purchased ${item.name}!`);
    } catch (err) {
      toast.error('Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 400,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800 }}>Item Shop</h3>
        <div style={{ 
          background: 'rgba(255,204,77,0.15)', 
          padding: '4px 12px', 
          borderRadius: 20,
          color: '#ffcc4d',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          🪙 {coins}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(item => (
          <div key={item.id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 12,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 12,
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
            </div>
            <button
              onClick={() => handleBuy(item)}
              disabled={loading || coins < item.cost}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: coins >= item.cost ? 'var(--accent-x)' : 'var(--bg-elevated)',
                color: 'white',
                border: 'none',
                fontWeight: 700,
                fontSize: 12,
                cursor: coins >= item.cost ? 'pointer' : 'not-allowed',
                opacity: coins >= item.cost ? 1 : 0.5,
              }}
            >
              {item.cost} 🪙
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
