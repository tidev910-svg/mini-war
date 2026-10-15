from PIL import Image
img = Image.open(r'D:\game\public\assets\spearman-reference.png.png').convert('RGBA')
print('size', img.size)
w, h = img.size
alpha = img.getchannel('A')
rows = []
for y in range(h):
    cnt = 0
    for x in range(w):
        if alpha.getpixel((x, y)) > 0:
            cnt += 1
    if cnt > 10:
        rows.append((y, cnt))
print('rows sample', rows[:12], 'total', len(rows))
# contiguous row bands
bands = []
start = prev = None
for y, cnt in rows:
    if start is None:
        start = prev = y
    elif y == prev + 1:
        prev = y
    else:
        bands.append((start, prev))
        start = prev = y
if start is not None:
    bands.append((start, prev))
print('row bands', bands)
cols = []
for x in range(w):
    cnt = 0
    for y in range(h):
        if alpha.getpixel((x, y)) > 0:
            cnt += 1
    if cnt > 10:
        cols.append((x, cnt))
print('cols sample', cols[:12], 'total', len(cols))
cbands = []
start = prev = None
for x, cnt in cols:
    if start is None:
        start = prev = x
    elif x == prev + 1:
        prev = x
    else:
        cbands.append((start, prev))
        start = prev = x
if start is not None:
    cbands.append((start, prev))
print('col bands', cbands)

# Find average content bounds for each visible sprite cluster by thresholding alpha rows
# We assume the sheet contains horizontally distributed figures.
# Print the first 20 x spans with substantial content.
spans = []
for y in range(h):
    xs = []
    for x in range(w):
        if alpha.getpixel((x, y)) > 0:
            xs.append(x)
    if xs:
        spans.append((y, min(xs), max(xs)))
print('first 20 nonempty row spans', spans[:20])
