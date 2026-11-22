#!/usr/bin/env python3
"""Sinh bộ khung hình cho pet "Mây" (một đám mây nhỏ) — 64×64, pixel art.

Chạy:  python3 generate.py [--out frames] [--preview preview.png]
Chỉ cần Pillow (không cần numpy).

Mỗi trạng thái là một APNG, tên tệp trùng tên trạng thái để
pet_theme_convert.py nhận ra: idle, thinking, working, done, error,
notification, sleeping, waking, roam, poke, tickle, drag.

Sửa màu ở PALETTE, sửa dáng ở in_body(), sửa nhịp ở ANIMS. Ảnh sinh ra là
của bạn: đổi tên nhân vật, màu, phụ kiện thoải mái.

Nhân vật "Bơ": quả bơ pixel, cùng bộ animation với Mây.
"""
import argparse
import os

from PIL import Image

W = H = 64

PALETTE = {
    'outline': (38, 58, 32, 255),
    'body': (110, 155, 78, 255),
    'shade': (86, 128, 60, 255),
    'blush': (255, 154, 174, 255),
    'eye': (28, 40, 24, 255),
    'accent': (255, 224, 138, 255),
    'warn': (232, 106, 106, 255),
    'spark': (255, 212, 121, 255),
}


def ellipse(x, y, cx, cy, rx, ry):
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0


def in_body(x, y):
    """Quả bơ: thân dưới tròn, cổ trên thon."""
    return (
        ellipse(x, y, 32, 40, 13, 12)
        or ellipse(x, y, 32, 30, 9, 10)
        or ellipse(x, y, 32, 24, 5, 5)
    )


def mask_for(shift_y, squash):
    """Mask thân, có thể nhún (squash 0..1) và dời theo trục y."""
    mask = [[False] * W for _ in range(H)]
    for y in range(H):
        for x in range(W):
            yy = y - shift_y
            if squash:
                yy = (yy - 47) / (1 - 0.22 * squash) + 47
                xx = (x - 32) / (1 + 0.10 * squash) + 32
            else:
                xx = x
            if in_body(xx, yy):
                mask[y][x] = True
    return mask


def neighbors(mask, x, y):
    return (
        mask[y - 1][x] if y > 0 else False,
        mask[y + 1][x] if y + 1 < H else False,
        mask[y][x - 1] if x > 0 else False,
        mask[y][x + 1] if x + 1 < W else False,
    )


def put(px, x, y, color):
    if 0 <= x < W and 0 <= y < H:
        px[x, y] = color


def rect(px, x, y, w, h, color):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            put(px, xx, yy, color)


def draw_eyes(px, kind, cy=32):
    for ex in (25, 36):
        if kind == 'open':
            rect(px, ex, cy, 3, 3, PALETTE['eye'])
            put(px, ex, cy, (255, 255, 255, 255))
        elif kind == 'up':
            rect(px, ex, cy - 1, 3, 3, PALETTE['eye'])
            put(px, ex, cy - 1, (255, 255, 255, 255))
        elif kind == 'closed':
            rect(px, ex, cy + 1, 3, 1, PALETTE['eye'])
        elif kind == 'happy':
            put(px, ex, cy + 2, PALETTE['eye'])
            put(px, ex + 1, cy + 1, PALETTE['eye'])
            put(px, ex + 2, cy, PALETTE['eye'])
            put(px, ex + 2, cy + 1, PALETTE['eye'])
        elif kind == 'x':
            for i in range(3):
                put(px, ex + i, cy + i, PALETTE['eye'])
                put(px, ex + 2 - i, cy + i, PALETTE['eye'])


def draw_mouth(px, kind, cy=39):
    cx = 32
    if kind == 'smile':
        put(px, cx - 1, cy, PALETTE['eye'])
        put(px, cx, cy + 1, PALETTE['eye'])
        put(px, cx + 1, cy, PALETTE['eye'])
    elif kind == 'open':
        rect(px, cx - 1, cy, 3, 2, PALETTE['eye'])
        put(px, cx, cy + 1, (255, 160, 170, 255))
    elif kind == 'flat':
        rect(px, cx - 1, cy + 1, 3, 1, PALETTE['eye'])


