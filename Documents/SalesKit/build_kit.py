"""Builds the Skelli-Sites door-to-door sales kit PDFs. Run:  python build_kit.py"""
import os
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak,
                                KeepTogether, CondPageBreak)
from reportlab.platypus.flowables import Flowable

HERE = os.path.dirname(os.path.abspath(__file__))
COMPANY, FOUNDER, FIRST = "Skelli-Sites", "Mike Haddon", "Mike"
EMAIL, PHONE = "haddon.mike2@outlook.com", "903-275-0013"
TAGLINE = "Your brand, built to sell."

FD = r"C:\Windows\Fonts"
for name, fn in [("Body", "segoeui.ttf"), ("Body-Bold", "segoeuib.ttf"), ("Body-Italic", "segoeuii.ttf"),
                 ("Semi", "seguisb.ttf"), ("Sym", "seguisym.ttf"), ("Head", "georgiab.ttf"), ("Head-Reg", "georgia.ttf")]:
    pdfmetrics.registerFont(TTFont(name, os.path.join(FD, fn)))
from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily("Body", normal="Body", bold="Body-Bold", italic="Body-Italic", boldItalic="Body-Bold")

NAVY, AMBER, TEAL = colors.HexColor("#1B2A41"), colors.HexColor("#E08A1E"), colors.HexColor("#2A9D8F")
INK, MUTED, RULE = colors.HexColor("#27303F"), colors.HexColor("#6B7588"), colors.HexColor("#D5DAE3")
LIGHT, NOTE_BG, SOFT = colors.HexColor("#F2F4F8"), colors.HexColor("#FFF6E8"), colors.HexColor("#C9D2E0")

S = lambda name, **kw: ParagraphStyle(name, **{"fontName": "Body", "fontSize": 9.5, "leading": 13.5, "textColor": INK, **kw})
st = {
    "body": S("body", spaceAfter=5), "small": S("small", fontSize=8, leading=10.5),
    "cell": S("cell", fontSize=8.6, leading=11.5), "cellb": S("cellb", fontName="Semi", fontSize=8.6, leading=11.5),
    "th": S("th", fontName="Body-Bold", fontSize=8, leading=10, textColor=colors.white),
    "h1": S("h1", fontName="Head", fontSize=20, leading=25, textColor=NAVY, spaceAfter=2),
    "h2": S("h2", fontName="Semi", fontSize=12, leading=16, textColor=NAVY, spaceBefore=10, spaceAfter=4),
    "h3": S("h3", fontName="Body-Bold", fontSize=9.6, leading=13, textColor=TEAL, spaceBefore=6, spaceAfter=2),
    "kicker": S("kicker", fontName="Body-Bold", fontSize=8, leading=10, textColor=AMBER),
    "bullet": S("bullet", leftIndent=14, bulletIndent=3, spaceAfter=2.5),
    "say": S("say", fontName="Head-Reg", fontSize=10.5, leading=15.5, textColor=NAVY),
}


class Rule(Flowable):
    def wrap(self, aw, ah):
        self.aw = aw; return aw, 10

    def draw(self):
        self.canv.setFillColor(AMBER); self.canv.rect(0, 5, 36, 2.4, stroke=0, fill=1)
        self.canv.setStrokeColor(RULE); self.canv.setLineWidth(0.6); self.canv.line(40, 6.2, self.aw, 6.2)


class Box(Flowable):
    """Empty checkbox drawn inline in a table cell."""
    def __init__(self, size=9):
        super().__init__(); self.s = size

    def wrap(self, aw, ah):
        return self.s + 2, self.s + 2

    def draw(self):
        self.canv.setStrokeColor(NAVY); self.canv.setLineWidth(0.8)
        self.canv.roundRect(0, 1, self.s, self.s, 1.5, stroke=1, fill=0)


