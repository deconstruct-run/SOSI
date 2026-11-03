#!/usr/bin/env python3
"""Build data/market.js for the SOVEREIGN SI // CASE MAP.

Pulls, for every US-listed ticker in TICKERS:
  * SEC XBRL company facts (data.sec.gov) -> revenue, growth, margins, cash, debt,
    free cash flow, share count, dilution
  * Cboe delayed quotes (cdn-api.cboe.com) -> price, day change, IV30, and an
    options snapshot for the next expiry plus the next four monthly expiries

Standard library only, so it runs in a bare GitHub Action.
Set SEC_USER_AGENT to "Your Name your@email" (SEC asks for a contact).
"""
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "market.js")
UA = os.environ.get("SEC_USER_AGENT", "SovereignSI-CaseMap research casemap@example.com")

TICKERS = [
    "PLTR", "ONDS", "NVDA", "JCI", "VRT", "GEV", "BE", "CAT", "OKLO", "NNE", "BWXT",
    "QBTS", "IONQ", "RGTI", "QNT", "KTOS", "AVAV", "RCAT", "KRMN", "VOYG", "BBAI",
    "LHX", "LMT", "NOC", "RTX", "GD", "BA", "DRS", "BAH", "MSI", "ESLT",
    "CRWV", "NBIS", "IREN", "CBRS", "DUOT", "MSFT", "ORCL", "AMZN", "GOOGL", "IBM",
    "QCOM", "AMD", "DELL", "HPE", "LUMN", "SPCX", "RKLB", "PL", "BKSY", "FLY",
]

REV = ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax",
       "RevenueFromContractWithCustomerIncludingAssessedTax", "SalesRevenueNet",
       "Revenue", "RevenueFromContractsWithCustomers"]
GROSS = ["GrossProfit"]
OPINC = ["OperatingIncomeLoss", "ProfitLossFromOperatingActivities"]
NET = ["NetIncomeLoss", "ProfitLoss", "ProfitLossAttributableToOwnersOfParent"]
OCF = ["NetCashProvidedByUsedInOperatingActivities", "CashFlowsFromUsedInOperatingActivities"]
CAPEX = ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets",
         "PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities"]
CASH = ["CashAndCashEquivalentsAtCarryingValue", "CashAndCashEquivalents",
        "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"]
STI = ["ShortTermInvestments", "MarketableSecuritiesCurrent",
       "AvailableForSaleSecuritiesDebtSecuritiesCurrent", "CurrentFinancialAssetsAtFairValueThroughProfitOrLoss"]
DEBT_TOTAL = ["LongTermDebt", "DebtInstrumentCarryingAmount", "LongTermDebtAndCapitalLeaseObligations"]
DEBT_PARTS = ["LongTermDebtNoncurrent", "LongTermDebtCurrent", "ConvertibleNotesPayable",
              "ConvertibleDebtNoncurrent", "ConvertibleNotesPayableCurrent", "ShortTermBorrowings",
              "CommercialPaper", "NotesPayable", "SeniorNotes", "LongTermNotesPayable",
              "LongtermBorrowings", "ShorttermBorrowings"]


def get(url, tries=3):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(1.5 * (i + 1))
    raise last


def d(s):
    return dt.date.fromisoformat(s)


def days(a, b):
    return (d(b) - d(a)).days


def series(facts, names, unit="USD"):
    """Return the entries for the first concept (by latest end date) that exists."""
    best = None
    for tax in ("us-gaap", "ifrs-full"):
        block = facts.get(tax, {})
        for n in names:
            node = block.get(n)
            if not node:
                continue
            units = node.get("units", {})
            vals = units.get(unit)
            if not vals:
                # foreign filers sometimes report in another currency
                if unit == "USD" and units:
                    k = next(iter(units))
                    vals = units[k]
                else:
                    continue
            vals = [v for v in vals if v.get("form", "").startswith(("10-", "20-", "40-", "6-K", "8-K", "S-1", "424"))]
            if not vals:
                continue
            latest = max(v["end"] for v in vals)
            if best is None or latest > best[0]:
                best = (latest, vals)
    return best[1] if best else []


