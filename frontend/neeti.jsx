import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────
const PACKS = [
  {
    id: "chanakya", name: "Chanakya Neeti", emoji: "🪔", author: "Kautilya", version: "2.1",
    tier: "Free", status: "installed", rating: 4.9, reviews: 1240,
    nodes: 432, edges: 1280, themes: 28,
    color: "#E8A020", borderColor: "rgba(232,160,32,0.35)",
    bgColor: "rgba(232,160,32,0.08)",
    desc: "432 structured sutras on statecraft, ethics, leadership, and human nature — with themes, concepts, and relational edges.",
    tags: ["Leadership","Ethics","Strategy","Philosophy"]
  },
  {
    id: "gita", name: "Bhagavad Gita", emoji: "🌺", author: "Vyasa", version: "1.4",
    tier: "Free", status: "installed", rating: 4.8, reviews: 987,
    nodes: 700, edges: 2100, themes: 34,
    color: "#5C8A6A", borderColor: "rgba(92,138,106,0.35)",
    bgColor: "rgba(92,138,106,0.08)",
    desc: "700 verses from 18 chapters, mapped to dharma, karma, detachment, and cosmic order with multi-tradition commentary.",
    tags: ["Dharma","Yoga","Metaphysics","Duty"]
  },
  {
    id: "arthashastra", name: "Arthashastra", emoji: "⚖️", author: "Kautilya", version: "1.0",
    tier: "Strategist", status: "available", rating: 4.6, reviews: 423,
    nodes: 6000, edges: 12000, themes: 62,
    color: "#9B8AE0", borderColor: "rgba(155,138,224,0.35)",
    bgColor: "rgba(155,138,224,0.08)",
    desc: "Kautilya's complete treatise on statecraft, economic policy, and military strategy — 15 books, 6,000 sutras on governance.",
    tags: ["Statecraft","Economics","Military","Governance"]
  },
  {
    id: "atomic", name: "Atomic Habits", emoji: "⚡", author: "James Clear", version: "1.2",
    tier: "Seeker", status: "available", rating: 4.7, reviews: 2100,
    nodes: 180, edges: 540, themes: 14,
    color: "#60A5FA", borderColor: "rgba(96,165,250,0.35)",
    bgColor: "rgba(96,165,250,0.08)",
    desc: "Frameworks, habit loops, identity-based change models, and behavior design principles from the bestselling book.",
    tags: ["Habits","Productivity","Behavior","Systems"]
  },
  {
    id: "stoic", name: "Stoic Meditations", emoji: "🏛️", author: "Marcus Aurelius", version: "1.0",
    tier: "Free", status: "available", rating: 4.9, reviews: 1560,
    nodes: 310, edges: 890, themes: 22,
    color: "#94A3B8", borderColor: "rgba(148,163,184,0.35)",
    bgColor: "rgba(148,163,184,0.08)",
    desc: "Marcus Aurelius's private reflections on virtue, reason, and the good life — structured as concepts and principles.",
    tags: ["Stoicism","Virtue","Resilience","Philosophy"]
  },
  {
    id: "sunzi", name: "The Art of War", emoji: "🎴", author: "Sun Tzu", version: "1.1",
    tier: "Free", status: "available", rating: 4.7, reviews: 1890,
    nodes: 260, edges: 720, themes: 18,
    color: "#F87171", borderColor: "rgba(248,113,113,0.35)",
    bgColor: "rgba(248,113,113,0.08)",
    desc: "Sun Tzu's 13 chapters on military strategy, competitive intelligence, and the psychology of conflict.",
    tags: ["Strategy","Conflict","Intelligence","Competition"]
  }
];

