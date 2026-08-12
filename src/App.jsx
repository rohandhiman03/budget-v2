import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const INCOME = 4764;
const FIXED_TOTAL = 1614;
const VAR_BUDGET = 1150;
const SAVINGS_GOAL = 2000;

const FIXED = [
  { id: "rent", name: "Rent", amount: 855, icon: "🏠" },
  { id: "ozempic", name: "Ozempic", amount: 150, icon: "💊" },
  { id: "pari_laptop", name: "Pari Laptop", amount: 95, icon: "💻" },
  { id: "chatgpt", name: "ChatGPT", amount: 65, icon: "🤖" },
  { id: "pari_phone", name: "Pari Phone", amount: 81, icon: "📱" },
  { id: "tiffin", name: "Tiffin", amount: 115, icon: "🍱" },
  { id: "car", name: "Car", amount: 108, icon: "🚗" },
  { id: "internet", name: "Internet", amount: 63, icon: "📶" },
  { id: "phone", name: "Phone", amount: 52, icon: "📞" },
  { id: "hydro", name: "Hydro", amount: 30, icon: "⚡" },
];

const CATS = [
  { id: "groceries", name: "Groceries", budget: 250, icon: "🛒", color: "#E8A020" },
  { id: "dining", name: "Dining & Coffee", budget: 180, icon: "☕", color: "#F59E0B" },
  { id: "entertainment", name: "Entertainment", budget: 120, icon: "🎬", color: "#34D399" },
  { id: "personal", name: "Personal Care", budget: 80, icon: "🧴", color: "#60A5FA" },
  { id: "shopping", name: "Shopping", budget: 120, icon: "🛍️", color: "#A78BFA" },
  { id: "occasions", name: "Occasions & Gifts", budget: 150, icon: "🎁", color: "#F87171" },
  { id: "misc", name: "Misc Buffer", budget: 250, icon: "🌀", color: "#94A3B8" },
];

const C = {
  bg: "#0A0F1E", surface: "#111827", surface2: "#1A2235", border: "#1F2D45",
  gold: "#F0A500", green: "#34D399", red: "#F87171", blue: "#60A5FA",
  purple: "#A78BFA", text: "#F1F5F9", sec: "#94A3B8", muted: "#374151",
};

const fmt = (n) => `$${Math.abs(n).toFixed(2)}`;
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
const DAY = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const getMonthProgress = () => {
  const now = new Date();
  const d = now.getDate();
  const lastDay = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  return { day: d, total: lastDay, progress: (d-1)/(lastDay-1), daysLeft: lastDay-d };
};

const lsGet = (key) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } };
const lsSet = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

const Card = ({ children, style = {} }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16, ...style }}>
    {children}
  </div>
);

const Lbl = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: C.sec, marginBottom: 10 }}>
    {children}
  </div>
);

function ExpRow({ exp, onDelete }) {
  const cat = CATS.find((c) => c.id === exp.category) || { icon: "💸", name: exp.category, color: C.gold };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.border}30` }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.color+"20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
        {cat.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat.name}</div>
        <div style={{ fontSize: 11, color: C.sec }}>{exp.note || "—"} · {exp.date.slice(5).replace("-","/")} </div>
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: C.red }}>−{fmt(exp.amount)}</span>
      <button onClick={() => onDelete(exp.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 14, padding: "2px 6px" }}>✕</button>
    </div>
  );
}

function CatBar({ cat, spent }) {
  const pct = Math.min(spent/cat.budget, 1);
  const over = spent > cat.budget;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 14 }}>{cat.icon}</span>
          <span style={{ fontSize: 13, color: C.text }}>{cat.name}</span>
        </div>
        <span style={{ fontSize: 11 }}>
          <span style={{ color: over ? C.red : C.text, fontWeight: 600 }}>{fmt(spent)}</span>
          <span style={{ color: C.muted }}> / {fmt(cat.budget)}</span>
        </span>
      </div>
      <div style={{ background: C.muted+"50", borderRadius: 100, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${pct*100}%`, height: "100%", background: over ? C.red : cat.color, borderRadius: 100, transition: "width 0.4s ease" }} />
      </div>
      {over && <div style={{ fontSize: 10, color: C.red, marginTop: 3 }}>${(spent-cat.budget).toFixed(2)} over budget ⚠</div>}
    </div>
  );
}

