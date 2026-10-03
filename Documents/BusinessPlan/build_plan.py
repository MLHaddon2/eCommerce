"""Builds Skelli-Sites_Business_Plan.pdf. Run:  python build_plan.py"""
import os
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate, NextPageTemplate, Paragraph,
                                Spacer, PageBreak, Table, TableStyle, Image, KeepTogether, CondPageBreak)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus.flowables import Flowable

import model
import charts
from content import MARKETING_BUDGET

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "Skelli-Sites_Business_Plan.pdf")
CHART_DIR = os.path.join(HERE, "_charts")

COMPANY = "Skelli-Sites"
FOUNDER = "Mike Haddon"
DATE = "September 2026"
EMAIL = "haddon.mike2@outlook.com"
PHONE = "903-275-0013"

# ---- Fonts & colors ---------------------------------------------------------
FD = r"C:\Windows\Fonts"
try:
    pdfmetrics.registerFont(TTFont("Body", os.path.join(FD, "segoeui.ttf")))
    pdfmetrics.registerFont(TTFont("Body-Bold", os.path.join(FD, "segoeuib.ttf")))
    pdfmetrics.registerFont(TTFont("Body-Italic", os.path.join(FD, "segoeuii.ttf")))
    pdfmetrics.registerFont(TTFont("Body-SemiBold", os.path.join(FD, "seguisb.ttf")))
    pdfmetrics.registerFont(TTFont("Head", os.path.join(FD, "georgiab.ttf")))
    pdfmetrics.registerFont(TTFont("Head-Reg", os.path.join(FD, "georgia.ttf")))
    from reportlab.pdfbase.pdfmetrics import registerFontFamily
    registerFontFamily("Body", normal="Body", bold="Body-Bold", italic="Body-Italic", boldItalic="Body-Bold")
    BODY, BOLD, HEAD, HEADREG, SEMI = "Body", "Body-Bold", "Head", "Head-Reg", "Body-SemiBold"
except Exception:
    BODY, BOLD, HEAD, HEADREG, SEMI = "Helvetica", "Helvetica-Bold", "Times-Bold", "Times-Roman", "Helvetica-Bold"

NAVY = colors.HexColor("#1B2A41")
AMBER = colors.HexColor("#E08A1E")
TEAL = colors.HexColor("#2A9D8F")
INK = colors.HexColor("#27303F")
MUTED = colors.HexColor("#6B7588")
RULE = colors.HexColor("#D5DAE3")
LIGHT = colors.HexColor("#F2F4F8")
NOTE_BG = colors.HexColor("#FFF6E8")

ss = {
    "body": ParagraphStyle("body", fontName=BODY, fontSize=9.6, leading=14, textColor=INK, spaceAfter=6),
    "small": ParagraphStyle("small", fontName=BODY, fontSize=8, leading=10.5, textColor=INK),
    "smallb": ParagraphStyle("smallb", fontName=BOLD, fontSize=8, leading=10.5, textColor=colors.white),
    "cell": ParagraphStyle("cell", fontName=BODY, fontSize=8.4, leading=11, textColor=INK),
    "cellb": ParagraphStyle("cellb", fontName=SEMI, fontSize=8.4, leading=11, textColor=INK),
    "bullet": ParagraphStyle("bullet", fontName=BODY, fontSize=9.6, leading=13.5, textColor=INK,
                             leftIndent=14, bulletIndent=3, spaceAfter=2.5),
    "h1": ParagraphStyle("h1", fontName=HEAD, fontSize=19, leading=24, textColor=NAVY, spaceBefore=2, spaceAfter=4),
    "h2": ParagraphStyle("h2", fontName=SEMI, fontSize=11.5, leading=15, textColor=NAVY, spaceBefore=9, spaceAfter=4),
    "h3": ParagraphStyle("h3", fontName=BOLD, fontSize=9.6, leading=13, textColor=TEAL, spaceBefore=6, spaceAfter=2),
    "kicker": ParagraphStyle("kicker", fontName=BOLD, fontSize=8, leading=10, textColor=AMBER, spaceAfter=0),
    "note": ParagraphStyle("note", fontName=BODY, fontSize=8.6, leading=12, textColor=INK),
    "quote": ParagraphStyle("quote", fontName=HEADREG, fontSize=12.5, leading=18, textColor=NAVY, alignment=TA_LEFT),
    "toc0": ParagraphStyle("toc0", fontName=BOLD, fontSize=10, leading=13, textColor=NAVY, spaceBefore=3),
    "toc1": ParagraphStyle("toc1", fontName=BODY, fontSize=9.2, leading=11.3, textColor=INK, leftIndent=14),
}

W = letter[0] - 2 * 0.9 * inch   # content width


# ---- Doc template with TOC + bookmarks --------------------------------------
class PlanDoc(BaseDocTemplate):
    def __init__(self, fn, **kw):
        super().__init__(fn, pagesize=letter, leftMargin=0.9 * inch, rightMargin=0.9 * inch,
                         topMargin=0.95 * inch, bottomMargin=0.85 * inch,
                         title=f"{COMPANY} - Business & Marketing Plan", author=FOUNDER, **kw)
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="f")
        self.addPageTemplates([
            PageTemplate("cover", frames=[frame], onPage=draw_cover),
            PageTemplate("part", frames=[frame], onPage=draw_part_bg),
            PageTemplate("body", frames=[frame], onPage=draw_body),
        ])
        self._n = 0

    def beforeDocument(self):
        self._n = 0          # keep bookmark keys stable across multiBuild passes

    def afterFlowable(self, f):
        if isinstance(f, Paragraph) and hasattr(f, "_toc"):
            level, text = f._toc
            self._n += 1
            key = f"k{self._n}"
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(text, key, level=level, closed=level == 0)
            self.notify("TOCEntry", (level, text, self.page, key))


def draw_cover(c, doc):
    w, h = letter
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, 0, w, h, stroke=0, fill=1)
    c.setFillColor(AMBER); c.rect(0.9 * inch, h - 2.35 * inch, 0.9 * inch, 5, stroke=0, fill=1)
    # simple "skeleton frame" motif
    c.setStrokeColor(colors.HexColor("#2E4263")); c.setLineWidth(1)
    for i in range(7):
        x = w - 3.2 * inch + i * 0.42 * inch
        c.line(x, 1.2 * inch, x, 4.2 * inch)
    for j in range(8):
        y = 1.2 * inch + j * 0.42 * inch
        c.line(w - 3.2 * inch, y, w - 3.2 * inch + 6 * 0.42 * inch, y)
    c.setFillColor(AMBER)
    for (i, j) in [(1, 2), (3, 5), (5, 1), (2, 6), (4, 3)]:
        c.circle(w - 3.2 * inch + i * 0.42 * inch, 1.2 * inch + j * 0.42 * inch, 3.5, stroke=0, fill=1)
    # wordmark
    c.setFillColor(colors.white); c.setFont(BOLD, 11)
    c.drawString(0.9 * inch, h - 1.2 * inch, COMPANY.upper())
    c.setFillColor(AMBER); c.circle(0.9 * inch + c.stringWidth(COMPANY.upper(), BOLD, 11) + 6, h - 1.2 * inch + 3.5, 3, stroke=0, fill=1)
    c.setFillColor(colors.white); c.setFont(HEAD, 34)
    c.drawString(0.9 * inch, h - 3.05 * inch, "Business &")
    c.drawString(0.9 * inch, h - 3.6 * inch, "Marketing Plan")
    c.setFont(HEAD, 20); c.setFillColor(AMBER)
    c.drawString(0.9 * inch, h - 4.2 * inch, COMPANY)
    c.setFont("Body-Italic" if BODY == "Body" else BODY, 11); c.setFillColor(colors.HexColor("#C9D2E0"))
    c.drawString(0.9 * inch, h - 4.55 * inch, "\u201cYour brand, built to sell.\u201d")
    c.setFont(BODY, 10); c.setFillColor(colors.HexColor("#C9D2E0"))
    y = 2.3 * inch
    for line in [f"Prepared by {FOUNDER}, Founder", "Tyler, Texas", DATE, f"{EMAIL}  |  {PHONE}"]:
        c.drawString(0.9 * inch, y, line); y -= 16
    c.setFillColor(AMBER); c.setFont(BOLD, 9)
    c.drawString(0.9 * inch, 0.8 * inch, "CONFIDENTIAL")
    c.restoreState()


def draw_part_bg(c, doc):
    w, h = letter
    c.saveState()
    c.setFillColor(NAVY); c.rect(0, 0, w, h, stroke=0, fill=1)
    c.setFillColor(AMBER); c.rect(0, 0, 0.28 * inch, h, stroke=0, fill=1)
    c.restoreState()


def draw_body(c, doc):
    w, h = letter
    c.saveState()
    c.setStrokeColor(RULE); c.setLineWidth(0.6)
    c.line(0.9 * inch, h - 0.62 * inch, w - 0.9 * inch, h - 0.62 * inch)
    c.setFont(BOLD, 7.5); c.setFillColor(NAVY)
    c.drawString(0.9 * inch, h - 0.55 * inch, COMPANY.upper())
    c.setFont(BODY, 7.5); c.setFillColor(MUTED)
    c.drawRightString(w - 0.9 * inch, h - 0.55 * inch, f"Business & Marketing Plan  \u00b7  {DATE}")
    c.line(0.9 * inch, 0.6 * inch, w - 0.9 * inch, 0.6 * inch)
    c.drawString(0.9 * inch, 0.45 * inch, f"Confidential  \u00b7  {EMAIL}  \u00b7  {PHONE}")
    c.setFont(BOLD, 8); c.setFillColor(NAVY)
    c.drawRightString(w - 0.9 * inch, 0.45 * inch, str(doc.page))
    c.restoreState()


# ---- Flowable helpers ---------------------------------------------------------
story = []
_sec = [0]


def P(t, st="body"):
    story.append(Paragraph(t, ss[st]))


def H1(t, kicker=None, new_page=True):
    if new_page:
        story.append(PageBreak())
    _sec[0] += 1
    label = f"{_sec[0]}. {t}"
    if kicker:
        story.append(Paragraph(kicker.upper(), ss["kicker"]))
    p = Paragraph(label, ss["h1"]); p._toc = (1, label)
    story.append(p)
    story.append(Rule())


def H2(t, need=1.1):
    story.append(CondPageBreak(need * inch))
    story.append(Paragraph(t, ss["h2"]))


def H3(t):
    story.append(Paragraph(t, ss["h3"]))


def B(items, st="bullet"):
    for it in items:
        story.append(Paragraph(it, ss[st], bulletText="\u2022"))
    story.append(Spacer(1, 4))


def SP(h=6):
    story.append(Spacer(1, h))


class Rule(Flowable):
    def wrap(self, aw, ah):
        self.aw = aw; return aw, 10

    def draw(self):
        self.canv.setFillColor(AMBER); self.canv.rect(0, 5, 36, 2.4, stroke=0, fill=1)
        self.canv.setStrokeColor(RULE); self.canv.setLineWidth(0.6); self.canv.line(40, 6.2, self.aw, 6.2)


