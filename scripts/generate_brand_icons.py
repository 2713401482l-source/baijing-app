from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "public"
SCALE = 4


def cubic(p0, p1, p2, p3, steps=72):
    points = []
    for index in range(steps + 1):
        t = index / steps
        u = 1 - t
        points.append((
            u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
            u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
        ))
    return points


def scaled(points, factor):
    return [(round(x * factor), round(y * factor)) for x, y in points]


def draw_icon(size, filename):
    canvas = size * SCALE
    factor = canvas / 512
    image = Image.new("RGB", (canvas, canvas), "#171817")
    draw = ImageDraw.Draw(image)
    radius = round(112 * factor)
    draw.rounded_rectangle((0, 0, canvas - 1, canvas - 1), radius=radius, fill="#171817")
    draw.ellipse(tuple(round(value * factor) for value in (92, 92, 420, 420)), fill="#20211f")

    outer = cubic((142, 342), (94, 229), (157, 103), (278, 92))[:-1]
    outer += cubic((278, 92), (372, 84), (439, 159), (423, 252))
    inner = cubic((355, 226), (337, 156), (251, 135), (197, 182))[:-1]
    inner += cubic((197, 182), (149, 224), (164, 308), (222, 336))
    rest = cubic((142, 342), (155, 373), (179, 399), (210, 416))

    draw.line(scaled(outer, factor), fill="#E8E4DC", width=round(30 * factor), joint="curve")
    draw.line(scaled(inner, factor), fill="#0E0F0E", width=round(40 * factor), joint="curve")
    draw.line(scaled(rest, factor), fill="#555650", width=round(30 * factor), joint="curve")
    node = tuple(round(value * factor) for value in (198, 312, 246, 360))
    draw.ellipse(node, fill="#C96955")

    image.resize((size, size), Image.Resampling.LANCZOS).save(ROOT / filename, optimize=True)


draw_icon(192, "icon-192.png")
draw_icon(512, "icon-512.png")
draw_icon(180, "apple-touch-icon.png")
