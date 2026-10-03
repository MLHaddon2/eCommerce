"""Financial model for the eCommerce Skeleton business plan (rough draft).

Every number here is an ASSUMPTION. Edit the values, then re-run build_plan.py
and the PDF's tables and charts will update.
"""

# ---- Pricing -------------------------------------------------------------
SETUP_TIERS = {  # one-time implementation fee, share of new clients
    "Launch":    {"price": 1500, "mix": 0.50},
    "Brand":     {"price": 3500, "mix": 0.35},
    "Signature": {"price": 6500, "mix": 0.15},
}
MONTHLY_PLANS = {  # recurring fee, share of active clients
    "Care":   {"price": 149, "mix": 0.45},
    "Growth": {"price": 399, "mix": 0.40},
    "Scale":  {"price": 899, "mix": 0.15},
}
AVG_SETUP = sum(t["price"] * t["mix"] for t in SETUP_TIERS.values())
AVG_MRR = sum(p["price"] * p["mix"] for p in MONTHLY_PLANS.values())
ADDON_PCT = 0.08          # add-on services (photos, copy, extra pages) as % of core revenue
MONTHLY_CHURN = 0.03      # share of active clients cancelling each month

# ---- New clients per month (expected case), months 1-36 ---------------------
NEW_CLIENTS = (
    [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3]      # Year 1 = 24
    + [4] * 12                                 # Year 2 = 48
    + [5] * 12                                 # Year 3 = 60
)
SCENARIOS = {"Conservative": 0.6, "Expected": 1.0, "Optimistic": 1.4}

# ---- Costs ----------------------------------------------------------------
HOSTING_PER_CLIENT = 30   # AWS instance/DB share, backups, SSL, email service per client/mo
CONTRACTOR_PCT = 0.25     # design, copy, photography contractors as % of setup fees
PROCESSING_PCT = 0.03     # card processing on what clients pay you

def fixed_opex(m, scale=1.0):
    """Monthly fixed operating costs for month m (1-based). Staffing scales with demand."""
    y = (m - 1) // 12 + 1
    tools = {1: 200, 2: 350, 3: 500}[y]            # dev tools, design, CRM, email platform
    insurance = {1: 100, 2: 125, 3: 175}[y]        # general + professional liability
    admin = {1: 150, 2: 250, 3: 350}[y]            # bookkeeping, CPA, legal
    utilities = 100                                # phone, internet
    marketing = (750 if m <= 3 else 1250) if y == 1 else {2: 3000, 3: 5000}[y]
    owner = (0 if m <= 6 else 2000) if y == 1 else {2: 5000, 3: 7000}[y]
    staff = 0
    if y == 2:
        staff = 1500 + 3000                        # part-time support/VA + part-time dev/design contractor
    if y == 3:
        staff = 2000 + 5500 + 4500 + 1500          # support, developer, ads specialist, payroll taxes
    office = 400 if y == 3 else 0                  # coworking space in Tyler (Year 3)
    return {"Software & tools": tools, "Insurance": insurance, "Accounting & legal": admin,
            "Phone & internet": utilities, "Marketing": marketing,
            "Owner's draw": owner, "Staff & contractors": staff * scale, "Office / coworking": office}

STARTUP_COSTS = [
    ("Texas LLC Certificate of Formation (SOS filing)", 300),
    ("Assumed name (DBA) certificate, if brand differs from LLC name", 25),
    ("Registered agent (1 yr, optional)", 125),
    ("Domain names + business email (1 yr)", 150),
    ("Brand identity: logo, colors, brand guide (freelancer)", 750),
    ("Contract templates: MSA, SOW, privacy/terms (attorney review)", 750),
    ("Business insurance, first quarter deposit", 300),
    ("Production AWS setup, SSL, monitoring (first 3 months)", 450),
    ("Software subscriptions (first 3 months)", 600),
    ("Launch marketing: portfolio site, demo stores, printed materials", 1500),
    ("Networking: Tyler Area Chamber membership + events", 500),
    ("Contingency (~10%)", 550),
]
OWNER_CONTRIBUTION = 10000   # self-funded starting cash (covers startup costs + reserve)


def run(scale=1.0):
    months, active = [], 0.0
    for m, n in enumerate(NEW_CLIENTS, start=1):
        new = n * scale
        active = active * (1 - MONTHLY_CHURN) + new
        setup = new * AVG_SETUP
        mrr = active * AVG_MRR
        addons = (setup + mrr) * ADDON_PCT
        revenue = setup + mrr + addons
        cogs = active * HOSTING_PER_CLIENT + setup * CONTRACTOR_PCT + revenue * PROCESSING_PCT
        opex = fixed_opex(m, scale)
        total_opex = sum(opex.values())
        months.append(dict(m=m, new=new, active=active, setup=setup, mrr=mrr, addons=addons,
                           revenue=revenue, cogs=cogs, gross=revenue - cogs, opex=opex,
                           total_opex=total_opex, net=revenue - cogs - total_opex))
    cash = OWNER_CONTRIBUTION - sum(c for _, c in STARTUP_COSTS)
    for row in months:
        cash += row["net"]
        row["cash"] = cash
    return months


def yearly(months):
    out = []
    for y in range(3):
        rows = months[y * 12:(y + 1) * 12]
        agg = {k: sum(r[k] for r in rows) for k in
               ("new", "setup", "mrr", "addons", "revenue", "cogs", "gross", "total_opex", "net")}
        agg["opex"] = {k: sum(r["opex"][k] for r in rows) for k in rows[0]["opex"]}
        agg["active_end"] = rows[-1]["active"]
        agg["mrr_end"] = rows[-1]["mrr"]
        agg["cash_end"] = rows[-1]["cash"]
        out.append(agg)
    return out


if __name__ == "__main__":
    print(f"avg setup ${AVG_SETUP:,.0f}  avg MRR ${AVG_MRR:,.0f}")
    for name, s in SCENARIOS.items():
        ys = yearly(run(s))
        print(name, [(round(y["revenue"]), round(y["net"]), round(y["active_end"]), round(y["cash_end"])) for y in ys])