def T(rows, widths, header=True, zebra=True, bold_first_col=False, align_right_from=None, total_row=False):
    data = []
    for i, r in enumerate(rows):
        row = []
        for j, v in enumerate(r):
            if isinstance(v, Flowable):
                row.append(v); continue
            if i == 0 and header:
                row.append(Paragraph(str(v), ss["smallb"]))
            elif (bold_first_col and j == 0) or (total_row and i == len(rows) - 1):
                row.append(Paragraph(str(v), ss["cellb"]))
            else:
                row.append(Paragraph(str(v), ss["cell"]))
        data.append(row)
    t = Table(data, colWidths=[w * W for w in widths], repeatRows=1 if header else 0)
    cmds = [("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE)]
    if header:
        cmds += [("BACKGROUND", (0, 0), (-1, 0), NAVY)]
    if zebra:
        for i in range(1 if header else 0, len(rows)):
            if i % 2 == 0:
                cmds.append(("BACKGROUND", (0, i), (-1, i), LIGHT))
    if total_row:
        cmds += [("LINEABOVE", (0, -1), (-1, -1), 1, NAVY), ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#E3E8F0"))]
    t.setStyle(TableStyle(cmds))
    if align_right_from is not None:
        for row in data[1:] if header else data:
            for cell in row[align_right_from:]:
                if isinstance(cell, Paragraph):
                    cell.style = ParagraphStyle("r", parent=cell.style, alignment=2)
    story.append(t)
    SP(8)


def NOTE(t, title="Note"):
    inner = Paragraph(f"<font name='{BOLD}' color='#B8680A'>{title.upper()}:</font>  {t}", ss["note"])
    box = Table([[inner]], colWidths=[W])
    box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), NOTE_BG),
                             ("LINEBEFORE", (0, 0), (0, -1), 3, AMBER),
                             ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                             ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    story.append(KeepTogether([box, Spacer(1, 8)]))


def CALLOUT(t):
    box = Table([[Paragraph(t, ss["quote"])]], colWidths=[W])
    box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), LIGHT), ("LINEBEFORE", (0, 0), (0, -1), 3, NAVY),
                             ("LEFTPADDING", (0, 0), (-1, -1), 14), ("TOPPADDING", (0, 0), (-1, -1), 10),
                             ("BOTTOMPADDING", (0, 0), (-1, -1), 10)]))
    story.append(box); SP(8)


def KPI_ROW(items):
    """items: list of (value, label)."""
    cells = [[Paragraph(f"<font name='{HEAD}' size='16' color='#1B2A41'>{v}</font><br/>"
                        f"<font size='7.5' color='#6B7588'>{l}</font>", ss["cell"]) for v, l in items]]
    t = Table(cells, colWidths=[W / len(items)] * len(items))
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), LIGHT), ("LINEAFTER", (0, 0), (-2, -1), 0.6, colors.white),
                           ("TOPPADDING", (0, 0), (-1, -1), 9), ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
                           ("LEFTPADDING", (0, 0), (-1, -1), 10), ("LINEABOVE", (0, 0), (-1, 0), 2, AMBER)]))
    story.append(t); SP(10)


def IMG(path, width=W):
    from reportlab.lib.utils import ImageReader
    iw, ih = ImageReader(path).getSize()
    story.append(Image(path, width=width, height=width * ih / iw)); SP(6)


def PART(num, title, blurb):
    story.append(NextPageTemplate("part")); story.append(PageBreak())
    story.append(Spacer(1, 2.2 * inch))
    story.append(Paragraph(f"PART {num}", ParagraphStyle("pk", fontName=BOLD, fontSize=11, textColor=AMBER, leading=14)))
    p = Paragraph(title, ParagraphStyle("pt", fontName=HEAD, fontSize=34, leading=40, textColor=colors.white, spaceBefore=6))
    p._toc = (0, f"Part {num}: {title}")
    story.append(p)
    story.append(Spacer(1, 12))
    story.append(Paragraph(blurb, ParagraphStyle("pb", fontName=BODY, fontSize=11.5, leading=17, textColor=colors.HexColor("#C9D2E0"))))
    story.append(NextPageTemplate("body"))
    story.append(PageBreak())


def usd(v, dec=0):
    s = f"${abs(v):,.{dec}f}"
    return f"({s})" if v < 0 else s


# ---- Model outputs ---------------------------------------------------------------
paths, RUNS, YEARS = charts.render(CHART_DIR)
EXP = YEARS["Expected"]
EXPM = RUNS["Expected"]
STARTUP_TOTAL = sum(c for _, c in model.STARTUP_COSTS)
be_month = next(r["m"] for r in EXPM if r["net"] > 0)
mrr_cover = next((r["m"] for r in EXPM if r["mrr"] >= r["total_opex"] + r["cogs"] - r["setup"] * model.CONTRACTOR_PCT), None)
y1_mktg = sum(v for _, v, _ in MARKETING_BUDGET)
# recurring break-even: monthly-plan contribution covers all fixed costs
# (first month from which it holds for the rest of the projection, so the draw starting in M7 is included)
_cov = [r["mrr"] * (1 - model.PROCESSING_PCT) - r["active"] * model.HOSTING_PER_CLIENT >= r["total_opex"] for r in EXPM]
rec_be = next(i + 1 for i in range(len(_cov)) if all(_cov[i:]))
cap_back = next(r["m"] for r in EXPM if r["cash"] >= model.OWNER_CONTRIBUTION)
_fixed_y1 = sum(r["total_opex"] for r in EXPM[6:12]) / 6
rec_y1 = next(r["m"] for r in EXPM
              if r["mrr"] * (1 - model.PROCESSING_PCT) - r["active"] * model.HOSTING_PER_CLIENT >= _fixed_y1)

# =================================================================================
# FRONT MATTER
# =================================================================================
story.append(NextPageTemplate("body"))
story.append(PageBreak())

story.append(Paragraph("Contents", ss["h1"])); story.append(Rule()); SP(4)
toc = TableOfContents(); toc.levelStyles = [ss["toc0"], ss["toc1"]]; toc.dotsMinLevel = 1
story.append(toc)

story.append(PageBreak())
story.append(Paragraph("Confidentiality Statement", ss["h1"])); story.append(Rule())
P(f"This business plan contains confidential and proprietary information about {COMPANY}, "
  f"a Tyler, Texas business owned by {FOUNDER}. It is provided only to evaluate a possible business relationship, "
  "investment, loan or partnership. By accepting this document the recipient agrees not to copy, share or disclose "
  "any part of it, and to return or destroy it on request.")
P("The document includes forward-looking statements, projections and assumptions about markets, customers and "
  "financial results. They are good-faith estimates, not guarantees. Actual results may differ materially.")
SP(20)
T([["Recipient name", "Organization", "Date received", "Signature"], ["", "", "", ""], ["", "", "", ""]],
  [0.28, 0.28, 0.18, 0.26], zebra=False)
SP(10)
P(f"<b>Contact:</b> {FOUNDER}, Founder  \u00b7  {EMAIL}  \u00b7  {PHONE}  \u00b7  Tyler, Texas")

# =================================================================================
# PART I - BUSINESS PLAN
# =================================================================================
PART("I", "The Business Plan", "What we are building, who it serves, the market we are entering and how the company "
     "will run day to day.")

# 4. Executive summary -------------------------------------------------------------
_sec[0] = 3
H1("Executive Summary", "Overview", new_page=False)
CALLOUT(f"{COMPANY} builds, launches and runs branded online stores for small businesses and dropshippers, "
        "so owners can sell under their own brand without managing any technology.")
P(f"<b>The opportunity.</b> Small businesses and new dropshipping sellers can pick from plenty of tools. What they lack is "
  "time, technical skill and brand-building know-how. DIY builders such as Shopify and Wix hand them a blank template and "
  "an app store. Agencies charge $5,000 to $25,000 or more. Freelance marketplaces are inconsistent. Many dropshipping stores fail "
  "because they look generic, earn little trust and convert poorly.")
P(f"<b>The solution.</b> {COMPANY} is a custom-built, full-stack eCommerce platform (React, Node.js/Express, MySQL, "
  "AWS). It already includes a storefront, persistent cart, Square and PayPal checkout, saved payment methods, and an "
  "admin panel for products, orders, customers and transactions. On top of the platform we sell a <b>done-for-you</b> "
  "service. We design the brand, build and stock the store, connect payments and fulfillment, launch it, then keep "
  "it running and growing with hosting, maintenance and ad management for a monthly fee.")
P("<b>Target customers.</b> (1) Local and regional small businesses in Tyler and East Texas, such as boutiques, "
  "makers, specialty food, salons with retail and service businesses adding products. (2) Online-first "
  "dropshipping and print-on-demand entrepreneurs anywhere in the U.S. who want a real brand instead of a generic store.")
P(f"<b>Business model.</b> A one-time implementation fee ($1,500 to $6,500+, averaging about {usd(model.AVG_SETUP)}) "
  f"plus a monthly plan ($149 to $899, averaging about {usd(model.AVG_MRR)}) that covers hosting, maintenance, "
  "support and, on higher tiers, ad and email marketing management. Clients pay their ad spend directly to the ad platforms.")
P(f"<b>Where we are.</b> The MVP is deployed on AWS EC2 and is being polished. The platform should be production-complete "
  "within about a month (target: late October 2026). The company is self-funded by the founder.")
H2("Financial highlights (expected case)")
KPI_ROW([(usd(EXP[0]["revenue"]), "Year 1 revenue"), (usd(EXP[1]["revenue"]), "Year 2 revenue"),
         (usd(EXP[2]["revenue"]), "Year 3 revenue"), (f"Month {cap_back}", "Startup capital recovered*")])
KPI_ROW([(f"{EXP[0]['new']:.0f}", "Clients launched, Year 1"), (f"{EXP[2]['active_end']:.0f}", "Active clients, end Year 3"),
         (usd(EXP[2]["mrr_end"]), "Monthly recurring revenue, end Year 3"), (usd(STARTUP_TOTAL), "Startup costs")])
P(f"<font size='7.5' color='#6B7588'>*The month cumulative cash first exceeds the founder's starting contribution. "
  f"Monthly plans alone cover the Year 1 fixed cost base, including the owner's draw, from about Month {rec_y1}.</font>")
P(f"<b>Funding.</b> The founder is contributing {usd(model.OWNER_CONTRIBUTION)} to cover startup costs and a cash reserve. "
  "At the modeled pace the business funds itself from early revenue. Outside funding (an SBA microloan or a small "
  "angel round) is optional and would only speed up hiring and marketing (Section 27).")

# 5. Company description ----------------------------------------------------------
H1("Company Description", "Who we are")
H2("Mission")
P("To give every small business and independent seller a professional, trustworthy brand and online store, "
  "built for them, so they can focus on their products and customers instead of technology.")
H2("Vision")
P("Become the go-to eCommerce launch partner in East Texas within three years, and a recognized national "
  "brand-building service for dropshipping and print-on-demand entrepreneurs.")
H2("Core values")
T([["Value", "What it means in practice"],
   ["Ownership for the client", "Clients own their brand, domain, customer list and content. No lock-in on their data."],
   ["Done means done", "We deliver working stores, not to-do lists. Launch day includes live payments and a first marketing push."],
   ["Plain-English partnership", "No jargon. Monthly reports explain what happened, why, and what we will do next."],
   ["Security by default", "Tokenized payments, JWT authentication, role-based admin access, HTTPS and regular backups."],
   ["Local first, online everywhere", "Face-to-face service in Tyler, with remote service for clients across the U.S."]],
  [0.3, 0.7], bold_first_col=True)
