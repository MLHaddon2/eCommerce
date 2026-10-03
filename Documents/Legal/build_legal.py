"""Builds the Skelli-Sites Terms of Service and Privacy Policy PDFs. Run:  python build_legal.py"""
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, CondPageBreak
from reportlab.platypus.flowables import Flowable

HERE = os.path.dirname(os.path.abspath(__file__))
COMPANY, FOUNDER = "Skelli-Sites", "Mike Haddon"
EMAIL, PHONE, CITY = "haddon.mike2@outlook.com", "903-275-0013", "Tyler, Texas"
EFFECTIVE = "October 1, 2026"

FD = r"C:\Windows\Fonts"
for name, fn in [("Body", "segoeui.ttf"), ("Body-Bold", "segoeuib.ttf"), ("Body-Italic", "segoeuii.ttf"),
                 ("Semi", "seguisb.ttf"), ("Head", "georgiab.ttf")]:
    pdfmetrics.registerFont(TTFont(name, os.path.join(FD, fn)))
registerFontFamily("Body", normal="Body", bold="Body-Bold", italic="Body-Italic", boldItalic="Body-Bold")

NAVY, AMBER, TEAL = colors.HexColor("#1B2A41"), colors.HexColor("#E08A1E"), colors.HexColor("#2A9D8F")
INK, MUTED, RULE, LIGHT = colors.HexColor("#27303F"), colors.HexColor("#6B7588"), colors.HexColor("#D5DAE3"), colors.HexColor("#F2F4F8")

S = lambda name, **kw: ParagraphStyle(name, **{"fontName": "Body", "fontSize": 9.6, "leading": 14, "textColor": INK, **kw})
st = {
    "body": S("body", spaceAfter=6),
    "sub": S("sub", leftIndent=16, spaceAfter=4),
    "bullet": S("bullet", leftIndent=28, bulletIndent=16, spaceAfter=2.5),
    "cell": S("cell", fontSize=8.6, leading=11.8), "cellb": S("cellb", fontName="Semi", fontSize=8.6, leading=11.8),
    "th": S("th", fontName="Body-Bold", fontSize=8, leading=10, textColor=colors.white),
    "title": S("title", fontName="Head", fontSize=24, leading=29, textColor=NAVY, spaceAfter=2),
    "meta": S("meta", fontSize=9, textColor=MUTED, spaceAfter=8),
    "h": S("h", fontName="Semi", fontSize=12, leading=16, textColor=NAVY, spaceBefore=12, spaceAfter=4),
    "kicker": S("kicker", fontName="Body-Bold", fontSize=8, leading=10, textColor=AMBER),
    "caps": S("caps", fontSize=9.2, leading=13.5, spaceAfter=6),
}
M = 0.95 * inch
W = letter[0] - 2 * M


class Rule(Flowable):
    def wrap(self, aw, ah):
        self.aw = aw; return aw, 10

    def draw(self):
        self.canv.setFillColor(AMBER); self.canv.rect(0, 5, 36, 2.4, stroke=0, fill=1)
        self.canv.setStrokeColor(RULE); self.canv.setLineWidth(0.6); self.canv.line(40, 6.2, self.aw, 6.2)


def page(title):
    def draw(c, doc):
        w, h = letter
        c.saveState()
        c.setStrokeColor(RULE); c.setLineWidth(0.6)
        c.line(M, h - 0.62 * inch, w - M, h - 0.62 * inch)
        c.setFont("Body-Bold", 7.5); c.setFillColor(NAVY)
        c.drawString(M, h - 0.55 * inch, COMPANY.upper())
        c.setFillColor(AMBER); c.circle(M + c.stringWidth(COMPANY.upper(), "Body-Bold", 7.5) + 5, h - 0.55 * inch + 2.6, 2.2, stroke=0, fill=1)
        c.setFont("Body", 7.5); c.setFillColor(MUTED)
        c.drawRightString(w - M, h - 0.55 * inch, f"{title}  \u00b7  Effective {EFFECTIVE}")
        c.line(M, 0.6 * inch, w - M, 0.6 * inch)
        c.drawString(M, 0.45 * inch, f"{COMPANY}  \u00b7  {CITY}  \u00b7  {EMAIL}  \u00b7  {PHONE}")
        c.setFont("Body-Bold", 8); c.setFillColor(NAVY)
        c.drawRightString(w - M, 0.45 * inch, f"Page {doc.page}")
        c.restoreState()
    return draw