def header_footer(title):
    def draw(c, doc):
        w, h = doc.pagesize
        c.saveState()
        c.setStrokeColor(RULE); c.setLineWidth(0.6)
        c.line(doc.leftMargin, h - 0.55 * inch, w - doc.rightMargin, h - 0.55 * inch)
        c.setFont("Body-Bold", 7.5); c.setFillColor(NAVY)
        c.drawString(doc.leftMargin, h - 0.48 * inch, COMPANY.upper())
        c.setFillColor(AMBER); c.circle(doc.leftMargin + c.stringWidth(COMPANY.upper(), "Body-Bold", 7.5) + 5, h - 0.48 * inch + 2.6, 2.2, stroke=0, fill=1)
        c.setFont("Body", 7.5); c.setFillColor(MUTED)
        c.drawRightString(w - doc.rightMargin, h - 0.48 * inch, title)
        c.line(doc.leftMargin, 0.55 * inch, w - doc.rightMargin, 0.55 * inch)
        c.drawString(doc.leftMargin, 0.4 * inch, f"{FOUNDER}  \u00b7  {EMAIL}  \u00b7  {PHONE}")
        c.setFont("Body-Bold", 8); c.setFillColor(NAVY)
        c.drawRightString(w - doc.rightMargin, 0.4 * inch, str(doc.page))
        c.restoreState()
    return draw


def table(rows, widths, W, header=True, zebra=True, bold_first=False, extra=None, pad=4, heights=None):
    data = []
    for i, r in enumerate(rows):
        row = []
        for j, v in enumerate(r):
            if isinstance(v, Flowable):
                row.append(v)
            elif header and i == 0:
                row.append(Paragraph(str(v), st["th"]))
            else:
                row.append(Paragraph(str(v), st["cellb"] if bold_first and j == 0 else st["cell"]))
        data.append(row)
    t = Table(data, colWidths=[w * W for w in widths], rowHeights=heights, repeatRows=1 if header else 0)
    cmds = [("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), pad),
            ("BOTTOMPADDING", (0, 0), (-1, -1), pad), ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6), ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE)]
    if header:
        cmds.append(("BACKGROUND", (0, 0), (-1, 0), NAVY))
    if zebra:
        cmds += [("BACKGROUND", (0, i), (-1, i), LIGHT) for i in range(1 if header else 0, len(rows)) if i % 2 == 0]
    t.setStyle(TableStyle(cmds + (extra or [])))
    return t


def note(text, title, W):
    p = Paragraph(f"<font name='Body-Bold' color='#B8680A'>{title.upper()}:</font>  {text}", st["small"])
    t = Table([[p]], colWidths=[W])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), NOTE_BG), ("LINEBEFORE", (0, 0), (0, -1), 3, AMBER),
                           ("LEFTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 6),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    return t


def say(text, W):
    t = Table([[Paragraph(text, st["say"])]], colWidths=[W])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), LIGHT), ("LINEBEFORE", (0, 0), (0, -1), 3, NAVY),
                           ("LEFTPADDING", (0, 0), (-1, -1), 12), ("TOPPADDING", (0, 0), (-1, -1), 8),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
    return t


def bullets(items):
    return [Paragraph(i, st["bullet"], bulletText="\u2022") for i in items]


def title_block(kicker, title):
    return [Paragraph(kicker.upper(), st["kicker"]), Paragraph(title, st["h1"]), Rule(), Spacer(1, 4)]


