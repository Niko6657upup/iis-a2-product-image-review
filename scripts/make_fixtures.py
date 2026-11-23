"""Render the controlled product-image pairs from their case descriptions."""

import json
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


FIXTURES = Path(__file__).resolve().parents[1] / "fixtures"
FONT_DIR = Path("/System/Library/Fonts/Supplemental")
WIDTH, HEIGHT = 960, 720
PACKAGE = [(331, 144), (627, 144), (649, 178), (668, 566), (644, 622),
           (316, 622), (292, 568), (312, 178)]
INK = (30, 50, 47)


def font(name, size):
    return ImageFont.truetype(str(FONT_DIR / name), size)


def gradient(first, last, size, horizontal=False):
    axis = Image.linear_gradient("L")
    if horizontal:
        axis = axis.transpose(Image.Transpose.ROTATE_90)
    axis = axis.resize(size)
    return Image.composite(Image.new("RGB", size, last), Image.new("RGB", size, first), axis)


def scene(background, label, mark, lighting, label_size=40, label_font="Arial Bold.ttf", blur=0):
    size = (WIDTH, HEIGHT)
    table_edge = 490
    if background == "studio":
        wall_colors = ((190, 183, 173), (231, 225, 215))
        table_colors = ((174, 165, 154), (216, 206, 193))
    else:
        wall_colors = ((37, 65, 69), (102, 130, 130))
        table_colors = ((83, 115, 118), (46, 73, 78))
    image = Image.new("RGB", size)
    image.paste(gradient(*wall_colors, (WIDTH, table_edge)), (0, 0))
    image.paste(gradient(*table_colors, (WIDTH, HEIGHT - table_edge)), (0, table_edge))
    shadow = Image.new("L", size)
    ImageDraw.Draw(shadow).ellipse((235, 581, 731, 649), fill=140)
    image.paste((19, 29, 27), mask=shadow.filter(ImageFilter.GaussianBlur(16)))

    pouch = Image.new("L", size)
    ImageDraw.Draw(pouch).polygon(PACKAGE, fill=255)
    paper = gradient((177, 147, 111), (230, 206, 170), size, horizontal=True)
    if lighting == "warm":
        paper = Image.blend(paper, Image.new("RGB", size, (255, 191, 129)), 0.24)
    image.paste(paper, mask=pouch)
    draw = ImageDraw.Draw(image)
    draw.line([(333, 152), (625, 152)], fill=(152, 127, 100), width=2)
    draw.line([(322, 174), (637, 174)], fill=(232, 210, 180), width=3)
    draw.line([(313, 205), (300, 555), (324, 611)], fill=(159, 135, 106), width=2)
    draw.line([(644, 205), (659, 555), (636, 612)], fill=(157, 135, 108), width=2)
    draw.line([(326, 605), (634, 605)], fill=(162, 137, 110), width=2)

    card = (342, 223, 618, 575)
    draw.rounded_rectangle(card, radius=7, fill=(246, 234, 211), outline=(194, 171, 138), width=2)
    draw.ellipse((443, 247, 517, 321), fill=INK)
    mark_color = (246, 234, 211)
    if mark == "mountain":
        draw.line([(453, 298), (472, 272), (487, 291), (498, 280), (508, 298)],
                  fill=mark_color, width=4, joint="curve")
    else:
        draw.ellipse((463, 266, 499, 300), outline=mark_color, width=4)
        draw.line([(465, 305), (493, 273)], fill=mark_color, width=4)
    draw.text((480, 359), "ALDER TRACE", fill=INK, font=font("Georgia Bold.ttf", 29), anchor="mm")
    draw.text((480, 409), "GROUND COFFEE", fill=INK, font=font("Arial Bold.ttf", 20), anchor="mm")
    draw.line([(393, 448), (567, 448)], fill=(171, 150, 115), width=1)
    draw.text((480, 475), "NET WEIGHT", fill=INK, font=font("Arial.ttf", 15), anchor="mm")
    draw.text((480, 528), label, fill=INK, font=font(label_font, label_size), anchor="mm")
    if lighting == "glare":
        reflection = Image.new("L", size)
        ImageDraw.Draw(reflection).rounded_rectangle((399, 502, 562, 555), radius=14, fill=255)
        image.paste((255, 250, 228), mask=reflection.filter(ImageFilter.GaussianBlur(5)))
    if lighting == "warm":
        light = Image.new("L", size)
        ImageDraw.Draw(light).ellipse((303, 118, 728, 636), fill=100)
        light_mask = light.filter(ImageFilter.GaussianBlur(68))
        image.paste(Image.blend(image, Image.new("RGB", size, (255, 199, 131)), 0.27),
                    mask=light_mask)
    if blur:
        image = image.filter(ImageFilter.GaussianBlur(blur))
    grain = Image.frombytes("L", size, random.Random(10).randbytes(WIDTH * HEIGHT)).convert("RGB")
    return Image.blend(image, grain, 0.024)


def main():
    cases = json.loads((FIXTURES / "cases.json").read_text())
    for item in cases["candidates"]:
        image = scene(item["background"], item["label"], item["mark"], item["lighting"],
                      label_font=item.get("font", "Arial Bold.ttf"))
        image.save(FIXTURES / item["image"], quality=93, optimize=True)
    validation = json.loads((FIXTURES / "validation-cases.json").read_text())
    for item in validation["cases"]:
        image = scene("slate", item["visibleText"], "mountain", item.get("lighting", "standard"),
                      item.get("size", 40), item.get("font", "Arial Bold.ttf"), item.get("blur", 0))
        image.save(FIXTURES / item["image"], quality=93, optimize=True)


if __name__ == "__main__":
    main()
