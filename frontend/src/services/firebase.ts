import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';
import { apiClient } from '../api/client';

// Configuración de Firebase para el Frontend (Web/PWA)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDHOELAPFTraLnNLh-JbAnsveOExlrq2sU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'prueba-fa5f9.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'prueba-fa5f9',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'prueba-fa5f9.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1094224572735',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1094224572735:web:9a3b5745fdbbd8658fe38a',
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BCvNsc2kVtrVhb5Y543Ubp-aw5b_QsKfbat1lpTw_9Di_bwOMmDo20LFCB4BGVFohZ_3Jqcl6OMthVVClxbbMxE';

let messagingInstance: Messaging | null = null;

export async function isPushNotificationSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('⚠️ Configuración de Firebase no detectada');
    return null;
  }

  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    if (!messagingInstance) {
      messagingInstance = getMessaging(app);
    }
    return messagingInstance;
  } catch (error) {
    console.error('Error inicializando Firebase Messaging:', error);
    return null;
  }
}

/**
 * Solicita permisos de notificación al navegador y registra el token en el backend
 */
export async function requestNotificationPermission(): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return { success: false, error: 'Este navegador o dispositivo no soporta notificaciones push.' };
  }

  try {
    // 1. Verificar compatibilidad en el dispositivo
    const supported = await isPushNotificationSupported();
    if (!supported) {
      return {
        success: false,
        error: 'Tu navegador o versión de iOS no soporta Web Push. En iPhone necesitas iOS 16.4+ y abrir la app agregada a la pantalla de inicio.',
      };
    }

    // 2. Solicitar permiso al usuario
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Permiso denegado. Puedes habilitarlo desde Ajustes > FutsalBet en tu iPhone.' };
    }

    // 3. Inicializar Messaging
    const messaging = getFirebaseMessaging();
    if (!messaging) {
      return { success: false, error: 'No se pudo inicializar Firebase Messaging en este dispositivo.' };
    }

    // 4. Asegurar que el Service Worker esté registrado y listo
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js');
    }
    await navigator.serviceWorker.ready;

    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!currentToken) {
      return { success: false, error: 'No se pudo obtener el token de registro de Firebase.' };
    }

    // Guardar token en localStorage
    localStorage.setItem('futsalbet_fcm_token', currentToken);

    // Enviar token al backend si hay sesión iniciada
    try {
      await apiClient.post('/notifications/device-token', {
        token: currentToken,
        platform: 'web',
      });
    } catch (apiErr) {
      console.warn('No se pudo sincronizar el token con el backend (quizás el usuario aún no inicia sesión):', apiErr);
    }

    return { success: true, token: currentToken };
  } catch (error: any) {
    console.error('Error solicitando permisos de notificación:', error);
    return { success: false, error: error?.message || 'Error desconocido al activar notificaciones' };
  }
}

/**
 * Escucha notificaciones mientras la app está ABIERTA en primer plano (foreground)
 */
export function onMessageListener(callback: (payload: any) => void) {
  const messaging = getFirebaseMessaging();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}

/**
 * Desactiva las notificaciones en este dispositivo
 */
export async function unregisterPushNotifications(): Promise<void> {
  const token = localStorage.getItem('futsalbet_fcm_token');
  if (token) {
    try {
      await apiClient.delete('/notifications/device-token', { data: { token } });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('futsalbet_fcm_token');
  }
}