# =================================================================================
# 1. ONE-PAGE FLYER
# =================================================================================
def flyer():
    out = os.path.join(HERE, "1_Skelli-Sites_Flyer.pdf")
    w, h = letter
    M = 0.6 * inch

    def draw(c, doc):
        c.saveState()
        # top band
        c.setFillColor(NAVY); c.rect(0, h - 3.55 * inch, w, 3.55 * inch, stroke=0, fill=1)
        c.setFillColor(AMBER); c.rect(0, h - 3.6 * inch, w, 0.05 * inch, stroke=0, fill=1)
        # grid motif
        c.setStrokeColor(colors.HexColor("#2E4263")); c.setLineWidth(0.8)
        gx, gy, step = w - 2.6 * inch, h - 3.2 * inch, 0.34 * inch
        for i in range(7):
            c.line(gx + i * step, gy, gx + i * step, gy + 6 * step)
            c.line(gx, gy + i * step, gx + 6 * step, gy + i * step)
        c.setFillColor(AMBER)
        for (i, j) in [(1, 2), (3, 5), (5, 1), (2, 4), (4, 3)]:
            c.circle(gx + i * step, gy + j * step, 3, stroke=0, fill=1)
        # wordmark
        c.setFillColor(colors.white); c.setFont("Body-Bold", 12)
        c.drawString(M, h - 0.75 * inch, COMPANY.upper())
        c.setFillColor(AMBER); c.circle(M + c.stringWidth(COMPANY.upper(), "Body-Bold", 12) + 7, h - 0.75 * inch + 4, 3.2, stroke=0, fill=1)
        c.setFont("Body", 9); c.setFillColor(SOFT)
        c.drawString(M, h - 0.95 * inch, "Online stores for Tyler & East Texas businesses")
        # headline
        c.setFillColor(colors.white); c.setFont("Head", 30)
        c.drawString(M, h - 1.75 * inch, "Your shop, open online")
        c.drawString(M, h - 2.2 * inch, "24/7. We do the work.")
        c.setFont("Body", 11.5); c.setFillColor(SOFT)
        c.drawString(M, h - 2.62 * inch, "Skelli-Sites designs, builds and runs a custom online store for your")
        c.drawString(M, h - 2.84 * inch, "business, so customers can buy from you anytime, from anywhere.")
        c.setFont("Body-Italic", 10.5); c.setFillColor(AMBER)
        c.drawString(M, h - 3.2 * inch, f"\u201c{TAGLINE}\u201d")
        # bottom contact band
        c.setFillColor(NAVY); c.rect(0, 0, w, 1.25 * inch, stroke=0, fill=1)
        c.setFillColor(AMBER); c.rect(0, 1.25 * inch, w, 0.05 * inch, stroke=0, fill=1)
        c.setFillColor(colors.white); c.setFont("Head", 15)
        c.drawString(M, 0.82 * inch, f"Let's talk. {FOUNDER}, Founder")
        c.setFont("Body", 11); c.setFillColor(SOFT)
        c.drawString(M, 0.55 * inch, f"Call or text {PHONE}   \u00b7   {EMAIL}")
        c.setFont("Body", 8.5)
        c.drawString(M, 0.32 * inch, "Locally owned in Tyler, Texas  \u00b7  In-person meetings anytime")
        # offer badge
        bx, by, bw, bh = w - M - 2.25 * inch, 0.25 * inch, 2.25 * inch, 0.78 * inch
        c.setFillColor(AMBER); c.roundRect(bx, by, bw, bh, 8, stroke=0, fill=1)
        c.setFillColor(NAVY); c.setFont("Body-Bold", 10)
        c.drawCentredString(bx + bw / 2, by + bh - 0.28 * inch, "FREE ONLINE STORE")
        c.drawCentredString(bx + bw / 2, by + bh - 0.46 * inch, "CHECK-UP")
        c.setFont("Body", 7.5)
        c.drawCentredString(bx + bw / 2, by + 0.1 * inch, "No cost, no obligation, 15 minutes")
        c.restoreState()

    doc = SimpleDocTemplate(out, pagesize=letter, leftMargin=M, rightMargin=M,
                            topMargin=3.85 * inch, bottomMargin=1.45 * inch,
                            title=f"{COMPANY} - Flyer", author=FOUNDER)
    W = w - 2 * M
    story = []
    # three benefit columns
    col = lambda t, b: [Paragraph(f"<font name='Semi' size='11' color='#1B2A41'>{t}</font>", st["cell"]),
                        Spacer(1, 3), Paragraph(b, st["cell"])]
    ben = Table([[col("Done for you", "Brand, design, products, payments and launch. You approve it; we build it."),
                  col("Looks like <i>your</i> brand", "A custom store with your logo, colors and story, not a cookie-cutter template."),
                  col("Run and grown for you", "Hosting, security, updates, support and optional ad management in one monthly plan.")]],
                colWidths=[W / 3] * 3)
    ben.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEABOVE", (0, 0), (-1, 0), 2.5, TEAL),
                             ("TOPPADDING", (0, 0), (-1, -1), 8), ("LEFTPADDING", (0, 0), (0, -1), 0),
                             ("RIGHTPADDING", (0, 0), (-1, -1), 14)]))
    story += [ben, Spacer(1, 12)]

    story.append(Paragraph("Simple, upfront pricing", st["h2"]))
    pk = lambda n, p, d, hl=False: Paragraph(
        f"<font name='Body-Bold' size='8' color='{'#E08A1E' if hl else '#6B7588'}'>{n.upper()}{'  <font name="Sym">\u2605</font> MOST POPULAR' if hl else ''}</font><br/>"
        f"<font name='Head' size='17' color='#1B2A41'>{p}</font> <font size='8' color='#6B7588'>one-time</font><br/>"
        f"<font size='8.4'>{d}</font>", S("pk", fontSize=8.4, leading=13.5))
    pkt = Table([[pk("Launch", "$1,500", "Store ready in about 2 weeks. Up to 50 products, core pages, card or PayPal checkout."),
                  pk("Brand", "$3,500", "Full brand kit + custom-styled store. Up to 250 products, product copywriting, Google Business setup.", True),
                  pk("Signature", "$6,500+", "Fully custom design and features, unlimited products, shipping and supplier integrations.")]],
                colWidths=[W / 3] * 3)
    pkt.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
                             ("BACKGROUND", (1, 0), (1, 0), NOTE_BG), ("BOX", (1, 0), (1, 0), 1.2, AMBER),
                             ("LINEAFTER", (0, 0), (0, 0), 3, colors.white),
                             ("TOPPADDING", (0, 0), (-1, -1), 9), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                             ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10)]))
    story += [pkt, Spacer(1, 6)]
    story.append(Paragraph("<b>Then one monthly plan</b> keeps it running: <b>Care $149</b> (hosting, security, backups, support)  "
                           "\u00b7  <b>Growth $399</b> (+ ad and email marketing)  \u00b7  <b>Scale $899</b> (multi-channel marketing + strategy).",
                           S("mp", fontSize=9, leading=13)))
    story.append(Spacer(1, 8))

    story.append(Paragraph("How it works", st["h2"]))
    step = lambda n, t, b: Paragraph(f"<font name='Head' size='20' color='#E08A1E'>{n}</font><br/>"
                                     f"<font name='Semi' size='10.5' color='#1B2A41'>{t}</font><br/>{b}", S("st", fontSize=8.8, leading=12.5))
    hw = Table([[step("1", "Free check-up", "A 15-minute look at how customers find and buy from you today."),
                 step("2", "We build it", "Brand, store, products and payments, ready in 2 to 4 weeks. You just approve."),
                 step("3", "You sell", "Launch day, training, then we keep it running and bring in customers.")]],
               colWidths=[W / 3] * 3)
    hw.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (0, -1), 0),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 16), ("TOPPADDING", (0, 0), (-1, -1), 0)]))
    story += [hw, Spacer(1, 6)]
    story.append(Paragraph("Great for", st["h2"]))
    fits = ["Boutiques & gift shops", "Bakeries & specialty foods", "Makers & crafters", "Salons & spas with retail",
            "Farm, garden & feed stores", "Churches & nonprofits (donations + merch)"]
    ft = Table([[Paragraph("<font name='Sym' color='#2A9D8F'>\u2713</font>  " + fits[i], S("fit", fontSize=9.5, leading=13)), Paragraph("<font name='Sym' color='#2A9D8F'>\u2713</font>  " + fits[i + 1], S("fit", fontSize=9.5, leading=13)),
                 Paragraph("<font name='Sym' color='#2A9D8F'>\u2713</font>  " + fits[i + 2], S("fit", fontSize=9.5, leading=13))] for i in (0, 3)], colWidths=[W / 3] * 3)
    ft.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 2),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
    story.append(ft)
    doc.build(story, onFirstPage=draw)
    return out


