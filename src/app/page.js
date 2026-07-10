"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SITE, PROJECTS, SERVICES, TESTIMONIALS } from './data';

// --- Cursor ---
function useCursor() {
  useEffect(() => {
    const dot = document.getElementById("cursorDot");
    const ring = document.getElementById("cursorRing");
    if (!dot || !ring) return;

    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let rx = tx, ry = ty;

    const onMove = (e) => {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%,-50%)`;
    };
    const loop = () => {
      rx += (tx - rx) * 0.15;
      ry += (ty - ry) * 0.15;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove);
    const raf = requestAnimationFrame(loop);

    const onOver = (e) => { if (e.target.closest("a, button, [data-hover]")) ring.classList.add("hover"); };
    const onOut = (e) => { if (e.target.closest("a, button, [data-hover]")) ring.classList.remove("hover"); };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      cancelAnimationFrame(raf);
    };
  }, []);
}

// --- Scroll Reveal ---
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) {
      els.forEach(e => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, []);
}

// small deterministic PRNG so the "random" weave is stable across rebuilds
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Scroll Progress Spine (winding line behind the sections) ---
function ScrollSpine() {
  const fillRef = useRef(null);
  const cometRef = useRef(null);
  const lenRef = useRef(0);
  const [path, setPath] = useState("");
  const [dims, setDims] = useState({ w: 0, h: 0 });

  // Build a smooth, randomly-weaving path spanning the full page height.
  useEffect(() => {
    const build = () => {
      const w = document.documentElement.clientWidth;
      const h = Math.max(document.documentElement.scrollHeight, window.innerHeight);
      const mobile = w < 640;
      const mx = mobile ? w * 0.2 : w * 0.1;     // horizontal inset of the swings
      const seg = mobile ? 460 : 560;            // vertical distance between swings
      const count = Math.max(3, Math.round(h / seg));
      const lo = mx, hi = w - mx, span = hi - lo;
      const heroH = mobile ? Math.min(h * 0.92, window.innerHeight + 120) : Math.min(h * 0.88, window.innerHeight + 80);

      // random x at each waypoint, but always a decent swing away from the last.
      // start pinned to the left side so the line enters from the top-left.
      const rand = mulberry32(0x9e3779b9);
      const startX = mobile ? mx * 0.15 : mx * 0.08;
      const xs = [startX, startX];
      const ys = [0, heroH];
      let prev = startX;
      const remaining = Math.max(1, count - 1);
      for (let k = 1; k <= remaining; k++) {
        let x = prev, tries = 0;
        do { x = lo + rand() * span; tries++; }
        while (Math.abs(x - prev) < span * 0.42 && tries < 6);
        xs.push(x);
        prev = x;
      }

      const tailSteps = xs.length - 2;
      for (let k = 1; k <= tailSteps; k++) {
        ys.push(heroH + ((h - heroH) * k) / tailSteps);
      }

      const pts = xs.map((x, k) => [x, ys[k]]);
      let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
      for (let k = 1; k < pts.length; k++) {
        const [x0, y0] = pts[k - 1];
        const [x1, y1] = pts[k];
        const dy = (y1 - y0) * 0.5;             // vertical tangents → smooth S-curves
        d += ` C ${x0.toFixed(1)} ${(y0 + dy).toFixed(1)}, ${x1.toFixed(1)} ${(y1 - dy).toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
      }
      setDims({ w, h });
      setPath(d);
    };
    build();
    window.addEventListener("resize", build);
    const ro = new ResizeObserver(build);
    ro.observe(document.body);
    return () => { window.removeEventListener("resize", build); ro.disconnect(); };
  }, []);

  // Keep the glow + comet locked to the middle of the viewport as you scroll.
  useEffect(() => {
    const fill = fillRef.current;
    if (!fill || !path) return;
    const total = fill.getTotalLength();
    lenRef.current = total;
    let raf = 0;
    const update = () => {
      raf = 0;
      const docH = document.documentElement.scrollHeight;
      const vh = window.innerHeight;
      const sy = window.scrollY;
      const maxScroll = docH - vh;
      const nb = maxScroll > 0 ? Math.min(1, Math.max(0, sy / maxScroll)) : 0;
      // ½ viewport ahead normally, ramping to a full viewport at the bottom
      // so the line reaches all the way down to the footer.
      const targetY = sy + vh * (0.5 + 0.5 * nb);

      // y increases monotonically along the path → binary-search the length at targetY.
      // (Mapping by Y instead of arc-length means the comet never lags through wide curves.)
      let lo = 0, hi = total;
      for (let i = 0; i < 16; i++) {
        const mid = (lo + hi) / 2;
        if (fill.getPointAtLength(mid).y < targetY) lo = mid; else hi = mid;
      }
      const len = (lo + hi) / 2;
      const pt = fill.getPointAtLength(len);
      document.documentElement.style.setProperty("--scroll-progress", String(docH > 0 ? len / total : 0));
      if (cometRef.current) cometRef.current.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [path]);

  return (
    <svg
      className="scroll-spine"
      width={dims.w}
      height={dims.h}
      viewBox={`0 0 ${dims.w} ${dims.h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path className="spine-base" d={path} fill="none" pathLength="1" />
      <path ref={fillRef} className="spine-fill" d={path} fill="none" pathLength="1" />
      <g ref={cometRef} className="spine-comet">
        <circle className="spine-comet-halo" r="11" />
        <circle className="spine-comet-core" r="4" />
      </g>
    </svg>
  );
}

// --- Sticky Stack Effect ---
function useStickyStack() {
  useEffect(() => {
    const cards = document.querySelectorAll(".proj-card");
    if (!cards.length) return;

    const onScroll = () => {
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const navH = 80;
        if (rect.top < navH) {
          const progress = Math.min(1, (navH - rect.top) / (window.innerHeight * 0.6));
          const scale = 1 - progress * 0.025;
          const y = -progress * 12;
          const opacity = 1 - progress * 0.12;
          card.style.transform = `scale(${scale}) translateY(${y}px)`;
          card.style.opacity = String(opacity);
        } else {
          card.style.transform = "";
          card.style.opacity = "1";
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}

// --- Terminal Hero ---
const TERMINAL_SEQ = [
  { type: 'prompt', text: 'deploy --env production crewforge' },
  { type: 'out',     text: 'connecting to aws...' },
  { type: 'out',     text: 'bundling 47 modules...' },
  { type: 'success', text: '✓ live → crewforge.io  (11s)' },
  { type: 'gap' },
  { type: 'prompt', text: 'agent run --task "fix checkout drop"' },
  { type: 'out',     text: 'analysing funnel data...' },
  { type: 'success', text: '✓ patch shipped → +23% CVR' },
  { type: 'gap' },
  { type: 'prompt', text: 'status' },
  { type: 'info',    text: '⬡  5 apps in production' },
  { type: 'info',    text: '★  4.9 / 5  ·  31 reviews' },
  { type: 'info',    text: '∞  14 countries  ·  4+ years' },
];

const LINE_DELAY = { prompt: 700, out: 280, success: 320, info: 220, gap: 150 };
const CLEAR_DELAY = 900;
const RESET_DELAY = 260;
const CLEAR_TEXT = 'clear';

function TerminalWindow() {
  const [count, setCount] = useState(0);
  const [clearing, setClearing] = useState(false);
  const [clearText, setClearText] = useState('');

  useEffect(() => {
    if (clearing) {
      if (clearText.length < CLEAR_TEXT.length) {
        const t = setTimeout(() => {
          setClearText(CLEAR_TEXT.slice(0, clearText.length + 1));
        }, 85);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => {
        setCount(0);
        setClearText('');
        setClearing(false);
      }, RESET_DELAY);
      return () => clearTimeout(t);
    }
    if (count >= TERMINAL_SEQ.length) {
      const t = setTimeout(() => setClearing(true), CLEAR_DELAY);
      return () => clearTimeout(t);
    }
    const line = TERMINAL_SEQ[count];
    const t = setTimeout(() => setCount(c => c + 1), LINE_DELAY[line.type] ?? 300);
    return () => clearTimeout(t);
  }, [count, clearing, clearText]);

  return (
    <div className="terminal-card">
      <div className="terminal-bar">
        <span className="terminal-dot red" />
        <span className="terminal-dot yellow" />
        <span className="terminal-dot green" />
        <span className="terminal-title">danish@portfolio — zsh</span>
      </div>
      <div className="terminal-body">
        {TERMINAL_SEQ.slice(0, count).map((line, i) =>
          line.type === 'gap'
            ? <div key={i} style={{ height: 4 }} />
            : (
              <div key={i} className={`term-line term-${line.type}`}>
                {line.type === 'prompt' && <span className="term-ps">~ $&nbsp;</span>}
                <span className={`term-${line.type === 'prompt' ? 'cmd' : line.type}`}>{line.text}</span>
              </div>
            )
        )}
        {!clearing && count < TERMINAL_SEQ.length && (
          <div className="term-line">
            {TERMINAL_SEQ[count]?.type === 'prompt' && <span className="term-ps">~ $&nbsp;</span>}
            <span className="term-cursor" />
          </div>
        )}
        {clearing && (
          <div className="term-line">
            <span className="term-ps">~ $&nbsp;</span>
            <span className="term-cmd">{clearText}</span>
            <span className="term-cursor" />
          </div>
        )}
      </div>
    </div>
  );
}

// --- Robot SVG Character ---
function RobotSVG({ color = "var(--accent)" }) {
  return (
    <svg viewBox="0 0 28 40" width="28" height="40" className="agent-svg" aria-hidden="true">
      <line x1="14" y1="3" x2="14" y2="0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="2.5" r="1.5" fill={color} />
      <rect x="6" y="4" width="16" height="11" rx="3" fill="var(--bg-2)" stroke={color} strokeWidth="1" />
      <circle cx="10.5" cy="9.5" r="1.8" fill={color} />
      <circle cx="17.5" cy="9.5" r="1.8" fill={color} />
      <circle cx="10.5" cy="9.5" r="0.8" fill="var(--bg)" opacity="0.5" />
      <circle cx="17.5" cy="9.5" r="0.8" fill="var(--bg)" opacity="0.5" />
      <rect x="12" y="15" width="4" height="2" fill={color} opacity="0.5" />
      <rect x="4" y="17" width="20" height="13" rx="3" fill="var(--bg-2)" stroke={color} strokeWidth="1" />
      <circle cx="14" cy="23.5" r="2.5" fill={color} opacity="0.15" />
      <circle cx="14" cy="23.5" r="1.2" fill={color} opacity="0.5" />
      <rect x="0" y="19" width="4" height="8" rx="2" fill="var(--bg-2)" stroke={color} strokeWidth="0.75" />
      <rect x="24" y="19" width="4" height="8" rx="2" fill="var(--bg-2)" stroke={color} strokeWidth="0.75" />
      <rect x="6" y="30" width="6" height="9" rx="2.5" fill="var(--bg-2)" stroke={color} strokeWidth="1" />
      <rect x="16" y="30" width="6" height="9" rx="2.5" fill="var(--bg-2)" stroke={color} strokeWidth="1" />
      <rect x="5" y="37" width="8" height="3" rx="1.5" fill={color} opacity="0.7" />
      <rect x="15" y="37" width="8" height="3" rx="1.5" fill={color} opacity="0.7" />
    </svg>
  );
}

const AGENT_QUOTES = [
  "just deployed 3 features 🚀",
  "bug found. it was a semicolon.",
  "API: 120ms response ✓",
  "running 47 automated tests...",
  "pushed to prod ✓",
  "reading docs so you don't have to",
  "query optimised ⚡",
  "squashing bugs 🐛",
  "build passed ✓",
  "spinning up new env...",
  "coffee.exe running ☕",
  "shipping at 2am again 🌙",
];

const AGENTS_DATA = [
  { id: 0, color: "var(--accent)", label: "DEPLOY", icon: "⚡", dur: "8s", delay: "0s", dir: 1 },
  { id: 1, color: "#e67e22", label: "BUILD", icon: "⚙", dur: "11s", delay: "2.2s", dir: -1 },
  { id: 2, color: "#9b59b6", label: "TEST", icon: "✓", dur: "9s", delay: "4.5s", dir: 1 },
  { id: 3, color: "#3498db", label: "SHIP", icon: "📦", dur: "13s", delay: "1s", dir: -1 },
];

function AgentChar({ color, label, icon, dur, delay, dir }) {
  const [hovered, setHovered] = useState(false);
  const quote = useMemo(() => AGENT_QUOTES[Math.floor(Math.random() * AGENT_QUOTES.length)], []);

  return (
    <div
      className={`agent-walk-x ${dir > 0 ? 'agent-r' : 'agent-l'}`}
      style={{ '--walk-dur': dur, '--walk-delay': delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="agent-bob-wrap">
        {hovered && <div className="agent-bubble">{quote}</div>}
        <div className="agent-task-icon">{icon}</div>
        <RobotSVG color={color} />
        <div className="agent-label" style={{ color }}>{label}</div>
      </div>
    </div>
  );
}

function AgentScene() {
  return (
    <div className="agent-scene-wrap">
      <TerminalWindow />
      <div className="agent-stage">
        <div className="agent-stage-label">// agents at work</div>
        {AGENTS_DATA.map(a => <AgentChar key={a.id} {...a} />)}
      </div>
    </div>
  );
}

// --- Skills Explorer ---
function SkillsExplorer() {
  const [activeTab, setActiveTab] = useState(0);
  const [activeChip, setActiveChip] = useState(null);

  const categories = useMemo(() => [
    {
      label: "Frontend", icon: "◧", color: "#3498db",
      tools: [
        { name: "React", note: "4+ years · production apps" },
        { name: "Next.js", note: "SSR, App Router, API routes" },
        { name: "Vue.js", note: "Drink-X social platform" },
        { name: "TypeScript", note: "Typed, always" },
        { name: "Tailwind", note: "Utility-first, fast to ship" },
        { name: "CSS / SCSS", note: "Custom animations & effects" },
      ],
    },
    {
      label: "Backend", icon: "⬡", color: "#e67e22",
      tools: [
        { name: "Node.js", note: "REST, Express, WebSockets" },
        { name: "Python", note: "Flask, FastAPI, automation" },
        { name: "PostgreSQL", note: "Primary DB, complex queries" },
        { name: "Supabase", note: "Auth + real-time + storage" },
        { name: "Firebase", note: "Real-time, Crewforge" },
        { name: "MySQL", note: "Legacy & enterprise systems" },
      ],
    },
    {
      label: "AI / LLM", icon: "◉", color: "var(--accent)",
      tools: [
        { name: "OpenAI", note: "GPT-4, embeddings, vision" },
        { name: "Claude API", note: "Tool use, agents, Anthropic" },
        { name: "Gemini", note: "Google AI, multimodal" },
        { name: "LangChain", note: "Chains, agents, RAG" },
        { name: "RAG", note: "Vector search + LLM retrieval" },
        { name: "Prompt Eng.", note: "System prompts, chains, evals" },
      ],
    },
    {
      label: "Cloud", icon: "△", color: "#9b59b6",
      tools: [
        { name: "AWS", note: "EC2, S3, Lambda, RDS" },
        { name: "Vercel", note: "Next.js, edge deployments" },
        { name: "Linux", note: "Ubuntu, Nginx, PM2" },
        { name: "Stripe", note: "Payments, subscriptions" },
        { name: "Docker", note: "Containers, services" },
        { name: "GitHub Actions", note: "CI/CD, auto-deploy" },
      ],
    },
  ], []);

  const current = categories[activeTab];

  return (
    <div className="skills-explorer">
      <div className="skill-tabs">
        {categories.map((cat, i) => (
          <button
            key={cat.label}
            className={`skill-tab ${activeTab === i ? 'active' : ''}`}
            onClick={() => { setActiveTab(i); setActiveChip(null); }}
            style={{ '--tab-color': cat.color }}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>
      <div className="skill-grid" key={activeTab}>
        {current.tools.map((tool, i) => (
          <button
            key={tool.name}
            className={`skill-chip ${activeChip === i ? 'active' : ''}`}
            style={{ '--chip-color': current.color, animationDelay: `${i * 0.06}s` }}
            onClick={() => setActiveChip(activeChip === i ? null : i)}
          >
            <span>{tool.name}</span>
            {activeChip === i && (
              <span className="skill-note">{tool.note}</span>
            )}
          </button>
        ))}
      </div>
      <div className="skill-hint">// click any tool for context</div>
    </div>
  );
}

// --- Marquee ---
function Marquee() {
  const items = [
    "APPS DELIVERED IN WEEKS",
    "AI AUTOMATION THAT SHIPS",
    "15K+ USERS ON LIVE PLATFORMS",
    "CLIENTS ACROSS 14 COUNTRIES",
    "5★ RATED · 31 CLIENT REVIEWS",
    "FROM IDEA TO LAUNCHED · FAST",
  ];
  const row = (
    <span>
      {items.map((t, i) => (
        <React.Fragment key={i}>
          <span>{t}</span>
          <span className="star">✦</span>
        </React.Fragment>
      ))}
    </span>
  );
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">{row}{row}</div>
    </div>
  );
}

// --- Project Cards (sticky stack) ---
function ProjectCard({ project, index }) {
  const isFlip = index % 2 === 1;
  return (
    <div className="proj-sticky-wrapper">
      <article
        className={`proj-card reveal ${isFlip ? "proj-card--flip" : ""}`}
        data-delay={String(Math.min(index, 2))}
        style={{ "--proj-color": project.color, zIndex: index + 1 }}
      >
        <div className="proj-card-visual">
          {project.video
            ? <video src={project.video} autoPlay muted loop playsInline />
            : project.image
              ? <img src={project.image} alt={`${project.name} screenshot`} loading="lazy" />
              : (
                <div className="proj-card-placeholder">
                  <span>{project.note || "[ screenshot on request ]"}</span>
                </div>
              )
          }
        </div>

        <div className="proj-card-body">
          <div className="proj-card-header">
            <span className="proj-card-num">0{index + 1}</span>
            <span className="proj-card-category">{project.category}</span>
            <span className="proj-card-year">{project.year}</span>
          </div>

          <h3 className="proj-card-name">{project.name}</h3>

          {project.metric && (
            <div className="proj-card-metric">
              {project.metric.big} <span style={{ fontWeight: 400, color: "var(--fg-muted)" }}>{project.metric.small}</span>
            </div>
          )}

          <p className="proj-card-desc">{project.tag}</p>

          <div className="proj-chips">
            {project.stack.map(s => <span key={s} className="chip">{s}</span>)}
          </div>

          {project.link
            ? <a href={project.link} target="_blank" rel="noopener noreferrer" className="proj-card-link" data-hover>
              Visit {project.name} ↗
            </a>
            : <span className="proj-card-note">{project.note}</span>
          }
        </div>
      </article>
    </div>
  );
}

// --- Sections ---
function WorkSection() {
  useStickyStack();
  return (
    <section id="work" className="block">
      <div className="container">
        <div className="eyebrow reveal"><span className="line" /><span>// 01 — SELECTED WORK</span></div>
        <h2 className="section-title reveal">Production apps.<br />Real clients. Live.</h2>
        <p className="section-lede reveal" data-delay="1">
          Five platforms shipped for paying clients. No side projects, no mockups — everything below is live and serving real users.
        </p>
        <div className="proj-stack-outer">
          {PROJECTS.map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const flags = ["🇬🇧", "🇩🇪", "🇺🇸", "🇪🇸", "🇨🇦", "🇳🇿", "🇲🇦", "🇫🇷", "🇮🇱", "🇵🇰", "🇮🇳", "🇸🇬", "🇩🇰", "🇦🇷"];
  return (
    <section className="block" style={{ paddingTop: 0, borderTop: 0 }}>
      <div className="container">
        <div className="stats reveal">
          {SITE.stats.map((s, i) => (
            <div className="stat" key={i}>
              <div className="num">{s.num}<span className="unit">{s.unit}</span></div>
              <div className="lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
        <div className="flags-strip reveal" data-delay="1" title="Client countries">
          <span className="flags-strip-label">Clients from</span>
          {flags.map((f, i) => <span key={i}>{f}</span>)}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const half = Math.ceil(TESTIMONIALS.length / 2);
  const row1 = [...TESTIMONIALS.slice(0, half), ...TESTIMONIALS.slice(0, half)];
  const row2 = [...TESTIMONIALS.slice(half), ...TESTIMONIALS.slice(half)];

  const Card = ({ t }) => (
    <div className="testi-card" data-hover>
      <div className="testi-stars">{"★".repeat(t.stars)}</div>
      <p className="testi-text">{t.text}</p>
      <div className="testi-author">
        <span className="testi-author-flag">{t.flag}</span>
        <div>
          <div className="testi-author-name">@{t.name}</div>
          <div className="testi-author-meta">{t.country} · {t.gig}</div>
        </div>
      </div>
    </div>
  );

  return (
    <section id="testimonials" className="testi-outer">
      <div className="testi-header reveal">
        <div className="eyebrow"><span className="line" /><span>// 02 — CLIENT REVIEWS</span></div>
        <h2 className="section-title">31 reviews. 5 years.<br />Clients keep coming back.</h2>
        <p className="section-lede" style={{ marginBottom: 0 }}>
          Every review below is from a real Fiverr client. No testimonial links, no cherry-picked screenshots —&nbsp;
          <a href={SITE.fiverr} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>you can read them all on Fiverr</a>.
        </p>
      </div>
      <div className="testi-tracks">
        <div className="testi-track testi-track--fwd">
          {row1.map((t, i) => <Card key={i} t={t} />)}
        </div>
        <div className="testi-track testi-track--rev">
          {row2.map((t, i) => <Card key={i} t={t} />)}
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section id="services" className="block">
      <div className="container">
        <div className="eyebrow reveal"><span className="line" /><span>// 03 — WHAT I BUILD</span></div>
        <h2 className="section-title reveal">Three things, done properly.</h2>
        <p className="section-lede reveal" data-delay="1">
          I don't do everything. These are the three service areas where I've shipped repeatedly and can move fast.
        </p>
        <div className="services">
          {SERVICES.map((s, i) => (
            <div className="service reveal" data-delay={String(i)} key={s.num} data-hover>
              <div className="num">/{s.num}</div>
              <h4>{s.title}</h4>
              <p>{s.body}</p>
              <div className="service-tags">
                {s.tags.map(t => <span key={t} className="service-tag">{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="block">
      <div className="container">
        <div className="eyebrow reveal"><span className="line" /><span>// 04 — ABOUT</span></div>
        <div className="about-grid about">
          <div className="reveal">
            <h2 className="section-title" style={{ marginBottom: 28 }}>
              I ship software that solves real problems.
            </h2>
            {SITE.bio.map((p, i) => (
              <p key={i} dangerouslySetInnerHTML={{
                __html: p
                  .replace("70%", "<strong>70%</strong>")
                  .replace("15K+", "<strong>15K+</strong>")
                  .replace("4+", "<strong>4+</strong>")
              }} />
            ))}
            <div className="sig">— Danish, probably in a Zoom call right now</div>
          </div>
          <div className="reveal" data-delay="1">
            <SkillsExplorer />
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(SITE.email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section id="contact" className="block contact">
      <div className="container">
        <div className="prompt reveal">// got a project? let's talk →</div>
        <h2 className="reveal" data-delay="1">
          <a href={`mailto:${SITE.email}`} data-hover>{SITE.email}</a>
        </h2>
        <div className="socials reveal" data-delay="2">
          <button onClick={copy} data-hover style={{ border: "1px solid var(--line)", padding: "10px 20px", borderRadius: 999, fontFamily: "var(--font-display)", fontSize: 12, transition: "all .2s", color: copied ? "var(--accent)" : "inherit", borderColor: copied ? "var(--accent)" : "var(--line)" }}>
            {copied ? "✓ Copied!" : "⎘ Copy email"}
          </button>
          <a href={`https://${SITE.github}`} target="_blank" rel="noopener" data-hover>→ GitHub</a>
          <a href={`https://${SITE.linkedin}`} target="_blank" rel="noopener" data-hover>→ LinkedIn</a>
          <a href={SITE.fiverr} target="_blank" rel="noopener noreferrer" data-hover>→ Fiverr</a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const utc = now ? now.getTime() + now.getTimezoneOffset() * 60000 : Date.now();
  const pkt = new Date(utc + 5 * 3600000);
  const hh = String(pkt.getHours()).padStart(2, "0");
  const mm = String(pkt.getMinutes()).padStart(2, "0");
  const year = pkt.getFullYear();
  return (
    <footer>
      <div className="container">
        <div className="row">
          <span>© {year} Danish Aqib · Built with Next.js</span>
          <span>{hh}:{mm} PKT · hand-coded with too much chai ☕</span>
        </div>
      </div>
    </footer>
  );
}

// --- Hero ---
function Hero() {
  const phrases = useMemo(() => [
    "gets work done.",
    "runs on autopilot.",
    "replaces manual work.",
    "scales as you grow.",
  ], []);
  const [idx, setIdx] = useState(0);
  const [txt, setTxt] = useState("");
  const [del, setDel] = useState(false);

  useEffect(() => {
    const current = phrases[idx];
    const speed = del ? 35 : 65;
    const t = setTimeout(() => {
      if (!del) {
        if (txt.length < current.length) setTxt(current.slice(0, txt.length + 1));
        else setTimeout(() => setDel(true), 1800);
      } else {
        if (txt.length > 0) setTxt(current.slice(0, txt.length - 1));
        else { setDel(false); setIdx((idx + 1) % phrases.length); }
      }
    }, speed);
    return () => clearTimeout(t);
  }, [txt, del, idx, phrases]);

  return (
    <div className="hero container">
      {/* Left */}
      <div className="hero-left">
        <div className="availability reveal in">
          <span className="led" />
          <span>{SITE.availabilityNote}</span>
        </div>

        <h1 className="reveal in">
          <span className="line">I build software</span>
          <span className="hero-typed-line">
            <span style={{ color: "var(--accent)" }}>{txt}</span>
            <span className="caret" />
          </span>
        </h1>

        <p className="hero-sub reveal" data-delay="1">
          Full-stack engineer specialising in web apps, AI automation, and marketplaces.
          Four years of shipping for international clients — from Notion doc to live product, fast.
        </p>

        <div className="cta-row reveal" data-delay="2">
          <a href={`mailto:${SITE.email}`} className="btn primary" data-hover>
            Start a project <span className="arrow">→</span>
          </a>
          <a href="#work" className="btn" data-hover>
            See the work
          </a>
        </div>

        <div className="hero-meta reveal" data-delay="3">
          <span>◎ <strong>Islamabad, PKT</strong></span>
          <span>★ <strong>4.9</strong> · 31 reviews</span>
          <span>∞ <strong>4+ yrs</strong> shipping</span>
          <span>⬡ <strong>14 countries</strong> served</span>
        </div>
      </div>

      {/* Right — portrait + agent scene */}
      <AgentScene />
    </div>
  );
}

// --- App ---
export default function App() {
  useCursor();
  useScrollReveal();

  return (
    <>
      <div className="cursor-ring" id="cursorRing" />
      <div className="cursor-dot" id="cursorDot" />

      {/* <ScrollSpine /> */}

      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand"><span className="dot" />DANISH_AQIB.DEV</div>
          <div className="nav-links">
            <a href="#work">work</a>
            <span className="sep">/</span>
            <a href="#services" className="mobile-hide">services</a>
            <span className="sep mobile-hide">/</span>
            <a href="#testimonials">testimonials</a>
            <span className="sep">/</span>
            <a href="#contact">contact</a>
          </div>
        </div>
      </nav>

      <Hero />
      <Marquee />
      <WorkSection />
      <StatsSection />
      <TestimonialsSection />
      <ServicesSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </>
  );
}
