// Urge Walk — the island site. Progressive enhancement only: every page reads and works without this.
// 1. The walk: on the landing page the place crossing the middle of the screen is "here"; its photograph
//    fades in behind the page (CSS, html.walk). Skipped under Reduce Motion.
// 2. The trail index marks where you are.
// 3. The breath: any [data-breath] block becomes a one-minute paced breath (timings from tools.json).
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const places = [...document.querySelectorAll('.place[id]')]
  const trail = [...document.querySelectorAll('.trail a')]

  if (places.length) {
    if (!reduce && 'IntersectionObserver' in window) document.documentElement.classList.add('walk')
    const mark = (el) => {
      places.forEach((p) => p.classList.toggle('here', p === el))
      trail.forEach((a) => a.setAttribute('aria-current', a.hash === '#' + el.id ? 'true' : 'false'))
    }
    mark(places[0])
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) mark(e.target) })
      }, { rootMargin: '-50% 0px -50% 0px' })
      places.forEach((p) => io.observe(p))
      // Past the last place (the night section), keep the last place marked.
    }
  }

  // The header gains a solid backing once the page moves, so words never slide under clear glass.
  const head = document.querySelector('.site-head:not(.solid)')
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
    start.addEventListener('click', () => {
      if (done) done.hidden = true
      start.disabled = true; if (stop) stop.disabled = false
      step(0)
    })
    if (stop) stop.addEventListener('click', () => end(false))
  })
})()
