const CACHE_NAME = 'Mustansiriyah-App-Cache-v2';
const urlsToCache = [
    '/',
    '/index.html',
    // === الصفحات المُضافة لحل مشكلة 404 ===
    '/schedule.html',  
    '/students.html',  
    '/summaries.html', 
    // ======================================
    '/style.css',
    '/admin.js',
    '/app.js', // تم إضافة app.js
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
    self.skipWaiting(); 
});

// التنشيط: إزالة نسخ الكاش القديمة
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim(); 
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
        event.waitUntil(
            self.registration.showNotification(event.data.title, options)
        );
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
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