H2("Business concept")
P("The name <b>Skelli-Sites</b> comes from the product itself: a reusable <b>eCommerce \u201cskeleton\u201d</b>, a solid, tested "
  "codebase that already handles the hard, repetitive parts of online selling (catalog, cart, checkout, payments, "
  "customers, orders and admin). For each client we add a custom brand \u201cskin\u201d and fill it with their products. "
  "Because the core is reused, we can deliver a custom-looking store faster and cheaper than an agency building "
  "from scratch. Because it is our own code, we can customize it far more than a hosted-template platform allows.")
H2("Company facts")
T([["Item", "Detail"],
   ["Company name", COMPANY],
   ["Legal entity", f"Recommended: {COMPANY} LLC (Texas Limited Liability Company)"],
   ["Location", "Tyler, Texas (Smith County). Home-based to start; coworking space planned for Year 3"],
   ["Owner", f"{FOUNDER}, Founder & Lead Developer (100%)"],
   ["Contact", f"{EMAIL}  \u00b7  {PHONE}"],
   ["Stage", "Pre-revenue. MVP deployed on AWS; product polish underway; production launch targeted late October 2026"],
   ["Industry", "eCommerce development & digital marketing services (NAICS 541511 Custom Computer Programming; 541613 Marketing Consulting)"],
   ["Funding", "Self-funded; may pursue SBA microloan or angel funding for growth"]],
  [0.3, 0.7], bold_first_col=True)
NOTE("Texas LLC formation (Form 205) costs $300 with the Secretary of State. If the brand name differs from the LLC name, "
     "file an Assumed Name Certificate. Check City of Tyler rules on home-based businesses. Texas has no personal "
     "income tax. Confirm franchise-tax and sales-tax obligations with a CPA (see Section 28).", "Legal to-do")
H2("Milestones reached")
B(["Full-stack platform built: React 19 storefront, Node.js/Express 5 API, MySQL via Sequelize ORM.",
   "Payments: Square Web Payments (card) and PayPal integrations, with payment create, complete, refund and list endpoints.",
   "Accounts & security: registration and login, JWT access and refresh tokens, protected admin routes, role-based admin access.",
   "Admin panel with Products, Orders, Customers and Transactions management, including order status tracking.",
   "Cart persistence for guests and logged-in users (local storage plus server sync), merged when a guest logs in.",
   "Checkout conveniences: saved cards, default card, and geolocation-assisted address prefill.",
   "Donation-type products supported in the data model (useful for nonprofit and fundraising clients).",
   "MVP deployed to Amazon EC2. Responsive navigation reworked for mobile."])

# 6. Problem & solution -----------------------------------------------------------
H1("Problem & Solution", "Why this business should exist")
H2("The problems our customers face")
T([["Pain point", "Who feels it", "What it costs them"],
   ["No time or technical skill to build a store", "Local owners already working full time in the business", "Months of delay; online sales never start"],
   ["Generic, untrustworthy-looking stores", "New dropshippers using default themes", "Low conversion; customers leave before buying"],
   ["Too many tools and apps to stitch together", "Everyone on DIY platforms", "Mounting app subscriptions, broken integrations, wasted evenings"],
   ["No brand: logo, voice or story", "First-time founders", "Competing on price alone against Amazon and Temu"],
   ["Marketing is a black box", "Owners who launch and then hear crickets", "Wasted ad spend; no idea what is working"],
   ["Agencies are too expensive", "Businesses under ~$500k in revenue", "$5k to $25k+ quotes put a real store out of reach"]],
  [0.33, 0.33, 0.34])
H2("Our solution")
T([["Problem", f"How {COMPANY} solves it"],
   ["No time or skill", "Done-for-you build: we handle design, setup, product entry, payments and launch."],
   ["Generic stores", "Every store starts with a brand kit (logo, palette, typography, voice) and a custom theme on our platform."],
   ["Tool sprawl", "One platform, one monthly bill: hosting, security, updates, backups and support included."],
   ["No brand", "Brand discovery workshop and positioning statement included in Brand and Signature tiers."],
   ["Marketing black box", "Growth and Scale plans include ad management and plain-English monthly reports."],
   ["Agency pricing", "The reusable platform core lets us charge $1,500 to $6,500 for work agencies price at 3 to 5 times that."]],
  [0.25, 0.75], bold_first_col=True)

# 7. Products & services ----------------------------------------------------------
H1("Products & Services", "What we sell")
H2("The platform (what every client gets)")
T([["Capability", "Status", "Client benefit"],
   ["Branded storefront, product catalog, categories, product pages", "Built", "A professional store that looks like their brand"],
   ["Persistent shopping cart (guest and signed-in)", "Built", "Fewer abandoned carts"],
   ["Card checkout via Square; PayPal checkout", "Built", "Trusted payment options; tokenized, PCI-friendly"],
   ["Customer accounts, saved cards, address prefill", "Built", "Faster repeat purchases"],
   ["Admin panel: products, inventory, orders, customers, transactions", "Built", "Run the business from one dashboard"],
   ["Refunds and payment management", "Built", "Handle customer service without leaving the admin"],
   ["Donation products", "Built (polishing)", "Fundraising for nonprofits, churches and schools"],
   ["HTTPS and custom domain", "In progress", "Security, SEO and trust"],
   ["Buy-now-pay-later (Klarna, Afterpay)", "Planned", "Higher average order value"],
   ["Product reviews", "Planned (admin-ready)", "Social proof"],
   ["Shipping and logistics integration, order confirmation emails", "Planned", "Automated fulfillment and customer updates"],
   ["Dropship supplier integrations (product import and order routing)", "Planned", "Hands-off fulfillment for dropshippers"],
   ["Analytics dashboard (sales, traffic, conversion)", "Planned", "Clear view of performance"]],
  [0.46, 0.17, 0.37])
H2("Implementation packages (one-time)")
T([["", "Launch  \u2014  $1,500", "Brand  \u2014  $3,500", "Signature  \u2014  $6,500+"],
   ["Best for", "Dropshippers and simple catalogs", "Small businesses building a real brand", "Established businesses; complex catalogs"],
   ["Brand identity", "Logo refresh or simple wordmark, color palette", "Full brand kit: logo, palette, fonts, voice guide", "Brand strategy workshop + full kit + brand story"],
   ["Store design", "Themed platform template", "Custom-styled theme", "Fully custom design, custom features"],
   ["Products loaded", "Up to 50", "Up to 250", "Unlimited / bulk import"],
   ["Content", "Core pages (Home, About, FAQ, Policies)", "Core pages + product copywriting (top 25)", "All copy + blog setup + 3 launch articles"],
   ["Integrations", "Square or PayPal", "Square + PayPal, email capture", "All payments, BNPL, shipping, supplier connections"],
   ["SEO", "Basic on-page", "On-page + Google Business Profile", "Full technical SEO + local SEO"],
   ["Launch support", "Launch checklist, 1 training call", "Launch campaign setup, 2 training calls", "Launch campaign + 30 days hands-on support"],
   ["Timeline", "~2 weeks", "~3 to 4 weeks", "~5 to 8 weeks"]],
  [0.16, 0.28, 0.28, 0.28], bold_first_col=True)
H2("Monthly plans (recurring)")
T([["", "Care  \u2014  $149/mo", "Growth  \u2014  $399/mo", "Scale  \u2014  $899/mo"],
   ["Hosting, SSL, backups, security updates", "Included", "Included", "Included"],
   ["Support", "Email, 2-business-day response", "Priority, 1 business day", "Priority + monthly strategy call"],
   ["Content / product updates", "Up to 1 hr/mo", "Up to 3 hrs/mo", "Up to 8 hrs/mo"],
   ["Ad management (client pays ad spend)", "\u2014", "1 channel (Meta or Google), up to $1,500/mo spend", "Multi-channel, up to $5,000/mo spend"],
   ["Email marketing", "\u2014", "1 campaign/mo", "Automated flows + 2 campaigns/mo"],
   ["Reporting", "Quarterly uptime report", "Monthly performance report", "Monthly report + conversion optimization"]],
  [0.28, 0.24, 0.24, 0.24], bold_first_col=True)
NOTE("Client ad spend above the plan limit carries a management fee of 12% of monthly spend. Growth and Scale plans "
     "have a 6-month minimum term. Package contents and prices are reviewed every 6 months.", "Pricing policy")
H2("Add-on services (\u00e0 la carte)")
T([["Add-on", "Price"],
   ["Product photography (Tyler area) / AI-assisted product image editing", "$25 to $40 per product"],
   ["Additional product uploads beyond package", "$5 per product"],
   ["Custom feature development", "$85/hour"],
   ["Logo and brand kit (standalone)", "$500 to $1,200"],
   ["Copywriting: product descriptions / blog articles", "$20 per product / $150 per article"],
   ["Social media profile setup and branding", "$300"],
   ["Store migration from Shopify, Wix or Etsy", "$500+"]],
  [0.7, 0.3], align_right_from=1)
H2("Product roadmap")
T([["Timeframe", "Platform milestones"],
   ["Oct 2026", "Production launch: HTTPS + custom domains, production payment keys, cart-persistence fix on deployed build, image assets"],
   ["Nov 2026 to Jan 2027", "Order confirmation emails, shipping-rate and label integration, account management page, reviews"],
   ["Feb to Apr 2027", "Klarna/Afterpay, dropship supplier import (CSV + API), per-client theming system to cut build time"],
   ["May to Oct 2027", "Client analytics dashboard, abandoned-cart emails, SEO toolkit, automated multi-client deployments"],
   ["Year 2", "Multi-tenant architecture (many stores, one codebase), print-on-demand integrations, client self-service editor"],
   ["Year 3", "Template marketplace, optional lower-cost DIY tier, partner/reseller program for other agencies"]],
  [0.22, 0.78], bold_first_col=True)

# 8. Market analysis --------------------------------------------------------------
H1("Market Analysis", "Who buys and how many")
H2("Industry overview")
P("eCommerce keeps taking share from physical retail. U.S. retail eCommerce sales reached <b>$340.2 billion in the "
  "second quarter of 2026</b>, about $1.3 trillion a year, and made up <b>17.1% of total retail sales</b>, up from 16.9% in "
  "the first quarter (U.S. Census Bureau). Dropshipping, which lets a seller list products without holding inventory, is "
  "one of the fastest-growing ways new sellers enter eCommerce. Research firms size it in the hundreds of billions of "
  "dollars worldwide, with double-digit annual growth.")
P("Three trends matter most to us:")
B(["<b>Brand over product.</b> Marketplaces such as Amazon, Temu and TikTok Shop make generic products cheap and everywhere. "
   "Independent sellers survive by building a brand that customers trust and come back to.",
   "<b>Owner time is scarce.</b> Small business owners say lack of time is a leading barrier to going digital. They "
   "increasingly buy outcomes (\u201ca working store\u201d) instead of tools.",
   "<b>AI lowers build cost but raises the quality bar.</b> Generic AI-built stores are everywhere. Human-led branding "
   "and strategy stand out more, while AI tools let a small team deliver faster."])
NOTE("U.S. Census Bureau, Quarterly Retail E-Commerce Sales, 2nd Quarter 2026; U.S. SBA Office of Advocacy, 2025 "
     "Small Business Profiles; Federal Reserve (FRED) Tyler MSA population series. Full list in Appendix D.", "Sources")
