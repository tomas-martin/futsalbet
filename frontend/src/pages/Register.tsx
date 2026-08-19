import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const { requiresEmailConfirmation } = await signUp(email, password);
      if (requiresEmailConfirmation) {
        setInfo('Revisá tu casilla de email para confirmar la cuenta antes de iniciar sesión.');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err?.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto mb-2">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-white">Crear Cuenta</h1>
        <p className="text-xs text-slate-400">Únete gratis y empezá a pronosticar en el prode</p>
      </div>

      <div className="bg-purple-950/40 border border-purple-800/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-purple-300">
        <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <span>Tu cuenta se crea con Supabase Auth. Si tu email coincide con el administrador, tendrás acceso al panel.</span>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {info && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{info}</span>
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
        >
          {loading ? 'Creando cuenta...' : 'Registrarme gratis'} <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <p className="text-center text-xs text-slate-400">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-purple-400 font-bold hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
};