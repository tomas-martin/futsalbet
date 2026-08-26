import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CheckCircle2, X } from 'lucide-react';

import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';

import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Partidos } from './pages/Partidos';
import { MatchDetail } from './pages/MatchDetail';
import { EnVivo } from './pages/EnVivo';
import { Resultados } from './pages/Resultados';
import { Torneos } from './pages/Torneos';
import { TorneoDetail } from './pages/TorneoDetail';
import { Equipos } from './pages/Equipos';
import { EquipoDetail } from './pages/EquipoDetail';
import { Perfil } from './pages/Perfil';
import { Favoritos } from './pages/Favoritos';
import { Ayuda } from './pages/Ayuda';
import { Manual } from './pages/Manual';
import { Prode } from './pages/Prode';
import { Leaderboard } from './pages/Leaderboard';
import { MisPronosticos } from './pages/MisPronosticos';
import { Grupos } from './pages/Grupos';

import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsuarios } from './pages/admin/AdminUsuarios';
import { AdminPartidos } from './pages/admin/AdminPartidos';
import { AdminPredictions } from './pages/admin/AdminPredictions';
import { AdminLogs } from './pages/admin/AdminLogs';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppLayout: React.FC = () => {
  const { authSuccessNotice, clearAuthSuccessNotice } = useAuth();

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-24 md:pb-6">
        <Header />

        {authSuccessNotice && (
          <div className="max-w-7xl w-full mx-auto px-3 sm:px-4 mt-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 text-emerald-300 text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-950/40">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{authSuccessNotice}</span>
              </div>
              <button
                onClick={clearAuthSuccessNotice}
                className="p-1 hover:bg-emerald-500/20 rounded-lg text-emerald-400 hover:text-emerald-200 transition"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/partidos" element={<Partidos />} />
            <Route path="/partidos/:id" element={<MatchDetail />} />
            <Route path="/en-vivo" element={<EnVivo />} />
            <Route path="/resultados" element={<Resultados />} />
            <Route path="/torneos" element={<Torneos />} />
            <Route path="/torneos/:id" element={<TorneoDetail />} />
            <Route path="/equipos" element={<Equipos />} />
            <Route path="/equipos/:id" element={<EquipoDetail />} />
            <Route path="/prode" element={<Prode />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/grupos" element={<Grupos />} />
            <Route path="/ayuda" element={<Ayuda />} />
            <Route path="/manual" element={<Manual />} />

            {/* Authenticated user routes */}
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/mis-pronosticos" element={<MisPronosticos />} />
            <Route path="/favoritos" element={<Favoritos />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="usuarios" element={<AdminUsuarios />} />
              <Route path="partidos" element={<AdminPartidos />} />
              <Route path="predictions" element={<AdminPredictions />} />
              <Route path="logs" element={<AdminLogs />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Footer />
        <BottomNav />
      </div>
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </QueryClientProvider>
  );
};