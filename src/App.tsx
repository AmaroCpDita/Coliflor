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
import AppErrorBoundary from './components/AppErrorBoundary';

// Lazy-loaded pages for code splitting
const Setup = lazy(() => import('./pages/Setup'));
const Home = lazy(() => import('./pages/Home'));
const Calendar = lazy(() => import('./pages/Calendar'));
const STREAK_RELOAD_KEY = 'coliflor:streak-chunk-reload';
const Streak = lazy(async () => {
  try {
    const page = await import('./pages/Streak');
    sessionStorage.removeItem(STREAK_RELOAD_KEY);
    return page;
  } catch (error) {
    // An open PWA can still point at a chunk removed by a newer deployment.
    // Reload once to fetch the current entry point, then surface persistent errors.
    if (!sessionStorage.getItem(STREAK_RELOAD_KEY)) {
      sessionStorage.setItem(STREAK_RELOAD_KEY, '1');
      window.location.reload();
      return new Promise<never>(() => {});
    }
    throw error;
  }
});
const Quiz = lazy(() => import('./pages/Quiz'));
const Messages = lazy(() => import('./pages/Messages'));
const Settings = lazy(() => import('./pages/Settings'));
const BucketList = lazy(() => import('./pages/BucketList'));
const MapPage = lazy(() => import('./pages/Map'));
const OurWorldPage = lazy(() => import('./features/our-world/OurWorldPage'));
const WidgetPreview = lazy(() => import('./pages/WidgetPreview'));

import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

function AppRoutes() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <LoadingScreen message="Cargando tu espacio de pareja..." />;
  }

  if (status === 'unauthenticated') {
    return (
      <Routes>
        <Route path="/widget-preview" element={<WidgetPreview />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  // status === 'ready'
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/widget-preview" element={<WidgetPreview />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/streak" element={<Streak />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/bucket-list" element={<BucketList />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/world" element={<OurWorldPage />} />
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
          <AppErrorBoundary>
            <AppRoutes />
          </AppErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