def draw_blush(px, cy=37):
    rect(px, 20, cy, 3, 1, PALETTE['blush'])
    rect(px, 41, cy, 3, 1, PALETTE['blush'])


def draw_feet(px, lift=(0, 0)):
    rect(px, 26, 46 - lift[0], 4, 3, PALETTE['outline'])
    rect(px, 34, 46 - lift[1], 4, 3, PALETTE['outline'])
    rect(px, 27, 46 - lift[0], 2, 1, PALETTE['body'])
    rect(px, 35, 46 - lift[1], 2, 1, PALETTE['body'])


def glyph(px, kind, x, y):
    """Phụ kiện nhỏ phía trên: ! ? z hoặc lấp lánh."""
    c = {'!': PALETTE['warn'], '?': PALETTE['accent'], 'z': PALETTE['accent'],
         'star': PALETTE['spark']}[kind]
    if kind == '!':
        rect(px, x, y, 2, 4, c)
        put(px, x, y + 5, c)
    elif kind == '?':
        rect(px, x, y, 3, 1, c)
        put(px, x + 2, y + 1, c)
        put(px, x + 1, y + 2, c)
        put(px, x + 1, y + 4, c)
    elif kind == 'z':
        rect(px, x, y, 3, 1, c)
        put(px, x + 1, y + 1, c)
        put(px, x, y + 2, c)
        rect(px, x, y + 3, 3, 1, c)
    elif kind == 'star':
        put(px, x + 1, y, c)
        put(px, x, y + 1, c)
        put(px, x + 1, y + 1, (255, 255, 255, 255))
        put(px, x + 2, y + 1, c)
        put(px, x + 1, y + 2, c)


def frame(dy=0, dx=0, squash=0.0, eyes='open', mouth='smile', feet=(0, 0), acc=None):
    """Vẽ một khung 64×64."""
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    px = img.load()
    mask = mask_for(dy, squash)
    for y in range(H):
        for x in range(W):
            if not mask[y][x]:
                continue
            up, down, left, right = neighbors(mask, x, y)
            if up and down and left and right:
                px[x, y] = PALETTE['shade'] if (y > 43 and x > 33) else PALETTE['body']
            else:
                px[x, y] = PALETTE['outline']
    draw_blush(px)
    draw_eyes(px, eyes, cy=32 + dy)
    draw_mouth(px, mouth, cy=39 + dy)
    if acc:
        glyph(px, acc[0], acc[1], acc[2])
    if dx:
        shifted = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        shifted.paste(img, (dx, 0))
        img = shifted
    return img


