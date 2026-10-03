"""Renders the plan's charts to PNG with matplotlib."""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter

import model

NAVY, AMBER, TEAL, SLATE, LIGHT = "#1B2A41", "#E08A1E", "#2A9D8F", "#8A94A6", "#E9EDF3"
SCEN_COLORS = {"Conservative": SLATE, "Expected": NAVY, "Optimistic": AMBER}
money = FuncFormatter(lambda v, _: f"${v/1000:,.0f}k" if abs(v) >= 1000 else f"${v:,.0f}")

plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 9, "axes.spines.top": False,
    "axes.spines.right": False, "axes.edgecolor": "#B8C0CC", "axes.labelcolor": "#33415C",
    "xtick.color": "#33415C", "ytick.color": "#33415C", "axes.grid": True,
    "grid.color": "#E6E9EF", "grid.linewidth": 0.8, "axes.axisbelow": True,
})


def _save(fig, path):
    fig.tight_layout()
    fig.savefig(path, dpi=200)
    plt.close(fig)


def render(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    runs = {k: model.run(v) for k, v in model.SCENARIOS.items()}
    years = {k: model.yearly(v) for k, v in runs.items()}
    paths = {}

    # 1. Three-year revenue by scenario
    fig, ax = plt.subplots(figsize=(6.6, 3.0))
    w = 0.26
    for i, (name, ys) in enumerate(years.items()):
        xs = [x + (i - 1) * w for x in range(3)]
        bars = ax.bar(xs, [y["revenue"] for y in ys], w, color=SCEN_COLORS[name], label=name)
        for b in bars:
            ax.text(b.get_x() + b.get_width() / 2, b.get_height(), f"${b.get_height()/1000:,.0f}k",
                    ha="center", va="bottom", fontsize=7, color="#33415C")
    ax.set_xticks(range(3), ["Year 1", "Year 2", "Year 3"])
    ax.yaxis.set_major_formatter(money)
    ax.legend(frameon=False, ncol=3, loc="upper left")
    ax.set_title("Total revenue by scenario", loc="left", fontsize=10, color=NAVY, fontweight="bold")
    paths["rev_scen"] = os.path.join(out_dir, "rev_scen.png"); _save(fig, paths["rev_scen"])

    # 2. Year 1 monthly revenue mix (expected)
    exp = runs["Expected"]
    y1 = exp[:12]
    fig, ax = plt.subplots(figsize=(6.6, 3.0))
    xs = [r["m"] for r in y1]
    s = [r["setup"] for r in y1]; m = [r["mrr"] for r in y1]; a = [r["addons"] for r in y1]
    ax.bar(xs, s, color=NAVY, label="Implementation fees")
    ax.bar(xs, m, bottom=s, color=TEAL, label="Monthly plans (MRR)")
    ax.bar(xs, a, bottom=[i + j for i, j in zip(s, m)], color=AMBER, label="Add-ons")
    ax.set_xticks(xs, [f"M{x}" for x in xs])
    ax.yaxis.set_major_formatter(money)
    ax.legend(frameon=False, ncol=3, loc="upper left")
    ax.set_title("Year 1 monthly revenue mix (expected case)", loc="left", fontsize=10, color=NAVY, fontweight="bold")
    paths["y1_mix"] = os.path.join(out_dir, "y1_mix.png"); _save(fig, paths["y1_mix"])

    # 3. Cash balance over 36 months by scenario
    fig, ax = plt.subplots(figsize=(6.6, 2.9))
    for name, rs in runs.items():
        ax.plot([r["m"] for r in rs], [r["cash"] for r in rs], color=SCEN_COLORS[name], lw=2, label=name)
    ax.axhline(0, color="#B23A48", lw=0.8)
    ax.yaxis.set_major_formatter(money)
    ax.set_xlabel("Month")
    ax.legend(frameon=False, ncol=3, loc="upper left")
    ax.set_title("Ending cash balance, months 1-36", loc="left", fontsize=10, color=NAVY, fontweight="bold")
    paths["cash"] = os.path.join(out_dir, "cash.png"); _save(fig, paths["cash"])

    # 4. Revenue vs total costs, monthly (expected) - break-even view
    fig, ax = plt.subplots(figsize=(6.6, 2.9))
    ms = [r["m"] for r in exp]
    ax.plot(ms, [r["revenue"] for r in exp], color=TEAL, lw=2, label="Revenue")
    ax.plot(ms, [r["cogs"] + r["total_opex"] for r in exp], color=AMBER, lw=2, label="Total costs (incl. owner's draw)")
    ax.fill_between(ms, [r["revenue"] for r in exp], [r["cogs"] + r["total_opex"] for r in exp],
                    where=[r["net"] >= 0 for r in exp], color=TEAL, alpha=0.12)
    ax.yaxis.set_major_formatter(money)
    ax.set_xlabel("Month")
    ax.legend(frameon=False, loc="upper left")
    ax.set_title("Monthly revenue vs. costs (expected case)", loc="left", fontsize=10, color=NAVY, fontweight="bold")
    paths["breakeven"] = os.path.join(out_dir, "breakeven.png"); _save(fig, paths["breakeven"])

    # 5. Active clients & MRR (expected)
    fig, ax = plt.subplots(figsize=(6.6, 2.7))
    ax.bar(ms, [r["mrr"] for r in exp], color=TEAL, label="MRR")
    ax.yaxis.set_major_formatter(money)
    ax2 = ax.twinx()
    ax2.plot(ms, [r["active"] for r in exp], color=NAVY, lw=2, label="Active clients")
    ax2.grid(False); ax2.spines["top"].set_visible(False)
    ax.set_xlabel("Month")
    h1, l1 = ax.get_legend_handles_labels(); h2, l2 = ax2.get_legend_handles_labels()
    ax.legend(h1 + h2, l1 + l2, frameon=False, loc="upper left")
    ax.set_title("Recurring revenue and active clients (expected case)", loc="left", fontsize=10, color=NAVY, fontweight="bold")
    paths["mrr"] = os.path.join(out_dir, "mrr.png"); _save(fig, paths["mrr"])

    # 6. Year 1 marketing budget by channel (horizontal bar)
    from content import MARKETING_BUDGET
    fig, ax = plt.subplots(figsize=(6.6, 2.6))
    labels = [c for c, _, _ in MARKETING_BUDGET][::-1]
    vals = [v for _, v, _ in MARKETING_BUDGET][::-1]
    ax.barh(labels, vals, color=NAVY)
    for i, v in enumerate(vals):
        ax.text(v, i, f"  ${v:,.0f}", va="center", fontsize=8, color="#33415C")
    ax.xaxis.set_major_formatter(money)
    ax.set_xlim(0, max(vals) * 1.2)
    ax.grid(axis="y", visible=False)
    ax.set_title("Year 1 marketing budget by channel", loc="left", fontsize=10, color=NAVY, fontweight="bold")
    paths["mktg"] = os.path.join(out_dir, "mktg.png"); _save(fig, paths["mktg"])

    return paths, runs, years
