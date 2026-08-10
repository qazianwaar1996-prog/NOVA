// ── NOVA Command Center — data mirroring the design mockup ──

export const STATS = [
  { icon: 'atom',           value: '24',    label: 'AI AGENTS' },
  { icon: 'clipboard-list', value: '12',    label: 'ACTIVE PROJECTS' },
  { icon: 'clipboard-check',value: '458',   label: 'TASKS RUNNING' },
  { icon: 'gauge',          value: '98.7%', label: 'SUCCESS RATE' },
];

export const NAV = [
  { id: 'dashboard', icon: 'layout-grid',    label: 'DASHBOARD' },
  { id: 'team',      icon: 'users',          label: 'AI TEAM',          sub: '24 BOTS ONLINE', chev: true },
  { id: 'projects',  icon: 'clipboard-list', label: 'PROJECTS',         sub: '12 ACTIVE',      chev: true },
  { id: 'tasks',     icon: 'list-todo',      label: 'TASK MANAGEMENT' },
  { id: 'apis',      icon: 'hexagon',        label: 'API INTEGRATIONS' },
  { id: 'vault',     icon: 'database',       label: 'DATA VAULT',                            chev: true },
  { id: 'analytics', icon: 'chart-column',   label: 'ANALYTICS' },
  { id: 'autom',     icon: 'workflow',       label: 'AUTOMATIONS' },
  { id: 'settings',  icon: 'settings',       label: 'SETTINGS' },
  { id: 'console',   icon: 'network',        label: 'COMMAND CONSOLE' },
];

export const SYS_STATUS = [
  { label: 'CPU',     pct: 28 },
  { label: 'MEMORY',  pct: 45 },
  { label: 'NETWORK', pct: 68 },
  { label: 'STORAGE', pct: 72 },
];

export const AGENTS_LEFT = [
  { name: 'CODEX',    role: 'CODE ASSISTANT',       pct: 98, icon: 'code-xml' },
  { name: 'DEBUGGER', role: 'BUG ANALYZER',         pct: 96, icon: 'bug' },
  { name: 'ARCHITECT',role: 'SYSTEM DESIGNER',      pct: 97, icon: 'box' },
  { name: 'DATABASE', role: 'DB MANAGER',           pct: 99, icon: 'database' },
  { name: 'DEVOPS',   role: 'DEPLOYMENT ENGINEER',  pct: 95, icon: 'infinity' },
  { name: 'SECURIX',  role: 'SECURITY ANALYST',     pct: 97, icon: 'shield-check' },
];

export const AGENTS_RIGHT = [
  { name: 'WRITER',    role: 'CONTENT GENERATOR',   pct: 97, icon: 'pen-line' },
  { name: 'DESIGNER',  role: 'UI/UX SPECIALIST',    pct: 96, icon: 'pen-tool' },
  { name: 'DATA MINER',role: 'DATA ANALYST',        pct: 98, icon: 'chart-column' },
  { name: 'TESTER',    role: 'QA AUTOMATION',       pct: 95, icon: 'clipboard-check' },
  { name: 'MARKETIX',  role: 'MARKET RESEARCHER',   pct: 96, icon: 'target' },
  { name: 'OPTIMIZER', role: 'PERFORMANCE TUNER',   pct: 97, icon: 'gauge' },
];

export const FEED = [
  { t: '12:45:21', name: 'CODEX',    icon: 'code-xml',       text: 'Pushed new code to StudyMetrics v2' },
  { t: '12:45:18', name: 'DEBUGGER', icon: 'bug',            text: 'Resolved 3 critical bugs' },
  { t: '12:45:15', name: 'DATABASE', icon: 'database',       text: 'Optimized 12 queries' },
  { t: '12:45:11', name: 'TESTER',   icon: 'clipboard-check',text: 'Completed test suite for Calculator API' },
  { t: '12:45:07', name: 'DEPLOYER', icon: 'rocket',         text: 'Deployed to production' },
  { t: '12:45:02', name: 'SECURIX',  icon: 'shield-check',   text: 'Security scan completed' },
];

