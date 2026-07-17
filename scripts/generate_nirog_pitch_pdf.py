from pathlib import Path
import sys
import textwrap

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".pdf_deps"))

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.colors import HexColor, Color, white
from reportlab.pdfbase.acroform import AcroForm


OUT = ROOT / "output" / "pdf" / "Nirog_Care_Platform_Team_Pitch.pdf"
W, H = landscape(A4)


# Nirog "Quiet Glass" palette, adapted from theme/theme.ts.
BG = HexColor("#F4F5F7")
INK = HexColor("#1D1D1F")
GRAY = HexColor("#6E6E73")
GRAY3 = HexColor("#AEAEB2")
BLUE = HexColor("#0A84FF")
LBLUE = HexColor("#5AC8FA")
GREEN = HexColor("#34C759")
AMBER = HexColor("#FF9500")
RED = HexColor("#FF3B30")
INDIGO = HexColor("#5E5CE6")
PURPLE = HexColor("#BF5AF2")
HAIR = HexColor("#E3E4E8")
PANEL = HexColor("#FFFFFF")
SOFT_BLUE = HexColor("#EAF4FF")
SOFT_GREEN = HexColor("#EAF8EE")
SOFT_AMBER = HexColor("#FFF5E6")
SOFT_RED = HexColor("#FFEEEC")
SOFT_PURPLE = HexColor("#F4EEFF")

M = 42
HEADER_Y = H - 38


def register_fonts():
    fonts = Path("C:/Windows/Fonts")
    regular = fonts / "segoeui.ttf"
    semibold = fonts / "seguisb.ttf"
    bold = fonts / "segoeuib.ttf"
    light = fonts / "segoeuil.ttf"
    if regular.exists():
        pdfmetrics.registerFont(TTFont("Nirog", str(regular)))
        pdfmetrics.registerFont(TTFont("NirogBold", str(bold if bold.exists() else regular)))
        pdfmetrics.registerFont(TTFont("NirogLight", str(light if light.exists() else regular)))
        pdfmetrics.registerFont(TTFont("NirogSemi", str(semibold if semibold.exists() else bold)))
    else:
        pdfmetrics.registerFont(TTFont("Nirog", str(fonts / "arial.ttf")))
        pdfmetrics.registerFont(TTFont("NirogBold", str(fonts / "arialbd.ttf")))
        pdfmetrics.registerFont(TTFont("NirogLight", str(fonts / "arial.ttf")))
        pdfmetrics.registerFont(TTFont("NirogSemi", str(fonts / "arialbd.ttf")))


register_fonts()


def rounded(c, x, y, w, h, radius=18, fill=PANEL, stroke=HAIR, sw=0.8):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(sw)
    c.roundRect(x, y, w, h, radius, stroke=1, fill=1)


def line(c, x1, y1, x2, y2, color=HAIR, width=1):
    c.setStrokeColor(color)
    c.setLineWidth(width)
    c.line(x1, y1, x2, y2)


def txt(c, text, x, y, size=11, color=INK, font="Nirog", align="left"):
    c.setFont(font, size)
    c.setFillColor(color)
    if align == "center":
        c.drawCentredString(x, y, text)
    elif align == "right":
        c.drawRightString(x, y, text)
    else:
        c.drawString(x, y, text)


def fit_lines(text, width, size, font="Nirog"):
    words = text.split()
    lines, current = [], ""
    for word in words:
        candidate = word if not current else current + " " + word
        if pdfmetrics.stringWidth(candidate, font, size) <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def paragraph(c, text, x, y, width, size=11, leading=None, color=GRAY, font="Nirog", max_lines=None):
    leading = leading or size * 1.38
    lines = fit_lines(text, width, size, font)
    if max_lines:
        lines = lines[:max_lines]
    for i, value in enumerate(lines):
        txt(c, value, x, y - i * leading, size, color, font)
    return y - len(lines) * leading


def label(c, text, x, y, color=BLUE):
    txt(c, text.upper(), x, y, 8.5, color, "NirogSemi")


def pill(c, text, x, y, fill=SOFT_BLUE, color=BLUE, w=None):
    w = w or pdfmetrics.stringWidth(text, "NirogSemi", 9) + 22
    c.setFillColor(fill)
    c.roundRect(x, y, w, 24, 12, stroke=0, fill=1)
    txt(c, text, x + w / 2, y + 7.5, 9, color, "NirogSemi", "center")
    return w


def dot(c, x, y, color=BLUE, r=3):
    c.setFillColor(color)
    c.circle(x, y, r, stroke=0, fill=1)


def bullet(c, text, x, y, width, color=BLUE, size=10.3):
    dot(c, x + 3, y + 4, color, 2.5)
    return paragraph(c, text, x + 14, y, width - 14, size=size, color=GRAY)


def metric(c, x, y, w, value, caption, accent=BLUE):
    rounded(c, x, y, w, 74, 16, PANEL)
    txt(c, value, x + 16, y + 36, 24, INK, "NirogBold")
    txt(c, caption, x + 16, y + 17, 9, GRAY, "Nirog")
    c.setFillColor(accent)
    c.roundRect(x + 16, y + 56, 28, 4, 2, stroke=0, fill=1)


