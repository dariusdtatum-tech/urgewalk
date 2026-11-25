#!/usr/bin/env node
/**
 * The home as a book (25 Nov 2026): turning, the contents, the hash, motion in place.
 *
 * Run from the repo root (dev-only; nothing here is part of the live site):
 *   npm install && node tests/book.test.mjs
 * Serves the repo on a free port. Uses the system Chrome (the loops are H.264) and falls back to Playwright's Chromium.
 *
 * Contract: pages are leaves in a horizontal scroll-snap container (#leaves). Phones turn one leaf at a time (16 stops),
 * wide screens one spread (13). The folio reads "iii / xvi". Every page has a hash (#plate-iv); contents entries jump
 * there and the back button turns back. Only the page in view plays its loop. Reduce Motion, Save-Data and no JavaScript
 * show posters only; no JavaScript is one plain vertical page.
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
    const type = TYPES[extname(path)] || 'application/octet-stream';
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (range) {
      const a = Number(range[1] || 0), b = range[2] ? Number(range[2]) : body.length - 1;
      res.writeHead(206, { 'content-type': type, 'content-range': `bytes ${a}-${b}/${body.length}`, 'accept-ranges': 'bytes', 'content-length': b - a + 1 }).end(body.subarray(a, b + 1));
    } else res.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes' }).end(body);
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

let browser;
try { browser = await chromium.launch({ channel: 'chrome' }); } catch { browser = await chromium.launch(); }
const PHONE = { width: 390, height: 844 }, WIDE = { width: 1440, height: 900 };
let pass = 0, fail = 0;
const out = [];
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; out.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  ' + extra}`); };

async function open(opts = {}) {
  const { viewport = PHONE, reduce = false, js = true, hash = '', light = 'day', saveData = false, touch = viewport.width < 900 } = opts;
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, reducedMotion: reduce ? 'reduce' : 'no-preference', javaScriptEnabled: js, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(String(e)));
  await page.addInitScript(([l, s]) => {
    try { localStorage.setItem('urgewalk.light', l); sessionStorage.setItem('uw-opened', '1'); } catch {}
    if (s) Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: true }) });
  }, [light, saveData]);
  await page.goto(BASE + '/' + hash);
  await page.waitForTimeout(400);
  return { page, ctx };
}
const folio = (page) => page.evaluate(() => document.querySelector('.fol')?.textContent || '');
const hashOf = (page) => page.evaluate(() => location.hash);
const settle = (page, ms = 700) => page.waitForTimeout(ms);
async function swipe(page, dir) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.synthesizeScrollGesture', { x: 195, y: 420, xDistance: dir === 'left' ? -260 : 260, yDistance: 0, gestureSourceType: 'touch', speed: 1200 });
  await settle(page, 900);
}
const videos = (page) => page.evaluate(() => [...document.querySelectorAll('video.loop')].map((v) => ({ src: v.getAttribute('src'), paused: v.paused, id: v.closest('[id^=plate],#plate-i')?.id || v.closest('[id]')?.id })));

// ---------- phone ----------
{
  const { page, ctx } = await open();
  ok('phone: 16 stops, the folio opens at i / xvi', (await folio(page)) === 'i / xvi', await folio(page));
  ok('phone: leaves are labelled pages', await page.evaluate(() => [...document.querySelectorAll('.pg,.pp')].every((s) => s.getAttribute('aria-roledescription') === 'page' && s.getAttribute('aria-labelledby') && document.getElementById(s.getAttribute('aria-labelledby')))));
  ok('phone: no horizontal overflow outside the book', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.body.scrollWidth <= innerWidth));
  await page.click('[data-turn="1"]'); await settle(page);
  ok('phone: Next turns to ii / xvi, hash #plate-i', (await folio(page)) === 'ii / xvi' && (await hashOf(page)) === '#plate-i', `${await folio(page)} ${await hashOf(page)}`);
  await swipe(page, 'left');
  ok('phone: a swipe left turns to iii / xvi (Plate II)', (await folio(page)) === 'iii / xvi' && (await hashOf(page)) === '#plate-ii', `${await folio(page)} ${await hashOf(page)}`);
  await page.waitForTimeout(1200);
  let v = await videos(page);
  ok('phone: only the visible plate has footage, and it plays', v.filter((x) => x.src).length === 1 && v.find((x) => x.src && !x.paused)?.id === 'plate-ii', JSON.stringify(v));
  await swipe(page, 'left'); await swipe(page, 'right');
  ok('phone: swipe right turns back to iii / xvi', (await folio(page)) === 'iii / xvi', await folio(page));
  await page.keyboard.press('ArrowRight'); await settle(page);
  ok('phone: ArrowRight turns to iv / xvi', (await folio(page)) === 'iv / xvi', await folio(page));
  await page.keyboard.press('PageDown'); await settle(page);
  await page.keyboard.press('PageUp'); await settle(page);
  ok('phone: PageDown then PageUp land on iv / xvi', (await folio(page)) === 'iv / xvi', await folio(page));
  await page.keyboard.press('End'); await settle(page);
  ok('phone: End goes to the colophon', (await folio(page)) === 'xvi / xvi' && await page.evaluate(() => document.querySelector('#colophon').getBoundingClientRect().left === 0));
  await page.keyboard.press('Home'); await settle(page);
  ok('phone: Home goes to the cover leaf', (await folio(page)) === 'i / xvi');
  // contents jump and back
  await page.click('a[href="#plate-v"]'); await settle(page);
  ok('phone: the contents jumps to Plate V and updates the hash', (await folio(page)) === 'vi / xvi' && (await hashOf(page)) === '#plate-v', `${await folio(page)} ${await hashOf(page)}`);
  await page.goBack(); await settle(page);
  ok('phone: Back returns to the contents', (await folio(page)) === 'i / xvi', `${await folio(page)} ${await hashOf(page)}`);
  await page.goForward(); await settle(page);
  ok('phone: Forward returns to Plate V', (await folio(page)) === 'vi / xvi', await folio(page));
  // Help
  ok('phone: Help 988 is visible on this leaf', await page.evaluate(() => { const r = document.querySelector('.help').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.width > 40; }));
  await page.click('.help'); await settle(page);
  ok('phone: Help is one tap to the Help leaf', (await hashOf(page)) === '#help' && await page.evaluate(() => document.querySelector('#help').getBoundingClientRect().left === 0), await hashOf(page));
  ok('phone: no page errors', page.errors.length === 0, page.errors.join('|'));
  await ctx.close();
}
{ // every leaf fits or scrolls inside itself, with a cue; nothing is clipped
  const { page, ctx } = await open({ viewport: { width: 390, height: 700 } });
  const r = await page.evaluate(() => [...document.querySelectorAll('.pg,.pp')].map((s) => ({ id: s.id, over: s.scrollHeight > s.clientHeight + 8, cue: s.classList.contains('has-more'), ov: getComputedStyle(s).overflowY })));
  ok('phone (700 high): leaves taller than the screen scroll inside themselves, with a cue', r.every((x) => x.ov === 'auto' && (!x.over || x.cue || x.id === '')), JSON.stringify(r.filter((x) => x.over && !x.cue)));
  await ctx.close();
}
{ // deep link
  const { page, ctx } = await open({ hash: '#plate-iv' });
  ok('deep link #plate-iv opens on Plate IV (phone, no opening)', (await folio(page)) === 'v / xvi' && await page.evaluate(() => document.querySelector('#plate-iv').getBoundingClientRect().left === 0), await folio(page));
  await ctx.close();
}
{ // Reduce Motion
  const { page, ctx } = await open({ reduce: true });
  await page.click('[data-turn="1"]'); await page.waitForTimeout(150);
  ok('Reduce Motion: the page turns at once (no smooth scroll, no turn animation)', (await folio(page)) === 'ii / xvi' && await page.evaluate(() => !document.querySelector('.turn-in') && getComputedStyle(document.querySelector('#plate-i > *')).animationName === 'none'), await folio(page));
  await page.click('a[href="#plate-ii"]'); await page.waitForTimeout(1500);
  ok('Reduce Motion: posters only, no footage requested', (await videos(page)).every((x) => !x.src));
  await ctx.close();
}
{ // Save-Data
  const { page, ctx } = await open({ saveData: true });
  await page.click('a[href="#plate-ii"]'); await page.waitForTimeout(1500);
  ok('Save-Data: posters only', (await videos(page)).every((x) => !x.src));
  await ctx.close();
}
{ // no JS
  const { page, ctx } = await open({ js: false });
  const m = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, iw: innerWidth, turn: getComputedStyle(document.getElementById('turn')).display, book: getComputedStyle(document.getElementById('leaves')).display, order: [...document.querySelectorAll('.pg,.pp')].map((s) => s.id).join(','), tops: [...document.querySelectorAll('.pg,.pp')].map((s) => s.getBoundingClientRect().top) }));
  ok('no JS: one plain vertical page (tall, no sideways scroll, no turn bar)', m.h > 4000 && m.w <= m.iw && m.turn === 'none' && m.book === 'block', JSON.stringify({ h: m.h, w: m.w, turn: m.turn, book: m.book }));
  ok('no JS: the leaves stack in order', m.tops.every((t, i) => i === 0 || t > m.tops[i - 1]) && m.order.startsWith('contents,plate-i,plate-ii,plate-iii,plate-iv,plate-v,plate-vi,plate-vii,plate-viii,plate-ix,watch,privacy,community,keep,help,colophon'), m.order);
  ok('no JS: the contents link goes to its plate', await page.evaluate(() => document.querySelector('a[href="#plate-iv"]') !== null));
  await ctx.close();
}

// ---------- wide ----------
{
  const { page, ctx } = await open({ viewport: WIDE, touch: false });
  ok('wide: 13 stops, opens at i / xiii', (await folio(page)) === 'i / xiii', await folio(page));
  const m = await page.evaluate(() => ({ c: document.querySelector('#contents').getBoundingClientRect(), p: document.querySelector('#plate-i').getBoundingClientRect() }));
  ok('wide: spread 1 shows the contents (left) and Plate I (right)', m.c.left === 0 && Math.abs(m.p.left - 720) < 2, JSON.stringify(m));
  await page.keyboard.press('ArrowRight'); await settle(page);
  ok('wide: ArrowRight turns to a spread (Plate II), ii / xiii', (await folio(page)) === 'ii / xiii' && (await hashOf(page)) === '#plate-ii', `${await folio(page)} ${await hashOf(page)}`);
  await page.mouse.move(700, 450); await page.mouse.wheel(0, 120); await settle(page, 900);
  ok('wide: a vertical wheel turns one spread', (await folio(page)) === 'iii / xiii', await folio(page));
  await page.mouse.wheel(0, -120); await settle(page, 900);
  ok('wide: and back', (await folio(page)) === 'ii / xiii', await folio(page));
  await page.waitForTimeout(1200);
  const v = await videos(page);
  ok('wide: only one video has footage, and it plays', v.filter((x) => x.src).length === 1 && v.find((x) => x.src && !x.paused)?.id === 'plate-ii', JSON.stringify(v));
  await page.goto(BASE + '/#plate-iv'); await settle(page);
  ok('wide: deep link #plate-iv', (await folio(page)) === 'iv / xiii', await folio(page));
  await page.goto(BASE + '/#plate-i'); await settle(page);
  ok('wide: #plate-i (the right-hand leaf of spread 1) lands on spread 1', (await folio(page)) === 'i / xiii', await folio(page));
  await page.keyboard.press('End'); await settle(page);
  const col = await page.evaluate(() => { const c = document.querySelector('#colophon'); return { fits: c.scrollHeight <= c.clientHeight + 1, w: c.scrollWidth <= c.clientWidth + 1, links: c.querySelectorAll('.colo-nav a').length, sw: !!c.querySelector('.light-switch button') }; });
  ok('wide: the colophon fits its page with its links and light switch', col.fits && col.w && col.links === 11 && col.sw, JSON.stringify(col));
  // light switch swaps the footage
  await page.goto(BASE + '/#plate-ii'); await settle(page, 1500);
  await page.evaluate(() => { document.documentElement.dataset.light = 'evening'; }); await settle(page, 600);
  const e = await videos(page);
  ok('wide: evening swaps in the evening loop', e.some((x) => x.src && x.src.includes('path-evening')), JSON.stringify(e));
  ok('wide: no page errors', page.errors.length === 0, page.errors.join('|'));
  await ctx.close();
}
{ // every leaf at wide: the page fits (no inner scroll needed) at 1440x900 and at 1280x720 scrolls with a cue
  const { page, ctx } = await open({ viewport: WIDE, touch: false });
  const r = await page.evaluate(() => [...document.querySelectorAll('.pg,.pp')].map((s) => ({ id: s.id, over: s.scrollHeight > s.clientHeight + 8 })).filter((x) => x.over));
  ok('wide 1440x900: no leaf needs to scroll', r.length === 0, JSON.stringify(r));
  await ctx.close();
}

{ // the Watch leaf: unnumbered, fits one phone screen, swatches whole
  const { page, ctx } = await open({ hash: '#watch' });
  await page.waitForTimeout(600);
  const w = await page.evaluate(() => { const l = document.querySelector('#watch'); const sw = [...l.querySelectorAll('.sw')].map((b) => b.getBoundingClientRect()); const pl = l.querySelector('.plate').getBoundingClientRect(); return { cap: l.querySelector('.folio-cap').textContent, fits: l.scrollHeight <= l.clientHeight + 1, more: l.classList.contains('has-more'), swIn: sw.every((r) => r.bottom <= innerHeight - 60 && r.right <= innerWidth && r.left >= 0), plate: pl.height / innerHeight }; });
  ok('phone: the Watch leaf is unnumbered ("On the wrist")', w.cap === 'On the wrist' && !/Plate/.test(w.cap), w.cap);
  ok('phone 390x844: the Watch leaf fits one screen, swatches whole, no "More below"', w.fits && !w.more && w.swIn && w.plate > 0.28 && w.plate < 0.5, JSON.stringify(w));
  const edges = await page.evaluate(() => [...document.querySelectorAll('.pg,.pp')].every((l) => getComputedStyle(l).scrollbarWidth === 'none'));
  ok('phone: leaves show no scrollbar lines at their edges', edges);
  await ctx.close();
}
{ // desktop spreads: equal top margin, text top = plate top, group centred between header and turn bar
  const { page, ctx } = await open({ viewport: WIDE, touch: false });
  const rows = [];
  for (const id of ['plate-ii', 'plate-iv', 'plate-vii', 'watch']) {
    await page.evaluate((i) => document.getElementById(i).scrollIntoView({ inline: 'start' }), id); await page.waitForTimeout(500);
    rows.push(await page.evaluate((i) => { const l = document.getElementById(i), p = l.querySelector('.plate').getBoundingClientRect(), c = l.querySelector('.folio-cap').getBoundingClientRect(); return { id: i, top: Math.round(p.top - 72), bottom: Math.round(840 - p.bottom), capDelta: Math.round(c.top - p.top) }; }, id));
  }
  ok('wide: caption top meets the plate top, and the plate is centred between header and turn bar', rows.every((r) => Math.abs(r.top - r.bottom) <= 6 && Math.abs(r.capDelta) <= 3 && r.top >= 40), JSON.stringify(rows));
  await page.goto(BASE + '/#colophon'); await page.waitForTimeout(600);
  const c = await page.evaluate(() => { const e = document.querySelector('#colophon .words').getBoundingClientRect(), n = document.querySelector('#colophon .colo-right').getBoundingClientRect(); const top = Math.min(e.top, n.top) - 72, bot = 840 - Math.max(e.bottom, n.bottom); return { top: Math.round(top), bot: Math.round(bot) }; });
  ok('wide: the colophon block is centred (no empty bottom half)', Math.abs(c.top - c.bot) <= 40 && c.top >= 40, JSON.stringify(c));
  await ctx.close();
}

console.log(out.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
await browser.close(); server.close();
process.exit(fail ? 1 : 0);
