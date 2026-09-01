from __future__ import annotations

from argparse import ArgumentParser
import html
from os import name
import re
from dataclasses import dataclass, field
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import KeepTogether, ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

parser = ArgumentParser(
    prog=__name__,
)

parser.add_argument(
    "-i",
    "--input",
    type=str,
    default=True,
)
parser.add_argument(
    "-o",
    "--output",
    type=str,
    default=None,
)

parsed_args = parser.parse_args()

input_name = parsed_args.input
output_name = parsed_args.output or input_name

ROOT = Path(__file__).resolve().parent
SOURCE_PATH = ROOT / f"{input_name}.md"
OUTPUT_PATH = ROOT / f"{output_name}.pdf"

ACCENT = colors.HexColor("#6f2437")
ACCENT_DARK = colors.HexColor("#3b1822")
BODY = colors.HexColor("#20181b")
MUTED = colors.HexColor("#6b575d")
SOFT = colors.HexColor("#f6eeec")
LEAD_BG = colors.HexColor("#faf6f5")
RULE = colors.HexColor("#d8c1c7")

FONT_REGULAR = "Arial"
FONT_BOLD = "Arial-Bold"
FONT_SERIF = "Georgia"
FONT_SERIF_BOLD = "Georgia-Bold"
FONT_SERIF_ITALIC = "Georgia-Italic"


@dataclass
class Section:
    title: str
    blocks: list[tuple[str, object]] = field(default_factory=list)


def register_fonts() -> None:
    font_paths = {
        FONT_REGULAR: "/System/Library/Fonts/Supplemental/Arial.ttf",
        FONT_BOLD: "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        FONT_SERIF: "/System/Library/Fonts/Supplemental/Georgia.ttf",
        FONT_SERIF_BOLD: "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
        FONT_SERIF_ITALIC: "/System/Library/Fonts/Supplemental/Georgia Italic.ttf",
    }
    for name, path in font_paths.items():
        if name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(name, path))


def inline_markup(text: str) -> str:
    escaped = html.escape(text)
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", escaped)