H2("Market sizing (TAM / SAM / SOM)")
T([["Layer", "Definition", "Estimate", "Basis"],
   ["TAM", "U.S. small businesses and online sellers that could pay for eCommerce build and management services",
    "~$10B+/yr", "36.2M U.S. small businesses (SBA, 2025); millions of active online sellers; web design and digital agency spend"],
   ["SAM", "Very small businesses (<$1M revenue) and new/early dropshippers that want done-for-you service at our price point, "
    "reachable through our channels", "~$300M to $500M/yr", "~2% of U.S. small businesses x ~$6,000 first-year spend"],
   ["SOM (3-yr)", "What we can realistically win: East Texas local plus online-sourced dropshippers",
    f"~{usd(EXP[2]['revenue'])}/yr by Year 3", f"~{EXP[2]['active_end']:.0f} active clients (expected case)"]],
  [0.12, 0.38, 0.18, 0.32], bold_first_col=True)
H2("Local market: Tyler & East Texas")
B(["The Tyler metro area (Smith County) has about 250,000 residents (Federal Reserve/Census estimate, 2025). Tyler is a regional retail, medical and education "
   "hub, drawing shoppers from a much larger East Texas area, commonly estimated at over 1 million people.",
   "Its retail base is full of independent boutiques, gift shops, specialty foods, western and outdoor stores, and "
   "makers, many with thin or no online sales.",
   "Local business networks such as the Tyler Area Chamber of Commerce, Tyler Economic Development Council, Small Business "
   "Development Center (SBDC) programs, UT Tyler and Tyler Junior College give us direct, low-cost access to owners.",
   "Few local competitors specialize in eCommerce. Most local web shops build brochure sites on WordPress or Wix."])
H2("Customer segments & personas")
T([["", "Persona A: \u201cMain Street Maria\u201d", "Persona B: \u201cSide-Hustle Sam\u201d", "Persona C: \u201cGrowing Grace\u201d"],
   ["Who", "Owns a Tyler boutique or gift shop, 35 to 55, 1 to 5 employees", "Aspiring dropshipper, 22 to 40, has a full-time job, anywhere in the U.S.", "Runs a maker or specialty-food brand doing $100k to $1M, sells on Etsy or at markets"],
   ["Goal", "Sell online to regulars and tourists; compete with big-box stores", "Launch a real brand and reach first $1k/mo in profit", "Own their channel; stop paying marketplace fees; scale"],
   ["Pain", "No time; tried Wix once and gave up; distrusts \u201ctech people\u201d", "Overwhelmed by courses; generic store isn't converting", "Outgrew Etsy; needs custom features and better marketing"],
   ["Where to reach", "Chamber events, in person, Facebook, local referrals", "TikTok, YouTube, Reddit, Discord, Google search", "Instagram, LinkedIn, Google search, craft and food networks"],
   ["Likely package", "Brand + Care or Growth", "Launch + Care, upgrading to Growth", "Signature + Growth or Scale"],
   ["Buying trigger", "Holiday season; a competitor launches online", "Watching a success story; payday", "Marketplace fee increase; hitting capacity"]],
  [0.15, 0.285, 0.285, 0.28], bold_first_col=True)
H2("Customer needs & buying behavior")
B(["<b>Trust decides the sale.</b> Local owners buy from people they have met. Online buyers rely on portfolios, reviews and demos.",
   "<b>Price anchoring.</b> They compare against $39/month Shopify (\u201ccheap\u201d) and $10k agencies (\u201ctoo expensive\u201d). We sit in between and need to show clear value.",
   "<b>Seasonality.</b> Demand peaks in August to October (before the holidays) and January to March (New Year goals, tax refunds).",
   "<b>Decision process.</b> One decision-maker, a 1 to 4 week sales cycle, and a free consultation is expected."])

# 9. Competitive analysis ----------------------------------------------------------
H1("Competitive Analysis", "Who else wins these customers")
H2("Competitor landscape")
T([["Competitor type", "Examples", "Typical cost", "Strengths", "Weaknesses vs. us"],
   ["DIY hosted platforms", "Shopify, Wix, Squarespace, BigCommerce", "~$30 to $300/mo + apps + fees", "Huge ecosystems, trusted brands, cheap to start", "Owner does all the work; apps pile up; generic results"],
   ["Open-source DIY", "WooCommerce (WordPress)", "Free core + hosting + plugins", "Flexible, large community", "Technical upkeep, security and plugin conflicts"],
   ["Turnkey dropship store sellers", "Pre-built \u201cstore in a box\u201d vendors", "~$50 to $500 one-time", "Very cheap and fast", "Cookie-cutter stores, no brand, poor support"],
   ["Freelance marketplaces", "Upwork, Fiverr", "~$200 to $3,000", "Cheap, lots of choice", "Inconsistent quality; no ongoing management"],
   ["eCommerce & digital agencies", "Shopify Partner agencies; regional agencies", "$5k to $25k+ build; $1k to $5k/mo retainer", "Full service, experienced teams", "Too expensive for our segments; slow"],
   ["Local web designers (Tyler)", "Small local studios and freelancers", "$1k to $5k brochure sites", "Local relationships", "Rarely eCommerce specialists; little ad or brand strategy"]],
  [0.17, 0.2, 0.17, 0.22, 0.24], bold_first_col=True)
NOTE("Competitor pricing as of September 2026. For example, Shopify Basic is $39/month billed monthly or $29/month "
     "billed yearly, before apps, themes and transaction fees. Agency and freelancer ranges are typical market quotes.", "Pricing basis")
H2("Comparison matrix")
Y, N, Pt = "Yes", "\u2014", "Partial"
T([["Factor", COMPANY, "Shopify (DIY)", "Freelancer", "Agency"],
   ["Done-for-you build", Y, N, Y, Y],
   ["Brand identity included", Y, N, Pt, Y],
   ["Ongoing management & ads", Y, N, N, Y],
   ["Custom features without app fees", Y, Pt, Pt, Y],
   ["Local, in-person service (Tyler)", Y, N, N, Pt],
   ["First-year cost (typical)", "$4.5k to $8k", "$1k to $3k + your time", "$1k to $4k", "$15k to $50k"],
   ["Mature app ecosystem", N, Y, Pt, Y],
   ["Proven at massive scale", Pt, Y, N, Y]],
  [0.3, 0.19, 0.17, 0.17, 0.17], bold_first_col=True)
H2("SWOT analysis", need=4.2)
sw = lambda title, color, items: Table(
    [[Paragraph(f"<font name='{BOLD}' color='white'>{title}</font>", ss["cell"])],
     [Paragraph("<br/>".join("\u2022 " + i for i in items), ss["cell"])]],
    colWidths=[W / 2 - 4])
S_ = sw("STRENGTHS", NAVY, ["Owned, custom full-stack platform, no licensing fees", "Working MVP with payments and admin already built",
                           "Low overhead; self-funded; home-based", "Done-for-you plus recurring model gives predictable revenue",
                           "Founder is both builder and service provider: fast, personal"])
W_ = sw("WEAKNESSES", AMBER, ["Solo founder: capacity and key-person risk", "New brand with no portfolio or case studies yet",
                             "Platform lacks the app ecosystem of Shopify", "Company is responsible for security, uptime and PCI scope",
                             "Limited marketing budget in Year 1"])
O_ = sw("OPPORTUNITIES", TEAL, ["Under-served East Texas small-business market", "Dropshippers want a brand, not just a store",
                               "Recurring upsell from Care to Growth to Scale", "Nonprofit and church donation stores (feature already built)",
                               "Partnerships: SBDC, Chamber, accountants, photographers", "AI tools cut build time and cost"])
T_ = sw("THREATS", colors.HexColor("#B23A48"), ["DIY platforms keep adding AI site builders", "Price competition from offshore freelancers",
                                               "Economic downturn cuts small-business spending", "Payment-processor or ad-platform policy changes",
                                               "Security breach or outage harming client trust"])
for tbl, col in [(S_, NAVY), (W_, AMBER), (O_, TEAL), (T_, colors.HexColor("#B23A48"))]:
    tbl.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), col), ("BACKGROUND", (0, 1), (-1, 1), LIGHT),
                             ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                             ("LEFTPADDING", (0, 0), (-1, -1), 8), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