function Overview({ monthExps, catSpent, totalSpent, monthProgress, savings, setSavings }) {
  const now = new Date();
  const todaySpent = monthExps.filter((e) => e.date === todayKey()).reduce((s,e) => s+e.amount, 0);
  const remaining = VAR_BUDGET - totalSpent;
  const projected = now.getDate() > 0 ? (totalSpent/now.getDate())*monthProgress.total : 0;
  const onTrack = projected <= VAR_BUDGET;
  const savedTotal = (savings.p1 ? 1000 : 0) + (savings.p2 ? 1000 : 0);
  const mo = now.toLocaleDateString("en-CA", { month: "short" });

  return (
    <div>
      {/* Hero */}
      <Card style={{ marginBottom: 12, background: `linear-gradient(135deg, #111827, ${remaining >= 0 ? "#0C1F14" : "#1F0C0C"})` }}>
        <div style={{ fontSize: 10, color: C.sec, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>Variable Budget Remaining</div>
        <div style={{ fontSize: 46, fontWeight: 900, color: remaining >= 0 ? C.green : C.red, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "6px 0 4px" }}>
          {remaining >= 0 ? fmt(remaining) : `−${fmt(Math.abs(remaining))}`}
        </div>
        <div style={{ fontSize: 12, color: C.sec }}>Spent {fmt(totalSpent)} of {fmt(VAR_BUDGET)} · {monthProgress.daysLeft} days left</div>
        <div style={{ background: C.muted+"40", borderRadius: 100, height: 8, marginTop: 12, overflow: "hidden" }}>
          <div style={{ width: `${Math.min(totalSpent/VAR_BUDGET*100,100)}%`, height: "100%", background: remaining >= 0 ? `linear-gradient(90deg,${C.green},#6EE7B7)` : `linear-gradient(90deg,${C.red},#FCA5A5)`, borderRadius: 100 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 10 }}>
          <span style={{ color: C.muted }}>Day {monthProgress.day}/{monthProgress.total}</span>
          <span style={{ color: onTrack ? C.green : C.red }}>{onTrack ? "↑ On track" : "↓ Over pace"} · proj. {fmt(projected)}</span>
        </div>
      </Card>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Today", value: fmt(todaySpent), color: todaySpent > 0 ? C.gold : C.sec },
          { label: "Saved", value: fmt(savedTotal), color: savedTotal >= SAVINGS_GOAL ? C.green : C.gold },
          { label: "Days Left", value: `${monthProgress.daysLeft}d`, color: C.blue },
        ].map((m) => (
          <Card key={m.label} style={{ padding: 10, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: C.sec, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.value}</div>
          </Card>
        ))}
      </div>

      {/* Month progress */}
      <Card style={{ marginBottom: 12 }}>
        <Lbl>Month Progress · {now.toLocaleDateString("en-CA",{month:"long", year:"numeric"})}</Lbl>
        <div style={{ background: C.muted+"40", borderRadius: 100, height: 6, marginBottom: 8, overflow: "hidden" }}>
          <div style={{ width: `${monthProgress.progress*100}%`, height: "100%", background: C.gold, borderRadius: 100 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span style={{ color: C.sec }}>Day {monthProgress.day} of {monthProgress.total}</span>
          <span style={{ color: C.gold, fontWeight: 600 }}>{monthProgress.daysLeft} days remaining</span>
        </div>
      </Card>

      {/* Savings tracker */}
      <Card style={{ marginBottom: 12, border: `1px solid ${C.green}30` }}>
        <Lbl>Savings Tracker · Goal: {fmt(SAVINGS_GOAL)}/mo</Lbl>
        {[
          { key: "p1", label: `15th — ${mo} 15` },
          { key: "p2", label: `30th — ${mo} 30` },
        ].map((item) => (
          <button key={item.key}
            onClick={() => setSavings((s) => ({ ...s, [item.key]: !s[item.key] }))}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", marginBottom: 8, background: savings[item.key] ? C.green+"18" : C.surface2, border: `1.5px solid ${savings[item.key] ? C.green : C.border}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, background: savings[item.key] ? C.green : "transparent", border: `2px solid ${savings[item.key] ? C.green : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {savings[item.key] && <span style={{ color: "#000", fontSize: 11, fontWeight: 700 }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: C.text, fontWeight: savings[item.key] ? 600 : 400 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: C.sec }}>$1,000 → Savings</div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: savings[item.key] ? C.green : C.sec }}>$1,000.00</span>
          </button>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0", borderTop: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 12, color: C.sec }}>Total saved this month</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: savedTotal >= SAVINGS_GOAL ? C.green : C.gold }}>{fmt(savedTotal)}</span>
        </div>
        <div style={{ marginTop: 8, background: C.muted+"40", borderRadius: 100, height: 5, overflow: "hidden" }}>
          <div style={{ width: `${Math.min(savedTotal/SAVINGS_GOAL*100,100)}%`, height: "100%", background: `linear-gradient(90deg,${C.green},#6EE7B7)`, borderRadius: 100 }} />
        </div>
      </Card>

      {/* Variable bars */}
      <Card style={{ marginBottom: 12 }}>
        <Lbl>Variable Spending — {fmt(totalSpent)} / {fmt(VAR_BUDGET)}</Lbl>
        {CATS.map((cat) => <CatBar key={cat.id} cat={cat} spent={catSpent[cat.id]||0} />)}
      </Card>

      {/* Allocation */}
      <Card style={{ marginBottom: 12 }}>
        <Lbl>Monthly Allocation · {fmt(INCOME)}</Lbl>
        {[
          { label: "🔒 Fixed", amount: FIXED_TOTAL, color: C.blue },
          { label: "🎯 Savings", amount: SAVINGS_GOAL, color: C.green },
          { label: "🔄 Variable", amount: VAR_BUDGET, color: C.gold },
        ].map((r) => (
          <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${C.border}20` }}>
            <span style={{ fontSize: 12, color: C.sec, minWidth: 120 }}>{r.label}</span>
            <div style={{ flex: 1, background: C.muted+"40", borderRadius: 100, height: 5, overflow: "hidden" }}>
              <div style={{ width: `${(r.amount/INCOME)*100}%`, height: "100%", background: r.color, borderRadius: 100 }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text, minWidth: 56, textAlign: "right" }}>{fmt(r.amount)}</span>
          </div>
        ))}
      </Card>

      {/* Fixed */}
      <Card style={{ marginBottom: 12 }}>
        <Lbl>Fixed Expenses · {fmt(FIXED_TOTAL)}/mo</Lbl>
        {FIXED.map((f) => (
          <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}20` }}>
            <span style={{ fontSize: 12, color: C.sec }}>{f.icon} {f.name}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{fmt(f.amount)}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function Log({ form, setForm, onSubmit, msg, recent, onDelete }) {
  return (
    <div>
      <Card style={{ marginBottom: 12 }}>
        <Lbl>Select Category</Lbl>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7, marginBottom: 16 }}>
          {CATS.map((cat) => (
            <button key={cat.id} onClick={() => setForm((f) => ({ ...f, category: cat.id }))}
              style={{ background: form.category === cat.id ? cat.color+"28" : C.surface2, border: `1.5px solid ${form.category === cat.id ? cat.color : C.border}`, borderRadius: 12, padding: "8px 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 18 }}>{cat.icon}</span>
              <span style={{ fontSize: 9, color: form.category === cat.id ? cat.color : C.sec, fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>{cat.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        <Lbl>Amount ($)</Lbl>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 20, color: C.gold, fontWeight: 800 }}>$</span>
          <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            style={{ width: "100%", boxSizing: "border-box", background: C.surface2, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 14px 12px 36px", fontSize: 24, fontWeight: 800, color: C.text, outline: "none" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div>
            <Lbl>Date</Lbl>
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              style={{ width: "100%", boxSizing: "border-box", background: C.surface2, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "10px 12px", fontSize: 13, color: C.text, outline: "none" }} />
          </div>
          <div>
            <Lbl>Note (optional)</Lbl>
            <input type="text" placeholder="Costco, dinner…" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              style={{ width: "100%", boxSizing: "border-box", background: C.surface2, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "10px 12px", fontSize: 13, color: C.text, outline: "none" }} />
          </div>
        </div>

        <button onClick={onSubmit}
          style={{ width: "100%", padding: "14px", background: msg ? C.green : C.gold, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, color: "#000", cursor: "pointer" }}>
          {msg || "+ Log Expense"}
        </button>
      </Card>

      {recent.length > 0 && (
        <Card>
          <Lbl>Recent Expenses</Lbl>
          {recent.map((e) => <ExpRow key={e.id} exp={e} onDelete={onDelete} />)}
        </Card>
      )}
    </div>
  );
}

function History({ allExps, onDelete }) {
  const [month, setMonth] = useState(monthKey());
  const exps = allExps.filter((e) => e.date.startsWith(month)).sort((a,b) => b.date.localeCompare(a.date));
  const total = exps.reduce((s,e) => s+e.amount, 0);
  const grouped = {};
  exps.forEach((e) => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e); });
  const dates = Object.keys(grouped).sort().reverse();
  const nav = (dir) => { const d = new Date(month+"-15"); d.setMonth(d.getMonth()+dir); setMonth(monthKey(d)); };
  const monthLabel = new Date(month+"-15").toLocaleDateString("en-CA", { month: "long", year: "numeric" });

  return (
    <div>
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => nav(-1)} style={{ background: "none", border: "none", color: C.sec, cursor: "pointer", fontSize: 22, padding: "4px 8px" }}>‹</button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{monthLabel}</div>
            {total > 0 && <div style={{ fontSize: 11, color: C.red, marginTop: 2 }}>Total: {fmt(total)} spent</div>}
          </div>
          <button onClick={() => nav(1)} style={{ background: "none", border: "none", color: C.sec, cursor: "pointer", fontSize: 22, padding: "4px 8px" }}>›</button>
        </div>
      </Card>
      {dates.length === 0 ? (
        <Card><div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}><div style={{ fontSize: 36, marginBottom: 10 }}>📭</div><div style={{ fontSize: 13 }}>No expenses in {monthLabel}</div></div></Card>
      ) : dates.map((date) => {
        const dayTotal = grouped[date].reduce((s,e) => s+e.amount, 0);
        const d = new Date(date+"T12:00:00");
        return (
          <div key={date} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px", marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.sec }}>{DAY[d.getDay()]} · {date.slice(5).replace("-","/")} </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.red }}>−{fmt(dayTotal)}</span>
            </div>
            <Card style={{ padding: "0 14px" }}>
              {grouped[date].map((e) => <ExpRow key={e.id} exp={e} onDelete={onDelete} />)}
            </Card>
          </div>
        );
      })}
    </div>
  );
}

function Analytics({ catSpent, monthExps, totalSpent }) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const avgDaily = now.getDate() > 0 ? totalSpent/now.getDate() : 0;
  const budgetPerDay = VAR_BUDGET/daysInMonth;
  const pieData = CATS.filter((c) => (catSpent[c.id]||0) > 0).map((c) => ({ name: c.name, value: catSpent[c.id], color: c.color }));
  const dailyData = Array.from({ length: now.getDate() }, (_,i) => {
    const day = i+1;
    const ds = `${monthKey()}-${String(day).padStart(2,"0")}`;
    return { day: String(day), amt: monthExps.filter((e) => e.date === ds).reduce((s,e) => s+e.amount, 0) };
  });

  const TT = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 11px", fontSize: 12, color: C.text }}>{d.name ? d.name : `Day ${d.day}`}: <strong>{fmt(payload[0].value ?? d.amt)}</strong></div>;
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Avg Daily", value: fmt(avgDaily), color: avgDaily <= budgetPerDay ? C.green : C.red, sub: `${fmt(budgetPerDay)}/day` },
          { label: "Transactions", value: monthExps.length, color: C.gold, sub: "this month" },
          { label: "Daily Budget", value: fmt(budgetPerDay), color: C.blue, sub: "per day" },
        ].map((m) => (
          <Card key={m.label} style={{ padding: 10, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: C.sec, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{m.sub}</div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 12 }}>
        <Lbl>Daily Spending · {now.toLocaleDateString("en-CA",{month:"long"})}</Lbl>
        {dailyData.some((d) => d.amt > 0) ? (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={dailyData} margin={{ top: 5, right: 0, left: -28, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: C.sec }} interval={Math.floor(now.getDate()/8)} />
              <YAxis tick={{ fontSize: 9, fill: C.sec }} />
              <Tooltip content={<TT />} />
              <Bar dataKey="amt" fill={C.gold} radius={[3,3,0,0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: "center", padding: "28px 0", color: C.muted, fontSize: 12 }}>Log expenses to see your daily chart</div>
        )}
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Lbl>Spending by Category</Lbl>
        {pieData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={170}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={3} dataKey="value">
                  {pieData.map((e,i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<TT />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginTop: 4 }}>
              {pieData.map((d) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                  <span style={{ color: C.sec, flex: 1 }}>{d.name}</span>
                  <span style={{ color: C.text, fontWeight: 600 }}>{fmt(d.value)}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "28px 0", color: C.muted, fontSize: 12 }}>Log expenses to see your breakdown</div>
        )}
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Lbl>Budget Usage by Category</Lbl>
        {CATS.map((cat) => {
          const spent = catSpent[cat.id]||0;
          const pct = Math.min(spent/cat.budget*100, 100);
          const over = spent > cat.budget;
          return (
            <div key={cat.id} style={{ marginBottom: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.sec, marginBottom: 3 }}>
                <span>{cat.icon} {cat.name}</span>
                <span style={{ color: over ? C.red : C.sec }}>{Math.round(pct)}%{over ? " ⚠" : ""}</span>
              </div>
              <div style={{ background: C.muted+"40", borderRadius: 100, height: 5, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: over ? C.red : cat.color, borderRadius: 100 }} />
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("overview");
  const [expenses, setExpenses] = useState([]);
  const [savings, setSavings] = useState({ p1: false, p2: false });
  const [form, setForm] = useState({ category: "groceries", amount: "", date: todayKey(), note: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const exps = lsGet("budgetv2_expenses");
    if (exps) setExpenses(exps);
    const savs = lsGet(`budgetv2_savings_${monthKey()}`);
    if (savs) setSavings(savs);
  }, []);

  const saveExps = (updated) => {
    setExpenses(updated);
    lsSet("budgetv2_expenses", updated);
  };

  const handleSetSavings = (fn) => {
    const updated = typeof fn === "function" ? fn(savings) : fn;
    setSavings(updated);
    lsSet(`budgetv2_savings_${monthKey()}`, updated);
  };

  const addExpense = () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return;
    const e = { id: Date.now().toString(), category: form.category, amount: amt, date: form.date, note: form.note.trim() };
    saveExps([e, ...expenses]);
    setForm((f) => ({ ...f, amount: "", note: "" }));
    setMsg("Logged ✓");
    setTimeout(() => setMsg(""), 2000);
  };

  const deleteExpense = (id) => saveExps(expenses.filter((e) => e.id !== id));

  const thisMonth = monthKey();
  const monthExps = useMemo(() => expenses.filter((e) => e.date.startsWith(thisMonth)), [expenses, thisMonth]);
  const catSpent = useMemo(() => {
    const m = {}; CATS.forEach((c) => m[c.id] = 0);
    monthExps.forEach((e) => { if (m[e.category] !== undefined) m[e.category] += e.amount; });
    return m;
  }, [monthExps]);
  const totalSpent = useMemo(() => monthExps.reduce((s,e) => s+e.amount, 0), [monthExps]);
  const monthProgress = getMonthProgress();

  const TABS = [
    { id: "overview", icon: "◉", label: "Overview" },
    { id: "log", icon: "＋", label: "Log" },
    { id: "history", icon: "≡", label: "History" },
    { id: "analytics", icon: "↗", label: "Charts" },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Inter, system-ui, -apple-system, sans-serif", color: C.text, maxWidth: 500, margin: "0 auto" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: C.bg+"F5", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}`, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>
            {new Date().toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: C.text }}>
            My Budget <span style={{ color: C.gold }}>◈</span>
          </div>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "5px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Remaining</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: VAR_BUDGET - totalSpent >= 0 ? C.green : C.red }}>{fmt(VAR_BUDGET - totalSpent)}</div>
          <div style={{ fontSize: 9, color: C.sec }}>of {fmt(VAR_BUDGET)}</div>
        </div>
      </div>

      <div style={{ padding: "14px 14px 90px" }}>
        {tab === "overview" && <Overview monthExps={monthExps} catSpent={catSpent} totalSpent={totalSpent} monthProgress={monthProgress} savings={savings} setSavings={handleSetSavings} />}
        {tab === "log" && <Log form={form} setForm={setForm} onSubmit={addExpense} msg={msg} recent={expenses.slice(0,8)} onDelete={deleteExpense} />}
        {tab === "history" && <History allExps={expenses} onDelete={deleteExpense} />}
        {tab === "analytics" && <Analytics catSpent={catSpent} monthExps={monthExps} totalSpent={totalSpent} />}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 500, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "9px 0 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: tab === t.id ? C.gold : C.muted }}>
            <span style={{ fontSize: t.id === "log" ? 18 : 14, lineHeight: 1 }}>{t.icon}</span>
            <span style={{ fontSize: 9, fontWeight: tab === t.id ? 700 : 400, letterSpacing: "0.05em" }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
