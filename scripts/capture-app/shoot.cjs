const puppeteer = require('puppeteer-core')
const DAY = 864e5, now = Date.parse('2026-11-15T15:00:00Z')
const iso = (ms) => new Date(ms).toISOString()
const walks = []
const kinds = ['walk','breathe','walk','ground','walk','logged','walk','breathe','walk','walk','ground','walk','breathe','walk']
const res = ['yes','yes','kinda','yes','yes','yes','kinda','yes','yes','no','yes','yes','kinda','yes']
kinds.forEach((k, i) => { const s = now - (i * 1.6 + .4) * DAY; const secs = k === 'walk' ? 600 + (i % 3) * 300 : k === 'logged' ? 0 : 60
  walks.push({ id: 'w' + i, kind: k, startedAt: iso(s), endedAt: iso(s + secs * 1000), mode: k === 'walk' ? 'timed' : 'open', plannedMinutes: k === 'walk' ? 10 : null, actualSeconds: secs, endedEarly: false, result: res[i], note: '' }) })
const journal = { version: 1, entries: [
  { id: 'e1', createdAt: iso(now - 0.3 * DAY), updatedAt: iso(now - 0.3 * DAY), title: 'The evening I stayed', body: 'I came here without a plan and the urge passed anyway.' },
  { id: 'e2', createdAt: iso(now - 2.2 * DAY), updatedAt: iso(now - 2.2 * DAY), title: 'Ten minutes to the water', body: 'Walked to the end of the road. Felt lighter by the turn.' },
  { id: 'e3', createdAt: iso(now - 5 * DAY), updatedAt: iso(now - 5 * DAY), title: 'A quieter Tuesday', body: 'Nothing big. Wrote it down so I remember days like this.' } ] }
const store = {
  'urgewalk.v1.profile': JSON.stringify({ version: 1, onboardedAt: '2026-09-20T12:00:00.000Z', skipped: false, adultConfirmed: true }),
  'urgewalk.v1.habits': JSON.stringify({ habits: [{ id: 'h1', name: 'Drinking', startDate: '2026-09-20' }] }),
  'urgewalk.v1.scenePrefs': JSON.stringify({ still: false, soundIn: { walk: false, breathe: false, ground: false }, soundId: 'paired', timer: 20 }),
  'urgewalk.v1.followUpPrefs': JSON.stringify({ enabled: false }),
  'urgewalk.v1.islandLight': JSON.stringify({ light: process.env.LIGHT || 'day' }),
  'urgewalk.v1.walks': JSON.stringify({ version: 1, walks }),
  'urgewalk.v1.journal': JSON.stringify(journal),
  'urgewalk.v1.milestones': JSON.stringify({ version: 1, trackers: { h1: { earned: { 7: '2026-09-27', 30: '2026-10-20' }, seen: [7, 30] } } }),
}
const SCENES = { home: [], explore: ['clearing-explore'], ride: ['ride-button'], walk: ['ride-button', 'ride-walk'], breathe: ['ride-button', 'ride-breathe'],
  ground: ['ride-button', 'ride-ground'], cove: ['clearing-explore', 'explore-shore'], journal: ['home-journal'], history: ['home-history'], historyopen: ['home-history', 'history-tray-lower'], you: ['home-top-you'] }
const VIDEO = process.argv.includes('--video')
const only = process.argv.slice(2).filter((a) => a !== '--video')
;(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] })
  for (const [name, steps] of Object.entries(SCENES)) {
    if (only.length && !only.includes(name)) continue
    const page = await browser.newPage()
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true })
    await page.evaluateOnNewDocument((s) => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); for (const k in s) localStorage.setItem(k, s[k]); sessionStorage.setItem('seeded', '1') } }, store)
    await page.goto('http://localhost:8120/', { waitUntil: 'networkidle0', timeout: 120000 })
    await new Promise((r) => setTimeout(r, 2500))
    for (const id of steps) {
      const el = await page.waitForSelector(`[data-testid="${id}"]`, { timeout: 15000 })
      await el.click(); await new Promise((r) => setTimeout(r, 1800))
    }
    await new Promise((r) => setTimeout(r, name === 'walk' || name === 'breathe' ? 3500 : 1500))
    await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); window.scrollTo(0, 0); document.querySelectorAll('*').forEach((e) => { if (e.scrollTop && e.scrollHeight - e.clientHeight < 80) e.scrollTop = 0 }) }); await new Promise((r) => setTimeout(r, 600))
    await page.screenshot({ path: `${process.env.OUT||'.'}/${name}.png` })
    if (VIDEO) { const rec = await page.screencast({ path: `${process.env.OUT||'.'}/${name}.webm`, ffmpegPath: process.env.FFMPEG }); await new Promise((r) => setTimeout(r, 16000)); await rec.stop() }
    console.log('shot', name)
    await page.close()
  }
  await browser.close()
})().catch((e) => { console.error(e.message); process.exit(1) })
