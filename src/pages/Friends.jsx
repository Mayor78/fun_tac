import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import soundService from '../lib/soundService';

export default function Friends() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 64, marginBottom: 24 }}>👥</div>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>Friends System</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 400 }}>
        The Friends system is coming in Phase 3! Soon you'll be able to add friends, see their status, and send direct challenges.
      </p>
      
      <div className="card" style={{ padding: '24px', marginBottom: 32, border: '1px dashed var(--border)', background: 'transparent' }}>
        <p style={{ fontSize: 14, margin: 0, opacity: 0.6 }}>
          🛠️ Work in Progress
        </p>
      </div>

      <button
        onClick={() => { soundService.move(); navigate('/'); }}
        className="btn btn-primary"
        style={{ padding: '12px 32px' }}
      >
        Back to Home
      </button>
    </div>
  );
}
