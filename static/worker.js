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

const cacheName = 'v1.4.6.1';

self.addEventListener('install', event => event.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(files))
));

self.addEventListener('fetch', event => {
    event.respondWith(caches.match(event.request).then(response => {
        if (response !== undefined) return response;
        return fetch(event.request);
    }));
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => Promise.all(
            cacheNames.filter(name => cacheName !== name).map(name => caches.delete(name))
        ))
    );
});

self.addEventListener('message', event => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
