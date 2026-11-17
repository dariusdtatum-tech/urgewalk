// Every picture on every page follows the Daylight / Evening switch (Nov 16, 2026).
// Founder, Nov 16: "doesn't cycle when you click daylight/evening". For each page, at phone and desktop width:
// start in daylight, note every place background (what the section really paints) and every phone (the still
// you can see and the recording it plays), click Evening, and check that each one changed to its evening
// version; then click Daylight and check that each came back.
//   node scripts/check-light-switch.cjs [base url, default http://localhost:8094/]   (needs puppeteer-core)
const puppeteer = require('puppeteer-core')
const BASE = process.argv[2] || 'http://localhost:8094/'
const PAGES = ['index.html', 'walk.html', 'breathe.html', 'ground.html', 'ride.html', 'helpers.html', 'premium.html', 'privacy.html', 'support.html', 'terms.html']
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const snap = (page) => page.evaluate(() => {
  const out = {}
  document.querySelectorAll('[data-place]').forEach((el, i) => {
    const bg = el.querySelector(':scope > .place-bg') || el
    const img = getComputedStyle(bg).backgroundImage
    const vid = el.querySelector(':scope > .place-bg video, :scope > .place-bg .place-motion')
    if (img && img !== 'none') out[`bg ${el.dataset.place} #${i}`] = img.replace(/^.*\/(assets\/[^"')]+).*$/, '$1')
    if (vid && vid.dataset.src) out[`loop ${el.dataset.place} #${i}`] = vid.dataset.src
  })
  // windows (Nov 17): the picture each window shows
  document.querySelectorAll('.window').forEach((w, i) => {
    const im = [...w.querySelectorAll('img')].find((x) => getComputedStyle(x.parentNode).display !== 'none')
    if (im && getComputedStyle(w.closest('.stops')).display !== 'none') out[`window #${i}`] = im.getAttribute('src')
  })
  document.querySelectorAll('.phone').forEach((f, i) => {
    const shown = [...f.querySelectorAll('img')].find((im) => getComputedStyle(im).display !== 'none')
    out[`phone ${i} still`] = shown ? shown.getAttribute('src') : null
    const v = f.querySelector('video'); if (v) out[`phone ${i} plays`] = v.dataset.src
  })
  return out
})
;(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] })
  let bad = 0, checked = 0
  for (const [w, h] of [[390, 844], [1440, 900]]) for (const p of PAGES) {
    const page = await b.newPage(); await page.setViewport({ width: w, height: h, isMobile: w < 800, hasTouch: w < 800 })
    await page.evaluateOnNewDocument(() => localStorage.setItem('urgewalk.light', 'day'))
    await page.goto(BASE + p, { waitUntil: 'load' })
    // visit each phone so its recording starts, then come back up
    const n = await page.$$eval('.phone', (f) => f.length)
    for (let i = 0; i < n; i++) { await page.$$eval('.phone', (f, i) => f[i].scrollIntoView({ block: 'center' }), i); await sleep(900) }
    const day = await snap(page)
    await page.click('button[data-light="evening"]'); await sleep(1200)
    const eve = await snap(page)
    await page.click('button[data-light="day"]'); await sleep(1200)
    const back = await snap(page)
    for (const k of Object.keys(day)) {
      checked++
      const d = day[k], e = eve[k], r = back[k]
      const eveningOk = e && e !== d && /evening/.test(e) && !/evening/.test(d || '')
      const single = /arrival/.test(d || '') // the app's arrival has one version, by design
      if (!single && (!eveningOk || r !== d)) { bad++; console.log(`FAIL ${w} ${p} ${k}: day ${d} | evening ${e} | back ${r}`) }
    }
    await page.close()
  }
  await b.close()
  console.log(`${checked} pictures checked, ${bad} did not follow the switch`)
  process.exit(bad ? 1 : 0)
})().catch((e) => { console.error(e.message); process.exit(1) })
