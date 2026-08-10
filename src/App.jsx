import { useState, useEffect, useRef } from "react";

const SYSTEM_PROMPT = `You are NOVA (Neural Operations & Virtual Assistant) — the personal AI chief of staff for Anwaar, a digital entrepreneur based in Pakistan building multiple web platforms from a smartphone.

Personality: calm, precise, proactive, like JARVIS from Iron Man. Confident, action-oriented. Call Anwaar by name occasionally.

Platforms:
1. SCHOLARICS (scholarics.com) — Academic tools, GPA Simulator, study guides, Cloudflare Pages, AdSense, target: students
2. ROOTED — Parenting platform, React+Vite+FastAPI+PostgreSQL, Railway+Supabase, target: USA/UK/Canada/Australia

AGENT ROUTING — start response with [AGENT] ACTIVATED:
SEO AGENT: "seo","audit","meta","keyword","schema","ranking" → meta title(60), description(155), og tags, JSON-LD schema, 5 keywords, internal links, quick wins
CONTENT AGENT: "blog","article","write","guide","content" → full SEO article H1/H2s/intro/body/CTA, adapt tone per platform
SOCIAL AGENT: "instagram","twitter","linkedin","pinterest","social" → IG caption+hashtags, Twitter thread, Pinterest, LinkedIn, Facebook
YOUTUBE AGENT: "youtube","script","video","shorts","hook" → dramatic hook(not question), full script, 3 titles, description, 15 tags, thumbnail text
EMAIL AGENT: "email","reply","draft" → 3-bullet summary, draft reply, action items
ANALYTICS AGENT: "analytics","traffic","adsense","stats","report" → wins, concerns, 3 actions, AdSense tip
MONITOR AGENT: "uptime","deploy","github","error","broken" → diagnose, Termux fix steps
IDEAS AGENT: "idea","feature","suggest" → market fit, implementation, monetization
MARKETS AGENT: "us","uk","australia","canada","localize" → regional adaptation
MONETIZE AGENT: "monetize","revenue","affiliate","earn","rpm" → AdSense placement, affiliate angles, RPM

End complex outputs with: "Anything else on this, Anwaar?"`;

const C = { bg:"#000000", panel:"#0a0700", panel2:"#080500", border:"#2a1a00", border2:"#3d2800", orange:"#FF8C00", orangeL:"#FFB800", orangeD:"#cc5500", green:"#00cc66", red:"#ff3333", text:"#ccaa77", dim:"#554433", dim2:"#332211" };

const LEFT_AGENTS = [
  { id:"seo",    icon:"🔍", name:"SEO AGENT",    sub:"SEARCH OPTIMIZER",   pct:98 },
  { id:"content",icon:"✍️", name:"CONTENT",      sub:"CONTENT GENERATOR",  pct:97 },
  { id:"social", icon:"📱", name:"SOCIAL",       sub:"SOCIAL MANAGER",     pct:96 },
  { id:"youtube",icon:"🎬", name:"YOUTUBE",      sub:"VIDEO STRATEGIST",   pct:95 },
  { id:"email",  icon:"📧", name:"EMAIL",        sub:"EMAIL MANAGER",      pct:99 },
  { id:"monitor",icon:"🚀", name:"DEVOPS",       sub:"DEPLOYMENT ENGINEER",pct:95 },
];
const RIGHT_AGENTS = [
  { id:"analytics",icon:"📊", name:"ANALYTICS", sub:"DATA ANALYST",       pct:98 },
  { id:"ideas",    icon:"💡", name:"IDEAS",     sub:"IDEA EXPANDER",      pct:96 },
  { id:"markets",  icon:"🌍", name:"MARKETS",   sub:"MARKET RESEARCHER",  pct:97 },
  { id:"monetize", icon:"💰", name:"MONETIZE",  sub:"PERFORMANCE TUNER",  pct:97 },
  { id:"email2",   icon:"📧", name:"EMAIL MGR", sub:"EMAIL SPECIALIST",   pct:95 },
  { id:"security", icon:"🛡️", name:"SECURIX",   sub:"SECURITY ANALYST",  pct:97 },
];

const MOBILE_TABS = [
  { id:"chat",    icon:"💬", label:"CHAT" },
  { id:"team",    icon:"🤖", label:"AGENTS" },
  { id:"feed",    icon:"⚡", label:"FEED" },
  { id:"projects",icon:"◻", label:"PROJECTS" },
  { id:"system",  icon:"📊", label:"STATS" },
];

const NAV = [
  { icon:"⊞", label:"DASHBOARD", active:true },
  { icon:"◈", label:"AI TEAM",   sub:"10 BOTS ONLINE" },
  { icon:"◻", label:"PROJECTS",  sub:"2 ACTIVE" },
  { icon:"≡", label:"TASK MANAGEMENT" },
  { icon:"◎", label:"API INTEGRATIONS" },
  { icon:"◫", label:"DATA VAULT" },
  { icon:"∿", label:"ANALYTICS" },
  { icon:"⟳", label:"AUTOMATIONS" },
  { icon:"⚙", label:"SETTINGS" },
  { icon:"⌨", label:"COMMAND CONSOLE" },
];

const PROJECTS = [
  { icon:"◻", name:"Scholarics",     sub:"Web Application",    pct:78 },
  { icon:"◎", name:"Rooted",         sub:"Parenting Platform",  pct:62 },
  { icon:"∿", name:"Scholarics SEO", sub:"SEO Automation",     pct:91 },
  { icon:"⚙", name:"AI Content Studio",sub:"Content Platform",  pct:45 },
  { icon:"◈", name:"NOVA Bot",       sub:"AI Assistant",       pct:33 },
];

const TASKS = [
  { icon:"◎", task:"SEO Audit — Scholarics Homepage",  agent:"SEO",      color:C.orange, pct:75 },
  { icon:"✓", task:"Generate Social Media Posts",       agent:"SOCIAL",   color:C.orange, pct:50 },
  { icon:"⚠", task:"Content Audit — All Pages",        agent:"CONTENT",  color:C.orangeL,pct:90 },
  { icon:"⊞", task:"YouTube Script — GPA Tips",        agent:"YOUTUBE",  color:C.orange, pct:60 },
  { icon:"⚙", task:"AdSense Optimization",             agent:"MONETIZE", color:C.orange, pct:80 },
  { icon:"◻", task:"Keyword Research — Rooted",        agent:"SEO",      color:C.orangeD,pct:30 },
];

const APIS = [
  { icon:"⬡", name:"Claude API",     sub:"claude-sonnet-4-6",  used:8201,  max:50000,  pct:16.4 },
  { icon:"✦", name:"Gemini API",     sub:"Gemini 1.5 Pro",     used:6721,  max:50000,  pct:13.4 },
  { icon:"◈", name:"Cloudflare API", sub:"Pages & Functions",  used:2451,  max:20000,  pct:12.2 },
  { icon:"◻", name:"Supabase API",   sub:"PostgreSQL",         used:9115,  max:100000, pct:9.1  },
  { icon:"⟳", name:"Railway API",    sub:"FastAPI Backend",    used:12458, max:100000, pct:12.4 },
];