def section_title(c, kicker, title, subtitle=None):
    label(c, kicker, M, H - 70)
    txt(c, title, M, H - 113, 30, INK, "NirogBold")
    if subtitle:
        paragraph(c, subtitle, M, H - 138, W - 2 * M, 11.5, color=GRAY, max_lines=2)


def base_page(c, page_no, page_title, show_home=True):
    c.setFillColor(BG)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    txt(c, "NIROG", M, HEADER_Y, 10, INK, "NirogBold")
    dot(c, M + 42, HEADER_Y + 4, BLUE, 3.3)
    txt(c, page_title.upper(), M + 56, HEADER_Y, 8.3, GRAY3, "NirogSemi")
    if show_home:
        rounded(c, W - M - 76, HEADER_Y - 8, 76, 25, 12, PANEL, HAIR)
        txt(c, "OVERVIEW", W - M - 38, HEADER_Y, 8, GRAY, "NirogSemi", "center")
        c.linkRect("", "page_2", (W - M - 76, HEADER_Y - 8, W - M, HEADER_Y + 17), relative=0, thickness=0)
    line(c, M, 30, W - M, 30, HAIR, 0.6)
    txt(c, "Nirog Care Platform", M, 17, 8, GRAY3, "Nirog")
    txt(c, f"{page_no:02d} / 14", W - M, 17, 8, GRAY3, "NirogSemi", "right")
    c.bookmarkPage(f"page_{page_no}")


def outline(c, title, page_no, level=0):
    c.addOutlineEntry(title, f"page_{page_no}", level=level, closed=False)


def arrow(c, x1, y, x2, color=GRAY3):
    line(c, x1, y, x2, y, color, 1.4)
    c.setFillColor(color)
    p = c.beginPath()
    p.moveTo(x2, y)
    p.lineTo(x2 - 7, y + 4)
    p.lineTo(x2 - 7, y - 4)
    p.close()
    c.drawPath(p, stroke=0, fill=1)


def field(c, name, x, y, w, h=28, value="", multiline=False, font_size=9.5):
    flags = 4096 if multiline else 0
    c.acroForm.textfield(
        name=name,
        value=value,
        x=x,
        y=y,
        width=w,
        height=h,
        fontName="Helvetica",
        fontSize=font_size,
        textColor=INK,
        fillColor=white,
        borderColor=HAIR,
        borderWidth=0.8,
        borderStyle="solid",
        forceBorder=True,
        fieldFlags=flags,
    )


def checkbox(c, name, x, y, checked=False, size=14):
    c.acroForm.checkbox(
        name=name,
        x=x,
        y=y,
        buttonStyle="check",
        borderColor=HAIR,
        fillColor=white,
        textColor=BLUE,
        checked=checked,
        size=size,
        forceBorder=True,
    )


def add_url(c, label_text, url, x, y, width=None, size=9.5):
    txt(c, label_text, x, y, size, BLUE, "NirogSemi")
    width = width or pdfmetrics.stringWidth(label_text, "NirogSemi", size)
    c.linkURL(url, (x, y - 3, x + width, y + size + 2), relative=0, thickness=0)


def page_1(c):
    base_page(c, 1, "Team pitch", show_home=False)
    outline(c, "Nirog Care Platform", 1)
    # Calm diagnostic halo.
    for r, color in [(145, Color(0.04, 0.52, 1, alpha=0.06)), (112, Color(0.04, 0.52, 1, alpha=0.09)), (76, Color(0.04, 0.52, 1, alpha=0.13))]:
        c.setFillColor(color)
        c.circle(W - 170, H / 2 + 12, r, stroke=0, fill=1)
    c.setStrokeColor(BLUE)
    c.setLineWidth(2)
    c.circle(W - 170, H / 2 + 12, 58, stroke=1, fill=0)
    c.setFillColor(PANEL)
    c.circle(W - 170, H / 2 + 12, 46, stroke=0, fill=1)
    c.setStrokeColor(BLUE)
    c.setLineWidth(4)
    c.line(W - 188, H / 2 + 12, W - 176, H / 2 + 12)
    c.line(W - 170, H / 2 - 6, W - 170, H / 2 + 30)
    c.line(W - 164, H / 2 + 12, W - 152, H / 2 + 12)

    label(c, "PRODUCT STRATEGY + TEAM WORKSHOP", M, H - 112)
    txt(c, "From health prototype", M, H - 172, 39, INK, "NirogBold")
    txt(c, "to continuous care platform", M, H - 216, 39, BLUE, "NirogBold")
    paragraph(c, "A practical proposal for patient identity, a responsive doctor portal, consent-driven records, and a safe path to real telehealth.", M, H - 255, 500, 14, leading=21, color=GRAY)

    pill(c, "INTERACTIVE PDF", M, 92, SOFT_BLUE, BLUE)
    pill(c, "JULY 2026", M + 132, 92, PANEL, GRAY)
    txt(c, "Prepared for the Nirog product and engineering team", M, 67, 9.5, GRAY, "Nirog")


