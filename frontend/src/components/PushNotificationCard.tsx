import React, { useState, useEffect } from 'react';
import { Bell, BellRing, CheckCircle2, AlertCircle, Send, Smartphone, ShieldCheck } from 'lucide-react';
import { requestNotificationPermission, unregisterPushNotifications } from '../services/firebase';
import { apiClient } from '../api/client';

export const PushNotificationCard: React.FC = () => {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setIsSupported(false);
      return;
    }
    setPermission(Notification.permission);
    setHasToken(!!localStorage.getItem('futsalbet_fcm_token'));
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const result = await requestNotificationPermission();
      if (result.success) {
        setPermission('granted');
        setHasToken(true);
        setFeedback({
          type: 'success',
          message: '¡Notificaciones activadas con éxito! Ahora recibirás avisos de nuevos partidos y recordatorios.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: result.error || 'No se pudieron activar las notificaciones.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al solicitar permisos.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      await unregisterPushNotifications();
      setHasToken(false);
      setFeedback({
        type: 'success',
        message: 'Notificaciones desactivadas para este dispositivo.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Error al desactivar notificaciones.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestPush = async () => {
    setTestLoading(true);
    setFeedback(null);
    try {
      const res = await apiClient.post('/notifications/test-push');
      setFeedback({
        type: 'success',
        message: res.data.message || '¡Notificación de prueba enviada a tu dispositivo!',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Error al enviar notificación de prueba. Asegúrate de tener configurado Firebase en el backend.',
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-3 text-slate-400">
          <Smartphone className="w-5 h-5 text-orange-400" />
          <h3 className="font-extrabold text-sm text-white">Notificaciones Push</h3>
        </div>
        <p className="text-xs text-slate-400">
          Tu navegador actual no soporta notificaciones Web Push. Si usas un <strong>iPhone</strong>, agrega esta web a tu pantalla de inicio mediante <span className="text-orange-300 font-semibold">Compartir &gt; "Agregar a pantalla de inicio"</span> para activarlas.
        </p>
      </div>
    );
  }

  const isEnabled = permission === 'granted' && hasToken;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-md ${
            isEnabled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
          }`}>
            {isEnabled ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-white">Notificaciones en el Celular</h3>
              {isEnabled && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> Activas
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Avisos instantáneos cuando haya partidos nuevos y alertas 24hs antes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isEnabled ? (
            <button
              onClick={handleEnable}
              disabled={loading}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-orange-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              {loading ? 'Activando...' : 'Activar Notificaciones'}
            </button>
          ) : (
            <>
              <button
                onClick={handleTestPush}
                disabled={testLoading}
                className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-md"
                title="Probar notificación en este celular"
              >
                <Send className="w-3.5 h-3.5" />
                {testLoading ? 'Probando...' : 'Probar Alerta'}
              </button>
              <button
                onClick={handleDisable}
                disabled={loading}
                className="px-3 py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 rounded-xl text-xs font-medium transition"
              >
                Desactivar
              </button>
            </>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* DETALLES DE QUÉ SE NOTIFICA */}
      <div className="grid sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
        <div className="flex items-start gap-2.5 text-xs text-slate-300">
          <span className="text-orange-400 font-bold shrink-0">⚽ 1.</span>
          <span><strong>Nuevos Partidos:</strong> Te avisa al instante cuando se publican fechas para cargar tus pronósticos.</span>
        </div>
        <div className="flex items-start gap-2.5 text-xs text-slate-300">
          <span className="text-yellow-400 font-bold shrink-0">⏳ 2.</span>
          <span><strong>Recordatorio 24hs:</strong> Te recuerda 1 día antes que se juegan los partidos para no perder puntos.</span>
        </div>
      </div>
    </div>
  );
};
