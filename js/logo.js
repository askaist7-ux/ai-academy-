// Interactive AI Academy logo: SVG is built and driven by script.
import { MARK_ACCENT, TEXT } from "./logo-data.js";

const NS = "http://www.w3.org/2000/svg";
const PALETTES = {
  blue:   { name: "블루 · 퍼플", a: "#43B6E6", b: "#7580E8", accent: "#45AEE7" },
  sunset: { name: "선셋",         a: "#FFB347", b: "#F0507A", accent: "#FF9A4D" },
  mint:   { name: "민트",         a: "#34D6B4", b: "#2F86E8", accent: "#2FC9C0" },
  mono:   { name: "모노",         a: "#9AA6C6", b: "#3A4570", accent: "#6C79A6" },
};
// x ranges of the letters "Ac" a d e m y (A and c interlock, so they move together)
const LETTERS = [
  { cx: 424, clip: "M270,0 H567 V250 H270 Z" },
  { cx: 621, clip: "M567,0 H680 V250 H567 Z" },
  { cx: 740, clip: "M680,0 H802 V250 H680 Z" },
  { cx: 863, clip: "M802,0 H922 V250 H802 Z" },
  { cx: 1000, clip: "M922,0 H1073 V250 H922 Z" },
  { cx: 1108, clip: "M1073,0 H1200 V250 H1073 Z" },
];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const el = (n, a = {}, p) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); p && p.appendChild(e); return e; };