def page_2(c):
    base_page(c, 2, "Overview", show_home=False)
    outline(c, "Overview and decision", 2)
    section_title(c, "THE CONVERSATION", "One pitch. One decision.", "Use pages 03-10 to align on the product, then complete the interactive decision pages together.")

    items = [
        (3, "Starting point", "What the current Expo prototype proves"),
        (4, "North star", "The connected care loop"),
        (5, "Two surfaces", "Patient mobile + doctor web"),
        (6, "Patient journey", "Low-friction identity and family care"),
        (7, "Doctor workspace", "Responsive clinical operations"),
        (8, "Trust architecture", "Identity, consent, data and ARIA"),
        (9, "Safety baseline", "Security, privacy and clinical controls"),
        (10, "Rural advantage", "What makes Nirog meaningfully different"),
        (11, "Delivery roadmap", "Build foundations before scale"),
        (12, "Team decision", "Vote, decide and document"),
        (13, "Action plan", "Assign owners and surface risks"),
        (14, "Evidence", "Repository and standards references"),
    ]
    x0, y0 = M, H - 196
    col_w, row_h = (W - 2 * M - 18) / 2, 47
    for i, (page, title, sub) in enumerate(items):
        col = i % 2
        row = i // 2
        x = x0 + col * (col_w + 18)
        y = y0 - row * (row_h + 8)
        rounded(c, x, y - 34, col_w, 45, 13, PANEL)
        c.setFillColor(SOFT_BLUE if page in (12, 13) else BG)
        c.circle(x + 23, y - 11, 13, stroke=0, fill=1)
        txt(c, f"{page:02d}", x + 23, y - 15, 8.5, BLUE if page in (12, 13) else GRAY, "NirogSemi", "center")
        txt(c, title, x + 46, y - 8, 11, INK, "NirogSemi")
        txt(c, sub, x + 46, y - 24, 8.5, GRAY, "Nirog")
        c.linkRect("", f"page_{page}", (x, y - 34, x + col_w, y + 11), relative=0, thickness=0)


def page_3(c):
    base_page(c, 3, "Starting point")
    outline(c, "Starting point", 3)
    section_title(c, "WHAT WE ALREADY HAVE", "The prototype proves the care journey", "The opportunity is to replace isolated demos with identity, persistence, consent and accountable clinical workflows.")

    cards = [
        ("5", "patient modules", "ARIA, doctors, shop, locker, home", BLUE),
        ("1", "AI intake service", "Bedrock-backed ARIA + handover", PURPLE),
        ("0", "production identities", "patient and doctor data are simulated", RED),
        ("1", "missing foundation", "trusted shared backend", AMBER),
    ]
    cw = (W - 2 * M - 36) / 4
    for i, (value, cap, sub, accent) in enumerate(cards):
        x = M + i * (cw + 12)
        rounded(c, x, H - 278, cw, 108, 18, PANEL)
        txt(c, value, x + 16, H - 216, 28, accent, "NirogBold")
        txt(c, cap, x + 16, H - 242, 10.5, INK, "NirogSemi")
        paragraph(c, sub, x + 16, H - 259, cw - 32, 8.5, color=GRAY, max_lines=2)

    rounded(c, M, 68, W - 2 * M, 185, 22, PANEL)
    label(c, "CURRENT STATE -> PRODUCT STATE", M + 22, 225)
    left_x, right_x = M + 24, W / 2 + 28
    txt(c, "Today", left_x, 196, 18, INK, "NirogBold")
    txt(c, "Next", right_x, 196, 18, BLUE, "NirogBold")
    current = ["Hard-coded patient and family profiles", "Local handover storage", "Demo calls and prescriptions", "ARIA without app user context"]
    future = ["Verified accounts and care relationships", "Server-side longitudinal health record", "Real encounters and clinician sign-off", "Authenticated, consent-aware ARIA"]
    for i, text in enumerate(current):
        bullet(c, text, left_x, 167 - i * 28, 300, GRAY3, 9.5)
    for i, text in enumerate(future):
        bullet(c, text, right_x, 167 - i * 28, 300, BLUE, 9.5)
    line(c, W / 2, 88, W / 2, 207, HAIR, 1)


