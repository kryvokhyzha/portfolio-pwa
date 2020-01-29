'use strict';

const files = [
    '/',
    '/console.css',
    '/console.js',
    '/favicon.ico',
    '/favicon.png',
    '/manifest.json',
    '/favicon_2.png',
    '/Roman.png'
];

const cacheName = 'v1.4.4';

self.addEventListener('install', event => event.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(files))
));

self.addEventListener('fetch', event => {
    event.respondWith(caches.match(event.request).then(response => {
        if (response !== undefined) return response;
        return fetch(event.request);
    }));
});

self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
