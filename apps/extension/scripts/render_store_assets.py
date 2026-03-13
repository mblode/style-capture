#!/usr/bin/env python3

from pathlib import Path
from typing import Union
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "store" / "generated"

C = {
    "accent": "#d46c2f",
    "accent_soft": "#f6d8c3",
    "bg": "#f6f0e5",
    "card": "#fffdf8",
    "code": "#221911",
    "ink": "#1d1710",
    "line": "#d8cdbf",
    "mint": "#3b7a6b",
    "mint_soft": "#d8ece6",
    "muted": "#64594e",
    "soft": "#fff7ed",
    "white": "#ffffff",
}

FONT_PATHS = {
    "regular": "/System/Library/Fonts/Supplemental/Arial.ttf",
    "bold": "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "mono": "/System/Library/Fonts/Menlo.ttc",
}


def load_font(kind: str, size: int) -> Union[ImageFont.FreeTypeFont, ImageFont.ImageFont]:
    path = FONT_PATHS[kind]
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def wrap_text(text: str, max_chars: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if len(candidate) > max_chars and current:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def draw_lines(draw: ImageDraw.ImageDraw, x: int, y: int, lines: list[str], font, fill: str, step: int):
    for index, line in enumerate(lines):
        draw.text((x, y + index * step), line, fill=fill, font=font)


def roundrect(draw: ImageDraw.ImageDraw, box, radius: int, fill: str, outline=None, width: int = 1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_chip(draw: ImageDraw.ImageDraw, x: int, y: int, label: str, fill: str = C["white"], stroke: str = C["line"], text_fill: str = C["ink"]):
    font = load_font("bold", 13)
    bbox = draw.textbbox((0, 0), label, font=font)
    width = max(90, (bbox[2] - bbox[0]) + 28)
    roundrect(draw, (x, y, x + width, y + 34), 17, fill, stroke, 1)
    draw.text((x + 14, y + 9), label, fill=text_fill, font=font)


def base_canvas(width: int, height: int) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGB", (width, height), C["bg"])
    draw = ImageDraw.Draw(image)
    draw.ellipse((10, -4, 242, 228), fill=C["accent_soft"])
    draw.ellipse((width - 208, 0, width - 32, 176), fill=C["mint_soft"])
    return image, draw


def draw_browser_chrome(draw: ImageDraw.ImageDraw, x: int, y: int, width: int, height: int, address: str, badge: str):
    roundrect(draw, (x, y, x + width, y + height), 28, C["card"], C["line"], 1)
    roundrect(draw, (x, y, x + width, y + 68), 28, "#fff9f2", C["line"], 1)
    for index in range(3):
        cx = x + 28 + index * 16
        draw.ellipse((cx - 5, y + 29, cx + 5, y + 39), fill="#cfc3b4")
    roundrect(draw, (x + 92, y + 18, x + width - 228, y + 50), 16, "#f2ebe1", "#e4d9c8", 1)
    draw.text((x + 110, y + 23), address, fill=C["muted"], font=load_font("regular", 14))
    roundrect(draw, (x + width - 198, y + 16, x + width - 28, y + 52), 18, C["mint_soft"], "#b5d7ce", 1)
    draw.text((x + width - 182, y + 24), badge, fill=C["mint"], font=load_font("bold", 13))


def render_screenshot(title: str, headline: list[str], badge: str, overlay: str, code_lines: list[str], side_title: str, side_body: str) -> Image.Image:
    image, draw = base_canvas(1280, 800)
    draw_browser_chrome(draw, 34, 34, 1212, 730, "https://example.com/live-ui", badge)

    roundrect(draw, (58, 120, 762, 730), 26, C["white"], C["line"], 1)
    roundrect(draw, (786, 120, 1196, 730), 26, C["code"], None, 1)
    roundrect(draw, (88, 162, 226, 194), 16, "#fff4ea", "#f2d4bd", 1)
    draw.text((104, 170), "STYLE CAPTURE", fill=C["accent"], font=load_font("bold", 12))
    draw.text((88, 220), title, fill=C["accent"], font=load_font("bold", 14))
    draw_lines(draw, 88, 280, headline, load_font("bold", 48), C["ink"], 54)
    draw_lines(
        draw,
        88,
        392,
        wrap_text(
            "Capture the rendered result and copy a Claude-ready export without broad permissions.",
            30,
        ),
        load_font("regular", 18),
        C["muted"],
        22,
    )

    roundrect(draw, (90, 548, 480, 718), 24, C["soft"], C["line"], 1)
    draw.text((116, 586), "Pricing card", fill=C["ink"], font=load_font("bold", 30))
    draw_lines(
        draw,
        116,
        624,
        wrap_text("Live layout, spacing, shadows, and typography read from the actual page output.", 39),
        load_font("regular", 15),
        C["muted"],
        20,
    )
    roundrect(draw, (116, 670, 256, 708), 19, C["accent"], None, 1)
    draw.text((141, 679), "Start trial", fill=C["white"], font=load_font("bold", 14))
    roundrect(draw, (270, 670, 420, 708), 19, C["white"], C["line"], 1)
    draw.text((296, 679), "Compare plans", fill=C["ink"], font=load_font("bold", 14))
    roundrect(draw, (102, 578, 467, 706), 24, C["accent_soft"], C["accent"], 3)
    roundrect(draw, (142, 502, 392, 544), 21, C["white"], C["line"], 1)
    draw.text((160, 514), overlay, fill=C["ink"], font=load_font("bold", 13))

    roundrect(draw, (848, 122, 1196, 614), 26, C["code"], None, 1)
    roundrect(draw, (870, 142, 1026, 170), 14, "#4e4034", None, 1)
    draw.text((888, 149), "CLIPBOARD OUTPUT", fill="#e7d8c5", font=load_font("bold", 12))
    draw_lines(draw, 874, 190, code_lines, load_font("mono", 15), "#f4eadc", 22)

    roundrect(draw, (848, 596, 1196, 724), 24, C["card"], C["line"], 1)
    draw.text((876, 632), side_title, fill=C["ink"], font=load_font("bold", 24))
    draw_lines(draw, 876, 666, wrap_text(side_body, 22), load_font("regular", 14), C["muted"], 18)
    return image


def draw_setting_row(draw: ImageDraw.ImageDraw, title: str, description: str, y: int, checked: bool):
    roundrect(draw, (88, y, 780, y + 82), 22, "#fff9f1", C["line"], 1)
    draw.text((116, y + 16), title, fill=C["ink"], font=load_font("bold", 24))
    draw.text((116, y + 42), description, fill=C["muted"], font=load_font("regular", 15))
    fill = C["accent_soft"] if checked else "#e7ded2"
    stroke = "#e9ba9f" if checked else C["line"]
    roundrect(draw, (698, y + 23, 754, y + 57), 17, fill, stroke, 1)
    knob_x = 721 if checked else 705
    draw.ellipse((knob_x, y + 27, knob_x + 26, y + 53), fill=C["white"])


def draw_info_card(draw: ImageDraw.ImageDraw, x: int, y: int, title: str, body: str):
    roundrect(draw, (x, y, x + 316, y + 146), 24, C["card"], C["line"], 1)
    draw.text((x + 24, y + 18), title, fill=C["ink"], font=load_font("bold", 24))
    draw_lines(draw, x + 24, y + 58, wrap_text(body, 28), load_font("regular", 15), C["muted"], 20)


def render_settings() -> Image.Image:
    image, draw = base_canvas(1280, 800)
    draw_browser_chrome(draw, 34, 34, 1212, 730, "chrome-extension://style-capture/options.html", "Options page")
    roundrect(draw, (58, 120, 810, 738), 28, C["card"], C["line"], 1)
    for top in (120, 330, 540):
        roundrect(draw, (842, top, 1214, top + 188), 28, C["card"], C["line"], 1)
    roundrect(draw, (86, 152, 204, 182), 15, "#fff4ea", "#f2d4bd", 1)
    draw.text((104, 160), "SETTINGS", fill=C["accent"], font=load_font("bold", 12))
    draw.text((86, 220), "Tune capture defaults.", fill=C["ink"], font=load_font("bold", 46))
    draw_lines(
        draw,
        88,
        276,
        wrap_text(
            "Start lean with curated capture, then opt into pseudo-elements or hidden descendants only when you need the extra detail.",
            44,
        ),
        load_font("regular", 18),
        C["muted"],
        22,
    )
    draw_setting_row(draw, "Curated capture", "Prefer spacing, color, typography, and layout signals", 382, True)
    draw_setting_row(draw, "Pseudo-elements", "Include ::before and ::after when meaningful", 486, True)
    draw_setting_row(draw, "Hidden elements", "Capture hidden descendants only when you really need them", 590, False)
    draw_info_card(draw, 870, 150, "Predictable workflow", "Settings stay local and only affect how much detail the next capture includes.")
    draw_info_card(draw, 870, 360, "Good defaults", "Curated mode is the best default for most Tailwind conversion work.")
    draw_info_card(draw, 870, 570, "No account setup", "No sign-in required. Install, click, capture, paste.")
    return image


def render_small_tile() -> Image.Image:
    image, draw = base_canvas(440, 280)
    roundrect(draw, (18, 18, 422, 262), 28, "#fff8ee", C["line"], 1)
    roundrect(draw, (42, 42, 160, 70), 14, "#fff4ea", "#f2d4bd", 1)
    draw.text((58, 50), "STYLE CAPTURE", fill=C["accent"], font=load_font("bold", 11))
    draw_lines(draw, 42, 120, ["Capture live CSS."], load_font("bold", 24), C["ink"], 28)
    draw_lines(
        draw,
        42,
        164,
        wrap_text("Select a subtree and paste a Claude-ready export.", 16),
        load_font("regular", 13),
        C["muted"],
        15,
    )
    draw_chip(draw, 42, 218, "Local only")
    draw_chip(draw, 150, 218, "Tailwind hints")
    roundrect(draw, (272, 98, 396, 216), 20, C["white"], C["line"], 1)
    roundrect(draw, (272, 98, 396, 124), 20, "#fff9f2", C["line"], 1)
    for index in range(3):
      cx = 288 + index * 11
      draw.ellipse((cx - 3, 108, cx + 3, 114), fill="#cfc3b4")
    roundrect(draw, (288, 138, 380, 200), 16, C["accent_soft"], C["accent"], 2)
    return image


def render_marquee() -> Image.Image:
    image, draw = base_canvas(1400, 560)
    roundrect(draw, (24, 24, 1376, 536), 32, "#fff8ee", C["line"], 1)
    roundrect(draw, (60, 60, 192, 90), 15, "#fff4ea", "#f2d4bd", 1)
    draw.text((78, 68), "STYLE CAPTURE", fill=C["accent"], font=load_font("bold", 12))
    draw_lines(draw, 60, 152, ["Computed CSS", "from the live page."], load_font("bold", 74), C["ink"], 78)
    draw_lines(
        draw,
        64,
        280,
        wrap_text(
            "Capture a DOM subtree, keep sanitized HTML and computed styles as ground truth, then paste a Claude-ready export with Tailwind hints.",
            36,
        ),
        load_font("regular", 24),
        C["muted"],
        28,
    )
    draw_chip(draw, 62, 396, "Local-only processing")
    draw_chip(draw, 258, 396, "Clipboard-first flow")
    draw_chip(draw, 442, 396, "No persistent host permissions")

    draw_browser_chrome(draw, 700, 84, 656, 392, "https://example.com/card", "Copied prompt to clipboard")
    roundrect(draw, (728, 168, 1020, 416), 24, C["white"], C["line"], 1)
    roundrect(draw, (1040, 168, 1328, 416), 24, C["code"], None, 1)
    roundrect(draw, (756, 198, 864, 224), 13, "#fff4ea", "#f2d4bd", 1)
    draw.text((772, 204), "SELECTION", fill=C["accent"], font=load_font("bold", 11))
    draw.text((756, 250), "Hero card", fill=C["ink"], font=load_font("bold", 34))
    draw_lines(
        draw,
        756,
        292,
        wrap_text("Live layout, spacing, color, and typography captured after one click.", 26),
        load_font("regular", 18),
        C["muted"],
        22,
    )
    roundrect(draw, (748, 236, 1004, 380), 22, C["accent_soft"], C["accent"], 2)
    draw_lines(
        draw,
        1060,
        220,
        [
            "<tailwind_hints>",
            "0=rounded-[20px] px-8 py-7",
            "1=text-[2rem] tracking-[-0.05em]",
            "2=inline-flex items-center gap-3",
            "</tailwind_hints>",
        ],
        load_font("mono", 15),
        "#f4eadc",
        22,
    )
    return image


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    jobs = [
        (
            "screenshot-1-capture.png",
            render_screenshot(
                title="Live page selection",
                headline=["Pick the exact", "subtree you want."],
                badge="Toolbar click starts capture",
                overlay="section.pricing > article.card",
                code_lines=[
                    '<style_capture url="https://example.com/pricing"',
                    'mode="curated" root_ref="0">',
                    "",
                    '[data-lc="0"] {',
                    "  display: grid;",
                    "  gap: 24px;",
                    "  padding: 32px;",
                    "  border-radius: 20px;",
                    "}",
                    "</style_capture>",
                ],
                side_title="Why it works",
                side_body="Computed styles come from the live page, not guessed CSS.",
            ),
        ),
        (
            "screenshot-2-export.png",
            render_screenshot(
                title="Structured export",
                headline=["CSS truth,", "Tailwind hints."],
                badge="Copied prompt to clipboard",
                overlay="Prompt exported locally",
                code_lines=[
                    '<style_capture url="https://example.com/hero"',
                    'mode="curated" root_ref="0">',
                    "<tailwind_hints>",
                    "0=rounded-[20px] px-8 py-7",
                    "1=text-[2rem] tracking-[-0.05em]",
                    "2=inline-flex items-center gap-3",
                    "</tailwind_hints>",
                    "",
                    "<open_questions>",
                    "0: Confirm responsive width intent.",
                ],
                side_title="Clipboard-first flow",
                side_body="HTML and computed CSS stay grounded in the live page while mapping hints speed up recreation.",
            ),
        ),
        ("screenshot-3-settings.png", render_settings()),
        ("small-promo-tile.png", render_small_tile()),
        ("marquee-promo-tile.png", render_marquee()),
    ]

    for name, image in jobs:
        target = OUTPUT_DIR / name
        image.save(target, format="PNG")
        print(f"Rendered {target}")


if __name__ == "__main__":
    main()
