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
    fc = f'[0]trim={S}:{S+D},setpts=PTS-STARTPTS,split[a][r];[r]reverse[b];[a][b]concat=n=2:v=1,{SC}[v]'
    run(['-i', src, '-filter_complex', fc, '-map', '[v]'] + X264 + [f'out/{name}.mp4']); still(src, S, name)
for d, suf in (('d15', ''), ('e15', '-evening')):
    for s in ('home', 'ride', 'ground'): fade(f'{d}/{s}.webm', s + suf)
    cut(f'{d}/breathe.webm', 'breathe' + suf)
    pingpong(f'{d}/history.webm', 'history' + suf)
cut('e15/walk.webm', 'walk-evening')
fade('d15/arrival.webm', 'arrival', S=0.5, F=1.5, D=9.0)
for f in sorted(os.listdir('out')): print(f, os.path.getsize('out/' + f))
