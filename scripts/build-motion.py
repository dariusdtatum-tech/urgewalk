"""Build the site's place loops and the arrival clip (Nov 10 2026).

Wide (1280 x 720) loops are cut from Pixabay's 1920 x 1080 renditions of the same footage the app uses
(urge-walk-app/src/ui/PlaceMotion.jsx); tall (720 x 1280) loops are the app's own 1216 x 2160 loops,
scaled down, so phones see exactly what the app shows. Every loop ends on its own first frame (a
crossfade at the seam), no audio, H.264 with faststart. Posters are each file's first frame as WebP.

  python -I scripts/build-motion.py <dir with <pixabay id>.mp4> <urge-walk-app>/assets/motion
Downloads stay in a scratch folder; delete them once the outputs are saved.
"""
import os, subprocess, sys
import imageio_ffmpeg
from PIL import Image

FF = imageio_ffmpeg.get_ffmpeg_exe()
SRC, APP = sys.argv[1], sys.argv[2]
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'motion')
X264 = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-maxrate', '2M', '-bufsize', '4M', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart']

# name: (pixabay id, start s, loop length s, seam crossfade s). None = no wide loop (still photograph).
WIDE = {
    # Coast (159778, 46131) and Cove (44969, 199001) left the homepage with the app-first pass (Nov 10): not built.
    'clearing': (217491, 0.2, 8, 1.5), 'clearing-evening': (62390, 0.2, 8, 1.5),
    'inlet': (278037, 2, 10.5, 1.5), 'inlet-evening': (193078, 0, 10, 1.5),
    'path': (44971, 2, 10.5, 1.5), 'path-evening': (89766, 2, 10.5, 1.5),
    'outlook': None,  # 23748: a boat leaves the rock within the first second; the app's tall crop avoids it
    'outlook-evening': (216997, 1, 10.5, 1.5),
    'shore': (103447, 2, 10.5, 1.5), 'shore-evening': (372136, 0, 10, 1.5),
}

def run(args):
    subprocess.run([FF, '-v', 'error', '-y', *args], check=True)

def poster(mp4, webp, at='first'):
    png = webp + '.png'
    if at == 'first': run(['-i', mp4, '-frames:v', '1', png])
    else: run(['-sseof', '-0.1', '-i', mp4, '-frames:v', '1', '-update', '1', png])
    Image.open(png).save(webp, 'WEBP', quality=72, method=6)
    os.remove(png)

def wide_loop(name, pid, s, L, F):
    out = os.path.join(OUT, f'{name}-wide.mp4')
    scale = 'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30,setsar=1'
    # body: [s+F, s+F+L]; head: [s, s+F] laid over the body's last F seconds, so the loop ends where it began.
    fc = (f'[0:v]trim={s+F}:{s+F+L},setpts=PTS-STARTPTS,{scale}[a];'
          f'[0:v]trim={s}:{s+F},setpts=PTS-STARTPTS,{scale}[b];'
          f'[a][b]xfade=transition=fade:duration={F}:offset={L-F}[v]')
    run(['-i', os.path.join(SRC, f'{pid}.mp4'), '-filter_complex', fc, '-map', '[v]', *X264, out])
    poster(out, out.replace('.mp4', '.webp'))

def tall(name, src_name, last=False, skip=0):
    out = os.path.join(OUT, f'{name}-tall.mp4')
    run(['-ss', str(skip), '-i', os.path.join(APP, f'{src_name}.mp4'), '-vf', 'scale=720:1280,setsar=1', *X264, out])
    poster(out, out.replace('.mp4', '.webp'))
    if last: poster(out, out.replace('.mp4', '-end.webp'), at='last')

os.makedirs(OUT, exist_ok=True)
for name, spec in WIDE.items():
    if spec: wide_loop(name, *spec)
    tall(name, name)
# The arrival (Pixabay 59046, lumamorph): plays once, then rests on its last frame.
arr = os.path.join(OUT, 'arrival-wide.mp4')
run(['-i', os.path.join(SRC, '59046.mp4'), '-t', '11', '-vf', 'scale=1280:720,fps=30,setsar=1', *X264, arr])
poster(arr, arr.replace('.mp4', '.webp')); poster(arr, arr.replace('.mp4', '-end.webp'), at='last')
tall('arrival', 'arrival', last=True, skip=0.6)  # the app's clip fades in from black over 0.6 s
for f in sorted(os.listdir(OUT)): print(f, round(os.path.getsize(os.path.join(OUT, f)) / 1e6, 2), 'MB')
