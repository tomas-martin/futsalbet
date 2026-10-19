// Service Worker para Firebase Cloud Messaging en segundo plano (PWA / Web)
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Listener nativo de Push para garantizar recepción incluso si la app está cerrada
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const notification = payload.notification || {};
    const data = payload.data || {};

    const title = notification.title || data.title || '⚽ FutsalBet';
    const body = notification.body || data.body || 'Novedades sobre partidos y pronósticos';
    const icon = notification.icon || '/icon-192.jpg';
    const badge = '/icon-192.jpg';
    const targetUrl = data.url || payload.fcmOptions?.link || '/prode';

    const options = {
      body,
      icon,
      badge,
      vibrate: [200, 100, 200],
      data: {
        url: targetUrl,
      },
      actions: [
        { action: 'open', title: 'Ver en FutsalBet' },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Error parseando push en service worker:', err);
  }
});

// Al tocar la notificación: abrir la app o enfocar la pestaña existente
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si la app ya está abierta en una pestaña, enfocarla
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Si la app está cerrada, abrir nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
