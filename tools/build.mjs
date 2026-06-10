#!/usr/bin/env node
/**
 * build.mjs — Script de release para "Las eras de Japon y el manga"
 * Biblioteca Campus del Obelisco · Aula de Comic · ULPGC
 *
 * Una sola fuente de version: version.json
 *
 * Que hace:
 *   1. Lee la version de version.json.
 *   2. Minifica js/app.js  -> js/app.min.js   (Terser).
 *   3. Minifica js/datos.js -> js/datos.min.js (Terser).
 *   4. Propaga la version a:
 *        · sw.js          (cabecera + const CACHE_NAME)
 *        · recurso.html   (query strings ?v=...)
 *        · index.html     (query strings ?v=...)
 *   5. Informa de los tamanos antes/despues.
 *
 * Uso:   node tools/build.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { minify } from 'terser';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => join(ROOT, ...s);
const kb = n => (n / 1024).toFixed(1) + ' KB';

/* ── 0 · Verificacion de codificacion ─────────────────────── */
/* La doble codificacion UTF-8 (mojibake) ha entrado al menos dos
   veces en el repositorio y es invisible hasta abrir el recurso en
   el navegador. Este paso recorre todos los ficheros de texto del
   proyecto y ABORTA la release si detecta las secuencias tipicas
   (A-tilde seguida de segundo byte, a-circunfleja + euro, A-circunfleja
   + puntuacion). Excluye node_modules
   y las librerias vendorizadas de assets/libs.                     */
import { readdir, stat } from 'node:fs/promises';

const TEXT_EXT = /\.(js|mjs|html|css|json|md|yaml|yml|svg|txt)$/i;
const EXCLUDE  = /(^|[\\/])(node_modules|assets[\\/]libs|\.git)([\\/]|$)/;
// Patrones construidos con escapes para que este propio fichero no dispare
// la deteccion. Tres familias de doble codificacion UTF-8->cp1252:
//   \u00C3 (A tilde)      -> letras acentuadas corruptas
//   \u00C2 (A circunfleja) -> puntuacion y espacios corruptos
//   \u00E2 (a circunfleja) -> simbolos y rayas corruptos (p. ej. flechas,
//                             avisos, puntos suspensivos)
// El segundo caracter abarca el repertorio cp1252 completo (C1 remapeado
// a puntuacion tipografica + rango \u00A0-\u00FF). Un caracter ASCII tras
// ellos nunca dispara, asi que palabras legitimas (chateau, Sao) no dan
// falso positivo en minusculas ni en texto corrido.
const SEGUNDO = '[\\u0080-\\u00BF\\u00A0-\\u00FF\\u0152\\u0153\\u0160\\u0161\\u017D\\u017E\\u0178\\u0192\\u02C6\\u02DC\\u2013\\u2014\\u2018\\u2019\\u201A\\u201C\\u201D\\u201E\\u2020\\u2021\\u2022\\u2026\\u2030\\u2039\\u203A\\u20AC\\u2122]';
const MOJIBAKE = new RegExp('[\\u00C3\\u00C2\\u00E2]' + SEGUNDO);

async function* walk(dir) {
  for (const name of await readdir(dir)) {
    const full = join(dir, name);
    if (EXCLUDE.test(full)) continue;
    const st = await stat(full);
    if (st.isDirectory()) yield* walk(full);
    else if (TEXT_EXT.test(name)) yield full;
  }
}

const infected = [];
// Los dos minificados son artefactos que ESTE build regenera unas lineas
// mas abajo a partir de fuentes ya verificadas: se excluyen del escaneo
// para evitar abortar por un derivado obsoleto (huevo y gallina).
const DERIVADOS = new Set(['js/app.min.js', 'js/datos.min.js']);
for await (const file of walk(ROOT)) {
  const rel = file.slice(ROOT.length + 1).replace(/\\/g, '/');
  if (DERIVADOS.has(rel)) continue;
  const txt = await readFile(file, 'utf8');
  const m = txt.match(MOJIBAKE);
  if (m) infected.push({ file: rel, muestra: m[0] });
}
if (infected.length) {
  console.error('\n  ✗ ABORTADO: mojibake (doble codificacion UTF-8) detectado en:');
  for (const { file, muestra } of infected) console.error(`      ${file}  (muestra: "${muestra}")`);
  console.error('  Repara la codificacion antes de publicar (p. ej. con ftfy o');
  console.error('  decodificando cp1252 -> utf-8) y vuelve a ejecutar el build.\n');
  process.exit(1);
}
console.log('\n  ✓ Codificacion verificada: sin mojibake en los ficheros de texto.');

/* ── 1 · Version ──────────────────────────────────────────── */
const { version } = JSON.parse(await readFile(p('version.json'), 'utf8'));
console.log(`\n  Release v${version}\n  ${'─'.repeat(40)}`);

/* ── 2 · Minificacion ─────────────────────────────────────── */
const terserOpts = {
  compress: { passes: 2, drop_debugger: true },
  mangle: true,
  format: { comments: false },
};

async function minFile(src, dst) {
  const code = await readFile(p(src), 'utf8');
  const out = await minify(code, terserOpts);
  if (out.error) throw out.error;
  await writeFile(p(dst), out.code, 'utf8');
  const ratio = (100 * (1 - out.code.length / code.length)).toFixed(0);
  console.log(`  ${src.padEnd(16)} ${kb(code.length).padStart(9)}  ->  ${kb(out.code.length).padStart(9)}  (-${ratio}%)`);
}

await minFile('js/app.js', 'js/app.min.js');
await minFile('js/datos.js', 'js/datos.min.js');

/* ── 3 · Propagacion de version ───────────────────────────── */
async function patch(file, transforms) {
  let txt = await readFile(p(file), 'utf8');
  for (const [re, repl] of transforms) txt = txt.replace(re, repl);
  await writeFile(p(file), txt, 'utf8');
  console.log(`  version -> ${file}`);
}

// sw.js: const CACHE_NAME (ASCII, ancla fiable) y cabecera de version.
// La cabecera puede contener mojibake heredado en "Version"; se localiza
// por el patron numerico que precede a la descripcion entre parentesis.
await patch('sw.js', [
  [/(const\s+CACHE_NAME\s*=\s*['"]manga-ulpgc-v)[\d.]+(['"])/, `$1${version}$2`],
  [/(:\s*)[\d.]+(\s*\([^)]*\))/, `$1${version}$2`],
]);

// recurso.html e index.html: todas las query strings ?v=...
for (const f of ['recurso.html', 'index.html']) {
  await patch(f, [[/\?v=[\d.]+/g, `?v=${version}`]]);
}

console.log(`  ${'─'.repeat(40)}\n  Listo. Recuerda subir el cambio de CACHE_NAME para invalidar cache.\n`);
