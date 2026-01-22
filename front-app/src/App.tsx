import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './lib/theme-provider';
import { Toaster } from './components/ui/toaster';
import { Footer } from './components/Footer';

// Lazy load das páginas para code splitting
const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const GCDashboard = lazy(() => import('./pages/GCDashboard').then(module => ({ default: module.GCDashboard })));
const PostgreSQLTools = lazy(() => import('./pages/PostgreSQLTools').then(module => ({ default: module.PostgreSQLTools })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <BrowserRouter>
          <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando...</p>
              </div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/gc" element={<GCDashboard />} />
              <Route path="/postgresql" element={<PostgreSQLTools />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Footer />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
