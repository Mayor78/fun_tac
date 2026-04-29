import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToGlobalChallenges, acceptGlobalChallenge } from '../lib/game/matchmaking';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import soundService from '../lib/soundService';

export default function ChallengeListener() {
  const navigate = useNavigate();
  const { user, userName } = useAuth();
  const [activeChallenges, setActiveChallenges] = useState(new Set());

  useEffect(() => {
    if (!user) return;

    console.log('📡 ChallengeListener: Subscribing...');
    const unsubscribe = subscribeToGlobalChallenges((challenges) => {
      console.log('📬 Challenges received:', challenges.length);
      setActiveChallenges(prev => {
        const next = new Set(prev);
        let changed = false;
        challenges.forEach((challenge) => {
          if (!next.has(challenge.id)) {
            console.log('⚔️ New challenge detected:', challenge.hostName);
            showChallengeToast(challenge);
            next.add(challenge.id);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, user.uid);

    return () => {
      console.log('🔇 ChallengeListener: Unsubscribing');
      unsubscribe();
    };
  }, [user?.uid]);

  const showChallengeToast = (challenge) => {
    // DON'T show toast if user is already on matchmaking page
    if (window.location.pathname === '/matchmaking') return;

    soundService.notification?.();
    
    toast((t) => (
      <div style={{ minWidth: 260 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ 
            width: 40, height: 40, borderRadius: '50%', 
            background: 'var(--accent-x)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', fontSize: 20 
          }}>
            ⚔️
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{challenge.hostName} challenged everyone!</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {challenge.size}x{challenge.size} • {challenge.mode.toUpperCase()}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const { gameId, role } = await acceptGlobalChallenge(challenge.id, userName);
                soundService.move();
                navigate(`/game/${gameId}`, { state: { role, myName: userName } });
              } catch (err) {
                toast.error(err.message);
              }
            }}
            style={{
              flex: 1, padding: '8px', borderRadius: 8,
              background: 'var(--text-primary)', color: 'var(--bg-primary)',
              border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer'
            }}
          >
            Accept
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              padding: '8px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)',
              border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer'
            }}
          >
            Ignore
          </button>
        </div>
      </div>
    ), {
      duration: 25000, // Long duration
      position: 'bottom-right',
      style: {
        background: 'var(--bg-elevated)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-bright)',
        padding: '16px',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }
    });
  };

  return null; // This component has no UI of its own
}