def page_4(c):
    base_page(c, 4, "North star")
    outline(c, "North star care loop", 4)
    section_title(c, "THE PRODUCT IDEA", "Make every interaction part of one care episode", "Login is valuable only when it creates continuity across intake, clinical care, treatment and follow-up.")

    steps = [
        ("01", "ARIA intake", "voice + symptoms", PURPLE),
        ("02", "Doctor review", "summary + red flags", BLUE),
        ("03", "Consult", "audio, video, chat", GREEN),
        ("04", "Care plan", "notes + prescription", AMBER),
        ("05", "Fulfilment", "medicines + tests", INDIGO),
        ("06", "Follow-up", "locker + reminders", RED),
    ]
    total_w = W - 2 * M
    gap = 12
    sw = (total_w - gap * 5) / 6
    y = 246
    for i, (num, title, sub, accent) in enumerate(steps):
        x = M + i * (sw + gap)
        rounded(c, x, y, sw, 120, 18, PANEL)
        c.setFillColor(accent)
        c.circle(x + 24, y + 91, 12, stroke=0, fill=1)
        txt(c, num, x + 24, y + 87, 7.5, white, "NirogBold", "center")
        txt(c, title, x + 14, y + 58, 11, INK, "NirogSemi")
        paragraph(c, sub, x + 14, y + 40, sw - 28, 8.5, color=GRAY, max_lines=2)
        if i < len(steps) - 1:
            arrow(c, x + sw + 2, y + 60, x + sw + gap - 2, GRAY3)

    rounded(c, M + 96, 92, W - 2 * M - 192, 98, 24, INK, INK)
    label(c, "NORTH STAR METRIC", M + 122, 161, LBLUE)
    txt(c, "Resolved care episodes", M + 122, 128, 27, white, "NirogBold")
    txt(c, "not logins, screens or AI messages", W - M - 122, 131, 11, HexColor("#B9C0CC"), "Nirog", "right")


def page_5(c):
    base_page(c, 5, "Two product surfaces")
    outline(c, "Two product surfaces", 5)
    section_title(c, "PRODUCT SHAPE", "One platform. Two purpose-built experiences.", "Share identity, records and API contracts. Do not force patient and clinician work into the same interface.")

    gap = 20
    cw = (W - 2 * M - gap) / 2
    y, h = 94, 350
    for x, title, tag, accent, soft, bullets in [
        (M, "Patient mobile", "EXISTING EXPO APP", BLUE, SOFT_BLUE, ["Voice-first and low-bandwidth", "Family and caregiver profiles", "Bookings, records and follow-up", "Guest access for emergency essentials"]),
        (M + cw + gap, "Doctor web", "NEW RESPONSIVE PORTAL", GREEN, SOFT_GREEN, ["Queue and appointment operations", "Patient chart + ARIA handover", "Consultation notes and prescribing", "Desktop, tablet and mobile browser"]),
    ]:
        rounded(c, x, y, cw, h, 24, PANEL)
        c.setFillColor(soft)
        c.roundRect(x + 18, y + h - 92, cw - 36, 72, 18, stroke=0, fill=1)
        label(c, tag, x + 36, y + h - 49, accent)
        txt(c, title, x + 36, y + h - 76, 24, INK, "NirogBold")
        yy = y + h - 132
        for b in bullets:
            yy = bullet(c, b, x + 30, yy, cw - 60, accent, 10.5) - 10
        line(c, x + 30, y + 76, x + cw - 30, y + 76, HAIR, 1)
        txt(c, "Shared", x + 30, y + 50, 9, GRAY3, "NirogSemi")
        txt(c, "identity + consent + records + clinical events", x + 80, y + 50, 9, INK, "NirogSemi")


def page_6(c):
    base_page(c, 6, "Patient journey")
    outline(c, "Patient identity and journey", 6)
    section_title(c, "PATIENT EXPERIENCE", "Low-friction login without blocking care", "Use identity to protect and preserve health information, while keeping emergency access and discovery open.")

    # Journey rail.
    x0, y = M + 18, H - 218
    stages = [
        ("Guest", "Emergency + explore", GRAY3),
        ("Verify", "Mobile OTP", BLUE),
        ("Profile", "Self or dependent", INDIGO),
        ("Secure", "Passkey / biometric", GREEN),
        ("Connect", "Optional ABHA", AMBER),
    ]
    step_w = (W - 2 * M - 36) / 5
    for i, (title, sub, accent) in enumerate(stages):
        x = x0 + i * step_w
        c.setFillColor(accent)
        c.circle(x + 20, y, 16, stroke=0, fill=1)
        txt(c, str(i + 1), x + 20, y - 4, 8, white, "NirogBold", "center")
        txt(c, title, x + 43, y + 2, 11, INK, "NirogSemi")
        txt(c, sub, x + 43, y - 14, 8.5, GRAY, "Nirog")
        if i < len(stages) - 1:
            line(c, x + step_w - 16, y, x + step_w + 1, y, HAIR, 2)

    cards = [
        ("Account is not a patient", "One authenticated person can manage self, child, parent or dependent profiles. Every relationship has an explicit scope.", SOFT_BLUE, BLUE),
        ("ABHA is a connection", "Keep ABHA optional and external. Never use phone, email or ABHA as the internal database key.", SOFT_AMBER, AMBER),
        ("Return safely", "Store refresh credentials in device secure storage. Use biometric unlock or a passkey for convenient return access.", SOFT_GREEN, GREEN),
    ]
    cw = (W - 2 * M - 24) / 3
    for i, (title, body, fill, accent) in enumerate(cards):
        x = M + i * (cw + 12)
        rounded(c, x, 104, cw, 205, 22, fill, fill)
        dot(c, x + 22, 278, accent, 5)
        txt(c, title, x + 36, 273, 13, INK, "NirogSemi")
        paragraph(c, body, x + 22, 239, cw - 44, 10.2, leading=15.5, color=GRAY)


