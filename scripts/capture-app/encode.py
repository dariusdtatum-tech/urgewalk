import subprocess, sys, os, imageio_ffmpeg
from PIL import Image
FF = imageio_ffmpeg.get_ffmpeg_exe()
X264 = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', '-r', '25']
SC = 'scale=390:844:flags=lanczos'
def run(a): subprocess.run([FF, '-v', 'error', '-y'] + a, check=True)
def still(src, t, name):
    run(['-ss', str(t), '-i', src, '-frames:v', '1', 'tmp.png'])
    Image.open('tmp.png').convert('RGB').save(f'out/{name}.webp', quality=82, method=6)
def fade(src, name, S=1.0, F=1.5, D=8.0):
    # body [S+F, S+F+D] whose last F seconds dissolve into the head [S, S+F]: the end meets the start
    fc = (f'[0]trim={S+F}:{S+F+D},setpts=PTS-STARTPTS[a];[0]trim={S}:{S+F},setpts=PTS-STARTPTS[b];'
          f'[a][b]xfade=transition=fade:duration={F}:offset={D-F},{SC}[v]')
    run(['-i', src, '-filter_complex', fc, '-map', '[v]'] + X264 + [f'out/{name}.mp4']); still(src, S + F, name)
def cut(src, name, S=1.0, D=8.0):
    run(['-ss', str(S), '-t', str(D), '-i', src, '-vf', SC] + X264 + [f'out/{name}.mp4']); still(src, S, name)
def pingpong(src, name, S=0.4, D=9.0):
    # History: starts and ends with the tray raised (the still shows the history), lowers, rests, rises again
    fc = f'[0]trim={S}:{S+D},setpts=PTS-STARTPTS,split[a][r];[r]reverse[b];[b][a]concat=n=2:v=1,{SC}[v]'
    run(['-i', src, '-filter_complex', fc, '-map', '[v]'] + X264 + [f'out/{name}.mp4']); still(src, S + D - 0.04, name)
def breathe(src, name):
    # one full breath (13 s), so the ring meets itself; detailed water, so a little more compression
    X264[X264.index('-crf') + 1] = '33'; cut(src, name, D=13); X264[X264.index('-crf') + 1] = '30'
DAY, EVE = (sys.argv[1:3] + ['d16', 'e16'])[:2] if len(sys.argv) > 2 else ('d16', 'e16')
os.makedirs('out', exist_ok=True)
for d, suf in ((DAY, ''), (EVE, '-evening')):
    for s in ('home', 'ride', 'ground'): fade(f'{d}/{s}.webm', s + suf)
    cut(f'{d}/walk.webm', 'walk' + suf)
    breathe(f'{d}/breathe.webm', 'breathe' + suf)
    pingpong(f'{d}/history.webm', 'history' + suf)
fade(f'{DAY}/arrival.webm', 'arrival', S=0.5, F=1.5, D=9.0)
for f in sorted(os.listdir('out')): print(f, os.path.getsize('out/' + f))
