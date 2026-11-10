#!/usr/bin/env python3
"""Best-effort thumbnails for the SOSI WIRE feed. Stdlib + Pillow.

  python3 pipeline/wire_thumbs.py data/wire.js [--n 12]

For the newest N dispatches with an http url and no img, pull the source's
og:image (or twitter:image), cover-crop to 150x116, save as a small WEBP and
embed it as a data URI. Any failure leaves img null; the feed then shows the
system-tinted schematic. Rewrites data/wire.js atomically.
"""
import argparse, base64, io, json, os, re, sys, urllib.parse, urllib.request

UA = {'User-Agent': 'Mozilla/5.0 (compatible; SOSI-WIRE/1.0)'}
HEAD = '/* SOSI WIRE dispatch store. Written by pipeline/wire_run.py; checked by pipeline/wire_gate.py. */\nwindow.WIRE = '


def _get(url, timeout=15, maxbytes=6_000_000):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(maxbytes), r.geturl()


def og_image(page_url):
    html, final = _get(page_url)
    txt = html.decode('utf-8', 'ignore')
    for pat in [r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)',
                r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
                r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)']:
        m = re.search(pat, txt, re.I)
        if m:
            return urllib.parse.urljoin(final, m.group(1).replace('&amp;', '&'))
    return None


def make_thumb(img_url, w=150, h=116):
    from PIL import Image
    raw, _ = _get(img_url)
    im = Image.open(io.BytesIO(raw)).convert('RGB')
    tr, ir = w / h, im.width / im.height
    if ir > tr:
        nw = int(im.height * tr); x = (im.width - nw) // 2; im = im.crop((x, 0, x + nw, im.height))
    else:
        nh = int(im.width / tr); y = (im.height - nh) // 2; im = im.crop((0, y, im.width, y + nh))
    im = im.resize((w, h), Image.LANCZOS)
    buf = io.BytesIO(); im.save(buf, 'WEBP', quality=72, method=4)
    return 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('wire')
    ap.add_argument('--n', type=int, default=12)
    a = ap.parse_args()
    txt = open(a.wire, encoding='utf-8').read()
    data = json.loads(re.search(r'window\.WIRE\s*=\s*(\{.*\})\s*;\s*$', txt, re.S).group(1))
    got = 0
    for it in data['items'][:a.n]:
        u = (it.get('url') or '').strip()
        if it.get('img') or not u.startswith('http'):
            continue
        try:
            oi = og_image(u)
            if oi:
                it['img'] = make_thumb(oi); got += 1
        except Exception as e:
            sys.stderr.write('skip %s (%s)\n' % (u[:60], str(e)[:50]))
    tmp = a.wire + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        f.write(HEAD + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    os.replace(tmp, a.wire)
    print(json.dumps({'thumbs': got}))


if __name__ == '__main__':
    main()