def page_7(c):
    base_page(c, 7, "Doctor workspace")
    outline(c, "Responsive doctor workspace", 7)
    section_title(c, "DOCTOR EXPERIENCE", "A clinical workspace, not a stretched mobile screen", "The interface should adapt its information density while keeping the consultation flow consistent.")

    # Browser frame.
    x, y, fw, fh = M, 86, W - 2 * M, 365
    rounded(c, x, y, fw, fh, 22, PANEL)
    c.setFillColor(HexColor("#F8F9FB"))
    c.roundRect(x, y + fh - 34, fw, 34, 22, stroke=0, fill=1)
    for i, color in enumerate([RED, AMBER, GREEN]):
        dot(c, x + 18 + i * 15, y + fh - 17, color, 3.5)
    txt(c, "doctor.nirog.health / consultation", x + 75, y + fh - 21, 8.5, GRAY3, "Nirog")

    side_w, queue_w = 68, 190
    c.setFillColor(INK)
    c.rect(x, y, side_w, fh - 34, stroke=0, fill=1)
    txt(c, "N", x + side_w / 2, y + fh - 74, 16, white, "NirogBold", "center")
    for i in range(5):
        c.setFillColor(BLUE if i == 1 else HexColor("#34343A"))
        c.roundRect(x + 18, y + fh - 120 - i * 48, 32, 32, 10, stroke=0, fill=1)

    qx = x + side_w
    c.setFillColor(HexColor("#FAFAFB"))
    c.rect(qx, y, queue_w, fh - 34, stroke=0, fill=1)
    label(c, "TODAY'S QUEUE", qx + 16, y + fh - 67, BLUE)
    for i, (name, meta, accent) in enumerate([("Rahul Yadav", "Waiting 04:12", RED), ("Sunita Devi", "10:30 - Follow-up", AMBER), ("Aarav Yadav", "11:00 - Pediatrics", GREEN), ("Meena Singh", "11:30 - New", GRAY3)]):
        yy = y + fh - 108 - i * 61
        if i == 0:
            rounded(c, qx + 10, yy - 35, queue_w - 20, 50, 12, SOFT_BLUE, SOFT_BLUE)
        dot(c, qx + 25, yy - 9, accent, 5)
        txt(c, name, qx + 38, yy - 5, 9.5, INK, "NirogSemi")
        txt(c, meta, qx + 38, yy - 20, 7.5, GRAY, "Nirog")

    main_x = qx + queue_w
    main_w = fw - side_w - queue_w
    txt(c, "Rahul Yadav", main_x + 22, y + fh - 70, 18, INK, "NirogBold")
    pill(c, "HIGH PRIORITY", main_x + main_w - 132, y + fh - 82, SOFT_RED, RED, 108)
    line(c, main_x + 22, y + fh - 92, x + fw - 22, y + fh - 92, HAIR, 1)

    cards = [("ARIA HANDOVER", "Breathlessness for 2 days. Red flag: chest pressure.", SOFT_PURPLE, PURPLE), ("KNOWN CONTEXT", "Hypertension | Amlodipine | No known allergies", SOFT_BLUE, BLUE)]
    for i, (head, body, fill, accent) in enumerate(cards):
        yy = y + fh - 185 - i * 91
        rounded(c, main_x + 22, yy, main_w - 44, 74, 15, fill, fill)
        label(c, head, main_x + 38, yy + 50, accent)
        paragraph(c, body, main_x + 38, yy + 29, main_w - 76, 9.2, color=INK, max_lines=2)
    rounded(c, main_x + 22, y + 20, main_w - 44, 48, 14, INK, INK)
    txt(c, "Start consultation", main_x + 42, y + 38, 10, white, "NirogSemi")
    txt(c, "Notes  |  Prescribe  |  Request test  |  Follow-up", main_x + main_w - 42, y + 38, 8.3, HexColor("#C5CAD3"), "Nirog", "right")


