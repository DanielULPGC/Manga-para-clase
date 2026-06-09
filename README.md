# El manga como recurso didÃ¡ctico
## Biblioteca Campus del Obelisco Â· Aula de CÃ³mic Â· ULPGC

**VersiÃ³n:** 5.10  |  **app.js:** 7.10  |  **datos.js:** 5.10

### Estructura de archivos

```
proyecto/
â”œâ”€â”€ index.html          â† Portada cinematogrÃ¡fica (NUEVA Â· v5.10)
â”œâ”€â”€ recurso.html        â† Recurso completo (antes index.html Â· ~313 KB)
â”œâ”€â”€ sw.js               â† Service Worker (PWA offline)
â”œâ”€â”€ manifest.json       â† Manifiesto PWA (instalable)
â”œâ”€â”€ landing/
â”‚   â””â”€â”€ htm-app.js      â† React + htm (sin Babel) â€” portada cinematogrÃ¡fica
â”œâ”€â”€ js/
â”‚   â”œâ”€â”€ app.js          â† LÃ³gica principal (~20.000 lÃ­neas)
â”‚   â””â”€â”€ datos.js        â† CatÃ¡logo de 280 tÃ­tulos
â”œâ”€â”€ css/
â”‚   â””â”€â”€ estilos.css     â† Estilos (~7.600 lÃ­neas)
â””â”€â”€ icons/
    â””â”€â”€ icon.svg        â† Icono PWA (maskable)
```

### Uso

Abrir `index.html` en un navegador moderno (Chrome, Firefox, Safari, Edge).
Para funcionar como PWA instalable, debe servirse desde un servidor HTTP
(GitHub Pages, servidor local con `npx serve .`, etc.).

### Mantenimiento del catÃ¡logo

El catÃ¡logo se actualiza a travÃ©s del **Panel docente** (icono âœŽ en el FAB):

1. **Editor** â†’ AÃ±adir / editar / eliminar tÃ­tulos individualmente
2. **Importar** â†’ Subir CSV o JSON (flujo Excel â†” app)
3. **Exportar** â†’ JSON completo o CSV local para revisiÃ³n
4. **Validar** â†’ Comprobar integridad del catÃ¡logo

Para actualizar el catÃ¡logo base en `datos.js`, editar el archivo
directamente e incrementar `CACHE_NAME` en `sw.js` (ej. `v5.9`).

### Activar modo DEBUG

En la consola del navegador (F12):
```js
localStorage.setItem('manga_debug', '1')
location.reload()
```

Para desactivar: `localStorage.removeItem('manga_debug')` + recargar.

### Historial de versiones (ciclo de mejoras 2026)

| Sprint | Mejora |
|--------|--------|
| P1â€“P3  | SW sincronizado Â· SafeStorage Â· PWA manifest |
| P4â€“P5  | Logger DEBUG Â· SanitizaciÃ³n XSS |
| P6â€“P7  | @media print Â· Dark mode completo |
| P8â€“P10 | Quiz 280 tÃ­tulos Â· ExportaciÃ³n docente Â· Accesibilidad D3 |
| P11â€“P16 | Seguridad Â· Trampa de foco Â· Virtual scrolling Â· Backoff IA Â· CSP Â· Event delegation |
| P17â€“P22 | Lectura guiada 280 tÃ­tulos Â· Historial persistente Â· QR pasaporte Â· Panel docente Â· Offline IA Â· URLs cortas |
| P23â€“P26 | Editor catÃ¡logo Â· Importador CSV/JSON Â· Validador esquema Â· Notificador novedades |

