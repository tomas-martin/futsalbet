import React from 'react';
import { useBetSlip } from '../context/BetSlipContext';

interface OddsButtonProps {
  optionId: string;
  marketId: string;
  matchId: string;
  matchName: string;
  marketName: string;
  label: string;
  odds: number;
  disabled?: boolean;
}

export const OddsButton: React.FC<OddsButtonProps> = ({
  optionId,
  marketId,
  matchId,
  matchName,
  marketName,
  label,
  odds,
  disabled = false,
}) => {
  const { isOptionSelected, addSelection } = useBetSlip();
  const selected = isOptionSelected(optionId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    addSelection({
      marketOptionId: optionId,
      marketId,
      matchId,
      matchName,
      marketName,
      label,
      odds,
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl transition border text-xs font-bold ${
        disabled
          ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
          : selected
          ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30 scale-[1.02]'
          : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 hover:border-purple-500/50 text-slate-200'
      }`}
    >
      <span className="truncate">{label}</span>
      <span
        className={`font-black text-xs px-1.5 py-0.5 rounded ${
          selected
            ? 'bg-white/20 text-white'
            : 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20'
        }`}
      >
        {odds.toFixed(2)}
      </span>
    </button>
  );
};