const SUTRAS = [
  { id: 1, pack: "chanakya", chapter: 3, sutra: 7, devanagari: "दुर्जनः परिहर्तव्यः विद्यालंकृतोऽपि सन्", translation: "A wicked person should be avoided even if adorned with learning and virtue.", themes: ["Ethics","Wisdom"], concepts: ["Discernment","Character"] },
  { id: 2, pack: "chanakya", chapter: 7, sutra: 4, devanagari: "मन्त्रिणां परिषत्कार्यम्…", translation: "The work of the council of ministers must be conducted in utmost secrecy.", themes: ["Leadership","Strategy"], concepts: ["Counsel","Secrecy"] },
  { id: 3, pack: "chanakya", chapter: 11, sutra: 2, devanagari: "यस्य मूलं दृढं तस्य शाखा विस्तृता भवति।", translation: "He whose foundation is firm — his branches spread wide in all directions.", themes: ["Leadership","Foundation"], concepts: ["Stability","Growth"] },
  { id: 4, pack: "chanakya", chapter: 5, sutra: 11, devanagari: "सत्यं ब्रूयात् प्रियं ब्रूयात्…", translation: "Speak truth; speak pleasantly. Do not speak unpleasant truths, nor pleasant falsehoods.", themes: ["Ethics","Communication"], concepts: ["Truth","Diplomacy"] },
  { id: 5, pack: "chanakya", chapter: 2, sutra: 18, devanagari: "अनालोच्य व्ययं कर्ता…", translation: "One who spends without deliberation invites ruin upon himself.", themes: ["Strategy","Economics"], concepts: ["Resource Management","Discipline"] },
  { id: 6, pack: "chanakya", chapter: 8, sutra: 3, devanagari: "विद्या मित्रं प्रवासेषु।", translation: "Knowledge is a friend in foreign lands; a wife is a companion at home.", themes: ["Wisdom","Learning"], concepts: ["Knowledge","Self-reliance"] },
  { id: 7, pack: "gita", chapter: 2, sutra: 47, devanagari: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।", translation: "You have a right to perform your duty, but never to the fruits thereof.", themes: ["Dharma","Action"], concepts: ["Detachment","Karma"] },
  { id: 8, pack: "gita", chapter: 3, sutra: 19, devanagari: "तस्मादसक्तः सततं कार्यं कर्म समाचर।", translation: "Therefore, without attachment, always do what must be done.", themes: ["Dharma","Duty"], concepts: ["Action","Detachment"] },
  { id: 9, pack: "gita", chapter: 6, sutra: 5, devanagari: "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।", translation: "Let a man lift himself by himself; let him not degrade himself.", themes: ["Self-mastery","Leadership"], concepts: ["Self-reliance","Upliftment"] },
];

const GRAPH_NODES = [
  { id: "leadership", label: "Leadership", type: "theme", pack: "cross", x: 380, y: 110, r: 26, count: 42 },
  { id: "counsel", label: "Counsel", type: "concept", pack: "chanakya", x: 210, y: 68, r: 18, count: 18 },
  { id: "power", label: "Power", type: "concept", pack: "chanakya", x: 190, y: 158, r: 18, count: 31 },
  { id: "enemies", label: "Enemies", type: "concept", pack: "chanakya", x: 545, y: 62, r: 18, count: 14 },
  { id: "virtue", label: "Virtue", type: "concept", pack: "chanakya", x: 560, y: 158, r: 18, count: 22 },
  { id: "wisdom", label: "Wisdom", type: "node", pack: "chanakya", x: 305, y: 180, r: 14, count: 19 },
  { id: "duty", label: "Duty", type: "node", pack: "chanakya", x: 450, y: 180, r: 14, count: 16 },
  { id: "dharma", label: "Dharma", type: "concept", pack: "gita", x: 648, y: 88, r: 20, count: 45 },
  { id: "detachment", label: "Detachment", type: "concept", pack: "gita", x: 122, y: 100, r: 20, count: 28 },
  { id: "strategy", label: "Strategy", type: "theme", pack: "cross", x: 380, y: 30, r: 18, count: 67 },
  { id: "ethics", label: "Ethics", type: "theme", pack: "cross", x: 305, y: 48, r: 16, count: 53 },
];

const GRAPH_EDGES = [
  ["leadership","counsel"],["leadership","power"],["leadership","enemies"],
  ["leadership","virtue"],["leadership","wisdom"],["leadership","duty"],
  ["leadership","dharma"],["leadership","detachment"],["leadership","strategy"],
  ["counsel","power"],["virtue","dharma"],["wisdom","detachment"],
  ["strategy","enemies"],["ethics","wisdom"],["ethics","virtue"],
];

const INSIGHTS = [
  { id: 1, type: "goal", icon: "🎯", label: "Recurring interest in leadership under uncertainty", source: "Derived from 8 conversations", confidence: 91, explicit: false },
  { id: 2, type: "preference", icon: "⚖️", label: "Prefers principle-based advice over tactical shortcuts", source: "Explicit · stated 3 sessions ago", confidence: 100, explicit: true },
  { id: 3, type: "pattern", icon: "🔍", label: "Building a decision framework for strategic risk", source: "Inferred from recent queries", confidence: 74, explicit: false },
  { id: 4, type: "interest", icon: "📚", label: "Deep interest in ancient Indian statecraft texts", source: "Pack installs + conversation history", confidence: 96, explicit: false },
  { id: 5, type: "style", icon: "💬", label: "Responds well to Socratic reasoning style", source: "Thumbs-up patterns across 12 responses", confidence: 83, explicit: false },
  { id: 6, type: "goal", icon: "🏗️", label: "Actively building a knowledge system for decision-making", source: "Explicit · current session", confidence: 100, explicit: true },
];

const ACTIVITIES = [
  { id: 1, dot: "#E8A020", text: "Asked Advisor: How should I handle a disloyal counselor?", detail: "Chanakya Neeti + Gita · 2 citations", time: "5 minutes ago" },
  { id: 2, dot: "#5C8A6A", text: "Explored Theme → Leadership → Counsel cluster", detail: "12 related nodes discovered", time: "2 hours ago" },
  { id: 3, dot: "#9B8AE0", text: "Installed pack: Bhagavad Gita", detail: "700 verses indexed in 28 seconds", time: "Yesterday, 3:12 PM" },
  { id: 4, dot: "#60A5FA", text: "Saved collection: On Strategic Patience", detail: "7 sutras from Ch. 3, 7, 11", time: "Yesterday, 11:40 AM" },
  { id: 5, dot: "#8B9AB0", text: "Started conversation: Principles of effective delegation", detail: "Chanakya Neeti · 6 exchanges", time: "2 days ago" },
];

const CONVERSATIONS = [
  { id: 1, title: "Handling a disloyal counselor", packs: ["chanakya","gita"], messages: 4, time: "5 min ago", excerpt: "A counselor's disloyalty is among the most dangerous threats…" },
  { id: 2, title: "Principles of effective delegation", packs: ["chanakya"], messages: 6, time: "2 days ago", excerpt: "Chanakya distinguishes between three kinds of advisors…" },
  { id: 3, title: "Detachment vs. commitment", packs: ["gita"], messages: 9, time: "4 days ago", excerpt: "The Gita does not advocate withdrawal — it advocates…" },
  { id: 4, title: "Strategic patience in hostile environments", packs: ["chanakya","gita"], messages: 12, time: "1 week ago", excerpt: "Both texts converge on a core principle: timing is itself…" },
];

const LLM_PROVIDERS = [
  { name: "ollama / llama3.1", role: "Primary · Local", ping: 142, status: "active" },
  { name: "OpenAI / gpt-4o", role: "Fallback · Cloud", ping: 310, status: "standby" },
  { name: "Anthropic / claude-3", role: "Reasoning · Cloud", ping: 890, status: "standby" },
  { name: "Gemini / pro-1.5", role: "Multimodal · Cloud", ping: 420, status: "off" },
];

const THEME_COLORS = {
  Leadership: { bg: "rgba(232,160,32,0.12)", text: "#F0C060" },
  Ethics: { bg: "rgba(92,138,106,0.12)", text: "#7EAF8A" },
  Strategy: { bg: "rgba(96,165,250,0.12)", text: "#93C5FD" },
  Wisdom: { bg: "rgba(155,138,224,0.12)", text: "#C4AEF0" },
  Dharma: { bg: "rgba(248,113,113,0.12)", text: "#FCA5A5" },
  Action: { bg: "rgba(52,211,153,0.12)", text: "#6EE7B7" },
  Foundation: { bg: "rgba(251,191,36,0.12)", text: "#FCD34D" },
  Communication: { bg: "rgba(167,139,250,0.12)", text: "#C4B5FD" },
  Economics: { bg: "rgba(249,115,22,0.12)", text: "#FDBA74" },
  Learning: { bg: "rgba(34,211,238,0.12)", text: "#67E8F9" },
  "Self-mastery": { bg: "rgba(244,63,94,0.12)", text: "#FDA4AF" },
  Duty: { bg: "rgba(16,185,129,0.12)", text: "#6EE7B7" },
};

const getThemeStyle = (t) => THEME_COLORS[t] || { bg: "rgba(139,154,176,0.12)", text: "#B8C5D6" };

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const G = {
  ink: "#0D1117", inkSoft: "#1A2332", inkMuted: "#2C3E50",
  parch: "#F2E8D9", parchDark: "#E8D8C0", parchDim: "#C8B89A",
  saffron: "#E8A020", saffronLt: "#F0C060",
  sage: "#5C8A6A", sageLt: "#7EAF8A",
  ash: "#8B9AB0", ashLt: "#B8C5D6",
  red: "#C0453A", surface: "#141C28", surface2: "#1E293B",
  border: "rgba(242,232,217,0.08)", borderWarm: "rgba(232,160,32,0.2)",
};

// ─────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────
const Icon = {
  Dashboard: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  Advisor: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Graph: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Packs: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Sutras: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Memory: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Settings: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Send: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Search: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  ChevronRight: () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>,
  Plus: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Check: () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  Info: () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Trash: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  Edit: () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Mic: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Bell: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Star: ({ filled }) => <svg width="11" height="11" fill={filled ? "#E8A020" : "none"} stroke="#E8A020" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Filter: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Zap: () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
};

// ─────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────
const ThemeChip = ({ label }) => {
  const s = getThemeStyle(label);
  return (
    <span style={{ display:"inline-flex", alignItems:"center", fontSize:10, padding:"2px 8px", borderRadius:20, background:s.bg, color:s.text, fontWeight:500, border:`1px solid ${s.bg}` }}>{label}</span>
  );
};

const Star = ({ filled }) => (
  <svg width="11" height="11" fill={filled ? "#E8A020" : "none"} stroke="#E8A020" strokeWidth="2" viewBox="0 0 24 24">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const Stars = ({ rating }) => (
  <span style={{ display:"inline-flex", gap:2 }}>
    {[1,2,3,4,5].map(i => <Star key={i} filled={i <= Math.round(rating)} />)}
  </span>
);


const Badge = ({ children, color = G.saffron }) => (
  <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:10, background:color, color:color === G.saffron ? G.ink : "#fff" }}>{children}</span>
);

const Card = ({ children, style = {}, className = "" }) => (
  <div style={{ background:G.surface2, border:`1px solid ${G.border}`, borderRadius:12, padding:20, position:"relative", overflow:"hidden", ...style }}>
    {children}
  </div>
);

const SectionHeader = ({ title, link, onLink }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:600, color:G.parch }}>{title}</span>
    {link && <span style={{ fontSize:12, color:G.saffron, cursor:"pointer" }} onClick={onLink}>{link} →</span>}
  </div>
);

const Eyebrow = ({ children }) => (
  <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:G.saffron, marginBottom:4 }}>{children}</div>
);

const PackOrb = ({ pack, size = 28 }) => (
  <div style={{ width:size, height:size, borderRadius:size*0.28, background:pack?.bgColor||"rgba(139,154,176,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.48, flexShrink:0 }}>
    {pack?.emoji}
  </div>
);

const Dot = ({ color, pulse = false }) => (
  <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:color, animation: pulse ? "pulse 2s ease-in-out infinite" : "none" }}/>
);

