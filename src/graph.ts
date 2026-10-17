// The hero graph: every Hermes Agent contribution as a path from the original
// pull request (left, ordered by pr number) into main (joining at its merge date).
import data from "./data/hermes.json";

type Kind = "authored" | "co-authored";
interface PathData {
  original: number;
  via: number;
  kind: Kind;
  direct: boolean;
  title: string;
  date: string;
  url: string;
}
interface Laid {
  p: PathData;
  pts: Float32Array; // x,y pairs along the curve
  ox: number;
  oy: number;
  jx: number;
}

const SAMPLES = 64;
const INK = "21, 20, 27";
const BLUE = "#1d14e0";
const MONO = '11px "Geist Mono", ui-monospace, monospace';

const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00Z")
    .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .toLowerCase()
    .replace("sept", "sep");

export function initGraph(motion: () => boolean) {
  const stage = document.querySelector<HTMLDivElement>(".graph-stage");
  const canvas = document.getElementById("graph-canvas") as HTMLCanvasElement | null;
  const tip = document.getElementById("graph-tip") as HTMLDivElement | null;
  const list = document.getElementById("graph-list") as HTMLOListElement | null;
  if (!stage || !canvas || !tip || !list) return { setMotion() {} };
  const ctx = canvas.getContext("2d")!;

  const paths = (data.paths as PathData[]).slice().sort((a, b) => a.original - b.original);
  const t0 = Math.min(...paths.map((p) => Date.parse(p.date)));
  const t1 = Math.max(...paths.map((p) => Date.parse(p.date)));

  let W = 0;
  let H = 0;
  let mainY = 0;
  let mainX0 = 0;
  let mainX1 = 0;
  let laid: Laid[] = [];
  let hover = -1;
  let focusMode = false;
  let progress: number[] = paths.map(() => 1);
  let pulses: { i: number; start: number }[] = [];
  let raf = 0;
  let visible = true;
  let introStart = 0;
  let lastPulse = 0;

  // ------------------------------------------------------------ layout
  function layout() {
    const r = stage!.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas!.width = Math.round(W * dpr);
    canvas!.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const narrow = W < 520;
    const padL = 6;
    const padR = narrow ? 38 : 46;
    const top = 10;
    const bottom = narrow ? 30 : 34;
    mainY = top + (H - top - bottom) * 0.44;
    mainX1 = W - padR;
    const joinStart = padL + W * (narrow ? 0.46 : 0.42);
    mainX0 = joinStart - W * 0.05;
    const n = paths.length;
    const step = (H - top - bottom) / (n - 1);

    laid = paths.map((p, i) => {
      const ox = padL + (i % 3) * (narrow ? 7 : 10);
      const oy = top + i * step;
      const t = (Date.parse(p.date) - t0) / Math.max(1, t1 - t0);
      const jx = joinStart + t * (mainX1 - 18 - joinStart);
      const c1x = ox + (jx - ox) * 0.52;
      const c2x = jx - (jx - ox) * 0.3;
      const pts = new Float32Array(SAMPLES * 2);
      for (let k = 0; k < SAMPLES; k++) {
        const s = k / (SAMPLES - 1);
        const u = 1 - s;
        pts[k * 2] = u * u * u * ox + 3 * u * u * s * c1x + 3 * u * s * s * c2x + s * s * s * jx;
        pts[k * 2 + 1] = u * u * u * oy + 3 * u * u * s * oy + 3 * u * s * s * mainY + s * s * s * mainY;
      }
      return { p, pts, ox, oy, jx };
    });
  }

  // ------------------------------------------------------------ drawing
  function strokePath(l: Laid, upTo: number) {
    const last = Math.max(1, Math.floor(upTo * (SAMPLES - 1)));
    ctx.beginPath();
    ctx.moveTo(l.pts[0], l.pts[1]);
    for (let k = 1; k <= last; k++) ctx.lineTo(l.pts[k * 2], l.pts[k * 2 + 1]);
    ctx.stroke();
  }

  function draw(now = performance.now()) {
    ctx.clearRect(0, 0, W, H);

    // date axis
    ctx.font = MONO;
    ctx.fillStyle = `rgba(${INK}, 0.55)`;
    ctx.strokeStyle = `rgba(${INK}, 0.12)`;
    ctx.lineWidth = 1;
    const axisY = H - 12;
    const ticks = W < 520 ? [t0, t1] : [t0, t0 + (t1 - t0) / 2, t1];
    ctx.textAlign = "center";
    ticks.forEach((t, idx) => {
      const x = laid.length
        ? mainX0 + W * 0.05 + ((t - t0) / Math.max(1, t1 - t0)) * (mainX1 - 18 - (mainX0 + W * 0.05))
        : 0;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(x, mainY + 8);
      ctx.lineTo(x, axisY - 12);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = idx === 0 ? "left" : idx === ticks.length - 1 ? "right" : "center";
      ctx.fillText(fmtDate(new Date(t).toISOString().slice(0, 10)).replace(/ \d{4}$/, ""), x, axisY);
    });

    // main
    ctx.strokeStyle = `rgba(${INK}, 0.9)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mainX0, mainY);
    ctx.lineTo(mainX1, mainY);
    ctx.stroke();
    ctx.fillStyle = `rgb(${INK})`;
    ctx.beginPath();
    ctx.arc(mainX1, mainY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = "right";
    ctx.fillText("main", mainX1 + 2, mainY - 12);

    const dim = hover >= 0;
    laid.forEach((l, i) => {
      if (i === hover) return;
      const pr = progress[i];
      if (pr <= 0) return;
      const direct = l.p.direct;
      const co = l.p.kind === "co-authored";
      ctx.setLineDash(co ? [3, 3] : []);
      ctx.lineWidth = direct ? 1.8 : 1;
      ctx.strokeStyle = direct ? BLUE : `rgba(${INK}, ${co ? 0.5 : 0.72})`;
      ctx.globalAlpha = dim ? 0.16 : 1;
      strokePath(l, pr);
      ctx.setLineDash([]);
      ctx.fillStyle = direct ? BLUE : `rgb(${INK})`;
      ctx.beginPath();
      ctx.arc(l.ox, l.oy, direct ? 3.6 : 2.2, 0, Math.PI * 2);
      ctx.fill();
      if (pr >= 1) {
        ctx.beginPath();
        ctx.arc(l.jx, mainY, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });

    // pulses: a commit travelling into main
    pulses = pulses.filter((pu) => now - pu.start < 1500);
    pulses.forEach((pu) => {
      const l = laid[pu.i];
      if (!l) return;
      const s = Math.min(1, (now - pu.start) / 1400);
      const e = 1 - Math.pow(1 - s, 3);
      const k = Math.min(SAMPLES - 1, Math.floor(e * (SAMPLES - 1)));
      ctx.fillStyle = BLUE;
      ctx.globalAlpha = s < 0.85 ? 1 : (1 - s) / 0.15;
      ctx.beginPath();
      ctx.arc(l.pts[k * 2], l.pts[k * 2 + 1], 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // hovered path on top
    if (hover >= 0 && laid[hover]) {
      const l = laid[hover];
      ctx.setLineDash(l.p.kind === "co-authored" ? [4, 3] : []);
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 2.2;
      strokePath(l, 1);
      ctx.setLineDash([]);
      ctx.fillStyle = BLUE;
      ctx.beginPath();
      ctx.arc(l.ox, l.oy, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(l.jx, mainY, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = MONO;
      ctx.textAlign = "left";
      ctx.fillText(`#${l.p.original}`, l.ox + 10, l.oy + 4);
    }
  }

  // ------------------------------------------------------------ loop
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  function tick(now: number) {
    raf = 0;
    let animating = false;
    if (introStart) {
      const el = now - introStart;
      progress = paths.map((_, i) => {
        const t = Math.min(1, Math.max(0, (el - i * 38) / 1100));
        if (t < 1) animating = true;
        return ease(t);
      });
      if (!animating) introStart = 0;
    }
    if (motion() && visible && !introStart && now - lastPulse > 1700 && hover < 0) {
      lastPulse = now;
      pulses.push({ i: Math.floor(Math.random() * paths.length), start: now });
    }
    draw(now);
    if (pulses.length) animating = true;
    if ((animating || (motion() && visible)) && !document.hidden) raf = requestAnimationFrame(tick);
  }
  function kick() {
    if (!raf) raf = requestAnimationFrame(tick);
  }

  // ------------------------------------------------------------ tooltip
  function showTip(i: number, x: number, y: number, touch = false) {
    const l = laid[i];
    if (!l) return;
    const p = l.p;
    const ref = p.direct ? `#${p.via} · merged directly` : `#${p.original} → #${p.via}`;
    const kind = p.direct ? "authored · merged directly" : p.kind;
    tip!.innerHTML = `<span class="tip-ref">${ref}</span><strong>${p.title}</strong><span class="tip-meta">${kind} · merged ${fmtDate(p.date)}</span><a class="tip-open" href="${p.url}" target="_blank" rel="noopener" tabindex="-1">open pull request ↗</a>`;
    tip!.hidden = false;
    tip!.dataset.touch = String(touch);
    const tw = tip!.offsetWidth;
    const th = tip!.offsetHeight;
    let left = x;
    let top = y;
    if (left + 14 + tw > W) left = x - tw - 28;
    top = Math.min(Math.max(top, th / 2 + 4), H - th / 2 - 4);
    tip!.style.left = `${Math.max(0, left)}px`;
    tip!.style.top = `${top}px`;
  }
  function hideTip() {
    tip!.hidden = true;
    tip!.dataset.focus = "false";
  }

  function nearest(x: number, y: number, radius: number) {
    let best = -1;
    let bestD = radius * radius;
    laid.forEach((l, i) => {
      for (let k = 0; k < SAMPLES; k += 2) {
        const dx = l.pts[k * 2] - x;
        const dy = l.pts[k * 2 + 1] - y;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
    });
    return best;
  }

  function setHover(i: number) {
    if (i === hover) return;
    hover = i;
    canvas!.style.cursor = i >= 0 ? "pointer" : "default";
    draw();
  }

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch" || focusMode) return;
    const r = canvas!.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const i = nearest(x, y, 12);
    setHover(i);
    if (i >= 0) showTip(i, x, y);
    else hideTip();
  });
  canvas.addEventListener("pointerleave", () => {
    if (focusMode) return;
    setHover(-1);
    hideTip();
  });
  canvas.addEventListener("click", (e) => {
    const r = canvas!.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const touch = (e as PointerEvent).pointerType === "touch";
    const i = nearest(x, y, touch ? 22 : 12);
    if (touch) {
      // first tap previews, the link in the card opens the pr
      setHover(i);
      if (i >= 0) showTip(i, Math.min(x, W - 40), y, true);
      else hideTip();
      return;
    }
    if (i >= 0) window.open(laid[i].p.url, "_blank", "noopener");
  });

  // keyboard: an ordered list of real links drives the same highlight
  list.innerHTML = paths
    .map(
      (p, i) =>
        `<li><a href="${p.url}" target="_blank" rel="noopener" data-i="${i}">#${p.original}${p.direct ? " merged directly" : ` landed via #${p.via}`}: ${p.title} (${p.kind}, ${fmtDate(p.date)})</a></li>`,
    )
    .join("");
  list.addEventListener("focusin", (e) => {
    const a = (e.target as HTMLElement).closest("a");
    if (!a) return;
    const i = Number(a.dataset.i);
    focusMode = true;
    setHover(i);
    const l = laid[i];
    showTip(i, l.ox + 8, l.oy);
    tip!.dataset.focus = "true";
  });
  list.addEventListener("focusout", () => {
    focusMode = false;
    setHover(-1);
    hideTip();
  });

  // ------------------------------------------------------------ lifecycle
  const ro = new ResizeObserver(() => {
    layout();
    draw();
  });
  ro.observe(stage);
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible) kick();
  }).observe(stage);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) kick();
  });

  layout();
  const start = () => {
    if (motion()) {
      progress = paths.map(() => 0);
      introStart = performance.now() + 250;
      kick();
    } else {
      draw();
    }
  };
  // wait for the mono face so canvas labels use it
  (document.fonts?.ready ?? Promise.resolve()).then(start);

  return {
    setMotion(on: boolean) {
      pulses = [];
      if (on) kick();
      else {
        introStart = 0;
        progress = paths.map(() => 1);
        cancelAnimationFrame(raf);
        raf = 0;
        draw();
      }
    },
  };
}
