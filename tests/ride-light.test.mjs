#!/usr/bin/env node
/**
 * Ride one out: which sea plays in which Island light (ride.html).
 *
 * Run from the repo root (dev-only; nothing here is part of the live site):
 *   npm i --no-save playwright && npx playwright install chromium
 *   node tests/ride-light.test.mjs
 * Once the site-check tooling (package.json with playwright) is on main, `npm install` is enough.
 * Serves the repo itself on a free port; the clock and the time zone are injected, never read.
 *
 * Contract: html[data-light] is the saved choice (localStorage `urgewalk.light`, "day" or "evening"),
 * else the clock: day from 6:00:00 to 17:59:59 local, evening otherwise. Evening plays
 * shore-evening-tall.mp4 (phone) or shore-evening-wide.mp4 (wide) with the matching .webp poster;
 * day plays shore-phone / shore-1440 / shore-2160 with the .jpg poster. Switching the light while
 * idle changes the sea at once; while a pass runs it waits for the next Start. Motion off never
 * loads footage; only the poster follows the light.
 *
 * Edge cases (written before the tests):
 *  1. 17:59:59 -> day            2. 18:00:00 -> evening       3. 05:59:59 -> evening
 *  4. 06:00:00 -> day            5. 00:00:00 midnight -> evening
 *  6. 06:00 on the day clocks spring forward (Mar 8 2026, America/New_York) -> day
 *  7. saved "day" at 20:00 -> day; saved "evening" at 12:00 -> evening
 *  8. saved junk ("dusk") -> the clock decides
 *  9. storage that throws -> the clock decides, no page error (19:00 evening, 09:00 day)
 * 10. wide screen 1440x900: day -> shore-1440.mp4 + shore-wide.jpg; evening -> shore-evening-wide.*
 * 11. idle switch -> sea changes at once
 * 12. switch mid-pass -> sea unchanged until the pass ends; Stop keeps it; next Start applies it
 * 13. Reduce Motion (Motion off) -> no footage requested; poster follows the light, idle switch too
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  if (path.includes('..')) { res.writeHead(400).end(); return; }
  try { const body = await readFile(join(ROOT, path)); res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(body); }
  catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const PHONE = { width: 390, height: 844 }, WIDE = { width: 1440, height: 900 };
const M = 'assets/motion/';
const DAY_TALL = { src: M + 'shore-phone.mp4', poster: M + 'shore-tall.jpg' };
const EVE_TALL = { src: M + 'shore-evening-tall.mp4', poster: M + 'shore-evening-tall.webp' };
const DAY_WIDE = { src: M + 'shore-1440.mp4', poster: M + 'shore-wide.jpg' };
const EVE_WIDE = { src: M + 'shore-evening-wide.mp4', poster: M + 'shore-evening-wide.webp' };

const browser = await chromium.launch();
let pass = 0, fail = 0;
const results = [];

async function open({ time, viewport = PHONE, saved, blocked = false, reduce = false }) {
  const ctx = await browser.newContext({ viewport, timezoneId: 'America/New_York', reducedMotion: reduce ? 'reduce' : 'no-preference', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(String(e)));
  await page.route('**/*.mp4', (r) => r.abort());   // the attribute is what we test; no footage needed
  if (blocked) await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }); });
  else if (saved !== undefined) await page.addInitScript((v) => { try { localStorage.setItem('urgewalk.light', v); } catch {} }, saved);
  await page.clock.setFixedTime(new Date(time));
  await page.goto(BASE + '/ride.html');
  return { page, ctx };
}
const sea = (page) => page.evaluate(() => {
  const v = document.getElementById('sea');
  const rel = (u) => (u ? new URL(u, location.href).pathname.replace(/^\//, '') : null);
  return { light: document.documentElement.dataset.light, src: rel(v.getAttribute('src')), poster: rel(v.getAttribute('poster')), state: document.getElementById('main').dataset.state };
});
function expect(name, got, want) {
  const ok = Object.keys(want).every((k) => got[k] === want[k]);
  ok ? pass++ : fail++;
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      want ${JSON.stringify(want)}\n      got  ${JSON.stringify(got)}`}`);
}
async function at(name, opts, want) {
  const { page, ctx } = await open(opts);
  expect(name, { ...(await sea(page)), errors: page.errors.length }, { ...want, errors: 0 });
  await ctx.close();
}
const ET = (d, t) => `${d}T${t}-05:00`;

await at('1. 17:59:59 is day', { time: ET('2026-11-14', '17:59:59') }, { light: 'day', ...DAY_TALL });
await at('2. 18:00:00 is evening', { time: ET('2026-11-14', '18:00:00') }, { light: 'evening', ...EVE_TALL });
await at('3. 05:59:59 is evening', { time: ET('2026-11-14', '05:59:59') }, { light: 'evening', ...EVE_TALL });
await at('4. 06:00:00 is day', { time: ET('2026-11-14', '06:00:00') }, { light: 'day', ...DAY_TALL });
await at('5. midnight is evening', { time: ET('2026-11-14', '00:00:00') }, { light: 'evening', ...EVE_TALL });
await at('6. 06:00 EDT on spring-forward day is day', { time: '2026-03-08T06:00:00-04:00' }, { light: 'day', ...DAY_TALL });
await at('7a. saved day beats 20:00', { time: ET('2026-11-14', '20:00:00'), saved: 'day' }, { light: 'day', ...DAY_TALL });
await at('7b. saved evening beats 12:00', { time: ET('2026-11-14', '12:00:00'), saved: 'evening' }, { light: 'evening', ...EVE_TALL });
await at('8. saved junk falls back to the clock', { time: ET('2026-11-14', '19:00:00'), saved: 'dusk' }, { light: 'evening', ...EVE_TALL });
await at('9a. blocked storage, 19:00 is evening', { time: ET('2026-11-14', '19:00:00'), blocked: true }, { light: 'evening', ...EVE_TALL });
await at('9b. blocked storage, 09:00 is day', { time: ET('2026-11-14', '09:00:00'), blocked: true }, { light: 'day', ...DAY_TALL });
await at('10a. wide day', { time: ET('2026-11-14', '12:00:00'), viewport: WIDE }, { light: 'day', ...DAY_WIDE });
await at('10b. wide evening at 18:00', { time: ET('2026-11-14', '18:00:00'), viewport: WIDE }, { light: 'evening', ...EVE_WIDE });

{ // 11. idle switch
  const { page, ctx } = await open({ time: ET('2026-11-14', '12:00:00') });
  await page.click('.light-switch button[data-light="evening"]');
  expect('11a. idle switch to evening changes the sea at once', await sea(page), { light: 'evening', state: 'idle', ...EVE_TALL });
  await page.click('.light-switch button[data-light="day"]');
  expect('11b. idle switch back to day', await sea(page), { light: 'day', ...DAY_TALL });
  await ctx.close();
}
{ // 12. mid-pass switch
  const { page, ctx } = await open({ time: ET('2026-11-14', '12:00:00') });
  await page.click('#go');
  await page.click('.light-switch button[data-light="evening"]');
  expect('12a. switch mid-pass keeps the day sea', await sea(page), { light: 'evening', state: 'running', ...DAY_TALL });
  await page.click('#stop');
  expect('12b. after Stop the day sea stays', await sea(page), { light: 'evening', state: 'done', ...DAY_TALL });
  await page.click('#again');
  expect('12c. next Start plays the evening sea', { ...(await sea(page)), errors: page.errors.length }, { light: 'evening', state: 'running', ...EVE_TALL, errors: 0 });
  await ctx.close();
}
{ // 13. Reduce Motion
  const { page, ctx } = await open({ time: ET('2026-11-14', '18:00:00'), reduce: true });
  expect('13a. Motion off at 18:00: evening poster, no footage', await sea(page), { light: 'evening', src: null, poster: EVE_TALL.poster });
  await page.click('.light-switch button[data-light="day"]');
  expect('13b. Motion off, idle switch: day poster, still no footage', await sea(page), { light: 'day', src: null, poster: DAY_TALL.poster });
  await ctx.close();
}

await browser.close();
server.close();
console.log(results.join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