grid = Table([[S_, W_], [O_, T_]], colWidths=[W / 2, W / 2])
grid.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 2),
                          ("RIGHTPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
story.append(KeepTogether([grid])); SP(8)
H2("Competitive advantage & unique value proposition")
CALLOUT("\u201cA custom-branded online store, built and run for you, for less than an agency and with far less "
        "work than doing it yourself.\u201d")
B(["<b>Platform ownership:</b> the reusable core cuts delivery time and cost, and we are not paying another platform's margins.",
   "<b>Brand-first process:</b> every build starts with brand identity, which most DIY tools and freelancers skip.",
   "<b>One accountable partner:</b> build, hosting, support and marketing under one roof and one invoice.",
   "<b>Local presence:</b> a Tyler-based founder who meets clients in person, which is rare among eCommerce specialists."])

# 10. Business model --------------------------------------------------------------
H1("Business Model & Revenue Streams", "How we make money")
H2("Revenue streams")
T([["Stream", "How it's charged", "Share of Year 1 revenue*"],
   ["Implementation fees", "One-time; 50% deposit to start, 50% at launch", f"{EXP[0]['setup']/EXP[0]['revenue']:.0%}"],
   ["Monthly plans (MRR)", "Monthly subscription via card on file; 6-month minimum on Growth and Scale", f"{EXP[0]['mrr']/EXP[0]['revenue']:.0%}"],
   ["Add-on services", "Quoted per project / hourly", f"{EXP[0]['addons']/EXP[0]['revenue']:.0%}"],
   ["Ad-management overage", "12% of client ad spend above plan limit", "Upside, not modeled"]],
  [0.3, 0.5, 0.2], align_right_from=2)
P(f"<font size='8' color='#6B7588'>*Expected case. The share from recurring revenue rises every year: by Year 3 monthly plans are "
  f"{EXP[2]['mrr']/EXP[2]['revenue']:.0%} of revenue.</font>")
H2("Pricing strategy")
B(["<b>Value-based, with an anchor in the middle.</b> The Brand package ($3,500) is the recommended option. Launch gives a "
   "lower entry point and Signature makes Brand look reasonable.",
   "<b>Recurring revenue is the engine.</b> Implementation fees fund growth in Year 1. Monthly plans build long-term value and "
   "make cash flow predictable.",
   "<b>Founding-client offer.</b> The first 5 clients get 30% off implementation in exchange for a testimonial, a case study "
   "and permission to use their store in the portfolio.",
   "<b>Price review</b> every 6 months, based on delivery hours per package and close rates."])
H2("Unit economics (expected case assumptions)")
avg_life = 1 / model.MONTHLY_CHURN
gross_mrr_margin = (model.AVG_MRR - model.HOSTING_PER_CLIENT - model.AVG_MRR * model.PROCESSING_PCT) / model.AVG_MRR
ltv = model.AVG_SETUP * (1 - model.CONTRACTOR_PCT - model.PROCESSING_PCT) + model.AVG_MRR * gross_mrr_margin * avg_life
cac = y1_mktg / EXP[0]["new"]
T([["Metric", "Value", "How calculated"],
   ["Average implementation fee", usd(model.AVG_SETUP), "Weighted by package mix (50% Launch / 35% Brand / 15% Signature)"],
   ["Average monthly plan (ARPA)", usd(model.AVG_MRR), "Weighted by plan mix (45% Care / 40% Growth / 15% Scale)"],
   ["Monthly churn / average client life", f"{model.MONTHLY_CHURN:.0%} / ~{avg_life:.0f} months", "Assumption; industry retainers see 2% to 5%"],
   ["Gross margin on monthly plans", f"{gross_mrr_margin:.0%}", "After hosting/tools (~$30/client) and 3% card processing"],
   ["Customer lifetime value (LTV), gross profit", usd(ltv), "Setup gross profit + monthly gross profit x lifetime"],
   ["Customer acquisition cost (CAC), Year 1", usd(cac), f"Year 1 marketing budget ({usd(y1_mktg)}) / clients won"],
   ["LTV : CAC ratio", f"{ltv / cac:.0f} : 1", "Healthy is 3:1 or better. The ratio is high because Year 1 relies on referrals and networking"],
   ["Payback period", "Immediate", "The 50% implementation deposit covers CAC on day one"]],
  [0.36, 0.2, 0.44], bold_first_col=True)
NOTE("CAC excludes the founder's own sales time. Once paid ads become the main channel, expect CAC of $400 to $900 per client "
     "and keep LTV:CAC above 3:1.", "Caveat")

# 11. Operations -------------------------------------------------------------------
H1("Operations Plan", "How the work gets done")
H2("Technology stack")
T([["Layer", "Technology", "Notes"],
   ["Frontend", "React 19, React Router 7, React-Bootstrap 5, Lucide icons", "Responsive storefront and admin panel"],
   ["Backend / API", "Node.js, Express 5, REST endpoints", "Products, orders, customers, transactions, cart, payments, auth"],
   ["Database", "MySQL with Sequelize ORM", "Models: users, customers, products, orders, transactions, IP history"],
   ["Payments", "Square Web Payments SDK, PayPal JS SDK", "Card tokenization keeps raw card data off our servers (lower PCI scope)"],
   ["Auth & security", "JWT access and refresh tokens, bcrypt password hashing, cookie-based sessions", "Role-based admin access"],
   ["Hosting", "Amazon Web Services (EC2 today)", "Plan: managed database (RDS), automated backups, HTTPS via load balancer or Let's Encrypt"],
   ["Planned", "Klarna/Afterpay, shipping APIs, transactional email, dropship supplier APIs", "See product roadmap (Section 7)"]],
  [0.17, 0.38, 0.45], bold_first_col=True)
H2("Client delivery workflow")
T([["Step", "Stage", "Activities", "Time (Brand pkg)"],
   ["1", "Discovery call (free)", "Goals, products, budget, fit check; send proposal within 48 hours", "30 to 60 min"],
   ["2", "Contract & deposit", "E-signed statement of work (SOW); 50% deposit via invoice; client-onboarding form", "1 day"],
   ["3", "Brand workshop", "Audience, positioning, voice, visual direction; deliver brand kit", "Week 1"],
   ["4", "Build", "Deploy client instance, apply theme, configure payments, load products, write copy", "Weeks 1 to 3"],
   ["5", "Review", "Client review on a staging link; up to 2 revision rounds", "Week 3"],
   ["6", "Launch", "Domain and HTTPS go-live, test orders, analytics, launch email and social posts", "Week 4"],
   ["7", "Training & handoff", "Recorded admin-panel walkthrough; collect final 50%; start monthly plan", "Week 4"],
   ["8", "Ongoing care", "Monitoring, updates, support tickets, monthly report, quarterly growth review", "Monthly"]],
  [0.06, 0.2, 0.56, 0.18])
H2("Supplier & partner relationships")
B(["<b>Payments:</b> Square and PayPal (live), with Klarna and Afterpay planned. Each client gets their <i>own</i> merchant account, so funds go directly to them.",
   "<b>Dropship and print-on-demand suppliers</b> (planned integrations): candidates include CJdropshipping, Spocket, AutoDS, Printful, and U.S.-based wholesale suppliers. Partner-program status to be evaluated.",
   "<b>Freelance bench:</b> product photographer, copywriter and graphic designer on per-project rates (budgeted at 25% of implementation fees).",
   "<b>Referral partners:</b> bookkeepers, CPAs, business bankers, Tyler SBDC advisors and commercial photographers."])
H2("Customer support model")
T([["Channel", "Care", "Growth", "Scale"],
   ["Email / ticket portal", "2 business days", "1 business day", "Same business day"],
   ["Phone / video call", "Scheduled", "Scheduled", "Direct line + monthly call"],
   ["Site-down emergencies", "4-hour response, 24/7", "4-hour response, 24/7", "1-hour response, 24/7"]],
  [0.31, 0.23, 0.23, 0.23], bold_first_col=True)
H2("Key tools & vendors")
B(["GitHub (source control, CI), AWS (hosting), uptime monitoring and error tracking (e.g., UptimeRobot, Sentry)",
   "CRM and proposals (e.g., HubSpot free tier), e-signatures, invoicing and recurring billing (e.g., Square Invoices or Stripe Billing)",
   "Bookkeeping (e.g., QuickBooks or Wave), project management (Trello, Notion or ClickUp), design (Figma, Canva)",
   "Email marketing (e.g., Mailchimp or Klaviyo), scheduling (Calendly), password manager for client credentials"])
NOTE("The current codebase deploys one store per instance. Until the Year 2 multi-tenant rebuild, create a scripted "
     "per-client deployment (infrastructure-as-code or a Docker image) so each new client takes minutes to set up, not days. "
     "This is the biggest lever on delivery capacity.", "Ops priority")

# 12. Management -------------------------------------------------------------------
H1("Management & Organization", "The team")
H2("Founder")
T([[Paragraph(f"<font name='{HEAD}' size='13' color='#1B2A41'>{FOUNDER}</font><br/>"
              "<font size='8.5' color='#6B7588'>Founder, Lead Developer & Client Strategist</font>", ss["cell"]),
    Paragraph(f"Full-stack developer who designed and built the {COMPANY} platform end to end: the React storefront, "
              "the Node.js/Express API, the MySQL data model, the Square and PayPal payment integrations, authentication, "
              "and the admin panel for products, orders, customers and transactions. The working, deployed platform is "
              "the clearest evidence of what the founder can deliver, and it is the foundation every client store is "
              "built on.", ss["cell"])]],
  [0.3, 0.7], header=False, zebra=False)
P("<b>Responsibilities (Year 1):</b> sales and discovery calls, brand workshops, development and deployment, client "
  "support, marketing, and administration.")
H2("Hiring plan")
T([["When", "Role", "Type", "Why"],
   ["Year 1 (as needed)", "Photographer, copywriter, designer", "Freelance, per project", "Keeps founder focused on building and selling"],
   ["Month 13", "Client support / virtual assistant", "Part-time contractor", "Handles tickets, product uploads, reporting"],
   ["Month 13", "Developer / designer", "Part-time contractor", "Doubles build capacity"],
   ["Month 25", "Junior full-stack developer", "Full-time", "Owns platform features and client builds"],
   ["Month 25", "Paid ads & email specialist", "Full-time or contract", "Delivers Growth and Scale plan marketing"],
   ["Year 3+", "Sales & account manager", "Full-time", "Frees founder for strategy and partnerships"]],
  [0.17, 0.3, 0.2, 0.33])
H2("Organization chart (Year 3 target)")
org = Table([
    [Paragraph(f"<b>Founder / CEO</b><br/>{FOUNDER}", ParagraphStyle("o", parent=ss["cell"], alignment=TA_CENTER, textColor=colors.white)), "", ""],
    [Paragraph("<b>Development</b><br/>Jr. Full-Stack Dev<br/>Freelance designers", ParagraphStyle("o2", parent=ss["cell"], alignment=TA_CENTER)),
     Paragraph("<b>Marketing Services</b><br/>Ads & Email Specialist<br/>Freelance copy/photo", ParagraphStyle("o2", parent=ss["cell"], alignment=TA_CENTER)),
     Paragraph("<b>Client Success</b><br/>Support / VA<br/>(Account Mgr. later)", ParagraphStyle("o2", parent=ss["cell"], alignment=TA_CENTER))]],
    colWidths=[W / 3] * 3)
org.setStyle(TableStyle([("SPAN", (0, 0), (-1, 0)), ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                         ("BACKGROUND", (0, 1), (-1, 1), LIGHT), ("LINEABOVE", (0, 1), (-1, 1), 3, AMBER),
                         ("LINEAFTER", (0, 1), (1, 1), 4, colors.white), ("TOPPADDING", (0, 0), (-1, -1), 10),
                         ("BOTTOMPADDING", (0, 0), (-1, -1), 10), ("ALIGN", (0, 0), (-1, -1), "CENTER")]))
story.append(org); SP(10)
H2("Advisors & professional services")
P("The following advisors will be engaged before the first client launch:")
B(["<b>CPA / bookkeeper:</b> entity setup, sales-tax guidance and quarterly estimated taxes.",
   "<b>Attorney:</b> client master services agreement, SOW templates, privacy policy and terms of service.",
   "<b>Business mentor:</b> through the Tyler-area Small Business Development Center (SBDC) and SCORE, both free.",
   "<b>Insurance agent:</b> general liability, professional liability (errors & omissions) and cyber coverage."])

# =================================================================================
# PART II - MARKETING PLAN
# =================================================================================
PART("II", "The Marketing Plan", "How we build our own brand, reach the right owners, turn them into clients and "
     "keep them for years.")
_sec_before = _sec[0]
H1("Brand Positioning & Messaging", "How we want to be known", new_page=False)
H2("Positioning statement")
CALLOUT(f"For small-business owners and new online sellers who want a real brand but don't have time to build it, "
        f"{COMPANY} is the done-for-you eCommerce partner that designs, launches and grows a custom store, unlike "
        "DIY platforms that leave the work to you or agencies that price you out.")
H2("Brand promise")
P("<b>\u201cWe build it. We run it. You sell.\u201d</b>")
H2("Brand voice")
T([["We are...", "We are not..."],
   ["Friendly, plain-spoken, confident", "Jargon-heavy or salesy"],
   ["Practical: show real numbers and real stores", "Hype: \u201cget rich with dropshipping\u201d"],
   ["Local and personal: \u201cyour developer down the road\u201d", "A faceless agency"]],
  [0.5, 0.5])
H2("Key messages by segment")
T([["Segment", "Headline message", "Proof points"],
   ["Local small business", "\u201cYour store, online in 30 days. Built by a Tyler local.\u201d", "In-person meetings; local case studies; one monthly bill"],
   ["Dropshipper", "\u201cStop running a generic store. Launch a brand people trust.\u201d", "Brand kit included; conversion-focused design; ads handled"],
   ["Growing brand", "\u201cOutgrown Etsy? Own your channel and keep your margins.\u201d", "Custom features; migration service; no marketplace fees"],
   ["Nonprofits / churches", "\u201cTake donations and sell merch in one simple site.\u201d", "Donation products built in; card and PayPal"]],
  [0.2, 0.42, 0.38], bold_first_col=True)

H1("Marketing Mix (4 Ps)", "Product, price, place, promotion")
T([["P", "Strategy"],
   ["Product", "Done-for-you branded store on our own platform; 3 implementation packages, 3 monthly plans and add-ons (Section 7)."],
   ["Price", "Implementation $1,500 / $3,500 / $6,500+; monthly $149 / $399 / $899. Middle options anchored as \u201crecommended.\u201d Founding-client discount for the first 5."],
   ["Place", "Direct sales only: in person in Tyler and East Texas, plus video calls nationally. The marketing website is the main hub: portfolio, pricing, booking."],
   ["Promotion", "Year 1: networking, referrals, local SEO and content, then paid ads as case studies build up. Detail in Sections 15 and 16."]],
  [0.14, 0.86], bold_first_col=True)
H2("Our own marketing website")
P("Our own site (a separate marketing site, ideally built on the platform to show what it can do) needs: a homepage with a "
  "clear offer, portfolio and demo stores, pricing, a \u201cBook a free consultation\u201d calendar, a blog, lead magnets "
  "and testimonials. We should build <b>2 or 3 demo stores</b> (e.g., a boutique, a dropship niche store and a nonprofit "
  "store) before launch so prospects can click through a real store.")

H1("Go-To-Market Strategy", "Launch phases")
T([["Phase", "Timing", "Goals", "Key actions"],
   ["0. Pre-launch", "Oct 2026", "Brand identity final; site and demos live; 20 warm leads", "Finalize logo and brand; form LLC; build marketing site and 2 or 3 demo stores; set up Google Business Profile; list 50 local prospects; tell your network"],
   ["1. Founding clients", "Nov 2026 to Jan 2027", "5 founding clients; 3 case studies", "30% founding discount; personal outreach; Chamber events; free \u201cIs your business ready to sell online?\u201d audits"],
   ["2. Local growth", "Feb to Jun 2027", "2 new clients/month; referral engine running", "Referral program; SBDC and partner workshops; local SEO; start Meta and Google ads with a small budget"],
   ["3. National dropshipper push", "Jul to Oct 2027", "3+ clients/month; 30%+ from outside Tyler", "Short-form video content; YouTube tutorials; dropshipping communities; before/after store makeovers"],
   ["4. Scale", "Year 2+", "4 to 5 clients/month; MRR over $15k", "Hire support and ads help; case-study-driven ads; agency and reseller partnerships"]],
  [0.16, 0.14, 0.25, 0.45], bold_first_col=True)

H1("Marketing Channels & Tactics", "Where the clients come from")
T([["Channel", "Tactics", "Primary segment", "Priority"],
   ["Networking & in-person", "Tyler Area Chamber, BNI-style referral groups, SBDC workshops, farmers and makers markets, downtown merchant groups", "Local", "High (Y1)"],
   ["Referral program", "$150 credit or cash per referred client who signs; partner referral fee for CPAs, photographers and bankers", "All", "High"],
   ["Local SEO", "Google Business Profile, reviews, pages such as \u201cecommerce website design Tyler TX\u201d, local directory citations", "Local", "High"],
   ["Content marketing / blog", "Guides: \u201cHow to start dropshipping the right way,\u201d \u201cShopify vs. custom store,\u201d case studies", "All", "Medium"],
   ["YouTube & short-form video", "Build-in-public, store makeovers, 60-second eCommerce tips on TikTok, Reels and Shorts", "Dropshippers", "Medium to High (Y1 H2)"],
   ["Social media", "Facebook (local groups, business page), Instagram (portfolio), LinkedIn (founder story)", "Local / growing", "Medium"],
   ["Communities", "Reddit (r/dropship, r/ecommerce, r/smallbusiness), Discord and Facebook groups: give genuine help, no spam", "Dropshippers", "Medium"],
   ["Paid search (Google)", "High-intent keywords; start with $200 to $300/mo, target cost per lead under $60", "All", "Medium (from Month 4)"],
   ["Paid social (Meta)", "Lead ads to East Texas business owners; retarget site visitors; case-study creatives", "Local / dropship", "Medium (from Month 4)"],
   ["Email marketing", "Lead magnet: \u201cBrand Launch Checklist\u201d; monthly newsletter; nurture sequence for consultation no-shows", "All", "Medium"],
   ["Influencers & partners", "Collaborate with small eCommerce YouTubers and creators; guest on local podcasts and radio", "Dropshippers", "Low to Medium"],
   ["Print & direct mail", "Postcards and leave-behind one-pagers for downtown and Broadway Ave retailers", "Local", "Low"]],
  [0.18, 0.5, 0.16, 0.16], bold_first_col=True)

H1("Sales Funnel & Customer Journey", "From stranger to advocate")
funnel = [("AWARENESS", "Sees a video, post, ad, Google result or meets founder at an event", "Reach, impressions, site visitors"),
          ("INTEREST", "Visits site, browses demo stores, downloads checklist", "Leads captured (goal: 3% of visitors)"),
          ("CONSULTATION", "Books a free 30-minute discovery call or free store audit", "Calls booked (goal: 25% of leads)"),
          ("PROPOSAL", "Receives a tailored proposal within 48 hours", "Proposals sent"),
          ("CLIENT", "Signs SOW, pays 50% deposit", "Close rate (goal: 35 to 40% of calls)"),
          ("RETENTION", "Launch, monthly plan, reports, quarterly reviews", "Churn under 3%/mo; upgrade rate"),
          ("ADVOCACY", "Leaves a review, refers a friend, becomes a case study", "Referrals per client; review count")]
rows = []
for i, (stage, what, kpi) in enumerate(funnel):
    inset = i * 0.018
    rows.append([Paragraph(f"<font name='{BOLD}' color='white'>{stage}</font>", ParagraphStyle("f", parent=ss["cell"], alignment=TA_CENTER)),
                 Paragraph(what, ss["cell"]), Paragraph(f"<font color='#6B7588'>{kpi}</font>", ss["cell"])])
ft = Table(rows, colWidths=[0.2 * W, 0.47 * W, 0.33 * W])
shades = ["#1B2A41", "#243754", "#2D4467", "#36517A", "#2A9D8F", "#23867A", "#E08A1E"]
ft.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 8),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8), ("LINEBELOW", (0, 0), (-1, -1), 2, colors.white)]
                       + [("BACKGROUND", (0, i), (0, i), colors.HexColor(c)) for i, c in enumerate(shades)]
                       + [("BACKGROUND", (1, i), (-1, i), LIGHT) for i in range(len(shades))]))
