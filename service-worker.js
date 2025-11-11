const CACHE_NAME = 'history-app-cache-v1';
const urlsToCache = [
    '/',
    'index.html',
    'style.css',
    'app.js',
    'data.json', // مهم لحفظ بيانات الجدول والتنبيهات محلياً
    'manifest.json',
    // يجب إضافة باقي الملفات مثل schedule.html و student.html و icon-xxx.png
];

// تثبيت Service Worker وحفظ الموارد
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// اعتراض طلبات الشبكة (Fetch) لتقديم الموارد المخزنة مؤقتاً
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // تقديم الملف المخزن مؤقتاً إذا كان موجوداً
                if (response) {
                    return response;
                }
                // وإلا، قم بطلب الملف من الشبكة
                return fetch(event.request);
            })
    );
});
