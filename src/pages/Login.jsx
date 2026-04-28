// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { user, login, register, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    let success;
    if (isLogin) {
      success = await login(email, password);
    } else {
      if (!displayName.trim()) {
        toast.error('Please enter your name');
        setLoading(false);
        return;
      }
      success = await register(email, password, displayName);
    }
    
    if (success) {
      navigate('/');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast.error('Enter your email');
      return;
    }
    setLoading(true);
    const result = await resetPassword(resetEmail);
    if (result.success) {
      toast.success('Password reset email sent!');
      setShowReset(false);
      setResetEmail('');
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'var(--bg-primary)'
    }}>
      <div className="card" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '40px',
        borderRadius: '24px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎮</div>
          <h1 style={{ fontSize: '28px', fontWeight: 800 }}>
            Tic<span style={{ color: '#ff4d6d' }}>·</span>Tac
            <span style={{ color: '#4d9fff' }}>·</span>Toe
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>
            {isLogin ? 'Welcome back!' : 'Create an account to start playing'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input"
              style={{ marginBottom: '12px' }}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            style={{ marginBottom: '12px' }}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            style={{ marginBottom: '20px' }}
            required
          />
          
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
          >
            {loading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        {isLogin && (
          <button
            onClick={() => setShowReset(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '12px',
              marginTop: '12px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Forgot password?
          </button>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: '#4d9fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {isLogin ? 'Create an account' : 'Already have an account? Login'}
          </button>
        </div>

        {/* Reset Password Modal */}
        {showReset && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div className="card" style={{ padding: '24px', maxWidth: '300px', width: '90%' }}>
              <h3 style={{ marginBottom: '16px' }}>Reset Password</h3>
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="input"
                style={{ marginBottom: '16px' }}
              />
              <button onClick={handleResetPassword} className="btn btn-primary" style={{ width: '100%', marginBottom: '8px' }}>
                Send Reset Email
              </button>
              <button onClick={() => setShowReset(false)} className="btn btn-ghost" style={{ width: '100%' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}