def dedupe(vals):
    by = {}
    for v in vals:
        key = (v.get("start"), v["end"])
        if key not in by or v.get("filed", "") > by[key].get("filed", ""):
            by[key] = v
    return list(by.values())


def quarters(vals):
    """Quarter values keyed by end date, deriving Q4 from annual minus three quarters."""
    vals = dedupe([v for v in vals if v.get("start")])
    q = {v["end"]: v["val"] for v in vals if 80 <= days(v["start"], v["end"]) <= 100}
    for a in vals:
        if 350 <= days(a["start"], a["end"]) <= 380 and a["end"] not in q:
            inside = [e for e in q if a["start"] < e < a["end"]]
            if len(inside) == 3:
                q[a["end"]] = a["val"] - sum(q[e] for e in inside)
    return dict(sorted(q.items()))


def ttm(vals):
    """Trailing twelve months from YTD values: latest YTD + last FY - prior YTD."""
    vals = dedupe([v for v in vals if v.get("start")])
    if not vals:
        return None, None
    latest = max(vals, key=lambda v: (v["end"], -days(v["start"], v["end"])))
    span = days(latest["start"], latest["end"])
    if 350 <= span <= 380:
        return latest["val"], latest["end"]
    fy =[v for v in vals if 350 <= days(v["start"], v["end"]) <= 380 and abs(days(v["end"], latest["start"])) <= 5]
    prior = [v for v in vals if abs(days(v["end"], latest["end"]) - 365) <= 12 and abs(days(v["start"], v["end"]) - span) <= 12]
    if fy and prior:
        return latest["val"] + fy[0]["val"] - prior[0]["val"], latest["end"]
    q = quarters(vals)
    ends = sorted(q)[-4:]
    if len(ends) == 4 and days(ends[0], ends[-1]) <= 290:
        return sum(q[e] for e in ends), ends[-1]
    return None, None


def instant(facts, names, unit="USD"):
    vals = series(facts, names, unit)
    vals = [v for v in vals if "start" not in v]
    if not vals:
        return None, None
    e = max(v["end"] for v in vals)
    same = [v for v in vals if v["end"] == e]
    return max(same, key=lambda v: v.get("filed", ""))["val"], e


def instant_at(facts, names, end, first=False):
    total, hit = 0, False
    for n in names:
        if first and hit:
            break
        for tax in ("us-gaap", "ifrs-full"):
            node = facts.get(tax, {}).get(n)
            if not node:
                continue
            for unit, vals in node.get("units", {}).items():
                m = [v for v in vals if "start" not in v and v["end"] == end]
                if m:
                    total += max(m, key=lambda v: v.get("filed", ""))["val"]
                    hit = True
                    break
            if hit:
                break
    return total if hit else None


def shares(facts):
    node = facts.get("dei", {}).get("EntityCommonStockSharesOutstanding")
    vals = node["units"].get("shares", []) if node else []
    if not vals:
        for tax in ("us-gaap", "ifrs-full"):
            n2 = facts.get(tax, {}).get("CommonStockSharesOutstanding")
            if n2 and n2["units"].get("shares"):
                vals = [v for v in n2["units"]["shares"] if "start" not in v]
                break
    if not vals:
        n3 = facts.get("us-gaap", {}).get("WeightedAverageNumberOfDilutedSharesOutstanding")
        if n3 and n3["units"].get("shares"):
            q = [v for v in n3["units"]["shares"] if v.get("start") and 80 <= days(v["start"], v["end"]) <= 100]
            vals = [{"end": v["end"], "val": v["val"], "accn": v.get("accn")} for v in q]
    if not vals:
        return None, None, None
    by_end = {}
    for v in vals:
        by_end.setdefault((v["end"], v.get("accn")), 0)
        by_end[(v["end"], v.get("accn"))] += v["val"]
    ends = sorted(by_end, key=lambda k: k[0])
    now_key = ends[-1]
    now = by_end[now_key]
    year_ago = [k for k in ends if 300 <= days(k[0], now_key[0]) <= 430]
    prior = by_end[year_ago[-1]] if year_ago else None
    return now, now_key[0], prior