def page_8(c):
    base_page(c, 8, "Trust architecture")
    outline(c, "Trust architecture", 8)
    section_title(c, "SYSTEM DESIGN", "Trust sits between every client and every record", "A shared backend should enforce identity, care relationships, consent and audit before data reaches ARIA or a clinician.")

    nodes = [
        (M + 18, 303, 155, 76, "Patient app", "OTP + passkey", SOFT_BLUE, BLUE),
        (M + 18, 191, 155, 76, "Doctor web", "verified + MFA", SOFT_GREEN, GREEN),
        (M + 229, 247, 175, 90, "Authenticated API", "token validation\nrate limits\nrequest context", PANEL, INK),
        (M + 465, 247, 185, 90, "Authorization", "role + relationship\nconsent + purpose\nfacility scope", SOFT_AMBER, AMBER),
        (W - M - 138, 350, 138, 66, "PostgreSQL", "clinical data", PANEL, BLUE),
        (W - M - 138, 258, 138, 66, "Documents", "encrypted files", PANEL, INDIGO),
        (W - M - 138, 166, 138, 66, "Audit trail", "who / what / why", PANEL, RED),
        (M + 465, 111, 185, 72, "ARIA service", "authenticated context\nclinician verification", SOFT_PURPLE, PURPLE),
    ]
    for x, y, w, h, title, sub, fill, accent in nodes:
        rounded(c, x, y, w, h, 18, fill, fill if fill != PANEL else HAIR)
        dot(c, x + 18, y + h - 22, accent, 4)
        txt(c, title, x + 31, y + h - 27, 11, INK, "NirogSemi")
        lines = sub.split("\n")
        for i, s in enumerate(lines):
            txt(c, s, x + 18, y + h - 48 - i * 13, 8.5, GRAY, "Nirog")
    arrow(c, M + 173, 340, M + 229, GRAY3)
    arrow(c, M + 173, 228, M + 229, GRAY3)
    arrow(c, M + 404, 292, M + 465, GRAY3)
    arrow(c, M + 650, 292, W - M - 138, GRAY3)
    line(c, M + 558, 247, M + 558, 183, GRAY3, 1.3)
    c.setFillColor(GRAY3)
    c.circle(M + 558, 183, 2.5, stroke=0, fill=1)

    rounded(c, M + 18, 76, 386, 70, 18, INK, INK)
    label(c, "CORE RULE", M + 38, 119, LBLUE)
    txt(c, "The client requests. The server decides.", M + 38, 94, 16, white, "NirogBold")


def page_9(c):
    base_page(c, 9, "Safety baseline")
    outline(c, "Safety and privacy baseline", 9)
    section_title(c, "NON-NEGOTIABLES", "Real health data changes the engineering standard", "The current demo patterns must be upgraded before clinical records, prescriptions or real consultations are enabled.")

    groups = [
        ("IDENTITY", BLUE, ["Patient tokens in secure device storage", "Doctor MFA or passkey", "Step-up auth for prescribing and exports"]),
        ("ACCESS", AMBER, ["No doctor-wide patient search", "Time-bound care relationships", "Break-glass access with a reason"]),
        ("DATA", INDIGO, ["Encrypted documents and backups", "No health data in logs or analytics", "Short-lived signed file links"]),
        ("CLINICAL", RED, ["ARIA output is unverified", "Doctor accepts or edits before filing", "Deterministic red-flag escalation"]),
        ("PRIVACY", GREEN, ["Purpose-specific consent", "Withdrawal and deletion workflow", "Minimal push notification content"]),
        ("OPERATIONS", PURPLE, ["Immutable access audit", "Credential suspension workflow", "Backup, recovery and incident plan"]),
    ]
    cols, rows = 3, 2
    gap = 14
    cw = (W - 2 * M - gap * 2) / 3
    ch = 153
    for i, (title, accent, bullets) in enumerate(groups):
        col, row = i % cols, i // cols
        x = M + col * (cw + gap)
        y = 276 - row * (ch + 14)
        rounded(c, x, y, cw, ch, 20, PANEL)
        label(c, title, x + 18, y + ch - 28, accent)
        yy = y + ch - 56
        for b in bullets:
            yy = bullet(c, b, x + 16, yy, cw - 32, accent, 9.1) - 4

    pill(c, "DESIGN FOR DPDP + ABDM NOW", M, 79, SOFT_BLUE, BLUE, 205)
    txt(c, "Legal and clinical review remains required before launch.", M + 220, 87, 9.5, GRAY, "Nirog")


def page_10(c):
    base_page(c, 10, "Rural advantage")
    outline(c, "Rural India product advantage", 10)
    section_title(c, "DIFFERENTIATION", "Design around the reality of access", "Nirog can win by making care usable under bandwidth, language, literacy and family-care constraints.")

    features = [
        ("Audio-first", "Graceful downgrade from video to audio and text.", BLUE, SOFT_BLUE),
        ("Regional language", "Hindi first, then locally relevant languages and voice.", PURPLE, SOFT_PURPLE),
        ("Family care", "Dependents, elders and caregiver permissions built in.", GREEN, SOFT_GREEN),
        ("Resumable", "Uploads and consultation state survive poor networks.", AMBER, SOFT_AMBER),
        ("Assisted mode", "Support ASHA workers and clinic facilitators safely.", INDIGO, SOFT_PURPLE),
        ("Closed loop", "Every care plan returns as reminders and follow-up.", RED, SOFT_RED),
    ]
    gap = 14
    cw = (W - 2 * M - 2 * gap) / 3
    ch = 130
    for i, (title, body, accent, fill) in enumerate(features):
        col, row = i % 3, i // 3
        x = M + col * (cw + gap)
        y = 296 - row * (ch + 14)
        rounded(c, x, y, cw, ch, 20, fill, fill)
        c.setFillColor(accent)
        c.circle(x + 24, y + ch - 28, 9, stroke=0, fill=1)
        txt(c, f"{i + 1}", x + 24, y + ch - 31, 6.5, white, "NirogBold", "center")
        txt(c, title, x + 43, y + ch - 33, 12, INK, "NirogSemi")
        paragraph(c, body, x + 20, y + ch - 65, cw - 40, 9.5, leading=14.5, color=GRAY)

    rounded(c, M, 66, W - 2 * M, 72, 18, INK, INK)
    txt(c, "The moat is not AI alone.", M + 24, 104, 16, white, "NirogBold")
    txt(c, "It is continuity of trusted care under difficult conditions.", W - M - 24, 104, 12, HexColor("#CAD0DA"), "Nirog", "right")