class Doc:
    def __init__(self, kicker, title, intro):
        self.story = [Paragraph(kicker.upper(), st["kicker"]), Paragraph(title, st["title"]), Rule(),
                      Paragraph(f"Effective date: {EFFECTIVE}  \u00b7  Last updated: {EFFECTIVE}", st["meta"])]
        for p in intro:
            self.P(p)
        self.n = 0

    def H(self, text):
        self.n += 1; self.k = 0
        self.story += [CondPageBreak(1.2 * inch), Paragraph(f"{self.n}. {text}", st["h"])]

    def P(self, text, style="body"):
        self.story.append(Paragraph(text, st[style]))

    def C(self, text):
        """Numbered clause, e.g. 4.2"""
        self.k += 1
        self.story.append(Paragraph(f"<font name='Semi' color='#1B2A41'>{self.n}.{self.k}</font>&nbsp;&nbsp;{text}", st["body"]))

    def B(self, items):
        for i in items:
            self.story.append(Paragraph(i, st["bullet"], bulletText="\u2022"))
        self.story.append(Spacer(1, 3))

    def T(self, rows, widths, bold_first=True):
        data = [[Paragraph(str(v), st["th"] if i == 0 else (st["cellb"] if bold_first and j == 0 else st["cell"]))
                 for j, v in enumerate(r)] for i, r in enumerate(rows)]
        t = Table(data, colWidths=[x * W for x in widths], repeatRows=1)
        t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                               ("TOPPADDING", (0, 0), (-1, -1), 4.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
                               ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                               ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE)]
                              + [("BACKGROUND", (0, i), (-1, i), LIGHT) for i in range(2, len(rows), 2)]))
        self.story += [t, Spacer(1, 8)]

    def build(self, filename, header):
        out = os.path.join(HERE, filename)
        SimpleDocTemplate(out, pagesize=letter, leftMargin=M, rightMargin=M, topMargin=0.95 * inch,
                          bottomMargin=0.9 * inch, title=f"{COMPANY} - {header}", author=FOUNDER
                          ).build(self.story, onFirstPage=page(header), onLaterPages=page(header))
        return out


CONTACT = (f"<b>{COMPANY}</b><br/>Attn: {FOUNDER}, Founder<br/>{CITY}<br/>Email: {EMAIL}<br/>Phone: {PHONE}")


