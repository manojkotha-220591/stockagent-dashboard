import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import {
  Search, Github, RefreshCw, Send, AlertTriangle, Rocket, TrendingUp,
  TrendingDown, Minus, X, Copy, Download, Mail, Lock, ChevronRight,
  Activity, Filter, Check, Loader2, ArrowUpDown, Eye, EyeOff, Trash2,
  PlusCircle, SearchCode, Radio, ShieldAlert,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const T = {
  bg: "#0a0b0f",
  surface: "#12141a",
  surfaceHover: "#171a22",
  surfaceRaised: "#1b1e27",
  border: "#21252f",
  borderLight: "#2a2f3c",
  textPrimary: "#e7e9ee",
  textMuted: "#7b8394",
  textFaint: "#4b5162",
  accent: "#35d0ba",
  accentDim: "#1d6e63",
  buy: "#34d399",
  hold: "#94a3b8",
  reduce: "#fbbf24",
  exit: "#fb7185",
};

const ACTION_COLOR = { ACCUMULATE: T.buy, HOLD: T.hold, WATCH: T.hold, REDUCE: T.reduce, EXIT: T.exit };
const ACTION_ORDER = { ACCUMULATE: 0, REDUCE: 1, EXIT: 2, HOLD: 3, WATCH: 4 };

const fontDisplay = "'Space Grotesk', system-ui, sans-serif";
const fontMono = "'IBM Plex Mono', ui-monospace, monospace";
const fontBody = "'Inter', system-ui, sans-serif";

/* ------------------------------------------------------------------ */
/* Sample data — real holdings from the user's actual portfolio,       */
/* with illustrative analysis so the dashboard is explorable before    */
/* connecting real data.                                               */
/* ------------------------------------------------------------------ */
function genHistory(base, points, drift) {
  const out = [];
  let v = base;
  const today = new Date();
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 3);
    out.push({ date: d.toISOString().slice(5, 10), score: Math.max(1, Math.min(10, Math.round(v))) });
    v += drift + (Math.random() - 0.5) * 1.4;
  }
  return out;
}

