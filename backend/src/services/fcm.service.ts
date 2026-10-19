import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';
import prisma from '../config/database';

let fcmApp: App | null = null;

function initializeFirebase(): boolean {
  if (fcmApp) return true;
  if (getApps().length > 0) {
    fcmApp = getApps()[0];
    return true;
  }

  try {
    // 1. Opción 1: Archivo JSON de cuenta de servicio (ruta en env o en directorio backend)
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(process.cwd(), 'firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      fcmApp = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('✅ Firebase Admin inicializado mediante archivo JSON');
      return true;
    }

    // 1.5 Opción: JSON completo de cuenta de servicio en variable de entorno (ideal para Vercel)
    const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (jsonEnv) {
      const serviceAccount = JSON.parse(jsonEnv.trim());
      fcmApp = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('✅ Firebase Admin inicializado mediante JSON en variable de entorno');
      return true;
    }

    // 2. Opción 2: Variables de entorno individuales
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && rawKey) {
      const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
      fcmApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('✅ Firebase Admin inicializado mediante variables de entorno');
      return true;
    }

    console.warn('⚠️ Firebase Admin no configurado aún. Las notificaciones push se omitirán hasta cargar las credenciales.');
    return false;
  } catch (error) {
    console.error('❌ Error al inicializar Firebase Admin:', error);
    return false;
  }
}

// Intentar inicializar al arrancar
initializeFirebase();

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, string>;
}

/**
 * Envía una notificación push a una lista de tokens de dispositivo.
 * Limpia automáticamente los tokens inválidos de la base de datos.
 */
export async function sendPushToTokens(
  tokens: string[],
  payload: PushPayload
): Promise<{ success: number; failure: number; configured: boolean }> {
  if (!tokens || tokens.length === 0) {
    return { success: 0, failure: 0, configured: true };
  }

  if (!initializeFirebase() || !fcmApp) {
    console.warn('⚠️ Se intentó enviar push pero Firebase Admin no está configurado.');
    return { success: 0, failure: 0, configured: false };
  }

  try {
    const messaging = getMessaging(fcmApp);
    const message: MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        ...(payload.data || {}),
        url: payload.url || '/',
      },
      webpush: {
        notification: {
          icon: '/icon-192.jpg',
          badge: '/icon-192.jpg',
          vibrate: [200, 100, 200],
        },
        fcmOptions: {
          link: payload.url || '/',
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);
    const invalidTokens: string[] = [];

    response.responses.forEach((res, idx) => {
      if (!res.success && res.error) {
        const errCode = res.error.code;
        if (
          errCode === 'messaging/registration-token-not-registered' ||
          errCode === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(tokens[idx]);
        }
      }
    });

    // Limpieza de tokens vencidos
    if (invalidTokens.length > 0) {
      await prisma.deviceToken.deleteMany({
        where: { token: { in: invalidTokens } },
      }).catch((e) => console.error('Error al limpiar tokens obsoletos:', e));
    }

    return { success: response.successCount, failure: response.failureCount, configured: true };
  } catch (error) {
    console.error('❌ Error enviando notificación FCM multicast:', error);
    return { success: 0, failure: tokens.length, configured: true };
  }
}

/**
 * Enviar notificación a todos los dispositivos registrados de un usuario específico.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const devices = await prisma.deviceToken.findMany({
    where: { userId },
    select: { token: true },
  });

  if (devices.length === 0) {
    return { success: 0, failure: 0, configured: true, deviceCount: 0 };
  }
  const result = await sendPushToTokens(devices.map((d) => d.token), payload);
  return { ...result, deviceCount: devices.length };
}

/**
 * Enviar notificación a TODOS los dispositivos registrados (difusión general).
 */
export async function sendPushToAll(payload: PushPayload) {
  const devices = await prisma.deviceToken.findMany({
    select: { token: true },
  });

  if (devices.length === 0) {
    return { success: 0, failure: 0, configured: true, deviceCount: 0 };
  }
  const result = await sendPushToTokens(devices.map((d) => d.token), payload);
  return { ...result, deviceCount: devices.length };
}
