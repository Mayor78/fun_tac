import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Home from './pages/Home';
import LocalGame from './pages/LocalGame';
import ComputerGame from './pages/ComputerGame';
import OnlineMenu from './pages/OnlineMenu';
import Matchmaking from './pages/Matchmaking';
import GameRoom from './pages/GameRoom';
import Leaderboard from './pages/Leaderboard';
import Friends from './pages/Friends';
import Login from './pages/Login';
import Settings from './pages/Settings';
// Init theme on app load
import './lib/themeService';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#16161f',
            color: '#f0f0ff',
            border: '1px solid #2a2a3a',
            borderRadius: '10px',
            fontFamily: 'Syne, sans-serif',
            fontSize: '14px',
            fontWeight: 600,
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/local" element={<PrivateRoute><LocalGame /></PrivateRoute>} />
        <Route path="/computer" element={<PrivateRoute><ComputerGame /></PrivateRoute>} />
        <Route path="/online" element={<PrivateRoute><OnlineMenu /></PrivateRoute>} />
        <Route path="/matchmaking" element={<PrivateRoute><Matchmaking /></PrivateRoute>} />
        <Route path="/game/:gameId" element={<PrivateRoute><GameRoom /></PrivateRoute>} />
        <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
        <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}