def fundamentals(cik):
    facts = get(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{int(cik):010d}.json").get("facts", {})
    out = {}
    rev = series(facts, REV)
    q = quarters(rev)
    if q:
        last = sorted(q)[-1]
        out["rev_q"] = q[last]
        out["rev_q_end"] = last
        prior = [e for e in q if abs(days(e, last) - 365) <= 15]
        if prior and q[prior[-1]]:
            out["rev_yoy"] = (q[last] - q[prior[-1]]) / abs(q[prior[-1]])
    out["rev_ttm"], rev_end = ttm(rev)
    out["ttm_end"] = rev_end

    def matched(names):
        v, e = ttm(series(facts, names))
        return v if (v is not None and (rev_end is None or e == rev_end)) else None
    gp = matched(GROSS)
    op = matched(OPINC)
    ni = matched(NET)
    ocf = matched(OCF)
    cx = matched(CAPEX)
    r = out.get("rev_ttm")
    if r:
        out["gross_margin"] = gp / r if gp is not None else None
        out["op_margin"] = op / r if op is not None else None
        out["net_margin"] = ni / r if ni is not None else None
    out["net_income_ttm"] = ni
    out["ocf_ttm"] = ocf
    out["capex_ttm"] = cx
    out["fcf_ttm"] = (ocf - (cx or 0)) if ocf is not None else None
    cash, cash_end = instant(facts, CASH)
    if cash is not None:
        sti = instant_at(facts, STI, cash_end, first=True) or 0
        out["cash"] = cash + sti
        out["bs_date"] = cash_end
        debt = instant_at(facts, DEBT_TOTAL, cash_end, first=True)
        if debt is None:
            debt = instant_at(facts, ["LongTermDebtNoncurrent", "LongtermBorrowings"], cash_end, first=True)
            if debt is not None:
                debt += instant_at(facts, ["LongTermDebtCurrent", "DebtCurrent", "ShorttermBorrowings"], cash_end, first=True) or 0
        if debt is None:
            debt = instant_at(facts, ["ConvertibleNotesPayable", "ConvertibleDebtNoncurrent", "SeniorNotes",
                                      "LongTermNotesPayable", "NotesPayable"], cash_end, first=True)
        out["debt"] = debt or 0
    sh, sh_end, sh_prior = shares(facts)
    out["shares"] = sh
    if sh and sh_prior:
        out["share_change_yoy"] = (sh - sh_prior) / sh_prior
    return out


def third_friday(y, m):
    first = dt.date(y, m, 1)
    offset = (4 - first.weekday()) % 7
    return first + dt.timedelta(days=offset + 14)


OPT_RE = re.compile(r"(\d{6})([CP])(\d{8})$")


def quote(t):
    j = get(f"https://cdn-api.cboe.com/api/global/delayed_quotes/options/{t}.json")
    data = j.get("data", {})
    q = {k: data.get(k) for k in ("current_price", "price_change", "price_change_percent", "iv30",
                                   "volume", "high", "low", "prev_day_close", "last_trade_time")}
    price = q.get("current_price")
    today = dt.date.today()
    chains = {}
    for o in data.get("options", []):
        m = OPT_RE.search(o.get("option", ""))
        if not m:
            continue
        exp = dt.datetime.strptime(m.group(1), "%y%m%d").date()
        if exp < today:
            continue
        chains.setdefault(exp, []).append((m.group(2), int(m.group(3)) / 1000, o))
    expiries = sorted(chains)
    picks = []
    if expiries:
        picks.append(expiries[0])
        monthly = [e for e in expiries if e == third_friday(e.year, e.month) and e != expiries[0]]
        picks += monthly[:4]
    snap = []
    for e in picks:
        rows = chains[e]
        if not price:
            break
        strikes = sorted({s for _, s, _ in rows}, key=lambda s: abs(s - price))
        atm = strikes[0] if strikes else None

        def leg(kind):
            for k, s, o in rows:
                if k == kind and s == atm:
                    bid, ask = o.get("bid") or 0, o.get("ask") or 0
                    mid = (bid + ask) / 2 if bid and ask else o.get("last_trade_price")
                    iv = o.get("iv") or None
                    return {"mid": round(mid, 2) if mid else None, "iv": round(iv, 4) if iv else None}
            return None
        coi = sum(o.get("open_interest") or 0 for k, _, o in rows if k == "C")
        poi = sum(o.get("open_interest") or 0 for k, _, o in rows if k == "P")
        snap.append({"expiry": e.isoformat(), "monthly": e == third_friday(e.year, e.month),
                     "atm": atm, "call": leg("C"), "put": leg("P"),
                     "call_oi": int(coi), "put_oi": int(poi),
                     "pc_oi": round(poi / coi, 2) if coi else None})
    q["options"] = snap
    q["asof"] = j.get("timestamp")
    return q


def health(f, q):
    flags = []
    rev = f.get("rev_ttm") or ((f.get("rev_q") or 0) * 4)
    fcf = f.get("fcf_ttm")
    cash, debt = f.get("cash"), f.get("debt") or 0
    net_cash = (cash - debt) if cash is not None else None
    if net_cash is not None:
        flags.append("Net cash" if net_cash >= 0 else "Net debt")
    if fcf is not None:
        flags.append("FCF positive" if fcf >= 0 else "Burning cash")
    if f.get("rev_yoy") is not None:
        flags.append(f"Revenue {f['rev_yoy']*100:+.0f}% YoY")
    if (f.get("share_change_yoy") or 0) > 0.05:
        flags.append(f"Shares +{f['share_change_yoy']*100:.0f}% YoY")
    runway = None
    if fcf is not None and fcf < 0 and cash:
        runway = cash / (-fcf / 4)
        flags.append(f"Runway ~{runway:.0f} qtrs")
    if rev < 100e6:
        grade = "SPECULATIVE"
    elif (fcf is not None and fcf < 0 and net_cash is not None and net_cash < 0) or (runway is not None and runway < 6):
        grade = "STRETCHED"
    elif fcf is not None and fcf > 0 and ((net_cash or 0) >= 0 or (f.get("op_margin") or 0) > 0.15):
        grade = "STRONG"
    else:
        grade = "STABLE"
    return grade, flags


def main():
    tick = get("https://www.sec.gov/files/company_tickers.json")
    cik = {v["ticker"]: v["cik_str"] for v in tick.values()}
    out = {"generated": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"), "tickers": {}}
    for t in TICKERS:
        row = {"ticker": t}
        try:
            row["fund"] = fundamentals(cik[t]) if t in cik else {}
        except Exception as e:  # noqa: BLE001
            row["fund"] = {}
            row["fund_error"] = str(e)[:120]
        time.sleep(0.15)
        try:
            row["quote"] = quote(t)
        except Exception as e:  # noqa: BLE001
            row["quote"] = {}
            row["quote_error"] = str(e)[:120]
        f, q = row["fund"], row["quote"]
        if f.get("shares") and q.get("current_price"):
            f["market_cap"] = f["shares"] * q["current_price"]
            if f.get("rev_ttm"):
                ev = f["market_cap"] + (f.get("debt") or 0) - (f.get("cash") or 0)
                f["ev_sales"] = ev / f["rev_ttm"]
        row["grade"], row["flags"] = health(f, q)
        out["tickers"][t] = row
        print(f"{t:6} {row['grade']:11} price={q.get('current_price')} rev_ttm={f.get('rev_ttm')} opts={len(q.get('options', []))}", file=sys.stderr)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("/* Generated by pipeline/build_market.py. Do not edit by hand. */\n")
        fh.write("window.MARKET = ")
        json.dump(out, fh, separators=(",", ":"))
        fh.write(";\n")
    print(f"wrote {OUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
