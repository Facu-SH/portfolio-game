// Service Worker para Portfolio PWA
const CACHE_NAME = 'portfolio-v1';
const OFFLINE_URL = '/offline.html';

// Recursos a cachear en la instalación
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-cacheando recursos');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Activar inmediatamente sin esperar
        return self.skipWaiting();
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar caches antiguos
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar control de todas las páginas
      return self.clients.claim();
    })
  );
});

// Estrategia de fetch: Network First con fallback a Cache
self.addEventListener('fetch', (event) => {
  // Solo manejar requests GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar requests a extensiones de Chrome, etc.
  if (!event.request.url.startsWith('http')) return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonar la respuesta para guardar en cache
        const responseClone = response.clone();
        
        // Guardar en cache solo si la respuesta es válida
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Si falla la red, buscar en cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Si es una navegación, mostrar página offline
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          
          // Para otros recursos, devolver error silencioso
          return new Response('', { status: 408, statusText: 'Offline' });
        });
      })
  );
});

// Escuchar mensajes desde la app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker cargado');

