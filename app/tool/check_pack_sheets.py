import json, glob, os, sys

bad = []
for meta in glob.glob('app/assets/pets/*/pack.json'):
    d = os.path.dirname(meta)
    data = json.load(open(meta))
    for name, anim in data.get('animations', {}).items():
        sheet = anim.get('sheet') if isinstance(anim, dict) else None
        if sheet and not os.path.exists(os.path.join(d, sheet)):
            bad.append(f'{d}/{sheet}')
if bad:
    print('missing sheets:', bad)
    sys.exit(1)
print('all pack sheets present')
