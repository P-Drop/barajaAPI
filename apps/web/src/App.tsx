import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute';

import HomePage from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { GamePage } from './pages/GamePage';
import { RankingPage } from './pages/RankingPage';

function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/ranking" element={<RankingPage />} />

      {/* Protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/play" element={<GamePage />} />
      </Route>

      {/* Home (pública por ahora; el deck vive aquí) */}
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}

export default App;
