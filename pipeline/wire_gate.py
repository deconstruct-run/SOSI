#!/usr/bin/env python3
"""SOSI WIRE hard verify gate. Stdlib only.

  python3 pipeline/wire_gate.py --wire data/wire.js --case data/case.js [--strict-urls]

Checks every dispatch: schema, vector and pattern tags, system id, node and
thread ids against the case map, date window, headline length, the read-line
opener, banned terms, duplicate URLs and headlines, and the image window.
Exit 0 = pass, exit 1 = fail (prints each failure). Run before every commit.
"""
import argparse, datetime, json, os, re, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CFG = json.load(open(os.path.join(HERE, 'wire_config.json'), encoding='utf-8'))
REQ = ['iso', 'date', 'source', 'tier', 'tags', 'headline', 'read', 'url']


def load_js(path, var):
    txt = open(path, encoding='utf-8').read()
    m = re.search(r'window\.' + var + r'\s*=\s*(\{.*\})\s*;?\s*$', txt, re.S)
    if not m:
        sys.exit('FATAL: window.%s not found in %s' % (var, path))
    return json.loads(m.group(1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--wire', required=True)
    ap.add_argument('--case', required=True)
    ap.add_argument('--strict-urls', action='store_true', help='HEAD-check every URL (slow)')
    a = ap.parse_args()
    wire = load_js(a.wire, 'WIRE')
    case = load_js(a.case, 'CASE')
    ids = {n['id'] for n in case['nodes']}
    systems = {x['id'] for x in case.get('systems', [])}
    threads = {str(t['id']) for t in case['threads']}
    vectors = set(CFG['vectors'])
    patterns = set(CFG['patterns'])
    tiers = set(CFG['tiers'])
    start = datetime.date.fromisoformat(CFG['start'])
    today = datetime.date.today() + datetime.timedelta(days=1)
    banned = [b.lower() for b in CFG['banned']]
    opener = CFG['read_opener']
    errs = []
    seen_u, seen_h = {}, {}
    items = wire.get('items', [])
    prev = None
    for i, it in enumerate(items):
        tag = '#%d %s' % (i, (it.get('headline') or '')[:60])
        for k in REQ:
            if not it.get(k):
                errs.append(tag + ': missing ' + k)
        try:
            d = datetime.date.fromisoformat(it.get('iso', '')[:10])
            if d < start or d > today:
                errs.append(tag + ': iso outside window ' + it['iso'])
            if it.get('date') != d.strftime('%m.%d'):
                errs.append(tag + ': date does not match iso')
            if prev and d > prev:
                errs.append(tag + ': out of order (newest first)')
            prev = d
        except ValueError:
            errs.append(tag + ': bad iso')
        t = it.get('tags') or []
        if len(t) < 3:
            errs.append(tag + ': tags need [vector, pattern, system]')
        else:
            if t[0] not in vectors: errs.append(tag + ': unknown vector ' + t[0])
            if t[1] not in patterns: errs.append(tag + ': unknown pattern ' + t[1])
            if systems and t[2] not in systems: errs.append(tag + ': unknown system ' + t[2])
        if it.get('tier') not in tiers:
            errs.append(tag + ': bad tier')
        if len(it.get('headline', '')) > 200:
            errs.append(tag + ': headline over 200 characters')
        if not (it.get('read') or '').startswith(opener):
            errs.append(tag + ': read must open "' + opener.strip() + '"')
        for n in it.get('nodes', []):
            if n not in ids: errs.append(tag + ': unknown node ' + n)
        for th in it.get('threads', []):
            if str(th) not in threads: errs.append(tag + ': unknown thread ' + str(th))
        blob = ' ' + ' '.join(str(it.get(k, '')) for k in ('headline', 'read', 'source', 'url')).lower() + ' '
        for b in banned:
            if b in blob: errs.append(tag + ': banned term "' + b.strip() + '"')
        if '—' in it.get('headline', '') + it.get('read', ''):
            errs.append(tag + ': em dash')
        u = (it.get('url') or '').strip()
        if not u.startswith('https://') and not u.startswith('http://'):
            errs.append(tag + ': url is not http(s)')
        if u in seen_u: errs.append(tag + ': duplicate url of #%d' % seen_u[u])
        seen_u[u] = i
        h = re.sub(r'\s+', ' ', it.get('headline', '').lower().strip())
        if h in seen_h: errs.append(tag + ': duplicate headline of #%d' % seen_h[h])
        seen_h[h] = i
        if i >= CFG.get('feed_window', 12) and it.get('img'):
            errs.append(tag + ': image outside the feed window')
        if a.strict_urls and u.startswith('http'):
            try:
                req = urllib.request.Request(u, method='HEAD', headers={'User-Agent': 'Mozilla/5.0 SOSI-WIRE-gate'})
                urllib.request.urlopen(req, timeout=15)
            except urllib.error.HTTPError as e:
                if e.code in (404, 410): errs.append(tag + ': url %d' % e.code)
            except Exception:
                pass
    if errs:
        print('GATE FAIL (%d)' % len(errs))
        for e in errs: print('  ' + e)
        sys.exit(1)
    print('GATE PASS: %d dispatches' % len(items))


if __name__ == '__main__':
    main()
