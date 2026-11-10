#!/usr/bin/env python3
"""Build the SOSI WIRE collection lists from the case map. Stdlib only.

  python3 pipeline/wire_monitors.py --case data/case.js --wire data/wire.js --out <dir>

Writes, for every vector, monitors_<vector>.txt (one entity per line:
id | name | ticker | system | tier), plus systems.txt, threads.txt,
all_ids.txt, held_urls.txt and held_headlines.txt (for dedup against the
dispatches already filed). Every entity on the map lands in exactly one
vector by its system's column; upstream-band entities also land in upstream.
"""
import argparse, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
CFG = json.load(open(os.path.join(HERE, 'wire_config.json'), encoding='utf-8'))
COLS = {
    'capital-state': ['state', 'capital', 'rails', 'insurance', 'allied'],
    'control': ['operating', 'models', 'agentic', 'primes'],
    'operations': ['autonomy', 'space', 'stratosphere', 'gulf', 'latam', 'cyber'],
    'infrastructure': ['compute', 'silicon', 'power', 'minerals', 'quantum'],
    'health-biotech': ['healthdata', 'biodefense', 'bodynet', 'pharma'],
}


def load(path, var):
    txt = open(path, encoding='utf-8').read()
    return json.loads(re.search(r'window\.' + var + r'\s*=\s*(\{.*\})\s*;?\s*$', txt, re.S).group(1))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--case', required=True)
    ap.add_argument('--wire', required=True)
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    case = load(a.case, 'CASE')
    wire = load(a.wire, 'WIRE')
    sys_name = {s['id']: s['name'] for s in case['systems']}
    placed = {s for v in COLS.values() for s in v}
    for s in sys_name:
        if s not in placed:
            COLS['capital-state'].append(s)
    lists = {v: [] for v in CFG['vectors']}
    for n in case['nodes']:
        line = '%s | %s | %s | %s | %s' % (n['id'], n['n'], n.get('tk') or '', n['s'], n.get('t', ''))
        for v, ss in COLS.items():
            if n['s'] in ss:
                lists[v].append(line)
        if n.get('U'):
            lists['upstream'].append(line)
    for v, ls in lists.items():
        open(os.path.join(a.out, 'monitors_%s.txt' % v), 'w', encoding='utf-8').write('\n'.join(ls) + '\n')
    open(os.path.join(a.out, 'systems.txt'), 'w', encoding='utf-8').write(
        '\n'.join('%s | %s | %s' % (v, s, sys_name.get(s, s)) for v, ss in COLS.items() for s in ss) + '\n')
    open(os.path.join(a.out, 'threads.txt'), 'w', encoding='utf-8').write(
        '\n'.join('%s | %s' % (t['id'], t['name']) for t in case['threads']) + '\n')
    open(os.path.join(a.out, 'all_ids.txt'), 'w', encoding='utf-8').write('\n'.join(n['id'] for n in case['nodes']) + '\n')
    items = wire.get('items', [])
    open(os.path.join(a.out, 'held_urls.txt'), 'w', encoding='utf-8').write('\n'.join(i.get('url', '') for i in items) + '\n')
    open(os.path.join(a.out, 'held_headlines.txt'), 'w', encoding='utf-8').write('\n'.join(i.get('headline', '') for i in items) + '\n')
    print(json.dumps({v: len(ls) for v, ls in lists.items()}))


if __name__ == '__main__':
    main()
