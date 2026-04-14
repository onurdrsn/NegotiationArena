import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, ReactNode } from 'react';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import ModeSelect from './pages/ModeSelect';
import Game from './pages/Game';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import CreateScenario from './pages/CreateScenario';
import Community from './pages/Community';
import MultiplayerLobby from './pages/MultiplayerLobby';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import { useAuth } from './hooks/useAuth';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-white">Yükleniyor...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (user && user.isEmailVerified === false) {
    return <Navigate to="/auth" />;
  }
  return children;
}

function App() {
  const { fetchMe, loading } = useAuth();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (loading) {
    return <div className="h-screen flex text-white justify-center items-center">Yükleniyor...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen text-white relative z-10 flex flex-col">
        <Toast />
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/google-complete" element={<Auth />} />
            <Route path="/select-mode" element={<ProtectedRoute><ModeSelect /></ProtectedRoute>} />
            <Route path="/create-scenario" element={<ProtectedRoute><CreateScenario /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/multiplayer" element={<ProtectedRoute><MultiplayerLobby /></ProtectedRoute>} />
            <Route path="/game" element={<ProtectedRoute><Game /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
