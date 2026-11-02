#!/usr/bin/env bash
# Fails if any tracked text file contains invisible or bidi Unicode characters.
# Ignore paths/globs via .hidden-unicode-ignore (one per line, # comments).
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
exec python3 - <<'PY'
import fnmatch, re, subprocess, sys
bad = re.compile('[\u200B-\u200D\u2060\uFEFF\u202A-\u202E\u2066-\u2069\u00AD]')
ignore = []
try:
    for l in open('.hidden-unicode-ignore', encoding='utf-8'):
        l = l.strip()
        if l and not l.startswith('#'):
            ignore.append(l)
except FileNotFoundError:
    pass
files = subprocess.run(['git', 'ls-files', '-z'], capture_output=True, check=True).stdout.decode().split('\0')
hits = 0
for f in filter(None, files):
    if any(fnmatch.fnmatch(f, p) for p in ignore):
        continue
    try:
        data = open(f, 'rb').read()
    except (IsADirectoryError, FileNotFoundError):
        continue
    if b'\0' in data[:8192]:
        continue  # binary
    text = data.decode('utf-8', errors='replace')
    for n, line in enumerate(text.splitlines(), 1):
        for m in bad.finditer(line):
            if n == 1 and m.start() == 0 and m.group() == '\uFEFF':
                continue  # leading BOM allowed
            print(f'{f}:{n}:U+{ord(m.group()):04X}')
            hits += 1
if hits:
    print(f'{hits} hidden/bidi Unicode character(s) found.', file=sys.stderr)
    sys.exit(1)
print('No hidden/bidi Unicode characters found.')
PY
