import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutGrid, Users, ClipboardList, ListTodo, Hexagon, Database, ChartColumn, Workflow,
  Settings, Network, Activity, Bell, Atom, Power, ChevronRight, CodeXml, Bug, Box,
  Infinity as InfinityIcon, ShieldCheck, PenLine, PenTool, ClipboardCheck, Target, Gauge,
  Mic, Crosshair, TriangleAlert, CircleX, Aperture, Globe, Rocket, Search, FileText,
  X, Zap, Check, Asterisk, Send, Download, Sparkles, History, Trash2, Clock,
} from 'lucide-react';
import { MAP_DOTS } from './dots.js';
import {
  STATS, NAV, SYS_STATUS, AGENTS_LEFT, AGENTS_RIGHT, FEED, APIS, PERF,
  PROJECTS, TASKS, CONSOLE_LINES, CMD_CHIPS, QUICK_PROMPTS, HUBS, ARCS,
} from './data.js';

const ICONS = {
  'layout-grid': LayoutGrid, 'users': Users, 'clipboard-list': ClipboardList, 'list-todo': ListTodo,
  'hexagon': Hexagon, 'database': Database, 'chart-column': ChartColumn, 'workflow': Workflow,
  'settings': Settings, 'network': Network, 'activity': Activity, 'bell': Bell, 'atom': Atom,
  'code-xml': CodeXml, 'bug': Bug, 'box': Box, 'infinity': InfinityIcon, 'shield-check': ShieldCheck,
  'pen-line': PenLine, 'pen-tool': PenTool, 'clipboard-check': ClipboardCheck, 'target': Target,
  'gauge': Gauge, 'globe': Globe, 'rocket': Rocket, 'search': Search, 'file-text': FileText,
  'history': History, 'clock': Clock, 'trash': Trash2,
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
  if (/(image|generate image|create image|picture|photo|thumbnail image|visual)/.test(t)) return 'IMAGE';
  return 'NOVA';
}

// Global message history for context
const novaHistory = [];

/* ═══════════════ PERSISTENT HISTORY (localStorage) ═══════════════ */
// Append-only ring of recent commands + their responses, capped at 50
// entries. Persists across sessions via `localStorage` under the key
// `nova_history` so the user can review past conversations and so
// NOVA's API context (novaHistory, below) is seeded with recent
// exchanges on app load.
const HISTORY_KEY = 'nova_history';
const MAX_HISTORY = 50;
const RESTORE_TO_CONTEXT = 10;

// In-memory copy of the persistent history. Initialized from localStorage
// at module load. Replaced whenever a new entry is pushed.
let _history = loadHistoryFromStorage();

function loadHistoryFromStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && typeof e === 'object'
        && typeof e.timestamp === 'number'
        && typeof e.cmd === 'string'
        && typeof e.response === 'string')
      .slice(-MAX_HISTORY);
  } catch {
    return [];
  }
}

function saveHistoryToStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(_history));
  } catch {
    // Ignore quota / serialization errors — the in-memory ring still works.
  }
}

// Pub/sub so React components re-render when the ring changes.
const _historySubs = new Set();
const _emitHistory = () => _historySubs.forEach((fn) => fn(_history));

/* Push a completed command/response into the history. The agent name is
   stored so the History view can show the right agent icon. */
function pushHistoryEntry(cmd, agent, response) {
  if (!cmd || !response) return;
  const entry = {
    timestamp: Date.now(),
    cmd: String(cmd),
    agent: String(agent || 'NOVA'),
    response: String(response),
  };
  _history = [..._history, entry].slice(-MAX_HISTORY);
  saveHistoryToStorage();
  _emitHistory();
}

/* Remove every entry — both the in-memory ring and the localStorage key. */
function clearHistory() {
  _history = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try { window.localStorage.removeItem(HISTORY_KEY); } catch {}
  }
  _emitHistory();
}

/* Seed the AI context (novaHistory) with the last N exchanges. Called
   once at module load so NOVA "remembers" recent conversations across
   page reloads. */
function restoreToNovaContext() {
  const recent = _history.slice(-RESTORE_TO_CONTEXT);
  // Walk backwards so the oldest pair lands first and the newest is at
  // the end (Claude expects a chronological message array).
  for (let i = 0; i < recent.length; i++) {
    const e = recent[i];
    novaHistory.push({ role: 'user', content: e.cmd });
    novaHistory.push({ role: 'assistant', content: e.response });
  }
}

/* React hook: subscribes a component to the history ring. */
function useNovaHistory() {
  const [items, setItems] = useState(_history);
  useEffect(() => {
    const sub = (next) => setItems(next);
    _historySubs.add(sub);
    return () => { _historySubs.delete(sub); };
  }, []);
  return items;
}

// Seed the AI's context from the persisted history on module load. The
// most recent 10 exchanges (20 messages: 10 user + 10 assistant) are
// pushed so the next API call has conversational continuity.
restoreToNovaContext();

/* ═══════════════ WEEKLY REPORT INJECTION ═══════════════ */
// Heuristic: does this command look like a weekly / Monday briefing ask?
// Matches "weekly report", "monday morning briefing", "monday brief",
// "week ahead", "state of the union", and a bare "report" (in the context
// of a status / weekly ask — not e.g. "bug report").
const WEEKLY_KEYWORDS = /\b(weekly\s*report|monday\s*(morning\s*)?brief(ing)?|week\s*ahead|week\s*brief|monday\s*brief|monday\s*memo|state\s*of\s*the\s*union)\b/i;
const BARE_REPORT_RE = /^\s*(give\s+me\s+|run\s+|do\s+|start\s+|show\s+me\s+)?(the\s+)?(weekly\s+)?report\s*[\.!]?\s*$/i;

function isWeeklyReport(text) {
  if (!text) return false;
  const t = String(text).toLowerCase().trim();
  if (WEEKLY_KEYWORDS.test(t)) return true;
  // Bare "report" — only when the message is short (otherwise "bug report",
  // "write a report", etc. would false-positive).
  if (t.length <= 40 && BARE_REPORT_RE.test(t)) return true;
  return false;
}

/* Specialized system prompt for the weekly briefing. Asks the model to
   produce a deterministic three-section format that the parser can
   reliably slice into the cards the modal renders. The wording here is
   deliberate so the section headers come out verbatim. */
const WEEKLY_REPORT_PROMPT = `${SYSTEM_PROMPT}

You are now drafting NOVA's Monday morning briefing for Anwaar. Keep the
JARVIS tone — calm, precise, action-oriented — but format the response
as a clean structured report. Use EXACTLY these section headers, in this
order, each on its own line:

SCHOLARICS WEEKLY:
- SEO health assessment: 1 sentence, honest and specific
- Top 3 content opportunities: numbered 1, 2, 3 — one short headline each
- 3 keywords to target: comma-separated on one line
- AdSense optimization tip: 1 sentence
- Recommended blog post topic: 1 short headline + 1 sentence why

ROOTED WEEKLY:
- Launch readiness status: 1 sentence (e.g. "90% ready — blocked on X")
- Top 3 content ideas for target market (USA / UK / Canada / Australia): numbered
- Pinterest strategy tip: 1-2 sentences — Pinterest is the most important channel for parenting
- SEO preparation checklist item: 1 concrete task for this week

THIS WEEK PRIORITIES:
- #1 most important action: 1 sentence, decisive
- Biggest opportunity right now: 1 sentence
- One thing to stop doing: 1 sentence

End with: "Anything else on this, Anwaar?"`;

/* ═══════════════ MULTI-AI ROUTER · CLOUDFLARE WORKER PROXY ═══════════════ */
// All API keys live in a Cloudflare Worker's environment variables — never
// in the client bundle. The frontend only talks to the Worker, which injects
// the key server-side before forwarding the request to the provider. This
// keeps secrets out of the built JavaScript (so GitHub secret scanning no
// longer blocks the deploy).
const WORKER_URL = "https://nova-ai-proxy.qazi-anwaar1996.workers.dev";

/* ── Provider call helpers ──────────────────────────────────────
   Each helper posts to the Worker proxy, which injects the API key
   server-side and returns the provider's JSON response. On success it
   returns the model's text reply.                                */

async function callGemini(prompt, systemPrompt) {
  const res = await fetch("https://nova-ai-proxy.qazi-anwaar1996.workers.dev/gemini", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      contents: [{parts: [{text: prompt}]}],
      systemInstruction: {parts: [{text: systemPrompt}]},
      // Keep the first answer fast enough for the command-center UI. The
      // Worker forwards this Gemini generationConfig unchanged.
      generationConfig: { maxOutputTokens: 800 }
    })
  });
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini";
}

async function callGroq(prompt, systemPrompt) {
  const res = await fetch("https://nova-ai-proxy.qazi-anwaar1996.workers.dev/groq", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {role: "system", content: systemPrompt},
        {role: "user", content: prompt}
      ],
      max_tokens: 1000
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response from Groq";
}

