// Urge Walk home: ends the opening early. Progressive enhancement: the CSS timeline ends the opening by itself
// at 3.6 s, and without JavaScript the opening never starts. Tap anywhere, Esc, a new hash or the Help pill skips it.
(() => {
  const root = document.documentElement
  const stage = document.getElementById('stage')
  if (!stage) return
  const end = () => root.classList.remove('opening')
  stage.addEventListener('animationend', (e) => { if (e.target === stage) end() })
  stage.addEventListener('pointerdown', end)
  addEventListener('keydown', (e) => { if (e.key === 'Escape') end() })
  addEventListener('hashchange', end)
  document.querySelectorAll('.help').forEach((a) => a.addEventListener('click', end))
})()

// Every page: the browser bar follows the paper (day #e9e1cf, evening #27221b, the app's evening page) when the light changes.
;(() => {
  const root = document.documentElement
  const meta = document.querySelector('meta[name=theme-color]')
  if (!meta) return
  const paint = () => meta.setAttribute('content', root.dataset.light === 'evening' ? '#27221b' : '#e9e1cf')
  paint()
  new MutationObserver(paint).observe(root, { attributes: true, attributeFilter: ['data-light'] })
})()

// Home, Plate I: the Sheltered Coast moves as it does in the app (the app's own loop, day and evening). The poster is the
// figure's still, always painted first; the loop loads only after the opening ends and the page is idle, and never under
// Reduce Motion or Save-Data, or without JavaScript. It follows the light switch.
;(() => {
  const root = document.documentElement
  const v = document.querySelector('.plate.p1 video.loop')
  if (!v) return
  const c = navigator.connection || {}
  if (c.saveData || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const load = () => {
    const f = 'assets/motion/plate-coast' + (root.dataset.light === 'evening' ? '-evening' : '') + '.mp4'
    if (v.getAttribute('src') === f) return
    v.classList.remove('on')
    v.src = f
    v.play().catch(() => {})
  }
  v.addEventListener('playing', () => v.classList.add('on'))
  const idle = () => {
    const go = () => { load(); new MutationObserver(load).observe(root, { attributes: true, attributeFilter: ['data-light'] }) }
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 2500 })
    else setTimeout(go, 1200)
  }
  const afterOpening = () => {
    if (!root.classList.contains('opening')) return idle()
    new MutationObserver((m, o) => { if (!root.classList.contains('opening')) { o.disconnect(); idle() } }).observe(root, { attributes: true, attributeFilter: ['class'] })
  }
  if (document.readyState === 'complete') afterOpening()
  else addEventListener('load', afterOpening)
})()