# =================================================================================
# 2. FREE ONLINE STORE CHECK-UP FORM
# =================================================================================
def checkup():
    out = os.path.join(HERE, "2_Free_Online_Store_Checkup.pdf")
    M = 0.7 * inch
    doc = SimpleDocTemplate(out, pagesize=letter, leftMargin=M, rightMargin=M, topMargin=0.8 * inch,
                            bottomMargin=0.8 * inch, title=f"{COMPANY} - Free Online Store Check-Up", author=FOUNDER)
    W = letter[0] - 2 * M
    story = title_block("Complimentary \u00b7 no obligation", "Free Online Store Check-Up")
    story.append(Paragraph("A quick look at how easy it is for customers to find you, trust you and buy from you online. "
                           "Each item scores 0 (missing), 1 (needs work) or 2 (in good shape).", st["body"]))

    line = lambda label: [Paragraph(f"<font name='Semi'>{label}</font>", st["cell"]), ""]
    info = Table([line("Business name"), line("Owner / contact"), line("Phone / email"), line("Address"),
                  line("What you sell"), line("Date of check-up")],
                 colWidths=[0.22 * W, 0.78 * W])
    info.setStyle(TableStyle([("LINEBELOW", (1, 0), (1, -1), 0.6, MUTED), ("TOPPADDING", (0, 0), (-1, -1), 6),
                              ("BOTTOMPADDING", (0, 0), (-1, -1), 3), ("LEFTPADDING", (0, 0), (0, -1), 0)]))
    story += [info, Spacer(1, 6)]

    sections = [
        ("1. Can customers find you?", [
            "Google Business Profile exists and is claimed",
            "Hours, phone, address and photos are current on Google",
            "Shows up when searching \u201c[what you sell] Tyler TX\u201d",
            "Has 10+ Google reviews, with recent replies from the owner",
            "Active Facebook and/or Instagram page (posted in the last 30 days)"]),
        ("2. Do they trust what they see?", [
            "Has a website on its own domain (not only social media)",
            "Website looks professional and matches the store's brand",
            "Website works well on a phone",
            "Site is secure (padlock / https)",
            "Clear About story, contact info and policies"]),
        ("3. Can they buy from you online?", [
            "Customers can buy or order online (not just call or visit)",
            "Products show photos, prices and descriptions",
            "Accepts cards, PayPal, or pay-later options online",
            "Offers shipping, local delivery or curbside pickup",
            "Collects customer emails for promotions"]),
        ("4. Is marketing working for you?", [
            "Sends emails or texts to past customers",
            "Runs online ads (Facebook, Google, etc.)",
            "Knows how many sales come from online",
            "Has a clear logo, colors and brand look used everywhere",
            "Has someone responsible for keeping it all up to date"]),
    ]
    for title, items in sections:
        rows = [[title, "0", "1", "2", "Notes"]]
        rows += [[i, Box(), Box(), Box(), ""] for i in items]
        rows.append([Paragraph("<font name='Semi'>Section score</font>", S("r", fontSize=8.6, alignment=2)), "", "", "", "_____ / 10"])
        t = table(rows, [0.5, 0.055, 0.055, 0.055, 0.335], W, zebra=False,
                  extra=[("ALIGN", (1, 0), (3, -1), "CENTER"), ("SPAN", (0, -1), (3, -1)),
                         ("BACKGROUND", (0, -1), (-1, -1), LIGHT), ("LINEAFTER", (3, 1), (3, -2), 0.4, RULE)],
                  pad=3.5)
        story += [KeepTogether([t]), Spacer(1, 7)]

    story.append(CondPageBreak(3.2 * inch))
    story.append(Paragraph("Your results", st["h2"]))
    res = table([["Total score", "What it means"],
                 ["0 \u2013 15", "<b>Missing out.</b> Most online shoppers can't find or buy from you yet. Biggest room to grow."],
                 ["16 \u2013 28", "<b>Getting there.</b> The basics exist, but customers hit dead ends before they buy."],
                 ["29 \u2013 40", "<b>Strong.</b> Focus on marketing and growth to get more from what you have."]],
                [0.2, 0.8], W, bold_first=True)
    story += [Paragraph("<font name='Head' size='15' color='#1B2A41'>Total:  _______ / 40</font>", st["body"]), Spacer(1, 4), res]
    story.append(Paragraph("Top 3 quick wins for your business", st["h2"]))
    wins = Table([[Paragraph(f"<font name='Head' size='13' color='#E08A1E'>{n}</font>", st["cell"]), ""] for n in (1, 2, 3)],
                 colWidths=[0.05 * W, 0.95 * W], rowHeights=[0.42 * inch] * 3)
    wins.setStyle(TableStyle([("LINEBELOW", (1, 0), (1, -1), 0.6, MUTED), ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
                              ("LEFTPADDING", (0, 0), (0, -1), 0)]))
    story += [wins, Spacer(1, 10)]
    story.append(note(f"Happy to walk through these results and show you a demo store built for a business like yours. "
                      f"No cost, no pressure. {FOUNDER}  \u00b7  {PHONE}  \u00b7  {EMAIL}", "Next step", W))
    doc.build(story, onFirstPage=header_footer("Free Online Store Check-Up"),
              onLaterPages=header_footer("Free Online Store Check-Up"))
    return out