def page_11(c):
    base_page(c, 11, "Delivery roadmap")
    outline(c, "Delivery roadmap", 11)
    section_title(c, "SEQUENCING", "Build trust before transaction volume", "Each release should create a usable slice of the care loop while preserving the right architecture for ABDM and scale.")

    phases = [
        ("01", "Identity foundation", "Patient OTP, doctor invitation, MFA, profiles, session management", BLUE),
        ("02", "Secure records", "PostgreSQL, documents, consent grants, audit events", INDIGO),
        ("03", "Care workflow", "Appointments, queue, encounter notes, ARIA review", GREEN),
        ("04", "Teleconsultation", "Real audio/video/chat, prescription and follow-up", AMBER),
        ("05", "Interoperability", "HPR/HFR automation, ABHA, ABDM consent and FHIR", PURPLE),
    ]
    y0, row_h = H - 205, 65
    for i, (num, title, body, accent) in enumerate(phases):
        y = y0 - i * (row_h + 10)
        rounded(c, M, y - 46, W - 2 * M, 58, 16, PANEL)
        c.setFillColor(accent)
        c.circle(M + 26, y - 17, 14, stroke=0, fill=1)
        txt(c, num, M + 26, y - 21, 7.5, white, "NirogBold", "center")
        txt(c, title, M + 53, y - 10, 12, INK, "NirogSemi")
        txt(c, body, M + 53, y - 29, 9.2, GRAY, "Nirog")
        if i < len(phases) - 1:
            line(c, M + 26, y - 32, M + 26, y - row_h - 1, accent, 2)

    pill(c, "RECOMMENDED FIRST COMMITMENT", W - M - 238, 64, SOFT_BLUE, BLUE, 238)
    txt(c, "Identity + consent + persistent records", W - M - 119, 37, 10.5, INK, "NirogSemi", "center")