export function initLogo(stage, ui = {}) {
  if (!stage) return;
  const st = { pal: "blue", dark: false, wave: true, plays: 0, nx: 0, ny: 0, angle: 90, px: 0, py: 0, hover: false };
  const svg = el("svg", { viewBox: "0 0 1200 250", role: "img", "aria-label": "AI Academy" });
  const defs = el("defs", {}, svg);
  const grad = el("linearGradient", { id: "lg-grad", gradientUnits: "objectBoundingBox", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  const s1 = el("stop", { offset: 0 }, grad), s2 = el("stop", { offset: 1 }, grad);
  el("clipPath", { id: "lg-m" }, defs).appendChild(el("rect", { x: 0, y: 0, width: 270, height: 250 }));
  el("clipPath", { id: "lg-y" }, defs).appendChild(el("rect", { x: 270, y: 0, width: 930, height: 250 }));
  LETTERS.forEach((l, i) => el("clipPath", { id: "lg-l" + i }, defs).appendChild(el("path", { d: l.clip })));

  const mark = el("g", { class: "lg-mark" }, svg);
  const markFill = el("path", { d: MARK_ACCENT, fill: "url(#lg-grad)", "clip-path": "url(#lg-m)" }, mark);
  const markStroke = el("path", { d: MARK_ACCENT, fill: "none", "stroke-width": 2.2, "clip-path": "url(#lg-m)", pathLength: 1, class: "lg-stroke", opacity: 0 }, mark);
  const accent = el("path", { d: MARK_ACCENT, "clip-path": "url(#lg-y)" }, svg);
  const letters = LETTERS.map((l, i) => {
    const outer = el("g", { "clip-path": `url(#lg-l${i})` }, svg);
    const g = el("g", {}, outer);
    const p = el("path", { d: TEXT, class: "lg-text" }, g);
    return { g, p, cx: l.cx, y: 0 };
  });
  stage.textContent = ""; stage.appendChild(svg);

  function paint() {
    const P = PALETTES[st.pal];
    s1.setAttribute("stop-color", P.a); s2.setAttribute("stop-color", P.b);
    accent.setAttribute("fill", P.accent); markStroke.setAttribute("stroke", P.a);
    const t = st.dark ? "#fff" : "#0F172A";
    letters.forEach((l) => l.p.setAttribute("fill", t));
    stage.dataset.tone = st.dark ? "dark" : "light";
  }

  function play() {
    st.plays++; report();
    if (reduce) return;
    markFill.animate([{ opacity: 0 }, { opacity: 0, offset: .55 }, { opacity: 1 }], { duration: 1500, easing: "ease-out", fill: "backwards" });
    markStroke.animate([{ strokeDasharray: "1 1", strokeDashoffset: 1, opacity: 1 }, { strokeDashoffset: 0, opacity: 1, offset: .6 }, { strokeDashoffset: 0, opacity: 0 }], { duration: 1500, easing: "ease-in-out", fill: "backwards" });
    letters.forEach((l, i) => l.g.animate([{ transform: "translateY(46px)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }], { duration: 700, delay: 500 + i * 90, easing: "cubic-bezier(.2,.9,.25,1.2)", fill: "backwards" }));
    accent.animate([{ opacity: 0, transform: "translate(-14px,14px)" }, { opacity: 1, transform: "none" }], { duration: 600, delay: 500 + 7 * 90, easing: "ease-out", fill: "backwards" });
  }

  function report() {
    const set = (k, v) => ui[k] && (ui[k].textContent = v);
    set("x", st.px.toFixed(0)); set("y", st.py.toFixed(0));
    set("angle", Math.round(st.angle) + "°"); set("palette", PALETTES[st.pal].name);
    set("mode", st.dark ? "다크" : "라이트"); set("wave", st.wave ? "ON" : "OFF"); set("plays", st.plays + "회");
  }

  // pointer → parallax on mark, gradient angle, letter wave
  stage.addEventListener("pointermove", (e) => {
    const r = svg.getBoundingClientRect();
    st.px = ((e.clientX - r.left) / r.width) * 1200; st.py = ((e.clientY - r.top) / r.height) * 250;
    st.nx = Math.max(-1, Math.min(1, (st.px - 600) / 600)); st.ny = Math.max(-1, Math.min(1, (st.py - 125) / 125));
    st.hover = true;
  });
  stage.addEventListener("pointerleave", () => { st.hover = false; st.nx = st.ny = 0; });
  stage.addEventListener("click", () => { ripple(); play(); });

  function ripple() {
    if (reduce) return;
    letters.forEach((l, i) => l.g.animate([{ transform: "translateY(0)" }, { transform: "translateY(-26px)" }, { transform: "translateY(0)" }], { duration: 520, delay: i * 55, easing: "ease-in-out" }));
  }

  let t0 = performance.now(), curA = 90, mx = 0, my = 0, last = 0;
  function frame(now) {
    const t = (now - t0) / 1000;
    const tgtA = st.hover ? 90 + st.nx * 70 + st.ny * 20 : 90 + Math.sin(t * .6) * 25;
    curA += (tgtA - curA) * .08; mx += (st.nx - mx) * .1; my += (st.ny - my) * .1;
    st.angle = curA;
    const rad = (curA * Math.PI) / 180;
    grad.setAttribute("x1", .5 - Math.cos(rad) * .5); grad.setAttribute("y1", .5 - Math.sin(rad) * .5);
    grad.setAttribute("x2", .5 + Math.cos(rad) * .5); grad.setAttribute("y2", .5 + Math.sin(rad) * .5);
    mark.style.transform = `translate(${mx * 14}px, ${my * 8}px) rotate(${mx * 2.5}deg)`;
    mark.style.transformOrigin = "130px 85px";
    letters.forEach((l, i) => {
      let target = 0;
      if (st.wave) {
        if (st.hover) target = -26 * Math.exp(-(((st.px - l.cx) / 130) ** 2));
        else target = Math.sin(t * 1.6 - i * .7) * 5;
      }
      l.y += (target - l.y) * .16;
      l.p.style.transform = `translateY(${l.y.toFixed(2)}px)`;
    });
    if (now - last > 90) { last = now; report(); }
    if (!reduce) requestAnimationFrame(frame);
  }

  // controls
  ui.palettes?.forEach((b) => b.addEventListener("click", () => { st.pal = b.dataset.pal; ui.palettes.forEach((x) => x.setAttribute("aria-pressed", x === b)); paint(); report(); }));
  ui.replay?.addEventListener("click", play);
  ui.theme?.addEventListener("click", () => { st.dark = !st.dark; ui.theme.setAttribute("aria-pressed", st.dark); paint(); report(); });
  ui.waveBtn?.addEventListener("click", () => { st.wave = !st.wave; ui.waveBtn.setAttribute("aria-pressed", st.wave); report(); });

  paint(); report();
  const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { play(); io.disconnect(); } }, { threshold: .35 });
  io.observe(stage);
  requestAnimationFrame(frame);
}
