"""Does every place picture on the site show what the app shows? (Nov 16, 2026)

Founder, Nov 16: "Not every visual is the same. Walk isn't the same." Run this after any change to the app's
places (urge-walk-app/src/ui/places.js and PlaceMotion.jsx) or to the site's footage.

  python -I scripts/check-parity.py [path/to/urge-walk-app] [git ref, default HEAD]

Reads the app's pictures from Git at the given ref (never from uncommitted trials).

1. Phones and tall screens (assets/motion/<place>[-evening]-tall.webp) are the app's own loops scaled down,
   so each must be a copy of the app's picture: correlation 0.90 or more. This is the strict check.
2. Wide screens (assets/motion/<place>[-evening]-wide.webp) are cut from the full-width source of the same
   footage, so they can't be copies. Each is searched for the app's picture, frame by frame across the app's
   loop; below 0.60 fails, 0.60 to 0.85 is listed for a look (moving water and grass lower the score).
   A wide still cut as a band across an upright source (Outlook by day, Nov 16) can't hold the app's frame,
   so a wide that scores under 0.85 also gets the keypoint test from 3; 0.60 or more there passes as "kp".
   (Nov 16: the tower band scored 0.57 to 0.69 over seven source frames; old and wrong pictures 0.11 to 0.12.)
   A wide window cut from inside the app's own slice (the Walk by day, Nov 16, app 376b215: a landscape clip whose
   wide window is a third of the app frame's height) is found by searching its middle, at several scales, inside
   each frame of the app's loop; 0.85 or more passes as "in" (the Walk scored 0.91; wrong places 0.33 to 0.71).
3. Places without footage (trailhead, cottage, shelter): assets/places/<place>-<light>-tall.webp, the site's
   own crop and grade of the photograph, matched to the app's plate by keypoints: 0.60 or more of the matches
   agree on one placement (Nov 16: the same photos scored 0.92 to 0.98, different ones 0.08 to 0.28).

Writes previews/parity-sheet.jpg (site, then app, per row) for the eye. Exit code 1 if anything fails.
"""
import os
import subprocess
import sys
import tempfile

import cv2
import imageio_ffmpeg
import numpy as np

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(SITE), 'urge-walk-app')
REF = sys.argv[2] if len(sys.argv) > 2 else 'HEAD'
FF = imageio_ffmpeg.get_ffmpeg_exe()
TMP = tempfile.mkdtemp()
FOOTAGE = ['coast', 'clearing', 'path', 'inlet', 'shore', 'outlook', 'cove']
STILLS = ['trailhead', 'cottage', 'shelter']


def from_app(rel):
    out = os.path.join(TMP, rel.replace('/', '_'))
    data = subprocess.run(['git', '-C', APP, 'show', f'{REF}:{rel}'], capture_output=True).stdout
    if not data:
        return None
    open(out, 'wb').write(data)
    return out


def grey(path, h):
    im = cv2.imdecode(np.fromfile(path, np.uint8), cv2.IMREAD_GRAYSCALE)
    return cv2.resize(im, (max(8, round(im.shape[1] * h / im.shape[0])), h), interpolation=cv2.INTER_AREA).astype(np.float32)


