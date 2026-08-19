import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Target, CheckCircle2, AlertTriangle, Save, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Prode: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [preds, setPreds] = useState<Record<string, { home: string; away: string }>>({});
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
    const initial: Record<string, { home: string; away: string }> = {};
    myPredictions.forEach((p: any) => {
      if (p.match?.status === 'SCHEDULED') {
        initial[p.match.id] = {
          home: p.predictedHome !== undefined && p.predictedHome !== null ? String(p.predictedHome) : '',
          away: p.predictedAway !== undefined && p.predictedAway !== null ? String(p.predictedAway) : '',
        };
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
    const cleanValue = value.replace(/\D/g, '').slice(0, 2);
    setPreds((p) => ({
      ...p,
      [matchId]: {
        home: side === 'home' ? cleanValue : p[matchId]?.home ?? '',
        away: side === 'away' ? cleanValue : p[matchId]?.away ?? '',
      },
    }));
    setSaved((s) => ({ ...s, [matchId]: false }));
  };

  const handleSubmit = async (matchId: string) => {
    if (!isAuthenticated) {
      setFeedback({ type: 'error', msg: 'Debes iniciar sesión para guardar pronósticos' });
      return;
    }

    const item = preds[matchId];
    if (!item || item.home === '' || item.away === '') {
      setFeedback({ type: 'error', msg: 'Ingresa un marcador para ambos equipos' });
      return;
    }

    mutation.mutate({
      matchId,
      predictedHome: parseInt(item.home, 10),
      predictedAway: parseInt(item.away, 10),
    });
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
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 text-sm text-center">
            No hay partidos próximos para predecir.
          </div>
        ) : (
          matchesData.map((m: any) => (
            <div
              key={m.id}
              className="bg-slate-900 border border-slate-800 hover:border-purple-800/50 rounded-3xl p-4 sm:p-5 space-y-4 transition shadow-lg"
            >
              {/* TOURNAMENT & DATE BAR */}
              <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2.5">
                <span className="font-bold text-purple-400 truncate max-w-[200px] sm:max-w-none">
                  {m.tournament?.name}
                </span>
                <span className="text-slate-400 text-[11px] font-medium shrink-0">
                  {new Date(m.scheduledAt).toLocaleString('es-AR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </span>
              </div>

              {/* MATCH & PREDICTION FORM */}
              <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                {/* HOME TEAM */}
                <div className="flex items-center sm:flex-col justify-start sm:justify-center gap-3 text-left sm:text-center min-w-0">
                  <img
                    src={m.homeTeam?.logoUrl}
                    alt=""
                    className="w-9 h-9 sm:w-12 sm:h-12 object-contain shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-extrabold text-sm text-white block truncate">
                      {m.homeTeam?.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block sm:hidden">Local</span>
                  </div>
                </div>

                {/* SCORE INPUTS */}
                <div className="flex items-center justify-center gap-2 py-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={preds[m.id]?.home ?? ''}
                    onChange={(e) => handleChange(m.id, 'home', e.target.value)}
                    placeholder="-"
                    className="w-16 h-12 bg-slate-950 border border-slate-800 rounded-2xl px-2 text-center text-lg font-black text-white focus:outline-none focus:border-purple-500 shadow-inner"
                  />
                  <span className="text-purple-400 font-black text-xl px-1">-</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={preds[m.id]?.away ?? ''}
                    onChange={(e) => handleChange(m.id, 'away', e.target.value)}
                    placeholder="-"
                    className="w-16 h-12 bg-slate-950 border border-slate-800 rounded-2xl px-2 text-center text-lg font-black text-white focus:outline-none focus:border-purple-500 shadow-inner"
                  />
                </div>

                {/* AWAY TEAM */}
                <div className="flex items-center sm:flex-col justify-end sm:justify-center gap-3 text-right sm:text-center min-w-0">
                  <div className="min-w-0 flex-1 sm:order-2">
                    <span className="font-extrabold text-sm text-white block truncate">
                      {m.awayTeam?.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block sm:hidden">Visitante</span>
                  </div>
                  <img
                    src={m.awayTeam?.logoUrl}
                    alt=""
                    className="w-9 h-9 sm:w-12 sm:h-12 object-contain shrink-0 sm:order-1"
                  />
                </div>
              </div>

              {/* SAVE BUTTON */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-end">
                <button
                  onClick={() => handleSubmit(m.id)}
                  disabled={mutation.isPending && mutation.variables?.matchId === m.id}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg ${
                    saved[m.id]
                      ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-orange-500/20'
                  }`}
                >
                  {saved[m.id] ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>Pronóstico Guardado</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Guardar Pronóstico</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}

        {!isAuthenticated && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
            <span className="text-slate-400 text-center sm:text-left">
              Iniciá sesión para guardar tus pronósticos y competir en la tabla del prode.
            </span>
            <Link
              to="/login"
              className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <LogIn className="w-4 h-4" /> Iniciar sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};