def parse_markdown(path: Path) -> tuple[str, str | None, str | None, list[Section]]:
    title: str | None = None
    subtitle: str | None = None
    lead: str | None = None
    sections: list[Section] = []
    current: Section | None = None
    paragraph_lines: list[str] = []
    bullet_lines: list[str] = []

    def flush_paragraph() -> None:
        nonlocal paragraph_lines
        if current and paragraph_lines:
            text = " ".join(line.strip() for line in paragraph_lines).strip()
            if text:
                current.blocks.append(("paragraph", text))
        paragraph_lines = []

    def flush_bullets() -> None:
        nonlocal bullet_lines
        if current and bullet_lines:
            current.blocks.append(("bullets", bullet_lines[:]))
        bullet_lines = []

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()

        if stripped.startswith("# "):
            title = stripped[2:].strip()
            continue

        if title and subtitle is None and stripped.startswith("*") and stripped.endswith("*"):
            subtitle = stripped.strip("*").strip()
            continue

        if stripped.startswith("> "):
            lead = stripped[2:].strip()
            continue

        if stripped.startswith("## "):
            flush_paragraph()
            flush_bullets()
            current = Section(stripped[3:].strip())
            sections.append(current)
            continue

        if not stripped:
            flush_paragraph()
            flush_bullets()
            continue

        if stripped.startswith("- "):
            flush_paragraph()
            bullet_lines.append(stripped[2:].strip())
            continue

        paragraph_lines.append(stripped)

    flush_paragraph()
    flush_bullets()

    if not title:
        raise ValueError("O markdown precisa começar com um título H1.")

    return title, subtitle, lead, sections


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="ProposalTitle",
            parent=styles["Title"],
            fontName=FONT_SERIF_BOLD,
            fontSize=23,
            leading=26,
            textColor=ACCENT_DARK,
            alignment=TA_LEFT,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ProposalSubtitle",
            parent=styles["BodyText"],
            fontName=FONT_SERIF_ITALIC,
            fontSize=11,
            leading=14,
            textColor=MUTED,
            spaceAfter=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionHeading",
            parent=styles["Heading2"],
            fontName=FONT_SERIF_BOLD,
            fontSize=13,
            leading=15,
            textColor=ACCENT,
            spaceBefore=8,
            spaceAfter=5,
        )
    )
    styles.add(
        ParagraphStyle(
            name="ProposalBody",
            parent=styles["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=10.4,
            leading=14,
            textColor=BODY,
            alignment=TA_LEFT,
            spaceAfter=7,
        )
    )
    styles.add(
        ParagraphStyle(
            name="LeadText",
            parent=styles["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=10.5,
            leading=14.5,
            textColor=BODY,
            alignment=TA_LEFT,
            spaceAfter=0,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BulletText",
            parent=styles["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=10.2,
            leading=13.2,
            textColor=BODY,
            leftIndent=0,
            spaceAfter=0,
        )
    )
    styles.add(
        ParagraphStyle(
            name="InvestmentText",
            parent=styles["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=10.5,
            leading=14,
            textColor=BODY,
            alignment=TA_LEFT,
            spaceAfter=5,
        )
    )
    styles.add(
        ParagraphStyle(
            name="FooterText",
            parent=styles["BodyText"],
            fontName=FONT_REGULAR,
            fontSize=8.5,
            leading=10,
            textColor=MUTED,
            alignment=TA_CENTER,
        )
    )
    return styles


def build_bullet_list(items: list[str], styles) -> ListFlowable:
    list_items = [
        ListItem(Paragraph(inline_markup(item), styles["BulletText"])) for item in items
    ]
    return ListFlowable(
        list_items,
        bulletType="bullet",
        leftIndent=12,
        bulletFontName=FONT_BOLD,
        bulletFontSize=9,
        bulletColor=ACCENT,
        bulletDedent=6,
        spaceBefore=0,
        spaceAfter=5,
    )


def build_lead_box(text: str, styles) -> Table:
    paragraph = Paragraph(inline_markup(text), styles["LeadText"])
    table = Table([[paragraph]], colWidths=[16.2 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LEAD_BG),
                ("LINEBEFORE", (0, 0), (0, 0), 2.2, ACCENT),
                ("BOX", (0, 0), (-1, -1), 0.6, RULE),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return table


def build_investment_box(section: Section, styles):
    content = []
    for block_type, value in section.blocks:
        if block_type == "paragraph":
            content.append(Paragraph(inline_markup(value), styles["InvestmentText"]))
        elif block_type == "bullets":
            content.append(build_bullet_list(value, styles))
    inner = Table([[content]], colWidths=[16.2 * cm])
    inner.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SOFT),
                ("BOX", (0, 0), (-1, -1), 0.8, RULE),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return inner


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.5)
    canvas.line(doc.leftMargin, 1.55 * cm, A4[0] - doc.rightMargin, 1.55 * cm)
    canvas.setFont(FONT_REGULAR, 8.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(doc.leftMargin, 1.05 * cm, "Proposta resumida | Selo Libertária")
    canvas.drawRightString(A4[0] - doc.rightMargin, 1.05 * cm, f"Página {canvas.getPageNumber()}")
    canvas.restoreState()


def build_pdf() -> None:
    register_fonts()
    title, subtitle, lead, sections = parse_markdown(SOURCE_PATH)
    styles = build_styles()

    doc = SimpleDocTemplate(
        str(OUTPUT_PATH),
        pagesize=A4,
        leftMargin=1.9 * cm,
        rightMargin=1.9 * cm,
        topMargin=1.8 * cm,
        bottomMargin=2.1 * cm,
        title=title,
        author="Codex",
    )

    story = [
        Paragraph(html.escape(title), styles["ProposalTitle"]),
    ]
    if subtitle:
        story.append(Paragraph(html.escape(subtitle), styles["ProposalSubtitle"]))
    if lead:
        story.append(build_lead_box(lead, styles))
        story.append(Spacer(1, 0.35 * cm))

    for section in sections:
        story.append(Paragraph(html.escape(section.title), styles["SectionHeading"]))
        if section.title.lower() == "investimento":
            story.append(KeepTogether([build_investment_box(section, styles)]))
            continue

        for block_type, value in section.blocks:
            if block_type == "paragraph":
                story.append(Paragraph(inline_markup(value), styles["ProposalBody"]))
            elif block_type == "bullets":
                story.append(build_bullet_list(value, styles))

    doc.build(story, onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    build_pdf()