# =================================================================================
# TERMS OF SERVICE
# =================================================================================
def terms():
    d = Doc("Legal", "Terms of Service", [
        f"These Terms of Service (the \u201cTerms\u201d) are an agreement between you and <b>{COMPANY}</b>, a business operated by "
        f"{FOUNDER} in {CITY} (\u201c{COMPANY},\u201d \u201cwe,\u201d \u201cus\u201d or \u201cour\u201d). They apply when you visit our "
        "website or demo stores, request a free online store check-up, or buy our store design, build, hosting and marketing services.",
        "By using our website or signing a proposal or Statement of Work that refers to these Terms, you agree to them. "
        "If you are accepting on behalf of a business, you confirm you have authority to bind that business. "
        "If you do not agree, please do not use our website or services."])

    d.H("Definitions")
    d.B(["<b>\u201cClient,\u201d \u201cyou\u201d</b>: the person or business that buys Services from us, or a visitor to our website.",
         "<b>\u201cServices\u201d</b>: our implementation packages (Launch, Brand, Signature), monthly plans (Care, Growth, Scale), "
         "add-on services and the free online store check-up.",
         "<b>\u201cStatement of Work\u201d or \u201cSOW\u201d</b>: the written proposal, order or agreement that lists the package, price, "
         "timeline and scope for your project.",
         "<b>\u201cPlatform\u201d</b>: the eCommerce software we developed and own, including the storefront, checkout, customer accounts, "
         "admin panel, and underlying source code, designs, templates and documentation.",
         "<b>\u201cClient Store\u201d</b>: the online store we build and host for you on the Platform.",
         "<b>\u201cClient Content\u201d</b>: everything you give us or add to your store, such as your logo, text, photos, product "
         "information and prices.",
         "<b>\u201cEnd Customers\u201d</b>: the shoppers who visit or buy from your Client Store."])

    d.H("How these Terms work with your Statement of Work")
    d.C("Each project is described in an SOW. The SOW and these Terms together form our agreement with you.")
    d.C("If an SOW and these Terms conflict, the SOW controls for that project.")
    d.C("Prices, package contents and plan features are those shown in your SOW or, if not stated there, in our price sheet "
        "current on the date you sign.")

    d.H("Our Services")
    d.C("<b>Implementation packages.</b> We design your brand identity (as included in your package), configure a Client Store on "
        "the Platform, load your products, connect your payment accounts, and launch the store.")
    d.C("<b>Monthly plans.</b> After launch, a monthly plan covers hosting, security updates, backups and support. Growth and "
        "Scale plans add advertising and email marketing management as described in your SOW.")
    d.C("<b>Add-ons.</b> Extra work, such as product photography, copywriting, additional product uploads, migrations and custom "
        "features, is quoted separately or billed at our hourly rate.")
    d.C("<b>Free online store check-up.</b> The check-up is a complimentary, informal review of your online presence. It is "
        "provided for general information only, with no obligation to buy and no guarantee of results.")
    d.C("We may use qualified subcontractors (for example, designers, photographers or copywriters). We remain responsible "
        "for their work.")

    d.H("Your responsibilities")
    d.C("<b>Content and approvals.</b> You will provide Client Content, product details and feedback promptly, and you confirm "
        "you have the right to use everything you give us.")
    d.C("<b>Merchant accounts.</b> You will open and maintain your own payment processor accounts (such as Square and PayPal). "
        "Sales proceeds are paid by the processor directly to you. We never hold your sales funds.")
    d.C("<b>You are the seller.</b> You are the merchant of record for every sale in your Client Store. You are responsible for "
        "your products, pricing, product descriptions, inventory, order fulfillment, shipping, returns, refunds, warranties and "
        "customer service, including orders fulfilled by dropshipping or print-on-demand suppliers you choose.")
    d.C("<b>Taxes.</b> You are responsible for registering for, collecting, reporting and paying all sales, use and other taxes on "
        "your sales. The Platform includes a sales-tax calculation tool for your convenience. You are responsible for confirming "
        "that the rates and settings are correct for your business. We do not provide tax advice.")
    d.C("<b>Legal compliance.</b> You are responsible for making sure your store, products and marketing comply with the laws "
        "that apply to you, including consumer protection, advertising, shipping-time (such as the FTC Mail, Internet, or "
        "Telephone Order Merchandise Rule), email and text marketing, privacy and product safety laws. We may provide template "
        "store policies as a starting point. Templates are not legal advice, and you should have them reviewed for your business.")
    d.C("<b>Account security.</b> You will keep your admin login details confidential and tell us promptly if you suspect "
        "unauthorized access.")

    d.H("Fees and payment")
    d.C("<b>Implementation fees.</b> Unless your SOW says otherwise, 50% of the implementation fee is due before work begins and "
        "the remaining 50% is due at launch, before the store goes live.")
    d.C("<b>Monthly plans.</b> Monthly plan fees are billed in advance on the first day of each month to the payment method on "
        "file, starting the month your store launches. You authorize us to charge that payment method until the plan ends.")
    d.C("<b>Minimum term.</b> The Care plan is month-to-month. Growth and Scale plans have a minimum term of six (6) months, "
        "after which they continue month-to-month.")
    d.C("<b>Advertising spend.</b> You pay advertising platforms (such as Meta and Google) directly for your ad spend. If your "
        "monthly ad spend exceeds the limit in your plan, a management fee of 12% of the amount above the limit applies.")
    d.C("<b>Additional work.</b> Work outside your SOW is billed at $85 per hour, or as quoted, after you approve it in writing.")
    d.C("<b>Late payment.</b> If a payment is more than 15 days overdue, we may pause work and suspend your Client Store until "
        "the account is brought current. We will give you notice by email before suspending a live store.")
    d.C("<b>Refunds.</b> Deposits pay for reserved time and work already started and are non-refundable once work has begun. If we "
        "cannot complete your project for reasons within our control, we will refund any fees paid for work not delivered. "
        "Monthly plan fees are non-refundable for the month already billed.")
    d.C("<b>Price changes.</b> We may change monthly plan prices with at least 30 days\u2019 written notice. Changes do not apply "
        "during a minimum term. Fees are stated exclusive of any taxes we are required to collect, which will be added to "
        "your invoice.")

    d.H("Revisions, changes and timelines")
    d.C("Each implementation package includes up to two (2) rounds of revisions on the staging version of your store. Further "
        "revisions are additional work under Section 5.5.")
    d.C("Requests that change the agreed scope require a written change order with any change in price and timeline.")
    d.C("Timelines in your SOW are good-faith estimates that depend on receiving your content and feedback on time. We are "
        "not responsible for delays caused by late content, late approvals or third parties.")
    d.C("If we do not hear from you for 30 days during a project, we may place the project on hold. Restarting may require a "
        "new timeline and, after 90 days, a reactivation fee as quoted.")

    d.H("Ownership and intellectual property")
    d.C("<b>You own your brand and content.</b> You keep all rights in your Client Content, your domain name, your customer and "
        "order data, and your merchant and advertising accounts.")
    d.C("<b>Brand deliverables.</b> Once you have paid for them in full, you own the final brand identity deliverables we create "
        "specifically for you, such as your logo, color palette and brand guide.")
    d.C("<b>We own the Platform.</b> The Platform, including its source code, design system, templates, tools and know-how, and "
        "any improvements to it, belongs to us. Nothing in these Terms transfers ownership of the Platform to you.")
    d.C("<b>Your license.</b> While your monthly plan is active and paid, we grant you a non-exclusive, non-transferable right to "
        "use the Platform to operate your Client Store. You may not copy, resell, reverse engineer or sublicense the Platform.")
    d.C("<b>No lock-in on your data.</b> On request, and for 30 days after your plan ends, we will provide an export of your "
        "product, customer and order data in a common format (such as CSV or JSON) and help transfer your domain to you.")
    d.C("<b>Third-party materials.</b> Stock images, fonts and software from third parties remain subject to their own licenses.")
    d.C("<b>Portfolio.</b> We may show your Client Store, name and logo in our portfolio and marketing. You may opt out at any "
        "time by emailing us. Founding-client discounts are given in exchange for a testimonial and case study, as stated in "
        "your SOW.")

    d.H("Hosting, availability and support")
    d.C("We host Client Stores with third-party cloud providers and aim for 99.9% availability, excluding scheduled "
        "maintenance and events outside our control. This is a target and not a guarantee.")
    d.C("We take regular backups of Client Store data. You should also keep your own copies of important content.")
    d.C("Support response times depend on your plan and are set out in your SOW. Support covers the Platform and your Client "
        "Store. It does not cover third-party services, your devices or your internet connection.")
    d.C("We may update the Platform at any time to improve it, fix problems or keep it secure.")

    d.H("Marketing services")
    d.C("Advertising and email accounts are opened in your name wherever possible, and you own them.")
    d.C("<b>No guaranteed results.</b> We will use reasonable skill and care, but we cannot promise any level of traffic, "
        "sales, revenue, search ranking or return on ad spend.")
    d.C("Advertising and email platforms set their own rules and may reject ads or suspend accounts. We are not responsible "
        "for their decisions.")
    d.C("You confirm that any contact lists you give us were collected lawfully and that recipients agreed to receive "
        "marketing where the law requires it.")

    d.H("Third-party services")
    d.P("Client Stores rely on services we do not control, including payment processors (such as Square and PayPal), cloud "
        "hosting, email delivery, location lookup services, shipping carriers, suppliers and advertising platforms. Your use of "
        "those services is governed by their own terms and privacy policies. We are not responsible for their fees, outages, "
        "errors, policy changes or decisions.")

    d.H("Acceptable use")
    d.P("You agree not to use our website, the Platform or a Client Store to:")
    d.B(["sell illegal, counterfeit, stolen, recalled or unsafe goods, or goods your payment processor prohibits;",
         "make false or misleading claims, post fake reviews, or infringe anyone\u2019s intellectual property or privacy;",
         "send spam or unlawful marketing messages;",
         "upload malware, probe or attack our systems, or try to access data that is not yours;",
         "store full payment card numbers or security codes outside the payment processor\u2019s secure fields."])
    d.P("We may refuse a project, remove content or suspend a Client Store that breaks this section. Where practical, we will "
        "tell you first and give you a chance to fix the problem.")

    d.H("Privacy and data protection")
    d.C("Our Privacy Policy explains how we handle personal information. It is part of these Terms.")
    d.C("You decide what personal information your Client Store collects from End Customers and why. We handle that "
        "information on your behalf and only to provide the Services, as described in the Privacy Policy.")
    d.C("You are responsible for publishing a privacy policy and terms on your Client Store and for responding to your End "
        "Customers\u2019 privacy requests. We will give you reasonable help.")
    d.C("We use reasonable technical and organizational safeguards. If we become aware of a security breach affecting your "
        "Client Store data, we will notify you without undue delay.")

    d.H("Confidentiality")
    d.P("Each of us will keep the other\u2019s non-public business information confidential, use it only to perform this "
        "agreement, and protect it with reasonable care. This does not apply to information that is public, already known, "
        "independently developed, or required to be disclosed by law.")

    d.H("Term, cancellation and termination")
    d.C("These Terms apply from the date you first use our website or sign an SOW and continue while you use the Services.")
    d.C("<b>Cancelling a monthly plan.</b> You may cancel with 30 days\u2019 written notice (email is fine). For Growth and Scale "
        "plans, cancellation takes effect at the end of the minimum term or 30 days after notice, whichever is later.")
    d.C("<b>Cancelling a project.</b> If you cancel a project before launch, you owe fees for work completed to that date, and the "
        "deposit is applied toward that amount.")
    d.C("<b>Termination for cause.</b> Either of us may end the agreement if the other materially breaches it and does not fix "
        "the breach within 15 days of written notice. We may end it immediately for serious violations of Section 11.")
    d.C("<b>What happens when service ends.</b> Your Client Store is taken offline, your license to use the Platform ends, and "
        "Section 7.5 (data export) applies. After the 30-day export period we may delete your Client Store data, except where "
        "the law requires us to keep it.")

    d.H("Warranties and disclaimers")
    d.C("We will perform the Services in a professional manner. For 30 days after launch, we will fix at no charge any defect "
        "where the Client Store does not work as described in your SOW.")
    d.C("EXCEPT AS STATED IN SECTION 15.1, OUR WEBSITE, THE PLATFORM AND THE SERVICES ARE PROVIDED \u201cAS IS\u201d AND \u201cAS "
        "AVAILABLE.\u201d TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL OTHER WARRANTIES, EXPRESS OR IMPLIED, INCLUDING "
        "IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE "
        "SERVICES WILL BE UNINTERRUPTED, ERROR-FREE OR COMPLETELY SECURE.", )
    d.C("Nothing we provide is legal, tax, accounting or financial advice.")

    d.H("Limitation of liability")
    d.C("TO THE FULLEST EXTENT PERMITTED BY LAW, NEITHER PARTY IS LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR "
        "PUNITIVE DAMAGES, OR FOR LOST PROFITS, LOST SALES, LOST DATA OR BUSINESS INTERRUPTION, EVEN IF TOLD THEY WERE POSSIBLE.")
    d.C(f"OUR TOTAL LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICES IS LIMITED TO THE FEES YOU PAID TO {COMPANY.upper()} IN THE "
        "TWELVE (12) MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM.")
    d.C("These limits do not apply to your obligation to pay fees, to either party\u2019s indemnity obligations, or to liability "
        "that cannot be limited by law.")

    d.H("Indemnification")
    d.C("<b>By you.</b> You will defend and indemnify us against third-party claims, losses and costs (including reasonable "
        "attorneys\u2019 fees) arising from your Client Content, your products and sales, your dealings with End Customers and "
        "suppliers, your taxes, or your violation of law or these Terms.")
    d.C("<b>By us.</b> We will defend and indemnify you against third-party claims that the Platform, as we provide it, infringes "
        "that party\u2019s copyright or trademark, except to the extent the claim arises from Client Content or changes you asked for.")
    d.C("The party seeking indemnity must give prompt notice, allow the other party to control the defense, and cooperate "
        "reasonably.")

    d.H("Using our website and demo stores")
    d.C("You may browse our website and demo stores for your own evaluation of our Services. You must be at least 18 years old "
        "to buy Services.")
    d.C("Demo stores are for demonstration only. Products shown in a demo are not for sale, and no real order will be fulfilled.")
    d.C("If you create an account, you are responsible for keeping your login details secure and for activity under your "
        "account.")
    d.C("Our website content is provided for general information and may change without notice.")

    d.H("Governing law and disputes")
    d.C("These Terms are governed by the laws of the State of Texas, without regard to its conflict-of-laws rules.")
    d.C("Before filing a claim, each party agrees to contact the other and try in good faith to resolve the dispute informally "
        "for at least 30 days.")
    d.C("Any lawsuit must be brought in the state or federal courts located in or serving Smith County, Texas, and each party "
        "consents to those courts.")

    d.H("General terms")
    d.C("<b>Independent contractor.</b> We are an independent contractor. Nothing here creates a partnership, employment or "
        "agency relationship.")
    d.C("<b>Changes to these Terms.</b> We may update these Terms. We will post the new version with a new effective date and, "
        "for material changes, notify active Clients by email at least 30 days in advance. Continued use of the Services after "
        "the effective date means you accept the changes.")
    d.C("<b>Notices.</b> We will send notices to the email address in your SOW. Send notices to us at the address in Section 21.")
    d.C("<b>Events outside our control.</b> Neither party is liable for delay or failure caused by events beyond its reasonable "
        "control, such as natural disasters, internet or power failures, or third-party service outages.")
    d.C("<b>Assignment.</b> You may not transfer this agreement without our written consent. We may transfer it as part of a "
        "reorganization, such as forming a limited liability company, or a sale of the business.")
    d.C("<b>Entire agreement; severability.</b> These Terms, the Privacy Policy and your SOW are the entire agreement between "
        "us. If any part is found unenforceable, the rest remains in effect. A failure to enforce a right is not a waiver.")

    d.H("Contact us")
    d.P("Questions about these Terms? Contact:")
    d.P(CONTACT, "sub")
    return d.build("Skelli-Sites_Terms_of_Service.pdf", "Terms of Service")