def page_12(c):
    base_page(c, 12, "Interactive team decision")
    outline(c, "Interactive team decision form", 12)
    section_title(c, "FILLABLE WORKSHOP", "Make the architecture decision together", "Tick the agreed direction, vote on first-release priorities, then record the decision and owner.")

    left_x, right_x = M, W / 2 + 12
    left_w, right_w = W / 2 - M - 24, W - M - right_x
    rounded(c, left_x, 93, left_w, 355, 22, PANEL)
    rounded(c, right_x, 93, right_w, 355, 22, PANEL)

    label(c, "A. DIRECTION", left_x + 20, 420)
    options = [
        ("decision_two_apps", "Separate patient app and doctor web"),
        ("decision_shared_api", "One shared authenticated API"),
        ("decision_managed_auth", "Managed identity provider"),
        ("decision_consent", "Consent and audit in release one"),
        ("decision_abha_later", "ABHA integration after core workflow"),
    ]
    for i, (name, text_value) in enumerate(options):
        yy = 384 - i * 37
        checkbox(c, name, left_x + 20, yy - 3, checked=i < 4)
        txt(c, text_value, left_x + 44, yy, 9.7, INK, "Nirog")

    label(c, "B. PRIORITY VOTE - PICK THREE", left_x + 20, 191)
    votes = [("vote_identity", "Identity"), ("vote_records", "Records"), ("vote_doctor", "Doctor portal"), ("vote_video", "Teleconsult"), ("vote_abdm", "ABDM")]
    for i, (name, label_text) in enumerate(votes):
        xx = left_x + 20 + (i % 3) * 112
        yy = 154 - (i // 3) * 39
        checkbox(c, name, xx, yy, checked=i < 3)
        txt(c, label_text, xx + 21, yy + 2, 9.3, INK, "Nirog")

    label(c, "C. TEAM RECOMMENDATION", right_x + 20, 420)
    field(c, "team_recommendation", right_x + 20, 265, right_w - 40, 130, "We recommend proceeding with...", multiline=True, font_size=10)
    label(c, "DECISION OWNER", right_x + 20, 236)
    field(c, "decision_owner", right_x + 20, 198, right_w * 0.53, 28)
    label(c, "DECISION DATE", right_x + 20 + right_w * 0.57, 236)
    field(c, "decision_date", right_x + 20 + right_w * 0.57, 198, right_w * 0.31, 28, "YYYY-MM-DD")
    label(c, "CONFIDENCE - 1 LOW, 5 HIGH", right_x + 20, 169)
    for i in range(5):
        xx = right_x + 20 + i * 45
        checkbox(c, f"confidence_{i+1}", xx, 124, checked=i == 3, size=18)
        txt(c, str(i + 1), xx + 9, 105, 8.5, GRAY, "NirogSemi", "center")


def page_13(c):
    base_page(c, 13, "Interactive action plan")
    outline(c, "Interactive action plan", 13)
    section_title(c, "FILLABLE WORKSHOP", "Turn the decision into owned work", "Capture one owner and one concrete first milestone for each committed workstream.")

    # Workstream table.
    x, y, tw, th = M, 245, W - 2 * M, 199
    rounded(c, x, y, tw, th, 20, PANEL)
    widths = [150, 130, 115, tw - 395]
    headers = ["Workstream", "Owner", "Target", "First milestone"]
    xx = x + 14
    for head, width in zip(headers, widths):
        label(c, head, xx, y + th - 27, GRAY)
        xx += width
    line(c, x + 14, y + th - 39, x + tw - 14, y + th - 39, HAIR)
    workstreams = ["Identity + sessions", "Consent + records", "Doctor web", "Clinical governance"]
    for r, name in enumerate(workstreams):
        yy = y + th - 76 - r * 38
        txt(c, name, x + 14, yy + 8, 9.3, INK, "NirogSemi")
        field(c, f"owner_{r+1}", x + 164, yy, 116, 26)
        field(c, f"target_{r+1}", x + 294, yy, 101, 26)
        field(c, f"milestone_{r+1}", x + 409, yy, tw - 423, 26)

    # Risk + notes.
    gap = 18
    cw = (W - 2 * M - gap) / 2
    rounded(c, M, 66, cw, 157, 20, PANEL)
    rounded(c, M + cw + gap, 66, cw, 157, 20, PANEL)
    label(c, "TOP RISKS / OPEN QUESTIONS", M + 18, 195)
    field(c, "top_risks", M + 18, 84, cw - 36, 92, "1.\n2.\n3.", multiline=True, font_size=9.5)
    label(c, "MEETING NOTES", M + cw + gap + 18, 195)
    field(c, "meeting_notes", M + cw + gap + 18, 84, cw - 36, 92, "", multiline=True, font_size=9.5)


def page_14(c):
    base_page(c, 14, "Evidence and links")
    outline(c, "Evidence and links", 14)
    section_title(c, "REFERENCE", "Sources behind the recommendation", "Clickable links for repository context, authentication, mobile security, ABDM and India's current privacy framework.")

    refs = [
        ("Nirog repository", "Current Expo application and product prototype", "https://github.com/AdityaGuptaVarshney/nirog"),
        ("Nirog README", "Five screens, ARIA and dummy-data scope", "https://github.com/AdityaGuptaVarshney/nirog/blob/main/README.md"),
        ("ARIA client", "Current stateless clinical intake integration", "https://github.com/AdityaGuptaVarshney/nirog/blob/main/lib/aria.ts"),
        ("OWASP Authentication", "MFA, password and session guidance", "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html"),
        ("OWASP MASVS", "Mobile storage, authentication and privacy baseline", "https://mas.owasp.org/MASVS/03-Using_the_MASVS/"),
        ("ABDM overview", "ABHA, registries, PHR and consent architecture", "https://abdm.gov.in/abdm"),
        ("Healthcare Professionals Registry", "Verified clinician identity and teleconsultation", "https://nhpr.abdm.gov.in/"),
        ("DPDP Rules 2025", "Official MeitY publication and phased implementation", "https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digital-Personal-Data-Protection-Rules-2025.pdf"),
    ]
    gap = 14
    cw = (W - 2 * M - gap) / 2
    row_h = 64
    for i, (title, body, url) in enumerate(refs):
        col, row = i % 2, i // 2
        x = M + col * (cw + gap)
        y = H - 198 - row * (row_h + 10)
        rounded(c, x, y - 43, cw, 58, 16, PANEL)
        add_url(c, title, url, x + 18, y - 2, size=10.2)
        txt(c, body, x + 18, y - 22, 8.6, GRAY, "Nirog")
        txt(c, "OPEN", x + cw - 18, y - 3, 7.5, BLUE, "NirogSemi", "right")
        c.linkURL(url, (x, y - 43, x + cw, y + 15), relative=0, thickness=0)

    rounded(c, M, 61, W - 2 * M, 54, 18, SOFT_AMBER, SOFT_AMBER)
    label(c, "NOTE", M + 20, 94, AMBER)
    txt(c, "This pitch is a product and architecture proposal, not legal or medical advice. Obtain specialist review before launch.", M + 20, 74, 9.3, INK, "Nirog")


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
    c.setTitle("Nirog Care Platform - Team Pitch")
    c.setAuthor("Nirog Product Team")
    c.setSubject("Patient login, responsive doctor portal, trust architecture and delivery plan")
    c.setKeywords("Nirog, health, telemedicine, patient app, doctor portal, interactive PDF")
    pages = [page_1, page_2, page_3, page_4, page_5, page_6, page_7, page_8, page_9, page_10, page_11, page_12, page_13, page_14]
    for fn in pages:
        fn(c)
        c.showPage()
    c.save()
    print(OUT)


if __name__ == "__main__":
    build()