async function callMistral(prompt, systemPrompt) {
  const res = await fetch("https://nova-ai-proxy.qazi-anwaar1996.workers.dev/mistral", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      model: "mistral-small-latest",
      messages: [
        {role: "system", content: systemPrompt},
        {role: "user", content: prompt}
      ],
      max_tokens: 1000
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response from Mistral";
}

/* Pollinations AI image generation — FREE, no API key required.
   Returns a direct image URL that <img> tags load cross-origin. */
async function generateImage(prompt) {
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true`;
  return url;
}

/* Human-readable label for the primary model each agent routes to.
   Shown in the output modal header ("powered by …"). */
function modelForAgent(agent) {
  const a = (agent || '').toUpperCase();
  if (a === 'IMAGE') return 'Pollinations AI';
  if (a.includes('SEO')) return 'NOVA AI Proxy';
  if (a.includes('CONTENT')) return 'NOVA AI Proxy';
  if (a.includes('SOCIAL')) return 'NOVA AI Proxy';
  if (a.includes('YOUTUBE')) return 'NOVA AI Proxy';
  if (a.includes('EMAIL')) return 'NOVA AI Proxy';
  if (a.includes('ANALYTICS')) return 'NOVA AI Proxy';
  if (a.includes('MONITOR')) return 'NOVA AI Proxy';
  if (a.includes('IDEAS')) return 'NOVA AI Proxy';
  if (a.includes('MARKETS')) return 'NOVA AI Proxy';
  if (a.includes('MONETIZE')) return 'NOVA AI Proxy';
  return 'NOVA AI Proxy';
}

/* ═══════════════ MAIN ROUTER · sendToNOVA ═══════════════ */
// Smart routing: each agent is dispatched to the AI best suited for the
// task, with a fallback chain so a single down/key-less provider never
// breaks the whole command center. IMAGE requests skip the LLMs entirely
// and go straight to Pollinations image generation. The weekly briefing
// still gets its specialized structured prompt.
async function sendToNOVA(userCmd) {
  const agent = detectAgent(userCmd);
  // IMAGE AGENT → Pollinations (free, no key). Keep this non-LLM route so
  // image generation still works even if the text providers are flaky.
  try {
    if (agent === 'IMAGE') {
      const imageUrl = await generateImage(userCmd);
      return `[IMAGE AGENT] ACTIVATED\n\nGenerating image via Pollinations AI…\n\n![Generated Image](${imageUrl})\n\nImage URL: ${imageUrl}`;
    }

    const systemPrompt = isWeeklyReport(userCmd) ? WEEKLY_REPORT_PROMPT : SYSTEM_PROMPT;

    // Gemini is ALWAYS the primary API for everything (most generous free
    // tier). Only fall back to Groq if Gemini fails. Otherwise surface a
    // clear error so the debug line in NOVAOutputModal can show it.
    try {
      const reply = await callGemini(userCmd, systemPrompt);
      return reply;
    } catch (e1) {
      try {
        return await callGroq(userCmd, systemPrompt);
      } catch (e2) {
        return `NOVA offline. Error: ${e1 && e1.message ? e1.message : e1} | Groq error: ${e2 && e2.message ? e2.message : e2}`;
      }
    }
  } catch (err) {
    return `Connection interrupted. Error: ${err && err.message ? err.message : err}`;
  }
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

/* ═══════════════ SEO OUTPUT RENDERER ═══════════════ */
// Heuristic parser that pulls structured sections out of an SEO Agent
// response. Looks for section headers like "META TAGS", "OG TAGS",
// "SCHEMA MARKUP", "KEYWORDS", and "QUICK WINS" and captures the body
// under each one until the next header.
const SEO_SECTION_RE = /\b(META\s+TAGS?|OG\s+TAGS?|SCHEMA\s+MARKUP|JSON[-\s]?LD|KEYWORDS?|QUICK\s+WINS?)\b/i;
const SEO_HEADER_RE = /^\s*(META\s+TAGS?|OG\s+TAGS?|SCHEMA\s+MARKUP|JSON[-\s]?LD|KEYWORDS?|QUICK\s+WINS?)\s*[:\-]?\s*$/i;
const SEO_KV_RE = /^([A-Za-z][\w\-\s]{0,40}?(?:\s*\(\s*\d+\s*(?:chars?|ch)?\s*\))?)\s*[:\-]\s+(.+)$/;

function parseSeoOutput(text) {
  if (!text) return null;
  const lines = String(text).split(/\r?\n/);
  // Slice the text into sections by walking the lines and tracking the
  // current section header. A header is a standalone line (or a line
  // ending with ':') that matches the known SEO section names.
  const sections = { _raw: text };
  let cur = null;
  let buf = [];
  const flush = () => {
    if (!cur) return;
    sections[cur] = buf.join('\n').trim();
    buf = [];
  };
  for (const line of lines) {
    const trimmed = line.trim();
    const headerMatch = trimmed.match(SEO_HEADER_RE);
    if (headerMatch) {
      flush();
      cur = headerMatch[1].toUpperCase().replace(/[-\s]+/g, ' ').trim();
      // Normalize a few common variants
      if (cur === 'JSON LD') cur = 'SCHEMA MARKUP';
      if (cur === 'META TAG') cur = 'META TAGS';
      if (cur === 'OG TAG') cur = 'OG TAGS';
      if (cur === 'KEYWORD') cur = 'KEYWORDS';
      if (cur === 'QUICK WIN') cur = 'QUICK WINS';
      continue;
    }
    if (cur) buf.push(line);
  }
  flush();
  // --- META TAGS -----------------------------------------------------------
  const meta = {};
  const metaBlock = sections['META TAGS'] || '';
  // Pull key:value pairs from the meta block. Tolerates "(60 chars)" hints.
  metaBlock.split(/\r?\n/).forEach((ln) => {
    const m = ln.match(SEO_KV_RE);
    if (!m) return;
    const key = m[1].trim().toLowerCase()
      .replace(/\s*\(\s*\d+\s*(?:chars?|ch)?\s*\)\s*$/, '')
      .replace(/\s+/g, ' ');
    if (/^title|^meta\s*title/.test(key)) meta.title = m[2].trim();
    else if (/^desc/.test(key)) meta.description = m[2].trim();
    else if (/^keywords?/.test(key)) meta.keywords = m[2].trim();
    else if (/^canonical/.test(key)) meta.canonical = m[2].trim();
    else if (/^robots/.test(key)) meta.robots = m[2].trim();
  });
  // --- OG TAGS -------------------------------------------------------------
  const og = {};
  const ogBlock = sections['OG TAGS'] || '';
  ogBlock.split(/\r?\n/).forEach((ln) => {
    const m = ln.match(SEO_KV_RE);
    if (!m) return;
    const key = m[1].trim().toLowerCase().replace(/^og\s+/, 'og:').replace(/\s+/g, '');
    const val = m[2].trim();
    if (/^og:/.test(key)) og[key] = val;
  });
  // Also try to capture og:xxx = "yyy" pairs from inside code blocks if the
  // og section is empty.
  if (Object.keys(og).length === 0) {
    const re = /og:([a-z\-]+)\s*[:=]\s*"?([^"\n]+?)"?\s*$/gim;
    let m;
    while ((m = re.exec(text)) !== null) og[`og:${m[1].toLowerCase()}`] = m[2].trim();
  }
  // --- SCHEMA MARKUP -------------------------------------------------------
  let schema = '';
  // Prefer a fenced code block (json / jsonld / html) sitting under the
  // SCHEMA MARKUP section, otherwise grab the raw section.
  const schemaBlock = sections['SCHEMA MARKUP'] || '';
  const fenced = schemaBlock.match(/```(?:json|jsonld|html)?\n([\s\S]*?)```/);
  if (fenced) {
    schema = fenced[1].trim();
  } else if (schemaBlock) {
    // Strip the first line if it's just a section header echo
    const cleaned = schemaBlock.replace(/^\s*(here'?s|schema|json-?ld)\s*[:\-]?\s*/i, '');
    schema = cleaned.trim();
  }
  // --- KEYWORDS ------------------------------------------------------------
  const kwBlock = sections['KEYWORDS'] || '';
  const keywords = [];
  // Strip an optional leading list marker (e.g. "1. ", "- ", "• ") from a
  // single line of text. Doesn't eat leading digits from real words like
  // "4.0 scale" — only matches when the digit is followed by `.` or `)`.
  const stripListMarker = (s) => s
    .replace(/^\s*(?:\d+[.)]\s+|[-*•]\s+)/, '')
    .replace(/^["']|["']$/g, '')
    .trim();
  if (kwBlock) {
    // First try comma-separated
    const csv = kwBlock.match(/([^\n]+(?:,[^\n]+)+)/);
    if (csv) {
      csv[1].split(',').forEach((k) => {
        const t = stripListMarker(k.trim());
        if (t) keywords.push(t);
      });
    }
    // Also pull numbered / bulleted items, dedup
    const seen = new Set(keywords.map((k) => k.toLowerCase()));
    kwBlock.split(/\r?\n/).forEach((ln) => {
      const m = ln.match(/^\s*(?:\d+[\.\)]\s*|[\-\*\u2022]\s*)(.+)$/);
      if (!m) return;
      const t = stripListMarker(m[1]);
      if (t && !seen.has(t.toLowerCase())) { keywords.push(t); seen.add(t.toLowerCase()); }
    });
  }
  // --- QUICK WINS ----------------------------------------------------------
  const winsBlock = sections['QUICK WINS'] || '';
  const wins = [];
  if (winsBlock) {
    winsBlock.split(/\r?\n/).forEach((ln) => {
      const m = ln.match(/^\s*(?:\d+[\.\)]\s*|[\-\*\u2022]\s*)(.+)$/);
      if (m) wins.push(m[1].trim());
      else if (ln.trim() && wins.length === 0) wins.push(ln.trim());
    });
    // If we still didn't get numbered items, fall back to splitting on
    // sentence boundaries.
    if (wins.length === 0) {
      winsBlock.split(/(?<=\.)\s+(?=[A-Z])/).forEach((s) => {
        const t = s.trim();
        if (t) wins.push(t);
      });
    }
  }
  // Heuristic: did we actually find anything SEO-shaped?
  const hit = (
    Object.keys(meta).length > 0 ||
    Object.keys(og).length > 0 ||
    schema ||
    keywords.length > 0 ||
    wins.length > 0
  );
  return hit ? { meta, og, schema, keywords, wins } : null;
}

/* Detect if the response is an SEO-shaped payload. */
function isSeoResponse(agent, text) {
  if (/SEO/i.test(agent || '')) return true;
  if (!text) return false;
  return /meta\s+title|og:title|json-?ld|schema\s+markup|quick\s+wins/i.test(text);
}

/* ═══════════════ WEEKLY REPORT PARSER ═══════════════ */
// Splits a Monday-morning briefing into the three sections (Scholarics,
// Rooted, Priorities) and pulls out the labelled sub-fields under each
// one. The labels come from the specialized system prompt above.
const WR_SECTION_RE = /^\s*(SCHOLARICS\s+WEEKLY|ROOTED\s+WEEKLY|THIS\s+WEEK\s+PRIORITIES)\s*:\s*$/i;
const WR_LABEL_RE = /^\s*[-•]?\s*([^:\n]{2,60})\s*:\s*(.+?)\s*$/;
// Items in lists inside a section (numbered or bulleted). Returns the
// cleaned headline, or null if the line isn't a list item.
const WR_LIST_RE = /^\s*(?:\d+[\.\)]\s*|[-*•]\s*)(.+?)\s*$/;
// Lines like "3 keywords to target: foo, bar, baz" — a comma-separated
// field rendered as inline chips.

function parseWeeklyReport(text) {
  if (!text) return null;
  const lines = String(text).split(/\r?\n/);

  // Slice into three buckets by section header.
  const buckets = { scholarics: [], rooted: [], priorities: [] };
  let current = null;
  for (const line of lines) {
    const m = line.trim().match(WR_SECTION_RE);
    if (m) {
      // The matched header is "SCHOLARICS WEEKLY", "ROOTED WEEKLY", or
      // "THIS WEEK PRIORITIES". Normalize to a bucket key.
      const header = m[1].toLowerCase();
      if (header.startsWith('scholarics')) current = 'scholarics';
      else if (header.startsWith('rooted')) current = 'rooted';
      else current = 'priorities';
      continue;
    }
    if (current && buckets[current]) buckets[current].push(line);
  }

  // Pull labelled key:value lines AND list items out of a bucket, in order.
  const parseBucket = (rawLines) => {
    const fields = []; // ordered list of { kind, label?, text? | items? }
    for (const ln of rawLines) {
      if (!ln.trim()) continue;
      const lab = ln.match(WR_LABEL_RE);
      if (lab) {
        const label = lab[1].trim();
        const value = lab[2].trim();
        // Comma-separated field? Only treat it as a list of chips when the
        // value is a single short line with 2+ commas AND the label hints
        // at a list ("keywords", "ideas", "opportunities", "priorities").
        const looksLikeList = /keyword|opportunit|idea|priorit|action/i.test(label);
        if (looksLikeList && value.includes(',')) {
          const items = value.split(',').map((s) => s.trim()).filter(Boolean);
          if (items.length >= 2) {
            fields.push({ kind: 'list', label, items });
            continue;
          }
        }
        fields.push({ kind: 'field', label, text: value });
        continue;
      }
      const li = ln.match(WR_LIST_RE);
      if (li) {
        let item = li[1].trim();
        // A list item that ends with ":" is a header for the items that
        // follow, not an item itself. Promote it to a labelled numbered
        // list so the rendering can use it as a section title.
        if (item.endsWith(':')) {
          fields.push({ kind: 'numbered', label: item.slice(0, -1).trim(), items: [] });
          continue;
        }
        const last = fields[fields.length - 1];
        if (last && last.kind === 'numbered') {
          last.items.push(item);
        } else {
          fields.push({ kind: 'numbered', label: '', items: [item] });
        }
        continue;
      }
      // Free-floating sentence — attach to the previous field if it was
      // a list/headline; otherwise stash as its own paragraph.
      const last = fields[fields.length - 1];
      if (last && (last.kind === 'numbered' || last.kind === 'list') && last.label === '') {
        last.items[last.items.length - 1] += ' — ' + ln.trim();
      } else {
        fields.push({ kind: 'paragraph', text: ln.trim() });
      }
    }
    return fields;
  };

  const out = {
    scholarics: parseBucket(buckets.scholarics),
    rooted: parseBucket(buckets.rooted),
    priorities: parseBucket(buckets.priorities),
  };

  // Heuristic: did we find at least one labelled field in any section?
  const totalFields = out.scholarics.length + out.rooted.length + out.priorities.length;
  return totalFields > 0 ? out : null;
}

/* Inline pretty-print a JSON-LD string with a touch of syntax highlighting
   (keys green, strings orange, numbers cyan, braces dim). Used for the
   SCHEMA MARKUP code panel. */
function highlightJson(json) {
  if (!json) return null;
  // Tokenize: strings (incl. escaped), numbers, braces, brackets, colons, commas
  const tokens = [];
  const re = /("(?:\\.|[^"\\])*"\s*:?)|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)|([\{\}\[\],])/g;
  let last = 0;
  let m;
  while ((m = re.exec(json)) !== null) {
    if (m.index > last) tokens.push({ t: 'raw', v: json.slice(last, m.index) });
    if (m[1] !== undefined) {
      // is it a key? (ends with `:`)
      if (m[1].endsWith(':')) tokens.push({ t: 'key', v: m[1].slice(0, -1) });
      else tokens.push({ t: 'str', v: m[1] });
    } else if (m[2] !== undefined) tokens.push({ t: 'lit', v: m[2] });
    else if (m[3] !== undefined) tokens.push({ t: 'num', v: m[3] });
    else if (m[4] !== undefined) tokens.push({ t: 'punc', v: m[4] });
    last = m.index + m[0].length;
  }
  if (last < json.length) tokens.push({ t: 'raw', v: json.slice(last) });
  const style = {
    key:  { color: '#9be8b6' },         // green for keys
    str:  { color: '#ffb97a' },         // warm orange for string values
    num:  { color: '#5ac8ff' },         // cyan for numbers
    lit:  { color: '#c08aff' },         // purple for true/false/null
    punc: { color: '#9a7bff' },         // muted purple for punctuation
    raw:  { color: '#ffd9a8' },
  };
  return tokens.map((tk, i) => (
    <span key={i} style={style[tk.t]}>{tk.v}</span>
  ));
}

/* Shared visual primitives for the SEO modal --------------------------- */
const ORANGE = '#ff9a26';
const ORANGE_DIM = 'rgba(255,154,38,0.35)';
const ORANGE_SOFT = 'rgba(255,154,38,0.18)';
const MONO = '"Share Tech Mono", "JetBrains Mono", ui-monospace, monospace';
const sectionHeaderStyle = (extra = {}) => ({
  fontFamily: 'Orbitron, monospace',
  fontSize: 10,
  letterSpacing: 2.4,
  color: ORANGE,
  textTransform: 'uppercase',
  borderBottom: `1px solid ${ORANGE_DIM}`,
  paddingBottom: 4,
  margin: '14px 0 8px',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  ...extra,
});
const copyableInputStyle = {
  width: '100%',
  background: 'rgba(0,0,0,0.55)',
  border: '1px solid rgba(255,154,38,0.25)',
  borderRadius: 4,
  padding: '8px 10px',
  color: '#ffd9a8',
  fontFamily: MONO,
  fontSize: 11,
  boxSizing: 'border-box',
  outline: 'none',
};
const sectionLabel = {
  fontSize: 9,
  letterSpacing: 1.6,
  color: '#cfa875',
  fontWeight: 700,
  textTransform: 'uppercase',
  marginBottom: 4,
  display: 'block',
};
const codePanelStyle = {
  background: 'rgba(0,0,0,0.6)',
  border: `1px solid ${ORANGE_DIM}`,
  borderRadius: 4,
  padding: '10px 12px',
  margin: '8px 0',
  fontFamily: MONO,
  fontSize: 11,
  color: '#ffd9a8',
  overflowX: 'auto',
  whiteSpace: 'pre',
  lineHeight: 1.55,
};
const btnStyle = {
  background: 'none',
  border: `1px solid ${ORANGE_DIM}`,
  color: ORANGE,
  cursor: 'pointer',
  padding: '4px 10px',
  fontSize: 9.5,
  borderRadius: 3,
  fontFamily: MONO,
  letterSpacing: 1,
};
/* Small wrapper around navigator.clipboard with an execCommand fallback. */
async function copyToClipboard(text) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy copy path below.
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/* SEO Modal — renders the parsed sections. Receives the original raw
   `output` so it can still COPY ALL the original text. */
function SEOModalBody({ output }) {
  const seo = useMemo(() => parseSeoOutput(output), [output]);
  const [copiedField, setCopiedField] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [doneWins, setDoneWins] = useState({});

  if (!seo) {
    // Should not normally happen because the parent decides whether to
    // render this body, but fall back to the plain text.
    return <pre style={codePanelStyle}>{output}</pre>;
  }

  const { meta, og, schema, keywords, wins } = seo;
  const hasOg = Object.keys(og).length > 0;
  const standardOg = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:site_name'];
  const ogEntries = standardOg
    .filter((k) => og[k])
    .map((k) => [k, og[k]])
    .concat(Object.keys(og).filter((k) => !standardOg.includes(k)).map((k) => [k, og[k]]));

  const flashCopied = (setter, key) => {
    setter(key);
    setTimeout(() => setter(null), 1400);
  };

  const onCopyField = async (key, value) => {
    const ok = await copyToClipboard(value);
    if (ok) flashCopied(setCopiedField, key);
  };
  const onCopyCode = async () => {
    const ok = await copyToClipboard(schema);
    if (ok) { setCopiedCode(true); setTimeout(() => setCopiedCode(false), 1400); }
  };

  return (
    <div>
      {/* ── META TAGS ─────────────────────────────────────────────── */}
      {Object.keys(meta).length > 0 && (
        <>
          <div style={sectionHeaderStyle()}>▸ Meta Tags</div>
          {meta.title !== undefined && (
            <div style={{ marginBottom: 8 }}>
              <span style={sectionLabel}>Title ({meta.title.length}/60)</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
                <input
                  readOnly
                  value={meta.title}
                  onFocus={(e) => e.target.select()}
                  style={copyableInputStyle}
                />
                <button
                  style={btnStyle}
                  onClick={() => onCopyField('title', meta.title)}
                  title="Copy meta title"
                >{copiedField === 'title' ? 'COPIED' : 'COPY'}</button>
              </div>
              <div style={{ height: 2, marginTop: 4, background: 'rgba(255,154,38,0.12)', borderRadius: 1 }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (meta.title.length / 60) * 100)}%`,
                  background: meta.title.length > 60 ? '#ff6a4a' : ORANGE,
                  boxShadow: `0 0 6px ${meta.title.length > 60 ? '#ff6a4a' : ORANGE}`,
                }} />
              </div>
            </div>
          )}
          {meta.description !== undefined && (
            <div style={{ marginBottom: 8 }}>
              <span style={sectionLabel}>Description ({meta.description.length}/155)</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <textarea
                  readOnly
                  rows={3}
                  value={meta.description}
                  onFocus={(e) => e.target.select()}
                  style={{ ...copyableInputStyle, resize: 'vertical', minHeight: 56 }}
                />
                <button
                  style={btnStyle}
                  onClick={() => onCopyField('description', meta.description)}
                  title="Copy meta description"
                >{copiedField === 'description' ? 'COPIED' : 'COPY'}</button>
              </div>
              <div style={{ height: 2, marginTop: 4, background: 'rgba(255,154,38,0.12)', borderRadius: 1 }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (meta.description.length / 155) * 100)}%`,
                  background: meta.description.length > 155 ? '#ff6a4a' : ORANGE,
                  boxShadow: `0 0 6px ${meta.description.length > 155 ? '#ff6a4a' : ORANGE}`,
                }} />
              </div>
            </div>
          )}
          {meta.canonical && (
            <CopyableRow label="Canonical" value={meta.canonical}
              copied={copiedField === 'canonical'}
              onCopy={() => onCopyField('canonical', meta.canonical)} />
          )}
          {meta.robots && (
            <CopyableRow label="Robots" value={meta.robots}
              copied={copiedField === 'robots'}
              onCopy={() => onCopyField('robots', meta.robots)} />
          )}
        </>
      )}

      {/* ── OG TAGS ────────────────────────────────────────────────── */}
      {hasOg && (
        <>
          <div style={sectionHeaderStyle()}>▸ Open Graph Tags</div>
          {ogEntries.map(([k, v]) => (
            <CopyableRow
              key={k}
              label={k}
              value={v}
              copied={copiedField === k}
              onCopy={() => onCopyField(k, v)}
            />
          ))}
        </>
      )}

      {/* ── SCHEMA MARKUP ──────────────────────────────────────────── */}
      {schema && (
        <>
          <div style={sectionHeaderStyle({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          })}>
            <span>▸ Schema Markup (JSON-LD)</span>
            <button
              style={{ ...btnStyle, color: copiedCode ? '#35e08a' : ORANGE }}
              onClick={onCopyCode}
              title="Copy JSON-LD code"
            >{copiedCode ? '✓ COPIED' : '⎘ COPY CODE'}</button>
          </div>
          <pre style={codePanelStyle}>{highlightJson(schema)}</pre>
        </>
      )}

      {/* ── KEYWORDS ───────────────────────────────────────────────── */}
      {keywords.length > 0 && (
        <>
          <div style={sectionHeaderStyle()}>▸ Keywords ({keywords.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '2px 0 4px' }}>
            {keywords.map((k, i) => (
              <span
                key={`${k}-${i}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 9px',
                  background: 'rgba(255,154,38,0.10)',
                  border: `1px solid ${ORANGE_SOFT}`,
                  color: '#ffc24d',
                  borderRadius: 999,
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: 0.4,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: ORANGE, boxShadow: `0 0 5px ${ORANGE}` }} />
                {k}
              </span>
            ))}
          </div>
        </>
      )}

      {/* ── QUICK WINS ─────────────────────────────────────────────── */}
      {wins.length > 0 && (
        <>
          <div style={sectionHeaderStyle()}>▸ Quick Wins ({wins.length})</div>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {wins.map((w, i) => {
              const done = !!doneWins[i];
              return (
                <li
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 9,
                    padding: '6px 4px',
                    borderTop: i === 0 ? 'none' : '1px dashed rgba(255,154,38,0.10)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setDoneWins((d) => ({ ...d, [i]: !d[i] }))}
                    style={{
                      flex: 'none',
                      width: 16, height: 16, marginTop: 2,
                      borderRadius: 3,
                      background: done ? ORANGE : 'transparent',
                      border: `1px solid ${done ? ORANGE : ORANGE_DIM}`,
                      color: done ? '#1a0e03' : ORANGE,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, lineHeight: 1, fontWeight: 700,
                      boxShadow: done ? `0 0 6px ${ORANGE}` : 'none',
                    }}
                    aria-pressed={done}
                    aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                  >{done ? '✓' : ''}</button>
                  <span style={{
                    flex: 'none',
                    width: 18, fontFamily: MONO, fontSize: 10, color: ORANGE,
                    fontWeight: 700, textAlign: 'right',
                  }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{
                    flex: 1,
                    color: done ? '#7a5a36' : '#e8c98a',
                    textDecoration: done ? 'line-through' : 'none',
                    lineHeight: 1.5,
                  }}>{w}</span>
                </li>
              );
            })}
          </ol>
        </>
      )}

      {/* Anything we couldn't classify is shown as a small footer block */}
      <div style={{ marginTop: 16, fontSize: 9, color: '#7a5a36', textAlign: 'center', letterSpacing: 1 }}>
        END OF SEO PAYLOAD · {Object.keys(meta).length + ogEntries.length + (schema ? 1 : 0) + keywords.length + wins.length} FIELDS
      </div>
    </div>
  );
}