# =================================================================================
# 3. DOOR-TO-DOOR SCRIPT & OBJECTION HANDLING
# =================================================================================
def script():
    out = os.path.join(HERE, "3_Door-to-Door_Script_and_Objections.pdf")
    M = 0.8 * inch
    doc = SimpleDocTemplate(out, pagesize=letter, leftMargin=M, rightMargin=M, topMargin=0.85 * inch,
                            bottomMargin=0.8 * inch, title=f"{COMPANY} - Door-to-Door Playbook", author=FOUNDER)
    W = letter[0] - 2 * M
    story = title_block("Field playbook", "Door-to-Door Script & Objection Handling")
    story.append(Paragraph("The goal of a first visit is <b>not</b> to close a sale. It's to earn a second conversation: "
                           "a free check-up, a demo, or a scheduled call. Keep it short, friendly and local.", st["body"]))

    story.append(Paragraph("Before you walk in", st["h2"]))
    story += bullets([
        "<b>Rules:</b> respect \u201cNo Soliciting\u201d signs. Never knock at homes before 10 a.m., after sunset, or on Sundays and "
        "major holidays (City of Tyler Sec. 4-61). Confirm with the City whether a solicitor permit applies to business visits, "
        "and check rules in each nearby town you visit.",
        "<b>Best times:</b> Tue\u2013Thu, 9:30\u201311:30 a.m. or 2\u20134 p.m. Avoid lunch, opening/closing, weekends and holiday rushes.",
        "<b>Do your homework (2 minutes):</b> check their Google listing, website and Facebook on your phone. Note one specific, "
        "positive thing and one gap.",
        "<b>Bring:</b> flyers, business cards, blank check-up forms, a tablet with demo stores loaded, a pen and the prospect tracker.",
        "<b>Look the part:</b> branded polo or clean business-casual, name badge, and a smile. If customers are waiting, come back later."])

    story.append(Paragraph("The 5-step visit (3 to 5 minutes)", st["h2"]))
    steps = [
        ("1. Open (10 seconds)", "Ask for the owner by name if you know it. Read the room.",
         f"\u201cHi, I'm {FIRST}. I'm a local web developer here in Tyler. Is the owner in? ... I'll be quick. I know you're busy.\u201d"),
        ("2. Connect (30 seconds)", "Make it about <i>them</i>. Use what you found online.",
         "\u201cI love what you've done with the store. I saw your [Facebook post / reviews] about [specific thing]. "
         "How long have you been open?\u201d"),
        ("3. Ask (60 seconds)", "Questions, not a pitch. Listen more than you talk.",
         "\u201cCan customers buy from you online right now?\u201d  \u00b7  \u201cHow do out-of-town customers order?\u201d  \u00b7  "
         "\u201cHave you ever thought about selling online? What stopped you?\u201d"),
        ("4. Share (60 seconds)", "Tie what they said to what you do. Show a demo on the tablet.",
         "\u201cThat's exactly what I help with. I build online stores for local shops. I design it, load your products, "
         "set up payments and keep it running, so you don't have to touch the tech. Here's one I built for a boutique...\u201d"),
        ("5. Next step (30 seconds)", "Offer the free check-up or a short follow-up. Get a name and number.",
         "\u201cI do a free 15-minute online store check-up for local businesses. It shows exactly where customers are slipping "
         "away. Could I drop it off Thursday, or would a quick call work better?\u201d"),
    ]
    for name, tip, line in steps:
        story.append(KeepTogether([Paragraph(name, st["h3"]), Paragraph(tip, st["small"]), Spacer(1, 3), say(line, W), Spacer(1, 4)]))

    story.append(Paragraph("If the owner isn't in", st["h2"]))
    story.append(say("\u201cNo problem! Could you give the owner this? It has my number and a free check-up offer. "
                     "What's the best time to catch them?\u201d", W))
    story.append(Spacer(1, 4))
    story += bullets(["Write the owner's name and best time on your tracker. Come back once. If there's still no luck, call."])

    story.append(CondPageBreak(3 * inch))
    story.append(Spacer(1, 10))
    story += title_block("Handling objections", "Common Objections & Responses")
    story.append(Paragraph("Acknowledge first (\u201cThat makes sense\u201d), then answer, then ask a question. Never argue. "
                           "If it's a firm no, thank them and leave a card.", st["body"]))
    objections = [
        ("\u201cWe're not interested.\u201d",
         "\u201cTotally fair. Can I ask, is that because you already sell online, or it's just not a priority right now?\u201d "
         "(Then leave the flyer: \u201cIf that ever changes, I'm local.\u201d)"),
        ("\u201cIt's too expensive.\u201d",
         "\u201cI hear you. Packages start at $1,500, and most shops make that back from a handful of online orders a month. "
         "What would 10 extra orders a month mean for you?\u201d"),
        ("\u201cI don't have time for this.\u201d",
         "\u201cThat's exactly why I do it all for you. After one short meeting you just approve things. You won't be "
         "building anything.\u201d"),
        ("\u201cMy nephew / a friend does our website.\u201d",
         "\u201cThat's great to have family help. Does it let customers buy online? I can work alongside them, or just "
         "handle the store and ads so they don't have to.\u201d"),
        ("\u201cWe tried Shopify / Wix and it didn't work.\u201d",
         "\u201cA lot of owners tell me that. Those tools hand you a blank template. I build it, stock it and market it for you, "
         "and I'm right here in Tyler if anything breaks.\u201d"),
        ("\u201cWe're fine with Facebook.\u201d",
         "\u201cFacebook is great for getting noticed. A store lets people actually buy at 10 p.m. when you're closed, and you own "
         "the customer list instead of the algorithm.\u201d"),
        ("\u201cMy customers are all local.\u201d",
         "\u201cLocal customers shop online too. Online orders with curbside pickup or local delivery are a big part of it, "
         "especially around the holidays.\u201d"),
        ("\u201cSend me some information.\u201d",
         "\u201cHappy to! Here's a flyer. What's the best email? I'll also send a quick check-up of your online presence so it's "
         "specific to you. Can I follow up Friday?\u201d"),
        ("\u201cWe're too small for a website.\u201d",
         "\u201cMost of my clients are small, family-owned shops. The Launch package is built for exactly that: simple, affordable, "
         "and ready in about two weeks.\u201d"),
        ("\u201cWho are you? How do I know you're legit?\u201d",
         f"\u201cGood question. You should ask. I'm {FOUNDER}, owner of {COMPANY}, based here in Tyler. Here's my card and a live demo "
         "store I built. I'm happy to meet anytime.\u201d"),
        ("\u201cCome back after the holidays.\u201d",
         "\u201cWill do. Just so you know, stores take 2 to 4 weeks to build, so starting in January means you're ready for "
         "Valentine's Day and spring. Can I pencil in a call for the first week of January?\u201d"),
    ]
    story.append(table([["They say...", "You say..."]] + [[o, r] for o, r in objections], [0.28, 0.72], W, bold_first=True, pad=6))

    story.append(Paragraph("Closing a ready buyer", st["h2"]))
    story += bullets([
        "Recommend one package based on what they told you. Don't read the whole price list.",
        "Confirm scope in writing: a simple statement of work with package, price, timeline and what you need from them.",
        "Collect the 50% deposit (card reader or invoice) paid to the business, never to you personally.",
        "Book the brand workshop before you leave. Momentum matters."])

    story.append(Paragraph("After every visit", st["h2"]))
    story += bullets([
        "Log it in the prospect tracker <b>before</b> you walk into the next business.",
        "Send a thank-you text or email within 24 hours: \u201cThanks for your time today, [Name]. Great to meet you.\u201d",
        "Deliver the check-up within a week. Then follow up at 2\u20133 weeks and monthly after that.",
        "Ask every owner: \u201cDo you know another business owner who might want this?\u201d"])
    story.append(Spacer(1, 6))
    story.append(note("A good day is 10\u201315 visits, 3\u20135 real conversations, and 1\u20132 check-ups or follow-up calls booked. "
                      "Track these numbers weekly: they tell you what's working.", "Daily target", W))
    doc.build(story, onFirstPage=header_footer("Door-to-Door Playbook"), onLaterPages=header_footer("Door-to-Door Playbook"))
    return out