# =================================================================================
# PRIVACY POLICY
# =================================================================================
def privacy():
    d = Doc("Legal", "Privacy Policy", [
        f"<b>{COMPANY}</b> (\u201c{COMPANY},\u201d \u201cwe,\u201d \u201cus\u201d or \u201cour\u201d) is a business operated by {FOUNDER} in "
        f"{CITY}. We design, build, host and market online stores for small businesses. This Privacy Policy explains what "
        "personal information we collect, how we use and share it, and the choices you have.",
        "<b>The short version:</b> we collect only what we need to run our business and our clients\u2019 stores. We do not sell "
        "personal information. Card payments are handled by Square and PayPal, so we never see or store full card numbers."])

    d.H("Who this policy covers")
    d.T([["If you are...", "Our role", "What applies"],
         ["A visitor to our website or demo stores, or a business owner we contact or meet",
          "We decide how your information is used (we are the \u201ccontroller\u201d).", "This policy applies in full."],
         ["A client who buys our services",
          "We are the controller for your contact, contract and billing information.", "This policy applies in full."],
         ["A shopper at an online store we built and host for a client",
          "The store owner decides how your information is used. We handle it only on their behalf (we are a "
          "\u201cservice provider\u201d or \u201cprocessor\u201d).",
          "The store\u2019s own privacy policy applies. Section 3 describes what our platform collects for the store. "
          "Send privacy requests to the store. We will help the store respond."]],
        [0.33, 0.33, 0.34], bold_first=False)

    d.H("Information we collect for our own business")
    d.T([["Category", "What we collect", "Where it comes from"],
         ["Contact details", "Name, business name, email, phone number, business address", "You, or public listings for your business"],
         ["Messages", "Name, email, subject and message sent through our contact form, emails, texts and calls", "You"],
         ["Sales visits and check-ups", "Notes from in-person visits, your answers and scores on a free online store check-up, "
          "and publicly available information about your business\u2019s online presence (website, Google listing, social pages)",
          "You and public sources"],
         ["Client records", "Proposals, Statements of Work, project files, brand assets, product content and support requests", "You"],
         ["Billing", "Invoices, payment status and payment history. Card details are collected by our payment processor, not by us.",
          "You and our payment processor"],
         ["Technical data", "IP address, browser type, and the date and time of requests. We use your IP address to limit abuse of our "
          "contact form.", "Your device"]],
        [0.2, 0.52, 0.28])
    d.P("If you ask us not to contact you again, we keep a minimal \u201cdo not contact\u201d record so we can honor your request.")

    d.H("Information our platform collects for client stores")
    d.P("When you browse or buy from a store that runs on our platform, the platform collects the following for the store owner:")
    d.T([["Category", "What is collected", "Why"],
         ["Account", "Username, email address and a password stored only in hashed (scrambled) form; date of last sign-in",
          "To create and secure your account"],
         ["Profile", "First and last name, shipping address", "To fill in checkout and deliver orders"],
         ["Orders", "Items ordered, order total, shipping address, email, order status, shipping carrier and tracking number",
          "To process, ship and support your order and send order emails"],
         ["Payments", "Amount, payment method, status, the payment processor\u2019s reference number and the last four digits of your card",
          "To record and reconcile payments and handle refunds"],
         ["Saved cards (optional)", "A reference token issued by the payment processor, card brand, last four digits and expiration date. "
          "<b>Never the full card number or security code.</b>", "To let you pay faster next time. You can delete saved cards in your account."],
         ["Shopping cart", "Items in your cart, linked to your account or to a guest session", "To keep your cart between visits"],
         ["Approximate location", "Your U.S. state. If you allow location access in your browser, your device\u2019s coordinates are sent to a "
          "geocoding service to find your state. Otherwise your state is estimated from your IP address. Precise coordinates are not stored.",
          "To pre-fill the shipping state, calculate sales tax and show available payment methods"],
         ["IP address", "IP address and time of last sign-in or visit", "Security, fraud prevention and keeping your cart"],
         ["Reviews", "Product ratings and reviews you choose to post, shown with your username", "To display customer reviews"],
         ["Contact form", "Name, email, subject and message", "To answer your question"]],
        [0.18, 0.5, 0.32])
    d.P("Some stores accept donations. Donation orders collect the same payment information as other orders.")

    d.H("Cookies and similar technologies")
    d.P("Our website and the stores on our platform use a small number of cookies and browser storage items that are needed "
        "for the site to work. We do not currently use advertising cookies or third-party analytics trackers.")
    d.T([["Name", "Type", "Purpose", "Lifetime"],
         ["access_token", "Essential cookie (not readable by scripts)", "Keeps you signed in", "About 15 minutes, renewed while you are active"],
         ["refreshToken", "Essential cookie (not readable by scripts)", "Renews your sign-in securely", "Up to 7 days"],
         ["sessionId", "Essential cookie (not readable by scripts)", "Set for every visitor. A random ID that remembers your shopping cart before you sign in", "Up to 7 days"],
         ["cart", "Browser local storage", "Stores your cart on your device", "Until you clear it or check out"]],
        [0.17, 0.3, 0.3, 0.23])
    d.P("Payment providers such as Square and PayPal load their own secure payment fields at checkout and may set their own "
        "cookies under their privacy policies. You can block or delete cookies in your browser settings, but sign-in, the cart "
        "and checkout will not work without the essential ones.")
    d.P("If we or a client store add analytics or advertising tools in the future, this policy and the store\u2019s policy will "
        "be updated first, and consent will be requested where the law requires it.")

    d.H("How we use information")
    d.B(["Provide, host, secure and support our services and our clients\u2019 stores",
         "Process orders and payments, send order confirmations and shipping updates",
         "Respond to questions, check-up requests and support tickets",
         "Prepare proposals, contracts and invoices, and collect payment",
         "Contact business owners about our services, including in-person visits, calls, emails and texts where permitted",
         "Run advertising and email campaigns for clients on Growth and Scale plans, using the client\u2019s own accounts and lists",
         "Prevent fraud, abuse and security incidents, and enforce our Terms of Service",
         "Improve the platform, fix problems and plan new features",
         "Comply with legal, tax and accounting obligations"])
    d.P("We do not use personal information for automated decisions that have legal or similarly significant effects.")

    d.H("How we share information")
    d.P("<b>We do not sell personal information, and we do not share it for targeted advertising.</b> We share information only as "
        "follows:")
    d.T([["Recipient", "What is shared", "Why"],
         ["Store owners (our clients)", "Information about their own customers, orders and payments", "They operate the store and are the seller"],
         ["Payment processors (Square, PayPal)", "Payment details you enter in their secure fields, order amount, and for saved cards a "
          "customer reference", "To process payments and refunds"],
         ["Cloud hosting provider (Amazon Web Services)", "All data stored on the platform", "To host websites and databases"],
         ["Email delivery provider", "Recipient email address and message contents", "To send order, account and contact emails"],
         ["Location services (OpenCage, ipapi.co)", "Device coordinates (only if you allow location access) or IP address",
          "To estimate your U.S. state at checkout"],
         ["Shipping carriers and suppliers", "Name, shipping address and order contents", "To deliver orders. Chosen by the store owner."],
         ["Advertising and email platforms", "Campaign content and, for clients who ask us to, their own customer lists",
          "To run marketing for clients, in the client\u2019s accounts"],
         ["Subcontractors and professional advisers", "Project materials and business records, under confidentiality", "Design, copywriting, accounting and legal support"],
         ["Authorities and others, when required", "Information required by law, court order or to protect rights and safety", "Legal compliance and protection"],
         ["A successor business", "Business records, if the business is reorganized or sold", "Business continuity, under this policy"]],
        [0.27, 0.43, 0.3])

    d.H("Payment information")
    d.P("Card numbers and security codes are entered directly into secure fields provided by Square or PayPal and go straight "
        "to those companies. They never pass through or get stored on our servers. We keep only a payment reference, the card "
        "brand, the last four digits and, for saved cards, the expiration date. Square\u2019s and PayPal\u2019s privacy policies "
        "explain how they handle your payment information.")

    d.H("How long we keep information")
    d.T([["Information", "Retention"],
         ["Sign-in cookies", "15 minutes (access) and up to 7 days (refresh)"],
         ["Guest carts and IP history", "Up to 12 months after last activity"],
         ["Customer accounts, profiles and saved cards", "Until the account is deleted, or the store closes plus the 30-day export period"],
         ["Order and transaction records", "As long as the store owner needs them and as required for tax and accounting, typically up to 7 years"],
         ["Contact form messages and emails", "Up to 2 years after the last message"],
         ["Prospect and sales visit records", "Up to 2 years after last contact; \u201cdo not contact\u201d records are kept until you ask us to remove them"],
         ["Client contracts, invoices and project files", "For the life of the relationship and up to 7 years afterward"],
         ["Client store data after a plan ends", "Available for export for 30 days, then deleted from active systems; backups expire within 90 days"]],
        [0.42, 0.58])
    d.P("We may keep information longer where the law requires it or to resolve a dispute.")

    d.H("How we protect information")
    d.B(["Passwords are stored only as salted hashes, never in readable form.",
         "Sign-in tokens are kept in cookies that scripts on the page cannot read, and expire quickly.",
         "Card data is tokenized by the payment processor, so full card numbers never reach our systems.",
         "Websites are served over encrypted connections (HTTPS).",
         "Admin tools require a sign-in with administrator permission, and access is limited to people who need it.",
         "Data is backed up regularly, and software is kept up to date."])
    d.P("No system is perfectly secure. If a security breach affects your personal information, we will notify you and the "
        "affected store owner as the law requires.")

    d.H("Your choices and rights")
    d.C("<b>Access, correction and deletion.</b> You can ask us for a copy of the personal information we hold about you, ask us "
        "to correct it, or ask us to delete it. You can update your profile, change your password and remove saved cards in your "
        "account at any time.")
    d.C("<b>Texas residents.</b> The Texas Data Privacy and Security Act gives Texas consumers the right to confirm whether their "
        "data is processed, to access, correct and delete it, to obtain a portable copy, and to opt out of the sale of personal data, "
        "targeted advertising and certain profiling. We do not sell personal data or use it for targeted advertising or such profiling. "
        "We honor these requests from anyone, regardless of where you live.")
    d.C(f"<b>How to make a request.</b> Email {EMAIL} or call {PHONE}. We may need to verify your identity. We will respond within "
        "45 days. If we decline your request, you may appeal by replying to our decision, and we will review it and respond "
        "within 60 days. Texas residents who are not satisfied may contact the Texas Attorney General.")
    d.C("<b>Shoppers at client stores.</b> Please send your request to the store you bought from. If you send it to us, we will "
        "pass it to the store and help them respond.")
    d.C("<b>Marketing messages.</b> Every marketing email has an unsubscribe link. Reply STOP to opt out of texts. You can also ask "
        "us in person, by phone or by email to stop contacting you, and we will.")
    d.C("<b>Location.</b> You can decline or turn off location access in your browser. You can always choose your state manually "
        "at checkout.")
    d.C("<b>Sensitive information.</b> We do not ask for sensitive personal information such as government ID numbers or health "
        "information. Precise device location is used only with your permission, as described in Section 3, and is not stored.")
    d.C("We will not treat you differently for exercising any of these rights.")

    d.H("Children\u2019s privacy")
    d.P("Our services are intended for businesses and adults. We do not knowingly collect personal information from children "
        "under 13. If you believe a child has given us personal information, contact us and we will delete it.")

    d.H("Where information is processed")
    d.P("We are based in Texas, and information is stored and processed in the United States. Our services are intended for "
        "customers in the United States.")

    d.H("Links to other sites")
    d.P("Our website and client stores link to other sites, such as shipping carriers\u2019 tracking pages and payment providers. "
        "Those sites have their own privacy policies, and we are not responsible for their practices.")

    d.H("Changes to this policy")
    d.P("We may update this policy as our services change. We will post the new version here with a new effective date. If the "
        "changes are significant, we will also notify active clients by email.")

    d.H("Contact us")
    d.P("Questions or requests about privacy? Contact:")
    d.P(CONTACT, "sub")
    return d.build("Skelli-Sites_Privacy_Policy.pdf", "Privacy Policy")


if __name__ == "__main__":
    print("wrote", terms())
    print("wrote", privacy())