function CopyableRow({ label, value, copied, onCopy }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <span style={sectionLabel}>{label}</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
        <input
          readOnly
          value={value}
          onFocus={(e) => e.target.select()}
          style={copyableInputStyle}
        />
        <button
          style={{ ...btnStyle, color: copied ? '#35e08a' : ORANGE }}
          onClick={onCopy}
          title={`Copy ${label}`}
        >{copied ? 'COPIED' : 'COPY'}</button>
      </div>
    </div>
  );
}

/* ═══════════════ WEEKLY REPORT MODAL ═══════════════ */
// Renders the parsed Monday morning briefing as three color-coded cards
// (Scholarics, Rooted, Priorities) with structured fields. Also offers
// a DOWNLOAD .MD button so Anwaar can save the briefing for later.
const WR_PALETTE = {
  scholarics: { accent: ORANGE, glow: 'rgba(255,154,38,0.30)', soft: 'rgba(255,154,38,0.10)', icon: Search, tagline: 'STUDENT-FACING · ACADEMIC TOOLS' },
  rooted:     { accent: '#35e08a', glow: 'rgba(53,224,138,0.30)', soft: 'rgba(53,224,138,0.10)', icon: Globe,  tagline: 'PARENTING · USA / UK / CA / AU' },
  priorities: { accent: '#ff6a4a', glow: 'rgba(255,106,74,0.30)', soft: 'rgba(255,106,74,0.10)', icon: Rocket, tagline: 'THIS WEEK · DECISIVE MOVES' },
};

