"""The site's icons from the app's icon (Nov 10, 2026).

Source: the app repo's assets/icon-src/icon-light.svg (built by its scripts/island/build-app-icon.py;
design notes in its docs/design/ICON-WAVES-TO-CLEARING-2026-11-10.md). The site uses the light icon,
like the app's favicon.

  python scripts/build-icons.py [path/to/urge-walk-app]
  python scripts/build-icons.py --seaglass [path/to/urge-walk-app]

--seaglass (Nov 11, 2026, the founder's home-screen test): the same drawing in the Sea glass colourway
(colours from the private colour board), written with the suffix -sg11 instead of -n10.

Writes, in assets/:
  icon-n10.svg              tab icon (vector), corners rounded like the old W6 file
  favicon-16-n10.png, favicon-32-n10.png   tab icons, rounded
  apple-touch-icon-n10.png  180, full bleed (iOS rounds it)
  icon-192-n10.png, icon-512-n10.png        manifest "any", rounded
  icon-512-maskable-n10.png manifest "maskable", full bleed (the launcher crops it)
"""
import io
import os
import sys

import resvg_py
from PIL import Image

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
SEAGLASS = '--seaglass' in sys.argv
SUFFIX = 'sg11' if SEAGLASS else 'n10'
APP = ARGS[0] if ARGS else os.path.join(os.path.dirname(SITE), 'urge-walk-app')
OUT = os.path.join(SITE, 'assets')

src = open(os.path.join(APP, 'assets', 'icon-src', 'icon-light.svg'), encoding='utf-8').read()
assert src.startswith('<svg') and src.rstrip().endswith('</svg>')

# Sea glass: light icon colour -> Sea glass colour. The path out keeps its amber.
SEA_GLASS = {
    '#fcf9f1': '#eef3ea', '#ebe0cd': '#cfe0d6',                          # background
    '#4455a2': '#2f7f78', '#31428c': '#1f625e', '#1f2a5e': '#123f40',   # the form
    '#3a2a16': '#12302c', 'flood-opacity="0.32"': 'flood-opacity="0.3"',  # its shadow
}
if SEAGLASS:
    for a, b in SEA_GLASS.items():
        assert src.count(a) == 1, a
        src = src.replace(a, b)

# Rounded: the same drawing inside a clip with the old file's corner (rx 230 on the 1024 grid).
head, body = src.split('<defs>', 1)
defs, rest = body.split('</defs>', 1)
rounded = (head + '<defs>' + defs + '<clipPath id="r"><rect width="1024" height="1024" rx="230"/></clipPath></defs>'
           + '<g clip-path="url(#r)">' + rest.replace('</svg>', '') + '</g></svg>')


def png(svg, size, name):
    data = resvg_py.svg_to_bytes(svg_string=svg, width=size, height=size)
    im = Image.open(io.BytesIO(bytes(data)))
    im = im.convert('RGBA') if svg is rounded else im.convert('RGB')
    im.save(os.path.join(OUT, name), optimize=True)
    print(name, im.size, os.path.getsize(os.path.join(OUT, name)))


with open(os.path.join(OUT, f'icon-{SUFFIX}.svg'), 'w', encoding='utf-8', newline='\n') as f:
    f.write(rounded + '\n')
print(f'icon-{SUFFIX}.svg', os.path.getsize(os.path.join(OUT, f'icon-{SUFFIX}.svg')))
png(rounded, 16, f'favicon-16-{SUFFIX}.png')
png(rounded, 32, f'favicon-32-{SUFFIX}.png')
png(src, 180, f'apple-touch-icon-{SUFFIX}.png')
png(rounded, 192, f'icon-192-{SUFFIX}.png')
png(rounded, 512, f'icon-512-{SUFFIX}.png')
png(src, 512, f'icon-512-maskable-{SUFFIX}.png')
