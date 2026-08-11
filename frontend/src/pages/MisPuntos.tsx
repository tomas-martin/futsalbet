import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Coins, ArrowUpRight, ArrowDownRight, Gift, ShieldCheck } from 'lucide-react';

export const MisPuntos: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: () => apiClient.get('/wallet/transactions').then((res) => res.data),
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Coins className="w-6 h-6 text-yellow-400" /> Billetera de Puntos Virtuales
        </h1>
        <p className="text-xs text-slate-400">Trazabilidad completa de tus movimientos de saldo virtual</p>
      </div>

      {/* SUMMARY BANNER */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-800/40 rounded-3xl p-6 md:p-8 space-y-4 shadow-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Saldo Disponible</span>
            <span className="text-2xl font-black text-yellow-400">
              {Number(data?.wallet?.balance || 0).toLocaleString()} <span className="text-xs font-normal">pts</span>
            </span>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Apostado</span>
            <span className="text-2xl font-black text-purple-300">
              {Number(data?.wallet?.totalBet || 0).toLocaleString()} <span className="text-xs font-normal">pts</span>
            </span>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Ganado</span>
            <span className="text-2xl font-black text-green-400">
              {Number(data?.wallet?.totalWon || 0).toLocaleString()} <span className="text-xs font-normal">pts</span>
            </span>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Perdido</span>
            <span className="text-2xl font-black text-rose-400">
              {Number(data?.wallet?.totalLost || 0).toLocaleString()} <span className="text-xs font-normal">pts</span>
            </span>
          </div>
        </div>

        <div className="bg-purple-950/40 border border-purple-800/40 rounded-xl p-3 flex items-center gap-2.5 text-xs text-purple-300">
          <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
          <span>Toda modificación del saldo está registrada en la tabla de transacciones de la base de datos sin modificaciones directas.</span>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-white">Histórico de Movimientos</h2>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500 font-bold text-sm">Cargando movimientos...</div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 font-bold">
            No hay movimientos registrados.
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                    <th className="py-3 px-4">FECHA</th>
                    <th className="py-3 px-4">TIPO</th>
                    <th className="py-3 px-4">DESCRIPCIÓN</th>
                    <th className="py-3 px-4 text-right">MONTO</th>
                    <th className="py-3 px-4 text-right">SALDO RESULTANTE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {data.data.map((tx: any) => {
                    const isPositive = Number(tx.amount) > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString('es-AR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                            tx.type === 'INITIAL_BONUS'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : isPositive
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {tx.type === 'INITIAL_BONUS' ? (
                              <Gift className="w-3 h-3" />
                            ) : isPositive ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-white font-bold">{tx.description}</td>
                        <td className={`py-3.5 px-4 text-right font-black text-sm ${isPositive ? 'text-green-400' : 'text-rose-400'}`}>
                          {isPositive ? `+${tx.amount}` : tx.amount} pts
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-300">
                          {tx.balanceAfter} pts
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