ANIMS = {
    'idle': ([frame(), frame(), frame(dy=-1), frame(dy=-1, eyes='closed'),
              frame(dy=0), frame(dy=0, acc=('star', 46, 18))],
             [420, 420, 420, 140, 380, 300]),
    'thinking': ([frame(eyes='up', mouth='flat', acc=('?', 47, 16)),
                  frame(dy=-1, eyes='up', mouth='flat', acc=('?', 48, 15)),
                  frame(eyes='up', mouth='flat', acc=('?', 47, 17)),
                  frame(dy=-1, eyes='up', mouth='flat')],
                 [320, 320, 320, 320]),
    'working': ([frame(dy=0, mouth='open', feet=(0, 1)),
                 frame(dy=1, mouth='open', feet=(1, 0)),
                 frame(dy=0, mouth='open', feet=(0, 1)),
                 frame(dy=1, mouth='open', feet=(1, 0))],
                [150, 150, 150, 150]),
    'done': ([frame(dy=-2, eyes='happy', mouth='open', acc=('star', 46, 16)),
              frame(dy=-5, eyes='happy', mouth='open', acc=('star', 47, 12)),
              frame(dy=-3, eyes='happy', mouth='open', acc=('star', 48, 15)),
              frame(dy=0, eyes='happy', mouth='open'),
              frame(dy=-1, eyes='happy', mouth='open', acc=('star', 45, 17)),
              frame(dy=0, eyes='happy', mouth='open')],
             [120, 160, 140, 220, 300, 260]),
    'error': ([frame(dx=-1, eyes='x', mouth='flat', acc=('!', 47, 14)),
               frame(dx=1, eyes='x', mouth='flat', acc=('!', 47, 15)),
               frame(dx=-1, eyes='x', mouth='flat', acc=('!', 47, 14)),
               frame(dx=0, eyes='x', mouth='flat', acc=('!', 47, 15))],
              [120, 120, 120, 220]),
    'notification': ([frame(dy=-3, mouth='open', acc=('!', 47, 15)),
                      frame(dy=-1, mouth='open'),
                      frame(dy=-3, mouth='open', acc=('!', 47, 15)),
                      frame(dy=0, mouth='open')],
                     [160, 140, 160, 240]),
    'sleeping': ([frame(dy=1, eyes='closed', mouth='flat', acc=('z', 47, 18)),
                  frame(dy=2, eyes='closed', mouth='flat', acc=('z', 49, 14)),
                  frame(dy=1, eyes='closed', mouth='flat', acc=('z', 50, 11)),
                  frame(dy=2, eyes='closed', mouth='flat')],
                 [900, 900, 900, 900]),
    'waking': ([frame(dy=1, eyes='closed', mouth='flat'),
                frame(mouth='open'),
                frame(dy=-1, eyes='happy', mouth='open', acc=('star', 46, 17)),
                frame(dy=0, mouth='smile')],
               [200, 180, 220, 900]),
    'roam': ([frame(feet=(1, 0)), frame(dy=-1, feet=(0, 1)),
              frame(feet=(1, 0)), frame(dy=-1, feet=(0, 1))],
             [140, 140, 140, 140]),
    'poke': ([frame(squash=0.8, eyes='closed', mouth='open'),
              frame(squash=0.4, eyes='happy', mouth='open'),
              frame(eyes='happy')],
             [110, 130, 260]),
    'tickle': ([frame(dx=-1, eyes='happy', mouth='open'),
                frame(dx=1, dy=-1, eyes='happy', mouth='open'),
                frame(dx=-1, eyes='happy', mouth='open'),
                frame(dx=1, dy=-1, eyes='happy', mouth='open')],
               [110, 110, 110, 160]),
    'drag': ([frame(dy=-1, mouth='flat'), frame(dy=-2, squash=0.15, mouth='flat')],
             [200, 200]),
}


def save_apng(path, frames, durs):
    frames[0].save(path, format='PNG', save_all=True, append_images=frames[1:],
                   duration=durs, loop=0, disposal=1, blend=0)


def contact_sheet(path, scale=3):
    names = list(ANIMS)
    cols = max(len(ANIMS[n][0]) for n in names)
    sheet = Image.new('RGBA', (cols * W + 16, len(names) * H + 16), (247, 249, 252, 255))
    for row, name in enumerate(names):
        frames = ANIMS[name][0]
        for col in range(cols):
            sheet.alpha_composite(frames[col % len(frames)], (8 + col * W, 8 + row * H))
    sheet.resize((sheet.width * scale, sheet.height * scale), Image.NEAREST).save(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frames'))
    ap.add_argument('--preview', default=None, help='ảnh xem trước (contact sheet)')
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    for name, (frames, durs) in ANIMS.items():
        save_apng(os.path.join(args.out, name + '.png'), frames, durs)
        print('wrote', name + '.png', len(frames), 'frames')
    if args.preview:
        contact_sheet(args.preview)


if __name__ == '__main__':
    main()
