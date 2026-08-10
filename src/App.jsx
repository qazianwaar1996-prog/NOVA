import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutGrid, Users, ClipboardList, ListTodo, Hexagon, Database, ChartColumn, Workflow,
  Settings, Network, Activity, Bell, Atom, Power, ChevronRight, CodeXml, Bug, Box,
  Infinity as InfinityIcon, ShieldCheck, PenLine, PenTool, ClipboardCheck, Target, Gauge,
  Mic, Crosshair, TriangleAlert, CircleX, Aperture, Globe, Rocket, Search, FileText,
  X, Zap, Check, Asterisk, Send,
} from 'lucide-react';
import { MAP_DOTS } from './dots.js';
import {
  STATS, NAV, SYS_STATUS, AGENTS_LEFT, AGENTS_RIGHT, FEED, APIS, PERF,
  PROJECTS, TASKS, CONSOLE_LINES, CMD_CHIPS, HUBS, ARCS,
} from './data.js';

const ICONS = {
  'layout-grid': LayoutGrid, 'users': Users, 'clipboard-list': ClipboardList, 'list-todo': ListTodo,
  'hexagon': Hexagon, 'database': Database, 'chart-column': ChartColumn, 'workflow': Workflow,
  'settings': Settings, 'network': Network, 'activity': Activity, 'bell': Bell, 'atom': Atom,
  'code-xml': CodeXml, 'bug': Bug, 'box': Box, 'infinity': InfinityIcon, 'shield-check': ShieldCheck,
  'pen-line': PenLine, 'pen-tool': PenTool, 'clipboard-check': ClipboardCheck, 'target': Target,
  'gauge': Gauge, 'globe': Globe, 'rocket': Rocket, 'search': Search, 'file-text': FileText,
};
const Ic = ({ name, size = 14, ...p }) => { const C = ICONS[name] || Box; return <C size={size} strokeWidth={1.6} {...p} />; };

/* ═══════════════ NOVA AI SYSTEM ═══════════════ */
const SYSTEM_PROMPT = `You are NOVA (Neural Operations & Virtual Assistant) — the personal AI chief of staff for Anwaar, a digital entrepreneur based in Pakistan building multiple web platforms from a smartphone.

Personality: calm, precise, proactive, like JARVIS from Iron Man. Confident, action-oriented. Call Anwaar by name occasionally. Short sharp sentences. Deliver results.

Platforms:
1. SCHOLARICS (scholarics.com) — Academic tools, GPA Simulator, study guides, Cloudflare Pages, AdSense, target: students
2. ROOTED — Parenting platform, React+Vite+FastAPI+PostgreSQL, Railway+Supabase, target: USA/UK/Canada/Australia

AGENT ROUTING — start response with [AGENT] ACTIVATED:
SEO AGENT: "seo","audit","meta","keyword","schema","ranking" → meta title(60), description(155), og tags, JSON-LD schema, 5 keywords, internal links, quick wins
CONTENT AGENT: "blog","article","write","guide","content" → full SEO article H1/H2s/intro/body/CTA
SOCIAL AGENT: "instagram","twitter","linkedin","pinterest","social" → IG caption+hashtags, Twitter thread, Pinterest, LinkedIn, Facebook
YOUTUBE AGENT: "youtube","script","video","shorts","hook" → dramatic hook(NOT a question), full script, 3 titles, description, 15 tags, thumbnail text
EMAIL AGENT: "email","reply","draft" → 3-bullet summary, draft reply, action items
ANALYTICS AGENT: "analytics","traffic","adsense","stats","report" → wins, concerns, 3 actions, AdSense tip
MONITOR AGENT: "uptime","deploy","github","error","broken" → diagnose, Termux fix steps
IDEAS AGENT: "idea","feature","suggest" → market fit, implementation, monetization
MARKETS AGENT: "us","uk","australia","canada","localize" → regional adaptation
MONETIZE AGENT: "monetize","revenue","affiliate","earn","rpm" → AdSense placement, affiliate angles, RPM

End complex outputs with: "Anything else on this, Anwaar?"`;

function detectAgent(t) {
  t = (t || '').toLowerCase();
  if (/(seo|audit|meta|keyword|schema|ranking)/.test(t)) return 'SEO AGENT';
  if (/(blog|article|write|guide|content for)/.test(t)) return 'CONTENT';
  if (/(instagram|twitter|linkedin|pinterest|social)/.test(t)) return 'SOCIAL';
  if (/(youtube|script|video|shorts|hook|thumbnail)/.test(t)) return 'YOUTUBE';
  if (/(email|reply|draft reply)/.test(t)) return 'EMAIL';
  if (/(analytics|traffic|adsense|stats|report)/.test(t)) return 'ANALYTICS';
  if (/(uptime|deploy|github|error|broken)/.test(t)) return 'MONITOR';
  if (/(idea|feature|suggest)/.test(t)) return 'IDEAS';
  if (/(us market|uk |australia|canada|localize)/.test(t)) return 'MARKETS';
  if (/(monetize|revenue|affiliate|earn|rpm)/.test(t)) return 'MONETIZE';
  return 'NOVA';
}

// Global message history for context
const novaHistory = [];

async function sendToNOVA(userCmd) {
  novaHistory.push({ role: 'user', content: userCmd });
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: novaHistory.slice(-10),
    }),
  });
  const data = await res.json();
  const reply = data.content?.map((c) => c.text || '').join('') || 'Signal lost. Retry.';
  novaHistory.push({ role: 'assistant', content: reply });
  return reply;
}

/* ═══════════════ COMMAND CONSOLE LOG BUS ═══════════════ */
// Global, append-only ring of console lines. Other components push to it
// (e.g. CommandBar on each command) and the ConsolePanel subscribes via
// the useNovaConsole hook to re-render in real time. Capped at MAX lines.
const MAX_CONSOLE = 50;
const CONSOLE_TAG_COLORS = {
  SYSTEM:  '#ff9a26', // orange
  ROUTER:  '#ffb443', // amber
  AGENT:   '#ffc24d', // bright orange
  NOVA:    '#35e08a', // green
  UPLINK:  '#5ac8ff', // cyan/blue
  ERROR:   '#ff6a4a', // red
  MISSION: '#9fe8c4',
  AI:      '#6aa8ff',
  SECURITY:'#35e08a',
  NETWORK: '#9a7bff',
  DATABASE:'#5ac8ff',
};
let _console = [...CONSOLE_LINES];
const _consoleSubs = new Set();
const _emitConsole = () => _consoleSubs.forEach((fn) => fn(_console));
const _tsConsole = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};
const pushConsole = (tag, text, opts = {}) => {
  const color = opts.color || CONSOLE_TAG_COLORS[tag] || '#cfa875';
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    t: opts.t || _tsConsole(),
    tag,
    color,
    text,
  };
  _console = [..._console, entry].slice(-MAX_CONSOLE);
  _emitConsole();
  return entry;
};
function useNovaConsole() {
  const [items, setItems] = useState(_console);
  useEffect(() => {
    const sub = (next) => setItems(next);
    _consoleSubs.add(sub);
    return () => { _consoleSubs.delete(sub); };
  }, []);
  return items;
}

/* Sleep helper for sequenced log lines. */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Stream a sequenced set of log lines for a single command. Each call emits
   the same six lines (in the user-specified order, with 300ms gaps) and then
   the SUCCESS / ERROR tail once the API call resolves. */