def loop_frames(mp4, h=180):
    w = round(h * 1216 / 2160)
    raw = subprocess.run([FF, '-v', 'error', '-i', mp4, '-vf', f'fps=2,scale={w}:{h},format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)


def same(a, b, h=180):
    x, y = grey(a, h), grey(b, h)
    y = cv2.resize(y, (x.shape[1], h))
    return float(cv2.matchTemplate(x, y, cv2.TM_CCOEFF_NORMED).max())


def inside(wide, mp4):
    """The middle 80% of a wide still, searched at 14 scales inside every frame of the app's loop."""
    w = grey(wide, 360); h, wd = w.shape
    t = w[int(h * .1):int(h * .9), int(wd * .1):int(wd * .9)]
    best = 0.0
    for f in loop_frames(mp4, 720):
        for k in np.linspace(.35, 1.0, 14):
            tw = int(f.shape[1] * k); th = int(t.shape[0] * tw / t.shape[1])
            if th >= f.shape[0] or tw < 20:
                continue
            best = max(best, float(cv2.matchTemplate(f, cv2.resize(t, (tw, th), interpolation=cv2.INTER_AREA), cv2.TM_CCOEFF_NORMED).max()))
    return best


def same_photo(a, b):
    """A photograph cropped and graded differently: ORB keypoints matched between the two, then a RANSAC fit.
    Returns the share of the site crop's good matches that agree on one placement (same photo: 0.6 or more)."""
    orb = cv2.ORB_create(3000)
    x, y = grey(a, 800).astype(np.uint8), grey(b, 1000).astype(np.uint8)
    ka, da = orb.detectAndCompute(x, None); kb, db = orb.detectAndCompute(y, None)
    if da is None or db is None:
        return 0.0
    pairs = [m for m, n in (p for p in cv2.BFMatcher(cv2.NORM_HAMMING).knnMatch(da, db, k=2) if len(p) == 2) if m.distance < 0.8 * n.distance]
    if len(pairs) < 8:
        return 0.0
    src = np.float32([ka[m.queryIdx].pt for m in pairs]); dst = np.float32([kb[m.trainIdx].pt for m in pairs])
    _, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=6)
    return float(inl.sum()) / len(pairs) if inl is not None else 0.0


rows, failed, look = [], 0, 0
for place in FOOTAGE:
    for light in ('day', 'evening'):
        ev = '-evening' if light == 'evening' else ''
        ref, mp4 = from_app(f'assets/motion/{place}{ev}.jpg'), from_app(f'assets/motion/{place}{ev}.mp4')
        tall = os.path.join(SITE, 'assets', 'motion', f'{place}{ev}-tall.webp')
        if ref and os.path.exists(tall):
            sc = same(tall, ref); ok = sc >= 0.90; failed += not ok
            print(f'{"ok  " if ok else "FAIL"} {sc:.2f}  tall  {place:9} {light}')
            rows.append((tall, ref, sc, 'ok' if ok else 'FAIL'))
        wide = os.path.join(SITE, 'assets', 'motion', f'{place}{ev}-wide.webp')
        if ref and mp4 and os.path.exists(wide):
            big = grey(wide, 180)
            sc = max(float(cv2.matchTemplate(big, f, cv2.TM_CCOEFF_NORMED).max()) for f in loop_frames(mp4))
            verdict = 'ok' if sc >= 0.85 else ('look' if sc >= 0.60 else 'FAIL')
            if verdict != 'ok' and same_photo(wide, ref) >= 0.60:
                sc, verdict = same_photo(wide, ref), 'kp'
            if verdict not in ('ok', 'kp') and inside(wide, mp4) >= 0.85:
                sc, verdict = inside(wide, mp4), 'in'
            failed += verdict == 'FAIL'; look += verdict == 'look'
            print(f'{verdict:4} {sc:.2f}  wide  {place:9} {light}')
            rows.append((wide, ref, sc, verdict))
for place in STILLS:
    for light in ('day', 'evening'):
        ref = from_app(f'assets/scenes/island/{place}-{light}.jpg')
        tall = os.path.join(SITE, 'assets', 'places', f'{place}-{light}-tall.webp')
        if ref and os.path.exists(tall):
            sc = same_photo(tall, ref); ok = sc >= 0.60; failed += not ok
            print(f'{"ok  " if ok else "FAIL"} {sc:.2f}  still {place:9} {light}')
            rows.append((tall, ref, sc, 'ok' if ok else 'FAIL'))

H, sheet = 150, []
for site_p, app_p, sc, verdict in rows:
    a = cv2.imdecode(np.fromfile(site_p, np.uint8), cv2.IMREAD_COLOR); b = cv2.imdecode(np.fromfile(app_p, np.uint8), cv2.IMREAD_COLOR)
    a = cv2.resize(a, (round(a.shape[1] * H / a.shape[0]), H)); b = cv2.resize(b, (round(b.shape[1] * H / b.shape[0]), H))
    row = np.full((H, 460, 3), 20, np.uint8)
    row[:, :min(a.shape[1], 300)] = a[:, :300]; row[:, 310:310 + min(b.shape[1], 150)] = b[:, :150]
    colour = {'ok': (0, 200, 0), 'kp': (0, 200, 0), 'in': (0, 200, 0), 'look': (0, 200, 255), 'FAIL': (0, 0, 255)}[verdict]
    cv2.putText(row, f'{os.path.basename(site_p)} {sc:.2f}', (4, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.4, colour, 1)
    sheet.append(row)
os.makedirs(os.path.join(SITE, 'previews'), exist_ok=True)
cv2.imencode('.jpg', np.vstack(sheet), [cv2.IMWRITE_JPEG_QUALITY, 72])[1].tofile(os.path.join(SITE, 'previews', 'parity-sheet.jpg'))
print(f'app {REF}: {len(rows)} pictures, {failed} failed, {look} to look at')
sys.exit(1 if failed else 0)
