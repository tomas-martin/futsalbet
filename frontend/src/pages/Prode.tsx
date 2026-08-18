import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Target, CheckCircle2, AlertTriangle, Save, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Prode: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [preds, setPreds] = useState<Record<string, { home: number; away: number }>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const { data: matchesData, isLoading } = useQuery({
    queryKey: ['prode-matches'],
    queryFn: () => apiClient.get('/matches/upcoming').then((res) => res.data.data),
  });

  // Load existing predictions to prefill the inputs
  const { data: myPredictions } = useQuery({
    queryKey: ['my-predictions-prode'],
    queryFn: () => apiClient.get('/predictions/my').then((res) => res.data.data),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!myPredictions) return;
    const initial: Record<string, { home: number; away: number }> = {};
    myPredictions.forEach((p: any) => {
      if (p.match?.status === 'SCHEDULED') {
        initial[p.match.id] = { home: p.predictedHome, away: p.predictedAway };
      }
    });
    setPreds(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPredictions]);

  const mutation = useMutation({
    mutationFn: (payload: { matchId: string; predictedHome: number; predictedAway: number }) =>
      apiClient.post('/predictions', payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prode-matches'] });
      queryClient.invalidateQueries({ queryKey: ['my-predictions-prode'] });
      setSaved((s) => ({ ...s, [variables.matchId]: true }));
      setFeedback({ type: 'success', msg: 'Pronóstico guardado correctamente.' });
      setTimeout(() => setFeedback(null), 3000);
    },
    onError: (err: any) => {
      setFeedback({ type: 'error', msg: err?.response?.data?.error || 'Error al guardar pronóstico' });
    },
  });

  const handleChange = (matchId: string, side: 'home' | 'away', value: string) => {
    const n = Math.max(0, parseInt(value || '0') || 0);
    setPreds((p) => ({ ...p, [matchId]: { home: side === 'home' ? n : p[matchId]?.home ?? 0, away: side === 'away' ? n : p[matchId]?.away ?? 0 } }));
    setSaved((s) => ({ ...s, [matchId]: false }));
  };

  const handleSubmit = async (matchId: string) => {
    if (!isAuthenticated) {
      setFeedback({ type: 'error', msg: 'Debes iniciar sesión para guardar pronósticos' });
      return;
    }

    const item = preds[matchId];
    if (!item) {
      setFeedback({ type: 'error', msg: 'Ingresa un marcador válido' });
      return;
    }

    mutation.mutate({ matchId, predictedHome: item.home, predictedAway: item.away });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-purple-400" /> Prode del Torneo FSP
        </h1>
        <p className="text-xs text-slate-400">Pronosticá el marcador exacto de cada partido. ¡Sumá puntos!</p>
      </div>

      {/* SCORING RULES */}
      <div className="bg-purple-950/40 border border-purple-800/40 rounded-2xl p-3 flex flex-wrap gap-3 text-[11px] text-purple-200">
        <span>🎯 Resultado exacto: <strong>6 pts</strong></span>
        <span>🏆 Ganador o empate correcto: <strong>3 pts</strong></span>
        <span className="text-purple-300/70">Podés editar hasta que arranque el partido.</span>
      </div>

      {feedback && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${
          feedback.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {feedback.msg}
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-slate-500 font-bold">Cargando partidos...</div>
        ) : !matchesData || matchesData.length === 0 ? (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-sm">No hay partidos próximos para predecir.</div>
        ) : (
          matchesData.map((m: any) => (
            <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-white">{m.homeTeam?.name} <span className="text-slate-400">vs</span> {m.awayTeam?.name}</div>
                <div className="text-xs text-slate-400">{new Date(m.scheduledAt).toLocaleString('es-AR')}</div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  value={preds[m.id]?.home ?? ''}
                  onChange={(e) => handleChange(m.id, 'home', e.target.value)}
                  placeholder="0"
                  className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-center text-white"
                />
                <span className="text-white font-black">-</span>
                <input
                  type="number"
                  min={0}
                  value={preds[m.id]?.away ?? ''}
                  onChange={(e) => handleChange(m.id, 'away', e.target.value)}
                  placeholder="0"
                  className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-center text-white"
                />

                <button
                  onClick={() => handleSubmit(m.id)}
                  disabled={mutation.isPending && mutation.variables?.matchId === m.id}
                  className="ml-4 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold rounded-xl text-xs transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saved[m.id] ? 'Guardado' : 'Guardar'}
                </button>
              </div>
            </div>
          ))
        )}

        {!isAuthenticated && (
          <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl text-sm">
            <span className="text-slate-400">Iniciá sesión para guardar y competir en el prode.</span>
            <Link to="/login" className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5" /> Iniciar sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};