import React, { useState } from 'react';
import { useBetSlip } from '../context/BetSlipContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { X, Trash2, Ticket, AlertTriangle, CheckCircle2, ShieldCheck, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BetSlip: React.FC = () => {
  const { items, stake, isOpen, setOpen, removeSelection, clearSlip, setStake, totalOdds, potentialPayout } = useBetSlip();
  const { user, isAuthenticated, updateUserBalance } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const userBalance = user?.balance ?? 0;
  const isCombined = items.length > 1;
  const hasEnoughPoints = userBalance >= stake;

  const handleConfirmBet = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      setOpen(false);
      return;
    }

    if (items.length === 0) return;

    if (!hasEnoughPoints) {
      setError('Puntos insuficientes en tu billetera virtual.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post('/bets', {
        selections: items.map((i) => ({ marketOptionId: i.marketOptionId })),
        stakeAmount: stake,
      });

      updateUserBalance(res.data.newBalance);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        clearSlip();
        setOpen(false);
        navigate('/mis-apuestas');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al procesar el pronóstico');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* HEADER */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-purple-400" />
            <h2 className="font-extrabold text-base text-white">Boleta de Pronósticos</h2>
            {items.length > 0 && (
              <span className="bg-purple-600/30 text-purple-300 text-xs px-2 py-0.5 rounded-full font-bold">
                {items.length} {isCombined ? 'Combinada' : 'Simple'}
              </span>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Ticket className="w-12 h-12 stroke-1 mb-3 text-slate-600" />
              <p className="font-bold text-slate-300">Tu boleta está vacía</p>
              <p className="text-xs text-slate-500 mt-1">
                Haz clic en las cuotas de cualquier partido para armar tu pronóstico.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="text-slate-400 font-medium">Selecciones activas</span>
                <button
                  onClick={clearSlip}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Vaciar
                </button>
              </div>

              {/* ITEM LIST */}
              {items.map((item) => (
                <div
                  key={item.marketOptionId}
                  className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 relative group"
                >
                  <button
                    onClick={() => removeSelection(item.marketOptionId)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-rose-400 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] font-bold text-purple-400 uppercase tracking-wider pr-6 truncate">
                    {item.matchName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.marketName}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/40">
                    <span className="text-sm font-bold text-white">{item.label}</span>
                    <span className="text-sm font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-lg border border-yellow-400/20">
                      {item.odds.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* FOOTER & STAKE */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/95 space-y-3">
            {/* Stake selector */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">Puntos a apostar:</span>
                <span className="text-slate-300 font-bold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" /> Disponible: {userBalance.toLocaleString()} pts
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[50, 100, 250, 500].map((val) => (
                  <button
                    key={val}
                    onClick={() => setStake(val)}
                    className={`py-1 text-xs font-bold rounded-lg transition border ${
                      stake === val
                        ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {val} pts
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="10"
                max={userBalance}
                value={stake}
                onChange={(e) => setStake(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-purple-500 text-center"
              />
            </div>

            {/* Calculations */}
            <div className="bg-slate-800/60 rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Cuota Total:</span>
                <span className="font-bold text-yellow-400 text-sm">{totalOdds.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300 font-bold border-t border-slate-700/60 pt-1.5">
                <span>Premio Potencial:</span>
                <span className="font-extrabold text-green-400 text-base">
                  {potentialPayout.toLocaleString()} pts
                </span>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="bg-purple-950/40 border border-purple-800/40 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-purple-300">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <span>
                Este sistema utiliza <strong>únicamente puntos virtuales recreativos</strong> y no involucra dinero real de ningún tipo.
              </span>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="p-3 bg-green-500/20 border border-green-500/40 rounded-xl text-green-400 text-sm font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>¡Pronóstico confirmado!</span>
              </div>
            ) : (
              <button
                onClick={handleConfirmBet}
                disabled={loading || !hasEnoughPoints}
                className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 ${
                  hasEnoughPoints
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {loading ? 'Procesando...' : isAuthenticated ? 'CONFIRMAR PRONÓSTICO' : 'INICIAR SESIÓN PARA APOSTAR'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