# =================================================================================
# 4. PROSPECT TRACKER (printable, landscape)
# =================================================================================
def tracker():
    out = os.path.join(HERE, "4_Prospect_Tracker.pdf")
    M = 0.5 * inch
    ps = landscape(letter)
    doc = SimpleDocTemplate(out, pagesize=ps, leftMargin=M, rightMargin=M, topMargin=0.8 * inch,
                            bottomMargin=0.75 * inch, title=f"{COMPANY} - Prospect Tracker", author=FOUNDER)
    W = ps[0] - 2 * M
    story = title_block("Field log", "Prospect Tracker")

    guide = table([["Status code", "Meaning", "Next step"],
                   ["NV", "Not visited yet (on the route list)", "Visit during best hours"],
                   ["OUT", "Owner not in", "Return once at the best time noted, then call"],
                   ["NI", "Not interested now", "Leave flyer; check back in 3\u20136 months"],
                   ["CU", "Check-up agreed", "Deliver check-up within 7 days"],
                   ["MTG", "Meeting / demo booked", "Prepare a demo matched to their business"],
                   ["PROP", "Proposal sent", "Follow up in 2\u20133 days"],
                   ["WON", "Signed + deposit paid", "Book brand workshop; ask for referrals"],
                   ["DNC", "Do not contact (No Soliciting sign or asked not to return)", "Remove from route"]],
                  [0.1, 0.45, 0.45], W * 0.62, bold_first=True, pad=3)
    fit = table([["Hot-lead signs (circle on log)", ""],
                 ["No website, or Facebook only", "<font name='Sym'>\u2605</font>"], ["Can't buy online", "<font name='Sym'>\u2605</font>"],
                 ["Out-of-town customers ask to order", "<font name='Sym'>\u2605</font>"], ["Owner mentions wanting to grow", "<font name='Sym'>\u2605</font>"],
                 ["Busy, well-reviewed store", "<font name='Sym'>\u2605</font>"]],
                [0.85, 0.15], W * 0.34, bold_first=False, pad=3,
                extra=[("SPAN", (0, 0), (1, 0)), ("TEXTCOLOR", (1, 1), (1, -1), AMBER)])
    top = Table([[guide, fit]], colWidths=[W * 0.64, W * 0.36])
    top.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
    story += [top, Spacer(1, 8)]

    wk = table([["Weekly scorecard", "Mon", "Tue", "Wed", "Thu", "Fri", "Week total", "Goal"],
                ["Businesses visited", "", "", "", "", "", "", "50"],
                ["Owner conversations", "", "", "", "", "", "", "15"],
                ["Check-ups / meetings booked", "", "", "", "", "", "", "5"],
                ["Proposals sent", "", "", "", "", "", "", "2"],
                ["Clients won", "", "", "", "", "", "", "1"]],
               [0.26, 0.09, 0.09, 0.09, 0.09, 0.09, 0.14, 0.15], W, bold_first=True, pad=5,
               extra=[("ALIGN", (1, 0), (-1, -1), "CENTER")])
    story.append(wk)

    cols = ["#", "Date", "Business name", "Owner / contact", "Phone / email", "Area / address", "Type", "Status",
            "Notes (gaps, interest, best time)", "Next step & date"]
    widths = [0.03, 0.06, 0.13, 0.11, 0.12, 0.12, 0.07, 0.06, 0.19, 0.11]
    for page in range(3):
        story.append(PageBreak())
        story.append(Paragraph(f"Visit log  \u00b7  Route / area: ____________________________   Week of: ______________",
                               S("vl", fontName="Semi", fontSize=10, textColor=NAVY, spaceAfter=6)))
        rows = [cols] + [[str(page * 15 + i + 1)] + [""] * (len(cols) - 1) for i in range(15)]
        story.append(table(rows, widths, W, pad=2, heights=[0.3 * inch] + [0.4 * inch] * 15,
                           extra=[("LINEAFTER", (0, 0), (-2, -1), 0.4, RULE)]))
    hf = header_footer("Prospect Tracker")
    doc.build(story, onFirstPage=hf, onLaterPages=hf)
    return out


if __name__ == "__main__":
    for f in (flyer, checkup, script, tracker):
        print("wrote", f())
