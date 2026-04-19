// sw.js - El vigilante en segundo plano
self.addEventListener('push', function(event) {
    if (event.data) {
        const payload = event.data.json();
        
        const options = {
            body: payload.body,
            icon: '/assets/icon-192.png',
            badge: '/assets/icon-192.png',
            vibrate: [100, 50, 100], // Patrón de vibración 
            data: {
                url: payload.url
            },
            actions: [
                { action: 'open', title: 'Ver Candidato' }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(payload.title, options)
        );
    }
});

// Cuando el usuario hace clic en la notificación
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});