function WRCard({ title, kicker, fields, palette, copyField, copiedKey, idx }) {
  const Icon = palette.icon;
  return (
    <section
      style={{
        position: 'relative',
        margin: '14px 0 18px',
        borderRadius: 6,
        background: 'linear-gradient(160deg, rgba(20,10,4,0.85), rgba(8,4,1,0.92))',
        border: `1px solid ${palette.glow}`,
        boxShadow: `0 0 18px ${palette.soft}, inset 0 0 0 1px rgba(0,0,0,0.4)`,
        overflow: 'hidden',
      }}
    >
      {/* top accent bar */}
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${palette.accent}, transparent)`, opacity: 0.85 }} />
      {/* header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px 8px',
        borderBottom: `1px solid ${palette.glow}`,
        background: `linear-gradient(180deg, ${palette.soft}, transparent)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{
            width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(160deg, ${palette.soft}, rgba(0,0,0,0.5))`,
            border: `1px solid ${palette.glow}`,
            borderRadius: 4, color: palette.accent,
            boxShadow: `0 0 8px ${palette.soft}`,
          }}><Icon size={14} strokeWidth={1.8} /></span>
          <div>
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 11, color: palette.accent, letterSpacing: 2.2, fontWeight: 700 }}>
              {title}
            </div>
            <div style={{ fontFamily: 'var(--fm)', fontSize: 8, color: '#7a5a36', letterSpacing: 1.4, marginTop: 2 }}>
              {kicker}
            </div>
          </div>
        </div>
        <div style={{
          fontFamily: 'var(--fm)', fontSize: 8, color: '#5c452c',
          letterSpacing: 1.6,
        }}>CARD {String(idx).padStart(2, '0')}/03</div>
      </header>
      {/* body */}
      <div style={{ padding: '12px 14px 14px' }}>
        {fields.map((f, i) => {
          if (f.kind === 'field') {
            return (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={sectionLabel}>{f.label}</span>
                  <button
                    style={{ ...btnStyle, padding: '2px 8px', fontSize: 8.5 }}
                    onClick={() => copyField(`${title}-${i}`, f.text)}
                    title={`Copy "${f.label}"`}
                  >{copiedKey === `${title}-${i}` ? '✓ COPIED' : '⎘ COPY'}</button>
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.45)',
                  border: '1px solid rgba(255,154,38,0.18)',
                  borderLeft: `2px solid ${palette.accent}`,
                  borderRadius: 3,
                  padding: '8px 10px',
                  color: '#ffd9a8',
                  fontSize: 12,
                  lineHeight: 1.55,
                  fontFamily: 'var(--fb), system-ui, sans-serif',
                }}>{f.text}</div>
              </div>
            );
          }
          if (f.kind === 'list') {
            return (
              <div key={i} style={{ marginBottom: 10 }}>
                <span style={sectionLabel}>{f.label}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {f.items.map((it, j) => (
                    <span
                      key={j}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px',
                        background: palette.soft,
                        border: `1px solid ${palette.glow}`,
                        color: palette.accent,
                        borderRadius: 999,
                        fontFamily: 'var(--fm)', fontSize: 10.5, letterSpacing: 0.4,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: palette.accent, boxShadow: `0 0 5px ${palette.accent}` }} />
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            );
          }
          if (f.kind === 'numbered') {
            return (
              <div key={i} style={{ marginBottom: 10 }}>
                {f.label && <span style={sectionLabel}>{f.label}</span>}
                <ol style={{ listStyle: 'none', padding: 0, margin: f.label ? '4px 0 0' : 0 }}>
                  {f.items.map((it, j) => (
                    <li
                      key={j}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 9,
                        padding: '6px 0',
                        borderTop: j === 0 ? 'none' : `1px dashed ${palette.soft}`,
                      }}
                    >
                      <span style={{
                        flex: 'none',
                        width: 22, height: 22, marginTop: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: `linear-gradient(160deg, ${palette.soft}, rgba(0,0,0,0.5))`,
                        border: `1px solid ${palette.glow}`,
                        borderRadius: 3,
                        color: palette.accent, fontFamily: 'var(--fm)',
                        fontSize: 10, fontWeight: 700,
                      }}>{String(j + 1).padStart(2, '0')}</span>
                      <span style={{ flex: 1, color: '#ffd9a8', fontSize: 12, lineHeight: 1.5 }}>{it}</span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          }
          // paragraph
          return <p key={i} style={{ margin: '0 0 8px', color: '#cfa875', fontSize: 12, lineHeight: 1.5 }}>{f.text}</p>;
        })}
        {fields.length === 0 && (
          <div style={{ color: '#7a5a36', fontSize: 11, fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
            No data for this section in the response.
          </div>
        )}
      </div>
    </section>
  );
}

/* Convert a parsed report back into a clean markdown document so the
   DOWNLOAD .MD button produces a useful artifact. */
function weeklyReportToMarkdown(parsed) {
  const sectionTitles = {
    scholarics: 'SCHOLARICS WEEKLY',
    rooted: 'ROOTED WEEKLY',
    priorities: 'THIS WEEK PRIORITIES',
  };
  const tags = {
    scholarics: '📚 scholarics.com — student-facing academic tools',
    rooted: '🌱 rooted — parenting platform, USA / UK / CA / AU',
    priorities: '🎯 decisive actions for the week',
  };
  const stamp = new Date().toISOString().slice(0, 10);
  const lines = [];
  lines.push(`# NOVA Monday Morning Briefing — ${stamp}`);
  lines.push('');
  lines.push('_Prepared by NOVA, the AI chief of staff._');
  lines.push('');
  for (const key of ['scholarics', 'rooted', 'priorities']) {
    const fields = parsed[key] || [];
    if (fields.length === 0) continue;
    lines.push(`## ${sectionTitles[key]}`);
    lines.push(`_${tags[key]}_`);
    lines.push('');
    for (const f of fields) {
      if (f.kind === 'field') {
        lines.push(`**${f.label}** — ${f.text}`);
      } else if (f.kind === 'list') {
        lines.push(`**${f.label}** — ${f.items.join(', ')}`);
      } else if (f.kind === 'numbered') {
        if (f.label) lines.push(`**${f.label}**`);
        f.items.forEach((it, i) => lines.push(`${i + 1}. ${it}`));
      } else {
        lines.push(f.text);
      }
      lines.push('');
    }
  }
  lines.push('---');
  lines.push('_Anything else on this, Anwaar?_');
  return lines.join('\n');
}

function WeeklyReportModalBody({ output }) {
  const parsed = useMemo(() => parseWeeklyReport(output), [output]);
  const [copiedKey, setCopiedKey] = useState(null);
  const [downloaded, setDownloaded] = useState(false);

  if (!parsed) {
    return <pre style={codePanelStyle}>{output}</pre>;
  }

  const copyField = async (key, text) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1400);
    }
  };

  const downloadMd = async () => {
    const md = weeklyReportToMarkdown(parsed);
    const ok = await copyToClipboard(md);
    // Always try the file download regardless of clipboard result.
    try {
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `nova-monday-briefing-${stamp}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {}
    if (ok) {
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 1800);
    }
  };

  return (
    <div>
      {/* Subtle report header banner */}
      <div style={{
        margin: '0 0 6px',
        padding: '10px 12px',
        background: 'linear-gradient(135deg, rgba(255,154,38,0.10), rgba(53,224,138,0.06), rgba(255,106,74,0.08))',
        border: '1px solid rgba(255,154,38,0.22)',
        borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={14} color={ORANGE} strokeWidth={1.8} />
          <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 10, color: ORANGE, letterSpacing: 2.2 }}>
            MONDAY MORNING BRIEFING
          </span>
        </div>
        <span style={{ fontFamily: 'var(--fm)', fontSize: 8.5, color: '#7a5a36', letterSpacing: 1.2 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
        </span>
      </div>

      <WRCard title="SCHOLARICS WEEKLY" kicker={WR_PALETTE.scholarics.tagline}
        palette={WR_PALETTE.scholarics} fields={parsed.scholarics} idx={1}
        copyField={copyField} copiedKey={copiedKey} />
      <WRCard title="ROOTED WEEKLY" kicker={WR_PALETTE.rooted.tagline}
        palette={WR_PALETTE.rooted} fields={parsed.rooted} idx={2}
        copyField={copyField} copiedKey={copiedKey} />
      <WRCard title="THIS WEEK PRIORITIES" kicker={WR_PALETTE.priorities.tagline}
        palette={WR_PALETTE.priorities} fields={parsed.priorities} idx={3}
        copyField={copyField} copiedKey={copiedKey} />

      <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 4px' }}>
        <button
          onClick={downloadMd}
          style={{
            background: 'linear-gradient(180deg, rgba(255,154,38,0.18), rgba(255,154,38,0.06))',
            border: '1px solid rgba(255,154,38,0.45)',
            color: downloaded ? '#35e08a' : ORANGE,
            cursor: 'pointer',
            padding: '8px 16px',
            fontSize: 10,
            letterSpacing: 1.8,
            fontFamily: 'Orbitron, monospace',
            fontWeight: 700,
            borderRadius: 4,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: '0 0 12px rgba(255,154,38,0.20)',
          }}
        >
          <Download size={12} strokeWidth={2} />
          {downloaded ? '✓ DOWNLOADED & COPIED' : 'DOWNLOAD .MD'}
        </button>
      </div>

      <div style={{ textAlign: 'center', fontSize: 9, color: '#7a5a36', letterSpacing: 1.4, marginTop: 8 }}>
        END OF BRIEFING · 3 PLATFORMS · {(parsed.scholarics.length + parsed.rooted.length + parsed.priorities.length)} FIELDS
      </div>
    </div>
  );
}

/* ═══════════════ VOICE INPUT (Web Speech API) ═══════════════ */
// Cross-browser SpeechRecognition handle + a React hook that drives a
// controlled `<input>` from interim + final transcripts, plus a small
// mic button that glows while listening.

/* Resolve the constructor across vendors. The standard `SpeechRecognition`
   is on `window` in modern Chrome / Edge; older WebKit uses the
   `webkitSpeechRecognition` alias. */
function getSpeechRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

const VOICE_SUPPORTED = !!getSpeechRecognitionCtor();

/* Human-friendly message for each SpeechRecognitionErrorEvent.error code.
   Returns the error code as a fallback so the UI is never blank. */
function voiceErrorMessage(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Please allow microphone access';
    case 'no-speech':
      return 'No speech detected. Try again.';
    case 'audio-capture':
      return 'No microphone found';
    case 'network':
      return 'Network error. Voice requires a connection.';
    case 'aborted':
      return null; // user-initiated stop — not really an error
    case 'language-not-supported':
      return 'Language not supported';
    default:
      return code ? `Voice error: ${code}` : 'Voice error';
  }
}

/* useVoiceInput
   ─────────────
   Hooks an input element to a SpeechRecognition session.

   @param onFinal(text)   called once with the final transcript when
                          the session ends normally. The input is also
                          kept in sync so callers don't need to wire
                          the value themselves.
   @returns
     supported   – boolean, true if the browser exposes SpeechRecognition
     listening   – true while a session is active
     interim     – the latest interim transcript (or '')
     error       – human-readable error string (cleared on next start)
     start()     – begin a new session (resets any prior error)
     stop()      – end the active session cleanly
   */
function useVoiceInput({ onFinal } = {}) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);
  const recRef = useRef(null);
  // Keep the latest onFinal in a ref so the recognition handlers don't
  // have to re-bind every time the parent re-renders.
  const onFinalRef = useRef(onFinal);
  useEffect(() => { onFinalRef.current = onFinal; }, [onFinal]);

  // Cleanup on unmount.
  useEffect(() => () => {
    if (recRef.current) {
      try { recRef.current.abort(); } catch {}
      recRef.current = null;
    }
  }, []);

  const start = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError('Voice not available on this browser');
      return false;
    }
    // If a session is already running, restart it (acts as a stop+start).
    if (recRef.current) {
      try { recRef.current.abort(); } catch {}
      recRef.current = null;
    }
    setError(null);
    setInterim('');
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let finalText = '';
    rec.onresult = (e) => {
      // Stitch together every result returned by the event so we never
      // lose a piece of the sentence when the user pauses mid-utterance.
      let interimChunk = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const transcript = (res[0] && res[0].transcript) || '';
        if (res.isFinal) finalText += transcript;
        else interimChunk += transcript;
      }
      setInterim(interimChunk);
      // We don't push interim into onFinal's call — the parent already
      // sees `interim` in the hook return. Final transcript is delivered
      // when the session ends, after the final chunks have all arrived.
      if (finalText) {
        recRef.current && (recRef.current._novaFinal = finalText);
      }
    };
    rec.onerror = (e) => {
      const msg = voiceErrorMessage(e.error);
      if (msg) setError(msg);
      setListening(false);
    };
    rec.onend = () => {
      // Pull the final transcript we accumulated during onresult and
      // hand it to the caller. If the session ended with no speech
      // detected, onerror will have already fired and we skip the call.
      const ft = (rec._novaFinal || '').trim();
      setListening(false);
      setInterim('');
      recRef.current = null;
      if (ft && onFinalRef.current) onFinalRef.current(ft);
    };

    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
      return true;
    } catch (err) {
      setError(voiceErrorMessage(err && err.message) || 'Voice failed to start');
      setListening(false);
      recRef.current = null;
      return false;
    }
  };

  const stop = () => {
    const rec = recRef.current;
    if (!rec) return;
    try { rec.stop(); } catch {}
    // onend will run and reset state.
  };

  return { supported: VOICE_SUPPORTED, listening, interim, error, start, stop };
}

/* <MicButton> — small wrapper that toggles voice input and glows when
   listening. Designed to drop into both the desktop and mobile command
   bars. The optional `variant` prop is `'desktop' | 'mobile'` and just
   changes the dimensions. */
function MicButton({ voice, size = 34, variant = 'desktop' }) {
  const { supported, listening, error, start, stop } = voice;
  const color = listening ? '#fff1d4' : error ? '#ff6a4a' : ORANGE;
  const ringColor = error ? 'rgba(255,106,74,0.45)' : ORANGE;
  return (
    <button
      type="button"
      className={`nova-mic ${listening ? 'is-listening' : ''} ${error ? 'is-error' : ''}`}
      onClick={() => (listening ? stop() : start())}
      title={
        !supported
          ? 'Voice not available on this browser'
          : listening
            ? 'Stop listening'
            : error
              ? error
              : 'Voice input'
      }
      aria-label={listening ? 'Stop listening' : 'Start voice input'}
      aria-pressed={listening}
      style={{
        width: size, height: size,
        background: listening
          ? `radial-gradient(circle at center, ${ORANGE} 0%, rgba(255,154,38,0.45) 55%, rgba(255,154,38,0.05) 100%)`
          : error
            ? 'linear-gradient(160deg, rgba(255,106,74,0.18), rgba(255,106,74,0.04))'
            : 'transparent',
        border: `1px solid ${listening ? ORANGE : ringColor}`,
        color,
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 4,
        position: 'relative',
        boxShadow: listening
          ? `0 0 14px rgba(255,154,38,0.55), inset 0 0 8px rgba(255,154,38,0.45)`
          : error
            ? '0 0 6px rgba(255,106,74,0.30)'
            : 'none',
        animation: listening ? 'novaMicPulse 1.1s ease-in-out infinite' : 'none',
        transition: 'background 200ms, color 200ms, box-shadow 200ms',
        flex: 'none',
        padding: 0,
      }}
    >
      <Mic size={variant === 'mobile' ? 17 : 15} strokeWidth={1.8} />
    </button>
  );
}

/* ═══════════════ NOVA RESPONSE FORMATTER ═══════════════ */
// Markdown-lite renderer for NOVA responses. Handles:
//   ### heading       → orange bold header
//   ## heading        → larger orange header (single # treated the same)
//   - item / * item   → bullet point with glowing orange dot
//   1. item           → numbered list item
//   ``` lang ... ```  → dark code block, monospace
//   `inline`          → inline monospace chip
//   **bold**          → bold highlight
//   ![alt](url)       → rendered inline image (IMAGE AGENT outputs)

const FMT_INLINE_RE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(!\[[^\]]*\]\(https?:\/\/[^)\s]+\))/g;
const FMT_IMG_RE = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/;
// Match fenced blocks before the line formatter sees them. The optional
// CR makes responses copied from Windows / mobile clients render cleanly.
const FMT_FENCE_RE = /```([a-zA-Z0-9_+#.-]*)\r?\n?([\s\S]*?)```/g;

const fmtH2Style = {
  fontFamily: 'Orbitron, monospace',
  fontSize: 16, fontWeight: 800, letterSpacing: 1.4,
  color: ORANGE, textShadow: '0 0 12px rgba(255,154,38,0.45)',
  margin: '16px 0 8px', lineHeight: 1.35, wordBreak: 'break-word',
};
const fmtH3Style = {
  fontFamily: 'Orbitron, monospace',
  fontSize: 12.5, fontWeight: 800, letterSpacing: 1.2,
  color: ORANGE, margin: '13px 0 6px', lineHeight: 1.4, wordBreak: 'break-word',
};
const fmtCodeBlockStyle = {
  margin: 0,
  background: 'rgba(0,0,0,0.68)',
  border: '1px solid rgba(255,154,38,0.28)',
  borderLeft: '3px solid rgba(255,154,38,0.55)',
  borderRadius: 6, padding: '12px 14px',
  fontFamily: MONO, fontSize: 11.5, lineHeight: 1.6,
  color: '#ffd9a8', overflowX: 'auto', whiteSpace: 'pre',
};

/* Render inline marks (code chips, bold, images) inside a single line. */
function renderInline(line, keyBase) {
  const nodes = [];
  let last = 0; let m; let n = 0;
  FMT_INLINE_RE.lastIndex = 0;
  while ((m = FMT_INLINE_RE.exec(line)) !== null) {
    if (m.index > last) {
      nodes.push(<React.Fragment key={`${keyBase}-t${n++}`}>{line.slice(last, m.index)}</React.Fragment>);
    }
    if (m[1]) {
      nodes.push(
        <code key={`${keyBase}-c${n++}`} style={{
          // Inline code uses the same dark treatment as fenced code, but
          // stays compact so commands and file names remain readable inline.
          background: 'rgba(0,0,0,0.68)',
          border: '1px solid rgba(255,154,38,0.30)',
          borderRadius: 3, padding: '1px 5px',
          fontFamily: MONO, fontSize: '0.92em', color: '#ffc24d',
          wordBreak: 'break-word',
        }}>{m[1].slice(1, -1)}</code>
      );
    } else if (m[2]) {
      nodes.push(
        <strong key={`${keyBase}-b${n++}`} style={{ color: '#ffd9a8', fontWeight: 700 }}>{m[2].slice(2, -2)}</strong>
      );
    } else if (m[3]) {
      const img = m[3].match(FMT_IMG_RE);
      nodes.push(
        <span key={`${keyBase}-i${n++}`} style={{ display: 'block', margin: '10px 0', textAlign: 'center' }}>
          <img src={img[2]} alt={img[1]} loading="lazy" style={{
            maxWidth: '100%', borderRadius: 6,
            border: '1px solid rgba(255,154,38,0.4)',
            boxShadow: '0 0 18px rgba(255,130,10,0.25)',
          }} />
        </span>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < line.length) {
    nodes.push(<React.Fragment key={`${keyBase}-t${n++}`}>{line.slice(last)}</React.Fragment>);
  }
  return nodes;
}

/* Walk the lines of a (non-code) text chunk and emit formatted blocks:
   headers, bullet lists, numbered lists, and paragraphs. Keeping the list
   elements semantic is useful on a phone: screen readers announce the
   structure and the browser still gives the response a natural reading
   order. */
function renderFormattedLines(text, keyBase) {
  const lines = String(text).split(/\r?\n/);
  const out = [];
  let i = 0; let k = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // Blank line → paragraph break
    if (!line) { i++; continue; }

    let m;
    // ### → smaller orange bold header. Allow `###Title` as well as the
    // usual markdown `### Title`, since model output is not always uniform.
    if ((m = line.match(/^#{3,}\s*(.+)$/))) {
      out.push(<div key={`${keyBase}-h3-${k++}`} style={fmtH3Style}>{renderInline(m[1], `${keyBase}-h3x${k}`)}</div>);
      i++; continue;
    }
    // ## (or a lone #) → larger orange header
    if ((m = line.match(/^#{1,2}\s*(.+)$/))) {
      out.push(<div key={`${keyBase}-h2-${k++}`} style={fmtH2Style}>{renderInline(m[1], `${keyBase}-h2x${k}`)}</div>);
      i++; continue;
    }
    // - / * / • → bullet points with an orange dot (group consecutive runs)
    const bulletMatch = line.match(/^[-*•](?:\s+)(.+)$/);
    if (bulletMatch) {
      const items = [];
      while (i < lines.length) {
        const bm = lines[i].trim().match(/^[-*•](?:\s+)(.+)$/);
        if (!bm) break;
        items.push(bm[1]);
        i++;
      }
      const key = `${keyBase}-ul-${k++}`;
      out.push(
        <ul key={key} role="list" style={{ listStyle: 'none', padding: 0, margin: '6px 0 10px' }}>
          {items.map((it, j) => (
            <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '3px 0' }}>
              <span aria-hidden="true" style={{
                width: 6, height: 6, borderRadius: '50%',
                background: ORANGE, boxShadow: `0 0 6px ${ORANGE}`,
                flex: 'none', marginTop: 7,
              }} />
              <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>{renderInline(it, `${key}-${j}`)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }
    // 1. / 2) → numbered list items (group consecutive runs). Preserve
    // the number supplied by NOVA instead of silently renumbering it.
    const numberMatch = line.match(/^\d+[.)](?:\s+)(.+)$/);
    if (numberMatch) {
      const items = [];
      while (i < lines.length) {
        const nm = lines[i].trim().match(/^(\d+)[.)](?:\s+)(.+)$/);
        if (!nm) break;
        items.push({ number: nm[1], text: nm[2] });
        i++;
      }
      const key = `${keyBase}-ol-${k++}`;
      out.push(
        <ol key={key} role="list" style={{ listStyle: 'none', padding: 0, margin: '6px 0 10px' }}>
          {items.map((it, j) => (
            <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '3px 0' }}>
              <span style={{
                flex: 'none', minWidth: 24, textAlign: 'right',
                fontFamily: MONO, fontSize: 11, fontWeight: 700,
                color: ORANGE, marginTop: 1,
              }}>{it.number}.</span>
              <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>{renderInline(it.text, `${key}-${j}`)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }
    // Plain paragraph line
    out.push(
      <p key={`${keyBase}-p-${k++}`} style={{ margin: '0 0 8px', lineHeight: 1.65, wordBreak: 'break-word' }}>
        {renderInline(line, `${keyBase}-px${k}`)}
      </p>
    );
    i++;
  }
  return out;
}

/* Full response renderer: first carves out fenced ``` code blocks, then
   formats each remaining text chunk line-by-line. */
function renderNovaText(text) {
  if (!text) return null;
  const segments = [];
  let last = 0; let m;
  FMT_FENCE_RE.lastIndex = 0;
  while ((m = FMT_FENCE_RE.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: 'text', value: text.slice(last, m.index) });
    segments.push({ type: 'code', lang: (m[1] || '').trim(), value: m[2].replace(/\r?\n$/, '') });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ type: 'text', value: text.slice(last) });

  return segments.map((seg, i) => {
    if (seg.type === 'code') {
      return (
        <div key={`seg-${i}`} style={{ position: 'relative', margin: '10px 0' }}>
          {seg.lang && (
            <span style={{
              position: 'absolute', top: 7, right: 10,
              fontFamily: MONO, fontSize: 8, letterSpacing: 1.6,
              color: '#7a5a36', textTransform: 'uppercase', pointerEvents: 'none',
            }}>{seg.lang}</span>
          )}
          <pre style={fmtCodeBlockStyle}>{seg.value}</pre>
        </div>
      );
    }
    return <React.Fragment key={`seg-${i}`}>{renderFormattedLines(seg.value, `seg${i}`)}</React.Fragment>;
  });
}

/* ═══════════════ NOVA OUTPUT MODAL / BOTTOM SHEET ═══════════════ */
// The waiting state lives inside the same output panel as the final answer,
// so opening the panel never waits for the network request to finish.
function NOVAThinkingState() {
  const bars = [22, 34, 48, 30, 58, 39, 70, 46, 62, 32, 54, 42, 66, 30, 50, 38, 60, 28, 46, 34, 56, 26];
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="NOVA is thinking"
      style={{
        minHeight: 220,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        padding: '26px 14px 30px',
        textAlign: 'center',
      }}
    >
      <div style={{
        width: 62,
        height: 62,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        border: '1px solid rgba(255,154,38,0.48)',
        background: 'radial-gradient(circle, rgba(255,154,38,0.24), rgba(255,154,38,0.03) 62%, transparent 70%)',
        boxShadow: '0 0 22px rgba(255,154,38,0.28), inset 0 0 16px rgba(255,154,38,0.14)',
        animation: 'novaThinkingPulse 1.7s ease-in-out infinite',
      }}>
        <Sparkles size={24} color={ORANGE} strokeWidth={1.6} />
      </div>
      <div>
        <div style={{
          color: ORANGE,
          fontFamily: 'Orbitron, monospace',
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: 1.8,
          textShadow: '0 0 12px rgba(255,154,38,0.52)',
          animation: 'novaThinkingPulse 1.7s ease-in-out infinite',
        }}>
          NOVA is thinking<span aria-hidden="true" style={{ display: 'inline-block', width: 22, textAlign: 'left' }}>...</span>
        </div>
        <div style={{
          marginTop: 7,
          color: '#9a7bff',
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: 1.5,
        }}>
          PROCESSING REQUEST · UPLINK ACTIVE
        </div>
      </div>
      <div
        aria-hidden="true"
        style={{
          width: 'min(100%, 270px)',
          height: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          padding: '0 10px',
          borderTop: '1px solid rgba(255,154,38,0.16)',
          borderBottom: '1px solid rgba(255,154,38,0.16)',
          background: 'rgba(0,0,0,0.24)',
        }}
      >
        {bars.map((height, i) => (
          <span
            key={i}
            style={{
              width: 3,
              height: `${height}%`,
              minHeight: 7,
              maxHeight: 31,
              borderRadius: 2,
              background: 'linear-gradient(180deg, #ffd28a, #ff8b16)',
              boxShadow: '0 0 6px rgba(255,154,38,0.48)',
              transformOrigin: 'center',
              animation: `novaThinkingWave 900ms ease-in-out infinite ${i * 45}ms`,
            }}
          />
        ))}
      </div>
      <div style={{
        color: '#7a5a36',
        fontFamily: MONO,
        fontSize: 8,
        letterSpacing: 1.4,
      }}>
        GENERATING RESPONSE
      </div>
    </div>
  );
}

// Shared content body for the output panel: optional raw-error debug block
// plus the right renderer (weekly report / SEO structured / formatted text).
function NOVAOutputContent({ output, agent, seoMode, weeklyMode, loading = false }) {
  return (
    <div style={{
      fontFamily: 'var(--fb), system-ui, sans-serif',
      fontSize: 13,
      color: '#e8c98a',
      lineHeight: 1.7,
      wordBreak: 'break-word',
    }}>
      <style>{`
        @keyframes novaThinkingPulse {
          0%, 100% { opacity: .62; transform: scale(.98); }
          50% { opacity: 1; transform: scale(1.03); }
        }
        @keyframes novaThinkingWave {
          0%, 100% { opacity: .35; transform: scaleY(.34); }
          50% { opacity: 1; transform: scaleY(1); }
        }
        @keyframes novaResponseFadeIn {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {loading ? (
        <NOVAThinkingState />
      ) : output ? (
        <div
          key={`nova-response-${output}`}
          style={{ animation: 'novaResponseFadeIn 420ms ease-out both' }}
        >
          {/* TEMPORARY DEBUG: if the response contains "Error:", surface the
              raw error verbatim at the top so we can see exactly which API
              is failing and why. */}
          {typeof output === 'string' && /Error:/i.test(output) && (
            <div style={{
              marginBottom: 12, padding: '10px 12px',
              background: 'rgba(255,74,74,0.12)',
              border: '1px solid rgba(255,74,74,0.55)',
              borderRadius: 4,
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: 11,
              color: '#ffb4a8',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: 2, color: '#ff6a4a', marginBottom: 6 }}>
                ⚠ RAW API ERROR (debug)
              </div>
              {output}
            </div>
          )}
          {weeklyMode ? <WeeklyReportModalBody output={output} /> : seoMode ? <SEOModalBody output={output} /> : renderNovaText(output)}
        </div>
      ) : null}
    </div>
  );
}

/* Desktop: centered, scrollable dialog. Closes on backdrop click or Esc. */
function NOVAOutputDesktopModal({ output, agent, onClose, loading = false }) {
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!output && !loading) return null;

  const seoMode = !loading && isSeoResponse(agent, output);
  const weeklyMode = !loading && parseWeeklyReport(output) !== null;

  const copyAll = async () => {
    if (loading || !output) return;
    const ok = await copyToClipboard(output);
    if (ok) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
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
        width: '100%', maxWidth: '680px',
        maxHeight: '80vh', overflow: 'auto',
        boxShadow: '0 0 40px rgba(255,130,10,0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 10, color: ORANGE, letterSpacing: 2 }}>
            ⚡ {agent} — OUTPUT
            <span style={{ color: '#9a7bff', marginLeft: 6, fontWeight: 400 }}>· powered by {modelForAgent(agent)}</span>
            {weeklyMode && <span style={{ color: '#ff9a26', marginLeft: 6 }}>· MONDAY BRIEFING</span>}
            {!weeklyMode && seoMode && <span style={{ color: '#35e08a', marginLeft: 6 }}>· SEO STRUCTURED</span>}
            {loading && <span style={{ color: ORANGE, marginLeft: 6 }}>· PROCESSING</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={copyAll}
              disabled={loading || !output}
              style={{ ...btnStyle, color: copiedAll ? '#35e08a' : ORANGE, opacity: loading ? 0.5 : 1 }}
              title={loading ? 'Waiting for NOVA response' : 'Copy full response'}
            >
              {copiedAll ? '✓ COPIED ALL' : '⎘ COPY ALL'}
            </button>
            <button onClick={onClose} style={btnStyle}>CLOSE</button>
          </div>
        </div>
        <NOVAOutputContent output={output} agent={agent} seoMode={seoMode} weeklyMode={weeklyMode} loading={loading} />
      </div>
    </div>
  );
}

/* Mobile: full-screen bottom sheet that slides up from the bottom.
   - 80% of screen height when expanded, ~46% peek when collapsed
   - drag handle: tap to expand/collapse, drag down to close
   - scrollable body for long responses
   - tapping the backdrop closes it too                              */
function NOVAOutputSheet({ output, agent, onClose, loading = false }) {
  const [entered, setEntered] = useState(false);   // drives slide-up entrance
  const [expanded, setExpanded] = useState(true);  // opens fully expanded
  const [dragOffset, setDragOffset] = useState(0); // live drag translation
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const dragInfo = useRef(null);
  const closingRef = useRef(false);
  const closeTimerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  // Keep the delayed close callback current without rebinding the body-lock
  // effect every time the parent changes loading/output state.
  onCloseRef.current = onClose;

  /* Animated close: slide back down, then unmount. A ref prevents a second
     backdrop tap or Escape press from scheduling another unmount callback
     while the sheet is already sliding away. */
  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    closeTimerRef.current = setTimeout(() => onCloseRef.current(), 300);
  };

  // Slide in after mount + lock background scroll while open. The inner
  // response region remains the only scroll container while the sheet is up.
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 25);
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = prevOverscroll;
      window.removeEventListener('keydown', onKey);
    };
    // `close` intentionally uses refs so this listener is not rebound for
    // every render while the copy button or drag gesture updates state.
  }, []);

  if (!output && !loading) return null;

  const seoMode = !loading && isSeoResponse(agent, output);
  const weeklyMode = !loading && parseWeeklyReport(output) !== null;

  const copyAll = async () => {
    if (loading || !output) return;
    const ok = await copyToClipboard(output);
    if (ok) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    }
  };

  /* ── Drag handle gestures (pointer events cover touch + mouse) ── */
  const onHandlePointerDown = (e) => {
    dragInfo.current = { startY: e.clientY, moved: false };
    setDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const onHandlePointerMove = (e) => {
    const info = dragInfo.current;
    if (!info) return;
    const dy = e.clientY - info.startY;
    if (Math.abs(dy) > 6) info.moved = true;
    // Downward drag translates the sheet 1:1; upward drag is rubber-banded.
    setDragOffset(dy > 0 ? dy : dy * 0.12);
  };
  const onHandlePointerUp = (e) => {
    const info = dragInfo.current;
    if (!info) return;
    const dy = e.clientY - info.startY;
    const moved = info.moved;
    dragInfo.current = null;
    setDragging(false);
    setDragOffset(0);
    if (dy > 90) { close(); return; }              // drag down → close
    if (!moved) { setExpanded((v) => !v); return; } // tap → expand/collapse
    if (dy < -30) setExpanded(true);                // drag up → expand
    else if (dy > 30) setExpanded(false);           // small drag down → collapse
  };
  const onHandlePointerCancel = () => {
    dragInfo.current = null;
    setDragging(false);
    setDragOffset(0);
  };

  const sheetHeight = expanded ? '80vh' : '46vh';
  const translateY = closing || !entered
    ? '100%'
    : dragging
      ? `${Math.max(0, dragOffset)}px`
      : '0%';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999 }}>
      {/* Backdrop — tapping outside the sheet closes it */}
      <div
        onClick={close}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.68)', backdropFilter: 'blur(4px)',
          opacity: entered && !closing ? 1 : 0,
          transition: 'opacity 260ms ease',
        }}
      />
      {/* Sheet */}
      <div
        id="nova-output-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`${agent} output`}
        style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        width: '100%',
        height: sheetHeight,
        // `80vh` is the requested expanded size; maxHeight gives mobile
        // browsers with dynamic toolbars a safe fallback without shrinking
        // the full-width bottom-sheet layout on desktop-sized emulators.
        maxHeight: expanded ? '80dvh' : '46dvh',
        minHeight: 0,
        background: 'linear-gradient(180deg, #1a0e03 0%, #0a0500 100%)',
        borderTop: '1px solid rgba(255,154,38,0.5)',
        borderRadius: '18px 18px 0 0',
        boxShadow: '0 -8px 40px rgba(255,130,10,0.22), 0 -2px 12px rgba(0,0,0,0.6)',
        transform: `translateY(${translateY})`,
        transition: dragging
          ? 'none'
          : 'transform 300ms cubic-bezier(0.32,0.72,0.35,1), height 300ms cubic-bezier(0.32,0.72,0.35,1)',
        display: 'flex', flexDirection: 'column',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        overscrollBehavior: 'contain',
        willChange: 'transform, height',
      }}>
        {/* Drag handle */}
        <div
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerCancel}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setExpanded((v) => !v);
            }
          }}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          aria-controls="nova-output-sheet-body"
          aria-label={expanded ? 'Collapse or drag down to close' : 'Expand or drag down to close'}
          style={{
            flex: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '12px 16px 8px',
            cursor: 'grab', touchAction: 'none', userSelect: 'none',
          }}
        >
          <span style={{
            width: 48, height: 5, borderRadius: 999,
            background: 'rgba(255,154,38,0.55)',
            boxShadow: '0 0 8px rgba(255,154,38,0.35)',
          }} />
          <span style={{
            marginTop: 5,
            fontFamily: 'var(--fm)', fontSize: 7.5, letterSpacing: 1.6,
            color: '#7a5a36', textTransform: 'uppercase',
          }}>
            {expanded ? 'tap to collapse · drag down to close' : 'tap to expand · drag down to close'}
          </span>
        </div>

        {/* Header: agent title + COPY ALL + close */}
        <div style={{
          flex: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, padding: '0 14px 10px',
          borderBottom: '1px solid rgba(255,154,38,0.18)',
        }}>
          <div style={{
            minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: 'Orbitron, monospace', fontSize: 10, color: ORANGE, letterSpacing: 1.6,
          }}>
            ⚡ {agent} — OUTPUT
            <span style={{ color: '#9a7bff', marginLeft: 6, fontWeight: 400 }}>· {modelForAgent(agent)}</span>
            {weeklyMode && <span style={{ color: '#ff9a26', marginLeft: 6 }}>· BRIEFING</span>}
            {!weeklyMode && seoMode && <span style={{ color: '#35e08a', marginLeft: 6 }}>· SEO</span>}
            {loading && <span style={{ color: ORANGE, marginLeft: 6 }}>· PROCESSING</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
            <button
              type="button"
              onClick={copyAll}
              disabled={loading || !output}
              title={loading ? 'Waiting for NOVA response' : 'Copy full response'}
              style={{
                ...btnStyle,
                color: copiedAll ? '#35e08a' : ORANGE,
                opacity: loading ? 0.5 : 1,
                padding: '6px 10px', fontSize: 9,
              }}
            >{copiedAll ? '✓ COPIED ALL' : '⎘ COPY ALL'}</button>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              style={{
                ...btnStyle,
                padding: '6px 8px',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}
            ><X size={13} strokeWidth={2} /></button>
          </div>
        </div>

        {/* Scrollable response body. `minHeight: 0` is important inside the
            flex column; without it, long responses can force the sheet past
            the viewport instead of scrolling inside the 80vh panel. */}
        <div id="nova-output-sheet-body" style={{
          flex: 1, minHeight: 0,
          overflowY: 'auto', overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
          padding: '14px 16px 26px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,154,38,0.4) transparent',
        }}>
          <NOVAOutputContent output={output} agent={agent} seoMode={seoMode} weeklyMode={weeklyMode} loading={loading} />
          <div style={{
            marginTop: 20, paddingTop: 10,
            borderTop: '1px dashed rgba(255,154,38,0.16)',
            textAlign: 'center',
            fontFamily: 'var(--fm)', fontSize: 8, letterSpacing: 1.6, color: '#5c452c',
          }}>
            END OF RESPONSE · DRAG HANDLE DOWN OR TAP OUTSIDE TO CLOSE
          </div>
        </div>
      </div>
    </div>
  );
}

/* Entry point — bottom sheet on mobile, centered dialog on desktop. */
function NOVAOutputModal(props) {
  const isMobile = useIsMobile();
  return isMobile
    ? <NOVAOutputSheet {...props} />
    : <NOVAOutputDesktopModal {...props} />;
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
  const outputRequestRef = useRef(0);

  /* Voice input. While a recognition session is live, `interim` is
     pushed into `cmd` in real time so the user sees their words appear
     in the input. When the session ends cleanly, the final transcript
     stays in the input and we auto-execute. */
  const voice = useVoiceInput({
    onFinal: (text) => {
      setCmd(text);
      // Pass the transcript directly; waiting for React state to commit
      // before calling exec() can otherwise execute the previous input.
      requestAnimationFrame(() => exec(text, { preserveInput: true }));
    },
  });
  useEffect(() => {
    // While listening, show interim transcript in the input. When the
    // session ends, do NOT clear the input — the `onFinal` callback
    // already wrote the final transcript there, and any subsequent
    // typing by the user should be preserved.
    if (voice.listening) {
      setCmd(voice.interim);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.interim, voice.listening]);

  const exec = async (command = cmd, { preserveInput = false } = {}) => {
    const commandText = typeof command === 'string' ? command : cmd;
    if (!commandText.trim() || thinking) return;
    // Stop any active voice session so the listening UI doesn't linger
    // while a command is in flight.
    if (voice.listening) voice.stop();
    const userCmd = commandText.trim();
    const det = detectAgent(userCmd);
    const requestId = ++outputRequestRef.current;
    setAgent(det);
    if (!preserveInput) setCmd('');
    setFlash(true);
    setTimeout(() => setFlash(false), 480);
    // Open the output panel before the network call starts so the user gets
    // immediate feedback instead of waiting for the first response byte.
    setOutput(null);
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
      if (requestId === outputRequestRef.current) setOutput(reply);
      // follow-up entry with the result summary
      pushActivity({
        t: nowStamp(),
        name: det,
        icon: agentIconFor(det),
        text: `✓ ${summarizeCmd(reply, 70)}`,
        status: 'SUCCESS',
      });
      // Persist to the localStorage-backed history ring so the user
      // can review the conversation and NOVA has it on next session.
      pushHistoryEntry(userCmd, det, reply);
    } else {
      if (requestId === outputRequestRef.current) setOutput(reply);
      pushActivity({
        t: nowStamp(),
        name: det,
        icon: agentIconFor(det),
        text: '✗ Connection interrupted. Retry.',
        status: 'FAILED',
      });
      pushHistoryEntry(userCmd, det, reply);
    }
    if (requestId === outputRequestRef.current) setThinking(false);
  };
  const closeOutput = () => {
    // Invalidate a request whose panel was dismissed so its late response
    // cannot reopen the modal after the user starts a new command.
    outputRequestRef.current += 1;
    setOutput(null);
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
        <div style={{ position: 'absolute', right: 246, top: 8, fontFamily: 'var(--fm)', fontSize: 7, color: 'var(--tx-faint)', letterSpacing: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
          {voice.listening ? (
            <span className="nova-listening-pill"><span className="dot" />LISTENING...</span>
          ) : voice.error ? (
            <span className="nova-voice-error" title={voice.error}>{voice.error}</span>
          ) : (
            <span>UPLINK SECURE</span>
          )}
        </div>
        <input className="cmdinput" style={{ left: 24, top: 13, width: 428, height: 34 }}
          placeholder={voice.listening ? 'LISTENING...' : voice.error || 'ENTER COMMAND...'}
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && exec()} />
        <Chamfer x={468} y={12} w={34} h={34} c={6}>
          <MicButton voice={voice} size={28} variant="desktop" />
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

      {/* ── Quick-prompt chips: sit just below the input bar and fill the
           command input with a pre-written prompt when clicked.          */}
      <div
        className="quick-chip-row"
        style={{
          position: 'absolute', left: 6, top: 1022, width: 1556, height: 32,
          display: 'flex', alignItems: 'center', gap: 8,
          overflowX: 'auto', overflowY: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,154,38,0.4) transparent',
          paddingLeft: 6,
        }}
      >
        <span style={{
          fontFamily: 'var(--fm)', fontSize: 8, color: '#7a5a36',
          letterSpacing: 1.4, paddingRight: 4, flex: 'none',
        }}>QUICK ▸</span>
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q.id}
            type="button"
            title={q.prompt}
            onClick={() => { setCmd(q.prompt); setFlash(true); setTimeout(() => setFlash(false), 380); }}
            className="quick-chip"
            style={{
              flex: 'none',
              height: 26, padding: '0 12px',
              background: 'linear-gradient(180deg, rgba(255,154,38,0.12), rgba(255,154,38,0.04))',
              border: '1px solid rgba(255,154,38,0.4)',
              color: '#ffb443',
              fontFamily: 'var(--fm)', fontSize: 9.5, letterSpacing: 1.4, fontWeight: 700,
              borderRadius: 3, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 5,
              boxShadow: '0 0 6px rgba(255,154,38,0.18), inset 0 0 0 1px rgba(255,154,38,0.08)',
              transition: 'background 120ms, box-shadow 120ms, color 120ms, transform 80ms',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,154,38,0.28), rgba(255,154,38,0.10))';
              e.currentTarget.style.color = '#fff1d4';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(255,154,38,0.45), inset 0 0 0 1px rgba(255,154,38,0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,154,38,0.12), rgba(255,154,38,0.04))';
              e.currentTarget.style.color = '#ffb443';
              e.currentTarget.style.boxShadow = '0 0 6px rgba(255,154,38,0.18), inset 0 0 0 1px rgba(255,154,38,0.08)';
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(1px)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff9a26', boxShadow: '0 0 5px #ff9a26' }} />
            {q.label}
          </button>
        ))}
      </div>

      {(output || thinking) && <NOVAOutputModal output={output} agent={agent} loading={thinking} onClose={closeOutput} />}
    </>
  );
}

/* ═══════════════ ROOT ═══════════════ */
function DesktopNOVA() {
  const vpRef = useRef(null);
  const [activeNav, setActiveNav] = useState('dashboard');
  // When the user picks a history entry from the Data Vault view, we
  // store it here so we can open the response in a NOVAOutputModal.
  const [historyEntry, setHistoryEntry] = useState(null);

  useEffect(() => {
    const el = vpRef.current;
    const set = () => {
      const s = Math.min(window.innerWidth / 1564, window.innerHeight / 1056);
      el.style.setProperty('--s', s);
    };
    set();
    window.addEventListener('resize', set);
    return () => window.removeEventListener('resize', set);
  }, []);

  // Tapping the same nav item again closes the vault overlay (a tiny
  // UX nicety so the user doesn't get stuck).
  const handleNav = (id) => {
    setActiveNav((prev) => (prev === id && id === 'vault' ? 'dashboard' : id));
    if (id !== 'vault') setHistoryEntry(null);
  };

  return (
    <div className="viewport" ref={vpRef}>
      <div className="design">
        <div className="backdrop grid" />
        <div className="backdrop vignette" />
        <TopBar />
        <LeftRail activeNav={activeNav} setActiveNav={handleNav} />
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
      {activeNav === 'vault' && (
        <HistoryOverlay
          onOpen={(e) => setHistoryEntry(e)}
          onClose={() => setActiveNav('dashboard')}
          label="DATA VAULT"
        />
      )}
      {historyEntry && (
        <NOVAOutputModal
          output={historyEntry.response}
          agent={historyEntry.agent}
          onClose={() => setHistoryEntry(null)}
        />
      )}
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
  { id: 'history', target: 'history', icon: 'history', label: 'HISTORY' },
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
  const outputRequestRef = useRef(0);

  /* Voice input — same as desktop: show interim in real time, auto-exec
     on session end. */
  const voice = useVoiceInput({
    onFinal: (text) => {
      setCmd(text);
      // Use the final transcript as the command argument so the
      // auto-submit cannot read stale input state.
      requestAnimationFrame(() => exec(text, { preserveInput: true }));
    },
  });
  useEffect(() => {
    if (voice.listening) setCmd(voice.interim);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.interim, voice.listening]);

  const exec = async (command = cmd, { preserveInput = false } = {}) => {
    const commandText = typeof command === 'string' ? command : cmd;
    if (!commandText.trim() || thinking) return;
    if (voice.listening) voice.stop();
    const userCmd = commandText.trim();
    const det = detectAgent(userCmd);
    const requestId = ++outputRequestRef.current;
    setAgent(det);
    if (!preserveInput) setCmd('');
    // Mount the response sheet immediately; it will show the thinking
    // animation until the provider returns.
    setOutput(null);
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
      if (requestId === outputRequestRef.current) setOutput(reply);
      pushActivity({
        t: nowStamp(),
        name: det,
        icon: agentIconFor(det),
        text: `✓ ${summarizeCmd(reply, 70)}`,
        status: 'SUCCESS',
      });
      pushHistoryEntry(userCmd, det, reply);
    } else {
      if (requestId === outputRequestRef.current) setOutput(reply);
      pushActivity({
        t: nowStamp(),
        name: det,
        icon: agentIconFor(det),
        text: '✗ Connection interrupted. Retry.',
        status: 'FAILED',
      });
      pushHistoryEntry(userCmd, det, reply);
    }
    if (requestId === outputRequestRef.current) setThinking(false);
    setTimeout(() => setExecuted(false), 1200);
  };
  const closeOutput = () => {
    outputRequestRef.current += 1;
    setOutput(null);
    setThinking(false);
  };
  return (
    <div className={`mobile-command-console ${executed ? 'executed' : ''}`}>
      <div className="mobile-console-status">
        <span><i />NOVA COMMAND LINK</span>
        <small>
          {executed
            ? 'COMMAND ACCEPTED'
            : voice.listening
              ? <span className="nova-listening-pill"><span className="dot" />LISTENING...</span>
              : voice.error
                ? <span style={{ color: '#ffb6a3' }}>{voice.error}</span>
                : 'UPLINK SECURE'}
        </small>
      </div>
      <div className="mobile-console-input-row">
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && exec()}
          placeholder={voice.listening ? 'LISTENING...' : voice.error || 'ENTER COMMAND...'}
          aria-label="Enter command"
        />
        <MicButton voice={voice} size={44} variant="mobile" />
        <button type="button" className="mobile-execute" onClick={exec} disabled={thinking}>{thinking ? 'PROCESSING...' : 'EXECUTE'}</button>
      </div>
      <div
        className="mobile-quick-chips"
        style={{
          marginTop: 8,
          display: 'flex', alignItems: 'center', gap: 6,
          overflowX: 'auto', overflowY: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,154,38,0.4) transparent',
          paddingBottom: 2,
        }}
      >
        <span style={{
          fontFamily: 'var(--fm)', fontSize: 7.5, color: '#7a5a36',
          letterSpacing: 1.4, paddingRight: 2, flex: 'none',
        }}>QUICK ▸</span>
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q.id}
            type="button"
            title={q.prompt}
            onClick={() => setCmd(q.prompt)}
            style={{
              flex: 'none',
              height: 22, padding: '0 9px',
              background: 'linear-gradient(180deg, rgba(255,154,38,0.14), rgba(255,154,38,0.04))',
              border: '1px solid rgba(255,154,38,0.4)',
              color: '#ffb443',
              fontFamily: 'var(--fm)', fontSize: 8, letterSpacing: 1.2, fontWeight: 700,
              borderRadius: 3, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 4,
              boxShadow: '0 0 5px rgba(255,154,38,0.16), inset 0 0 0 1px rgba(255,154,38,0.06)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff1d4'; e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,154,38,0.28), rgba(255,154,38,0.10))'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#ffb443'; e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,154,38,0.14), rgba(255,154,38,0.04))'; }}
          >
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ff9a26', boxShadow: '0 0 4px #ff9a26' }} />
            {q.label}
          </button>
        ))}
      </div>
      {(output || thinking) && <NOVAOutputModal output={output} agent={agent} loading={thinking} onClose={closeOutput} />}
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
  // History view: set to a history entry when the user taps a row in
  // the HistoryView, so we can pop NOVAOutputModal with the response.
  const [historyEntry, setHistoryEntry] = useState(null);

  const go = (nav) => {
    setActiveNav(nav.id);
    // The 'history' tab opens an overlay panel instead of scrolling
    // to a section, so it intentionally has no `target` element.
    if (nav.target && nav.target !== 'history') {
      document.getElementById(nav.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
      <MobileWeeklyFab />
      <MobileBottomNav active={activeNav} onNav={go} />
      <MobileAgentModal agent={activeAgent} onClose={() => setActiveAgent(null)} />
      {activeNav === 'history' && (
        <HistoryOverlay
          onOpen={(e) => setHistoryEntry(e)}
          onClose={() => setActiveNav('home')}
          label="COMMAND HISTORY"
        />
      )}
      {historyEntry && (
        <NOVAOutputModal
          output={historyEntry.response}
          agent={historyEntry.agent}
          onClose={() => setHistoryEntry(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════ MOBILE WEEKLY REPORT FAB ═══════════════ */
// One-tap floating action button that fires the Monday morning briefing
// and opens the same NOVAOutputModal the desktop console uses. The FAB
// sits above the mobile command console on the right edge so it never
// fights with the input field.
function MobileWeeklyFab() {
  const [thinking, setThinking] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [output, setOutput] = useState(null);
  const [agent, setAgent] = useState('NOVA');
  const outputRequestRef = useRef(0);

  // Soft attention pulse stops once the user has triggered it once so
  // the FAB doesn't keep nagging. Re-enables on a fresh page load.
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 12000);
    return () => clearTimeout(t);
  }, []);

  const trigger = async () => {
    if (thinking) return;
    const userCmd = 'weekly report';
    const det = 'ANALYTICS';
    const requestId = ++outputRequestRef.current;
    setAgent(det);
    setOutput(null);
    setThinking(true);
    pushActivity({
      t: nowStamp(),
      name: det,
      icon: agentIconFor(det),
      text: '↳ weekly report (FAB)',
      status: 'PROCESSING',
    });
    const { ok, reply } = await logNovaCommand(userCmd, det, () => sendToNOVA(userCmd));
    if (ok) {
      if (requestId === outputRequestRef.current) setOutput(reply);
      pushActivity({
        t: nowStamp(),
        name: det,
        icon: agentIconFor(det),
        text: `✓ ${summarizeCmd(reply, 60)}`,
        status: 'SUCCESS',
      });
      pushHistoryEntry(userCmd, det, reply);
    } else {
      if (requestId === outputRequestRef.current) setOutput(reply);
      pushActivity({
        t: nowStamp(),
        name: det,
        icon: agentIconFor(det),
        text: '✗ Connection interrupted. Retry.',
        status: 'FAILED',
      });
      pushHistoryEntry(userCmd, det, reply);
    }
    if (requestId === outputRequestRef.current) setThinking(false);
  };
  const closeOutput = () => {
    outputRequestRef.current += 1;
    setOutput(null);
    setThinking(false);
  };

  return (
    <>
      <button
        type="button"
        className="mobile-weekly-fab"
        onClick={trigger}
        disabled={thinking}
        title={thinking ? 'Generating briefing…' : 'Run Monday morning briefing'}
        style={{
          position: 'fixed',
          right: 14,
          bottom: 218, // sits above the command console (which lives at bottom: 60–62px)
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: thinking
            ? 'linear-gradient(160deg, #2c1c0c, #1a0e03)'
            : 'linear-gradient(160deg, #ff9a26 0%, #e8721a 55%, #b04a05 100%)',
          border: '1px solid rgba(255,194,77,0.55)',
          color: '#fff1d4',
          cursor: thinking ? 'wait' : 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 1,
          fontFamily: 'Orbitron, monospace',
          fontWeight: 700,
          letterSpacing: 0.5,
          zIndex: 70,
          boxShadow: thinking
            ? '0 0 10px rgba(255,154,38,0.20), inset 0 0 8px rgba(0,0,0,0.5)'
            : '0 0 22px rgba(255,154,38,0.55), 0 0 6px rgba(255,194,77,0.85), inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -2px 6px rgba(0,0,0,0.25)',
          animation: pulse && !thinking ? 'novaFabPulse 2.4s ease-in-out infinite' : 'none',
          transition: 'transform 100ms, background 200ms, box-shadow 200ms',
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
        onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {thinking ? (
          <>
            <FileText size={20} strokeWidth={1.8} color="#ffb443" />
            <span style={{ fontSize: 7, letterSpacing: 1.4, color: '#ffb443', marginTop: 1 }}>SYNC…</span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 20, lineHeight: 1 }}>📋</span>
            <span style={{ fontSize: 7, letterSpacing: 1.4, marginTop: 1 }}>WEEKLY</span>
          </>
        )}
      </button>
      {(output || thinking) && <NOVAOutputModal output={output} agent={agent} loading={thinking} onClose={closeOutput} />}
      <style>{`
        @keyframes novaFabPulse {
          0%, 100% { box-shadow: 0 0 22px rgba(255,154,38,0.55), 0 0 6px rgba(255,194,77,0.85), inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -2px 6px rgba(0,0,0,0.25); }
          50%      { box-shadow: 0 0 30px rgba(255,154,38,0.85), 0 0 12px rgba(255,194,77,1.0), inset 0 1px 0 rgba(255,255,255,0.40), inset 0 -2px 6px rgba(0,0,0,0.25); }
        }
      `}</style>
    </>
  );
}

/* ═══════════════ HISTORY VIEW ═══════════════ */
// Lists past commands + responses grouped by date (Today / Yesterday /
// Earlier). Tapping an entry opens the full response in the standard
// NOVAOutputModal so the same SEO / Weekly / plain renderers apply.
// A CLEAR HISTORY button at the top wipes both the in-memory ring and
// the localStorage copy.
function dayBucket(ts) {
  const d = new Date(ts);
  const now = new Date();
  const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = startOfDay(now) - startOfDay(d);
  if (diff <= 0) return 'Today';
  if (diff <= 86400000) return 'Yesterday';
  return 'Earlier';
}

function formatTime(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formatDateLabel(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/* Shared row — used by both the desktop and mobile variants. The
   onClick handler is supplied by the parent (typically opens the
   response in a NOVAOutputModal). */
function HistoryRow({ entry, onOpen }) {
  const preview = (entry.response || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className="history-row"
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        background: 'linear-gradient(180deg, rgba(255,154,38,0.06), rgba(255,154,38,0.02))',
        border: '1px solid rgba(255,154,38,0.22)',
        borderRadius: 4,
        padding: '10px 12px',
        marginBottom: 6,
        cursor: 'pointer',
        color: '#e8c98a',
        fontFamily: 'var(--fb), system-ui, sans-serif',
        transition: 'background 150ms, border-color 150ms, transform 80ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,154,38,0.14), rgba(255,154,38,0.04))';
        e.currentTarget.style.borderColor = 'rgba(255,154,38,0.45)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255,154,38,0.06), rgba(255,154,38,0.02))';
        e.currentTarget.style.borderColor = 'rgba(255,154,38,0.22)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, rgba(255,154,38,0.18), rgba(16,9,3,0.6))', border: '1px solid rgba(255,154,38,0.40)', borderRadius: 4, color: ORANGE, flex: 'none' }}>
          <Ic name={agentIconFor(entry.agent)} size={11} />
        </span>
        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: 1.4, color: ORANGE, fontWeight: 700 }}>{entry.agent}</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--fm)', fontSize: 8.5, color: '#7a5a36', letterSpacing: 1, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Clock size={9} strokeWidth={1.8} /> {formatTime(entry.timestamp)}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#ffd9a8', fontWeight: 600, lineHeight: 1.35, wordBreak: 'break-word', marginBottom: 4 }}>
        {entry.cmd}
      </div>
      <div style={{ fontSize: 10.5, color: '#9a7bff', lineHeight: 1.45, fontStyle: 'italic' }}>
        ↳ {preview}{preview.length >= 100 ? '…' : ''}
      </div>
    </button>
  );
}

function HistoryView({ onOpen, onClose, compact = false }) {
  const items = useNovaHistory();
  const [confirmClear, setConfirmClear] = useState(false);

  // Group by day bucket, preserving the newest-first ordering from the
  // store. We walk backwards so the most recent entry ends up on top.
  const groups = {};
  const order = [];
  for (let i = items.length - 1; i >= 0; i--) {
    const bucket = dayBucket(items[i].timestamp);
    if (!groups[bucket]) { groups[bucket] = []; order.push(bucket); }
    groups[bucket].push(items[i]);
  }

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      // Auto-cancel the confirm state after 4s so it doesn't stick.
      setTimeout(() => setConfirmClear(false), 4000);
      return;
    }
    clearHistory();
    setConfirmClear(false);
  };

  return (
    <div className="history-view" style={{
      display: 'flex', flexDirection: 'column',
      height: compact ? '100%' : 'auto',
      minHeight: compact ? 0 : 360,
      color: '#e8c98a',
      fontFamily: 'var(--fb), system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12, gap: 10, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={16} color={ORANGE} strokeWidth={1.8} />
          <div>
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 11, color: ORANGE, letterSpacing: 2.4, fontWeight: 700 }}>COMMAND HISTORY</div>
            <div style={{ fontFamily: 'var(--fm)', fontSize: 8.5, color: '#7a5a36', letterSpacing: 1.4, marginTop: 2 }}>
              {items.length} of {MAX_HISTORY} entries · localStorage-backed
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleClear}
            disabled={items.length === 0}
            className={confirmClear ? 'is-confirming' : ''}
            style={{
              background: confirmClear
                ? 'linear-gradient(180deg, rgba(255,106,74,0.30), rgba(255,106,74,0.10))'
                : 'linear-gradient(180deg, rgba(255,154,38,0.12), rgba(255,154,38,0.04))',
              border: `1px solid ${confirmClear ? 'rgba(255,106,74,0.6)' : 'rgba(255,154,38,0.40)'}`,
              color: confirmClear ? '#ffb6a3' : ORANGE,
              cursor: items.length === 0 ? 'not-allowed' : 'pointer',
              opacity: items.length === 0 ? 0.4 : 1,
              padding: '6px 12px',
              fontSize: 9, letterSpacing: 1.6, fontFamily: 'Orbitron, monospace',
              fontWeight: 700, borderRadius: 3,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
            title={confirmClear ? 'Tap again to confirm' : 'Erase all stored history'}
          >
            <Trash2 size={11} strokeWidth={1.8} />
            {confirmClear ? 'CONFIRM CLEAR' : 'CLEAR HISTORY'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: '1px solid rgba(255,154,38,0.30)', color: ORANGE, cursor: 'pointer', padding: '6px 10px', fontSize: 9, letterSpacing: 1.6, fontFamily: 'Orbitron, monospace', borderRadius: 3 }}
            >
              CLOSE
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="history-body" style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255,154,38,0.4) transparent',
        paddingRight: 4,
      }}>
        {items.length === 0 ? (
          <div style={{
            border: '1px dashed rgba(255,154,38,0.30)',
            borderRadius: 4,
            padding: '36px 16px',
            textAlign: 'center',
            color: '#7a5a36',
          }}>
            <History size={32} color="#5c452c" strokeWidth={1.2} style={{ marginBottom: 10 }} />
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 10, letterSpacing: 1.6, marginBottom: 4 }}>NO HISTORY YET</div>
            <div style={{ fontSize: 11, lineHeight: 1.5 }}>Send your first command to NOVA — it will appear here, and persist across sessions.</div>
          </div>
        ) : (
          order.map((bucket) => (
            <section key={bucket} style={{ marginBottom: 14 }}>
              <div style={{
                fontFamily: 'Orbitron, monospace', fontSize: 9, color: '#cfa875',
                letterSpacing: 2, marginBottom: 6, paddingBottom: 4,
                borderBottom: '1px solid rgba(255,154,38,0.16)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              }}>
                <span>{bucket.toUpperCase()}</span>
                <span style={{ fontSize: 8, color: '#5c452c', letterSpacing: 1.4 }}>
                  {groups[bucket].length} {groups[bucket].length === 1 ? 'entry' : 'entries'}
                </span>
              </div>
              {groups[bucket].map((e) => (
                <HistoryRow key={e.timestamp} entry={e} onOpen={onOpen} />
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}

/* Full-screen overlay shell — used by both desktop and mobile variants
   so the History view can sit on top of whatever is currently
   showing. Tapping the backdrop closes. */
function HistoryOverlay({ onOpen, onClose, label = 'COMMAND HISTORY' }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 90,
        background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 720, maxHeight: '85vh',
        background: 'linear-gradient(160deg, #1a0e03, #0a0500)',
        border: '1px solid rgba(255,154,38,0.45)',
        borderRadius: 8, padding: 20,
        boxShadow: '0 0 40px rgba(255,130,10,0.25)',
        display: 'flex', flexDirection: 'column',
      }}>
        <HistoryView onOpen={onOpen} onClose={onClose} compact />
      </div>
    </div>
  );
}

export default function App() {
  return useIsMobile() ? <MobileNOVA /> : <DesktopNOVA />;
}