function detectAgent(t) {
  t = t.toLowerCase();
  if(/(seo|audit|meta|keyword|schema|ranking)/.test(t)) return "SEO AGENT";
  if(/(blog|article|write|guide|content)/.test(t)) return "CONTENT";
  if(/(instagram|twitter|linkedin|pinterest|social)/.test(t)) return "SOCIAL";
  if(/(youtube|script|video|shorts|hook|thumbnail)/.test(t)) return "YOUTUBE";
  if(/(email|reply|draft)/.test(t)) return "EMAIL";
  if(/(analytics|traffic|adsense|stats|report)/.test(t)) return "ANALYTICS";
  if(/(uptime|deploy|github|error|broken)/.test(t)) return "MONITOR";
  if(/(idea|feature|suggest)/.test(t)) return "IDEAS";
  if(/(us |uk |australia|canada|localize)/.test(t)) return "MARKETS";
  if(/(monetize|revenue|affiliate|earn|rpm)/.test(t)) return "MONETIZE";
  return "NOVA";
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

// Animated central orb
function CentralOrb({ thinking, size = 220 }) {
  const ref = useRef(null);
  const frame = useRef(0);
  const animId = useRef(null);
  useEffect(() => {
    const c = ref.current; if(!c) return;
    const ctx = c.getContext("2d");
    const W=size, H=size; c.width=W; c.height=H;
    const cx=W/2, cy=H/2;
    const rScale = size/220;
    const draw = () => {
      ctx.clearRect(0,0,W,H);
      const t = frame.current * 0.018;
      [90,78,66,54].forEach((r,i) => {
        ctx.beginPath(); ctx.arc(cx,cy,r*rScale,0,Math.PI*2);
        ctx.strokeStyle = `rgba(255,${120+i*20},0,${0.08+i*0.06})`;
        ctx.lineWidth = 1+i*0.3; ctx.stroke();
      });
      [[84,0.8,"rgba(255,140,0,0.5)",8,5],[70,-0.5,"rgba(255,180,0,0.3)",4,10],[58,1.2,"rgba(255,100,0,0.4)",12,6]].forEach(([r,spd,col,d1,d2]) => {
        ctx.save(); ctx.translate(cx,cy); ctx.rotate(t*spd);
        ctx.beginPath(); ctx.arc(0,0,r*rScale,0,Math.PI*2);
        ctx.setLineDash([d1,d2]); ctx.strokeStyle=col; ctx.lineWidth=1.2; ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
      });
      const pulse = thinking ? 1+Math.sin(frame.current*0.25)*0.3 : 1+Math.sin(t*0.8)*0.12;
      const gr = ctx.createRadialGradient(cx,cy,0,cx,cy,48*rScale*pulse);
      gr.addColorStop(0,"rgba(255,200,80,1)");
      gr.addColorStop(0.2,"rgba(255,140,0,0.85)");
      gr.addColorStop(0.5,"rgba(255,80,0,0.4)");
      gr.addColorStop(0.8,"rgba(200,50,0,0.15)");
      gr.addColorStop(1,"rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(cx,cy,48*rScale*pulse,0,Math.PI*2); ctx.fillStyle=gr; ctx.fill();
      const ic = ctx.createRadialGradient(cx,cy,0,cx,cy,20*rScale);
      ic.addColorStop(0,"rgba(255,250,200,1)");
      ic.addColorStop(0.4,"rgba(255,180,50,0.9)");
      ic.addColorStop(1,"rgba(255,100,0,0)");
      ctx.beginPath(); ctx.arc(cx,cy,20*rScale,0,Math.PI*2); ctx.fillStyle=ic; ctx.fill();
      for(let i=0;i<12;i++) {
        const a = (i/12)*Math.PI*2 + t*0.3;
        const len = (28+Math.sin(t*1.5+i)*12)*rScale;
        ctx.beginPath();
        ctx.moveTo(cx+Math.cos(a)*18*rScale, cy+Math.sin(a)*18*rScale);
        ctx.lineTo(cx+Math.cos(a)*len, cy+Math.sin(a)*len);
        ctx.strokeStyle=`rgba(255,${140+Math.sin(t+i)*40},0,${0.25+Math.sin(t*2+i)*0.15})`;
        ctx.lineWidth=1; ctx.stroke();
      }
      for(let i=0;i<20;i++) {
        const a=(i/20)*Math.PI*2+t*0.1+i;
        const r=(52+Math.sin(t*0.8+i*0.7)*18)*rScale;
        const px=cx+Math.cos(a)*r, py=cy+Math.sin(a)*r;
        ctx.beginPath(); ctx.arc(px,py,1.2,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,${150+Math.sin(i)*50},0,${0.4+Math.sin(t+i)*0.3})`; ctx.fill();
      }
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.shadowColor=C.orange; ctx.shadowBlur=15;
      ctx.fillStyle="#fff"; ctx.font=`bold ${Math.round(16*rScale)}px 'Orbitron',monospace`;
      ctx.fillText("NOVA",cx,cy-10*rScale);
      ctx.font=`${Math.round(6*rScale)}px 'Orbitron',monospace`; ctx.fillStyle=C.orangeL;
      ctx.fillText("MASTER AI",cx,cy+4*rScale);
      ctx.font=`${Math.round(6*rScale)}px 'Orbitron',monospace`;
      ctx.fillText("ORCHESTRATOR",cx,cy+14*rScale);
      ctx.font=`bold ${Math.round(7*rScale)}px monospace`; ctx.fillStyle=thinking?"#FFB800":C.green;
      ctx.fillText(thinking?"● PROCESSING":"● ONLINE",cx,cy+26*rScale);
      ctx.shadowBlur=0;
      frame.current++; animId.current=requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId.current);
  },[thinking, size]);
  return <canvas ref={ref} style={{width:size,height:size,display:"block",maxWidth:"100%"}} />;
}

function Spark({ w=90, h=20 }) {
  const [pts] = useState(() => Array.from({length:16},(_,i)=>6+Math.abs(Math.sin(i*0.7+Math.random()))*10));
  const toX=i=>(i/(pts.length-1))*w;
  const toY=v=>h-((v/16)*h);
  return (
    <svg width={w} height={h} style={{display:"block"}}>
      <polyline points={pts.map((v,i)=>`${toX(i)},${toY(v)}`).join(" ")} fill="none" stroke={C.orange} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function AreaChart({ values, color, h=30 }) {
  const w=200;
  const max=Math.max(...values)||1;
  const toX=i=>(i/(values.length-1))*w;
  const toY=v=>h-((v/max)*h*0.85)-2;
  const pts=values.map((v,i)=>`${toX(i)},${toY(v)}`).join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:"block"}}>
      <defs><linearGradient id={`ag${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.5"/>
        <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
      </linearGradient></defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#ag${color.replace("#","")})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function WorldMap() {
  const regions=[
    [10,22],[13,25],[15,28],[18,22],[20,25],[22,30],[16,32],[12,30],
    [22,45],[24,50],[22,55],[20,58],[18,52],[23,60],
    [45,18],[47,20],[50,18],[52,22],[48,25],[44,22],[42,20],[55,20],
    [46,35],[48,40],[50,45],[45,42],[52,38],[48,50],[46,55],
    [60,20],[65,18],[70,22],[75,25],[68,30],[72,28],[80,22],[85,25],[78,18],
    [72,38],[75,40],[78,35],[80,38],
    [78,55],[82,58],[80,60],[76,57],
    [20,25],[47,20],[65,18],[78,35],[80,58],
  ];
  return (
    <svg width="100%" height="75" viewBox="0 0 100 75" style={{display:"block",background:"#050300",borderRadius:2}}>
      {regions.map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r={i>=regions.length-5?2:0.8}
          fill={i>=regions.length-5?C.orangeL:C.orange}
          opacity={i>=regions.length-5?0.9:0.4}/>
      ))}
      {[[20,25,47,20],[47,20,65,18],[65,18,78,35],[78,35,80,58]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.orange} strokeWidth="0.3" opacity="0.35"/>
      ))}
    </svg>
  );
}

function Donut() {
  const r=22, circ=2*Math.PI*r;
  return (
    <div style={{position:"relative",width:54,height:54,flexShrink:0}}>
      <svg width={54} height={54} viewBox="0 0 54 54">
        <circle cx={27} cy={27} r={r} fill="none" stroke="#1a0f00" strokeWidth={5}/>
        <circle cx={27} cy={27} r={r} fill="none" stroke={C.green} strokeWidth={5}
          strokeDasharray={`${circ} 0`} strokeDashoffset={circ/4}
          style={{filter:`drop-shadow(0 0 4px ${C.green})`}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:9,color:C.green,fontFamily:"monospace",fontWeight:700,lineHeight:1}}>100%</span>
        <span style={{fontSize:5,color:"#555",fontFamily:"monospace"}}>OPTIMAL</span>
      </div>
    </div>
  );
}

function AgentCard({ agent, isActive, onClick, compact }) {
  return (
    <div onClick={onClick} style={{
      background: isActive?"#160d00":"#0d0800",
      border:`1px solid ${isActive?C.orange:C.border2}`,
      borderRadius:3, padding:compact?"6px 7px":"7px 8px",
      cursor:"pointer", marginBottom:4,
      boxShadow:isActive?`0 0 10px ${C.orange}55`:"none",
      transition:"all 0.2s",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
        <div style={{width:compact?24:28,height:compact?24:28,background:"#1a0e00",border:`1px solid ${C.border2}`,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:compact?11:13,flexShrink:0}}>
          {agent.icon}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"Orbitron,monospace",fontSize:compact?7:8,color:C.orange,fontWeight:700,letterSpacing:0.5,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{agent.name}</div>
          <div style={{fontSize:compact?6:7,color:C.dim,marginTop:1}}>{agent.sub}</div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontFamily:"monospace",fontSize:compact?9:10,color:C.orange,fontWeight:700}}>{agent.pct}%</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:compact?6:7,color:C.green,display:"flex",alignItems:"center",gap:3}}>
          <span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:C.green}}/>ONLINE
        </div>
        <Spark w={compact?60:80} h={compact?12:16}/>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// DESKTOP LAYOUT
