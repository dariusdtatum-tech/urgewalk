// Urge Walk — the island site (elegance pass, Nov 8 2026). Progressive enhancement: every page reads and
// works without this file.
// 1. Island light: the island follows the visitor's time of day (daylight 6:00–17:59, evening otherwise), as the
//    app does; the Daylight · Evening switch overrides it (remembered on this device only). The inline script in
//    each page's <head> sets html[data-light] before the stylesheet paints, so only one set of photographs loads.
// 2. The walk: the place crossing the middle of the screen is "here"; its photograph fades in behind the page
//    and its words rise once. Skipped under Reduce Motion.
// 3. The header takes the current place's deep shade once the page moves.
// 4. The breath: any [data-breath] block becomes a paced minute (timings from tools.json).
(() => {
  const root = document.documentElement
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---------- Island light ----------
  const buttons = [...document.querySelectorAll('.light-switch button')]
  const show = (light) => {
    root.dataset.light = light
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.light === light)))
  }
  show(root.dataset.light === 'evening' ? 'evening' : 'day')
  buttons.forEach((b) => b.addEventListener('click', () => {
    show(b.dataset.light)
    try { localStorage.setItem('urgewalk.light', b.dataset.light) } catch { /* private mode: fine */ }
    setDeep()
  }))

  // ---------- the walk ----------
  const places = [...document.querySelectorAll('.place[id]')]
  const trail = [...document.querySelectorAll('.trail a')]
  let current = places[0] || document.querySelector('.band, .tool')
  function setDeep() {
    if (!current) return
    const d = getComputedStyle(current).getPropertyValue('--deep').trim()
    if (d) root.style.setProperty('--cur-deep', d)
  }
  if (places.length) {
    if (!reduce && 'IntersectionObserver' in window) root.classList.add('walk')
    const mark = (el) => {
      current = el
      places.forEach((p) => p.classList.toggle('here', p === el))
      el.classList.add('seen')
      trail.forEach((a) => a.setAttribute('aria-current', a.hash === '#' + el.id ? 'true' : 'false'))
      setDeep()
    }
    mark(places[0])
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) mark(e.target) }),
        { rootMargin: '-50% 0px -50% 0px' })
      places.forEach((p) => io.observe(p))
    } else places.forEach((p) => p.classList.add('seen'))
  } else setDeep()

  // ---------- header ----------
  const head = document.querySelector('.site-head')
  if (head) { const f = () => head.classList.toggle('scrolled', scrollY > 24); addEventListener('scroll', f, { passive: true }); f() }

  // ---------- the breath ----------
  let P = [['in', 'Breathe in', 4000], ['hold', 'Hold', 3000], ['out', 'Breathe out', 6000]]
  let N = 5
  if (location.protocol !== 'file:') {
    fetch('tools.json').then((r) => (r.ok ? r.json() : null)).then((j) => {
      const b = j && j.breathe
      if (b && [b.inhale, b.hold, b.exhale, b.cycles].every((v) => Number.isFinite(v) && v > 0)) {
        P = [['in', 'Breathe in', b.inhale * 1000], ['hold', 'Hold', b.hold * 1000], ['out', 'Breathe out', b.exhale * 1000]]
        N = b.cycles
      }
    }).catch(() => {})
  }
  document.querySelectorAll('[data-breath]').forEach((box) => {
    const dot = box.querySelector('.breath-dot'), word = box.querySelector('.breath-word')
    const start = box.querySelector('[data-start]'), stop = box.querySelector('[data-stop]')
    const done = document.getElementById(box.dataset.done || '')
    let t = 0
    const end = (finished) => {
      clearTimeout(t)
      dot.style.transitionDuration = '1500ms'; dot.dataset.phase = ''
      word.textContent = finished ? 'Well done' : 'Ready when you are'
      start.disabled = false; start.textContent = finished ? 'Again' : 'Start'
      if (stop) stop.disabled = true
      if (done) done.hidden = !finished
    }
    const step = (i) => {
      if (i >= N * 3) { end(true); return }
      const [phase, text, ms] = P[i % 3]
      dot.style.transitionDuration = ms + 'ms'; dot.dataset.phase = phase; word.textContent = text
      t = setTimeout(() => step(i + 1), ms)
    }
    start.addEventListener('click', () => { if (done) done.hidden = true; start.disabled = true; if (stop) stop.disabled = false; step(0) })
    if (stop) stop.addEventListener('click', () => end(false))
  })
})()
