/**
 * sw.js â€” Service Worker para El manga como recurso didÃ¡ctico
 * Biblioteca Campus del Obelisco Â· Aula de CÃ³mic Â· ULPGC
 * VersiÃ³n: 5.46.17  (catÃ¡logo verificado: retirada obra no manga)
 *
 * â”€â”€ PROTOCOLO DE MANTENIMIENTO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Cada vez que se publique una nueva versiÃ³n del recurso:
 *   1. Incrementar CACHE_NAME aquÃ­ (ej. 'manga-ulpgc-v5.32').
 *   2. Actualizar el nÃºmero de versiÃ³n en la cabecera de este archivo.
 *   3. Verificar que PRECACHE_ASSETS incluye todos los assets nuevos.
 * Sin este paso, los usuarios con cachÃ© previa no recibirÃ¡n
 * las actualizaciones hasta que limpien el navegador manualmente.
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *
 * Estrategia de cachÃ©:
 *   Â· Cache First  â†’ assets estÃ¡ticos propios (HTML, CSS, JS, datos).
 *   Â· Network Only â†’ APIs de IA (Claude, Gemini) â€” nunca se cachean.
 *   Â· Cache First  â†’ fuentes Google (fonts.gstatic.com) â€” se cachean
 *     en primera visita para habilitar uso offline. Si Google actualiza
 *     los binarios de fuente, la invalidaciÃ³n ocurrirÃ¡ en la siguiente
 *     visita con red cuando se bump-ee CACHE_NAME.
 */

'use strict';

/* â”€â”€ VERSIÃ“N DE CACHÃ‰ â”€â”€ actualizar en cada release â”€â”€ */
const CACHE_NAME = 'manga-ulpgc-v5.46.17';

/* â”€â”€ Assets precacheados en la instalaciÃ³n del SW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Incluir aquÃ­ cualquier archivo nuevo que se aÃ±ada al proyecto. */
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './recurso.html',
  './landing/htm-app.js',
  './css/estilos.css',
  './css/editorial.css',
  './css/editorial-extras.css',
  './js/app.min.js',
  './js/datos.min.js',
  './js/vinetas-generator.js',
  './js/actividad-vinetas.js',
  './js/autocomprobacion-datos.js',
  './js/autocomprobacion.js',
  './js/segmentacion.js',
  './js/mediacion.js',
  './js/planificador.js',
  './js/catalog-collapse.js',
  './js/etapa-selector.js',
  './js/left-dock.js',
  './js/overlay-fab-hide.js',
  './js/filter-collapse-sticky.js',
  './js/timeline-jump.js',
  './js/lazy-fonts.js',
  './js/url-state.js',
  './js/ficha-pdf.js',
  './manifest.json',
  './icons/icon.svg',
  './intro/card.html',
  './img/banner-ulpgc-aulacomic.jpg',
  './img/banner-ulpgc-aulacomic.webp',
  './img/logo-aula-comic.jpg',
  './img/logo-aula-comic.webp',
  './ficha_trabajo_manga.pdf',
];

/* â”€â”€ Dominios que van SIEMPRE a red (nunca se cachean) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Â· api.anthropic.com              â†’ Claude API
   Â· googleapis.com                 â†’ Google Fonts CSS + Gemini
   Â· generativelanguage.googleapis.com â†’ Gemini API (explÃ­cito)
   fonts.gstatic.com se omite intencionalmente: los binarios de
   fuente se cachean para permitir uso offline en el aula. */
const NETWORK_ONLY_PATTERNS = [
  'api.anthropic.com',
  'googleapis.com',
  'generativelanguage.googleapis.com',
];

/* â”€â”€ INSTALACIÃ“N: precachear assets estÃ¡ticos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())   // activa el SW nuevo inmediatamente
  );
});

/* â”€â”€ ACTIVACIÃ“N: limpiar cachÃ©s de versiones anteriores â”€â”€â”€â”€â”€â”€â”€â”€ */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k !== CACHE_NAME)   // conserva solo la versiÃ³n actual
            .map(k => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())      // toma control de pestaÃ±as abiertas
  );
});

/* â”€â”€ FETCH: Cache First para assets, Network Only para IA â”€â”€â”€â”€â”€ */
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Network Only: nunca cachear llamadas a APIs de IA
  if (NETWORK_ONLY_PATTERNS.some(pattern => url.includes(pattern))) return;

  // Solo interceptar peticiones GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Cache hit â†’ responder desde cachÃ©
      if (cached) return cached;

      // Cache miss â†’ ir a red y cachear la respuesta
      return fetch(event.request)
        .then(response => {
          // Cachear solo respuestas vÃ¡lidas del propio origen o CORS anÃ³nimo
          if (response.ok && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Fallback offline: devolver index.html para navegaciÃ³n SPA
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          // Para otros recursos (imÃ¡genes, fuentes), fallo silencioso
        });
    })
  );
});

