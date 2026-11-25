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

// Home: the book (25 Nov 2026). Progressive enhancement over a plain vertical page: the pages sit in a horizontal
// scroll-snap container (CSS, html.js), and this script adds the page-turn bar and folio, the contents' jumps and the
// hash (every page has one; the back button turns back), keys, a vertical wheel that turns one spread at a time (a
// horizontal swipe or trackpad scroll is left to the browser), the light arriving pages, and the plates' loops: only the
// page in view plays, posters always first, none under Reduce Motion or Save-Data.
;(() => {
  const root = document.documentElement
  const book = document.getElementById('leaves')
  if (!book) return
  const reduceQ = matchMedia('(prefers-reduced-motion: reduce)')
  const wideQ = matchMedia('(min-width: 900px)')
  const turnBar = document.getElementById('turn')
  const prevB = turnBar.querySelector('[data-turn="-1"]'), nextB = turnBar.querySelector('[data-turn="1"]')
  const folioBtn = document.getElementById('folio'), folioVh = turnBar.querySelector('.vh[role=status]'), folioFol = turnBar.querySelector('.fol')
  turnBar.hidden = false

  const roman = (n) => { let s = ''; for (const [v, r] of [[10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']]) while (n >= v) { s += r; n -= v } return s }

  // ---------- the stops: what one turn lands on (a spread on wide screens, a leaf on phones) ----------
  let stops = []
  const collect = () => {
    const wide = wideQ.matches
    stops = [...book.children].flatMap((el) => (el.classList.contains('pair') && !wide ? [...el.children] : [el]))
  }
  collect()
  const left = (el) => el.getBoundingClientRect().left - book.getBoundingClientRect().left + book.scrollLeft
  const stopId = (el) => el.id || (el.firstElementChild && el.firstElementChild.id) || ''
  const nearest = () => {
    let best = 0, d = Infinity
    stops.forEach((s, i) => { const x = Math.abs(left(s) - book.scrollLeft); if (x < d) { d = x; best = i } })
    return best
  }
  const stopFor = (el) => stops.findIndex((s) => s === el || s.contains(el))

  let cur = 0, quiet = true // quiet: no hash push (programmatic landings, the first paint)
  const paintFolio = () => {
    const n = stops.length
    folioVh.textContent = 'Page ' + (cur + 1) + ' of ' + n
    // the name begins with the visible text (WCAG 2.5.3, axe label-content-name-mismatch)
    folioBtn.setAttribute('aria-label', (cur + 1) + ' / ' + n + ', go to page')
    folioFol.textContent = (cur + 1) + ' / ' + n
    turnBar.style.setProperty('--p', n > 1 ? (cur / (n - 1)).toFixed(4) : 0)
    prevB.disabled = cur === 0
    nextB.disabled = cur === n - 1
  }

  // a leaf taller than the screen scrolls inside itself and says so
  const markMore = (el) => {
    if (!el.matches('.pg,.pp')) return
    const more = el.scrollHeight - el.clientHeight > 8 && el.scrollTop + el.clientHeight < el.scrollHeight - 8
    el.classList.toggle('has-more', more)
    if (el.scrollHeight - el.clientHeight > 8) el.tabIndex = 0
    else if (el.getAttribute('tabindex') === '0') el.removeAttribute('tabindex')
  }
  const leaves = () => [...book.querySelectorAll('.pg,.pp')]
  const markAll = () => leaves().forEach(markMore)
  book.addEventListener('scroll', (e) => { if (e.target !== book) markMore(e.target) }, { capture: true, passive: true })
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(markAll); leaves().forEach((l) => ro.observe(l)) }

  const turnIn = (s) => {
    if (reduceQ.matches) return
    const els = s.classList.contains('pair') ? [s] : [s]
    els.forEach((el) => { el.classList.remove('turn-in'); void el.offsetWidth; el.classList.add('turn-in'); setTimeout(() => el.classList.remove('turn-in'), 340) })
  }

  const go = (i, opts = {}) => {
    i = Math.max(0, Math.min(stops.length - 1, i))
    const dist = Math.abs(i - cur)
    quiet = !!opts.quiet
    book.scrollTo({ left: left(stops[i]), behavior: reduceQ.matches || dist !== 1 || opts.instant ? 'auto' : 'smooth' })
    if (dist === 0) settle()
  }
  const goTo = (id, opts) => {
    const el = id && document.getElementById(id)
    if (!el) return false
    const i = stopFor(el)
    if (i < 0) return false
    go(i, opts)
    if (opts && opts.focus) { /* the page itself is the focus target, not a control */ }
    return true
  }

  let lastShown = -1
  const settle = () => {
    cur = nearest()
    paintFolio()
    markAll()
    const s = stops[cur]
    // hash: every page has one; a landing the visitor made (swipe, button, key, contents) is a history entry
    const here = decodeURIComponent(location.hash.slice(1))
    const hereEl = here && document.getElementById(here)
    const onHash = hereEl && (s === hereEl || s.contains(hereEl))
    if (!quiet && !onHash && stopId(s)) {
      try { history.pushState(null, '', '#' + stopId(s)) } catch { /* sandboxed: the page still turns */ }
    }
    quiet = false
    if (cur !== lastShown) { if (lastShown !== -1) turnIn(s); lastShown = cur }
    syncMotion()
  }
  let t
  const later = () => { clearTimeout(t); t = setTimeout(settle, 120) }
  if ('onscrollend' in window) book.addEventListener('scrollend', (e) => { if (e.target === book) settle() })
  book.addEventListener('scroll', () => {
    const n = nearest()
    if (n !== cur) { cur = n; paintFolio() }
    if (!('onscrollend' in window)) later()
  }, { passive: true })

  // ---------- turning ----------
  document.querySelectorAll('[data-turn]').forEach((b) => b.addEventListener('click', () => go(cur + Number(b.dataset.turn))))
  addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
    const t = e.target
    if (t && t.closest && t.closest('input,textarea,select,[contenteditable],dialog')) return
    let to = null
    if (e.key === 'ArrowRight' || e.key === 'PageDown') to = cur + 1
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') to = cur - 1
    else if (e.key === 'Home') to = 0
    else if (e.key === 'End') to = stops.length - 1
    if (to === null) return
    e.preventDefault()
    go(to)
  })
  // a vertical wheel turns one spread at a time on wide screens, unless the leaf under it can still scroll that way;
  // horizontal wheel and trackpad swipes are the browser's own (scroll-snap)
  let wheelUntil = 0
  book.addEventListener('wheel', (e) => {
    if (!wideQ.matches || e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX) || Math.abs(e.deltaY) < 4) return
    let el = e.target
    while (el && el !== book) {
      if (el.scrollHeight > el.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(el).overflowY)) {
        const atEnd = e.deltaY > 0 ? el.scrollTop + el.clientHeight >= el.scrollHeight - 2 : el.scrollTop <= 0
        if (!atEnd) return
        break
      }
      el = el.parentElement
    }
    e.preventDefault()
    const now = Date.now()
    if (now < wheelUntil) return
    wheelUntil = now + 650
    go(cur + (e.deltaY > 0 ? 1 : -1))
  }, { passive: false })
  // contents and every in-page link jump to their page
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]')
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return
    const id = decodeURIComponent(a.getAttribute('href').slice(1))
    if (!id || !document.getElementById(id)) return
    e.preventDefault()
    const el = document.getElementById(id), i = stopFor(el)
    if (i < 0) return
    if (location.hash.slice(1) !== id) { try { history.pushState(null, '', '#' + id) } catch { /* fine */ } }
    quiet = true
    go(i)
    root.classList.remove('opening')
  })
  const fromHash = (opts) => {
    const id = decodeURIComponent(location.hash.slice(1))
    if (id && goTo(id, { quiet: true, instant: true, ...opts })) return
    if (!id) go(0, { quiet: true, instant: true })
  }
  addEventListener('popstate', () => fromHash())
  addEventListener('hashchange', () => fromHash())
  // focus moving into a page that is off screen turns to it (Tab, a screen reader's cursor)
  book.addEventListener('focusin', (e) => {
    const i = stopFor(e.target)
    if (i >= 0 && i !== cur) go(i, { quiet: true, instant: true })
  })
  const rebuild = () => {
    const id = stopId(stops[cur] || book)
    collect()
    const i = stops.findIndex((s) => stopId(s) === id)
    cur = i < 0 ? 0 : i
    book.scrollTo({ left: left(stops[cur]), behavior: 'auto' })
    paintFolio(); markAll(); syncMotion()
  }
  wideQ.addEventListener('change', rebuild)
  addEventListener('resize', () => { clearTimeout(rebuild.t); rebuild.t = setTimeout(() => { book.scrollTo({ left: left(stops[cur]), behavior: 'auto' }); markAll() }, 120) })


  // ---------- Go to page: the folio opens a native dialog listing every leaf in order, then the other pages ----------
  const gotoD = document.getElementById('goto'), gotoList = document.getElementById('goto-list')
  if (gotoD && gotoList && typeof gotoD.showModal === 'function') {
    const leafIds = [...book.querySelectorAll('.pg,.pp')].map((l) => l.id).filter(Boolean)
    const nameOf = (l) => {
      if (l.id === 'contents') return 'Ex Libris & contents'
      const cap = l.querySelector('.folio-cap')
      return cap ? cap.textContent.replace(/^Plate [IVX]+ · /, '') : l.id
    }
    const appOf = (id) => { const a = document.querySelector('#contents .ruled a[href="#' + id + '"]'); return a ? a.lastElementChild.textContent : '' }
    // a plate's own numeral (I to IX, as its caption and the contents show); the other leaves carry none
    const plateNo = (id) => { const a = document.querySelector('#contents .ruled a[href="#' + id + '"]'); return a ? a.firstElementChild.textContent : '' }
    const fill = () => {
      gotoList.textContent = ''
      leafIds.forEach((id) => {
        const l = document.getElementById(id), i = stopFor(l)
        if (i < 0) return
        const li = document.createElement('li'), a = document.createElement('a')
        a.href = '#' + id
        const num = document.createElement('span'), nm = document.createElement('span'), sub = document.createElement('span')
        num.className = 'cap'; num.textContent = /^plate-/.test(id) ? plateNo(id) : ''
        nm.textContent = nameOf(l); sub.textContent = appOf(id)
        a.append(num, nm, sub)
        if (i === cur) { li.dataset.here = ''; a.setAttribute('aria-current', 'page'); sub.textContent = sub.textContent ? sub.textContent + ' · here' : 'here' }
        li.append(a); gotoList.append(li)
      })
    }
    folioBtn.addEventListener('click', () => {
      if (gotoD.open) return
      fill()
      gotoD.showModal()
      folioBtn.setAttribute('aria-expanded', 'true')
      const here = gotoList.querySelector('[aria-current]') || gotoList.querySelector('a')
      if (here) { here.focus({ preventScroll: true }); here.scrollIntoView({ block: 'center' }) }
    })
    const shut = () => { folioBtn.setAttribute('aria-expanded', 'false'); folioBtn.focus({ preventScroll: true }) }
    gotoD.addEventListener('close', shut)
    document.getElementById('goto-x').addEventListener('click', () => gotoD.close())
    gotoD.addEventListener('click', (e) => { if (e.target === gotoD) gotoD.close() })
    // choosing a leaf: the contents' own click handler turns to it and updates the hash; other pages navigate normally
    gotoD.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('a[href^="#"]')) gotoD.close() })
  } else folioBtn.removeAttribute('aria-haspopup')

  // ---------- the loops ----------
  // Each plate's loop is the app's own footage. The poster (an <img>) always paints first; the loop loads when its
  // page is the one in view, after the opening, and never under Reduce Motion or Save-Data. Everything else is paused
  // and released, so only one video exists at a time.
  const c = navigator.connection || {}
  const videos = [...book.querySelectorAll('video.loop')]
  const seen = new Set()
  let ready = false
  const allowed = () => ready && !c.saveData && !reduceQ.matches && !document.hidden
  const file = (v) => (root.dataset.light === 'evening' ? v.dataset.evening : v.dataset.day)
  const release = (v) => { v.pause(); v.classList.remove('on'); if (v.getAttribute('src')) { v.removeAttribute('src'); v.load() } }
  function syncMotion () {
    let playing = null
    const s = stops[cur]
    if (allowed()) for (const v of videos) if (s && s.contains(v) && seen.has(v)) { playing = v; break }
    for (const v of videos) {
      if (v !== playing) { release(v); continue }
      const f = file(v)
      if (v.getAttribute('src') !== f) { v.classList.remove('on'); v.src = f }
      v.play().catch(() => {})
    }
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.intersectionRatio >= 0.5) seen.add(e.target.querySelector('video.loop')); else seen.delete(e.target.querySelector('video.loop')) })
      syncMotion()
    }, { root: book, threshold: [0, 0.5, 0.75] })
    videos.forEach((v) => io.observe(v.parentElement))
  } else videos.forEach((v) => seen.add(v))
  videos.forEach((v) => v.addEventListener('playing', () => v.classList.add('on')))
  new MutationObserver(syncMotion).observe(root, { attributes: true, attributeFilter: ['data-light'] })
  reduceQ.addEventListener('change', syncMotion)
  document.addEventListener('visibilitychange', syncMotion)
  const start = () => { ready = true; syncMotion() }
  const afterOpening = () => {
    const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 2500 }) : setTimeout(start, 1200))
    if (!root.classList.contains('opening')) return idle()
    new MutationObserver((m, o) => { if (!root.classList.contains('opening')) { o.disconnect(); idle() } }).observe(root, { attributes: true, attributeFilter: ['class'] })
  }
  if (document.readyState === 'complete') afterOpening(); else addEventListener('load', afterOpening)

  // ---------- the Watch plate: case and band ----------
  const picker = document.querySelector('[data-picker]')
  if (picker) {
    picker.hidden = false
    const CN = { natural: 'Natural', black: 'Black', spacegray: 'Space Gray', bronze: 'Dark bronze', gold: 'Light gold', nightblue: 'Night blue' }
    const BN = { sea: 'Sport Band, pale succulent', cloth: 'Braided Solo Loop, olive', nylon: 'Sport Loop, limestone', leather: 'Magnetic Link, camel', mesh: 'Milanese Loop, natural' }
    const set = (k, v) => {
      document.querySelectorAll('.watch .' + k).forEach((e) => { const on = e.getAttribute('data-' + k) === v; if (on && !e.classList.contains('on')) e.parentNode.appendChild(e); e.classList.toggle('on', on) })
      picker.querySelectorAll('.sw[data-set=' + k + ']').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-val') === v)))
      const out = document.getElementById('v-' + k)
      if (out) out.textContent = (k === 'case' ? CN : BN)[v]
    }
    picker.querySelectorAll('.sw').forEach((b) => b.addEventListener('click', () => set(b.getAttribute('data-set'), b.getAttribute('data-val'))))
  }

  // ---------- first paint: the page the address names (else the first), then the folio ----------
  addEventListener('load', () => { fromHash({ quiet: true, instant: true }); settle() }, { once: true })
  fromHash({ quiet: true, instant: true })
  cur = nearest(); paintFolio(); markAll()
})()

// The app's screens (r10): each leaf's drawn phone follows Daylight/Evening; "By day · By evening" under it compares both.
// A choice holds until the site's light changes, then the phone follows the site again. Without JavaScript the toggle stays hidden.
;(() => {
  const root = document.documentElement
  const figs = [...document.querySelectorAll('.phonefig:not(.single)')]
  if (!figs.length) return
  const eff = (f) => f.dataset.view || (root.dataset.light === 'evening' ? 'evening' : 'day')
  const paint = (f) => f.querySelectorAll('.pv button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === eff(f))))
  figs.forEach((f) => {
    f.querySelector('.pv').hidden = false
    f.querySelectorAll('.pv button').forEach((b) => b.addEventListener('click', () => { f.dataset.view = b.dataset.v; paint(f) }))
    paint(f)
  })
  new MutationObserver(() => figs.forEach((f) => { delete f.dataset.view; paint(f) })).observe(root, { attributes: true, attributeFilter: ['data-light'] })
})()
