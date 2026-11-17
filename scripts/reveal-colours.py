"""Colours for the homepage places, taken from the pictures the visitor actually sees (Nov 17, 2026).

Founder: "the cards aren't connected with the imagery that its suppose to be ... you need to make the colors
connect with the visuals". places.css takes --tone and --deep from the app's place photographs, but the homepage
shows the loops' first frames (assets/motion), which are different pictures. This reads those frames instead and
writes, for each place and light:
  --deep       the page colour: the picture's main hue, dark enough for cream text (at least 12:1)
  --tone       the accent (numbers, rules, the breath dot): the picture's most colourful hue, light
  --card-a/-m/-b  the card: the picture's top (sky, canopy), horizon (sea, sunset) and bottom (sand, rock) colours
  --card-ink   the "Step in" text on the card, cream or dark, whichever reads (at least 4.5:1)
  --card-line  the card's hairline
The arrival takes its colours from the boat film's last frame, in both lights. It then rewrites the block between the reveal-colours markers in site.css.
  python scripts/reveal-colours.py            (needs Pillow and numpy)
"""
import colorsys
import io
import os
import re

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLACES = ['arrival', 'coast', 'clearing', 'path', 'inlet', 'shore', 'outlook']
PAPER = (250, 247, 241)
# The founder's picks where the picture's own main hue read wrong. The Path by day came out brown (dark sand) on a
# bright sunny beach; he chose the sea's deep blue with sun-yellow accents from a specimen of four (Nov 17: "C").
OVERRIDES = {('path', 'day'): {'--deep': '#0f2238', '--tone': '#f2c94c'}}


def lum(c):
    def ch(v):
        v /= 255
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(float(x)) for x in c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def hls(c):
    return colorsys.rgb_to_hls(*(x / 255 for x in c))


def rgb(h, l, s):
    return tuple(int(round(x * 255)) for x in colorsys.hls_to_rgb(h, max(0, min(1, l)), max(0, min(1, s))))


def kmeans(px, k=5, it=12):
    rng = np.random.default_rng(7)
    c = px[rng.choice(len(px), k, replace=False)]
    for _ in range(it):
        lab = ((px[:, None, :] - c[None]) ** 2).sum(2).argmin(1)
        c = np.array([px[lab == i].mean(0) if (lab == i).any() else c[i] for i in range(k)])
    n = np.bincount(lab, minlength=k)
    return [(tuple(c[i]), int(n[i])) for i in range(k) if n[i]]


def load(path, w):
    im = Image.open(path).convert('RGB')
    return np.asarray(im.resize((w, max(1, round(im.height * w / im.width))), Image.BILINEAR), dtype=float)


def main_colour(px, colourful=False):
    best, score = None, -1
    for c, n in kmeans(px.reshape(-1, 3)):
        h, l, s = hls(c)
        chroma = s * (1 - abs(2 * l - 1))
        sc = n * ((0.15 + chroma) if colourful else (0.6 + chroma))
        if sc > score:
            best, score = c, sc
    return best


def hexs(c):
    return '#%02x%02x%02x' % tuple(int(x) for x in c)


def place(name, light):
    sfx = '' if light == 'day' else '-evening'
    t, w = (f'{name}{sfx}-tall', f'{name}{sfx}-wide') if name != 'arrival' else ('arrival-tall-end', 'arrival-wide-end')
    tall = load(os.path.join(ROOT, f'assets/motion/{t}.webp'), 60)
    wide = load(os.path.join(ROOT, f'assets/motion/{w}.webp'), 120)
    both = np.concatenate([tall.reshape(-1, 3), wide.reshape(-1, 3)])
    h0, _, s0 = hls(main_colour(both))
    hv, lv, sv = hls(main_colour(both, colourful=True))
    deep = rgb(h0, 0.105, min(s0, 0.42))
    while contrast(deep, PAPER) < 12:
        deep = rgb(h0, hls(deep)[1] - 0.01, min(s0, 0.42))
    tone = rgb(hv, 0.72, min(max(sv, 0.3), 0.6))
    n = tall.shape[0]
    top, bottom = main_colour(tall[: int(n * 0.45)], colourful=True), main_colour(tall[int(n * 0.55):], colourful=True)
    ta, la, sa = hls(top)
    tb, lb, sb = hls(bottom)
    a = rgb(ta, min(max(la, 0.24), 0.6), min(sa * 1.1, 0.7))
    b = rgb(tb, min(max(lb, 0.2), 0.6), min(sb * 1.1, 0.7))
    nw = wide.shape[0]  # the horizon band (sea, sunset, treeline), from the wide frame
    tm, lm, sm = hls(main_colour(wide[int(nw * 0.35): int(nw * 0.65)], colourful=True))
    m = rgb(tm, min(max(lm, 0.24), 0.6), min(sm * 1.1, 0.7))
    ink = PAPER if contrast(b, PAPER) >= contrast(b, deep) else deep
    while contrast(b, ink) < 4.5:  # move the card's foot away from its text until it reads
        h, l, s = hls(b)
        b = rgb(h, l - 0.02 if ink == PAPER else l + 0.02, s)
    line = rgb(ta, min(la + 0.18, 0.85), sa)
    return {'--deep': hexs(deep), '--tone': hexs(tone), '--card-a': hexs(a), '--card-m': hexs(m), '--card-b': hexs(b),
            '--card-ink': hexs(ink), '--card-line': hexs(line)}, (contrast(deep, PAPER), contrast(deep, tone), contrast(b, ink))


def main():
    rules, report = [], []
    for name in PLACES:
        for light in (('day',) if name == 'arrival' else ('day', 'evening')):  # the arrival has one film for both lights
            v, c = place(name, light)
            if (name, light) in OVERRIDES:
                v.update(OVERRIDES[(name, light)])
                rgbh = lambda x: tuple(int(x[i:i + 2], 16) for i in (1, 3, 5))
                c = (contrast(rgbh(v['--deep']), PAPER), contrast(rgbh(v['--deep']), rgbh(v['--tone'])), c[2])
            sel = '#arrival,html[data-light=evening] #arrival' if name == 'arrival' else f'.place[data-reveal][data-place={name}]'
            if light == 'evening':
                sel = ','.join('html[data-light=evening] ' + s for s in sel.split(','))
            rules.append(sel + '{' + ';'.join(f'{k}:{x}' for k, x in v.items()) + '}')
            report.append(f'{name:9} {light:8} text {c[0]:.1f}:1  accent {c[1]:.1f}:1  card {c[2]:.1f}:1  {v}')
    block = ('/* reveal-colours:start. Generated by scripts/reveal-colours.py from the loops\' first frames '
             '(assets/motion); never edit by hand. */\n' + '\n'.join(rules) + '\n/* reveal-colours:end */')
    p = os.path.join(ROOT, 'site.css')
    css = io.open(p, encoding='utf-8').read()
    pat = re.compile(r'/\* reveal-colours:start.*?reveal-colours:end \*/', re.S)
    css = pat.sub(lambda _: block, css) if pat.search(css) else css.rstrip('\n') + '\n' + block + '\n'
    io.open(p, 'w', encoding='utf-8', newline='').write(css)
    print('\n'.join(report))


if __name__ == '__main__':
    main()
