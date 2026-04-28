// src/components/AchievementsModal.jsx
import { useState, useEffect } from 'react';
import { ACHIEVEMENTS } from '../config/gameModes';
import { getAchievements, unlockAchievement } from '../lib/gameService';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function AchievementsModal({ isOpen, onClose, newAchievement }) {
  const { userId } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [showNew, setShowNew] = useState(null);
  
  useEffect(() => {
    if (userId && isOpen) {
      loadAchievements();
    }
  }, [userId, isOpen]);
  
  useEffect(() => {
    if (newAchievement) {
      setShowNew(newAchievement);
      setTimeout(() => setShowNew(null), 3000);
    }
  }, [newAchievement]);
  
  const loadAchievements = async () => {
    const unlocked = await getAchievements(userId);
    setAchievements(unlocked || []);
  };
  
  const isUnlocked = (achievementId) => {
    return achievements.includes(achievementId);
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* New Achievement Toast */}
      {showNew && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #ffcc4d, #ff4d6d)',
          padding: '12px 24px',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 2000,
          animation: 'slideUp 0.3s ease',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          <span style={{ fontSize: 28 }}>🏆</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Achievement Unlocked!</div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{ACHIEVEMENTS[showNew]?.name}</div>
          </div>
        </div>
      )}
      
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 24,
          maxWidth: 600,
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          padding: 24,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800 }}>🏆 Achievements</h2>
            <button onClick={onClose} className="btn btn-ghost">✕</button>
          </div>
          
          <div style={{ display: 'grid', gap: 12 }}>
            {Object.entries(ACHIEVEMENTS).map(([key, achievement]) => {
              const unlocked = isUnlocked(key);
              return (
                <div
                  key={key}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: unlocked ? 'rgba(77,255,170,0.08)' : 'var(--bg-elevated)',
                    border: `1px solid ${unlocked ? 'rgba(77,255,170,0.3)' : 'var(--border)'}`,
                    opacity: unlocked ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    transition: 'all 0.3s',
                  }}
                >
                  <span style={{ fontSize: 40 }}>{achievement.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {achievement.name}
                      {unlocked && (
                        <span style={{ fontSize: 10, color: '#4dffaa' }}>✓ Unlocked</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {achievement.desc}
                    </div>
                    <div style={{ fontSize: 10, color: '#ffcc4d', marginTop: 4 }}>
                      +{achievement.points} points
                    </div>
                  </div>
                  {unlocked ? (
                    <span style={{ fontSize: 24 }}>🏆</span>
                  ) : (
                    <span style={{ fontSize: 24, opacity: 0.3 }}>🔒</span>
                  )}
                </div>
              );
            })}
          </div>
          
          <div style={{ marginTop: 20, padding: 16, background: 'rgba(77,255,170,0.05)', borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Complete achievements to earn points and climb the leaderboard!
            </div>
          </div>
        </div>
      </div>
    </>
  );
}