"""Contact sheets: many frames in one grid, so a whole film can be checked at a glance.
    python contact.py card                 -> build/contact_card.png (the card, 24 moments)
    python contact.py renders/stills       -> build/contact_stills.png (every picture there)
Each frame is labelled with its number and second.
"""
import glob
import os
import sys

from PIL import Image, ImageDraw, ImageFont

import timeline as T


def sheet(paths, out, cols=6, tile_w=420, bg=(11, 16, 48)):
    first = Image.open(paths[0])
    tile_h = round(tile_w * first.height / first.width)
    rows = (len(paths) + cols - 1) // cols
    img = Image.new('RGB', (cols * tile_w, rows * (tile_h + 30)), bg)
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-SemiBold.otf', 18)
    except OSError:
        font = ImageFont.load_default()
    for i, p in enumerate(paths):
        im = Image.open(p).convert('RGBA')
        im.thumbnail((tile_w, tile_h), Image.LANCZOS)
        x, y = (i % cols) * tile_w, (i // cols) * (tile_h + 30)
        tile = Image.new('RGBA', (tile_w, tile_h), bg + (255,))
        tile.alpha_composite(im)
        img.paste(tile.convert('RGB'), (x, y + 30))
        n = int(''.join(c for c in os.path.basename(p) if c.isdigit()) or 0)
        d.text((x + 8, y + 5), 'frame %d  ·  %.1f s' % (n, (n - 1) / T.FPS), fill=(200, 210, 235), font=font)
    img.save(out)
    print('wrote', os.path.relpath(out, T.HERE), '(%d frames)' % len(paths))


if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'card'
    if what == 'card':
        # Just before and a few frames into each event, then the end.
        frames = [1]
        for at in T.CARD_EVENTS.values():
            frames += [at - 1, at + 3, at + 12]
        frames += [T.FRAMES - 60, T.FRAMES]
        paths = [os.path.join(T.BUILD, 'card', 'c_%04d.png' % n) for n in sorted(set(frames))]
        sheet(paths, os.path.join(T.BUILD, 'contact_card.png'), cols=5, tile_w=520)
    else:
        paths = sorted(glob.glob(os.path.join(T.HERE, what, '*.png')))
        sheet(paths, os.path.join(T.BUILD, 'contact_%s.png' % os.path.basename(what.rstrip('/'))))
