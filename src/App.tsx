// ============================================================
// Coliflor — App Entry (Router)
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Setup from './pages/Setup';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Streak from './pages/Streak';
import Quiz from './pages/Quiz';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import LoadingScreen from './components/LoadingScreen';

function AppRoutes() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <LoadingScreen message="Cargando tu espacio de pareja..." />;
  }

  if (status === 'unauthenticated') {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  // status === 'ready'
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/streak" element={<Streak />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/setup" element={<Setup />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