async function logNovaCommand(cmd, agent, runFetch) {
  const t0 = Date.now();
  const preview = (cmd || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  const previewSuffix = (cmd || '').length > 40 ? '…' : '';
  pushConsole('SYSTEM', `Command received: "${preview}${previewSuffix}"`);
  await sleep(300);
  pushConsole('ROUTER', 'Detecting agent...');
  await sleep(300);
  pushConsole('AGENT',  `${agent} → Agent activated`);
  await sleep(300);
  pushConsole('AGENT',  `${agent} → Processing request...`);
  try {
    const reply = await runFetch();
    await sleep(300);
    pushConsole('NOVA',   `Response generated successfully (${Date.now() - t0}ms)`);
    await sleep(300);
    const summary = (reply || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    pushConsole('UPLINK', `Output delivered to Commander — "${summary}${(reply || '').length > 60 ? '…' : ''}"`);
    return { ok: true, reply };
  } catch (err) {
    pushConsole('ERROR',  `Connection interrupted. ${(err && err.message) || 'Retry.'}`);
    return { ok: false, reply: 'Connection interrupted. Retry.' };
  }
}

/* ═══════════════ LIVE ACTIVITY BUS ═══════════════ */
// Lightweight pub/sub so CommandBar can push activity to FeedPanel without
// prop drilling through DesktopNOVA. Subscribers keep a local copy and render.
const MAX_ACTIVITY = 12;
let _activity = [...FEED];
const _activitySubs = new Set();
const _emitActivity = () => _activitySubs.forEach((fn) => fn(_activity));
const pushActivity = (entry) => {
  _activity = [entry, ..._activity].slice(0, MAX_ACTIVITY);
  _emitActivity();
};
function useNovaActivity() {
  const [items, setItems] = useState(_activity);
  useEffect(() => {
    const sub = (next) => setItems(next);
    _activitySubs.add(sub);
    // sync in case the bus was updated before this subscriber mounted
    if (items !== _activity) setItems(_activity);
    return () => { _activitySubs.delete(sub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return items;
}
const agentIconFor = (a) => {
  const k = (a || '').toUpperCase();
  if (k.includes('SEO')) return 'search';
  if (k.includes('CONTENT')) return 'file-text';
  if (k.includes('SOCIAL')) return 'globe';
  if (k.includes('YOUTUBE')) return 'aperture';
  if (k.includes('EMAIL')) return 'send';
  if (k.includes('ANALYTICS')) return 'chart-column';
  if (k.includes('MONITOR')) return 'activity';
  if (k.includes('IDEAS')) return 'atom';
  if (k.includes('MARKETS')) return 'globe';
  if (k.includes('MONETIZE')) return 'gauge';
  return 'atom';
};
const summarizeCmd = (c, n = 60) => {
  const s = (c || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
};
const nowStamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

/* ═══════════════ NOVA OUTPUT MODAL ═══════════════ */
function NOVAOutputModal({ output, agent, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!output) return null;

  // Render text with light formatting: code blocks (```...```) become styled blocks;
  // blank lines become paragraph breaks. Everything else preserves newlines.
  const renderFormatted = (text) => {
    if (!text) return null;
    const segments = [];
    const re = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let m;
    let key = 0;
    while ((m = re.exec(text)) !== null) {
      if (m.index > lastIndex) {
        segments.push({ type: 'text', value: text.slice(lastIndex, m.index) });
      }
      segments.push({ type: 'code', lang: m[1] || '', value: m[2] });
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < text.length) segments.push({ type: 'text', value: text.slice(lastIndex) });

    return segments.map((seg, i) => {
      if (seg.type === 'code') {
        return (
          <pre key={i} style={{
            background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,154,38,0.25)',
            borderRadius: '4px', padding: '10px 12px', margin: '8px 0',
            fontFamily: 'Share Tech Mono, monospace', fontSize: '11px',
            color: '#ffd9a8', overflowX: 'auto', whiteSpace: 'pre',
          }}>{seg.value}</pre>
        );
      }
      // text segment — convert blank-line groups to paragraph breaks
      const paras = seg.value.split(/\n{2,}/);
      return paras.map((p, j) => (
        <p key={`${i}-${j}`} style={{ margin: '0 0 8px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {p.split('\n').map((line, k, arr) => (
            <React.Fragment key={k}>
              {line}
              {k < arr.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      ));
    });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = output;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
      document.body.removeChild(ta);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.88)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: '16px', backdropFilter: 'blur(6px)',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'linear-gradient(160deg, #1a0e03, #0a0500)',
        border: '1px solid rgba(255,154,38,0.4)',
        borderRadius: '8px', padding: '20px',
        width: '100%', maxWidth: '640px',
        maxHeight: '80vh', overflow: 'auto',
        boxShadow: '0 0 40px rgba(255,130,10,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '8px' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '10px', color: '#ff9a26', letterSpacing: '2px' }}>
            ⚡ {agent} — OUTPUT
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={copy} style={{ background: 'none', border: '1px solid rgba(255,154,38,0.3)', color: copied ? '#35e08a' : '#ff9a26', cursor: 'pointer', padding: '4px 10px', fontSize: '10px', borderRadius: '3px', fontFamily: 'monospace' }}>
              {copied ? 'COPIED' : 'COPY'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: '1px solid rgba(255,154,38,0.3)', color: '#ff9a26', cursor: 'pointer', padding: '4px 10px', fontSize: '10px', borderRadius: '3px', fontFamily: 'monospace' }}>CLOSE</button>
          </div>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#e8c98a', lineHeight: '1.7', wordBreak: 'break-word' }}>
          {renderFormatted(output)}
        </div>
      </div>
    </div>
  );
}


/* deterministic PRNG helpers */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function series(n, seed, min, max, rough = 0.32) {
  const r = mulberry32(seed);
  let v = (min + max) / 2;
  const out = [];
  for (let i = 0; i < n; i++) {
    v += (r() - 0.5) * (max - min) * rough * 2;
    v = Math.max(min, Math.min(max, v));
    out.push(v);
  }
  return out;
}
const cutPoly = (c) =>
  `polygon(${c}px 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, ${c}px 100%, 0 calc(100% - ${c}px), 0 ${c}px)`;

/* chamfered, bordered panel */
function Chamfer({ x, y, w, h, c = 8, className = '', children, style }) {
  return (
    <div className={`chamfer sheen ${className}`}
      style={{ left: x, top: y, width: w, height: h, clipPath: cutPoly(c), background: 'linear-gradient(160deg, #57361a 0%, #31200e 55%, #1c1108 100%)', ...style }}>
      <div className="inner" style={{ clipPath: cutPoly(Math.max(1, c - 1)) }}>{children}</div>
    </div>
  );
}
/* square chamfered button */
function SqBtn({ x, y, size = 36, c = 6, className = '', children, ...rest }) {
  return (
    <Chamfer x={x} y={y} w={size} h={size} c={c} className={`sqbtn-wrap ${className}`} style={{ filter: 'none' }}>
      <button className="sqbtn" {...rest}>{children}</button>
    </Chamfer>
  );
}
const Brackets = () => (
  <div className="brk-wrap"><i className="brk tl" /><i className="brk tr" /><i className="brk bl" /><i className="brk br" /></div>
);

/* ── clock ── */
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const p = (n) => String(n).padStart(2, '0');
  return {
    time: `${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`,
    date: `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`,
  };
}

/* ═══════════════ TOP BAR ═══════════════ */
function TopBar() {
  const { time, date } = useClock();
  return (
    <div className="topbar">
      <div className="logo-emblem">
        <svg viewBox="0 0 46 46" fill="none">
          <circle cx="23" cy="23" r="21.5" stroke="#6b451c" strokeWidth="1" />
          <circle cx="23" cy="23" r="21.5" stroke="#ffb443" strokeWidth="1.4" strokeDasharray="26 110" strokeLinecap="round" />
          <circle cx="23" cy="23" r="16" stroke="#4a3015" strokeWidth="1" strokeDasharray="2 4" />
          <circle cx="23" cy="23" r="3.2" stroke="#ffb443" strokeWidth="1.2" />
          <circle cx="23" cy="23" r="1" fill="#ffdf9e" />
          <path d="M23 1.5 v6 M23 38.5 v6 M1.5 23 h6 M38.5 23 h6" stroke="#8a5a20" strokeWidth="1.2" />
          <path d="M30 16 L34 20 M16 30 L12 34" stroke="#8a5a20" strokeWidth="1" />
        </svg>
      </div>
      <div className="logo-word">
        <div className="w">NOVA</div>
        <div className="s">AI OPERATIONS COMMAND CENTER</div>
      </div>
      <div className="logo-pulse" />

      <Chamfer x={276} y={8} w={240} h={48} c={8}>
        <div className="mission">
          <Globe size={17} strokeWidth={1.4} color="#ff9a26" opacity={0.85} />
          <div>
            <div className="t1">MISSION CONTROL</div>
            <div className="t2">ALL SYSTEMS OPERATIONAL</div>
          </div>
        </div>
      </Chamfer>

      {STATS.map((s, i) => (
        <Chamfer key={s.label} x={524 + i * 164} y={8} w={156} h={48} c={8}>
          <div className="statbox">
            <span className="ic"><Ic name={s.icon} size={21} /></span>
            <div><div className="v">{s.value}</div><div className="k">{s.label}</div></div>
          </div>
        </Chamfer>
      ))}

      <div className="timeblock" style={{ left: 1196, top: 8 }}>
        <div className="k">SYSTEM TIME</div>
        <div className="t">{time}</div>
        <div className="d">{date}</div>
      </div>

      <SqBtn x={1372} y={13} title="Uplink"><Activity size={15} /></SqBtn>
      <SqBtn x={1418} y={13} title="Alerts">
        <Bell size={15} /><span className="badge n2">3</span>
      </SqBtn>
      <SqBtn x={1464} y={13} title="Core"><Atom size={15} /></SqBtn>
      <SqBtn x={1510} y={13} title="Power"><Power size={15} /></SqBtn>
    </div>
  );
}

/* ═══════════════ HOLOGRAM AVATAR ═══════════════ */
function HoloAvatar({ size = 60 }) {
  const lines = [];
  for (let y = 16.5; y <= 47; y += 2.6) lines.push(y);
  return (
    <svg viewBox="0 0 60 60" width={size} height={size}>
      <defs>
        <clipPath id="avatarClip">
          <path d="M30 12.5 C20.5 12.5 16.5 20.5 16.5 28.5 C16.5 35.5 19.5 41.5 24 45.5 C26.6 47.9 27.8 49 30 49 C32.2 49 33.4 47.9 36 45.5 C40.5 41.5 43.5 35.5 43.5 28.5 C43.5 20.5 39.5 12.5 30 12.5 Z" />
        </clipPath>
        <linearGradient id="avatarScan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9a0" stopOpacity="0" />
          <stop offset=".5" stopColor="#ffd9a0" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="30" cy="30" r="28.6" fill="rgba(255,150,30,.03)" stroke="#6b451c" strokeWidth="1" />
      <g style={{ transformOrigin: '30px 30px', animation: 'spin 26s linear infinite' }}>
        <circle cx="30" cy="30" r="28.6" fill="none" stroke="#ffb443" strokeWidth="1.1" strokeDasharray="34 146" strokeLinecap="round" />
      </g>
      <g style={{ transformOrigin: '30px 30px', animation: 'spinRev 40s linear infinite' }}>
        <circle cx="30" cy="30" r="25.5" fill="none" stroke="#7c4a10" strokeWidth=".8" strokeDasharray="1.5 5" />
      </g>
      <g clipPath="url(#avatarClip)">
        <rect x="12" y="10" width="36" height="42" fill="rgba(255,140,30,.05)" />
        {lines.map((y, i) => (
          <line key={i} x1="12" x2="48" y1={y} y2={y}
            stroke="#ff9a26" strokeOpacity={y > 24 && y < 38 ? 0.62 : 0.34} strokeWidth={y > 24 && y < 38 ? 0.75 : 0.55} />
        ))}
        <path d="M30 13 V49" stroke="#ffc24d" strokeWidth=".6" strokeOpacity=".5" fill="none" />
        <path d="M22 15 C19 24 19 38 25 48 M38 15 C41 24 41 38 35 48" stroke="#ff9a26" strokeWidth=".55" strokeOpacity=".5" fill="none" />
        <line x1="23.4" x2="27.6" y1="30" y2="30" stroke="#ffdf9e" strokeWidth="1.1" />
        <line x1="32.4" x2="36.6" y1="30" y2="30" stroke="#ffdf9e" strokeWidth="1.1" />
        <path d="M30 31.5 V37" stroke="#ffc24d" strokeWidth=".8" strokeOpacity=".7" />
        <path d="M26.8 41.5 Q30 43.4 33.2 41.5" stroke="#ffc24d" strokeWidth=".8" fill="none" strokeOpacity=".7" />
        <rect x="12" y="14" width="36" height="4" fill="url(#avatarScan)">
          <animate attributeName="y" dur="3.2s" values="12;46;12" repeatCount="indefinite" />
        </rect>
      </g>
      <path d="M30 12.5 C20.5 12.5 16.5 20.5 16.5 28.5 C16.5 35.5 19.5 41.5 24 45.5 C26.6 47.9 27.8 49 30 49 C32.2 49 33.4 47.9 36 45.5 C40.5 41.5 43.5 35.5 43.5 28.5 C43.5 20.5 39.5 12.5 30 12.5 Z"
        fill="none" stroke="#ffb443" strokeWidth="1" strokeOpacity=".9" />
    </svg>
  );
}

/* ═══════════════ LEFT RAIL ═══════════════ */
function LeftRail({ activeNav, setActiveNav }) {
  return (
    <>
      <div className="profile" style={{ left: 6, top: 72, width: 249, height: 84 }}>
        <div style={{ position: 'absolute', left: 8, top: 10 }}><HoloAvatar /></div>
        <div style={{ position: 'absolute', left: 86, top: 12 }}>
          <div className="label">COMMANDER</div>
          <div className="name">ANWAAR</div>
          <div className="rank">MASTER CONTROL</div>
          <div className="online"><i />ONLINE</div>
        </div>
      </div>

      <div style={{ position: 'absolute', left: 6, top: 168, width: 249, height: 454 }}>
        {NAV.map((n, i) => (
          <div key={n.id} className={`navitem ${activeNav === n.id ? 'active' : ''}`}
            style={{ top: i * 46 }}
            onClick={() => setActiveNav(n.id)}>
            <span className="ic"><Ic name={n.icon} size={15} /></span>
            <div>
              <div className="lbl">{n.label}</div>
              {n.sub && <div className="sub">{n.sub}</div>}
            </div>
            {n.chev && <span className="chev"><ChevronRight size={12} /></span>}
          </div>
        ))}
      </div>

      <Chamfer x={6} y={630} w={249} h={112} c={8} className="sysstat">
        <div className="title">SYSTEM STATUS</div>
        <div style={{ position: 'absolute', left: 14, top: 28, width: 80, height: 80 }}>
          <GaugeDial />
        </div>
        {SYS_STATUS.map((m, i) => (
          <div key={m.label} className="metric" style={{ left: 108, top: 32 + i * 20, width: 128 }}>
            <span className="k">{m.label}</span><span className="v">{m.pct}%</span>
            <div className="bar"><i style={{ width: `${m.pct}%` }} /></div>
          </div>
        ))}
      </Chamfer>
    </>
  );
}

function GaugeDial() {
  const r = 31, cx = 40, cy = 40, C = 2 * Math.PI * r;
  const arc = C * (240 / 360), gap = C - arc;
  return (
    <div style={{ position: 'relative', width: 80, height: 80 }}>
      <svg viewBox="0 0 80 80" width="80" height="80">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#0e8f58" /><stop offset=".55" stopColor="#35e08a" /><stop offset="1" stopColor="#a4f0c8" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#22301f" strokeWidth="7"
          strokeDasharray={`${arc} ${gap}`} transform={`rotate(150 ${cx} ${cy})`} opacity=".55" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#gaugeGrad)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${arc} ${gap}`} transform={`rotate(150 ${cx} ${cy})`}
          style={{ filter: 'drop-shadow(0 0 5px rgba(53,224,138,.55))' }} />
        {Array.from({ length: 13 }).map((_, i) => {
          const a = (150 + i * 20) * Math.PI / 180;
          return <line key={i}
            x1={cx + 23 * Math.cos(a)} y1={cy + 23 * Math.sin(a)}
            x2={cx + 26 * Math.cos(a)} y2={cy + 26 * Math.sin(a)}
            stroke="#7c8" strokeOpacity={i <= 12 ? .55 : .2} strokeWidth={i % 3 === 0 ? 1.2 : .7} />;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--fd)', fontWeight: 800, fontSize: 13, color: '#d8ffe9', textShadow: '0 0 10px rgba(53,224,138,.6)', letterSpacing: .5 }}>100%</div>
        <div style={{ fontSize: 5.5, letterSpacing: 1.6, color: '#35e08a', marginTop: 3, fontWeight: 700 }}>OPTIMAL</div>
      </div>
    </div>
  );
}

/* ═══════════════ STAGE (center) ═══════════════ */
const SC = { x: 419, y: 240 };                 // core centre (stage coords)
const CARD_TOPS = [48, 124, 200, 276, 352, 428];
const RING_R = 192, RING_IN = 120;

function connector(side, cy) {
  const clamped = Math.min(SC.y + 184, Math.max(SC.y - 184, cy));
  const a = Math.asin((SC.y - clamped) / RING_R);
  const no = { x: SC.x + side * RING_R * Math.cos(a), y: SC.y - RING_R * Math.sin(a) };
  const ni = { x: SC.x + side * RING_IN * Math.cos(a), y: SC.y - RING_IN * Math.sin(a) };
  return { a, no, ni };
}

function Sparkline({ seed, w = 46, h = 15 }) {
  const pts = series(18, seed, 0.12, 0.88, 0.4);
  const step = w / (pts.length - 1);
  const line = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - v * h).toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} className="aspark" style={{ position: 'absolute', right: 48, top: 30 }}>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill="rgba(255,154,38,.10)" stroke="none" />
      <path d={line} fill="none" stroke="#ffb443" strokeOpacity=".7" strokeWidth="1" />
    </svg>
  );
}

function AgentCard({ agent, x, y, seed }) {
  return (
    <Chamfer x={x} y={y} w={244} h={62} c={8} className="agentcard">
      <span className="aicon">
        <ChamferFrame size={38} c={5}><Ic name={agent.icon} size={17} /></ChamferFrame>
      </span>
      <div className="aname">{agent.name}</div>
      <div className="arole">{agent.role}</div>
      <div className="aonline"><span className="online-dot" />ONLINE</div>
      <Sparkline seed={seed} />
      <div className="apct">{agent.pct}%</div>
    </Chamfer>
  );
}
/* small chamfered icon frame (static, inside other elements) */
function ChamferFrame({ size, c = 5, children }) {
  return (
    <span style={{
      width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center',
      clipPath: cutPoly(c), background: 'linear-gradient(160deg,#57361a,#241708)', position: 'relative',
    }}>
      <span style={{
        position: 'absolute', inset: 1, clipPath: cutPoly(Math.max(1, c - 1)),
        background: 'linear-gradient(160deg, rgba(255,150,30,.10), rgba(16,9,3,.6))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{children}</span>
    </span>
  );
}

function StageStars() {
  const stars = useMemo(() => {
    const r = mulberry32(41);
    return Array.from({ length: 150 }).map((_, i) => ({
      x: r() * 836, y: 34 + r() * 630, s: r() < 0.12 ? 2 : 1,
      o: 0.12 + r() * 0.5, tw: r() < 0.28, d: r() * 3,
    }));
  }, []);
  return (
    <>
      {stars.map((s, i) => (
        <span key={i} className={`star ${s.tw ? 'tw' : ''}`}
          style={{ left: s.x, top: s.y, width: s.s, height: s.s, opacity: s.o, animationDelay: `${s.d}s` }} />
      ))}
    </>
  );
}

function CoreViz() {
  const ticks = [];
  for (let i = 0; i < 120; i++) {
    const a = (i * 3) * Math.PI / 180, major = i % 10 === 0;
    const r1 = 197, r2 = major ? 208 : 202;
    ticks.push(<line key={i}
      x1={280 + r1 * Math.cos(a)} y1={280 + r1 * Math.sin(a)}
      x2={280 + r2 * Math.cos(a)} y2={280 + r2 * Math.sin(a)}
      stroke={major ? '#e08a2e' : '#8a5a20'} strokeOpacity={major ? .85 : .5}
      strokeWidth={major ? 1.3 : 0.8} />);
  }
  return (
    <svg viewBox="0 0 560 560" width="560" height="560"
      style={{ position: 'absolute', left: SC.x - 280, top: SC.y - 280 }}>
      <defs>
        <radialGradient id="amb" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ff8a12" stopOpacity=".20" />
          <stop offset=".38" stopColor="#ff8a12" stopOpacity=".08" />
          <stop offset="1" stopColor="#ff8a12" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="coreFill" cx=".5" cy=".45" r=".62">
          <stop offset="0" stopColor="#1c0e03" />
          <stop offset=".62" stopColor="#0c0602" />
          <stop offset="1" stopColor="#030100" />
        </radialGradient>
        <linearGradient id="flameGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe0a6" />
          <stop offset=".45" stopColor="#ff9a26" />
          <stop offset="1" stopColor="#e05e00" />
        </linearGradient>
        <filter id="flame" x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.030" numOctaves="3" seed="7" result="n">
            <animate attributeName="baseFrequency" dur="16s" values="0.012 0.030;0.017 0.038;0.012 0.030" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="15" />
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
        <filter id="soft6"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id="soft2"><feGaussianBlur stdDeviation="1.6" /></filter>
      </defs>

      <circle cx="280" cy="280" r="258" fill="url(#amb)" />

      {/* slow outer rings */}
      <g style={{ transformOrigin: '280px 280px', animation: 'spin 90s linear infinite' }}>
        <circle cx="280" cy="280" r="232" fill="none" stroke="#b06a1e" strokeOpacity=".28" strokeWidth="1" strokeDasharray="1 10" />
        <circle cx="280" cy="280" r="224" fill="none" stroke="#b06a1e" strokeOpacity=".42" strokeWidth="1" strokeDasharray="2 14" />
        <circle cx="280" cy="280" r="210" fill="none" stroke="#c07a28" strokeOpacity=".55" strokeWidth="1.1" strokeDasharray="42 20 6 20" />
      </g>
      {/* tick ring */}
      {ticks}
      {/* attachment ring */}
      <circle cx="280" cy="280" r="192" fill="none" stroke="#6e451a" strokeOpacity=".5" strokeWidth="1" />
      {/* mid counter-rotating rings */}
      <g style={{ transformOrigin: '280px 280px', animation: 'spinRev 64s linear infinite' }}>
        <circle cx="280" cy="280" r="168" fill="none" stroke="#cf862f" strokeOpacity=".6" strokeWidth="1.1" strokeDasharray="64 44 8 44" />
        <circle cx="280" cy="280" r="152" fill="none" stroke="#a06824" strokeOpacity=".5" strokeWidth="1" strokeDasharray="4 9" />
      </g>
      <circle cx="280" cy="280" r="120" fill="none" stroke="#7a4d1c" strokeOpacity=".65" strokeWidth="1" strokeDasharray="1 3" />

      {/* fiery core ring */}
      <circle cx="280" cy="280" r="84" fill="none" stroke="#ff8310" strokeOpacity=".5" strokeWidth="14" filter="url(#soft6)" />
      <g filter="url(#flame)">
        <circle cx="280" cy="280" r="84" fill="none" stroke="url(#flameGrad)" strokeWidth="7" />
      </g>
      <g filter="url(#flame)">
        <circle cx="280" cy="280" r="84" fill="none" stroke="#ffe6b8" strokeOpacity=".85" strokeWidth="2.4" />
      </g>
      <circle cx="280" cy="280" r="78.5" fill="url(#coreFill)" stroke="#ffd9a0" strokeOpacity=".55" strokeWidth="1" filter="url(#soft2)" />

      {/* inner swirl */}
      <g style={{ transformOrigin: '280px 280px', animation: 'spin 42s linear infinite' }}>
        <path d="M280 224 A56 56 0 0 1 336 280" fill="none" stroke="#ff9a26" strokeOpacity=".28" strokeWidth="1" />
        <path d="M280 336 A56 56 0 0 1 224 280" fill="none" stroke="#ff9a26" strokeOpacity=".28" strokeWidth="1" />
        <circle cx="336" cy="280" r="1.8" fill="#ffdf9e" opacity=".8" />
        <circle cx="224" cy="280" r="1.8" fill="#ffdf9e" opacity=".8" />
      </g>

      {/* ring sparkles */}
      {[[100, 60], [472, 128], [388, 505], [86, 402]].map(([x, y], i) => (
        <g key={i} className="cross-spark-svg" opacity=".85">
          <path d={`M${x} ${y - 6} V${y + 6} M${x - 6} ${y} H${x + 6}`} stroke="#ffedc4" strokeWidth="1" filter="url(#soft2)" />
        </g>
      ))}
    </svg>
  );
}

function StageConnectors() {
  const parts = [];
  const push = (pts, key) => {
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    parts.push(<path key={key} d={d} fill="none" stroke="#ff9a26" strokeOpacity=".34" strokeWidth="1" />);
    parts.push(<path key={key + 'g'} d={d} fill="none" stroke="#ff9a26" strokeOpacity=".5" strokeWidth=".5" />);
  };
  const dot = (x, y, key, r = 2.2) => parts.push(
    <circle key={key} cx={x} cy={y} r={r} fill="#ffb443" style={{ filter: 'drop-shadow(0 0 4px rgba(255,170,60,.9))' }} />);

  CARD_TOPS.forEach((top, i) => {
    const cy = top + 31;
    // left side
    let c = connector(-1, cy);
    push([[250, cy], [286, cy], [c.no.x, c.no.y], [c.ni.x, c.ni.y]], 'L' + i);
    dot(c.no.x, c.no.y, 'Lo' + i); dot(c.ni.x, c.ni.y, 'Li' + i, 1.6); dot(250, cy, 'Lc' + i, 1.6);
    // right side
    c = connector(1, cy);
    push([[588, cy], [552, cy], [c.no.x, c.no.y], [c.ni.x, c.ni.y]], 'R' + i);
    dot(c.no.x, c.no.y, 'Ro' + i); dot(c.ni.x, c.ni.y, 'Ri' + i, 1.6); dot(588, cy, 'Rc' + i, 1.6);
  });

  // comm-bus diagonals
  const la = 200 * Math.PI / 180, ra = 340 * Math.PI / 180;
  const lp = [SC.x + RING_R * Math.cos(la), SC.y - RING_R * Math.sin(la)];
  const rp = [SC.x + RING_R * Math.cos(ra), SC.y - RING_R * Math.sin(ra)];
  push([[324, 430], lp, [SC.x + RING_IN * Math.cos(la), SC.y - RING_IN * Math.sin(la)]], 'cbL');
  push([[514, 430], rp, [SC.x + RING_IN * Math.cos(ra), SC.y - RING_IN * Math.sin(ra)]], 'cbR');
  dot(lp[0], lp[1], 'cbLd'); dot(rp[0], rp[1], 'cbRd');

  return (
    <svg width="838" height="672" style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
      {/* crosshair guides */}
      <line x1="14" x2="824" y1={SC.y} y2={SC.y} stroke="#8a5a20" strokeOpacity=".28" strokeWidth="1" />
      <line x1={SC.x} x2={SC.x} y1="30" y2="580" stroke="#8a5a20" strokeOpacity=".28" strokeWidth="1" />
      <line x1={SC.x - 150} x2={SC.x + 150} y1={SC.y} y2={SC.y} stroke="#c07a28" strokeOpacity=".4" strokeWidth="1" />
      {parts}
    </svg>
  );
}

function BeamRipple() {
  return (
    <svg width="838" height="672" style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffbe55" stopOpacity=".55" />
          <stop offset=".8" stopColor="#ff9a26" stopOpacity=".18" />
          <stop offset="1" stopColor="#ff9a26" stopOpacity=".3" />
        </linearGradient>
        <linearGradient id="beamCore" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff1d4" stopOpacity=".95" />
          <stop offset="1" stopColor="#ffc24d" stopOpacity=".55" />
        </linearGradient>
        <radialGradient id="bloom" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff2cf" stopOpacity=".9" />
          <stop offset=".35" stopColor="#ffb443" stopOpacity=".5" />
          <stop offset="1" stopColor="#ff9a26" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={SC.x - 9} y={322} width="18" height="258" fill="url(#beamGrad)" opacity=".5" filter="url(#soft6)" />
      <line x1={SC.x} x2={SC.x} y1="322" y2="580" stroke="url(#beamCore)" strokeWidth="1.6" />
      {/* landing bloom */}
      <ellipse cx={SC.x} cy="580" rx="34" ry="10" fill="url(#bloom)" /><ellipse cx={SC.x} cy="580" rx="90" ry="20" fill="url(#bloom)" opacity=".35" />
      <ellipse cx={SC.x} cy="580" rx="70" ry="12.5" fill="none" stroke="#ffb443" strokeOpacity=".28" strokeWidth="1" filter="url(#soft2)" />
      <ellipse cx={SC.x} cy="580" rx="48" ry="8.6" fill="none" stroke="#ffb443" strokeOpacity=".42" strokeWidth="1" />
      <ellipse cx={SC.x} cy="580" rx="30" ry="5.4" fill="none" stroke="#ffc24d" strokeOpacity=".6" strokeWidth="1" />
      <ellipse cx={SC.x} cy="580" rx="14" ry="2.6" fill="none" stroke="#ffedc4" strokeOpacity=".85" strokeWidth="1" />
      <ellipse cx={SC.x} cy="596" rx="34" ry="6" fill="none" stroke="#ffb443" strokeOpacity=".16" strokeWidth="1" />
      <ellipse cx={SC.x} cy="596" rx="19" ry="3.4" fill="none" stroke="#ffb443" strokeOpacity=".24" strokeWidth="1" />
      <line x1={SC.x} x2={SC.x} y1="558" y2="580" stroke="#fff1d4" strokeOpacity=".5" strokeWidth="2.6" filter="url(#soft2)" />
    </svg>
  );
}

function Waveform() {
  const bars = useMemo(() => {
    const r = mulberry32(99);
    return Array.from({ length: 46 }).map((_, i) => {
      const env = Math.pow(Math.sin((i / 45) * Math.PI), 0.7);
      return Math.round(4 + 30 * env * (0.35 + 0.65 * r()));
    });
  }, []);
  return (
    <div className="wave">
      {bars.map((h, i) => (
        <i key={i} style={{ height: h, animationDelay: `${(i * 57) % 700}ms`, opacity: .45 + (h / 34) * .55 }} />
      ))}
    </div>
  );
}

function Stage() {
  return (
    <div className="stage" style={{ left: 262, top: 70, width: 838, height: 672 }}>
      <div className="glowspot" />
      <StageStars />
      <div className="ptitle" style={{ position: 'absolute', left: 16, top: 12 }}>AI TEAM OVERVIEW</div>
      <div className="paction" style={{ position: 'absolute', right: 16, top: 13, cursor: 'default' }}>24 / 28 AGENTS ONLINE</div>

      <BeamRipple />
      <StageConnectors />
      <CoreViz />

      <div className="core-title" style={{ left: SC.x, top: SC.y - 26 }}>
        <div className="n">NOVA</div>
        <div className="r">MASTER AI ORCHESTRATOR</div>
        <div className="st">ONLINE</div>
      </div>

      {AGENTS_LEFT.map((a, i) => <AgentCard key={a.name} agent={a} x={6} y={CARD_TOPS[i]} seed={100 + i * 7} />)}
      {AGENTS_RIGHT.map((a, i) => <AgentCard key={a.name} agent={a} x={588} y={CARD_TOPS[i]} seed={300 + i * 7} />)}

      <Chamfer x={324} y={428} w={190} h={84} c={8} className="commbus">
        <div className="cb-t">AI COMMUNICATION BUS</div>
        <div className="cb-s">SECURE ENCRYPTED CHANNEL</div>
        <Waveform />
      </Chamfer>

      <span className="cross-spark" style={{ left: 60, top: 112, width: 14, height: 14 }} />
      <span className="cross-spark" style={{ left: 772, top: 92, width: 11, height: 11, animationDelay: '1.1s' }} />
      <span className="cross-spark" style={{ left: 690, top: 388, width: 13, height: 13, animationDelay: '2s' }} />
      <span className="cross-spark" style={{ left: 148, top: 470, width: 9, height: 9, animationDelay: '.5s' }} />

      <Brackets />
    </div>
  );
}

/* ═══════════════ RIGHT COLUMN ═══════════════ */
function PanelTitle({ title, action }) {
  return (
    <>
      <div className="ptitle" style={{ position: 'absolute', left: 14, top: 11 }}>{title}</div>
      {action && <div className="paction" style={{ position: 'absolute', right: 14, top: 11 }}>{action}<ChevronRight size={9} /></div>}
    </>
  );
}

function FeedPanel() {
  const items = useNovaActivity();
  return (
    <Chamfer x={1108} y={70} w={450} h={278} c={10}>
      <PanelTitle title="LIVE ACTIVITY FEED" action="VIEW ALL" />
      {items.map((f, i) => (
        <div key={`${f.t}-${f.name}-${i}`} className="feedrow" style={{ top: 34 + i * 37.5 }}>
          <span className="ft">{f.t}</span>
          <span className="fi"><ChamferFrame size={24} c={5}><Ic name={f.icon} size={11} /></ChamferFrame></span>
          <div>
            <div className="fn">{f.name}</div>
            <div className="fx">{f.text}</div>
          </div>
          <span className="ok" style={{ color: f.status === 'PROCESSING' ? '#ffb443' : undefined, textShadow: f.status === 'PROCESSING' ? '0 0 7px rgba(255,180,67,.4)' : undefined }}>{f.status || 'SUCCESS'}</span>
        </div>
      ))}
    </Chamfer>
  );
}

const BrandLogo = ({ kind }) => {
  const orange = '#ff9a26';
  if (kind === 'openai') return (
    <svg width="17" height="17" viewBox="0 0 16 16">
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle key={a} cx={8 + 3.4 * Math.cos(a * Math.PI / 180)} cy={8 + 3.4 * Math.sin(a * Math.PI / 180)}
          r="3.1" fill="none" stroke={orange} strokeWidth="1" />
      ))}
    </svg>
  );
  if (kind === 'claude') return <Asterisk size={17} color={orange} strokeWidth={1.7} />;
  if (kind === 'gemini') return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path d="M8 0 Q9.4 6.6 16 8 Q9.4 9.4 8 16 Q6.6 9.4 0 8 Q6.6 6.6 8 0 Z" fill="#6aa8ff" />
      <path d="M12.6 10.6 Q13.2 12.9 15.4 13.5 Q13.2 14.1 12.6 16 Q12 14.1 9.8 13.5 Q12 12.9 12.6 10.6 Z" fill="#9a7bff" opacity=".85" transform="scale(.8) translate(3 3)" />
    </svg>
  );
  if (kind === 'pinecone') return (
    <svg width="15" height="17" viewBox="0 0 14 16" fill="none" stroke={orange} strokeWidth="1.1">
      <path d="M7 1.5 L12 5.5 L10.6 7.4 M7 1.5 L2 5.5 L3.4 7.4 M7 1.5 V5" />
      <path d="M2.8 8.6 L7 12 L11.2 8.6 M4.6 12.4 L7 14.5 L9.4 12.4" />
    </svg>
  );
  return <Send size={15} color="#9a7bff" strokeWidth={1.6} />;
};

function ApisPanel() {
  return (
    <Chamfer x={1108} y={356} w={450} h={182} c={10}>
      <PanelTitle title="API INTEGRATIONS" action="MANAGE APIS" />
      {APIS.map((a, i) => (
        <div key={a.name} className="apirow" style={{ top: 34 + i * 29 }}>
          <span className="logo"><BrandLogo kind={a.logo} /></span>
          <div style={{ marginLeft: 7 }}>
            <div className="an">{a.name}</div>
            <div className="as">{a.sub}</div>
          </div>
          <div className="right">
            <div className="au">{a.usage}</div>
            <div className="bargroup">
              <span className="bar"><i style={{ width: `${a.pct * 4}%` }} /></span>
              <span className="ap">{a.pct}%</span>
            </div>
          </div>
        </div>
      ))}
    </Chamfer>
  );
}

function PerfChart({ seed, lo, hi }) {
  const pts = useMemo(() => series(56, seed, lo, hi, 0.3), [seed, lo, hi]);
  const step = 100 / (pts.length - 1);
  const line = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(2)},${(22 - v * 20).toFixed(2)}`).join(' ');
  return (
    <svg width="100%" height="22" viewBox="0 0 100 22" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`pc${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9a26" stopOpacity=".32" />
          <stop offset="1" stopColor="#ff9a26" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L100,22 L0,22 Z`} fill={`url(#pc${seed})`} stroke="none" />
      <path d={line} fill="none" stroke="#ffa53a" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function PerfPanel() {
  return (
    <Chamfer x={1108} y={546} w={450} h={196} c={10}>
      <PanelTitle title="SYSTEM PERFORMANCE" />
      <Chamfer x={352} y={8} w={70} h={18} c={4}>
        <span style={{ fontSize: 7.5, letterSpacing: 1.4, color: 'var(--tx-dim)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 4 }}>
          24 HOURS <ChevronRight size={8} style={{ transform: 'rotate(90deg)' }} />
        </span>
      </Chamfer>
      {[
        { label: 'CPU USAGE', pct: 28, seed: 11, lo: .1, hi: .62 },
        { label: 'MEMORY USAGE', pct: 45, seed: 23, lo: .3, hi: .75 },
        { label: 'NETWORK I/O', pct: 68, seed: 37, lo: .45, hi: .9 },
        { label: 'DISK I/O', pct: 72, seed: 53, lo: .5, hi: .92 },
      ].map((m, i) => (
        <div key={m.label} className="perfrow" style={{ top: 34 + i * 39.5 }}>
          <div className="ph"><span className="pk">{m.label}</span><span className="pv">{m.pct}%</span></div>
          <PerfChart seed={m.seed} lo={m.lo} hi={m.hi} />
        </div>
      ))}
    </Chamfer>
  );
}

/* ═══════════════ BOTTOM ROW ═══════════════ */
function ProjectsPanel() {
  return (
    <Chamfer x={6} y={750} w={400} h={198} c={10}>
      <PanelTitle title="ACTIVE PROJECTS" action="VIEW ALL" />
      {PROJECTS.map((p, i) => (
        <div key={p.name} className="projrow" style={{ top: 34 + i * 31.5 }}>
          <span className="pi"><ChamferFrame size={28} c={5}><Ic name={p.icon} size={13} /></ChamferFrame></span>
          <div>
            <div className="pn">{p.name}</div>
            <div className="pt">{p.type}</div>
          </div>
          <span className="bar"><i style={{ width: `${p.pct}%` }} /></span>
          <span className="pp">{p.pct}%</span>
          <span className="chip">IN PROGRESS</span>
        </div>
      ))}
    </Chamfer>
  );
}

function TasksPanel() {
  return (
    <Chamfer x={414} y={750} w={400} h={198} c={10}>
      <PanelTitle title="TASK QUEUE" action="VIEW ALL" />
      {TASKS.map((t, i) => (
        <div key={t.title} className="taskrow" style={{ top: 35 + i * 26.5 }}>
          <span className="ti"><ChamferFrame size={20} c={4}><Ic name={t.icon} size={10} /></ChamferFrame></span>
          <div>
            <div className="tn">{t.title}</div>
            <div className="ta">{t.agent}</div>
          </div>
          <span className="bar"><i style={{ width: `${t.pct}%` }} /></span>
          <span className="tp">{t.pct}%</span>
        </div>
      ))}
    </Chamfer>
  );
}

const lon2x = (lon) => ((lon + 180) / 360) * 100;
const lat2y = (lat) => ((84 - lat) / 144) * 40;

function WorldMapPanel() {
  const hubs = useMemo(() => Object.fromEntries(HUBS.map((h) => [h.id, { x: lon2x(h.lon), y: lat2y(h.lat) }])), []);
  return (
    <Chamfer x={822} y={750} w={278} h={198} c={10}>
      <PanelTitle title="GLOBAL NETWORK MAP" />
      <svg viewBox="0 0 100 40" width="262" height="122" style={{ position: 'absolute', left: 8, top: 30 }}
        preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ff9a26" stopOpacity=".1" />
            <stop offset=".5" stopColor="#ffc24d" stopOpacity=".95" />
            <stop offset="1" stopColor="#ff9a26" stopOpacity=".1" />
          </linearGradient>
        </defs>
        {MAP_DOTS.map((row, gy) =>
          row.split('').map((ch, gx) => {
            if (ch !== 'O') return null;
            const h = (gx * 7 + gy * 13) % 19;
            return <circle key={`${gx}-${gy}`} cx={gx + .5} cy={gy + .5} r={h === 0 ? .52 : .4}
              fill="#ff9a26" opacity={h === 0 ? .95 : h < 4 ? .6 : .34} />;
          })
        )}
        {ARCS.map(([a, b], i) => {
          const p = hubs[a], q = hubs[b];
          const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
          const d = Math.hypot(q.x - p.x, q.y - p.y);
          const cxp = mx, cyp = my - d * 0.22;
          return <path key={i} d={`M${p.x} ${p.y} Q${cxp} ${cyp} ${q.x} ${q.y}`}
            fill="none" stroke="url(#arcGrad)" strokeWidth=".45" strokeDasharray="2.6 1.8"
            style={{ animation: `dashMove ${7 + i}s linear infinite` }} />;
        })}
        {HUBS.map((h) => {
          const p = hubs[h.id];
          return (
            <g key={h.id}>
              <circle cx={p.x} cy={p.y} r="3" fill="#ff9a26" opacity=".32" />
              <circle cx={p.x} cy={p.y} r="1.3" fill="#ffc24d" opacity=".85" />
              <circle cx={p.x} cy={p.y} r=".55" fill="#fff2cf" />
            </g>
          );
        })}
      </svg>
      {[
        { k: 'ACTIVE NODES', v: '67' },
        { k: 'DATA TRANSFER', v: '2.4', u: 'TB/s' },
        { k: 'UPTIME', v: '99.98%' },
      ].map((s, i) => (
        <div key={s.k} className="mapstat" style={{ left: i * 92.7 + 8, top: 158, width: 86 }}>
          <div className="k">{s.k}</div>
          <div className="v">{s.v}{s.u && <small> {s.u}</small>}</div>
        </div>
      ))}
    </Chamfer>
  );
}

function ConsolePanel() {
  const items = useNovaConsole();
  const bodyRef = useRef(null);
  // Auto-scroll to the bottom whenever new lines arrive. The blinking prompt
  // sits at the end of the scrollable area, so it always stays visible.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [items]);
  return (
    <Chamfer x={1108} y={750} w={450} h={198} c={10}>
      <PanelTitle title="COMMAND CONSOLE" />
      <div style={{ position: 'absolute', right: 14, top: 9, display: 'flex', gap: 6, color: 'var(--tx-faint)' }}>
        <ChamferFrame size={15} c={3}><Zap size={8} /></ChamferFrame>
        <ChamferFrame size={15} c={3}><X size={8} /></ChamferFrame>
      </div>
      <div className="consolebody" ref={bodyRef}>
        {items.map((l) => (
          <div key={l.id} className="cline">
            <span className="ct">{l.t}</span>
            <span className="cg" style={{ color: l.color }}>[{l.tag}]</span>
            <span className="cx" style={l.tag === 'MISSION' ? { color: '#9fe8c4' } : undefined}>{l.text}</span>
          </div>
        ))}
        <div className="cprompt">nova@command:~#<span className="cur" /></div>
      </div>
    </Chamfer>
  );
}

/* ═══════════════ COMMAND BAR ═══════════════ */
function CommandBar() {
  const [cmd, setCmd] = useState('');
  const [flash, setFlash] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [output, setOutput] = useState(null);
  const [agent, setAgent] = useState('NOVA');
  const exec = async () => {
    if (!cmd.trim() || thinking) return;
    const userCmd = cmd.trim();
    const det = detectAgent(userCmd);
    setAgent(det); setCmd(''); setFlash(true);
    setTimeout(() => setFlash(false), 480);
    setThinking(true);
    // push a PROCESSING entry to the live activity feed
    pushActivity({
      t: nowStamp(),
      name: det,
      icon: agentIconFor(det),
      text: `↳ ${summarizeCmd(userCmd)}`,
      status: 'PROCESSING',
    });
    // Stream the sequenced SYSTEM/ROUTER/AGENT/NOVA/UPLINK log lines into
    // the Command Console panel while the API call runs.
    const { ok, reply } = await logNovaCommand(userCmd, det, () => sendToNOVA(userCmd));
    if (ok) {
      setOutput(reply);
      // follow-up entry with the result summary
      pushActivity({
        t: nowStamp(),
        name: det,
        icon: agentIconFor(det),
        text: `✓ ${summarizeCmd(reply, 70)}`,
        status: 'SUCCESS',
      });
    } else {
      setOutput(reply);
      pushActivity({
        t: nowStamp(),
        name: det,
        icon: agentIconFor(det),
        text: '✗ Connection interrupted. Retry.',
        status: 'FAILED',
      });
    }
    setThinking(false);
  };
  return (
    <>
      {[Crosshair, Hexagon, TriangleAlert, CircleX, Aperture, Atom].map((Icon, i) => (
        <SqBtn key={i} x={6 + i * 48} y={961} size={38} c={7} className={i === 0 ? 'hot' : ''}>
          <Icon size={15} />
        </SqBtn>
      ))}

      <div className="cmdwrap" style={{ left: 420, top: 962, width: 710, height: 58 }}
        data-flash={flash || undefined}>
        {/* status ticks left */}
        <div style={{ position: 'absolute', left: 18, top: 8, display: 'flex', gap: 5 }}>
          {['#35e08a', '#ffb443', '#ff9a26'].map((c, i) => (
            <span key={i} style={{ width: 5, height: 5, background: c, boxShadow: `0 0 6px ${c}`, opacity: .9 }} />
          ))}
        </div>
        <div style={{ position: 'absolute', right: 246, top: 8, fontFamily: 'var(--fm)', fontSize: 7, color: 'var(--tx-faint)', letterSpacing: 1.5 }}>
          UPLINK SECURE
        </div>
        <input className="cmdinput" style={{ left: 24, top: 13, width: 428, height: 34 }}
          placeholder="ENTER COMMAND..." value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && exec()} />
        <Chamfer x={468} y={12} w={34} h={34} c={6}>
          <button className="sqbtn" title="Voice input"><Mic size={15} /></button>
        </Chamfer>
        <button className="execbtn" style={{ left: 512, top: 9, width: 186, height: 40, clipPath: cutPoly(8) }}
          onClick={exec} disabled={thinking}>{thinking ? 'PROCESSING...' : 'EXECUTE'}</button>
        <Brackets />
      </div>

      {CMD_CHIPS.map((c, i) => (
        <Chamfer key={c} x={1176 + i * 78} y={974} w={70} h={34} c={6}>
          <button className="sqbtn" style={{ fontFamily: 'var(--fm)', fontSize: 8.5, letterSpacing: 1, color: 'var(--tx-dim)' }}>{c}</button>
        </Chamfer>
      ))}
      {output && <NOVAOutputModal output={output} agent={agent} onClose={() => setOutput(null)} />}
    </>
  );
}

/* ═══════════════ ROOT ═══════════════ */
function DesktopNOVA() {
  const vpRef = useRef(null);
  const [activeNav, setActiveNav] = useState('dashboard');

  useEffect(() => {
    const el = vpRef.current;
    const set = () => {
      const s = Math.min(window.innerWidth / 1564, window.innerHeight / 1036);
      el.style.setProperty('--s', s);
    };
    set();
    window.addEventListener('resize', set);
    return () => window.removeEventListener('resize', set);
  }, []);

  return (
    <div className="viewport" ref={vpRef}>
      <div className="design">
        <div className="backdrop grid" />
        <div className="backdrop vignette" />
        <TopBar />
        <LeftRail activeNav={activeNav} setActiveNav={setActiveNav} />
        <Stage />
        <FeedPanel />
        <ApisPanel />
        <PerfPanel />
        <ProjectsPanel />
        <TasksPanel />
        <WorldMapPanel />
        <ConsolePanel />
        <CommandBar />
        <div className="backdrop scan" />
      </div>
    </div>
  );
}

/* ═══════════════ MOBILE NOVA COMMAND DEVICE ═══════════════ */
const ALL_AGENTS = [...AGENTS_LEFT, ...AGENTS_RIGHT];
/* Bottom navigation is 5 items as specified: HOME, AI TEAM, PROJECTS, TASKS, MORE.
   MORE jumps to the start of the extended sections (APIs + feed + perf + network) */
const MOBILE_NAV = [
  { id: 'home', target: 'mobile-home', icon: 'layout-grid', label: 'HOME' },
  { id: 'team', target: 'mobile-team', icon: 'users', label: 'AI TEAM' },
  { id: 'projects', target: 'mobile-projects', icon: 'clipboard-list', label: 'PROJECTS' },
  { id: 'tasks', target: 'mobile-tasks', icon: 'list-todo', label: 'TASKS' },
  { id: 'more', target: 'mobile-apis', icon: 'settings', label: 'MORE' },
];

function useIsMobile() {
  const get = () => (typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isMobile, setIsMobile] = useState(get);
  useEffect(() => {
    const onResize = () => setIsMobile(get());
    onResize();
    window.addEventListener('resize', onResize);
    // also listen to media query for robustness
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = () => setIsMobile(mq.matches);
    try { mq.addEventListener('change', handler); } catch { mq.addListener(handler); }
    return () => {
      window.removeEventListener('resize', onResize);
      try { mq.removeEventListener('change', handler); } catch { mq.removeListener(handler); }
    };
  }, []);
  return isMobile;
}

function MobilePanel({ id, className = '', children, c = 12, onClick, role, tabIndex, style }) {
  const clip = cutPoly(c);
  return (
    <section id={id} className={`mobile-panel ${className}`} style={{ clipPath: clip, ...style }} onClick={onClick} role={role} tabIndex={tabIndex}>
      <div className="mobile-panel-inner" style={{ clipPath: cutPoly(Math.max(1, c - 1)) }}>
        {children}
      </div>
    </section>
  );
}

function MobileSectionHeader({ title, eyebrow, action }) {
  return (
    <div className="mobile-section-head">
      <div>
        {eyebrow && <div className="mobile-eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
      </div>
      {action && <span className="mobile-head-action">{action}<ChevronRight size={11} /></span>}
    </div>
  );
}

function TinyActivityGraph({ seed, w = 78, h = 24, className = '' }) {
  const pts = useMemo(() => series(20, seed, 0.15, 0.9, 0.38), [seed]);
  const step = w / (pts.length - 1);
  const line = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - v * h).toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={`mobile-tiny-graph ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={`tinyFill${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9a26" stopOpacity=".22" />
          <stop offset="1" stopColor="#ff9a26" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#tinyFill${seed})`} />
      <path d={line} fill="none" stroke="#ffb443" strokeOpacity=".82" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      <circle cx={w - 2} cy={(h - pts[pts.length - 1] * h).toFixed(1)} r="2" fill="#ffe3ae" opacity=".9" />
    </svg>
  );
}

function MobileTopBar({ onProfile }) {
  return (
    <header className="mobile-topbar">
      <div className="mobile-logo-cluster">
        <div className="mobile-logo-mark" aria-hidden="true">
          <svg viewBox="0 0 46 46" fill="none">
            <circle cx="23" cy="23" r="21.5" stroke="#6b451c" strokeWidth="1" />
            <circle cx="23" cy="23" r="21.5" stroke="#ffb443" strokeWidth="1.4" strokeDasharray="26 110" strokeLinecap="round" />
            <circle cx="23" cy="23" r="16" stroke="#4a3015" strokeWidth="1" strokeDasharray="2 4" />
            <circle cx="23" cy="23" r="3.2" stroke="#ffb443" strokeWidth="1.2" />
            <circle cx="23" cy="23" r="1" fill="#ffdf9e" />
            <path d="M23 1.5 v6 M23 38.5 v6 M1.5 23 h6 M38.5 23 h6" stroke="#8a5a20" strokeWidth="1.2" />
          </svg>
        </div>
        <div className="mobile-logo-copy">
          <div className="mobile-logo-word">NOVA</div>
          <div className="mobile-logo-sub">AI OPERATIONS</div>
        </div>
      </div>
      <div className="mobile-top-actions">
        <div className="mobile-online-pill"><i />ONLINE</div>
        <button className="mobile-icon-button" title="Notifications" type="button">
          <Bell size={16} /><span>3</span>
        </button>
        <button className="mobile-profile-button" title="Commander" type="button" onClick={onProfile}>
          <HoloAvatar size={30} />
        </button>
      </div>
    </header>
  );
}

function MobileCommanderCard({ expanded, onToggle }) {
  return (
    <MobilePanel className={`mobile-commander ${expanded ? 'is-expanded' : ''}`} c={14} onClick={onToggle} role="button" tabIndex={0}>
      <div className="mobile-commander-avatar"><HoloAvatar size={74} /></div>
      <div className="mobile-commander-copy">
        <div className="mobile-kicker">COMMANDER</div>
        <div className="mobile-commander-name">ANWAAR</div>
        <div className="mobile-commander-rank">MASTER CONTROL</div>
        <div className="mobile-status-line"><i />ONLINE</div>
      </div>
      <div className="mobile-commander-side">
        <span>AUTH 01</span>
        <ChevronRight size={14} />
      </div>
      {expanded && (
        <div className="mobile-card-reveal">
          <span>COMMAND PRIVILEGES: ROOT</span>
          <span>NOVA LINK: ENCRYPTED</span>
          <span>VOICE PRINT: VERIFIED</span>
        </div>
      )}
      <Brackets />
    </MobilePanel>
  );
}

function MobileCoreViz() {
  const ticks = [];
  for (let i = 0; i < 96; i++) {
    const a = (i * 3.75) * Math.PI / 180;
    const major = i % 8 === 0;
    const r1 = 143;
    const r2 = major ? 153 : 148;
    ticks.push(
      <line key={i}
        x1={170 + r1 * Math.cos(a)} y1={170 + r1 * Math.sin(a)}
        x2={170 + r2 * Math.cos(a)} y2={170 + r2 * Math.sin(a)}
        stroke={major ? '#e08a2e' : '#8a5a20'} strokeOpacity={major ? .8 : .44}
        strokeWidth={major ? 1.25 : .75} />
    );
  }
  const particles = useMemo(() => {
    const r = mulberry32(122);
    return Array.from({ length: 58 }).map((_, i) => {
      const a = r() * Math.PI * 2;
      const dist = 48 + r() * 114;
      return { i, x: 170 + Math.cos(a) * dist, y: 170 + Math.sin(a) * dist, s: r() < .18 ? 1.8 : 1.1, o: .18 + r() * .62 };
    });
  }, []);
  const nodes = [18, 64, 112, 160, 210, 258, 310].map((deg) => {
    const a = deg * Math.PI / 180;
    return { x: 170 + 128 * Math.cos(a), y: 170 + 128 * Math.sin(a), deg };
  });
  return (
    <svg className="mobile-core-svg" viewBox="0 0 340 340" aria-hidden="true">
      <defs>
        <radialGradient id="mAmb" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ff8a12" stopOpacity=".24" />
          <stop offset=".42" stopColor="#ff8a12" stopOpacity=".10" />
          <stop offset="1" stopColor="#ff8a12" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mCoreFill" cx=".5" cy=".45" r=".62">
          <stop offset="0" stopColor="#211004" />
          <stop offset=".6" stopColor="#0d0602" />
          <stop offset="1" stopColor="#030100" />
        </radialGradient>
        <linearGradient id="mFlameGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe0a6" />
          <stop offset=".45" stopColor="#ff9a26" />
          <stop offset="1" stopColor="#e05e00" />
        </linearGradient>
        <filter id="mSoft6"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id="mSoft2"><feGaussianBlur stdDeviation="1.5" /></filter>
      </defs>
      <circle cx="170" cy="170" r="166" fill="url(#mAmb)" />
      <g className="m-spin-slow">
        <circle cx="170" cy="170" r="158" fill="none" stroke="#b06a1e" strokeOpacity=".34" strokeWidth="1" strokeDasharray="1 9" />
        <circle cx="170" cy="170" r="151" fill="none" stroke="#c07a28" strokeOpacity=".52" strokeWidth="1.1" strokeDasharray="38 18 5 18" />
      </g>
      {ticks}
      <circle cx="170" cy="170" r="130" fill="none" stroke="#6e451a" strokeOpacity=".52" strokeWidth="1" />
      <g className="m-spin-rev">
        <circle cx="170" cy="170" r="112" fill="none" stroke="#cf862f" strokeOpacity=".58" strokeWidth="1.1" strokeDasharray="52 32 7 32" />
        <circle cx="170" cy="170" r="98" fill="none" stroke="#a06824" strokeOpacity=".5" strokeWidth="1" strokeDasharray="4 8" />
      </g>
      <circle cx="170" cy="170" r="78" fill="none" stroke="#7a4d1c" strokeOpacity=".65" strokeWidth="1" strokeDasharray="1 3" />
      {nodes.map((n, i) => (
        <g key={i} className="mobile-radial-node">
          <line x1="170" y1="170" x2={n.x} y2={n.y} stroke="#ff9a26" strokeOpacity=".18" strokeWidth="1" />
          <circle cx={n.x} cy={n.y} r="4.4" fill="#ff9a26" opacity=".22" />
          <circle cx={n.x} cy={n.y} r="1.8" fill="#ffdf9e" opacity=".92" />
        </g>
      ))}
      {particles.map((p) => <circle key={p.i} cx={p.x} cy={p.y} r={p.s} fill="#ffd9a0" opacity={p.o} className="mobile-particle" />)}
      <circle cx="170" cy="170" r="56" fill="none" stroke="#ff8310" strokeOpacity=".5" strokeWidth="12" filter="url(#mSoft6)" />
      <circle cx="170" cy="170" r="56" fill="none" stroke="url(#mFlameGrad)" strokeWidth="6" />
      <circle cx="170" cy="170" r="56" fill="none" stroke="#ffe6b8" strokeOpacity=".82" strokeWidth="2.2" filter="url(#mSoft2)" />
      <circle cx="170" cy="170" r="51" fill="url(#mCoreFill)" stroke="#ffd9a0" strokeOpacity=".58" strokeWidth="1" />
      <g className="m-spin-core">
        <path d="M170 132 A38 38 0 0 1 208 170" fill="none" stroke="#ff9a26" strokeOpacity=".32" strokeWidth="1" />
        <path d="M170 208 A38 38 0 0 1 132 170" fill="none" stroke="#ff9a26" strokeOpacity=".32" strokeWidth="1" />
        <circle cx="208" cy="170" r="1.8" fill="#ffdf9e" opacity=".85" />
        <circle cx="132" cy="170" r="1.8" fill="#ffdf9e" opacity=".85" />
      </g>
      <line x1="170" x2="170" y1="226" y2="314" stroke="#ffc24d" strokeOpacity=".42" strokeWidth="1.4" />
      <ellipse cx="170" cy="314" rx="58" ry="10" fill="none" stroke="#ffb443" strokeOpacity=".32" />
      <ellipse cx="170" cy="314" rx="30" ry="5" fill="none" stroke="#ffedc4" strokeOpacity=".55" />
    </svg>
  );
}

function MobileCorePanel() {
  return (
    <MobilePanel className="mobile-core-panel" c={16}>
      <div className="mobile-core-label">NOVA CORE</div>
      <div className="mobile-core-stage">
        <MobileCoreViz />
        <div className="mobile-core-title">
          <div className="n">NOVA</div>
          <div className="r">MASTER AI ORCHESTRATOR</div>
          <div className="st"><i />ONLINE</div>
        </div>
        <span className="mobile-core-readout left">AGENT BUS<br />24 ONLINE</span>
        <span className="mobile-core-readout right">CORE TEMP<br />OPTIMAL</span>
      </div>
      <Brackets />
    </MobilePanel>
  );
}

function MobileMetrics() {
  return (
    <MobilePanel className="mobile-metrics" c={12}>
      <MobileSectionHeader title="MISSION METRICS" />
      <div className="mobile-metric-grid">
        {STATS.map((s) => (
          <div key={s.label} className="mobile-metric-card">
            <span className="metric-ic"><Ic name={s.icon} size={19} /></span>
            <div className="metric-value">{s.value}</div>
            <div className="metric-label">{s.label}</div>
          </div>
        ))}
      </div>
    </MobilePanel>
  );
}

function MobileAgentCard({ agent, seed, onOpen }) {
  return (
    <button type="button" className="mobile-agent-card" onClick={() => onOpen(agent)}>
      <span className="mobile-agent-icon"><ChamferFrame size={38} c={5}><Ic name={agent.icon} size={17} /></ChamferFrame></span>
      <div className="mobile-agent-main">
        <div className="mobile-agent-name">{agent.name}</div>
        <div className="mobile-agent-role">{agent.role}</div>
        <div className="mobile-agent-online"><i />ONLINE</div>
      </div>
      <div className="mobile-agent-telemetry">
        <div className="mobile-agent-pct">{agent.pct}%</div>
        <TinyActivityGraph seed={seed} />
      </div>
    </button>
  );
}

function MobileAgentModal({ agent, onClose }) {
  if (!agent) return null;
  return (
    <div className="mobile-modal" onClick={onClose}>
      <div className="mobile-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mobile-modal-close" onClick={onClose}><X size={16} /></button>
        <div className="mobile-modal-head">
          <ChamferFrame size={54} c={8}><Ic name={agent.icon} size={24} /></ChamferFrame>
          <div>
            <div className="mobile-kicker">AI AGENT DETAIL</div>
            <div className="mobile-modal-title">{agent.name}</div>
            <div className="mobile-modal-sub">{agent.role}</div>
          </div>
        </div>
        <div className="mobile-detail-grid">
          <div><span>STATUS</span><b className="green">ONLINE</b></div>
          <div><span>PERFORMANCE</span><b>{agent.pct}%</b></div>
          <div><span>LATENCY</span><b>12ms</b></div>
          <div><span>QUEUE</span><b>ACTIVE</b></div>
        </div>
        <TinyActivityGraph seed={agent.pct * 13} w={300} h={54} className="mobile-modal-graph" />
        <div className="mobile-modal-note">NOVA has this specialist linked to the encrypted AI communication bus and ready for direct command routing.</div>
      </div>
    </div>
  );
}

function MobileTeamSection({ onOpenAgent }) {
  return (
    <MobilePanel id="mobile-team" className="mobile-team-section" c={12}>
      <MobileSectionHeader title="AI TEAM" eyebrow="OVERVIEW" action="SWIPE" />
      <div className="mobile-agent-carousel" aria-label="AI Team carousel">
        {ALL_AGENTS.map((agent, i) => <MobileAgentCard key={agent.name} agent={agent} seed={140 + i * 17} onOpen={onOpenAgent} />)}
      </div>
      <div className="mobile-carousel-hint"><span /> ALL 12 SPECIALISTS ONLINE</div>
    </MobilePanel>
  );
}

function MobileProjects({ expanded, onToggle }) {
  return (
    <MobilePanel id="mobile-projects" className="mobile-projects" c={12}>
      <MobileSectionHeader title="ACTIVE PROJECTS" action="DASHBOARDS" />
      <div className="mobile-project-list">
        {PROJECTS.map((p) => (
          <button type="button" key={p.name} className={`mobile-project-row ${expanded === p.name ? 'expanded' : ''}`} onClick={() => onToggle(expanded === p.name ? null : p.name)}>
            <span className="mobile-row-icon"><ChamferFrame size={32} c={5}><Ic name={p.icon} size={14} /></ChamferFrame></span>
            <span className="mobile-project-copy">
              <b>{p.name}</b>
              <small>{p.type}</small>
              <span className="mobile-progress"><i style={{ width: `${p.pct}%` }} /></span>
            </span>
            <span className="mobile-project-pct">{p.pct}%</span>
            <ChevronRight className="mobile-expand-chevron" size={14} />
            {expanded === p.name && (
              <span className="mobile-project-detail">
                <span>PROJECT DASHBOARD ONLINE</span>
                <span>LEAD AGENT: {p.pct > 80 ? 'CODEX' : p.pct > 55 ? 'ARCHITECT' : 'DESIGNER'}</span>
                <span>DEPLOYMENT CHANNEL: SECURE</span>
              </span>
            )}
          </button>
        ))}
      </div>
    </MobilePanel>
  );
}

function MobileTasks() {
  return (
    <MobilePanel id="mobile-tasks" className="mobile-tasks" c={12}>
      <MobileSectionHeader title="TASK QUEUE" action="LIVE" />
      <div className="mobile-task-list">
        {TASKS.map((t) => (
          <div key={t.title} className="mobile-task-row">
            <span className="mobile-row-icon compact"><ChamferFrame size={26} c={5}><Ic name={t.icon} size={12} /></ChamferFrame></span>
            <span className="mobile-task-copy">
              <b>{t.title}</b>
              <small>ASSIGNED AI: {t.agent}</small>
              <span className="mobile-progress"><i style={{ width: `${t.pct}%` }} /></span>
            </span>
            <span className="mobile-task-pct">{t.pct}%</span>
          </div>
        ))}
      </div>
    </MobilePanel>
  );
}

function MobileApis({ expanded, onToggle }) {
  return (
    <MobilePanel id="mobile-apis" className="mobile-apis" c={12}>
      <MobileSectionHeader title="API INTEGRATIONS" action="EXPAND" />
      <div className="mobile-api-list">
        {APIS.map((api) => (
          <button type="button" key={api.name} className={`mobile-api-row ${expanded === api.name ? 'expanded' : ''}`} onClick={() => onToggle(expanded === api.name ? null : api.name)}>
            <span className="mobile-api-logo"><BrandLogo kind={api.logo} /></span>
            <span className="mobile-api-copy">
              <b>{api.name}</b>
              <small>{api.sub}</small>
              <span className="mobile-progress"><i style={{ width: `${api.pct}%` }} /></span>
            </span>
            <span className="mobile-api-usage"><b>{api.pct}%</b><small>{api.usage}</small></span>
            <ChevronRight className="mobile-expand-chevron" size={14} />
            {expanded === api.name && (
              <span className="mobile-api-detail">
                <span>AUTH: ENCRYPTED TOKEN VAULT</span>
                <span>RATE LIMIT: NOMINAL</span>
                <span>NOVA ROUTING: ENABLED</span>
              </span>
            )}
          </button>
        ))}
      </div>
    </MobilePanel>
  );
}

function MobileFeed() {
  const items = useNovaActivity();
  return (
    <MobilePanel className="mobile-feed" c={12}>
      <MobileSectionHeader title="LIVE ACTIVITY FEED" action="SCROLL" />
      <div className="mobile-feed-list">
        {items.map((f, i) => (
          <div key={`${f.t}-${f.name}-${i}`} className="mobile-feed-row">
            <span className="mobile-feed-time">{f.t}</span>
            <span className="mobile-feed-node"><Ic name={f.icon} size={12} /></span>
            <span className="mobile-feed-copy"><b>{f.name}</b><small>{f.text}</small></span>
            <span className="mobile-feed-ok" style={{ color: f.status === 'PROCESSING' ? '#ffb443' : f.status === 'FAILED' ? '#ff6a4a' : undefined }}>{f.status || 'SUCCESS'}</span>
          </div>
        ))}
      </div>
    </MobilePanel>
  );
}

function MobilePerformance() {
  const ranges = {
    'CPU USAGE': [.1, .62],
    'MEMORY USAGE': [.3, .75],
    'NETWORK I/O': [.45, .9],
    'DISK I/O': [.5, .92],
  };
  return (
    <MobilePanel id="mobile-more" className="mobile-performance" c={12}>
      <MobileSectionHeader title="SYSTEM PERFORMANCE" action="24H" />
      <div className="mobile-performance-grid">
        {PERF.map((m) => {
          const label = m.label.replace(' USAGE', '').replace(' I/O', '');
          const [lo, hi] = ranges[m.label] || [.2, .8];
          return (
            <div key={m.label} className="mobile-perf-card">
              <div className="mobile-perf-head"><span>{label}</span><b>{m.pct}%</b></div>
              <PerfChart seed={m.seed} lo={lo} hi={hi} />
            </div>
          );
        })}
      </div>
    </MobilePanel>
  );
}

function MobileWorldMap() {
  const hubs = useMemo(() => Object.fromEntries(HUBS.map((h) => [h.id, { x: lon2x(h.lon), y: lat2y(h.lat) }])), []);
  return (
    <MobilePanel className="mobile-world" c={12}>
      <MobileSectionHeader title="GLOBAL NETWORK" />
      <svg viewBox="0 0 100 44" className="mobile-world-map" preserveAspectRatio="xMidYMid meet" aria-label="Holographic global network map">
        <defs>
          <linearGradient id="mobileArcGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ff9a26" stopOpacity=".1" />
            <stop offset=".5" stopColor="#ffc24d" stopOpacity=".95" />
            <stop offset="1" stopColor="#ff9a26" stopOpacity=".1" />
          </linearGradient>
        </defs>
        {MAP_DOTS.map((row, gy) => row.split('').map((ch, gx) => {
          if (ch !== 'O') return null;
          const h = (gx * 7 + gy * 13) % 19;
          return <circle key={`${gx}-${gy}`} cx={gx + .5} cy={gy + 2.5} r={h === 0 ? .52 : .4} fill="#ff9a26" opacity={h === 0 ? .95 : h < 4 ? .58 : .32} />;
        }))}
        {ARCS.map(([a, b], i) => {
          const p = hubs[a], q = hubs[b];
          const mx = (p.x + q.x) / 2;
          const my = (p.y + q.y) / 2 + 2;
          const d = Math.hypot(q.x - p.x, q.y - p.y);
          return <path key={i} d={`M${p.x} ${p.y + 2} Q${mx} ${my - d * 0.22} ${q.x} ${q.y + 2}`} fill="none" stroke="url(#mobileArcGrad)" strokeWidth=".5" strokeDasharray="2.6 1.8" className="mobile-arc" />;
        })}
        {HUBS.map((h) => {
          const p = hubs[h.id];
          return <g key={h.id}><circle cx={p.x} cy={p.y + 2} r="3.2" fill="#ff9a26" opacity=".26" /><circle cx={p.x} cy={p.y + 2} r="1.3" fill="#ffc24d" opacity=".88" /><circle cx={p.x} cy={p.y + 2} r=".55" fill="#fff2cf" /></g>;
        })}
      </svg>
      <div className="mobile-network-stats">
        <div><span>ACTIVE NODES</span><b>67</b></div>
        <div><span>DATA TRANSFER</span><b>2.4<small> TB/s</small></b></div>
        <div><span>UPTIME</span><b>99.98%</b></div>
      </div>
    </MobilePanel>
  );
}

function MobileCommandConsole() {
  const [cmd, setCmd] = useState('');
  const [executed, setExecuted] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [output, setOutput] = useState(null);
  const [agent, setAgent] = useState('NOVA');
  const exec = async () => {
    if (!cmd.trim() || thinking) return;
    const userCmd = cmd.trim();
    const det = detectAgent(userCmd);
    setAgent(det); setCmd('');
    setExecuted(true); setThinking(true);
    pushActivity({
      t: nowStamp(),
      name: det,
      icon: agentIconFor(det),
      text: `↳ ${summarizeCmd(userCmd)}`,
      status: 'PROCESSING',
    });
    // Stream sequenced log lines into the shared console log bus (same one
    // the desktop Command Console subscribes to).
    const { ok, reply } = await logNovaCommand(userCmd, det, () => sendToNOVA(userCmd));
    if (ok) {
      setOutput(reply);
      pushActivity({
        t: nowStamp(),
        name: det,
        icon: agentIconFor(det),
        text: `✓ ${summarizeCmd(reply, 70)}`,
        status: 'SUCCESS',
      });
    } else {
      setOutput(reply);
      pushActivity({
        t: nowStamp(),
        name: det,
        icon: agentIconFor(det),
        text: '✗ Connection interrupted. Retry.',
        status: 'FAILED',
      });
    }
    setThinking(false);
    setTimeout(() => setExecuted(false), 1200);
  };
  return (
    <div className={`mobile-command-console ${executed ? 'executed' : ''}`}>
      <div className="mobile-console-status">
        <span><i />NOVA COMMAND LINK</span>
        <small>{executed ? 'COMMAND ACCEPTED' : 'UPLINK SECURE'}</small>
      </div>
      <div className="mobile-console-input-row">
        <input value={cmd} onChange={(e) => setCmd(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && exec()} placeholder="ENTER COMMAND..." aria-label="Enter command" />
        <button type="button" className="mobile-mic" title="Voice command"><Mic size={17} /></button>
        <button type="button" className="mobile-execute" onClick={exec} disabled={thinking}>{thinking ? 'PROCESSING...' : 'EXECUTE'}</button>
      </div>
      {output && <NOVAOutputModal output={output} agent={agent} onClose={() => setOutput(null)} />}
    </div>
  );
}

function MobileBottomNav({ active, onNav }) {
  return (
    <nav className="mobile-bottom-nav" aria-label="NOVA mobile navigation">
      {MOBILE_NAV.map((n) => (
        <button key={n.id} type="button" className={active === n.id ? 'active' : ''} onClick={() => onNav(n)}>
          <Ic name={n.icon} size={16} />
          <span>{n.label}</span>
        </button>
      ))}
    </nav>
  );
}

function MobileNOVA() {
  const [activeNav, setActiveNav] = useState('home');
  const [activeAgent, setActiveAgent] = useState(null);
  const [expandedProject, setExpandedProject] = useState(null);
  const [expandedApi, setExpandedApi] = useState(null);
  const [commanderOpen, setCommanderOpen] = useState(false);

  const go = (nav) => {
    setActiveNav(nav.id);
    document.getElementById(nav.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mobile-viewport">
      <div className="mobile-backdrop mobile-grid" />
      <div className="mobile-backdrop mobile-vignette" />
      <div className="mobile-backdrop mobile-scan" />
      <MobileTopBar onProfile={() => setCommanderOpen((v) => !v)} />
      <main className="mobile-content" id="mobile-home">
        <MobileCommanderCard expanded={commanderOpen} onToggle={() => setCommanderOpen((v) => !v)} />
        <MobileCorePanel />
        <MobileMetrics />
        <MobileTeamSection onOpenAgent={setActiveAgent} />
        <MobileProjects expanded={expandedProject} onToggle={setExpandedProject} />
        <MobileTasks />
        <MobileApis expanded={expandedApi} onToggle={setExpandedApi} />
        <MobileFeed />
        <MobilePerformance />
        <MobileWorldMap />
      </main>
      <MobileCommandConsole />
      <MobileBottomNav active={activeNav} onNav={go} />
      <MobileAgentModal agent={activeAgent} onClose={() => setActiveAgent(null)} />
    </div>
  );
}

export default function App() {
  return useIsMobile() ? <MobileNOVA /> : <DesktopNOVA />;
}