const SAMPLE_STOCKS = [
  {
    symbol: "EASEMYTRIP", name: "Easy Trip Planners", sector: "Travel OTA", qty: 100,
    action: "HOLD", score: 5, sentiment: "NEUTRAL", horizon: "MEDIUM",
    summary: "No major filings today; Google/ET News flow neutral to slightly cautious on OTA discounting trends heading into the festive booking season.",
    risks: ["Zero-commission model pressure from airline direct-booking pushes", "Margin compression if competitive discounting escalates"],
    opportunities: ["International route expansion still under-monetized vs. peers"],
    signals: ["Q2 concall date not yet announced"], trigger: "Watch for Q2 FY27 results date confirmation",
    history: genHistory(5, 7, 0.05),
  },
  {
    symbol: "PAYTM", name: "One97 Communications (Paytm)", sector: "Fintech Payments", qty: 50,
    action: "ACCUMULATE", score: 7, sentiment: "BULLISH", horizon: "MEDIUM",
    summary: "RBI regulatory overhang continues to ease; UPI market share stabilizing and lending partnerships (Payments Bank restrictions aside) showing early traction.",
    risks: ["Regulatory relationship with RBI still not fully normalized", "Merchant lending book quality unproven through a full credit cycle"],
    opportunities: ["Soundbox + merchant device installed base still compounding", "Cross-sell into insurance distribution"],
    signals: ["Merchant device additions", "RBI commentary in press"], trigger: "Any RBI statement on Payments Bank restrictions",
    history: genHistory(5, 7, 0.35),
  },
  {
    symbol: "IDEA", name: "Vodafone Idea", sector: "Telecom", qty: 200,
    action: "REDUCE", score: 3, sentiment: "BEARISH", horizon: "LONG",
    summary: "AGR dues overhang and continued subscriber losses to Jio/Airtel keep the balance sheet fragile despite periodic government-support headlines.",
    risks: ["Continued ARPU-accretive subscriber churn to rivals", "Government equity conversion dilutes existing shareholders further"],
    opportunities: ["Any AGR relief ruling would be a sharp positive catalyst"],
    signals: ["AGR case hearing dates", "Promoter infusion news"], trigger: "Supreme Court AGR curative petition outcome",
    history: genHistory(4, 7, -0.25),
  },
  {
    symbol: "DREAMFOLKS", name: "DreamFolks Services", sector: "Airport Lounges", qty: 75,
    action: "REDUCE", score: 4, sentiment: "BEARISH", horizon: "MEDIUM",
    summary: "Core lounge-access revenue base continues to face pressure as card issuers renegotiate or in-house their airport lounge programs, structurally eroding DreamFolks' core contract economics.",
    risks: ["Concentration risk: small number of card-issuer contracts drive majority of revenue", "Issuers increasingly building lounge access in-house, disintermediating DreamFolks"],
    opportunities: ["Diversification into railway lounges and international airports still early-stage"],
    signals: ["Contract renewal news from major card issuers"], trigger: "Any card issuer confirming in-house lounge program",
    history: genHistory(6, 7, -0.3),
  },
  {
    symbol: "HDFCBANK", name: "HDFC Bank", sector: "Private Banking", qty: 20,
    action: "ACCUMULATE", score: 8, sentiment: "BULLISH", horizon: "LONG",
    summary: "Post-merger NIM stabilization on track; deposit growth finally catching up to loan book expansion, easing the credit-deposit ratio concern that weighed on the stock.",
    risks: ["Still working through elevated credit-deposit ratio vs pre-merger levels"],
    opportunities: ["NIM expansion as high-cost HDFC Ltd. borrowings roll off", "Branch expansion into semi-urban markets"],
    signals: ["Quarterly CD ratio trend", "Deposit growth rate"], trigger: "Q2 FY27 NIM print",
    history: genHistory(7, 7, 0.2),
  },
  {
    symbol: "VEDL", name: "Vedanta Limited", sector: "Diversified Metals", qty: 40,
    action: "HOLD", score: 6, sentiment: "NEUTRAL", horizon: "MEDIUM",
    summary: "Demerger into separate aluminium, power, steel and base-metals entities continues to add execution complexity across the four related holdings in this portfolio.",
    risks: ["Demerger execution risk and inter-entity debt allocation still not fully resolved", "High promoter leverage at the parent level"],
    opportunities: ["Value unlock potential once demerged entities list independently"],
    signals: ["NCLT demerger approval milestones"], trigger: "Next NCLT hearing date",
    history: genHistory(6, 7, 0.05),
  },
  {
    symbol: "RVNL", name: "Rail Vikas Nigam", sector: "Railway Infra PSU", qty: 10,
    action: "ACCUMULATE", score: 7, sentiment: "BULLISH", horizon: "MEDIUM",
    summary: "Order book continues to build ahead of the railway capex cycle; recent order wins point to steady execution visibility over the next several quarters.",
    risks: ["PSU order execution timelines historically slip"],
    opportunities: ["Railway capex budget allocation trend remains a multi-year tailwind"],
    signals: ["New order announcements", "Union Budget railway capex line-item"], trigger: "Next major order award",
    history: genHistory(5, 7, 0.3),
  },
  {
    symbol: "WAAREEENER", name: "Waaree Energies", sector: "Solar Energy", qty: 15,
    action: "ACCUMULATE", score: 8, sentiment: "BULLISH", horizon: "LONG",
    summary: "PLI scheme tailwinds and expanding module manufacturing capacity keep the multi-year growth narrative intact; export order momentum to the US remains a swing factor.",
    risks: ["US tariff/trade policy shifts could affect export order economics"],
    opportunities: ["Capacity expansion runway well ahead of demand", "Backward integration into ingots/wafers"],
    signals: ["US solar tariff policy news", "Capacity utilization updates"], trigger: "Any US trade policy announcement on solar imports",
    history: genHistory(6, 7, 0.4),
  },
  {
    symbol: "GTLINFRA", name: "GTL Infrastructure", sector: "Telecom Infra", qty: 300,
    action: "EXIT", score: 2, sentiment: "BEARISH", horizon: "SHORT",
    summary: "Elevated debt levels and going-concern language in recent commentary keep downside risk elevated with limited near-term visibility on resolution.",
    risks: ["High leverage with limited free cash flow to service debt", "Tenancy losses as telecom tower consolidation continues"],
    opportunities: ["Any successful debt restructuring would be a sharp re-rating catalyst"],
    signals: ["Lender consortium restructuring talks"], trigger: "Any formal debt restructuring announcement",
    history: genHistory(3, 7, -0.2),
  },
  {
    symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Private Banking", qty: 60,
    action: "HOLD", score: 6, sentiment: "NEUTRAL", horizon: "MEDIUM",
    summary: "Steady, unspectacular quarter — asset quality remains best-in-class among private banks, though loan growth continues to lag larger peers.",
    risks: ["Loan growth persistently below larger private bank peers"],
    opportunities: ["Digital-first cost structure supports superior ROE over cycle"],
    signals: ["Loan growth guidance"], trigger: "Management commentary on growth acceleration plans",
    history: genHistory(6, 7, 0.05),
  },
  {
    symbol: "IRFC", name: "Indian Railway Finance Corp", sector: "Railway Finance PSU", qty: 150,
    action: "HOLD", score: 6, sentiment: "NEUTRAL", horizon: "MEDIUM",
    summary: "Stable, bond-like earnings profile continues as the financing arm for railway rolling stock; growth is a function of railway capex disbursement pace.",
    risks: ["Thin lending spread regulated by government policy, limited re-rating catalyst"],
    opportunities: ["Steady dividend profile", "Volume growth tied to railway capex expansion"],
    signals: ["New financing mandates from Railway Ministry"], trigger: "Union Budget railway capex allocation",
    history: genHistory(6, 7, 0.0),
  },
  {
    symbol: "OLECTRA", name: "Olectra Greentech", sector: "EV Buses", qty: 30,
    action: "ACCUMULATE", score: 7, sentiment: "BULLISH", horizon: "MEDIUM",
    summary: "State transport corporation electric bus tenders continue to flow; execution track record on prior orders improving delivery credibility.",
    risks: ["Working capital intensity of large government tender contracts"],
    opportunities: ["FAME subsidy extension would meaningfully expand addressable order pipeline"],
    signals: ["State STU tender awards"], trigger: "Next state transport tender result",
    history: genHistory(5, 7, 0.25),
  },
  {
    symbol: "SUBEXLTD", name: "Subex Limited", sector: "Telecom Analytics", qty: 90,
    action: "WATCH", score: 5, sentiment: "NEUTRAL", horizon: "MEDIUM",
    summary: "Turnaround story in telecom fraud-management analytics; recent deal wins provide some encouragement but scale remains a question mark.",
    risks: ["Small deal sizes relative to fixed cost base"],
    opportunities: ["AI-driven fraud analytics upsell into existing telco client base"],
    signals: ["New client wins", "Deal size trend"], trigger: "Any large multi-year contract announcement",
    history: genHistory(5, 7, 0.05),
  },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function scoreColor(score) {
  if (score >= 7) return T.buy;
  if (score >= 5) return T.reduce;
  return T.exit;
}

function trendArrow(history) {
  if (!history || history.length < 2) return "flat";
  const a = history[history.length - 2].score;
  const b = history[history.length - 1].score;
  if (b > a) return "up";
  if (b < a) return "down";
  return "flat";
}

function sentimentIcon(sentiment, size = 14) {
  if (sentiment === "BULLISH") return <TrendingUp size={size} color={T.buy} />;
  if (sentiment === "BEARISH") return <TrendingDown size={size} color={T.exit} />;
  return <Minus size={size} color={T.hold} />;
}

// UTF-8 safe base64 decode (filing/news text can contain ₹ and other non-ASCII chars)
function b64DecodeUtf8(b64) {
  const binary = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

async function ghRequest(owner, repo, token, path, options = {}) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res;
}

async function fetchJsonFile(owner, repo, token, path) {
  const res = await ghRequest(owner, repo, token, `contents/${path}`);
  const data = await res.json();
  return JSON.parse(b64DecodeUtf8(data.content));
}

async function listDir(owner, repo, token, path) {
  const res = await ghRequest(owner, repo, token, `contents/${path}`);
  return res.json();
}

async function triggerWorkflow(owner, repo, token, workflowFile, inputs) {
  await ghRequest(owner, repo, token, `actions/workflows/${workflowFile}/dispatches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref: "main", inputs }),
  });
}

/* Build the same HTML report styling as agent/build_email.py, client-side */
function buildReportHtml(stocks, meta) {
  const actionColors = {
    ACCUMULATE: ["#0a2e1a", "#10b981", "#6ee7b7"], HOLD: ["#1a1a2e", "#6366f1", "#818cf8"],
    WATCH: ["#1a1a2e", "#6366f1", "#818cf8"], REDUCE: ["#2d1b00", "#f59e0b", "#fcd34d"],
    EXIT: ["#2d0a0a", "#ef4444", "#fca5a5"],
  };
  const card = (s) => {
    const [bg, bc, tc] = actionColors[s.action] || actionColors.HOLD;
    const scoreColorH = s.score >= 7 ? "#10b981" : s.score >= 5 ? "#f59e0b" : "#ef4444";
    const bars = "█".repeat(s.score) + "░".repeat(10 - s.score);
    return `
    <div style="background:#1a1d27;border:1px solid ${bc}60;border-left:3px solid ${bc};border-radius:14px;padding:16px 20px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <div>
          <span style="font-size:16px;font-weight:700;color:#f1f5f9">${s.symbol}</span>
          <span style="background:#252a3e;color:#94a3b8;border-radius:6px;padding:2px 8px;font-size:10px;margin-left:8px">${s.sector}</span>
        </div>
        <div style="background:${bg};border:1px solid ${bc};border-radius:8px;padding:5px 14px;font-size:12px;font-weight:700;color:${tc}">${s.action}</div>
      </div>
      <div style="font-family:monospace;color:${scoreColorH};font-size:14px;margin-bottom:8px">${bars} <strong>${s.score}/10</strong></div>
      <div style="font-size:13px;color:#94a3b8;line-height:1.6;padding:10px 14px;background:#0f1117;border-radius:8px">${s.summary}</div>
      ${s.risks?.length ? `<div style="background:#2d0a0a;border-radius:10px;padding:12px 16px;margin-top:10px"><div style="font-size:11px;color:#ef4444;font-weight:600;margin-bottom:6px">⚠ HIDDEN RISKS</div><ul style="margin:0;padding-left:18px;font-size:12px;color:#fca5a5">${s.risks.map((r) => `<li>${r}</li>`).join("")}</ul></div>` : ""}
      ${s.opportunities?.length ? `<div style="background:#052e16;border-radius:10px;padding:12px 16px;margin-top:10px"><div style="font-size:11px;color:#10b981;font-weight:600;margin-bottom:6px">🚀 HIDDEN OPPORTUNITIES</div><ul style="margin:0;padding-left:18px;font-size:12px;color:#6ee7b7">${s.opportunities.map((o) => `<li>${o}</li>`).join("")}</ul></div>` : ""}
    </div>`;
  };
  const sorted = [...stocks].sort((a, b) => (ACTION_ORDER[a.action] ?? 5) - (ACTION_ORDER[b.action] ?? 5) || b.score - a.score);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#0f1117;font-family:Inter,system-ui,sans-serif;color:#f1f5f9">
  <div style="max-width:700px;margin:0 auto;padding:24px 16px">
    <div style="font-size:18px;font-weight:700;margin-bottom:4px">📊 Portfolio Intelligence Report</div>
    <div style="font-size:12px;color:#818cf8;margin-bottom:20px">${meta.date} · ${stocks.length} stocks · Generated from StockAgent Command Center</div>
    ${sorted.map(card).join("")}
    <div style="text-align:center;padding:24px 0 8px;border-top:1px solid #2a2e42;margin-top:24px;font-size:11px;color:#64748b">
      AI-generated, informational only. Not SEBI-registered investment advice.
    </div>
  </div></body></html>`;
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function Pill({ children, color, bg }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, fontFamily: fontMono,
      fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 5,
      color, background: bg, border: `1px solid ${color}40`, letterSpacing: 0.3,
    }}>{children}</span>
  );
}

