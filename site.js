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
    // "Here" is the last place whose top has crossed the middle of the screen, worked out from the scroll
    // position, so a jump, a link or a reload mid-page lands on the right place; past the last place (the
    // night) the Cottage stays.
    let frame = 0
    const locate = () => {
      frame = 0
      const mid = innerHeight / 2
      let here = places[0]
      for (const p of places) { if (p.getBoundingClientRect().top <= mid) here = p; else break }
      if (here !== current || !here.classList.contains('here')) mark(here)
    }
    locate()
    addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(locate) }, { passive: true })
    addEventListener('resize', locate)
    if (!('IntersectionObserver' in window)) places.forEach((p) => p.classList.add('seen'))
  } else setDeep()

  // The browser bar takes the page's own night (its place's deep shade in the current light).
  const themeMeta = document.querySelector('meta[name=theme-color]')
  const paintBar = () => { const d = getComputedStyle(document.body).getPropertyValue('--deep').trim(); if (themeMeta && d) themeMeta.setAttribute('content', d) }
  paintBar(); buttons.forEach((b) => b.addEventListener('click', paintBar))

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

  // ---------- Walk on the web (round 1, Nov 9) ----------
  // Kept by the wall clock, so a locked screen or a background tab never loses time (as in the app).
  // Asks the browser to keep the screen on while walking (Wake Lock), where it can. Nothing is saved or sent.
  const walk = document.querySelector('[data-walk]')
  if (walk) {
    const lines = JSON.parse(walk.dataset.lines || '[]')
    const steps = Object.fromEntries([...walk.querySelectorAll('[data-step]')].map((s) => [s.dataset.step, s]))
    const $ = (sel) => walk.querySelector(sel)
    const timeEl = $('.walk-time'), underEl = $('.walk-under'), lineEl = $('.walk-line'), kindEl = $('.walk-kind')
    const pauseBtn = $('[data-walk-pause]')
    let minutes = 10, started = 0, pausedAt = 0, pausedTotal = 0, tick = 0, lineAt = -1, lock = null
    const show = (name) => Object.entries(steps).forEach(([k, s]) => { s.hidden = k !== name })
    walk.querySelectorAll('.lengths button').forEach((b) => b.addEventListener('click', () => {
      minutes = +b.dataset.min
      walk.querySelectorAll('.lengths button').forEach((o) => o.setAttribute('aria-checked', String(o === b)))
    }))
    const keepAwake = async () => { try { lock = await navigator.wakeLock?.request('screen') } catch { lock = null } }
    const letSleep = () => { try { lock?.release() } catch { /* fine */ } lock = null }
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && started && !pausedAt) keepAwake() })
    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
    const elapsed = () => ((pausedAt || Date.now()) - started - pausedTotal) / 1000
    const setLine = (i) => {
      if (!lines.length || i === lineAt) return
      lineAt = i
      lineEl.classList.add('fading')
      setTimeout(() => { lineEl.textContent = lines[i % lines.length]; lineEl.classList.remove('fading') }, reduce ? 0 : 300)
    }
    const render = () => {
      const e = elapsed()
      if (minutes) {
        const left = Math.max(0, minutes * 60 - e)
        timeEl.textContent = fmt(left)
        if (left <= 0) { finish(); return }
      } else timeEl.textContent = fmt(e)
      setLine(Math.floor(e / 120))
    }
    const start = () => {
      started = Date.now(); pausedAt = 0; pausedTotal = 0; lineAt = -1
      kindEl.textContent = minutes ? `${minutes} minute walk` : 'Open walk'
      underEl.textContent = minutes ? 'left in your walk' : 'walking'
      pauseBtn.textContent = 'Pause'
      show('run'); render(); tick = setInterval(render, 500); keepAwake()
    }
    const finish = () => {
      clearInterval(tick); letSleep()
      const m = Math.max(1, Math.round(elapsed() / 60))
      $('.walk-summary').textContent = `You walked for ${m} minute${m === 1 ? '' : 's'}. However you feel right now, this time is yours.`
      walk.querySelectorAll('[data-outcome]').forEach((b) => b.setAttribute('aria-pressed', 'false'))
      $('.walk-reply').hidden = true; $('.walk-help').hidden = true
      started = 0; show('done'); $('#done-h').focus({ preventScroll: true })
    }
    $('[data-walk-start]').addEventListener('click', start)
    $('[data-walk-finish]').addEventListener('click', finish)
    $('[data-walk-again]').addEventListener('click', () => show('set'))
    pauseBtn.addEventListener('click', () => {
      if (pausedAt) { pausedTotal += Date.now() - pausedAt; pausedAt = 0; pauseBtn.textContent = 'Pause'; keepAwake() }
      else { pausedAt = Date.now(); pauseBtn.textContent = 'Resume'; letSleep() }
      render()
    })
    const replies = { passed: 'Nice work. You rode it out.', eased: 'Every bit of distance helps. Glad you walked.', stayed: 'Thanks for walking anyway. Showing up is the hard part.' }
    walk.querySelectorAll('[data-outcome]').forEach((b) => b.addEventListener('click', () => {
      walk.querySelectorAll('[data-outcome]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)))
      const r = $('.walk-reply'); r.textContent = replies[b.dataset.outcome]; r.hidden = false
      $('.walk-help').hidden = b.dataset.outcome !== 'stayed'
    }))
  }

  // ---------- Ride it out on every page (round 2, Nov 9) ----------
  const ride = document.getElementById('ride')
  if (ride && typeof ride.showModal === 'function') {
    const opener = document.querySelector('[data-ride-open]')
    const close = () => { ride.close() }
    opener.addEventListener('click', () => { ride.showModal(); root.classList.add('ride-open') })
    ride.addEventListener('close', () => { root.classList.remove('ride-open'); opener.focus({ preventScroll: true }) })
    ride.querySelector('[data-ride-close]').addEventListener('click', close)
    ride.addEventListener('click', (e) => { if (e.target === ride) close() }) // a tap outside the sheet closes it
  } else if (ride) {
    // Very old browsers: the button simply goes to Breathe.
    document.querySelector('[data-ride-open]').addEventListener('click', () => { location.href = 'breathe.html' })
  }

  // ---------- Keep it on your phone (round 3, Nov 9) ----------
  // The site installs like an app (manifest + service worker); Walk, Breathe and Ground work offline.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) navigator.serviceWorker.register('sw.js').catch(() => {})
  const keep = document.getElementById('keep')
  if (keep) {
    const q = (s) => keep.querySelector(s)
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const showOnly = (sel) => ['[data-install]', '.keep-ios', '.keep-other', '.keep-done'].forEach((s) => { q(s).hidden = s !== sel })
    if (standalone) showOnly('.keep-done')
    else if (ios) showOnly('.keep-ios')
    let deferred = null
    addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; if (!standalone && !ios) showOnly('[data-install]') })
    q('[data-install]').addEventListener('click', async () => {
      if (!deferred) return
      deferred.prompt()
      const choice = await deferred.userChoice.catch(() => null)
      deferred = null
      showOnly(choice && choice.outcome === 'accepted' ? '.keep-done' : '.keep-other')
    })
    addEventListener('appinstalled', () => showOnly('.keep-done'))
  }

  // ---------- The island as a map (round 4, Nov 9) ----------
  // The walk's route draws itself in the current place's colour as you scroll; the place you are in is
  // marked, the ones behind you are lit. On phones the same progress runs as a thin line along the top.
  const isle = document.querySelector('.isle-svg')
  const bar = document.querySelector('.walk-progress span')
  if (places.length && (isle || bar)) {
    const walked = isle && isle.querySelector('.isle-walked')
    const stops = isle ? [...isle.querySelectorAll('.isle-stop')] : []
    const hereEl = document.querySelector('.isle-here')
    // How far along the route each stop lies (0..100), found once by sampling the drawn path.
    let at = places.map((_, i) => (100 * i) / (places.length - 1))
    if (walked && walked.getTotalLength) {
      const L = walked.getTotalLength(), samples = []
      for (let s = 0; s <= 400; s++) { const pt = walked.getPointAtLength((L * s) / 400); samples.push([pt.x, pt.y]) }
      at = stops.map((stop) => {
        const c = stop.querySelector('.isle-dot'), x = +c.getAttribute('cx'), y = +c.getAttribute('cy')
        let best = 0, bd = Infinity
        samples.forEach(([sx, sy], s) => { const d = (sx - x) ** 2 + (sy - y) ** 2; if (d < bd) { bd = d; best = s } })
        return best / 4
      })
    }
    const names = places.map((p) => (stops.find((s) => s.dataset.stop === p.id)?.getAttribute('aria-label')) || p.id)
    let shownHere = -1, frame2 = 0
    const draw = () => {
      frame2 = 0
      const mid = innerHeight / 2
      let i = 0
      for (let k = 0; k < places.length; k++) if (places[k].getBoundingClientRect().top <= mid) i = k
      const r = places[i].getBoundingClientRect()
      const frac = Math.min(1, Math.max(0, (mid - r.top) / r.height))
      const last = places.length - 1
      const pastEnd = places[last].getBoundingClientRect().bottom < mid
      const v = pastEnd ? 100 : (i < last ? at[i] + frac * (at[i + 1] - at[i]) : at[last] + frac * (100 - at[last]))
      if (walked) walked.style.strokeDashoffset = String(100 - v)
      if (bar) bar.style.transform = `scaleX(${(v / 100).toFixed(4)})`
      if (i !== shownHere) {
        shownHere = i
        stops.forEach((s, k) => { s.classList.toggle('here', k === i); s.classList.toggle('visited', k <= i) })
        if (hereEl) hereEl.textContent = names[i]
      }
    }
    draw()
    addEventListener('scroll', () => { if (!frame2) frame2 = requestAnimationFrame(draw) }, { passive: true })
    addEventListener('resize', draw)
  }

  // ---------- The night as a next step (round 5, Nov 9) ----------
  // "Send it to someone": the phone's own share sheet, or the link copied. Nothing is tracked.
  document.querySelectorAll('[data-share]').forEach((a) => a.addEventListener('click', async (e) => {
    e.preventDefault()
    const note = a.querySelector('[data-share-note]')
    const data = { title: 'Urge Walk', text: 'A calm way to ride out an urge: take a walk, breathe for a minute, or come back to your senses.', url: 'https://urgewalk.app/' }
    try {
      if (navigator.share) { await navigator.share(data); return }
      await navigator.clipboard.writeText(data.url)
      if (note) note.textContent = 'Link copied: urgewalk.app. Paste it in a message.'
    } catch (err) {
      if (err && err.name === 'AbortError') return
      if (note) note.textContent = 'Share this address: urgewalk.app'
    }
  }))
})()
