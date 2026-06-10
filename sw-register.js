'use strict';
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then(registrations => Promise.all(registrations.map(reg => reg.unregister())))
      .then(() => {
        if (!window.caches) return;
        return caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))));
      })
      .catch(() => {});
  });
}
