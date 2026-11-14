#!/usr/bin/env node
/**
 * Local quality check for this static site.
 *
 * From the repo root:
 *   ./tools/check.sh
 *   npm run check
 *
 * Nothing in tools/ is part of the live site. The script prints one summary
 * you can paste into a pull request. Checks run on your machine only.
 */
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };
const A11Y_FAIL_BELOW = 95;
const SKIP_GMAIL_PATH = (f) =>
  f === 'package.json' ||
  f === 'package-lock.json' ||
  f.startsWith('tools/') ||
  f.startsWith('node_modules/');

const stamp = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date()) + ' (America/New_York)';

const result = {
  fails: [],
  notes: [],
  sections: [],
};

function section(title, body, failed = false) {
  result.sections.push({ title, body, failed });
}

function addFail(msg) {
  result.fails.push(msg);
}

function isBinary(buf) {
  const n = Math.min(buf.length, 8192);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

function repoHtmlPages() {
  return readdirSync(ROOT)
    .filter((name) => name.endsWith('.html') && statSync(join(ROOT, name)).isFile())
    .sort();
}

function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close((err) => (err ? reject(err) : resolve(port)));
    });
    s.on('error', reject);
  });
}

function runCommand(command, args, { timeoutMs = 180_000, cwd = ROOT } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({
        code: 124,
        stdout,
        stderr: stderr + `\n(timed out after ${timeoutMs / 1000}s)`,
      });
    }, timeoutMs);
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ code: 1, stdout, stderr: String(err) });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function startServer(port) {
  const child = spawn(
    'python3',
    ['-m', 'http.server', String(port), '--bind', '127.0.0.1'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let started = false;
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`, { redirect: 'manual' });
      if (res.status >= 200 && res.status < 500) {
        started = true;
        break;
      }
    } catch {
      await sleep(100);
    }
  }
  if (!started) {
    child.kill('SIGKILL');
    throw new Error('Could not start the local static server (python3 -m http.server).');
  }
  return child;
}

function chromeArgs() {
  const args = ['--disable-dev-shm-usage'];
  if (process.platform === 'linux') args.push('--no-sandbox');
  return args;
}

async function launchBrowser() {
  const { chromium } = await import('playwright');
  const args = chromeArgs();
  const trials = [{ channel: 'chrome', args }, { channel: 'chromium', args }, { args }];
  let lastErr;
  for (const opts of trials) {
    try {
      return await chromium.launch({ headless: true, ...opts });
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(
    'Could not launch Chrome or Chromium. Install Chrome, or run: npx playwright install chromium\n' +
      lastErr,
  );
}

/* ---------- 1. Modern Web Guidance (advice only) ---------- */
async function runLegacyScan() {
  const title = '1. Modern Web Guidance outdated-code scan (advice, does not fail)';
  const ran = await runCommand('npx', ['-y', 'modern-web-guidance@latest', 'legacy-scan', '.'], {
    timeoutMs: 240_000,
  });
  const out = (ran.stdout + '\n' + ran.stderr).trim();
  if (ran.code === 124) {
    section(title, out || 'The scan timed out and did not finish.', false);
    result.notes.push('Modern Web Guidance scan timed out. Treated as advice, not a failure.');
    return;
  }
  if (!out && ran.code !== 0) {
    section(title, `The scan did not run: ${ran.stderr || 'unknown error'}`, false);
    result.notes.push('Modern Web Guidance scan did not run. Treated as advice, not a failure.');
    return;
  }
  section(title, out || 'The scan finished with no output.', false);
}

/* ---------- 5. Google mail address guard ---------- */
function runGmailGuard() {
  const title = '5. Google mail address guard';
  const needle = 'gma' + 'il';
  let files;
  try {
    files = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT })
      .toString()
      .split('\0')
      .filter(Boolean);
  } catch (err) {
    const msg = `Could not list tracked files: ${err.message || err}`;
    section(title, msg, true);
    addFail(msg);
    return;
  }
  const hits = [];
  const lower = needle.toLowerCase();
  for (const f of files) {
    if (SKIP_GMAIL_PATH(f)) continue;
    let buf;
    try {
      buf = readFileSync(join(ROOT, f));
    } catch {
      continue;
    }
    if (isBinary(buf)) continue;
    const lines = buf.toString('utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      if (line.toLowerCase().includes(lower)) hits.push(`${f}:${i + 1}`);
    });
  }
  if (hits.length) {
    const body = [
      `FAIL: a Google mail address (or the word itself) appears in ${hits.length} tracked line(s):`,
      ...hits.map((h) => `  - ${h}`),
    ].join('\n');
    section(title, body, true);
    addFail(`Google mail address guard: ${hits.length} hit(s) in tracked files.`);
  } else {
    section(title, 'PASS: no Google mail address in tracked files (tooling files skipped).', false);
  }
}

/* ---------- URL helpers ---------- */
function siteHosts() {
  const hosts = new Set();
  try {
    const cname = readFileSync(join(ROOT, 'CNAME'), 'utf8').trim().toLowerCase();
    if (cname) {
      hosts.add(cname);
      if (!cname.startsWith('www.')) hosts.add('www.' + cname);
    }
  } catch { /* no CNAME is fine */ }
  return hosts;
}

function looksLikePath(raw) {
  const u = raw.trim();
  if (!u) return false;
  if (/^(https?:|\/|\.\/|\.\.\/)/i.test(u)) return true;
  return /\.(html|css|js|mjs|cjs|json|webmanifest|xml|svg|png|jpe?g|webp|gif|ico|avif|woff2?|ttf|otf|mp4|webm|mp3|txt|pdf|map)(\?|#|$)/i.test(u);
}

function isSkippable(raw) {
  const u = raw.trim();
  if (!u || u.startsWith('#') || u.startsWith('data:') || u.startsWith('blob:')) return true;
  if (/^(mailto:|tel:|sms:|javascript:)/i.test(u)) return true;
  return false;
}

function extractUrlsFromText(text) {
  const found = new Set();
  const add = (u) => {
    if (!u) return;
    const cleaned = u.trim().replace(/^['"]|['"]$/g, '').split(/\s+#/)[0].trim();
    if (cleaned) found.add(cleaned);
  };
  const attr = /(?:href|src|poster|action|data-motion|data-motion-evening|content)\s*=\s*(["'])(.*?)\1/gi;
  let m;
  while ((m = attr.exec(text))) add(m[2]);
  const urlFn = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
  while ((m = urlFn.exec(text))) add(m[2]);
  const srcset = /srcset\s*=\s*(["'])(.*?)\1/gi;
  while ((m = srcset.exec(text))) {
    for (const part of m[2].split(',')) add(part.trim().split(/\s+/)[0]);
  }
  return [...found];
}

function scanFilesForUrls() {
  const urlsByPage = new Map();
  const all = new Set();
  const pages = repoHtmlPages();
  const extra = readdirSync(ROOT).filter((name) => {
    if (!statSync(join(ROOT, name)).isFile()) return false;
    return /\.(css|js|webmanifest|json|xml|svg)$/i.test(name);
  });
  for (const name of [...pages, ...extra]) {
    let text;
    try {
      text = readFileSync(join(ROOT, name), 'utf8');
    } catch {
      continue;
    }
    const extracted = extractUrlsFromText(text);
    const list = [];
    const hosts = siteHosts();
    for (const u of extracted) {
      if (isSkippable(u) || !looksLikePath(u)) continue;
      let href = u;
      try {
        if (/^https?:/i.test(u)) {
          const parsed = new URL(u);
          if (hosts.has(parsed.hostname.toLowerCase())) {
            href = parsed.pathname + parsed.search;
          } else {
            continue; // a different site
          }
        }
      } catch {
        continue;
      }
      list.push(href);
      all.add(JSON.stringify({ from: name, href }));
    }
    if (pages.includes(name)) urlsByPage.set(name, list);
  }
  return { urlsByPage, refs: [...all].map((s) => JSON.parse(s)) };
}

function resolveToOrigin(fromFile, href, origin) {
  const base = new URL('/' + fromFile.split('\\').join('/'), origin);
  try {
    return new URL(href, base);
  } catch {
    return null;
  }
}

async function checkStatus(url) {
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: 'GET', redirect: 'follow' });
    }
    return res.status;
  } catch (err) {
    return `error: ${err.cause?.message || err.message || err}`;
  }
}

/* ---------- 2 + 4. axe, links, console, overflow ---------- */
async function runBrowserChecks(origin) {
  const { AxeBuilder } = await import('@axe-core/playwright');
  const pages = repoHtmlPages();
  if (!pages.length) {
    const msg = 'No root-level .html pages found to scan.';
    section('2. axe accessibility (390px and 1440px)', msg, true);
    section('4. Links, console, overflow', msg, true);
    addFail(msg);
    return;
  }

  const browser = await launchBrowser();
  const axeLines = [];
  let axeFailed = false;
  const consoleHits = [];
  const overflowHits = [];
  const broken = [];
  const seenAsset = new Set();

  const { refs } = scanFilesForUrls();
  for (const ref of refs) {
    const resolved = resolveToOrigin(ref.from, ref.href, origin);
    if (!resolved) continue;
    if (resolved.origin !== new URL(origin).origin) continue;
    const key = resolved.href;
    if (seenAsset.has(key)) continue;
    seenAsset.add(key);
    const status = await checkStatus(resolved.href);
    if (status !== 200) {
      broken.push(`${ref.from} -> ${ref.href}  (${status})`);
    }
  }

  try {
    for (const name of pages) {
      const url = origin + '/' + name;
      for (const viewport of [PHONE, DESKTOP]) {
        const context = await browser.newContext({
          viewport,
          reducedMotion: 'reduce',
        });
        const page = await context.newPage();
        const pageErrors = [];
        const failedResponses = [];
        page.on('pageerror', (err) => pageErrors.push(String(err)));
        page.on('console', (msg) => {
          if (msg.type() === 'error') pageErrors.push(msg.text());
        });
        page.on('response', (res) => {
          if (res.status() >= 400) failedResponses.push({ url: res.url(), status: res.status() });
        });
        const response = await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
        if (!response || response.status() !== 200) {
          broken.push(`${name}  (page status ${response ? response.status() : 'no response'})`);
        }
        await sleep(300);

        if (viewport.width === PHONE.width) {
          const overflow = await page.evaluate(() => {
            const doc = document.documentElement;
            const body = document.body;
            const sw = Math.max(doc.scrollWidth, body ? body.scrollWidth : 0);
            return { scrollWidth: sw, innerWidth: window.innerWidth };
          });
          if (overflow.scrollWidth > overflow.innerWidth + 1) {
            overflowHits.push(
              `${name} at 390px: scrollWidth ${overflow.scrollWidth}px > ${overflow.innerWidth}px`,
            );
          }
          const isFavicon = (u) => {
            try { return /\/favicon\.ico$/i.test(new URL(u).pathname); } catch { return false; }
          };
          // Browsers request /favicon.ico on their own when a page has no icon link.
          // Playwright often reports that as a console error without the filename.
          const realFailed = failedResponses.filter((f) => !isFavicon(f.url));
          for (const err of pageErrors) {
            const genericLoadFail = /Failed to load resource/i.test(err);
            if (genericLoadFail && realFailed.length === 0) continue;
            consoleHits.push(`${name}: ${err}`);
          }
          for (const f of realFailed) {
            consoleHits.push(`${name}: ${f.status} ${f.url}`);
          }
        }

        try {
          const axe = await new AxeBuilder({ page }).analyze();
          const violations = axe.violations || [];
          if (violations.length) {
            axeFailed = true;
            for (const v of violations) {
              const nodes = (v.nodes || []).slice(0, 5).map((n) => n.target?.join(' ') || '?');
              axeLines.push(
                `FAIL  ${name} @ ${viewport.width}px  ${v.id}: ${v.help} (${v.impact || 'unknown'})`,
              );
              for (const n of nodes) axeLines.push(`      ${n}`);
            }
          } else {
            axeLines.push(`PASS  ${name} @ ${viewport.width}px  0 violations`);
          }
        } catch (err) {
          axeFailed = true;
          axeLines.push(`FAIL  ${name} @ ${viewport.width}px  axe did not run: ${err.message || err}`);
        }

        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const axeBody = axeLines.join('\n') || 'No pages scanned.';
  section('2. axe accessibility (390px and 1440px)', axeBody, axeFailed);
  if (axeFailed) addFail('axe reported one or more violations (or failed to run).');

  const linkLines = [];
  let linksFailed = false;
  if (broken.length) {
    linksFailed = true;
    linkLines.push(`FAIL: ${broken.length} internal link(s) or asset(s) did not return 200:`);
    for (const b of broken) linkLines.push(`  - ${b}`);
  } else {
    linkLines.push(`PASS: every checked internal link and asset returned 200 (${seenAsset.size} URLs).`);
  }
  if (consoleHits.length) {
    linksFailed = true;
    linkLines.push(`FAIL: ${consoleHits.length} console error(s):`);
    for (const c of consoleHits) linkLines.push(`  - ${c}`);
  } else {
    linkLines.push('PASS: no console errors on root pages at 390px.');
  }
  if (overflowHits.length) {
    linksFailed = true;
    linkLines.push('FAIL: horizontal overflow at 390px:');
    for (const o of overflowHits) linkLines.push(`  - ${o}`);
  } else {
    linkLines.push('PASS: no horizontal overflow at 390px.');
  }
  section('4. Links, console, overflow', linkLines.join('\n'), linksFailed);
  if (linksFailed) addFail('Link, console, or overflow check failed.');
}

/* ---------- 3. Lighthouse (home, mobile) ---------- */
async function runLighthouse(origin) {
  const title = '3. Lighthouse (home page, mobile)';
  let lighthouse;
  let chromeLauncher;
  try {
    lighthouse = (await import('lighthouse')).default;
    chromeLauncher = await import('chrome-launcher');
  } catch (err) {
    const msg = `Lighthouse did not load: ${err.message || err}`;
    section(title, msg, true);
    addFail(msg);
    return;
  }

  const flags = ['--headless=new', '--disable-gpu', '--disable-dev-shm-usage'];
  if (process.platform === 'linux') flags.push('--no-sandbox');

  let chrome;
  try {
    chrome = await chromeLauncher.launch({ chromeFlags: flags });
    const outcome = await lighthouse(`${origin}/`, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      formFactor: 'mobile',
      screenEmulation: {
        mobile: true,
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        disabled: false,
      },
    });
    const lhr = outcome.lhr || outcome;
    const score = (id) => {
      const n = lhr.categories?.[id]?.score;
      return typeof n === 'number' ? Math.round(n * 100) : 'n/a';
    };
    const metric = (id) => {
      const a = lhr.audits?.[id];
      if (!a) return 'n/a';
      return a.displayValue || (a.numericValue != null ? String(a.numericValue) : 'n/a');
    };
    const a11y = score('accessibility');
    const lines = [
      `Performance:     ${score('performance')}`,
      `Accessibility:   ${a11y}`,
      `Best Practices:  ${score('best-practices')}`,
      `SEO:             ${score('seo')}`,
      `Core Web Vitals / lab metrics:`,
      `  First Contentful Paint (FCP):        ${metric('first-contentful-paint')}`,
      `  Largest Contentful Paint (LCP):      ${metric('largest-contentful-paint')}`,
      `  Total Blocking Time (TBT):           ${metric('total-blocking-time')}`,
      `  Cumulative Layout Shift (CLS):       ${metric('cumulative-layout-shift')}`,
      `  Speed Index:                         ${metric('speed-index')}`,
    ];
    const a11yNum = typeof a11y === 'number' ? a11y : 0;
    const failed = a11yNum < A11Y_FAIL_BELOW;
    if (failed) {
      lines.push(`FAIL: accessibility score ${a11y} is under ${A11Y_FAIL_BELOW}.`);
      addFail(`Lighthouse accessibility score ${a11y} is under ${A11Y_FAIL_BELOW}.`);
    } else {
      lines.push(`Accessibility score is ${a11y} (fails only if under ${A11Y_FAIL_BELOW}). Other scores are reported, not failed.`);
    }
    section(title, lines.join('\n'), failed);
  } catch (err) {
    const msg = `Lighthouse did not run: ${err.message || err}`;
    section(title, msg, true);
    addFail(msg);
  } finally {
    if (chrome) {
      try { await chrome.kill(); } catch { /* ignore */ }
    }
  }
}

function printSummary() {
  result.sections.sort((a, b) => a.title.localeCompare(b.title, 'en', { numeric: true }));
  const failed = result.fails.length > 0;
  const lines = [];
  lines.push('======= SITE CHECK SUMMARY =======');
  lines.push(`Repo:    ${ROOT}`);
  lines.push(`Command: npm run check    (or ./tools/check.sh)`);
  lines.push(`When:    ${stamp}`);
  lines.push('Pages:   root-level .html only (archive/ and prototypes/ are skipped).');
  lines.push('');
  for (const s of result.sections) {
    lines.push(s.title);
    lines.push(s.failed ? 'Result: FAIL' : 'Result: recorded');
    lines.push(s.body);
    lines.push('');
  }
  if (result.notes.length) {
    lines.push('Notes');
    for (const n of result.notes) lines.push(`  - ${n}`);
    lines.push('');
  }
  if (failed) {
    lines.push(`RESULT: FAIL (${result.fails.length} failing part(s))`);
    for (const f of result.fails) lines.push(`  - ${f}`);
  } else {
    lines.push('RESULT: PASS');
  }
  lines.push('Paste this block into the pull request.');
  lines.push('======= END SITE CHECK SUMMARY =======');
  const text = lines.join('\n');
  console.log('\n' + text + '\n');
  return failed ? 1 : 0;
}

async function main() {
  process.chdir(ROOT);
  console.log(`Site check starting in ${ROOT}`);
  console.log('This can take a few minutes the first time (Lighthouse and the guidance scan).');

  // Guard needs no server and is cheap; run it first so a clear failure is always reported.
  runGmailGuard();

  let server;
  let port;
  try {
    await runLegacyScan();
    port = await freePort();
    server = await startServer(port);
    const origin = `http://127.0.0.1:${port}`;
    console.log(`Local server: ${origin}`);
    await runBrowserChecks(origin);
    await runLighthouse(origin);
  } catch (err) {
    const msg = String(err.message || err);
    section('Runner', msg, true);
    addFail(msg);
  } finally {
    if (server) {
      server.kill('SIGTERM');
    }
  }

  const code = printSummary();
  process.exit(code);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
