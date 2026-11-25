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
