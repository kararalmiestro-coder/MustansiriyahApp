// --- Service Worker لإدارة الكاش والإشعارات ---

const CACHE_NAME = 'Mustansiriyah-App-Cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/admin.js',
    '/data.json',
    '/manifest.json',
    '/192x192.png', 
    '/512x512.png'
];

// التثبيت: يتم تخزين الملفات في الكاش
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// الجلب: يتم جلب الملفات من الكاش أولاً
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// --- معالجة الإشعارات ---

self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'showNotification') {
        const options = {
            body: event.data.body,
            icon: '/192x192.png',
            vibrate: [200, 100, 200],
            tag: event.data.tag
        };

        // عرض الإشعار
        event.waitUntil(
            self.registration.showNotification(event.data.title, options)
        );
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // عند الضغط على الإشعار، يتم فتح التطبيق
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.registration.scope) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(self.registration.scope);
            }
        })
    );
});
