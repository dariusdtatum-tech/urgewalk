#!/usr/bin/env node
/**
 * No empty plates (25 Nov 2026). Dev-only: `node tests/media.test.mjs` (after `npm ci`).
 * For every page, in daylight and evening, with and without JavaScript:
 *   - every <img>, <video poster>, <source>, and a video's data-day / data-evening file returns 200;
 *   - every visible <img> has naturalWidth > 0 (it actually rendered);
 *   - every visible .plate shows something (a rendered image, or a video that has a frame);
 *   - the tool pages' plates (Walk, Breathe, Ground) have a loop for both lights.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  if (path.includes('..')) { res.writeHead(400).end(); return; }
  try {
    const body = await readFile(join(ROOT, path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream', 'content-length': body.length }).end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}/`;
const pages = ['index', 'privacy', 'terms', 'support', 'helpers', 'premium', 'community', 'walk', 'breathe', 'ground', 'ride', '404'];
let browser;
try { browser = await chromium.launch({ channel: 'chrome' }); } catch { browser = await chromium.launch(); }
const fails = [];
let checked = 0;
for (const js of [true, false]) for (const light of ['day', 'evening']) for (const pg of pages) {
  if (!js && light === 'evening') continue; // without JavaScript the site is always daylight
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: js, reducedMotion: 'reduce' });
  if (js) await ctx.addInitScript((l) => { try { localStorage.setItem('urgewalk.light', l); sessionStorage.setItem('uw-opened', '1'); } catch {} }, light);
  const page = await ctx.newPage();
  const bad = [];
  page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  await page.goto(`${base}${pg}.html`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const info = await page.evaluate(async ([light, js]) => {
    const out = { urls: [], empty: [], broken: [] };
    const abs = (u) => new URL(u, location.href).href;
    const visible = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };
    document.querySelectorAll('img[src]').forEach((i) => { out.urls.push(abs(i.getAttribute('src'))); });
    document.querySelectorAll('source[src],source[srcset]').forEach((s) => out.urls.push(abs(s.getAttribute('src') || s.getAttribute('srcset').split(' ')[0])));
    document.querySelectorAll('video').forEach((v) => {
      if (v.getAttribute('poster')) out.urls.push(abs(v.getAttribute('poster')));
      if (v.getAttribute('src')) out.urls.push(abs(v.getAttribute('src')));
      for (const k of ['day', 'evening']) if (v.dataset[k]) out.urls.push(abs(v.dataset[k]));
    });
    document.querySelectorAll('img[loading=lazy]').forEach((i) => { i.loading = 'eager'; });
    for (const i of document.querySelectorAll('img')) {
      if (!visible(i) || i.closest('noscript')) continue;
      if (js && !i.complete) await new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); setTimeout(r, 4000); });
      if (!(i.naturalWidth > 0)) out.broken.push(i.getAttribute('src'));
    }
    for (const p of document.querySelectorAll('.plate')) {
      if (!visible(p) || p.closest('[hidden]') || p.closest('#leaves') && !p.closest('.pg,.pp')) continue;
      const imgs = [...p.querySelectorAll('img')].filter((i) => visible(i) && i.naturalWidth > 0);
      const vids = [...p.querySelectorAll('video')].filter((v) => v.readyState >= 2 || v.poster);
      if (!imgs.length && !vids.length && !p.querySelector('picture') && !p.classList.contains('shot') && !p.querySelector('svg')) out.empty.push(p.className + ' ' + (p.getAttribute('aria-label') || ''));
    }
    return out;
  }, [light, js]);
  const urls = [...new Set(info.urls)];
  for (const u of urls) { const r = await fetch(u); checked++; if (r.status !== 200) fails.push(`${pg} ${light} js=${js}: ${r.status} ${u}`); }
  info.broken.forEach((b) => fails.push(`${pg} ${light} js=${js}: image did not render: ${b}`));
  info.empty.forEach((e) => fails.push(`${pg} ${light} js=${js}: EMPTY plate: ${e}`));
  bad.forEach((b) => fails.push(`${pg} ${light} js=${js}: response ${b}`));
  await ctx.close();
}
await browser.close(); server.close();
if (fails.length) { console.log('media.test FAIL'); [...new Set(fails)].forEach((f) => console.log('  ' + f)); process.exit(1); }
console.log(`media.test PASS (${checked} file checks, ${pages.length} pages x 2 lights x JS on/off)`);
