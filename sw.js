/* Service worker: la app funciona sin conexión (salvo tiempo, fotos de Wikipedia nuevas e IA).
 * Sube el número de CACHE en cada cambio para que los iPhones descarguen la versión nueva. */
const CACHE = 'plantitus-pro-v1';
const ARCHIVOS = [
  './', 'index.html', 'styles.css', 'manifest.webmanifest',
  'js/main.js', 'js/core.js', 'js/ui.js', 'js/iconos.js', 'js/contenido.js',
  'js/vistas/tareas.js', 'js/vistas/diagnostico.js', 'js/vistas/buscar.js', 'js/vistas/herramientas.js',
  'js/vistas/plantas.js', 'js/vistas/ajustes.js', 'js/vistas/guia.js',
  'data/especies.json', 'data/enfermedades.json',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/favicon-32.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('plantitus-pro-') && k !== CACHE && k !== 'plantitus-pro-fotos').map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // archivos de la app: primero la caché, y se actualiza en segundo plano
  if (url.origin === location.origin) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const r = await c.match(e.request, { ignoreSearch: true });
      const red = fetch(e.request).then((resp) => { if (resp.ok) c.put(e.request, resp.clone()); return resp; }).catch(() => r);
      return r || red;
    }));
    return;
  }
  // fotos de Wikimedia: se guardan para verlas sin conexión
  if (url.hostname === 'upload.wikimedia.org') {
    e.respondWith(caches.open('plantitus-pro-fotos').then(async (c) => {
      const r = await c.match(e.request);
      if (r) return r;
      const resp = await fetch(e.request);
      if (resp.ok || resp.type === 'opaque') c.put(e.request, resp.clone());
      return resp;
    }));
  }
});
