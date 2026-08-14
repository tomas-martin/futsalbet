import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, signInWithEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Prefer Supabase sign-in when available
      if (signInWithEmail) {
        try {
          await signInWithEmail(email, password);
          navigate('/');
          return;
        } catch (supErr: any) {
          // fallback to backend
          console.warn('Supabase sign-in failed, falling back to backend:', supErr?.message || supErr);
        }
      }

      const res = await apiClient.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto mb-2">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-white">Iniciar Sesión</h1>
        <p className="text-xs text-slate-400">Accede a tus puntos virtuales y pronósticos</p>
      </div>

      <div className="bg-purple-950/40 border border-purple-800/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-purple-300">
        <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <span>Plataforma 100% recreativa. Todos los nuevos usuarios reciben 1000 puntos virtuales de regalo.</span>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Contraseña</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
        >
          {loading ? 'Ingresando...' : 'Entrar'} <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* DEMO CREDENTIALS BOX */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
        <p className="font-bold text-purple-400">Credenciales de prueba:</p>
        <div className="flex justify-between text-slate-400 border-b border-slate-800/60 pb-1">
          <span>Usuario Normal:</span>
          <code className="text-slate-200">usuario@futsalbet.com / User123!</code>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Administrador:</span>
          <code className="text-slate-200">admin@futsalbet.com / Admin123!</code>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="text-purple-400 font-bold hover:underline">
          Regístrate gratis
        </Link>
      </p>
    </div>
  );
};
