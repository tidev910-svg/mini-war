"""Build public/assets/units/spearman/spearman-sheet.png (4 columns x 16 rows, 256px cells) from the painted motion sheet.

Row = team*8 + direction*2 + anim, with
  team:      0 blue, 1 red (red is recoloured from blue)
  direction: 0 down (SOUTH), 1 left (WEST), 2 up (NORTH), 3 right (EAST)
  anim:      0 idle, 1 walk
This must match SPEARMAN_DIRECTIONS / the spearman branch of drawUnit() in src/main.ts.

Usage (from repo root):
  python -I tools/build_spearman_sheet.py art/units/spearman/source/spearman-motion-4dir.png public/assets/units/spearman/spearman-sheet.png [preview_dir]
"""
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

SRC, OUT = sys.argv[1], sys.argv[2]
PREVIEW = sys.argv[3] if len(sys.argv) > 3 else None
CELL = 256
FOOT_Y = 0.90      # drawUnit() anchors the cell at u.y - height*.90
BODY_FRAC = 0.64   # helmet-top-to-feet height as a fraction of the cell

src = Image.open(SRC).convert('RGBA')

# Source layout: one block per direction, idle row and walk row above the 0-3 frame labels.
ANIM_ROWS = {'idle': (95, 318), 'walk': (372, 618)}
DIRECTIONS = {  # x centres of the frame labels under each block
    'down': [153, 240, 325, 413],
    'left': [509, 596, 680, 765],
    'up': [849, 932, 1016, 1098],
    'right': [1190, 1280, 1369, 1455],
}
DIRECTION_ORDER = ['down', 'left', 'up', 'right']
HALF_W = 72


def grow(mask, seed):
    """Flood-fill `seed` inside `mask` (4-connected) using repeated dilation."""
    region = seed & mask
    while True:
        d = region.copy()
        d[1:] |= region[:-1]; d[:-1] |= region[1:]
        d[:, 1:] |= region[:, :-1]; d[:, :-1] |= region[:, 1:]
        d &= mask
        if (d == region).all():
            return region
        region = d


def dilate(mask, n):
    for _ in range(n):
        d = mask.copy()
        d[1:] |= mask[:-1]; d[:-1] |= mask[1:]; d[:, 1:] |= mask[:, :-1]; d[:, :-1] |= mask[:, 1:]
        mask = d
    return mask


def extract(cx, y0, y1):
    """Cut one figure: keep only the solid region connected to its torso, plus a soft edge."""
    x0 = cx - HALF_W
    win = np.array(src.crop((x0, y0, cx + HALF_W, y1)))
    solid = win[:, :, 3] > 200
    h = solid.shape[0]
    seed = np.zeros_like(solid)
    seed[int(h * .45):int(h * .75), HALF_W - 10:HALF_W + 10] = True
    body = grow(solid, seed)
    win[:, :, 3] = np.where(dilate(body, 3), win[:, :, 3], 0)
    img = Image.fromarray(win, 'RGBA')
    return img.crop(img.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox())


def body_metrics(img):
    """Return (helmet_top, feet_bottom, centre_x); the narrow spear shaft is ignored for the top."""
    a = np.array(img)[:, :, 3] > 40
    widths = a.sum(axis=1)
    top = np.where(widths > 18)[0][0]
    bottom = np.where(widths > 0)[0][-1]
    # Centre on the lower body (legs/torso) so a spear held out to one side does not shift the anchor.
    lower = a[top + (bottom - top) // 3:bottom + 1]
    return top, bottom, float(np.median(np.where(lower)[1]))


def to_red(img):
    """Recolour blue cloth/plume/shield/cape to the red used by the other red units."""
    arr = np.array(img).astype(np.float32) / 255.0
    rgb, alpha = arr[:, :, :3], arr[:, :, 3:]
    hsv = np.array(Image.fromarray((rgb * 255).astype(np.uint8)).convert('HSV')).astype(np.float32)
    h, s, v = hsv[:, :, 0] * 360 / 255, hsv[:, :, 1] / 255, hsv[:, :, 2] / 255
    blue = (h > 195) & (h < 275) & (s > 0.28)
    w = np.clip((s - 0.28) / 0.15, 0, 1) * blue  # soft blend avoids a blue fringe
    nh = np.where(blue, 359.0, h)
    nv = np.where(blue, np.clip(v * 0.98, 0, 1), v)
    ns = np.where(blue, np.clip(s * 1.12 + 0.05, 0, 1), s)
    red = np.stack([nh / 360 * 255, ns * 255, nv * 255], axis=2).astype(np.uint8)
    red_rgb = np.array(Image.fromarray(red, 'HSV').convert('RGB')).astype(np.float32) / 255
    out = rgb * (1 - w[:, :, None]) + red_rgb * w[:, :, None]
    return Image.fromarray((np.concatenate([out, alpha], axis=2) * 255).astype(np.uint8), 'RGBA')


frames = {(d, anim): [extract(cx, *ANIM_ROWS[anim]) for cx in DIRECTIONS[d]]
          for d in DIRECTION_ORDER for anim in ANIM_ROWS}
metrics = {k: [body_metrics(f) for f in fs] for k, fs in frames.items()}
scale = BODY_FRAC * CELL / float(np.median([b - t for ms in metrics.values() for t, b, _ in ms]))

shadow = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
ImageDraw.Draw(shadow).ellipse((CELL * .30, CELL * FOOT_Y - 10, CELL * .70, CELL * FOOT_Y + 9), fill=(20, 14, 8, 120))
shadow = shadow.filter(ImageFilter.GaussianBlur(5))

sheet = Image.new('RGBA', (CELL * 4, CELL * 16), (0, 0, 0, 0))
for team in (0, 1):
    for di, d in enumerate(DIRECTION_ORDER):
        for ai, anim in enumerate(ANIM_ROWS):
            row = team * 8 + di * 2 + ai
            for col, (img, (top, bottom, cx)) in enumerate(zip(frames[(d, anim)], metrics[(d, anim)])):
                if team == 1:
                    img = to_red(img)
                scaled = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
                cell = shadow.copy()
                px, py = round(CELL / 2 - cx * scale), round(CELL * FOOT_Y - bottom * scale)
                cell.alpha_composite(scaled, (max(0, px), max(0, py)), (max(0, -px), max(0, -py)))
                sheet.alpha_composite(cell, (col * CELL, row * CELL))

sheet.save(OUT, optimize=True)
print('scale', round(scale, 3), 'saved', OUT, sheet.size)

if PREVIEW:
    bg = Image.new('RGBA', sheet.size, (122, 178, 98, 255))
    bg.alpha_composite(sheet)
    # Side-by-side halves (blue | red) so the preview stays readable.
    half = bg.convert('RGB')
    prev = Image.new('RGB', (CELL * 8, CELL * 8))
    prev.paste(half.crop((0, 0, CELL * 4, CELL * 8)), (0, 0))
    prev.paste(half.crop((0, CELL * 8, CELL * 4, CELL * 16)), (CELL * 4, 0))
    prev.resize((CELL * 4, CELL * 4)).save(PREVIEW + '/preview_v4.png')
