// src/components/EmojiReactions.jsx — In-game quick emoji reactions
import { useState, useEffect, useRef } from 'react';
import { ref, push, onValue, serverTimestamp } from 'firebase/database';
import { db } from '../lib/firebase';
import soundService from '../lib/soundService';

const REACTIONS = [
  { emoji: '🔥', label: 'Fire!' },
  { emoji: '👏', label: 'Nice!' },
  { emoji: '😂', label: 'LOL' },
  { emoji: '💀', label: 'GG' },
  { emoji: '🤝', label: 'Good game' },
  { emoji: '😤', label: 'Oops' },
];

export default function EmojiReactions({ gameId, myRole, opponentName }) {
  const [floating, setFloating] = useState([]);
  const [cooldown, setCooldown] = useState(false);
  const listenerRef = useRef(null);

  // Subscribe to reactions from Firebase
  useEffect(() => {
    if (!gameId) return;
    const reactRef = ref(db, `games/${gameId}/reactions`);
    listenerRef.current = onValue(reactRef, snap => {
      if (!snap.exists()) return;
      const data = snap.val();
      const entries = Object.entries(data || {});
      const latest = entries[entries.length - 1];
      if (!latest) return;
      const [, val] = latest;
      // Only show if it's recent (within last 3s)
      if (Date.now() - (val.ts || 0) < 3000) {
        addFloating(val.emoji, val.from);
      }
    });
    return () => listenerRef.current && listenerRef.current();
  }, [gameId]);

  const addFloating = (emoji, from) => {
    const id = Date.now() + Math.random();
    const x = 30 + Math.random() * 40; // random horizontal %
    setFloating(prev => [...prev, { id, emoji, from, x }]);
    soundService.reaction();
    setTimeout(() => {
      setFloating(prev => prev.filter(f => f.id !== id));
    }, 2200);
  };

  const sendReaction = async (emoji) => {
    if (cooldown || !gameId) return;
    setCooldown(true);
    setTimeout(() => setCooldown(false), 1500);

    try {
      await push(ref(db, `games/${gameId}/reactions`), {
        emoji,
        from: myRole,
        ts: Date.now(),
      });
    } catch (_) {}
  };

  return (
    <>
      {/* Floating emoji overlays */}
      {floating.map(f => (
        <div
          key={f.id}
          style={{
            position: 'fixed',
            bottom: '30%',
            left: `${f.x}%`,
            fontSize: 36,
            zIndex: 200,
            animation: 'floatUp 2.2s ease-out forwards',
            pointerEvents: 'none',
            textAlign: 'center',
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4))',
          }}
        >
          {f.emoji}
          <div style={{ fontSize: 10, color: '#fff', fontWeight: 700, marginTop: 4, background: 'rgba(0,0,0,0.5)', padding: '1px 6px', borderRadius: 8 }}>
            {f.from === myRole ? 'You' : opponentName || 'Opponent'}
          </div>
        </div>
      ))}

      {/* Reaction bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 6,
        flexWrap: 'wrap',
        marginTop: 8,
      }}>
        {REACTIONS.map(r => (
          <button
            key={r.emoji}
            onClick={() => sendReaction(r.emoji)}
            disabled={cooldown}
            title={r.label}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '4px 10px',
              cursor: cooldown ? 'not-allowed' : 'pointer',
              fontSize: 18,
              transition: 'all 0.15s',
              opacity: cooldown ? 0.5 : 1,
              transform: 'scale(1)',
            }}
            onMouseEnter={e => { if (!cooldown) e.currentTarget.style.transform = 'scale(1.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {r.emoji}
          </button>
        ))}
      </div>
    </>
  );
}
