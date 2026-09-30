// ============================================================
// Coliflor — App Entry (Router)
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Suspense, lazy } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import LoadingScreen from './components/LoadingScreen';

// Lazy-loaded pages for code splitting
const Setup = lazy(() => import('./pages/Setup'));
const Home = lazy(() => import('./pages/Home'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Streak = lazy(() => import('./pages/Streak'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Messages = lazy(() => import('./pages/Messages'));
const Settings = lazy(() => import('./pages/Settings'));
const BucketList = lazy(() => import('./pages/BucketList'));
const MapPage = lazy(() => import('./pages/Map'));

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
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/streak" element={<Streak />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/bucket-list" element={<BucketList />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/setup" element={<Setup />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
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