export const APIS = [
  { name: 'OpenAI API',   sub: 'GPT-4 Turbo',     usage: '12,458 / 100K', pct: 12.4, logo: 'openai' },
  { name: 'Claude API',   sub: 'Claude 3 Opus',   usage: '8,201 / 50K',   pct: 16.4, logo: 'claude' },
  { name: 'Gemini API',   sub: 'Gemini 1.5 Pro',  usage: '6,721 / 50K',   pct: 13.4, logo: 'gemini' },
  { name: 'Pinecone API', sub: 'Vector Database', usage: '2,451 / 20K',   pct: 12.2, logo: 'pinecone' },
  { name: 'Resend API',   sub: 'Email Service',   usage: '9,115 / 100K',  pct: 9.1,  logo: 'resend' },
];

export const PERF = [
  { label: 'CPU USAGE',    pct: 28, seed: 11 },
  { label: 'MEMORY USAGE', pct: 45, seed: 23 },
  { label: 'NETWORK I/O',  pct: 68, seed: 37 },
  { label: 'DISK I/O',     pct: 72, seed: 53 },
];

export const PROJECTS = [
  { name: 'StudyMetrics v2',   type: 'Web Application',    pct: 78, icon: 'gauge' },
  { name: 'Quantoryx Bot',     type: 'Trading Platform',   pct: 62, icon: 'globe' },
  { name: 'Scholarics SEO',    type: 'SEO Automation',     pct: 91, icon: 'search' },
  { name: 'AI Content Studio', type: 'Content Platform',   pct: 45, icon: 'file-text' },
  { name: 'Mobile App Suite',  type: 'Mobile Applications',pct: 33, icon: 'layout-grid' },
];

export const TASKS = [
  { title: 'Code Review - Calculator Module', agent: 'CODEX',    pct: 75, icon: 'code-xml' },
  { title: 'Generate API Documentation',      agent: 'WRITER',   pct: 50, icon: 'file-text' },
  { title: 'Security Audit - All Modules',    agent: 'SECURIX',  pct: 90, icon: 'shield-check' },
  { title: 'UI/UX Design - Dashboard',        agent: 'DESIGNER', pct: 60, icon: 'pen-tool' },
  { title: 'Database Backup & Optimize',      agent: 'DATABASE', pct: 80, icon: 'database' },
  { title: 'Performance Test - Load Test',    agent: 'TESTER',   pct: 30, icon: 'gauge' },
];

export const CONSOLE_LINES = [
  { t: '12:45:31', tag: 'SYSTEM',   color: '#ffa12c', text: 'NOVA core system initialized' },
  { t: '12:45:32', tag: 'AI TEAM',  color: '#6aa8ff', text: 'All agents online and responsive' },
  { t: '12:45:33', tag: 'SECURITY', color: '#35e08a', text: 'All protocols secure' },
  { t: '12:45:34', tag: 'NETWORK',  color: '#9a7bff', text: 'Global nodes connected' },
  { t: '12:45:34', tag: 'DATABASE', color: '#5ac8ff', text: 'All systems synchronized' },
  { t: '12:45:35', tag: 'MISSION',  color: '#35e08a', text: 'Ready for commands, Commander' },
];

export const CMD_CHIPS = ['/status', '/team', '/projects', '/report', '/help'];

// ── Network map hubs / arcs (geo coords) ──
export const HUBS = [
  { id: 'la',   lon: -118.2, lat: 34.0 },
  { id: 'ny',   lon: -74.0,  lat: 40.7 },
  { id: 'lon',  lon: -0.1,   lat: 51.5 },
  { id: 'fra',  lon: 8.7,    lat: 50.1 },
  { id: 'ist',  lon: 28.9,   lat: 41.0 },
  { id: 'dxb',  lon: 55.3,   lat: 25.2 },
  { id: 'bom',  lon: 72.8,   lat: 19.0 },
  { id: 'sin',  lon: 103.8,  lat: 1.3 },
  { id: 'tyo',  lon: 139.7,  lat: 35.7 },
  { id: 'syd',  lon: 151.2,  lat: -33.9 },
];

export const ARCS = [
  ['la', 'ny'], ['ny', 'lon'], ['lon', 'fra'], ['fra', 'ist'],
  ['ist', 'dxb'], ['dxb', 'bom'], ['bom', 'sin'], ['sin', 'tyo'],
  ['sin', 'syd'], ['lon', 'tyo'],
];