story.append(ft); SP(10)
H2("Funnel math: what it takes to hit the Year 1 targets")
P("At a 3% visitor-to-lead rate, a 25% lead-to-call rate and a 35% close rate, each new client takes about "
  "<b>3 discovery calls, 11 to 12 leads and roughly 400 site visitors</b>. At the Year 1 exit pace of 3 to 4 clients a month, "
  "that is about <b>10 to 12 calls, 45 leads and 1,500 visitors a month</b>. In Year 1, in-person referrals will close "
  "far better than these online averages.")

H1("Customer Retention Strategy", "Keep and grow every client")
T([["Moment", "What we do"],
   ["Day 0: Welcome", "Welcome email and video, onboarding form, shared project board, clear timeline"],
   ["Launch day", "Launch celebration post featuring the client, first-order alert, recorded admin training"],
   ["Day 30", "Check-in call: what's working, early sales review, fix any friction"],
   ["Monthly", "Plain-English report: traffic, sales, conversion rate, ad results, next month's plan"],
   ["Quarterly", "Growth review: recommend upgrades (Care to Growth to Scale), seasonal campaigns, new features"],
   ["Anniversary", "Brand refresh check, thank-you gift, ask for a review and referral"],
   ["At-risk signals", "Declining logins or sales, late payments, support frustration: founder calls personally within 48 hours"]],
  [0.2, 0.8], bold_first_col=True)
B(["<b>Loyalty:</b> after 12 months on a plan, clients get one free feature or design refresh (up to 5 hours).",
   "<b>Upsells:</b> ad management, BNPL, email flows, photography, second storefront or wholesale portal.",
   "<b>Switching cost through value, not lock-in:</b> clients can always export their data and domain. We keep them by "
   "producing results."])

H1("Marketing Budget", "Year 1 spend")
T([["Channel", "Year 1 budget", "Purpose"]] + [[c, usd(v), n] for c, v, n in MARKETING_BUDGET]
  + [["Total", usd(y1_mktg), f"~{usd(y1_mktg/12)}/mo average ($750/mo for months 1 to 3, $1,250/mo after)"]],
  [0.3, 0.15, 0.55], total_row=True, bold_first_col=True)
IMG(paths["mktg"], W * 0.92)
P(f"Marketing grows to {usd(EXP[1]['opex']['Marketing'])} in Year 2 and {usd(EXP[2]['opex']['Marketing'])} in Year 3, shifting "
  "toward paid ads and video once case studies prove what converts. Rule of thumb: keep marketing at 5% to 10% of revenue, "
  "and cut any channel that can't show a cost per client under $900 after 90 days.")

H1("KPIs & Metrics", "What we measure")
T([["Category", "KPI", "Year 1 target", "Review"],
   ["Traffic", "Marketing-site visitors / month", "1,500 by Month 12", "Weekly"],
   ["Leads", "New leads / month; visitor-to-lead rate", "45 / 3%", "Weekly"],
   ["Sales", "Discovery calls; close rate", "10 to 12 per month; 35%+", "Weekly"],
   ["Sales", "New clients / month", f"3 by Month 9 ({EXP[0]['new']:.0f} for the year)", "Monthly"],
   ["Revenue", "Monthly recurring revenue (MRR)", f"{usd(EXPM[11]['mrr'])} by Month 12", "Monthly"],
   ["Revenue", "Average implementation fee", f"{usd(model.AVG_SETUP)}+", "Monthly"],
   ["Retention", "Monthly client churn", "Under 3%", "Monthly"],
   ["Retention", "Net Promoter Score (NPS)", "50+", "Quarterly"],
   ["Efficiency", "Customer acquisition cost (CAC)", "Under $900", "Monthly"],
   ["Efficiency", "LTV : CAC", "3 : 1 or better", "Quarterly"],
   ["Delivery", "Days from deposit to launch (Brand package)", "28 days or less", "Per project"],
   ["Client results", "Client store conversion rate", "1.5% to 3%", "Monthly"],
   ["Platform", "Uptime", "99.9%", "Monthly"]],
  [0.15, 0.4, 0.28, 0.17], bold_first_col=True)

H1("12-Month Marketing Calendar", "Nov 2026 to Oct 2027")
T([["Month", "Theme / focus", "Key activities"],
   ["Nov 2026", "Founding clients", "Launch site and demos; announce founding-client offer; Chamber mixer; start blog (2 posts/mo)"],
   ["Dec 2026", "Holiday rush help", "\u201cLast-minute holiday storefront\u201d mini-offer; gift-shop outreach; publish first case study"],
   ["Jan 2027", "New Year, new business", "\u201cLaunch your brand in 2027\u201d webinar; target New Year dropshipper searches; start email newsletter"],
   ["Feb 2027", "Referral engine", "Launch referral program; partner outreach to CPAs, bankers and photographers; SBDC workshop"],
   ["Mar 2027", "Tax-refund season", "Start Google and Meta ads; promote Launch package to dropshippers"],
   ["Apr 2027", "Tyler spring events", "Booths at local markets and events (e.g., Azalea & Spring Flower Trail season); free store audits"],
   ["May 2027", "Case studies", "3 client spotlight videos; submit to local media and business journal"],
   ["Jun 2027", "Video push", "Start weekly short-form video schedule; YouTube \u201cstore makeover\u201d series"],
   ["Jul 2027", "National dropshippers", "Community engagement (Reddit, Discord); guest on eCommerce podcasts"],
   ["Aug 2027", "Q4 prep", "\u201cGet holiday-ready by October\u201d campaign; push Growth and Scale upgrades to existing clients"],
   ["Sep 2027", "Holiday build deadline", "Last call for holiday launches; retargeting ads; email sequence"],
   ["Oct 2027", "Rose Festival & 1-year review", "Texas Rose Festival local tie-in; year-one recap post; plan Year 2 budget"]],
  [0.13, 0.22, 0.65], bold_first_col=True)

