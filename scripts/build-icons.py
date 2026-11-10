"""The site's icons from the app's icon (Nov 10, 2026).

Source: the app repo's assets/icon-src/icon-light.svg (built by its scripts/island/build-app-icon.py;
design notes in its docs/design/ICON-WAVES-TO-CLEARING-2026-11-10.md). The site uses the light icon,
like the app's favicon.

  python scripts/build-icons.py [path/to/urge-walk-app]

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
APP = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(SITE), 'urge-walk-app')
OUT = os.path.join(SITE, 'assets')

src = open(os.path.join(APP, 'assets', 'icon-src', 'icon-light.svg'), encoding='utf-8').read()
assert src.startswith('<svg') and src.rstrip().endswith('</svg>')

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


with open(os.path.join(OUT, 'icon-n10.svg'), 'w', encoding='utf-8', newline='\n') as f:
    f.write(rounded + '\n')
print('icon-n10.svg', os.path.getsize(os.path.join(OUT, 'icon-n10.svg')))
png(rounded, 16, 'favicon-16-n10.png')
png(rounded, 32, 'favicon-32-n10.png')
png(src, 180, 'apple-touch-icon-n10.png')
png(rounded, 192, 'icon-192-n10.png')
png(rounded, 512, 'icon-512-n10.png')
png(src, 512, 'icon-512-maskable-n10.png')
