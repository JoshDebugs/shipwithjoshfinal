import sys
try:
    from PIL import Image
    import numpy as np
except ImportError:
    print("pip install pillow numpy")
    sys.exit(1)

img = Image.open('/Users/josh/.gemini/antigravity/brain/d3707720-b31f-4bad-9806-6053c097ff81/.user_uploaded/media_1790419399687.png')
img = img.convert('RGB')
w, h = img.size

# Sample at 20%, 40%, 60%, 80% height down the middle
samples = [
    (w//2, int(h*0.25)),
    (w//2, int(h*0.5)),
    (w//2, int(h*0.65)),
    (w//2, int(h*0.8))
]

colors = []
for x, y in samples:
    r, g, b = img.getpixel((x, y))
    colors.append(f"#{r:02x}{g:02x}{b:02x}")

print(colors)