// ══════════════════════════════════════════════════
function DesktopApp({ state, handlers }) {
  const { cmd, thinking, activeAgent, messages, feed, logs, perfData, taskPcts, time } = state;
  const { setCmd, execute, setActiveAgent, outputRef, consoleRef, handleKey } = handlers;
  return (
    <div style={{width:"100%",height:"100vh",background:C.bg,color:C.orange,fontFamily:"monospace",overflow:"hidden",display:"flex",flexDirection:"column",fontSize:11}}>
      {/* TOP BAR */}
      <div style={{height:50,background:"#080500",borderBottom:`1px solid ${C.border2}`,display:"flex",alignItems:"center",flexShrink:0}}>
        <div style={{width:200,flexShrink:0,display:"flex",alignItems:"center",gap:8,padding:"0 12px",borderRight:`1px solid ${C.border}`}}>
          <div style={{width:34,height:34,border:`2px solid ${C.orange}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:"#1a0a00",flexShrink:0,boxShadow:`0 0 12px ${C.orange}55`,fontSize:16}}>⬡</div>
          <div>
            <div style={{fontFamily:"Orbitron,monospace",fontSize:20,fontWeight:900,color:C.orange,textShadow:`0 0 20px ${C.orange}`,lineHeight:1}}>NOVA</div>
            <div style={{fontSize:6,color:"#554422",letterSpacing:1}}>AI OPERATIONS COMMAND CENTER</div>
          </div>
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",height:"100%"}}>
          <div style={{padding:"0 20px",borderRight:`1px solid ${C.border}`,height:"100%",display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <div style={{fontFamily:"Orbitron,monospace",fontSize:11,color:C.orange,fontWeight:700,letterSpacing:1}}>MISSION CONTROL</div>
            <div style={{fontSize:8,color:C.green,letterSpacing:1,marginTop:2}}>● ALL SYSTEMS OPERATIONAL</div>
          </div>
          {[
            {icon:"◈",val:"10",     label:"AI AGENTS"},
            {icon:"◻",val:"2",      label:"ACTIVE PROJECTS"},
            {icon:"⚡",val:thinking?"1":"0",label:"TASKS RUNNING"},
            {icon:"⚙",val:"98.7%", label:"SUCCESS RATE"},
          ].map((s,i)=>(
            <div key={i} style={{padding:"0 18px",borderRight:`1px solid ${C.border}`,height:"100%",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:18,color:C.orange}}>{s.icon}</span>
              <div>
                <div style={{fontFamily:"Orbitron,monospace",fontSize:14,color:"#fff",fontWeight:700,lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:7,color:"#554422",marginTop:2}}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:"0 14px",display:"flex",alignItems:"center",gap:14,borderLeft:`1px solid ${C.border}`}}>
          <div>
            <div style={{fontFamily:"Orbitron,monospace",fontSize:16,color:C.orange,fontWeight:700,lineHeight:1}}>{time.toTimeString().slice(0,8)}</div>
            <div style={{fontSize:7,color:"#554422",marginTop:2}}>{time.toDateString().toUpperCase()}</div>
          </div>
          <span style={{fontSize:13,color:"#554422",cursor:"pointer"}}>∿</span>
          <div style={{position:"relative"}}>
            <span style={{fontSize:13,color:"#554422",cursor:"pointer"}}>🔔</span>
            <span style={{position:"absolute",top:-3,right:-3,width:8,height:8,background:C.orange,borderRadius:"50%",fontSize:5,display:"flex",alignItems:"center",justifyContent:"center",color:"#000",fontWeight:700}}>3</span>
          </div>
          <span style={{fontSize:13,color:"#554422",cursor:"pointer"}}>✦</span>
          <span style={{fontSize:13,color:"#554422",cursor:"pointer"}}>⏻</span>
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* LEFT SIDEBAR */}
        <div style={{width:200,flexShrink:0,background:"#070400",borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"12px 10px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"center"}}>
            <div style={{width:46,height:46,border:`2px solid ${C.orange}`,borderRadius:"50%",flexShrink:0,background:"#1a0a00",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 12px ${C.orange}44`,overflow:"hidden"}}>
              <svg width="42" height="42" viewBox="0 0 42 42">
                <ellipse cx="21" cy="17" rx="10" ry="12" fill="none" stroke={C.orange} strokeWidth="0.8" opacity="0.7"/>
                <ellipse cx="21" cy="16" rx="6" ry="7" fill="none" stroke={C.orange} strokeWidth="0.5" opacity="0.4"/>
                <line x1="21" y1="5" x2="21" y2="29" stroke={C.orange} strokeWidth="0.4" opacity="0.3"/>
                <line x1="11" y1="17" x2="31" y2="17" stroke={C.orange} strokeWidth="0.4" opacity="0.3"/>
                <ellipse cx="17" cy="15" rx="2" ry="1.5" fill="none" stroke={C.orange} strokeWidth="0.6" opacity="0.6"/>
                <ellipse cx="25" cy="15" rx="2" ry="1.5" fill="none" stroke={C.orange} strokeWidth="0.6" opacity="0.6"/>
                <path d="M17 21 Q21 24 25 21" fill="none" stroke={C.orange} strokeWidth="0.6" opacity="0.5"/>
                <ellipse cx="21" cy="32" rx="12" ry="6" fill="none" stroke={C.orange} strokeWidth="0.6" opacity="0.3"/>
              </svg>
            </div>
            <div>
              <div style={{fontSize:7,color:C.dim,letterSpacing:1,lineHeight:1}}>COMMANDER</div>
              <div style={{fontFamily:"Orbitron,monospace",fontSize:13,color:C.orange,fontWeight:700,lineHeight:1.2}}>ANWAAR</div>
              <div style={{fontSize:7,color:"#665533",lineHeight:1.3}}>MASTER CONTROL</div>
              <div style={{fontSize:7,color:C.green,display:"flex",alignItems:"center",gap:3,marginTop:2}}>
                <span className="pulse" style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:C.green}}/>ONLINE
              </div>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"4px 0"}}>
            {NAV.map((n,i)=>(
              <div key={i} style={{
                padding:"7px 10px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",
                background:n.active?"#1a0d00":"transparent",
                borderLeft:`3px solid ${n.active?C.orange:"transparent"}`,
                transition:"all 0.15s",
              }}
                onMouseEnter={e=>{if(!n.active)e.currentTarget.style.background="#0f0700";}}
                onMouseLeave={e=>{if(!n.active)e.currentTarget.style.background="transparent";}}>
                {n.active
                  ? <div style={{width:20,height:20,background:C.orange,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#000",flexShrink:0}}>⊞</div>
                  : <span style={{fontSize:12,color:"#443322",width:20,textAlign:"center",flexShrink:0}}>{n.icon}</span>
                }
                <div>
                  <div style={{fontFamily:"Orbitron,monospace",fontSize:8,color:n.active?C.orange:"#665533",fontWeight:n.active?700:400}}>{n.label}</div>
                  {n.sub&&<div style={{fontSize:7,color:C.green}}>{n.sub}</div>}
                </div>
                {n.sub&&<span style={{marginLeft:"auto",fontSize:10,color:"#443322"}}>›</span>}
              </div>
            ))}
          </div>
          <div style={{padding:"8px 10px",borderTop:`1px solid ${C.border}`,flexShrink:0}}>
            <div style={{fontFamily:"Orbitron,monospace",fontSize:7,color:C.dim,letterSpacing:1,marginBottom:8}}>SYSTEM STATUS</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <Donut/>
              <div style={{flex:1}}>
                {[["CPU",28],["MEMORY",45],["NETWORK",68],["STORAGE",72]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:7,color:"#443322"}}>{k}</span>
                    <span style={{fontSize:7,color:"#aaa",fontWeight:700}}>{v}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{flexShrink:0,borderBottom:`1px solid ${C.border}`}}>
            <div style={{padding:"6px 12px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontFamily:"Orbitron,monospace",fontSize:10,color:C.orange,fontWeight:700,letterSpacing:1}}>AI TEAM OVERVIEW</span>
              <span style={{fontSize:8,color:C.dim}}>10 / 10 AGENTS ONLINE</span>
            </div>
            <div style={{display:"flex",padding:"8px",gap:4}}>
              <div style={{flex:1}}>
                {LEFT_AGENTS.map(a=>(
                  <AgentCard key={a.id} agent={a} isActive={activeAgent===a.name} onClick={()=>setActiveAgent(a.name)}/>
                ))}
              </div>
              <div style={{width:230,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative"}}>
                <CentralOrb thinking={thinking}/>
                <div style={{textAlign:"center",marginTop:4}}>
                  <div style={{fontFamily:"Orbitron,monospace",fontSize:7,color:C.dim,letterSpacing:1}}>AI COMMUNICATION BUS</div>
                  <div style={{fontSize:6,color:"#332211",marginTop:1}}>SECURE ENCRYPTED CHANNEL</div>
                </div>
                <svg width="180" height="18" style={{margin:"6px 0 0"}}>
                  {Array.from({length:45}).map((_,i)=>{
                    const h=Math.abs(Math.sin(i*0.42))*12;
                    return <rect key={i} x={i*4} y={(18-h)/2} width="2.5" height={h||1} fill={C.orange} opacity={0.3+Math.abs(Math.sin(i*0.42))*0.55}/>;
                  })}
                </svg>
              </div>
              <div style={{flex:1}}>
                {RIGHT_AGENTS.map(a=>(
                  <AgentCard key={a.id} agent={a} isActive={activeAgent===a.name} onClick={()=>setActiveAgent(a.name)}/>
                ))}
              </div>
            </div>
          </div>

          <div ref={outputRef} style={{flex:1,overflowY:"auto",padding:"10px 14px",background:"#060400"}}>
            {messages.length===0?(
              <div style={{color:C.dim2,fontSize:11,lineHeight:2}}>
                <span style={{color:C.dim}}>NOVA command output will appear here...</span><br/>
                <span>Try: </span><span style={{color:C.orange}}>"SEO audit Scholarics homepage"</span><span> or </span><span style={{color:C.orange}}>"Write Instagram posts for Rooted"</span>
              </div>
            ):messages.map((m,i)=>(
              <div key={i} className="fade" style={{marginBottom:12}}>
                <div style={{fontSize:7,color:m.role==="user"?C.orangeL:C.dim,fontFamily:"Orbitron,monospace",marginBottom:3}}>
                  [{m.role==="user"?"COMMANDER":"NOVA — "+(m.agent||"AI")}] {m.role==="user"?">>>":"<<<"}
                </div>
                <div style={{
                  background:m.role==="user"?"#0e0800":"#080500",
                  border:`1px solid ${m.role==="user"?C.border2:C.border}`,
                  borderRadius:3,padding:"8px 10px",
                  fontSize:11,color:m.role==="user"?C.orangeL:"#ccaa88",
                  whiteSpace:"pre-wrap",lineHeight:1.7,wordBreak:"break-word",
                  fontFamily:"monospace",
                }}>{m.content}</div>
              </div>
            ))}
            {thinking&&(
              <div className="fade" style={{display:"flex",gap:6,alignItems:"center",color:C.orange}}>
                <span className="blink">▋</span>
                <span style={{fontFamily:"Orbitron,monospace",fontSize:8}}>{activeAgent||"NOVA"} PROCESSING...</span>
              </div>
            )}
          </div>

          <div style={{display:"flex",height:188,borderTop:`1px solid ${C.border}`,flexShrink:0}}>
            <div style={{flex:1,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{padding:"5px 8px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",flexShrink:0}}>
                <span style={{fontFamily:"Orbitron,monospace",fontSize:7,color:C.orange,fontWeight:700}}>ACTIVE PROJECTS</span>
                <span style={{fontSize:7,color:C.dim,cursor:"pointer"}}>VIEW ALL</span>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"4px 8px"}}>
                {PROJECTS.map((p,i)=>(
                  <div key={i} style={{marginBottom:7,display:"flex",gap:6,alignItems:"center"}}>
                    <div style={{width:22,height:22,background:"#0e0800",border:`1px solid ${C.border2}`,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,flexShrink:0,color:C.orange}}>{p.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:8,color:"#ccaa88",fontFamily:"Orbitron,monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                        <span style={{fontSize:7,color:C.orange,flexShrink:0,marginLeft:4}}>{taskPcts[i]||p.pct}%</span>
                      </div>
                      <div style={{fontSize:6,color:C.dim2,marginBottom:2}}>{p.sub}</div>
                      <div style={{height:3,background:"#1a0f00",borderRadius:2}}>
                        <div style={{height:"100%",width:`${taskPcts[i]||p.pct}%`,background:C.orange,borderRadius:2,transition:"width 1.5s"}}/>
                      </div>
                    </div>
                    <span style={{fontSize:6,color:C.green,flexShrink:0}}>IN PROGRESS</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{flex:1,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{padding:"5px 8px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",flexShrink:0}}>
                <span style={{fontFamily:"Orbitron,monospace",fontSize:7,color:C.orange,fontWeight:700}}>TASK QUEUE</span>
                <span style={{fontSize:7,color:C.dim,cursor:"pointer"}}>VIEW ALL</span>
              </div>
              <div style={{flex:1,overflowY:"auto",padding:"4px 8px"}}>
                {TASKS.map((t,i)=>(
                  <div key={i} style={{marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontSize:9,color:t.color,flexShrink:0}}>{t.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:7,color:"#ccaa77",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.task}</div>
                        <div style={{fontSize:6,color:t.color,fontFamily:"Orbitron,monospace"}}>{t.agent}</div>
                      </div>
                      <span style={{fontSize:8,color:t.color,flexShrink:0}}>{taskPcts[i]||t.pct}%</span>
                    </div>
                    <div style={{height:2,background:"#1a0f00",borderRadius:1,marginTop:2}}>
                      <div style={{height:"100%",width:`${taskPcts[i]||t.pct}%`,background:t.color,borderRadius:1,transition:"width 1.5s"}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{padding:"5px 8px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
                <span style={{fontFamily:"Orbitron,monospace",fontSize:7,color:C.orange,fontWeight:700}}>GLOBAL NETWORK MAP</span>
              </div>
              <div style={{padding:"6px 8px",flex:1}}>
                <WorldMap/>
                <div style={{display:"flex",justifyContent:"space-around",marginTop:8}}>
                  {[["ACTIVE NODES","12"],["DATA TRANSFER","1.2 TB/s"],["UPTIME","99.98%"]].map(([k,v])=>(
                    <div key={k} style={{textAlign:"center"}}>
                      <div style={{fontFamily:"Orbitron,monospace",fontSize:10,color:C.orange,fontWeight:700}}>{v}</div>
                      <div style={{fontSize:6,color:C.dim}}>{k}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{width:285,flexShrink:0,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden",background:"#070400"}}>
          <div style={{borderBottom:`1px solid ${C.border}`,display:"flex",flexDirection:"column",maxHeight:220}}>
            <div style={{padding:"6px 10px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",flexShrink:0}}>
              <span style={{fontFamily:"Orbitron,monospace",fontSize:8,color:C.orange,fontWeight:700}}>LIVE ACTIVITY FEED</span>
              <span style={{fontSize:7,color:C.dim,cursor:"pointer"}}>VIEW ALL</span>
            </div>
            <div style={{overflowY:"auto",flex:1}}>
              {feed.map((f,i)=>(
                <div key={i} className={i===0?"fade":""} style={{padding:"5px 10px",borderBottom:`1px solid #110900`,display:"flex",gap:6,alignItems:"flex-start"}}>
                  <span style={{fontSize:7,color:"#3a2a10",flexShrink:0,minWidth:50,lineHeight:1.6}}>{f.time}</span>
                  <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                    <span style={{fontSize:9,color:C.orange}}>⚡</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"Orbitron,monospace",fontSize:7,color:C.orange,lineHeight:1.3}}>{f.agent}</div>
                    <div style={{fontSize:7,color:"#776644",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.action}</div>
                  </div>
                  <span style={{fontSize:6,fontFamily:"Orbitron,monospace",color:f.status==="SUCCESS"?C.green:f.status==="RUNNING"?C.orangeL:C.red,flexShrink:0}}>{f.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{borderBottom:`1px solid ${C.border}`,padding:"8px 10px",flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontFamily:"Orbitron,monospace",fontSize:8,color:C.orange,fontWeight:700}}>API INTEGRATIONS</span>
              <span style={{fontSize:7,color:C.dim,cursor:"pointer"}}>MANAGE APIS</span>
            </div>
            {APIS.map((a,i)=>(
              <div key={i} style={{marginBottom:7,display:"flex",gap:6,alignItems:"center"}}>
                <span style={{fontSize:13,color:C.orange,flexShrink:0,width:14}}>{a.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:8,color:"#ccaa77",fontWeight:700}}>{a.name}</div>
                  <div style={{fontSize:6,color:C.dim2}}>{a.sub}</div>
                </div>
                <div style={{flexShrink:0,textAlign:"right"}}>
                  <div style={{fontSize:7,color:C.dim,marginBottom:2}}>{a.used.toLocaleString()} / {(a.max/1000).toFixed(0)}K</div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <div style={{width:55,height:3,background:"#1a0f00",borderRadius:2}}>
                      <div style={{height:"100%",width:`${a.pct*4}%`,background:C.orange,borderRadius:2,maxWidth:"100%"}}/>
                    </div>
                    <span style={{fontSize:7,color:C.orange}}>{a.pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{borderBottom:`1px solid ${C.border}`,padding:"8px 10px",flexShrink:0}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontFamily:"Orbitron,monospace",fontSize:8,color:C.orange,fontWeight:700}}>SYSTEM PERFORMANCE</span>
              <span style={{fontSize:7,color:C.dim}}>24 HOURS ▾</span>
            </div>
            {[
              {label:"CPU USAGE",    value:28, data:perfData.cpu,  color:C.orange},
              {label:"MEMORY USAGE", value:45, data:perfData.mem,  color:C.orangeL},
              {label:"NETWORK I/O",  value:68, data:perfData.net,  color:C.orangeD},
              {label:"DISK I/O",     value:72, data:perfData.disk, color:"#FF5500"},
            ].map(p=>(
              <div key={p.label} style={{marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:1}}>
                  <span style={{fontSize:7,color:C.dim,fontFamily:"Orbitron,monospace",letterSpacing:0.5}}>{p.label}</span>
                  <span style={{fontSize:10,color:p.color,fontWeight:700,fontFamily:"Orbitron,monospace"}}>{p.value}%</span>
                </div>
                <AreaChart values={p.data} color={p.color} h={24}/>
              </div>
            ))}
          </div>
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"5px 10px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
              <span style={{fontFamily:"Orbitron,monospace",fontSize:8,color:C.orange,fontWeight:700}}>COMMAND CONSOLE</span>
            </div>
            <div ref={consoleRef} style={{flex:1,overflowY:"auto",padding:"6px 10px"}}>
              {logs.map((l,i)=>(
                <div key={i} style={{fontSize:8,color:l.startsWith("[ERROR]")?C.red:l.startsWith("[MISSION]")?C.green:C.dim,marginBottom:2,lineHeight:1.5,fontFamily:"monospace"}}>{l}</div>
              ))}
              <div style={{display:"flex",alignItems:"center",gap:4,color:C.orange,marginTop:4,fontSize:9}}>
                <span>nova@command:~#</span>
                <span className="blink" style={{display:"inline-block",width:7,height:11,background:C.orange}}/>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM COMMAND BAR */}
      <DesktopCommandBar cmd={cmd} setCmd={setCmd} execute={execute} thinking={thinking} handleKey={handleKey}/>
    </div>
  );
}

function DesktopCommandBar({ cmd, setCmd, execute, thinking, handleKey }) {
  return (
    <div style={{background:"#060400",borderTop:`1px solid ${C.border2}`,padding:"7px 10px",display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
      <div style={{display:"flex",flexShrink:0}}>
        {["/status","/team","/projects","/report","/help"].map((s,i,arr)=>(
          <button key={i} onClick={()=>setCmd(s.slice(1)+" ")}
            style={{background:"#0a0600",border:`1px solid ${C.border2}`,borderLeft:i>0?"none":`1px solid ${C.border2}`,padding:"6px 10px",color:C.dim,fontFamily:"monospace",fontSize:8,cursor:"pointer",borderRadius:i===0?"3px 0 0 3px":i===arr.length-1?"0 3px 3px 0":"0"}}
            onMouseEnter={e=>e.currentTarget.style.color=C.orange}
            onMouseLeave={e=>e.currentTarget.style.color=C.dim}>
            {s}
          </button>
        ))}
      </div>
      <div style={{flex:1,display:"flex",position:"relative"}}>
        <input value={cmd} onChange={e=>setCmd(e.target.value)} onKeyDown={handleKey}
          placeholder="ENTER COMMAND..."
          style={{width:"100%",background:"#0a0700",border:`1px solid ${C.border2}`,borderRight:"none",borderRadius:"3px 0 0 3px",padding:"8px 40px 8px 14px",color:C.orange,fontFamily:"Orbitron,monospace",fontSize:10,outline:"none",caretColor:C.orange,letterSpacing:1}}/>
        <div style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:14,color:C.dim,cursor:"pointer"}}>🎙</div>
      </div>
      <button onClick={execute} disabled={thinking||!cmd.trim()}
        style={{background:thinking?"#1a0a00":`linear-gradient(90deg,${C.orangeD},${C.orange})`,border:`1px solid ${C.orange}`,borderRadius:"0 3px 3px 0",padding:"8px 22px",color:thinking?"#443322":"#000",fontFamily:"Orbitron,monospace",fontSize:11,fontWeight:700,cursor:thinking?"not-allowed":"pointer",letterSpacing:1,transition:"all 0.2s",boxShadow:thinking?"none":`0 0 18px ${C.orange}55`,whiteSpace:"nowrap"}}>
        {thinking?"PROCESSING...":"EXECUTE"}
      </button>
      <div style={{display:"flex",flexShrink:0}}>
        {["/seo","/content","/social","/youtube","/monetize"].map((s,i,arr)=>(
          <button key={i} onClick={()=>setCmd(s.slice(1)+" ")}
            style={{background:"#0a0600",border:`1px solid ${C.border2}`,borderLeft:i>0?"none":`1px solid ${C.border2}`,padding:"6px 10px",color:C.dim,fontFamily:"monospace",fontSize:8,cursor:"pointer",borderRadius:i===0?"3px 0 0 3px":i===arr.length-1?"0 3px 3px 0":"0"}}
            onMouseEnter={e=>e.currentTarget.style.color=C.orange}
            onMouseLeave={e=>e.currentTarget.style.color=C.dim}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// MOBILE LAYOUT
// ══════════════════════════════════════════════════
function MobileApp({ state, handlers }) {
  const { cmd, thinking, activeAgent, messages, feed, logs, perfData, taskPcts, time, activeTab } = state;
  const { setCmd, execute, setActiveAgent, setActiveTab, outputRef, handleKey, inputRef } = handlers;
  return (
    <div style={{width:"100%",height:"100dvh",background:C.bg,color:C.orange,fontFamily:"monospace",display:"flex",flexDirection:"column",fontSize:12,position:"fixed",inset:0,overflow:"hidden"}}>
      {/* TOP HEADER */}
      <div style={{background:"#080500",borderBottom:`1px solid ${C.border2}`,padding:"8px 12px",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:"calc(8px + env(safe-area-inset-top))"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,border:`2px solid ${C.orange}`,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:"#1a0a00",boxShadow:`0 0 10px ${C.orange}55`,fontSize:14}}>⬡</div>
          <div>
            <div style={{fontFamily:"Orbitron,monospace",fontSize:18,fontWeight:900,color:C.orange,textShadow:`0 0 10px ${C.orange}`,lineHeight:1}}>NOVA</div>
            <div style={{fontSize:6,color:"#554422",letterSpacing:1}}>AI COMMAND CENTER</div>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"Orbitron,monospace",fontSize:12,color:C.orange,fontWeight:700}}>{time.toTimeString().slice(0,8)}</div>
          <div style={{fontSize:6,color:C.green,display:"flex",alignItems:"center",gap:3,justifyContent:"flex-end",marginTop:2}}>
            <span className="pulse" style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:C.green}}/>ONLINE
          </div>
        </div>
      </div>

      {/* QUICK STATS STRIP */}
      <div style={{display:"flex",background:"#060400",borderBottom:`1px solid ${C.border2}`,flexShrink:0,overflowX:"auto"}}>
        {[
          {icon:"◈",val:"10",label:"AGENTS"},
          {icon:"◻",val:"2",label:"PROJECTS"},
          {icon:"⚡",val:thinking?"1":"0",label:"RUNNING"},
          {icon:"⚙",val:"98%",label:"SUCCESS"},
        ].map((s,i)=>(
          <div key={i} style={{padding:"6px 10px",display:"flex",alignItems:"center",gap:6,flexShrink:0,borderRight:`1px solid ${C.border}`}}>
            <span style={{fontSize:14,color:C.orange}}>{s.icon}</span>
            <div>
              <div style={{fontFamily:"Orbitron,monospace",fontSize:11,color:"#fff",fontWeight:700,lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:6,color:"#554422",marginTop:1}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* SCROLLABLE CONTENT */}
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",paddingBottom:0}}>
        {/* Always show chat/orb at top */}
        <div style={{padding:"10px 12px",borderBottom:`1px solid ${C.border}`,background:"#060400"}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:8}}>
            <CentralOrb thinking={thinking} size={160}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-around",marginTop:4,marginBottom:6}}>
            {[["AGENTS","10"],["NODES","12"],["UPTIME","99.9%"]].map(([k,v])=>(
              <div key={k} style={{textAlign:"center"}}>
                <div style={{fontFamily:"Orbitron,monospace",fontSize:11,color:C.orange,fontWeight:700}}>{v}</div>
                <div style={{fontSize:6,color:C.dim}}>{k}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CHAT OUTPUT */}
        <div ref={outputRef} style={{padding:"10px 12px",minHeight:100}}>
          <div style={{fontFamily:"Orbitron,monospace",fontSize:8,color:C.orange,fontWeight:700,letterSpacing:1,marginBottom:8}}>▸ COMMAND OUTPUT</div>
          {messages.length===0?(
            <div style={{color:C.dim2,fontSize:11,lineHeight:1.8}}>
              <span style={{color:C.dim}}>NOVA command output will appear here.</span><br/>
              <span>Try: </span><span style={{color:C.orange}}>"SEO audit Scholarics"</span><br/>
              <span>Or: </span><span style={{color:C.orange}}>"Write Instagram posts for Rooted"</span>
            </div>
          ):messages.map((m,i)=>(
            <div key={i} className="fade" style={{marginBottom:10}}>
              <div style={{fontSize:7,color:m.role==="user"?C.orangeL:C.dim,fontFamily:"Orbitron,monospace",marginBottom:3}}>
                [{m.role==="user"?"CMD":"NOVA — "+(m.agent||"AI")}] {m.role==="user"?">>>":"<<<"}
              </div>
              <div style={{
                background:m.role==="user"?"#0e0800":"#080500",
                border:`1px solid ${m.role==="user"?C.border2:C.border}`,
                borderRadius:4,padding:"8px 10px",
                fontSize:11,color:m.role==="user"?C.orangeL:"#ccaa88",
                whiteSpace:"pre-wrap",lineHeight:1.6,wordBreak:"break-word",
                fontFamily:"monospace",
              }}>{m.content}</div>
            </div>
          ))}
          {thinking&&(
            <div className="fade" style={{display:"flex",gap:6,alignItems:"center",color:C.orange,padding:"6px 0"}}>
              <span className="blink">▋</span>
              <span style={{fontFamily:"Orbitron,monospace",fontSize:9}}>{activeAgent||"NOVA"} PROCESSING...</span>
            </div>
          )}
        </div>

        {/* Tab content */}
        {activeTab==="team" && (
          <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`}}>
            <div style={{fontFamily:"Orbitron,monospace",fontSize:8,color:C.orange,fontWeight:700,letterSpacing:1,marginBottom:8}}>▸ AI TEAM</div>
            {[...LEFT_AGENTS,...RIGHT_AGENTS].map(a=>(
              <AgentCard key={a.id} agent={a} compact isActive={activeAgent===a.name} onClick={()=>setActiveAgent(a.name)}/>
            ))}
          </div>
        )}

        {activeTab==="feed" && (
          <>
            <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`}}>
              <div style={{fontFamily:"Orbitron,monospace",fontSize:8,color:C.orange,fontWeight:700,letterSpacing:1,marginBottom:8}}>▸ LIVE ACTIVITY FEED</div>
              {feed.map((f,i)=>(
                <div key={i} className={i===0?"fade":""} style={{padding:"7px 0",borderBottom:`1px solid #110900`,display:"flex",gap:8,alignItems:"flex-start"}}>
                  <span style={{fontSize:7,color:"#3a2a10",flexShrink:0,minWidth:48}}>{f.time||"--:--:--"}</span>
                  <span style={{fontSize:11,color:C.orange,flexShrink:0}}>⚡</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"Orbitron,monospace",fontSize:8,color:C.orange}}>{f.agent}</div>
                    <div style={{fontSize:8,color:"#776644"}}>{f.action}</div>
                  </div>
                  <span style={{fontSize:7,fontFamily:"Orbitron,monospace",color:f.status==="SUCCESS"?C.green:f.status==="RUNNING"?C.orangeL:C.red,flexShrink:0}}>{f.status}</span>
                </div>
              ))}
            </div>
            <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`}}>
              <div style={{fontFamily:"Orbitron,monospace",fontSize:8,color:C.orange,fontWeight:700,letterSpacing:1,marginBottom:8}}>▸ COMMAND CONSOLE</div>
              {logs.map((l,i)=>(
                <div key={i} style={{fontSize:8,color:l.startsWith("[ERROR]")?C.red:l.startsWith("[MISSION]")?C.green:C.dim,marginBottom:3,lineHeight:1.5,fontFamily:"monospace"}}>{l}</div>
              ))}
            </div>
          </>
        )}

        {activeTab==="projects" && (
          <>
            <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`}}>
              <div style={{fontFamily:"Orbitron,monospace",fontSize:8,color:C.orange,fontWeight:700,letterSpacing:1,marginBottom:8}}>▸ ACTIVE PROJECTS</div>
              {PROJECTS.map((p,i)=>(
                <div key={i} style={{marginBottom:10,background:"#0d0800",border:`1px solid ${C.border2}`,borderRadius:4,padding:"8px 10px"}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                    <div style={{width:28,height:28,background:"#1a0e00",border:`1px solid ${C.border2}`,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:C.orange,flexShrink:0}}>{p.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:10,color:"#ccaa88",fontFamily:"Orbitron,monospace",fontWeight:700}}>{p.name}</div>
                      <div style={{fontSize:8,color:C.dim2}}>{p.sub}</div>
                    </div>
                    <span style={{fontSize:9,color:C.orange,fontWeight:700,flexShrink:0}}>{taskPcts[i]||p.pct}%</span>
                  </div>
                  <div style={{height:4,background:"#1a0f00",borderRadius:2}}>
                    <div style={{height:"100%",width:`${taskPcts[i]||p.pct}%`,background:C.orange,borderRadius:2,transition:"width 1.5s"}}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`}}>
              <div style={{fontFamily:"Orbitron,monospace",fontSize:8,color:C.orange,fontWeight:700,letterSpacing:1,marginBottom:8}}>▸ TASK QUEUE</div>
              {TASKS.map((t,i)=>(
                <div key={i} style={{marginBottom:8,background:"#0d0800",border:`1px solid ${C.border2}`,borderRadius:4,padding:"7px 9px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                    <span style={{fontSize:12,color:t.color}}>{t.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:9,color:"#ccaa77"}}>{t.task}</div>
                      <div style={{fontSize:7,color:t.color,fontFamily:"Orbitron,monospace"}}>{t.agent}</div>
                    </div>
                    <span style={{fontSize:9,color:t.color,fontWeight:700}}>{taskPcts[i]||t.pct}%</span>
                  </div>
                  <div style={{height:3,background:"#1a0f00",borderRadius:2}}>
                    <div style={{height:"100%",width:`${taskPcts[i]||t.pct}%`,background:t.color,borderRadius:2}}/>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab==="system" && (
          <>
            <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`}}>
              <div style={{fontFamily:"Orbitron,monospace",fontSize:8,color:C.orange,fontWeight:700,letterSpacing:1,marginBottom:8}}>▸ API INTEGRATIONS</div>
              {APIS.map((a,i)=>(
                <div key={i} style={{marginBottom:9,background:"#0d0800",border:`1px solid ${C.border2}`,borderRadius:4,padding:"8px 10px",display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:16,color:C.orange,flexShrink:0,width:22}}>{a.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:10,color:"#ccaa77",fontWeight:700}}>{a.name}</div>
                    <div style={{fontSize:7,color:C.dim2}}>{a.sub}</div>
                    <div style={{height:3,background:"#1a0f00",borderRadius:2,marginTop:4}}>
                      <div style={{height:"100%",width:`${a.pct*4}%`,background:C.orange,borderRadius:2,maxWidth:"100%"}}/>
                    </div>
                  </div>
                  <div style={{fontSize:8,color:C.orange,flexShrink:0,textAlign:"right"}}>
                    <div>{a.used.toLocaleString()}/{(a.max/1000).toFixed(0)}K</div>
                    <div style={{fontWeight:700}}>{a.pct}%</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`}}>
              <div style={{fontFamily:"Orbitron,monospace",fontSize:8,color:C.orange,fontWeight:700,letterSpacing:1,marginBottom:8}}>▸ SYSTEM PERFORMANCE</div>
              {[
                {label:"CPU USAGE",    value:28, data:perfData.cpu,  color:C.orange},
                {label:"MEMORY USAGE", value:45, data:perfData.mem,  color:C.orangeL},
                {label:"NETWORK I/O",  value:68, data:perfData.net,  color:C.orangeD},
                {label:"DISK I/O",     value:72, data:perfData.disk, color:"#FF5500"},
              ].map(p=>(
                <div key={p.label} style={{marginBottom:8,background:"#0d0800",border:`1px solid ${C.border2}`,borderRadius:4,padding:"8px 10px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:8,color:C.dim,fontFamily:"Orbitron,monospace"}}>{p.label}</span>
                    <span style={{fontSize:11,color:p.color,fontWeight:700,fontFamily:"Orbitron,monospace"}}>{p.value}%</span>
                  </div>
                  <AreaChart values={p.data} color={p.color} h={28}/>
                </div>
              ))}
            </div>
            <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`}}>
              <div style={{fontFamily:"Orbitron,monospace",fontSize:8,color:C.orange,fontWeight:700,letterSpacing:1,marginBottom:8}}>▸ GLOBAL NETWORK</div>
              <div style={{background:"#0d0800",border:`1px solid ${C.border2}`,borderRadius:4,padding:"8px"}}>
                <WorldMap/>
                <div style={{display:"flex",justifyContent:"space-around",marginTop:8}}>
                  {[["NODES","12"],["TRANSFER","1.2TB/s"],["UPTIME","99.98%"]].map(([k,v])=>(
                    <div key={k} style={{textAlign:"center"}}>
                      <div style={{fontFamily:"Orbitron,monospace",fontSize:11,color:C.orange,fontWeight:700}}>{v}</div>
                      <div style={{fontSize:6,color:C.dim}}>{k}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Bottom spacer so content isn't hidden behind fixed input bar */}
        <div style={{height:"calc(88px + env(safe-area-inset-bottom) + 60px)"}}/>
      </div>

      {/* BOTTOM TAB BAR */}
      <div style={{display:"flex",background:"#060400",borderTop:`1px solid ${C.border2}`,flexShrink:0,zIndex:20}}>
        {MOBILE_TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{flex:1,background:"transparent",border:"none",padding:"8px 4px",display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",color:activeTab===t.id?C.orange:"#554433",borderBottom:activeTab===t.id?`2px solid ${C.orange}`:"2px solid transparent",transition:"all 0.15s"}}>
            <span style={{fontSize:16}}>{t.icon}</span>
            <span style={{fontSize:7,fontFamily:"Orbitron,monospace",fontWeight:activeTab===t.id?700:400,letterSpacing:0.5}}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ═══ FIXED COMMAND INPUT BAR ═══ */}
      <div style={{background:"#060400",borderTop:`1px solid ${C.border2}`,padding:"8px 10px",paddingBottom:"calc(8px + env(safe-area-inset-bottom))",display:"flex",gap:6,alignItems:"center",flexShrink:0,position:"sticky",bottom:0,left:0,right:0,zIndex:30,boxShadow:"0 -4px 20px rgba(0,0,0,0.6)"}}>
        {/* Quick slash chips (horizontal scroll) */}
        <button onClick={()=>setCmd("status ")}
          style={{background:"#0a0600",border:`1px solid ${C.border2}`,borderRadius:3,padding:"10px 8px",color:C.orange,fontFamily:"monospace",fontSize:9,cursor:"pointer",flexShrink:0}}>
          /?
        </button>
        <div style={{flex:1,display:"flex",position:"relative",minWidth:0}}>
          <input ref={inputRef} value={cmd} onChange={e=>setCmd(e.target.value)} onKeyDown={handleKey}
            placeholder="ENTER COMMAND..."
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            style={{width:"100%",background:"#0a0700",border:`1px solid ${C.border2}`,borderRadius:4,padding:"11px 42px 11px 12px",color:C.orange,fontFamily:"Orbitron,monospace",fontSize:11,outline:"none",caretColor:C.orange,letterSpacing:0.5,minWidth:0}}/>
          <div onClick={()=>{}} style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",fontSize:16,color:C.dim,cursor:"pointer",padding:4}}>🎙</div>
        </div>
        <button onClick={execute} disabled={thinking||!cmd.trim()}
          style={{background:thinking?"#1a0a00":`linear-gradient(90deg,${C.orangeD},${C.orange})`,border:`1px solid ${C.orange}`,borderRadius:4,padding:"11px 14px",color:thinking?"#443322":"#000",fontFamily:"Orbitron,monospace",fontSize:10,fontWeight:900,cursor:thinking?"not-allowed":"pointer",letterSpacing:0.5,boxShadow:thinking?"none":`0 0 12px ${C.orange}55`,whiteSpace:"nowrap",flexShrink:0,minHeight:40}}>
          {thinking?"⟳":"▶"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════
export default function NOVA() {
  const [cmd, setCmd] = useState("");
  const [thinking, setThinking] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("chat");
  const [time, setTime] = useState(new Date());
  const isMobile = useIsMobile();

  const [feed, setFeed] = useState([
    {time:"",agent:"NOVA",    action:"System initialized. All agents online.",status:"SUCCESS"},
    {time:"",agent:"SEO",     action:"Standing by for Scholarics audit.",     status:"SUCCESS"},
    {time:"",agent:"CONTENT", action:"Content templates loaded.",             status:"SUCCESS"},
    {time:"",agent:"SOCIAL",  action:"Social platforms connected.",           status:"SUCCESS"},
    {time:"",agent:"MONITOR", action:"Scholarics & Rooted uptime nominal.",   status:"SUCCESS"},
    {time:"",agent:"YOUTUBE", action:"YouTube agent ready.",                  status:"SUCCESS"},
  ]);
  const [logs, setLogs] = useState([
    "[SYSTEM] NOVA core initialized",
    "[AI TEAM] All 10 agents online and responsive",
    "[SECURITY] All protocols secure",
    "[NETWORK] Scholarics & Rooted connected",
    "[DATABASE] Supabase synchronized",
    "[MISSION] Ready for commands, Commander",
  ]);
  const [perfData] = useState({
    cpu:   Array.from({length:40},()=>20+Math.random()*30),
    mem:   Array.from({length:40},()=>35+Math.random()*25),
    net:   Array.from({length:40},()=>50+Math.random()*35),
    disk:  Array.from({length:40},()=>60+Math.random()*20),
  });
  const [taskPcts, setTaskPcts] = useState(TASKS.map(t=>t.pct));
  const outputRef = useRef(null);
  const consoleRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(()=>{const i=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(i);},[]);
  useEffect(()=>{
    setFeed(f=>f.map((x,i)=>{const d=new Date(Date.now()-(f.length-i)*18000);return{...x,time:d.toTimeString().slice(0,8)};}));
  },[]);
  useEffect(()=>{
    const i=setInterval(()=>setTaskPcts(p=>p.map(v=>Math.min(99,v+(Math.random()>0.75?1:0)))),4000);
    return()=>clearInterval(i);
  },[]);
  useEffect(()=>{if(outputRef.current)outputRef.current.scrollTop=outputRef.current.scrollHeight;},[messages,thinking]);
  useEffect(()=>{if(consoleRef.current)consoleRef.current.scrollTop=consoleRef.current.scrollHeight;},[logs]);

  const addFeed=(agent,action,status="SUCCESS")=>{
    const t=new Date().toTimeString().slice(0,8);
    setFeed(p=>[{time:t,agent,action,status},...p].slice(0,20));
  };
  const addLog=msg=>setLogs(p=>[...p,msg].slice(-40));

  const execute = async () => {
    if(!cmd.trim()||thinking) return;
    const userCmd=cmd.trim(); setCmd("");
    const agent=detectAgent(userCmd);
    setActiveAgent(agent); setThinking(true);
    addFeed(agent,`Processing: ${userCmd.slice(0,35)}...`,"RUNNING");
    addLog(`[${agent}] Processing command...`);
    const newMsgs=[...messages,{role:"user",content:userCmd}];
    setMessages(newMsgs);
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:SYSTEM_PROMPT,
          messages:newMsgs.map(m=>({role:m.role,content:m.content}))})
      });
      const data=await res.json();
      const reply=data.content?.map(c=>c.text||"").join("")||"Signal lost.";
      setMessages(p=>[...p,{role:"assistant",content:reply,agent}]);
      addFeed(agent,userCmd.slice(0,40),"SUCCESS");
      addLog(`[${agent}] Task completed.`);
    } catch {
      setMessages(p=>[...p,{role:"assistant",content:"Connection interrupted. Retry.",agent:"SYSTEM"}]);
      addFeed("SYSTEM","Connection error","ERROR");
      addLog("[ERROR] Connection interrupted");
    } finally { setThinking(false); }
  };

  const handleKey=e=>{if(e.key==="Enter")execute();};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        html, body, #root { margin:0; padding:0; background:#000; height:100%; }
        body { overscroll-behavior:none; }
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-track{background:#050300;}
        ::-webkit-scrollbar-thumb{background:#2a1a00;}
        input, button, textarea { font-family: inherit; -webkit-appearance:none; appearance:none; border-radius:0; }
        input:focus, button:focus { outline: none; }
        button { -webkit-user-select:none; user-select:none; touch-action:manipulation; }
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.7}50%{opacity:1}}
        .fade{animation:fadeUp 0.3s ease forwards;}
        .pulse{animation:pulse 2s ease-in-out infinite;}
        .blink{animation:blink 1s infinite;}
      `}</style>
      {isMobile
        ? <MobileApp state={{cmd,thinking,activeAgent,messages,feed,logs,perfData,taskPcts,time,activeTab}}
                    handlers={{setCmd,execute,setActiveAgent,setActiveTab,outputRef,handleKey,inputRef}}/>
        : <DesktopApp state={{cmd,thinking,activeAgent,messages,feed,logs,perfData,taskPcts,time}}
                     handlers={{setCmd,execute,setActiveAgent,outputRef,consoleRef,handleKey}}/>
      }
    </>
  );
}
