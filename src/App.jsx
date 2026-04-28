// App.jsx — Root component with routing
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import LocalGame from './pages/LocalGame';
import ComputerGame from './pages/ComputerGame';
import OnlineMenu from './pages/OnlineMenu';
import Matchmaking from './pages/Matchmaking';
import GameRoom from './pages/GameRoom';
import Leaderboard from './pages/Leaderboard';

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
          success: { iconTheme: { primary: '#4dffaa', secondary: '#16161f' } },
          error: { iconTheme: { primary: '#ff4d6d', secondary: '#16161f' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/local" element={<LocalGame />} />
        <Route path="/computer" element={<ComputerGame />} />
        <Route path="/online" element={<OnlineMenu />} />
        <Route path="/matchmaking" element={<Matchmaking />} />
        <Route path="/game/:gameId" element={<GameRoom />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}
