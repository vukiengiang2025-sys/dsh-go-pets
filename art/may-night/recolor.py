from PIL import Image
import glob, os, json, shutil

src = '/root/workspace/dsh-go-pets/app/assets/pets/may'
dst = '/root/workspace/dsh-go-pets/app/assets/pets/may-night'
os.makedirs(dst, exist_ok=True)
BODY = (58, 74, 116)
SHADE = (42, 53, 87)
for path in sorted(glob.glob(src + '/*.png')):
    im = Image.open(path).convert('RGBA')
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if r > 200 and g > 200 and b > 200:
                px[x, y] = BODY + (a,)
            elif r > 165 and g > 175 and b > 195:
                px[x, y] = SHADE + (a,)
    im.save(os.path.join(dst, os.path.basename(path)))

meta = json.load(open(os.path.join(src, 'pack.json')))
meta['id'] = 'may-night'
meta['name'] = 'Mây Đêm'
meta['author'] = 'Vũ Huỳnh'
meta['license'] = 'CC-BY-4.0'
json.dump(meta, open(os.path.join(dst, 'pack.json'), 'w'), ensure_ascii=False, indent=2)
open(os.path.join(dst, 'pack.json'), 'a').write('\n')
print('sheets', len(glob.glob(dst + '/*.png')))
