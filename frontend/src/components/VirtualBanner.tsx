import React from 'react';
import { AlertCircle } from 'lucide-react';

export const VirtualBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-purple-200 text-xs px-3 py-1.5 font-medium flex items-center justify-center gap-2 border-b border-purple-800/40 shadow-sm">
      <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
      <span>
        <strong className="text-white">PLATAFORMA RECREATIVA:</strong> Todo el juego funciona exclusivamente con <strong className="text-yellow-400">Puntos Virtuales</strong>. Sin dinero real, depósitos ni retiros.
      </span>
    </div>
  );
};
