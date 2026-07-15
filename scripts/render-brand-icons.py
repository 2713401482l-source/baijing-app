from pathlib import Path
from math import cos, pi, sin

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SIZE = 1024
SCALE = SIZE / 512


def point(cx: float, cy: float, radius: float, degrees: float) -> tuple[float, float]:
    angle = degrees * pi / 180
    return cx + radius * cos(angle), cy + radius * sin(angle)


def rounded_arc(draw: ImageDraw.ImageDraw, box, start, end, color, width):
    draw.arc(box, start=start, end=end, fill=color, width=width)
    cx = (box[0] + box[2]) / 2
    cy = (box[1] + box[3]) / 2
    radius = (box[2] - box[0]) / 2
    cap = width / 2
    for degrees in (start, end):
        x, y = point(cx, cy, radius, degrees)
        draw.ellipse((x - cap, y - cap, x + cap, y + cap), fill=color)


def scaled(values):
    return tuple(value * SCALE for value in values)


image = Image.new("RGB", (SIZE, SIZE), "#171817")
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((0, 0, SIZE - 1, SIZE - 1), radius=112 * SCALE, fill="#171817")

cx = cy = 256 * SCALE
draw.ellipse(scaled((110, 110, 402, 402)), fill="#20211F")
draw.arc(scaled((86, 86, 426, 426)), start=40, end=382, fill="#E8E4DC", width=round(28 * SCALE))
rounded_arc(draw, scaled((152, 152, 360, 360)), 128, 387.2, "#4C4D49", round(22 * SCALE))

draw.ellipse(scaled((317, 310, 357, 350)), fill="#C96955")

for size, filename in ((512, "icon-512.png"), (192, "icon-192.png"), (180, "apple-touch-icon.png")):
    image.resize((size, size), Image.Resampling.LANCZOS).save(PUBLIC / filename, optimize=True)

print("Rendered 微定 icon assets: 512, 192, 180")
