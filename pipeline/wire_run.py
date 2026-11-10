#!/usr/bin/env python3
"""SOSI WIRE patcher. Stdlib only.

Merges new dispatches into data/wire.js:
  python3 pipeline/wire_run.py --wire data/wire.js --new new_items.json [--out data/wire.js]

- De-duplicates by URL (http) and by normalized headline. Zero new items is valid.
- Keeps every dispatch from the configured start date onward (no rolling pruning).
- Thumbnails live only in the newest FEED_WINDOW dispatches; older items lose their img.
- Stamps "updated" in Eastern Time.
Prints {"added":n,"total":n} on success. Never writes a partial file.
"""
import argparse, datetime, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CFG = json.load(open(os.path.join(HERE, 'wire_config.json'), encoding='utf-8'))
FEED_WINDOW = CFG.get('feed_window', 12)
HEAD = '/* SOSI WIRE dispatch store. Written by pipeline/wire_run.py; checked by pipeline/wire_gate.py. */\nwindow.WIRE = '


def load_wire(path):
    txt = open(path, encoding='utf-8').read()
    m = re.search(r'window\.WIRE\s*=\s*(\{.*\})\s*;\s*$', txt, re.S)
    if not m:
        sys.exit('FATAL: window.WIRE block not found in ' + path)
    return json.loads(m.group(1))


def norm_head(h):
    return re.sub(r'\s+', ' ', (h or '').strip().lower())


def item_date(it):
    try:
        return datetime.date.fromisoformat((it.get('iso') or '')[:10])
    except ValueError:
        return None


def sort_key(it):
    d = item_date(it)
    return (d.toordinal() if d else -1, it.get('time', ''))


def et_now():
    try:
        from zoneinfo import ZoneInfo
        return datetime.datetime.now(ZoneInfo('America/New_York'))
    except Exception:
        return datetime.datetime.utcnow() - datetime.timedelta(hours=5)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--wire', required=True)
    ap.add_argument('--new', required=True)
    ap.add_argument('--out')
    a = ap.parse_args()
    data = load_wire(a.wire)
    items = data.get('items', [])
    new = json.load(open(a.new, encoding='utf-8'))
    if isinstance(new, dict):
        new = new.get('items', [])
    urls = {(i.get('url') or '').strip() for i in items if (i.get('url') or '').startswith('http')}
    heads = {norm_head(i.get('headline')) for i in items}
    start = datetime.date.fromisoformat(CFG['start'])
    added = []
    for it in new:
        u = (it.get('url') or '').strip()
        h = norm_head(it.get('headline'))
        d = item_date(it)
        if (u.startswith('http') and u in urls) or h in heads or not d or d < start:
            continue
        it.setdefault('img', None)
        it.setdefault('time', '')
        it.setdefault('nodes', [])
        it.setdefault('threads', [])
        it['date'] = d.strftime('%m.%d')
        added.append(it)
        urls.add(u)
        heads.add(h)
    items = sorted(added + items, key=sort_key, reverse=True)
    for i, it in enumerate(items):
        if i >= FEED_WINDOW and it.get('img'):
            it['img'] = None
    data['items'] = items
    data['updated'] = et_now().isoformat(timespec='minutes')
    data['vectors'] = CFG['vectors']
    out = a.out or a.wire
    tmp = out + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        f.write(HEAD + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    os.replace(tmp, out)
    print(json.dumps({'added': len(added), 'total': len(items)}))


if __name__ == '__main__':
    main()
