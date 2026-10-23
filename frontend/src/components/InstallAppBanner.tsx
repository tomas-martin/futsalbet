import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, ChevronRight } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallAppBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Detect if already installed (standalone mode)
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if previously dismissed (expire after 3 days)
    const dismissedAt = localStorage.getItem('futsalbet_install_dismissed');
    if (dismissedAt) {
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedAt) < threeDays) {
        setDismissed(true);
        return;
      }
      localStorage.removeItem('futsalbet_install_dismissed');
    }

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isiOS);

    if (isiOS) {
      // On iOS Safari, show the banner
      const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|Chrome/.test(ua);
      if (isSafari) {
        setShowBanner(true);
      }
    }
  }, []);

  // Listen for beforeinstallprompt (Android/Chrome/Edge)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  }, [deferredPrompt, isIOS]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setShowBanner(false);
    localStorage.setItem('futsalbet_install_dismissed', Date.now().toString());
  }, []);

  // Don't render if installed, dismissed, or no banner to show
  if (isInstalled || dismissed || !showBanner) return null;

  return (
    <>
      {/* FLOATING INSTALL BANNER */}
      <div className="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:max-w-sm z-50 animate-in slide-in-from-bottom duration-500">
        <div className="bg-gradient-to-r from-purple-900/95 via-indigo-900/95 to-purple-900/95 backdrop-blur-xl border border-purple-500/40 rounded-2xl p-4 shadow-2xl shadow-purple-900/50">
          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            {/* App Icon */}
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-orange-500/50 shadow-lg shadow-orange-500/20 shrink-0">
              <img src="/logo.jpg" alt="FutsalBet" className="w-full h-full object-cover" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pr-4">
              <h3 className="text-sm font-black text-white leading-tight">
                Instalá <span className="text-orange-400">FutsalBet</span>
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                {isIOS
                  ? 'Agregá la app a tu pantalla de inicio'
                  : 'Instalala como app nativa en tu dispositivo'}
              </p>
            </div>
          </div>

          {/* Install Button */}
          <button
            onClick={handleInstallClick}
            className="w-full mt-3 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {isIOS ? (
              <>
                <Share className="w-4 h-4" /> Ver instrucciones
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Instalar App
              </>
            )}
          </button>
        </div>
      </div>

      {/* iOS INSTRUCTIONS MODAL */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowIOSModal(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 z-10">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-5 text-center border-b border-purple-800/50">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-orange-500/50 shadow-lg mx-auto mb-3">
                <img src="/logo.jpg" alt="FutsalBet" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg font-black text-white">
                Instalá <span className="text-orange-400">FutsalBet</span>
              </h3>
              <p className="text-xs text-purple-200 mt-1">Seguí estos pasos para agregar la app</p>
            </div>

            {/* Steps */}
            <div className="p-5 space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-black text-purple-400">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    Tocá el botón Compartir
                    <Share className="w-4 h-4 text-blue-400" />
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    En la barra inferior de Safari
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2 px-2">
                <div className="flex-1 border-t border-slate-800" />
                <ChevronRight className="w-3 h-3 text-slate-600 rotate-90" />
                <div className="flex-1 border-t border-slate-800" />
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-black text-purple-400">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    Seleccioná "Agregar a Inicio"
                    <PlusSquare className="w-4 h-4 text-slate-300" />
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Desplazá hacia abajo en el menú
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2 px-2">
                <div className="flex-1 border-t border-slate-800" />
                <ChevronRight className="w-3 h-3 text-slate-600 rotate-90" />
                <div className="flex-1 border-t border-slate-800" />
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-black text-emerald-400">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    Tocá "Agregar"
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ¡Listo! La app aparecerá en tu pantalla
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60">
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition border border-slate-700"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
