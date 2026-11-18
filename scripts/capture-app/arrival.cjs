const puppeteer = require('puppeteer-core')
;(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', '--mute-audio'] })
  const p = await b.newPage()
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true })
  await p.evaluateOnNewDocument(() => { if (!sessionStorage.getItem('fresh')) { localStorage.clear(); sessionStorage.setItem('fresh', '1') } })
  // start recording as soon as the page exists, so the boat's approach is in it
  const nav = p.goto('http://localhost:8120/', { waitUntil: 'networkidle0', timeout: 120000 })
  await nav
  const rec = await p.screencast({ path: 'd15/arrival.webm', ffmpegPath: process.env.FFMPEG })
  await new Promise((r) => setTimeout(r, 18000))
  await rec.stop()
  console.log(JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('video')].map((v) => [Math.round(v.currentTime*10)/10, v.ended]))))
  await p.screenshot({ path: 'd15/arrival.png' }); await b.close()
})().catch((e) => { console.error(e.message); process.exit(1) })