function ConvictionBar({ score }) {
  const color = scoreColor(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 56, height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${score * 10}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontFamily: fontMono, fontSize: 12, color, fontWeight: 600, minWidth: 24 }}>{score}/10</span>
    </div>
  );
}

function KpiStrip({ stocks }) {
  const total = stocks.length;
  const watch = stocks.filter((s) => s.qty === 0).length;
  const avgScore = total ? (stocks.reduce((a, s) => a + s.score, 0) / total).toFixed(1) : "–";
  const bullish = stocks.filter((s) => s.sentiment === "BULLISH").length;
  const bearish = stocks.filter((s) => s.sentiment === "BEARISH").length;
  const attention = stocks.filter((s) => s.action === "REDUCE" || s.action === "EXIT").length;
  const top = [...stocks].sort((a, b) => b.score - a.score)[0];

  const items = [
    { label: "HOLDINGS", value: total - watch },
    { label: "WATCHLIST", value: watch },
    { label: "AVG CONVICTION", value: avgScore, color: scoreColor(Number(avgScore) || 0) },
    { label: "BULLISH / BEARISH", value: `${bullish} / ${bearish}`, color: bullish >= bearish ? T.buy : T.exit },
    { label: "NEEDS ATTENTION", value: attention, color: attention > 0 ? T.reduce : T.hold },
    { label: "TOP CONVICTION", value: top ? top.symbol : "–", color: T.accent, mono: true },
  ];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 0, borderBottom: `1px solid ${T.border}`, background: T.surface }}>
      {items.map((it, i) => (
        <div key={i} style={{
          flex: "1 1 140px", padding: "14px 20px", borderRight: i < items.length - 1 ? `1px solid ${T.border}` : "none",
        }}>
          <div style={{ fontFamily: fontBody, fontSize: 10, letterSpacing: 1, color: T.textFaint, marginBottom: 4 }}>{it.label}</div>
          <div style={{ fontFamily: fontMono, fontSize: 20, fontWeight: 600, color: it.color || T.textPrimary }}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}

function Blotter({ stocks, selected, onSelect, search, setSearch, actionFilter, setActionFilter, sortKey, sortDir, onSort }) {
  const filtered = useMemo(() => {
    let list = stocks.filter((s) =>
      (s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()))
      && (actionFilter === "ALL" || s.action === actionFilter)
    );
    list.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === "action") { av = ACTION_ORDER[a.action] ?? 9; bv = ACTION_ORDER[b.action] ?? 9; }
      if (typeof av === "string") { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [stocks, search, actionFilter, sortKey, sortDir]);

  const Th = ({ id, children, width }) => (
    <th onClick={() => onSort(id)} style={{
      textAlign: "left", padding: "8px 12px", fontSize: 10, letterSpacing: 0.8, color: T.textFaint,
      fontFamily: fontBody, cursor: "pointer", userSelect: "none", width, borderBottom: `1px solid ${T.border}`,
      whiteSpace: "nowrap",
    }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {children}{sortKey === id && <ArrowUpDown size={10} />}
      </span>
    </th>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", gap: 8, padding: 12, borderBottom: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 10px" }}>
          <Search size={14} color={T.textFaint} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ticker or company…"
            style={{ background: "transparent", border: "none", outline: "none", color: T.textPrimary, fontFamily: fontBody, fontSize: 13, width: "100%" }}
          />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={{
          background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontFamily: fontBody,
          fontSize: 12, padding: "6px 10px",
        }}>
          <option value="ALL">All actions</option>
          <option value="ACCUMULATE">Accumulate</option>
          <option value="HOLD">Hold</option>
          <option value="REDUCE">Reduce</option>
          <option value="EXIT">Exit</option>
        </select>
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: T.surface, zIndex: 1 }}>
            <tr>
              <Th id="symbol">Symbol</Th>
              <Th id="sector">Sector</Th>
              <Th id="action">Action</Th>
              <Th id="score" width={140}>Conviction</Th>
              <Th id="sentiment">Sentiment</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const isSel = selected?.symbol === s.symbol;
              const arrow = trendArrow(s.history);
              return (
                <tr
                  key={s.symbol} onClick={() => onSelect(s)}
                  style={{
                    cursor: "pointer", background: isSel ? T.surfaceRaised : "transparent",
                    borderLeft: `3px solid ${ACTION_COLOR[s.action] || T.hold}`,
                    borderBottom: `1px solid ${T.border}`,
                  }}
                  onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = T.surfaceHover; }}
                  onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                >
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontFamily: fontMono, fontWeight: 600, fontSize: 13, color: T.textPrimary }}>{s.symbol}</div>
                    <div style={{ fontFamily: fontBody, fontSize: 11, color: T.textFaint }}>{s.name}</div>
                  </td>
                  <td style={{ padding: "10px 12px", fontFamily: fontBody, fontSize: 11, color: T.textMuted }}>{s.sector}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <Pill color={ACTION_COLOR[s.action] || T.hold} bg={`${ACTION_COLOR[s.action] || T.hold}18`}>{s.action}</Pill>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <ConvictionBar score={s.score} />
                      {arrow === "up" && <TrendingUp size={12} color={T.buy} />}
                      {arrow === "down" && <TrendingDown size={12} color={T.exit} />}
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>{sentimentIcon(s.sentiment)}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: T.textFaint, fontFamily: fontBody, fontSize: 13 }}>
                No stocks match this filter.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PortfolioPulse({ stocks }) {
  const dist = ["ACCUMULATE", "HOLD", "REDUCE", "EXIT"].map((a) => ({
    name: a, value: stocks.filter((s) => s.action === a || (a === "HOLD" && s.action === "WATCH")).length,
  })).filter((d) => d.value > 0);
  const attention = stocks.filter((s) => s.action === "REDUCE" || s.action === "EXIT").sort((a, b) => a.score - b.score);
  const topPicks = [...stocks].filter((s) => s.action === "ACCUMULATE").sort((a, b) => b.score - a.score).slice(0, 4);

  return (
    <div style={{ padding: 20, overflowY: "auto", height: "100%" }}>
      <div style={{ fontFamily: fontDisplay, fontSize: 15, fontWeight: 600, color: T.textPrimary, marginBottom: 4 }}>Portfolio Pulse</div>
      <div style={{ fontFamily: fontBody, fontSize: 12, color: T.textFaint, marginBottom: 20 }}>Select a row for a full dossier, or scan the desk-wide read here.</div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
        <div style={{ width: 120, height: 120 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={dist} dataKey="value" nameKey="name" innerRadius={34} outerRadius={56} paddingAngle={3} stroke="none">
                {dist.map((d, i) => <Cell key={i} fill={ACTION_COLOR[d.name] || T.hold} />)}
              </Pie>
              <Tooltip contentStyle={{ background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 8, fontFamily: fontBody, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {dist.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: fontBody, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: ACTION_COLOR[d.name] || T.hold }} />
              <span style={{ color: T.textMuted }}>{d.name}</span>
              <span style={{ fontFamily: fontMono, color: T.textPrimary, fontWeight: 600 }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {attention.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: fontBody, fontSize: 11, letterSpacing: 0.8, color: T.exit, marginBottom: 8 }}>
            <ShieldAlert size={13} /> NEEDS ATTENTION
          </div>
          {attention.map((s) => (
            <div key={s.symbol} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontFamily: fontMono, fontSize: 12, color: T.textPrimary }}>{s.symbol}</span>
              <Pill color={ACTION_COLOR[s.action]} bg={`${ACTION_COLOR[s.action]}18`}>{s.action}</Pill>
            </div>
          ))}
        </div>
      )}

      {topPicks.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: fontBody, fontSize: 11, letterSpacing: 0.8, color: T.buy, marginBottom: 8 }}>
            <Rocket size={13} /> TOP CONVICTION
          </div>
          {topPicks.map((s) => (
            <div key={s.symbol} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontFamily: fontMono, fontSize: 12, color: T.textPrimary }}>{s.symbol}</span>
              <ConvictionBar score={s.score} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StockDossier({ stock, onClose }) {
  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: fontMono, fontSize: 18, fontWeight: 700, color: T.textPrimary }}>{stock.symbol}</div>
          <div style={{ fontFamily: fontBody, fontSize: 12, color: T.textFaint }}>{stock.name} · {stock.sector}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textFaint }}><X size={16} /></button>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <Pill color={ACTION_COLOR[stock.action]} bg={`${ACTION_COLOR[stock.action]}18`}>{stock.action}</Pill>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>{sentimentIcon(stock.sentiment)}<span style={{ fontFamily: fontBody, fontSize: 11, color: T.textMuted }}>{stock.sentiment}</span></span>
          <span style={{ fontFamily: fontBody, fontSize: 11, color: T.textFaint, background: T.surfaceRaised, padding: "3px 8px", borderRadius: 5 }}>{stock.horizon} horizon</span>
          {stock.qty > 0
            ? <span style={{ fontFamily: fontMono, fontSize: 11, color: T.buy, background: `${T.buy}18`, padding: "3px 8px", borderRadius: 5 }}>HOLDING: {stock.qty.toLocaleString("en-IN")}</span>
            : <span style={{ fontFamily: fontMono, fontSize: 11, color: T.accent, background: `${T.accent}18`, padding: "3px 8px", borderRadius: 5 }}>WATCHLIST</span>}
        </div>

        <ConvictionBar score={stock.score} />

        <div style={{ height: 100, marginTop: 16, marginBottom: 16 }}>
          <ResponsiveContainer>
            <LineChart data={stock.history}>
              <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontFamily: fontMono, fontSize: 9, fill: T.textFaint }} axisLine={{ stroke: T.border }} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontFamily: fontMono, fontSize: 9, fill: T.textFaint }} axisLine={false} tickLine={false} width={20} />
              <Tooltip contentStyle={{ background: T.surfaceRaised, border: `1px solid ${T.border}`, borderRadius: 8, fontFamily: fontBody, fontSize: 12 }} labelStyle={{ color: T.textMuted }} />
              <Line type="monotone" dataKey="score" stroke={T.accent} strokeWidth={2} dot={{ r: 2, fill: T.accent }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ fontFamily: fontBody, fontSize: 13, color: T.textMuted, lineHeight: 1.6, padding: "12px 14px", background: T.bg, borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 16 }}>
          {stock.summary}
        </div>

        {stock.risks?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: fontBody, fontSize: 11, letterSpacing: 0.6, color: T.exit, marginBottom: 8 }}>
              <AlertTriangle size={12} /> HIDDEN RISKS
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontFamily: fontBody, fontSize: 12.5, color: "#f5b7bd", lineHeight: 1.7 }}>
              {stock.risks.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}

        {stock.opportunities?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: fontBody, fontSize: 11, letterSpacing: 0.6, color: T.buy, marginBottom: 8 }}>
              <Rocket size={12} /> HIDDEN OPPORTUNITIES
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontFamily: fontBody, fontSize: 12.5, color: "#a7f0d1", lineHeight: 1.7 }}>
              {stock.opportunities.map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          </div>
        )}

        {stock.signals?.length > 0 && (
          <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {stock.signals.map((sig, i) => (
              <span key={i} style={{ fontFamily: fontBody, fontSize: 11, color: T.accent, background: `${T.accent}14`, border: `1px solid ${T.accent}30`, padding: "3px 9px", borderRadius: 6 }}>{sig}</span>
            ))}
          </div>
        )}

        {stock.trigger && (
          <div style={{ fontFamily: fontBody, fontSize: 12, color: "#fcd34d", background: "#2d1b0040", border: `1px solid ${T.reduce}30`, padding: "10px 14px", borderRadius: 8 }}>
            <strong>⚡ Key trigger:</strong> {stock.trigger}
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectPanel({ owner, setOwner, repo, setRepo, token, setToken, connected, connecting, log, onConnect, onTrigger, triggering }) {
  const [addForm, setAddForm] = useState({ symbol: "", bse_code: "", company_name: "", sector: "", qty: "0" });
  const [removeSymbol, setRemoveSymbol] = useState("");
  const [researchForm, setResearchForm] = useState({ symbol: "", bse_code: "", company_name: "", sector: "" });

  const Field = ({ label, ...props }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontFamily: fontBody, fontSize: 10, letterSpacing: 0.6, color: T.textFaint, marginBottom: 4 }}>{label}</div>
      <input {...props} style={{
        width: "100%", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 10px",
        color: T.textPrimary, fontFamily: fontMono, fontSize: 12, outline: "none", boxSizing: "border-box",
      }} />
    </div>
  );

  return (
    <div style={{ padding: 20, overflowY: "auto", height: "100%", maxWidth: 640 }}>
      <div style={{ fontFamily: fontDisplay, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Connect & Sync</div>
      <div style={{ fontFamily: fontBody, fontSize: 12, color: T.textFaint, marginBottom: 4 }}>
        Reads portfolio.json + memory/*.json directly from your private repo, and can trigger your existing GitHub Actions
        workflows — no separate backend needed.
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", fontFamily: fontBody, fontSize: 11, color: T.textFaint, marginBottom: 16, padding: "8px 10px", background: `${T.accent}0f`, border: `1px solid ${T.accent}30`, borderRadius: 8 }}>
        <Lock size={12} color={T.accent} />
        Your token stays in this browser tab's memory only — never saved to disk, never sent anywhere except api.github.com.
        Use a fine-grained PAT scoped only to this one repo (Contents: Read/Write, Actions: Read/Write).
      </div>

      <Field label="REPO OWNER" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="manojkotha-220591" />
      <Field label="REPO NAME" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="stock-agent" />
      <Field label="PERSONAL ACCESS TOKEN" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="github_pat_…" />

      <button onClick={onConnect} disabled={connecting || !owner || !repo || !token} style={{
        display: "flex", alignItems: "center", gap: 8, background: connected ? `${T.buy}20` : T.accent,
        color: connected ? T.buy : "#04211c", border: "none", borderRadius: 8, padding: "9px 16px",
        fontFamily: fontBody, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: connecting ? 0.6 : 1,
      }}>
        {connecting ? <Loader2 size={14} className="spin" /> : connected ? <Check size={14} /> : <Github size={14} />}
        {connecting ? "Syncing…" : connected ? "Connected — Re-sync" : "Connect & Pull Data"}
      </button>

      {log.length > 0 && (
        <div style={{ marginTop: 14, fontFamily: fontMono, fontSize: 11, color: T.textMuted, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, maxHeight: 120, overflowY: "auto" }}>
          {log.map((l, i) => <div key={i} style={{ color: l.startsWith("✗") ? T.exit : l.startsWith("✓") ? T.buy : T.textMuted }}>{l}</div>)}
        </div>
      )}

      <div style={{ height: 1, background: T.border, margin: "24px 0" }} />

      <div style={{ fontFamily: fontDisplay, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Trigger Workflows</div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: fontBody, fontSize: 12, fontWeight: 600, color: T.textPrimary, marginBottom: 8 }}>Run today's full daily analysis now</div>
        <button onClick={() => onTrigger("daily_run.yml", {})} disabled={!connected || triggering} style={btnStyle(T.accent)}>
          <Radio size={13} /> Run Daily Analysis Now
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: fontBody, fontSize: 12, fontWeight: 600, color: T.textPrimary, marginBottom: 8 }}>Resend the most recent report email</div>
        <button onClick={() => onTrigger("resend_report.yml", { date: "" })} disabled={!connected || triggering} style={btnStyle(T.accent)}>
          <Mail size={13} /> Resend Latest Report
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: fontBody, fontSize: 12, fontWeight: 600, color: T.textPrimary, marginBottom: 8 }}>Add stock & instantly analyze</div>
        <Field label="SYMBOL" value={addForm.symbol} onChange={(e) => setAddForm({ ...addForm, symbol: e.target.value })} />
        <Field label="BSE CODE" value={addForm.bse_code} onChange={(e) => setAddForm({ ...addForm, bse_code: e.target.value })} />
        <Field label="COMPANY NAME" value={addForm.company_name} onChange={(e) => setAddForm({ ...addForm, company_name: e.target.value })} />
        <Field label="SECTOR" value={addForm.sector} onChange={(e) => setAddForm({ ...addForm, sector: e.target.value })} />
        <Field label="QTY (0 = watchlist)" value={addForm.qty} onChange={(e) => setAddForm({ ...addForm, qty: e.target.value })} />
        <button onClick={() => onTrigger("add_stock.yml", addForm)} disabled={!connected || triggering || !addForm.symbol} style={btnStyle(T.buy)}>
          <PlusCircle size={13} /> Add & Analyze
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: fontBody, fontSize: 12, fontWeight: 600, color: T.textPrimary, marginBottom: 8 }}>Research a stock (not added to portfolio)</div>
        <Field label="SYMBOL" value={researchForm.symbol} onChange={(e) => setResearchForm({ ...researchForm, symbol: e.target.value })} />
        <Field label="BSE CODE" value={researchForm.bse_code} onChange={(e) => setResearchForm({ ...researchForm, bse_code: e.target.value })} />
        <Field label="COMPANY NAME" value={researchForm.company_name} onChange={(e) => setResearchForm({ ...researchForm, company_name: e.target.value })} />
        <Field label="SECTOR" value={researchForm.sector} onChange={(e) => setResearchForm({ ...researchForm, sector: e.target.value })} />
        <button onClick={() => onTrigger("research_stock.yml", researchForm)} disabled={!connected || triggering || !researchForm.symbol} style={btnStyle(T.accent)}>
          <SearchCode size={13} /> Research Only
        </button>
      </div>

      <div>
        <div style={{ fontFamily: fontBody, fontSize: 12, fontWeight: 600, color: T.textPrimary, marginBottom: 8 }}>Remove a stock from tracking</div>
        <Field label="SYMBOL" value={removeSymbol} onChange={(e) => setRemoveSymbol(e.target.value)} />
        <button onClick={() => onTrigger("remove_stock.yml", { symbol: removeSymbol, delete_memory: "false" })} disabled={!connected || triggering || !removeSymbol} style={btnStyle(T.exit)}>
          <Trash2 size={13} /> Remove Stock
        </button>
      </div>
    </div>
  );
}

function btnStyle(color) {
  return {
    display: "flex", alignItems: "center", gap: 7, background: `${color}18`, color, border: `1px solid ${color}40`,
    borderRadius: 7, padding: "8px 14px", fontFamily: fontBody, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
  };
}

function ComposePanel({ stocks }) {
  const [selectedSymbols, setSelectedSymbols] = useState(() => new Set(stocks.map((s) => s.symbol)));
  const [copied, setCopied] = useState(false);

  useEffect(() => { setSelectedSymbols(new Set(stocks.map((s) => s.symbol))); }, [stocks]);

  const included = stocks.filter((s) => selectedSymbols.has(s.symbol));
  const html = useMemo(() => buildReportHtml(included, { date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) }), [included]);

  const toggle = (sym) => {
    const next = new Set(selectedSymbols);
    next.has(sym) ? next.delete(sym) : next.add(sym);
    setSelectedSymbols(next);
  };

  const download = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `portfolio-report-${new Date().toISOString().slice(0, 10)}.html`;
    a.click(); URL.revokeObjectURL(url);
  };

  const copyHtml = async () => {
    try { await navigator.clipboard.writeText(html); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch (e) {}
  };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ width: 260, borderRight: `1px solid ${T.border}`, padding: 16, overflowY: "auto" }}>
        <div style={{ fontFamily: fontDisplay, fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Include in report</div>
        {stocks.map((s) => (
          <label key={s.symbol} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontFamily: fontMono, fontSize: 12, color: T.textMuted, cursor: "pointer" }}>
            <input type="checkbox" checked={selectedSymbols.has(s.symbol)} onChange={() => toggle(s.symbol)} />
            {s.symbol}
          </label>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontFamily: fontBody, fontSize: 12, color: T.textFaint, marginRight: "auto" }}>{included.length} stock{included.length !== 1 ? "s" : ""} in this report</span>
          <button onClick={copyHtml} style={btnStyle(T.accent)}><Copy size={13} /> {copied ? "Copied!" : "Copy HTML"}</button>
          <button onClick={download} style={btnStyle(T.buy)}><Download size={13} /> Download .html</button>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <iframe title="report-preview" srcDoc={html} style={{ width: "100%", height: "100%", border: "none" }} />
        </div>
        <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.border}`, fontFamily: fontBody, fontSize: 11, color: T.textFaint }}>
          To actually send email, use <strong>Connect &amp; Sync → Resend Latest Report</strong> (delivers via your
          configured Gmail account through the real backend) — sending real email requires SMTP credentials that stay
          server-side in GitHub Secrets for security and can't run from a browser tab.
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main App                                                             */
/* ------------------------------------------------------------------ */
export default function StockAgentDashboard() {
  const [tab, setTab] = useState("blotter");
  const [stocks, setStocks] = useState(SAMPLE_STOCKS);
  const [usingSample, setUsingSample] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState("action");
  const [sortDir, setSortDir] = useState("asc");

  const [owner, setOwner] = useState("manojkotha-220591");
  const [repo, setRepo] = useState("stock-agent");
  const [token, setToken] = useState("");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [log, setLog] = useState([]);

  const pushLog = (msg) => setLog((l) => [...l.slice(-6), msg]);

  const handleSort = (key) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    setLog([]);
    try {
      pushLog("→ Fetching portfolio.json…");
      const portfolio = await fetchJsonFile(owner, repo, token, "portfolio.json");
      const raw = [...(portfolio.holdings || []), ...(portfolio.watchlist || [])].filter((s) => s.symbol !== "EXAMPLE");
      pushLog(`✓ Loaded ${raw.length} portfolio entries`);

      pushLog("→ Listing memory/ files…");
      let memFiles = [];
      try { memFiles = await listDir(owner, repo, token, "memory"); } catch { memFiles = []; }
      pushLog(`✓ Found ${memFiles.length} memory files`);

      const merged = [];
      for (const entry of raw) {
        let mem = null;
        const match = memFiles.find((f) => f.name === `${entry.symbol}.json`);
        if (match) {
          try { mem = await fetchJsonFile(owner, repo, token, `memory/${entry.symbol}.json`); } catch {}
        }
        const analyses = mem?.analyses || [];
        const latest = analyses[analyses.length - 1];
        merged.push({
          symbol: entry.symbol, name: entry.name, sector: entry.sector, qty: entry.qty,
          action: latest?.action || "HOLD",
          score: latest?.multibagger_score ?? 5,
          sentiment: latest?.sentiment || (analyses.length ? "NEUTRAL" : "NEUTRAL"),
          horizon: latest?.time_horizon || "MEDIUM",
          summary: latest?.summary || "No analysis recorded yet for this stock.",
          risks: latest?.hidden_risks || [],
          opportunities: latest?.hidden_opportunities || [],
          signals: latest?.signals || [],
          trigger: latest?.key_trigger || "",
          history: analyses.slice(-14).map((a) => ({ date: a.date?.slice(5) || "", score: a.multibagger_score ?? 5 })),
        });
      }
      setStocks(merged);
      setUsingSample(false);
      setConnected(true);
      pushLog(`✓ Synced ${merged.length} stocks from ${owner}/${repo}`);
    } catch (e) {
      pushLog(`✗ ${e.message}`);
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  }, [owner, repo, token]);

  const handleTrigger = useCallback(async (workflowFile, inputs) => {
    setTriggering(true);
    try {
      await triggerWorkflow(owner, repo, token, workflowFile, inputs);
      pushLog(`✓ Triggered ${workflowFile}`);
    } catch (e) {
      pushLog(`✗ ${workflowFile}: ${e.message}`);
    } finally {
      setTriggering(false);
    }
  }, [owner, repo, token]);

  return (
    <div style={{ background: T.bg, color: T.textPrimary, height: "100vh", display: "flex", flexDirection: "column", fontFamily: fontBody }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus { border-color: ${T.accent} !important; }
        @media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
      `}</style>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7, background: `linear-gradient(135deg, ${T.accent}, ${T.accentDim})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fontDisplay, fontWeight: 700, fontSize: 13, color: "#04211c",
          }}>SA</div>
          <div>
            <div style={{ fontFamily: fontDisplay, fontSize: 15, fontWeight: 600, lineHeight: 1.1 }}>StockAgent</div>
            <div style={{ fontFamily: fontBody, fontSize: 10, color: T.textFaint, letterSpacing: 0.5 }}>COMMAND CENTER</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginLeft: 12 }}>
          {[["blotter", "Blotter"], ["connect", "Connect & Sync"], ["compose", "Compose Report"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              background: tab === id ? T.surfaceRaised : "transparent", color: tab === id ? T.textPrimary : T.textMuted,
              border: "none", borderRadius: 7, padding: "7px 14px", fontFamily: fontBody, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
            }}>{label}</button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: connected ? T.buy : T.textFaint }} />
          <span style={{ fontFamily: fontMono, fontSize: 11, color: T.textFaint }}>
            {connected ? `${owner}/${repo}` : usingSample ? "Sample data" : "Not connected"}
          </span>
        </div>
      </div>

      <KpiStrip stocks={stocks} />

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {tab === "blotter" && (
          <>
            <div style={{ flex: "1 1 60%", borderRight: `1px solid ${T.border}`, minWidth: 0 }}>
              <Blotter
                stocks={stocks} selected={selected} onSelect={setSelected}
                search={search} setSearch={setSearch}
                actionFilter={actionFilter} setActionFilter={setActionFilter}
                sortKey={sortKey} sortDir={sortDir} onSort={handleSort}
              />
            </div>
            <div style={{ flex: "1 1 40%", minWidth: 320, background: T.surface }}>
              {selected ? <StockDossier stock={selected} onClose={() => setSelected(null)} /> : <PortfolioPulse stocks={stocks} />}
            </div>
          </>
        )}
        {tab === "connect" && (
          <ConnectPanel
            owner={owner} setOwner={setOwner} repo={repo} setRepo={setRepo} token={token} setToken={setToken}
            connected={connected} connecting={connecting} log={log} onConnect={handleConnect}
            onTrigger={handleTrigger} triggering={triggering}
          />
        )}
        {tab === "compose" && <ComposePanel stocks={stocks} />}
      </div>
    </div>
  );
}
