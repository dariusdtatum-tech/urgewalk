#!/usr/bin/env node
/**
 * Expand all / Collapse all on Support (25 Nov 2026, r16). Dev-only.
 *   npm ci && node tests/expand-all.test.mjs
 * Contract: with JavaScript, two buttons sit above the question list; each question still opens by itself; Expand all
 * opens every one and says "All answers open"; Collapse all closes them; aria-expanded follows. Without JavaScript the
 * buttons do not exist and the native <details> still work. Targets are at least 44 px.
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
  try { res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join(ROOT, path))); }
  catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

let browser;
try { browser = await chromium.launch({ channel: 'chrome' }); } catch { browser = await chromium.launch(); }
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('ok   ' + m); };

for (const [name, viewport] of [['phone', { width: 390, height: 844 }], ['wide', { width: 1440, height: 900 }]]) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(BASE + '/support.html');
  const expand = page.getByRole('button', { name: 'Expand all' });
  const collapse = page.getByRole('button', { name: 'Collapse all' });
  const total = await page.locator('.reading details').count();
  const open = () => page.locator('.reading details[open]').count();
  ok(total >= 3, `${name}: ${total} questions`);
  ok((await open()) === 0 && (await collapse.getAttribute('aria-expanded')) === 'true' && (await expand.getAttribute('aria-expanded')) === 'false', `${name}: starts collapsed, state shown`);
  for (const b of [expand, collapse]) { const r = await b.boundingBox(); ok(r.height >= 44 && r.width >= 44, `${name}: target ${Math.round(r.width)}x${Math.round(r.height)}`); }
  await page.locator('.reading summary').nth(2).click();
  ok((await open()) === 1, `${name}: one question opens by itself`);
  await page.waitForFunction(() => document.querySelector('.openall button').getAttribute('aria-expanded') === 'false' && document.querySelectorAll('.openall button')[1].getAttribute('aria-expanded') === 'false');
  ok(true, `${name}: partly open, neither pressed`);
  await expand.click();
  ok((await open()) === total && (await expand.getAttribute('aria-expanded')) === 'true', `${name}: Expand all opens every answer`);
  await page.waitForFunction(() => document.querySelector('.openall .say').textContent === 'All answers open');
  ok(true, `${name}: announces "All answers open"`);
  await page.locator('.reading summary').nth(0).click();
  ok((await open()) === total - 1, `${name}: one closes by itself`);
  await page.waitForFunction(() => document.querySelector('.openall button').getAttribute('aria-expanded') === 'false');
  ok(true, `${name}: state follows`);
  await collapse.click();
  ok((await open()) === 0 && (await collapse.getAttribute('aria-expanded')) === 'true', `${name}: Collapse all closes every answer`);
  await page.waitForFunction(() => document.querySelector('.openall .say').textContent === 'All answers closed');
  await page.keyboard.press('Tab');
  await expand.focus();
  await page.keyboard.press('Enter');
  ok((await open()) === total, `${name}: keyboard Enter on Expand all works`);
  await ctx.close();
}

const nojs = await browser.newContext({ javaScriptEnabled: false });
const p2 = await nojs.newPage();
await p2.goto(BASE + '/support.html');
ok((await p2.locator('.openall').count()) === 0, 'no JavaScript: no buttons');
await p2.locator('.reading summary').first().click();
ok((await p2.locator('.reading details[open]').count()) === 1, 'no JavaScript: native details still open');
await nojs.close();

await browser.close();
server.close();
console.log(fails ? `RESULT: FAIL (${fails})` : 'RESULT: PASS');
process.exit(fails ? 1 : 0);