# =================================================================================
# PART III - FINANCIAL PLAN
# =================================================================================
PART("III", "The Financial Plan", "Startup costs, three-year projections in three scenarios, cash flow, break-even "
     "and funding. All figures are modeled estimates.")
H1("Startup Costs", "What it takes to open the doors", new_page=False)
T([["Item", "Est. cost"]] + [[n, usd(c)] for n, c in model.STARTUP_COSTS] + [["Total startup costs", usd(STARTUP_TOTAL)]],
  [0.8, 0.2], total_row=True, align_right_from=1)
P(f"<b>Already covered by the founder (sweat equity):</b> platform development to date, development computer and software. "
  f"Building a comparable platform would cost a client thousands of dollars at typical contractor rates, "
  f"so the existing codebase is a significant in-kind contribution by the founder.")
P(f"<b>Starting capital:</b> {usd(model.OWNER_CONTRIBUTION)} owner contribution = {usd(STARTUP_TOTAL)} startup costs + "
  f"{usd(model.OWNER_CONTRIBUTION - STARTUP_TOTAL)} operating reserve.")

H1("Revenue Projections", "Three years, three scenarios")
P("<b>Key assumptions (expected case):</b> clients launched per month grow from 1 to 3 in Year 1 (24 total), then 4/month in Year 2 "
  f"and 5/month in Year 3. Average implementation fee {usd(model.AVG_SETUP)}; average monthly plan {usd(model.AVG_MRR)}; "
  f"{model.MONTHLY_CHURN:.0%} monthly churn; add-ons equal {model.ADDON_PCT:.0%} of core revenue. Conservative = 60% of expected client "
  "volume; optimistic = 140%. Staffing costs scale with volume in each scenario.")
IMG(paths["rev_scen"])
rows = [["Scenario", "Year 1", "Year 2", "Year 3", "Active clients, end Y3", "MRR, end Y3"]]
for name, ys in YEARS.items():
    rows.append([name] + [usd(y["revenue"]) for y in ys] + [f"{ys[2]['active_end']:.0f}", usd(ys[2]["mrr_end"])])
T(rows, [0.2, 0.15, 0.15, 0.15, 0.18, 0.17], bold_first_col=True, align_right_from=1)
IMG(paths["y1_mix"])
H2("Year 1 monthly detail (expected case)")
hdr = ["", *[f"M{r['m']}" for r in EXPM[:12]], "Y1"]
def rowfor(label, key, fmt=lambda v: f"{v/1000:,.1f}"):
    return [label, *[fmt(r[key]) for r in EXPM[:12]], fmt(sum(r[key] for r in EXPM[:12]) if key not in ("active", "cash") else EXPM[11][key])]
mt = [hdr,
      rowfor("New clients", "new", lambda v: f"{v:.0f}"),
      rowfor("Active clients", "active", lambda v: f"{v:.1f}"),
      rowfor("Implementation", "setup"), rowfor("Monthly plans", "mrr"), rowfor("Add-ons", "addons"),
      rowfor("Total revenue", "revenue"), rowfor("Total costs", "cogs"), rowfor("Net income", "net")]
# replace total costs row with cogs+opex
mt[7] = ["Total costs", *[f"{(r['cogs']+r['total_opex'])/1000:,.1f}" for r in EXPM[:12]],
         f"{sum(r['cogs']+r['total_opex'] for r in EXPM[:12])/1000:,.1f}"]
small = ParagraphStyle("xs", parent=ss["cell"], fontSize=7, leading=9, alignment=2)
smallh = ParagraphStyle("xsh", parent=small, textColor=colors.white, fontName=BOLD)
smalll = ParagraphStyle("xsl", parent=small, alignment=0, fontName=SEMI)
data = [[Paragraph(str(c), smallh if i == 0 else (smalll if j == 0 else small)) for j, c in enumerate(r)] for i, r in enumerate(mt)]
t = Table(data, colWidths=[0.15 * W] + [0.0654 * W] * 12 + [0.065 * W])
t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
                       ("LEFTPADDING", (0, 0), (-1, -1), 2), ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                       ("BACKGROUND", (0, 6), (-1, 6), LIGHT), ("BACKGROUND", (0, 8), (-1, 8), colors.HexColor("#E3E8F0")),
                       ("BACKGROUND", (-1, 1), (-1, -1), colors.HexColor("#E3E8F0"))]))
story.append(t)
P("<font size='7.5' color='#6B7588'>Dollar figures in thousands. Fractional client counts come from modeling churn as an average.</font>")

H1("Projected Profit & Loss Statement", "Expected case, pre-tax")
def pl_rows(ys):
    r = [["", "Year 1", "Year 2", "Year 3"],
         ["Implementation fees", *[usd(y["setup"]) for y in ys]],
         ["Monthly plan revenue", *[usd(y["mrr"]) for y in ys]],
         ["Add-on services", *[usd(y["addons"]) for y in ys]],
         ["Total revenue", *[usd(y["revenue"]) for y in ys]],
         ["Cost of revenue (hosting, contractors, processing)", *[usd(-y["cogs"]) for y in ys]],
         ["Gross profit", *[usd(y["gross"]) for y in ys]],
         ["Gross margin", *[f"{y['gross']/y['revenue']:.0%}" for y in ys]]]
    for k in ys[0]["opex"]:
        r.append([f"   {k}", *[usd(-y["opex"][k]) for y in ys]])
    r += [["Total operating expenses", *[usd(-y["total_opex"]) for y in ys]],
          ["Net income (pre-tax)", *[usd(y["net"]) for y in ys]],
          ["Net margin", *[f"{y['net']/y['revenue']:.0%}" for y in ys]]]
    return r
plr = pl_rows(EXP)
T(plr, [0.46, 0.18, 0.18, 0.18], align_right_from=1, total_row=True)
NOTE("Owner's draw is shown as an operating expense so profit reflects a real founder salary. For an LLC taxed as a "
     "sole proprietorship, the owner pays self-employment and federal income tax on net profit plus draws. Set aside "
     "~25% to 30% and pay quarterly estimates. Texas has no state income tax. Taxes are not modeled here.", "Tax note")
H2("Net income by scenario")
T([["Scenario", "Year 1", "Year 2", "Year 3"]] + [[n, *[usd(y["net"]) for y in ys]] for n, ys in YEARS.items()],
  [0.46, 0.18, 0.18, 0.18], bold_first_col=True, align_right_from=1)

H1("Cash Flow Projection", "Staying solvent")
IMG(paths["cash"])
cf = [["", "Year 1", "Year 2", "Year 3"],
      ["Beginning cash", usd(model.OWNER_CONTRIBUTION), usd(EXP[0]["cash_end"]), usd(EXP[1]["cash_end"])],
      ["Less: startup costs", usd(-STARTUP_TOTAL), "\u2014", "\u2014"],
      ["Cash in: client revenue", *[usd(y["revenue"]) for y in EXP]],
      ["Cash out: cost of revenue", *[usd(-y["cogs"]) for y in EXP]],
      ["Cash out: operating expenses (incl. owner's draw)", *[usd(-y["total_opex"]) for y in EXP]],
      ["Net cash flow from operations", *[usd(y["net"]) for y in EXP]],
      ["Ending cash (pre-tax)", *[usd(y["cash_end"]) for y in EXP]]]
T(cf, [0.46, 0.18, 0.18, 0.18], align_right_from=1, total_row=True)
min_cash = min(r["cash"] for r in RUNS["Conservative"])
P(f"Cash stays positive in every month of all three scenarios; the lowest point in the conservative case is "
  f"{usd(min_cash)}. The 50% implementation deposit is the main cash-flow protection: build costs are covered before "
  "work starts.")
H2("Cash management policies")
B(["Keep a reserve of at least <b>3 months of fixed expenses</b> before each new hire.",
   "Collect implementation fees 50/50; monthly plans auto-billed on the 1st by card on file; late accounts paused after 15 days.",
   "Move 25% to 30% of profit into a separate tax savings account every month.",
   "Surplus cash beyond the reserve goes to (1) marketing that is proven to work, then (2) the multi-tenant platform rebuild."])

H1("Break-Even Analysis", "When the business pays for itself")
IMG(paths["breakeven"])
y1_fixed_avg = sum(r["total_opex"] for r in EXPM[6:12]) / 6
contrib_mrr = model.AVG_MRR * (1 - model.PROCESSING_PCT) - model.HOSTING_PER_CLIENT
be_clients = y1_fixed_avg / contrib_mrr
T([["Break-even measure", "Result (expected case)"],
   ["First month with positive net income (after owner's draw)", f"Month {be_month}"],
   ["Average fixed costs, months 7 to 12 (incl. $2,000 owner's draw)", usd(y1_fixed_avg) + " / month"],
   ["Contribution per client from monthly plan", usd(contrib_mrr) + " / month"],
   ["Active clients needed for recurring revenue alone to cover fixed costs", f"~{be_clients:.0f} clients"],
   ["Month the expected case reaches that many active clients",
    f"Month {next((r['m'] for r in EXPM if r['active'] >= be_clients), 'n/a')}"],
   ["Startup capital recovered (cumulative cash above starting contribution)",
    f"Month {next((r['m'] for r in EXPM if r['cash'] >= model.OWNER_CONTRIBUTION), 'n/a')}"]],
  [0.7, 0.3], bold_first_col=True, align_right_from=1)
P(f"Year 3 hiring pushes the fixed cost base up sharply, so recurring revenue alone does not cover <i>all</i> costs "
  f"again until about Month {rec_be}. That is by design: implementation fees fund the new team while the client base grows.")
P("The goal to watch is <b>recurring break-even</b>: the point where monthly plans alone pay all fixed costs. After that, "
  "every implementation fee is profit that can fund growth, and a slow sales month no longer threatens the business.")

H1("Funding Request & Use of Funds", "Self-funded, with optional growth capital")
P(f"<b>Current plan: self-funded.</b> The founder contributes {usd(model.OWNER_CONTRIBUTION)}. The model shows the business can "
  "fund itself from Month 1, so no outside capital is <i>required</i>.")
P("<b>Optional growth capital: $25,000 to $50,000</b>, raised only if early results beat the expected case and demand "
  "outruns capacity. Possible sources:")
B(["SBA Microloan (up to $50,000) through an intermediary lender serving East Texas",
   "Local bank or credit union small-business line of credit",
   "Texas and local small-business grants or pitch competitions; SBDC guidance on options",
   "Friends-and-family or angel investment (SAFE or convertible note)"])
