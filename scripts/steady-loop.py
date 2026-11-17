"""The arrival as a nonstop loop (Nov 16 2026, founder: "can you make it into a nonstop loop?").

The boat nears the island, so a plain crossfade at the seam shows two islands. This holds the island still
instead: every frame is registered (ORB keypoints, similarity fit with RANSAC) to the LAST frame on the upper part
of the picture (island and horizon), the transforms are smoothed over 9 frames, each frame is warped with a small
extra zoom so no edge shows, and the head is dissolved into the tail (smoothstep). The sea and the wake keep moving.
Needs opencv-python and numpy (scratch only); raw frames go to the ffmpeg bundled with imageio-ffmpeg.

  python -I scripts/steady-loop.py <in.mp4> <out.mp4> <work W> <work H> <top share> <zoom> <crossfade s> [crop x,y,w,h | -] [OWxOH]
  wide: 59046.mp4 (Pixabay, 4K, first 11 s) 1920 1080 0.55 1.04 2.0 - 1280x720
  tall: the app's arrival.mp4 with its 0.6 s fade-in cut first, 1080 1920 0.55 1.04 2.0 - 720x1280
"""
import sys, subprocess, numpy as np, cv2, imageio_ffmpeg
src, dst, W, H, top, zoom, F = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), float(sys.argv[5]), float(sys.argv[6]), float(sys.argv[7])
crop = [int(v) for v in sys.argv[8].split(',')] if len(sys.argv) > 8 and sys.argv[8] != '-' else None
OW, OH = (int(v) for v in (sys.argv[9].split('x') if len(sys.argv) > 9 else (W, H)))
FF = imageio_ffmpeg.get_ffmpeg_exe()
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS) or 30
frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    if crop: x, y, w, h = crop; f = f[y:y + h, x:x + w]
    frames.append(cv2.resize(f, (W, H), interpolation=cv2.INTER_AREA))
n = len(frames); print('frames', n, 'fps', fps)
orb = cv2.ORB_create(4000); bf = cv2.BFMatcher(cv2.NORM_HAMMING)
mask = np.zeros((H, W), np.uint8); mask[:int(H * top)] = 255
# the island held at its final, largest size: every warp enlarges
g0 = cv2.cvtColor(frames[-1], cv2.COLOR_BGR2GRAY); k0, d0 = orb.detectAndCompute(g0, mask)
params = []
for f in frames:
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY); k, d = orb.detectAndCompute(g, mask)
    m = [a for a, b in (p for p in bf.knnMatch(d, d0, k=2) if len(p) == 2) if a.distance < .75 * b.distance]
    A, inl = cv2.estimateAffinePartial2D(np.float32([k[x.queryIdx].pt for x in m]), np.float32([k0[x.trainIdx].pt for x in m]), method=cv2.RANSAC, ransacReprojThreshold=3)
    s = np.hypot(A[0, 0], A[1, 0]); a = np.arctan2(A[1, 0], A[0, 0])
    params.append((s, a, A[0, 2], A[1, 2], int(inl.sum())))
P = np.array(params, float); print('scale %.3f..%.3f  angle %.2f..%.2f deg  min inliers %d' % (P[:, 0].min(), P[:, 0].max(), np.degrees(P[:, 1].min()), np.degrees(P[:, 1].max()), P[:, 4].min()))
k = 9; ker = np.ones(k) / k
S = np.vstack([np.convolve(np.pad(P[:, i], k // 2, mode='edge'), ker, 'valid') for i in range(4)]).T
out = []
for f, (s, a, tx, ty) in zip(frames, S):
    A = np.array([[s * np.cos(a), -s * np.sin(a), tx], [s * np.sin(a), s * np.cos(a), ty]])
    Z = np.array([[zoom, 0, (1 - zoom) * W / 2], [0, zoom, (1 - zoom) * H / 2], [0, 0, 1]])
    M = (Z @ np.vstack([A, [0, 0, 1]]))[:2]
    out.append(cv2.warpAffine(f, M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT))
# loop: body [Fn, n), with the head [0, Fn) dissolved over its last Fn frames
Fn = int(round(F * fps)); body = out[Fn:]
for i in range(Fn):
    t = (i + 1) / (Fn + 1); t = t * t * (3 - 2 * t)
    j = len(body) - Fn + i; body[j] = cv2.addWeighted(body[j], 1 - t, out[i], t, 0)
p = subprocess.Popen([FF, '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-maxrate', '2M', '-bufsize', '4M', '-pix_fmt', 'yuv420p', '-an', '-movflags', '+faststart', '-r', '30', '-vf', f'scale={OW}:{OH}:flags=lanczos', dst], stdin=subprocess.PIPE)
for f in body: p.stdin.write(f.tobytes())
p.stdin.close(); p.wait(); print('wrote', dst, len(body), 'frames', round(len(body) / fps, 2), 's')
