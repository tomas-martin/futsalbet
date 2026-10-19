import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { apiClient } from '../api/client';

// Configuración de Firebase para el Frontend (Web/PWA)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let messagingInstance: Messaging | null = null;

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('⚠️ Configuración de Firebase no detectada en las variables de entorno VITE_FIREBASE_*');
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
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { success: false, error: 'Este navegador o dispositivo no soporta notificaciones push.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Permiso de notificaciones denegado por el usuario.' };
    }

    const messaging = getFirebaseMessaging();
    if (!messaging) {
      return { success: false, error: 'No se pudo inicializar Firebase Messaging. Revisa tus variables VITE_FIREBASE_*.' };
    }

    // Esperar a que el service worker esté registrado
    const registration = await navigator.serviceWorker.ready;

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
