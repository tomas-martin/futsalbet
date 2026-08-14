import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const Prode: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: matchesData, isLoading } = useQuery({
    queryKey: ['prode-matches'],
    queryFn: () => apiClient.get('/matches/upcoming').then((res) => res.data.data),
  });

  const [preds, setPreds] = useState<Record<string, { home: number; away: number }>>({});

  const mutation = useMutation({
    mutationFn: (payload: { matchId: string; predictedHome: number; predictedAway: number }) => apiClient.post('/predictions', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prode-matches'] });
      alert('Pronóstico guardado correctamente');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Error al guardar pronóstico');
    },
  });

  const handleChange = (matchId: string, side: 'home' | 'away', value: string) => {
    const n = Math.max(0, parseInt(value || '0') || 0);
    setPreds((p) => ({ ...p, [matchId]: { home: side === 'home' ? n : p[matchId]?.home ?? 0, away: side === 'away' ? n : p[matchId]?.away ?? 0 } }));
  };

  const handleSubmit = async (matchId: string) => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para guardar pronósticos');
      return;
    }

    const item = preds[matchId];
    if (!item) {
      alert('Ingresa un marcador válido');
      return;
    }

    mutation.mutate({ matchId, predictedHome: item.home, predictedAway: item.away });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Prode del Torneo de Futsal</h1>

      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-slate-500 font-bold">Cargando partidos...</div>
        ) : (
          matchesData?.map((m: any) => (
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
                  className="ml-4 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition"
                >
                  Guardar
                </button>
              </div>
            </div>
          ))
        )}

        {!matchesData || matchesData.length === 0 ? (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-sm">No hay partidos próximos para predecir.</div>
        ) : null}
      </div>
    </div>
  );
};
