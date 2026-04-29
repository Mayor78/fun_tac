// src/pages/Settings.jsx — Settings page for themes, sounds, and skins
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import themeService, { THEMES, MARKS } from '../lib/themeService';
import soundService from '../lib/soundService';

export default function Settings() {
  const navigate = useNavigate();
  const [activeTheme, setActiveTheme] = useState(themeService.getTheme());
  const [activeMark, setActiveMark]   = useState(themeService.getMarkId());
  const [muted, setMuted]             = useState(soundService.isMuted());
  const [volume, setVolume]           = useState(soundService.getVolume());

  const handleTheme = (id) => {
    themeService.setTheme(id);
    setActiveTheme(id);
    soundService.move();
  };

  const handleMark = (id) => {
    themeService.setMark(id);
    setActiveMark(id);
    soundService.reaction();
  };

  const handleMute = () => {
    const next = !muted;
    soundService.setMuted(next);
    setMuted(next);
    if (!next) soundService.move();
  };

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value);
    soundService.setVolume(v);
    setVolume(v);
    soundService.move();
  };

  const sectionStyle = {
    marginBottom: 28,
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 20,
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
    marginBottom: 12,
  };

  return (
    <div style={{
      minHeight: '100vh',
      maxWidth: 460,
      margin: '0 auto',
      padding: '24px 16px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost" style={{ padding: '8px 14px' }}>
          ← Back
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>⚙️ Settings</h1>
      </div>

      {/* Theme Section */}
      <section style={sectionStyle}>
        <p style={labelStyle}>Board Theme</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {Object.values(THEMES).map(t => (
            <button
              key={t.id}
              onClick={() => handleTheme(t.id)}
              style={{
                padding: '10px 4px',
                borderRadius: 10,
                border: `2px solid ${activeTheme === t.id ? 'var(--accent-o)' : 'var(--border)'}`,
                background: activeTheme === t.id ? 'rgba(77,159,255,0.12)' : 'var(--bg-elevated)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s',
                transform: activeTheme === t.id ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <span style={{ fontSize: 20 }}>{t.emoji}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)' }}>{t.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Mark / Skin Section */}
      <section style={sectionStyle}>
        <p style={labelStyle}>X & O Skins</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {Object.values(MARKS).map(m => (
            <button
              key={m.id}
              onClick={() => handleMark(m.id)}
              style={{
                padding: '12px 8px',
                borderRadius: 10,
                border: `2px solid ${activeMark === m.id ? 'var(--accent-x)' : 'var(--border)'}`,
                background: activeMark === m.id ? 'rgba(255,77,109,0.1)' : 'var(--bg-elevated)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s',
                transform: activeMark === m.id ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              <div style={{ display: 'flex', gap: 8, fontSize: 18 }}>
                <span style={{ color: 'var(--accent-x)' }}>{m.x}</span>
                <span style={{ color: 'var(--accent-o)' }}>{m.o}</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>{m.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Sound Section */}
      <section style={sectionStyle}>
        <p style={labelStyle}>Sound Effects</p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderBottom: '1px solid var(--border)',
          marginBottom: 16,
        }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14 }}>Sound Effects</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Move clicks, win fanfare, countdown ticks
            </p>
          </div>
          <button
            onClick={handleMute}
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              border: 'none',
              background: muted ? 'var(--border)' : 'var(--success)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.3s',
              flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute',
              top: 3,
              left: muted ? 3 : 23,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.25s',
            }} />
          </button>
        </div>

        {!muted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 16 }}>🔈</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolume}
              style={{ flex: 1, accentColor: 'var(--accent-o)' }}
            />
            <span style={{ fontSize: 16 }}>🔊</span>
          </div>
        )}
      </section>

      {/* Preview */}
      <section style={sectionStyle}>
        <p style={labelStyle}>Preview Sounds</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { label: 'Move', fn: () => soundService.move(), emoji: '👆' },
            { label: 'Win', fn: () => soundService.win(), emoji: '🏆' },
            { label: 'Lose', fn: () => soundService.lose(), emoji: '💔' },
            { label: 'Draw', fn: () => soundService.draw(), emoji: '🤝' },
            { label: 'Power-Up', fn: () => soundService.powerUp(), emoji: '⚡' },
            { label: 'Tick', fn: () => soundService.countdown(), emoji: '⏱️' },
          ].map(s => (
            <button
              key={s.label}
              onClick={s.fn}
              className="btn btn-ghost"
              style={{ padding: '10px 8px', flexDirection: 'column', gap: 4, fontSize: 12 }}
            >
              <span style={{ fontSize: 20 }}>{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
