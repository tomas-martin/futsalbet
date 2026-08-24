import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-md py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide">
          © 2026 <span className="text-purple-400 font-semibold">TottiDev</span> · Developed by <span className="text-slate-200 font-semibold">Tomás Martín</span>
        </p>
      </div>
    </footer>
  );
};