T([["Use of funds (if raised: $40,000 example)", "Amount", "Impact"],
   ["Hire part-time developer/designer 6 months early", "$18,000", "Doubles build capacity in Year 1"],
   ["Paid ads and video content", "$10,000", "Faster national dropshipper acquisition"],
   ["Multi-tenant platform rebuild and automation", "$7,000", "Cuts per-client setup time and hosting cost"],
   ["Working-capital reserve", "$5,000", "Protects against slow months"]],
  [0.5, 0.15, 0.35], bold_first_col=True, align_right_from=1)

# =================================================================================
# PART IV - RISK & EXECUTION
# =================================================================================
PART("IV", "Risk & Execution", "What could go wrong, how we'll respond, and the milestones that keep the plan on track.")
H1("Risk Assessment & Mitigation", "Planning for what could go wrong", new_page=False)
T([["Risk", "Likelihood", "Impact", "Mitigation"],
   ["Founder capacity / key-person risk", "High", "High", "Documented processes; freelance bench; scripted deployments; hire support in Year 2; disability insurance"],
   ["Slow client acquisition", "Medium", "High", "Low fixed costs; founding-client offer; referral program; weekly funnel review; adjust pricing"],
   ["Security breach or data loss", "Low to Medium", "High", "Tokenized payments (Square/PayPal); HTTPS; bcrypt; least-privilege admin; daily backups; dependency updates; cyber insurance"],
   ["Platform bugs / outages", "Medium", "Medium", "Automated tests, staging environments, uptime monitoring, incident response plan, status page"],
   ["Payment or ad-platform policy changes", "Medium", "Medium", "Support multiple processors; clients own their merchant and ad accounts"],
   ["Dropship supplier problems (delays, quality)", "Medium", "Medium", "Vet suppliers; favor U.S. warehouses; clear shipping-time disclosures; client education"],
   ["Competition from AI and DIY builders", "High", "Medium", "Compete on brand, service and results rather than tools; use AI internally to deliver faster"],
   ["Client disputes / scope creep", "Medium", "Low to Medium", "Clear SOWs, change-order process, revision limits, attorney-reviewed contract"],
   ["Economic downturn", "Medium", "Medium", "Recurring revenue base; lower-price Launch tier; focus on ROI messaging"]],
  [0.24, 0.12, 0.12, 0.52], bold_first_col=True)
H2("Regulatory & compliance checklist")
T([["Area", "Requirement", "Action"],
   ["Business formation", "Texas LLC; Assumed Name Certificate if applicable; EIN", "File with Texas SOS; get EIN free from the IRS"],
   ["Texas sales tax", "Texas generally taxes data processing services (which can include hosting and SaaS) on 80% of the charge; treatment of web design varies", "Get a sales-tax permit if required; have a CPA review the pricing structure"],
   ["Texas franchise tax", "LLCs file annual reports; no tax due below the revenue threshold", "Calendar the annual filing"],
   ["PCI DSS", "Card data security", "Keep card data tokenized via Square and PayPal (SAQ-A style); never store raw card numbers"],
   ["Privacy", "Privacy policy; Texas Data Privacy and Security Act (TDPSA) obligations; consent for tracking", "Template privacy policy and terms for every client store"],
   ["FTC: online sales", "Mail, Internet, or Telephone Order Merchandise Rule (ship on time or notify); truthful ads; endorsement and review rules", "Shipping-time disclosures on dropship stores; no fake reviews"],
   ["Email / SMS", "CAN-SPAM (email); TCPA (texts need consent)", "Double opt-in; unsubscribe links; SMS consent capture"],
   ["Accessibility", "ADA website accessibility risk", "Build to WCAG 2.1 AA; accessibility review before launch"]],
  [0.18, 0.44, 0.38], bold_first_col=True)
NOTE("This checklist is general information, not legal or tax advice. Confirm each item with a Texas CPA and attorney.", "Disclaimer")

H1("Milestones & Timeline", "The next 24 months")
T([["Target date", "Milestone", "Owner", "Success measure"],
   ["Oct 2026", "Finalize Skelli-Sites logo and brand; form LLC; EIN; business bank account", "Founder", "Registered and banking"],
   ["Oct 2026", "Platform production-ready: HTTPS, production payment keys, cart fix, assets", "Founder", "All launch-blocking issues closed"],
   ["Oct 2026", "Marketing site + 2 or 3 demo stores live", "Founder", "Site live; demos clickable"],
   ["Nov 2026", "First paying client signed", "Founder", "Deposit received"],
   ["Jan 2027", "5 founding clients launched; 3 case studies", "Founder", "Testimonials published"],
   ["Mar 2027", "Paid ads and referral program running", "Founder", "Cost per lead under $60"],
   ["Apr 2027", "Shipping integration, reviews, order emails, account page", "Founder", "Released to all clients"],
   ["Jun 2027", "Scripted per-client deployment", "Founder", "New store set up in under 1 hour"],
   ["Oct 2027", f"Year 1 complete: ~{EXP[0]['new']:.0f} clients, ~{usd(EXPM[11]['mrr'])} MRR", "Founder", "Matches expected case"],
   ["Nov 2027", "First contractors hired (support + dev/design)", "Founder", "Capacity of 4+ clients/month"],
   ["Apr 2028", "Multi-tenant architecture beta", "Founder + dev", "Hosting cost per client down 30%+"],
   ["Oct 2028", f"Year 2 complete: ~{EXP[1]['active_end']:.0f} active clients, ~{usd(EXP[1]['mrr_end'])} MRR", "Team", "Monthly plans cover all fixed costs"]],
  [0.13, 0.47, 0.14, 0.26], bold_first_col=True)

H1("Exit Strategy & Long-Term Vision", "Where this goes")
H2("Long-term vision (3 to 5 years)")
B(["The leading eCommerce launch partner in East Texas, with 100+ active client stores.",
   "A productized platform: multi-tenant, with a template marketplace and a lower-cost self-serve tier alongside done-for-you service.",
   "A reseller and white-label program so other agencies and freelancers can build on our platform."])
H2("Exit options")
T([["Option", "Description", "What increases value"],
   ["Lifestyle business", "Keep ownership; founder draws a healthy salary; the team runs delivery", "High recurring revenue, low churn, documented processes"],
   ["Acquisition by an agency", "Regional or national digital agency buys the client book and platform", "MRR, client contracts, clean financials"],
   ["Acquisition by a SaaS / eCommerce company", "Platform and client base bought as a product line", "Multi-tenant platform, growth rate, IP ownership"],
   ["Management buyout", "Key employees buy the business over time", "Strong second-in-command; stable margins"]],
  [0.25, 0.43, 0.32], bold_first_col=True)
P("Service businesses with recurring revenue commonly sell for a multiple of annual recurring revenue or seller's "
  "discretionary earnings. Building MRR, keeping churn low and owning the platform IP are the biggest drivers of value.")

# =================================================================================
# APPENDIX
# =================================================================================
story.append(PageBreak())
p = Paragraph("Appendix", ss["h1"]); p._toc = (0, "Appendix"); story.append(p); story.append(Rule())
H2("A. Glossary")
T([["Term", "Meaning"],
   ["ARPA", "Average revenue per account: average monthly plan fee per client"],
   ["BNPL", "Buy now, pay later (Klarna, Afterpay)"],
   ["CAC", "Customer acquisition cost: marketing and sales spend per new client"],
   ["Churn", "Share of clients who cancel in a period"],
   ["Dropshipping", "Selling products that a supplier ships directly to the customer; the seller holds no inventory"],
   ["LTV", "Lifetime value: total gross profit expected from one client"],
   ["MRR", "Monthly recurring revenue from monthly plans"],
   ["Multi-tenant", "One software installation serving many client stores, each with separate data"],
   ["NPS", "Net Promoter Score: how likely clients are to recommend us (-100 to 100)"],
   ["PCI DSS", "Security standard for handling payment-card data"],
   ["SOW", "Statement of work: defines scope, price and timeline for a project"],
   ["TAM / SAM / SOM", "Total, serviceable and obtainable market"]],
  [0.22, 0.78], bold_first_col=True)
H2("B. Financial model assumptions")
T([["Assumption", "Value", "Source / rationale"],
   ["Implementation package mix", "50% / 35% / 15%", "Founder estimate; dropshippers skew toward Launch"],
   ["Monthly plan mix", "45% / 40% / 15%", "Founder estimate; most clients start on Care or Growth"],
   ["New clients, Year 1", "1 per month rising to 3 (24 total)", "Solo founder capacity (about 3 to 4 builds/month)"],
   ["New clients, Years 2 / 3", "4 / 5 per month", "Contractors added in Year 2; full-time hires in Year 3"],
   ["Monthly churn", f"{model.MONTHLY_CHURN:.0%}", "Typical for small-business service retainers (2% to 5%)"],
   ["Hosting and tools per client", f"${model.HOSTING_PER_CLIENT}/month", "AWS instance/database share, backups, email service; falls with multi-tenancy"],
   ["Contractor costs", f"{model.CONTRACTOR_PCT:.0%} of implementation fees", "Design, copy and photography freelancers"],
   ["Card processing", f"{model.PROCESSING_PCT:.0%} of revenue", "Typical card processing rates"],
   ["Add-on services", f"{model.ADDON_PCT:.0%} of core revenue", "Photography, extra products, custom work"],
   ["Owner's draw", "$0 (M1 to 6), $2k/mo (M7 to 12), $5k/mo (Y2), $7k/mo (Y3)", "Founder plan"],
   ["Year 1 start", "November 2026", "Platform production-ready by late Oct 2026"]],
  [0.3, 0.3, 0.4], bold_first_col=True)
H2("C. Brand identity")
T([["Element", "Detail"],
   ["Company name", f"{COMPANY} (register as {COMPANY} LLC)"],
   ["Primary tagline", "\u201cYour brand, built to sell.\u201d"],
   ["Brand promise", "\u201cWe build it. We run it. You sell.\u201d"],
   ["Campaign taglines", "\u201cGood bones for your business.\u201d  \u00b7  \u201cStrong bones. Standout brands.\u201d  \u00b7  "
                         "\u201cEast Texas-built stores, selling everywhere.\u201d"],
   ["Color palette", "Navy #1B2A41 (trust, stability), Amber #E08A1E (energy, action), Teal #2A9D8F (growth)"],
   ["Typography", "Georgia for headlines; Segoe UI for body text"],
   ["Pre-launch checks", "Texas SOS name availability, domain (e.g., skelli-sites.com), USPTO trademark search, social handles"]],
  [0.25, 0.75], bold_first_col=True)
H2("D. Sources")
B(["U.S. Census Bureau, <i>Quarterly Retail E-Commerce Sales, 2nd Quarter 2026</i> (census.gov/retail/ecommerce.html).",
   "U.S. Small Business Administration, Office of Advocacy, <i>2025 Small Business Profiles</i> and "
   "<i>Frequently Asked Questions About Small Business 2026</i> (advocacy.sba.gov).",
   "Federal Reserve Bank of St. Louis (FRED), Resident Population in Tyler, TX (MSA).",
   "Tyler Economic Development Council, Demographics (tedc.org).",
   "Shopify published pricing, September 2026 (shopify.com/pricing).",
   "Texas Secretary of State, Form 205 Certificate of Formation filing fee; Texas Comptroller guidance on data processing "
   "services and franchise tax (sos.state.tx.us; comptroller.texas.gov).",
   "Internal: Skelli-Sites platform source code and three-year financial model."], st="bullet")

# ---- Build ----------------------------------------------------------------------
doc = PlanDoc(OUT)
doc.multiBuild(story)
print("wrote", OUT)
