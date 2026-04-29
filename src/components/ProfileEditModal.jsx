import { useState } from 'react';
import { updateUserProfile, changePassword } from '../lib/authService';
import toast from 'react-hot-toast';

export default function ProfileEditModal({ isOpen, onClose, currentName }) {
  const [name, setName] = useState(currentName || '');
  const [newPass, setNewPass] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name cannot be empty');
    setLoading(true);
    const res = await updateUserProfile(name.trim());
    setLoading(false);
    if (res.success) {
      toast.success('Profile updated!');
      onClose();
    } else {
      toast.error(res.error);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPass.length < 6) return toast.error('Password too short');
    setLoading(true);
    const res = await changePassword(newPass);
    setLoading(false);
    if (res.success) {
      toast.success('Password changed!');
      setNewPass('');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      padding: 20
    }}>
      <div className="glass animate-pop-in" style={{
        width: '100%', maxWidth: 400, padding: 32, borderRadius: 32,
        border: '1px solid var(--border-bright)', position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)' }}
        >✕</button>

        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Edit Profile</h2>

        <form onSubmit={handleUpdateProfile} style={{ marginBottom: 32 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>DISPLAY NAME</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input 
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              style={{ flex: 1 }}
            />
            <button disabled={loading} className="btn btn-primary" style={{ padding: '0 16px' }}>Save</button>
          </div>
        </form>

        <form onSubmit={handleChangePassword}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>CHANGE PASSWORD</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input 
              type="password"
              className="input"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="New password"
              style={{ flex: 1 }}
            />
            <button disabled={loading} className="btn btn-ghost" style={{ padding: '0 16px', borderColor: 'var(--accent-o)', color: 'var(--accent-o)' }}>Update</button>
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>Must be at least 6 characters</p>
        </form>

        <button 
          onClick={onClose}
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: 32 }}
        >Close</button>
      </div>
    </div>
  );
}