// ─────────────────────────────────────────────
// PAGE: DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ navigate, installedPacks }) {
  const installed = PACKS.filter(p => installedPacks.includes(p.id));
  const today = SUTRAS.slice(0, 2);

  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28 }}>
        <div>
          <Eyebrow>Dashboard</Eyebrow>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:600, color:G.parch, lineHeight:1.2 }}>
            Knowledge <em style={{ fontStyle:"italic", color:G.saffronLt }}>Intelligence</em> Workspace
          </h1>
          <p style={{ fontSize:13, color:G.ash, marginTop:4 }}>{installed.length} packs active · {installed.reduce((a,p)=>a+p.nodes,0).toLocaleString()} nodes indexed · 47 conversations</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => navigate("packs")} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", background:G.surface2, color:G.parch, border:`1px solid ${G.border}`, borderRadius:8, fontSize:13, fontWeight:500, cursor:"pointer" }}>
            <Icon.Plus /> Browse Packs
          </button>
          <button onClick={() => navigate("advisor")} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:G.saffron, color:G.ink, border:"none", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer" }}>
            <Icon.Advisor /> New Conversation
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"Conversations This Week", value:"24", sub:"↑ 8 from last week", color:G.saffronLt },
          { label:"Knowledge Nodes Explored", value:"312", sub:"across 2 packs  ↑ 12%" },
          { label:"Memory Insights", value:"19", sub:"goals, patterns & preferences", color:G.sageLt },
        ].map((s,i) => (
          <Card key={i} style={{ padding:"18px 20px", background: i===0 ? "linear-gradient(135deg,rgba(232,160,32,0.1),#1E293B)" : i===2 ? "linear-gradient(135deg,rgba(92,138,106,0.09),#1E293B)" : G.surface2 }}>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:G.ash, marginBottom:10 }}>{s.label}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:700, color:s.color||G.parch, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:12, color:G.ash, marginTop:4 }}>{s.sub}</div>
            <div style={{ position:"absolute", right:10, bottom:5, fontFamily:"'Noto Serif Devanagari',serif", fontSize:70, color:"rgba(232,160,32,0.04)", pointerEvents:"none", userSelect:"none" }}>नी</div>
          </Card>
        ))}
      </div>

      {/* Main 2-col */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20, marginBottom:24 }}>
        {/* Recent conversations */}
        <div>
          <SectionHeader title="Recent Conversations" link="Open Advisor" onLink={() => navigate("advisor")} />
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {CONVERSATIONS.map(c => {
              const packs = c.packs.map(id => PACKS.find(p=>p.id===id)).filter(Boolean);
              return (
                <div key={c.id} onClick={() => navigate("advisor")} style={{ background:G.surface2, border:`1px solid ${G.border}`, borderRadius:10, padding:"14px 16px", cursor:"pointer", transition:"all 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(232,160,32,0.3)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=G.border}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:14, color:G.parch, fontWeight:600 }}>{c.title}</span>
                    <span style={{ fontSize:11, color:G.ash, whiteSpace:"nowrap", marginLeft:12 }}>{c.time}</span>
                  </div>
                  <p style={{ fontSize:12, color:G.ash, lineHeight:1.5, marginBottom:8 }}>{c.excerpt}</p>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {packs.map(p => (
                      <span key={p.id} style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10, color:G.ash, background:p.bgColor, border:`1px solid ${p.borderColor}`, padding:"2px 8px", borderRadius:20 }}>
                        {p.emoji} {p.name.split(" ")[0]}
                      </span>
                    ))}
                    <span style={{ fontSize:11, color:G.ash, marginLeft:"auto" }}>{c.messages} exchanges</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Installed packs */}
          <Card style={{ padding:16 }}>
            <SectionHeader title="Installed Packs" link="Manage" onLink={() => navigate("packs")} />
            {installed.map(p => (
              <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${G.border}` }}>
                <PackOrb pack={p} size={32} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:G.parch, fontWeight:500 }}>{p.name}</div>
                  <div style={{ fontSize:11, color:G.ash }}>{p.nodes.toLocaleString()} nodes</div>
                </div>
                <div style={{ width:60 }}>
                  <div style={{ height:3, background:G.border, borderRadius:2 }}>
                    <div style={{ height:"100%", borderRadius:2, background:p.color, width:`${Math.min(100,(p.nodes/700)*100)}%` }}/>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ paddingTop:8, borderBottom:"none" }}>
              <button onClick={() => navigate("packs")} style={{ width:"100%", padding:"8px", background:"none", border:`1px dashed ${G.border}`, borderRadius:8, color:G.ash, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <Icon.Plus /> Add knowledge pack
              </button>
            </div>
          </Card>

          {/* Top insights */}
          <Card style={{ padding:16 }}>
            <SectionHeader title="Top Insights" link="View All" onLink={() => navigate("memory")} />
            {INSIGHTS.slice(0,3).map(ins => (
              <div key={ins.id} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"8px 0", borderBottom:`1px solid ${G.border}` }}>
                <span style={{ fontSize:16 }}>{ins.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:G.parch, lineHeight:1.4 }}>{ins.label}</div>
                  <div style={{ fontSize:10, color:G.ash, marginTop:2 }}>{ins.source}</div>
                </div>
                <span style={{ fontSize:10, color:ins.confidence===100 ? G.sageLt : G.ash, background:"rgba(255,255,255,0.04)", padding:"1px 6px", borderRadius:4, whiteSpace:"nowrap" }}>
                  {ins.confidence===100 ? "Explicit" : `${ins.confidence}%`}
                </span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Today's Sutras */}
      <SectionHeader title="Today's Sutras" link="Browse All" onLink={() => navigate("sutras")} />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>
        {today.map(s => {
          const pack = PACKS.find(p=>p.id===s.pack);
          return (
            <div key={s.id} style={{ background:G.surface2, border:`1px solid ${G.border}`, borderRadius:10, padding:"16px", cursor:"pointer", transition:"border-color 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=pack?.color||G.border}
              onMouseLeave={e=>e.currentTarget.style.borderColor=G.border}>
              <div style={{ fontFamily:"'Noto Serif Devanagari',serif", fontSize:16, color:G.saffronLt, lineHeight:1.7, marginBottom:8 }}>{s.devanagari}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:13, color:G.parch, lineHeight:1.6, marginBottom:10 }}>"{s.translation}"</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <span style={{ fontSize:10, color:G.ash }}>{pack?.name} · Ch. {s.chapter}, S. {s.sutra}</span>
                {s.themes.map(t => <ThemeChip key={t} label={t} />)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity */}
      <SectionHeader title="Recent Activity" />
      <Card style={{ padding:"4px 16px" }}>
        {ACTIVITIES.map(a => (
          <div key={a.id} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 0", borderBottom:`1px solid ${G.border}` }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:a.dot, marginTop:5, flexShrink:0, display:"block" }}/>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, color:G.parch, lineHeight:1.4 }}>{a.text}</div>
              <div style={{ fontSize:11, color:G.ash, marginTop:2 }}>{a.detail}</div>
            </div>
            <span style={{ fontSize:11, color:G.ash, whiteSpace:"nowrap", marginLeft:8 }}>{a.time}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE: ADVISOR
// ─────────────────────────────────────────────
function Advisor({ installedPacks }) {
  const [messages, setMessages] = useState([
    { role:"ai", content:"Namaste. I am your NEETI Advisor, drawing from your installed knowledge packs. Ask me anything — about leadership, ethics, strategy, or decision-making. I will reason across your knowledge and show you exactly where each answer comes from.", citations:[], reasoning:[] }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReasoning, setShowReasoning] = useState({});
  const [activeConv, setActiveConv] = useState(0);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const installed = PACKS.filter(p => installedPacks.includes(p.id));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages]);

  const buildSystemPrompt = () => {
    const packContext = installed.map(p => {
      const sutras = SUTRAS.filter(s=>s.pack===p.id).slice(0,5);
      return `\n## ${p.name} (${p.nodes} nodes, ${p.themes} themes)\n${sutras.map(s=>`- [${p.name} Ch.${s.chapter}·S${s.sutra}]: "${s.translation}" | Themes: ${s.themes.join(", ")}`).join("\n")}`;
    }).join("\n");

    return `You are NEETI Advisor — an AI reasoning engine that draws wisdom from structured knowledge packs of ancient Indian and world philosophy. You reason across multiple corpora with explainability.

INSTALLED KNOWLEDGE PACKS:${packContext}

CORE BEHAVIOR:
1. Always ground your advice in the installed packs above
2. Cite specific sources as [PackName Ch.X·SY] inline in your response  
3. End EVERY response with a JSON block: {"citations":["PackName Ch.X·SY - brief description"],"reasoning":["step1","step2","step3"]}
4. Be direct, wise, and cite at least 2 sources per answer
5. Blend insights across packs when relevant
6. Keep responses focused and under 180 words
7. Use a tone that is authoritative but accessible

The user is building a personal knowledge intelligence system and values principle-based, explainable advice.`;
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role:"user", content:text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content
      }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:1000,
          system: buildSystemPrompt(),
          messages: history
        })
      });

      const data = await res.json();
      const raw = data.content?.[0]?.text || "I could not reach my knowledge base at this moment.";

      // Parse JSON block
      let citations = [], reasoning = [], cleanContent = raw;
      const jsonMatch = raw.match(/```json\s*([\s\S]*?)```|(\{[\s\S]*"citations"[\s\S]*\})\s*$/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1] || jsonMatch[2]);
          citations = parsed.citations || [];
          reasoning = parsed.reasoning || [];
          cleanContent = raw.replace(/```json[\s\S]*?```|\{[\s\S]*"citations"[\s\S]*\}\s*$/, "").trim();
        } catch(e) {}
      }

      setMessages(prev => [...prev, { role:"ai", content:cleanContent, citations, reasoning }]);
    } catch(err) {
      setMessages(prev => [...prev, {
        role:"ai",
        content:"The knowledge network is momentarily unavailable. Please try again.",
        citations:[], reasoning:[]
      }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleReasoning = (idx) => setShowReasoning(prev => ({ ...prev, [idx]: !prev[idx] }));

  return (
    <div style={{ display:"grid", gridTemplateColumns:"240px 1fr", gap:0, height:"calc(100vh - 56px)", overflow:"hidden" }}>
      {/* Conversation list */}
      <div style={{ borderRight:`1px solid ${G.border}`, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"16px 14px 10px", borderBottom:`1px solid ${G.border}` }}>
          <button onClick={() => { setMessages([{ role:"ai", content:"Namaste. Starting a new conversation. What would you like to explore?", citations:[], reasoning:[] }]); setActiveConv(-1); }}
            style={{ width:"100%", padding:"8px 12px", background:G.saffron, color:G.ink, border:"none", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <Icon.Plus /> New Conversation
          </button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"8px 8px" }}>
          {CONVERSATIONS.map((c,i) => {
            const packs = c.packs.map(id => PACKS.find(p=>p.id===id)).filter(Boolean);
            return (
              <div key={c.id} onClick={() => setActiveConv(i)}
                style={{ padding:"10px 10px", borderRadius:8, cursor:"pointer", marginBottom:4, background:activeConv===i ? "rgba(232,160,32,0.08)" : "transparent", border:`1px solid ${activeConv===i ? G.borderWarm : "transparent"}`, transition:"all 0.15s" }}>
                <div style={{ fontSize:12, fontWeight:500, color:G.parch, marginBottom:3, lineHeight:1.3 }}>{c.title}</div>
                <div style={{ fontSize:10, color:G.ash, marginBottom:4 }}>{c.time}</div>
                <div style={{ display:"flex", gap:4 }}>
                  {packs.map(p => <span key={p.id} style={{ fontSize:13 }}>{p.emoji}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat panel */}
      <div style={{ display:"flex", flexDirection:"column", overflow:"hidden", height:"100%" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px", borderBottom:`1px solid ${G.border}`, background:"linear-gradient(135deg,rgba(232,160,32,0.05),transparent)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:"50%", background:"linear-gradient(135deg,#E8A020,#C87020)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Noto Serif Devanagari',serif", fontSize:15, color:G.ink, fontWeight:700 }}>ने</div>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:G.parch }}>NEETI Advisor</div>
              <div style={{ fontSize:11, color:G.ash, display:"flex", alignItems:"center", gap:5 }}>
                <Dot color={G.sageLt} pulse /> {installed.map(p=>p.name).join(" + ")}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {installed.map(p => <PackOrb key={p.id} pack={p} size={26} />)}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px", display:"flex", flexDirection:"column", gap:16 }}>
          {messages.map((m,i) => (
            <div key={i} style={{ display:"flex", gap:10, flexDirection: m.role==="user" ? "row-reverse" : "row" }}>
              <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:600,
                background: m.role==="ai" ? "linear-gradient(135deg,#E8A020,#C87020)" : "linear-gradient(135deg,#5C8A6A,#3D6B4A)",
                color: m.role==="ai" ? G.ink : G.parch,
                fontFamily: m.role==="ai" ? "'Noto Serif Devanagari',serif" : "inherit"
              }}>{m.role==="ai" ? "ने" : "N"}</div>
              <div style={{ flex:1, maxWidth:"85%", display:"flex", flexDirection:"column", alignItems: m.role==="user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  padding:"11px 15px", borderRadius: m.role==="ai" ? "4px 12px 12px 12px" : "12px 4px 12px 12px",
                  background: m.role==="ai" ? G.inkSoft : "linear-gradient(135deg,rgba(232,160,32,0.15),rgba(232,160,32,0.07))",
                  border:`1px solid ${m.role==="ai" ? G.border : G.borderWarm}`,
                  fontSize:13, lineHeight:1.7, color:G.parch, whiteSpace:"pre-wrap"
                }}>{m.content}</div>

                {m.citations?.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:7 }}>
                    {m.citations.map((c,ci) => (
                      <div key={ci} style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 9px", background:"rgba(232,160,32,0.1)", border:"1px solid rgba(232,160,32,0.22)", borderRadius:20, fontSize:10, color:G.saffronLt, cursor:"default" }}>
                        📖 {c.split(" - ")[0]}
                      </div>
                    ))}
                  </div>
                )}

                {m.reasoning?.length > 0 && (
                  <div>
                    <div onClick={() => toggleReasoning(i)} style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:showReasoning[i] ? G.saffron : G.ash, cursor:"pointer", marginTop:6 }}>
                      <Icon.Info /> {showReasoning[i] ? "Hide" : "Show"} reasoning path
                    </div>
                    {showReasoning[i] && (
                      <div style={{ marginTop:6, background:"rgba(232,160,32,0.05)", border:"1px solid rgba(232,160,32,0.14)", borderRadius:8, padding:"10px 12px" }}>
                        {m.reasoning.map((step, si) => (
                          <div key={si} style={{ display:"flex", gap:8, padding:"3px 0", fontSize:11, color:G.ashLt }}>
                            <span style={{ width:16, height:16, borderRadius:"50%", background:"rgba(232,160,32,0.18)", color:G.saffronLt, fontSize:9, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>{si+1}</span>
                            {step}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display:"flex", gap:10 }}>
              <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#E8A020,#C87020)", fontFamily:"'Noto Serif Devanagari',serif", fontSize:12, color:G.ink }}>ने</div>
              <div style={{ padding:"11px 15px", borderRadius:"4px 12px 12px 12px", background:G.inkSoft, border:`1px solid ${G.border}` }}>
                <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width:6, height:6, borderRadius:"50%", background:G.saffron, display:"block", animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{ padding:"12px 18px", borderTop:`1px solid ${G.border}` }}>
          <div style={{ display:"flex", alignItems:"flex-end", gap:8, background:G.ink, border:`1px solid ${G.border}`, borderRadius:10, padding:"10px 12px" }}
            onFocus={e => e.currentTarget.style.borderColor = G.borderWarm}
            onBlur={e => e.currentTarget.style.borderColor = G.border}>
            <textarea ref={textareaRef} value={input} onChange={e=>{ setInput(e.target.value); e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,100)+"px"; }}
              onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendMessage(); }}}
              placeholder="Ask across your knowledge packs…"
              rows={1} style={{ flex:1, background:"none", border:"none", outline:"none", fontFamily:"Inter,sans-serif", fontSize:13, color:G.parch, resize:"none", maxHeight:100, lineHeight:1.5 }}/>
            <button onClick={sendMessage} disabled={loading} style={{ width:32, height:32, borderRadius:8, background: loading ? G.ash : G.saffron, border:"none", cursor:loading?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:G.ink }}>
              <Icon.Send />
            </button>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:7 }}>
            <span style={{ fontSize:10, color:G.ash }}>Active:</span>
            {installed.map(p => <span key={p.id} style={{ fontSize:10, color:G.ash, background:p.bgColor, border:`1px solid ${p.borderColor}`, padding:"2px 7px", borderRadius:4 }}>{p.emoji} {p.name.split(" ")[0]}</span>)}
            <span style={{ fontSize:10, color:G.ash, marginLeft:"auto" }}>⏎ Send · Shift+⏎ Newline</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE: GRAPH EXPLORER
// ─────────────────────────────────────────────
function GraphExplorer({ installedPacks }) {
  const [selected, setSelected] = useState("leadership");
  const [hovered, setHovered] = useState(null);
  const [filter, setFilter] = useState("all");

  const installed = PACKS.filter(p => installedPacks.includes(p.id));
  const packColors = { chanakya: G.saffron, gita: G.sage, cross: "#B8C5D6", arthashastra: "#9B8AE0" };

  const visibleNodes = GRAPH_NODES.filter(n => filter==="all" || n.pack===filter || n.pack==="cross");
  const visibleEdges = GRAPH_EDGES.filter(([a,b]) => visibleNodes.find(n=>n.id===a) && visibleNodes.find(n=>n.id===b));

  const selectedNode = GRAPH_NODES.find(n=>n.id===selected);
  const connectedIds = GRAPH_EDGES.filter(([a,b])=>a===selected||b===selected).flatMap(([a,b])=>[a,b]).filter(id=>id!==selected);
  const connectedNodes = GRAPH_NODES.filter(n=>connectedIds.includes(n.id));
  const relatedSutras = SUTRAS.filter(s => selectedNode && (s.themes.some(t=>t.toLowerCase()===selectedNode.label.toLowerCase()) || connectedNodes.some(n=>s.themes.some(t=>t.toLowerCase()===n.label.toLowerCase())))).slice(0,3);

  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
        <div>
          <Eyebrow>Knowledge Graph</Eyebrow>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:600, color:G.parch }}>Graph Explorer</h1>
          <p style={{ fontSize:13, color:G.ash, marginTop:4 }}>{GRAPH_NODES.length} nodes · {GRAPH_EDGES.length} edges · {installed.length} packs</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {["all",...installed.map(p=>p.id)].map(f => (
            <button key={f} onClick={()=>setFilter(f)} style={{ padding:"7px 14px", borderRadius:8, fontSize:12, cursor:"pointer", fontWeight:500,
              background: filter===f ? G.saffron : G.surface2, color: filter===f ? G.ink : G.ash,
              border: filter===f ? "none" : `1px solid ${G.border}` }}>
              {f==="all" ? "All Packs" : PACKS.find(p=>p.id===f)?.emoji+" "+PACKS.find(p=>p.id===f)?.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20 }}>
        {/* Graph */}
        <Card style={{ padding:0, height:440, overflow:"hidden" }}>
          <svg width="100%" height="100%" viewBox="0 0 760 440" style={{ display:"block" }}>
            <defs>
              <pattern id="g2" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(242,232,217,0.04)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#g2)"/>

            {/* Edges */}
            {visibleEdges.map(([a,b],i) => {
              const na = GRAPH_NODES.find(n=>n.id===a), nb = GRAPH_NODES.find(n=>n.id===b);
              if(!na||!nb) return null;
              const isActive = a===selected||b===selected;
              return (
                <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  stroke={isActive ? "rgba(232,160,32,0.5)" : "rgba(232,160,32,0.12)"}
                  strokeWidth={isActive ? 1.8 : 1} strokeDasharray={na.pack==="cross"||nb.pack==="cross" ? undefined : "4,5"} />
              );
            })}

            {/* Nodes */}
            {visibleNodes.map(n => {
              const isSelected = n.id===selected;
              const isConnected = connectedIds.includes(n.id);
              const isHovered = hovered===n.id;
              const color = packColors[n.pack]||G.ash;
              const dim = !isSelected && !isConnected && !isHovered;
              return (
                <g key={n.id} onClick={()=>setSelected(n.id)} onMouseEnter={()=>setHovered(n.id)} onMouseLeave={()=>setHovered(null)} style={{ cursor:"pointer" }}>
                  {isSelected && <circle cx={n.x} cy={n.y} r={n.r+14} fill="none" stroke={color} strokeWidth="1" strokeDasharray="4 4" opacity="0.5">
                    <animateTransform attributeName="transform" type="rotate" from={`0 ${n.x} ${n.y}`} to={`360 ${n.x} ${n.y}`} dur="15s" repeatCount="indefinite"/>
                  </circle>}
                  {isSelected && <circle cx={n.x} cy={n.y} r={n.r+6} fill={color} opacity="0.1"/>}
                  <circle cx={n.x} cy={n.y} r={n.r} fill={G.inkSoft} stroke={color} strokeWidth={isSelected?2.5:1.5} opacity={dim?0.35:1}/>
                  <text x={n.x} y={n.y-2} textAnchor="middle" fill={isSelected?color:G.parch} fontSize={n.r>18?9:8} fontFamily="Inter,sans-serif" fontWeight={isSelected?"600":"400"} opacity={dim?0.4:1}>{n.label}</text>
                  <text x={n.x} y={n.y+10} textAnchor="middle" fill={G.ash} fontSize={7} fontFamily="Inter,sans-serif" opacity={dim?0.3:0.8}>{n.count}</text>
                </g>
              );
            })}

            {/* Legend */}
            <rect x="14" y="14" width="105" height="60" rx="5" fill="rgba(26,35,50,0.9)" stroke={G.border} strokeWidth="1"/>
            {[["cross","All Packs"],["chanakya","Chanakya"],["gita","Gita"]].map(([id,lbl],i)=>(
              <g key={id}>
                <circle cx={26} cy={30+i*16} r={5} fill="none" stroke={packColors[id]} strokeWidth="1.5"/>
                <text x={36} y={34+i*16} fill={G.ash} fontSize={9} fontFamily="Inter,sans-serif">{lbl}</text>
              </g>
            ))}
          </svg>
        </Card>

        {/* Node detail */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {selectedNode && (
            <>
              <Card style={{ padding:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${packColors[selectedNode.pack]}22`, display:"flex", alignItems:"center", justifyContent:"center", border:`1px solid ${packColors[selectedNode.pack]}55` }}>
                    <span style={{ fontSize:18 }}>{selectedNode.pack==="gita"?"🌺":selectedNode.pack==="chanakya"?"🪔":"✦"}</span>
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontFamily:"'Playfair Display',serif", fontWeight:600, color:G.parch }}>{selectedNode.label}</div>
                    <div style={{ fontSize:11, color:G.ash, textTransform:"capitalize" }}>{selectedNode.type} · {selectedNode.count} nodes</div>
                  </div>
                </div>
                <div style={{ fontSize:12, color:G.ash, marginBottom:10 }}>Connected to {connectedNodes.length} nodes:</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {connectedNodes.map(n => (
                    <span key={n.id} onClick={()=>setSelected(n.id)} style={{ fontSize:11, padding:"3px 9px", borderRadius:6, background:`${packColors[n.pack]}18`, color:G.parchDim, cursor:"pointer", border:`1px solid ${packColors[n.pack]}33` }}>
                      {n.label}
                    </span>
                  ))}
                </div>
              </Card>

              <Card style={{ padding:16 }}>
                <div style={{ fontSize:13, fontWeight:500, color:G.parch, marginBottom:12 }}>Related Sutras</div>
                {relatedSutras.length ? relatedSutras.map(s => {
                  const pack = PACKS.find(p=>p.id===s.pack);
                  return (
                    <div key={s.id} style={{ padding:"10px 0", borderBottom:`1px solid ${G.border}` }}>
                      <div style={{ fontFamily:"'Noto Serif Devanagari',serif", fontSize:12, color:G.saffronLt, marginBottom:4 }}>{s.devanagari.split(" ").slice(0,5).join(" ")}…</div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:11, color:G.parch, lineHeight:1.5, marginBottom:6 }}>"{s.translation}"</div>
                      <div style={{ fontSize:10, color:G.ash }}>{pack?.name} · Ch.{s.chapter}·S{s.sutra}</div>
                    </div>
                  );
                }) : <div style={{ fontSize:12, color:G.ash }}>No direct sutra matches. Explore connected nodes for references.</div>}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE: KNOWLEDGE PACKS
// ─────────────────────────────────────────────
function PacksPage({ installedPacks, setInstalledPacks }) {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = PACKS.filter(p => {
    const matchTab = tab==="all" || (tab==="installed" && installedPacks.includes(p.id)) || (tab==="available" && !installedPacks.includes(p.id));
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t=>t.toLowerCase().includes(search.toLowerCase()));
    return matchTab && matchSearch;
  });

  const toggleInstall = (id) => {
    setInstalledPacks(prev => prev.includes(id) ? prev.filter(p=>p!==id) : [...prev, id]);
  };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <Eyebrow>Knowledge Packs</Eyebrow>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:600, color:G.parch }}>Pack Library</h1>
        <p style={{ fontSize:13, color:G.ash, marginTop:4 }}>{installedPacks.length} installed · {PACKS.length} available · Platform v2.0</p>
      </div>

      <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center" }}>
        <div style={{ display:"flex", gap:0, background:G.surface2, borderRadius:8, border:`1px solid ${G.border}`, overflow:"hidden" }}>
          {["all","installed","available"].map(t => (
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"8px 16px", fontSize:12, fontWeight:500, cursor:"pointer", border:"none", background: tab===t ? G.saffron : "transparent", color: tab===t ? G.ink : G.ash, textTransform:"capitalize" }}>
              {t} {t==="installed" ? `(${installedPacks.length})` : t==="available" ? `(${PACKS.filter(p=>!installedPacks.includes(p.id)).length})` : `(${PACKS.length})`}
            </button>
          ))}
        </div>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:G.surface2, border:`1px solid ${G.border}`, borderRadius:8, padding:"8px 14px" }}>
          <Icon.Search />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search packs, tags…" style={{ flex:1, background:"none", border:"none", outline:"none", fontSize:13, color:G.parch, fontFamily:"Inter,sans-serif" }}/>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
        {filtered.map(p => {
          const isInstalled = installedPacks.includes(p.id);
          return (
            <div key={p.id} style={{ background:G.surface2, border:`1px solid ${isInstalled ? p.borderColor : G.border}`, borderRadius:12, padding:18, display:"flex", flexDirection:"column", gap:0, transition:"all 0.2s", cursor:"default" }}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="none"}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
                <PackOrb pack={p} size={44} />
                <button onClick={()=>toggleInstall(p.id)} style={{ padding:"5px 12px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer", border:"none",
                  background: isInstalled ? "rgba(92,138,106,0.15)" : p.color,
                  color: isInstalled ? G.sageLt : G.ink,
                  border: isInstalled ? `1px solid rgba(92,138,106,0.3)` : "none"
                }}>
                  {isInstalled ? "✓ Installed" : "+ Install"}
                </button>
              </div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:600, color:G.parch, marginBottom:2 }}>{p.name}</div>
              <div style={{ fontSize:11, color:G.ash, marginBottom:10 }}>by {p.author}</div>
              <p style={{ fontSize:12, color:G.ashLt, lineHeight:1.6, flex:1, marginBottom:12 }}>{p.desc}</p>
              <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
                {p.tags.slice(0,3).map(t => (
                  <span key={t} style={{ fontSize:10, padding:"2px 7px", borderRadius:4, background:p.bgColor, color:G.ashLt, border:`1px solid ${p.borderColor}` }}>{t}</span>
                ))}
              </div>
              <div style={{ display:"flex", gap:12, paddingTop:10, borderTop:`1px solid ${G.border}`, justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", gap:10 }}>
                  <span style={{ fontSize:11, color:G.ash }}><span style={{ color:G.parch, fontWeight:500 }}>{p.nodes >= 1000 ? (p.nodes/1000).toFixed(0)+"k" : p.nodes}</span> nodes</span>
                  <span style={{ fontSize:11, color:G.ash }}><span style={{ color:G.parch, fontWeight:500 }}>{p.themes}</span> themes</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <Stars rating={p.rating} />
                  <span style={{ fontSize:10, color:G.ash }}>{p.rating}</span>
                </div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, alignItems:"center" }}>
                <span style={{ fontSize:10, color:G.ash }}>v{p.version}</span>
                <span style={{ fontSize:10, padding:"2px 7px", borderRadius:4, background: p.tier==="Free" ? "rgba(92,138,106,0.12)" : "rgba(232,160,32,0.1)", color: p.tier==="Free" ? G.sageLt : G.saffronLt }}>{p.tier}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE: SUTRA BROWSER
// ─────────────────────────────────────────────
function SutrasBrowser({ installedPacks }) {
  const [search, setSearch] = useState("");
  const [filterPack, setFilterPack] = useState("all");
  const [filterTheme, setFilterTheme] = useState("all");
  const [selected, setSelected] = useState(null);

  const installed = PACKS.filter(p => installedPacks.includes(p.id));
  const allThemes = [...new Set(SUTRAS.flatMap(s=>s.themes))];

  const filtered = SUTRAS.filter(s => {
    const pack = PACKS.find(p=>p.id===s.pack);
    if(!installedPacks.includes(s.pack)) return false;
    if(filterPack!=="all" && s.pack!==filterPack) return false;
    if(filterTheme!=="all" && !s.themes.includes(filterTheme)) return false;
    if(search && !s.translation.toLowerCase().includes(search.toLowerCase()) && !s.devanagari.includes(search)) return false;
    return true;
  });

  const selectedSutra = selected ? SUTRAS.find(s=>s.id===selected) : null;
  const selectedPack = selectedSutra ? PACKS.find(p=>p.id===selectedSutra.pack) : null;

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <Eyebrow>Knowledge Browser</Eyebrow>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:600, color:G.parch }}>Sutra Browser</h1>
        <p style={{ fontSize:13, color:G.ash, marginTop:4 }}>{filtered.length} of {SUTRAS.filter(s=>installedPacks.includes(s.pack)).length} sutras from your packs</p>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:G.surface2, border:`1px solid ${G.border}`, borderRadius:8, padding:"8px 12px", flex:1, minWidth:200 }}>
          <Icon.Search />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by text, concept…" style={{ flex:1, background:"none", border:"none", outline:"none", fontSize:13, color:G.parch, fontFamily:"Inter,sans-serif" }}/>
        </div>
        <select value={filterPack} onChange={e=>setFilterPack(e.target.value)} style={{ padding:"8px 12px", background:G.surface2, border:`1px solid ${G.border}`, borderRadius:8, fontSize:12, color:G.parch, cursor:"pointer" }}>
          <option value="all">All Packs</option>
          {installed.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
        </select>
        <select value={filterTheme} onChange={e=>setFilterTheme(e.target.value)} style={{ padding:"8px 12px", background:G.surface2, border:`1px solid ${G.border}`, borderRadius:8, fontSize:12, color:G.parch, cursor:"pointer" }}>
          <option value="all">All Themes</option>
          {allThemes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:selected ? "1fr 340px" : "1fr", gap:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(s => {
            const pack = PACKS.find(p=>p.id===s.pack);
            return (
              <div key={s.id} onClick={()=>setSelected(s.id===selected?null:s.id)}
                style={{ background:G.surface2, border:`1px solid ${s.id===selected ? pack?.borderColor||G.border : G.border}`, borderRadius:10, padding:"16px", cursor:"pointer", transition:"all 0.15s" }}
                onMouseEnter={e=>{ if(s.id!==selected) e.currentTarget.style.borderColor=pack?.borderColor||G.border; }}
                onMouseLeave={e=>{ if(s.id!==selected) e.currentTarget.style.borderColor=G.border; }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ fontFamily:"'Noto Serif Devanagari',serif", fontSize:15, color:G.saffronLt, lineHeight:1.7, flex:1 }}>{s.devanagari}</div>
                  <span style={{ fontSize:10, color:G.ash, background:pack?.bgColor, border:`1px solid ${pack?.borderColor}`, padding:"2px 8px", borderRadius:20, marginLeft:12, whiteSpace:"nowrap" }}>
                    {pack?.emoji} Ch.{s.chapter}·S{s.sutra}
                  </span>
                </div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:13, color:G.parch, lineHeight:1.6, marginBottom:10 }}>"{s.translation}"</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {s.themes.map(t => <ThemeChip key={t} label={t} />)}
                  {s.concepts.map(c => <span key={c} style={{ fontSize:10, padding:"2px 7px", borderRadius:4, background:"rgba(139,154,176,0.12)", color:G.ash }}>{c}</span>)}
                </div>
              </div>
            );
          })}
          {filtered.length===0 && (
            <div style={{ textAlign:"center", padding:"60px 20px", color:G.ash }}>
              <div style={{ fontFamily:"'Noto Serif Devanagari',serif", fontSize:40, marginBottom:12, color:"rgba(232,160,32,0.2)" }}>शून्य</div>
              <div style={{ fontSize:14 }}>No sutras match your filters.</div>
              <div style={{ fontSize:12, marginTop:4 }}>Try adjusting your search or clearing filters.</div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && selectedSutra && (
          <div style={{ position:"sticky", top:20, height:"fit-content", display:"flex", flexDirection:"column", gap:14 }}>
            <Card style={{ padding:20, background:`linear-gradient(135deg,${selectedPack?.bgColor},${G.surface2})`, borderColor:selectedPack?.borderColor }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <PackOrb pack={selectedPack} size={32} />
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:G.parch }}>{selectedPack?.name}</div>
                  <div style={{ fontSize:11, color:G.ash }}>Chapter {selectedSutra.chapter} · Sutra {selectedSutra.sutra}</div>
                </div>
                <button onClick={()=>setSelected(null)} style={{ marginLeft:"auto", background:"none", border:"none", color:G.ash, cursor:"pointer", fontSize:18, lineHeight:1 }}>×</button>
              </div>
              <div style={{ fontFamily:"'Noto Serif Devanagari',serif", fontSize:18, color:G.saffronLt, lineHeight:1.8, marginBottom:12 }}>{selectedSutra.devanagari}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", fontSize:15, color:G.parch, lineHeight:1.7, marginBottom:14 }}>"{selectedSutra.translation}"</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
                {selectedSutra.themes.map(t => <ThemeChip key={t} label={t} />)}
              </div>
              <div style={{ fontSize:12, color:G.ash }}>
                <div style={{ marginBottom:6, fontWeight:500, color:G.parch }}>Key concepts</div>
                {selectedSutra.concepts.map(c => <div key={c} style={{ padding:"3px 0", borderBottom:`1px solid ${G.border}` }}>→ {c}</div>)}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE: MEMORY & INSIGHTS
// ─────────────────────────────────────────────
function MemoryPage() {
  const [insights, setInsights] = useState(INSIGHTS);
  const [editing, setEditing] = useState(null);

  const deleteInsight = (id) => setInsights(prev => prev.filter(i=>i.id!==id));
  const typeColors = { goal:"rgba(232,160,32,0.1)", preference:"rgba(92,138,106,0.1)", pattern:"rgba(155,138,224,0.1)", interest:"rgba(96,165,250,0.1)", style:"rgba(248,113,113,0.1)" };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <Eyebrow>Memory Engine</Eyebrow>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:600, color:G.parch }}>Memory & Insights</h1>
        <p style={{ fontSize:13, color:G.ash, marginTop:4 }}>What NEETI has learned about you across {CONVERSATIONS.length} conversations</p>
      </div>

      {/* Summary card */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {[
          { label:"Total Insights", value:insights.length, color:G.saffronLt },
          { label:"Explicit (you stated)", value:insights.filter(i=>i.explicit).length, color:G.sageLt },
          { label:"Avg Confidence", value:`${Math.round(insights.reduce((a,i)=>a+i.confidence,0)/insights.length)}%`, color:G.ashLt },
          { label:"Conversations Analyzed", value:CONVERSATIONS.length, color:G.parch },
        ].map((s,i) => (
          <Card key={i} style={{ padding:"14px 16px", textAlign:"center" }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:s.color, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:11, color:G.ash }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:20 }}>
        <div>
          <SectionHeader title="All Insights" />
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {insights.map(ins => (
              <div key={ins.id} style={{ background:G.surface2, border:`1px solid ${G.border}`, borderRadius:10, padding:"14px 16px", display:"flex", alignItems:"flex-start", gap:12, transition:"border-color 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(242,232,217,0.14)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=G.border}>
                <div style={{ width:36, height:36, borderRadius:10, background:typeColors[ins.type]||"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                  {ins.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:4 }}>
                    <div style={{ fontSize:13, color:G.parch, lineHeight:1.4, flex:1 }}>{ins.label}</div>
                    {ins.explicit && <span style={{ fontSize:10, padding:"2px 6px", borderRadius:4, background:"rgba(92,138,106,0.15)", color:G.sageLt, whiteSpace:"nowrap" }}>Explicit</span>}
                  </div>
                  <div style={{ fontSize:11, color:G.ash, marginBottom:6 }}>{ins.source}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:10, color:G.ash, textTransform:"capitalize", background:typeColors[ins.type], padding:"2px 7px", borderRadius:4 }}>{ins.type}</span>
                    <div style={{ flex:1, height:3, background:G.border, borderRadius:2 }}>
                      <div style={{ height:"100%", borderRadius:2, background: ins.confidence>=90 ? G.sageLt : ins.confidence>=70 ? G.saffron : G.ash, width:`${ins.confidence}%`, transition:"width 0.5s" }}/>
                    </div>
                    <span style={{ fontSize:11, color:G.ash, minWidth:28 }}>{ins.confidence}%</span>
                  </div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={()=>deleteInsight(ins.id)} style={{ width:28, height:28, borderRadius:6, background:"none", border:`1px solid ${G.border}`, color:G.ash, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Icon.Trash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What NEETI knows */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Card style={{ padding:16, background:"linear-gradient(135deg,rgba(232,160,32,0.07),#1E293B)", borderColor:G.borderWarm }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <div style={{ fontSize:20 }}>🧠</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:600, color:G.parch }}>NEETI knows you as…</div>
            </div>
            <div style={{ fontSize:13, color:G.ashLt, lineHeight:1.7 }}>
              A knowledge-driven leader who values ancient wisdom, prefers principle-based reasoning over tactical shortcuts, and is building a systematic approach to strategic decision-making under uncertainty.
            </div>
          </Card>

          <Card style={{ padding:16 }}>
            <div style={{ fontSize:13, fontWeight:500, color:G.parch, marginBottom:12 }}>Insight Types</div>
            {["goal","preference","pattern","interest","style"].map(t => {
              const count = insights.filter(i=>i.type===t).length;
              return (
                <div key={t} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0" }}>
                  <span style={{ fontSize:11, color:G.ash, textTransform:"capitalize", width:72 }}>{t}</span>
                  <div style={{ flex:1, height:4, background:G.border, borderRadius:2 }}>
                    <div style={{ height:"100%", borderRadius:2, background:G.saffron, width:`${(count/insights.length)*100}%` }}/>
                  </div>
                  <span style={{ fontSize:11, color:G.ash, minWidth:12 }}>{count}</span>
                </div>
              );
            })}
          </Card>

          <Card style={{ padding:16 }}>
            <div style={{ fontSize:13, fontWeight:500, color:G.parch, marginBottom:12 }}>Privacy Controls</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[["Auto-extract insights from conversations","on"],["Use memory to personalize responses","on"],["Share anonymized data for improvement","off"]].map(([label,state])=>(
                <div key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:12, color:G.ash, flex:1 }}>{label}</span>
                  <div style={{ width:36, height:20, borderRadius:10, background:state==="on"?G.sage:G.border, position:"relative", cursor:"pointer", flexShrink:0 }}>
                    <div style={{ width:16, height:16, borderRadius:"50%", background:G.parch, position:"absolute", top:2, left:state==="on"?18:2, transition:"left 0.2s" }}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE: SETTINGS
// ─────────────────────────────────────────────
function SettingsPage() {
  const [providers, setProviders] = useState(LLM_PROVIDERS);

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <Eyebrow>Configuration</Eyebrow>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:600, color:G.parch }}>Settings</h1>
        <p style={{ fontSize:13, color:G.ash, marginTop:4 }}>Manage AI providers, preferences, and platform configuration</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        {/* LLM Router */}
        <div>
          <SectionHeader title="AI Router" />
          <Card>
            <div style={{ marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${G.border}` }}>
              <div style={{ fontSize:13, color:G.parch, fontWeight:500, marginBottom:4 }}>Routing Strategy</div>
              <select style={{ width:"100%", padding:"9px 12px", background:G.inkSoft, border:`1px solid ${G.border}`, borderRadius:8, fontSize:13, color:G.parch, marginTop:4 }}>
                <option>Latency-first (fastest available)</option>
                <option>Quality-first (best for reasoning)</option>
                <option>Cost-optimized</option>
                <option>Local-only (Ollama)</option>
              </select>
            </div>
            {providers.map((p,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${G.border}` }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background: p.status==="active" ? G.sageLt : p.status==="standby" ? G.saffron : G.ash, flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:G.parch, fontWeight:500 }}>{p.name}</div>
                  <div style={{ fontSize:11, color:G.ash }}>{p.role}</div>
                </div>
                <span style={{ fontSize:12, color: p.ping<300 ? G.sageLt : p.ping<600 ? G.saffron : G.ash }}>{p.status!=="off" ? `${p.ping}ms` : "—"}</span>
                <div style={{ width:32, height:18, borderRadius:9, background:p.status!=="off"?G.sage:G.border, position:"relative", cursor:"pointer", flexShrink:0 }}
                  onClick={() => setProviders(prev => prev.map((pr,j) => j===i ? {...pr, status:pr.status==="off"?"standby":"off"} : pr))}>
                  <div style={{ width:14, height:14, borderRadius:"50%", background:G.parch, position:"absolute", top:2, left:p.status!=="off"?16:2, transition:"left 0.2s" }}/>
                </div>
              </div>
            ))}
          </Card>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Advisor preferences */}
          <div>
            <SectionHeader title="Advisor Style" />
            <Card>
              {[
                { label:"Response Style", options:["Direct","Socratic","Analytical","Narrative"] },
                { label:"Citation Density", options:["Minimal","Balanced","Full","Academic"] },
                { label:"Language", options:["English","Sanskrit+English","Devanagari","Bilingual"] },
              ].map((pref,i) => (
                <div key={i} style={{ marginBottom:i<2?14:0, paddingBottom:i<2?14:0, borderBottom:i<2?`1px solid ${G.border}`:"none" }}>
                  <div style={{ fontSize:12, color:G.ash, marginBottom:8 }}>{pref.label}</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {pref.options.map((o,oi) => (
                      <button key={o} style={{ padding:"5px 11px", borderRadius:6, fontSize:12, cursor:"pointer", border:"none",
                        background:oi===1?G.saffron:G.inkSoft, color:oi===1?G.ink:G.ash }}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Account */}
          <div>
            <SectionHeader title="Account" />
            <Card>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${G.border}` }}>
                <div style={{ width:48, height:48, borderRadius:"50%", background:"linear-gradient(135deg,#E8A020,#5C8A6A)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:600, color:G.ink }}>N</div>
                <div>
                  <div style={{ fontSize:14, color:G.parch, fontWeight:600 }}>Nemesis</div>
                  <div style={{ fontSize:12, color:G.ash }}>nemesis@neeti.ai</div>
                </div>
                <div style={{ marginLeft:"auto", padding:"4px 10px", background:"rgba(232,160,32,0.1)", border:`1px solid ${G.borderWarm}`, borderRadius:6, fontSize:11, color:G.saffronLt, fontWeight:600 }}>Strategist</div>
              </div>
              {[["Pack installs", "Unlimited"],["Conversations/month","500"],["Memory depth","90 days"],["LLM providers","All"]].map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", fontSize:12 }}>
                  <span style={{ color:G.ash }}>{k}</span>
                  <span style={{ color:G.parch, fontWeight:500 }}>{v}</span>
                </div>
              ))}
              <button style={{ width:"100%", marginTop:14, padding:"9px", background:"linear-gradient(135deg,rgba(232,160,32,0.15),rgba(232,160,32,0.05))", border:`1px solid ${G.borderWarm}`, borderRadius:8, color:G.saffronLt, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                Upgrade to Raja ✦
              </button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [installedPacks, setInstalledPacks] = useState(["chanakya","gita"]);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const navigate = (p) => setPage(p);

  const navItems = [
    { id:"dashboard", label:"Dashboard", Icon:Icon.Dashboard },
    { id:"advisor", label:"Advisor", Icon:Icon.Advisor, badge:3 },
    { id:"graph", label:"Graph Explorer", Icon:Icon.Graph },
    { id:"packs", label:"Knowledge Packs", Icon:Icon.Packs },
    { id:"sutras", label:"Sutra Browser", Icon:Icon.Sutras },
    { id:"memory", label:"Memory & Insights", Icon:Icon.Memory },
  ];

  const renderPage = () => {
    switch(page) {
      case "dashboard": return <Dashboard navigate={navigate} installedPacks={installedPacks} />;
      case "advisor": return <Advisor installedPacks={installedPacks} />;
      case "graph": return <GraphExplorer installedPacks={installedPacks} />;
      case "packs": return <PacksPage installedPacks={installedPacks} setInstalledPacks={setInstalledPacks} />;
      case "sutras": return <SutrasBrowser installedPacks={installedPacks} />;
      case "memory": return <MemoryPage />;
      case "settings": return <SettingsPage />;
      default: return <Dashboard navigate={navigate} installedPacks={installedPacks} />;
    }
  };

  const isAdvisor = page === "advisor";

  return (
    <div style={{ fontFamily:"Inter,sans-serif", background:G.ink, color:G.parch, minHeight:"100vh", position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600&family=Noto+Serif+Devanagari:wght@300;400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#0D1117;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(242,232,217,0.08);border-radius:3px;}
        select option{background:#1E293B;color:#F2E8D9;}
        @keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .page-enter{animation:fadeIn 0.25s ease forwards;}
      `}</style>

      {/* Background grid */}
      <div style={{ position:"fixed", inset:0, backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 31px,rgba(242,232,217,0.02) 31px,rgba(242,232,217,0.02) 32px),repeating-linear-gradient(90deg,transparent,transparent 79px,rgba(242,232,217,0.012) 79px,rgba(242,232,217,0.012) 80px)", pointerEvents:"none", zIndex:0 }}/>

      <div style={{ position:"relative", zIndex:1, display:"grid", gridTemplateColumns:"220px 1fr", gridTemplateRows:"52px 1fr", minHeight:"100vh" }}>

        {/* TOPBAR */}
        <header style={{ gridColumn:"1/-1", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", height:52, borderBottom:`1px solid ${G.border}`, background:"rgba(13,17,23,0.95)", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:100 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, letterSpacing:"0.1em", color:G.parch }}>NEETI</span>
            <span style={{ fontSize:11, fontWeight:500, letterSpacing:"0.2em", color:G.ash, textTransform:"uppercase" }}>Knowledge Intelligence</span>
          </div>
          <div style={{ flex:1, maxWidth:420, margin:"0 24px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:G.surface2, border:`1px solid ${searchFocused ? G.borderWarm : G.border}`, borderRadius:8, padding:"7px 12px", transition:"border-color 0.2s" }}>
              <Icon.Search />
              <input value={search} onChange={e=>setSearch(e.target.value)} onFocus={()=>setSearchFocused(true)} onBlur={()=>setSearchFocused(false)} placeholder="Search nodes, themes, sutras…" style={{ flex:1, background:"none", border:"none", outline:"none", fontFamily:"Inter,sans-serif", fontSize:13, color:G.parch }}/>
              <span style={{ fontSize:10, color:G.ash, background:"rgba(255,255,255,0.05)", border:`1px solid ${G.border}`, borderRadius:4, padding:"2px 5px" }}>⌘K</span>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, border:`1px solid ${G.border}`, background:G.surface2, color:G.ash, cursor:"pointer" }}><Icon.Bell /></div>
            <div onClick={()=>navigate("settings")} style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, border:`1px solid ${page==="settings"?G.borderWarm:G.border}`, background:G.surface2, color:page==="settings"?G.saffron:G.ash, cursor:"pointer" }}><Icon.Settings /></div>
            <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#E8A020,#5C8A6A)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:600, color:G.ink, cursor:"pointer" }}>N</div>
          </div>
        </header>

        {/* SIDEBAR */}
        <aside style={{ borderRight:`1px solid ${G.border}`, display:"flex", flexDirection:"column", background:"rgba(13,17,23,0.7)", position:"sticky", top:52, height:"calc(100vh - 52px)", overflowY:"auto" }}>
          <div style={{ padding:"16px 12px 8px" }}>
            <div style={{ fontSize:9, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:G.ash, padding:"0 8px 8px" }}>Workspace</div>
            {navItems.map(({ id, label, Icon:NavIcon, badge }) => (
              <div key={id} onClick={() => navigate(id)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, color: page===id ? G.saffron : G.ash, fontSize:13, fontWeight: page===id ? 500 : 400, cursor:"pointer", transition:"all 0.15s", marginBottom:2, background: page===id ? "rgba(232,160,32,0.09)" : "transparent", border:`1px solid ${page===id ? "rgba(232,160,32,0.2)" : "transparent"}`, position:"relative" }}>
                {page===id && <div style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:3, height:18, background:G.saffron, borderRadius:"0 2px 2px 0" }}/>}
                <NavIcon />
                {label}
                {badge && <span style={{ marginLeft:"auto", fontSize:10, fontWeight:600, background:G.saffron, color:G.ink, padding:"1px 6px", borderRadius:10 }}>{badge}</span>}
              </div>
            ))}
          </div>

          <div style={{ padding:"8px 12px 8px", borderTop:`1px solid ${G.border}`, marginTop:4 }}>
            <div style={{ fontSize:9, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:G.ash, padding:"8px 8px 8px" }}>Installed Packs</div>
            {PACKS.filter(p=>installedPacks.includes(p.id)).map(p => (
              <div key={p.id} onClick={()=>navigate("packs")} style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 8px", borderRadius:8, cursor:"pointer", transition:"background 0.15s", marginBottom:2 }}
                onMouseEnter={e=>e.currentTarget.style.background=G.surface2}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <PackOrb pack={p} size={26} />
                <div style={{ flex:1, overflow:"hidden" }}>
                  <div style={{ fontSize:12, color:G.parch, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.name}</div>
                  <div style={{ fontSize:10, color:G.ash }}>{p.nodes} nodes</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:"auto", padding:"12px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", background:"linear-gradient(135deg,rgba(232,160,32,0.1),rgba(232,160,32,0.03))", border:`1px solid ${G.borderWarm}`, borderRadius:10, cursor:"pointer" }} onClick={()=>navigate("settings")}>
              <span style={{ color:G.saffron }}>✦</span>
              <div>
                <div style={{ fontSize:10, color:G.ash }}>Current Plan</div>
                <div style={{ fontSize:13, fontWeight:600, color:G.saffronLt }}>Strategist</div>
              </div>
              <div style={{ marginLeft:"auto", color:G.ash }}><Icon.ChevronRight /></div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ overflowY: isAdvisor ? "hidden" : "auto", height: isAdvisor ? "calc(100vh - 52px)" : "auto", padding: isAdvisor ? 0 : "28px 32px" }} className="page-enter">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
