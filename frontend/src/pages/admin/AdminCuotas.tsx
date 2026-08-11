import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Coins, Edit2, Save } from 'lucide-react';

export const AdminCuotas: React.FC = () => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [newOdds, setNewOdds] = useState<string>('');

  const { data: matchesData } = useQuery({
    queryKey: ['admin-matches-odds'],
    queryFn: () => apiClient.get('/matches/upcoming').then((res) => res.data.data),
  });

  const { data: marketsData, refetch: refetchMarkets } = useQuery({
    queryKey: ['admin-markets', selectedMatchId],
    queryFn: () => apiClient.get(`/matches/${selectedMatchId}/markets`).then((res) => res.data.data),
    enabled: !!selectedMatchId,
  });

  const handleUpdateOdds = async (marketId: string, optionId: string) => {
    const oddsVal = parseFloat(newOdds);
    if (isNaN(oddsVal) || oddsVal <= 1.0) {
      alert('La cuota debe ser mayor a 1.00');
      return;
    }

    try {
      await apiClient.put(`/markets/${marketId}/options/${optionId}/odds`, {
        odds: oddsVal,
      });

      alert('Cuota actualizada y registrada en el AuditLog');
      setEditingOptionId(null);
      setNewOdds('');
      refetchMarkets();
    } catch {
      alert('Error al actualizar cuota');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Coins className="w-5 h-5 text-amber-400" /> Modificación de Cuotas Virtuales
        </h2>
        <p className="text-xs text-slate-400">Selecciona un partido próximo para ajustar las cuotas de sus mercados</p>
      </div>

      {/* SELECT MATCH */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-xl">
        <label className="block text-xs font-bold text-slate-300">Seleccionar Partido Próximo:</label>
        <select
          value={selectedMatchId}
          onChange={(e) => setSelectedMatchId(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-amber-500"
        >
          <option value="">-- Selecciona un partido --</option>
          {matchesData?.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.homeTeam.name} vs {m.awayTeam.name} ({new Date(m.scheduledAt).toLocaleDateString('es-AR')})
            </option>
          ))}
        </select>
      </div>

      {/* MARKETS & ODDS MANAGER */}
      {selectedMatchId && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-white">Mercados y Cuotas Configurados</h3>

          {!marketsData || marketsData.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 font-bold">
              No hay mercados registrados para este partido.
            </div>
          ) : (
            <div className="grid gap-4">
              {marketsData.map((m: any) => (
                <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
                  <h4 className="font-extrabold text-sm text-amber-400">{m.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {m.options?.map((opt: any) => (
                      <div key={opt.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-white block">{opt.label}</span>
                          <span className="text-[10px] text-slate-500 font-medium">Valor: {opt.value}</span>
                        </div>

                        {editingOptionId === opt.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.05"
                              value={newOdds}
                              onChange={(e) => setNewOdds(e.target.value)}
                              className="w-16 bg-slate-900 border border-amber-500 rounded-lg px-2 py-1 text-xs text-white font-bold text-center"
                            />
                            <button
                              onClick={() => handleUpdateOdds(m.id, opt.id)}
                              className="p-1.5 bg-amber-500 text-slate-950 rounded-lg font-bold"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-black text-yellow-400 text-sm bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                              {Number(opt.odds).toFixed(2)}
                            </span>
                            <button
                              onClick={() => {
                                setEditingOptionId(opt.id);
                                setNewOdds(Number(opt.odds).toString());
                              }}
                              className="p-1 text-slate-400 hover:text-amber-400 transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
